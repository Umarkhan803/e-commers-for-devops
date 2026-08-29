# setting up ALB  security groups

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security groups for ALB "
  vpc_id      = aws_vpc.main.id

  # in bound rule for http
  ingress {
    description = "allow http"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # in bound rule for htts
  ingress {
    description = "allow https"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # outbound rule for all traffic
  egress {
    description = "allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${var.project_name}-sg"
  }
}

# setting up eks security groups
resource "aws_security_group" "eks" {
  name        = "${var.project_name}-eks-sg"
  vpc_id      = aws_vpc.main.id
  description = "security groups for eks"

  ingress {
    description     = "app traffic for alb"
    from_port       = 80
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    description = "app traffic for alb"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    description = "allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]

  }
  tags = {
    Name = "${var.project_name}-eks-sg"
  }
}
