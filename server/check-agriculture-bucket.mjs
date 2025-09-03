import { Storage } from "@google-cloud/storage";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import chalk from 'chalk';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.resolve(__dirname, "./config/earth-observation-system-1e95036cdd34.json");

// Bucket name for agriculture
const AGRICULTURE_BUCKET = "eo-agriculture-forestry";

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: KEY_FILE });

/**
 * Format file size to human readable format
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if a bucket exists and is accessible
 */
async function checkBucket(bucketName) {
    try {
        const [exists] = await storage.bucket(bucketName).exists();
        if (exists) {
            console.log(chalk.green(`✓ Bucket ${bucketName} exists and is accessible`));
            return true;
        } else {
            console.log(chalk.red(`✗ Bucket ${bucketName} does not exist`));
            return false;
        }
    } catch (error) {
        console.error(chalk.red(`Error checking bucket ${bucketName}:`), error);
        return false;
    }
}

/**
 * Get statistics about files in a bucket
 */
async function getBucketStats(bucketName) {
    try {
        console.log(chalk.blue(`\nAnalyzing bucket: ${bucketName}...\n`));
        
        // Get all files in the bucket
        const [files] = await storage.bucket(bucketName).getFiles();
        
        console.log(chalk.blue(`Total files: ${files.length}`));
        
        // Group by file extension
        const extensionStats = {};
        files.forEach(file => {
            const ext = path.extname(file.name).toLowerCase() || 'no-extension';
            if (!extensionStats[ext]) {
                extensionStats[ext] = {
                    count: 0,
                    totalSize: 0,
                    files: []
                };
            }
            
            extensionStats[ext].count += 1;
            extensionStats[ext].totalSize += parseInt(file.metadata.size || 0);
            extensionStats[ext].files.push({
                name: file.name,
                size: parseInt(file.metadata.size || 0),
                updated: file.metadata.updated
            });
        });
        
        console.log(chalk.blue('\nFile types breakdown:'));
        Object.keys(extensionStats).sort((a, b) => 
            extensionStats[b].count - extensionStats[a].count
        ).forEach(ext => {
            const stats = extensionStats[ext];
            console.log(chalk.cyan(`  ${ext}: ${stats.count} files, ${formatBytes(stats.totalSize)}`));
        });
        
        // Group by folder/category
        const categoryStats = {};
        files.forEach(file => {
            // Get first part of the path as category
            const parts = file.name.split('/');
            const category = parts.length > 1 ? parts[0] : 'root';
            
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    count: 0,
                    totalSize: 0,
                    extensions: {},
                    lastUpdated: null
                };
            }
            
            categoryStats[category].count += 1;
            categoryStats[category].totalSize += parseInt(file.metadata.size || 0);
            
            // Track file types within this category
            const ext = path.extname(file.name).toLowerCase() || 'no-extension';
            if (!categoryStats[category].extensions[ext]) {
                categoryStats[category].extensions[ext] = 0;
            }
            categoryStats[category].extensions[ext] += 1;
            
            // Track latest update
            const updated = new Date(file.metadata.updated);
            if (!categoryStats[category].lastUpdated || 
                updated > new Date(categoryStats[category].lastUpdated)) {
                categoryStats[category].lastUpdated = file.metadata.updated;
            }
        });
        
        console.log(chalk.blue('\nCategories breakdown:'));
        Object.keys(categoryStats).sort((a, b) => 
            categoryStats[b].count - categoryStats[a].count
        ).forEach(category => {
            const stats = categoryStats[category];
            console.log(chalk.green(`\n  ${category}:`));
            console.log(chalk.green(`    Files: ${stats.count}`));
            console.log(chalk.green(`    Total size: ${formatBytes(stats.totalSize)}`));
            console.log(chalk.green(`    Last updated: ${new Date(stats.lastUpdated).toLocaleDateString()}`));
            
            // Show file types in this category
            console.log(chalk.green('    File types:'));
            Object.keys(stats.extensions).forEach(ext => {
                console.log(chalk.green(`      ${ext}: ${stats.extensions[ext]} files`));
            });
        });
        
        // Find largest files
        console.log(chalk.blue('\nLargest files:'));
        files.sort((a, b) => parseInt(b.metadata.size || 0) - parseInt(a.metadata.size || 0))
            .slice(0, 5)
            .forEach(file => {
                console.log(chalk.yellow(`  ${file.name}: ${formatBytes(parseInt(file.metadata.size || 0))}`));
            });
            
        // Find recently updated files
        console.log(chalk.blue('\nRecently updated:'));
        files.sort((a, b) => new Date(b.metadata.updated) - new Date(a.metadata.updated))
            .slice(0, 5)
            .forEach(file => {
                console.log(chalk.yellow(`  ${file.name}: ${new Date(file.metadata.updated).toLocaleString()}`));
            });
            
        return { files, categories: categoryStats };
    } catch (error) {
        console.error(chalk.red(`Error analyzing bucket ${bucketName}:`), error);
        return null;
    }
}

/**
 * Generate a sample data report file
 */
async function generateDataReport(bucketName, bucketStats) {
    try {
        if (!bucketStats) return;
        
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const reportFileName = `${bucketName}-report-${timestamp}.json`;
        const reportPath = path.join(__dirname, reportFileName);
        
        // Structure the report
        const report = {
            bucketName,
            timestamp: new Date().toISOString(),
            totalFiles: bucketStats.files.length,
            categories: Object.keys(bucketStats.categories).map(catName => {
                const cat = bucketStats.categories[catName];
                return {
                    name: catName,
                    fileCount: cat.count,
                    totalSize: cat.totalSize,
                    formattedSize: formatBytes(cat.totalSize),
                    fileTypes: cat.extensions,
                    lastUpdated: cat.lastUpdated
                };
            }),
            sampleFiles: bucketStats.files
                .sort((a, b) => new Date(b.metadata.updated) - new Date(a.metadata.updated))
                .slice(0, 20)
                .map(file => ({
                    name: file.name,
                    size: parseInt(file.metadata.size || 0),
                    formattedSize: formatBytes(parseInt(file.metadata.size || 0)),
                    updated: file.metadata.updated,
                    url: `https://storage.googleapis.com/${bucketName}/${file.name}`
                }))
        };
        
        // Write the report to a file
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(chalk.green(`\nReport generated: ${reportPath}`));
        return reportPath;
    } catch (error) {
        console.error(chalk.red('Error generating report:'), error);
    }
}

/**
 * Main function
 */
async function main() {
    console.log(chalk.blue('==== Google Cloud Storage Agriculture Bucket Analysis Tool ===='));
    
    const bucketExists = await checkBucket(AGRICULTURE_BUCKET);
    
    if (!bucketExists) {
        console.log(chalk.yellow('\nThe agriculture bucket does not exist or is not accessible.'));
        console.log(chalk.yellow('Please check your credentials and bucket name.'));
        return;
    }
    
    const bucketStats = await getBucketStats(AGRICULTURE_BUCKET);
    if (bucketStats) {
        await generateDataReport(AGRICULTURE_BUCKET, bucketStats);
    }
    
    console.log(chalk.blue('\n==== Analysis Complete ===='));
}

// Run the script
main().catch(err => {
    console.error(chalk.red('Error:', err));
    process.exit(1);
});
