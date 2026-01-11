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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";
import logo from "./logo.png";

function SignupPage() {
  const navigate = useNavigate();
  const { signup, signInWithGoogle, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "agreeToTerms" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return false;
    }

    return true;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      await signup(formData.email, formData.password, formData.displayName);

      setSuccess(
        "Account created! Please check your email to verify your account."
      );

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error) {
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!formData.agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);
      await signInWithGoogle();
      navigate("/", { replace: true }); // Redirect to home after successful signup
    } catch (error) {
      setError(error.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" data-testid="signup-page">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <Paper
          data-testid="signup-form-container"
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
            data-testid="signup-title"
            variant="h4"
            align="center"
            gutterBottom
          >
            Discover Your True Value
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            You have skills you've never thought to put on a resume.
          </Typography>

          {/* Value Props */}
          <Box
            data-testid="signup-value-props"
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: "rgba(253, 187, 45, 0.08)",
              borderRadius: 1,
              border: "1px solid rgba(253, 187, 45, 0.2)",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong style={{ color: "#fdbb2d" }}>
                We're not like other resume builders.
              </strong>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              component="div"
              sx={{ lineHeight: 1.8 }}
            >
              ✨ <strong>Tell your story</strong> — our AI asks questions that
              uncover hidden skills
              <br />
              🎯 <strong>Beyond job titles</strong> — discover abilities from
              hobbies, side projects, and life
              <br />
              💡 <strong>Stop feeling undervalued</strong> — finally show
              employers your full potential
            </Typography>
          </Box>

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Error Alert */}
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || authError}
            </Alert>
          )}

          {/* Google Sign Up Button */}
          <Button
            data-testid="signup-google-btn"
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignup}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Sign up with Google
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignup} data-testid="signup-form">
            <TextField
              data-testid="signup-name-input"
              fullWidth
              id="displayName"
              label="Full Name (Optional)"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              margin="normal"
              autoComplete="name"
              disabled={loading}
            />

            <TextField
              data-testid="signup-email-input"
              fullWidth
              id="email"
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="email"
              disabled={loading}
            />

            <TextField
              data-testid="signup-password-input"
              fullWidth
              id="password"
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={loading}
              helperText="At least 6 characters"
            />

            <TextField
              data-testid="signup-confirm-password-input"
              fullWidth
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="new-password"
              disabled={loading}
            />

            {/* Terms and Conditions */}
            <FormControlLabel
              data-testid="signup-terms-checkbox"
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" underline="hover">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" underline="hover">
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mt: 1 }}
            />

            {/* Submit Button */}
            <Button
              data-testid="signup-submit-btn"
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link
                data-testid="signup-login-link"
                component={RouterLink}
                to="/login"
                variant="body2"
                fontWeight="bold"
                underline="hover"
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default SignupPage;