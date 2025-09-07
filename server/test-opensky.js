// Test OpenSky Network credentials
const https = require('https');
const querystring = require('querystring');

// Load environment variables
require('dotenv').config();

const OPENSKY_CLIENT_ID = process.env.OPENSKY_CLIENT_ID || 'yvasanthi314-api-client';
const OPENSKY_CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET || 'uVrUHLnn0CH7ffmSFH3pDV3Kl446LhpV';
const OPENSKY_USERNAME = process.env.OPENSKY_USERNAME || 'yvasanthi314';
const OPENSKY_PASSWORD = process.env.OPENSKY_PASSWORD || 'Vasanthi@123';

console.log('🧪 Testing OpenSky Network Credentials...');
console.log(`Client ID: ${OPENSKY_CLIENT_ID}`);
console.log(`Username: ${OPENSKY_USERNAME}`);

// Test OAuth2 authentication
async function testOAuth2() {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      'grant_type': 'client_credentials',
      'client_id': OPENSKY_CLIENT_ID,
      'client_secret': OPENSKY_CLIENT_SECRET
    });

    const options = {
      hostname: 'auth.opensky-network.org',
      port: 443,
      path: '/auth/realms/opensky-network/protocol/openid-connect/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Earth Observation System/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ OAuth2 authentication successful!');
          const tokenResponse = JSON.parse(data);
          console.log(`🔑 Access token received (expires in ${tokenResponse.expires_in} seconds)`);
          resolve(tokenResponse.access_token);
        } else {
          console.log(`❌ OAuth2 failed: ${res.statusCode}`);
          console.log(data);
          reject(new Error(`OAuth2 failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ OAuth2 request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test Basic Authentication
async function testBasicAuth() {
  return new Promise((resolve, reject) => {
    const credentials = Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString('base64');
    
    const options = {
      hostname: 'opensky-network.org',
      port: 443,
      path: '/api/states/all',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'User-Agent': 'Earth Observation System/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Basic authentication successful!');
          const response = JSON.parse(data);
          console.log(`📊 Received ${response.states ? response.states.length : 0} flight states`);
          resolve(response);
        } else {
          console.log(`❌ Basic auth failed: ${res.statusCode}`);
          reject(new Error(`Basic auth failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Basic auth request error:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('\n🔐 Testing OAuth2 Authentication...');
  try {
    await testOAuth2();
  } catch (error) {
    console.log('OAuth2 test failed, continuing...');
  }

  console.log('\n🔐 Testing Basic Authentication...');
  try {
    await testBasicAuth();
  } catch (error) {
    console.log('Basic auth test failed:', error.message);
  }

  console.log('\n✅ Testing complete!');
}

runTests();
