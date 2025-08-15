#!/bin/bash

# AWS HTTPS Setup Script for Zubin Foundation Event Management
# Domain: events.opportunitybankhk.org
# Region: ap-east-1 (Hong Kong)

set -e

# Configuration
DOMAIN="events.opportunitybankhk.org"
PARENT_DOMAIN="opportunitybankhk.org"
REGION="ap-east-1"
FRONTEND_ALB_NAME="zubin-events-alb"
FRONTEND_TARGET_GROUP="frontend-tg"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is installed and configured"
}

# Function to check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    print_success "jq is installed"
}

# Function to create SSL certificate in ACM
create_ssl_certificate() {
    print_status "Creating SSL certificate for $DOMAIN in ACM..."
    
    CERT_ARN=$(aws acm request-certificate \
        --domain-name "$DOMAIN" \
        --validation-method DNS \
        --region "$REGION" \
        --tags Key=Environment,Value=Production Key=Project,Value=ZubinEventManagement \
        --query 'CertificateArn' \
        --output text)
    
    if [ -z "$CERT_ARN" ]; then
        print_error "Failed to create SSL certificate"
        exit 1
    fi
    
    print_success "SSL certificate created with ARN: $CERT_ARN"
    
    # Wait for certificate to be ready for validation
    print_status "Waiting for certificate to be ready for validation..."
    aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region "$REGION" || true
    
    # Get validation records
    print_status "Getting DNS validation records..."
    VALIDATION_RECORDS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region "$REGION" \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
    
    echo "$VALIDATION_RECORDS" > "acm-validation-records.json"
    print_success "DNS validation records saved to acm-validation-records.json"
    
    echo "CERT_ARN=$CERT_ARN" > ".env.certificate"
    print_success "Certificate ARN saved to .env.certificate"
}

# Function to create Route 53 hosted zone
create_hosted_zone() {
    print_status "Checking if hosted zone exists for $PARENT_DOMAIN..."
    
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
        --query "HostedZones[?Name=='$PARENT_DOMAIN.'].Id" \
        --output text)
    
    if [ -z "$HOSTED_ZONE_ID" ]; then
        print_status "Creating hosted zone for $PARENT_DOMAIN..."
        HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
            --name "$PARENT_DOMAIN" \
            --caller-reference "$(date +%s)" \
            --query 'HostedZone.Id' \
            --output text)
        
        # Remove /hostedzone/ prefix
        HOSTED_ZONE_ID=${HOSTED_ZONE_ID#/hostedzone/}
        print_success "Hosted zone created with ID: $HOSTED_ZONE_ID"
    else
        # Remove /hostedzone/ prefix
        HOSTED_ZONE_ID=${HOSTED_ZONE_ID#/hostedzone/}
        print_success "Hosted zone already exists with ID: $HOSTED_ZONE_ID"
    fi
    
    echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> ".env.certificate"
}

# Function to get ALB ARN
get_alb_arn() {
    print_status "Getting ARN for ALB: $FRONTEND_ALB_NAME..."
    
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names "$FRONTEND_ALB_NAME" \
        --region "$REGION" \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)
    
    if [ -z "$ALB_ARN" ]; then
        print_error "Failed to get ALB ARN for $FRONTEND_ALB_NAME"
        exit 1
    fi
    
    print_success "ALB ARN: $ALB_ARN"
    echo "ALB_ARN=$ALB_ARN" >> ".env.certificate"
}

# Function to create DNS records
create_dns_records() {
    if [ ! -f ".env.certificate" ]; then
        print_error "Certificate environment file not found. Run certificate creation first."
        exit 1
    fi
    
    source .env.certificate
    
    print_status "Creating A record for $DOMAIN pointing to ALB..."
    
    # Get the correct hosted zone ID for the ALB
    ALB_HOSTED_ZONE_ID=$(aws elbv2 describe-load-balancers --names "$FRONTEND_ALB_NAME" --region "$REGION" --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)
    
    # Create A record alias
    cat > "route53-change-batch.json" << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "$ALB_HOSTED_ZONE_ID",
                    "DNSName": "$(aws elbv2 describe-load-balancers --names "$FRONTEND_ALB_NAME" --region "$REGION" --query 'LoadBalancers[0].DNSName' --output text)",
                    "EvaluateTargetHealth": true
                }
            }
        }
    ]
}
EOF
    
    print_status "Submitting Route 53 change batch..."
    CHANGE_ID=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch file://route53-change-batch.json \
        --query 'ChangeInfo.Id' \
        --output text)
    
    print_success "Route 53 change submitted with ID: $CHANGE_ID"
    echo "ROUTE53_CHANGE_ID=$CHANGE_ID" >> ".env.certificate"
}

# Function to configure ALB HTTPS listener
configure_alb_https() {
    if [ ! -f ".env.certificate" ]; then
        print_error "Certificate environment file not found. Run certificate creation first."
        exit 1
    fi
    
    source .env.certificate
    
    print_status "Configuring HTTPS listener on ALB..."
    
    # Create HTTPS listener
    HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
        --load-balancer-arn "$ALB_ARN" \
        --protocol HTTPS \
        --port 443 \
        --certificates CertificateArn="$CERT_ARN" \
        --default-actions Type=forward,TargetGroupArn="$(aws elbv2 describe-target-groups --names "$FRONTEND_TARGET_GROUP" --region "$REGION" --query 'TargetGroups[0].TargetGroupArn' --output text)" \
        --region "$REGION" \
        --query 'Listeners[0].ListenerArn' \
        --output text)
    
    print_success "HTTPS listener created with ARN: $HTTPS_LISTENER_ARN"
    echo "HTTPS_LISTENER_ARN=$HTTPS_LISTENER_ARN" >> ".env.certificate"
}

# Function to configure HTTP to HTTPS redirect
configure_http_redirect() {
    if [ ! -f ".env.certificate" ]; then
        print_error "Certificate environment file not found. Run certificate creation first."
        exit 1
    fi
    
    source .env.certificate
    
    print_status "Configuring HTTP to HTTPS redirect..."
    
    # Get existing HTTP listener
    HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
        --load-balancer-arn "$ALB_ARN" \
        --region "$REGION" \
        --query 'Listeners[?Port==`80`].ListenerArn' \
        --output text)
    
    if [ -n "$HTTP_LISTENER_ARN" ]; then
        # Update existing HTTP listener to redirect
        aws elbv2 modify-listener \
            --listener-arn "$HTTP_LISTENER_ARN" \
            --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,Host="#{host}",Path="#{path}",Query="#{query}",StatusCode=HTTP_301}' \
            --region "$REGION"
        
        print_success "HTTP listener updated to redirect to HTTPS"
    else
        print_warning "No HTTP listener found on port 80. Please create one manually."
    fi
}

# Function to wait for certificate validation
wait_for_certificate_validation() {
    if [ ! -f ".env.certificate" ]; then
        print_error "Certificate environment file not found. Run certificate creation first."
        exit 1
    fi
    
    source .env.certificate
    
    print_status "Waiting for SSL certificate validation..."
    print_warning "Please add the DNS validation records from acm-validation-records.json to your DNS provider"
    print_warning "Then press Enter to continue waiting for validation..."
    read -r
    
    while true; do
        CERT_STATUS=$(aws acm describe-certificate \
            --certificate-arn "$CERT_ARN" \
            --region "$REGION" \
            --query 'Certificate.Status' \
            --output text)
        
        if [ "$CERT_STATUS" = "ISSUED" ]; then
            print_success "SSL certificate is now issued and valid!"
            break
        elif [ "$CERT_STATUS" = "FAILED" ]; then
            print_error "SSL certificate validation failed. Please check DNS records."
            exit 1
        else
            print_status "Certificate status: $CERT_STATUS. Waiting..."
            sleep 30
        fi
    done
}

# Function to test HTTPS configuration
test_https_configuration() {
    print_status "Testing HTTPS configuration..."
    
    # Test DNS resolution
    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        print_success "DNS resolution working for $DOMAIN"
    else
        print_warning "DNS resolution may not be working yet. This can take up to 48 hours."
    fi
    
    # Test HTTPS access
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
        print_success "HTTPS access working for $DOMAIN"
    else
        print_warning "HTTPS access may not be working yet. Please wait for DNS propagation."
    fi
    
    print_success "HTTPS configuration test completed"
}

# Function to display summary
display_summary() {
    if [ -f ".env.certificate" ]; then
        source .env.certificate
        print_success "HTTPS Setup Summary:"
        echo "  Domain: $DOMAIN"
        echo "  Certificate ARN: $CERT_ARN"
        echo "  Hosted Zone ID: $HOSTED_ZONE_ID"
        echo "  ALB ARN: $ALB_ARN"
        echo "  HTTPS Listener ARN: $HTTPS_LISTENER_ARN"
        echo ""
        print_status "Next steps:"
        echo "  1. Add DNS validation records to your DNS provider"
        echo "  2. Wait for certificate validation (usually 5-30 minutes)"
        echo "  3. Test HTTPS access: https://$DOMAIN"
        echo "  4. Update your application to use HTTPS URLs"
    fi
}

# Main execution
main() {
    print_status "Starting AWS HTTPS setup for $DOMAIN..."
    
    # Check prerequisites
    check_aws_cli
    check_jq
    
    # Create certificate
    create_ssl_certificate
    
    # Create hosted zone
    create_hosted_zone
    
    # Get ALB ARN
    get_alb_arn
    
    # Create DNS records
    create_dns_records
    
    # Configure ALB HTTPS listener
    configure_alb_https
    
    # Configure HTTP to HTTPS redirect
    configure_http_redirect
    
    # Display summary
    display_summary
    
    print_success "HTTPS setup script completed successfully!"
    print_warning "Remember to add DNS validation records and wait for certificate validation"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
