# AWS Deployment Documentation

## ECR Docker Repositories

### Backend
- **Repository Name:** mshk-codetogive2025/eventmanagement-backend
- **Repository URI:** 889351697031.dkr.ecr.ap-east-1.amazonaws.com/mshk-codetogive2025/eventmanagement-backend
- **Dockerfile Location:** `backend/Dockerfile`
- **Region:** ap-east-1 (Hong Kong)
- **Image Tags:** latest, v1.0.0, development

### Frontend
- **Repository Name:** mshk-codetogive2025/eventmanagement-frontend
- **Repository URI:** 889351697031.dkr.ecr.ap-east-1.amazonaws.com/mshk-codetogive2025/eventmanagement-frontend
- **Dockerfile Location:** `frontend/Dockerfile`
- **Region:** ap-east-1 (Hong Kong)
- **Image Tags:** latest, v1.0.0, development

---

## ECS Cluster & Services

### ECS Cluster
- **Cluster Name:** zubin-eventmanagement-cluster
- **Region:** ap-east-1 (Hong Kong)
- **Launch Type:** FARGATE
- **VPC:** Default VPC or custom VPC with public/private subnets

### Backend Service
- **Service Name:** zubin-eventmanagement-backend-service
- **Task Definition:** zubin-eventmanagement-backend-task:7
- **Launch Type:** FARGATE
- **Container Port:** 3001
- **CPU:** 0.5 vCPU (512 CPU units)
- **Memory:** 1 GB
- **Desired Count:** 1
- **Minimum Count:** 1
- **Maximum Count:** 4
- **Health Check Grace Period:** 60 seconds
- **Deployment Configuration:**
  - **Maximum Percent:** 200%
  - **Minimum Healthy Percent:** 100%
  - **Deployment Circuit Breaker:** Enabled

#### Backend Environment Variables
```json
[
  {
    "name": "TWILIO_WHATSAPP_NUMBER",
    "value": "+15557515340"
  },
  {
    "name": "NODE_ENV",
    "value": "production"
  },
  {
    "name": "TWILIO_ACCOUNT_SID",
    "value": "AC79f51b2735ded76d2388685be5cfeaca"
  }
]
```

#### Backend Secrets (AWS Systems Manager Parameter Store)
```json
[
  {
    "name": "JWT_SECRET",
    "valueFrom": "/prod/eventmanagement/backend/JWT_SECRET"
  },
  {
    "name": "MONGODB_URI",
    "valueFrom": "/prod/eventmanagement/backend/MONGODB_URI"
  },
  {
    "name": "TWILIO_AUTH_TOKEN",
    "valueFrom": "/prod/eventmanagement/backend/TWILIO_AUTH_TOKEN"
  }
]
```

### Frontend Service
- **Service Name:** zubin-eventmanagement-frontend-service
- **Task Definition:** zubin-eventmanagement-frontend-task:3
- **Launch Type:** FARGATE
- **Container Port:** 80 (nginx)
- **CPU:** 0.25 vCPU (256 CPU units)
- **Memory:** 0.5 GB
- **Desired Count:** 1
- **Minimum Count:** 1
- **Maximum Count:** 4
- **Health Check Grace Period:** 60 seconds
- **Deployment Configuration:**
  - **Maximum Percent:** 200%
  - **Minimum Healthy Percent:** 100%
  - **Deployment Circuit Breaker:** Enabled

#### Frontend Environment Variables
```json
[
  {
    "name": "VITE_API_URL",
    "value": "http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com"
  }
]
```
**Note:** This environment variable needs to be updated to use HTTPS: `https://api.events.opportunitybankhk.org/api`

---

## Application Load Balancers (ALB)

### Backend ALB
- **Name:** zubin-emb-alb
- **DNS:** zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com
- **Scheme:** internet-facing
- **Type:** Application Load Balancer
- **VPC:** Same VPC as ECS cluster
- **Subnets:** Public subnets across availability zones
- **Security Groups:** 
  - **ALB Security Group:** Allows inbound HTTP (80) and HTTPS (443) from 0.0.0.0/0
  - **Backend Security Group:** Allows inbound traffic from ALB security group on port 3001

#### Backend Target Group
- **Name:** zubin-emb-tg
- **Target Type:** ip
- **Protocol:** HTTP
- **Port:** 3001
- **VPC:** Same VPC as ECS cluster
- **Health Check:**
  - **Protocol:** HTTP
  - **Path:** /api/health
  - **Port:** 3001
  - **Healthy Threshold:** 2
  - **Unhealthy Threshold:** 3
  - **Timeout:** 5 seconds
  - **Interval:** 30 seconds
  - **Success Codes:** 200

#### Backend Listener Rules
- **HTTP Listener (Port 80):**
  - **Default Action:** Redirect to HTTPS (port 443)
- **HTTPS Listener (Port 443):**
  - **Default Action:** Forward to target group `zubin-emb-tg`
  - **SSL Certificate:** ACM certificate for your domain

### Frontend ALB
- **Name:** zubin-emb-frontend-alb
- **DNS:** zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com
- **Scheme:** internet-facing
- **Type:** Application Load Balancer
- **VPC:** Same VPC as ECS cluster
- **Subnets:** Public subnets across availability zones
- **Security Groups:**
  - **ALB Security Group:** Allows inbound HTTP (80) and HTTPS (443) from 0.0.0.0/0
  - **Frontend Security Group:** Allows inbound traffic from ALB security group on port 80

#### Frontend Target Group
- **Name:** zubin-emb-frontend-tg
- **Target Type:** ip
- **Protocol:** HTTP
- **Port:** 80
- **VPC:** Same VPC as ECS cluster
- **Health Check:**
  - **Protocol:** HTTP
  - **Path:** /
  - **Port:** 80
  - **Healthy Threshold:** 2
  - **Unhealthy Threshold:** 3
  - **Timeout:** 5 seconds
  - **Interval:** 30 seconds
  - **Success Codes:** 200

#### Frontend Listener Rules
- **HTTP Listener (Port 80):**
  - **Default Action:** Redirect to HTTPS (port 443)
- **HTTPS Listener (Port 443):**
  - **Default Action:** Forward to target group `zubin-emb-frontend-tg`
  - **SSL Certificate:** ACM certificate for your domain

---

## Security Groups Configuration

### ALB Security Groups
```json
{
  "GroupName": "zubin-alb-sg",
  "Description": "Security group for Application Load Balancers",
  "VpcId": "vpc-xxxxxxxxx",
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    },
    {
      "IpProtocol": "tcp",
      "FromPort": 443,
      "ToPort": 443,
      "IpRanges": [{"CidrIp": "0.0.0.0/0"}]
    }
  ]
}
```

### Backend Service Security Group
```json
{
  "GroupName": "zubin-backend-sg",
  "Description": "Security group for backend ECS service",
  "VpcId": "vpc-xxxxxxxxx",
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 3001,
      "ToPort": 3001,
      "UserIdGroupPairs": [{"GroupId": "sg-alb-xxxxxxxxx"}]
    }
  ]
}
```

### Frontend Service Security Group
```json
{
  "GroupName": "zubin-frontend-sg",
  "Description": "Security group for frontend ECS service",
  "VpcId": "vpc-xxxxxxxxx",
  "IpPermissions": [
    {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "UserIdGroupPairs": [{"GroupId": "sg-alb-xxxxxxxxx"}]
    }
  ]
}
```

---

## Backend Health Endpoints

- **API Health:**
  - `GET /api/health`
  - Returns API status, timestamp, uptime, environment, and version.
- **Database Health:**
  - `GET /api/health/db`
  - Returns MongoDB connection status, ping result, and timestamp.

---

## Frontend Access

- **HTTP URL:** http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com
- **HTTPS URL:** https://events.opportunitybankhk.org ✅ **ENABLED**
- **Container Port:** 80 (nginx)
- **Health Check Path:** /

## Backend Access

- **HTTP URL:** http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com
- **HTTPS URL:** https://api.events.opportunitybankhk.org ✅ **ENABLED**
- **Container Port:** 3001
- **Health Check Path:** /api/health

## HTTPS Configuration Status

### ✅ **Frontend HTTPS - COMPLETED**
- **Domain:** `events.opportunitybankhk.org`
- **SSL Certificate:** Issued and valid
- **ALB Listener:** HTTPS (443) configured
- **HTTP Redirect:** HTTP (80) → HTTPS (443)

### ✅ **Backend HTTPS - COMPLETED**
- **Domain:** `api.events.opportunitybankhk.org`
- **SSL Certificate:** Issued and valid
- **ALB Listener:** HTTPS (443) configured
- **HTTP Redirect:** HTTP (3001) → HTTPS (443)

### ⚠️ **Required Action - Frontend Environment Variable Update**
The frontend service currently has this environment variable:
```json
{
  "name": "VITE_API_URL",
  "value": "http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com"
}
```

**This needs to be updated to:**
```json
{
  "name": "VITE_API_URL",
  "value": "https://api.events.opportunitybankhk.org/api"
}
```

**Why this change is needed:**
- Frontend is now served over HTTPS (`https://events.opportunitybankhk.org`)
- Backend API calls are still using HTTP URLs
- Browsers block mixed content (HTTPS page making HTTP requests)
- This causes API calls to fail with "Mixed Content" errors

---

## HTTPS Configuration Requirements

### SSL Certificate (ACM)
- **Certificate Type:** Request a public certificate
- **Domain Name:** Your custom domain (e.g., events.zubinfoundation.org)
- **Validation Method:** DNS validation (recommended) or email validation
- **Region:** ap-east-1 (Hong Kong)

### Route 53 Configuration
- **Hosted Zone:** Create or use existing hosted zone for your domain
- **A Record:** Point to frontend ALB
- **CNAME Record:** Point to backend ALB (if needed)

### Load Balancer HTTPS Configuration
1. **Upload SSL Certificate** to ACM in ap-east-1 region
2. **Configure HTTPS Listeners** on both ALBs (port 443)
3. **Set Default Actions** to forward to respective target groups
4. **Configure HTTP to HTTPS Redirect** on port 80 listeners

---

## Monitoring & Logging

### CloudWatch Metrics
- **ALB Metrics:** Request count, target response time, healthy host count
- **ECS Metrics:** CPU utilization, memory utilization, running task count
- **Target Group Metrics:** Healthy/unhealthy target count, target response time

### CloudWatch Logs
- **ALB Access Logs:** Enable access logging to S3 bucket
- **ECS Task Logs:** Application logs via CloudWatch Logs
- **VPC Flow Logs:** Network traffic monitoring

---

## Cost Optimization

### ECS Service Scaling
- **Target Tracking:** Scale based on CPU utilization (target: 70%)
- **Step Scaling:** Scale based on custom CloudWatch alarms
- **Scheduled Scaling:** Scale down during off-hours

### ALB Optimization
- **Idle Timeout:** Set to 60 seconds for better resource utilization
- **Connection Draining:** Enable for graceful shutdown
- **Cross-Zone Load Balancing:** Enable for better availability

---

For further details, see the exported AWS CLI JSON files or the GitHub Actions workflow in `.github/workflows/deploy.yml`.
