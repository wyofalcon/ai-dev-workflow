import React from "react";
import { Box, Typography, Paper } from "@mui/material";

// Note: Full page components like LoginPage, SignupPage, HomePage require
// router context and auth context to render properly. These stories show
// the documentation and structure without attempting to render the full pages.

export default {
  title: "Pages/Overview",
  parameters: {
    docs: {
      description: {
        component: `
# CVstomize Pages

Overview of all page components in the application.

## Public Pages (No Auth Required)
- **LoginPage** - Email/password and Google OAuth login
- **SignupPage** - New user registration
- **ResetPasswordPage** - Password recovery flow

## Protected Pages (Auth Required)
- **HomePage** - Main dashboard with feature cards
- **OnboardingPage** - First-time user setup wizard
- **UserProfilePage** - Full profile management (3400+ lines)
- **ResumePage** - Resume display and preview
- **ResumeViewPage** - Read-only resume view
- **ConversationalResumePage** - Interactive resume builder
- **GoldStandardWizard** - Premium personality-based generation

## Page Components Location
All pages are in \`src/components/\` and handle:
- Route parameters
- Authentication context
- API calls
- Form state management
        `,
      },
    },
  },
};

const PageCard = ({ title, description, route, authRequired, lines }) => (
  <Paper sx={{ p: 2, mb: 2, backgroundColor: "#1e1e1e" }}>
    <Typography variant="h6" sx={{ color: "#9d99e5" }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      {description}
    </Typography>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <Typography variant="caption" sx={{ color: "#fdbb2d" }}>
        Route: {route}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: authRequired ? "#f44336" : "#4caf50" }}
      >
        {authRequired ? "🔒 Auth Required" : "🌐 Public"}
      </Typography>
      {lines && (
        <Typography variant="caption" sx={{ color: "#607d8b" }}>
          ~{lines} lines
        </Typography>
      )}
    </Box>
  </Paper>
);

export const AllPages = () => (
  <Box sx={{ p: 2, maxWidth: 600 }}>
    <Typography variant="h5" gutterBottom sx={{ color: "#7e78d2" }}>
      📄 All Application Pages
    </Typography>

    <Typography variant="subtitle2" sx={{ color: "#9d99e5", mt: 3, mb: 1 }}>
      Authentication
    </Typography>
    <PageCard
      title="LoginPage"
      description="Email/password login with Google OAuth option"
      route="/login"
      authRequired={false}
      lines={200}
    />
    <PageCard
      title="SignupPage"
      description="New user registration with form validation"
      route="/signup"
      authRequired={false}
      lines={250}
    />
    <PageCard
      title="ResetPasswordPage"
      description="Password recovery via email"
      route="/reset-password"
      authRequired={false}
      lines={150}
    />

    <Typography variant="subtitle2" sx={{ color: "#9d99e5", mt: 3, mb: 1 }}>
      Main Application
    </Typography>
    <PageCard
      title="HomePage"
      description="Main dashboard with BUILD, UPLOAD, GOLD STANDARD cards"
      route="/"
      authRequired={true}
      lines={180}
    />
    <PageCard
      title="OnboardingPage"
      description="First-time user setup wizard with resume upload option"
      route="/onboarding"
      authRequired={true}
      lines={1150}
    />

    <Typography variant="subtitle2" sx={{ color: "#9d99e5", mt: 3, mb: 1 }}>
      Profile & Resume
    </Typography>
    <PageCard
      title="UserProfilePage"
      description="Comprehensive profile editor with all 15+ sections"
      route="/profile"
      authRequired={true}
      lines={3400}
    />
    <PageCard
      title="ResumePage"
      description="Resume preview with download options"
      route="/resume"
      authRequired={true}
      lines={300}
    />
    <PageCard
      title="ResumeViewPage"
      description="Read-only resume display for sharing"
      route="/resume/:id"
      authRequired={true}
      lines={200}
    />

    <Typography variant="subtitle2" sx={{ color: "#9d99e5", mt: 3, mb: 1 }}>
      Premium Features
    </Typography>
    <PageCard
      title="GoldStandardWizard"
      description="Personality assessment + story collection for premium resumes"
      route="/gold-standard"
      authRequired={true}
      lines={790}
    />
    <PageCard
      title="ConversationalResumePage"
      description="Interactive AI-guided resume building"
      route="/build"
      authRequired={true}
      lines={600}
    />
  </Box>
);

AllPages.parameters = {
  docs: {
    description: {
      story:
        "Overview of all page components with routes and complexity indicators.",
    },
  },
};
