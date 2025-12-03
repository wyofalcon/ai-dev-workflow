import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase/config.js";
import axios from "axios";

const AuthContext = createContext({});

// Check if we're in development mode
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.REACT_APP_ENABLE_DEV_AUTH === "true";

// Dev token storage key
const DEV_TOKEN_KEY = "cvstomize_dev_token";
const DEV_USER_TYPE_KEY = "cvstomize_dev_user_type";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null); // null = unknown, true/false = determined
  const [isDevUser, setIsDevUser] = useState(false);
  const [devUserType, setDevUserType] = useState(null);

  // API base URL - SECURITY: Never default to localhost in production
  const API_BASE =
    process.env.REACT_APP_API_URL ||
    "https://cvstomize-api-351889420459.us-central1.run.app";
  // Don't add /api if it's already in the URL
  const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

  // Get Firebase ID token (or dev token in development)
  const getIdToken = async () => {
    // Check for dev token first
    if (isDevelopment) {
      const devToken = localStorage.getItem(DEV_TOKEN_KEY);
      if (devToken) {
        return devToken;
      }
    }

    // Fall back to Firebase token
    if (currentUser && currentUser.getIdToken) {
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
        "Content-Type": "application/json",
      },
    });
  };

  // Register user in backend database after Firebase signup
  const registerInBackend = async (user) => {
    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserProfile(response.data.user);
      return response.data;
    } catch (error) {
      console.error("Backend registration error:", error);
      throw error;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

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
      await axios.post(
        `${API_URL}/auth/login`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

      // Check if this is a dev user logout
      if (isDevUser && isDevelopment) {
        const devToken = localStorage.getItem(DEV_TOKEN_KEY);
        if (devToken) {
          try {
            await axios.post(
              `${API_URL}/auth/dev/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${devToken}`,
                },
              }
            );
          } catch (backendError) {
            console.error("Dev logout error (continuing):", backendError);
          }
        }
        // Clear dev tokens
        localStorage.removeItem(DEV_TOKEN_KEY);
        localStorage.removeItem(DEV_USER_TYPE_KEY);
        setCurrentUser(null);
        setUserProfile(null);
        setOnboardingCompleted(null);
        setIsDevUser(false);
        setDevUserType(null);
        return;
      }

      // Log logout in backend
      const token = await getIdToken();
      if (token) {
        try {
          await axios.post(
            `${API_URL}/auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (backendError) {
          // Continue with logout even if backend call fails
          console.error("Backend logout error (continuing):", backendError);
        }
      }

      // Sign out from Firebase
      await signOut(auth);

      // Clear user state
      setUserProfile(null);
      setOnboardingCompleted(null);

      // Clear any tokens or user data from localStorage
      localStorage.clear();
    } catch (error) {
      // Even if there's an error, try to clear local state
      setUserProfile(null);
      setOnboardingCompleted(null);
      localStorage.clear();
      setError(error.message);
      throw error;
    }
  };

  // DEV ONLY: Login as a dev user (bypasses Firebase)
  const devLogin = async (userType = "persistent") => {
    if (!isDevelopment) {
      throw new Error("Dev login is only available in development mode");
    }

    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/dev/login`, {
        userType,
      });

      const { token, user } = response.data;

      // Store dev token
      localStorage.setItem(DEV_TOKEN_KEY, token);
      localStorage.setItem(DEV_USER_TYPE_KEY, userType);

      // Create a mock user object that mimics Firebase user
      const mockUser = {
        uid: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: true,
        // Mock getIdToken to return dev token
        getIdToken: async () => token,
      };

      setCurrentUser(mockUser);
      setUserProfile(user);
      setIsDevUser(true);
      setDevUserType(userType);
      setOnboardingCompleted(user.onboardingCompleted || false);

      console.log(`🔧 Dev login successful: ${user.email} (${userType})`);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      throw error;
    }
  };

  // DEV ONLY: Get list of available dev users
  const getDevUsers = async () => {
    if (!isDevelopment) {
      return [];
    }
    try {
      const response = await axios.get(`${API_URL}/auth/dev/users`);
      return response.data.users;
    } catch (error) {
      console.error("Failed to fetch dev users:", error);
      return [];
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
      const userProfileData = response.data.user;

      // Proxy Google profile image through our backend to avoid CORS/ORB issues
      if (
        userProfileData.photoUrl &&
        userProfileData.photoUrl.includes("googleusercontent.com")
      ) {
        userProfileData.photoUrl = `${API_URL}/proxy/avatar?url=${encodeURIComponent(
          userProfileData.photoUrl
        )}`;
      }

      setUserProfile(userProfileData);
      setOnboardingCompleted(userProfileData.onboardingCompleted || false);
      return userProfileData;
    } catch (error) {
      console.error("Error fetching user profile:", error);

      // If user not found (404), try to register them
      if (error.response && error.response.status === 404) {
        console.log("User not found in database, attempting registration...");
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
          if (
            retryUser.photoUrl &&
            retryUser.photoUrl.includes("googleusercontent.com")
          ) {
            retryUser.photoUrl = `${API_URL}/proxy/avatar?url=${encodeURIComponent(
              retryUser.photoUrl
            )}`;
          }

          setUserProfile(retryUser);
          setOnboardingCompleted(retryUser.onboardingCompleted || false);
          return retryUser;
        } catch (registerError) {
          console.error("Failed to register user:", registerError);
        }
      }

      return null;
    }
  };

  // Check for existing dev token on mount
  useEffect(() => {
    const checkDevToken = async () => {
      if (!isDevelopment) return false;

      const devToken = localStorage.getItem(DEV_TOKEN_KEY);
      const storedUserType = localStorage.getItem(DEV_USER_TYPE_KEY);

      if (devToken) {
        try {
          // Verify the dev token is still valid
          const response = await axios.get(`${API_URL}/auth/dev/verify`, {
            headers: {
              Authorization: `Bearer ${devToken}`,
            },
          });

          if (response.data.valid) {
            // Fetch full user profile
            const profileResponse = await axios.get(`${API_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${devToken}`,
              },
            });

            const user = profileResponse.data.user;
            const mockUser = {
              uid: user.id,
              email: user.email,
              displayName: user.displayName,
              emailVerified: true,
              getIdToken: async () => devToken,
            };

            setCurrentUser(mockUser);
            setUserProfile(user);
            setIsDevUser(true);
            setDevUserType(storedUserType || "persistent");
            setOnboardingCompleted(user.onboardingCompleted || false);
            setLoading(false);
            return true;
          }
        } catch (error) {
          // Dev token is invalid, clean up
          console.log("Dev token expired or invalid, cleaning up");
          localStorage.removeItem(DEV_TOKEN_KEY);
          localStorage.removeItem(DEV_USER_TYPE_KEY);
        }
      }
      return false;
    };

    // Check dev token first, then set up Firebase listener
    checkDevToken().then((hasDevUser) => {
      if (!hasDevUser) {
        // Only set up Firebase listener if no dev user
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);

          if (user) {
            // Fetch user profile from backend
            await fetchUserProfile(user);
          } else {
            setUserProfile(null);
            setOnboardingCompleted(null);
          }

          setLoading(false);
        });

        return () => unsubscribe();
      }
    });
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    onboardingCompleted,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    getIdToken,
    createAuthAxios,
    fetchUserProfile,
    API_URL,
    // Dev auth (only available in development)
    isDevelopment,
    isDevUser,
    devUserType,
    devLogin,
    getDevUsers,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
