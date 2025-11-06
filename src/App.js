import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { useCvState } from './hooks/useCvState.js';
import HomePage from './components/HomePage.js';
import TutorialModal from './components/TutorialModal.js';
import ResumePage from './components/ResumePage.js';
import ConversationalResumePage from './components/ConversationalResumePage.js';
import ProcessModal from './components/ProcessModal.js';
import Footer from './components/Footer.js';
import LoginPage from './components/LoginPage.js';
import SignupPage from './components/SignupPage.js';
import ResetPasswordPage from './components/ResetPasswordPage.js';
import {
  Container,
  Button,
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import logo from './components/logo.png';
import './App.css';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route wrapper (redirect to home if already logged in)
function PublicRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function MainLayout() {
  const cvState = useCvState();
  const { isTutorialOpen, setIsTutorialOpen } = cvState;
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isProcessStarted, setIsProcessStarted] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleStart = () => {
    setIsProcessStarted(true);
  };

  const handleClose = () => {
    setIsProcessStarted(false);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpgrade = async () => {
    handleMenuClose();
    try {
      const token = await currentUser.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';

      const response = await fetch(`${API_BASE}/api/auth/upgrade-unlimited`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.user) {
        alert(`✅ Account upgraded to unlimited resumes!\n\nYou now have ${data.user.resumesLimit} resume generations.`);
        window.location.reload();
      } else {
        alert('❌ Upgrade failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('❌ Upgrade failed: ' + error.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
        <Toolbar>
          <img src={logo} alt="logo" style={{ width: '80px', marginRight: '10px' }} />
          <Box sx={{ flexGrow: 1 }} />

          {/* How to Use Button */}
          <Button color="primary" onClick={() => setIsTutorialOpen(true)} sx={{ mr: 2 }}>
            How to Use
          </Button>

          {/* Auth Section */}
          {currentUser ? (
            <>
              {/* User Info */}
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                {userProfile?.resumesGenerated || 0} / {userProfile?.resumesLimit || 1} resumes
              </Typography>

              {/* User Menu */}
              <IconButton onClick={handleMenuOpen} color="primary">
                {userProfile?.photoUrl ? (
                  <Avatar src={userProfile.photoUrl} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser.email}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/resume'); }}>
                  My Resumes
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="primary" onClick={() => navigate('/login')} sx={{ mr: 1 }}>
                Login
              </Button>
              <Button variant="contained" color="primary" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, flexGrow: 1 }}>
        <HomePage onStart={handleStart} />
        {isTutorialOpen && <TutorialModal setIsOpen={setIsTutorialOpen} />}
        {isProcessStarted && (
          <ProcessModal open={isProcessStarted} handleClose={handleClose} cvState={cvState} />
        )}
      </Container>
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-resume"
              element={
                <ProtectedRoute>
                  <ConversationalResumePage />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
