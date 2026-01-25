resource "aws_security_group" "rds" {
  name_prefix = "${local.project_name}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  tags = merge(local.tags, {
    Name = "${local.project_name}-rds-sg-${var.environment}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port               = local.port
  to_port                 = local.port
  protocol                = "tcp"
  source_security_group_id = var.app_security_group_id
  security_group_id       = aws_security_group.rds.id
  description             = "PostgreSQL from application"
}
