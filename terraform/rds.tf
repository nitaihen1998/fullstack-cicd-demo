resource "aws_db_instance" "main" {
  identifier     = "${local.project_name}-${var.environment}"
  engine         = local.engine
  engine_version = local.engine_version
  instance_class = local.instance_class

  db_name  = local.db_name
  username = var.db_username
  password = var.db_password
  port     = local.port

  allocated_storage     = local.allocated_storage
  max_allocated_storage = local.max_allocated_storage
  storage_type          = local.storage_type
  storage_encrypted     = local.storage_encrypted

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az              = local.multi_az

  backup_retention_period   = local.backup_retention
  backup_window            = "03:00-04:00"
  maintenance_window       = "mon:04:00-mon:05:00"
  skip_final_snapshot      = local.skip_final_snapshot
  final_snapshot_identifier = local.skip_final_snapshot ? null : "${local.project_name}-final-${var.environment}"

  enabled_cloudwatch_logs_exports = ["postgresql"]
  auto_minor_version_upgrade      = true
  deletion_protection             = local.deletion_protection

  tags = merge(local.tags, {
    Name = "${local.project_name}-rds-${var.environment}"
  })

  lifecycle {
    ignore_changes = [password]
  }
}
