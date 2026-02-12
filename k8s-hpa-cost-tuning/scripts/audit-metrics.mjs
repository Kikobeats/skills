#!/usr/bin/env node

import fs from 'fs/promises'

const HELP = `
Gather Datadog metrics to discover Kubernetes cost-saving opportunities.

Usage:
  node scripts/audit-metrics.mjs --cluster <name> [options]

Options:
  --cluster <name>         Kubernetes cluster name (required)
  --namespace <name>       Kubernetes namespace (default: default)
  --deployment <name>      Deployment to deep-dive (omit for cluster-only)
  --hpa <name>             HPA name (default: <deployment>)
  --from <iso>             Window start time (ISO-8601)
  --to <iso>               Window end time (ISO-8601, default: now)
  --window <duration>      Lookback from --to (default: 24h)
                           Supported suffixes: m, h, d
  --site <domain>          Datadog site (default: $DD_SITE or datadoghq.com)
  --out <path>             Write full JSON output to file
  --pretty                 Pretty-print JSON output
  --help                   Show this help

Environment:
  DD_API_KEY               Datadog API key (required)
  DD_APP_KEY               Datadog application key (required)
  DD_SITE                  Datadog site, e.g. datadoghq.com, datadoghq.eu

Examples:
  # Cluster-wide cost audit (last 24h)
  node scripts/audit-metrics.mjs --cluster microlink

  # Include deployment deep-dive
  node scripts/audit-metrics.mjs \\
    --cluster microlink \\
    --namespace default \\
    --deployment microlink-api

  # One-week audit with JSON output
  node scripts/audit-metrics.mjs --cluster microlink --window 7d --out /tmp/audit.json
`.trim()

/* ------------------------------------------------------------------ */
/*  Argument parsing                                                   */
/* ------------------------------------------------------------------ */

function parseArgs (argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const [rawKey, inlineValue] = token.slice(2).split('=')
    const key = rawKey.trim()
    if (!key) continue
    if (inlineValue !== undefined) {
      out[key] = inlineValue
      continue
    }
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      out[key] = true
      continue
    }
    out[key] = next
    i++
  }
  return out
}

function parseWindowMs (input) {
  const match = /^(\d+)([mhd])$/.exec(String(input || '').trim())
  if (!match) return null
  const value = Number(match[1])
  const unit = match[2]
  if (unit === 'm') return value * 60_000
  if (unit === 'h') return value * 3_600_000
  if (unit === 'd') return value * 86_400_000
  return null
}

function parseTimeRange ({ from, to, window }) {
  const end = to ? new Date(to) : new Date()
  if (Number.isNaN(end.getTime())) throw new Error(`Invalid --to value: ${to}`)

  if (from) {
    const start = new Date(from)
    if (Number.isNaN(start.getTime())) throw new Error(`Invalid --from value: ${from}`)
    if (start >= end) throw new Error('--from must be before --to')
    return { start, end }
  }

  const windowMs = parseWindowMs(window || '24h')
  if (!windowMs) throw new Error(`Invalid --window value: ${window}`)
  const start = new Date(end.getTime() - windowMs)
  return { start, end }
}

/* ------------------------------------------------------------------ */
/*  Series helpers                                                     */
/* ------------------------------------------------------------------ */

function aggregateSeriesByTimestamp (series = []) {
  const points = new Map()
  for (const item of series) {
    const pointlist = item?.pointlist || []
    for (const point of pointlist) {
      const [ts, value] = point
      if (value == null) continue
      points.set(ts, (points.get(ts) || 0) + Number(value))
    }
  }
  return points
}

function mapToSortedEntries (map) {
  return [...map.entries()].sort((a, b) => a[0] - b[0])
}

function ratioSeries (numeratorMap, denominatorMap, multiplier = 1) {
  const output = new Map()
  for (const [ts, numerator] of numeratorMap.entries()) {
    const denominator = denominatorMap.get(ts)
    if (denominator == null || denominator === 0) continue
    output.set(ts, (numerator / denominator) * multiplier)
  }
  return output
}

function diffSeries (aMap, bMap) {
  const output = new Map()
  for (const [ts, aVal] of aMap.entries()) {
    const bVal = bMap.get(ts)
    if (bVal == null) continue
    output.set(ts, aVal - bVal)
  }
  return output
}

function statsFromMap (map) {
  const values = mapToSortedEntries(map).map(([, v]) => v).filter(Number.isFinite)
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return {
    samples: values.length,
    min: Math.min(...values),
    avg: sum / values.length,
    max: Math.max(...values),
    last: values[values.length - 1]
  }
}

function formatNumber (value, decimals = 2) {
  if (!Number.isFinite(value)) return 'n/a'
  return Number(value).toFixed(decimals)
}

/* ------------------------------------------------------------------ */
/*  Datadog client                                                     */
/* ------------------------------------------------------------------ */

async function datadogQuery ({ site, apiKey, appKey, from, to, query }) {
  const params = new URLSearchParams({
    from: String(Math.floor(from.getTime() / 1000)),
    to: String(Math.floor(to.getTime() / 1000)),
    query
  })
  const url = `https://api.${site}/api/v1/query?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      'DD-API-KEY': apiKey,
      'DD-APPLICATION-KEY': appKey
    }
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Datadog query failed (${res.status}) for "${query}": ${body}`)
  }

  const payload = await res.json()
  return aggregateSeriesByTimestamp(payload?.series || [])
}

/* ------------------------------------------------------------------ */
/*  Recommendations                                                    */
/* ------------------------------------------------------------------ */

function printRecommendations (summary) {
  const cpuWaste = summary.metrics.cluster_cpu_waste_pct
  const memWaste = summary.metrics.cluster_mem_waste_pct
  const deployCpu = summary.metrics.deployment_cpu_used_vs_requests_pct
  const deployMem = summary.metrics.deployment_mem_used_vs_requests_pct
  const hpaCurrent = summary.metrics.hpa_current_replicas

  console.log('')
  console.log('savings_opportunities:')
  let step = 1

  if (cpuWaste?.avg > 30) {
    console.log(`  ${step}) Cluster CPU waste averages ${formatNumber(cpuWaste.avg)}%. Reduce CPU requests across workloads.`)
    step++
  } else if (cpuWaste?.avg > 15) {
    console.log(`  ${step}) Moderate CPU waste (avg ${formatNumber(cpuWaste.avg)}%). Review top CPU-requesting deployments.`)
    step++
  }

  if (memWaste?.avg > 25) {
    console.log(`  ${step}) Cluster memory waste averages ${formatNumber(memWaste.avg)}%. Reduce memory requests (watch for OOMKills).`)
    step++
  }

  if (deployCpu && deployCpu.avg < 50) {
    console.log(`  ${step}) Deployment CPU usage averages ${formatNumber(deployCpu.avg)}% of requests. CPU requests can be reduced.`)
    step++
  }

  if (deployMem && deployMem.avg < 50) {
    console.log(`  ${step}) Deployment memory usage averages ${formatNumber(deployMem.avg)}% of requests. Consider lowering memory requests.`)
    step++
  }

  if (hpaCurrent) {
    const range = hpaCurrent.max - hpaCurrent.min
    if (range === 0) {
      console.log(`  ${step}) HPA replicas constant at ${formatNumber(hpaCurrent.avg, 0)}. Consider reducing minReplicas if load permits.`)
      step++
    }
  }

  if (step === 1) {
    console.log('  No obvious savings detected. Cluster appears well-tuned for this window.')
  }

  console.log('')
  console.log('note: validate changes with the skill validation loop before applying broadly.')
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main () {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log(HELP)
    return
  }

  const apiKey = process.env.DD_API_KEY
  const appKey = process.env.DD_APP_KEY
  if (!apiKey || !appKey) {
    throw new Error('Missing DD_API_KEY or DD_APP_KEY environment variables.')
  }

  const cluster = args.cluster
  if (!cluster || typeof cluster !== 'string') {
    throw new Error('Missing required --cluster argument.')
  }

  const namespace = args.namespace || 'default'
  const deployment = args.deployment || null
  const hpa = args.hpa || deployment
  const site = args.site || process.env.DD_SITE || 'datadoghq.com'

  const { start, end } = parseTimeRange({
    from: args.from,
    to: args.to,
    window: args.window
  })

  const scopeCluster = `kube_cluster_name:${cluster}`

  // Cluster-wide queries
  const queries = {
    cluster_cpu_usage_nano: `sum:kubernetes.cpu.usage.total{${scopeCluster}}.rollup(avg,300)`,
    cluster_cpu_allocatable_cores: `sum:kubernetes_state.node.cpu_allocatable.total{${scopeCluster}}`,
    cluster_cpu_requests_cores: `sum:kubernetes.cpu.requests{${scopeCluster}}`,
    cluster_mem_usage_bytes: `sum:kubernetes.memory.usage{${scopeCluster}}`,
    cluster_mem_allocatable_bytes: `sum:kubernetes_state.node.memory_allocatable{${scopeCluster}}`,
    cluster_mem_requests_bytes: `sum:kubernetes.memory.requests{${scopeCluster}}`,
    cluster_node_count: `sum:kubernetes_state.node.count{${scopeCluster}}`
  }

  // Deployment deep-dive queries (optional)
  if (deployment) {
    const scopeDeploy = `${scopeCluster},kube_namespace:${namespace},kube_deployment:${deployment}`
    const scopeHpa = `${scopeCluster},kube_namespace:${namespace},horizontalpodautoscaler:${hpa}`
    Object.assign(queries, {
      deployment_cpu_usage_nano: `sum:kubernetes.cpu.usage.total{${scopeDeploy}}.rollup(avg,300)`,
      deployment_cpu_requests_cores: `sum:kubernetes.cpu.requests{${scopeDeploy}}`,
      deployment_mem_usage_bytes: `sum:kubernetes.memory.usage{${scopeDeploy}}`,
      deployment_mem_requests_bytes: `sum:kubernetes.memory.requests{${scopeDeploy}}`,
      hpa_current_replicas: `max:kubernetes_state.hpa.current_replicas{${scopeHpa}}`,
      hpa_desired_replicas: `max:kubernetes_state.hpa.desired_replicas{${scopeHpa}}`,
      hpa_max_replicas: `max:kubernetes_state.hpa.max_replicas{${scopeHpa}}`,
      hpa_min_replicas: `min:kubernetes_state.hpa.min_replicas{${scopeHpa}}`
    })
  }

  const entries = await Promise.all(
    Object.entries(queries).map(async ([name, query]) => {
      const map = await datadogQuery({ site, apiKey, appKey, from: start, to: end, query })
      return [name, { query, points: map }]
    })
  )
  const raw = Object.fromEntries(entries)

  // Derived: cluster CPU
  const clusterCpuUsageCores = new Map(
    mapToSortedEntries(raw.cluster_cpu_usage_nano.points).map(([ts, v]) => [ts, v / 1e9])
  )
  const clusterCpuUsedPct = ratioSeries(clusterCpuUsageCores, raw.cluster_cpu_allocatable_cores.points, 100)
  const clusterCpuRequestedPct = ratioSeries(raw.cluster_cpu_requests_cores.points, raw.cluster_cpu_allocatable_cores.points, 100)
  const clusterCpuWastePct = diffSeries(clusterCpuRequestedPct, clusterCpuUsedPct)

  // Derived: cluster memory
  const clusterMemUsedPct = ratioSeries(raw.cluster_mem_usage_bytes.points, raw.cluster_mem_allocatable_bytes.points, 100)
  const clusterMemRequestedPct = ratioSeries(raw.cluster_mem_requests_bytes.points, raw.cluster_mem_allocatable_bytes.points, 100)
  const clusterMemWastePct = diffSeries(clusterMemRequestedPct, clusterMemUsedPct)

  const derived = {
    cluster_cpu_used_pct: clusterCpuUsedPct,
    cluster_cpu_requested_pct: clusterCpuRequestedPct,
    cluster_cpu_waste_pct: clusterCpuWastePct,
    cluster_mem_used_pct: clusterMemUsedPct,
    cluster_mem_requested_pct: clusterMemRequestedPct,
    cluster_mem_waste_pct: clusterMemWastePct
  }

  // Derived: deployment (optional)
  if (deployment) {
    const deploymentCpuUsageCores = new Map(
      mapToSortedEntries(raw.deployment_cpu_usage_nano.points).map(([ts, v]) => [ts, v / 1e9])
    )
    derived.deployment_cpu_used_vs_requests_pct = ratioSeries(
      deploymentCpuUsageCores, raw.deployment_cpu_requests_cores.points, 100
    )
    derived.deployment_mem_used_vs_requests_pct = ratioSeries(
      raw.deployment_mem_usage_bytes.points, raw.deployment_mem_requests_bytes.points, 100
    )
  }

  const summary = {
    window: {
      from: start.toISOString(),
      to: end.toISOString(),
      hours: Number(((end.getTime() - start.getTime()) / 3_600_000).toFixed(2))
    },
    scope: { cluster, namespace, ...(deployment ? { deployment, hpa } : {}), site },
    metrics: {
      cluster_cpu_used_pct: statsFromMap(derived.cluster_cpu_used_pct),
      cluster_cpu_requested_pct: statsFromMap(derived.cluster_cpu_requested_pct),
      cluster_cpu_waste_pct: statsFromMap(derived.cluster_cpu_waste_pct),
      cluster_mem_used_pct: statsFromMap(derived.cluster_mem_used_pct),
      cluster_mem_requested_pct: statsFromMap(derived.cluster_mem_requested_pct),
      cluster_mem_waste_pct: statsFromMap(derived.cluster_mem_waste_pct),
      cluster_node_count: statsFromMap(raw.cluster_node_count.points),
      ...(deployment
        ? {
            deployment_cpu_used_vs_requests_pct: statsFromMap(derived.deployment_cpu_used_vs_requests_pct),
            deployment_mem_used_vs_requests_pct: statsFromMap(derived.deployment_mem_used_vs_requests_pct),
            hpa_current_replicas: statsFromMap(raw.hpa_current_replicas.points),
            hpa_desired_replicas: statsFromMap(raw.hpa_desired_replicas.points),
            hpa_max_replicas: statsFromMap(raw.hpa_max_replicas.points),
            hpa_min_replicas: statsFromMap(raw.hpa_min_replicas.points)
          }
        : {})
    }
  }

  // --- Print ---
  console.log(`Cost audit (${summary.window.from} -> ${summary.window.to}, ${summary.window.hours}h)`)
  const scopeStr = deployment
    ? `cluster=${cluster} namespace=${namespace} deployment=${deployment} hpa=${hpa}`
    : `cluster=${cluster}`
  console.log(`scope: ${scopeStr}`)
  console.log('')

  const printLine = (name, stats, unit = '') => {
    if (!stats) {
      console.log(`${name}: n/a`)
      return
    }
    console.log(
      `${name}: avg=${formatNumber(stats.avg)}${unit} max=${formatNumber(stats.max)}${unit} last=${formatNumber(stats.last)}${unit} samples=${stats.samples}`
    )
  }

  printLine('cluster_cpu_used_pct', summary.metrics.cluster_cpu_used_pct, '%')
  printLine('cluster_cpu_requested_pct', summary.metrics.cluster_cpu_requested_pct, '%')
  printLine('cluster_cpu_waste_pct', summary.metrics.cluster_cpu_waste_pct, '%')
  console.log('')
  printLine('cluster_mem_used_pct', summary.metrics.cluster_mem_used_pct, '%')
  printLine('cluster_mem_requested_pct', summary.metrics.cluster_mem_requested_pct, '%')
  printLine('cluster_mem_waste_pct', summary.metrics.cluster_mem_waste_pct, '%')
  console.log('')
  printLine('cluster_node_count', summary.metrics.cluster_node_count)

  if (deployment) {
    console.log('')
    printLine('deployment_cpu_used_vs_requests_pct', summary.metrics.deployment_cpu_used_vs_requests_pct, '%')
    printLine('deployment_mem_used_vs_requests_pct', summary.metrics.deployment_mem_used_vs_requests_pct, '%')
    printLine('hpa_current_replicas', summary.metrics.hpa_current_replicas)
    printLine('hpa_desired_replicas', summary.metrics.hpa_desired_replicas)
    printLine('hpa_min_replicas', summary.metrics.hpa_min_replicas)
    printLine('hpa_max_replicas', summary.metrics.hpa_max_replicas)
  }

  printRecommendations(summary)

  const output = {
    ...summary,
    queries,
    raw: Object.fromEntries(
      Object.entries(raw).map(([name, value]) => [
        name,
        {
          query: value.query,
          points: mapToSortedEntries(value.points).map(([ts, val]) => [new Date(ts).toISOString(), val])
        }
      ])
    ),
    derived: Object.fromEntries(
      Object.entries(derived).map(([name, value]) => [
        name,
        mapToSortedEntries(value).map(([ts, val]) => [new Date(ts).toISOString(), val])
      ])
    )
  }

  if (args.out) {
    await fs.writeFile(args.out, JSON.stringify(output, null, args.pretty ? 2 : 0))
    console.log(`\nSaved detailed output to ${args.out}`)
  }
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
