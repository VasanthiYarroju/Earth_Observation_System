import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Filter, Download, Info } from 'lucide-react';
import EarthMap from '../components/EarthMap';
import './DomainPage.css';

const EarthVisualization = () => {
  const navigate = useNavigate();
  const [activeDomain, setActiveDomain] = useState('agriculture');
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const domains = [
    { id: 'agriculture', name: 'Agriculture', color: '#76ff03', icon: '🌾' },
    { id: 'weather', name: 'Weather', color: '#29b6f6', icon: '🌦️' },
    { id: 'disaster', name: 'Disaster', color: '#f44336', icon: '🚨' },
    { id: 'ocean', name: 'Ocean', color: '#0277bd', icon: '🌊' },
    { id: 'forest', name: 'Forest', color: '#388e3c', icon: '🌳' }
  ];

  return (
    <div className="earth-visualization-page">
      <div className="earth-visualization-header">
        <button 
          className="back-button"
          onClick={() => navigate('/home')}
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        
        <h1>Earth Data Visualization</h1>
        
        <div className="header-actions">
          <button className="action-button" onClick={() => setShowInfoPanel(!showInfoPanel)}>
            <Info size={18} /> About This View
          </button>
          <button className="action-button">
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>
      
      <div className="domain-selector">
        {domains.map(domain => (
          <button
            key={domain.id}
            className={`domain-button ${activeDomain === domain.id ? 'active' : ''}`}
            onClick={() => setActiveDomain(domain.id)}
            style={{ 
              '--domain-color': domain.color,
              borderColor: activeDomain === domain.id ? domain.color : 'transparent'
            }}
          >
            <span className="domain-icon">{domain.icon}</span>
            <span className="domain-name">{domain.name}</span>
          </button>
        ))}
      </div>
      
      <div className="earth-map-wrapper">
        <EarthMap domain={activeDomain} />
        
        <div className="map-toolbar">
          <button className="toolbar-button">
            <Layers size={18} /> Layers
          </button>
          <button className="toolbar-button">
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>
      
      {showInfoPanel && (
        <div className="info-panel">
          <h3>About Earth Data Visualization</h3>
          <p>This interactive map provides a NASA-like Earth visualization interface with detailed information about various Earth observation domains.</p>
          <p>Use the domain selector above to switch between different categories of Earth observation data. Each domain displays specialized data layers relevant to that field.</p>
          <p>Click on data points to view detailed information about specific observations.</p>
          <button className="close-info-button" onClick={() => setShowInfoPanel(false)}>Close</button>
        </div>
      )}
      
      <div className="earth-visualization-footer">
        <div className="data-stats">
          <div className="stat">
            <span className="stat-label">Active Layers:</span>
            <span className="stat-value">3</span>
          </div>
          <div className="stat">
            <span className="stat-label">Data Points:</span>
            <span className="stat-value">247</span>
          </div>
          <div className="stat">
            <span className="stat-label">Last Updated:</span>
            <span className="stat-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarthVisualization;
