export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Token refresh mechanism
const isTokenExpired = () => {
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  return tokenExpiry && new Date().getTime() > parseInt(tokenExpiry);
};

// Auto refresh token if needed before API calls
const refreshTokenIfNeeded = async () => {
  if (isTokenExpired()) {
    console.log('Token expired, attempting to refresh...');
    
    // If we had a refresh token mechanism, we would use it here
    // For now, we'll just log the user out by clearing storage
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    
    // Force page reload to redirect to login
    window.location.reload();
    throw new Error('Session expired. Please login again.');
  }
};

// ------------------- REGISTER -------------------
export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData) // expects { email, password }
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || 'Registration failed');
  }

  return await response.json();
};

// ------------------- VERIFY OTP -------------------
export const verifyOtp = async (data) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // expects { email, otp }
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || 'OTP verification failed');
  }

  return await response.json();
};

// ------------------- LOGIN -------------------
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials) // expects { email, password }
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || 'Login failed');
  }

  return await response.json();
};

// ------------------- UPDATE PROFILE -------------------
export const updateUserProfile = async (profileData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData) // expects { name, phone, domains }
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || 'Profile update failed');
  }

  return await response.json();
};

// ------------------- UPDATE SUBSCRIPTION -------------------
export const updateUserSubscription = async (subscriptionData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/user/subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || 'Subscription update failed');
  }

  return await response.json();
};
