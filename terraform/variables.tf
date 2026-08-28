variable "aws_region" {
  description = "AWS region where resources will be provisioned"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance. Leave empty to use the latest Ubuntu 22.04 LTS."
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  type        = string
  default     = "t2.large"
}

variable "key_name" {
  description = "Name of the AWS key pair"
  type        = string
  default     = "nova-commerce-key"
}

variable "public_key_path" {
  description = "Path to an existing SSH public key. Leave empty to generate a new key pair."
  type        = string
  default     = ""
}

variable "allowed_cidr" {
  description = "CIDR allowed to reach the instance (use your IP/32 in production)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "volume_size" {
  description = "Root volume size in GiB"
  type        = number
  default     = 30
}

variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
  default     = "nova-commerce"
}
