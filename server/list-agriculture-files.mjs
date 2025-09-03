import { Storage } from "@google-cloud/storage";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.resolve(__dirname, "./config/earth-observation-system-1e95036cdd34.json");

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: KEY_FILE });
const BUCKET_NAME = "eo-agriculture-forestry";

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Get content preview for GeoJSON or CSV files
async function getContentPreview(file, maxSize = 4096) {
  try {
    // Only process smaller files to avoid memory issues
    if (parseInt(file.metadata.size) > 5 * 1024 * 1024) {
      return `File too large (${formatBytes(parseInt(file.metadata.size))}) for preview`;
    }

    // Only process certain file types
    const ext = path.extname(file.name).toLowerCase();
    if (!['.json', '.geojson', '.csv'].includes(ext)) {
      return 'Preview not available for this file type';
    }

    const readStream = file.createReadStream({
      start: 0,
      end: maxSize - 1 // Read first maxSize bytes
    });

    let data = '';
    for await (const chunk of readStream) {
      data += chunk.toString();
    }

    return data;
  } catch (error) {
    console.error(`Error getting preview for ${file.name}:`, error);
    return `Error getting preview: ${error.message}`;
  }
}

// Generate a visualization config for mapping
async function generateVisualizationConfig(files, filesByCategory) {
  const config = {
    domain: "agriculture",
    timestamp: new Date().toISOString(),
    layers: []
  };

  // Define colors for categories
  const colors = [
    '#76ff03', '#64dd17', '#aeea00', '#00c853', '#00bfa5',
    '#00b8d4', '#4caf50', '#8bc34a', '#009688'
  ];

  // Create a layer for each category
  Object.keys(filesByCategory).forEach((category, index) => {
    const categoryFiles = filesByCategory[category];
    const color = colors[index % colors.length];

    // Filter for geospatial data
    const geoFiles = categoryFiles.filter(file => 
      file.name.toLowerCase().endsWith('.geojson') ||
      file.name.toLowerCase().endsWith('.json') ||
      file.contentType?.includes('geo')
    );

    // Create a layer if geospatial files exist
    if (geoFiles.length > 0) {
      config.layers.push({
        id: `agriculture-${category}`,
        title: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
        category: category,
        type: 'geoJson',
        color: color,
        visible: true,
        opacity: 0.7,
        files: geoFiles.slice(0, 5).map(f => ({
          name: f.name,
          url: `https://storage.googleapis.com/${BUCKET_NAME}/${f.name}`,
          size: f.rawSize,
          formattedSize: formatBytes(f.rawSize)
        }))
      });
    }

    // Create a point layer for data points in this category
    config.layers.push({
      id: `agriculture-points-${category}`,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Data Points`,
      category: category,
      type: 'point',
      color: color,
      visible: true,
      opacity: 0.7,
      dataPoints: categoryFiles.length
    });
  });

  return config;
}

// Generate sample JSON for visualizing NDVI (vegetation index) data
async function generateSampleNdviData() {
  // Create a grid of points with NDVI values for visualization
  const ndviGrid = [];
  const gridSize = 50; // 50x50 grid
  
  for (let lat = -60; lat <= 60; lat += 120/gridSize) {
    for (let lng = -180; lng <= 180; lng += 360/gridSize) {
      // Skip oceans (simplified check)
      if (Math.random() < 0.7) {
        // Generate a semi-realistic NDVI value
        // NDVI values range from -1 to 1, with vegetation typically 0.2 to 0.8
        // Use a sine function to simulate latitude-based vegetation patterns
        const baseValue = 0.3 + 0.4 * Math.cos(lat * Math.PI / 60);
        const ndvi = Math.max(-0.1, Math.min(0.9, baseValue + (Math.random() * 0.3 - 0.15)));
        
        ndviGrid.push({
          lat,
          lng, 
          ndvi,
          category: ndvi < 0.1 ? 'barren' : 
                   ndvi < 0.3 ? 'sparse' :
                   ndvi < 0.5 ? 'moderate' :
                   ndvi < 0.7 ? 'dense' : 'very dense'
        });
      }
    }
  }
  
  return ndviGrid;
}

// Main function to analyze the bucket content
async function analyzeAgricultureData(options = {}) {
  const { generatePreview = false, generateConfig = true, outputDir = __dirname } = options;
  
  try {
    console.log(`\n📊 Analyzing agriculture data in ${BUCKET_NAME}...`);
    console.log('====================================');
    
    // Get all files in the bucket
    const [files] = await storage.bucket(BUCKET_NAME).getFiles();
    
    if (files.length === 0) {
      console.log('❌ No files found in bucket.');
      return null;
    }
    
    console.log(`✅ Found ${files.length} files total.`);
    console.log('====================================');
    
    // Group files by folder/category and collect metadata
    const filesByCategory = {};
    const fileMetadata = [];
    
    for (const file of files) {
      const parts = file.name.split('/');
      const category = parts.length > 1 ? parts[0] : 'root';
      const filename = parts[parts.length - 1];
      const ext = path.extname(filename).toLowerCase();
      const rawSize = parseInt(file.metadata.size || 0);
      
      // Build file metadata object
      const metadata = {
        name: file.name,
        filename,
        category,
        extension: ext,
        rawSize,
        size: formatBytes(rawSize),
        contentType: file.metadata.contentType,
        updated: file.metadata.updated,
        url: `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`
      };
      
      // Add to category list
      if (!filesByCategory[category]) {
        filesByCategory[category] = [];
      }
      filesByCategory[category].push(metadata);
      
      // Add to flat metadata list
      fileMetadata.push(metadata);
      
      // Generate content preview if requested
      if (generatePreview && ['.json', '.geojson', '.csv'].includes(ext) && rawSize < 5 * 1024 * 1024) {
        try {
          metadata.preview = await getContentPreview(file);
        } catch (previewError) {
          console.error(`Error generating preview for ${file.name}:`, previewError);
          metadata.preview = `Error: ${previewError.message}`;
        }
      }
    }
    
    // Print files by category with statistics
    Object.keys(filesByCategory).sort().forEach(category => {
      const categoryFiles = filesByCategory[category];
      const totalSize = categoryFiles.reduce((sum, file) => sum + file.rawSize, 0);
      
      console.log(`\n📁 CATEGORY: ${category.toUpperCase()} (${categoryFiles.length} files, ${formatBytes(totalSize)})`);
      console.log('--------------------------------------------------');
      
      // Group by file type
      const fileTypes = {};
      categoryFiles.forEach(file => {
        const ext = file.extension || 'no-extension';
        if (!fileTypes[ext]) {
          fileTypes[ext] = { count: 0, size: 0 };
        }
        fileTypes[ext].count++;
        fileTypes[ext].size += file.rawSize;
      });
      
      console.log('File types:');
      Object.keys(fileTypes).forEach(ext => {
        console.log(`  - ${ext}: ${fileTypes[ext].count} files (${formatBytes(fileTypes[ext].size)})`);
      });
      
      // List the files (limited to 15 per category for readability)
      console.log('\nFiles:');
      categoryFiles.slice(0, 15).forEach(file => {
        console.log(`  - ${file.filename} (${file.size}, updated: ${new Date(file.updated).toLocaleDateString()})`);
      });
      
      if (categoryFiles.length > 15) {
        console.log(`  ... and ${categoryFiles.length - 15} more files`);
      }
    });
    
    // Print summary
    console.log('\n====================================');
    console.log('📈 SUMMARY:');
    console.log('====================================');
    console.log(`📂 Total categories: ${Object.keys(filesByCategory).length}`);
    console.log(`📄 Total files: ${files.length}`);
    const totalSize = files.reduce((sum, file) => sum + parseInt(file.metadata.size || 0), 0);
    console.log(`💾 Total size: ${formatBytes(totalSize)}`);
    
    // Generate visualization configuration if requested
    if (generateConfig) {
      console.log('\n🗺️ Generating visualization configuration...');
      
      // Generate the configuration
      const visualizationConfig = await generateVisualizationConfig(files, filesByCategory);
      
      // Generate sample NDVI data
      const ndviData = await generateSampleNdviData();
      
      // Save the configuration
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const configPath = path.join(outputDir, `agriculture-visualization-${timestamp}.json`);
      await fs.writeFile(configPath, JSON.stringify(visualizationConfig, null, 2));
      console.log(`✅ Saved visualization config to ${configPath}`);
      
      // Save sample NDVI data
      const ndviPath = path.join(outputDir, `agriculture-ndvi-sample-${timestamp}.json`);
      await fs.writeFile(ndviPath, JSON.stringify(ndviData, null, 2));
      console.log(`✅ Saved sample NDVI data to ${ndviPath}`);
    }
    
    return {
      filesByCategory,
      fileMetadata,
      summary: {
        totalCategories: Object.keys(filesByCategory).length,
        totalFiles: files.length,
        totalSize
      }
    };
    
  } catch (err) {
    console.error(`❌ Error analyzing files in ${BUCKET_NAME}:`, err);
    return null;
  }
}

// Export function for import in other modules
export { analyzeAgricultureData };

// When run directly, execute analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Agriculture Data Analysis Tool');
  console.log('====================================');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    generatePreview: args.includes('--preview'),
    generateConfig: !args.includes('--no-config'),
    outputDir: __dirname
  };
  
  // Run the analysis
  analyzeAgricultureData(options)
    .then(result => {
      if (result) {
        console.log('\n✅ Analysis complete!');
      } else {
        console.log('\n❌ Analysis failed or no data found.');
      }
    })
    .catch(err => {
      console.error('❌ Unexpected error:', err);
      process.exit(1);
    });
}
