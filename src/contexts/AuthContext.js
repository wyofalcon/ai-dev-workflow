import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../firebase/config.js';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Get Firebase ID token
  const getIdToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  // Create axios instance with auth headers
  const createAuthAxios = async () => {
    const token = await getIdToken();
    return axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  // Register user in backend database after Firebase signup
  const registerInBackend = async (user) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.post(`${API_URL}/auth/register`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserProfile(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Backend registration error:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(result.user);

      // Register in backend
      await registerInBackend(result.user);

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const signin = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update backend login timestamp
      const token = await result.user.getIdToken();
      await axios.post(`${API_URL}/auth/login`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Register/login in backend
      await registerInBackend(result.user);

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);

      // Log logout in backend
      const token = await getIdToken();
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Get user profile from backend (with auto-registration fallback)
  const fetchUserProfile = async (user) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const user = response.data.user;

      // Proxy Google profile image through our backend to avoid CORS/ORB issues
      if (user.photoUrl && user.photoUrl.includes('googleusercontent.com')) {
        user.photoUrl = `${API_URL}/proxy/avatar?url=${encodeURIComponent(user.photoUrl)}`;
      }

      setUserProfile(user);
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);

      // If user not found (404), try to register them
      if (error.response && error.response.status === 404) {
        console.log('User not found in database, attempting registration...');
        try {
          await registerInBackend(user);
          // Retry fetching profile after registration
          const retryResponse = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          });
          const retryUser = retryResponse.data.user;

          // Proxy Google profile image through our backend
          if (retryUser.photoUrl && retryUser.photoUrl.includes('googleusercontent.com')) {
            retryUser.photoUrl = `${API_URL}/proxy/avatar?url=${encodeURIComponent(retryUser.photoUrl)}`;
          }

          setUserProfile(retryUser);
          return retryUser;
        } catch (registerError) {
          console.error('Failed to register user:', registerError);
        }
      }

      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user profile from backend
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    getIdToken,
    createAuthAxios,
    fetchUserProfile,
    API_URL,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
