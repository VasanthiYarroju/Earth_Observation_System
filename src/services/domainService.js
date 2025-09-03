// src/services/domainService.js
import { API_BASE_URL } from './api';

// We'll use server API endpoints to access Google Cloud data
// This ensures proper authentication and access control

// Helper function to check if token is expired
const isTokenExpired = () => {
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  return tokenExpiry && new Date().getTime() > parseInt(tokenExpiry);
};

// Helper function to include auth token in requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  
  // Check if token is expired
  if (token && isTokenExpired()) {
    // Clear the expired token
    console.log('Token expired, logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    
    // Force reload to show login screen
    window.location.href = '/';
    return {};
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Get metadata for a specific domain's datasets
 */
export const getDomainMetadata = async (domain) => {
  const response = await fetch(`${API_BASE_URL}/api/domains/${domain}/metadata`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || `Failed to fetch ${domain} metadata`);
  }

  return await response.json();
};

/**
 * Get sample data for domain visualizations
 */
export const getDomainSampleData = async (domain, category = null, limit = 10) => {
  const url = new URL(`${API_BASE_URL}/api/domains/${domain}/sample`);
  
  if (category) {
    url.searchParams.append('category', category);
  }
  
  url.searchParams.append('limit', limit);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || `Failed to fetch ${domain} sample data`);
  }

  return await response.json();
};

/**
 * Get analytics data for domain dashboards
 */
export const getDomainAnalytics = async (domain) => {
  const response = await fetch(`${API_BASE_URL}/api/domains/${domain}/analytics`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || `Failed to fetch ${domain} analytics`);
  }

  return await response.json();
};
