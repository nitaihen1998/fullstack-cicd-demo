locals {
  # Project metadata
  project_name = "taskmanager"
  
  # Database configuration
  db_name        = "taskmanager"
  engine         = "postgres"
  engine_version = "15.4"
  port           = 5432
  
  # Environment-specific settings
  instance_class      = var.environment == "prod" ? "db.t3.small" : "db.t3.micro"
  multi_az           = var.environment == "prod"
  backup_retention   = var.environment == "prod" ? 7 : 1
  deletion_protection = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"
  
  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Common tags
  tags = {
    Project     = local.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
