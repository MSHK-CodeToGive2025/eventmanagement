# HTTPS Enablement Guide for Frontend

**Domain:** `events.opportunitybankhk.org`  
**Current URL:** `http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com/`  
**Target URL:** `https://events.opportunitybankhk.org/`

## Overview

This guide provides step-by-step instructions to enable HTTPS on your frontend by:
1. Creating an SSL certificate in AWS Certificate Manager (ACM)
2. Configuring Route 53 for domain management
3. Updating the frontend Application Load Balancer (ALB)
4. Testing the HTTPS configuration

## Prerequisites

- AWS account with appropriate permissions
- Domain ownership verification for `opportunitybankhk.org`
- Access to domain DNS management (Route 53 or external DNS provider)
- Current ECS and ALB infrastructure running

## Step 1: Create SSL Certificate in ACM

### 1.1 Navigate to AWS Certificate Manager
- **Region:** ap-east-1 (Hong Kong)
- **Service:** Certificate Manager
- **Action:** Request a certificate

### 1.2 Certificate Configuration
```yaml
Certificate Type: Request a public certificate
Domain Names:
  - events.opportunitybankhk.org
  - *.events.opportunitybankhk.org (optional wildcard)
Validation Method: DNS validation (recommended)
Tags:
  - Key: Environment
    Value: Production
  - Key: Project
    Value: ZubinEventManagement
```

### 1.3 DNS Validation
After creating the certificate, you'll receive DNS validation records:
```yaml
Type: CNAME
Name: _validation_hash.opportunitybankhk.org
Value: _validation_hash.acm-validations.aws
TTL: 300
```

**Important:** Add this CNAME record to your DNS provider (Route 53 or external) to validate the certificate.

## Step 2: Route 53 Configuration

### 2.1 Create/Use Hosted Zone
- **Domain:** opportunitybankhk.org
- **Type:** Public hosted zone
- **Region:** Global (Route 53 is global)

### 2.2 Create Subdomain A Record
```yaml
Record Type: A
Record Name: events
Record Value: zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com
Alias: Yes
Alias Target: Application and Classic Load Balancer
Region: ap-east-1
Load Balancer: zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com
TTL: 300
Routing Policy: Simple routing
```

### 2.3 Verify DNS Propagation
Use online tools to verify DNS propagation:
- `nslookup events.opportunitybankhk.org`
- `dig events.opportunitybankhk.org`
- `ping events.opportunitybankhk.org`

## Step 3: Update Frontend ALB Configuration

### 3.1 Configure HTTPS Listener
- **ALB:** zubin-emb-frontend-alb
- **Listener:** Port 443 (HTTPS)
- **Protocol:** HTTPS
- **Default Action:** Forward to `zubin-emb-frontend-tg`
- **SSL Certificate:** Select the ACM certificate for `events.opportunitybankhk.org`

### 3.2 Configure HTTP to HTTPS Redirect
- **ALB:** zubin-emb-frontend-alb
- **Listener:** Port 80 (HTTP)
- **Default Action:** Redirect to HTTPS
- **Redirect Target:** Port 443
- **Protocol:** HTTPS
- **Host:** #{host}
- **Path:** /#{path}
- **Query:** #{query}
- **Status Code:** HTTP_301

### 3.3 Security Group Updates
Ensure the ALB security group allows:
- **Inbound HTTP (80):** 0.0.0.0/0
- **Inbound HTTPS (443):** 0.0.0.0/0

## Step 4: Update Frontend Service Configuration

### 4.1 ECS Task Definition Update
Update the frontend task definition to handle HTTPS:
```json
{
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "889351697031.dkr.ecr.ap-east-1.amazonaws.com/mshk-codetogive2025/eventmanagement-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

### 4.2 Nginx Configuration (if needed)
Ensure your nginx configuration handles HTTPS properly:
```nginx
server {
    listen 80;
    server_name events.opportunitybankhk.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 80;
    server_name _;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

## Step 5: Testing and Verification

### 5.1 Certificate Validation
- Check ACM certificate status: "Issued" or "Pending validation"
- Verify DNS validation records are properly configured
- Wait for certificate to be issued (usually 5-30 minutes)

### 5.2 HTTPS Access Test
Test the following URLs:
- ✅ `https://events.opportunitybankhk.org/` (should work)
- ✅ `http://events.opportunitybankhk.org/` (should redirect to HTTPS)
- ✅ `https://events.opportunitybankhk.org/health` (health check)

### 5.3 SSL/TLS Configuration
Verify SSL configuration:
- **SSL Labs Test:** https://www.ssllabs.com/ssltest/
- **Browser Security:** Check for security warnings
- **Certificate Details:** Verify issuer and expiration date

## Step 6: Monitoring and Maintenance

### 6.1 CloudWatch Monitoring
Set up CloudWatch alarms for:
- **HTTPS Error Rate:** Monitor 4xx and 5xx errors
- **Certificate Expiration:** Alert 30 days before expiration
- **ALB Health:** Monitor target group health

### 6.2 Certificate Renewal
- **Automatic Renewal:** ACM automatically renews certificates
- **Manual Check:** Verify renewal status quarterly
- **DNS Validation:** Ensure DNS records remain valid

### 6.3 Health Checks
Update health check configuration:
```yaml
Protocol: HTTPS
Path: /
Port: 443
Healthy Threshold: 2
Unhealthy Threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
Success Codes: 200
```

## Troubleshooting

### Common Issues

#### 1. Certificate Validation Failed
- **Cause:** DNS validation records not properly configured
- **Solution:** Verify CNAME records in Route 53 or external DNS
- **Check:** DNS propagation using online tools

#### 2. HTTPS Not Working
- **Cause:** ALB listener not configured for HTTPS
- **Solution:** Verify HTTPS listener (port 443) configuration
- **Check:** Security group allows inbound HTTPS traffic

#### 3. HTTP to HTTPS Redirect Not Working
- **Cause:** HTTP listener not configured for redirect
- **Solution:** Configure HTTP listener to redirect to HTTPS
- **Check:** Listener rules and default actions

#### 4. Domain Not Resolving
- **Cause:** Route 53 A record not configured
- **Solution:** Create A record pointing to ALB
- **Check:** DNS propagation and ALB health

### Debugging Commands

#### Check Certificate Status
```bash
aws acm list-certificates --region ap-east-1
aws acm describe-certificate --certificate-arn arn:aws:acm:ap-east-1:ACCOUNT:certificate/CERT-ID --region ap-east-1
```

#### Check ALB Listeners
```bash
aws elbv2 describe-listeners --load-balancer-arn arn:aws:elasticloadbalancing:ap-east-1:ACCOUNT:loadbalancer/app/ALB-NAME/ID --region ap-east-1
```

#### Check Route 53 Records
```bash
aws route53 list-hosted-zones
aws route53 list-resource-record-sets --hosted-zone-id ZONE-ID
```

## Cost Considerations

### ACM Certificate
- **Public Certificate:** Free for public domains
- **Private Certificate:** $400/month per certificate
- **Validation:** Free for DNS validation

### Route 53
- **Hosted Zone:** $0.50/month per hosted zone
- **A Record:** $0.40/month per million queries
- **Alias Records:** No additional cost

### ALB
- **HTTPS Listener:** No additional cost
- **Data Processing:** $0.006 per LCU-hour
- **Request Count:** $0.006 per request

## Security Best Practices

### 1. Certificate Management
- Use DNS validation instead of email validation
- Enable automatic certificate renewal
- Monitor certificate expiration dates

### 2. Security Headers
Configure security headers in your application:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### 3. TLS Configuration
- Use TLS 1.2 or higher
- Disable weak cipher suites
- Enable perfect forward secrecy

## Next Steps

After HTTPS is enabled:

1. **Update Application URLs:** Change any hardcoded HTTP URLs to HTTPS
2. **Configure CDN:** Consider using CloudFront for global content delivery
3. **Enable HSTS:** Implement HTTP Strict Transport Security
4. **Monitor Performance:** Track HTTPS performance metrics
5. **Security Audit:** Regular security assessments and penetration testing

## Support and Resources

- **AWS Documentation:** [ACM User Guide](https://docs.aws.amazon.com/acm/)
- **Route 53 Documentation:** [Route 53 Developer Guide](https://docs.aws.amazon.com/Route53/)
- **ALB Documentation:** [Application Load Balancer User Guide](https://docs.aws.amazon.com/elasticloadbalancing/)
- **AWS Support:** Contact AWS support for technical assistance

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Author:** Zubin Foundation Development Team
