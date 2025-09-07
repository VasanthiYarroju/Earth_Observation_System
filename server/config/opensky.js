// OpenSky Network Configuration Service
class OpenSkyConfig {
  constructor() {
    this.clientId = process.env.OPENSKY_CLIENT_ID || 'yvasanthi314-api-client';
    this.clientSecret = process.env.OPENSKY_CLIENT_SECRET || 'uVrUHLnn0CH7ffmSFH3pDV3Kl446LhpV';
    this.username = process.env.OPENSKY_USERNAME || 'yvasanthi314';
    this.password = process.env.OPENSKY_PASSWORD || 'Yarrojuvasanthi@2005';
    
    // API Endpoints
    this.tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
    this.apiUrl = 'https://opensky-network.org/api/states/all';
    this.boundedApiUrl = 'https://opensky-network.org/api/states/all';
    
    // Configuration options
    this.timeout = 8000;
    this.retryAttempts = 2;
    this.rateLimitInterval = 10000; // 10 seconds
    
    this.validateConfig();
  }

  validateConfig() {
    const required = ['clientId', 'clientSecret', 'username', 'password'];
    const missing = required.filter(key => !this[key]);
    
    if (missing.length > 0) {
      console.warn(`⚠️  Missing OpenSky credentials: ${missing.join(', ')}`);
      console.warn('Some flight tracking features may not work correctly.');
    } else {
      console.log('✅ OpenSky Network configuration loaded successfully');
    }
  }

  getOAuthCredentials() {
    return {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials'
    };
  }

  getBasicAuthCredentials() {
    return Buffer.from(`${this.username}:${this.password}`).toString('base64');
  }

  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.username && this.password);
  }

  getApiUrl(bounds = null) {
    if (bounds && bounds.lamin !== undefined) {
      const { lamin, lomin, lamax, lomax } = bounds;
      return `${this.boundedApiUrl}?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    }
    return this.apiUrl;
  }
}

module.exports = new OpenSkyConfig();
