locals {
  project = "nova-commerce"

  ami_id = var.ami_id != "" ? var.ami_id : data.aws_ami.ubuntu[0].id

  public_key = var.public_key_path != "" ? file(var.public_key_path) : tls_private_key.deployer[0].public_key_openssh

  # Ports needed to SSH in, run, and reach Nova Commerce
  # (Docker Compose, Vite/API, Kubernetes NodePorts, Argo CD).
  tcp_ports = {
    ssh      = { from = 22, to = 22, description = "SSH" }
    http     = { from = 80, to = 80, description = "HTTP / Nginx" }
    https    = { from = 443, to = 443, description = "HTTPS" }
    web      = { from = 3000, to = 3000, description = "Storefront (docker compose 3000:80)" }
    api      = { from = 4000, to = 4000, description = "Express API" }
    vite     = { from = 5173, to = 5173, description = "Vite frontend (npm run dev)" }
    redis    = { from = 6379, to = 6379, description = "Redis" }
    kube_api = { from = 6443, to = 6443, description = "Kubernetes API" }
    argocd   = { from = 8080, to = 8080, description = "Argo CD UI" }
    nginx    = { from = 8081, to = 8081, description = "Storefront (README / K8s service port)" }
    mongo    = { from = 27017, to = 27017, description = "MongoDB" }
    nodeport = { from = 30000, to = 32767, description = "Kubernetes NodePort (includes web 31000)" }
  }

  common_tags = {
    Project   = local.project
    ManagedBy = "terraform"
  }
}

data "aws_ami" "ubuntu" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "tls_private_key" "deployer" {
  count     = var.public_key_path == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "private_key" {
  count = var.public_key_path == "" ? 1 : 0

  content         = tls_private_key.deployer[0].private_key_pem
  filename        = "${path.module}/${var.key_name}.pem"
  file_permission = "0600"
}

resource "aws_key_pair" "deployer" {
  key_name   = var.key_name
  public_key = local.public_key
  tags       = merge(local.common_tags, { Name = var.key_name })
}

resource "aws_default_vpc" "default" {
}

resource "aws_security_group" "app" {
  name        = "${local.project}-sg"
  description = "Inbound ports required to run Nova Commerce"
  vpc_id      = aws_default_vpc.default.id

  dynamic "ingress" {
    for_each = local.tcp_ports
    content {
      description = ingress.value.description
      from_port   = ingress.value.from
      to_port     = ingress.value.to
      protocol    = "tcp"
      cidr_blocks = [var.allowed_cidr]
    }
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.project}-sg" })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "app" {
  ami                         = local.ami_id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deployer.key_name
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size = var.volume_size
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    usermod -aG docker ubuntu
    systemctl enable --now docker
  EOF

  tags = merge(local.common_tags, { Name = var.instance_name })
}

resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id
  tags     = merge(local.common_tags, { Name = "${local.project}-eip" })
}
