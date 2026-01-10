import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.js";
import { WebLlmProvider, useWebLlm } from "./contexts/WebLlmContext.js";
import { useCvState } from "./hooks/useCvState.js";
import HomePage from "./components/HomePage.js";
import TutorialModal from "./components/TutorialModal.js";
import ResumePage from "./components/ResumePage.js";
import ResumeViewPage from "./components/ResumeViewPage.js";
import ConversationalResumePage from "./components/ConversationalResumePage.js";
import UserProfilePage from "./components/UserProfilePage.js";
import ProcessModal from "./components/ProcessModal.js";
import Footer from "./components/Footer.js";
import LoginPage from "./components/LoginPage.js";
import SignupPage from "./components/SignupPage.js";
import ResetPasswordPage from "./components/ResetPasswordPage.js";
import OnboardingPage from "./components/OnboardingPage.js";
import GoldStandardWizard from "./components/GoldStandardWizard.js";
import LandingPage from "./components/LandingPage.js";
import ConversationalOnboarding from "./components/ConversationalOnboarding.js";
import DemoExperience from "./components/DemoExperience.js";
import TermsPage from "./components/TermsPage.js";
import LocalAISetupModal, { AIStatusBadge } from "./components/LocalAISetupModal.js";
import LocalAINudge from "./components/LocalAINudge.js";
import ExtensionPromoModal from "./components/ExtensionPromoModal.js";
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
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import logo from "./components/logo.png";
import "./App.css";
import DebugInspector from "./components/DebugInspector.js";

// Protected Route wrapper - redirects to landing if not authenticated, or to onboarding if not completed
function ProtectedRoute({ children }) {
  const { currentUser, onboardingCompleted } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to public landing page instead of login
    return <Navigate to="/welcome" replace />;
  }

  // Redirect to onboarding if not completed (but not if already on onboarding page)
  if (onboardingCompleted === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// Onboarding Route wrapper - accessible to any logged in user
function OnboardingRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route wrapper (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Landing Page Route - shows landing for guests, redirects logged-in users to dashboard
function LandingPageRoute() {
  const { currentUser, onboardingCompleted } = useAuth();

  // If logged in, go to dashboard (or onboarding if needed)
  if (currentUser) {
    if (onboardingCompleted === false) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in - show public landing page
  return <LandingPage />;
}

function MainLayout({ children }) {
  const cvState = useCvState();
  const { isTutorialOpen, setIsTutorialOpen } = cvState;
  const { currentUser, userProfile, logout } = useAuth();
  const { shouldShowLocalAISetup } = useWebLlm();
  const navigate = useNavigate();

  const [isProcessStarted, setIsProcessStarted] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showLocalAIModal, setShowLocalAIModal] = useState(false);

  // Show local AI setup prompt on first visit (after a brief delay for UX)
  React.useEffect(() => {
    if (shouldShowLocalAISetup) {
      const timer = setTimeout(() => setShowLocalAIModal(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowLocalAISetup]);

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

  // Helper to get proxied avatar URL
  const getAvatarUrl = () => {
    // First try userProfile.photoUrl (already proxied by AuthContext)
    if (userProfile?.photoUrl) {
      return userProfile.photoUrl;
    }

    // Fallback to Firebase currentUser.photoURL and proxy it
    if (currentUser?.photoURL) {
      const API_URL =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      if (currentUser.photoURL.includes("googleusercontent.com")) {
        return `${API_URL}/proxy/avatar?url=${encodeURIComponent(
          currentUser.photoURL
        )}`;
      }
      return currentUser.photoURL;
    }

    return null;
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      navigate("/"); // Go to landing page to show value props
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpgrade = async () => {
    handleMenuClose();
    try {
      const token = await currentUser.getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes("/api") ? API_BASE : `${API_BASE}/api`;

      const response = await fetch(`${API_URL}/auth/upgrade-unlimited`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.user) {
        alert(
          `✅ Account upgraded to unlimited resumes!\n\nYou now have ${data.user.resumesLimit} resume generations.`
        );
        window.location.reload();
      } else {
        alert("❌ Upgrade failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("❌ Upgrade failed: " + error.message);
    }
  };

  return (
    <Box
      data-testid="main-layout"
      sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <AppBar
        data-testid="main-navbar"
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: "1px solid #333" }}
      >
        <Toolbar>
          <img
            data-testid="navbar-logo"
            src={logo}
            alt="logo"
            style={{ width: "80px", marginRight: "10px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          />
          <Box sx={{ flexGrow: 1 }} />

          {/* How to Use Button */}
          <Button
            data-testid="navbar-tutorial-btn"
            color="primary"
            onClick={() => setIsTutorialOpen(true)}
            sx={{ mr: 2 }}
          >
            How to Use
          </Button>

          {/* Auth Section */}
          {currentUser ? (
            <>
              {/* AI Status Indicator */}
              <AIStatusBadge onClick={() => setShowLocalAIModal(true)} />

              {/* User Info */}
              <Typography
                variant="body2"
                sx={{ mr: 2, display: { xs: "none", sm: "block" } }}
              >
                {userProfile?.resumesGenerated || 0} /{" "}
                {userProfile?.resumesLimit || 1} resumes
              </Typography>

              <Button
                color="primary"
                onClick={() => navigate("/profile")}
                sx={{ mr: 1 }}
              >
                User Profile
              </Button>

              {/* User Menu */}
              <IconButton
                data-testid="navbar-user-menu-btn"
                onClick={handleMenuOpen}
                color="primary"
              >
                {getAvatarUrl() ? (
                  <Avatar
                    src={getAvatarUrl()}
                    sx={{ width: 32, height: 32 }}
                    alt={currentUser?.displayName || "User"}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                data-testid="navbar-user-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser.email}
                  </Typography>
                </MenuItem>
                <MenuItem
                  data-testid="navbar-profile-link"
                  onClick={() => {
                    handleMenuClose();
                    navigate("/profile");
                  }}
                >
                  User Profile
                </MenuItem>
                <MenuItem
                  data-testid="navbar-resumes-link"
                  onClick={() => {
                    handleMenuClose();
                    navigate("/resume");
                  }}
                >
                  My Resumes
                </MenuItem>
                <MenuItem
                  data-testid="navbar-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                data-testid="navbar-login-btn"
                color="primary"
                onClick={() => navigate("/login")}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button
                data-testid="navbar-signup-btn"
                variant="contained"
                color="primary"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, flexGrow: 1 }}>
        {children || <HomePage onStart={handleStart} />}
        {isTutorialOpen && <TutorialModal setIsOpen={setIsTutorialOpen} />}
        {isProcessStarted && (
          <ProcessModal
            open={isProcessStarted}
            handleClose={handleClose}
            cvState={cvState}
          />
        )}
      </Container>
      
      {/* Local AI Setup Modal - shows once for new users */}
      <LocalAISetupModal 
        open={showLocalAIModal} 
        onClose={() => setShowLocalAIModal(false)} 
      />
      
      {/* Extension Promo Modal - shows once for new users */}
      <ExtensionPromoModal />

      {/* Nudge to enable Local AI after multiple server calls */}
      <LocalAINudge onOpenSetup={() => setShowLocalAIModal(true)} />
      
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WebLlmProvider>
          <div className="App">
            <DebugInspector />
            <Routes>
              {/* Public Landing Page - No login required */}
              <Route path="/" element={<LandingPageRoute />} />
            <Route path="/welcome" element={<LandingPage />} />
            <Route path="/demo" element={<DemoExperience />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Auth Routes */}
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

            {/* Onboarding Route - first-time setup */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingPage />
                </OnboardingRoute>
              }
            />

            {/* Protected Routes - Logged in users */}
            <Route
              path="/dashboard"
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
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume/:id"
              element={
                <ProtectedRoute>
                  <ResumeViewPage />
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
            <Route
              path="/build-resume"
              element={
                <ProtectedRoute>
                  <ConversationalOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gold-standard"
              element={
                <ProtectedRoute>
                  <GoldStandardWizard />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </WebLlmProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
