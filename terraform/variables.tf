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
