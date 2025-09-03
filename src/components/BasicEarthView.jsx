import React, { useState } from 'react';
import './EarthMap.css';

/**
 * A simple HTML/CSS fallback for when MapBox GL fails to load
 * This component doesn't depend on any external libraries
 */
const BasicEarthView = ({ domain = 'agriculture' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const getEarthImageByDomain = () => {
    switch (domain) {
      case 'agriculture':
        return "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/asia_vir_2020_lrg.jpg";
      case 'disaster':
        return "https://eoimages.gsfc.nasa.gov/images/imagerecords/147000/147594/cawildfires_tmo_2021222_lrg.jpg";
      case 'marine':
        return "https://eoimages.gsfc.nasa.gov/images/imagerecords/148000/148304/gulfstream_gsr_2021157_lrg.jpg";
      default:
        return "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200407.3x5400x2700.jpg";
    }
  };

  return (
    <div className="basic-earth-view">
      <div className="basic-earth-header">
        <h3>{domain.charAt(0).toUpperCase() + domain.slice(1)} Earth View</h3>
        <div className="basic-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'data' ? 'active' : ''} 
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
          <button 
            className={activeTab === 'info' ? 'active' : ''} 
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
        </div>
      </div>

      <div className="basic-earth-content">
        {activeTab === 'overview' && (
          <div className="earth-image-container">
            <img 
              src={getEarthImageByDomain()} 
              alt={`Earth ${domain} view`} 
              className="earth-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200407.3x5400x2700.jpg";
              }}
            />
            <div className="image-overlay">
              <div className="region north-america" title="North America">NA</div>
              <div className="region south-america" title="South America">SA</div>
              <div className="region europe" title="Europe">EU</div>
              <div className="region africa" title="Africa">AF</div>
              <div className="region asia" title="Asia">AS</div>
              <div className="region oceania" title="Oceania">OC</div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-display">
            <h4>Key {domain.charAt(0).toUpperCase() + domain.slice(1)} Metrics</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Data Points</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>North America</td>
                  <td>1,245</td>
                  <td>August 21, 2025</td>
                  <td><span className="status good">Good</span></td>
                </tr>
                <tr>
                  <td>South America</td>
                  <td>987</td>
                  <td>August 20, 2025</td>
                  <td><span className="status warning">Warning</span></td>
                </tr>
                <tr>
                  <td>Europe</td>
                  <td>1,876</td>
                  <td>August 22, 2025</td>
                  <td><span className="status good">Good</span></td>
                </tr>
                <tr>
                  <td>Africa</td>
                  <td>765</td>
                  <td>August 19, 2025</td>
                  <td><span className="status warning">Warning</span></td>
                </tr>
                <tr>
                  <td>Asia</td>
                  <td>2,341</td>
                  <td>August 21, 2025</td>
                  <td><span className="status good">Good</span></td>
                </tr>
                <tr>
                  <td>Oceania</td>
                  <td>623</td>
                  <td>August 20, 2025</td>
                  <td><span className="status alert">Alert</span></td>
                </tr>
              </tbody>
            </table>

            <div className="chart-container">
              <h4>Regional Distribution</h4>
              <div className="bar-chart-basic">
                <div className="chart-bar" style={{ width: '30%' }}>
                  <span className="bar-label">North America</span>
                  <span className="bar-value">30%</span>
                </div>
                <div className="chart-bar" style={{ width: '15%' }}>
                  <span className="bar-label">South America</span>
                  <span className="bar-value">15%</span>
                </div>
                <div className="chart-bar" style={{ width: '25%' }}>
                  <span className="bar-label">Europe</span>
                  <span className="bar-value">25%</span>
                </div>
                <div className="chart-bar" style={{ width: '10%' }}>
                  <span className="bar-label">Africa</span>
                  <span className="bar-value">10%</span>
                </div>
                <div className="chart-bar" style={{ width: '15%' }}>
                  <span className="bar-label">Asia</span>
                  <span className="bar-value">15%</span>
                </div>
                <div className="chart-bar" style={{ width: '5%' }}>
                  <span className="bar-label">Oceania</span>
                  <span className="bar-value">5%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-display">
            <h4>About {domain.charAt(0).toUpperCase() + domain.slice(1)} Data</h4>
            {domain === 'agriculture' && (
              <div>
                <p>Our agriculture data monitoring system covers global crop production, vegetation health, and agricultural patterns across all major farming regions.</p>
                <h5>Key Features</h5>
                <ul>
                  <li>Real-time crop health monitoring via NDVI (Normalized Difference Vegetation Index)</li>
                  <li>Agricultural land use classification and change detection</li>
                  <li>Crop yield prediction models based on historical and real-time data</li>
                  <li>Drought and irrigation monitoring for major agricultural regions</li>
                </ul>
                <p>All data is sourced from our network of satellites and ground stations, processed through our proprietary algorithms, and stored in secure cloud storage for easy access and analysis.</p>
              </div>
            )}
            
            {domain === 'disaster' && (
              <div>
                <p>Our disaster monitoring system provides real-time tracking and analysis of natural disasters, extreme weather events, and environmental emergencies worldwide.</p>
                <h5>Key Features</h5>
                <ul>
                  <li>Early warning detection for wildfires, floods, and volcanic activity</li>
                  <li>Impact assessment for affected regions and populations</li>
                  <li>Historical disaster data analysis for risk prediction</li>
                  <li>Emergency response coordination and resource allocation</li>
                </ul>
                <p>Our integrated approach combines satellite imagery, weather data, and ground reports to provide the most accurate and timely disaster intelligence available.</p>
              </div>
            )}
            
            {domain === 'marine' && (
              <div>
                <p>Our marine monitoring system tracks oceanic conditions, marine biodiversity, and coastal environments across the world's oceans and seas.</p>
                <h5>Key Features</h5>
                <ul>
                  <li>Sea surface temperature and salinity measurements</li>
                  <li>Ocean current mapping and analysis</li>
                  <li>Marine ecosystem health monitoring</li>
                  <li>Coastal erosion and sea level rise tracking</li>
                </ul>
                <p>By combining satellite observations with oceanographic data from buoys and research vessels, we provide comprehensive insights into the state of our oceans.</p>
              </div>
            )}
            
            {domain !== 'agriculture' && domain !== 'disaster' && domain !== 'marine' && (
              <div>
                <p>Our environmental monitoring system provides comprehensive data on global ecological systems and environmental conditions.</p>
                <h5>Key Features</h5>
                <ul>
                  <li>Global coverage of land, sea, and atmospheric conditions</li>
                  <li>Multi-spectrum satellite imagery and remote sensing</li>
                  <li>Environmental change detection and trend analysis</li>
                  <li>Integration with ground-based monitoring stations</li>
                </ul>
                <p>Our platform combines multiple data sources to create a comprehensive view of Earth's environmental systems.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="basic-earth-footer">
        <p>Note: This is a simplified static view. Interactive map features are currently unavailable.</p>
        <p>Data last updated: August 22, 2025</p>
        <div className="footer-actions">
          <button className="action-button" onClick={() => window.location.reload()}>
            Retry Interactive Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicEarthView;
