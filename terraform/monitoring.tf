# Monitoring Stack - kube-prometheus-stack Helm Release
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
    }
  }
}
resource "helm_release" "kube_prometheus_stack" {
  name       = "monitoring"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "45.29.0"
  namespace  = "monitoring"

  values = [yamlencode({
    prometheus = {
      prometheusSpec = {
        serviceMonitorSelectorNilUsesHelmValues = false
        retention                               = "7d"
        storageSpec = {
          volumeClaimTemplate = {
            spec = {
              storageClassName = "gp3"
              accessModes      = ["ReadWriteOnce"]
              resources = {
                requests = {
                  storage = "20Gi"
                }
              }
            }
          }
        }
      }
    }
    grafana = {
      enabled = true
      persistence = {
        enabled          = true
        storageClassName = "gp3"
        size             = "5Gi"
      }
      sidecar = {
        dashboards = {
          enabled    = true
          label      = "grafana_dashboard"
          labelValue = "1"
        }
      }
    }
    alertmanager = {
      enabled = true
    }
  })]

  depends_on = [
    kubernetes_namespace.monitoring,
    helm_release.aws_load_balancer_controller,
  ]
}

