# AWS RDS PostgreSQL Setup Guide

This guide explains how to set up and configure AWS RDS PostgreSQL for the Task Manager application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup Options](#database-setup-options)
   - [Option 1: Terraform (Recommended)](#option-1-terraform-recommended)
   - [Option 2: Manual AWS Console Setup](#option-2-manual-aws-console-setup)
3. [Application Configuration](#application-configuration)
4. [Database Schema Migration](#database-schema-migration)
5. [Security Best Practices](#security-best-practices)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Cost Optimization](#cost-optimization)
9. [Migration Checklist](#migration-checklist)
10. [Additional Resources](#additional-resources)

---

## Prerequisites

Before you begin, ensure you have:

- **AWS Account**: Active AWS account with appropriate permissions
- **AWS CLI**: Installed and configured with credentials
  ```bash
  aws configure
  ```
- **Terraform**: Version 1.0+ installed (for Terraform setup option)
  ```bash
  terraform --version
  ```
- **PostgreSQL Client**: For testing connections and running migrations
  ```bash
  psql --version
  ```

---

## Database Setup Options

### Option 1: Terraform (Recommended)

Using Terraform provides infrastructure as code, making it easy to version control and replicate your database setup.

#### 1. Navigate to Terraform Directory
```bash
cd terraform
```

#### 2. Create `terraform.tfvars`
Create a file with your specific values:

```hcl
# terraform.tfvars
db_username         = "taskmanager_admin"
db_password         = "your_secure_password_here"  # Use a strong password!
vpc_id              = "vpc-xxxxxxxxxxxxxxxxx"       # Your VPC ID
subnet_ids          = ["subnet-xxxxx", "subnet-yyyyy"]  # At least 2 subnets in different AZs
app_security_group_id = "sg-xxxxxxxxxxxxxxxxx"     # Your application's security group
environment         = "production"                  # or "development"
```

#### 3. Initialize Terraform
```bash
terraform init
```

#### 4. Review the Plan
```bash
terraform plan
```

#### 5. Apply the Configuration
```bash
terraform apply
```

After successful deployment, Terraform will output the RDS endpoint information:
- `rds_endpoint`: Full connection endpoint
- `rds_address`: Database hostname
- `rds_port`: Database port (5432)
- `rds_db_name`: Database name
- `rds_security_group_id`: Security group ID for RDS

#### 6. Save the Output
```bash
terraform output > rds_output.txt
```

### Option 2: Manual AWS Console Setup

If you prefer using the AWS Console:

#### 1. Create DB Subnet Group
1. Navigate to **RDS** → **Subnet groups**
2. Click **Create DB subnet group**
3. Provide:
   - Name: `taskmanager-db-subnet-group`
   - VPC: Select your VPC
   - Availability Zones: Select at least 2 AZs
   - Subnets: Select private subnets
4. Click **Create**

#### 2. Create Security Group
1. Navigate to **EC2** → **Security Groups**
2. Click **Create security group**
3. Provide:
   - Name: `taskmanager-rds-sg`
   - VPC: Same VPC as above
4. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your application's security group
5. Click **Create**

#### 3. Create RDS Instance
1. Navigate to **RDS** → **Databases**
2. Click **Create database**
3. Configuration:
   - Engine: **PostgreSQL**
   - Version: **15.4** (or latest)
   - Template: **Production** or **Dev/Test**
   - DB instance identifier: `taskmanager-postgres`
   - Master username: `taskmanager_admin`
   - Master password: Create a strong password
   - DB instance class:
     - Production: `db.t3.small` or larger
     - Development: `db.t3.micro`
   - Storage:
     - Storage type: `gp3`
     - Allocated storage: `20 GB`
     - Max storage: `100 GB`
     - Enable storage autoscaling: Yes
     - Enable encryption: Yes (default KMS key)
   - Connectivity:
     - VPC: Your VPC
     - DB subnet group: Select the one created above
     - Public access: **No**
     - VPC security group: Select the security group created above
   - Database authentication: Password authentication
   - Additional configuration:
     - Initial database name: `taskmanager`
     - Backup retention: 7 days (production) or 1 day (dev)
     - Enable CloudWatch logs: PostgreSQL log, Upgrade log
     - Enable Performance Insights: Yes (production)
     - Enable auto minor version upgrade: Yes
     - Deletion protection: Enable for production
4. Click **Create database**

#### 4. Wait for Creation
The database will take 5-15 minutes to become available. Monitor the status in the RDS console.

---

## Application Configuration

### 1. Update Environment Variables

Copy the example files and fill in your RDS details:

```bash
# Copy example files
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Configure `.env` File

Update the root `.env` file with your RDS endpoint information:

```bash
# AWS RDS PostgreSQL Database Configuration
DB_HOST=taskmanager-postgres.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=taskmanager
DB_USER=taskmanager_admin
DB_PASSWORD=your_secure_password
DB_SSL=true

# Database Connection Pool Settings (recommended defaults)
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECT_TIMEOUT=10000

# JWT Configuration
JWT_SECRET=your_secure_random_secret_key_change_this
JWT_EXPIRE=7d
```

**Important Notes:**
- `DB_HOST`: Use the endpoint from Terraform output or RDS console
- `DB_SSL`: Must be `true` for RDS connections
- `DB_PASSWORD`: Use the password you set during database creation
- `JWT_SECRET`: Generate a secure random string

### 3. Generate Secure JWT Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Schema Migration

### Method 1: Using psql (Recommended)

1. **Connect to RDS Instance**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com \
        -U taskmanager_admin \
        -d taskmanager \
        -p 5432
   ```

2. **Run Schema Migration**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com \
        -U taskmanager_admin \
        -d taskmanager \
        -p 5432 \
        -f backend/database/schema.sql
   ```

3. **Verify Tables Created**
   ```sql
   \dt  -- List tables
   \d users  -- Describe users table
   \d tasks  -- Describe tasks table
   ```

### Method 2: Using Application Connection

You can also use a Node.js script to run the migration:

```javascript
// migrate.js
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const schema = fs.readFileSync('./backend/database/schema.sql', 'utf8');

pool.query(schema)
  .then(() => {
    console.log('Schema migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

Run it:
```bash
node migrate.js
```

---

## Security Best Practices

### Network Security

1. **VPC Configuration**
   - Place RDS in private subnets only
   - Never enable public accessibility
   - Use separate security groups for different tiers

2. **Security Group Rules**
   - Only allow port 5432 from application security group
   - Use principle of least privilege
   - Regularly audit security group rules

3. **SSL/TLS**
   - Always use SSL for RDS connections
   - The application is configured with `DB_SSL=true`
   - RDS certificates are automatically managed by AWS

### Credentials Management

**Option 1: AWS Secrets Manager (Recommended for Production)**

1. Store database credentials in Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name taskmanager/database/credentials \
     --description "Task Manager database credentials" \
     --secret-string '{
       "username":"taskmanager_admin",
       "password":"your_secure_password",
       "engine":"postgres",
       "host":"your-rds-endpoint.rds.amazonaws.com",
       "port":5432,
       "dbname":"taskmanager"
     }'
   ```

2. Grant IAM permissions to retrieve the secret
3. Modify application to fetch credentials from Secrets Manager

**Option 2: AWS Systems Manager Parameter Store**

```bash
aws ssm put-parameter \
  --name "/taskmanager/db/host" \
  --value "your-rds-endpoint.rds.amazonaws.com" \
  --type "String"

aws ssm put-parameter \
  --name "/taskmanager/db/password" \
  --value "your_secure_password" \
  --type "SecureString"
```

**Option 3: Environment Variables (Development/Testing)**

For development or testing environments, using environment variables is acceptable. Ensure:
- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate credentials regularly

### Connection Pool Optimization

The application uses these connection pool settings:

- `DB_POOL_MAX=20`: Maximum connections (adjust based on instance size)
- `DB_POOL_MIN=2`: Minimum idle connections
- `DB_IDLE_TIMEOUT=30000`: Close idle connections after 30 seconds
- `DB_CONNECT_TIMEOUT=10000`: Connection timeout of 10 seconds

**Recommendations:**
- For `db.t3.micro`: Max 20 connections
- For `db.t3.small`: Max 40 connections
- For `db.t3.medium`: Max 80 connections

Monitor using CloudWatch metrics: `DatabaseConnections`

### Password Policy

- Minimum 16 characters
- Include uppercase, lowercase, numbers, and special characters
- Rotate every 90 days
- Don't reuse passwords

---

## Monitoring and Maintenance

### CloudWatch Logs

Enable and monitor these log types:

1. **PostgreSQL Log**
   - Query logs
   - Error messages
   - Slow queries

2. **Upgrade Log**
   - Version upgrade information

### Configure CloudWatch Alarms

**CPU Utilization Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name taskmanager-rds-cpu-high \
  --alarm-description "RDS CPU utilization is too high" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=taskmanager-postgres
```

**Database Connections Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name taskmanager-rds-connections-high \
  --alarm-description "RDS connection count is high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=taskmanager-postgres
```

**Freeable Memory Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name taskmanager-rds-memory-low \
  --alarm-description "RDS freeable memory is low" \
  --metric-name FreeableMemory \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 524288000 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=taskmanager-postgres
```

### Backup Verification

1. **Automated Backups**: Configured during RDS setup
2. **Manual Snapshots**: Create before major changes
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier taskmanager-postgres \
     --db-snapshot-identifier taskmanager-manual-$(date +%Y%m%d-%H%M%S)
   ```

3. **Test Restore Process**: Periodically test restoring from backup

### Performance Insights

Enable Performance Insights (production) to:
- Identify slow queries
- Monitor database load
- Analyze wait events

Access via RDS Console → Database → Performance Insights tab

---

## Troubleshooting

### Connection Issues

#### Test Connection from Application Server
```bash
# Install PostgreSQL client if needed
sudo apt-get install postgresql-client  # Ubuntu/Debian
sudo yum install postgresql            # Amazon Linux/RHEL

# Test connection
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U taskmanager_admin \
     -d taskmanager \
     -p 5432
```

#### Common Connection Errors

**Error: "connection timeout"**
- Check security group rules
- Verify application server can reach RDS subnet
- Check network ACLs

**Error: "SSL connection required"**
- Ensure `DB_SSL=true` in environment variables
- RDS requires SSL by default for external connections

**Error: "authentication failed"**
- Verify username and password
- Check master user credentials in RDS console
- Ensure password doesn't contain special characters that need escaping

**Error: "could not connect to server"**
- Verify RDS instance is in "available" state
- Check endpoint hostname is correct
- Ensure DNS resolution is working

#### Enable Debug Logging

Temporarily enable detailed connection logging:

```javascript
// In database.js, add before pool creation:
process.env.DEBUG = 'pg:*';
```

### SSL Certificate Issues

If you encounter SSL certificate verification issues:

1. **Download RDS Certificate Bundle**
   ```bash
   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```

2. **Update Connection Configuration**
   ```javascript
   ssl: {
     rejectUnauthorized: true,
     ca: fs.readFileSync('./global-bundle.pem').toString()
   }
   ```

### Performance Issues

#### Slow Queries

1. **Enable Query Logging** (temporarily):
   - Modify parameter group
   - Set `log_statement = 'all'`
   - Set `log_min_duration_statement = 1000` (logs queries > 1 second)

2. **Review Slow Queries in CloudWatch Logs**

3. **Analyze Query Plans**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 1;
   ```

#### High CPU Usage

- Check for missing indexes
- Review query patterns
- Consider upgrading instance class

#### Connection Pool Exhaustion

- Increase `DB_POOL_MAX`
- Reduce `DB_IDLE_TIMEOUT`
- Check for connection leaks in application code

### Debugging Application Issues

**Check Environment Variables:**
```bash
# Inside backend container
env | grep DB_
```

**Test Database Connection:**
```bash
# From your application server
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()')
  .then(res => console.log('Success:', res.rows[0]))
  .catch(err => console.error('Error:', err))
  .finally(() => pool.end());
"
```

---

## Cost Optimization

### Tips to Reduce RDS Costs

1. **Right-size Your Instance**
   - Start with `db.t3.micro` for development
   - Monitor CPU and memory usage
   - Upgrade only when needed

2. **Use Reserved Instances**
   - 1-year commitment: ~40% savings
   - 3-year commitment: ~60% savings
   - Best for production workloads

3. **Storage Optimization**
   - Start with 20GB, enable autoscaling
   - Use gp3 (cheaper than gp2 with better performance)
   - Delete old snapshots

4. **Multi-AZ Only When Needed**
   - Use Multi-AZ for production only
   - Single-AZ for development/testing

5. **Stop Development Instances**
   - Stop (don't delete) dev instances when not in use
   - Can stop for up to 7 days at a time

6. **Automated Backups Retention**
   - 7 days for production
   - 1 day for development
   - Reduces storage costs

### Cost Monitoring

Set up billing alerts:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name rds-monthly-cost-alert \
  --alarm-description "Alert when RDS costs exceed threshold" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

---

## Migration Checklist

Use this checklist when migrating to AWS RDS:

### Pre-Migration
- [ ] AWS account setup and permissions verified
- [ ] VPC and subnet configuration planned
- [ ] Security groups designed
- [ ] RDS instance size determined
- [ ] Backup strategy defined
- [ ] Cost estimates reviewed

### Database Setup
- [ ] RDS instance created (Terraform or Console)
- [ ] Security groups configured
- [ ] SSL certificates verified
- [ ] Connection tested from application server
- [ ] Database schema deployed
- [ ] Initial data migrated (if applicable)

### Application Configuration
- [ ] Environment variables updated
- [ ] `.env` files configured (not committed)
- [ ] SSL configuration enabled
- [ ] Connection pool settings optimized
- [ ] Secrets management implemented (if using)

### Testing
- [ ] Connection from application successful
- [ ] All CRUD operations working
- [ ] User registration and authentication tested
- [ ] Task creation, update, deletion tested
- [ ] Performance acceptable
- [ ] Error handling working

### Monitoring and Security
- [ ] CloudWatch logs enabled
- [ ] CloudWatch alarms configured
- [ ] Performance Insights enabled (production)
- [ ] Backup retention configured
- [ ] Manual snapshot taken
- [ ] Security group rules reviewed
- [ ] IAM roles configured (if using Secrets Manager)

### Documentation
- [ ] RDS endpoint documented
- [ ] Credentials stored securely
- [ ] Team trained on new setup
- [ ] Runbooks updated
- [ ] Disaster recovery plan updated

### Post-Migration
- [ ] Monitor application for 24-48 hours
- [ ] Verify backups are running
- [ ] Check CloudWatch metrics
- [ ] Test backup restore process
- [ ] Decommission old database (after validation)

---

## Additional Resources

### AWS Documentation
- [Amazon RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.Security.html)
- [RDS Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html)

### Terraform Resources
- [Terraform AWS Provider - RDS](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

### PostgreSQL Resources
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)

### Monitoring and Observability
- [CloudWatch Logs Insights Queries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [RDS Performance Insights Guide](https://aws.amazon.com/blogs/database/optimizing-and-tuning-queries-in-amazon-rds-postgresql-based-on-native-and-external-tools/)

### AWS CLI Reference
- [RDS CLI Commands](https://docs.aws.amazon.com/cli/latest/reference/rds/)
- [Secrets Manager CLI](https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/)

---

## Support and Contributions

If you encounter issues or have suggestions for improving this guide:
1. Check the troubleshooting section
2. Review AWS RDS documentation
3. Open an issue in the repository
4. Contact your DevOps/Infrastructure team

---

**Last Updated**: January 2024  
**Version**: 1.0
