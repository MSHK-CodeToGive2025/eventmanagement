# AWS Deployment Documentation

## ECR Docker Repositories

### Backend
- **Repository Name:** mshk-codetogive2025/eventmanagement-backend
- **Repository URI:** 889351697031.dkr.ecr.ap-east-1.amazonaws.com/mshk-codetogive2025/eventmanagement-backend
- **Dockerfile Location:** `backend/Dockerfile`

### Frontend
- **Repository Name:** mshk-codetogive2025/eventmanagement-frontend
- **Repository URI:** 889351697031.dkr.ecr.ap-east-1.amazonaws.com/mshk-codetogive2025/eventmanagement-frontend
- **Dockerfile Location:** `frontend/Dockerfile`

---

## ECS Cluster & Services

- **ECS Cluster:** zubin-eventmanagement-cluster

### Services
- **Backend Service:** zubin-eventmanagement-backend-service
  - **Task Definition:** zubin-eventmanagement-backend-task
  - **Launch Type:** FARGATE
  - **Container Port:** 3001
  - **ALB Target Group:** zubin-emb-tg
- **Frontend Service:** zubin-eventmanagement-frontend-service
  - **Task Definition:** zubin-eventmanagement-frontend-task
  - **Launch Type:** FARGATE

---

## Application Load Balancers (ALB)

- **Backend ALB:**
  - **Name:** zubin-emb-alb
  - **DNS:** zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com
- **Frontend ALB:**
  - **Name:** zubin-emb-frontend-alb
  - **DNS:** zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com

---

## Backend Health Endpoints

- **API Health:**
  - `GET /api/health`
  - Returns API status, timestamp, uptime, environment, and version.
- **Database Health:**
  - `GET /api/health/db`
  - Returns MongoDB connection status, ping result, and timestamp.

## Frontend

http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com

---

For further details, see the exported AWS CLI JSON files or the GitHub Actions workflow in `.github/workflows/deploy.yml`.
