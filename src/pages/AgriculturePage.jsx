import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDomainMetadata, getDomainAnalytics, getDomainSampleData } from '../services/domainService';
import { ChevronLeft, BarChart2, Globe, Database, FileText, Activity, CheckCircle, X } from 'lucide-react';
import './SpaceAnimations.css';
import './DomainPage.css';
import AgricultureCloudData from '../components/AgricultureCloudData';
import SectorBasedAgricultureMap from '../components/SectorBasedAgricultureMap';

// Error Boundary for Map Component
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error:', error, errorInfo);
    
    // Handle specific Leaflet errors
    if (error.message && error.message.includes('_leaflet_pos')) {
      console.warn('Leaflet DOM positioning error detected, attempting cleanup...');
      
      // Attempt to clean up Leaflet containers
      setTimeout(() => {
        const containers = document.querySelectorAll('.leaflet-container');
        containers.forEach(container => {
          if (container._leaflet_id) {
            try {
              container._leaflet_map = null;
              delete container._leaflet_id;
            } catch (e) {
              // Silent cleanup
            }
          }
        });
      }, 100);
    }
  }

  handleRetry = () => {
    // Clean up any Leaflet containers before retry
    const containers = document.querySelectorAll('.leaflet-container');
    containers.forEach(container => {
      if (container._leaflet_id) {
        try {
          container._leaflet_map = null;
          delete container._leaflet_id;
        } catch (e) {
          // Silent cleanup
        }
      }
    });
    
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-error">
          <h3>Map Loading Error</h3>
          <p>
            {this.state.error?.message?.includes('_leaflet_pos') 
              ? 'Map initialization failed. This sometimes happens due to timing issues.'
              : 'There was an issue loading the map visualization.'
            }
          </p>
          <div className="error-actions">
            <button onClick={this.handleRetry} className="retry-btn">
              Retry Map Loading
            </button>
            <button onClick={() => {
              this.handleRetry();
              setTimeout(() => window.location.reload(), 100);
            }} className="refresh-btn">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AgriculturePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fileLimit, setFileLimit] = useState(15);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Check for subscription status
  useEffect(() => {
    if (user && user.subscription && user.subscription.status === 'active') {
      setHasSubscription(true);
    }
  }, [user]);
  
  // Check for success message
  useEffect(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location.state]);

  const handleSubscription = (plan) => {
    navigate('/subscription', { 
      state: { 
        selectedPlan: plan,
        redirectAfter: '/agriculture',
        domain: 'Agriculture'
      }
    });
  };

  // Handle map readiness when switching to earth tab
  useEffect(() => {
    if (activeTab === 'earth') {
      setMapReady(false);
      setMapError(null);
      
      // Clear any existing Leaflet containers
      const containers = document.querySelectorAll('.leaflet-container');
      containers.forEach(container => {
        if (container._leaflet_id) {
          try {
            container._leaflet_map = null;
            delete container._leaflet_id;
          } catch (e) {
            console.warn('Error cleaning up map container:', e);
          }
        }
      });
      
      // Longer delay to ensure proper cleanup and re-initialization
      const timer = setTimeout(() => {
        try {
          setMapReady(true);
        } catch (e) {
          console.error('Error setting map ready:', e);
          setMapError('Failed to initialize map');
        }
      }, 500);
      
      return () => {
        clearTimeout(timer);
        // Additional cleanup when unmounting
        const containers = document.querySelectorAll('.leaflet-container');
        containers.forEach(container => {
          if (container._leaflet_id) {
            try {
              container._leaflet_map = null;
              delete container._leaflet_id;
            } catch (e) {
              // Silent cleanup
            }
          }
        });
      };
    } else {
      // Reset map state when leaving earth tab
      setMapReady(false);
      setMapError(null);
    }
  }, [activeTab]);
  
  const loadSampleData = async (category = selectedCategory, limit = fileLimit) => {
    setLoading(true);
    try {
      await getDomainSampleData('agriculture', category, limit);
      // The data will be loaded by the AgricultureCloudData component
    } catch (err) {
      console.error('Error fetching sample data:', err);
      setError(err.message || 'Failed to load sample data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchDomainData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          navigate('/'); // Redirect to home/login page
          return;
        }
        
        // Check if token is expired
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
          console.log('Token expired, redirecting to login');
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('user');
          setLoading(false);
          navigate('/');
          return;
        }
        
        // Fetch all data in parallel
        const [metadataResult, analyticsResult] = await Promise.all([
          getDomainMetadata('agriculture'),
          getDomainAnalytics('agriculture')
        ]);
        
        setMetadata(metadataResult);
        setAnalytics(analyticsResult);
      } catch (err) {
        console.error('Error fetching agriculture domain data:', err);
        
        // Special handling for authentication errors
        if (err.message && (
            err.message.includes('Invalid or expired token') || 
            err.message.includes('Authentication required') ||
            err.message.includes('403') ||
            err.message.includes('401'))) {
          setError('Authentication error. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setError(err.message || 'Failed to load agriculture data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDomainData();
  }, [navigate, fileLimit]);

  // Global error handler for Leaflet errors
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.error && event.error.message && event.error.message.includes('_leaflet_pos')) {
        console.warn('Global Leaflet error caught, attempting recovery...');
        event.preventDefault();
        
        // Clean up Leaflet containers
        setTimeout(() => {
          const containers = document.querySelectorAll('.leaflet-container');
          containers.forEach(container => {
            if (container._leaflet_id) {
              try {
                container._leaflet_map = null;
                delete container._leaflet_id;
              } catch (e) {
                // Silent cleanup
              }
            }
          });
          
          // If we're on the earth tab, reset the map
          if (activeTab === 'earth') {
            setMapError('Map error detected. Please try refreshing the page or switching tabs.');
            setMapReady(false);
          }
        }, 100);
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, [activeTab]);

  // If user doesn't have access to this domain
  if (user && user.domains && !user.domains.includes('Agriculture')) {
    return (
      <div className="domain-page">
        <div className="space-background">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          <div className="nebula nebula-1"></div>
          <div className="nebula nebula-2"></div>
        </div>
        
        <div className="domain-access-denied">
          <h2>Access Restricted</h2>
          <p>You don't have access to the Agriculture domain.</p>
          <button 
            className="domain-back-button"
            onClick={() => navigate('/home')}
          >
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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

      {/* Success Message */}
      {showSuccessMessage && location.state?.message && (
        <div className="success-message">
          <div className="success-content">
            <CheckCircle size={20} />
            <span>{location.state.message}</span>
            <button 
              className="success-close"
              onClick={() => setShowSuccessMessage(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Domain Header */}
      <header className="domain-header agriculture-theme">
        <div className="domain-header-content">
          <div className="domain-icon">🌾</div>
          <div className="domain-title-container">
            <h1 className="domain-title">Agriculture Domain</h1>
            <p className="domain-description">
              Track global crop health, agricultural patterns, and land use changes 
              to optimize farming practices and food security initiatives.
            </p>
          </div>
        </div>
      </header>

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
          <li className={activeTab === 'cloud-data' ? 'active' : ''}>
            <button onClick={() => setActiveTab('cloud-data')}>
              <Database size={18} /> Cloud Data
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
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading agriculture data...</p>
          </div>
        )}
        
        {error && (
          <div className="error-container">
            <p>Error: {error}</p>
            {error.includes('Authentication') || error.includes('session') || error.includes('log in') ? (
              <button onClick={() => navigate('/')}>Log In</button>
            ) : (
              <button onClick={() => window.location.reload()}>Try Again</button>
            )}
          </div>
        )}
        
        {!loading && !error && activeTab === 'dashboard' && (
          <div className="dashboard-container">
            <h2 className="section-title">Agriculture Dashboard</h2>
            
            <div className="stat-cards">
              <div className="stat-card">
                <h3>Total Datasets</h3>
                <div className="stat-value">{metadata?.totalFiles || 0}</div>
                <p>Available agriculture datasets</p>
              </div>
              
              <div className="stat-card">
                <h3>Data Categories</h3>
                <div className="stat-value">{metadata?.categories?.length || 0}</div>
                <p>Different types of agricultural data</p>
              </div>
              
              <div className="stat-card">
                <h3>Latest Update</h3>
                <div className="stat-value">
                  {metadata?.categories?.length > 0 
                    ? new Date(Math.max(...metadata.categories.map(c => new Date(c.lastUpdated)))).toLocaleDateString() 
                    : 'N/A'
                  }
                </div>
                <p>Most recent data refresh</p>
              </div>
            </div>
            
            {analytics && (
              <div className="analytics-section">
                <h3>Crop Health Index</h3>
                <div className="bar-chart">
                  {analytics.crops?.map((crop, index) => (
                    <div className="chart-item" key={crop}>
                      <div className="chart-label">{crop}</div>
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar" 
                          style={{width: `${analytics.healthIndices[index]}%`}}
                        ></div>
                        <span className="chart-value">{analytics.healthIndices[index]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <h3>Regional Agricultural Data</h3>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Region</th>
                        <th>Cultivated Area (hectares)</th>
                        <th>Production (tons)</th>
                        <th>Yield (tons/hectare)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.regionalData || {}).map(([region, data]) => (
                        <tr key={region}>
                          <td>{region}</td>
                          <td>{data.area?.toLocaleString()}</td>
                          <td>{data.production?.toLocaleString()}</td>
                          <td>{data.production && data.area ? (data.production / data.area).toFixed(2) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && activeTab === 'earth' && (
          <div className="earth-view-container">
            <h2 className="section-title">Agriculture Earth View</h2>
            
            <div className="earth-visualization-controls">
              <p className="visualization-description">
                Explore global agricultural data with our interactive sector-based Earth visualization. 
                View different agriculture sectors (fertilizers, livestock, crops, trade, etc.), switch between 
                satellite and terrain maps, and click on any country to get comprehensive data from our 78 CSV files.
              </p>
              
              <div className="visualization-tabs">
                <button className="viz-tab active">Global Overview</button>
                <button className="viz-tab">Crop Health</button>
                <button className="viz-tab">Land Classification</button>
              </div>
            </div>
            
            <div className="earth-visualization" style={{ height: '80vh', width: '100%' }}>
              {/* Add error boundary and key for proper re-mounting */}
              <div style={{ height: '100%', width: '100%' }}>
                {mapError ? (
                  <div className="map-error">
                    <p>Error loading map: {mapError}</p>
                    <button onClick={() => {setMapError(null); setActiveTab('dashboard');}}>
                      Go back to Dashboard
                    </button>
                  </div>
                ) : !mapReady ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Preparing map visualization...</p>
                  </div>
                ) : (
                  <MapErrorBoundary onRetry={() => {
                    setMapError(null);
                    setMapReady(false);
                    setTimeout(() => setMapReady(true), 500);
                  }}>
                    <SectorBasedAgricultureMap 
                      key={`earth-view-${activeTab}-${mapReady}-${Date.now()}`}
                      onError={(error) => {
                        console.error('Map component error:', error);
                        setMapError(error.message || 'Map initialization failed');
                      }}
                    />
                  </MapErrorBoundary>
                )}
              </div>
            </div>
            
            <div className="visualization-footer">
              <h3>About This Visualization</h3>
              <p>This Earth view uses data from multiple agricultural sources and provides interactive exploration of global agricultural patterns.</p>
            </div>
          </div>
        )}
        
        {!loading && !error && activeTab === 'cloud-data' && (
          <div className="cloud-data-container">
            <h2 className="section-title">Agriculture Cloud Data</h2>
            {hasSubscription ? (
              <AgricultureCloudData />
            ) : (
              <div className="subscription-required">
                <div className="subscription-notice">
                  <h3>🔒 Premium Feature</h3>
                  <p>Access to real-time cloud data requires a premium subscription.</p>
                  <button 
                    className="upgrade-button"
                    onClick={() => handleSubscription('premium')}
                  >
                    Subscribe for Cloud Data Access
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && activeTab === 'datasets' && (
          <div className="datasets-container">
            <h2 className="section-title">Agriculture Datasets</h2>
            
            <p className="datasets-description">
              Browse our proprietary agriculture datasets stored in Google Cloud Storage. 
              Access to 3 free datasets below, upgrade for full access to all datasets.
            </p>
            
            {/* Free datasets section */}
            <div className="free-datasets-section">
              <h3>� Agriculture Datasets</h3>
              <div className="dataset-filters">
                <div className="filter-group">
                  <label>Limit:</label>
                  <select 
                    value={Math.min(fileLimit, 3)} 
                    onChange={(e) => setFileLimit(parseInt(e.target.value))}
                  >
                    <option value={3}>3 files (Free)</option>
                  </select>
                </div>
                
                <button 
                  onClick={() => loadSampleData(null, 3)}
                  className="load-data-btn"
                >
                  Load Free Sample Data
                </button>
              </div>
              
              <AgricultureCloudData />
            </div>
            
            {/* Locked premium datasets */}
            {!hasSubscription && (
              <div className="premium-datasets-section">
                <h3>🔒 Premium Datasets (Subscription Required)</h3>
                <div className="locked-datasets-grid">
                  <div className="dataset-card locked">
                    <div className="lock-overlay">
                      <div className="lock-icon">🔒</div>
                      <p>Premium Access Required</p>
                    </div>
                    <h4>Advanced Crop Health Analysis</h4>
                    <p>AI-powered crop health indices with NDVI analysis and disease detection patterns</p>
                    <div className="dataset-meta">
                      <span className="dataset-size">📊 500+ files</span>
                      <span className="dataset-updated">🕒 Updated daily</span>
                    </div>
                    <button 
                      className="dataset-download locked-btn"
                      onClick={() => handleSubscription('premium')}
                    >
                      Subscribe to Access
                    </button>
                  </div>
                  
                  <div className="dataset-card locked">
                    <div className="lock-overlay">
                      <div className="lock-icon">🔒</div>
                      <p>Premium Access Required</p>
                    </div>
                    <h4>Global Yield Predictions</h4>
                    <p>Machine learning models for crop yield forecasting across different regions</p>
                    <div className="dataset-meta">
                      <span className="dataset-size">📊 1000+ files</span>
                      <span className="dataset-updated">🕒 Updated weekly</span>
                    </div>
                    <button 
                      className="dataset-download locked-btn"
                      onClick={() => handleSubscription('premium')}
                    >
                      Subscribe to Access
                    </button>
                  </div>
                  
                  <div className="dataset-card locked">
                    <div className="lock-overlay">
                      <div className="lock-icon">🔒</div>
                      <p>Premium Access Required</p>
                    </div>
                    <h4>Climate Impact Models</h4>
                    <p>Climate change impact assessments on agricultural productivity and sustainability</p>
                    <div className="dataset-meta">
                      <span className="dataset-size">📊 750+ files</span>
                      <span className="dataset-updated">🕒 Updated monthly</span>
                    </div>
                    <button 
                      className="dataset-download locked-btn"
                      onClick={() => handleSubscription('premium')}
                    >
                      Subscribe to Access
                    </button>
                  </div>
                  
                  <div className="dataset-card locked">
                    <div className="lock-overlay">
                      <div className="lock-icon">🔒</div>
                      <p>Premium Access Required</p>
                    </div>
                    <h4>Soil Quality Analysis</h4>
                    <p>Comprehensive soil health data including pH, nutrient levels, and organic matter content</p>
                    <div className="dataset-meta">
                      <span className="dataset-size">📊 300+ files</span>
                      <span className="dataset-updated">🕒 Updated bi-weekly</span>
                    </div>
                    <button 
                      className="dataset-download locked-btn"
                      onClick={() => handleSubscription('premium')}
                    >
                      Subscribe to Access
                    </button>
                  </div>
                </div>
                
                <div className="upgrade-prompt">
                  <p>📈 25+ more premium datasets available with subscription</p>
                  <button 
                    className="upgrade-btn"
                    onClick={() => handleSubscription('premium')}
                  >
                    Upgrade for Full Access to All Datasets
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && activeTab === 'reports' && (
          <div className="reports-container">
            <h2 className="section-title">Agriculture Reports</h2>
            
            {hasSubscription ? (
              <div>
                <p>Comprehensive agriculture reports and analytics.</p>
                
                <div className="placeholder-reports">
                  <div className="report-card">
                    <h3>Global Crop Yield 2025</h3>
                    <p>Comprehensive analysis of global crop production</p>
                    <div className="report-meta">
                      <span>PDF • 2.4MB</span>
                      <span>August 15, 2025</span>
                    </div>
                    <button className="download-btn">Download Report</button>
                  </div>
                  
                  <div className="report-card">
                    <h3>Agricultural Land Use Changes</h3>
                    <p>5-year trend analysis of agricultural land utilization</p>
                    <div className="report-meta">
                      <span>PDF • 3.8MB</span>
                      <span>July 22, 2025</span>
                    </div>
                    <button className="download-btn">Download Report</button>
                  </div>
                  
                  <div className="report-card">
                    <h3>Satellite-Based Crop Monitoring</h3>
                    <p>Technical paper on remote sensing applications</p>
                    <div className="report-meta">
                      <span>PDF • 5.1MB</span>
                      <span>June 10, 2025</span>
                    </div>
                    <button className="download-btn">Download Report</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="subscription-required">
                <div className="subscription-notice">
                  <h3>🔒 Premium Feature</h3>
                  <p>Access to comprehensive agriculture reports requires a premium subscription.</p>
                  <div className="preview-content">
                    <h4>Available Reports Include:</h4>
                    <ul>
                      <li>📊 Global Crop Yield Analysis</li>
                      <li>🌍 Agricultural Land Use Trends</li>
                      <li>🛰️ Satellite-Based Crop Monitoring</li>
                      <li>📈 Market Analysis & Forecasting</li>
                      <li>🌱 Sustainability Assessment Reports</li>
                    </ul>
                  </div>
                  <button 
                    className="upgrade-button"
                    onClick={() => handleSubscription('premium')}
                  >
                    Subscribe for Reports Access
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && activeTab === 'monitoring' && (
          <div className="monitoring-container">
            <h2 className="section-title">Agriculture Live Monitoring</h2>
            
            {hasSubscription ? (
              <div>
                <p>Real-time agricultural monitoring across global regions.</p>
                
                <div className="monitoring-placeholder">
                  <div className="monitoring-region">
                    <h3>North America</h3>
                    <div className="monitoring-metrics">
                      <div className="metric">
                        <span className="metric-name">NDVI Index:</span>
                        <span className="metric-value">0.68</span>
                      </div>
                      <div className="metric">
                        <span className="metric-name">Soil Moisture:</span>
                        <span className="metric-value">36%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-name">Precipitation:</span>
                        <span className="metric-value">12mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="monitoring-region">
                    <h3>Europe</h3>
                    <div className="monitoring-metrics">
                      <div className="metric">
                        <span className="metric-name">NDVI Index:</span>
                        <span className="metric-value">0.72</span>
                      </div>
                      <div className="metric">
                        <span className="metric-name">Soil Moisture:</span>
                        <span className="metric-value">41%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-name">Precipitation:</span>
                        <span className="metric-value">8mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="monitoring-region">
                    <h3>Asia</h3>
                    <div className="monitoring-metrics">
                      <div className="metric">
                        <span className="metric-name">NDVI Index:</span>
                        <span className="metric-value">0.65</span>
                      </div>
                      <div className="metric">
                        <span className="metric-name">Soil Moisture:</span>
                        <span className="metric-value">33%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-name">Precipitation:</span>
                        <span className="metric-value">15mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="subscription-required">
                <div className="subscription-notice">
                  <h3>🔒 Premium Feature</h3>
                  <p>Access to real-time agricultural monitoring requires a premium subscription.</p>
                  <div className="preview-content">
                    <h4>Live Monitoring Features Include:</h4>
                    <ul>
                      <li>📊 Real-time NDVI Index tracking</li>
                      <li>💧 Soil Moisture monitoring</li>
                      <li>🌧️ Precipitation data</li>
                      <li>🌡️ Temperature monitoring</li>
                      <li>📱 Mobile alerts and notifications</li>
                      <li>📈 Historical trend analysis</li>
                    </ul>
                  </div>
                  <button 
                    className="upgrade-button"
                    onClick={() => handleSubscription('premium')}
                  >
                    Subscribe for Live Monitoring Access
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgriculturePage;
