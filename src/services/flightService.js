import axios from 'axios';
import { API_BASE_URL } from './api';

class FlightService {
  constructor() {
    this.serverURL = `${API_BASE_URL}/api`;
    this.timeout = 30000; // Increased timeout to 30 seconds for deployed backend
  }

  // Fetch all aircraft states from our server (which connects to OpenSky Network)
  async getAllStates() {
    try {
      console.log('🛫 Fetching flight data from deployed server...');
      
      const response = await axios.get(`${this.serverURL}/flights`, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      // Handle different response formats
      let flightData = null;
      if (response.data && response.data.success && response.data.flights) {
        console.log(`✅ Received ${response.data.count || response.data.flights.length} flights from ${response.data.source} source`);
        flightData = response.data.flights;
      } else if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Received ${response.data.length} flights from direct array response`);
        flightData = response.data;
      } else if (response.data && response.data.flights && Array.isArray(response.data.flights)) {
        console.log(`✅ Received ${response.data.flights.length} flights from flights array`);
        flightData = response.data.flights;
      } else {
        throw new Error('Invalid response format from server');
      }
      
      return flightData || [];
    } catch (error) {
      console.error('Error fetching flight data from server:', error.message);
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED') {
        console.log('⏰ Request timed out, using mock data as fallback');
      } else if (error.response) {
        console.log(`❌ Server responded with status: ${error.response.status}`);
      } else if (error.request) {
        console.log('🔌 No response received from server');
      }
      
      // Return mock data as final fallback
      console.log('🔄 Using local mock data as fallback');
      return this.getMockFlightData();
    }
  }

  // Get flights within a bounding box
  async getFlightsInBounds(lamin, lomin, lamax, lomax) {
    try {
      console.log(`🗺️  Fetching flights in bounds: ${lamin},${lomin} to ${lamax},${lomax}`);
      
      const response = await axios.get(`${this.serverURL}/flights/bounds`, {
        params: {
          lamin,
          lomin,
          lamax,
          lomax
        },
        timeout: this.timeout
      });
      
      if (response.data && response.data.success) {
        console.log(`✅ Received ${response.data.count} flights in bounds from ${response.data.source} source`);
        return response.data.flights;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching flights in bounds:', error.message);
      
      // Return filtered mock data as fallback
      return this.getMockFlightData().filter(flight => 
        flight.latitude >= lamin && flight.latitude <= lamax &&
        flight.longitude >= lomin && flight.longitude <= lomax
      );
    }
  }

  // Get server health status
  async getServerHealth() {
    try {
      const response = await axios.get(`${this.serverURL}/health`, {
        timeout: 5000
      });
      
      return response.data;
    } catch (error) {
      console.error('Error checking server health:', error.message);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Get API information
  async getAPIInfo() {
    try {
      const response = await axios.get(`${this.serverURL}/info`, {
        timeout: 5000
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching API info:', error.message);
      return null;
    }
  }

  // Generate mock flight data as fallback
  getMockFlightData() {
    console.log('📝 Generating mock flight data');
    
    const mockFlights = Array.from({ length: 75 }, (_, i) => ({
      id: `mock_${i}`,
      icao24: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      callsign: this.generateCallsign(),
      country: this.getRandomCountry(),
      longitude: (Math.random() - 0.5) * 360,
      latitude: (Math.random() - 0.5) * 150, // Avoid polar regions
      altitude: Math.random() * 12000 + 3000,
      velocity: Math.random() * 400 + 200,
      heading: Math.random() * 360,
      verticalRate: (Math.random() - 0.5) * 20,
      onGround: Math.random() > 0.9,
      lastContact: Math.floor(Date.now() / 1000),
      timePosition: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 60),
      geoAltitude: null,
      squawk: null,
      spi: false,
      positionSource: 0
    }));

    return mockFlights;
  }

  // Helper method to generate realistic callsigns
  generateCallsign() {
    const airlines = [
      'UAL', 'DAL', 'AAL', 'SWA', 'JBU', 'ASA', 'FFT', // US carriers
      'BAW', 'VIR', 'EZY', 'RYR', // UK carriers
      'DLH', 'EWG', 'GWI', // German carriers
      'AFR', 'EZS', // French carriers
      'KLM', 'TRA', // Dutch carriers
      'ANA', 'JAL', 'JJA', // Japanese carriers
      'CCA', 'CSN', 'CES', // Chinese carriers
      'UAE', 'ETD', 'QTR', // Middle East carriers
      'SIA', 'THA', 'MAS' // Asian carriers
    ];
    
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = Math.floor(Math.random() * 9000) + 100;
    
    return `${airline}${flightNumber}`;
  }

  // Helper method to get random country
  getRandomCountry() {
    const countries = [
      'United States', 'United Kingdom', 'Germany', 'France', 'Netherlands',
      'Japan', 'China', 'Canada', 'Australia', 'Brazil', 'India',
      'United Arab Emirates', 'Qatar', 'Singapore', 'Thailand', 'Malaysia',
      'Italy', 'Spain', 'Switzerland', 'Austria', 'Belgium', 'Sweden',
      'Norway', 'Denmark', 'Finland', 'South Korea', 'Turkey', 'Russia'
    ];
    
    return countries[Math.floor(Math.random() * countries.length)];
  }

  // Utility method to check if coordinates are valid
  isValidCoordinate(lat, lng) {
    return lat !== null && lng !== null && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  // Utility method to convert velocity from m/s to km/h
  convertVelocity(velocityMs) {
    return velocityMs ? velocityMs * 3.6 : 0;
  }

  // Utility method to format altitude
  formatAltitude(altitude) {
    return altitude ? Math.round(altitude) : 0;
  }
}

const flightService = new FlightService();
export default flightService;

