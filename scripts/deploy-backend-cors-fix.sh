#!/bin/bash

# Backend CORS Fix Deployment Script
# This script deploys the updated CORS configuration to resolve CORS issues

set -e

# Configuration
REGION="ap-east-1"
ACCOUNT_ID="889351697031"
ECR_REPO="mshk-codetogive2025/eventmanagement-backend"
CLUSTER_NAME="zubin-eventmanagement-cluster"
SERVICE_NAME="zubin-eventmanagement-backend-service"
TASK_FAMILY="zubin-eventmanagement-backend-task"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq >/dev/null 2>&1; then
        log_error "jq is not installed. Please install jq first."
        exit 1
    fi
    
    log_success "All prerequisites are met!"
}

# Login to ECR
login_to_ecr() {
    log_info "Logging in to ECR..."
    
    if aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com; then
        log_success "Successfully logged in to ECR"
    else
        log_error "Failed to login to ECR"
        exit 1
    fi
}

# Get current task definition
get_current_task_definition() {
    log_info "Getting current task definition..."
    
    # Get the current task definition ARN
    CURRENT_TASK_DEF_ARN=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].taskDefinition' \
        --output text)
    
    if [ -z "$CURRENT_TASK_DEF_ARN" ]; then
        log_error "Failed to get current task definition ARN"
        exit 1
    fi
    
    # Extract revision number
    CURRENT_REVISION=$(echo $CURRENT_TASK_DEF_ARN | grep -o '[0-9]*$')
    log_info "Current task definition revision: $CURRENT_REVISION"
    
    # Get the full task definition
    aws ecs describe-task-definition \
        --task-definition $TASK_FAMILY:$CURRENT_REVISION \
        --region $REGION \
        --query 'taskDefinition' \
        --output json > current-backend-task-definition.json
    
    log_success "Current task definition saved to current-backend-task-definition.json"
}

# Rebuild Docker image
rebuild_docker_image() {
    log_info "Rebuilding backend Docker image with updated CORS configuration..."
    
    cd backend
    
    # Build the new image
    if docker build \
        --platform linux/amd64 \
        -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest .; then
        log_success "Backend Docker image built successfully"
    else
        log_error "Failed to build backend Docker image"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Push image to ECR
push_to_ecr() {
    log_info "Pushing backend Docker image to ECR..."
    
    if docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest; then
        log_success "Backend Docker image pushed to ECR successfully"
    else
        log_error "Failed to push backend Docker image to ECR"
        exit 1
    fi
}

# Create new task definition revision
create_new_task_definition() {
    log_info "Creating new backend task definition revision..."
    
    # Clean up the task definition JSON (remove fields that can't be used for registration)
    jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)' \
        current-backend-task-definition.json > new-backend-task-definition.json
    
    # Register the new task definition
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
        --cli-input-json file://new-backend-task-definition.json \
        --region $REGION \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    if [ -z "$NEW_TASK_DEF_ARN" ]; then
        log_error "Failed to create new backend task definition"
        exit 1
    fi
    
    # Extract new revision number
    NEW_REVISION=$(echo $NEW_TASK_DEF_ARN | grep -o '[0-9]*$')
    log_success "New backend task definition created: revision $NEW_REVISION"
    
    # Clean up temporary files
    rm current-backend-task-definition.json new-backend-task-definition.json
}

# Update ECS service
update_ecs_service() {
    log_info "Updating backend ECS service to use new task definition..."
    
    if aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_FAMILY:$NEW_REVISION \
        --region $REGION >/dev/null; then
        log_success "Backend ECS service updated successfully"
    else
        log_error "Failed to update backend ECS service"
        exit 1
    fi
}

# Monitor deployment
monitor_deployment() {
    log_info "Monitoring backend deployment progress..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Checking deployment status (attempt $attempt/$max_attempts)..."
        
        # Get deployment status
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
        
        log_info "Deployment Status: $DEPLOYMENT_STATUS, Running: $RUNNING_COUNT/$DESIRED_COUNT"
        
        if [ "$DEPLOYMENT_STATUS" = "COMPLETED" ]; then
            log_success "Backend deployment completed successfully!"
            break
        elif [ "$DEPLOYMENT_STATUS" = "FAILED" ]; then
            log_error "Backend deployment failed!"
            exit 1
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Backend deployment monitoring timeout. Please check manually."
            break
        fi
        
        attempt=$((attempt + 1))
        sleep 30
    done
}

# Test the backend
test_backend() {
    log_info "Testing backend CORS configuration..."
    
    # Wait a bit for the service to stabilize
    sleep 10
    
    # Test CORS preflight request
    log_info "Testing CORS preflight request..."
    if curl -s -X OPTIONS \
        -H "Origin: https://events.opportunitybankhk.org" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "https://api.events.opportunitybankhk.org/api/events/public-nonexpired" \
        -w "%{http_code}" | grep -q "204\|200"; then
        log_success "CORS preflight request successful"
    else
        log_warning "CORS preflight request failed - this might be normal during deployment"
    fi
    
    log_info "Please test the frontend manually to verify CORS issues are resolved."
}

# Main execution
main() {
    log_info "Starting Backend CORS Fix Deployment..."
    log_info "This will deploy the updated CORS configuration to resolve CORS issues."
    echo
    
    check_prerequisites
    login_to_ecr
    get_current_task_definition
    rebuild_docker_image
    push_to_ecr
    create_new_task_definition
    update_ecs_service
    monitor_deployment
    test_backend
    
    echo
    log_success "Backend CORS fix deployment completed!"
    log_info "The backend should now allow requests from the frontend domain."
    log_info "Please test in your browser to confirm CORS issues are resolved."
}

# Run the script
main "$@"
