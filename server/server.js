// Before: const express = require('express');
import express from 'express';
import mongoose from 'mongoose';
// Before: const cors = require('cors');
import cors from 'cors';
// Before: const https = require('https');
import https from 'https';
// Before: const querystring = require('querystring');
import querystring from 'querystring';
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
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Use agriculture routes
app.use('/api/agriculture', agricultureRoutes);

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

// OpenSky Network credentials
const OPENSKY_CLIENT_ID = 'yvasanthi314-api-client';
const OPENSKY_CLIENT_SECRET = 'mQwg9CACBuE8mIrQjfIdFSSiKFuNItO7';
const OPENSKY_USERNAME = 'yvasanthi314';
const OPENSKY_PASSWORD = 'Vasanthi@123';

// OpenSky Network API endpoints
// const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'; // Commented out as it's unused
const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

// Token management
let accessToken = null;
let tokenExpiry = null;
let authMethod = 'oauth2'; 

// Rate limiting variables
let lastSuccessfulData = null;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 10000; 


async function getAccessToken() {
    return new Promise((resolve, reject) => {
        // Check if we have a valid token
        if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
            resolve(accessToken);
            return;
        }

        console.log('🔑 Requesting new OAuth2 access token...');

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
                try {
                    if (res.statusCode === 200) {
                        const tokenResponse = JSON.parse(data);
                        accessToken = tokenResponse.access_token;
                        
                        // Set token expiry (usually expires_in is in seconds)
                        const expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour
                        tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // Subtract 1 minute for safety
                        
                        console.log('✅ OAuth2 token obtained successfully');
                        authMethod = 'oauth2';
                        resolve(accessToken);
                    } else {
                        console.error('❌ OAuth2 token request failed:', res.statusCode, data);
                        console.log('🔄 Falling back to Basic Authentication...');
                        authMethod = 'basic';
                        reject(new Error(`OAuth2 failed: ${res.statusCode} ${data}`));
                    }
                } catch (error) {
                    console.error('❌ Error parsing OAuth2 token response:', error);
                    console.log('🔄 Falling back to Basic Authentication...');
                    authMethod = 'basic';
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ OAuth2 token request error:', error);
            console.log('🔄 Falling back to Basic Authentication...');
            authMethod = 'basic';
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Function to make authenticated API request
async function makeAuthenticatedRequest(url) {
    return new Promise(async (resolve, reject) => {
        try {
            let options = {
                headers: {
                    'User-Agent': 'Earth Observation System/1.0',
                    'Accept': 'application/json'
                }
            };

            // Try OAuth2 first, then fall back to Basic Auth
            if (authMethod === 'oauth2') {
                try {
                    const token = await getAccessToken();
                    options.headers['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.log('🔄 OAuth2 failed, switching to Basic Authentication...');
                    authMethod = 'basic';
                }
            }

            // Use Basic Authentication if OAuth2 failed or is set to basic
            if (authMethod === 'basic') {
                const credentials = Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString('base64');
                options.headers['Authorization'] = `Basic ${credentials}`;
                console.log('🔐 Using Basic Authentication...');
            }

            https.get(url, options, (response) => {
                let data = '';
                
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
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

// Flight data endpoint
app.get('/api/flights', async (req, res) => {
    try {
        const now = Date.now();
        
        // Check if we should use cached data to avoid excessive API calls
        if (lastSuccessfulData && (now - lastFetchTime) < MIN_FETCH_INTERVAL) {
            console.log('📦 Returning cached flight data (rate limit protection)');
            res.json({
                success: true,
                flights: lastSuccessfulData,
                count: lastSuccessfulData.length,
                timestamp: new Date().toISOString(),
                source: 'cached',
                auth_method: authMethod
            });
            return;
        }

        console.log('🛫 Fetching authenticated flight data from OpenSky Network...');
        
        const response = await makeAuthenticatedRequest(OPENSKY_API_URL);
        
        if (response.statusCode === 429) {
            console.log('⚠️  Rate limited by OpenSky API, using cached or mock data');
            const fallbackData = lastSuccessfulData || generateMockFlights();
            res.json({
                success: true,
                flights: fallbackData,
                count: fallbackData.length,
                timestamp: new Date().toISOString(),
                source: lastSuccessfulData ? 'cached' : 'mock',
                auth_method: authMethod
            });
            return;
        }

        if (response.statusCode === 401 || response.statusCode === 403) {
            console.log(`🔐 Authentication failed (${response.statusCode}) - trying alternative method`);
            
            // Switch authentication method and retry once
            if (authMethod === 'oauth2') {
                authMethod = 'basic';
                accessToken = null;
                tokenExpiry = null;
                console.log('🔄 Switching to Basic Authentication and retrying...');
                
                try {
                    const retryResponse = await makeAuthenticatedRequest(OPENSKY_API_URL);
                    if (retryResponse.statusCode === 200) {
                        const jsonData = JSON.parse(retryResponse.data);
                        if (jsonData && jsonData.states) {
                            const flights = processFlightData(jsonData.states);
                            lastSuccessfulData = flights;
                            lastFetchTime = now;
                            
                            console.log(`✅ Successfully fetched ${flights.length} flights with Basic Authentication`);
                            res.json({
                                success: true,
                                flights: flights,
                                count: flights.length,
                                timestamp: new Date().toISOString(),
                                source: 'live_basic_auth',
                                auth_method: 'basic'
                            });
                            return;
                        }
                    }
                } catch (retryError) {
                    console.log('❌ Retry with Basic Auth also failed');
                }
            }
            
            const fallbackData = lastSuccessfulData || generateMockFlights();
            res.json({
                success: true,
                flights: fallbackData,
                count: fallbackData.length,
                timestamp: new Date().toISOString(),
                source: lastSuccessfulData ? 'cached' : 'mock',
                warning: 'Authentication failed with both methods, using fallback data',
                auth_method: authMethod
            });
            return;
        }

        if (response.statusCode !== 200) {
            console.log(`⚠️  API returned status ${response.statusCode}, using fallback data`);
            console.log(`⚠️  API response: ${response.data.substring(0, 200)}...`);
            const fallbackData = lastSuccessfulData || generateMockFlights();
            res.json({
                success: true,
                flights: fallbackData,
                count: fallbackData.length,
                timestamp: new Date().toISOString(),
                source: lastSuccessfulData ? 'cached' : 'mock',
                auth_method: authMethod,
                apiStatus: response.statusCode,
                message: "Using fallback data because OpenSky API is temporarily unavailable"
            });
            return;
        }

        const jsonData = JSON.parse(response.data);
        
        if (jsonData && jsonData.states) {
            const flights = processFlightData(jsonData.states);

            // Cache successful response
            lastSuccessfulData = flights;
            lastFetchTime = now;

            console.log(`✅ Successfully fetched ${flights.length} flights with ${authMethod} authentication`);
            res.json({
                success: true,
                flights: flights,
                count: flights.length,
                timestamp: new Date().toISOString(),
                source: authMethod === 'oauth2' ? 'live_oauth2' : 'live_basic_auth',
                auth_method: authMethod
            });
        } else {
            throw new Error('Invalid data format from OpenSky API');
        }

    } catch (error) {
        console.error('❌ Server error:', error.message);
        
        // Return cached or mock data as fallback
        const fallbackData = lastSuccessfulData || generateMockFlights();
        res.json({
            success: true,
            flights: fallbackData,
            count: fallbackData.length,
            timestamp: new Date().toISOString(),
            source: lastSuccessfulData ? 'cached' : 'mock',
            error: error.message,
            auth_method: authMethod
        });
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

// Generate mock flight data as fallback
function generateMockFlights() {
    const mockFlights = [];
    const airlines = ['UAL', 'DAL', 'AAL', 'SWA', 'BAW', 'AFR', 'DLH', 'KLM', 'ANA', 'JAL'];
    
    for (let i = 0; i < 100; i++) {
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const flightNumber = Math.floor(Math.random() * 9000) + 1000;
        
        mockFlights.push({
            id: `mock_${i}`,
            icao24: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            callsign: `${airline}${flightNumber}`,
            country: ['USA', 'UK', 'Germany', 'France', 'Japan', 'Netherlands', 'Canada'][Math.floor(Math.random() * 7)],
            longitude: (Math.random() - 0.5) * 360,
            latitude: (Math.random() - 0.5) * 150, // Limit latitude to avoid polar regions
            altitude: Math.random() * 12000 + 3000,
            velocity: Math.random() * 400 + 200,
            heading: Math.random() * 360,
            verticalRate: (Math.random() - 0.5) * 20,
            lastContact: Date.now() / 1000,
            onGround: false,
            timePosition: Date.now() / 1000 - Math.floor(Math.random() * 60),
            geoAltitude: null,
            squawk: null,
            spi: false,
            positionSource: 0
        });
    }
    
    return mockFlights;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        authenticated: true,
        auth_method: authMethod,
        opensky_client_id: OPENSKY_CLIENT_ID,
        opensky_username: OPENSKY_USERNAME,
        token_status: accessToken ? 'valid' : 'not_obtained'
    });
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Earth Observation Flight Tracker API',
        version: '4.0.0',
        description: 'Real-time flight tracking using OpenSky Network API with hybrid authentication',
        endpoints: {
            '/api/flights': 'Get all current flights',
            '/api/flights/bounds': 'Get flights within bounding box (requires lamin, lomin, lamax, lomax query params)',
            '/api/health': 'Health check',
            '/api/info': 'API information'
        },
        features: [
            'Hybrid authentication (OAuth2 + Basic Auth fallback)',
            'Real-time flight data',
            'Bounding box filtering',
            'Rate limiting protection',
            'Automatic authentication method switching',
            'Fallback to cached/mock data'
        ],
        current_auth_method: authMethod
    });
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛫 Earth Observation Server running on port ${PORT}`);
    console.log(`🌍 Flight data available at http://localhost:${PORT}/api/flights`);
    console.log(`📊 Health check at http://localhost:${PORT}/api/health`);
    console.log(`🔐 Using hybrid authentication (OAuth2 + Basic Auth fallback)`);
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
