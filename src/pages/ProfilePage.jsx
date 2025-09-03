import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, ChevronLeft, Edit, X, Check, Plus } from 'lucide-react';
import './SpaceAnimations.css';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Initialize edited user data when entering edit mode
  const startEditing = () => {
    setEditedUser({
      name: user.name || '',
      phone: user.phone || '',
      domains: [...(user.domains || [])],
    });
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedUser(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addDomain = () => {
    if (newDomain.trim() && !editedUser.domains.includes(newDomain.trim())) {
      setEditedUser(prev => ({
        ...prev,
        domains: [...prev.domains, newDomain.trim()]
      }));
      setNewDomain('');
    }
  };

  const removeDomain = (index) => {
    setEditedUser(prev => ({
      ...prev,
      domains: prev.domains.filter((_, i) => i !== index)
    }));
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      await updateProfile(editedUser);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>User not authenticated</h2>
          <p style={styles.message}>Please log in to view your profile.</p>
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
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      <div style={styles.profileCard}>
        {success && (
          <div style={styles.successMessage}>
            Profile updated successfully!
          </div>
        )}
        
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div style={styles.avatarContainer}>
          <div style={styles.avatar}>
            <User size={64} color="#fff" />
          </div>
        </div>
        
        <div style={styles.headerWithEdit}>
          <h2 style={styles.profileTitle}>User Profile</h2>
          {!isEditing && (
            <button 
              style={styles.editButton}
              onClick={startEditing}
            >
              <Edit size={18} /> Edit
            </button>
          )}
        </div>
        
        {!isEditing ? (
          // View mode
          <>
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Name</span>
                <span style={styles.value}>{user.name || 'Not provided'}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.label}>Email</span>
                <span style={styles.value}>{user.email}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.label}>Phone</span>
                <span style={styles.value}>{user.phone || 'Not provided'}</span>
              </div>
            </div>
            
            <div style={styles.domainSection}>
              <h3 style={styles.sectionTitle}>Selected Domains</h3>
              {user.domains && user.domains.length > 0 ? (
                <div style={styles.domainContainer}>
                  {user.domains.map((domain, index) => (
                    <div key={index} style={styles.domainBadge}>
                      {domain}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noDomains}>No domains selected</p>
              )}
            </div>
            
            <div style={styles.actionSection}>
              <button 
                style={{...styles.actionButton, backgroundColor: 'rgba(79, 195, 247, 0.2)'}} 
                onClick={() => navigate('/home')}
              >
                Return to Dashboard
              </button>
            </div>
          </>
        ) : (
          // Edit mode
          <>
            <div style={styles.infoSection}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Name</label>
                <input 
                  type="text"
                  name="name"
                  style={styles.input}
                  value={editedUser.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Email</label>
                <input 
                  type="text"
                  style={{...styles.input, backgroundColor: 'rgba(30, 30, 45, 0.6)'}}
                  value={user.email}
                  disabled
                />
                <small style={styles.inputHelp}>Email cannot be changed</small>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Phone</label>
                <input 
                  type="text"
                  name="phone"
                  style={styles.input}
                  value={editedUser.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            
            <div style={styles.domainSection}>
              <h3 style={styles.sectionTitle}>Selected Domains</h3>
              <div style={styles.domainEditContainer}>
                {editedUser.domains.map((domain, index) => (
                  <div key={index} style={styles.domainEditBadge}>
                    {domain}
                    <button 
                      style={styles.removeDomainButton}
                      onClick={() => removeDomain(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div style={styles.addDomainGroup}>
                <input 
                  type="text"
                  style={styles.input}
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Add new domain"
                  onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                />
                <button 
                  style={styles.addDomainButton}
                  onClick={addDomain}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
            
            <div style={styles.actionSection}>
              <button 
                style={{...styles.actionButton, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336'}} 
                onClick={cancelEditing}
              >
                <X size={18} /> Cancel
              </button>
              <button 
                style={{...styles.actionButton, backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50'}} 
                onClick={saveChanges}
                disabled={loading}
              >
                {loading ? 'Saving...' : <><Check size={18} /> Save Changes</>}
              </button>
            </div>
          </>
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
  profileCard: {
    backgroundColor: 'rgba(30, 30, 45, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '30px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(79, 195, 247, 0.3)',
    position: 'relative',
    zIndex: 5,
  },
  avatarContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  avatar: {
    width: '100px',
    height: '100px',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(79, 195, 247, 0.5)',
  },
  headerWithEdit: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  profileTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    color: '#2196f3',
    border: '1px solid rgba(33, 150, 243, 0.3)',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  infoSection: {
    marginBottom: '30px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  label: {
    color: '#b0b0b0',
    fontWeight: '500',
  },
  value: {
    color: 'white',
    fontWeight: '500',
  },
  domainSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: '15px',
  },
  domainContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  domainBadge: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    color: '#4fc3f7',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(79, 195, 247, 0.3)',
  },
  domainEditContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '15px',
  },
  domainEditBadge: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    color: '#4fc3f7',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(79, 195, 247, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  removeDomainButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#f44336',
    border: 'none',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    padding: 0,
    cursor: 'pointer',
    marginLeft: '4px',
  },
  addDomainGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  addDomainButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  noDomains: {
    color: '#b0b0b0',
    fontStyle: 'italic',
  },
  actionSection: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 24px',
    borderRadius: '6px',
    border: '1px solid rgba(79, 195, 247, 0.5)',
    color: '#4fc3f7',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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
  inputGroup: {
    marginBottom: '20px',
  },
  inputLabel: {
    display: 'block',
    marginBottom: '8px',
    color: '#b0b0b0',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(50, 50, 70, 0.3)',
    border: '1px solid rgba(79, 195, 247, 0.3)',
    borderRadius: '6px',
    padding: '12px',
    color: 'white',
    fontSize: '16px',
  },
  inputHelp: {
    color: '#b0b0b0',
    fontSize: '12px',
    marginTop: '5px',
  },
  successMessage: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorMessage: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    border: '1px solid rgba(244, 67, 54, 0.3)',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '500',
  },
};

export default ProfilePage;
