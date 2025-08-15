# Frontend HTTPS Fix Scripts

This directory contains scripts to resolve mixed content issues by rebuilding and redeploying the frontend with the correct HTTPS backend API URL.

## 🚀 **Quick Fix Script**

### `fix-frontend-https.sh`
**Main automation script** that handles the entire process:
- Rebuilds Docker image with correct `VITE_API_URL`
- Pushes to ECR
- Creates new ECS task definition
- Updates ECS service
- Monitors deployment
- Tests frontend access

**Usage:**
```bash
./scripts/fix-frontend-https.sh
```

**Prerequisites:**
- Docker Desktop running
- AWS CLI configured
- `jq` installed
- Proper AWS permissions for ECS, ECR

## 🔍 **Status Check Script**

### `check-frontend-status.sh`
**Quick status verification** script that shows:
- Current ECS service status
- Task definition revision
- Deployment status
- Environment variables
- Running tasks

**Usage:**
```bash
./scripts/check-frontend-status.sh
```

## 🎯 **What These Scripts Fix**

### **Problem:**
- Frontend served over HTTPS: `https://events.opportunitybankhk.org/`
- Backend API calls still using HTTP: `http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com/api/*`
- Browser blocks mixed content (HTTPS page making HTTP requests)
- Results in "Mixed Content" errors in console

### **Solution:**
- Rebuild Docker image with `VITE_API_URL=https://api.events.opportunitybankhk.org/api`
- Deploy new image to ECS
- Frontend now uses HTTPS for all API calls
- Mixed content errors resolved

## 📋 **Step-by-Step Process**

1. **Check Current Status:**
   ```bash
   ./scripts/check-frontend-status.sh
   ```

2. **Run the Fix:**
   ```bash
   ./scripts/fix-frontend-https.sh
   ```

3. **Verify Fix:**
   - Check browser console for mixed content errors
   - Test frontend functionality
   - Run status check again if needed

## ⚠️ **Important Notes**

- **Docker must be running** before executing the fix script
- **Vite environment variables are processed at build time**, not runtime
- **ECS environment variable changes won't help** - the Docker image must be rebuilt
- **The process takes 5-10 minutes** to complete
- **Zero downtime deployment** - ECS handles rolling updates

## 🔧 **Troubleshooting**

### **If Docker isn't running:**
```bash
# Start Docker Desktop first, then run:
./scripts/fix-frontend-https.sh
```

### **If AWS credentials aren't configured:**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (ap-east-1)
```

### **If jq isn't installed:**
```bash
# On macOS:
brew install jq

# On Ubuntu/Debian:
sudo apt-get install jq
```

### **If deployment fails:**
```bash
# Check the status:
./scripts/check-frontend-status.sh

# Check ECS console for detailed error messages
# Common issues: insufficient CPU/memory, security group issues
```

## 📚 **Technical Details**

- **Region:** ap-east-1 (Hong Kong)
- **Cluster:** zubin-eventmanagement-cluster
- **Service:** zubin-eventmanagement-frontend-service
- **Task Family:** zubin-eventmanagement-frontend-task
- **ECR Repository:** mshk-codetogive2025/eventmanagement-frontend
- **New VITE_API_URL:** https://api.events.opportunitybankhk.org/api

## 🎉 **Expected Result**

After running the fix script:
- Frontend accessible at: `https://events.opportunitybankhk.org/`
- Backend API accessible at: `https://api.events.opportunitybankhk.org/api/*`
- No more mixed content errors in browser console
- All frontend functionality working with HTTPS
