import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SignupModal = ({ onClose, showLogin }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+91', // default country code
    phone: '',
    email: '',
    password: '',
    verificationCode: '',
    termsAccepted: false,
    privacyAccepted: false,
    domains: [] // Changed from single domain to array of domains
  });

  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.domains.length === 0) newErrors.domains = 'Please select at least one domain';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the Terms of Service';
    if (!formData.privacyAccepted) newErrors.privacyAccepted = 'You must accept the Privacy Policy';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle domains separately (multiple selection)
    if (name === 'domains') {
      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
      setFormData(prev => ({ ...prev, domains: selectedOptions }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      if (formData.verificationCode.length === 6) {
        // Call the actual verify-otp API endpoint
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.verificationCode
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          setVerificationStatus('Email verified successfully!');
          setIsVerified(true);
        } else {
          setVerificationStatus(data.message || 'Verification failed. Please check your code.');
          setIsVerified(false);
        }
      } else {
        setVerificationStatus('Please enter a 6-digit code');
        setIsVerified(false);
      }
    } catch (error) {
      setVerificationStatus('Verification failed. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!showVerification) {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Call backend to register user & send OTP
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          domains: formData.domains,
          phone: formData.countryCode + formData.phone
        }),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (response.ok) {
        setShowVerification(true);
        setVerificationStatus('OTP sent to your email!');
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to register. Try again.');
    } finally {
      setIsLoading(false);
    }
  } else {
    // After OTP verification
    if (!isVerified) {
      alert('Please verify your phone/email first');
      return;
    }

    setIsLoading(true);
    try {
      // Log the user in automatically after successful OTP verification
      await login(formData.email, formData.password);
      
      // Close the signup modal
      onClose();
      
      // Redirect based on selected domains
      if (formData.domains.includes('Agriculture') && formData.domains.length === 1) {
        // If only Agriculture is selected, redirect to Agriculture page with dashboard
        setTimeout(() => {
          navigate('/agriculture');
        }, 500);
      } else {
        // For other domains or multiple domains, redirect to home
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
      
    } catch (error) {
      console.error('Auto-login error:', error);
      // If auto-login fails, ask user to login manually
      alert('Registration successful! Please login with your credentials.');
      showLogin && showLogin();
      onClose();
    } finally {
      setIsLoading(false);
    }
  }
};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}
      <div style={{
        backgroundColor: '#0a192f',
        padding: '2rem',
        borderRadius: '10px',
        width: '400px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(79, 195, 247, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        transform: 'scale(1)',
        transition: 'transform 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#4fc3f7', margin: 0, fontSize: '1.8rem' }}>
            {showVerification ? 'Verify Email' : 'Create Account'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#f87171'}
            onMouseLeave={(e) => e.target.style.color = 'white'}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!showVerification ? (
            <>
              {/* Full Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '5px',
                    border: errors.name ? '1px solid #f87171' : '1px solid rgba(79, 195, 247, 0.3)',
                    backgroundColor: 'rgba(10, 25, 47, 0.7)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter your full name"
                />
                {errors.name && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.name}</p>}
              </div>

              {/* Phone with Country Code */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Phone Number
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    style={{
                      padding: '0.8rem',
                      borderRadius: '5px',
                      border: '1px solid rgba(79, 195, 247, 0.3)',
                      backgroundColor: 'rgba(10, 25, 47, 0.7)',
                      color: 'white',
                      fontSize: '1rem',
                      width: '35%'
                    }}
                  >
                    <option value="+91">India (+91)</option>
                    <option value="+1">USA (+1)</option>
                    <option value="+44">UK (+44)</option>
                    <option value="+61">Australia (+61)</option>
                    <option value="+81">Japan (+81)</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    style={{
                      width: '65%',
                      padding: '0.8rem',
                      borderRadius: '5px',
                      border: '1px solid rgba(79, 195, 247, 0.3)',
                      backgroundColor: 'rgba(10, 25, 47, 0.7)',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '5px',
                    border: errors.email ? '1px solid #f87171' : '1px solid rgba(79, 195, 247, 0.3)',
                    backgroundColor: 'rgba(10, 25, 47, 0.7)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter your email"
                />
                {errors.email && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '5px',
                    border: errors.password ? '1px solid #f87171' : '1px solid rgba(79, 195, 247, 0.3)',
                    backgroundColor: 'rgba(10, 25, 47, 0.7)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  placeholder="Create a password (min. 8 characters)"
                />
                {errors.password && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.password}</p>}
              </div>

              {/* Domain Dropdown - Multiple Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Select Domains * (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  name="domains"
                  multiple
                  value={formData.domains}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '5px',
                    border: errors.domains ? '1px solid #f87171' : '1px solid rgba(79, 195, 247, 0.3)',
                    backgroundColor: 'rgba(10, 25, 47, 0.7)',
                    color: 'white',
                    fontSize: '1rem',
                    minHeight: '120px' // Provide enough height to see multiple options
                  }}
                >
                  <option value="Agriculture">Agriculture</option>
                  <option value="Disaster">Disaster</option>
                  <option value="Marine">Marine</option>
                  <option value="Weather">Weather</option>
                  <option value="Aviation">Aviation</option>
                  <option value="Environment">Environment</option>
                  <option value="Forestry">Forestry</option>
                  <option value="Urban Planning">Urban Planning</option>
                </select>
                {errors.domains && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.domains}</p>}
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                  Hold Ctrl (Windows) or Cmd (Mac) key to select multiple domains
                </p>
              </div>

              {/* Terms + Privacy */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="termsCheckbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    required
                    style={{ marginRight: '10px', marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="termsCheckbox" style={{ color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>
                    I agree to the <a href="/terms" style={{ color: '#4fc3f7' }} target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  </label>
                </div>
                {errors.termsAccepted && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.termsAccepted}</p>}

                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    id="privacyCheckbox"
                    name="privacyAccepted"
                    checked={formData.privacyAccepted}
                    onChange={handleInputChange}
                    required
                    style={{ marginRight: '10px', marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="privacyCheckbox" style={{ color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>
                    I agree to the <a href="/privacy" style={{ color: '#4fc3f7' }} target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                  </label>
                </div>
                {errors.privacyAccepted && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.privacyAccepted}</p>}
              </div>
            </>
          ) : (
            <>
              {/* Verification Section */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(79, 195, 247, 0.1)', borderRadius: '5px', borderLeft: '4px solid #4fc3f7' }}>
                <p style={{ color: 'white', margin: 0, fontSize: '0.9rem' }}>
                  We've sent a verification code to <strong>{formData.email}</strong>. Please enter it below.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Verification Code *
                </label>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '5px',
                    border: '1px solid rgba(79, 195, 247, 0.3)',
                    backgroundColor: 'rgba(10, 25, 47, 0.7)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter 6-digit code"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    backgroundColor: '#4fc3f7',
                    color: '#0a192f',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    transition: 'background-color 0.3s',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>
                {verificationStatus && <p style={{ color: isVerified ? '#4ade80' : '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>{verificationStatus}</p>}
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.8rem',
              backgroundColor: isVerified ? '#4ade80' : '#255b91',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'all 0.3s',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Processing...' : showVerification ? (isVerified ? 'Complete Sign Up' : 'Continue') : 'Sign Up'}
          </button>

          {!showVerification && (
            <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { onClose(); showLogin(); }}
                style={{ background: 'none', border: 'none', color: '#4fc3f7', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.9rem', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.color = '#3ab0db'}
                onMouseLeave={(e) => e.target.style.color = '#4fc3f7'}
              >
                Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignupModal;
