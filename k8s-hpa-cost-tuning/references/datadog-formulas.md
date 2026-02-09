# Datadog Formulas

## CPU used % of cluster capacity (real utilization)

```text
a = sum:kubernetes.cpu.usage.total{kube_cluster_name:$cluster.value}.rollup(avg,300)
b = sum:kubernetes_state.node.cpu_allocatable.total{kube_cluster_name:$cluster.value}
f = ((a / 1e9) / b) * 100
```

Apply `reduce` on `f`: `avg` for typical utilization, `max` for the worst 5-minute window.

## CPU requested % of cluster capacity (reserved on paper)

```text
a = sum:kubernetes.cpu.requests{kube_cluster_name:$cluster.value}
b = sum:kubernetes_state.node.cpu_allocatable.total{kube_cluster_name:$cluster.value}
f = (a / b) * 100
```

Apply `a` reduce = `avg` for typical reservation (or `last` for current), `b` reduce = `last`.

> This metric **must go down after scale-down** for cost savings to be real.

## Memory utilization vs requests (HPA-relevant)

```text
a = sum:kubernetes.memory.usage{kube_cluster_name:$cluster.value,kube_namespace:$namespace,kube_deployment:$deployment}
b = sum:kubernetes.memory.requests{kube_cluster_name:$cluster.value,kube_namespace:$namespace,kube_deployment:$deployment}
f = (a / b) * 100
```

If `f` stays above target, memory drives scale-up even when CPU is idle.
