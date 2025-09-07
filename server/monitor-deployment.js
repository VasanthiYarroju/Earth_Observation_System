import https from 'https';

const SERVER_URL = 'https://earth-observationsystem.onrender.com';

async function testEndpoint(endpoint, description) {
    return new Promise((resolve, reject) => {
        console.log(`\n🧪 Testing ${description}...`);
        console.log(`🔗 URL: ${SERVER_URL}${endpoint}`);
        
        const startTime = Date.now();
        
        const options = {
            hostname: 'earth-observationsystem.onrender.com',
            port: 443,
            path: endpoint,
            method: 'GET',
            headers: {
                'User-Agent': 'Earth Observation Test/1.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                console.log(`📊 Status: ${res.statusCode}`);
                console.log(`⏱️ Response Time: ${responseTime}ms`);
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        responseTime,
                        data: jsonData
                    });
                } catch (error) {
                    console.log('❌ JSON Parse Error:', error.message);
                    console.log('📄 Raw Response:', data.substring(0, 200));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            reject(error);
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function monitorDeployment() {
    console.log('🚀 Monitoring Render Deployment Status');
    console.log('='.repeat(60));
    console.log('⏰ Waiting for deployment to complete...');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n📋 Attempt ${attempts}/${maxAttempts}`);
        console.log('⌚ ' + new Date().toISOString());
        
        try {
            // Test health endpoint
            const healthResult = await testEndpoint('/api/health', 'Health Check');
            
            if (healthResult.statusCode === 200) {
                console.log('✅ Health Check Passed');
                console.log(`📊 Server Data:`);
                console.log(`   - Status: ${healthResult.data.status}`);
                console.log(`   - Auth Method: ${healthResult.data.auth_method}`);
                console.log(`   - Data Source: ${healthResult.data.data_source}`);
                console.log(`   - Policy: ${healthResult.data.policy}`);
                console.log(`   - Token Status: ${healthResult.data.token_status}`);
                console.log(`   - Cached Data: ${healthResult.data.cached_data_available}`);
                
                // Test OAuth2 endpoint
                try {
                    const oauthResult = await testEndpoint('/api/test-oauth2', 'OAuth2 Test');
                    if (oauthResult.statusCode === 200) {
                        console.log('✅ OAuth2 Test Passed');
                        console.log(`   - Token Obtained: ${oauthResult.data.token_obtained}`);
                        console.log(`   - Token Length: ${oauthResult.data.token_length}`);
                        
                        // Test flights endpoint
                        try {
                            const flightsResult = await testEndpoint('/api/flights', 'Flights Data');
                            
                            if (flightsResult.statusCode === 200) {
                                console.log('✅ Flights Endpoint Working!');
                                console.log(`   - Success: ${flightsResult.data.success}`);
                                console.log(`   - Count: ${flightsResult.data.count}`);
                                console.log(`   - Source: ${flightsResult.data.source}`);
                                console.log(`   - Auth Method: ${flightsResult.data.auth_method}`);
                                
                                if (flightsResult.data.source.includes('live')) {
                                    console.log('🎉 SUCCESS! Live data is working!');
                                    console.log('='.repeat(60));
                                    console.log('✅ DEPLOYMENT COMPLETE - LIVE DATA ACTIVE');
                                    console.log('='.repeat(60));
                                    return;
                                } else if (flightsResult.data.source.includes('cached_live')) {
                                    console.log('📦 Cached live data available');
                                } else {
                                    console.log('⚠️ Still showing mock data, waiting...');
                                }
                            } else {
                                console.log(`❌ Flights endpoint returned ${flightsResult.statusCode}`);
                            }
                        } catch (flightsError) {
                            console.log('❌ Flights test failed:', flightsError.message);
                        }
                    } else {
                        console.log(`❌ OAuth2 test returned ${oauthResult.statusCode}`);
                        if (oauthResult.data.troubleshooting) {
                            console.log('🔧 Troubleshooting suggestions:');
                            oauthResult.data.troubleshooting.forEach(tip => console.log(`   - ${tip}`));
                        }
                    }
                } catch (oauthError) {
                    console.log('❌ OAuth2 test failed:', oauthError.message);
                }
            } else {
                console.log(`❌ Health check returned ${healthResult.statusCode}`);
            }
            
        } catch (error) {
            console.log('❌ Test failed:', error.message);
        }
        
        if (attempts < maxAttempts) {
            console.log('⏳ Waiting 30 seconds before next attempt...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('\n⏰ Max attempts reached. Final status:');
    console.log('🌐 Your server should be deployed at: https://earth-observationsystem.onrender.com');
    console.log('📊 Check manually: https://earth-observationsystem.onrender.com/api/health');
    console.log('🛫 Test flights: https://earth-observationsystem.onrender.com/api/flights');
}

// Start monitoring
monitorDeployment().catch(console.error);
