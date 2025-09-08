import https from 'https';
import querystring from 'querystring';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Your OpenSky credentials
const OPENSKY_CLIENT_ID = process.env.OPENSKY_CLIENT_ID || 'yvasanthi314-api-client';
const OPENSKY_CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET || 'uVrUHLnn0CH7ffmSFH3pDV3Kl446LhpV';

console.log('🔍 OAuth2 Diagnostic Tool for Render Deployment');
console.log('='.repeat(60));

// Test 1: DNS Resolution
async function testDNSResolution() {
    console.log('🌐 Testing DNS Resolution...');
    try {
        const result = await dnsLookup('auth.opensky-network.org');
        console.log('✅ DNS Resolution Success:', result);
        return true;
    } catch (error) {
        console.log('❌ DNS Resolution Failed:', error.message);
        return false;
    }
}

// Test 2: Basic HTTPS Connection
async function testBasicConnection() {
    return new Promise((resolve, reject) => {
        console.log('🔗 Testing Basic HTTPS Connection...');
        
        const options = {
            hostname: 'auth.opensky-network.org',
            port: 443,
            path: '/',
            method: 'GET',
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            console.log('✅ Basic Connection Success - Status:', res.statusCode);
            resolve(true);
        });

        req.on('error', (error) => {
            console.log('❌ Basic Connection Failed:', error.message);
            reject(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log('❌ Basic Connection Timeout');
            reject(false);
        });

        req.setTimeout(10000);
        req.end();
    });
}

// Test 3: OAuth2 Endpoint Accessibility
async function testOAuth2Endpoint() {
    return new Promise((resolve, reject) => {
        console.log('🔑 Testing OAuth2 Endpoint Accessibility...');
        
        const options = {
            hostname: 'auth.opensky-network.org',
            port: 443,
            path: '/auth/realms/opensky-network/protocol/openid-connect/token',
            method: 'GET',
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            console.log('✅ OAuth2 Endpoint Accessible - Status:', res.statusCode);
            resolve(true);
        });

        req.on('error', (error) => {
            console.log('❌ OAuth2 Endpoint Failed:', error.message);
            reject(false);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log('❌ OAuth2 Endpoint Timeout');
            reject(false);
        });

        req.setTimeout(10000);
        req.end();
    });
}

// Test 4: Full OAuth2 Authentication with Enhanced Error Handling
async function testFullOAuth2() {
    return new Promise((resolve, reject) => {
        console.log('🎫 Testing Full OAuth2 Authentication...');
        
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
                'User-Agent': 'Earth Observation System Diagnostic/1.0'
            },
            timeout: 15000 // Shorter timeout for diagnostic
        };

        console.log('📤 Sending OAuth2 request...');
        console.log('📊 Client ID:', OPENSKY_CLIENT_ID);
        console.log('🔐 Using credentials length:', OPENSKY_CLIENT_SECRET.length);

        const startTime = Date.now();
        const req = https.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            console.log(`📊 Response received in ${responseTime}ms - Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const tokenResponse = JSON.parse(data);
                        console.log('✅ OAuth2 Authentication Success!');
                        console.log('🎫 Token Type:', tokenResponse.token_type);
                        console.log('⏰ Expires In:', tokenResponse.expires_in, 'seconds');
                        resolve(true);
                    } catch (error) {
                        console.log('❌ JSON Parse Error:', error.message);
                        console.log('📄 Raw Response:', data.substring(0, 200));
                        reject(false);
                    }
                } else {
                    console.log('❌ OAuth2 Authentication Failed - Status:', res.statusCode);
                    console.log('📄 Response:', data.substring(0, 200));
                    reject(false);
                }
            });
        });

        req.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            console.log(`❌ OAuth2 Request Error after ${responseTime}ms:`, error.message);
            console.log('🔍 Error Code:', error.code);
            console.log('🔍 Error Type:', error.constructor.name);
            reject(false);
        });

        req.on('timeout', () => {
            const responseTime = Date.now() - startTime;
            req.destroy();
            console.log(`❌ OAuth2 Request Timeout after ${responseTime}ms`);
            reject(false);
        });

        req.setTimeout(15000);
        req.write(postData);
        req.end();
    });
}

// Test 5: Environment Check
function testEnvironment() {
    console.log('🌍 Environment Check...');
    console.log('📦 Node.js Version:', process.version);
    console.log('🖥️ Platform:', process.platform);
    console.log('🏗️ Architecture:', process.arch);
    console.log('🔧 Environment Variables:');
    console.log('   - OPENSKY_CLIENT_ID:', process.env.OPENSKY_CLIENT_ID ? 'SET' : 'NOT_SET (using fallback)');
    console.log('   - OPENSKY_CLIENT_SECRET:', process.env.OPENSKY_CLIENT_SECRET ? 'SET' : 'NOT_SET (using fallback)');
    console.log('   - NODE_ENV:', process.env.NODE_ENV || 'NOT_SET');
    console.log('   - PORT:', process.env.PORT || 'NOT_SET');
}

// Run All Tests
async function runDiagnostics() {
    console.log('🚀 Starting OAuth2 Diagnostics...\n');
    
    testEnvironment();
    console.log('');
    
    const results = {
        dns: false,
        basicConnection: false,
        oauth2Endpoint: false,
        fullOAuth2: false
    };

    try {
        results.dns = await testDNSResolution();
    } catch (e) { /* handled in function */ }
    
    console.log('');
    
    try {
        results.basicConnection = await testBasicConnection();
    } catch (e) { /* handled in function */ }
    
    console.log('');
    
    try {
        results.oauth2Endpoint = await testOAuth2Endpoint();
    } catch (e) { /* handled in function */ }
    
    console.log('');
    
    try {
        results.fullOAuth2 = await testFullOAuth2();
    } catch (e) { /* handled in function */ }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log('🌐 DNS Resolution:', results.dns ? '✅ PASS' : '❌ FAIL');
    console.log('🔗 Basic HTTPS Connection:', results.basicConnection ? '✅ PASS' : '❌ FAIL');
    console.log('🔑 OAuth2 Endpoint Access:', results.oauth2Endpoint ? '✅ PASS' : '❌ FAIL');
    console.log('🎫 Full OAuth2 Auth:', results.fullOAuth2 ? '✅ PASS' : '❌ FAIL');
    console.log('');
    
    if (results.fullOAuth2) {
        console.log('🎉 RESULT: OAuth2 is working correctly!');
        console.log('💡 The issue might be elsewhere in your application.');
    } else if (results.oauth2Endpoint) {
        console.log('⚠️ RESULT: Endpoint accessible but authentication failing');
        console.log('💡 Check your credentials or request format.');
    } else if (results.basicConnection) {
        console.log('⚠️ RESULT: Basic connection works but OAuth2 endpoint not accessible');
        console.log('💡 OAuth2 endpoint might be down or path incorrect.');
    } else if (results.dns) {
        console.log('❌ RESULT: DNS works but HTTPS connection failing');
        console.log('💡 Network connectivity or firewall issue.');
    } else {
        console.log('❌ RESULT: Complete connectivity failure');
        console.log('💡 DNS or network infrastructure issue.');
    }
    
    console.log('\n🏁 Diagnostics completed!');
}

// Handle both local and deployed execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runDiagnostics().catch(console.error);
}

export { runDiagnostics };
