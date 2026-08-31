# ecr output
output "backend_ecr_repository_url" {
  description = "ECR repository url for backend"
  value       = aws_ecr_repository.backend.repository_url
}
output "frontend_ecr_repository_url" {
  description = "ECR repository url for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

# iam roles
output "github_action_role_arn" {
  description = "IAM role ARN used by github Action"
  value       = aws_iam_role.github_actions.arn
}

# eks cluster
output "eks_cluster_name" {
  description = "Name of the cluster"
  value       = aws_eks_cluster.main.name
}
output "eks_cluster_endpoint" {
  description = "endpoint of the eks"
  value       = aws_eks_cluster.main.endpoint
}
output "eks_cluster_version" {
  description = "eks version"
  value       = aws_eks_cluster.main.version
}
output "eks_cluster_arn" {
  description = "arn of the eks"
  value       = aws_eks_cluster.main.arn
}

# cluster nodes
output "eks_node_group_name" {
  description = "name of the eks manager node group"
  value       = aws_eks_node_group.main.node_group_name
}

# alb
output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_lb.alb.dns_name
}

# monitoring
output "monitoring_namespace" {
  description = "Monitoring namespace"
  value       = kubernetes_namespace.monitoring.metadata[0].name
}

output "grafana_admin_password" {
  description = "Grafana admin password (base64 encoded)"
  value       = helm_release.kube_prometheus_stack.status[0].values[0].grafana.adminPassword
  sensitive   = true
}

# kubectl helper
output "kubectl_command" {
  description = "Command to configure kubectl for this EKS cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}"
}

output "kubectl_helper" {
  description = "Helpful instructions for configuring kubectl and verifying cluster connectivity"
  value       = <<EOT
After applying this Terraform configuration:

1. Wait for EKS cluster to be fully active (can take 10-15 minutes):
   aws eks describe-cluster --name ${aws_eks_cluster.main.name} --region ${var.aws_region} --query "cluster.status"

2. Configure kubectl to connect to your EKS cluster:
   aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}

3. Verify the connection:
   kubectl cluster-info
   kubectl get nodes
   kubectl get ns

EKS Cluster Details:
  Name: ${aws_eks_cluster.main.name}
  Endpoint: ${aws_eks_cluster.main.endpoint}
  Version: ${aws_eks_cluster.main.version}
EOT
}