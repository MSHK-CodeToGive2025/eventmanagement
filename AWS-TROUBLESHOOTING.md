# AWS Deployment Troubleshooting Guide

## Issue: 403 Forbidden Error on Event Update

### Problem Description
When trying to update an event on the AWS-deployed frontend, you get a 403 Forbidden error:
```
PUT http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com/api/events/687d0fcb25ee68e1ee2349dc 403 (Forbidden)
```

### Root Cause Analysis
The 403 error indicates an authorization issue. This could be caused by:

1. **CORS Configuration Mismatch**
2. **Authentication Token Issues**
3. **User Role/Permission Problems**
4. **API URL Configuration Issues**

### Step-by-Step Troubleshooting

#### 1. Check Backend Connectivity
Run the backend debug script:
```bash
cd backend
node debug-auth.js
```

This will test:
- Backend health
- Database connectivity
- CORS configuration
- Authentication
- Event update authorization

#### 2. Check Frontend Configuration
Open your deployed frontend and run the frontend debug script in the browser console:
```javascript
// Copy and paste the contents of frontend/debug-frontend.js
```

This will test:
- Backend connectivity from frontend
- CORS from frontend perspective
- Authentication state
- Token validity

#### 3. Verify Environment Configuration

**Backend Environment Variables:**
- `JWT_SECRET` - Must be set and consistent
- `CORS_ORIGIN` - Should include your frontend ALB domain
- `MONGODB_URI` - Must be accessible

**Frontend Environment Variables:**
- `VITE_API_URL` - Should point to your backend ALB

#### 4. Check CORS Configuration
The CORS configuration in `backend/src/cors-config.js` should include:
```javascript
'http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com',
'https://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com'
```

#### 5. Verify User Authentication
1. Check if user is properly logged in
2. Verify token exists in localStorage
3. Ensure token is not expired
4. Confirm user has appropriate role (admin, staff, or event creator)

#### 6. Check Event Ownership
The user must be:
- An admin
- A staff member
- The creator of the event

### Common Solutions

#### Solution 1: Fix CORS Configuration
If CORS is blocking requests, update the backend CORS configuration:

```javascript
// In backend/src/cors-config.js
const productionOrigins = [
  'http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com',
  'https://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com',
  // Add any other frontend domains
];
```

#### Solution 2: Check Authentication Token
Ensure the token is being sent correctly:

```javascript
// In frontend/src/services/eventService.ts
const authHeader = (): { Authorization?: string } => {
  const token = localStorage.getItem('token');
  console.log('Token for request:', token ? 'exists' : 'missing');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

#### Solution 3: Verify User Role
Check if the user has the correct role:

```javascript
// In backend/src/routes/events.js
console.log('[EVENTS] User role:', user.role);
console.log('[EVENTS] Event createdBy:', event.createdBy.toString());
console.log('[EVENTS] Current user ID:', req.user.userId);
```

#### Solution 4: Check API URL Configuration
Ensure the frontend is pointing to the correct backend URL:

```javascript
// In frontend/src/services/authService.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
console.log('API_URL:', API_URL);
```

### Debugging Commands

#### Backend Debug
```bash
# Test backend health
curl http://backend-alb-1469776694.ap-east-1.elb.amazonaws.com/api/health

# Test CORS
curl -X OPTIONS http://backend-alb-1469776694.ap-east-1.elb.amazonaws.com/api/events \
  -H "Origin: http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization"
```

#### Frontend Debug
```javascript
// In browser console on deployed frontend
localStorage.getItem('token') // Check if token exists
fetch('http://backend-alb-1469776694.ap-east-1.elb.amazonaws.com/api/health') // Test connectivity
```

### AWS-Specific Checks

#### 1. Security Groups
Ensure your ALB security groups allow:
- HTTP (80) and HTTPS (443) from 0.0.0.0/0
- Backend service security group allows traffic from ALB

#### 2. Target Groups
Verify target groups are healthy and pointing to correct services

#### 3. ECS Services
Check that both frontend and backend services are running and healthy

#### 4. Environment Variables
Ensure ECS task definitions have all required environment variables

### Monitoring and Logs

#### Backend Logs
Check ECS service logs for:
- Authentication errors
- CORS errors
- Database connection issues
- Authorization failures

#### Frontend Logs
Check browser console for:
- Network errors
- CORS errors
- Authentication failures
- API call failures

### Prevention

1. **Environment Configuration**: Use proper environment variables
2. **CORS Management**: Keep CORS configuration updated
3. **Authentication**: Implement proper token management
4. **Authorization**: Use role-based access control
5. **Monitoring**: Set up proper logging and monitoring

### Next Steps

1. Run the debug scripts to identify the specific issue
2. Check the logs for detailed error messages
3. Verify all configuration settings
4. Test with a known working user account
5. Update configurations as needed
6. Redeploy if necessary

### Support

If issues persist:
1. Check AWS CloudWatch logs
2. Verify ECS service health
3. Test with Postman or similar tool
4. Review security group configurations
5. Check target group health status 