// Test script to verify subscription functionality
const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:8080/api';

// Test user credentials (use an existing user or create one)
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test subscription data
const testSubscription = {
  plan: 'Researcher',
  planKey: 'researcher',
  startDate: new Date().toISOString(),
  features: ['High-resolution agriculture data', 'Historical analysis'],
  price: 29,
  billingCycle: 'monthly'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSubscriptionFlow() {
  console.log('🧪 Testing subscription persistence flow...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Attempting login...');
    const loginResponse = await makeRequest('POST', '/auth/login', testUser);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.data);
      console.log('💡 This is normal if the test user doesn\'t exist.');
      console.log('💡 Please create a user first or use existing credentials.\n');
      return;
    }

    const { token, user } = loginResponse.data;
    console.log('✅ Login successful!');
    console.log('📋 User data:', JSON.stringify(user, null, 2));
    console.log('🔑 Token:', token ? 'received' : 'missing');
    console.log('🎫 Current subscription:', user.subscription || 'none');
    console.log('');

    // Step 2: Update subscription
    console.log('2️⃣ Updating subscription...');
    const subscriptionResponse = await makeRequest('PUT', '/user/subscription', testSubscription, token);
    
    if (subscriptionResponse.status === 200) {
      console.log('✅ Subscription update successful!');
      console.log('📋 Updated user data:', JSON.stringify(subscriptionResponse.data.user, null, 2));
      console.log('');
    } else {
      console.log('❌ Subscription update failed:', subscriptionResponse.data);
      console.log('');
    }

    // Step 3: Login again to verify persistence
    console.log('3️⃣ Logging in again to verify subscription persistence...');
    const secondLoginResponse = await makeRequest('POST', '/auth/login', testUser);
    
    if (secondLoginResponse.status === 200) {
      console.log('✅ Second login successful!');
      console.log('📋 User data from second login:', JSON.stringify(secondLoginResponse.data.user, null, 2));
      
      const subscription = secondLoginResponse.data.user.subscription;
      if (subscription && subscription.status === 'active') {
        console.log('✅ SUCCESS: Subscription persisted correctly!');
        console.log('🎯 Plan:', subscription.plan);
        console.log('📅 Start Date:', subscription.startDate);
        console.log('💰 Price:', subscription.price);
      } else {
        console.log('❌ FAILURE: Subscription not persisted correctly');
      }
    } else {
      console.log('❌ Second login failed:', secondLoginResponse.data);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testSubscriptionFlow();
