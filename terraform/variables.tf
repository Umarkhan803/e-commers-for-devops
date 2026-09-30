variable "aws_region" {
  description = "AWS region where resources will be provisioned"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "project name used for resources naming and tagging"
  type        = string
  default     = "nova-commerce"
}

variable "vpc_cidr" {
  description = "cird block of the vpc"
  type        = string
  default     = "10.0.0.0/16"

}
variable "availability_zones" {
  description = "Availability zone used by the vpc"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

}
variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

}
variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}


# eks var
variable "eks_cluster_version" {
  description = "eks version"
  type        = string
  default     = "1.36"
}
variable "eks_node_instance_types" {
  description = "instance type for eks"
  type        = list(string)
  default     = ["t3.medium"]
}
variable "eks_desired_nodes" {
  description = "desired worker node for eks"
  type        = number
  default     = 3
}
variable "eks_min_nodes" {
  description = "min worker node for eks"
  type        = number
  default     = 3
}
variable "eks_max_nodes" {
  description = "max worker node for eks"
  type        = number
  default     = 6
}
variable "eks_public_access_cidrs" {
  description = "CIDRs allowed to reach the public EKS API endpoint. Use your public IP/32; do not use 0.0.0.0/0."
  type        = list(string)
}

variable "github_org" {
  type    = string
  default = "Umarkhan803"
}

variable "github_repo" {
  type    = string
  default = "e-commers-for-devops"
}

variable "eks_admin_principal_arn" {
  description = "IAM role/user ARN that receives EKS cluster admin access"
  type        = string
}

variable "lbc_iam_policy_arn" {
  description = "Existing IAM policy ARN created from the official AWS Load Balancer Controller policy JSON"
  type        = string
}
# 223.181.118.238
