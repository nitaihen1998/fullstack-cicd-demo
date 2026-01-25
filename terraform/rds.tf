# AWS RDS PostgreSQL Terraform Configuration for Task Manager
# This configuration creates a production-ready RDS PostgreSQL instance

# Variables
variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "taskmanager_admin"
}

variable "db_password" {
  description = "Master password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "vpc_id" {
  description = "VPC ID where RDS will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the DB subnet group (at least 2 in different AZs)"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "Security group ID of the application that will connect to RDS"
  type        = string
}

variable "environment" {
  description = "Environment name (production, development, staging)"
  type        = string
  default     = "production"
}

# Local variables for environment-specific configurations
locals {
  db_name            = "taskmanager"
  engine_version     = "15.4"
  port               = 5432
  
  # Instance class based on environment
  instance_class = var.environment == "production" ? "db.t3.small" : "db.t3.micro"
  
  # Multi-AZ based on environment
  multi_az = var.environment == "production" ? true : false
  
  # Backup retention based on environment
  backup_retention_period = var.environment == "production" ? 7 : 1
  
  # Deletion protection based on environment
  deletion_protection = var.environment == "production" ? true : false
  
  # Performance Insights based on environment
  performance_insights_enabled = var.environment == "production" ? true : false
  
  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Common tags
  common_tags = {
    Name        = "taskmanager-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Application = "TaskManager"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "taskmanager" {
  name       = "taskmanager-db-subnet-group-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "taskmanager-db-subnet-group-${var.environment}"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "taskmanager-rds-sg-${var.environment}"
  description = "Security group for Task Manager RDS PostgreSQL instance"
  vpc_id      = var.vpc_id

  # Ingress rule: Allow PostgreSQL traffic from application security group
  ingress {
    description     = "PostgreSQL from application"
    from_port       = local.port
    to_port         = local.port
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Egress rule: Allow all outbound traffic (default, but explicit)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "taskmanager-rds-sg-${var.environment}"
    }
  )
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "taskmanager" {
  # Basic Configuration
  identifier     = "taskmanager-postgres-${var.environment}"
  engine         = "postgres"
  engine_version = local.engine_version
  instance_class = local.instance_class

  # Storage Configuration
  allocated_storage     = local.allocated_storage
  max_allocated_storage = local.max_allocated_storage
  storage_type          = local.storage_type
  storage_encrypted     = local.storage_encrypted

  # Database Configuration
  db_name  = local.db_name
  username = var.db_username
  password = var.db_password
  port     = local.port

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.taskmanager.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Multi-AZ Configuration
  multi_az = local.multi_az

  # Backup Configuration
  backup_retention_period = local.backup_retention_period
  backup_window          = "03:00-04:00"  # UTC time
  maintenance_window     = "mon:04:00-mon:05:00"  # UTC time
  skip_final_snapshot    = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "taskmanager-final-snapshot-${var.environment}" : null

  # Enhanced Monitoring and Logging
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = local.performance_insights_enabled
  performance_insights_retention_period = local.performance_insights_enabled ? 7 : null

  # Maintenance Configuration
  auto_minor_version_upgrade = true
  deletion_protection        = local.deletion_protection

  # Parameter Group (using default for now)
  # Can be customized with aws_db_parameter_group if needed

  tags = merge(
    local.common_tags,
    {
      Name = "taskmanager-postgres-${var.environment}"
    }
  )

  # Lifecycle
  lifecycle {
    # Prevent accidental deletion in production
    prevent_destroy = false  # Set to true manually for production after initial setup
    
    # Ignore password changes after initial creation (manage externally)
    ignore_changes = [
      password
    ]
  }
}

# Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = aws_db_instance.taskmanager.endpoint
}

output "rds_address" {
  description = "RDS instance address (hostname)"
  value       = aws_db_instance.taskmanager.address
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.taskmanager.port
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.taskmanager.db_name
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = aws_security_group.rds.id
}
