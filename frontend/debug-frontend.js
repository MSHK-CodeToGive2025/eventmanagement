// Frontend Debug Script for AWS Deployment
// Run this in the browser console on your deployed frontend

console.log('🔍 Frontend AWS Debug Script');
console.log('============================');

// Configuration
const API_URL = 'http://backend-alb-1469776694.ap-east-1.elb.amazonaws.com/api';
const FRONTEND_URL = window.location.origin;

console.log('Frontend URL:', FRONTEND_URL);
console.log('API URL:', API_URL);
console.log('');

async function testBackendConnectivity() {
  try {
    console.log('1. Testing backend connectivity...');
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend is accessible:', data);
    return true;
  } catch (error) {
    console.log('❌ Backend connectivity failed:', error.message);
    return false;
  }
}

async function testCORS() {
  try {
    console.log('\n2. Testing CORS...');
    const response = await fetch(`${API_URL}/events/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('✅ CORS is working, public events:', data.length);
    return data;
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return null;
  }
}

function checkLocalStorage() {
  console.log('\n3. Checking localStorage...');
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token exists:', !!token);
  console.log('Token length:', token ? token.length : 0);
  console.log('User data exists:', !!user);
  
  if (token) {
    try {
      // Decode JWT token (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        exp: new Date(payload.exp * 1000).toISOString()
      });
    } catch (error) {
      console.log('❌ Token decode failed:', error.message);
    }
  }
  
  return token;
}

async function testAuthentication() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('\n4. No token found, skipping authentication test');
    return null;
  }
  
  try {
    console.log('\n4. Testing authentication...');
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ Authentication successful:', user);
      return user;
    } else {
      console.log('❌ Authentication failed:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication test error:', error.message);
    return null;
  }
}

async function testEventUpdate(token, eventId) {
  if (!token || !eventId) {
    console.log('\n5. Skipping event update test (no token or event ID)');
    return false;
  }
  
  try {
    console.log('\n5. Testing event update...');
    console.log('Event ID:', eventId);
    
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Update - ' + new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Event update successful:', data.title);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Event update failed:', response.status, errorData.message || response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Event update error:', error.message);
    return false;
  }
}

async function runDebugTests() {
  console.log('Starting frontend debugging...\n');
  
  // Test basic connectivity
  const isConnected = await testBackendConnectivity();
  if (!isConnected) {
    console.log('\n❌ Cannot connect to backend. Check your AWS configuration.');
    return;
  }
  
  // Test CORS and get events
  const events = await testCORS();
  
  // Check authentication state
  checkLocalStorage();
  const user = await testAuthentication();
  
  // Test event update if we have authentication and events
  if (user && events && events.length > 0) {
    const token = localStorage.getItem('token');
    await testEventUpdate(token, events[0]._id);
  }
  
  console.log('\n🔍 Debug Summary:');
  console.log('================');
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('API URL:', API_URL);
  console.log('Backend Connectivity:', isConnected ? '✅' : '❌');
  console.log('CORS Working:', events !== null ? '✅' : '❌');
  console.log('Authentication:', user ? '✅' : '❌');
  console.log('Available Events:', events ? events.length : 0);
  
  if (!user) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Make sure you are logged in');
    console.log('2. Check if your token is valid');
    console.log('3. Verify the backend URL is correct');
    console.log('4. Check CORS configuration on backend');
  }
}

// Run the debug tests
runDebugTests().catch(console.error);

// Export for manual testing
window.debugAWS = {
  testBackendConnectivity,
  testCORS,
  checkLocalStorage,
  testAuthentication,
  testEventUpdate,
  runDebugTests
}; 