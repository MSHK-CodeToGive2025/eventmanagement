# HTTPS Configuration for Zubin Foundation Event Management
# Domain: events.opportunitybankhk.org
# Region: ap-east-1 (Hong Kong)

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-east-1"
}

# Data sources for existing resources
data "aws_lb" "frontend" {
  name = "zubin-emb-frontend-alb"
}

data "aws_lb_target_group" "frontend" {
  name = "zubin-emb-frontend-tg"
}

# SSL Certificate
resource "aws_acm_certificate" "frontend" {
  domain_name       = "events.opportunitybankhk.org"
  validation_method = "DNS"

  tags = {
    Environment = "Production"
    Project     = "ZubinEventManagement"
    Name        = "events-opportunitybankhk-org"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 Hosted Zone (if not exists)
data "aws_route53_zone" "parent" {
  name = "opportunitybankhk.org"
}

# Route 53 A Record for subdomain
resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.parent.zone_id
  name    = "events.opportunitybankhk.org"
  type    = "A"

  alias {
    name                   = data.aws_lb.frontend.dns_name
    zone_id                = data.aws_lb.frontend.zone_id
    evaluate_target_health = true
  }
}

# DNS Validation Records
resource "aws_route53_record" "validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.parent.zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "frontend" {
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

# HTTPS Listener
resource "aws_lb_listener" "frontend_https" {
  load_balancer_arn = data.aws_lb.frontend.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.frontend.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = data.aws_lb_target_group.frontend.arn
  }

  depends_on = [aws_acm_certificate_validation.frontend]
}

# HTTP to HTTPS Redirect Listener
resource "aws_lb_listener" "frontend_http_redirect" {
  load_balancer_arn = data.aws_lb.frontend.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Security Group for ALB (if needed)
resource "aws_security_group" "alb" {
  name        = "zubin-frontend-alb-https-sg"
  description = "Security group for frontend ALB with HTTPS support"
  vpc_id      = data.aws_lb.frontend.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "zubin-frontend-alb-https-sg"
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "https_errors" {
  alarm_name          = "zubin-frontend-https-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors HTTPS 5XX errors on frontend ALB"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    LoadBalancer = data.aws_lb.frontend.arn_suffix
    TargetGroup  = data.aws_lb_target_group.frontend.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "certificate_expiry" {
  alarm_name          = "zubin-frontend-certificate-expiry"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DaysToExpiry"
  namespace           = "AWS/CertificateManager"
  period              = "86400" # 24 hours
  statistic           = "Minimum"
  threshold           = "30"
  alarm_description   = "This metric monitors SSL certificate expiration (30 days warning)"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    CertificateArn = aws_acm_certificate.frontend.arn
  }
}

# Outputs
output "certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = aws_acm_certificate.frontend.arn
}

output "certificate_validation_arn" {
  description = "ARN of the validated SSL certificate"
  value       = aws_acm_certificate_validation.frontend.certificate_arn
}

output "frontend_domain" {
  description = "Frontend domain name"
  value       = aws_route53_record.frontend.name
}

output "frontend_url" {
  description = "Frontend HTTPS URL"
  value       = "https://${aws_route53_record.frontend.name}"
}

output "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = data.aws_route53_zone.parent.zone_id
}

output "alb_dns_name" {
  description = "Frontend ALB DNS name"
  value       = data.aws_lb.frontend.dns_name
}

output "https_listener_arn" {
  description = "HTTPS listener ARN"
  value       = aws_lb_listener.frontend_https.arn
}

output "http_redirect_listener_arn" {
  description = "HTTP redirect listener ARN"
  value       = aws_lb_listener.frontend_http_redirect.arn
}
