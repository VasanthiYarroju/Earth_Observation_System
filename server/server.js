// Before: const express = require('express');
import express from 'express';
import mongoose from 'mongoose';
// Before: const cors = require('cors');
import cors from 'cors';
// Before: const https = require('https');
import https from 'https';
// Before: const querystring = require('querystring');
import querystring from 'querystring';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { 
  getDomainDatasetMetadata,
  getSampleData,
  getDomainAnalytics
} from './services/gcloudData.js';
import { GeoDataExtractor } from './services/geoDataExtractor.js';

// Import agriculture routes
import agricultureRoutes from './routes/agriculture.js';

dotenv.config();



const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://earth-observation-system.vercel.app',
    'https://earth-observation-system-ygrk.vercel.app',
    'https://earth-observation-system-ygrk-jhves6w5d.vercel.app', // Current deployment URL
    'https://earth-observation-system-ygrk-*.vercel.app' // For preview deployments
  ],
  credentials: true
}));

// Use agriculture routes
app.use('/api/agriculture', agricultureRoutes);

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Earth Observation System API',
    version: '1.0.0',
    description: 'Earth observation system with agriculture monitoring, flight tracking, and user management',
    endpoints: {
      '/': 'API information',
      '/api/health': 'Health check',
      '/api/info': 'Detailed API information',
      '/api/auth/signup': 'User registration',
      '/api/auth/login': 'User login',
      '/api/auth/verify-otp': 'OTP verification',
      '/api/flights': 'Flight tracking data',
      '/api/agriculture/*': 'Agriculture domain endpoints',
      '/api/domains/:domain/metadata': 'Domain metadata',
      '/api/domains/:domain/analytics': 'Domain analytics',
      '/api/domains/:domain/sample': 'Domain sample data'
    },
    features: [
      'User authentication with JWT',
      'Real-time flight tracking',
      'Agriculture data from Google Cloud',
      'Email OTP verification',
      'Cross-origin resource sharing (CORS)',
      'MongoDB user management'
    ],
    status: 'operational'
  });
});

// ==================== MongoDB ====================
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ==================== User Schema ====================
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  domains: [{ type: String }],
  otp: String,
  otpExpiry: Date,
  otpVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// ==================== OTP Generator ====================
function getRandomOtp(length = 6) {
  // Generate a truly random numeric OTP
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

// ==================== Nodemailer ====================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((err, success) => {
  if (err) console.error('❌ Email transporter error:', err);
  else console.log('✅ Email transporter ready');
});

// ==================== Middleware ====================

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== Routes ====================

// Root route for health check
app.get('/', (req, res) => {
  res.json({
    message: 'Earth Observation System API Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/verify-otp',
      '/api/flights',
      '/api/agriculture/*',
      '/api/health'
    ]
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  console.log('Register request body:', req.body);
  const { email, password, name, phone, domains } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = getRandomOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  // Fix for domains - ensure it's always stored as an array
  let domainsList = [];
  
  // If domains is a string (single domain), convert to array
  if (typeof domains === 'string' && domains.trim() !== '') {
    domainsList = [domains.trim()];
  } 
  // If domains is already an array, use it
  else if (Array.isArray(domains)) {
    domainsList = domains.filter(domain => domain && domain.trim() !== '');
  }
  
  console.log('Domains to save:', domainsList);
  
  const user = new User({ 
    email, 
    password: hashedPassword, 
    name,
    phone,
    domains: domainsList, // Use the fixed domains list
    otp, 
    otpExpiry 
  });
  await user.save();

  try {
    // Send OTP to user's email
    await transporter.sendMail({
      from: `"ETR Clean" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Verification',
      html: `<p>Your OTP is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
    });

    console.log(`✅ OTP ${otp} sent to ${email}`);
    return res.json({ message: 'User registered successfully. OTP sent to email.' });

  } catch (err) {
    console.error('❌ Failed to send OTP email:', err);
    return res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    console.log('OTP verification request body:', req.body);
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ OTP verification failed: User with email ${email} not found`);
      return res.status(400).json({ message: 'User not found' });
    }
    
    console.log(`User found: ${user.email}, OTP in DB: ${user.otp}, OTP received: ${otp}, OTP verified: ${user.otpVerified}`);
    
    if (user.otpVerified) {
      console.log(`❌ OTP verification failed: User ${email} already verified`);
      return res.status(400).json({ message: 'OTP already verified' });
    }
    
    if (user.otp !== otp) {
      console.log(`❌ OTP verification failed: Invalid OTP for ${email}`);
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (user.otpExpiry < new Date()) {
      console.log(`❌ OTP verification failed: OTP expired for ${email}`);
      return res.status(400).json({ message: 'OTP expired' });
    }
    
    // Update user verification status
    user.otpVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    await user.save();
    console.log(`✅ OTP verification successful for ${email}`);
    
    return res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('❌ OTP verification error:', err);
    return res.status(500).json({ message: 'Server error during verification', error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  if (!user.otpVerified) return res.status(400).json({ message: 'Please verify OTP first' });

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'secret123', { expiresIn: '24h' });
  
  // Include user data in the response
  return res.json({ 
    token, 
    message: 'Login successful',
    user: {
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      domains: user.domains || []
    } 
  });
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, domains } = req.body;
    const email = req.user.email;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update only fields that were provided
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (domains !== undefined) user.domains = domains;
    
    await user.save();
    
    return res.json({ 
      message: 'Profile updated successfully',
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        domains: user.domains || []
      } 
    });
  } catch (err) {
    console.error('❌ Error updating user profile:', err);
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

// ==================== Agriculture Data Endpoints ====================

// Get agriculture sectors data
app.get('/api/agriculture/sectors', authenticateToken, async (req, res) => {
  try {
    const geoExtractor = new GeoDataExtractor();
    const sectors = await geoExtractor.generateAgricultureSectors();
    
    res.json(sectors);
  } catch (err) {
    console.error('❌ Error fetching agriculture sectors:', err);
    res.status(500).json({ message: 'Failed to fetch agriculture sectors', error: err.message });
  }
});

// Get monitoring stations data
app.get('/api/agriculture/monitoring-stations', authenticateToken, async (req, res) => {
  try {
    const geoExtractor = new GeoDataExtractor();
    const stations = await geoExtractor.generateMonitoringStations();
    
    res.json(stations);
  } catch (err) {
    console.error('❌ Error fetching monitoring stations:', err);
    res.status(500).json({ message: 'Failed to fetch monitoring stations', error: err.message });
  }
});

// Get satellite overlays
app.get('/api/agriculture/satellite-overlays', authenticateToken, async (req, res) => {
  try {
    const geoExtractor = new GeoDataExtractor();
    const overlays = await geoExtractor.generateSatelliteOverlays();
    
    res.json(overlays);
  } catch (err) {
    console.error('❌ Error fetching satellite overlays:', err);
    res.status(500).json({ message: 'Failed to fetch satellite overlays', error: err.message });
  }
});

// Process real agriculture data from Google Cloud
app.get('/api/agriculture/real-data', authenticateToken, async (req, res) => {
  try {
    const geoExtractor = new GeoDataExtractor();
    const realData = await geoExtractor.processRealAgricultureData();
    
    res.json(realData);
  } catch (err) {
    console.error('❌ Error processing real agriculture data:', err);
    res.status(500).json({ message: 'Failed to process real agriculture data', error: err.message });
  }
});

// ==================== Domain Data Endpoints ====================

// Get domain dataset metadata
app.get('/api/domains/:domain/metadata', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const metadata = await getDomainDatasetMetadata(domain);
    res.json(metadata);
  } catch (err) {
    console.error(`❌ Error fetching ${req.params.domain} metadata:`, err);
    res.status(500).json({ message: 'Failed to fetch domain metadata', error: err.message });
  }
});

// Get sample data for a domain
app.get('/api/domains/:domain/sample', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const { category, limit } = req.query;
    
    // Get sample data with size limits
    const sampleData = await getSampleData(domain, category, limit ? parseInt(limit) : 10);
    
    // Apply safety filters to prevent JSON.stringify issues with large payloads
    const safeData = sampleData.map(item => {
      // Limit preview content length to prevent response size issues
      if (item.preview && item.preview.length > 2000) {
        return {
          ...item,
          preview: item.preview.substring(0, 2000) + '... (preview truncated)',
          previewTruncated: true
        };
      }
      return item;
    });
    
    res.json(safeData);
  } catch (err) {
    console.error(`❌ Error fetching ${req.params.domain} sample data:`, err);
    res.status(500).json({ 
      message: 'Failed to fetch sample data', 
      error: err.message,
      // Include stack trace for debugging in development
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

// Get domain analytics
app.get('/api/domains/:domain/analytics', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const analytics = await getDomainAnalytics(domain);
    res.json(analytics);
  } catch (err) {
    console.error(`❌ Error fetching ${req.params.domain} analytics:`, err);
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
});

// Test email endpoint
app.get('/test-email', async (req, res) => {
  try {
    const testOtp = getRandomOtp();
    const info = await transporter.sendMail({
      from: `"ETR Clean" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test OTP Email',
      html: `<p>This is a test OTP email! Your OTP: <b>${testOtp}</b></p>`
    });
    console.log('✅ Test email sent:', info.messageId);
    res.send('Test email sent! Check console.');
  } catch (err) {
    console.error('❌ Error sending test email:', err);
    res.status(500).send('Failed to send test email');
  }
});

// Check user verification status
app.get('/api/auth/check-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json({ 
      email: user.email,
      verified: user.otpVerified,
      otp: user.otp, // Only for debugging purposes - remove in production
      otpExpiry: user.otpExpiry // Only for debugging purposes - remove in production
    });
  } catch (err) {
    console.error('❌ Error checking user status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== OpenSky Network Flight Tracking ====================


const OPENSKY_CLIENT_ID = process.env.OPENSKY_CLIENT_ID || 'yvasanthi314-api-client';
const OPENSKY_CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET || 'uVrUHLnn0CH7ffmSFH3pDV3Kl446LhpV';
const OPENSKY_USERNAME = process.env.OPENSKY_USERNAME || 'yvasanthi314';

// OpenSky Network API endpoints
// const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'; // Commented out as it's unused
const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

// Token management
let accessToken = null;
let tokenExpiry = null;
let authMethod = 'oauth2'; // Force OAuth2 since it's working

// Rate limiting variables
let lastSuccessfulData = null;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 10000; 


async function getAccessToken() {
    return new Promise((resolve, reject) => {
        // Check if we have a valid token
        if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
            console.log('🔄 Using cached OAuth2 token');
            resolve(accessToken);
            return;
        }

        console.log('🔑 Requesting new OAuth2 access token...');
        console.log('🌐 Environment: ' + (process.env.NODE_ENV || 'development'));
        console.log('🆔 Client ID: ' + OPENSKY_CLIENT_ID);

        const postData = querystring.stringify({
            'grant_type': 'client_credentials',
            'client_id': OPENSKY_CLIENT_ID,
            'client_secret': OPENSKY_CLIENT_SECRET
        });

        // Reduced timeout for faster failure detection
        const REQUEST_TIMEOUT = 10000; // 10 seconds

        const options = {
            hostname: 'auth.opensky-network.org',
            port: 443,
            path: '/auth/realms/opensky-network/protocol/openid-connect/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Earth Observation System/2.0',
                'Connection': 'close' // Ensure connection is closed after request
            }
        };

        const startTime = Date.now();
        console.log('📤 Sending OAuth2 request to auth.opensky-network.org...');

        const req = https.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            console.log(`📊 OAuth2 response received in ${responseTime}ms - Status: ${res.statusCode}`);
            
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const tokenResponse = JSON.parse(data);
                        if (tokenResponse.access_token) {
                            accessToken = tokenResponse.access_token;
                            
                            // Set token expiry (usually expires_in is in seconds)
                            const expiresIn = tokenResponse.expires_in || 1800; // Default to 30 minutes
                            tokenExpiry = Date.now() + (expiresIn * 1000) - 120000; // Subtract 2 minutes for safety
                            
                            console.log('✅ OAuth2 token obtained successfully');
                            console.log(`⏰ Token expires in ${expiresIn} seconds`);
                            resolve(accessToken);
                        } else {
                            console.error('❌ OAuth2 response missing access_token:', data);
                            reject(new Error('OAuth2 response missing access_token'));
                        }
                    } else {
                        console.error('❌ OAuth2 token request failed:', res.statusCode);
                        console.error('📄 Response body:', data);
                        reject(new Error(`OAuth2 failed: HTTP ${res.statusCode} - ${data}`));
                    }
                } catch (error) {
                    console.error('❌ Error parsing OAuth2 token response:', error.message);
                    console.error('📄 Raw response:', data);
                    reject(new Error(`OAuth2 JSON parse error: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            console.error(`❌ OAuth2 token request error after ${responseTime}ms:`, error.message);
            console.error('🔍 Error code:', error.code);
            console.error('🔍 Error type:', error.constructor.name);
            
            // Provide more specific error messages
            let errorMessage = 'OAuth2 request failed';
            if (error.code === 'ENOTFOUND') {
                errorMessage = 'DNS resolution failed for auth.opensky-network.org';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Connection refused by auth.opensky-network.org';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Connection timeout to auth.opensky-network.org';
            } else if (error.code === 'ECONNRESET') {
                errorMessage = 'Connection reset by auth.opensky-network.org';
            }
            
            reject(new Error(`${errorMessage}: ${error.message}`));
        });

        req.on('timeout', () => {
            const responseTime = Date.now() - startTime;
            console.error(`❌ OAuth2 token request timeout after ${responseTime}ms`);
            req.destroy();
            reject(new Error(`OAuth2 request timeout after ${REQUEST_TIMEOUT}ms`));
        });

        // Set timeout
        req.setTimeout(REQUEST_TIMEOUT, () => {
            const responseTime = Date.now() - startTime;
            console.error(`❌ OAuth2 request timeout (setTimeout) after ${responseTime}ms`);
            req.destroy();
            reject(new Error(`OAuth2 request timeout after ${REQUEST_TIMEOUT}ms`));
        });

        // Handle socket errors
        req.on('socket', (socket) => {
            socket.on('timeout', () => {
                console.error('❌ OAuth2 socket timeout');
                req.destroy();
            });
        });

        req.write(postData);
        req.end();
    });
}

// Function to make authenticated API request - OAuth2 ONLY
async function makeAuthenticatedRequest(url) {
    return new Promise(async (resolve, reject) => {
        const timeout = 15000; // Increased timeout for OAuth2
        let requestTimeout;
        
        try {
            let options = {
                headers: {
                    'User-Agent': 'Earth Observation System/1.0',
                    'Accept': 'application/json'
                },
                timeout: timeout
            };

            // Use OAuth2 authentication only (since it's working)
            try {
                const token = await getAccessToken();
                options.headers['Authorization'] = `Bearer ${token}`;
                console.log('� Using OAuth2 Authentication...');
            } catch (error) {
                console.log('❌ OAuth2 failed:', error.message);
                reject(new Error('OAuth2 authentication failed'));
                return;
            }

            const request = https.get(url, options, (response) => {
                let data = '';
                
                // Clear the timeout since we got a response
                if (requestTimeout) {
                    clearTimeout(requestTimeout);
                }
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        data: data
                    });
                });
            }).on('error', (error) => {
                if (requestTimeout) {
                    clearTimeout(requestTimeout);
                }
                reject(error);
            });

            // Set up timeout
            requestTimeout = setTimeout(() => {
                request.destroy();
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);

            // Handle socket timeout
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request socket timeout'));
            });

        } catch (error) {
            if (requestTimeout) {
                clearTimeout(requestTimeout);
            }
            reject(error);
        }
    });
}

// Flight data endpoint - LIVE DATA ONLY (NO MOCK DATA)
app.get('/api/flights', async (req, res) => {
    try {
        const now = Date.now();
        
        // Check if we should use cached LIVE data to avoid excessive API calls
        if (lastSuccessfulData && (now - lastFetchTime) < MIN_FETCH_INTERVAL) {
            console.log('📦 Returning cached LIVE flight data (rate limit protection)');
            res.json({
                success: true,
                flights: lastSuccessfulData,
                count: lastSuccessfulData.length,
                timestamp: new Date().toISOString(),
                source: 'cached_live_data',
                auth_method: 'oauth2',
                message: 'Cached live data from OpenSky Network'
            });
            return;
        }

        console.log('🛫 Fetching LIVE flight data from OpenSky Network via OAuth2...');
        
        try {
            const response = await makeAuthenticatedRequest(OPENSKY_API_URL);
            
            if (response.statusCode === 200) {
                const jsonData = JSON.parse(response.data);
                
                if (jsonData && jsonData.states && jsonData.states.length > 0) {
                    const flights = processFlightData(jsonData.states);
                    
                    // Cache successful response
                    lastSuccessfulData = flights;
                    lastFetchTime = now;

                    console.log(`✅ Successfully fetched ${flights.length} LIVE flights via OAuth2`);
                    res.json({
                        success: true,
                        flights: flights,
                        count: flights.length,
                        timestamp: new Date().toISOString(),
                        source: 'live_oauth2',
                        auth_method: 'oauth2'
                    });
                    return;
                } else {
                    console.log('⚠️ OpenSky API returned empty data');
                    if (lastSuccessfulData) {
                        res.json({
                            success: true,
                            flights: lastSuccessfulData,
                            count: lastSuccessfulData.length,
                            timestamp: new Date().toISOString(),
                            source: 'cached_live_data',
                            auth_method: 'oauth2',
                            message: 'OpenSky returned empty data, using cached live data'
                        });
                    } else {
                        res.status(503).json({
                            success: false,
                            error: 'No flight data available',
                            message: 'OpenSky API returned empty data and no cache available'
                        });
                    }
                    return;
                }
            } else if (response.statusCode === 429) {
                console.log('⚠️ Rate limited by OpenSky API');
                if (lastSuccessfulData) {
                    res.json({
                        success: true,
                        flights: lastSuccessfulData,
                        count: lastSuccessfulData.length,
                        timestamp: new Date().toISOString(),
                        source: 'cached_live_data',
                        auth_method: 'oauth2',
                        message: 'Rate limited - returning cached live data'
                    });
                } else {
                    res.status(429).json({
                        success: false,
                        error: 'Rate limited and no cached data available',
                        message: 'Please try again in a few moments'
                    });
                }
                return;
            } else if (response.statusCode === 401 || response.statusCode === 403) {
                console.log(`🔐 Authentication failed (${response.statusCode}) - trying token refresh`);
                
                // Try to refresh OAuth2 token
                try {
                    accessToken = null;
                    tokenExpiry = null;
                    const retryResponse = await makeAuthenticatedRequest(OPENSKY_API_URL);
                    
                    if (retryResponse.statusCode === 200) {
                        const jsonData = JSON.parse(retryResponse.data);
                        if (jsonData && jsonData.states) {
                            const flights = processFlightData(jsonData.states);
                            lastSuccessfulData = flights;
                            lastFetchTime = now;
                            
                            console.log(`✅ Successfully fetched ${flights.length} flights after token refresh`);
                            res.json({
                                success: true,
                                flights: flights,
                                count: flights.length,
                                timestamp: new Date().toISOString(),
                                source: 'live_oauth2_retry',
                                auth_method: 'oauth2'
                            });
                            return;
                        }
                    }
                } catch (retryError) {
                    console.log('❌ Token refresh failed:', retryError.message);
                }
                
                res.status(401).json({
                    success: false,
                    error: 'Authentication failed',
                    message: 'Unable to authenticate with OpenSky Network - check credentials'
                });
                return;
            } else {
                console.log(`⚠️ OpenSky API returned status ${response.statusCode}`);
                res.status(response.statusCode).json({
                    success: false,
                    error: `OpenSky API returned status ${response.statusCode}`,
                    message: 'OpenSky Network service is temporarily unavailable'
                });
                return;
            }
        } catch (networkError) {
            console.error('❌ Network error fetching flight data:', networkError.message);
            
            // If we have cached data, return it during network issues
            if (lastSuccessfulData) {
                console.log('📦 Network error - returning cached live data');
                res.json({
                    success: true,
                    flights: lastSuccessfulData,
                    count: lastSuccessfulData.length,
                    timestamp: new Date().toISOString(),
                    source: 'cached_live_data',
                    auth_method: 'oauth2',
                    message: 'Network error - using cached live data',
                    network_error: networkError.message
                });
            } else {
                res.status(503).json({
                    success: false,
                    error: 'Service temporarily unavailable',
                    message: 'Unable to connect to OpenSky Network and no cached data available',
                    details: networkError.message
                });
            }
        }

    } catch (error) {
        console.error('❌ Unexpected server error:', error.message);
        
        // Return cached data if available, otherwise return error
        if (lastSuccessfulData) {
            res.json({
                success: true,
                flights: lastSuccessfulData,
                count: lastSuccessfulData.length,
                timestamp: new Date().toISOString(),
                source: 'cached_live_data',
                message: 'Server error - using cached live data',
                error: error.message,
                auth_method: 'oauth2'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Failed to fetch flight data and no cache available',
                details: error.message
            });
        }
    }
});

// Process flight data helper function
function processFlightData(states) {
    return states
        .filter(state => state[6] !== null && state[5] !== null && state[1] !== null) // Filter out flights without coordinates or callsign
        .slice(0, 2000) // Increased limit for authenticated users
        .map((state, index) => ({
            id: `${state[0]}_${index}`,
            icao24: state[0],
            callsign: state[1] ? state[1].trim() : `FLIGHT_${index}`,
            country: state[2] || 'Unknown',
            longitude: state[5],
            latitude: state[6],
            altitude: state[7] || 0,
            velocity: state[9] ? state[9] * 3.6 : 0, // Convert m/s to km/h
            heading: state[10] || 0,
            verticalRate: state[11] || 0,
            lastContact: state[4] || Date.now() / 1000,
            onGround: state[8] || false,
            timePosition: state[3],
            geoAltitude: state[13],
            squawk: state[14],
            spi: state[15],
            positionSource: state[16]
        }));
}

// Get flights within a bounding box (authenticated endpoint)
app.get('/api/flights/bounds', async (req, res) => {
    try {
        const { lamin, lomin, lamax, lomax } = req.query;
        
        if (!lamin || !lomin || !lamax || !lomax) {
            return res.status(400).json({
                error: 'Missing required parameters: lamin, lomin, lamax, lomax'
            });
        }

        console.log(`🗺️  Fetching flights in bounds: ${lamin},${lomin} to ${lamax},${lomax}`);
        
        const url = `${OPENSKY_API_URL}?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
        const response = await makeAuthenticatedRequest(url);
        
        if (response.statusCode !== 200) {
            throw new Error(`API returned status ${response.statusCode}`);
        }

        const jsonData = JSON.parse(response.data);
        
        if (jsonData && jsonData.states) {
            const flights = processFlightData(jsonData.states);

            res.json({
                success: true,
                flights: flights,
                count: flights.length,
                timestamp: new Date().toISOString(),
                bounds: { lamin, lomin, lamax, lomax },
                source: authMethod === 'oauth2' ? 'live_oauth2' : 'live_basic_auth',
                auth_method: authMethod
            });
        } else {
            throw new Error('Invalid data format from OpenSky API');
        }

    } catch (error) {
        console.error('❌ Error in bounds endpoint:', error.message);
        res.status(500).json({
            error: 'Failed to fetch flight data',
            message: error.message,
            auth_method: authMethod
        });
    }
});

// ==================== Domain API Endpoints ====================

// Get domain metadata
app.get('/api/domains/:domain/metadata', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    console.log(`🔍 Getting metadata for domain: ${domain}`);
    
    const metadata = await getDomainDatasetMetadata(domain);
    res.json(metadata);
  } catch (error) {
    console.error(`❌ Error getting ${req.params.domain} metadata:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to fetch ${req.params.domain} metadata`
    });
  }
});

// Get domain analytics
app.get('/api/domains/:domain/analytics', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    console.log(`📊 Getting analytics for domain: ${domain}`);
    
    const analytics = await getDomainAnalytics(domain);
    res.json(analytics);
  } catch (error) {
    console.error(`❌ Error getting ${req.params.domain} analytics:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to fetch ${req.params.domain} analytics`
    });
  }
});

// Get domain sample data
app.get('/api/domains/:domain/sample', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const { category, limit = 10 } = req.query;
    
    console.log(`📋 Getting sample data for domain: ${domain}, category: ${category}, limit: ${limit}`);
    
    const sampleData = await getSampleData(domain, category, parseInt(limit));
    res.json(sampleData);
  } catch (error) {
    console.error(`❌ Error getting ${req.params.domain} sample data:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to fetch ${req.params.domain} sample data`
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        authenticated: true,
        auth_method: 'oauth2',
        opensky_client_id: OPENSKY_CLIENT_ID,
        opensky_username: OPENSKY_USERNAME,
        token_status: accessToken ? 'valid' : 'not_obtained',
        data_source: 'live_only',
        policy: 'NO_MOCK_DATA',
        cached_data_available: lastSuccessfulData ? true : false,
        last_successful_fetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : 'never'
    });
});

// Test OAuth2 connectivity endpoint
app.get('/api/test-oauth2', async (req, res) => {
    try {
        console.log('🧪 Testing OAuth2 connectivity...');
        console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
        console.log('🆔 Client ID:', OPENSKY_CLIENT_ID);
        console.log('🔐 Client Secret Length:', OPENSKY_CLIENT_SECRET.length);
        
        const startTime = Date.now();
        const token = await getAccessToken();
        const endTime = Date.now();
        
        res.json({
            success: true,
            message: 'OAuth2 authentication successful',
            token_obtained: true,
            token_length: token ? token.length : 0,
            token_expiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
            response_time_ms: endTime - startTime,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            client_id: OPENSKY_CLIENT_ID
        });
    } catch (error) {
        console.error('❌ OAuth2 test failed:', error.message);
        console.error('🔍 Error details:', error);
        
        res.status(500).json({
            success: false,
            error: 'OAuth2 authentication failed',
            error_message: error.message,
            error_code: error.code || 'UNKNOWN',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            client_id: OPENSKY_CLIENT_ID,
            troubleshooting: [
                'Check network connectivity to auth.opensky-network.org',
                'Verify OAuth2 credentials are correct',
                'Ensure firewall allows HTTPS connections',
                'Try again as this might be a temporary network issue',
                'Check if Render allows outbound HTTPS to external OAuth providers'
            ]
        });
    }
});

// Network diagnostic endpoint
app.get('/api/diagnose-network', async (req, res) => {
    const results = {
        hostname: 'auth.opensky-network.org',
        timestamp: new Date().toISOString(),
        tests: {}
    };
    
    try {
        console.log('🔍 Running network diagnostics for OAuth2...');
        
        // Test 1: DNS Resolution
        try {
            const dnsStart = Date.now();
            const dnsResult = await new Promise((resolve, reject) => {
                dns.lookup('auth.opensky-network.org', (err, address, family) => {
                    if (err) reject(err);
                    else resolve({ address, family });
                });
            });
            results.tests.dns = {
                success: true,
                response_time_ms: Date.now() - dnsStart,
                ip_address: dnsResult.address,
                family: dnsResult.family
            };
            console.log('✅ DNS Resolution successful:', dnsResult);
        } catch (error) {
            results.tests.dns = {
                success: false,
                error: error.message,
                error_code: error.code
            };
            console.log('❌ DNS Resolution failed:', error.message);
        }
        
        // Test 2: Basic HTTPS Connection
        try {
            const connectStart = Date.now();
            await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'auth.opensky-network.org',
                    port: 443,
                    path: '/',
                    method: 'GET',
                    timeout: 5000
                }, (res) => {
                    results.tests.https_connection = {
                        success: true,
                        response_time_ms: Date.now() - connectStart,
                        status_code: res.statusCode,
                        headers_received: true
                    };
                    console.log('✅ HTTPS Connection successful');
                    resolve();
                });
                
                req.on('error', (error) => {
                    results.tests.https_connection = {
                        success: false,
                        response_time_ms: Date.now() - connectStart,
                        error: error.message,
                        error_code: error.code
                    };
                    reject(error);
                });
                
                req.on('timeout', () => {
                    req.destroy();
                    results.tests.https_connection = {
                        success: false,
                        response_time_ms: Date.now() - connectStart,
                        error: 'Connection timeout'
                    };
                    reject(new Error('Connection timeout'));
                });
                
                req.setTimeout(5000);
                req.end();
            });
        } catch (error) {
            console.log('❌ HTTPS Connection failed:', error.message);
        }
        
        res.json({
            success: true,
            message: 'Network diagnostics completed',
            ...results
        });
        
    } catch (error) {
        console.error('❌ Network diagnostics failed:', error);
        res.status(500).json({
            success: false,
            error: 'Network diagnostics failed',
            error_message: error.message,
            ...results
        });
    }
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Earth Observation Flight Tracker API',
        version: '5.0.0',
        description: 'Real-time flight tracking using OpenSky Network API with OAuth2 authentication - LIVE DATA ONLY',
        endpoints: {
            '/api/flights': 'Get all current LIVE flights',
            '/api/flights/bounds': 'Get LIVE flights within bounding box (requires lamin, lomin, lamax, lomax query params)',
            '/api/health': 'Health check',
            '/api/info': 'API information'
        },
        features: [
            'OAuth2 authentication only',
            'Real-time live flight data',
            'Bounding box filtering',
            'Rate limiting protection',
            'NO MOCK DATA - Live data only',
            'Cached live data for rate limiting'
        ],
        current_auth_method: authMethod,
        data_policy: 'LIVE_DATA_ONLY'
    });
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛫 Earth Observation Server running on port ${PORT}`);
    console.log(`🌍 LIVE flight data only at http://localhost:${PORT}/api/flights`);
    console.log(`📊 Health check at http://localhost:${PORT}/api/health`);
    console.log(`🧪 OAuth2 test at http://localhost:${PORT}/api/test-oauth2`);
    console.log(`🔐 Using OAuth2 authentication ONLY`);
    console.log(`🚫 NO MOCK DATA - Live data only policy`);
    console.log(`🆔 Client ID: ${OPENSKY_CLIENT_ID}`);
    console.log(`👤 Username: ${OPENSKY_USERNAME}`);
})
.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Try using a different port.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err);
    }
});
