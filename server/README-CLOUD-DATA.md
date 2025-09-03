# Google Cloud Data Integration Guide

This guide explains how to use the Google Cloud data integration in the Earth Observation System.

## Overview

The Earth Observation System integrates with Google Cloud Storage to provide seamless access to various geospatial and environmental datasets. The system uses a bucket-based organization with dedicated buckets for different domains like agriculture, weather, disaster monitoring, etc.

## Bucket Structure

The system uses the following bucket mapping:

```javascript
const DOMAIN_BUCKET_MAP = {
  agriculture: "eo-agriculture-forestry",
  disaster: "eo-disaster-resilience",
  marine: "eo-marine",
  weather: "eo-weather",
  landuse: "eo-landuse-cartography",
  health: "eo-public-health"
};
```

## Authentication

The system uses service account credentials stored in the `server/config/earth-observation-system-1e95036cdd34.json` file. Make sure this file is properly secured and not committed to public repositories.

## Available Tools

### 1. Agriculture Bucket Analysis Tool

Located at `server/check-agriculture-bucket.mjs`, this tool provides an overview of the agriculture bucket contents.

**Usage:**

```bash
node server/check-agriculture-bucket.mjs
```

### 2. Agriculture Files Listing Tool

Located at `server/list-agriculture-files.mjs`, this tool provides detailed information about agriculture files.

**Usage:**

```bash
# Basic usage
node server/list-agriculture-files.mjs

# Generate file previews (for small files)
node server/list-agriculture-files.mjs --preview

# Skip configuration generation
node server/list-agriculture-files.mjs --no-config
```

## React Components

### AgricultureCloudData Component

A reusable component that displays agriculture data from Google Cloud.

**Usage:**

```jsx
import AgricultureCloudData from '../components/AgricultureCloudData';

// Basic usage
<AgricultureCloudData />

// With options
<AgricultureCloudData 
  maxItems={15}
  category="crops"
  onDataLoad={(data) => console.log("Data loaded", data)}
/>
```

**Props:**

- `maxItems` (number): Maximum number of items to display (default: 10)
- `category` (string): Filter by specific category (default: null - show all)
- `onDataLoad` (function): Callback that receives the loaded data

## Earth Map Integration

The EarthMap component can visualize data from Google Cloud Storage buckets. It processes the data and displays it on a MapboxGL-powered interactive globe.

The integration automatically:

1. Detects GeoJSON files in the buckets
2. Creates appropriate visualization layers
3. Generates NDVI (vegetation health) heatmap from data
4. Provides popup information when clicking on data points

## Server API Endpoints

The server provides several endpoints to access Google Cloud data:

- `GET /api/domains/:domain/metadata`: Get metadata about domain datasets
- `GET /api/domains/:domain/sample`: Get sample data from a domain (optional category filtering)
- `GET /api/domains/:domain/analytics`: Get analytics data for a domain

## Adding New Data

To add new data to the system:

1. Upload files to the appropriate Google Cloud bucket
2. Organize files in folders that represent categories
3. Use GeoJSON format for spatial data to enable visualization
4. Refresh the application to see the new data

For optimal visualization:

- Use folders to categorize data (e.g., crops/, forests/, water/)
- Include geospatial coordinates in your data when possible
- Add descriptive metadata in your filenames or content

## Troubleshooting

Common issues:

1. **Authentication errors**: Check that the service account key file is present and has proper permissions
2. **Missing data**: Ensure files are uploaded to the correct bucket and follow the expected structure
3. **Visualization issues**: For best visualization results, use GeoJSON format with proper coordinates

## Security Considerations

- Keep the service account key private
- Set up appropriate IAM permissions on the Google Cloud buckets
- Use the server as a proxy to avoid exposing credentials on the client side
