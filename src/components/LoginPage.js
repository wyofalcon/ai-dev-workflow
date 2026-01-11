import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  Link,
  CircularProgress,
} from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";
import logo from "./logo.png";
import DevLoginPanel from "./DevLoginPanel.js";

function LoginPage() {
  const navigate = useNavigate();
  const { signin, signInWithGoogle, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signin(email, password);
      navigate("/", { replace: true }); // Redirect to home after successful login
    } catch (error) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      navigate("/", { replace: true }); // Redirect to home after successful login
    } catch (error) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" data-testid="login-page">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper
          data-testid="login-form-container"
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <img src={logo} alt="CVstomize Logo" style={{ width: "120px" }} />
          </Box>

          {/* Title */}
          <Typography
            data-testid="login-title"
            variant="h4"
            align="center"
            gutterBottom
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Ready to discover more hidden skills?
          </Typography>

          {/* Quick reminder of value */}
          <Typography
            variant="caption"
            align="center"
            color="text.secondary"
            component="div"
            sx={{ mb: 3, fontStyle: "italic" }}
          >
            💡 Your stories hold skills you've never thought to include
          </Typography>

          {/* Error Alert */}
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || authError}
            </Alert>
          )}

          {/* Google Sign In Button */}
          <Button
            data-testid="login-google-btn"
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Sign in with Google
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} data-testid="login-form">
            <TextField
              data-testid="login-email-input"
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              disabled={loading}
            />

            <TextField
              data-testid="login-password-input"
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={loading}
            />

            {/* Forgot Password Link */}
            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mb: 2 }}
            >
              <Link
                component={RouterLink}
                to="/reset-password"
                variant="body2"
                underline="hover"
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              data-testid="login-submit-btn"
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link
                data-testid="login-signup-link"
                component={RouterLink}
                to="/signup"
                variant="body2"
                fontWeight="bold"
                underline="hover"
              >
                Sign Up
              </Link>
            </Typography>
          </Box>

          {/* Dev Login Panel - Only shows in development */}
          <DevLoginPanel />
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
