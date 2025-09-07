import https from 'https';
import querystring from 'querystring';
import dotenv from 'dotenv';

dotenv.config();

// Your OpenSky credentials
const OPENSKY_CLIENT_ID = process.env.OPENSKY_CLIENT_ID || 'yvasanthi314-api-client';
const OPENSKY_CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET || 'uVrUHLnn0CH7ffmSFH3pDV3Kl446LhpV';
const OPENSKY_USERNAME = process.env.OPENSKY_USERNAME || 'yvasanthi314';
const OPENSKY_PASSWORD = process.env.OPENSKY_PASSWORD || 'Yarrojuvasanthi@2005';

console.log('🧪 Testing OpenSky API Integration');
console.log('='.repeat(50));
console.log('🆔 Client ID:', OPENSKY_CLIENT_ID);
console.log('👤 Username:', OPENSKY_USERNAME);
console.log('🔐 Password:', OPENSKY_PASSWORD.replace(/./g, '*'));
console.log('='.repeat(50));

// Test OAuth2 Authentication
async function testOAuth2() {
    return new Promise((resolve, reject) => {
        console.log('\n🔑 Testing OAuth2 Authentication...');
        
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
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 OAuth2 Response Status: ${res.statusCode}`);
                console.log(`📋 OAuth2 Response Headers:`, res.headers);
                
                if (res.statusCode === 200) {
                    try {
                        const tokenResponse = JSON.parse(data);
                        console.log('✅ OAuth2 Success!');
                        console.log('🎫 Access Token:', tokenResponse.access_token ? 'RECEIVED' : 'NOT_RECEIVED');
                        console.log('⏰ Expires In:', tokenResponse.expires_in, 'seconds');
                        resolve(tokenResponse.access_token);
                    } catch (error) {
                        console.log('❌ OAuth2 JSON Parse Error:', error.message);
                        console.log('📄 Raw Response:', data);
                        reject(error);
                    }
                } else {
                    console.log('❌ OAuth2 Failed!');
                    console.log('📄 Response:', data);
                    reject(new Error(`OAuth2 failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ OAuth2 Request Error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Test Basic Authentication
async function testBasicAuth() {
    return new Promise((resolve, reject) => {
        console.log('\n🔐 Testing Basic Authentication...');
        
        const credentials = Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString('base64');
        
        const options = {
            hostname: 'opensky-network.org',
            port: 443,
            path: '/api/states/all',
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'User-Agent': 'Earth Observation System/1.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 Basic Auth Response Status: ${res.statusCode}`);
                console.log(`📋 Response Headers:`, res.headers);
                
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData && jsonData.states) {
                            console.log('✅ Basic Auth Success!');
                            console.log(`🛫 Flights Retrieved: ${jsonData.states.length}`);
                            console.log('📊 Sample Flight Data:');
                            
                            // Show first 3 flights as sample
                            jsonData.states.slice(0, 3).forEach((flight, index) => {
                                console.log(`   Flight ${index + 1}:`);
                                console.log(`     ICAO24: ${flight[0]}`);
                                console.log(`     Callsign: ${flight[1] || 'N/A'}`);
                                console.log(`     Country: ${flight[2] || 'N/A'}`);
                                console.log(`     Lat/Lon: ${flight[6]}/${flight[5]}`);
                                console.log(`     Altitude: ${flight[7] || 'N/A'} meters`);
                            });
                            
                            resolve(jsonData.states);
                        } else {
                            console.log('❌ Invalid response format');
                            console.log('📄 Response sample:', data.substring(0, 200));
                            reject(new Error('Invalid response format'));
                        }
                    } catch (error) {
                        console.log('❌ Basic Auth JSON Parse Error:', error.message);
                        console.log('📄 Raw Response sample:', data.substring(0, 200));
                        reject(error);
                    }
                } else if (res.statusCode === 401) {
                    console.log('❌ Basic Auth Failed - Invalid Credentials');
                    console.log('📄 Response:', data);
                    reject(new Error('Invalid credentials'));
                } else if (res.statusCode === 429) {
                    console.log('⚠️ Rate Limited');
                    console.log('📄 Response:', data);
                    reject(new Error('Rate limited'));
                } else {
                    console.log(`❌ Basic Auth Failed - Status: ${res.statusCode}`);
                    console.log('📄 Response:', data);
                    reject(new Error(`Request failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Basic Auth Request Error:', error.message);
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('⏰ Request timeout after 10 seconds');
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test OAuth2 with API Request
async function testOAuth2WithAPI(accessToken) {
    return new Promise((resolve, reject) => {
        console.log('\n🔑 Testing OAuth2 Token with API Request...');
        
        const options = {
            hostname: 'opensky-network.org',
            port: 443,
            path: '/api/states/all',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'Earth Observation System/1.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 OAuth2 API Response Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData && jsonData.states) {
                            console.log('✅ OAuth2 API Success!');
                            console.log(`🛫 Flights Retrieved: ${jsonData.states.length}`);
                            resolve(jsonData.states);
                        } else {
                            console.log('❌ Invalid response format');
                            reject(new Error('Invalid response format'));
                        }
                    } catch (error) {
                        console.log('❌ OAuth2 API JSON Parse Error:', error.message);
                        reject(error);
                    }
                } else {
                    console.log(`❌ OAuth2 API Failed - Status: ${res.statusCode}`);
                    console.log('📄 Response:', data.substring(0, 200));
                    reject(new Error(`OAuth2 API failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ OAuth2 API Request Error:', error.message);
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test your deployed server
async function testDeployedServer() {
    return new Promise((resolve, reject) => {
        console.log('\n🌐 Testing Your Deployed Server...');
        console.log('🔗 URL: https://earth-observationsystem.onrender.com/api/flights');
        
        const options = {
            hostname: 'earth-observationsystem.onrender.com',
            port: 443,
            path: '/api/flights',
            method: 'GET',
            headers: {
                'User-Agent': 'Earth Observation System Test/1.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 Server Response Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log('✅ Server Response Success!');
                        console.log(`🛫 Flights Count: ${jsonData.count || 'N/A'}`);
                        console.log(`📡 Data Source: ${jsonData.source || 'N/A'}`);
                        console.log(`🔐 Auth Method: ${jsonData.auth_method || 'N/A'}`);
                        console.log(`⏰ Timestamp: ${jsonData.timestamp || 'N/A'}`);
                        
                        if (jsonData.flights && jsonData.flights.length > 0) {
                            console.log('✈️ Sample Flight:');
                            const sample = jsonData.flights[0];
                            console.log(`   Callsign: ${sample.callsign}`);
                            console.log(`   Country: ${sample.country}`);
                            console.log(`   Position: ${sample.latitude}, ${sample.longitude}`);
                            console.log(`   Altitude: ${sample.altitude}m`);
                        }
                        
                        resolve(jsonData);
                    } catch (error) {
                        console.log('❌ Server JSON Parse Error:', error.message);
                        console.log('📄 Raw Response sample:', data.substring(0, 300));
                        reject(error);
                    }
                } else {
                    console.log(`❌ Server Request Failed - Status: ${res.statusCode}`);
                    console.log('📄 Response:', data.substring(0, 300));
                    reject(new Error(`Server request failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Server Request Error:', error.message);
            reject(error);
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Server request timeout'));
        });

        req.end();
    });
}

// Main test function
async function runTests() {
    console.log('🚀 Starting OpenSky API Integration Tests\n');
    
    let accessToken = null;
    let basicAuthWorking = false;
    let oauthWorking = false;
    
    // Test 1: OAuth2 Authentication
    try {
        accessToken = await testOAuth2();
        oauthWorking = true;
    } catch (error) {
        console.log('❌ OAuth2 test failed:', error.message);
    }
    
    // Test 2: OAuth2 with API if we got a token
    if (accessToken) {
        try {
            await testOAuth2WithAPI(accessToken);
        } catch (error) {
            console.log('❌ OAuth2 API test failed:', error.message);
            oauthWorking = false;
        }
    }
    
    // Test 3: Basic Authentication
    try {
        await testBasicAuth();
        basicAuthWorking = true;
    } catch (error) {
        console.log('❌ Basic Auth test failed:', error.message);
    }
    
    // Test 4: Your deployed server
    try {
        await testDeployedServer();
    } catch (error) {
        console.log('❌ Deployed server test failed:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`🔑 OAuth2 Authentication: ${oauthWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`🔐 Basic Authentication: ${basicAuthWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`🌐 Server URL: https://earth-observationsystem.onrender.com`);
    
    if (oauthWorking || basicAuthWorking) {
        console.log('✅ RESULT: OpenSky API is accessible with your credentials!');
        console.log('🎯 RECOMMENDATION: Remove mock data fallbacks from your server');
    } else {
        console.log('❌ RESULT: Both authentication methods failed');
        console.log('🔧 RECOMMENDATION: Check your credentials and server configuration');
    }
    
    console.log('\n🏁 Tests completed!');
}

// Run the tests
runTests().catch(console.error);
