output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Elastic IP of the instance"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "SSH into the instance (generated key is written next to these files)"
  value       = "ssh -i ${var.public_key_path == "" ? "${path.module}/${var.key_name}.pem" : "<your-private-key>"} ubuntu@${aws_eip.app.public_ip}"
}

output "storefront_url" {
  description = "Docker Compose storefront (host 3000 → container 80)"
  value       = "http://${aws_eip.app.public_ip}:3000"
}

output "api_url" {
  description = "Express API"
  value       = "http://${aws_eip.app.public_ip}:4000/api/v1"
}

output "k8s_web_url" {
  description = "Kubernetes web NodePort"
  value       = "http://${aws_eip.app.public_ip}:31000"
}
