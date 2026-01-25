# Terraform RDS Configuration

## Quick Start

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values

3. Set the database password:
   ```bash
   export TF_VAR_db_password="your_secure_password"
   ```

4. Initialize Terraform:
   ```bash
   terraform init
   ```

5. Plan and apply:
   ```bash
   terraform plan
   terraform apply
   ```

## File Structure

- `variables.tf` - Input variables
- `locals.tf` - Local variables and computed values
- `rds.tf` - RDS instance resource
- `security_groups.tf` - Security group for RDS
- `subnet_group.tf` - DB subnet group
- `outputs.tf` - Output values
- `terraform.tfvars.example` - Example configuration

## Outputs

After apply, get the RDS endpoint:
```bash
terraform output rds_endpoint
```
