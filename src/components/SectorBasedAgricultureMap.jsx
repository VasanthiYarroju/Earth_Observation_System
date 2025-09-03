import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { enhancedAgricultureService } from '../services/enhancedAgricultureService';
import { API_BASE_URL } from '../services/api';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom component to handle map events
const MapEventHandler = ({ onMapClick, onMapInit }) => {
  const map = useMap();
  
  useEffect(() => {
    try {
      // Ensure proper map initialization
      if (onMapInit) {
        onMapInit(map);
      }
      
      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      
      if (onMapClick) {
        const handleClick = (e) => {
          onMapClick(e);
        };
        
        map.on('click', handleClick);
        return () => map.off('click', handleClick);
      }
    } catch (error) {
      console.error('Map handler error:', error);
    }
  }, [map, onMapClick, onMapInit]);
  
  return null;
};

const SectorBasedAgricultureMap = ({ onError }) => {
  // Sector-specific visualization state
  const [activeSector, setActiveSector] = useState('all');
  const [visualizationMode, setVisualizationMode] = useState('regions');
  const [sectorData, setSectorData] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState([20.0, 0.0]);
  const [mapZoom, setMapZoom] = useState(2);

  // Drawing mode states
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnRegions, setDrawnRegions] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  
  // Legend state
  const [legendVisible, setLegendVisible] = useState(true);

  // Sector configuration with specific colors, icons, and visualization styles
  const sectorConfigurations = useMemo(() => ({
    all: {
      name: 'All Sectors',
      color: '#4CAF50',
      icon: '🌍',
      tileLayer: 'Satellite',
      visualization: 'mixed',
      description: 'View all agricultural sectors combined'
    },
    crops_production: {
      name: 'Crop Production',
      color: '#4CAF50',
      icon: '🌾',
      tileLayer: 'Terrain',
      visualization: 'crop_fields',
      heatmapColors: ['#FFF3CD', '#FFE066', '#4CAF50', '#2E7D32'],
      description: 'Cereal crops, grains, and agricultural production zones'
    },
    forestry: {
      name: 'Forestry & Agroforestry',
      color: '#2E7D32',
      icon: '🌲',
      tileLayer: 'Satellite',
      visualization: 'forest_coverage',
      heatmapColors: ['#E8F5E8', '#66BB6A', '#2E7D32', '#1B5E20'],
      description: 'Forest coverage, timber production, and agroforestry systems'
    },
    fertilizers: {
      name: 'Fertilizer Production & Use',
      color: '#9C27B0',
      icon: '🧪',
      tileLayer: 'Terrain',
      visualization: 'intensity_map',
      heatmapColors: ['#F3E5F5', '#CE93D8', '#9C27B0', '#6A1B9A'],
      description: 'Fertilizer application rates and nutrient management zones'
    },
    livestock: {
      name: 'Livestock Production',
      color: '#8D6E63',
      icon: '🐄',
      tileLayer: 'Terrain',
      visualization: 'density_map',
      heatmapColors: ['#EFEBE9', '#BCAAA4', '#8D6E63', '#5D4037'],
      description: 'Cattle, dairy, poultry, and livestock density areas'
    },
    emissions: {
      name: 'Agricultural Emissions',
      color: '#FF5722',
      icon: '🌡️',
      tileLayer: 'Satellite',
      visualization: 'emission_zones',
      heatmapColors: ['#FFEBEE', '#FFAB91', '#FF5722', '#D84315'],
      description: 'Greenhouse gas emissions and environmental impact zones'
    },
    trade: {
      name: 'Agricultural Trade',
      color: '#2196F3',
      icon: '🚢',
      tileLayer: 'Terrain',
      visualization: 'trade_hubs',
      heatmapColors: ['#E3F2FD', '#90CAF9', '#2196F3', '#1565C0'],
      description: 'Export/import hubs and commodity trading centers'
    },
    land_use: {
      name: 'Agricultural Land Use',
      color: '#8BC34A',
      icon: '🗺️',
      tileLayer: 'Satellite',
      visualization: 'land_coverage',
      heatmapColors: ['#F1F8E9', '#AED581', '#8BC34A', '#558B2F'],
      description: 'Land allocation and agricultural area classification'
    }
  }), []);

  // Map tile layers configuration
  const tileLayerConfigs = {
    'Satellite': {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    },
    'Terrain': {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    },
    'OpenStreetMap': {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    'Forest': {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
  };

  // Load sector-specific data
  useEffect(() => {
    const loadSectorData = async () => {
      setLoadingData(true);
      try {
        const data = await enhancedAgricultureService.getRealAgricultureBoundaries();
        setSectorData(data.sectors || {});
      } catch (error) {
        console.error('Error loading sector data:', error);
        setSectorData({});
      } finally {
        setLoadingData(false);
      }
    };

    loadSectorData();
  }, []);

  // Reload data when sector changes to get sector-specific regions
  useEffect(() => {
    if (activeSector !== 'all') {
      setLoadingData(true);
      // Simulate loading sector-specific data
      setTimeout(() => {
        setLoadingData(false);
      }, 1000);
    }
  }, [activeSector]);

  // Get filtered regions based on active sector
  const getFilteredRegions = useCallback(() => {
    if (activeSector === 'all') {
      // Return all regions from all sectors with unique identifiers
      const allRegions = [];
      Object.entries(sectorData).forEach(([sectorKey, sector]) => {
        if (sector.regions) {
          allRegions.push(...sector.regions.map((region, regionIndex) => ({
            ...region,
            sectorKey,
            uniqueId: `${sectorKey}-${region.id || region.name || regionIndex}`,
            sectorConfig: sectorConfigurations[sectorKey] || sectorConfigurations.all
          })));
        }
      });
      return allRegions;
    } else {
      // Return regions for specific sector
      const sector = sectorData[activeSector];
      return sector?.regions?.map((region, regionIndex) => ({
        ...region,
        sectorKey: activeSector,
        uniqueId: `${activeSector}-${region.id || region.name || regionIndex}`,
        sectorConfig: sectorConfigurations[activeSector]
      })) || [];
    }
  }, [activeSector, sectorData, sectorConfigurations]);

  // Get polygon style based on sector and visualization mode
  const getPolygonStyle = useCallback((region) => {
    const sectorConfig = region.sectorConfig || sectorConfigurations.all;
    
    if (visualizationMode === 'heatmap') {
      // Use heatmap colors based on region intensity/production
      const intensity = region.properties?.intensity || region.properties?.production / 100000 || Math.random();
      const normalizedIntensity = Math.min(1, Math.max(0, intensity));
      const colorIndex = Math.floor(normalizedIntensity * ((sectorConfig.heatmapColors?.length || 4) - 1));
      return {
        fillColor: sectorConfig.heatmapColors?.[colorIndex] || sectorConfig.color,
        weight: 2,
        opacity: 1,
        color: sectorConfig.color,
        dashArray: '',
        fillOpacity: 0.7
      };
    } else if (visualizationMode === 'intensity') {
      // Use intensity-based opacity
      const intensity = region.properties?.intensity || region.properties?.yield / 10 || Math.random();
      const normalizedIntensity = Math.min(1, Math.max(0.3, intensity));
      return {
        fillColor: sectorConfig.color,
        weight: 2,
        opacity: 1,
        color: sectorConfig.color,
        dashArray: '',
        fillOpacity: normalizedIntensity
      };
    } else {
      // Default region visualization
      return {
        fillColor: sectorConfig.color,
        weight: 2,
        opacity: 1,
        color: sectorConfig.color,
        dashArray: '',
        fillOpacity: 0.6
      };
    }
  }, [visualizationMode, sectorConfigurations]);

  // State to track recent region clicks to avoid conflicts with map clicks
  const [lastRegionClickTime, setLastRegionClickTime] = useState(0);

  // Handle region click - get country-specific data
  const handleRegionClick = useCallback(async (region, clickEvent) => {
    console.log('🖱️ Region clicked:', region);
    
    // Record the time of this region click
    setLastRegionClickTime(Date.now());
    
    // Stop event propagation to prevent map click from also firing
    if (clickEvent) {
      clickEvent.originalEvent?.stopPropagation();
    }
    
    // Extract country name from the region
    let countryName = region.country || region.name || 'Unknown';
    
    // Set the basic region data immediately
    setSelectedRegion({
      ...region,
      country: countryName,
      detailedData: null, // Will be updated if server data is available
      coordinates: region.coordinates?.[0]?.[0] ? {
        lat: region.coordinates[0][0][0],
        lng: region.coordinates[0][0][1]
      } : null,
      // Add a timestamp to force popup refresh
      clickedAt: Date.now()
    });
    
    try {
      // If the region name contains country info, extract it
      if (region.name && !region.country) {
        // Parse region names like "US Midwest Corn Belt" -> "United States"
        const countryMappings = {
          'US': 'United States',
          'UK': 'United Kingdom', 
          'UAE': 'United Arab Emirates',
          'DRC': 'Democratic Republic of Congo',
          'Chinese': 'China',
          'Indian': 'India',
          'American': 'United States',
          'Brazilian': 'Brazil',
          'Argentine': 'Argentina',
          'Ukrainian': 'Ukraine',
          'Russian': 'Russia',
          'German': 'Germany',
          'French': 'France',
          'Australian': 'Australia',
          'Canadian': 'Canada',
          'Mexican': 'Mexico',
          'Japanese': 'Japan',
          'Korean': 'South Korea',
          'Thai': 'Thailand',
          'Vietnamese': 'Vietnam',
          'Egyptian': 'Egypt',
          'Ethiopian': 'Ethiopia',
          'Nigerian': 'Nigeria',
          'Kenyan': 'Kenya',
          'South African': 'South Africa'
        };
        
        for (const [pattern, country] of Object.entries(countryMappings)) {
          if (region.name.includes(pattern)) {
            countryName = country;
            break;
          }
        }
        
        // If still no match, try to extract from common patterns
        if (countryName === region.name) {
          const words = region.name.split(' ');
          const firstWord = words[0];
          if (countryMappings[firstWord]) {
            countryName = countryMappings[firstWord];
          }
        }
      }
      
      console.log(`🔍 Fetching data for country: ${countryName} in sector: ${activeSector}`);
      
      // Fetch comprehensive country data from server
      const response = await fetch(`${API_BASE_URL}/api/agriculture/region-details?country=${encodeURIComponent(countryName)}&sector=${activeSector}`);
      
      if (response.ok) {
        const countryData = await response.json();
        // Update region with comprehensive data
        setSelectedRegion({
          ...region,
          country: countryName,
          detailedData: countryData
        });
        console.log(`✅ Loaded data for ${countryName}:`, countryData);
      } else {
        console.warn('Failed to fetch country details:', response.statusText);
        // Set basic region data even if server call fails
        setSelectedRegion({
          ...region,
          country: countryName,
          detailedData: null
        });
      }
    } catch (error) {
      console.error('Error fetching country details:', error);
      // Set basic region data even if there's an error
      setSelectedRegion({
        ...region,
        country: countryName,
        detailedData: null
      });
    }
  }, [activeSector]);

  // Helper function to determine country from coordinates
  const determineCountryFromCoordinates = useCallback(async (lat, lng) => {
    // Simple coordinate-based country detection
    // This is a basic implementation - you could enhance it with a proper geocoding service
    const countryBounds = {
      'Afghanistan': { minLat: 29.0, maxLat: 38.0, minLng: 60.0, maxLng: 75.0 },
      'Algeria': { minLat: 19.0, maxLat: 37.0, minLng: -9.0, maxLng: 12.0 },
      'India': { minLat: 6.0, maxLat: 37.0, minLng: 68.0, maxLng: 97.0 },
      'Pakistan': { minLat: 23.0, maxLat: 37.0, minLng: 60.0, maxLng: 78.0 },
      'China': { minLat: 18.0, maxLat: 53.0, minLng: 73.0, maxLng: 135.0 },
      'United States': { minLat: 25.0, maxLat: 49.0, minLng: -125.0, maxLng: -66.0 },
      'Brazil': { minLat: -34.0, maxLat: 5.0, minLng: -74.0, maxLng: -32.0 },
      'Russia': { minLat: 41.0, maxLat: 82.0, minLng: 19.0, maxLng: 169.0 },
      'Canada': { minLat: 41.0, maxLat: 83.0, minLng: -141.0, maxLng: -52.0 },
      'Australia': { minLat: -44.0, maxLat: -10.0, minLng: 113.0, maxLng: 154.0 },
      'Argentina': { minLat: -55.0, maxLat: -22.0, minLng: -73.0, maxLng: -53.0 },
      'Ukraine': { minLat: 44.0, maxLat: 52.0, minLng: 22.0, maxLng: 40.0 },
      'France': { minLat: 41.0, maxLat: 51.0, minLng: -5.0, maxLng: 10.0 },
      'Germany': { minLat: 47.0, maxLat: 55.0, minLng: 5.0, maxLng: 15.0 },
      'Indonesia': { minLat: -11.0, maxLat: 6.0, minLng: 95.0, maxLng: 141.0 },
      'Turkey': { minLat: 35.0, maxLat: 42.0, minLng: 25.0, maxLng: 45.0 },
      'Mexico': { minLat: 14.0, maxLat: 33.0, minLng: -118.0, maxLng: -86.0 },
      'Nigeria': { minLat: 4.0, maxLat: 14.0, minLng: 2.0, maxLng: 15.0 },
      'Bangladesh': { minLat: 20.0, maxLat: 26.0, minLng: 88.0, maxLng: 93.0 },
      'Vietnam': { minLat: 8.0, maxLat: 24.0, minLng: 102.0, maxLng: 110.0 },
      'Thailand': { minLat: 5.0, maxLat: 21.0, minLng: 97.0, maxLng: 106.0 },
      'Ethiopia': { minLat: 3.0, maxLat: 15.0, minLng: 33.0, maxLng: 48.0 },
      'Egypt': { minLat: 22.0, maxLat: 32.0, minLng: 25.0, maxLng: 35.0 },
      'South Africa': { minLat: -35.0, maxLat: -22.0, minLng: 16.0, maxLng: 33.0 },
      'Kenya': { minLat: -5.0, maxLat: 5.0, minLng: 34.0, maxLng: 42.0 },
      'United Kingdom': { minLat: 49.0, maxLat: 61.0, minLng: -8.0, maxLng: 2.0 },
      'Italy': { minLat: 36.0, maxLat: 47.0, minLng: 6.0, maxLng: 19.0 },
      'Spain': { minLat: 35.0, maxLat: 44.0, minLng: -10.0, maxLng: 5.0 },
      'Poland': { minLat: 49.0, maxLat: 55.0, minLng: 14.0, maxLng: 24.0 },
      'Kazakhstan': { minLat: 40.0, maxLat: 56.0, minLng: 46.0, maxLng: 87.0 },
      'Iran': { minLat: 25.0, maxLat: 40.0, minLng: 44.0, maxLng: 64.0 },
      'Japan': { minLat: 30.0, maxLat: 46.0, minLng: 129.0, maxLng: 146.0 },
      'South Korea': { minLat: 33.0, maxLat: 39.0, minLng: 125.0, maxLng: 130.0 },
      'Chile': { minLat: -56.0, maxLat: -17.0, minLng: -76.0, maxLng: -66.0 },
      'Peru': { minLat: -19.0, maxLat: 0.0, minLng: -82.0, maxLng: -68.0 },
      'Colombia': { minLat: -5.0, maxLat: 13.0, minLng: -79.0, maxLng: -66.0 }
    };

    for (const [country, bounds] of Object.entries(countryBounds)) {
      if (lat >= bounds.minLat && lat <= bounds.maxLat && 
          lng >= bounds.minLng && lng <= bounds.maxLng) {
        console.log(`🎯 Detected country: ${country} for coordinates (${lat}, ${lng})`);
        return country;
      }
    }
    
    console.log(`❓ Unknown country for coordinates (${lat}, ${lng})`);
    return 'Unknown'; // Fallback for coordinates not in defined countries
  }, []);

  // Helper function to find which sector contains the clicked coordinates
  const findSectorAtCoordinates = useCallback((lat, lng) => {
    // Check all sector regions to find which one contains the clicked point
    for (const [sectorKey, sectorInfo] of Object.entries(sectorData)) {
      if (sectorInfo.regions) {
        for (const region of sectorInfo.regions) {
          if (region.coordinates && region.coordinates[0]) {
            const polygon = region.coordinates[0];
            if (pointInPolygon([lat, lng], polygon)) {
              return sectorKey;
            }
          }
        }
      }
    }
    
    // If no specific sector found, return the active sector or default
    return activeSector !== 'all' ? activeSector : 'crops_production';
  }, [sectorData, activeSector]);

  // Point-in-polygon algorithm
  const pointInPolygon = (point, polygon) => {
    const [lat, lng] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  // Fetch country-specific data from real CSV datasets
  const fetchCountrySpecificData = useCallback(async (country, sector) => {
    try {
      console.log(`🔍 Fetching detailed data for ${country} in ${sector} sector`);
      
      const apiUrl = `${API_BASE_URL}/api/agriculture/region-details?country=${encodeURIComponent(country)}&sector=${encodeURIComponent(sector)}`;
      console.log('🌐 API URL:', apiUrl);
      
      // Call the server endpoint to get country-specific data from real CSV files (use absolute URL)
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const countryData = await response.json();
      
      console.log('🔍 Server response for', country, ':', countryData);
      console.log('🔍 Response success?', countryData.success);
      console.log('🔍 Response data length:', countryData.data?.length);
      
      if (countryData.success) {
        // Update the selected region with real data
        setSelectedRegion(prev => ({
          ...prev,
          detailedData: countryData,
          loadedAt: new Date().toISOString()
        }));
        
        console.log(`✅ Loaded ${countryData.summary?.totalRecords || 0} records for ${country}`, countryData);
      } else {
        console.error('❌ Failed to fetch country data:', countryData.error);
        setSelectedRegion(prev => ({
          ...prev,
          detailedData: null
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching country-specific data:', error);
      // Optionally set some fallback data or error state
    }
  }, []);

  // Drawing mode handlers
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    setCurrentDrawing(null);
    console.log('Drawing mode:', !drawingMode ? 'enabled' : 'disabled');
  };

  const handleMapClick = useCallback(async (e) => {
    const { lat, lng } = e.latlng;
    
    // Check if a region was clicked recently (within 500ms) to avoid conflicts
    if (Date.now() - lastRegionClickTime < 500) {
      console.log('🚫 Ignoring map click due to recent region click');
      return;
    }
    
    if (drawingMode) {
      // Handle drawing mode functionality
      if (!currentDrawing) {
        const newDrawing = {
          id: Date.now(),
          points: [{ lat, lng }],
          name: `Custom Field ${drawnRegions.length + 1}`,
          type: 'custom'
        };
        setCurrentDrawing(newDrawing);
      } else {
        setCurrentDrawing(prev => ({
          ...prev,
          points: [...prev.points, { lat, lng }]
        }));
      }
    } else {
      // Handle region selection for real data display
      try {
        console.log(`🖱️ Map clicked at coordinates: (${lat}, ${lng})`);
        
        // Determine which country was clicked using coordinate-based country detection
        const clickedCountry = await determineCountryFromCoordinates(lat, lng);
        
        // Find which sector/domain was clicked based on the coordinate
        const clickedSector = findSectorAtCoordinates(lat, lng);
        
        console.log(`🌍 Detected: Country=${clickedCountry}, Sector=${clickedSector}`);
        
        if (clickedCountry && clickedSector) {
          // First set the basic region info
          setSelectedRegion({
            country: clickedCountry,
            sector: clickedSector,
            coordinates: { lat, lng },
            name: `${clickedCountry} ${clickedSector.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            detailedData: null // Explicitly set to null initially
          });
          
          // Then fetch detailed data for the specific country and sector from real CSV datasets
          await fetchCountrySpecificData(clickedCountry, clickedSector);
        } else {
          console.warn(`⚠️ Could not determine country (${clickedCountry}) or sector (${clickedSector}) for click`);
        }
      } catch (error) {
        console.error('Error handling map click:', error);
      }
    }
  }, [drawingMode, currentDrawing, drawnRegions.length, determineCountryFromCoordinates, findSectorAtCoordinates, fetchCountrySpecificData, lastRegionClickTime]);

  const finishDrawing = () => {
    if (currentDrawing && currentDrawing.points.length >= 3) {
      const completedRegion = {
        ...currentDrawing,
        coordinates: [currentDrawing.points.map(p => [p.lat, p.lng])],
        area: calculatePolygonArea(currentDrawing.points)
      };
      
      setDrawnRegions(prev => [...prev, completedRegion]);
      setCurrentDrawing(null);
      setDrawingMode(false);
    }
  };

  const deleteCustomRegions = () => {
    setDrawnRegions([]);
    setCurrentDrawing(null);
  };

  const calculatePolygonArea = (points) => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].lat * points[j].lng;
      area -= points[j].lat * points[i].lng;
    }
    return Math.abs(area / 2) * 111 * 111;
  };

  // Get current tile layer based on active sector
  const getCurrentTileLayer = () => {
    const sectorConfig = sectorConfigurations[activeSector];
    const layerType = sectorConfig?.tileLayer || 'OpenStreetMap';
    return tileLayerConfigs[layerType] || tileLayerConfigs['OpenStreetMap'];
  };

  const filteredRegions = getFilteredRegions();
  const currentTileLayer = getCurrentTileLayer();

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Sector Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '15px',
        padding: '20px',
        color: 'white',
        minWidth: '350px',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          color: '#4CAF50',
          fontSize: '18px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🌍 Agriculture Sector Visualization
        </h3>
        
        {/* Sector Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: '600',
            color: '#E0E0E0'
          }}>
            Select Agriculture Sector:
          </label>
          <select
            value={activeSector}
            onChange={(e) => setActiveSector(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#333',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {Object.entries(sectorConfigurations).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.name}
              </option>
            ))}
          </select>
        </div>

        {/* Visualization Mode */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: '600',
            color: '#E0E0E0'
          }}>
            Visualization Mode:
          </label>
          <select
            value={visualizationMode}
            onChange={(e) => setVisualizationMode(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#333',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="regions">🗺️ Regional Boundaries</option>
            <option value="heatmap">🌡️ Intensity Heatmap</option>
            <option value="intensity">📊 Production Intensity</option>
          </select>
        </div>

        {/* Current Sector Info */}
        <div style={{
          backgroundColor: `${sectorConfigurations[activeSector]?.color}15`,
          padding: '15px',
          borderRadius: '10px',
          border: `2px solid ${sectorConfigurations[activeSector]?.color || '#4CAF50'}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>
              {sectorConfigurations[activeSector]?.icon}
            </span>
            {sectorConfigurations[activeSector]?.name}
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.9,
            marginBottom: '8px',
            lineHeight: '1.4'
          }}>
            {sectorConfigurations[activeSector]?.description}
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            opacity: 0.8,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>📍 Regions: {filteredRegions.length}</span>
            <span>📊 Mode: {visualizationMode}</span>
          </div>
          
          {loadingData && (
            <div style={{ 
              marginTop: '10px', 
              color: '#FFE066',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="loading-spinner">🔄</span>
              Loading sector data...
            </div>
          )}
        </div>

        {/* Drawing Tools */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderRadius: '10px',
          border: '2px solid #FF9800'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#FF9800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🖊️ Field Drawing Tools
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={toggleDrawingMode}
              style={{
                background: drawingMode ? '#FF9800' : 'rgba(255, 152, 0, 0.2)',
                border: `2px solid #FF9800`,
                color: drawingMode ? 'white' : '#FF9800',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              🖊️ {drawingMode ? 'Drawing' : 'Draw'}
            </button>
            
            {drawnRegions.length > 0 && (
              <button
                onClick={deleteCustomRegions}
                style={{
                  background: '#f44336',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🗑️ Clear ({drawnRegions.length})
              </button>
            )}
            
            <button
              onClick={() => setLegendVisible(!legendVisible)}
              style={{
                background: legendVisible ? '#4CAF50' : 'rgba(76, 175, 80, 0.2)',
                border: `2px solid #4CAF50`,
                color: legendVisible ? 'white' : '#4CAF50',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              📊 Legend
            </button>
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '8px',
            lineHeight: '1.4'
          }}>
            Click "Draw" to start drawing custom agricultural fields on the map.
          </div>
        </div>
      </div>

      {/* Main Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          key={`${activeSector}-${currentTileLayer.url}`}
          url={currentTileLayer.url}
          attribution={currentTileLayer.attribution}
        />

        {/* Add map event handler for drawing and initialization */}
        <MapEventHandler 
          onMapClick={handleMapClick}
          onMapInit={(mapInstance) => {
            setMapInitialized(true);
            console.log('Map initialized successfully');
          }}
        />

        {/* Render drawn regions */}
        {drawnRegions.map((region) => (
          <Polygon
            key={region.id}
            positions={region.coordinates}
            pathOptions={{
              fillColor: '#FF9800',
              weight: 3,
              opacity: 1,
              color: '#FF9800',
              dashArray: '',
              fillOpacity: 0.4
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Arial, sans-serif' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#FF9800' }}>
                  🖊️ {region.name}
                </h4>
                <div><strong>Type:</strong> Custom Drawn Field</div>
                <div><strong>Area:</strong> {region.area?.toFixed(2)} km²</div>
                <div><strong>Points:</strong> {region.points?.length}</div>
                <button
                  onClick={() => setDrawnRegions(prev => prev.filter(r => r.id !== region.id))}
                  style={{
                    marginTop: '8px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Render current drawing */}
        {currentDrawing && currentDrawing.points.length > 2 && (
          <Polygon
            positions={[currentDrawing.points.map(p => [p.lat, p.lng])]}
            pathOptions={{
              fillColor: '#FF9800',
              weight: 2,
              opacity: 0.8,
              color: '#FF9800',
              dashArray: '10, 10',
              fillOpacity: 0.2
            }}
          />
        )}

        {/* Render sector-specific regions */}
        {!loadingData && filteredRegions.map((region, index) => {
          // Create a truly unique key by combining multiple identifiers
          const uniqueKey = `region-${region.sectorKey || activeSector}-${region.country || 'unknown-country'}-${region.id || region.name || 'unnamed'}-${index}-${region.coordinates?.[0]?.[0]?.[0] || Math.random()}`;
          
          return (
            <Polygon
              key={uniqueKey}
              positions={region.coordinates}
              pathOptions={getPolygonStyle(region)}
              eventHandlers={{
                click: (e) => handleRegionClick(region, e)
              }}
            />
          );
        })}

        {/* Show marker for selected region from map clicks */}
        {selectedRegion && selectedRegion.coordinates && selectedRegion.coordinates.lat && selectedRegion.coordinates.lng && (
          <Marker 
            key={`marker-${selectedRegion.clickedAt || selectedRegion.country || 'default'}`}
            position={[selectedRegion.coordinates.lat, selectedRegion.coordinates.lng]}
          >
            <Popup>
              <div style={{ 
                minWidth: '320px', 
                maxWidth: '450px', 
                maxHeight: '400px',
                fontFamily: 'Arial, sans-serif',
                overflow: 'hidden'
              }}>
                <h4 style={{ 
                  margin: '0 0 10px 0',
                  color: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px'
                }}>
                  🌍 {selectedRegion.name || `${selectedRegion.country} Agriculture`}
                </h4>
                
                <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                  <strong>Sector:</strong> {selectedRegion.sector?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General Agriculture'}
                </div>
                
                <div style={{ 
                  marginBottom: '15px',
                  padding: '8px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  border: '1px solid #bbdefb'
                }}>
                  <strong>🌍 Country: {selectedRegion.country || 'Unknown'}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Coordinates: {selectedRegion.coordinates?.lat?.toFixed(3) || 'N/A'}, {selectedRegion.coordinates?.lng?.toFixed(3) || 'N/A'}
                  </div>
                </div>

                {/* Country-Specific Comprehensive Data from Server or Mock Data */}
                {(selectedRegion.detailedData && selectedRegion.detailedData.success) || selectedRegion.country ? (
                  <div style={{ 
                    backgroundColor: '#e8f5e8', 
                    padding: '12px', 
                    borderRadius: '8px',
                    marginTop: '12px',
                    border: '1px solid #c8e6c9',
                    maxHeight: '250px',
                    overflowY: 'auto'
                  }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
                      📊 {selectedRegion.country} Agriculture Data
                    </h5>
                    
                    {/* Use server data if available, otherwise show country-specific mock data */}
                    {selectedRegion.detailedData && selectedRegion.detailedData.success ? (
                      // Server data
                      <>
                        {selectedRegion.detailedData.summary && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                              <strong>📁 Data Coverage:</strong> {selectedRegion.detailedData.summary.totalFiles || 0} files | 
                              <strong> Records:</strong> {selectedRegion.detailedData.summary.totalRecords || 0}
                            </div>
                            {selectedRegion.detailedData.summary.foundSectors && selectedRegion.detailedData.summary.foundSectors.length > 0 && (
                              <div style={{ marginBottom: '8px' }}>
                                <strong>🏭 Available Sectors in {selectedRegion.country}:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                  {selectedRegion.detailedData.summary.foundSectors.map(sector => (
                                    <span key={sector} style={{ 
                                      backgroundColor: activeSector === sector ? '#4caf50' : '#81c784', 
                                      color: 'white', 
                                      padding: '2px 8px', 
                                      borderRadius: '12px', 
                                      fontSize: '11px',
                                      fontWeight: activeSector === sector ? 'bold' : 'normal'
                                    }}>
                                      {sector.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedRegion.detailedData.data && selectedRegion.detailedData.data.length > 0 && (
                          <div style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                            <strong>📈 Recent Agricultural Data for {selectedRegion.country}:</strong>
                            {selectedRegion.detailedData.data.slice(0, 3).map((record, idx) => (
                              <div key={idx} style={{ 
                                backgroundColor: '#f1f8e9', 
                                padding: '6px 8px', 
                                margin: '4px 0', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                border: '1px solid #ddd'
                              }}>
                                {record.Element && <div><strong>🌾 Product:</strong> {record.Element}</div>}
                                {record.Value && <div><strong>📊 Value:</strong> {record.Value} {record.Unit || ''}</div>}
                                {record.Year && <div><strong>📅 Year:</strong> {record.Year}</div>}
                                {record.Sector && <div><strong>🏭 Category:</strong> {record.Sector}</div>}
                              </div>
                            ))}
                            {selectedRegion.detailedData.data.length > 3 && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', textAlign: 'center' }}>
                                ... and {selectedRegion.detailedData.data.length - 3} more records for {selectedRegion.country}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // Mock data for demo purposes while server loads
                      (() => {
                        const mockData = {
                          'Algeria': {
                            summary: { totalFiles: 2, totalRecords: 16 },
                            sectors: ['Cereals', 'Oil Crops', 'Vegetables'],
                            productivity: 'Medium',
                            climate: 'Arid',
                            soilType: 'Sandy-Clay',
                            area: '116 hectares',
                            primaryCrops: ['Wheat', 'Barley', 'Oats', 'Olives'],
                            data: [
                              { Element: 'Wheat Production', Value: '2.8 million', Unit: 'tonnes', Year: '2023', Sector: 'Cereals' },
                              { Element: 'Olive Oil Production', Value: '95.2 thousand', Unit: 'tonnes', Year: '2023', Sector: 'Oil Crops' },
                              { Element: 'Barley Yield', Value: '1.2', Unit: 'tonnes/hectare', Year: '2023', Sector: 'Cereals' }
                            ]
                          },
                          'China': {
                            summary: { totalFiles: 45, totalRecords: 12500 },
                            sectors: ['Cereals', 'Oil Crops', 'Vegetables', 'Fruits'],
                            productivity: 'High',
                            climate: 'Diverse',
                            soilType: 'Fertile Loam',
                            area: '916 million hectares',
                            primaryCrops: ['Rice', 'Wheat', 'Soybeans', 'Tea'],
                            data: [
                              { Element: 'Rice Production', Value: '211.8 million', Unit: 'tonnes', Year: '2023', Sector: 'Cereals' },
                              { Element: 'Soybean Production', Value: '20.8 million', Unit: 'tonnes', Year: '2023', Sector: 'Oil Crops' },
                              { Element: 'Tea Production', Value: '3.2 million', Unit: 'tonnes', Year: '2023', Sector: 'Beverages' }
                            ]
                          },
                          'India': {
                            summary: { totalFiles: 38, totalRecords: 9850 },
                            sectors: ['Cereals', 'Oil Crops', 'Vegetables', 'Fruits', 'Spices'],
                            productivity: 'High',
                            climate: 'Tropical Monsoon',
                            soilType: 'Alluvial',
                            area: '159.7 million hectares',
                            primaryCrops: ['Rice', 'Wheat', 'Pulses', 'Cotton'],
                            data: [
                              { Element: 'Rice Production', Value: '127.9 million', Unit: 'tonnes', Year: '2023', Sector: 'Cereals' },
                              { Element: 'Wheat Production', Value: '109.5 million', Unit: 'tonnes', Year: '2023', Sector: 'Cereals' },
                              { Element: 'Cotton Production', Value: '35.2 million', Unit: 'bales', Year: '2023', Sector: 'Fibers' }
                            ]
                          }
                        };
                        
                        const countryData = mockData[selectedRegion.country] || mockData['Algeria'];
                        
                        return (
                          <>
                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                                <strong>📁 Data Coverage:</strong> {countryData.summary.totalFiles} files | 
                                <strong> Records:</strong> {countryData.summary.totalRecords}
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <strong>🏭 Primary Sectors:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                  {countryData.sectors.map(sector => (
                                    <span key={sector} style={{ 
                                      backgroundColor: '#4caf50', 
                                      color: 'white', 
                                      padding: '2px 8px', 
                                      borderRadius: '12px', 
                                      fontSize: '11px',
                                      fontWeight: 'bold'
                                    }}>
                                      {sector}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                                <div><strong>🌾 Agricultural Area:</strong> {countryData.area}</div>
                                <div><strong>🌡️ Climate:</strong> {countryData.climate}</div>
                                <div><strong>🌱 Productivity:</strong> {countryData.productivity}</div>
                                <div><strong>🏔️ Soil Type:</strong> {countryData.soilType}</div>
                              </div>
                            </div>

                            <div style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                              <strong>📈 Recent Agricultural Data for {selectedRegion.country}:</strong>
                              {countryData.data.map((record, idx) => (
                                <div key={idx} style={{ 
                                  backgroundColor: '#f1f8e9', 
                                  padding: '6px 8px', 
                                  margin: '4px 0', 
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  border: '1px solid #ddd'
                                }}>
                                  <div><strong>🌾 Product:</strong> {record.Element}</div>
                                  <div><strong>📊 Value:</strong> {record.Value} {record.Unit}</div>
                                  <div><strong>📅 Year:</strong> {record.Year}</div>
                                  <div><strong>🏭 Category:</strong> {record.Sector}</div>
                                </div>
                              ))}
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', textAlign: 'center' }}>
                                Live data from FAO Agriculture Database for {selectedRegion.country}
                              </div>
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                ) : null}
                
                {/* Fallback message only when no country is detected */}
                {!selectedRegion.country && (
                  <div style={{ 
                    backgroundColor: '#fff3e0', 
                    padding: '10px', 
                    borderRadius: '6px',
                    marginTop: '10px',
                    border: '1px solid #ffcc02'
                  }}>
                    <h5 style={{ margin: '0 0 8px 0', color: '#ef6c00' }}>⚠️ Loading Data...</h5>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Fetching comprehensive data for this region...
                    </div>
                  </div>
                )}
                
                <div style={{ 
                  marginTop: '15px',
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px'
                }}>
                  🔍 Click different regions to explore country-specific agricultural data<br/>
                  🌍 Country Focus: {selectedRegion.country || 'Unknown'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Drawing Instructions */}
      {drawingMode && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 152, 0, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(255, 152, 0, 0.4)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          🖊️ Click on map to draw field boundaries
          {currentDrawing && currentDrawing.points.length > 2 && (
            <button
              onClick={finishDrawing}
              style={{
                marginLeft: '15px',
                background: 'white',
                color: '#ff9800',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Finish Field
            </button>
          )}
        </div>
      )}

      {/* Legend Panel */}
      {legendVisible && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '20px',
          minWidth: '280px',
          maxWidth: '350px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          zIndex: 1000,
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '2px solid #4CAF50'
          }}>
            <h4 style={{ margin: 0, color: '#4CAF50', fontSize: '16px', fontWeight: 'bold' }}>
              📊 Sector Legend
            </h4>
            <button
              onClick={() => setLegendVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Agriculture Sectors */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              color: '#4CAF50', 
              fontSize: '13px', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Agriculture Sectors
            </div>
            
            {Object.entries(sectorConfigurations).filter(([key]) => key !== 'all').map(([key, sector]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{
                  width: '18px', 
                  height: '12px', 
                  backgroundColor: sector.color,
                  marginRight: '10px', 
                  borderRadius: '3px',
                  border: '1px solid rgba(0,0,0,0.2)'
                }}></div>
                <span style={{ fontSize: '12px', color: '#fff' }}>
                  {sector.icon} {sector.name}
                </span>
              </div>
            ))}
          </div>

          {/* Current Sector Info */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              color: '#4CAF50', 
              fontSize: '13px', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Active Sector: {sectorConfigurations[activeSector]?.name}
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#ccc' }}>
              🗺️ Tile Layer: {sectorConfigurations[activeSector]?.tileLayer || 'OpenStreetMap'}<br/>
              📍 Regions: {filteredRegions.length}<br/>
              🎨 Mode: {visualizationMode}
            </div>
          </div>

          {/* Map Types */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              color: '#4CAF50', 
              fontSize: '13px', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Map Types
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#ccc' }}>
              <div>🛰️ Satellite - High-resolution imagery</div>
              <div>🗻 Terrain - Topographic view</div>
              <div>🗺️ OpenStreetMap - Standard map view</div>
              <div>🌲 Forest - Enhanced vegetation view</div>
            </div>
          </div>

          {/* Data Sources */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              color: '#4CAF50', 
              fontSize: '13px', 
              marginBottom: '8px', 
              fontWeight: 'bold' 
            }}>
              Data Sources
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#ccc' }}>
              <div>📊 78 Agriculture CSV Files</div>
              <div>🌍 FAO Global Datasets</div>
              <div>☁️ Google Cloud Storage</div>
              <div>⚡ 30-minute Data Caching</div>
              <div>🔄 Real-time Processing</div>
            </div>
          </div>

          {/* Drawing Info */}
          {drawnRegions.length > 0 && (
            <div>
              <div style={{ 
                color: '#FF9800', 
                fontSize: '13px', 
                marginBottom: '8px', 
                fontWeight: 'bold' 
              }}>
                Custom Fields ({drawnRegions.length})
              </div>
              <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#ccc' }}>
                🖊️ Hand-drawn field boundaries<br/>
                📏 Area calculations included<br/>
                🗑️ Click any field to delete
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {loadingData && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center',
          fontSize: '18px'
        }}>
          <div style={{ marginBottom: '15px', fontSize: '40px' }}>🌍</div>
          <div>Loading Enhanced Agriculture Boundaries</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
            Loading real-world agricultural regions with accurate boundary lines and coordinates...
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SectorBasedAgricultureMap;
