#!/bin/bash

# Frontend HTTPS Fix Automation Script
# This script rebuilds the frontend Docker image with the correct VITE_API_URL
# and redeploys it to ECS to resolve mixed content issues.

set -e  # Exit on any error

# Configuration
REGION="ap-east-1"
ACCOUNT_ID="889351697031"
ECR_REPO="mshk-codetogive2025/eventmanagement-frontend"
CLUSTER_NAME="zubin-eventmanagement-cluster"
SERVICE_NAME="zubin-eventmanagement-frontend-service"
TASK_FAMILY="zubin-eventmanagement-frontend-task"
NEW_VITE_API_URL="https://api.events.opportunitybankhk.org/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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
        --output json > current-task-definition.json
    
    log_success "Current task definition saved to current-task-definition.json"
}

# Rebuild Docker image
rebuild_docker_image() {
    log_info "Rebuilding Docker image with new VITE_API_URL..."
    
    cd frontend
    
    # Build the new image
    if docker build \
        --build-arg VITE_API_URL="$NEW_VITE_API_URL" \
        -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest .; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Push image to ECR
push_to_ecr() {
    log_info "Pushing Docker image to ECR..."
    
    if docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest; then
        log_success "Docker image pushed to ECR successfully"
    else
        log_error "Failed to push Docker image to ECR"
        exit 1
    fi
}

# Create new task definition revision
create_new_task_definition() {
    log_info "Creating new task definition revision..."
    
    # Clean up the task definition JSON (remove fields that can't be used for registration)
    jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)' \
        current-task-definition.json > new-task-definition.json
    
    # Register the new task definition
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
        --cli-input-json file://new-task-definition.json \
        --region $REGION \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    if [ -z "$NEW_TASK_DEF_ARN" ]; then
        log_error "Failed to create new task definition"
        exit 1
    fi
    
    # Extract new revision number
    NEW_REVISION=$(echo $NEW_TASK_DEF_ARN | grep -o '[0-9]*$')
    log_success "New task definition created: revision $NEW_REVISION"
    
    # Clean up temporary files
    rm current-task-definition.json new-task-definition.json
}

# Update ECS service
update_ecs_service() {
    log_info "Updating ECS service to use new task definition..."
    
    if aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_FAMILY:$NEW_REVISION \
        --region $REGION >/dev/null; then
        log_success "ECS service updated successfully"
    else
        log_error "Failed to update ECS service"
        exit 1
    fi
}

# Monitor deployment
monitor_deployment() {
    log_info "Monitoring deployment progress..."
    
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
            log_success "Deployment completed successfully!"
            break
        elif [ "$DEPLOYMENT_STATUS" = "FAILED" ]; then
            log_error "Deployment failed!"
            exit 1
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Deployment monitoring timeout. Please check manually."
            break
        fi
        
        attempt=$((attempt + 1))
        sleep 30
    done
}

# Test the frontend
test_frontend() {
    log_info "Testing frontend HTTPS access..."
    
    # Wait a bit for the service to stabilize
    sleep 10
    
    # Test the frontend
    if curl -s "https://events.opportunitybankhk.org" >/dev/null; then
        log_success "Frontend is accessible via HTTPS"
    else
        log_warning "Frontend HTTPS test failed - this might be normal during deployment"
    fi
    
    log_info "Please test the frontend manually in your browser to verify mixed content errors are resolved."
}

# Main execution
main() {
    log_info "Starting Frontend HTTPS Fix Automation..."
    log_info "This will rebuild the Docker image and redeploy to resolve mixed content issues."
    echo
    
    check_prerequisites
    login_to_ecr
    get_current_task_definition
    rebuild_docker_image
    push_to_ecr
    create_new_task_definition
    update_ecs_service
    monitor_deployment
    test_frontend
    
    echo
    log_success "Frontend HTTPS fix automation completed!"
    log_info "The frontend should now use HTTPS for all API calls."
    log_info "Please test in your browser to confirm mixed content errors are resolved."
}

# Run the script
main "$@"
