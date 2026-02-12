#!/usr/bin/env node

import fs from 'fs/promises'

const HELP = `
Collect incident metrics from Datadog for a time window.

Usage:
  node bin/incident-metrics.mjs --cluster <name> [options]

Options:
  --cluster <name>         Kubernetes cluster name (required)
  --namespace <name>       Kubernetes namespace (default: default)
  --deployment <name>      Deployment name (default: microlink-api)
  --hpa <name>             HPA name (default: <deployment>)
  --from <iso>             Window start time (ISO-8601)
  --to <iso>               Window end time (ISO-8601, default: now)
  --window <duration>      If --from is omitted, use relative window from --to (default: 30m)
                           Supported suffixes: m, h, d (example: 45m, 2h, 1d)
  --site <domain>          Datadog site (default: $DD_SITE or datadoghq.com)
  --out <path>             Write full JSON output to file
  --pretty                 Pretty-print JSON payload
  --help                   Show this help

Environment:
  DD_API_KEY               Datadog API key (required)
  DD_APP_KEY               Datadog application key (required)
  DD_SITE                  Datadog site, e.g. datadoghq.com, datadoghq.eu

Examples:
  node bin/incident-metrics.mjs \\
    --cluster microlink \\
    --namespace default \\
    --deployment microlink-api \\
    --from 2026-02-10T22:30:00Z \\
    --to 2026-02-10T23:00:00Z

  node bin/incident-metrics.mjs --cluster microlink --window 2h --out /tmp/incident-metrics.json
`.trim()

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

  const windowMs = parseWindowMs(window || '30m')
  if (!windowMs) throw new Error(`Invalid --window value: ${window}`)
  const start = new Date(end.getTime() - windowMs)
  return { start, end }
}

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

function statsFromMap (map) {
  const values = mapToSortedEntries(map).map(([, value]) => value).filter(Number.isFinite)
  if (values.length === 0) return null
  const sum = values.reduce((acc, value) => acc + value, 0)
  return {
    samples: values.length,
    min: Math.min(...values),
    avg: sum / values.length,
    max: Math.max(...values),
    last: values[values.length - 1]
  }
}

function peakRatioDetails (numeratorMap, denominatorMap, multiplier = 1) {
  let best = null
  for (const [ts, numerator] of numeratorMap.entries()) {
    const denominator = denominatorMap.get(ts)
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) continue
    const ratio = (numerator / denominator) * multiplier
    if (!best || ratio > best.ratio) {
      best = { ts, ratio, numerator, denominator }
    }
  }
  return best
}

function formatNumber (value, decimals = 2) {
  if (!Number.isFinite(value)) return 'n/a'
  return Number(value).toFixed(decimals)
}

function printTuningRecommendations (summary) {
  const mem = summary.metrics.deployment_memory_used_vs_requests_pct
  const cpu = summary.metrics.deployment_cpu_used_vs_requests_pct
  const unavailable = summary.metrics.deployment_unavailable_pct
  const hpaGap =
    summary.metrics.hpa_desired_replicas && summary.metrics.hpa_current_replicas
      ? summary.metrics.hpa_desired_replicas.max - summary.metrics.hpa_current_replicas.max
      : null

  console.log('')
  console.log('recommended_step_order:')
  if (mem?.max > 100) {
    console.log('1) Lower HPA memory target first (for example 90 -> 80).')
  } else {
    console.log('1) Keep memory target unchanged (memory pressure is not the primary signal).')
  }
  if (cpu?.max > 85) {
    console.log('2) Lower HPA CPU target second (for example 70 -> 65).')
  } else {
    console.log('2) Keep CPU target unchanged unless future windows show sustained CPU pressure.')
  }
  if ((unavailable?.max ?? 0) > 5 || (hpaGap ?? 0) > 0) {
    console.log('3) If instability remains, tune scaleUp policies (add Pods + Percent policy).')
  } else {
    console.log('3) ScaleUp policy can stay unchanged while stability remains good.')
  }
  console.log('4) Increase replicaCount baseline only if burst cold-start is still visible.')
  console.log('5) Increase maxReplicaCount last, and only with enough node autoscaler headroom.')
  console.log('')
  console.log('memory_limit_note: keep limits.memory as-is unless OOMKills or near-limit usage are observed.')
}

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
  const deployment = args.deployment || 'microlink-api'
  const hpa = args.hpa || deployment
  const site = args.site || process.env.DD_SITE || 'datadoghq.com'

  const { start, end } = parseTimeRange({
    from: args.from,
    to: args.to,
    window: args.window
  })

  const scopeCluster = `kube_cluster_name:${cluster}`
  const scopeDeploy = `${scopeCluster},kube_namespace:${namespace},kube_deployment:${deployment}`
  const scopeHpa = `${scopeCluster},kube_namespace:${namespace},horizontalpodautoscaler:${hpa}`
  const scopeNamespace = `${scopeCluster},kube_namespace:${namespace}`

  const queries = {
    cluster_cpu_usage_nano: `sum:kubernetes.cpu.usage.total{${scopeCluster}}.rollup(avg,300)`,
    cluster_cpu_allocatable_cores: `sum:kubernetes_state.node.cpu_allocatable.total{${scopeCluster}}`,
    cluster_cpu_requests_cores: `sum:kubernetes.cpu.requests{${scopeCluster}}`,
    deployment_cpu_usage_nano: `sum:kubernetes.cpu.usage.total{${scopeDeploy}}.rollup(avg,300)`,
    deployment_cpu_requests_cores: `sum:kubernetes.cpu.requests{${scopeDeploy}}`,
    deployment_memory_usage_bytes: `sum:kubernetes.memory.usage{${scopeDeploy}}`,
    deployment_memory_requests_bytes: `sum:kubernetes.memory.requests{${scopeDeploy}}`,
    hpa_current_replicas: `max:kubernetes_state.hpa.current_replicas{${scopeHpa}}`,
    hpa_desired_replicas: `max:kubernetes_state.hpa.desired_replicas{${scopeHpa}}`,
    hpa_max_replicas: `max:kubernetes_state.hpa.max_replicas{${scopeHpa}}`,
    pending_pods: `sum:kubernetes_state.pod.status_phase{${scopeNamespace},phase:pending}`,
    deployment_replicas_unavailable: `max:kubernetes_state.deployment.replicas_unavailable{${scopeDeploy}}`,
    deployment_replicas_desired: `max:kubernetes_state.deployment.replicas_desired{${scopeDeploy}}`
  }

  const entries = await Promise.all(
    Object.entries(queries).map(async ([name, query]) => {
      const map = await datadogQuery({
        site,
        apiKey,
        appKey,
        from: start,
        to: end,
        query
      })
      return [name, { query, points: map }]
    })
  )
  const raw = Object.fromEntries(entries)

  const clusterCpuUsageCores = new Map(
    mapToSortedEntries(raw.cluster_cpu_usage_nano.points).map(([ts, value]) => [ts, value / 1e9])
  )
  const deploymentCpuUsageCores = new Map(
    mapToSortedEntries(raw.deployment_cpu_usage_nano.points).map(([ts, value]) => [ts, value / 1e9])
  )

  const derived = {
    cluster_cpu_used_pct: ratioSeries(
      clusterCpuUsageCores,
      raw.cluster_cpu_allocatable_cores.points,
      100
    ),
    cluster_cpu_requested_pct: ratioSeries(
      raw.cluster_cpu_requests_cores.points,
      raw.cluster_cpu_allocatable_cores.points,
      100
    ),
    deployment_cpu_used_vs_requests_pct: ratioSeries(
      deploymentCpuUsageCores,
      raw.deployment_cpu_requests_cores.points,
      100
    ),
    deployment_memory_used_vs_requests_pct: ratioSeries(
      raw.deployment_memory_usage_bytes.points,
      raw.deployment_memory_requests_bytes.points,
      100
    ),
    deployment_unavailable_pct: ratioSeries(
      raw.deployment_replicas_unavailable.points,
      raw.deployment_replicas_desired.points,
      100
    )
  }

  const summary = {
    window: {
      from: start.toISOString(),
      to: end.toISOString(),
      minutes: Number(((end.getTime() - start.getTime()) / 60_000).toFixed(2))
    },
    scope: { cluster, namespace, deployment, hpa, site },
    metrics: {
      cluster_cpu_used_pct: statsFromMap(derived.cluster_cpu_used_pct),
      cluster_cpu_requested_pct: statsFromMap(derived.cluster_cpu_requested_pct),
      deployment_cpu_used_vs_requests_pct: statsFromMap(derived.deployment_cpu_used_vs_requests_pct),
      deployment_memory_used_vs_requests_pct: statsFromMap(derived.deployment_memory_used_vs_requests_pct),
      deployment_unavailable_pct: statsFromMap(derived.deployment_unavailable_pct),
      pending_pods: statsFromMap(raw.pending_pods.points),
      hpa_current_replicas: statsFromMap(raw.hpa_current_replicas.points),
      hpa_desired_replicas: statsFromMap(raw.hpa_desired_replicas.points),
      hpa_max_replicas: statsFromMap(raw.hpa_max_replicas.points)
    },
    capacityPlanning: (() => {
      const peak = peakRatioDetails(
        raw.cluster_cpu_requests_cores.points,
        raw.cluster_cpu_allocatable_cores.points,
        100
      )
      if (!peak) return null
      const peakRequestedCores = peak.numerator
      const currentAllocatableCores = peak.denominator
      const requiredAllocatableFor80Pct = peakRequestedCores / 0.8
      const requiredAllocatableFor70Pct = peakRequestedCores / 0.7
      return {
        peakTimestamp: new Date(peak.ts).toISOString(),
        peakRequestedPct: peak.ratio,
        peakRequestedCores,
        allocatableAtPeakCores: currentAllocatableCores,
        requiredAllocatableFor80Pct,
        requiredAllocatableFor70Pct,
        scaleFactorFor80Pct: requiredAllocatableFor80Pct / currentAllocatableCores,
        scaleFactorFor70Pct: requiredAllocatableFor70Pct / currentAllocatableCores
      }
    })()
  }

  console.log(`Incident metrics (${summary.window.from} -> ${summary.window.to})`)
  console.log(`scope cluster=${cluster} namespace=${namespace} deployment=${deployment} hpa=${hpa}`)
  console.log('')

  const printLine = (name, stats, unit = '') => {
    if (!stats) {
      console.log(`${name}: n/a`)
      return
    }
    console.log(
      `${name}: avg=${formatNumber(stats.avg)}${unit} max=${formatNumber(stats.max)}${unit} last=${formatNumber(
        stats.last
      )}${unit} samples=${stats.samples}`
    )
  }

  printLine('cluster_cpu_used_pct', summary.metrics.cluster_cpu_used_pct, '%')
  printLine('cluster_cpu_requested_pct', summary.metrics.cluster_cpu_requested_pct, '%')
  printLine('deployment_cpu_used_vs_requests_pct', summary.metrics.deployment_cpu_used_vs_requests_pct, '%')
  printLine('deployment_memory_used_vs_requests_pct', summary.metrics.deployment_memory_used_vs_requests_pct, '%')
  printLine('deployment_unavailable_pct', summary.metrics.deployment_unavailable_pct, '%')
  printLine('pending_pods', summary.metrics.pending_pods)
  printLine('hpa_current_replicas', summary.metrics.hpa_current_replicas)
  printLine('hpa_desired_replicas', summary.metrics.hpa_desired_replicas)
  printLine('hpa_max_replicas', summary.metrics.hpa_max_replicas)
  if (summary.capacityPlanning) {
    console.log('')
    console.log(
      `capacity_peak: requested=${formatNumber(summary.capacityPlanning.peakRequestedCores)} cores ` +
        `allocatable=${formatNumber(summary.capacityPlanning.allocatableAtPeakCores)} cores ` +
        `requested_pct=${formatNumber(summary.capacityPlanning.peakRequestedPct)}%`
    )
    console.log(
      `capacity_target_80pct: allocatable=${formatNumber(summary.capacityPlanning.requiredAllocatableFor80Pct)} cores ` +
        `scale_factor=${formatNumber(summary.capacityPlanning.scaleFactorFor80Pct)}x`
    )
    console.log(
      `capacity_target_70pct: allocatable=${formatNumber(summary.capacityPlanning.requiredAllocatableFor70Pct)} cores ` +
        `scale_factor=${formatNumber(summary.capacityPlanning.scaleFactorFor70Pct)}x`
    )
  }
  printTuningRecommendations(summary)

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
