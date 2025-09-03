import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDomainMetadata, getDomainAnalytics, getDomainSampleData } from '../services/domainService';
import { hasActiveSubscription } from '../utils/subscriptionUtils';
import { ChevronLeft, BarChart2, Globe, Database, FileText, Activity, CheckCircle, X } from 'lucide-react';
import './SpaceAnimations.css';
import './DomainPage.css';
import AgricultureCloudData from '../components/AgricultureCloudData';
import SectorBasedAgricultureMap from '../components/SectorBasedAgricultureMap';

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
  
  // Check for subscription status
  useEffect(() => {
    console.log('Agriculture: Checking subscription status. User:', user);
    const subscriptionStatus = hasActiveSubscription(user);
    setHasSubscription(subscriptionStatus);
  }, [user]);
  
  // Check for success message from subscription completion
  useEffect(() => {
    if (location.state?.message) {
      console.log('Agriculture: Received subscription success message:', location.state.message);
      setShowSuccessMessage(true);
      setHasSubscription(true); // Immediately update subscription status
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location.state]);
  
  const loadSampleData = async (category = selectedCategory, limit = fileLimit) => {
    setLoading(true);
    try {
      await getDomainSampleData('agriculture', category, limit);
    } catch (err) {
      console.error('Error fetching sample data:', err);
      setError(err.message || 'Failed to load sample data');
    } finally {
      setLoading(false);
    }
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

  const refreshSubscriptionStatus = () => {
    console.log('Manually refreshing subscription status...');
    const subscriptionStatus = hasActiveSubscription(user);
    setHasSubscription(subscriptionStatus);
    
    if (subscriptionStatus) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };
  
  useEffect(() => {
    const fetchDomainData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please login.');
          setLoading(false);
          return;
        }

        const [metadataResult, analyticsResult] = await Promise.all([
          getDomainMetadata('agriculture'),
          getDomainAnalytics('agriculture')
        ]);
        
        setMetadata(metadataResult);
        setAnalytics(analyticsResult);
      } catch (err) {
        console.error('Error fetching domain data:', err);
        setError(err.message || 'Failed to load domain data');
      } finally {
        setLoading(false);
      }
    };

    fetchDomainData();
  }, []);

  const handleGoBack = () => {
    navigate('/');
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
        onClick={handleGoBack}
        className="back-button"
      >
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message">
          <CheckCircle size={20} />
          <span>Subscription activated! You now have access to all Agriculture features.</span>
          <button onClick={() => setShowSuccessMessage(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      <main className="domain-content">
        <header className="domain-header">
          <h1 className="domain-title">
            <Activity className="domain-icon" />
            Agriculture Data Platform
          </h1>
          <p className="domain-description">
            Comprehensive agricultural data analysis, crop monitoring, and land use insights
          </p>
        </header>

        <nav className="domain-tabs">
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
            <li className={activeTab === 'cloud-data' ? 'active' : ''}>
              <button onClick={() => setActiveTab('cloud-data')}>
                <Database size={18} /> Cloud Data
              </button>
            </li>
            <li className={activeTab === 'datasets' ? 'active' : ''}>
              <button onClick={() => setActiveTab('datasets')}>
                <FileText size={18} /> Datasets
              </button>
            </li>
          </ul>
        </nav>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading agriculture data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* Dashboard Tab */}
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
            
            {/* Subscription Prompt Section */}
            {!hasSubscription && (
              <div className="subscription-prompt-section">
                <div className="subscription-banner">
                  <h3>🌟 Want to access the full Agriculture data?</h3>
                  <p>Unlock premium features including:</p>
                  <ul className="feature-list">
                    <li>✓ Full Earth visualization with all satellite layers</li>
                    <li>✓ Access to all 78 agriculture datasets</li>
                    <li>✓ Real-time crop health monitoring</li>
                    <li>✓ Advanced analytics and reports</li>
                    <li>✓ Historical data and trends</li>
                    <li>✓ Export capabilities</li>
                  </ul>
                  <div className="subscription-buttons">
                    <button 
                      className="subscribe-btn basic"
                      onClick={() => handleSubscription('basic')}
                    >
                      Subscribe Basic - $9.99/month
                    </button>
                    <button 
                      className="subscribe-btn premium"
                      onClick={() => handleSubscription('premium')}
                    >
                      Subscribe Premium - $19.99/month
                    </button>
                  </div>
                  <div className="already-subscribed">
                    <p>Already subscribed? 
                      <button 
                        className="refresh-btn" 
                        onClick={refreshSubscriptionStatus}
                        style={{ marginLeft: '8px', padding: '4px 12px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Refresh Status
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Earth View Tab */}
        {!loading && !error && activeTab === 'earth' && (
          <div className="earth-view-container">
            <h2 className="section-title">Agriculture Earth View</h2>
            
            {hasSubscription ? (
              <>
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
                
                <div className="earth-visualization" style={{ height: '80vh' }}>
                  <SectorBasedAgricultureMap />
                </div>
                
                <div className="visualization-footer">
                  <h3>About This Visualization</h3>
                  <p>This Earth view uses data from multiple agricultural sources and provides interactive exploration of global agricultural patterns.</p>
                </div>
              </>
            ) : (
              <div className="subscription-message">
                <h3>🔒 Premium Feature - Earth View requires a subscription</h3>
                <p>Access our advanced Earth visualization with full satellite imagery and interactive data layers.</p>
                <button 
                  className="subscribe-btn premium"
                  onClick={() => handleSubscription('premium')}
                >
                  Subscribe Now - $19.99/month
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Cloud Data Tab */}
        {!loading && !error && activeTab === 'cloud-data' && (
          <div className="cloud-data-container">
            <h2 className="section-title">Agriculture Cloud Data</h2>
            
            {hasSubscription ? (
              <AgricultureCloudData />
            ) : (
              <div className="subscription-message">
                <h3>🔒 Premium Feature - Cloud Data Access requires a subscription</h3>
                <p>Get access to our comprehensive agriculture datasets stored in Google Cloud.</p>
                <button 
                  className="subscribe-btn premium"
                  onClick={() => handleSubscription('premium')}
                >
                  Subscribe Now - $19.99/month
                </button>
              </div>
            )}
          </div>
        )}

        {/* Datasets Tab */}
        {!loading && !error && activeTab === 'datasets' && (
          <div className="datasets-container">
            <h2 className="section-title">Agriculture Datasets</h2>
            
            {hasSubscription ? (
              <>
                <p className="datasets-description">
                  Browse our proprietary agriculture datasets stored in Google Cloud Storage. 
                  These datasets include crop health indices, land use classifications, 
                  yield statistics, and more.
                </p>
                
                <div className="dataset-filters">
                  <div className="filter-group">
                    <label>Category:</label>
                    <select 
                      value={selectedCategory || ''} 
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                    >
                      <option value="">All Categories</option>
                      {metadata?.categories?.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Limit:</label>
                    <select 
                      value={fileLimit} 
                      onChange={(e) => setFileLimit(parseInt(e.target.value))}
                    >
                      <option value={5}>5 files</option>
                      <option value={10}>10 files</option>
                      <option value={15}>15 files</option>
                      <option value={25}>25 files</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => loadSampleData(selectedCategory, fileLimit)}
                    className="load-data-btn"
                  >
                    Load Sample Data
                  </button>
                </div>
                
                <AgricultureCloudData />
              </>
            ) : (
              <div className="subscription-message">
                <h3>🔒 Premium Feature - Dataset Access requires a subscription</h3>
                <p>Access our comprehensive agriculture datasets and analysis tools.</p>
                <button 
                  className="subscribe-btn premium"
                  onClick={() => handleSubscription('premium')}
                >
                  Subscribe Now - $19.99/month
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgriculturePage;
