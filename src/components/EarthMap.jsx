import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getDomainSampleData, getDomainMetadata } from '../services/domainService';
import './EarthMap.css';
import { FileText, Layers, Info, Calendar, Download, Filter } from 'lucide-react';

// Replace with your Mapbox token - you'll need to sign up for a free account
// You can get a token at https://account.mapbox.com/
// Using a public token for demonstration - replace with your own
const TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
try {
  // Ensure mapboxgl is loaded before setting the token
  if (typeof mapboxgl !== 'undefined') {
    mapboxgl.accessToken = TOKEN;
    console.log('Mapbox token set successfully:', TOKEN.substring(0, 10) + '...');
    
    // Test if the token works by making a simple request
    fetch(`https://api.mapbox.com/v1?access_token=${TOKEN}`)
      .then(response => {
        if (!response.ok) {
          console.warn('Mapbox token validation failed, using fallback approach');
          // Don't fail completely, just log the issue
        }
      })
      .catch(e => {
        console.warn('Could not validate Mapbox token:', e);
      });
  } else {
    console.error('Mapbox GL is not defined!');
  }
} catch (e) {
  console.error('Error setting Mapbox token:', e);
}

const EarthMap = ({ domain, enhanced = false, showControls = true, debug = true }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(30);
  const [lat, setLat] = useState(15);
  const [zoom, setZoom] = useState(2);
  const [datasetInfo, setDatasetInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [dataLayers, setDataLayers] = useState([]);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');
  const [mapDebugInfo, setMapDebugInfo] = useState({ status: 'initializing' });
  
  // NASA-like interface additions
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [categories, setCategories] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({});
  const [layerOpacity, setLayerOpacity] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayers, setActiveLayers] = useState([]);
  const [useFallback, setUseFallback] = useState(false);

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
        
        // Set dataset info for display
        setDatasetInfo(data);
        
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
        setActiveLayers(geoJsonData.map((_, index) => `data-layer-${index}`));
        
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
  }, [domain]);

  // Initialize map
  useEffect(() => {
    // Don't initialize if we're using fallback or if map already exists
    if (map.current || useFallback) return;
    
    // Log that we're initializing the map
    console.log('Initializing Mapbox map with token:', mapboxgl.accessToken ? mapboxgl.accessToken.substring(0, 10) + '...' : 'No token');
    
    // Ensure container exists before initializing
    if (!mapContainer.current) {
      console.error("Map container not found!");
      setError("Map container not found. Please refresh the page.");
      return;
    }
    
    // Check if MapboxGL is supported in this browser
    if (!mapboxgl.supported()) {
      console.error("MapboxGL is not supported in this browser");
      setError("MapboxGL is not supported in your browser. Please try a different browser.");
      setUseFallback(true);
      return;
    }
    
    try {
      // Force a simple style first to ensure initialization works
      // Use a basic style that's more likely to work
      const mapStyle = 'mapbox://styles/mapbox/streets-v12';
      
      console.log("Creating map with container", mapContainer.current);
      
      // Reset container dimensions explicitly to ensure proper rendering
      if (mapContainer.current) {
        mapContainer.current.style.width = '100%';
        mapContainer.current.style.height = '100%';
        mapContainer.current.style.background = '#020c1b';
      }
      
      // Create the map with minimal options first and with error handling
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center: [lng, lat],
          zoom: zoom,
          renderWorldCopies: false,
          attributionControl: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0, // Disable fading for better performance
          interactive: true, // Make sure the map is interactive
          failIfMajorPerformanceCaveat: false, // Don't fail on performance issues
          localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif",
          transformRequest: (url, resourceType) => {
            // Add error handling for resource requests
            console.log(`Loading resource: ${url}`);
            return { url };
          }
        });
        
        console.log("Map instance created successfully");
        
        // Set explicit event handlers to debug loading issues
        map.current.on('load', () => {
          console.log("Map fully loaded!");
          setMapLoaded(true);
          setError(null); // Clear any errors
          // Force a resize to ensure proper rendering
          setTimeout(() => {
            if (map.current) {
              map.current.resize();
            }
          }, 100);
        });
        
        map.current.on('style.load', () => {
          console.log("Map style loaded successfully");
          setMapLoaded(true);
          setError(null);
        });
        
        map.current.on('error', (e) => {
          console.error("Map error:", e);
          const errorMsg = e.error?.message || "Unknown map error";
          setError("Map error: " + errorMsg);
          
          // If it's an authentication error, try to use a fallback
          if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('token')) {
            console.log("Authentication error detected, trying fallback approach");
            setTimeout(() => {
              setUseFallback(true);
            }, 1000);
          }
        });
        
        map.current.on('render', () => {
          console.log("Map rendered");
        });
        
        map.current.on('idle', () => {
          console.log("Map is idle and ready");
          setMapLoaded(true);
        });
      } catch (e) {
        console.error("Critical error creating map instance:", e);
        setError("Failed to create map: " + e.message);
        map.current = null; // Reset the map reference
        // Try fallback after a short delay
        setTimeout(() => {
          setUseFallback(true);
        }, 1000);
      }
      
      // Check if the map loads within a timeout period
      setTimeout(() => {
        if (!mapLoaded) {
          console.warn("Map may not have loaded properly after timeout");
        }
      }, 5000);
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to initialize map: " + error.message);
    }

    // Add navigation controls (zoom, rotation) - only if showControls is true
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      
      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      
      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );
    }

    // Save coordinates and zoom level as the user interacts with the map
    map.current.on('move', () => {
      setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
      setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
      setZoom(parseFloat(map.current.getZoom().toFixed(2)));
    });
    
    // Add atmosphere and other 3D effects
    map.current.on('style.load', () => {
      try {
        console.log('Map style loaded, setting atmosphere effects');
        
        // Only set fog if using globe projection
        if (map.current.getProjection() === 'globe') {
          map.current.setFog({
            'color': 'rgb(220, 236, 249)', // lighter atmosphere
            'high-color': 'rgb(115, 167, 242)', // lighter upper atmosphere
            'horizon-blend': 0.1,
            'space-color': 'rgb(25, 25, 40)', // slightly lighter space
            'star-intensity': 0.2 // reduced stars for better visibility
          });
        }
        
        // Set map as loaded
        console.log('Map initialized successfully');
        setMapLoaded(true);
      } catch (error) {
        console.error('Error setting map atmosphere:', error);
      }
    });
    
    // Add terrain if enhanced
    if (enhanced) {
      map.current.on('load', () => {
        try {
          console.log('Adding 3D terrain to map');
          
          // Check if the map is still valid
          if (!map.current || !map.current.getStyle()) {
            console.warn('Map not available when trying to add terrain');
            return;
          }
          
          // Add terrain source
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          
          // Add 3D terrain with moderate exaggeration
          map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.2 });
          
          console.log('3D terrain added successfully');
          
          // Switch to globe projection after a delay if terrain loads successfully
          setTimeout(() => {
            try {
              if (map.current && map.current.getStyle()) {
                console.log('Switching to globe projection');
                map.current.setProjection('globe');
              }
            } catch (err) {
              console.error('Error switching to globe projection:', err);
            }
          }, 3000);
          
        } catch (error) {
          console.error('Error adding 3D terrain:', error);
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      try {
        // Only call remove() if the map is in a valid state
        if (map.current && map.current.getStyle && typeof map.current.getStyle === 'function') {
          map.current.remove();
        }
      } catch (e) {
        console.warn("Error during map cleanup:", e);
      }
    };
  }, [lng, lat, zoom, mapStyle, enhanced, showControls, mapLoaded, useFallback]);

  // Add data layers when data is loaded and map is initialized
  useEffect(() => {
    if (!map.current || loading || dataLayers.length === 0) return;
    
    // Wait for map to be loaded
    if (!map.current.isStyleLoaded()) {
      map.current.once('style.load', addDataToMap);
    } else {
      addDataToMap();
    }
    
    function addDataToMap() {
      // Ensure map still exists and is valid before adding data
      if (!map.current || !map.current.getStyle()) {
        console.warn("Map not available when trying to add data");
        return;
      }
      
      // Add data layers to the map
      dataLayers.forEach((layer, index) => {
        const id = `data-layer-${index}`;
        
        // Check if the source already exists
        try {
          if (map.current && !map.current.getSource(id)) {
            map.current.addSource(id, {
              'type': 'geojson',
              'data': layer.data
            });
            
            // Add appropriate layer based on geometry type
            if (layer.type === 'point') {
              map.current.addLayer({
                'id': id,
                'type': 'circle',
                'source': id,
                'paint': {
                  'circle-radius': 6,
                  'circle-color': layer.color || '#4fc3f7',
                  'circle-opacity': 0.7,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#fff'
                },
                'metadata': {
                  'title': layer.title || `Layer ${index + 1}`,
                  'category': layer.category || 'Uncategorized',
                  'layerType': 'point'
                }
              });
            } else if (layer.type === 'line') {
              map.current.addLayer({
                'id': id,
                'type': 'line',
                'source': id,
                'layout': {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                'paint': {
                  'line-color': layer.color || '#ff4081',
                  'line-width': 2,
                  'line-opacity': 0.8
                },
                'metadata': {
                  'title': layer.title || `Layer ${index + 1}`,
                  'category': layer.category || 'Uncategorized',
                  'layerType': 'line'
                }
              });
            } else if (layer.type === 'polygon') {
              map.current.addLayer({
                'id': id,
                'type': 'fill',
                'source': id,
                'paint': {
                  'fill-color': layer.color || '#4fc3f7',
                  'fill-opacity': 0.4,
                  'fill-outline-color': '#ffffff'
                },
                'metadata': {
                  'title': layer.title || `Layer ${index + 1}`,
                  'category': layer.category || 'Uncategorized',
                  'layerType': 'polygon'
                }
              });
              
              // Add an outline layer for the polygon
              map.current.addLayer({
                'id': `${id}-outline`,
                'type': 'line',
                'source': id,
                'paint': {
                  'line-color': layer.color || '#4fc3f7',
                  'line-width': 2,
                  'line-opacity': 0.8
                },
                'metadata': {
                  'title': `${layer.title || `Layer ${index + 1}`} Outline`,
                  'category': layer.category || 'Uncategorized',
                  'layerType': 'polygon-outline',
                  'parentLayer': id
                }
              });
            } else if (layer.type === 'heatmap') {
              // Add heatmap layer for intensity data
              map.current.addLayer({
                'id': id,
                'type': 'heatmap',
                'source': id,
                'paint': {
                  'heatmap-weight': [
                    'interpolate', ['linear'], ['get', 'ndvi'],
                    0, 0,
                    0.5, 0.5,
                    1, 1
                  ],
                  'heatmap-intensity': 1,
                  'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0, 0, 0, 0)',
                    0.2, '#b30000', // Red - low vegetation
                    0.4, '#e6ac00', // Yellow - moderate vegetation
                    0.6, '#66cc00', // Light green
                    0.8, '#009900', // Medium green
                    1, '#006600'    // Dark green - high vegetation
                  ],
                  'heatmap-radius': 15,
                  'heatmap-opacity': 0.7
                },
                'metadata': {
                  'title': layer.title || `Heatmap ${index + 1}`,
                  'category': layer.category || 'Uncategorized',
                  'layerType': 'heatmap'
                }
              });
            }
            
            // Add click event for this layer (except heatmap which is just visual)
            if (layer.type !== 'heatmap') {
              map.current.on('click', id, (e) => {
                const features = map.current.queryRenderedFeatures(e.point, {
                  layers: [id]
                });
                
                if (features.length > 0) {
                  setSelectedDataset({
                    ...features[0].properties,
                    layerTitle: layer.title || `Layer ${index + 1}`,
                    layerCategory: layer.category || 'Uncategorized',
                    coordinates: e.lngLat
                  });
                  
                  // Extract properties for display
                  const props = features[0].properties;
                  
                  // Create popup with enhanced information
                  let popupContent = `
                    <div class="mapbox-popup-content">
                      <h4>${props.name || layer.title || 'Dataset'}</h4>
                      <p>${props.description || 'No description available'}</p>
                  `;
                  
                  // Add additional properties if they exist
                  if (props.category) {
                    popupContent += `<p><strong>Category:</strong> ${props.category}</p>`;
                  }
                  
                  if (props.fileCount) {
                    popupContent += `<p><strong>Files:</strong> ${props.fileCount}</p>`;
                  }
                  
                  if (props.updated) {
                    popupContent += `<p><strong>Updated:</strong> ${new Date(props.updated).toLocaleDateString()}</p>`;
                  }
                  
                  if (props.ndvi !== undefined) {
                    popupContent += `<p><strong>NDVI Value:</strong> ${parseFloat(props.ndvi).toFixed(2)}</p>`;
                    
                    // Add vegetation health interpretation
                    const ndvi = parseFloat(props.ndvi);
                    let healthStatus = '';
                    if (ndvi < 0.2) healthStatus = 'Poor (barren or urban)';
                    else if (ndvi < 0.4) healthStatus = 'Low (sparse vegetation)';
                    else if (ndvi < 0.6) healthStatus = 'Moderate (grassland/shrubs)';
                    else if (ndvi < 0.8) healthStatus = 'Good (dense vegetation)';
                    else healthStatus = 'Excellent (rainforest/crops)';
                    
                    popupContent += `<p><strong>Vegetation Health:</strong> ${healthStatus}</p>`;
                  }
                  
                  popupContent += `</div>`;
                  
                  // Create popup
                  new mapboxgl.Popup({ maxWidth: '300px' })
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map.current);
                }
              });
              
              // Change cursor when hovering over data point
              map.current.on('mouseenter', id, () => {
                if (map.current && map.current.getCanvas()) {
                  map.current.getCanvas().style.cursor = 'pointer';
                }
              });
              
              map.current.on('mouseleave', id, () => {
                if (map.current && map.current.getCanvas()) {
                  map.current.getCanvas().style.cursor = '';
                }
              });
            }
          }
        } catch (e) {
          console.error(`Error adding layer ${id}:`, e);
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (!map.current || !map.current.getStyle()) return;
      
      dataLayers.forEach((_, index) => {
        const id = `data-layer-${index}`;
        try {
          // Check if map and style still exist
          if (map.current && map.current.getStyle()) {
            // Remove layer and its outline if it exists
            const outlineId = `${id}-outline`;
            if (map.current.getLayer(outlineId)) {
              map.current.removeLayer(outlineId);
            }
            if (map.current.getLayer(id)) {
              map.current.removeLayer(id);
            }
            if (map.current.getSource(id)) {
              map.current.removeSource(id);
            }
          }
        } catch (e) {
          // Silently handle errors during cleanup
          console.log(`Cleanup error for layer ${id}:`, e);
        }
      });
    };
  }, [dataLayers, loading]);
  
  // Process data into GeoJSON format for the map
  const processDataForMap = (data) => {
    console.log("Processing data for visualization:", data);
    
    // Create a collection of visualization layers
    const layers = [];
    
    // Try to extract real geospatial data from the files
    const geoJsonFiles = data.filter(file => 
      file.name.toLowerCase().endsWith('.geojson') || 
      file.name.toLowerCase().includes('geo')
    );
    
    // Helper function to generate random but realistic coordinates for a region
    const generateRegionCoordinates = (baseLat, baseLng, size = 1) => {
      const coords = [];
      const cornerDist = size * 0.5;
      
      // Create a rough square
      coords.push([baseLng - cornerDist, baseLat - cornerDist]);
      coords.push([baseLng + cornerDist, baseLat - cornerDist]);
      coords.push([baseLng + cornerDist, baseLat + cornerDist]);
      coords.push([baseLng - cornerDist, baseLat + cornerDist]);
      coords.push([baseLng - cornerDist, baseLat - cornerDist]); // Close the polygon
      
      return [coords];
    };
    
    // Extract categories from filenames to create region groups
    const categories = {};
    data.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length > 1) {
        const category = parts[0];
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(file);
      }
    });
    
    // Create visualization layers based on domain
    if (domain === 'agriculture') {
      // Agriculture-specific visualizations
      
      // 1. Try to use actual GeoJSON files if available
      if (geoJsonFiles.length > 0) {
        geoJsonFiles.forEach((file, index) => {
          // Try to extract JSON structure from the preview
          try {
            if (file.preview && !file.preview.includes('Large file') && file.preview.includes('{')) {
              // Find the beginning and end of the JSON structure
              const jsonStart = file.preview.indexOf('{');
              let jsonContent = file.preview.substring(jsonStart);
              
              // If the preview was truncated, try to complete basic structure
              if (jsonContent.includes('...')) {
                jsonContent = jsonContent.replace('...', '}}]}');
              }
              
              // Parse the content
              const geoData = JSON.parse(jsonContent);
              
              // If it has valid GeoJSON structure, add it
              if (geoData.type === 'FeatureCollection' || geoData.features) {
                const layerType = determineGeoJsonType(geoData);
                layers.push({
                  type: layerType,
                  color: getColorForCategory(file.name),
                  title: getFileDisplayName(file.name),
                  data: geoData
                });
              }
            }
          } catch (e) {
            console.log(`Couldn't parse GeoJSON from preview of ${file.name}:`, e);
            // Continue to next file
          }
        });
      }
      
      // 2. Create visualizations based on categories
      Object.keys(categories).forEach((category, catIndex) => {
        // Create a category visualization with polygon areas
        const categoryFiles = categories[category];
        const categoryColor = getCategoryColor(category, catIndex);
        
        // Generate polygon regions for category
        const regionFeatures = [];
        
        // For each category, create regions in different parts of the world
        // Use different base coordinates for each category
        const baseLats = [10 + (catIndex * 5), 30 - (catIndex * 3), -15 + (catIndex * 4)];
        const baseLngs = [20 + (catIndex * 10), -60 + (catIndex * 8), 100 - (catIndex * 5)];
        
        baseLats.forEach((baseLat, i) => {
          const baseLng = baseLngs[i];
          
          // Create 2-3 regions per base coordinate
          const regionCount = 2 + Math.floor(Math.random() * 2);
          for (let r = 0; r < regionCount; r++) {
            const lat = baseLat + (Math.random() * 8) - 4;
            const lng = baseLng + (Math.random() * 8) - 4;
            const size = 1 + Math.random() * 2; // Region size
            
            regionFeatures.push({
              type: 'Feature',
              geometry: { 
                type: 'Polygon', 
                coordinates: generateRegionCoordinates(lat, lng, size)
              },
              properties: { 
                name: `${category} Region ${r+1}`, 
                description: `${category} agricultural production area with ${categoryFiles.length} datasets`,
                fileCount: categoryFiles.length,
                category: category,
                dataType: 'Agriculture',
                id: `ag-${category.toLowerCase()}-region-${r+1}`
              }
            });
          }
        });
        
        // Add polygon layer for the category regions
        layers.push({
          type: 'polygon',
          color: categoryColor,
          title: `${category} Regions`,
          category: category,
          data: {
            type: 'FeatureCollection',
            features: regionFeatures
          }
        });
        
        // Create point features for data points in this category
        const pointFeatures = categoryFiles.map((file, fileIndex) => {
          // Generate points near the regions
          const regionIndex = fileIndex % regionFeatures.length;
          const region = regionFeatures[regionIndex];
          const regionCenter = getCenterOfPolygon(region.geometry.coordinates[0]);
          
          // Add some randomness to point location
          const lat = regionCenter[1] + (Math.random() * 0.5) - 0.25;
          const lng = regionCenter[0] + (Math.random() * 0.5) - 0.25;
          
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { 
              name: getFileDisplayName(file.name), 
              description: `Data from ${file.name}. Updated: ${new Date(file.updated).toLocaleDateString()}`,
              size: file.size,
              contentType: file.contentType,
              url: file.url,
              updated: file.updated,
              category: category,
              dataType: 'Agriculture',
              id: `ag-point-${fileIndex}`
            }
          };
        });
        
        // Add point layer for data points
        if (pointFeatures.length > 0) {
          layers.push({
            type: 'point',
            color: brightenColor(categoryColor, 0.2),
            title: `${category} Data Points`,
            category: category,
            data: {
              type: 'FeatureCollection',
              features: pointFeatures
            }
          });
        }
      });
      
      // 3. Add NDVI heatmap layer for crop health if we have enough files
      if (data.length >= 5) {
        // Create a sample NDVI heatmap
        const ndviFeatures = [];
        const gridSize = 20; // 20x20 grid
        const baseLat = 0;
        const baseLng = 0;
        
        // Generate grid of points with varying NDVI values
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            // Generate a geographic grid across the world
            const lat = baseLat + (180 * (i / gridSize)) - 90;
            const lng = baseLng + (360 * (j / gridSize)) - 180;
            
            // Skip ocean areas (very simplified)
            if (isLikelyOcean(lat, lng)) {
              continue;
            }
            
            // Generate NDVI value (0-1 with some patterns)
            // Create bands of similar values to simulate climate zones
            const base = 0.3 + (0.5 * Math.sin(lat * Math.PI / 45));
            const ndvi = Math.max(0, Math.min(1, base + (Math.random() * 0.3) - 0.15));
            
            ndviFeatures.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [lng, lat] },
              properties: { 
                ndvi: ndvi,
                description: `NDVI Value: ${ndvi.toFixed(2)}`,
                dataType: 'Agriculture',
                id: `ndvi-${i}-${j}`
              }
            });
          }
        }
        
        // Add NDVI layer
        layers.push({
          type: 'heatmap',
          title: 'Global NDVI (Vegetation Health)',
          category: 'Crop Health',
          data: {
            type: 'FeatureCollection',
            features: ndviFeatures
          }
        });
      }
      
    } else if (domain === 'weather') {
      // Weather data visualization
      layers.push({
        type: 'point',
        color: '#29b6f6', // Blue for weather
        title: 'Weather Stations',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [25.12, 10.75] },
              properties: { 
                name: 'Weather Station Alpha', 
                description: 'Temperature: 28°C, Humidity: 65%',
                dataType: 'Weather',
                id: 'weather-1'
              }
            }
          ]
        }
      });
    } else if (domain === 'disaster') {
      // Disaster monitoring data
      layers.push({
        type: 'point',
        color: '#f44336', // Red for disaster
        title: 'Disaster Events',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [45.12, 25.75] },
              properties: { 
                name: 'Wildfire Detection', 
                description: 'Active wildfire detected on August 18, 2025',
                dataType: 'Disaster',
                id: 'disaster-1'
              }
            }
          ]
        }
      });
    }
    
    return layers;
  };
  
  // Helper function to determine GeoJSON geometry type
  const determineGeoJsonType = (geoJson) => {
    if (!geoJson || !geoJson.features || !geoJson.features[0] || !geoJson.features[0].geometry) {
      return 'point'; // Default to point
    }
    
    const firstFeatureType = geoJson.features[0].geometry.type.toLowerCase();
    
    if (firstFeatureType.includes('point')) {
      return 'point';
    } else if (firstFeatureType.includes('line')) {
      return 'line';
    } else if (firstFeatureType.includes('polygon')) {
      return 'polygon';
    } else {
      return 'point'; // Default
    }
  };
  
  // Helper function to get a display name from a filename
  const getFileDisplayName = (filename) => {
    // Remove path and extension
    let name = filename.split('/').pop().split('.')[0];
    
    // Replace underscores with spaces and capitalize words
    name = name.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
      
    return name;
  };
  
  // Helper function to get consistent color for a category
  const getCategoryColor = (category, index) => {
    const colors = [
      '#76ff03', // Bright green
      '#64dd17', // Light green
      '#aeea00', // Lime
      '#00c853', // Green
      '#00bfa5', // Teal
      '#00b8d4', // Cyan
      '#4caf50', // Medium green
      '#8bc34a', // Light green
      '#009688'  // Teal green
    ];
    
    // Hash the category name to get a consistent color
    const hash = category.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[(hash + index) % colors.length];
  };
  
  // Helper to get color based on file name/content
  const getColorForCategory = (filename) => {
    const categories = {
      'crop': '#76ff03',
      'forest': '#33691e',
      'land': '#827717',
      'soil': '#795548',
      'water': '#0288d1',
      'irrigation': '#80deea'
    };
    
    // Check if filename includes any of our categories
    for (const [key, color] of Object.entries(categories)) {
      if (filename.toLowerCase().includes(key)) {
        return color;
      }
    }
    
    // Default color
    return '#4caf50';
  };
  
  // Helper function to brighten a color
  const brightenColor = (hex, factor) => {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Brighten
    r = Math.min(255, Math.round(r + (255 - r) * factor));
    g = Math.min(255, Math.round(g + (255 - g) * factor));
    b = Math.min(255, Math.round(b + (255 - b) * factor));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Helper function to calculate center of polygon
  const getCenterOfPolygon = (coordinates) => {
    // Calculate the center point of a polygon's coordinates
    let sumX = 0;
    let sumY = 0;
    
    coordinates.forEach(coord => {
      sumX += coord[0];
      sumY += coord[1];
    });
    
    return [sumX / coordinates.length, sumY / coordinates.length];
  };
  
  // Helper to guess if coordinate is in ocean (very simplified)
  const isLikelyOcean = (lat, lng) => {
    // This is a very crude approximation to avoid putting too many points in oceans
    // Real implementation would use a GeoJSON of land boundaries
    
    // Avoid the Pacific
    if (lng < -120 || lng > 150) {
      return Math.random() < 0.9; // 90% chance it's ocean
    }
    
    // Avoid the Atlantic
    if (lng > -60 && lng < -20) {
      return Math.random() < 0.8; // 80% chance it's ocean
    }
    
    // Avoid the Indian Ocean
    if (lat < 0 && lng > 60 && lng < 100) {
      return Math.random() < 0.8; // 80% chance it's ocean
    }
    
    // Avoid Antarctica
    if (lat < -60) {
      return Math.random() < 0.9; // 90% chance it's uninhabitable
    }
    
    // Avoid Arctic
    if (lat > 80) {
      return Math.random() < 0.9; // 90% chance it's uninhabitable
    }
    
    // Random check for other areas
    return Math.random() < 0.3; // 30% chance for other areas
  };

  // Toggle map style between satellite and streets
  const toggleMapStyle = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready yet, ignoring style toggle request');
      return;
    }
    
    const newStyle = mapStyle === 'mapbox://styles/mapbox/satellite-v9' 
      ? 'mapbox://styles/mapbox/streets-v11' 
      : 'mapbox://styles/mapbox/satellite-v9';
    
    setMapStyle(newStyle);
    
    // Store current layer visibility states
    const visibilityStates = {};
    dataLayers.forEach((_, index) => {
      const id = `data-layer-${index}`;
      try {
        if (map.current && map.current.getStyle() && map.current.getLayer(id)) {
          visibilityStates[id] = map.current.getLayoutProperty(id, 'visibility') !== 'none';
          
          // Also check for outline layers
          const outlineId = `${id}-outline`;
          if (map.current && map.current.getStyle() && map.current.getLayer(outlineId)) {
            visibilityStates[outlineId] = map.current.getLayoutProperty(outlineId, 'visibility') !== 'none';
          }
        }
      } catch (e) {
        console.error(`Error checking layer ${id}:`, e);
      }
    });
    
    // When style loads, reapply the layer visibility
    const prevLayers = [...dataLayers];
    const prevOpacity = {...layerOpacity};
    
    map.current.once('style.load', () => {
      // Re-add all data sources and layers
      prevLayers.forEach((layer, index) => {
        const id = `data-layer-${index}`;
        
        // Add source back
        if (!map.current.getSource(id)) {
          map.current.addSource(id, {
            'type': 'geojson',
            'data': layer.data
          });
        }
        
        // Re-add the layer
        if (!map.current.getLayer(id)) {
          if (layer.type === 'point') {
            map.current.addLayer({
              'id': id,
              'type': 'circle',
              'source': id,
              'paint': {
                'circle-radius': 6,
                'circle-color': layer.color || '#4fc3f7',
                'circle-opacity': prevOpacity[id] || 0.7,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
              },
              'metadata': {
                'title': layer.title || `Layer ${index + 1}`,
                'category': layer.category || 'Uncategorized',
                'layerType': 'point'
              }
            });
          } else if (layer.type === 'line') {
            map.current.addLayer({
              'id': id,
              'type': 'line',
              'source': id,
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': layer.color || '#ff4081',
                'line-width': 2,
                'line-opacity': prevOpacity[id] || 0.8
              },
              'metadata': {
                'title': layer.title || `Layer ${index + 1}`,
                'category': layer.category || 'Uncategorized',
                'layerType': 'line'
              }
            });
          } else if (layer.type === 'polygon') {
            map.current.addLayer({
              'id': id,
              'type': 'fill',
              'source': id,
              'paint': {
                'fill-color': layer.color || '#4fc3f7',
                'fill-opacity': prevOpacity[id] || 0.4,
                'fill-outline-color': '#ffffff'
              },
              'metadata': {
                'title': layer.title || `Layer ${index + 1}`,
                'category': layer.category || 'Uncategorized',
                'layerType': 'polygon'
              }
            });
            
            // Add an outline layer for the polygon
            map.current.addLayer({
              'id': `${id}-outline`,
              'type': 'line',
              'source': id,
              'paint': {
                'line-color': layer.color || '#4fc3f7',
                'line-width': 2,
                'line-opacity': prevOpacity[`${id}-outline`] || 0.8
              },
              'metadata': {
                'title': `${layer.title || `Layer ${index + 1}`} Outline`,
                'category': layer.category || 'Uncategorized',
                'layerType': 'polygon-outline',
                'parentLayer': id
              }
            });
          } else if (layer.type === 'heatmap') {
            map.current.addLayer({
              'id': id,
              'type': 'heatmap',
              'source': id,
              'paint': {
                'heatmap-weight': [
                  'interpolate', ['linear'], ['get', 'ndvi'],
                  0, 0,
                  0.5, 0.5,
                  1, 1
                ],
                'heatmap-intensity': 1,
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0, 0, 0, 0)',
                  0.2, '#b30000',
                  0.4, '#e6ac00',
                  0.6, '#66cc00',
                  0.8, '#009900',
                  1, '#006600'
                ],
                'heatmap-radius': 15,
                'heatmap-opacity': prevOpacity[id] || 0.7
              },
              'metadata': {
                'title': layer.title || `Heatmap ${index + 1}`,
                'category': layer.category || 'Uncategorized',
                'layerType': 'heatmap'
              }
            });
          }
          
          // Apply stored visibility
          if (visibilityStates[id] === false) {
            map.current.setLayoutProperty(id, 'visibility', 'none');
          }
          
          // Also apply to outline
          const outlineId = `${id}-outline`;
          if (map.current.getLayer(outlineId) && visibilityStates[outlineId] === false) {
            map.current.setLayoutProperty(outlineId, 'visibility', 'none');
          }
        }
      });
      
      // Restore event handlers
      attachMapEventHandlers();
    });
    
    map.current.setStyle(newStyle);
  };
  
  // Attach event handlers for layers
  const attachMapEventHandlers = () => {
    try {
      if (!map.current || !map.current.getStyle()) return;
      
      // Attach click handlers for all layers
      dataLayers.forEach((layer, index) => {
        try {
          const id = `data-layer-${index}`;
          if (map.current && map.current.getStyle() && map.current.getLayer(id) && layer.type !== 'heatmap') {
            // Remove existing handlers to avoid duplicates
            map.current.off('click', id);
            map.current.off('mouseenter', id);
            map.current.off('mouseleave', id);
            
            // Add click event
            map.current.on('click', id, (e) => {
              if (!map.current) return;
              
              const features = map.current.queryRenderedFeatures(e.point, {
                layers: [id]
              });
              
              if (features.length > 0) {
                setSelectedDataset({
                  ...features[0].properties,
                  layerTitle: layer.title || `Layer ${index + 1}`,
                  layerCategory: layer.category || 'Uncategorized',
                  coordinates: e.lngLat
                });
                
                // Extract properties for display
                const props = features[0].properties;
                
                // Create popup with enhanced information
                let popupContent = `
                  <div class="mapbox-popup-content">
                    <h4>${props.name || layer.title || 'Dataset'}</h4>
                    <p>${props.description || 'No description available'}</p>
                `;
                
                // Add additional properties if they exist
                if (props.category) {
                  popupContent += `<p><strong>Category:</strong> ${props.category}</p>`;
                }
                
                if (props.fileCount) {
                  popupContent += `<p><strong>Files:</strong> ${props.fileCount}</p>`;
                }
                
                if (props.updated) {
                  popupContent += `<p><strong>Updated:</strong> ${new Date(props.updated).toLocaleDateString()}</p>`;
                }
                
                popupContent += `</div>`;
                
                // Create popup
                if (map.current) {
                  new mapboxgl.Popup({ maxWidth: '300px' })
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map.current);
                }
              }
            });
            
            // Add hover effects
            map.current.on('mouseenter', id, () => {
              if (map.current && map.current.getCanvas()) {
                map.current.getCanvas().style.cursor = 'pointer';
              }
            });
            
            map.current.on('mouseleave', id, () => {
              if (map.current && map.current.getCanvas()) {
                map.current.getCanvas().style.cursor = '';
              }
            });
          }
        } catch (e) {
          console.error(`Error attaching handlers for layer ${index}:`, e);
        }
      });
    } catch (e) {
      console.error('Error in attachMapEventHandlers:', e);
    }
  };
  
  // Toggle layer visibility
  const toggleLayerVisibility = (layerId) => {
    try {
      if (!map.current || !map.current.getStyle() || !map.current.getLayer(layerId)) return;
      
      const currentVisibility = map.current.getLayoutProperty(layerId, 'visibility');
      const newVisibility = currentVisibility === 'none' ? 'visible' : 'none';
      
      // Update the map
      map.current.setLayoutProperty(layerId, 'visibility', newVisibility);
      
      // If this is a polygon layer, also toggle its outline
      const outlineId = `${layerId}-outline`;
      if (map.current && map.current.getStyle() && map.current.getLayer(outlineId)) {
        map.current.setLayoutProperty(outlineId, 'visibility', newVisibility);
      }
      
      // Update state
      setLayerVisibility(prev => ({
        ...prev,
        [layerId]: newVisibility === 'visible'
      }));
    } catch (e) {
      console.error(`Error toggling visibility for layer ${layerId}:`, e);
    }
  };
  
  // Set layer opacity
  const setLayerOpacityValue = (layerId, opacity) => {
    try {
      if (!map.current || !map.current.getStyle() || !map.current.getLayer(layerId)) return;
      
      // Get the layer type to know which property to update
      let paintProperty;
      const layerType = map.current.getLayer(layerId)?.type;
      
      switch (layerType) {
        case 'circle':
          paintProperty = 'circle-opacity';
          break;
        case 'line':
          paintProperty = 'line-opacity';
          break;
        case 'fill':
          paintProperty = 'fill-opacity';
          break;
        case 'heatmap':
          paintProperty = 'heatmap-opacity';
          break;
        default:
          return; // Unsupported layer type
      }
      
      // Update the opacity
      map.current.setPaintProperty(layerId, paintProperty, opacity);
      
      // If this is a polygon layer, also update its outline
      if (layerType === 'fill') {
        const outlineId = `${layerId}-outline`;
        if (map.current && map.current.getStyle() && map.current.getLayer(outlineId)) {
          map.current.setPaintProperty(outlineId, 'line-opacity', opacity);
        }
      }
      
      // Update state
      setLayerOpacity(prev => ({
        ...prev,
        [layerId]: opacity
      }));
    } catch (e) {
      console.error(`Error setting opacity for layer ${layerId}:`, e);
    }
  };
  
  // Function to show data panel
  const toggleDataPanel = () => {
    setShowDataPanel(prev => !prev);
  };
  
  // Filter layers by category
  const filterLayersByCategory = (category) => {
    setSelectedCategory(category);
  };

  // State to track if we should use the fallback
  // (This is now defined at the top with other state variables)
  
  // Effect to detect if map fails to load after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapLoaded && !useFallback && !error) {
        console.warn("Map didn't load after timeout - switching to fallback");
        setUseFallback(true);
      }
    }, 8000); // 8 seconds timeout, switch to fallback if no progress
    
    return () => clearTimeout(timer);
  }, [mapLoaded, useFallback, error]);

  // If using fallback static map
  if (useFallback) {
    // Import lazily to avoid initial load issues
    const StaticEarthMap = React.lazy(() => import('./StaticEarthMap'));
    
    return (
      <div className={`earth-map-container ${enhanced ? 'enhanced-mode' : ''}`}>
        <React.Suspense fallback={<div>Loading static map...</div>}>
          <StaticEarthMap 
            domain={domain} 
            onTryAgain={() => {
              setUseFallback(false);
              // Re-attempt initialization after a brief delay
              setTimeout(() => {
                if (map.current) {
                  try {
                    // Check if the map is in a valid state to be removed
                    if (map.current.getStyle && map.current.getContainer()) {
                      map.current.remove();
                    } else {
                      console.log("Map not in valid state for removal");
                    }
                  } catch (e) {
                    console.error("Error removing map:", e);
                  }
                }
                map.current = null;
                setMapLoaded(false);
              }, 500);
            }} 
          />
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className={`earth-map-container ${enhanced ? 'enhanced-mode' : ''}`}>
      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-info">
          <div className="coordinates">Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}</div>
        </div>
        <div className="map-actions">
          <button onClick={toggleMapStyle} className="style-toggle">
            {mapStyle.includes('satellite') ? 'Switch to Streets' : 'Switch to Satellite'}
          </button>
          {enhanced && (
            <button onClick={toggleDataPanel} className="data-toggle">
              {showDataPanel ? 'Hide Datasets' : 'Show Datasets'}
            </button>
          )}
        </div>
      </div>
      
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="map-container" 
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: '#020c1b', // Add a background to see if container is visible
          zIndex: 1
        }}
      />
      
      {/* Debug Information Panel */}
      <div className="map-debug-info" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        zIndex: 100,
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#ffcc00' }}>Map Debug Info</h4>
        <p>MapBox Token: {mapboxgl.accessToken ? mapboxgl.accessToken.substring(0, 10) + '...' : 'Missing'}</p>
        <p>Map Object: {map.current ? 'Created' : 'Not Created'}</p>
        <p>Map Container: {mapContainer.current ? 'Available' : 'Not Available'}</p>
        <p>Container Size: {mapContainer.current ? 
          `${mapContainer.current.offsetWidth}x${mapContainer.current.offsetHeight}` : 
          'Unknown'}</p>
        <p>Loaded: {mapLoaded ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <button onClick={() => {
          console.log('Attempting to initialize map with alternate approach');
          
          // Remove existing map if present
          if (map.current) {
            try {
              // Check if the map is in a valid state for removal
              if (map.current.getStyle && typeof map.current.getStyle === 'function' && 
                  map.current.getContainer && typeof map.current.getContainer === 'function') {
                map.current.remove();
                console.log('Removed existing map');
              } else {
                console.log('Map not in a valid state for removal - cleaning up reference only');
              }
              map.current = null;
            } catch (e) {
              console.error('Error removing map:', e);
              map.current = null;
            }
          }
          
          try {
            // Create a fresh div element
            const mapDiv = document.createElement('div');
            mapDiv.style.position = 'absolute';
            mapDiv.style.top = '0';
            mapDiv.style.bottom = '0';
            mapDiv.style.width = '100%';
            mapDiv.style.height = '100%';
            
            // Clear and append to container
            if (mapContainer.current) {
              mapContainer.current.innerHTML = '';
              mapContainer.current.appendChild(mapDiv);
            }
            
            // Create map with minimal options
            map.current = new mapboxgl.Map({
              container: mapDiv,
              style: 'mapbox://styles/mapbox/satellite-v9', // Use satellite view directly
              center: [lng, lat],
              zoom: zoom,
              attributionControl: false,
              preserveDrawingBuffer: true,
              trackResize: true
            });
            
            map.current.once('load', () => {
              console.log('Map manually initialized and loaded');
              setMapLoaded(true);
              setError(null);
            });
            
            console.log('Map manually initialized');
          } catch (e) {
            console.error('Manual map init error:', e);
            setError(e.message);
          }
        }} style={{
          background: '#4fc3f7',
          border: 'none',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}>
          Force Initialize Map
        </button>
        
        <button onClick={() => {
          if (map.current) {
            console.log('Forcing map resize');
            map.current.resize();
            setTimeout(() => {
              if (map.current) {
                map.current.resize();
              }
            }, 500);
          }
        }} style={{
          background: '#ff9800',
          border: 'none',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px',
          marginLeft: '10px'
        }}>
          Force Resize Map
        </button>
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
          <h3>{selectedDataset.name || selectedDataset.layerTitle || 'Dataset'}</h3>
          
          {selectedDataset.layerCategory && (
            <div className="dataset-category">
              <span className="category-label">Category:</span>
              <span className="category-value">{selectedDataset.layerCategory}</span>
            </div>
          )}
          
          <p>{selectedDataset.description || 'No description available'}</p>
          
          {selectedDataset.fileCount && (
            <div className="dataset-stat">
              <span className="stat-label">Files:</span>
              <span className="stat-value">{selectedDataset.fileCount}</span>
            </div>
          )}
          
          {selectedDataset.size && (
            <div className="dataset-stat">
              <span className="stat-label">Size:</span>
              <span className="stat-value">{selectedDataset.size}</span>
            </div>
          )}
          
          {selectedDataset.updated && (
            <div className="dataset-stat">
              <span className="stat-label">Last Updated:</span>
              <span className="stat-value">{new Date(selectedDataset.updated).toLocaleDateString()}</span>
            </div>
          )}
          
          {selectedDataset.coordinates && (
            <div className="dataset-coordinates">
              Location: {selectedDataset.coordinates.lng.toFixed(4)}, {selectedDataset.coordinates.lat.toFixed(4)}
            </div>
          )}
          
          {selectedDataset.url && (
            <a href={selectedDataset.url} target="_blank" rel="noopener noreferrer" className="dataset-download-link">
              Download Data
            </a>
          )}
        </div>
      )}
      
      {/* NASA-like Data Panel - Only shown when in enhanced mode */}
      {enhanced && showDataPanel && (
        <div className="data-panel">
          <div className="data-panel-header">
            <h3>{domain.charAt(0).toUpperCase() + domain.slice(1)} Datasets</h3>
            <button className="close-panel" onClick={toggleDataPanel}>×</button>
          </div>
          
          <div className="data-filters">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={selectedCategory || ''} 
                onChange={(e) => filterLayersByCategory(e.target.value || null)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.fileCount} files)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Time Range:</label>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="year">Past Year</option>
                <option value="month6">Past 6 Months</option>
                <option value="month3">Past 3 Months</option>
                <option value="month">Past Month</option>
              </select>
            </div>
          </div>
          
          <div className="data-layers">
            <h4>Available Layers</h4>
            
            {dataLayers.map((layer, index) => {
              const layerId = `data-layer-${index}`;
              const isVisible = layerVisibility[layerId] !== false;
              
              // Skip outline layers in the list
              if (layer.type === 'outline') return null;
              
              // Skip if filtered by category
              if (selectedCategory && layer.category !== selectedCategory) return null;
              
              return (
                <div className="layer-item" key={layerId}>
                  <div className="layer-header">
                    <div className="layer-visibility">
                      <input 
                        type="checkbox" 
                        checked={isVisible}
                        onChange={() => toggleLayerVisibility(layerId)}
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
                        onChange={(e) => setLayerOpacityValue(layerId, parseFloat(e.target.value))}
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
      
      {/* Legend */}
      <div className="map-legend">
        <h4>Data Legend</h4>
        {domain === 'agriculture' ? (
          <>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#76ff03' }}></span>
              <span>Agriculture Regions</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#64dd17' }}></span>
              <span>Crop Data Points</span>
            </div>
            {dataLayers.some(layer => layer.type === 'heatmap') && (
              <div className="legend-gradient">
                <h5>Vegetation Health (NDVI)</h5>
                <div className="gradient-bar">
                  <div className="gradient-colors"></div>
                  <div className="gradient-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : domain === 'weather' ? (
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#29b6f6' }}></span>
            <span>Weather Data</span>
          </div>
        ) : domain === 'disaster' ? (
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f44336' }}></span>
            <span>Disaster Monitoring</span>
          </div>
        ) : (
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#4fc3f7' }}></span>
            <span>Data Points</span>
          </div>
        )}
      </div>
      
      {/* Enhanced NASA-like Toolbar */}
      {enhanced && (
        <div className="nasa-toolbar">
          <button className="toolbar-button" onClick={() => {
            if (map.current && map.current.flyTo) {
              map.current.flyTo({ zoom: 2, center: [0, 0] });
            }
          }}>
            <span className="button-icon">🌍</span> Full Globe
          </button>
          
          <button className="toolbar-button" onClick={() => {
            if (map.current && map.current.flyTo) {
              map.current.flyTo({ zoom: 3, center: [0, 20] });
            }
          }}>
            <span className="button-icon">🌱</span> Major Croplands
          </button>
          
          <button className="toolbar-button" onClick={toggleDataPanel}>
            <span className="button-icon">📊</span> Data Layers
          </button>
        </div>
      )}
    </div>
  );
};

export default EarthMap;
