# AWS Load Balancer Controller Helm Release

resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = "1.7.0"
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = aws_eks_cluster.main.name
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  set {
    name  = "replicaCount"
    value = "2"
  }

  set {
    name  = "image.tag"
    value = "public.ecr.aws/eks/aws-load-balancer-controller:v2.7.0"
  }

  depends_on = [
    aws_iam_role_policy_attachment.ebs_csi_driver,
    kubernetes_service_account.aws_load_balancer_controller,
    aws_eks_cluster.main
  ]
}

# Create service account for AWS Load Balancer Controller with IAM role for service account
resource "kubernetes_service_account" "aws_load_balancer_controller" {
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.ebs_csi_driver.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.ebs_csi_driver
  ]
}