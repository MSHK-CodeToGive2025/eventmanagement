import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com/api';

console.log('🔍 AWS Backend Authentication Debug Script');
console.log('==========================================');
console.log('Backend URL:', BACKEND_URL);
console.log('');

async function testBackendHealth() {
  try {
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is healthy:', healthResponse.data);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function testDatabaseHealth() {
  try {
    console.log('\n2. Testing database connection...');
    const dbResponse = await axios.get(`${BACKEND_URL}/health/db`);
    console.log('✅ Database is healthy:', dbResponse.data);
    return true;
  } catch (error) {
    console.log('❌ Database health check failed:', error.message);
    return false;
  }
}

async function testCORS() {
  try {
    console.log('\n3. Testing CORS configuration...');
    const corsResponse = await axios.options(`${BACKEND_URL}/events`, {
      headers: {
        'Origin': 'http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    });
    console.log('✅ CORS preflight successful');
    console.log('CORS Headers:', corsResponse.headers);
    return true;
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return false;
  }
}

async function testPublicEvents() {
  try {
    console.log('\n4. Testing public events endpoint...');
    const eventsResponse = await axios.get(`${BACKEND_URL}/events/public`);
    console.log('✅ Public events endpoint working');
    console.log('Found events:', eventsResponse.data.length);
    return eventsResponse.data;
  } catch (error) {
    console.log('❌ Public events test failed:', error.message);
    return null;
  }
}

async function testAuthentication(credentials) {
  try {
    console.log('\n5. Testing authentication...');
    console.log('Attempting login with:', credentials.username);
    
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, credentials);
    console.log('✅ Authentication successful');
    console.log('User role:', loginResponse.data.user.role);
    console.log('Token received:', !!loginResponse.data.token);
    
    return loginResponse.data.token;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testEventUpdate(token, eventId) {
  if (!token || !eventId) {
    console.log('\n6. Skipping event update test (no token or event ID)');
    return false;
  }
  
  try {
    console.log('\n6. Testing event update authorization...');
    console.log('Event ID:', eventId);
    
    const updateResponse = await axios.put(`${BACKEND_URL}/events/${eventId}`, {
      title: 'Test Update - ' + new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Event update successful');
    console.log('Updated event:', updateResponse.data.title);
    return true;
  } catch (error) {
    console.log('❌ Event update failed:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

async function main() {
  console.log('Starting AWS backend debugging...\n');
  
  // Test basic connectivity
  const isHealthy = await testBackendHealth();
  if (!isHealthy) {
    console.log('\n❌ Backend is not accessible. Please check your AWS configuration.');
    return;
  }
  
  await testDatabaseHealth();
  await testCORS();
  
  const events = await testPublicEvents();
  
  // Test authentication if you have credentials
  const testCredentials = {
    username: process.env.TEST_USERNAME || 'superadmin',
    password: process.env.TEST_PASSWORD || 'xxx'
  };
  
  const token = await testAuthentication(testCredentials);
  
  // Test event update if we have a token and events
  if (events && events.length > 0) {
    await testEventUpdate(token, events[0]._id);
  }
  
  console.log('\n🔍 Debug Summary:');
  console.log('================');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Health Check:', isHealthy ? '✅' : '❌');
  console.log('Authentication:', token ? '✅' : '❌');
  console.log('Available Events:', events ? events.length : 0);
}

main().catch(console.error); 