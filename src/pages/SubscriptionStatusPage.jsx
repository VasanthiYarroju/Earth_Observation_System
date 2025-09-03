import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  Clock,
  Check,
  X,
  Star,
  Zap,
  Globe
} from 'lucide-react';
import { hasActiveSubscription, getSubscriptionDetails, getSubscriptionPlanName } from '../utils/subscriptionUtils';
import './SpaceAnimations.css';

const SubscriptionStatusPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>User not authenticated</h2>
          <p style={styles.message}>Please log in to view your subscription status.</p>
          <button 
            style={styles.button} 
            onClick={() => navigate('/earth')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const hasSubscription = hasActiveSubscription(user);
  const subscription = getSubscriptionDetails(user);
  const planName = getSubscriptionPlanName(user);

  return (
    <div style={styles.container}>
      {/* Space Background */}
      <div className="space-background">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
        
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
        <div className="nebula nebula-3"></div>
        <div className="nebula nebula-4"></div>
        
        <div className="floating-planet planet-1"></div>
        <div className="floating-planet planet-2"></div>
        <div className="floating-planet planet-3"></div>
      </div>

      {/* Back Button */}
      <button 
        onClick={() => navigate('/home')} 
        style={styles.backButton}
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div style={styles.subscriptionCard}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <Crown size={48} color="#ffc107" />
          </div>
          <h1 style={styles.pageTitle}>Subscription Status</h1>
          <p style={styles.pageSubtitle}>Manage your Earth Observation System subscription</p>
        </div>

        {hasSubscription ? (
          <div style={styles.activeSubscription}>
            {/* Status Header */}
            <div style={styles.statusHeader}>
              <div style={styles.statusBadge}>
                <CheckCircle size={20} color="#4caf50" />
                <span style={styles.statusText}>Active Subscription</span>
              </div>
              <div style={styles.planBadge}>
                <Crown size={16} />
                {planName}
              </div>
            </div>

            {/* Subscription Details */}
            <div style={styles.detailsSection}>
              <h3 style={styles.sectionTitle}>Subscription Details</h3>
              
              <div style={styles.detailsGrid}>
                <div style={styles.detailCard}>
                  <div style={styles.detailIcon}>
                    <Star size={24} color="#ffc107" />
                  </div>
                  <div style={styles.detailContent}>
                    <span style={styles.detailLabel}>Plan</span>
                    <span style={styles.detailValue}>{planName}</span>
                  </div>
                </div>

                {subscription?.billingCycle && (
                  <div style={styles.detailCard}>
                    <div style={styles.detailIcon}>
                      <Calendar size={24} color="#2196f3" />
                    </div>
                    <div style={styles.detailContent}>
                      <span style={styles.detailLabel}>Billing</span>
                      <span style={styles.detailValue}>
                        {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                      </span>
                    </div>
                  </div>
                )}

                {subscription?.price !== undefined && (
                  <div style={styles.detailCard}>
                    <div style={styles.detailIcon}>
                      <DollarSign size={24} color="#4caf50" />
                    </div>
                    <div style={styles.detailContent}>
                      <span style={styles.detailLabel}>Price</span>
                      <span style={styles.detailValue}>
                        {subscription.price === 0 ? 'Free' : `$${subscription.price}/${subscription.billingCycle || 'month'}`}
                      </span>
                    </div>
                  </div>
                )}

                {subscription?.startDate && (
                  <div style={styles.detailCard}>
                    <div style={styles.detailIcon}>
                      <Clock size={24} color="#ff9800" />
                    </div>
                    <div style={styles.detailContent}>
                      <span style={styles.detailLabel}>Started</span>
                      <span style={styles.detailValue}>
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features Section */}
            {subscription?.features && subscription.features.length > 0 && (
              <div style={styles.featuresSection}>
                <h3 style={styles.sectionTitle}>
                  <Zap size={20} style={{ marginRight: '8px' }} />
                  Included Features
                </h3>
                <div style={styles.featuresList}>
                  {subscription.features.map((feature, index) => (
                    <div key={index} style={styles.featureItem}>
                      <CheckCircle size={16} color="#4caf50" />
                      <span style={styles.featureText}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actionSection}>
              <button 
                style={styles.primaryButton}
                onClick={() => navigate('/subscription')}
              >
                <Shield size={16} style={{ marginRight: '8px' }} />
                Manage Subscription
              </button>
              <button 
                style={styles.secondaryButton}
                onClick={() => navigate('/agriculture')}
              >
                <Globe size={16} style={{ marginRight: '8px' }} />
                Access Agriculture Data
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.inactiveSubscription}>
            {/* No Subscription State */}
            <div style={styles.noSubscriptionIcon}>
              <AlertCircle size={64} color="#ff9800" />
            </div>
            
            <div style={styles.noSubscriptionContent}>
              <h2 style={styles.noSubscriptionTitle}>No Active Subscription</h2>
              <p style={styles.noSubscriptionMessage}>
                Unlock the full potential of Earth Observation System with premium features including:
              </p>
              
              <div style={styles.benefitsList}>
                <div style={styles.benefitItem}>
                  <Check size={16} color="#4caf50" />
                  <span>High-resolution agriculture data</span>
                </div>
                <div style={styles.benefitItem}>
                  <Check size={16} color="#4caf50" />
                  <span>Historical analysis and trends</span>
                </div>
                <div style={styles.benefitItem}>
                  <Check size={16} color="#4caf50" />
                  <span>Advanced data export capabilities</span>
                </div>
                <div style={styles.benefitItem}>
                  <Check size={16} color="#4caf50" />
                  <span>Priority customer support</span>
                </div>
                <div style={styles.benefitItem}>
                  <Check size={16} color="#4caf50" />
                  <span>API access for integrations</span>
                </div>
              </div>
            </div>

            <div style={styles.upgradeSection}>
              <button 
                style={styles.upgradeButton}
                onClick={() => navigate('/subscription')}
              >
                <Crown size={20} style={{ marginRight: '8px' }} />
                Upgrade Now
              </button>
              <p style={styles.upgradeNote}>
                Choose from flexible plans starting at $29/month
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    background: 'linear-gradient(to bottom, #000000, #0a0f1c)',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    color: '#4fc3f7',
    border: '1px solid rgba(79, 195, 247, 0.5)',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    zIndex: 10,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(30, 30, 45, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '30px',
    width: '100%',
    maxWidth: '800px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(79, 195, 247, 0.3)',
    position: 'relative',
    zIndex: 5,
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  headerIcon: {
    marginBottom: '16px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#b0b0b0',
    lineHeight: '1.5',
  },
  activeSubscription: {
    width: '100%',
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(76, 175, 80, 0.2)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4caf50',
  },
  planBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    color: '#ffc107',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid rgba(255, 193, 7, 0.3)',
  },
  detailsSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  detailCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(50, 50, 70, 0.3)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(79, 195, 247, 0.2)',
  },
  detailIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: '8px',
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#b0b0b0',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '16px',
    color: 'white',
    fontWeight: '600',
    marginTop: '2px',
  },
  featuresSection: {
    marginBottom: '30px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: '6px',
    border: '1px solid rgba(76, 175, 80, 0.1)',
  },
  featureText: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
  },
  actionSection: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    color: '#2196f3',
    border: '1px solid rgba(33, 150, 243, 0.5)',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4caf50',
    border: '1px solid rgba(76, 175, 80, 0.5)',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  inactiveSubscription: {
    textAlign: 'center',
    width: '100%',
  },
  noSubscriptionIcon: {
    marginBottom: '24px',
  },
  noSubscriptionContent: {
    marginBottom: '32px',
  },
  noSubscriptionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: '16px',
  },
  noSubscriptionMessage: {
    fontSize: '16px',
    color: '#b0b0b0',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'left',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'white',
  },
  upgradeSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.05)',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 193, 7, 0.2)',
  },
  upgradeButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    color: '#ffc107',
    border: '1px solid rgba(255, 193, 7, 0.5)',
    borderRadius: '6px',
    padding: '14px 28px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '12px',
  },
  upgradeNote: {
    fontSize: '14px',
    color: '#b0b0b0',
    margin: 0,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 45, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '30px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(79, 195, 247, 0.3)',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '20px',
  },
  message: {
    color: '#b0b0b0',
    marginBottom: '30px',
  },
  button: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    color: '#4fc3f7',
    border: '1px solid rgba(79, 195, 247, 0.5)',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default SubscriptionStatusPage;
