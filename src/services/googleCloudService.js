// src/services/googleCloudService.js
import { Storage } from '@google-cloud/storage';

// Bucket mapping from upload.js
const DOMAIN_BUCKET_MAP = {
  agriculture: "eo-agriculture-forestry",
  disaster: "eo-disaster-resilience",
  marine: "eo-marine",
  weather: "eo-weather",
  landuse: "eo-landuse-cartography",
  health: "eo-public-health"
};

// Initialize Google Cloud Storage with authentication from environment variables
// Note: For this to work in browser, you would typically use a backend proxy or Firebase
const storage = new Storage({
  projectId: process.env.REACT_APP_GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.REACT_APP_GCP_CLIENT_EMAIL,
    private_key: process.env.REACT_APP_GCP_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }
});

/**
 * Get list of files in a bucket for a specific domain
 */
export const getFileListByDomain = async (domain) => {
  try {
    const bucketName = DOMAIN_BUCKET_MAP[domain.toLowerCase()];
    
    if (!bucketName) {
      throw new Error(`No bucket mapped for domain: ${domain}`);
    }
    
    const [files] = await storage.bucket(bucketName).getFiles();
    
    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      updated: file.metadata.updated,
      contentType: file.metadata.contentType,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`
    }));
  } catch (error) {
    console.error(`Error fetching files for domain ${domain}:`, error);
    throw error;
  }
};

/**
 * Get metadata about a specific domain's datasets
 */
export const getDomainDatasetMetadata = async (domain) => {
  try {
    const files = await getFileListByDomain(domain);
    
    // Group files by subfolder/category
    const categories = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      const category = parts.length > 1 ? parts[0] : 'general';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(file);
    });
    
    // Calculate total size and count per category
    const summary = Object.keys(categories).map(category => ({
      category,
      fileCount: categories[category].length,
      totalSize: categories[category].reduce((sum, file) => sum + parseInt(file.size || 0), 0),
      lastUpdated: categories[category].reduce((latest, file) => {
        const fileDate = new Date(file.updated);
        return fileDate > latest ? fileDate : latest;
      }, new Date(0))
    }));
    
    return {
      domain,
      bucketName: DOMAIN_BUCKET_MAP[domain.toLowerCase()],
      categories: summary,
      totalFiles: files.length,
      totalSize: summary.reduce((sum, cat) => sum + cat.totalSize, 0)
    };
  } catch (error) {
    console.error(`Error getting metadata for domain ${domain}:`, error);
    throw error;
  }
};

/**
 * Get sample data for a domain (for visualizations)
 */
export const getSampleData = async (domain, category = null, limit = 10) => {
  try {
    const files = await getFileListByDomain(domain);
    
    // Filter by category if provided
    const filteredFiles = category 
      ? files.filter(file => file.name.startsWith(`${category}/`))
      : files;
    
    // Get a sample of files (prefer CSV, JSON, or GeoJSON)
    const preferredFiles = filteredFiles.filter(file => 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.geojson')
    );
    
    // Take either preferred files or any files if no preferred ones exist
    const sampleFiles = (preferredFiles.length > 0 ? preferredFiles : filteredFiles)
      .slice(0, limit);
    
    // For each sample file, get a preview using the file's public URL
    const sampleData = await Promise.all(sampleFiles.map(async file => {
      try {
        // Get a signed URL for the file (valid for 15 minutes)
        const [url] = await storage
          .bucket(DOMAIN_BUCKET_MAP[domain.toLowerCase()])
          .file(file.name)
          .getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes
          });
        
        // Fetch the file content
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const content = await response.text();
        
        // Process content based on file type
        let preview;
        if (file.name.endsWith('.csv')) {
          // For CSV, get first few lines
          preview = content.split('\n').slice(0, 5).join('\n');
        } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
          // For JSON, parse and extract preview
          try {
            const json = JSON.parse(content);
            preview = JSON.stringify(json, null, 2).substring(0, 500) + '...';
          } catch (e) {
            preview = content.substring(0, 500) + '...';
          }
        } else {
          // For other files, just get the first part
          preview = content.substring(0, 500) + '...';
        }
        
        return {
          ...file,
          preview
        };
      } catch (err) {
        console.error(`Error getting preview for file ${file.name}:`, err);
        return {
          ...file,
          preview: 'Error loading preview'
        };
      }
    }));
    
    return sampleData;
  } catch (error) {
    console.error(`Error getting sample data for domain ${domain}:`, error);
    throw error;
  }
};

/**
 * Get domain-specific analytics data for dashboard
 */
export const getDomainAnalytics = async (domain) => {
  // This would be a custom implementation for each domain
  // Here we're just providing a placeholder
  const analytics = {
    agriculture: {
      crops: ['Rice', 'Wheat', 'Corn', 'Soybeans'],
      healthIndices: [78, 65, 82, 71],
      regionalData: {
        'North America': { area: 200000, production: 15000 },
        'South America': { area: 180000, production: 12000 },
        'Europe': { area: 120000, production: 9000 },
        'Asia': { area: 350000, production: 25000 },
        'Africa': { area: 160000, production: 8000 },
        'Oceania': { area: 90000, production: 5000 }
      }
    },
    disaster: {
      activeEvents: 17,
      byType: {
        'Wildfire': 5,
        'Flood': 4,
        'Drought': 3,
        'Earthquake': 2,
        'Hurricane': 2,
        'Landslide': 1
      },
      impactedRegions: ['California', 'Queensland', 'Amazon Basin', 'Mediterranean']
    },
    marine: {
      oceanHealthIndex: 67,
      coralReefStatus: {
        'Great Barrier': 'Moderate',
        'Caribbean': 'Poor',
        'Red Sea': 'Good',
        'Maldives': 'Fair'
      },
      marineProtectedAreas: 5.7, // percentage of global ocean
      oceanTemperatureAnomaly: 1.2 // degrees C
    }
  };
  
  return analytics[domain] || { message: 'No analytics available for this domain' };
};
