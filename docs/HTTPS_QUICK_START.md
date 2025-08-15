# HTTPS Quick Start Guide

**Domain:** `events.opportunitybankhk.org`  
**Current:** `http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com/`  
**Target:** `https://events.opportunitybankhk.org/`

## 🚀 Quick Setup Options

### Option 1: AWS Console (Manual - 15-20 minutes)
1. **Create SSL Certificate** in ACM (ap-east-1)
2. **Add DNS validation records** to Route 53
3. **Configure ALB listeners** for HTTPS
4. **Create A record** for subdomain

### Option 2: AWS CLI Script (Automated - 5-10 minutes)
1. **Run the setup script:** `./scripts/aws-https-setup.sh`
2. **Add DNS validation records** when prompted
3. **Wait for certificate validation**

### Option 3: Terraform (Infrastructure as Code - 10-15 minutes)
1. **Initialize Terraform:** `terraform init`
2. **Plan changes:** `terraform plan`
3. **Apply configuration:** `terraform apply`

## 📋 Prerequisites

- ✅ AWS CLI configured with appropriate permissions
- ✅ Domain ownership verified (`opportunitybankhk.org`)
- ✅ ECS and ALB infrastructure running
- ✅ Access to Route 53 or external DNS provider

## 🔧 Required AWS Services

| Service | Purpose | Cost |
|---------|---------|------|
| **ACM** | SSL Certificate | Free (public domains) |
| **Route 53** | DNS Management | $0.50/month + $0.40/million queries |
| **ALB** | HTTPS Termination | No additional cost |
| **CloudWatch** | Monitoring | Pay per metric |

## 📝 Step-by-Step Manual Setup

### Step 1: Create SSL Certificate
1. Go to **AWS Certificate Manager** (ap-east-1)
2. Click **"Request a certificate"**
3. Enter domain: `events.opportunitybankhk.org`
4. Choose **DNS validation**
5. Add tags: Environment=Production, Project=ZubinEventManagement

### Step 2: Add DNS Validation Records
1. Copy the CNAME validation record from ACM
2. Add to Route 53 hosted zone for `opportunitybankhk.org`
3. Wait for certificate to be issued (5-30 minutes)

### Step 3: Configure ALB HTTPS Listener
1. Go to **EC2 → Load Balancers**
2. Select `zubin-emb-frontend-alb`
3. Click **"Listeners"** tab
4. Click **"Add listener"**
5. Configure:
   - **Protocol:** HTTPS
   - **Port:** 443
   - **Default action:** Forward to `zubin-emb-frontend-tg`
   - **SSL Certificate:** Select your ACM certificate

### Step 4: Configure HTTP to HTTPS Redirect
1. Edit the existing HTTP listener (port 80)
2. Change default action to **Redirect**
3. Configure redirect:
   - **Protocol:** HTTPS
   - **Port:** 443
   - **Status Code:** HTTP_301

### Step 5: Create DNS A Record
1. Go to **Route 53 → Hosted Zones**
2. Select `opportunitybankhk.org`
3. Click **"Create Record"**
4. Configure:
   - **Record Type:** A
   - **Record Name:** events
   - **Alias:** Yes
   - **Alias Target:** Application and Classic Load Balancer
   - **Region:** ap-east-1
   - **Load Balancer:** `zubin-emb-frontend-alb`

## 🧪 Testing Your Setup

### Test Commands
```bash
# Test DNS resolution
nslookup events.opportunitybankhk.org

# Test HTTPS access
curl -I https://events.opportunitybankhk.org

# Test HTTP redirect
curl -I http://events.opportunitybankhk.org
```

### Expected Results
- ✅ `https://events.opportunitybankhk.org/` → Returns 200 OK
- ✅ `http://events.opportunitybankhk.org/` → Redirects to HTTPS (301)
- ✅ SSL certificate shows as valid in browser

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **Certificate not issued** | DNS validation failed | Check CNAME records in Route 53 |
| **HTTPS not working** | Listener not configured | Verify HTTPS listener on port 443 |
| **HTTP not redirecting** | Redirect not configured | Update HTTP listener default action |
| **Domain not resolving** | A record missing | Create A record pointing to ALB |

## 📊 Monitoring & Alerts

### CloudWatch Alarms to Set
1. **HTTPS Error Rate** (5XX errors > 10 in 5 minutes)
2. **Certificate Expiry** (expires in < 30 days)
3. **ALB Health** (unhealthy targets > 0)

### Health Check Updates
Update target group health check to use HTTPS:
- **Protocol:** HTTPS
- **Path:** /
- **Port:** 443
- **Success Codes:** 200

## 💰 Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **SSL Certificate** | $0.00 | Free for public domains |
| **Route 53 Hosted Zone** | $0.50 | One-time per domain |
| **Route 53 Queries** | $0.40/million | Based on traffic |
| **ALB HTTPS** | $0.00 | No additional cost |
| **CloudWatch** | $0.50-2.00 | Based on metrics |

**Total Estimated Cost:** $1.00-3.00/month

## 🔒 Security Best Practices

1. **Use DNS validation** instead of email validation
2. **Enable automatic certificate renewal**
3. **Monitor certificate expiration** with CloudWatch alarms
4. **Use strong TLS policies** (TLS 1.2+)
5. **Implement security headers** in your application

## 📚 Additional Resources

- [Complete HTTPS Guide](HTTPS_ENABLEMENT_GUIDE.md)
- [AWS Documentation](AWS.md)
- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- [AWS CLI Script](../scripts/aws-https-setup.sh)
- [Terraform Configuration](../terraform/https-config.tf)

## 🆘 Need Help?

1. **Check the troubleshooting section** in the complete guide
2. **Review AWS CloudTrail logs** for API errors
3. **Verify security group configurations**
4. **Contact AWS Support** if issues persist

---

**Ready to enable HTTPS?** Choose your preferred method above and follow the steps!
