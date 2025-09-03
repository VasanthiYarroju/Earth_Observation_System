import React from 'react';
import './EarthMap.css';

const StaticEarthMap = ({ domain, onTryAgain }) => {
  // Default image URLs for different domains
  const domainImages = {
    agriculture: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_east_720.jpg',
    disaster: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_west_720.jpg',
    marine: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/ocean_shallow_topo_2048.jpg',
    default: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg'
  };

  // Pick the appropriate image for the domain
  const earthImage = domainImages[domain] || domainImages.default;

  return (
    <div className="static-earth-container">
      <div className="static-earth-header">
        <h3>Static Earth View</h3>
        <p>Interactive map is currently unavailable. Using static visualization instead.</p>
      </div>
      
      <div className="static-earth-image">
        <img src={earthImage} alt={`Earth ${domain} view`} />
      </div>
      
      <div className="static-earth-controls">
        <button onClick={onTryAgain} className="retry-button">
          Try Interactive Map
        </button>
        
        <div className="domain-selector">
          <span>View Mode: </span>
          <select defaultValue="standard">
            <option value="standard">Standard</option>
            <option value="satellite">Satellite</option>
            <option value="topographic">Topographic</option>
          </select>
        </div>
      </div>
      
      <div className="static-earth-info">
        <div className="info-panel">
          <h4>{domain.charAt(0).toUpperCase() + domain.slice(1)} Data Highlights</h4>
          
          {domain === 'agriculture' && (
            <ul>
              <li>Global crop coverage: 1.7 billion hectares</li>
              <li>Major production regions: North America, Europe, Asia</li>
              <li>Primary crops: Wheat, Rice, Corn, Soybeans</li>
              <li>Current global NDVI range: 0.35 - 0.72</li>
            </ul>
          )}
          
          {domain === 'disaster' && (
            <ul>
              <li>Active monitoring: 37 regions</li>
              <li>Current alerts: 12 countries</li>
              <li>Primary concerns: Floods, Wildfires</li>
              <li>Historical data: 2010-2025</li>
            </ul>
          )}
          
          {domain === 'marine' && (
            <ul>
              <li>Ocean temperature: +0.8°C above average</li>
              <li>Monitored regions: 5 major oceans</li>
              <li>Data sources: 23 monitoring stations</li>
              <li>Temporal range: 2015-2025</li>
            </ul>
          )}
          
          {domain !== 'agriculture' && domain !== 'disaster' && domain !== 'marine' && (
            <ul>
              <li>Global monitoring active</li>
              <li>Data updated: Daily</li>
              <li>Coverage: Global</li>
              <li>Sources: Multiple satellites and ground stations</li>
            </ul>
          )}
        </div>
      </div>
      
      <div className="static-earth-footer">
        <p>
          Static image courtesy of NASA Earth Observatory. 
          For more detailed visualization, please try the interactive map option again later.
        </p>
      </div>
    </div>
  );
};

export default StaticEarthMap;
