import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Shield, 
  Calendar,
  User,
  DollarSign,
  Clock,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './SubscriptionPage.css';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get selected plan from navigation state or default to researcher
  const selectedPlan = location.state?.plan || 'researcher';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form states
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    company: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    saveCard: false
  });
  
  const [billingType, setBillingType] = useState('monthly');
  
  // Plan configurations
  const plans = {
    explorer: {
      name: 'Explorer',
      subtitle: 'Free Access',
      monthly: 0,
      yearly: 0,
      features: [
        'Limited dataset previews (5/day)',
        'Basic visualizations at 1km resolution',
        'Community forums access',
        'Public datasets only'
      ],
      limitations: [
        'No API access',
        'Limited support',
        'No export capabilities'
      ]
    },
    researcher: {
      name: 'Researcher',
      subtitle: 'Academic/Student',
      monthly: 29,
      yearly: 290,
      features: [
        'Unlimited dataset access',
        'High-resolution imagery (10m)',
        'Data export capabilities',
        '30-day archive access',
        'Basic API access (1000 calls/day)',
        'Email support'
      ],
      limitations: []
    },
    enterprise: {
      name: 'Enterprise',
      subtitle: 'Commercial/Research',
      monthly: 199,
      yearly: 1990,
      features: [
        'Full archive historical access',
        'Highest resolution (sub-meter)',
        'Advanced processing capabilities',
        'Dedicated technical support',
        'Unlimited API access',
        'Custom integration support',
        'Priority data access',
        'White-label options'
      ],
      limitations: []
    }
  };
  
  const currentPlan = plans[selectedPlan];
  const currentPrice = billingType === 'monthly' ? currentPlan.monthly : currentPlan.yearly;
  const savings = billingType === 'yearly' ? (currentPlan.monthly * 12) - currentPlan.yearly : 0;
  
  // Validation functions
  const validateBillingInfo = () => {
    const newErrors = {};
    
    if (!billingInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!billingInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!billingInfo.email.trim()) newErrors.email = 'Email is required';
    if (!billingInfo.address.trim()) newErrors.address = 'Address is required';
    if (!billingInfo.city.trim()) newErrors.city = 'City is required';
    if (!billingInfo.state.trim()) newErrors.state = 'State is required';
    if (!billingInfo.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (billingInfo.email && !emailRegex.test(billingInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePaymentInfo = () => {
    const newErrors = {};
    
    if (!paymentInfo.cardNumber.replace(/\s/g, '')) newErrors.cardNumber = 'Card number is required';
    if (!paymentInfo.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!paymentInfo.cvv) newErrors.cvv = 'CVV is required';
    if (!paymentInfo.nameOnCard.trim()) newErrors.nameOnCard = 'Name on card is required';
    
    // Card number validation (basic length check)
    const cardNum = paymentInfo.cardNumber.replace(/\s/g, '');
    if (cardNum && (cardNum.length < 13 || cardNum.length > 19)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }
    
    // CVV validation
    if (paymentInfo.cvv && (paymentInfo.cvv.length < 3 || paymentInfo.cvv.length > 4)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    // Expiry date validation
    if (paymentInfo.expiryDate) {
      const [month, year] = paymentInfo.expiryDate.split('/');
      const currentDate = new Date();
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      
      if (expiryDate < currentDate) {
        newErrors.expiryDate = 'Card has expired';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Input formatters
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };
  
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };
  
  // Event handlers
  const handleBillingInfoChange = (field, value) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  const handlePaymentInfoChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/gi, '').substring(0, 4);
    }
    
    setPaymentInfo(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  const handleStepNext = () => {
    if (currentStep === 1 && validateBillingInfo()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validatePaymentInfo()) {
      setCurrentStep(3);
    }
  };
  
  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Here you would integrate with actual payment processor
      // like Stripe, PayPal, etc.
      
      // Update user's subscription status in localStorage (temporary solution)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        subscription: {
          plan: currentPlan.name,
          status: 'active',
          startDate: new Date().toISOString(),
          features: currentPlan.features
        }
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Show success
      setCurrentStep(4);
      
      // Redirect based on where they came from
      const redirectPath = location.state?.redirectAfter || '/home';
      const domain = location.state?.domain;
      
      setTimeout(() => {
        if (domain === 'Agriculture') {
          // If they came from Agriculture limited page, redirect to full Agriculture page
          navigate('/agriculture', { 
            state: { 
              message: 'Subscription activated! You now have full access to Agriculture data.',
              plan: currentPlan.name 
            }
          });
        } else {
          // Otherwise redirect to the specified path or home
          navigate(redirectPath, { 
            state: { 
              message: 'Subscription activated successfully!',
              plan: currentPlan.name 
            }
          });
        }
      }, 3000);
      
    } catch (error) {
      setErrors({ submit: 'Payment processing failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getCardType = (number) => {
    const num = number.replace(/\s/g, '');
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6/.test(num)) return 'discover';
    return 'generic';
  };
  
  return (
    <div className="subscription-page">
      {/* Header */}
      <div className="subscription-header">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
        
        <div className="header-title">
          <h1>Complete Your Subscription</h1>
          <p>Secure checkout for {currentPlan.name} plan</p>
        </div>
        
        <div className="security-badge">
          <Shield size={16} />
          <span>256-bit SSL Encrypted</span>
        </div>
      </div>
      
      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
        <div className="progress-steps">
          {[
            { step: 1, title: 'Billing Info', icon: User },
            { step: 2, title: 'Payment', icon: CreditCard },
            { step: 3, title: 'Review', icon: CheckCircle },
            { step: 4, title: 'Complete', icon: CheckCircle }
          ].map(({ step, title, icon: Icon }) => (
            <div 
              key={step}
              className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            >
              <div className="step-icon">
                <Icon size={16} />
              </div>
              <span className="step-title">{title}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="subscription-content">
        {/* Left Column - Form */}
        <div className="form-section">
          {currentStep === 1 && (
            <div className="billing-info-form">
              <h2>Billing Information</h2>
              <p>Please provide your billing details for subscription management.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={billingInfo.firstName}
                    onChange={(e) => handleBillingInfoChange('firstName', e.target.value)}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>
                
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={billingInfo.lastName}
                    onChange={(e) => handleBillingInfoChange('lastName', e.target.value)}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
                
                <div className="form-group full-width">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => handleBillingInfoChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                
                <div className="form-group full-width">
                  <label>Company/Organization</label>
                  <input
                    type="text"
                    value={billingInfo.company}
                    onChange={(e) => handleBillingInfoChange('company', e.target.value)}
                    placeholder="Enter company name (optional)"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Address *</label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => handleBillingInfoChange('address', e.target.value)}
                    className={errors.address ? 'error' : ''}
                    placeholder="Enter your street address"
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>
                
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => handleBillingInfoChange('city', e.target.value)}
                    className={errors.city ? 'error' : ''}
                    placeholder="Enter your city"
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>
                
                <div className="form-group">
                  <label>State/Province *</label>
                  <input
                    type="text"
                    value={billingInfo.state}
                    onChange={(e) => handleBillingInfoChange('state', e.target.value)}
                    className={errors.state ? 'error' : ''}
                    placeholder="Enter your state"
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>
                
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    value={billingInfo.postalCode}
                    onChange={(e) => handleBillingInfoChange('postalCode', e.target.value)}
                    className={errors.postalCode ? 'error' : ''}
                    placeholder="Enter postal code"
                  />
                  {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
                </div>
                
                <div className="form-group">
                  <label>Country *</label>
                  <select
                    value={billingInfo.country}
                    onChange={(e) => handleBillingInfoChange('country', e.target.value)}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="India">India</option>
                    <option value="Japan">Japan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleStepNext}
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="payment-info-form">
              <h2>Payment Information</h2>
              <p>Secure payment processing with industry-standard encryption.</p>
              
              {/* Billing Cycle Selection */}
              <div className="billing-cycle">
                <h3>Billing Cycle</h3>
                <div className="cycle-options">
                  <label className={`cycle-option ${billingType === 'monthly' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      value="monthly"
                      checked={billingType === 'monthly'}
                      onChange={(e) => setBillingType(e.target.value)}
                    />
                    <div className="cycle-content">
                      <span className="cycle-name">Monthly</span>
                      <span className="cycle-price">${currentPlan.monthly}/month</span>
                    </div>
                  </label>
                  
                  {currentPlan.yearly > 0 && (
                    <label className={`cycle-option ${billingType === 'yearly' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        value="yearly"
                        checked={billingType === 'yearly'}
                        onChange={(e) => setBillingType(e.target.value)}
                      />
                      <div className="cycle-content">
                        <span className="cycle-name">Yearly</span>
                        <span className="cycle-price">${currentPlan.yearly}/year</span>
                        {savings > 0 && (
                          <span className="cycle-savings">Save ${savings}</span>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>
              
              {currentPrice > 0 && (
                <div className="payment-form">
                  <h3>Card Information</h3>
                  
                  <div className="form-group">
                    <label>Card Number *</label>
                    <div className="card-input">
                      <input
                        type="text"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                        className={errors.cardNumber ? 'error' : ''}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                      <div className={`card-type ${getCardType(paymentInfo.cardNumber)}`}>
                        <CreditCard size={20} />
                      </div>
                    </div>
                    {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Expiry Date *</label>
                      <input
                        type="text"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                        className={errors.expiryDate ? 'error' : ''}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label>CVV *</label>
                      <input
                        type="text"
                        value={paymentInfo.cvv}
                        onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                        className={errors.cvv ? 'error' : ''}
                        placeholder="123"
                        maxLength="4"
                      />
                      {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Name on Card *</label>
                    <input
                      type="text"
                      value={paymentInfo.nameOnCard}
                      onChange={(e) => handlePaymentInfoChange('nameOnCard', e.target.value)}
                      className={errors.nameOnCard ? 'error' : ''}
                      placeholder="Enter name as it appears on card"
                    />
                    {errors.nameOnCard && <span className="error-text">{errors.nameOnCard}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={paymentInfo.saveCard}
                        onChange={(e) => handlePaymentInfoChange('saveCard', e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Save card for future payments
                    </label>
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={handleStepBack}
                >
                  Back
                </button>
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleStepNext}
                >
                  Review Order
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="order-review">
              <h2>Review Your Order</h2>
              <p>Please review your subscription details before confirming.</p>
              
              <div className="review-section">
                <h3>Billing Information</h3>
                <div className="info-card">
                  <div className="info-row">
                    <span>Name:</span>
                    <span>{billingInfo.firstName} {billingInfo.lastName}</span>
                  </div>
                  <div className="info-row">
                    <span>Email:</span>
                    <span>{billingInfo.email}</span>
                  </div>
                  {billingInfo.company && (
                    <div className="info-row">
                      <span>Company:</span>
                      <span>{billingInfo.company}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span>Address:</span>
                    <span>
                      {billingInfo.address}, {billingInfo.city}, {billingInfo.state} {billingInfo.postalCode}, {billingInfo.country}
                    </span>
                  </div>
                </div>
              </div>
              
              {currentPrice > 0 && (
                <div className="review-section">
                  <h3>Payment Method</h3>
                  <div className="info-card">
                    <div className="info-row">
                      <span>Card:</span>
                      <span>**** **** **** {paymentInfo.cardNumber.slice(-4)}</span>
                    </div>
                    <div className="info-row">
                      <span>Name on Card:</span>
                      <span>{paymentInfo.nameOnCard}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="review-section">
                <h3>Subscription Summary</h3>
                <div className="info-card">
                  <div className="info-row">
                    <span>Plan:</span>
                    <span>{currentPlan.name} ({currentPlan.subtitle})</span>
                  </div>
                  <div className="info-row">
                    <span>Billing Cycle:</span>
                    <span>{billingType === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                  </div>
                  <div className="info-row">
                    <span>Price:</span>
                    <span className="price-highlight">
                      {currentPrice === 0 ? 'Free' : `$${currentPrice}/${billingType === 'monthly' ? 'month' : 'year'}`}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="info-row">
                      <span>Yearly Savings:</span>
                      <span className="savings-highlight">${savings}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="terms-acceptance">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  I agree to the <a href="#terms" target="_blank">Terms of Service</a> and <a href="#privacy" target="_blank">Privacy Policy</a>
                </label>
              </div>
              
              {errors.submit && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.submit}
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={handleStepBack}
                >
                  Back
                </button>
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {currentPrice === 0 ? 'Activate Free Plan' : `Subscribe for $${currentPrice}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="success-message">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h2>Subscription Activated!</h2>
              <p>Welcome to {currentPlan.name}! Your subscription has been successfully activated.</p>
              
              <div className="success-details">
                <div className="detail-item">
                  <Clock size={16} />
                  <span>Activation took effect immediately</span>
                </div>
                <div className="detail-item">
                  <DollarSign size={16} />
                  <span>
                    {currentPrice === 0 
                      ? 'No charges - Free plan activated' 
                      : `First charge: $${currentPrice} (${billingType})`
                    }
                  </span>
                </div>
                <div className="detail-item">
                  <CheckCircle size={16} />
                  <span>Confirmation email sent to {billingInfo.email}</span>
                </div>
              </div>
              
              <p className="redirect-message">Redirecting you to the homepage...</p>
            </div>
          )}
        </div>
        
        {/* Right Column - Order Summary */}
        <div className="summary-section">
          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="plan-details">
              <div className="plan-header">
                <h4>{currentPlan.name}</h4>
                <span className="plan-subtitle">{currentPlan.subtitle}</span>
              </div>
              
              <div className="plan-features">
                <h5>Included Features:</h5>
                <ul>
                  {currentPlan.features.map((feature, index) => (
                    <li key={index}>
                      <Check size={14} />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {currentPlan.limitations.length > 0 && (
                  <>
                    <h5>Limitations:</h5>
                    <ul className="limitations">
                      {currentPlan.limitations.map((limitation, index) => (
                        <li key={index}>
                          <X size={14} />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            
            <div className="pricing-breakdown">
              <div className="pricing-row">
                <span>Plan ({billingType}):</span>
                <span>{currentPrice === 0 ? 'Free' : `$${currentPrice}`}</span>
              </div>
              
              {billingType === 'yearly' && savings > 0 && (
                <div className="pricing-row savings">
                  <span>Yearly Discount:</span>
                  <span>-${savings}</span>
                </div>
              )}
              
              <div className="pricing-row tax">
                <span>Tax:</span>
                <span>{currentPrice === 0 ? '$0.00' : 'Calculated at checkout'}</span>
              </div>
              
              <hr />
              
              <div className="pricing-row total">
                <span>Total:</span>
                <span>{currentPrice === 0 ? 'Free' : `$${currentPrice}`}</span>
              </div>
            </div>
            
            <div className="security-info">
              <div className="security-item">
                <Shield size={16} />
                <span>Secure 256-bit SSL encryption</span>
              </div>
              <div className="security-item">
                <Lock size={16} />
                <span>PCI DSS compliant processing</span>
              </div>
              <div className="security-item">
                <Calendar size={16} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
          
          {/* Alternative Plans */}
          <div className="alternative-plans">
            <h4>Other Plans</h4>
            {Object.entries(plans).map(([key, plan]) => {
              if (key === selectedPlan) return null;
              
              return (
                <div key={key} className="alt-plan">
                  <div className="alt-plan-info">
                    <span className="alt-plan-name">{plan.name}</span>
                    <span className="alt-plan-price">
                      {plan.monthly === 0 ? 'Free' : `$${plan.monthly}/month`}
                    </span>
                  </div>
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => navigate('/subscription', { state: { plan: key } })}
                  >
                    Switch
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
