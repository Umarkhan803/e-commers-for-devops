# AWS Load Balancer Controller

# Existing IAM policy

data "aws_iam_policy" "aws_load_balancer_controller" {
  arn = "arn:aws:iam::905418141604:policy/AWSLoadBalancerControllerIAMPolicy"
}


# EKS OIDC Provider

data "aws_iam_openid_connect_provider" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer

  depends_on = [
    aws_eks_cluster.main
  ]
}


# IAM Role for AWS Load Balancer Controller

resource "aws_iam_role" "aws_load_balancer_controller" {

  name = "AWSLoadBalancerControllerIAMRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = data.aws_iam_openid_connect_provider.eks.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {

            "${replace(
              aws_eks_cluster.main.identity[0].oidc[0].issuer,
              "https://",
              ""
            )}:aud" = "sts.amazonaws.com"

            "${replace(
              aws_eks_cluster.main.identity[0].oidc[0].issuer,
              "https://",
              ""
            )}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          }
        }
      }
    ]
  })
}


# Attach IAM Policy to Role
resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {

  role = aws_iam_role.aws_load_balancer_controller.name

  policy_arn = data.aws_iam_policy.aws_load_balancer_controller.arn
}


# Kubernetes Service Account

resource "kubernetes_service_account_v1" "aws_load_balancer_controller" {

  metadata {

    name      = "aws-load-balancer-controller"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.aws_load_balancer_controller.arn
    }

    labels = {
      "app.kubernetes.io/name" = "aws-load-balancer-controller"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.aws_load_balancer_controller
  ]
}


# AWS Load Balancer Controller Helm Release

resource "helm_release" "aws_load_balancer_controller" {

  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"

  namespace = "kube-system"

  wait    = true
  timeout = 600

  set = [
    {
      name  = "clusterName"
      value = aws_eks_cluster.main.name
    },

    {
      name  = "region"
      value = var.aws_region
    },

    {
      name  = "vpcId"
      value = aws_eks_cluster.main.vpc_config[0].vpc_id
    },

    {
      name  = "serviceAccount.create"
      value = "false"
    },

    {
      name  = "serviceAccount.name"
      value = kubernetes_service_account_v1.aws_load_balancer_controller.metadata[0].name
    }
  ]

  depends_on = [
    kubernetes_service_account_v1.aws_load_balancer_controller,
    aws_iam_role_policy_attachment.aws_load_balancer_controller
  ]
}
