import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import {
  AutoAwesome as SparkleIcon,
  Extension as ExtensionIcon,
  Language as WebIcon,
  VerifiedUser as TrustIcon,
  ArrowForward as ArrowIcon,
  Bolt as FastIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import logo from "./logo.svg";

function LandingPage() {
  const navigate = useNavigate();

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
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 2,
            background: "linear-gradient(45deg, #fff 30%, #fdbb2d 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "2.5rem", md: "3.5rem" },
          }}
        >
          The AI-Led Resume Builder <br />
          for the Complete You
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
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mb: 8 }}
        >
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate("/signup")}
            endIcon={<ArrowIcon />}
            sx={{
              fontSize: "1.1rem",
              px: 5,
              py: 1.2,
              borderRadius: "50px",
              boxShadow: "0 4px 20px 0 rgba(253, 187, 45, 0.4)",
            }}
          >
            Build Your Profile
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
                The Complete Picture
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                We go beyond job titles. Our AI captures your professional achievements 
                and the personal stories you want to share, weaving them into a narrative 
                that stands out.
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
                Tailor in Seconds
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Found a job you like? Our browser extension reads the job description 
                in your active tab and instantly adapts your profile to match it.
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
                Don't just send a PDF. Automatically generate a personal portfolio website 
                showcasing your unique value proposition.
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
