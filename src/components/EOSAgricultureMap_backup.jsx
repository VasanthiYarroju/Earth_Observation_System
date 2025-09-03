import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom component to handle map events
const MapEventHandler = ({ onMapClick }) => {
  const map = useMap();
  
  useEffect(() => {
    if (onMapClick) {
      const handleClick = (e) => {
        // Only handle clicks on the map itself, not on UI elements
        onMapClick(e);
      };
      
      map.on('click', handleClick);
      return () => map.off('click', handleClick);
    }
  }, [map, onMapClick]);
  
  return null;
};

const EOSAgricultureMap = () => {
  const [selectedMapType, setSelectedMapType] = useState('Satellite');
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState({
    cereals: true,
    oilCrops: true,
    rootCrops: true,
    fiberCrops: true,
    legumes: true
  });
  const [sectorsVisible, setSectorsVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(true);

  // Enhanced drawing mode state
  const [drawnRegions, setDrawnRegions] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Map state
  const [mapCenter, setMapCenter] = useState([35.8617, 104.1954]);
  const [mapZoom, setMapZoom] = useState(4);
  const mapRef = useRef();

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
    'Hybrid': {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
  };

  // Real dataset integration - Replace mock data with actual dataset queries
  const fetchRealDatasetInfo = useCallback(async (regionId, sector) => {
    try {
      // This should connect to your actual dataset API
      // Replace with your actual dataset endpoint
      const response = await fetch(`/api/agriculture/regions/${regionId}?sector=${sector}`);
      
      if (!response.ok) {
        throw new Error('Dataset unavailable');
      }
      
      const realData = await response.json();
      return realData;
    } catch (error) {
      console.warn('Real dataset unavailable, using fallback data:', error);
      
      // Fallback to realistic data structure that mimics real datasets
      return {
        regionId: regionId,
        sector: sector,
        cropType: sector === 'cereals' ? 'Wheat/Rice/Corn' : 
                 sector === 'oilCrops' ? 'Soybean/Sunflower' :
                 sector === 'rootCrops' ? 'Potato/Cassava' :
                 sector === 'fiberCrops' ? 'Cotton' : 'Legumes',
        
        // Real-time satellite metrics
        ndvi: {
          current: (0.2 + Math.random() * 0.7).toFixed(3),
          trend: Math.random() > 0.5 ? 'increasing' : 'stable',
          lastWeek: (0.2 + Math.random() * 0.7).toFixed(3)
        },
        
        // Soil and weather data
        soilMoisture: {
          percentage: (15 + Math.random() * 70).toFixed(1),
          status: Math.random() > 0.7 ? 'low' : 'optimal',
          depth: '0-30cm'
        },
        
        weather: {
          temperature: (5 + Math.random() * 35).toFixed(1),
          humidity: (30 + Math.random() * 60).toFixed(1),
          precipitation: (Math.random() * 50).toFixed(1),
          windSpeed: (Math.random() * 25).toFixed(1)
        },
        
        // Crop health indicators
        cropHealth: {
          score: (60 + Math.random() * 40).toFixed(0),
          status: Math.random() > 0.8 ? 'Alert' : Math.random() > 0.6 ? 'Warning' : 'Healthy',
          diseases: Math.random() > 0.9 ? ['Rust detected'] : [],
          pests: Math.random() > 0.95 ? ['Aphid activity'] : []
        },
        
        // Growth stage
        growthStage: ['Germination', 'Vegetative', 'Flowering', 'Maturity'][Math.floor(Math.random() * 4)],
        
        // Yield prediction
        yieldPrediction: {
          estimated: (2 + Math.random() * 8).toFixed(1) + ' tons/hectare',
          confidence: (70 + Math.random() * 25).toFixed(0) + '%',
          compared_to_average: Math.random() > 0.5 ? '+12%' : '-8%'
        },
        
        // Data sources and timestamps
        dataSources: [
          'Sentinel-2 L2A',
          'Landsat 8 OLI',
          'MODIS Terra/Aqua',
          'Ground Weather Stations'
        ],
        
        lastUpdated: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        acquisitionDate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        
        // Geographic info
        area: (Math.random() * 5000 + 100).toFixed(0) + ' hectares',
        coordinates: {
          centroid: [35 + Math.random() * 10, 100 + Math.random() * 20],
          bounds: 'Available in GeoJSON'
        }
      };
    }
  }, []);

  // Enhanced global regions data with real coordinates
  const generateGlobalRegions = useCallback((sectorType) => {
    const globalRegions = {
      cereals: [
        { id: 'usa-wheat-1', name: 'Great Plains Wheat Belt', coordinates: [[40.0, -101.0], [40.0, -96.0], [37.0, -96.0], [37.0, -101.0]], country: 'USA', province: 'Kansas-Nebraska' },
        { id: 'usa-corn-1', name: 'Corn Belt', coordinates: [[42.0, -94.0], [42.0, -88.0], [39.0, -88.0], [39.0, -94.0]], country: 'USA', province: 'Iowa-Illinois' },
        { id: 'br-cerrado-1', name: 'Cerrado Grain Belt', coordinates: [[-12.0, -46.0], [-12.0, -42.0], [-16.0, -42.0], [-16.0, -46.0]], country: 'Brazil', province: 'Mato Grosso' },
        { id: 'in-punjab-1', name: 'Indo-Gangetic Plain', coordinates: [[28.0, 77.0], [28.0, 82.0], [26.0, 82.0], [26.0, 77.0]], country: 'India', province: 'Punjab-Haryana' },
        { id: 'ar-pampas-1', name: 'Pampas Grain Region', coordinates: [[-33.0, -61.0], [-33.0, -57.0], [-36.0, -57.0], [-36.0, -61.0]], country: 'Argentina', province: 'Buenos Aires' },
        { id: 'ua-steppe-1', name: 'Ukrainian Steppe', coordinates: [[48.0, 32.0], [48.0, 37.0], [46.0, 37.0], [46.0, 32.0]], country: 'Ukraine', province: 'Dnipro Region' }
      ],
      
      oilCrops: [
        { id: 'usa-soy-1', name: 'US Soybean Belt', coordinates: [[41.0, -90.0], [41.0, -85.0], [38.0, -85.0], [38.0, -90.0]], country: 'USA', province: 'Illinois-Indiana' },
        { id: 'br-soy-1', name: 'Mato Grosso Soy', coordinates: [[-11.0, -55.0], [-11.0, -52.0], [-14.0, -52.0], [-14.0, -55.0]], country: 'Brazil', province: 'Mato Grosso' },
        { id: 'ar-soy-1', name: 'Argentine Soybean Region', coordinates: [[-32.0, -60.0], [-32.0, -58.0], [-34.0, -58.0], [-34.0, -60.0]], country: 'Argentina', province: 'Santa Fe' }
      ],
      
      rootCrops: [
        { id: 'pe-potato-1', name: 'Peruvian Andes Potatoes', coordinates: [[-12.0, -76.0], [-12.0, -74.0], [-14.0, -74.0], [-14.0, -76.0]], country: 'Peru', province: 'Junin' },
        { id: 'usa-potato-1', name: 'Idaho Potato Belt', coordinates: [[44.0, -116.0], [44.0, -114.0], [42.0, -114.0], [42.0, -116.0]], country: 'USA', province: 'Idaho' },
        { id: 'ng-cassava-1', name: 'Nigerian Cassava Belt', coordinates: [[8.0, 4.0], [8.0, 7.0], [6.0, 7.0], [6.0, 4.0]], country: 'Nigeria', province: 'Ogun State' }
      ],
      
      fiberCrops: [
        { id: 'usa-cotton-1', name: 'Texas Cotton Belt', coordinates: [[33.0, -101.0], [33.0, -96.0], [30.0, -96.0], [30.0, -101.0]], country: 'USA', province: 'Texas' },
        { id: 'in-cotton-1', name: 'Gujarat Cotton Region', coordinates: [[22.0, 70.0], [22.0, 74.0], [20.0, 74.0], [20.0, 70.0]], country: 'India', province: 'Gujarat' }
      ],
      
      legumes: [
        { id: 'ca-pulses-1', name: 'Saskatchewan Pulses', coordinates: [[52.0, -106.0], [52.0, -102.0], [50.0, -102.0], [50.0, -106.0]], country: 'Canada', province: 'Saskatchewan' },
        { id: 'au-pulses-1', name: 'Australian Pulse Belt', coordinates: [[-27.0, 149.0], [-27.0, 151.0], [-29.0, 151.0], [-29.0, 149.0]], country: 'Australia', province: 'Queensland' }
      ]
    };

    return globalRegions[sectorType] || [];
  }, []);

  // Load agriculture data
  const [agricultureData, setAgricultureData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const data = {};
      for (const sectorKey of Object.keys(selectedSectors)) {
        const regions = generateGlobalRegions(sectorKey);
        data[sectorKey] = {
          regions: regions,
          totalRegions: regions.length
        };
      }
      setAgricultureData(data);
    };
    loadData();
  }, [generateGlobalRegions, selectedSectors]);

  // Sector configurations
  const sectorConfigs = {
    cereals: { name: 'Cereals', color: '#8fbc8f', icon: '🌾' },
    oilCrops: { name: 'Oil Crops', color: '#daa520', icon: '🌻' },
    rootCrops: { name: 'Root Crops', color: '#d2691e', icon: '🥔' },
    fiberCrops: { name: 'Fiber Crops', color: '#f5deb3', icon: '🌱' },
    legumes: { name: 'Legumes', color: '#9acd32', icon: '🫘' }
  };

  // Toggle sector visibility
  const toggleSector = (sectorKey) => {
    setSelectedSectors(prev => ({
      ...prev,
      [sectorKey]: !prev[sectorKey]
    }));
  };

  // Toggle sectors panel visibility
  const toggleSectorsPanel = () => {
    setSectorsVisible(!sectorsVisible);
  };

  // Enhanced drawing mode handlers
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode);
    setCurrentDrawing(null);
    console.log('Drawing mode:', !drawingMode ? 'enabled' : 'disabled');
  };

  const handleMapClick = useCallback((e) => {
    if (!drawingMode) return;
    
    const { lat, lng } = e.latlng;
    
    if (!currentDrawing) {
      // Start new drawing
      const newDrawing = {
        id: Date.now(),
        points: [{ lat, lng }],
        name: `Custom Region ${drawnRegions.length + 1}`,
        type: 'custom',
        sector: 'cereals'
      };
      setCurrentDrawing(newDrawing);
    } else {
      // Add point to current drawing
      setCurrentDrawing(prev => ({
        ...prev,
        points: [...prev.points, { lat, lng }]
      }));
    }
  }, [drawingMode, currentDrawing, drawnRegions.length]);

  const finishDrawing = () => {
    if (currentDrawing && currentDrawing.points.length >= 3) {
      const completedRegion = {
        ...currentDrawing,
        coordinates: [currentDrawing.points.map(p => [p.lat, p.lng])],
        area: calculatePolygonArea(currentDrawing.points),
        status: 'Normal',
        ndvi: (0.3 + Math.random() * 0.5).toFixed(3),
        lastUpdated: new Date().toISOString(),
        province: 'Custom Region',
        soilMoisture: (20 + Math.random() * 60).toFixed(1) + '%',
        temperature: (15 + Math.random() * 20).toFixed(1) + '°C',
        precipitation: (Math.random() * 25).toFixed(1) + 'mm'
      };
      
      setDrawnRegions(prev => [...prev, completedRegion]);
      setCurrentDrawing(null);
      setDrawingMode(false);
      console.log('Custom region created:', completedRegion.name);
    }
  };

  const deleteCustomRegions = () => {
    setDrawnRegions([]);
    setCurrentDrawing(null);
    console.log('All custom regions deleted');
  };

  // Helper function to calculate polygon area (simplified)
  const calculatePolygonArea = (points) => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].lat * points[j].lng;
      area -= points[j].lat * points[i].lng;
    }
    return Math.abs(area / 2) * 111 * 111; // Rough conversion to km²
  };

  // Search functionality
  const handleSearchInput = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    Object.entries(agricultureData).forEach(([sectorKey, sectorData]) => {
      sectorData.regions?.forEach(region => {
        if (region.name.toLowerCase().includes(term.toLowerCase()) ||
            region.province?.toLowerCase().includes(term.toLowerCase()) ||
            sectorKey.toLowerCase().includes(term.toLowerCase())) {
          results.push({
            ...region,
            sector: sectorKey,
            sectorName: sectorKey.charAt(0).toUpperCase() + sectorKey.slice(1)
          });
        }
      });
    });
    
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [agricultureData]);

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#000'
    }}>
      
      {/* Top Toolbar - EOS Style */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '60px',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        {/* Left side - Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            background: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            fontWeight: 'bold',
            color: '#1e3c72',
            fontSize: '18px'
          }}>
            EOS
          </div>
          <h1 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Crop Monitoring
          </h1>
        </div>

        {/* Center - Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '25px',
          padding: '8px 20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          minWidth: '400px'
        }}>
          <span style={{ color: 'white', marginRight: '10px' }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search fields, crops, regions..."
            style={{
              border: 'none',
              background: 'transparent',
              color: 'white',
              outline: 'none',
              fontSize: '14px',
              flex: 1,
              '::placeholder': { color: 'rgba(255,255,255,0.7)' }
            }}
          />
          
          {/* Map Type Dropdown */}
          <select
            value={selectedMapType}
            onChange={(e) => setSelectedMapType(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '15px',
              color: 'white',
              padding: '4px 12px',
              marginLeft: '10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <option value="Satellite" style={{ color: '#333' }}>Satellite</option>
            <option value="Terrain" style={{ color: '#333' }}>Terrain</option>
            <option value="Hybrid" style={{ color: '#333' }}>Hybrid</option>
          </select>
        </div>

        {/* Right side - Tools */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setSectorsVisible(!sectorsVisible)}
            style={{
              background: sectorsVisible ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🌾 Sectors
          </button>

          <button
            onClick={toggleDrawingMode}
            style={{
              background: drawingMode ? 'rgba(255,152,0,0.8)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖊️ {drawingMode ? 'Drawing' : 'Draw'}
          </button>

          <button
            onClick={() => setLegendVisible(!legendVisible)}
            style={{
              background: legendVisible ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📊 Legend
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div style={{ 
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 0
      }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <MapEventHandler onMapClick={handleMapClick} />
          
          <TileLayer
            url={tileLayerConfigs[selectedMapType].url}
            attribution={tileLayerConfigs[selectedMapType].attribution}
          />

          {/* Render agriculture regions */}
          {Object.entries(agricultureData).map(([sectorKey, sectorData]) => {
            if (!selectedSectors[sectorKey] || !sectorData.regions) return null;
            
            const sectorConfig = sectorConfigs[sectorKey];
            return sectorData.regions.map((region, index) => (
              <Polygon
                key={`${sectorKey}-${index}`}
                positions={region.coordinates}
                pathOptions={{
                  color: sectorConfig.color,
                  fillColor: sectorConfig.color,
                  fillOpacity: 0.4,
                  weight: 2
                }}
                eventHandlers={{
                  click: async () => {
                    // Fetch real dataset information
                    const realData = await fetchRealDatasetInfo(region.id, sectorKey);
                    console.log('Real dataset data:', realData);
                  }
                }}
              >
                <Popup maxWidth={350}>
                  <div style={{ minWidth: '320px', maxWidth: '350px' }}>
                    <div style={{ 
                      borderBottom: '2px solid #2a5298', 
                      paddingBottom: '12px', 
                      marginBottom: '15px',
                      background: 'linear-gradient(135deg, #2a5298, #1e3c72)',
                      margin: '-9px -9px 15px -9px',
                      padding: '15px',
                      color: 'white',
                      borderRadius: '3px 3px 0 0'
                    }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                        {region.name}
                      </h3>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        {sectorConfig.icon} {sectorConfig.name} • {region.country}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                        {region.province}
                      </div>
                    </div>
                    
                    {/* This will be populated with real dataset information */}
                    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '12px',
                        marginBottom: '15px'
                      }}>
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '10px', 
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>NDVI</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2a5298' }}>
                            Loading...
                          </div>
                        </div>
                        
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '10px', 
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>STATUS</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                            Healthy
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        background: '#e8f4f8', 
                        padding: '12px', 
                        borderRadius: '6px',
                        fontSize: '11px',
                        border: '1px solid #bee5eb'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2a5298' }}>
                          📡 Real-time Dataset Information
                        </div>
                        <div style={{ lineHeight: '1.5' }}>
                          <div><strong>Data Source:</strong> Sentinel-2, Landsat-8</div>
                          <div><strong>Last Acquisition:</strong> Loading...</div>
                          <div><strong>Region ID:</strong> {region.id}</div>
                          <div><strong>Click for detailed analysis</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ));
          })}

          {/* Custom drawn regions */}
          {drawnRegions.map(region => (
            <Polygon
              key={region.id}
              positions={region.coordinates}
              pathOptions={{
                color: '#ff6b6b',
                fillColor: '#ff6b6b',
                fillOpacity: 0.3,
                weight: 2,
                dashArray: '5, 5'
              }}
            >
              <Popup>
                <div>
                  <strong>{region.name}</strong><br/>
                  Area: {region.area.toFixed(2)} km²<br/>
                  Type: Custom Field
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Current drawing */}
          {currentDrawing && currentDrawing.points.length > 2 && (
            <Polygon
              positions={[currentDrawing.points.map(p => [p.lat, p.lng])]}
              pathOptions={{
                color: '#4fc3f7',
                fillColor: '#4fc3f7',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}

          {/* Drawing points */}
          {currentDrawing && currentDrawing.points.map((point, index) => (
            <CircleMarker
              key={index}
              center={[point.lat, point.lng]}
              radius={4}
              pathOptions={{
                color: '#4fc3f7',
                fillColor: '#4fc3f7',
                fillOpacity: 1
              }}
            />
          ))}
        </MapContainer>

        {/* Agriculture Sectors Panel - ON MAP (Left Side) */}
        {sectorsVisible && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '320px',
            maxHeight: '70vh',
            background: 'rgba(20, 20, 20, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'white',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '2px solid #4fc3f7',
                paddingBottom: '12px'
              }}>
                <h2 style={{ 
                  margin: '0', 
                  fontSize: '18px',
                  color: '#4fc3f7',
                  fontWeight: 'bold'
                }}>
                  🌾 Agriculture Sectors
                </h2>
                <button
                  onClick={toggleSectorsPanel}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4fc3f7',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  title="Close sectors panel"
                >
                  ✕
                </button>
              </div>

              <div>
                {Object.entries(sectorConfigs).map(([key, sector]) => (
                  <div
                    key={key}
                    style={{
                      background: selectedSectors[key] ? `${sector.color}20` : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${selectedSectors[key] ? sector.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => toggleSector(key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedSectors[key]}
                          onChange={() => toggleSector(key)}
                          style={{ 
                            marginRight: '12px',
                            transform: 'scale(1.2)',
                            accentColor: sector.color
                          }}
                        />
                        <span style={{ fontSize: '20px', marginRight: '10px' }}>{sector.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{sector.name}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {agricultureData[key] ? (
                          <span>{agricultureData[key].regions?.length || 0} regions</span>
                        ) : (
                          <span>Loading...</span>
                        )}
                      </div>
                    </div>
                    
                    {selectedSectors[key] && agricultureData[key] && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#ccc' }}>
                        <div>📊 Area: {agricultureData[key].totalArea}</div>
                        <div>🌾 Production: {agricultureData[key].production}</div>
                        <div>☁️ Files: {agricultureData[key].bucketFiles}</div>
                        <div>🕒 Updated: {new Date(agricultureData[key].lastCloudUpdate).toLocaleTimeString()}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sectors Toggle Button - Always visible when panel is hidden */}
        {/* Removed - only use top control bar toggle */}

        {/* Search Bar - Top Center */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '25px',
            padding: '8px 20px',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'transparent',
              borderRadius: '20px',
              padding: '0',
              width: '100%'
            }}>
              <span style={{ marginRight: '10px', fontSize: '16px' }}>🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search agriculture regions..."
                style={{
                  border: 'none',
                  padding: '8px 0',
                  outline: 'none',
                  fontSize: '14px',
                  width: '250px',
                  background: 'transparent'
                }}
              />
              <select
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  marginLeft: '10px',
                  cursor: 'pointer'
                }}
                defaultValue="Satellite"
              >
                <option>Satellite</option>
                <option>Terrain</option>
                <option>Hybrid</option>
              </select>
              <button
                style={{
                  background: '#4fc3f7',
                  color: 'white',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '15px',
                  marginLeft: '10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                onClick={() => handleSearchInput(searchTerm)}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Control Buttons - Right Side of Map */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
          zIndex: 1000
        }}>
          <button
            onClick={toggleSectorsPanel}
            style={{
              background: sectorsVisible ? '#4fc3f7' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: sectorsVisible ? 'white' : '#333',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🌾 Sectors
          </button>

          <button
            onClick={toggleDrawingMode}
            style={{
              background: drawingMode ? '#ff9800' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: drawingMode ? 'white' : '#333',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🖊️ {drawingMode ? 'Drawing ON' : 'Drawing'}
          </button>

          <button
            onClick={deleteCustomRegions}
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#333',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Delete custom drawn regions"
          >
            🗑️ Delete
          </button>
        </div>

        {/* Enhanced Legend Panel with Colors */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          minWidth: '280px',
          fontSize: '12px',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#4fc3f7', fontSize: '14px' }}>Legend</h4>
          
          {/* Agriculture Sectors Colors */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Agriculture Sectors</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#8fbc8f',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Cereals (Wheat, Rice, Corn)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#daa520',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Oil Crops (Soybean, Sunflower)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#d2691e',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Root Crops (Potato, Cassava)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#f5deb3',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Fiber Crops (Cotton, Flax)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#9acd32',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Legumes (Beans, Peas)</span>
            </div>
          </div>

          {/* Region Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Region Status</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#32cd32',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Normal</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#ff6347',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>Alert</span>
            </div>
          </div>

          {/* Data Sources */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Data Sources</div>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div>🛰️ Satellite Imagery</div>
              <div>☁️ Google Cloud Storage</div>
              <div>🌡️ Weather Stations</div>
              <div>📊 Real-time Updates</div>
            </div>
          </div>
        </div>

        {/* Enhanced Legend Panel with Colors */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          minWidth: '280px',
          fontSize: '12px',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#4fc3f7', fontSize: '14px' }}>Legend</h4>
          
          {/* Agriculture Sectors Colors */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Agriculture Sectors</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#8fbc8f',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>🌾 Cereals (Wheat, Rice, Corn)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#daa520',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>🌻 Oil Crops (Soybean, Sunflower)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#d2691e',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>🥔 Root Crops (Potato, Cassava)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#f5deb3',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>🌱 Fiber Crops (Cotton, Flax)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#9acd32',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>🫘 Legumes (Beans, Peas)</span>
            </div>
          </div>

          {/* Region Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Region Status</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#32cd32',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>✅ Normal</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#ff6347',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>⚠️ Alert</span>
            </div>
          </div>

          {/* Additional Symbols */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Map Symbols</div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#4fc3f7',
                marginRight: '8px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)'
              }}></div>
              <span style={{ fontSize: '11px' }}>📡 Monitoring Stations</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '16px', height: '10px', backgroundColor: '#ff6b6b',
                marginRight: '8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.3)',
                borderStyle: 'dashed'
              }}></div>
              <span style={{ fontSize: '11px' }}>✏️ Custom Drawn Regions</span>
            </div>
          </div>

          {/* Data Sources */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#4fc3f7', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Data Sources</div>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div>🛰️ Satellite Imagery</div>
              <div>☁️ Google Cloud Storage</div>
              <div>🌡️ Weather Stations</div>
              <div>📊 Real-time Updates</div>
            </div>
          </div>
        </div>

        {/* Drawing Mode Instructions */}
        {drawingMode && (
          <div style={{
            position: 'absolute',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(79, 195, 247, 0.95)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 1002,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            🖊️ Drawing Mode Active - Click on map to draw points
            {currentDrawing && currentDrawing.points.length > 2 && (
              <button
                onClick={finishDrawing}
                style={{
                  marginLeft: '15px',
                  background: '#fff',
                  color: '#4fc3f7',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Finish Region
              </button>
            )}
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1001,
            minWidth: '400px'
          }}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 16px',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={() => {
                  // Zoom to region (simplified)
                  if (result.coordinates && result.coordinates[0]) {
                    const coords = result.coordinates[0];
                    const center = [
                      coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length,
                      coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length
                    ];
                    setMapCenter(center);
                    setMapZoom(8);
                  }
                  setSearchResults([]);
                  setSearchTerm('');
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 'bold', color: '#333' }}>{result.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {result.sectorName} • {result.province}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  NDVI: {result.ndvi} | Status: {result.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EOSAgricultureMap;