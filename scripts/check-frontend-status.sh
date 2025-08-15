#!/bin/bash

# Frontend Status Check Script
# This script checks the current status of the frontend service and deployment

set -e

# Configuration
REGION="ap-east-1"
CLUSTER_NAME="zubin-eventmanagement-cluster"
SERVICE_NAME="zubin-eventmanagement-frontend-service"
TASK_FAMILY="zubin-eventmanagement-frontend-task"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔍 Frontend Service Status Check"
echo "================================="

# Check service status
log_info "Checking ECS service status..."
SERVICE_STATUS=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].status' \
    --output text)

log_info "Service Status: $SERVICE_STATUS"

# Check current task definition
log_info "Checking current task definition..."
CURRENT_TASK_DEF=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].taskDefinition' \
    --output text)

TASK_REVISION=$(echo $CURRENT_TASK_DEF | grep -o '[0-9]*$')
log_info "Current Task Definition: $TASK_REVISION"

# Check deployment status
log_info "Checking deployment status..."
DEPLOYMENT_STATUS=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].deployments[0].rolloutState' \
    --output text)

RUNNING_COUNT=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].deployments[0].runningCount' \
    --output text)

DESIRED_COUNT=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].deployments[0].desiredCount' \
    --output text)

log_info "Deployment Status: $DEPLOYMENT_STATUS"
log_info "Running Count: $RUNNING_COUNT/$DESIRED_COUNT"

# Check environment variables in current task definition
log_info "Checking environment variables in task definition $TASK_REVISION..."
ENV_VARS=$(aws ecs describe-task-definition \
    --task-definition $TASK_FAMILY:$TASK_REVISION \
    --region $REGION \
    --query 'taskDefinition.containerDefinitions[0].environment' \
    --output json)

echo "Environment Variables:"
echo "$ENV_VARS" | jq '.'

# Check if there are any running tasks
log_info "Checking running tasks..."
TASK_ARN=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --region $REGION \
    --query 'taskArns[0]' \
    --output text)

if [ "$TASK_ARN" != "None" ] && [ -n "$TASK_ARN" ]; then
    log_info "Found running task: $TASK_ARN"
    
    TASK_STATUS=$(aws ecs describe-tasks \
        --cluster $CLUSTER_NAME \
        --tasks $TASK_ARN \
        --region $REGION \
        --query 'tasks[0].lastStatus' \
        --output text)
    
    log_info "Task Status: $TASK_STATUS"
else
    log_warning "No running tasks found"
fi

echo
echo "🌐 Frontend Access URLs:"
echo "HTTPS: https://events.opportunitybankhk.org"
echo "HTTP:  http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com"

echo
echo "🔧 Next Steps:"
if [ "$DEPLOYMENT_STATUS" = "COMPLETED" ]; then
    log_success "Service is running normally"
    log_info "If you still see mixed content errors, run: ./scripts/fix-frontend-https.sh"
else
    log_warning "Service deployment is in progress or has issues"
    log_info "Wait for deployment to complete, then test the frontend"
fi
