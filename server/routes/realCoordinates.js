// Enhanced agriculture route with real coordinate extraction
import express from 'express';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const router = express.Router();

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.resolve(__dirname, "../config/earth-observation-system-1e95036cdd34.json");
const AGRICULTURE_BUCKET = "eo-agriculture-forestry";

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: KEY_FILE });

/**
 * GET /api/agriculture/real-coordinates
 * Extract real geographical coordinates from agriculture datasets
 */
router.get('/real-coordinates', async (req, res) => {
  try {
    console.log('🗺️ Extracting real coordinates from agriculture datasets...');
    
    const [files] = await storage.bucket(AGRICULTURE_BUCKET).getFiles();
    const coordinateData = await extractCoordinatesFromFiles(files.slice(0, 10)); // Process first 10 files
    
    res.json({
      success: true,
      coordinates: coordinateData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error extracting coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallbackData: getGeographicalFallbackData()
    });
  }
});

/**
 * Extract coordinates from agriculture files
 */
async function extractCoordinatesFromFiles(files) {
  const coordinateData = {};
  
  for (const file of files) {
    try {
      if (file.name.toLowerCase().includes('.csv') && file.metadata.size < 100 * 1024 * 1024) {
        console.log(`📍 Processing ${file.name} for coordinates...`);
        
        const sampleData = await getCSVSample(file, 100); // Get more rows for coordinate analysis
        const coordinates = extractCoordinatesFromCSV(sampleData, file.name);
        
        if (coordinates.regions.length > 0) {
          const sector = determineSectorFromFileName(file.name);
          coordinateData[sector.key] = {
            ...sector,
            regions: coordinates.regions,
            boundingBox: coordinates.boundingBox,
            dataSource: file.name
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error processing ${file.name}:`, error.message);
    }
  }
  
  return coordinateData;
}

/**
 * Extract coordinates from CSV data
 */
function extractCoordinatesFromCSV(csvData, fileName) {
  const regions = [];
  const coordinates = [];
  
  // Look for coordinate columns in the CSV
  const coordColumns = findCoordinateColumns(csvData);
  
  if (coordColumns.lat && coordColumns.lng) {
    // Group by country/area for creating regional boundaries
    const regionGroups = groupByRegion(csvData, coordColumns);
    
    Object.entries(regionGroups).forEach(([regionName, regionData]) => {
      const polygon = createPolygonFromPoints(regionData.coordinates);
      
      if (polygon) {
        regions.push({
          name: regionName,
          coordinates: [polygon],
          properties: {
            area: calculatePolygonArea(polygon),
            dataPoints: regionData.coordinates.length,
            sector: determineSectorFromFileName(fileName).key,
            countries: [...new Set(regionData.countries)]
          }
        });
        
        coordinates.push(...regionData.coordinates);
      }
    });
  }
  
  return {
    regions,
    boundingBox: calculateBoundingBox(coordinates)
  };
}

/**
 * Find coordinate columns in CSV data
 */
function findCoordinateColumns(csvData) {
  if (!csvData || csvData.length === 0) return {};
  
  const headers = Object.keys(csvData[0]);
  let latCol = null;
  let lngCol = null;
  
  // Look for latitude columns
  for (const header of headers) {
    const lower = header.toLowerCase();
    if (lower.includes('lat') || lower.includes('y_coord') || lower.includes('latitude')) {
      latCol = header;
    }
    if (lower.includes('lon') || lower.includes('lng') || lower.includes('x_coord') || lower.includes('longitude')) {
      lngCol = header;
    }
  }
  
  // If no direct coordinate columns, look for country/area codes that we can map to coordinates
  if (!latCol || !lngCol) {
    for (const header of headers) {
      const lower = header.toLowerCase();
      if (lower.includes('country') || lower.includes('area') || lower.includes('region')) {
        return { countryCol: header };
      }
    }
  }
  
  return { lat: latCol, lng: lngCol };
}

/**
 * Group CSV data by region/country
 */
function groupByRegion(csvData, coordColumns) {
  const regions = {};
  
  csvData.forEach(row => {
    let regionName;
    let lat, lng;
    
    if (coordColumns.lat && coordColumns.lng) {
      lat = parseFloat(row[coordColumns.lat]);
      lng = parseFloat(row[coordColumns.lng]);
      regionName = row.Country || row.Area || row.Region || 'Unknown Region';
    } else if (coordColumns.countryCol) {
      regionName = row[coordColumns.countryCol];
      const coords = getCountryCoordinates(regionName);
      lat = coords.lat;
      lng = coords.lng;
    }
    
    if (lat && lng && !isNaN(lat) && !isNaN(lng) && regionName) {
      if (!regions[regionName]) {
        regions[regionName] = {
          coordinates: [],
          countries: []
        };
      }
      
      regions[regionName].coordinates.push([lat, lng]);
      if (regionName !== 'Unknown Region') {
        regions[regionName].countries.push(regionName);
      }
    }
  });
  
  return regions;
}

/**
 * Get approximate coordinates for country names
 */
function getCountryCoordinates(countryName) {
  const countryCoords = {
    'United States': { lat: 39.8283, lng: -98.5795 },
    'China': { lat: 35.8617, lng: 104.1954 },
    'India': { lat: 20.5937, lng: 78.9629 },
    'Brazil': { lat: -14.2350, lng: -51.9253 },
    'Argentina': { lat: -38.4161, lng: -63.6167 },
    'Australia': { lat: -25.2744, lng: 133.7751 },
    'Canada': { lat: 56.1304, lng: -106.3468 },
    'Russia': { lat: 61.5240, lng: 105.3188 },
    'Ukraine': { lat: 48.3794, lng: 31.1656 },
    'France': { lat: 46.2276, lng: 2.2137 },
    'Germany': { lat: 51.1657, lng: 10.4515 },
    'Indonesia': { lat: -0.7893, lng: 113.9213 },
    'Turkey': { lat: 38.9637, lng: 35.2433 },
    'Iran': { lat: 32.4279, lng: 53.6880 },
    'Thailand': { lat: 15.8700, lng: 100.9925 },
    'Mexico': { lat: 23.6345, lng: -102.5528 },
    'Egypt': { lat: 26.0975, lng: 30.8025 },
    'Nigeria': { lat: 9.0820, lng: 8.6753 },
    'South Africa': { lat: -30.5595, lng: 22.9375 },
    'Spain': { lat: 40.4637, lng: -3.7492 },
    'Italy': { lat: 41.8719, lng: 12.5674 }
  };
  
  return countryCoords[countryName] || { lat: 0, lng: 0 };
}

/**
 * Create polygon from coordinate points
 */
function createPolygonFromPoints(coordinates) {
  if (coordinates.length < 3) return null;
  
  // For small number of points, create a convex hull
  if (coordinates.length <= 10) {
    const hull = convexHull(coordinates);
    return hull.length >= 3 ? hull : null;
  }
  
  // For many points, create a bounding rectangle
  const bounds = calculateBoundingBox(coordinates);
  return [
    [bounds.minLat, bounds.minLng],
    [bounds.minLat, bounds.maxLng],
    [bounds.maxLat, bounds.maxLng],
    [bounds.maxLat, bounds.minLng],
    [bounds.minLat, bounds.minLng]
  ];
}

/**
 * Simple convex hull algorithm
 */
function convexHull(points) {
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  
  const lower = [];
  for (let i = 0; i < points.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
      lower.pop();
    }
    lower.push(points[i]);
  }
  
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
      upper.pop();
    }
    upper.push(points[i]);
  }
  
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Calculate bounding box for coordinates
 */
function calculateBoundingBox(coordinates) {
  if (coordinates.length === 0) return null;
  
  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];
  
  coordinates.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Calculate approximate polygon area
 */
function calculatePolygonArea(polygon) {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    area += (polygon[i][1] * polygon[i + 1][0] - polygon[i + 1][1] * polygon[i][0]);
  }
  return Math.abs(area / 2);
}

/**
 * Get CSV sample for coordinate analysis
 */
async function getCSVSample(file, rowLimit = 100) {
  return new Promise((resolve, reject) => {
    const results = [];
    let rowCount = 0;
    
    const readStream = storage.bucket(AGRICULTURE_BUCKET).file(file.name).createReadStream();
    
    readStream
      .pipe(csv())
      .on('data', (data) => {
        if (rowCount < rowLimit) {
          results.push(data);
          rowCount++;
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Determine sector from filename
 */
function determineSectorFromFileName(fileName) {
  const name = fileName.toLowerCase();
  
  if (name.includes('crop') || name.includes('production')) {
    return { key: 'crops_production', name: 'Crop Production', color: '#4CAF50', icon: '🌾' };
  } else if (name.includes('trade')) {
    return { key: 'trade', name: 'Agricultural Trade', color: '#2196F3', icon: '🚢' };
  } else if (name.includes('livestock')) {
    return { key: 'livestock', name: 'Livestock', color: '#8D6E63', icon: '🐄' };
  } else if (name.includes('land')) {
    return { key: 'land_use', name: 'Land Use', color: '#8BC34A', icon: '🗺️' };
  } else if (name.includes('forest')) {
    return { key: 'forestry', name: 'Forestry', color: '#4CAF50', icon: '🌲' };
  } else if (name.includes('fertilizer')) {
    return { key: 'fertilizers', name: 'Fertilizers', color: '#9C27B0', icon: '🧪' };
  }
  
  return { key: 'general', name: 'General Agriculture', color: '#4CAF50', icon: '🌱' };
}

/**
 * Fallback geographical data with real-world coordinates
 */
function getGeographicalFallbackData() {
  return {
    crops_production: {
      key: 'crops_production',
      name: 'Crop Production',
      color: '#4CAF50',
      icon: '🌾',
      regions: [
        {
          name: 'US Corn Belt',
          coordinates: [[
            [40.0, -94.0], [40.0, -82.0], [45.0, -82.0], [45.0, -94.0], [40.0, -94.0]
          ]],
          properties: { area: 50000, countries: ['United States'] }
        },
        {
          name: 'Argentine Pampas',
          coordinates: [[
            [-35.0, -63.0], [-35.0, -57.0], [-30.0, -57.0], [-30.0, -63.0], [-35.0, -63.0]
          ]],
          properties: { area: 45000, countries: ['Argentina'] }
        }
      ]
    }
  };
}

export default router;
