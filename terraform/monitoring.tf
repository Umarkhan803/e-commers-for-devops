# Monitoring Stack - kube-prometheus-stack Helm Release

resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "45.29.0"
  namespace  = "monitoring"

  set {
    name  = "prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }

  set {
    name  = "grafana.enabled"
    value = "true"
  }

  set {
    name  = "grafana.sidecar.dashboards.enabled"
    value = "true"
  }

  set {
    name  = "grafana.sidecar.dashboards.label"
    value = "grafana_dashboard"
  }

  set {
    name  = "grafana.sidecar.dashboards.labelValue"
    value = "1"
  }

  set {
    name  = "alertmanager.enabled"
    value = "true"
  }

  depends_on = [
    helm_release.aws_load_balancer_controller,
    kubernetes_namespace.monitoring
  ]
}

# Create monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
    }
  }
}