import axios from 'axios';
import { auth } from '../firebase/config.js';

// Get backend API base URL (already includes /api suffix)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';
// Ensure we have /api at the end
const API_URL = API_BASE_URL.includes('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

// Helper: Get Firebase auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
};

// OLD: Vercel function (deprecated - keep for backwards compatibility)
export const generateCv = async (formData) => {
  const response = await axios.post('/api/generate-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });
  return response.data;
};

// NEW: Authenticated resume generation with tracking
export const generateResume = async (data) => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(`${API_URL}/resume/generate`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || error.response.data.error || 'Resume generation failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Resume generation failed');
    }
  }
};

// Get user's resume list
export const getResumeList = async () => {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${API_URL}/resume/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load resumes');
  }
};

// Get specific resume
export const getResume = async (id) => {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${API_BASE_URL}/api/resume/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load resume');
  }
};

// Download resume markdown
export const downloadResume = async (id) => {
  try {
    const token = await getAuthToken();

    const response = await axios.get(`${API_BASE_URL}/api/resume/${id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to download resume');
  }
};
