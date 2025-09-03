// Utility functions for subscription management

/**
 * Check if user has an active subscription
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user has active subscription
 */
export const hasActiveSubscription = (user) => {
  // Check user object first
  if (user && user.subscription && user.subscription.status === 'active') {
    console.log('Subscription check: Found active subscription in user object');
    return true;
  }
  
  // Also check localStorage as fallback
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser.subscription && storedUser.subscription.status === 'active') {
      console.log('Subscription check: Found active subscription in localStorage');
      return true;
    }
  } catch (error) {
    console.error('Subscription check: Error parsing localStorage user data:', error);
  }
  
  console.log('Subscription check: No active subscription found');
  return false;
};

/**
 * Get current subscription details
 * @param {Object} user - User object from AuthContext
 * @returns {Object|null} - Subscription object or null
 */
export const getSubscriptionDetails = (user) => {
  // Check user object first
  if (user && user.subscription) {
    return user.subscription;
  }
  
  // Check localStorage as fallback
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser.subscription) {
      return storedUser.subscription;
    }
  } catch (error) {
    console.error('Subscription details: Error parsing localStorage user data:', error);
  }
  
  return null;
};

/**
 * Check if user has access to a specific feature based on their subscription plan
 * @param {Object} user - User object from AuthContext
 * @param {string} feature - Feature to check access for
 * @returns {boolean} - True if user has access to the feature
 */
export const hasFeatureAccess = (user, feature) => {
  const subscription = getSubscriptionDetails(user);
  
  if (!subscription || subscription.status !== 'active') {
    return false;
  }
  
  // Check if feature is included in the subscription
  if (subscription.features && Array.isArray(subscription.features)) {
    return subscription.features.includes(feature);
  }
  
  // Default feature access based on plan names
  const planFeatures = {
    'free': ['basic_data', 'limited_maps'],
    'basic': ['basic_data', 'standard_maps', 'agriculture_data'],
    'researcher': ['basic_data', 'standard_maps', 'agriculture_data', 'historical_data'],
    'premium': ['basic_data', 'standard_maps', 'agriculture_data', 'historical_data', 'cloud_data', 'advanced_analytics'],
    'enterprise': ['all_features']
  };
  
  const planName = subscription.plan?.toLowerCase() || subscription.planKey?.toLowerCase();
  const features = planFeatures[planName] || [];
  
  return features.includes(feature) || features.includes('all_features');
};

/**
 * Get subscription plan display name
 * @param {Object} user - User object from AuthContext
 * @returns {string} - Display name of the subscription plan
 */
export const getSubscriptionPlanName = (user) => {
  const subscription = getSubscriptionDetails(user);
  
  if (!subscription) {
    return 'Free';
  }
  
  return subscription.plan || subscription.planKey || 'Unknown';
};

/**
 * Check if subscription is expired
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if subscription is expired
 */
export const isSubscriptionExpired = (user) => {
  const subscription = getSubscriptionDetails(user);
  
  if (!subscription || !subscription.endDate) {
    return false;
  }
  
  return new Date() > new Date(subscription.endDate);
};
