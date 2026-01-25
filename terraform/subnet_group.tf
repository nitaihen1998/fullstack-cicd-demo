resource "aws_db_subnet_group" "main" {
  name       = "${local.project_name}-db-subnet-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = merge(local.tags, {
    Name = "${local.project_name}-db-subnet-${var.environment}"
  })
}
