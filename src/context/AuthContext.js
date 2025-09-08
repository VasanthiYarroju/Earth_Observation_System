// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, updateUserProfile, updateUserSubscription } from '../services/api';
import React from 'react';


export const AuthContext = createContext({
    // Provide default placeholder functions to avoid "Forgot to wrap component" errors in linting/development
    login: () => { console.error('Forgot to wrap component in AuthProvider'); return Promise.reject(new Error('Auth not initialized')); },
    register: () => { console.error('Forgot to wrap component in AuthProvider'); return Promise.reject(new Error('Auth not initialized')); },
    logout: () => { console.error('Forgot to wrap component in AuthProvider'); },
    updateProfile: () => { console.error('Forgot to wrap component in AuthProvider'); return Promise.reject(new Error('Auth not initialized')); },
    updateSubscription: () => { console.error('Forgot to wrap component in AuthProvider'); },
    user: null,
    isAuthenticated: false,
    isLoading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    console.log('AuthContext useEffect: checking for session. Token:', token ? 'exists' : 'none', 'User data:', userData ? 'exists' : 'none');

    if (token && userData) {
      try {
        // Check if token is expired (if we have expiry time saved)
        if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
          console.log('AuthContext: Token expired, logging out');
          logout();
        } else {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
          console.log('AuthContext: Session restored. User:', JSON.parse(userData).email);
        }
      } catch (e) {
        console.error('AuthContext: Failed to parse user data from localStorage, clearing session.', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
      }
    } else {
      console.log('AuthContext: No session found.');
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Calling loginUser with email:', email);
      const response = await loginUser({ email, password });
      console.log('AuthContext: Login response received.');
      localStorage.setItem('token', response.token);
      
      // Set token expiry (1 hour from now minus 5 minutes for safety)
      const expiryTime = new Date().getTime() + (55 * 60 * 1000); // 55 minutes
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      
      // Store complete user data including domains and subscription
      const userData = response.user || { email };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      console.log('AuthContext: Login successful, isAuthenticated set to true.');
      return response;
    } catch (error) {
      console.error('AuthContext: Login error (caught in AuthContext):', error);
      // Re-throw the error so components can handle it
      throw error;
    }
  };

  const register = async (name, email, password, domains = []) => {
    try {
      console.log('AuthContext: Calling registerUser with email:', email);
      const response = await registerUser({ name, email, password, domains });
      console.log('AuthContext: Register response received.');
      // Token might not be available until after OTP verification
      if (response.token) {
        localStorage.setItem('token', response.token);
        // Store user data including domains
        const userData = { name, email, domains: response.user?.domains || domains }; // Use response.user data if available
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        console.log('AuthContext: Register successful with token, isAuthenticated set to true.');
      } else {
        // If no token, it means OTP verification is pending, so don't set user as authenticated immediately
        const userData = { name, email, domains }; // Still store partial user data
        localStorage.setItem('user', JSON.stringify(userData)); // Store user details even without token
        setUser(userData); // Update user state locally
        setIsAuthenticated(false); // Not authenticated until OTP verified
        console.log('AuthContext: Register successful, awaiting OTP verification.');
      }
      return response;
    } catch (error) {
      console.error('AuthContext: Register error (caught in AuthContext):', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    console.log('AuthContext: Authentication state cleared, isAuthenticated =', false);
  };
  const updateProfile = async (profileData) => {
    try {
      console.log('AuthContext: Updating profile with data:', profileData);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await updateUserProfile(profileData, token);
      
      // Update local user data
      const updatedUser = response.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log('AuthContext: Profile updated successfully');
      return response;
    } catch (error) {
      console.error('AuthContext: Profile update error:', error);
      throw error;
    }
  };

  const updateSubscription = async (subscriptionData) => {
    try {
      console.log('AuthContext: Updating subscription with data:', subscriptionData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call backend API to save subscription
      const response = await updateUserSubscription(subscriptionData, token);
      
      // Update local user data with the response
      const updatedUser = response.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log('AuthContext: Subscription updated successfully via backend', updatedUser.subscription);
      return updatedUser;
    } catch (error) {
      console.error('AuthContext: Subscription update error:', error);
      
      // Fallback to local storage if backend fails
      console.log('AuthContext: Falling back to local storage for subscription update');
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      
      const updatedUser = {
        ...currentUser,
        subscription: {
          ...subscriptionData,
          status: 'active',
          activatedAt: new Date().toISOString()
        }
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    updateSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}