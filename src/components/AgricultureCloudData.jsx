import React, { useState, useEffect } from 'react';
import { getDomainSampleData, getDomainMetadata } from '../services/domainService';
import './AgricultureCloudData.css';

const AgricultureCloudData = ({ maxItems = 10, category = null, onDataLoad = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [activeTab, setActiveTab] = useState('files');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both metadata and sample data in parallel
        const [metadataResult, dataResult] = await Promise.all([
          getDomainMetadata('agriculture'),
          getDomainSampleData('agriculture', category, maxItems)
        ]);
        
        setMetadata(metadataResult);
        setData(dataResult);
        
        // Call the optional callback with the data
        if (onDataLoad) {
          onDataLoad({ metadata: metadataResult, data: dataResult });
        }
      } catch (err) {
        console.error('Error fetching agriculture data:', err);
        setError(err.message || 'Failed to load data from Google Cloud');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [category, maxItems, onDataLoad]);

  // Format file size for display
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format date for display
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString() + ' ' + 
           new Date(dateStr).toLocaleTimeString();
  };

  // Render categories and stats
  const renderCategories = () => {
    if (!metadata || !metadata.categories) return null;
    
    return (
      <div className="ag-cloud-categories">
        <h3>Categories ({metadata.categories.length})</h3>
        <div className="ag-cloud-category-grid">
          {metadata.categories.map((category, index) => (
            <div className="ag-cloud-category-card" key={index}>
              <h4>{category.category}</h4>
              <div className="ag-cloud-category-stats">
                <p>Files: <strong>{category.fileCount}</strong></p>
                <p>Size: <strong>{formatBytes(category.totalSize)}</strong></p>
                <p>Updated: <strong>{new Date(category.lastUpdated).toLocaleDateString()}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render file list
  const renderFiles = () => {
    if (!data || data.length === 0) return <p>No files available.</p>;
    
    return (
      <div className="ag-cloud-files">
        <h3>Files ({data.length})</h3>
        {data.map((file, index) => (
          <div className="ag-cloud-file-card" key={index}>
            <div className="ag-cloud-file-header">
              <h4>{file.name.split('/').pop()}</h4>
              <span className={`ag-cloud-file-type ${getFileTypeClass(file.contentType)}`}>
                {getFileTypeLabel(file.contentType)}
              </span>
            </div>
            
            <div className="ag-cloud-file-meta">
              <p>Size: {formatBytes(file.size)}</p>
              <p>Updated: {formatDate(file.updated)}</p>
              <p>Path: {file.name}</p>
            </div>
            
            {file.preview && (
              <div className="ag-cloud-file-preview">
                <h5>Preview:</h5>
                <pre>{file.preview.length > 300 ? file.preview.substring(0, 300) + '...' : file.preview}</pre>
              </div>
            )}
            
            <div className="ag-cloud-file-actions">
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ag-cloud-file-link"
              >
                Download File
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper to get file type class for styling
  const getFileTypeClass = (contentType) => {
    if (!contentType) return 'unknown';
    if (contentType.includes('json') || contentType.includes('geojson')) return 'json';
    if (contentType.includes('csv')) return 'csv';
    if (contentType.includes('image')) return 'image';
    if (contentType.includes('text')) return 'text';
    return 'other';
  };

  // Helper to get file type label
  const getFileTypeLabel = (contentType) => {
    if (!contentType) return 'Unknown';
    if (contentType.includes('json')) return 'JSON';
    if (contentType.includes('geojson')) return 'GeoJSON';
    if (contentType.includes('csv')) return 'CSV';
    if (contentType.includes('image')) return 'Image';
    if (contentType.includes('text')) return 'Text';
    return contentType.split('/').pop().toUpperCase();
  };

  // Render summary stats
  const renderSummary = () => {
    if (!metadata) return null;
    
    return (
      <div className="ag-cloud-summary">
        <h3>Bucket Summary</h3>
        <div className="ag-cloud-summary-stats">
          <div className="ag-cloud-stat">
            <span className="ag-cloud-stat-label">Files</span>
            <span className="ag-cloud-stat-value">{metadata.totalFiles}</span>
          </div>
          <div className="ag-cloud-stat">
            <span className="ag-cloud-stat-label">Categories</span>
            <span className="ag-cloud-stat-value">{metadata.categories.length}</span>
          </div>
          <div className="ag-cloud-stat">
            <span className="ag-cloud-stat-label">Total Size</span>
            <span className="ag-cloud-stat-value">{formatBytes(metadata.totalSize)}</span>
          </div>
          <div className="ag-cloud-stat">
            <span className="ag-cloud-stat-label">Bucket</span>
            <span className="ag-cloud-stat-value">{metadata.bucketName}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="ag-cloud-loading">Loading agriculture data from Google Cloud...</div>;
  }

  if (error) {
    return <div className="ag-cloud-error">Error: {error}</div>;
  }

  return (
    <div className="agriculture-cloud-data">
      {/* Summary at top */}
      {renderSummary()}
      
      {/* Tab navigation */}
      <div className="ag-cloud-tabs">
        <button 
          className={`ag-cloud-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button 
          className={`ag-cloud-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>
      
      {/* Tab content */}
      <div className="ag-cloud-content">
        {activeTab === 'files' ? renderFiles() : renderCategories()}
      </div>
      
      {/* Footer with data source */}
      <div className="ag-cloud-footer">
        <p>Data sourced from Google Cloud Storage</p>
      </div>
    </div>
  );
};

export default AgricultureCloudData;
