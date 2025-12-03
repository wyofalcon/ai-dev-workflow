import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Collapse,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  RestartAlt as RestartIcon,
  BugReport as BugIcon,
} from "@mui/icons-material";

/**
 * DevLoginPanel - Development-only component for quick login without Firebase
 *
 * Features:
 * - Persistent User: Data persists across sessions (like a real user)
 * - Ephemeral User: Data resets on logout (clean slate testing)
 *
 * Only rendered when isDevelopment is true
 */
function DevLoginPanel() {
  const navigate = useNavigate();
  const { isDevelopment, devLogin, error: authError } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(null); // 'persistent' | 'ephemeral' | null
  const [error, setError] = useState("");

  // Don't render if not in development
  if (!isDevelopment) {
    return null;
  }

  const handleDevLogin = async (userType) => {
    try {
      setError("");
      setLoading(userType);
      await devLogin(userType);
      navigate("/");
    } catch (err) {
      setError(err.message || "Dev login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: 2,
        border: "2px dashed",
        borderColor: "warning.main",
        backgroundColor: "warning.light",
        opacity: 0.95,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <BugIcon color="warning" />
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="warning.dark"
          >
            Dev Login (Development Only)
          </Typography>
          <Chip
            label="DEV"
            size="small"
            color="warning"
            sx={{ fontWeight: "bold" }}
          />
        </Stack>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {/* Error Alert */}
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || authError}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bypass Firebase authentication for local development testing.
          </Typography>

          <Stack spacing={2}>
            {/* Persistent User Button */}
            <Tooltip
              title="Your conversations, resumes, and profile data will persist between sessions"
              placement="top"
            >
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={
                  loading === "persistent" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PersonIcon />
                  )
                }
                onClick={() => handleDevLogin("persistent")}
                disabled={loading !== null}
                sx={{ justifyContent: "flex-start", py: 1.5 }}
              >
                <Box sx={{ textAlign: "left", ml: 1 }}>
                  <Typography variant="button" display="block">
                    Persistent Dev User
                  </Typography>
                  <Typography
                    variant="caption"
                    color="inherit"
                    sx={{ opacity: 0.8 }}
                  >
                    dev@cvstomize.local — Data persists
                  </Typography>
                </Box>
              </Button>
            </Tooltip>

            {/* Ephemeral User Button */}
            <Tooltip
              title="All data is cleared when you log out — perfect for testing fresh user flows"
              placement="top"
            >
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={
                  loading === "ephemeral" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <RestartIcon />
                  )
                }
                onClick={() => handleDevLogin("ephemeral")}
                disabled={loading !== null}
                sx={{ justifyContent: "flex-start", py: 1.5 }}
              >
                <Box sx={{ textAlign: "left", ml: 1 }}>
                  <Typography variant="button" display="block">
                    Ephemeral Dev User
                  </Typography>
                  <Typography
                    variant="caption"
                    color="inherit"
                    sx={{ opacity: 0.8 }}
                  >
                    ephemeral@cvstomize.local — Resets on logout
                  </Typography>
                </Box>
              </Button>
            </Tooltip>
          </Stack>

          {/* Dev Info */}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px dashed",
              borderColor: "warning.dark",
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CodeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                This panel only appears in development mode
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default DevLoginPanel;
