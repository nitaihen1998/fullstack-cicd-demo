variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "VPC ID for RDS deployment"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for RDS (min 2 in different AZs)"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "Security group ID of the application"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "taskmanager_admin"
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}
