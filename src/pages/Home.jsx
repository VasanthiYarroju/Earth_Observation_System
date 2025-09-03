
import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import axios from 'axios';
import { Plane, Thermometer, Waves, Leaf, Sprout, User, X, Menu, ChevronsDown, 
         Cloud, Database, BarChart, Share2, Check, Satellite, Cpu, Globe as GlobeIcon, Globe2, Map, LogOut } from 'lucide-react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Homepage.css'; 
import './TechSection.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COUNTRIES_GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
const EARTHQUAKES_GEOJSON_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';

// --- Sidebar Configuration (UPDATED) ---
const allSidebarItems = [
  { id: 'flight-view', icon: <Plane size={28} />, text: 'Flight View', domain: 'Aviation' }, 
  { id: 'atmosphere', icon: <Thermometer size={28} />, text: 'Atmosphere', domain: 'Weather' },
  { id: 'oceanary', icon: <Waves size={28} />, text: 'Oceanary', domain: 'Marine' },
  { id: 'agricultureA', icon: <Sprout size={28} />, text: 'Crop Health', domain: 'Agriculture' },
  { id: 'land-use', icon: <Leaf size={28} />, text: 'Land Use', domain: 'Environment' },
  { id: 'disaster-monitoring', icon: <Thermometer size={28} />, text: 'Disaster Monitoring', domain: 'Disaster' },
  { id: 'forestry-analytics', icon: <Leaf size={28} />, text: 'Forestry Analytics', domain: 'Forestry' },
  { id: 'urban-planning', icon: <Map size={28} />, text: 'Urban Planning', domain: 'Urban Planning' },
];

const DOMAIN_COLORS = {
  // Base colors for each domain with updated colors
  land: '#8B4513',           // Brown for Land
  vegetation: '#006400',     // Dark Green for Vegetation
  risk_level: '#4B0082',     // Dark Purple for Risk Level
  disaster: '#FF0000',       // Red for Disaster
  sea_temperature: '#ADD8E6', // Light Blue for Sea Surface Temperature
  water: '#0000FF',          // Blue for Water Bodies
};

  // --- Region domain data mapping ---
  // ALL countries have data for ALL domains with varying intensity (0-10 scale)
  const REGION_DOMAIN_DATA = {
    // ISO_A3: { domain: intensity (0-10) }
    USA: { land: 8, vegetation: 7, risk_level: 6, disaster: 5, sea_temperature: 6, water: 7 },
    BRA: { land: 6, vegetation: 9, risk_level: 5, disaster: 4, sea_temperature: 7, water: 8 },
    CAN: { land: 7, vegetation: 8, risk_level: 4, disaster: 3, sea_temperature: 8, water: 9 },
    AUS: { land: 8, vegetation: 6, risk_level: 7, disaster: 6, sea_temperature: 8, water: 7 },
    RUS: { land: 9, vegetation: 7, risk_level: 5, disaster: 4, sea_temperature: 7, water: 8 },
    CHN: { land: 7, vegetation: 6, risk_level: 8, disaster: 5, sea_temperature: 6, water: 7 },
    IND: { land: 8, vegetation: 7, risk_level: 8, disaster: 7, sea_temperature: 5, water: 6 },
    ZAF: { land: 7, vegetation: 6, risk_level: 5, disaster: 8, sea_temperature: 6, water: 7 },
    JPN: { land: 5, vegetation: 6, risk_level: 8, disaster: 9, sea_temperature: 7, water: 8 },
    GRL: { land: 6, vegetation: 4, risk_level: 3, disaster: 3, sea_temperature: 8, water: 9 },
    NOR: { land: 7, vegetation: 6, risk_level: 4, disaster: 4, sea_temperature: 8, water: 9 },
    ISL: { land: 5, vegetation: 4, risk_level: 6, disaster: 7, sea_temperature: 8, water: 9 },
    MEX: { land: 8, vegetation: 7, risk_level: 5, disaster: 6, sea_temperature: 6, water: 7 },
    DEU: { land: 7, vegetation: 6, risk_level: 5, disaster: 3, sea_temperature: 6, water: 7 },
    FRA: { land: 7, vegetation: 7, risk_level: 5, disaster: 4, sea_temperature: 6, water: 7 },
    GBR: { land: 6, vegetation: 6, risk_level: 5, disaster: 4, sea_temperature: 7, water: 8 },
    ESP: { land: 8, vegetation: 7, risk_level: 5, disaster: 5, sea_temperature: 7, water: 6 },
    ITA: { land: 7, vegetation: 7, risk_level: 6, disaster: 6, sea_temperature: 7, water: 7 },
    EGY: { land: 9, vegetation: 4, risk_level: 6, disaster: 5, sea_temperature: 5, water: 4 },
    SAU: { land: 9, vegetation: 3, risk_level: 5, disaster: 4, sea_temperature: 4, water: 3 },
    THA: { land: 7, vegetation: 8, risk_level: 6, disaster: 7, sea_temperature: 8, water: 7 },
    VNM: { land: 7, vegetation: 8, risk_level: 6, disaster: 6, sea_temperature: 7, water: 8 },
    IDN: { land: 7, vegetation: 8, risk_level: 6, disaster: 7, sea_temperature: 8, water: 9 },
    ARG: { land: 8, vegetation: 7, risk_level: 5, disaster: 4, sea_temperature: 6, water: 7 },
    CHL: { land: 7, vegetation: 6, risk_level: 6, disaster: 7, sea_temperature: 7, water: 8 },
    // Default values for countries not specifically listed above
    DEFAULT: { land: 7, vegetation: 6, risk_level: 5, disaster: 5, sea_temperature: 6, water: 6 }
  };


// Helper component to update map view
const MapViewUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// MapWidget now only needs data relevant to its active items (no flightData prop anymore)
const MapWidget = ({ activeItem, weatherData, earthquakeData, oceanData }) => {
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  useEffect(() => {
    // Adjust map view based on active item
    switch (activeItem) {
      case 'atmosphere':
        setMapCenter([30, 0]);
        setMapZoom(2);
        break;
      case 'oceanary':
        setMapCenter([0, 0]);
        setMapZoom(2);
        break;
      case 'agricultureA':
      case 'land-use':
        setMapCenter([30, 0]);
        setMapZoom(2);
        break;
      case null: // Added for overview/default state
        setMapCenter([20, 0]);
        setMapZoom(2);
        break;
      default:
        setMapCenter([20, 0]);
        setMapZoom(2);
    }
  }, [activeItem]);

  const renderDataPoints = () => {
    switch (activeItem) {
      case 'atmosphere':
        return (weatherData || []).map(weather => (
          <CircleMarker
            key={weather.name}
            center={[weather.lat, weather.lon]}
            radius={8}
            pathOptions={{
              color: weather.temperature > 25 ? '#ff4444' : weather.temperature > 15 ? '#ffaa00' : '#4444ff',
              fillColor: weather.temperature > 25 ? '#ff4444' : weather.temperature > 15 ? '#ffaa00' : '#4444ff',
              fillOpacity: 0.7
            }}
          >
            <Popup>
              <div>
                <strong>{weather.name}</strong><br />
                Temperature: {weather.temperature}°C<br />
                Wind Speed: {weather.windspeed}km/h<br />
                Humidity: {weather.humidity || Math.round(Math.random() * 40 + 30)}%<br />
                Pressure: {weather.pressure || Math.round(Math.random() * 50 + 1000)}hPa
              </div>
            </Popup>
          </CircleMarker>
        ));

      case 'oceanary':
        return (earthquakeData.features || []).slice(0, 30).map(eq => (
          <CircleMarker
            key={eq.id}
            center={[eq.geometry.coordinates[1], eq.geometry.coordinates[0]]}
            radius={eq.properties.mag * 2}
            pathOptions={{ color: '#ff4d4d', fillColor: '#ff4d4d', fillOpacity: 0.6 }}
          >
            <Popup>
              <div>
                <strong>Magnitude {eq.properties.mag.toFixed(1)}</strong><br />
                {eq.properties.place}<br />
                Time: {new Date(eq.properties.time).toLocaleString()}
              </div>
            </Popup>
          </CircleMarker>
        ));

      default:
        return null;
    }
  };

  const getMapTitle = () => {
    switch (activeItem) {
      case 'atmosphere':
        return 'Global Weather Map';
      case 'oceanary':
        return 'Earthquake Activity';
      case 'agricultureA':
        return 'Crop Health Map Preview';
      case 'land-use':
        return 'Land Use Map Preview';
      case null:
        return 'General Earth Overview';
      default:
        return 'Interactive Map';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
        {getMapTitle()}
      </h4>
      <div style={{ height: '12rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          key={`${activeItem}-${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapViewUpdater center={mapCenter} zoom={mapZoom} /> {/* Update map view */}
          {renderDataPoints()}
        </MapContainer>
      </div>
    </div>
  );
};


const Homepage = () => {
  const globeEl = useRef();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Debug user data including domains
  useEffect(() => {
    console.log("Current user data:", user);
    console.log("User domains:", user?.domains);
  }, [user]);

  // --- State for UI & Data ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState(null); // Default view changed to null for overview mode
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
// Filter sidebar items based on user domains but ALWAYS include flight view
const sidebarItems = React.useMemo(() => {
  if (!user || !user.domains || user.domains.length === 0) {
    console.log("No user domains found, showing all sidebar items");
    return allSidebarItems; // Show all if no domains or not logged in
  }
  
  console.log("User domains:", user.domains); // Log user domains for debugging
  
  // Always keep the flight view item
  const flightViewItem = allSidebarItems.find(item => item.id === 'flight-view');
  
  // Filter other items based on domain access
  const domainFilteredItems = allSidebarItems.filter(item => {
    return item.id === 'flight-view' || user.domains.includes(item.domain);
  });
  
  console.log("Filtered sidebar items:", domainFilteredItems); // Log filtered items
  
  // If no items match domains (except flight view), return all items
  // Otherwise return the filtered items (which will include flight view)
  return domainFilteredItems.length > 1 ? domainFilteredItems : 
         (flightViewItem ? [flightViewItem, ...allSidebarItems.filter(item => item.id !== 'flight-view')] : allSidebarItems);
}, [user]);  // --- State for Globe Data Layers ---
  const [countriesData, setCountriesData] = useState({ features: [] });
  const [earthquakeData, setEarthquakeData] = useState({ features: [] });
  const [weatherData, setWeatherData] = useState([]);
  const [oceanData, setOceanData] = useState([]);
  const [hoveredPolygon, setHoveredPolygon] = useState(null);
  const [clickedRegionData, setClickedRegionData] = useState(null);
  const [selectedRegionDomain, setSelectedRegionDomain] = useState(null); // For showing domain info

  // No domain preview points needed as we're showing all domains for all countries

  // Handle user logout
  const handleLogout = () => {
    logout();
    // Add a small delay to ensure the auth state updates before navigation
    setTimeout(() => navigate('/earth', { replace: true }), 50);
  };

  // --- Real-time Data Fetching Functions ---

  // Function to fetch atmospheric data for a clicked region
  const fetchAtmosphericDataForRegion = async (lat, lng) => {
    try {
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relative_humidity_2m,surface_pressure,temperature_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min`);

      const currentWeather = response.data.current_weather;
      const hourlyData = response.data.hourly;
      const dailyData = response.data.daily;

      return {
        location: { lat, lng },
        temperature: currentWeather.temperature,
        windSpeed: currentWeather.windspeed,
        humidity: hourlyData.relative_humidity_2m[0] || Math.round(Math.random() * 40 + 30),
        pressure: hourlyData.surface_pressure[0] || Math.round(Math.random() * 50 + 1000),
        maxTemp: dailyData.temperature_2m_max[0] || currentWeather.temperature + 5,
        minTemp: dailyData.temperature_2m_min[0] || currentWeather.temperature - 5,
        weatherCode: currentWeather.weathercode,
        timestamp: new Date().toLocaleString()
      };
    } catch (error) {
      console.error('Error fetching atmospheric data:', error);
      // Return mock data as fallback
      return {
        location: { lat, lng },
        temperature: Math.round(Math.random() * 30 + 5),
        windSpeed: Math.round(Math.random() * 20 + 5),
        humidity: Math.round(Math.random() * 40 + 30),
        pressure: Math.round(Math.random() * 50 + 1000),
        maxTemp: Math.round(Math.random() * 35 + 10),
        minTemp: Math.round(Math.random() * 20 + 0),
        weatherCode: Math.floor(Math.random() * 4),
        timestamp: new Date().toLocaleString()
      };
    }
  };

  // --- Mock Data Generators ---
  const generateMockWeatherData = () => {
    const cities = [
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Paris', lat: 48.8566, lon: 2.3522 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333 }
    ];

    return cities.map(city => ({
      ...city,
      temperature: Math.round(Math.random() * 30 + 5),
      windspeed: Math.round(Math.random() * 20 + 5),
      weathercode: Math.floor(Math.random() * 4),
      humidity: Math.round(Math.random() * 40 + 30),
      pressure: Math.round(Math.random() * 50 + 1000)
    }));
  };

  const generateMockOceanData = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      latitude: (Math.random() - 0.5) * 180,
      longitude: (Math.random() - 0.5) * 360,
      temperature: Math.random() * 25 + 5,
      salinity: Math.random() * 5 + 30,
      depth: Math.random() * 5000 + 100
    }));
  };

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const cities = [
          { name: 'London', lat: 51.5074, lon: -0.1278 },
          { name: 'New York', lat: 40.7128, lon: -74.0060 },
          { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
          { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
          { name: 'Paris', lat: 48.8566, lon: 2.3522 },
          { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
          { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
          { name: 'São Paulo', lat: -23.5505, lon: -46.6333 }
        ];

        const weatherPromises = cities.map(async (city) => {
          try {
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=relative_humidity_2m,surface_pressure`);
            return {
              ...city,
              temperature: response.data.current_weather.temperature,
              windspeed: response.data.current_weather.windspeed,
              weathercode: response.data.current_weather.weathercode,
              humidity: response.data.hourly.relative_humidity_2m[0] || Math.round(Math.random() * 40 + 30),
              pressure: response.data.hourly.surface_pressure[0] || Math.round(Math.random() * 50 + 1000)
            };
          } catch (error) {
            return {
              ...city,
              temperature: Math.round(Math.random() * 30 + 5),
              windspeed: Math.round(Math.random() * 20 + 5),
              weathercode: Math.floor(Math.random() * 4),
              humidity: Math.round(Math.random() * 40 + 30),
              pressure: Math.round(Math.random() * 50 + 1000)
            };
          }
        });

        const weatherResults = await Promise.all(weatherPromises);
        setWeatherData(weatherResults);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherData(generateMockWeatherData());
      }
    };
    
    const fetchOceanData = async () => {
      try {
        // Mock ocean data for demonstration
        setOceanData(generateMockOceanData());
      } catch (error) {
        console.error('Error fetching ocean data:', error);
        setOceanData(generateMockOceanData());
      }
    };
    
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetch(COUNTRIES_GEOJSON_URL).then(res => res.json()).then(setCountriesData).catch(() => setCountriesData({ features: [] })),
          fetch(EARTHQUAKES_GEOJSON_URL).then(res => res.json()).then(setEarthquakeData).catch(() => setEarthquakeData({ features: [] })),
          fetchWeatherData(),
          fetchOceanData()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();

    const interval = setInterval(() => {
      if (activeItem === 'atmosphere') {
        fetchWeatherData();
      } else if (activeItem === 'oceanary') {
        fetchOceanData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [activeItem]);

  // --- Globe Configuration Effect ---
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      globeEl.current.pointOfView({ lat: 20, lng: 20, altitude: 2.5 }, 1000);
    }
  }, []);

  // Handle globe polygon clicks for multi-domain info
  const handlePolygonClick = async (polygon) => {
    // Get ISO_A3 code
    const iso = polygon.properties?.ISO_A3;
    const countryName = polygon.properties?.NAME || 'Unknown Region';
    
    // Get domain data for this region (or default values if not specified)
    const regionData = REGION_DOMAIN_DATA[iso] || REGION_DOMAIN_DATA.DEFAULT;
    
    // Find the dominant domain (highest value)
    let dominantDomain = 'land';
    let highestValue = 0;
    
    Object.entries(regionData).forEach(([domain, value]) => {
      if (domain !== 'DEFAULT' && value > highestValue) {
        highestValue = value;
        dominantDomain = domain;
      }
    });
    
    // Helper function to adjust color shade based on intensity
    const getColorShade = (baseColor, intensity) => {
      // Convert hex to RGB for easier manipulation
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      
      // Calculate adjustment factor based on intensity (0-10 scale)
      const factor = 0.7 + (intensity * 0.03); // Range from 0.7 to 1.0
      
      // Adjust RGB values
      const adjustedR = Math.min(255, Math.round(r * factor));
      const adjustedG = Math.min(255, Math.round(g * factor));
      const adjustedB = Math.min(255, Math.round(b * factor));
      
      // Convert back to hex
      return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    };
    
    // Get base color
    const baseColor = DOMAIN_COLORS[dominantDomain];
    // Adjust shade based on intensity
    const color = getColorShade(baseColor, highestValue);
    
    // Create domain color shades object with colors for each domain's intensity
    const domainColorShades = {};
    Object.entries(regionData).forEach(([domain, value]) => {
      if (domain !== 'DEFAULT') {
        domainColorShades[domain] = getColorShade(DOMAIN_COLORS[domain], value);
      }
    });
    
    // Format domain name for display
    const domainLabel = dominantDomain === 'risk_level' ? 'Risk Level' : 
                       dominantDomain === 'sea_temperature' ? 'Sea Temperature' : 
                       dominantDomain.charAt(0).toUpperCase() + dominantDomain.slice(1);
    
    setSelectedRegionDomain({
      iso,
      countryName,
      color,
      baseColor,
      label: domainLabel,
      dominantDomain,
      domainData: regionData,
      domainColorShades
    });
  };

  // Handle globe point clicks for country domain data
  const handlePointClick = async (point) => {
    // Handle country point click (containing all domain data)
    if (point && point.regionData) {
      const iso = point.iso;
      const countryName = point.countryName;
      const regionData = point.regionData;
      
      // Get color shade for domains
      const getColorShade = (baseColor, intensity) => {
        // Convert hex to RGB for easier manipulation
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        // Calculate adjustment factor based on intensity
        const factor = 0.7 + (intensity * 0.03);
        
        // Adjust RGB values
        const adjustedR = Math.min(255, Math.round(r * factor));
        const adjustedG = Math.min(255, Math.round(g * factor));
        const adjustedB = Math.min(255, Math.round(b * factor));
        
        // Convert back to hex
        return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
      };
      
      // Create domain color shades object with colors for each domain's intensity
      const domainColorShades = {};
      Object.entries(regionData).forEach(([domain, value]) => {
        if (domain !== 'DEFAULT') {
          domainColorShades[domain] = getColorShade(DOMAIN_COLORS[domain], value);
        }
      });
      
      // Find dominant domain
      let dominantDomain = 'land';
      let highestValue = 0;
      
      Object.entries(regionData).forEach(([domain, value]) => {
        if (domain !== 'DEFAULT' && value > highestValue) {
          highestValue = value;
          dominantDomain = domain;
        }
      });
      
      // Format domain name for display
      const domainLabel = dominantDomain === 'risk_level' ? 'Risk Level' : 
                          dominantDomain === 'sea_temperature' ? 'Sea Temperature' : 
                          dominantDomain.charAt(0).toUpperCase() + dominantDomain.slice(1);
      
      // Update the selected region domain state
      setSelectedRegionDomain({
        iso,
        countryName,
        color: DOMAIN_COLORS[dominantDomain],
        baseColor: DOMAIN_COLORS[dominantDomain],
        label: domainLabel,
        dominantDomain: dominantDomain,
        domainData: regionData,
        domainColorShades
      });
      
      // Focus the camera on this country
      if (globeEl.current) {
        globeEl.current.pointOfView({
          lat: point.lat,
          lng: point.lng,
          altitude: 1.5
        }, 1000);
      }
    } 
    // Original atmospheric data handling
    else if (activeItem === 'atmosphere' && point) {
      const lat = point.lat || point.latitude;
      const lng = point.lon || point.lng || point.longitude;

      if (lat && lng) {
        const atmosphericData = await fetchAtmosphericDataForRegion(lat, lng);
        setClickedRegionData({
          ...atmosphericData,
          countryName: point.name || 'Selected Location'
        });
      }
    }
  };

  // SidebarItem component (remains mostly the same)
  const SidebarItem = ({ item, isActive, onClick, isOpen }) => {
    const itemStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '0',
      cursor: 'pointer',
      height: '52px',
      width: '100%',
      background: 'none',
      border: 'none',
      textAlign: 'left',
      borderRadius: '12px',
      transition: 'background-color 0.2s',
      backgroundColor: isActive ? 'rgba(52, 152, 219, 0.8)' : 'transparent',
      whiteSpace: 'nowrap' // Ensure text does not wrap when sidebar is open
    };
    const iconColor = isActive ? '#212121' : '#FFFFFF';
    const textColor = isActive ? '#212121' : '#FFFFFF';

    return (
      <button style={itemStyle} onClick={onClick}>
        <div style={{ color: iconColor, marginLeft: '25px' }}>
          {item.icon}
        </div>
        {isOpen && (
          <span style={{ color: textColor, fontSize: '16px', fontWeight: '500' }}>
            {item.text}
          </span>
        )}
      </button>
    );
  };

  // RightPanel component (UPDATED for overview mode and general domain previews)
  const RightPanel = () => {
    // Show selected region domain info if available
    if (selectedRegionDomain) {
      // Domain descriptions
      const domainDescriptions = {
        land: "Land regions provide critical information about soil composition, terrain characteristics, and land use patterns. This data helps with urban planning and resource management. Access this domain through the 'Land Use' sidebar option.",
        vegetation: "Vegetation domains monitor plant health, forest cover, crop yields, and biodiversity patterns. This data supports agricultural optimization and conservation efforts. Access this domain through the 'Crop Health' sidebar option.",
        risk_level: "Risk level assessments identify areas vulnerable to various threats including environmental, geological, and man-made hazards. This data enables proactive risk management strategies. This domain is accessible based on your subscription level.",
        disaster: "Disaster regions highlight areas affected by or at risk of natural disasters including wildfires, flooding, earthquakes, and volcanic activity. Early detection saves lives and helps coordinate emergency responses. Access disaster data through your subscription plan.",
        sea_temperature: "Sea surface temperature monitoring tracks oceanic thermal patterns, anomalies, and their effects on marine life and weather systems. This data is crucial for climate research and weather forecasting. Access this domain through the 'Oceanary' sidebar option.",
        water: "Water domains track ocean and freshwater bodies, including water levels, quality, salinity, and marine ecosystems. This data supports water resource management and conservation. Access this domain through the 'Oceanary' sidebar option."
      };
      
      // Convert domain intensity to descriptive text
      const getIntensityLabel = (value) => {
        if (value >= 8) return "Very High";
        if (value >= 6) return "High";
        if (value >= 4) return "Moderate";
        if (value >= 2) return "Low";
        return "Very Low";
      };
      
      return (
        <div style={styles.widget}>
          <h3 style={styles.widgetTitle}>
            {selectedRegionDomain.countryName || selectedRegionDomain.iso}
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', marginBottom: '10px' }}>
              <strong>Dominant Domain:</strong> <span style={{ color: selectedRegionDomain.color }}>{selectedRegionDomain.label}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#e0e0e0', margin: '0 0 15px 0' }}>
              This region contains data across multiple environmental domains based on your subscription. Select sidebar options to view specific domain data.
            </p>
            <div style={{ 
              backgroundColor: 'rgba(79, 195, 247, 0.1)', 
              borderLeft: '3px solid #4fc3f7', 
              padding: '8px 12px',
              fontSize: '12px',
              marginBottom: '15px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <strong style={{ color: '#4fc3f7' }}>Pro Tip:</strong> Use the sidebar navigation to switch between your subscribed domains for detailed analysis.
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>
              Domain Distribution
            </h4>
            
            {/* Domain Intensity Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(selectedRegionDomain.domainData).map(([domain, value]) => (
                domain !== 'DEFAULT' && (
                  <div key={domain} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ 
                        color: selectedRegionDomain.domainColorShades?.[domain] || DOMAIN_COLORS[domain], 
                        fontWeight: '500' 
                      }}>
                        {domain === 'risk_level' ? 'Risk Level' : 
                         domain === 'sea_temperature' ? 'Sea Temperature' : 
                         domain.charAt(0).toUpperCase() + domain.slice(1)}
                      </span>
                      <span>{getIntensityLabel(value)}</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${value * 10}%`, 
                          backgroundColor: selectedRegionDomain.domainColorShades?.[domain] || DOMAIN_COLORS[domain],
                          borderRadius: '4px'
                        }} 
                      />
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
          
          {/* Domain Description Section */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>
              About {selectedRegionDomain.label} Domain
            </h4>
            <div style={{ padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '15px' }}>
              <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                {domainDescriptions[selectedRegionDomain.dominantDomain]}
              </p>
            </div>
          </div>
          
          {/* Live Data Insights Section */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>
              Multi-Domain Data Insights
            </h4>
            <div style={styles.listContainer}>
              {selectedRegionDomain.domainData.land >= 5 && (
                <div style={styles.listItem}>
                  <span style={{...styles.listItemTitle, color: DOMAIN_COLORS.land}}>Land Use</span>
                  <span style={styles.listItemText}>Urban/Agricultural Mix</span>
                </div>
              )}
              {selectedRegionDomain.domainData.vegetation >= 5 && (
                <div style={styles.listItem}>
                  <span style={{...styles.listItemTitle, color: DOMAIN_COLORS.vegetation}}>Vegetation Index</span>
                  <span style={styles.listItemText}>Healthy (0.72)</span>
                </div>
              )}
              {selectedRegionDomain.domainData.risk_level >= 5 && (
                <div style={styles.listItem}>
                  <span style={{...styles.listItemTitle, color: DOMAIN_COLORS.risk_level}}>Risk Level</span>
                  <span style={styles.listItemText}>Elevated</span>
                </div>
              )}
              {selectedRegionDomain.domainData.disaster >= 5 && (
                <div style={styles.listItem}>
                  <span style={{...styles.listItemTitle, color: DOMAIN_COLORS.disaster}}>Disaster Events</span>
                  <span style={styles.listItemText}>2 active alerts</span>
                </div>
              )}
              {selectedRegionDomain.domainData.sea_temperature >= 5 && (
                <div style={styles.listItem}>
                  <span style={{...styles.listItemTitle, color: DOMAIN_COLORS.sea_temperature}}>Sea Surface Temp</span>
                  <span style={styles.listItemText}>+0.8°C above normal</span>
                </div>
              )}
              {selectedRegionDomain.domainData.water >= 5 && (
                <div style={styles.listItem}>
                  <span style={{...styles.listItemTitle, color: DOMAIN_COLORS.water}}>Water Quality</span>
                  <span style={styles.listItemText}>Good (89/100)</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#3498db' }}>
              * Data shown represents latest available measurements across domains
            </div>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            backgroundColor: 'rgba(30, 30, 45, 0.6)',
            borderRadius: '8px',
            padding: '15px',
            border: '1px dashed rgba(79, 195, 247, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ 
                color: '#4fc3f7', 
                marginRight: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Thermometer size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#4fc3f7' }}>Domain Access</h4>
            </div>
            <p style={{ 
              margin: '0 0 5px 0', 
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.4'
            }}>
              Access your subscribed domains by clicking on the corresponding items in the sidebar.
            </p>
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              Note: Domain access is limited to your subscription plan. Contact support to modify your domain access.
            </p>
          </div>
        </div>
      );
    }
    
    const panelStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      height: '100%'
    };

  // Generic display for domain previews (when clicked from globe or initially null)
  const renderDomainPreview = (domainId) => {
    let title = "Explore Your Subscribed Earth Observation Domains";
    let description = "Access your subscribed domains by selecting from the sidebar. Your account has been configured with domain access based on your subscription plan.";
    let sampleData = null;      switch (domainId) {
        case 'atmosphere':
          title = "Atmosphere Insights";
          description = "Monitor global weather patterns, temperature anomalies, and atmospheric pressure in real-time.";
          sampleData = (
            <div style={styles.listContainer}>
              {(weatherData || []).slice(0, 5).map(weather => (
                <div key={weather.name} style={styles.listItem}>
                  <span style={styles.listItemTitle}>{weather.name}</span>
                  <span style={styles.listItemText}>{weather.temperature}°C</span>
                </div>
              ))}
            </div>
          );
          break;
        case 'oceanary':
          title = "Oceanary Dynamics";
          description = "Discover sea surface temperatures, ocean currents, and seismic activity below the waves.";
          sampleData = (
            <div style={styles.listContainer}>
              {(earthquakeData.features || []).slice(0, 5).map(eq => (
                <div key={eq.id} style={styles.listItem}>
                  <span style={styles.listItemTitle}>M {eq.properties.mag.toFixed(1)}</span>
                  <span style={styles.listItemText}>{eq.properties.place}</span>
                </div>
              ))}
            </div>
          );
          break;
        case 'agricultureA':
          title = "Crop Health & Agriculture";
          description = "Track vegetation indices, soil moisture, and crop health to support sustainable farming practices.";
          sampleData = (
            <div style={styles.listContainer}>
              <div style={styles.listItem}><span style={styles.listItemTitle}>NDVI (Global Avg)</span><span style={styles.listItemText}>0.75</span></div>
              <div style={styles.listItem}><span style={styles.listItemTitle}>Soil Moisture (Europe)</span><span style={styles.listItemText}>Medium</span></div>
              <div style={styles.listItem}><span style={styles.listItemTitle}>Yield Forecast (US)</span><span style={styles.listItemText}>+5% expected</span></div>
            </div>
          );
          break;
        case 'land-use':
          title = "Land Use & Urbanization";
          description = "Analyze land cover changes, urban growth, and identify urban heat islands.";
          sampleData = (
            <div style={styles.listContainer}>
              <div style={styles.listItem}><span style={styles.listItemTitle}>Urban Growth (2000-2020)</span><span style={styles.listItemText}>+15%</span></div>
              <div style={styles.listItem}><span style={styles.listItemTitle}>Forest Cover Loss (Brazil)</span><span style={styles.listItemText}>-2% last year</span></div>
              <div style={styles.listItem}><span style={styles.listItemTitle}>Impervious Surface (Global)</span><span style={styles.listItemText}>Increasing</span></div>
            </div>
          );
          break;
        default:
          break;
      }

      return (
        <div style={panelStyle}>
          <div style={styles.widget}>
            <h3 style={styles.widgetTitle}>{title}</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '15px' }}>{description}</p>
            {sampleData && (
              <>
                <h4 style={{color: 'white', marginBottom: '10px'}}>Sample Data:</h4>
                {sampleData}
              </>
            )}
            {(domainId !== null) && (
              <div style={{marginTop: '20px'}}>
                <div style={{ 
                  backgroundColor: 'rgba(30, 30, 45, 0.6)',
                  borderRadius: '8px',
                  padding: '15px',
                  border: '1px dashed rgba(79, 195, 247, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ color: '#4fc3f7', marginRight: '10px' }}>
                      <User size={18} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#4fc3f7' }}>Subscription Information</h4>
                  </div>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.4'
                  }}>
                    You're viewing the {domainId.split('A')[0]} domain based on your subscription level. Contact support to upgrade your plan for additional features.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div style={styles.widget}>
            <MapWidget
              activeItem={activeItem}
              weatherData={weatherData}
              earthquakeData={earthquakeData}
              oceanData={oceanData}
            />
          </div>
        </div>
      );
    };

    switch (activeItem) {
      case null: // Initial state, show general overview
        return renderDomainPreview(null); // Pass null to get the generic message
      case 'atmosphere':
        return (
          <div style={panelStyle}>
            <div style={styles.widget}>
              <h3 style={styles.widgetTitle}>Weather Conditions</h3>
              <div style={styles.listContainer}>
                {(weatherData || []).map(weather => (
                  <div key={weather.name} style={styles.listItem}>
                    <span style={styles.listItemTitle}>{weather.name}</span>
                    <span style={styles.listItemText}>{weather.temperature}°C</span>
                  </div>
                ))}
              </div>
            </div>

            {clickedRegionData && (
              <div style={styles.widget}>
                <h3 style={styles.widgetTitle}>Atmospheric Data - {clickedRegionData.countryName}</h3>
                <div style={styles.atmosphericData}>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Temperature:</span>
                    <span style={styles.dataValue}>{clickedRegionData.temperature}°C</span>
                  </div>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Wind Speed:</span>
                    <span style={styles.dataValue}>{clickedRegionData.windSpeed} km/h</span>
                  </div>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Humidity:</span>
                    <span style={styles.dataValue}>{clickedRegionData.humidity}%</span>
                  </div>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Pressure:</span>
                    <span style={styles.dataValue}>{clickedRegionData.pressure} hPa</span>
                  </div>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Max Temp:</span>
                    <span style={styles.dataValue}>{clickedRegionData.maxTemp}°C</span>
                  </div>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Min Temp:</span>
                    <span style={styles.dataValue}>{clickedRegionData.minTemp}°C</span>
                  </div>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Updated:</span>
                    <span style={styles.dataValue}>{clickedRegionData.timestamp}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.widget}>
              <MapWidget
                activeItem={activeItem}
                weatherData={weatherData}
                earthquakeData={earthquakeData}
                oceanData={oceanData}
              />
            </div>
          </div>
        );

      case 'oceanary':
        return (
          <div style={panelStyle}>
            <div style={styles.widget}>
              <h3 style={styles.widgetTitle}>Recent Earthquakes</h3>
              <div style={styles.listContainer}>
                {(earthquakeData.features || []).slice(0, 8).map(eq => (
                  <div key={eq.id} style={styles.listItem}>
                    <span style={styles.listItemTitle}>M {eq.properties.mag.toFixed(1)}</span>
                    <span style={styles.listItemText}>{eq.properties.place}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.widget}>
              <MapWidget
                activeItem={activeItem}
                weatherData={weatherData}
                earthquakeData={earthquakeData}
                oceanData={oceanData}
              />
            </div>
          </div>
        );

      case 'agricultureA':
      case 'land-use':
        // These cases should also render domain preview information when selected from sidebar
        return renderDomainPreview(activeItem);

      default:
        return null;
    }
  };

  // --- Get current data for globe visualization ---
  const getCurrentGlobeData = () => {
    // Helper function to adjust color shade based on intensity
    const getColorShade = (baseColor, intensity) => {
      // Convert hex to RGB for easier manipulation
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      
      // Calculate adjustment factor based on intensity (0-10 scale)
      // Higher intensity = darker/more saturated
      // Lower intensity = lighter/less saturated
      const factor = 0.7 + (intensity * 0.03); // Range from 0.7 to 1.0
      
      // Adjust RGB values
      const adjustedR = Math.min(255, Math.round(r * factor));
      const adjustedG = Math.min(255, Math.round(g * factor));
      const adjustedB = Math.min(255, Math.round(b * factor));
      
      // Convert back to hex
      return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
    };
    
    // Generate dot markers for domains in each country
    const generateDomainPoints = () => {
      const points = [];
      
      // For each country in the countries data
      (countriesData.features || []).forEach(country => {
        if (!country.geometry || !country.properties) return;
        
        const iso = country.properties.ISO_A3;
        const countryName = country.properties.NAME || 'Unknown';
        const regionData = REGION_DOMAIN_DATA[iso] || REGION_DOMAIN_DATA.DEFAULT;
        
        // Calculate center point of the country (approximate)
        let centerLat = 0, centerLng = 0, pointCount = 0;
        
        // Handle different geometry types
        if (country.geometry.type === 'Polygon' && country.geometry.coordinates && country.geometry.coordinates[0]) {
          const coords = country.geometry.coordinates[0];
          coords.forEach(coord => {
            centerLng += coord[0];
            centerLat += coord[1];
            pointCount++;
          });
        } else if (country.geometry.type === 'MultiPolygon' && country.geometry.coordinates) {
          country.geometry.coordinates.forEach(poly => {
            if (poly[0]) {
              poly[0].forEach(coord => {
                centerLng += coord[0];
                centerLat += coord[1];
                pointCount++;
              });
            }
          });
        }
        
        if (pointCount > 0) {
          centerLat = centerLat / pointCount;
          centerLng = centerLng / pointCount;
          
          // Create a single point for the country with all domain data attached
          points.push({
            lat: centerLat,
            lng: centerLng,
            size: 0.8, // Base size for the dot
            countryName: countryName,
            iso: iso,
            regionData: regionData, // Include all domain data
            // Find the dominant domain (highest intensity)
            dominantDomain: Object.entries(regionData)
              .filter(([domain]) => domain !== 'DEFAULT')
              .reduce((max, [domain, value]) => 
                value > max.value ? {domain, value} : max, 
                {domain: 'land', value: 0}
              ).domain
          });
        }
      });
      
      return points;
    };
    
    return {
      showPolygons: true,
      polygonColor: (d) => {
        const iso = d.properties?.ISO_A3;
        const regionData = REGION_DOMAIN_DATA[iso] || REGION_DOMAIN_DATA.DEFAULT;
        
        // Find dominant domain for this region
        let dominantDomain = 'land';
        let highestValue = 0;
        
        Object.entries(regionData).forEach(([domain, value]) => {
          if (value > highestValue && domain !== 'DEFAULT') {
            highestValue = value;
            dominantDomain = domain;
          }
        });
        
        // Get base color for dominant domain
        const baseColor = DOMAIN_COLORS[dominantDomain];
        
        // Adjust shade based on intensity
        return getColorShade(baseColor, highestValue);
      },
      pointsData: generateDomainPoints(),
      pointLabel: (point) => {
        // Get formatted domain names with their levels
        const domainInfo = Object.entries(point.regionData)
          .filter(([domain]) => domain !== 'DEFAULT')
          .map(([domain, value]) => {
            const domainName = domain === 'risk_level' ? 'Risk Level' :
                            domain === 'sea_temperature' ? 'Sea Temperature' :
                            domain.charAt(0).toUpperCase() + domain.slice(1);
            
            const levelDesc = value >= 8 ? 'Very High' :
                              value >= 6 ? 'High' :
                              value >= 4 ? 'Moderate' :
                              value >= 2 ? 'Low' : 'Very Low';
            
            return `${domainName}: ${levelDesc}`;
          })
          .join('\n');
        
        return `${point.countryName}\n${domainInfo}`;
      },
      pointRadius: (point) => point.size || 0.8,
      pointColor: (point) => DOMAIN_COLORS[point.dominantDomain] || '#ffffff',
      pointAltitude: 0.001, // Very close to the surface
      pointsMerge: false
    };
  };

  const globeData = getCurrentGlobeData();

  return (
    <div style={styles.page}>
      {/* Hero Section with Globe */}
      <div style={styles.heroSection}>
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

          polygonsData={globeData.showPolygons ? (countriesData.features || []) : []}
          polygonCapColor={d => globeData.polygonColor(d)}
          polygonSideColor={() => 'rgba(0, 0, 0, 0.05)'}
          polygonAltitude={d => d === hoveredPolygon ? 0.05 : 0.01}
          onPolygonHover={setHoveredPolygon}
          onPolygonClick={handlePolygonClick}
          
          pointsData={globeData.pointsData}
          pointLabel={globeData.pointLabel}
          pointRadius={globeData.pointRadius}
          pointColor={globeData.pointColor}
          pointAltitude={globeData.pointAltitude}
          pointsMerge={false}
          onPointClick={handlePointClick}
          pointResolution={20}
          pointLat="lat"
          pointLng="lng"
          labelsData={globeData.pointsData}
          labelLat="lat"
          labelLng="lng"
          labelAltitude={0.01}
          labelDotRadius={0.4}
          labelDotOrientation={() => 'right'}
          labelColor={d => DOMAIN_COLORS[d.dominantDomain]}
          labelText={d => ''}
          labelSize={0.5}
          labelResolution={1}
        />

        <p style={styles.welcomeText}>
          "Welcome to the Future of Earth Observation – Real-time Data that Speaks for the Planet."
        </p>

        {/* Static sidebar with your original styling */}
        <div
          style={{
            ...styles.sidebar,
            width: isSidebarOpen ? 280 : 80
          }}
        >
          <div style={styles.sidebarHeader}>
            {isSidebarOpen && (
              <div style={styles.logoContainer}>
                <Plane color="#fff" size={32} />
                <span style={styles.logoText}>AwSc-ETR</span>
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.toggleButton}>
              {isSidebarOpen ? <X color="#fff" size={24} /> : <Menu color="#fff" size={28} />}
            </button>
          </div>
          <div style={styles.menuItemsContainer}>

            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                // Determine isActive for sidebar. If null, no sidebar item is truly 'active' visually.
                isActive={activeItem === item.id}
                onClick={() => {
                  // Handle domain-specific navigation
                  if (item.id === 'flight-view') {
                    navigate('/flights');
                  } else if (item.domain === 'Agriculture') {
                    navigate('/domain/agriculture');
                  } else if (item.domain === 'Disaster') {
                    // Future domain pages can be added here
                    // navigate('/domain/disaster');
                    setActiveItem(item.id);
                    setClickedRegionData(null);
                  } else if (item.domain === 'Marine') {
                    // Future domain pages can be added here
                    // navigate('/domain/marine');
                    setActiveItem(item.id);
                    setClickedRegionData(null);
                  } else {
                    // Default behavior for other items
                    setActiveItem(item.id);
                    setClickedRegionData(null);
                  }
                }}
                isOpen={isSidebarOpen}
              />
            ))}
          </div>
        </div>

        <div style={styles.rightWidgetsContainer}>
          <RightPanel />
        </div>

        {/* Static scroll indicator */}
        <div style={styles.scrollIndicator}>
          <ChevronsDown color="white" size={28} />
        </div>

        <div style={styles.profileContainer}>
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={styles.profileButton}>
            <User color="#333" size={24} />
          </button>
          {isProfileMenuOpen && (
            <div style={styles.profileMenu}>
              <div style={styles.profileMenuPointer}></div>
              <button onClick={() => navigate('/profile')} style={styles.profileMenuItem}>Profile</button>
              <a href="#subscription" style={styles.profileMenuItem}>Subscription Status</a>
              <button onClick={handleLogout} style={styles.profileMenuItem}><LogOut size={16} style={{marginRight: '8px'}} />Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Stacked Layer Sections - Now regular sections */}
      <div className="layers-wrapper" style={{background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)'}}>
        {/* Daily Insights Section */}
        <section className="daily-insights-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>DAILY EARTH INTELLIGENCE</h2>
            <p>Real-time planetary conditions from our global observation network</p>
          </div>

          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="insight-badge">DAILY UPDATE</div>
              </div>
              <div className="insight-content">
                <div className="insight-header">
                  <div className="insight-icon">
                    <Cloud size={24} />
                  </div>
                  <div className="insight-title">Rainfall Patterns</div>
                </div>
                <div className="insight-metrics">
                  <div className="insight-metric">
                    <span className="insight-metric-value">+32%</span>
                    <span className="insight-metric-label">Monsoon Intensity</span>
                  </div>
                  <div className="insight-metric">
                    <span className="insight-metric-value">43 regions</span>
                    <span className="insight-metric-label">Affected Areas</span>
                  </div>
                </div>
                <div className="insight-footer">
                  <button className="insight-button">View Analysis</button>
                </div>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1601467227404-00c2ba5719ac?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="insight-badge">WEEKLY TREND</div>
              </div>
              <div className="insight-content">
                <div className="insight-header">
                  <div className="insight-icon">
                    <Leaf size={24} />
                  </div>
                  <div className="insight-title">Vegetation Health</div>
                </div>
                <div className="insight-metrics">
                  <div className="insight-metric">
                    <span className="insight-metric-value">0.68</span>
                    <span className="insight-metric-label">Avg. NDVI Index</span>
                  </div>
                  <div className="insight-metric">
                    <span className="insight-metric-value">+0.04</span>
                    <span className="insight-metric-label">Weekly Change</span>
                  </div>
                </div>
                <div className="insight-footer">
                  <button className="insight-button">View Analysis</button>
                </div>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="insight-badge">ALERT SYSTEM</div>
              </div>
              <div className="insight-content">
                <div className="insight-header">
                  <div className="insight-icon-alert">
                    <Thermometer size={24} />
                  </div>
                  <div className="insight-title">Wildfire Risk</div>
                </div>
                <div className="insight-metrics">
                  <div className="insight-metric">
                    <span className="insight-metric-value">18 zones</span>
                    <span className="insight-metric-label">High Risk Areas</span>
                  </div>
                  <div className="insight-metric">
                    <span className="insight-metric-value">7 active</span>
                    <span className="insight-metric-label">Current Fires</span>
                  </div>
                </div>
                <div className="insight-footer">
                  <button className="insight-button alert">View Alerts</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Domains Section */}
        <section className="domains-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>EARTH OBSERVATION DOMAINS</h2>
            <p>Specialized data categories optimized for different research and analysis needs</p>
          </div>

          <div className="domains-grid">
            <div className="domain-card">
              <div className="domain-card-inner">
                <div className="domain-icon">
                  <Sprout size={32} />
                </div>
                <h3>AGRICULTURE</h3>
                <div className="domain-divider"></div>
                <ul className="domain-features">
                  <li>Crop yield prediction</li>
                  <li>Soil moisture analytics</li>
                  <li>Food security mapping</li>
                </ul>
                <div className="domain-datasets">
                  <span className="domain-dataset-count">43</span>
                  <span className="domain-dataset-label">DATASETS</span>
                </div>
              </div>
            </div>

            <div className="domain-card">
              <div className="domain-card-inner">
                <div className="domain-icon">
                  <Leaf size={32} />
                </div>
                <h3>FORESTRY</h3>
                <div className="domain-divider"></div>
                <ul className="domain-features">
                  <li>Forest cover tracking</li>
                  <li>Deforestation analysis</li>
                  <li>Biomass density metrics</li>
                </ul>
                <div className="domain-datasets">
                  <span className="domain-dataset-count">37</span>
                  <span className="domain-dataset-label">DATASETS</span>
                </div>
              </div>
            </div>

            <div className="domain-card">
              <div className="domain-card-inner">
                <div className="domain-icon">
                  <Cloud size={32} />
                </div>
                <h3>CLIMATE & WEATHER</h3>
                <div className="domain-divider"></div>
                <ul className="domain-features">
                  <li>Temperature anomalies</li>
                  <li>Precipitation patterns</li>
                  <li>Extreme weather events</li>
                </ul>
                <div className="domain-datasets">
                  <span className="domain-dataset-count">56</span>
                  <span className="domain-dataset-label">DATASETS</span>
                </div>
              </div>
            </div>

            <div className="domain-card">
              <div className="domain-card-inner">
                <div className="domain-icon">
                  <Waves size={32} />
                </div>
                <h3>WATER & OCEANS</h3>
                <div className="domain-divider"></div>
                <ul className="domain-features">
                  <li>Sea surface temperature</li>
                  <li>Ocean acidity monitoring</li>
                  <li>Water resource analysis</li>
                <li>Water resource analysis</li>
                </ul>
                <div className="domain-datasets">
                  <span className="domain-dataset-count">49</span>
                  <span className="domain-dataset-label">DATASETS</span>
                </div>
              </div>
            </div>

            <div className="domain-card">
              <div className="domain-card-inner">
                <div className="domain-icon">
                  <Thermometer size={32} />
                </div>
                <h3>DISASTER MANAGEMENT</h3>
                <div className="domain-divider"></div>
                <ul className="domain-features">
                  <li>Wildfire detection</li>
                  <li>Flood risk assessment</li>
                  <li>Drought monitoring</li>
                </ul>
                <div className="domain-datasets">
                  <span className="domain-dataset-count">32</span>
                  <span className="domain-dataset-label">DATASETS</span>
                </div>
              </div>
            </div>

            <div className="domain-card">
              <div className="domain-card-inner">
                <div className="domain-icon">
                  <Map size={32} />
                </div>
                <h3>URBAN & LAND USE</h3>
                <div className="domain-divider"></div>
                <ul className="domain-features">
                  <li>Urban heat islands</li>
                  <li>Land cover classification</li>
                  <li>Infrastructure mapping</li>
                </ul>
                <div className="domain-datasets">
                  <span className="domain-dataset-count">41</span>
                  <span className="domain-dataset-label">DATASETS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layer 3 - Steps Container */}
        <section className="workflow-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>PLATFORM WORKFLOW</h2>
            <p>Simple four-step process to access earth observation data and analytics</p>
          </div>

          <div className="workflow-container">
            <div className="workflow-step">
              <div className="workflow-step-icon">
                <User size={28} />
              </div>
              <div className="workflow-step-number">01</div>
              <div className="workflow-step-content">
                <h3>Register Account</h3>
                <p>Create a secure account with email verification and professional profile setup</p>
              </div>
              <div className="workflow-step-connector"></div>
            </div>

            <div className="workflow-step">
              <div className="workflow-step-icon">
                <Globe2 size={28} />
              </div>
              <div className="workflow-step-number">02</div>
              <div className="workflow-step-content">
                <h3>Select Data Domains</h3>
                <p>Choose from atmospheric, oceanic, terrestrial, and climate analytics categories</p>
              </div>
              <div className="workflow-step-connector"></div>
            </div>

            <div className="workflow-step">
              <div className="workflow-step-icon">
                <Database size={28} />
              </div>
              <div className="workflow-step-number">03</div>
              <div className="workflow-step-content">
                <h3>Access Data Repository</h3>
                <p>Connect to our secure multi-petabyte archive of processed satellite observations</p>
              </div>
              <div className="workflow-step-connector"></div>
            </div>

            <div className="workflow-step">
              <div className="workflow-step-icon">
                <BarChart size={28} />
              </div>
              <div className="workflow-step-number">04</div>
              <div className="workflow-step-content">
                <h3>Analyze & Visualize</h3>
                <p>Process data through our visualization engine or export for custom analytics</p>
              </div>
            </div>
          </div>
          
          <div className="workflow-cta">
            <p>👉 "Your journey from signup to research-ready datasets is just 4 steps away."</p>
          </div>
        </section>

        {/* Access Plans Section */}
        <section className="access-plans-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>ACCESS PLANS</h2>
            <p>Select the right level of geospatial intelligence for your research and operational needs</p>
          </div>

          <div className="pricing-container">
            <div className="pricing-plan">
              <div className="pricing-header">
                <div className="pricing-name">
                  <h3>EXPLORER</h3>
                  <span className="pricing-label">Free Access</span>
                </div>
                <div className="pricing-price">
                  <span className="price">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <div className="pricing-features">
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Limited dataset previews (5/day)</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Basic visualizations at 1km resolution</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Community forums access</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Public datasets only</span>
                </div>
                <div className="feature-item disabled">
                  <X size={16} className="feature-icon" />
                  <span>No API access</span>
                </div>
              </div>
              <div className="pricing-action">
                <button 
                  className="pricing-button"
                  onClick={() => navigate('/subscription', { state: { plan: 'explorer' } })}
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="pricing-plan featured">
              <div className="pricing-badge">MOST POPULAR</div>
              <div className="pricing-header">
                <div className="pricing-name">
                  <h3>RESEARCHER</h3>
                  <span className="pricing-label">Academic/Student</span>
                </div>
                <div className="pricing-price">
                  <span className="price">$29</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <div className="pricing-features">
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Unlimited dataset access</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>High-resolution imagery (10m)</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Data export capabilities</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>30-day archive access</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Basic API access (1000 calls/day)</span>
                </div>
              </div>
              <div className="pricing-action">
                <button 
                  className="pricing-button featured"
                  onClick={() => navigate('/subscription', { state: { plan: 'researcher' } })}
                >
                  Subscribe Now
                </button>
              </div>
            </div>

            <div className="pricing-plan">
              <div className="pricing-header">
                <div className="pricing-name">
                  <h3>ENTERPRISE</h3>
                  <span className="pricing-label">Commercial/Research</span>
                </div>
                <div className="pricing-price">
                  <span className="price">$199</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <div className="pricing-features">
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Full archive historical access</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Highest resolution (sub-meter)</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Advanced processing capabilities</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Dedicated technical support</span>
                </div>
                <div className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>Unlimited API access</span>
                </div>
              </div>
              <div className="pricing-action">
                <button 
                  className="pricing-button"
                  onClick={() => navigate('/subscription', { state: { plan: 'enterprise' } })}
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Updates Section */}
        <section className="platform-updates-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>LATEST PLATFORM UPDATES</h2>
            <p>Recent additions and enhancements to our Earth observation platform</p>
          </div>

          <div className="updates-timeline">
            <div className="update-card">
              <div className="update-badge">NEW</div>
              <div className="update-date">
                <div className="update-month">AUG</div>
                <div className="update-year">2025</div>
              </div>
              <div className="update-content">
                <div className="update-title">Agricultural Intelligence System</div>
                <div className="update-description">
                  High-precision crop monitoring dataset with yield prediction capabilities covering major agricultural regions of India.
                </div>
                <div className="update-meta">
                  <div className="update-type">Dataset Release</div>
                  <div className="update-detail">10m Resolution • 5-day Refresh</div>
                </div>
              </div>
            </div>

            <div className="update-card">
              <div className="update-date">
                <div className="update-month">JUL</div>
                <div className="update-year">2025</div>
              </div>
              <div className="update-content">
                <div className="update-title">Global Ocean Salinity Measurements</div>
                <div className="update-description">
                  Comprehensive surface and subsurface ocean salinity data incorporating SMAP and in-situ measurements for climate research.
                </div>
                <div className="update-meta">
                  <div className="update-type">Dataset Enhancement</div>
                  <div className="update-detail">25km Resolution • Daily Updates</div>
                </div>
              </div>
            </div>

            <div className="update-card">
              <div className="update-date">
                <div className="update-month">JUN</div>
                <div className="update-year">2025</div>
              </div>
              <div className="update-content">
                <div className="update-title">Wildfire Monitoring Expansion</div>
                <div className="update-description">
                  Extended global wildfire detection system with historical data and predictive risk assessment for forest management.
                </div>
                <div className="update-meta">
                  <div className="update-type">System Enhancement</div>
                  <div className="update-detail">20m Resolution • Near Real-time</div>
                </div>
              </div>
            </div>

            <div className="update-card">
              <div className="update-date">
                <div className="update-month">MAY</div>
                <div className="update-year">2025</div>
              </div>
              <div className="update-content">
                <div className="update-title">ERA5 Climate Reanalysis Integration</div>
                <div className="update-description">
                  Complete integration of ECMWF ERA5 atmospheric data with our visualization system for advanced climate research.
                </div>
                <div className="update-meta">
                  <div className="update-type">Platform Integration</div>
                  <div className="update-detail">31km Resolution • Monthly Archive</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="updates-action">
            <button className="updates-button">View All Updates</button>
          </div>
        </section>

        {/* Platform Metrics Section */}
        <section className="metrics-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>PLATFORM METRICS</h2>
            <p>Key statistics highlighting our global Earth observation capabilities</p>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <Database size={32} />
              </div>
              <div className="metric-value">258</div>
              <div className="metric-label">ACTIVE DATASETS</div>
              <div className="metric-description">
                Curated environmental datasets spanning all observation domains
              </div>
              <div className="metric-trend positive">
                <span>+12% growth</span> from previous quarter
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <Satellite size={32} />
              </div>
              <div className="metric-value">47</div>
              <div className="metric-label">EARTH OBSERVATION SATELLITES</div>
              <div className="metric-description">
                Data sources from multiple space agencies and commercial providers
              </div>
              <div className="metric-trend positive">
                <span>8 new satellites</span> added this year
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <User size={32} />
              </div>
              <div className="metric-value">12,486</div>
              <div className="metric-label">ACTIVE RESEARCHERS</div>
              <div className="metric-description">
                Scientists and analysts using our platform for environmental research
              </div>
              <div className="metric-trend positive">
                <span>+24% user growth</span> year over year
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <GlobeIcon size={32} />
              </div>
              <div className="metric-value">3.8PB</div>
              <div className="metric-label">DATA PROCESSED MONTHLY</div>
              <div className="metric-description">
                Petabytes of Earth observation data analyzed through our systems
              </div>
              <div className="metric-trend positive">
                <span>+41% increase</span> in processing capacity
              </div>
            </div>
          </div>
        </section>

        {/* Earth Data Explorer Section */}
        <section className="earth-data-explorer">
          <div className="nasa-section-title">
            <h2>EARTH DATA EXPLORER</h2>
            <p>Interactive environmental datasets from global monitoring systems</p>
          </div>
          
          {/* NASA-like Earth Data Explorer Banner */}
          <div className="nasa-banner" style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(79, 195, 247, 0.5)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
              <div style={{color: '#4fc3f7', fontSize: '36px'}}>
                <Globe2 size={36} />
              </div>
              <div>
                <h3 style={{color: 'white', margin: '0 0 8px 0', fontSize: '18px'}}>
                  NEW: NASA-like Earth Data Explorer
                </h3>
                <p style={{color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '14px'}}>
                  Interactive global visualization with detailed data layers and analytics
                </p>
              </div>
            </div>
            <button 
              style={{
                background: '#4fc3f7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/earth-visualization')}
            >
              Launch Explorer
            </button>
          </div>
          
          <div className="data-explorer-grid">
            <div className="data-explorer-card">
              <div className="data-explorer-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1532569511207-10dfa50f673d?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="data-explorer-badge">REAL-TIME</div>
              </div>
              <div className="data-explorer-content">
                <div className="data-explorer-header">
                  <div className="data-explorer-icon">
                    <Cloud size={24} />
                  </div>
                  <div className="data-explorer-title">Air Quality Index</div>
                </div>
                <div className="data-explorer-description">
                  Comprehensive PM2.5, PM10, NO2, SO2 and O3 measurements from 15,000+ monitoring stations
                </div>
                <div className="data-explorer-details">
                  <div className="data-detail">
                    <span className="data-detail-label">Source</span>
                    <span className="data-detail-value">OpenAQ</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Resolution</span>
                    <span className="data-detail-value">Urban Areas</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Update Frequency</span>
                    <span className="data-detail-value">Hourly</span>
                  </div>
                </div>
                <div className="data-explorer-action">
                  <button className="data-explorer-button">Visualize Dataset</button>
                </div>
              </div>
            </div>

            <div className="data-explorer-card">
              <div className="data-explorer-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1566438480900-0609be27a4be?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="data-explorer-badge">MODIS</div>
              </div>
              <div className="data-explorer-content">
                <div className="data-explorer-header">
                  <div className="data-explorer-icon">
                    <Waves size={24} />
                  </div>
                  <div className="data-explorer-title">Sea Surface Temperature</div>
                </div>
                <div className="data-explorer-description">
                  Global sea surface temperature anomalies at 4km resolution from MODIS-Aqua satellite
                </div>
                <div className="data-explorer-details">
                  <div className="data-detail">
                    <span className="data-detail-label">Source</span>
                    <span className="data-detail-value">NASA EOSDIS</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Resolution</span>
                    <span className="data-detail-value">4km</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Update Frequency</span>
                    <span className="data-detail-value">Weekly</span>
                  </div>
                </div>
                <div className="data-explorer-action">
                  <button className="data-explorer-button">Visualize Dataset</button>
                </div>
              </div>
            </div>

            <div className="data-explorer-card">
              <div className="data-explorer-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1593502288818-7bd065cefa35?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="data-explorer-badge">SENTINEL-2</div>
              </div>
              <div className="data-explorer-content">
                <div className="data-explorer-header">
                  <div className="data-explorer-icon">
                    <Leaf size={24} />
                  </div>
                  <div className="data-explorer-title">Vegetation Index</div>
                </div>
                <div className="data-explorer-description">
                  Global NDVI measurements at 10m resolution showing vegetation health and density
                </div>
                <div className="data-explorer-details">
                  <div className="data-detail">
                    <span className="data-detail-label">Source</span>
                    <span className="data-detail-value">Copernicus</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Resolution</span>
                    <span className="data-detail-value">10m</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Update Frequency</span>
                    <span className="data-detail-value">Bi-weekly</span>
                  </div>
                </div>
                <div className="data-explorer-action">
                  <button className="data-explorer-button">Visualize Dataset</button>
                </div>
              </div>
            </div>

            <div className="data-explorer-card">
              <div className="data-explorer-visual" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1613108626019-9ad0739b85bc?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="data-explorer-badge">ANALYTICAL</div>
              </div>
              <div className="data-explorer-content">
                <div className="data-explorer-header">
                  <div className="data-explorer-icon">
                    <BarChart size={24} />
                  </div>
                  <div className="data-explorer-title">CO2 Emissions</div>
                </div>
                <div className="data-explorer-description">
                  Country and sector-based carbon emissions with historical trends and projections
                </div>
                <div className="data-explorer-details">
                  <div className="data-detail">
                    <span className="data-detail-label">Source</span>
                    <span className="data-detail-value">UNFCCC</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Resolution</span>
                    <span className="data-detail-value">National</span>
                  </div>
                  <div className="data-detail">
                    <span className="data-detail-label">Update Frequency</span>
                    <span className="data-detail-value">Quarterly</span>
                  </div>
                </div>
                <div className="data-explorer-action">
                  <button className="data-explorer-button">Visualize Dataset</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Earth Observation Applications Section */}
        <section className="earth-observation-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          <div className="nasa-section-title">
            <h2>EARTH OBSERVATION APPLICATIONS</h2>
            <p>Real-world solutions powered by satellite intelligence and geospatial analytics</p>
          </div>
          
          <div className="tech-container">
            <div className="tech-item">
              <div className="tech-item-header" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="tech-item-icon">
                  <Satellite size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Agricultural Intelligence</div>
                <div className="tech-item-subtitle">Punjab-Haryana Region, India</div>
                <div className="tech-item-description">
                  Satellite-based crop monitoring system providing precision agriculture insights across 2.8 million hectares of farmland.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    93% accurate yield prediction
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Early pest detection capabilities
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Water optimization recommendations
                  </li>
                </ul>
              </div>
            </div>

            <div className="tech-item">
              <div className="tech-item-header" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1543051932-6ef9acad6db0?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="tech-item-icon">
                  <Satellite size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Flood Risk Assessment</div>
                <div className="tech-item-subtitle">Kerala Watershed, India</div>
                <div className="tech-item-description">
                  Integrated hydrological monitoring network combining satellite data with ground sensors for advanced warning systems.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    72% faster evacuation response
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Real-time water level monitoring
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Predictive rainfall analytics
                  </li>
                </ul>
              </div>
            </div>

            <div className="tech-item">
              <div className="tech-item-header" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1525438163832-69195ceef877?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="tech-item-icon">
                  <Satellite size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Urban Heat Analysis</div>
                <div className="tech-item-subtitle">Delhi Metropolitan Area</div>
                <div className="tech-item-description">
                  Thermal mapping system identifying urban heat islands for targeted infrastructure planning and climate adaptation.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    30m resolution heat mapping
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    2.3°C projected heat reduction
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Green infrastructure planning
                  </li>
                </ul>
              </div>
            </div>

            <div className="tech-item">
              <div className="tech-item-header" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1513031300226-c8fb12de9ade?q=80&w=400')", backgroundSize: "cover"}}>
                <div className="tech-item-icon">
                  <Satellite size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Deforestation Monitoring</div>
                <div className="tech-item-subtitle">Amazon Rainforest</div>
                <div className="tech-item-description">
                  Near real-time forest monitoring system using SAR and optical imagery for enforcement and conservation efforts.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    97.8% detection accuracy
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    24-hour alert capabilities
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Cloud-penetrating radar technology
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Grid - NASA-inspired Design with Enhanced Space Background */}
        <section className="tech-section">
          {/* Space Background Elements */}
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          
          {/* Shooting Stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          
          {/* Nebula Effects */}
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
          
          {/* Planets */}
          <div className="floating-planet planet-1"></div>
          <div className="floating-planet planet-2"></div>
          
          {/* Original Elements */}
          <div className="tech-bg-element stars"></div>
          <div className="tech-bg-element satellite"></div>
          <div className="tech-bg-element orbit"></div>
          
          <div className="nasa-section-title">
            <h2>EARTH OBSERVATION TECHNOLOGIES</h2>
            <p>Cutting-edge systems delivering precise planetary data for research, analysis, and decision-making</p>
          </div>

          <div className="tech-container">
            <div className="tech-item">
              <div className="tech-item-header">
                <div className="tech-item-icon">
                  <Cloud size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Cloud Infrastructure</div>
                <div className="tech-item-subtitle">Petabyte-Scale Processing</div>
                <div className="tech-item-description">
                  Distributed computing architecture optimized for massive environmental datasets with rapid retrieval.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Multi-region data availability
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Auto-scaling compute resources
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    99.99% uptime SLA
                  </li>
                </ul>
              </div>
            </div>

            <div className="tech-item">
              <div className="tech-item-header">
                <div className="tech-item-icon">
                  <Cpu size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">AI Analytics Engine</div>
                <div className="tech-item-subtitle">Advanced Pattern Recognition</div>
                <div className="tech-item-description">
                  Machine learning algorithms trained on decades of Earth observation data for predictive environmental modeling.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Neural network classification
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Anomaly detection systems
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Continuous model improvement
                  </li>
                </ul>
              </div>
            </div>

            <div className="tech-item">
              <div className="tech-item-header">
                <div className="tech-item-icon">
                  <GlobeIcon size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Interactive Visualization</div>
                <div className="tech-item-subtitle">WebGL-Powered Rendering</div>
                <div className="tech-item-description">
                  High-performance 3D globe visualization with multi-layer support for complex geospatial data analysis.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Time-series animation
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Multi-domain data overlay
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Adaptive resolution loading
                  </li>
                </ul>
              </div>
            </div>

            <div className="tech-item">
              <div className="tech-item-header">
                <div className="tech-item-icon">
                  <Share2 size={36} />
                </div>
              </div>
              <div className="tech-item-content">
                <div className="tech-item-title">Developer Platform</div>
                <div className="tech-item-subtitle">Comprehensive API Access</div>
                <div className="tech-item-description">
                  RESTful and GraphQL interfaces enabling seamless integration with external systems and custom applications.
                </div>
                <ul className="tech-features">
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    OGC-compliant endpoints
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    Rate-limited tiered access
                  </li>
                  <li className="tech-feature">
                    <span className="tech-feature-icon"><Check size={16} /></span>
                    SDK support for multiple languages
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* NASA-inspired Footer */}
        <footer className="nasa-footer">
          <div className="orbit-animation">
            <div className="orbit-circle orbit-circle-1">
              <div className="satellite-dot satellite-1"></div>
            </div>
            <div className="orbit-circle orbit-circle-2">
              <div className="satellite-dot satellite-2"></div>
            </div>
            <div className="orbit-circle orbit-circle-3">
              <div className="satellite-dot satellite-3"></div>
            </div>
          </div>

          <div className="nasa-footer-grid">
            <div>
              <div className="nasa-footer-logo">EARTH•TRACKER</div>
              <div className="nasa-footer-tagline">
                Advanced Earth observation platform providing cutting-edge geospatial intelligence for environmental monitoring, research, and decision support.
              </div>
            </div>
            
            <div className="nasa-footer-links">
              <h3>Platform</h3>
              <ul>
                <li><a href="#datasets">Datasets</a></li>
                <li><a href="#visualization">Visualization Tools</a></li>
                <li><a href="#api">API Access</a></li>
                <li><a href="#plans">Subscription Plans</a></li>
              </ul>
            </div>
            
            <div className="nasa-footer-links">
              <h3>Resources</h3>
              <ul>
                <li><a href="#documentation">Documentation</a></li>
                <li><a href="#tutorials">Tutorials</a></li>
                <li><a href="#case-studies">Case Studies</a></li>
                <li><a href="#research">Research Papers</a></li>
              </ul>
            </div>
            
            <div className="nasa-footer-links">
              <h3>Connect</h3>
              <ul>
                <li><a href="#support">Technical Support</a></li>
                <li><a href="#community">Research Community</a></li>
                <li><a href="#updates">Newsletter</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="nasa-footer-bottom">
            <p>© 2025 Earth Tracker. All rights reserved. | Terms of Use | Privacy Policy | Data Attribution</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

// --- Styles (UPDATED - Removed styles no longer needed/moved to CSS) ---
const styles = {
  page: {
    position: 'relative',
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#000000',
    fontFamily: 'sans-serif',
    color: 'white'
  },
  heroSection: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#000000'
  },
  // Removed layersContainer style object, replaced by CSS class "layers-wrapper"
  welcomeText: {
    position: 'absolute',
    top: '25px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadow: '0 1px 3px black'
  },
  sidebar: {
    position: 'absolute',
    top: '80px',
    left: '20px',
    height: 'auto',
    backgroundColor: 'rgba(25, 25, 25, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '25px',
    padding: '15px 0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
    transition: 'width 0.3s ease'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 15px 0 25px',
    marginBottom: '20px',
    minHeight: '44px'
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px',
    zIndex: 2
  },
  logoContainer: {
    position: 'absolute',
    left: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'white'
  },
  logoText: {
    fontWeight: 'bold',
    fontSize: '18px',
    whiteSpace: 'nowrap'
  },
  menuItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '0 15px'
  },
  rightWidgetsContainer: {
    position: 'absolute',
    top: '10vh',
    right: '20px',
    width: '320px',
    height: '80vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    zIndex: 10
  },
  widget: {
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '25px',
    padding: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  widgetTitle: {
    marginTop: 0,
    marginBottom: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    paddingBottom: '10px'
  },
  listContainer: {
    maxHeight: '200px',
    overflowY: 'auto'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  listItemTitle: {
    fontWeight: 'bold',
    color: '#3498db'
  },
  listItemText: {
    textAlign: 'right',
    fontSize: '14px'
  },
  atmosphericData: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  dataLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)'
  },
  dataValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#3498db'
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10
  },
  profileContainer: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 20
  },
  profileButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
  },
  profileMenu: {
    position: 'absolute',
    top: '65px',
    right: '0',
    width: '200px',
    backgroundColor: 'rgba(43, 43, 43, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  profileMenuPointer: {
    position: 'absolute',
    top: '-10px',
    right: '15px',
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: '10px solid rgba(43, 43, 43, 0.9)'
  },
  profileMenuItem: {
    padding: '10px 15px',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    }
  }
  // Removed subscribeButton from inline styles as it's now fully in CSS
};

export default Homepage;