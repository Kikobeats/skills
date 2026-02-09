---
name: k8s-hpa-cost-tuning
description: Tune Kubernetes HPA scale-up/down behavior, topology spread, and resource requests to reduce idle cluster capacity and ensure nodes can drain. This skill should be used when auditing cluster costs on a schedule, analyzing post-incident scaling behavior, or investigating why replicas or nodes do not scale down.
---

# Kubernetes HPA Cost & Scale-Down Tuning

## Mode selection (mandatory)

Declare a mode before executing this skill. All reasoning, thresholds, and recommendations depend on this choice.

```text
mode = audit | incident
```

If no mode is provided, refuse to run and request clarification.

## When to use

### `mode = audit` — Periodic cost-savings audit

Run on a schedule (weekly or bi-weekly) to:

* Detect over-reservation early
* Validate that scale-down and node consolidation still work
* Identify safe opportunities to reduce cluster cost

This mode assumes no active incident and prioritizes stability-preserving recommendations.

### `mode = incident` — Post-incident scaling analysis

Run after a production incident or anomaly, attaching:

* Production logs
* HPA events
* Scaling timelines

This mode focuses on:

* Explaining *why* scaling behaved the way it did
* Distinguishing traffic-driven vs configuration-driven incidents
* Preventing recurrence without overcorrecting

### General triggers

Apply this skill when the task involves:

* Tuning HPA scale-up **and** scale-down behavior for cost efficiency
* Reducing idle cluster capacity without breaking burst handling
* Understanding why replicas or nodes do not scale down even when usage is low
* Aligning HPA, scheduler, and cluster autoscaler behavior

This skill assumes **Datadog** for observability and standard Kubernetes HPA + Cluster Autoscaler.

## Core mental model

Kubernetes scaling is a **three-layer system**:

1. **HPA** decides *how many pods* (based on usage / requests)
2. **Scheduler** decides *where pods go* (based on requests + constraints)
3. **Cluster Autoscaler** decides *how many nodes exist* (only when nodes can empty)

> Cost optimization only works if **all three layers can move downward**.

Key takeaway: HPA decides *quantity*, scheduler decides *placement*, autoscaler decides *cost*. Scale-up can be aggressive; scale-down must be **possible**. If replicas drop but nodes do not, the scheduler is the bottleneck.

## HPA fundamentals

HPA resource utilization is computed against **requests**, not node capacity:

* CPU signal: `pod cpu usage / pod cpu requests`
* Memory signal: `pod memory usage / pod memory requests`

Scheduler placement is also request-based, not live-usage-based.

## Datadog formulas

### CPU used % of cluster capacity (real utilization)

```text
a = sum:kubernetes.cpu.usage.total{kube_cluster_name:$cluster.value}.rollup(avg,300)
b = sum:kubernetes_state.node.cpu_allocatable.total{kube_cluster_name:$cluster.value}
f = ((a / 1e9) / b) * 100
```

Apply `reduce` on `f`: `avg` for typical utilization, `max` for the worst 5-minute window.

### CPU requested % of cluster capacity (reserved on paper)

```text
a = sum:kubernetes.cpu.requests{kube_cluster_name:$cluster.value}
b = sum:kubernetes_state.node.cpu_allocatable.total{kube_cluster_name:$cluster.value}
f = (a / b) * 100
```

Apply `a` reduce = `avg` for typical reservation (or `last` for current), `b` reduce = `last`.

> This metric **must go down after scale-down** for cost savings to be real.

### Memory utilization vs requests (HPA-relevant)

```text
a = sum:kubernetes.memory.usage{kube_cluster_name:$cluster.value,kube_namespace:$namespace,kube_deployment:$deployment}
b = sum:kubernetes.memory.requests{kube_cluster_name:$cluster.value,kube_namespace:$namespace,kube_deployment:$deployment}
f = (a / b) * 100
```

If `f` stays above target, memory drives scale-up even when CPU is idle.

## Scale-down as a first-class cost control

When scale-down is slow or blocked:

* Replicas plateau
* Pods remain evenly spread
* Nodes never empty
* Cluster Autoscaler cannot remove nodes

Result: **permanent over-reservation**.

### Recommended HPA scale-down policy

```yaml
scaleDown:
  stabilizationWindowSeconds: 60
  selectPolicy: Max
  policies:
    - type: Percent
      value: 50
      periodSeconds: 30
```

Effects: fast reaction once load drops, predictable replica collapse, low flapping risk.

## Topology spread: critical cost lever

> Topology spread must never prevent pod consolidation during scale-down.

Strict constraints block scheduler flexibility and freeze cluster size.

### Anti-pattern (breaks cost optimization)

```yaml
maxSkew: 1
whenUnsatisfiable: DoNotSchedule
```

Pods cannot collapse onto fewer nodes. Nodes never drain. Reserved CPU/memory never decreases.

### Recommended default (cost-safe)

```yaml
topologySpreadConstraints:
- topologyKey: kubernetes.io/hostname
  maxSkew: 2
  whenUnsatisfiable: ScheduleAnyway
```

Strong preference for spreading while allowing bin-packing during scale-down and enabling node removal.

### Strict isolation (AZ-level only)

When hard guarantees are required:

```yaml
topologySpreadConstraints:
- topologyKey: topology.kubernetes.io/zone
  maxSkew: 1
  whenUnsatisfiable: DoNotSchedule
```

Do **not** combine this with strict hostname-level spread.

## Anti-affinity as a soft alternative

To avoid hot nodes without blocking scale-down:

```yaml
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 100
    podAffinityTerm:
      topologyKey: kubernetes.io/hostname
      labelSelector:
        matchLabels:
          app: your-app
```

Anti-affinity is advisory and cost-safe.

## Resource requests tuning

* Over-requesting CPU = slower scale-down
* Over-requesting memory = unexpected scale-ups

Practical defaults:

* `targetCPUUtilizationPercentage: 70`
* `targetMemoryUtilizationPercentage: 75–80`

Adjust **one knob at a time**.

## Validation loop

Run weekly (or after changes):

1. Check HPA `current/target` values
2. Compare CPU used % vs CPU requested %
3. Observe replica collapse after load drops
4. Verify nodes drain and disappear
5. Re-check latency, errors, OOMs

### Quick validation commands

```bash
kubectl -n <namespace> get hpa <deployment>
kubectl -n <namespace> describe hpa <deployment>
kubectl -n <namespace> top pod --containers
kubectl top node
kubectl -n <namespace> get pods -o wide | sort -k7
```
