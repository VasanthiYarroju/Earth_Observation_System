import { Storage } from "@google-cloud/storage";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.resolve(__dirname, "../config/earth-observation-system-1e95036cdd34.json");

// Bucket mapping from upload.js
const DOMAIN_BUCKET_MAP = {
  agriculture: "eo-agriculture-forestry",
  disaster: "eo-disaster-resilience",  // Maps to wildfire and all_month in original map
  marine: "eo-marine",
  weather: "eo-weather",              // Maps to atmospheric, mlev, plev, sfc
  landuse: "eo-landuse-cartography",  // Maps to deforestation
  health: "eo-public-health"          // Maps to water_potability
};

// Initialize Google Cloud Storage with flexible authentication
let storage;

try {
  // For production, prioritize environment variables
  if (process.env.NODE_ENV === 'production' || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      storage = new Storage({ 
        projectId: credentials.project_id,
        credentials: credentials
      });
      console.log('✅ Google Cloud Storage initialized with environment credentials');
    } else {
      throw new Error('Production environment but no credentials found');
    }
  } else if (fs.existsSync(KEY_FILE)) {
    // For local development, use service account key file
    storage = new Storage({ keyFilename: KEY_FILE });
    console.log('✅ Google Cloud Storage initialized with service account key file');
  } else {
    throw new Error('No Google Cloud credentials available');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Storage:', error.message);
  console.log('⚠️ Make sure GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is set for production.');
  storage = null;
}

/**
 * Get list of files in a bucket for a specific domain
 */
export const getFileListByDomain = async (domain) => {
  try {
    // Check if Google Cloud Storage is available
    if (!storage) {
      throw new Error('Google Cloud Storage not initialized. Please configure credentials.');
    }

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
    // Check if Google Cloud Storage is available
    if (!storage) {
      throw new Error('Google Cloud Storage not initialized. Please configure credentials.');
    }

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
    
    // Filter files by size, but with a higher limit
    const sizeFilteredFiles = preferredFiles.filter(file => {
      const sizeInMB = parseInt(file.size || 0) / (1024 * 1024);
      return sizeInMB < 100; // Accept files up to 100MB
    });
    
    // Take either preferred files or any files if no preferred ones exist
    // Sort by last updated to show newest files first
    const sortedFiles = (sizeFilteredFiles.length > 0 ? sizeFilteredFiles : filteredFiles.filter(f => {
      const sizeInMB = parseInt(f.size || 0) / (1024 * 1024);
      return sizeInMB < 50; // Also filter non-preferred files by size
    })).sort((a, b) => {
      // Sort by newest first
      return new Date(b.updated) - new Date(a.updated);
    });
    
    // Get the requested number of files
    const sampleFiles = sortedFiles.slice(0, limit);
      
    // For each sample file, get a preview of its data
    const sampleData = await Promise.all(sampleFiles.map(async file => {
      // Get bucket name for this domain
      const bucketName = DOMAIN_BUCKET_MAP[domain.toLowerCase()];
      
      try {
        // For large files, don't download the entire file, just get a signed URL
        const [url] = await storage.bucket(bucketName).file(file.name).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        });

        let preview = '';
        const sizeInMB = parseInt(file.size || 0) / (1024 * 1024);

        if (sizeInMB < 1) { // Only download files smaller than 1MB
          // Use streaming to read just the beginning of the file
          const readStream = storage.bucket(bucketName).file(file.name).createReadStream({
            start: 0,
            end: 4096 // Read first 4KB only to avoid memory issues
          });
          
          // Get content directly from stream instead of writing to a file
          let chunks = [];
          
          // Get file content from stream
          const fileContent = await new Promise((resolve, reject) => {
            readStream.on('data', chunk => chunks.push(chunk));
            readStream.on('error', reject);
            readStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').substring(0, 2000)));
          });
          
          // Process content based on file type
          if (file.name.endsWith('.csv')) {
            // For CSV, get first few lines
            const lines = fileContent.split('\n').slice(0, 5);
            preview = lines.join('\n');
          } else if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
            // For JSON, just show the first part without parsing
            preview = fileContent.substring(0, 500) + '...';
          } else {
            // For other files, just get the first part
            preview = fileContent.substring(0, 500) + '...';
          }
        } else {
          // For large files, just show a message with the size
          preview = `Large file (${sizeInMB.toFixed(2)} MB). Click the link below to download.`;
        }
        
        return {
          ...file,
          preview: preview.length > 0 ? preview : "No preview available",
          url,
          size: sizeInMB.toFixed(2) + ' MB'
        };
      } catch (err) {
        console.error(`Error getting preview for file ${file.name}:`, err);
        
        // Get a signed URL even if preview fails
        try {
          const [url] = await storage.bucket(bucketName).file(file.name).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes
          });
          
          return {
            ...file,
            preview: `Unable to generate preview: ${err.message}`,
            url,
            error: true
          };
        } catch (urlError) {
          console.error(`Error generating signed URL for ${file.name}:`, urlError);
          return {
            ...file,
            preview: `Unable to access file: ${err.message}`,
            error: true
          };
        }
      }
    }));
    
    return sampleData;
  } catch (error) {
    console.error(`Error getting sample data for domain ${domain}:`, error);
    throw new Error(`Failed to retrieve sample data: ${error.message}`);
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
