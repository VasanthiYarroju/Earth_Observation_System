import { Storage } from "@google-cloud/storage";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.resolve(__dirname, "./config/earth-observation-system-1e95036cdd34.json");

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: KEY_FILE });

async function listBuckets() {
  try {
    console.log('Listing all buckets:');
    const [buckets] = await storage.getBuckets();
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name}`);
    });
  } catch (err) {
    console.error('Error listing buckets:', err);
  }
}

async function listFiles(bucketName) {
  try {
    console.log(`\nListing files in ${bucketName}:`);
    const [files] = await storage.bucket(bucketName).getFiles({ maxResults: 10 });
    
    if (files.length === 0) {
      console.log('No files found.');
      return;
    }
    
    files.forEach(file => {
      const sizeInKb = Math.round(parseInt(file.metadata.size) / 1024);
      console.log(`- ${file.name} (${sizeInKb} KB)`);
    });
  } catch (err) {
    console.error(`Error listing files in ${bucketName}:`, err);
  }
}

// Run the functions
async function main() {
  await listBuckets();
  await listFiles('eo-agriculture-forestry');
}

main().catch(console.error);
