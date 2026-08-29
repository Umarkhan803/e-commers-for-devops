
# ecr output
output "backend_ecr_repository_url" {
  description = "ECR repository url for backend"
  value       = aws_ecr_repository.backend.repository_url
}
output "frontend_ecr_repository_url" {
  description = "ECR repository url for backend"
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
  description = "name of the eks manger node group"
  value       = aws_eks_node_group.main.node_group_name
}
