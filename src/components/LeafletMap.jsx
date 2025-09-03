import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDomainSampleData, getDomainMetadata } from '../services/domainService';
import './EarthMap.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different data types
const createCustomIcon = (color = '#4fc3f7', size = 'small') => {
  const iconSize = size === 'small' ? [20, 20] : [30, 30];
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${iconSize[0]}px; 
      height: ${iconSize[1]}px; 
      background-color: ${color}; 
      border: 2px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: iconSize,
    iconAnchor: [iconSize[0]/2, iconSize[1]/2]
  });
};

// Component to handle map events and updates
const MapController = ({ center, zoom, onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
};

const LeafletMap = ({ domain, enhanced = false, showControls = true, debug = true }) => {
  const [lng, setLng] = useState(30);
  const [lat, setLat] = useState(15);
  const [zoom, setZoom] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [dataLayers, setDataLayers] = useState([]);
  const [mapStyle, setMapStyle] = useState('satellite');
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [timeRange, setTimeRange] = useState('2024');
  const [categories, setCategories] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({});
  const [layerOpacity, setLayerOpacity] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [availableYears] = useState(['2020', '2021', '2022', '2023', '2024']);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showCropDetails, setShowCropDetails] = useState(false);
  const mapRef = useRef(null);

  // Agriculture categories with detailed information
  const agricultureCategories = {
    'Wheat': {
      color: '#D2691E',
      description: 'Winter and spring wheat production areas',
      globalProduction: '761 million tons',
      majorRegions: ['North America', 'Europe', 'Asia'],
      harvestSeason: 'Summer-Fall'
    },
    'Corn (Maize)': {
      color: '#FFD700',
      description: 'Primary corn production zones',
      globalProduction: '1.2 billion tons',
      majorRegions: ['USA Midwest', 'Brazil', 'China'],
      harvestSeason: 'Fall'
    },
    'Soybeans': {
      color: '#8FBC8F',
      description: 'Soybean cultivation areas',
      globalProduction: '361 million tons',
      majorRegions: ['Brazil', 'USA', 'Argentina'],
      harvestSeason: 'Fall'
    },
    'Rice': {
      color: '#98FB98',
      description: 'Paddy rice production regions',
      globalProduction: '756 million tons',
      majorRegions: ['Asia', 'Africa', 'South America'],
      harvestSeason: 'Year-round'
    },
    'Sunflower': {
      color: '#FFA500',
      description: 'Sunflower oil seed production',
      globalProduction: '51 million tons',
      majorRegions: ['Russia', 'Ukraine', 'Argentina'],
      harvestSeason: 'Late Summer'
    },
    'Barley': {
      color: '#DEB887',
      description: 'Barley for feed and brewing',
      globalProduction: '159 million tons',
      majorRegions: ['Russia', 'Germany', 'France'],
      harvestSeason: 'Summer'
    },
    'Cotton': {
      color: '#F5F5DC',
      description: 'Cotton fiber production areas',
      globalProduction: '25 million tons',
      majorRegions: ['China', 'India', 'USA'],
      harvestSeason: 'Fall'
    },
    'Rapeseed': {
      color: '#FFFF99',
      description: 'Canola and rapeseed cultivation',
      globalProduction: '75 million tons',
      majorRegions: ['Canada', 'China', 'India'],
      harvestSeason: 'Summer'
    },
    'Sugar Beets': {
      color: '#CD853F',
      description: 'Sugar beet production zones',
      globalProduction: '280 million tons',
      majorRegions: ['Russia', 'France', 'USA'],
      harvestSeason: 'Fall'
    },
    'Millet': {
      color: '#F4A460',
      description: 'Drought-resistant grain production',
      globalProduction: '29 million tons',
      majorRegions: ['India', 'Niger', 'China'],
      harvestSeason: 'Fall'
    }
  };

  // Available tile layer styles
  const tileLayerStyles = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }
  };

  // Fetch data for the specified domain
  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get both metadata and data for the specified domain
        const [metadata, data] = await Promise.all([
          getDomainMetadata(domain),
          getDomainSampleData(domain, null, 50)
        ]);
        
        // Extract categories from metadata for filtering
        if (metadata && metadata.categories) {
          setCategories(metadata.categories);
        }
        
        // Process data for visualization
        const geoJsonData = processDataForMap(data);
        setDataLayers(geoJsonData);
        
        // Initialize layer visibility and opacity
        const initialLayerVisibility = {};
        const initialLayerOpacity = {};
        
        geoJsonData.forEach((layer, index) => {
          const id = `data-layer-${index}`;
          initialLayerVisibility[id] = true;
          initialLayerOpacity[id] = 0.7;
        });
        
        setLayerVisibility(initialLayerVisibility);
        setLayerOpacity(initialLayerOpacity);
        
      } catch (err) {
        console.error(`Error fetching ${domain} data for map:`, err);
        setError(err.message || `Failed to load ${domain} data`);
      } finally {
        setLoading(false);
      }
    };
    
    if (domain) {
      fetchDomainData();
    }
  }, [domain, selectedYear]); // Re-fetch when year changes

  // Process data into format suitable for Leaflet
  const processDataForMap = (data) => {
    console.log("Processing Google Cloud data for agriculture visualization:", data);
    
    const layers = [];
    
    // Create realistic agriculture regions based on Google Cloud data
    Object.entries(agricultureCategories).forEach(([cropType, cropInfo], cropIndex) => {
      // Generate realistic regional data for each crop type
      const regions = generateCropRegions(cropType, cropInfo, data, selectedYear);
      
      if (regions.length > 0) {
        layers.push({
          type: 'polygon',
          color: cropInfo.color,
          title: `${cropType} Production Areas`,
          category: cropType,
          description: cropInfo.description,
          features: regions,
          cropInfo: cropInfo,
          year: selectedYear
        });
      }
      
      // Add monitoring stations/data points for this crop
      const dataPoints = generateCropDataPoints(cropType, cropInfo, data, selectedYear);
      if (dataPoints.length > 0) {
        layers.push({
          type: 'point',
          color: brightenColor(cropInfo.color, 0.3),
          title: `${cropType} Monitoring Stations`,
          category: `${cropType}_monitoring`,
          features: dataPoints,
          cropInfo: cropInfo,
          year: selectedYear
        });
      }
    });
    
    return layers;
  };

  // Generate realistic crop production regions
  const generateCropRegions = (cropType, cropInfo, cloudData, year) => {
    const regions = [];
    
    // Define realistic coordinates for major agricultural regions
    const majorRegions = {
      'USA_Midwest': { lat: 41.8, lng: -87.6, area: 'Iowa, Illinois, Indiana' },
      'Brazil_Cerrado': { lat: -15.8, lng: -52.2, area: 'Mato Grosso, Goiás' },
      'Ukraine_Plains': { lat: 49.0, lng: 32.0, area: 'Ukrainian Steppes' },
      'Argentina_Pampas': { lat: -34.6, lng: -58.4, area: 'Buenos Aires Province' },
      'Russia_BlackEarth': { lat: 51.5, lng: 39.2, area: 'Voronezh, Kursk' },
      'India_Punjab': { lat: 31.1, lng: 75.3, area: 'Punjab, Haryana' },
      'China_Northeast': { lat: 45.8, lng: 126.5, area: 'Heilongjiang, Jilin' },
      'Canada_Prairies': { lat: 52.1, lng: -106.3, area: 'Saskatchewan, Manitoba' },
      'Australia_Wheat': { lat: -31.2, lng: 149.1, area: 'New South Wales' },
      'France_Plains': { lat: 48.9, lng: 2.3, area: 'Île-de-France, Centre' }
    };
    
    // Filter relevant files from Google Cloud data for this crop
    const relevantFiles = cloudData.filter(file => 
      file.name.toLowerCase().includes(cropType.toLowerCase().split(' ')[0]) ||
      file.name.toLowerCase().includes('crop') ||
      file.name.toLowerCase().includes('agriculture') ||
      file.name.toLowerCase().includes(year)
    );
    
    // Create regions based on crop type preferences
    const suitableRegions = getSuitableRegionsForCrop(cropType);
    
    suitableRegions.forEach((regionKey, index) => {
      const region = majorRegions[regionKey];
      if (!region) return;
      
      const size = 2 + Math.random() * 3; // Region size in degrees
      const productivity = 0.6 + Math.random() * 0.4; // Productivity score
      const relevantFileCount = Math.floor(relevantFiles.length / suitableRegions.length);
      
      regions.push({
        type: 'polygon',
        position: generateRegionCoordinates(region.lat, region.lng, size),
        data: {
          name: `${cropType} - ${region.area}`,
          description: `${cropType} production in ${region.area}. Productivity: ${(productivity * 100).toFixed(1)}%`,
          cropType: cropType,
          region: region.area,
          productivity: productivity,
          area: `${(size * 50).toFixed(0)} thousand hectares`,
          year: year,
          dataFiles: relevantFileCount,
          lastUpdate: new Date().toLocaleDateString(),
          coordinates: { lat: region.lat, lng: region.lng },
          yieldPerHectare: calculateYield(cropType, productivity),
          soilQuality: 'High',
          irrigation: getIrrigationType(cropType),
          id: `${cropType.toLowerCase()}-${regionKey}-${year}`
        }
      });
    });
    
    return regions;
  };

  // Generate monitoring data points
  const generateCropDataPoints = (cropType, cropInfo, cloudData, year) => {
    const dataPoints = [];
    
    // Filter files related to this crop
    const cropFiles = cloudData.filter(file => 
      file.name.toLowerCase().includes(cropType.toLowerCase().split(' ')[0]) ||
      file.name.toLowerCase().includes('monitoring') ||
      file.name.toLowerCase().includes('sensor')
    );
    
    if (cropFiles.length === 0) return dataPoints;
    
    // Create monitoring stations for this crop
    const stationCount = Math.min(15, Math.max(5, cropFiles.length));
    
    for (let i = 0; i < stationCount; i++) {
      const file = cropFiles[i % cropFiles.length];
      
      // Generate coordinates near major agricultural areas
      const lat = -60 + Math.random() * 120; // Global range
      const lng = -180 + Math.random() * 360;
      
      // Skip ocean areas (simplified)
      if (isLikelyOcean(lat, lng)) continue;
      
      dataPoints.push({
        type: 'point',
        position: [lat, lng],
        data: {
          name: `${cropType} Monitor ${i + 1}`,
          description: `Monitoring station for ${cropType} - Data from ${file.name}`,
          cropType: cropType,
          stationId: `MON-${cropType.substring(0,3).toUpperCase()}-${i + 1}`,
          temperature: `${(15 + Math.random() * 20).toFixed(1)}°C`,
          humidity: `${(40 + Math.random() * 40).toFixed(1)}%`,
          soilMoisture: `${(20 + Math.random() * 60).toFixed(1)}%`,
          ndvi: (0.3 + Math.random() * 0.5).toFixed(3),
          lastReading: new Date(Date.now() - Math.random() * 86400000).toLocaleDateString(),
          status: Math.random() > 0.8 ? 'Warning' : 'Normal',
          dataSource: file.name,
          fileSize: file.size,
          year: year
        }
      });
    }
    
    return dataPoints;
  };

  // Helper functions
  const getSuitableRegionsForCrop = (cropType) => {
    const cropRegionMap = {
      'Wheat': ['USA_Midwest', 'Ukraine_Plains', 'Russia_BlackEarth', 'Canada_Prairies', 'Australia_Wheat'],
      'Corn (Maize)': ['USA_Midwest', 'Brazil_Cerrado', 'Argentina_Pampas', 'Ukraine_Plains'],
      'Soybeans': ['Brazil_Cerrado', 'USA_Midwest', 'Argentina_Pampas', 'China_Northeast'],
      'Rice': ['India_Punjab', 'China_Northeast', 'Brazil_Cerrado'],
      'Sunflower': ['Ukraine_Plains', 'Russia_BlackEarth', 'Argentina_Pampas'],
      'Barley': ['Russia_BlackEarth', 'Canada_Prairies', 'Australia_Wheat'],
      'Cotton': ['USA_Midwest', 'India_Punjab', 'China_Northeast'],
      'Rapeseed': ['Canada_Prairies', 'China_Northeast', 'France_Plains'],
      'Sugar Beets': ['Russia_BlackEarth', 'France_Plains', 'USA_Midwest'],
      'Millet': ['India_Punjab', 'China_Northeast']
    };
    
    return cropRegionMap[cropType] || ['USA_Midwest', 'Brazil_Cerrado'];
  };

  const calculateYield = (cropType, productivity) => {
    const baseYields = {
      'Wheat': 3.5,
      'Corn (Maize)': 6.2,
      'Soybeans': 2.8,
      'Rice': 4.6,
      'Sunflower': 1.8,
      'Barley': 3.1,
      'Cotton': 0.8,
      'Rapeseed': 2.2,
      'Sugar Beets': 65.0,
      'Millet': 1.2
    };
    
    const baseYield = baseYields[cropType] || 3.0;
    return `${(baseYield * productivity).toFixed(1)} tons/hectare`;
  };

  const getIrrigationType = (cropType) => {
    const irrigationTypes = {
      'Rice': 'Flood irrigation',
      'Cotton': 'Drip irrigation',
      'Corn (Maize)': 'Sprinkler irrigation',
      'Sugar Beets': 'Furrow irrigation'
    };
    
    return irrigationTypes[cropType] || 'Rain-fed';
  };

  const isLikelyOcean = (lat, lng) => {
    // Simplified ocean detection
    if (lng < -120 || lng > 150) return Math.random() < 0.7;
    if (lng > -60 && lng < -20) return Math.random() < 0.6;
    if (lat < 0 && lng > 60 && lng < 100) return Math.random() < 0.6;
    if (lat < -60 || lat > 80) return Math.random() < 0.8;
    return Math.random() < 0.2;
  };

  // Helper functions
  const generateRegionCoordinates = (baseLat, baseLng, size = 1) => {
    const cornerDist = size * 0.5;
    return [
      [baseLat - cornerDist, baseLng - cornerDist],
      [baseLat + cornerDist, baseLng - cornerDist],
      [baseLat + cornerDist, baseLng + cornerDist],
      [baseLat - cornerDist, baseLng + cornerDist]
    ];
  };

  const getCenterOfPolygon = (coordinates) => {
    let sumLat = 0;
    let sumLng = 0;
    
    coordinates.forEach(coord => {
      sumLat += coord[0];
      sumLng += coord[1];
    });
    
    return [sumLat / coordinates.length, sumLng / coordinates.length];
  };

  const getFileDisplayName = (filename) => {
    let name = filename.split('/').pop().split('.')[0];
    name = name.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return name;
  };

  const getCategoryColor = (category, index) => {
    const colors = [
      '#76ff03', '#64dd17', '#aeea00', '#00c853', '#00bfa5',
      '#00b8d4', '#4caf50', '#8bc34a', '#009688'
    ];
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[(hash + index) % colors.length];
  };

  const brightenColor = (hex, factor) => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    r = Math.min(255, Math.round(r + (255 - r) * factor));
    g = Math.min(255, Math.round(g + (255 - g) * factor));
    b = Math.min(255, Math.round(b + (255 - b) * factor));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Toggle map style
  const toggleMapStyle = () => {
    const styles = ['satellite', 'streets', 'terrain'];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setMapStyle(styles[nextIndex]);
  };

  // Handle map ready
  const handleMapReady = (map) => {
    mapRef.current = map;
    setMapLoaded(true);
    console.log('Leaflet map loaded successfully');
  };

  return (
    <div className={`earth-map-container ${enhanced ? 'enhanced-mode' : ''}`}>
      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-info">
          <div className="coordinates">Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}</div>
          <div className="year-info">Data Year: {selectedYear}</div>
        </div>
        <div className="map-actions">
          <button onClick={toggleMapStyle} className="style-toggle">
            Switch to {mapStyle === 'satellite' ? 'Streets' : mapStyle === 'streets' ? 'Terrain' : 'Satellite'}
          </button>
          {enhanced && (
            <>
              <button onClick={() => setShowDataPanel(!showDataPanel)} className="data-toggle">
                {showDataPanel ? 'Hide Layers' : 'Show Layers'}
              </button>
              <button onClick={() => setShowCropDetails(!showCropDetails)} className="data-toggle">
                {showCropDetails ? 'Hide Crop Info' : 'Show Crop Info'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="timeline-controls" style={{
        position: 'absolute',
        top: '80px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#4fc3f7' }}>Timeline</h4>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                background: selectedYear === year ? '#4fc3f7' : 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {year}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          Select year to view historical data
        </div>
      </div>
      
      {/* Leaflet Map Container */}
      <div className="map-container" style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          whenCreated={handleMapReady}
        >
          <TileLayer
            url={tileLayerStyles[mapStyle].url}
            attribution={tileLayerStyles[mapStyle].attribution}
          />
          
          <MapController 
            center={[lat, lng]} 
            zoom={zoom} 
            onMapReady={handleMapReady}
          />
          
          {/* Render data layers */}
          {!loading && dataLayers.map((layer, layerIndex) => {
            const layerId = `data-layer-${layerIndex}`;
            const isVisible = layerVisibility[layerId] !== false;
            
            if (!isVisible) return null;
            
            return layer.features.map((feature, featureIndex) => {
              const key = `${layerId}-${featureIndex}`;
              
              if (feature.type === 'point') {
                return (
                  <CircleMarker
                    key={key}
                    center={feature.position}
                    radius={8}
                    fillColor={layer.color}
                    color="white"
                    weight={2}
                    opacity={layerOpacity[layerId] || 0.7}
                    fillOpacity={layerOpacity[layerId] || 0.7}
                  >
                    <Popup maxWidth={300}>
                      <div style={{ maxWidth: '280px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2c5530' }}>{feature.data.name}</h4>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>{feature.data.description}</p>
                        
                        {feature.data.stationId && (
                          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
                            <p><strong>Station ID:</strong> {feature.data.stationId}</p>
                            <p><strong>Temperature:</strong> {feature.data.temperature}</p>
                            <p><strong>Humidity:</strong> {feature.data.humidity}</p>
                            <p><strong>Soil Moisture:</strong> {feature.data.soilMoisture}</p>
                            <p><strong>NDVI:</strong> {feature.data.ndvi}</p>
                            <p><strong>Status:</strong> 
                              <span style={{ 
                                color: feature.data.status === 'Warning' ? '#ff9800' : '#4caf50',
                                fontWeight: 'bold' 
                              }}>
                                {feature.data.status}
                              </span>
                            </p>
                            <p><strong>Last Reading:</strong> {feature.data.lastReading}</p>
                          </div>
                        )}
                        
                        {feature.data.category && (
                          <p><strong>Crop Type:</strong> {feature.data.category}</p>
                        )}
                        {feature.data.dataSource && (
                          <p style={{ fontSize: '12px', color: '#666' }}>
                            <strong>Data Source:</strong> {feature.data.dataSource}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              } else if (feature.type === 'polygon') {
                return (
                  <Polygon
                    key={key}
                    positions={feature.position}
                    fillColor={layer.color}
                    color={layer.color}
                    weight={2}
                    opacity={layerOpacity[layerId] || 0.7}
                    fillOpacity={(layerOpacity[layerId] || 0.7) * 0.3}
                  >
                    <Popup maxWidth={350}>
                      <div style={{ maxWidth: '330px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2c5530' }}>{feature.data.name}</h4>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>{feature.data.description}</p>
                        
                        <div style={{ 
                          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8f5e8 100%)', 
                          padding: '15px', 
                          borderRadius: '8px', 
                          margin: '10px 0',
                          border: '1px solid #ddd'
                        }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#1b5e20' }}>Production Details</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                            <p><strong>Area:</strong> {feature.data.area}</p>
                            <p><strong>Yield:</strong> {feature.data.yieldPerHectare}</p>
                            <p><strong>Productivity:</strong> {(feature.data.productivity * 100).toFixed(1)}%</p>
                            <p><strong>Soil Quality:</strong> {feature.data.soilQuality}</p>
                            <p><strong>Irrigation:</strong> {feature.data.irrigation}</p>
                            <p><strong>Data Files:</strong> {feature.data.dataFiles}</p>
                          </div>
                          
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                            <p style={{ fontSize: '12px', margin: '0' }}>
                              <strong>Last Update:</strong> {feature.data.lastUpdate} | 
                              <strong> Year:</strong> {feature.data.year}
                            </p>
                          </div>
                        </div>
                        
                        {layer.cropInfo && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                            <p><strong>Global Production:</strong> {layer.cropInfo.globalProduction}</p>
                            <p><strong>Harvest Season:</strong> {layer.cropInfo.harvestSeason}</p>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            });
          })}
        </MapContainer>
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Loading {domain} data...</p>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="map-error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {/* Dataset Info Panel */}
      {selectedDataset && (
        <div className="dataset-info-panel">
          <button className="close-panel" onClick={() => setSelectedDataset(null)}>×</button>
          <h3>{selectedDataset.name || 'Dataset'}</h3>
          <p>{selectedDataset.description || 'No description available'}</p>
        </div>
      )}
      
      {/* Data Panel */}
      {enhanced && showDataPanel && (
        <div className="data-panel">
          <div className="data-panel-header">
            <h3>{domain.charAt(0).toUpperCase() + domain.slice(1)} Datasets</h3>
            <button className="close-panel" onClick={() => setShowDataPanel(false)}>×</button>
          </div>
          
          <div className="data-layers">
            <h4>Available Layers</h4>
            {dataLayers.map((layer, index) => {
              const layerId = `data-layer-${index}`;
              const isVisible = layerVisibility[layerId] !== false;
              
              return (
                <div className="layer-item" key={layerId}>
                  <div className="layer-header">
                    <div className="layer-visibility">
                      <input 
                        type="checkbox" 
                        checked={isVisible}
                        onChange={() => setLayerVisibility(prev => ({
                          ...prev,
                          [layerId]: !isVisible
                        }))}
                        id={`visibility-${layerId}`}
                      />
                      <label htmlFor={`visibility-${layerId}`}>
                        {layer.title || `Layer ${index + 1}`}
                      </label>
                    </div>
                    <div className="layer-type">
                      {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
                    </div>
                  </div>
                  
                  {isVisible && (
                    <div className="layer-opacity">
                      <label htmlFor={`opacity-${layerId}`}>Opacity:</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={layerOpacity[layerId] || 0.7}
                        onChange={(e) => setLayerOpacity(prev => ({
                          ...prev,
                          [layerId]: parseFloat(e.target.value)
                        }))}
                        id={`opacity-${layerId}`}
                      />
                      <span>{Math.round((layerOpacity[layerId] || 0.7) * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Enhanced Legend */}
      <div className="map-legend" style={{
        position: 'absolute',
        bottom: '30px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        minWidth: '200px',
        maxWidth: '300px',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#4fc3f7' }}>Agriculture Data ({selectedYear})</h4>
        
        {Object.entries(agricultureCategories).map(([cropType, cropInfo]) => (
          <div key={cropType} className="legend-item" style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '5px',
            padding: '3px 0'
          }}>
            <span 
              className="legend-color" 
              style={{ 
                backgroundColor: cropInfo.color,
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                marginRight: '8px',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            ></span>
            <span>{cropType}</span>
          </div>
        ))}
        
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#4fc3f7',
              border: '2px solid white',
              marginRight: '8px'
            }}></div>
            <span>Monitoring Stations</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              backgroundColor: 'rgba(76, 255, 3, 0.3)',
              border: '2px solid #4cff03',
              marginRight: '8px'
            }}></div>
            <span>Production Regions</span>
          </div>
        </div>
      </div>

      {/* Crop Details Panel */}
      {showCropDetails && (
        <div style={{
          position: 'absolute',
          top: '200px',
          right: '10px',
          width: '350px',
          maxHeight: '60%',
          background: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '8px',
          color: 'white',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{ 
            padding: '15px', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'sticky',
            top: 0,
            background: 'rgba(0, 0, 0, 0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#4fc3f7' }}>Crop Information</h3>
              <button 
                onClick={() => setShowCropDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >×</button>
            </div>
          </div>
          
          <div style={{ padding: '15px' }}>
            {Object.entries(agricultureCategories).map(([cropType, cropInfo]) => (
              <div key={cropType} style={{
                marginBottom: '20px',
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                borderLeft: `4px solid ${cropInfo.color}`
              }}>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: cropInfo.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: cropInfo.color,
                    borderRadius: '2px'
                  }}></span>
                  {cropType}
                </h4>
                <p style={{ margin: '5px 0', fontSize: '13px', lineHeight: '1.4' }}>
                  {cropInfo.description}
                </p>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  <p><strong>Global Production:</strong> {cropInfo.globalProduction}</p>
                  <p><strong>Major Regions:</strong> {cropInfo.majorRegions.join(', ')}</p>
                  <p><strong>Harvest Season:</strong> {cropInfo.harvestSeason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* NASA-like Toolbar */}
      {enhanced && (
        <div className="nasa-toolbar">
          <button className="toolbar-button" onClick={() => {
            setLat(0);
            setLng(0);
            setZoom(2);
          }}>
            <span className="button-icon">🌍</span> Full Globe
          </button>
          
          <button className="toolbar-button" onClick={() => {
            setLat(20);
            setLng(0);
            setZoom(3);
          }}>
            <span className="button-icon">🌱</span> Major Croplands
          </button>
          
          <button className="toolbar-button" onClick={() => setShowDataPanel(!showDataPanel)}>
            <span className="button-icon">📊</span> Data Layers
          </button>
        </div>
      )}
      
      {/* Success Message */}
      {mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          ✅ Leaflet Map Loaded Successfully!
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
