import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  IconButton,
  Popover,
} from "@mui/material";
import {
  AutoAwesome as SparkleIcon,
  Extension as ExtensionIcon,
  Language as WebIcon,
  VerifiedUser as TrustIcon,
  ArrowForward as ArrowIcon,
  Bolt as FastIcon,
  Person as PersonIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import logo from "./logo.svg";

function LandingPage() {
  const navigate = useNavigate();
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);

  const handleInfoOpen = (event) => {
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
  };

  const isInfoOpen = Boolean(infoAnchorEl);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          maxWidth: "1280px",
          mx: "auto",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={logo} alt="CVstomize" style={{ height: 50 }} />
          <Typography
            variant="h5"
            component="span"
            sx={{ fontWeight: "bold", letterSpacing: 1 }}
          >
            CVstomize
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            color="inherit"
            onClick={() => navigate("/login")}
            sx={{ fontWeight: 500 }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate("/signup")}
            sx={{
              fontWeight: "bold",
              px: 3,
              borderRadius: "50px",
              boxShadow: "0 4px 14px 0 rgba(253, 187, 45, 0.39)",
            }}
          >
            Get Started Free
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 6, pb: 4, textAlign: "center", flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography
          variant="overline"
          sx={{ color: "#fdbb2d", fontWeight: "bold", letterSpacing: 2, mb: 1 }}
        >
          The AI-Led Resume Builder for the Complete You
        </Typography>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 2,
            color: "#fff",
            fontSize: { xs: "2.5rem", md: "4rem" },
            lineHeight: 1.1
          }}
        >
          You're More Capable than You Know. <br />
          <span style={{ color: "#fdbb2d" }}>We'll Prove It.</span>
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: "800px", mx: "auto", lineHeight: 1.5, fontWeight: 400 }}
        >
          Stop feeling overwhelmed. We capture your full professional
          and personal story to build a profile that truly represents you.
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 8 }}
        >
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconButton 
              size="small" 
              onClick={handleInfoOpen}
              sx={{ 
                mr: 1,
                color: 'rgba(255,255,255,0.5)',
                '&:hover': { color: '#fdbb2d' }
              }}
            >
              <InfoIcon />
            </IconButton>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate("/easy-cv")}
              startIcon={<SparkleIcon />}
              sx={{
                fontSize: "1.2rem",
                px: 5,
                py: 1.5,
                borderRadius: "50px",
                boxShadow: "0 4px 20px 0 rgba(253, 187, 45, 0.4)",
                minWidth: "220px"
              }}
            >
              Easy CV
            </Button>
            
            <Popover
              open={isInfoOpen}
              anchorEl={infoAnchorEl}
              onClose={handleInfoClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              PaperProps={{
                sx: {
                  p: 3,
                  maxWidth: 350,
                  bgcolor: '#1e1e1e',
                  color: '#fff',
                  border: '1px solid #333',
                  mt: 1
                }
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#fdbb2d' }}>
                How Easy CV Works
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                Easy CV clearly walks you through building a basic resume, which is the start of building a full profile on CVstomize.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                Otherwise, you can upload your own resume after signing up and it will be smart-parsed to your CVstom Profile.
              </Typography>
            </Popover>
          </Box>

          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => navigate("/signup")}
            sx={{
              fontSize: "1.1rem",
              px: 5,
              py: 1.5,
              borderRadius: "50px",
              borderColor: "rgba(255,255,255,0.3)",
              minWidth: "220px"
            }}
          >
            Create Full Profile
          </Button>
        </Stack>

        {/* Compact Feature Row */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                textAlign: "left",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)", borderColor: "#fdbb2d" }
              }}
            >
              <PersonIcon sx={{ fontSize: 40, color: "#fdbb2d", mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#fff" }}>
                CVstom Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Your career belongs to you. Build one master profile that acts as your 
                single source of truth. When opportunities arise (or things change), 
                you're ready instantly.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                textAlign: "left",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)", borderColor: "#fdbb2d" }
              }}
            >
              <ExtensionIcon sx={{ fontSize: 40, color: "#fdbb2d", mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#fff" }}>
                Quick Tailor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Unlock the power of your CVstom Profile. Use our browser extension 
                to instantly tailor your resume to any job posting tab you have open.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                textAlign: "left",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)", borderColor: "#fdbb2d" }
              }}
            >
              <WebIcon sx={{ fontSize: 40, color: "#fdbb2d", mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#fff" }}>
                One-Click Portfolio
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Turn your CVstom Profile into a stunning personal website with one click. 
                Share your link, not just a file.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Trust Footer */}
      <Box sx={{ py: 3, borderTop: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(0,0,0,0.2)" }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item>
               <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <TrustIcon fontSize="small" color="secondary" /> Free & Open
               </Typography>
            </Grid>
            <Grid item>
               <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <TrustIcon fontSize="small" color="secondary" /> No Ads
               </Typography>
            </Grid>
            <Grid item>
               <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <TrustIcon fontSize="small" color="secondary" /> No Credit Card Required
               </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
