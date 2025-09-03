import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart2, Globe, Database, FileText, Activity, Lock, Star } from 'lucide-react';
import './SpaceAnimations.css';
import './DomainPage.css';

const AgricultureLimitedPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock limited data for preview
  const limitedData = {
    basicStats: {
      totalCountries: 195,
      dataPoints: "10M+",
      lastUpdate: "Aug 2025"
    },
    sampleCrops: ["Wheat", "Rice", "Corn", "Soybean"],
    sampleRegions: ["North America", "Europe", "Asia"]
  };

  const handleSubscription = (plan) => {
    navigate('/subscription', { 
      state: { 
        selectedPlan: plan,
        redirectAfter: '/agriculture',
        domain: 'Agriculture'
      }
    });
  };

  return (
    <div className="domain-page">
      {/* Space Background */}
      <div className="space-background">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
        
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
        
        <div className="floating-planet planet-1"></div>
        <div className="floating-planet planet-2"></div>
      </div>

      {/* Back Button */}
      <button 
        className="domain-back-button"
        onClick={() => navigate('/home')} 
      >
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      {/* Domain Header */}
      <header className="domain-header agriculture-theme">
        <div className="domain-header-content">
          <div className="domain-icon">🌾</div>
          <div className="domain-title-container">
            <h1 className="domain-title">Agriculture Domain - Preview</h1>
            <p className="domain-description">
              Get a glimpse of our comprehensive agriculture data platform. 
              Subscribe to access full datasets, interactive maps, and advanced analytics.
            </p>
          </div>
        </div>
      </header>

      {/* Subscription Notice */}
      <div className="subscription-notice">
        <div className="subscription-notice-content">
          <div className="notice-icon">
            <Lock size={24} />
          </div>
          <div className="notice-text">
            <h3>Limited Access - Preview Mode</h3>
            <p>You're viewing a preview of our Agriculture domain. Subscribe to unlock the full experience!</p>
          </div>
          <button 
            className="upgrade-button"
            onClick={() => handleSubscription('professional')}
          >
            <Star size={16} />
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Domain Navigation */}
      <nav className="domain-nav">
        <ul>
          <li className={activeTab === 'dashboard' ? 'active' : ''}>
            <button onClick={() => setActiveTab('dashboard')}>
              <BarChart2 size={18} /> Dashboard
            </button>
          </li>
          <li className={activeTab === 'earth' ? 'active' : ''}>
            <button onClick={() => setActiveTab('earth')}>
              <Globe size={18} /> Earth View
            </button>
          </li>
          <li className={activeTab === 'datasets' ? 'active' : ''}>
            <button onClick={() => setActiveTab('datasets')}>
              <Database size={18} /> Datasets
            </button>
          </li>
          <li className={activeTab === 'reports' ? 'active' : ''}>
            <button onClick={() => setActiveTab('reports')}>
              <FileText size={18} /> Reports
            </button>
          </li>
          <li className={activeTab === 'monitoring' ? 'active' : ''}>
            <button onClick={() => setActiveTab('monitoring')}>
              <Activity size={18} /> Live Monitoring
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="domain-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-container">
            <h2 className="section-title">Agriculture Dashboard - Preview</h2>
            
            <div className="stat-cards">
              <div className="stat-card limited">
                <h3>Global Coverage</h3>
                <div className="stat-value">{limitedData.basicStats.totalCountries}</div>
                <p>Countries with agriculture data</p>
                <div className="limited-overlay">
                  <Lock size={16} />
                  <span>Subscribe for detailed stats</span>
                </div>
              </div>
              
              <div className="stat-card limited">
                <h3>Data Points</h3>
                <div className="stat-value">{limitedData.basicStats.dataPoints}</div>
                <p>Agricultural measurements</p>
                <div className="limited-overlay">
                  <Lock size={16} />
                  <span>Full access with subscription</span>
                </div>
              </div>
              
              <div className="stat-card limited">
                <h3>Last Updated</h3>
                <div className="stat-value">{limitedData.basicStats.lastUpdate}</div>
                <p>Data refresh frequency</p>
                <div className="limited-overlay">
                  <Lock size={16} />
                  <span>Real-time updates available</span>
                </div>
              </div>
            </div>
            
            {/* Preview Charts */}
            <div className="preview-section">
              <h3>Sample Crop Health Data</h3>
              <div className="preview-chart">
                <div className="chart-placeholder">
                  <div className="chart-blur">
                    {limitedData.sampleCrops.map((crop, index) => (
                      <div className="chart-item preview" key={crop}>
                        <div className="chart-label">{crop}</div>
                        <div className="chart-bar-container">
                          <div 
                            className="chart-bar preview" 
                            style={{width: `${60 + index * 10}%`}}
                          ></div>
                          <span className="chart-value">???%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="chart-overlay">
                    <Lock size={32} />
                    <h4>Unlock Full Analytics</h4>
                    <p>Get detailed crop health indices, yield predictions, and regional comparisons</p>
                    <button 
                      className="unlock-button"
                      onClick={() => handleSubscription('professional')}
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* What You'll Get Section */}
            <div className="preview-benefits">
              <h3>What You'll Get with Full Access</h3>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">📊</div>
                  <h4>Complete Analytics</h4>
                  <p>78 comprehensive CSV datasets with global agricultural data</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🌍</div>
                  <h4>Interactive Earth View</h4>
                  <p>Sector-based visualization with satellite imagery and terrain maps</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">📈</div>
                  <h4>Real-time Monitoring</h4>
                  <p>Live NDVI indices, soil moisture, and precipitation data</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">📋</div>
                  <h4>Detailed Reports</h4>
                  <p>Comprehensive PDF reports and data export capabilities</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'earth' && (
          <div className="earth-view-container limited">
            <h2 className="section-title">Agriculture Earth View - Preview</h2>
            
            <div className="preview-earth-container">
              <div className="earth-preview-blur">
                <div className="earth-placeholder">
                  <Globe size={120} />
                  <h3>Interactive Global Agriculture Map</h3>
                  <p>Explore agricultural data across 195 countries with our interactive Earth visualization</p>
                </div>
              </div>
              <div className="earth-overlay">
                <Lock size={48} />
                <h3>Unlock Interactive Earth View</h3>
                <p>Access sector-based agriculture mapping with:</p>
                <ul>
                  <li>8 different agriculture sectors</li>
                  <li>Satellite and terrain map views</li>
                  <li>Country-specific data on click</li>
                  <li>Real-time data integration</li>
                </ul>
                <button 
                  className="unlock-button large"
                  onClick={() => handleSubscription('professional')}
                >
                  Subscribe for Full Access
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'datasets' && (
          <div className="datasets-container limited">
            <h2 className="section-title">Agriculture Datasets - Preview</h2>
            
            <div className="datasets-preview">
              <div className="dataset-sample">
                <h3>Available Dataset Categories (Preview)</h3>
                <div className="dataset-list">
                  <div className="dataset-item preview">
                    <div className="dataset-info">
                      <h4>Crop Production Data</h4>
                      <p>Global crop yield and production statistics</p>
                      <span className="dataset-files">12 files available</span>
                    </div>
                    <div className="dataset-lock">
                      <Lock size={20} />
                    </div>
                  </div>
                  
                  <div className="dataset-item preview">
                    <div className="dataset-info">
                      <h4>Fertilizer Usage</h4>
                      <p>Fertilizer consumption and application data</p>
                      <span className="dataset-files">8 files available</span>
                    </div>
                    <div className="dataset-lock">
                      <Lock size={20} />
                    </div>
                  </div>
                  
                  <div className="dataset-item preview">
                    <div className="dataset-info">
                      <h4>Livestock Statistics</h4>
                      <p>Global livestock population and production</p>
                      <span className="dataset-files">15 files available</span>
                    </div>
                    <div className="dataset-lock">
                      <Lock size={20} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="datasets-upgrade">
                <div className="upgrade-card">
                  <h3>Want to access the full data?</h3>
                  <p className="upgrade-subtitle">Subscribe now to unlock all datasets!</p>
                  <div className="upgrade-features">
                    <div className="feature">✅ 78 comprehensive CSV files</div>
                    <div className="feature">✅ Real-time data synchronization</div>
                    <div className="feature">✅ Export and download capabilities</div>
                    <div className="feature">✅ API access for integration</div>
                  </div>
                  <button 
                    className="subscribe-button"
                    onClick={() => handleSubscription('professional')}
                  >
                    Subscribe Now - Starting at $29/month
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="reports-container limited">
            <h2 className="section-title">Agriculture Reports - Preview</h2>
            
            <div className="reports-preview">
              <div className="preview-reports-list">
                <div className="report-card preview">
                  <div className="report-content">
                    <h3>Global Crop Yield Analysis 2025</h3>
                    <p>Comprehensive analysis of global crop production trends</p>
                    <div className="report-meta">
                      <span>PDF • 2.4MB</span>
                      <span>August 15, 2025</span>
                    </div>
                  </div>
                  <div className="report-lock">
                    <Lock size={24} />
                  </div>
                </div>
                
                <div className="report-card preview">
                  <div className="report-content">
                    <h3>Agricultural Land Use Changes</h3>
                    <p>5-year trend analysis of agricultural land utilization</p>
                    <div className="report-meta">
                      <span>PDF • 3.8MB</span>
                      <span>July 22, 2025</span>
                    </div>
                  </div>
                  <div className="report-lock">
                    <Lock size={24} />
                  </div>
                </div>
              </div>
              
              <div className="reports-upgrade-section">
                <div className="upgrade-content">
                  <h3>Unlock Premium Reports</h3>
                  <p>Get access to detailed agricultural reports and analysis</p>
                  <button 
                    className="upgrade-button"
                    onClick={() => handleSubscription('professional')}
                  >
                    Subscribe for Reports Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'monitoring' && (
          <div className="monitoring-container limited">
            <h2 className="section-title">Live Monitoring - Preview</h2>
            
            <div className="monitoring-preview">
              <div className="preview-monitoring-grid">
                {limitedData.sampleRegions.map((region, index) => (
                  <div className="monitoring-region preview" key={region}>
                    <h3>{region}</h3>
                    <div className="monitoring-metrics">
                      <div className="metric blurred">
                        <span className="metric-name">NDVI Index:</span>
                        <span className="metric-value">•••</span>
                      </div>
                      <div className="metric blurred">
                        <span className="metric-name">Soil Moisture:</span>
                        <span className="metric-value">••%</span>
                      </div>
                      <div className="metric blurred">
                        <span className="metric-name">Precipitation:</span>
                        <span className="metric-value">••mm</span>
                      </div>
                    </div>
                    <div className="region-overlay">
                      <Lock size={20} />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="monitoring-upgrade">
                <div className="upgrade-banner">
                  <h3>Real-time Agricultural Monitoring</h3>
                  <p>Subscribe to get live updates on crop health, soil conditions, and weather data</p>
                  <button 
                    className="monitor-upgrade-button"
                    onClick={() => handleSubscription('professional')}
                  >
                    Unlock Live Monitoring
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgricultureLimitedPage;
