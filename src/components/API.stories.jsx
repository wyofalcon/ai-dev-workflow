import React from "react";
import { Box, Typography, Paper, Chip, Divider } from "@mui/material";

export default {
  title: "API/Endpoints",
  parameters: {
    docs: {
      description: {
        component: `
# CVstomize API Endpoints

Complete reference of all backend API endpoints.

## Base URL
- **Development**: http://localhost:8080/api
- **Production**: https://api.cvstomize.com/api

## Authentication
All protected endpoints require:
\`\`\`
Authorization: Bearer <firebase-id-token>
\`\`\`
        `,
      },
    },
  },
};

const EndpointCard = ({
  method,
  path,
  description,
  auth = true,
  body,
  response,
}) => {
  const methodColors = {
    GET: "#4caf50",
    POST: "#2196f3",
    PATCH: "#ff9800",
    DELETE: "#f44336",
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: "#1e1e1e" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Chip
          label={method}
          size="small"
          sx={{
            backgroundColor: methodColors[method],
            color: "#fff",
            fontWeight: "bold",
            minWidth: 60,
          }}
        />
        <Typography
          variant="body1"
          sx={{ fontFamily: "monospace", color: "#e0e0e0" }}
        >
          {path}
        </Typography>
        {auth && (
          <Chip
            label="🔒"
            size="small"
            variant="outlined"
            sx={{ ml: "auto" }}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      {body && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1, color: "#9d99e5" }}
        >
          Body: {body}
        </Typography>
      )}
      {response && (
        <Typography
          variant="caption"
          sx={{ display: "block", color: "#fdbb2d" }}
        >
          Returns: {response}
        </Typography>
      )}
    </Paper>
  );
};

export const AuthEndpoints = () => (
  <Box sx={{ p: 2, maxWidth: 700 }}>
    <Typography variant="h5" gutterBottom sx={{ color: "#7e78d2" }}>
      🔐 Authentication Endpoints
    </Typography>
    <EndpointCard
      method="POST"
      path="/auth/register"
      description="Register new user after Firebase signup"
      body="{ displayName }"
      response="{ user, message }"
    />
    <EndpointCard
      method="POST"
      path="/auth/login"
      description="Record login and get user data"
      response="{ user, message }"
    />
    <EndpointCard
      method="GET"
      path="/auth/verify"
      description="Verify Firebase token is valid"
      response="{ valid, user }"
    />
    <EndpointCard
      method="GET"
      path="/auth/me"
      description="Get current user profile"
      response="{ user }"
    />
    <EndpointCard
      method="POST"
      path="/auth/logout"
      description="Record logout event"
      response="{ message }"
    />
  </Box>
);

export const ProfileEndpoints = () => (
  <Box sx={{ p: 2, maxWidth: 700 }}>
    <Typography variant="h5" gutterBottom sx={{ color: "#7e78d2" }}>
      👤 Profile Endpoints
    </Typography>
    <EndpointCard
      method="GET"
      path="/profile"
      description="Get user profile data"
      response="{ profile }"
    />
    <EndpointCard
      method="POST"
      path="/profile"
      description="Create or update profile"
      body="{ fullName, phone, location, ... }"
      response="{ profile }"
    />
    <EndpointCard
      method="POST"
      path="/profile/parse-resume"
      description="Upload and parse resume file"
      body="FormData with file"
      response="{ parsedData, profileSynced }"
    />
    <EndpointCard
      method="POST"
      path="/profile/parse-resume-text"
      description="Parse pasted resume text"
      body="{ resumeText }"
      response="{ parsedData, profileSynced }"
    />
    <EndpointCard
      method="GET"
      path="/profile/uploaded-resumes"
      description="List all uploaded resumes"
      response="{ resumes[] }"
    />
    <EndpointCard
      method="DELETE"
      path="/profile/uploaded-resumes/:id"
      description="Delete an uploaded resume"
      response="{ message }"
    />
  </Box>
);

export const ResumeEndpoints = () => (
  <Box sx={{ p: 2, maxWidth: 700 }}>
    <Typography variant="h5" gutterBottom sx={{ color: "#7e78d2" }}>
      📄 Resume Endpoints
    </Typography>
    <EndpointCard
      method="POST"
      path="/resume/build-new"
      description="Generate new resume from scratch"
      body="{ jobDescription, selectedSections, ... }"
      response="{ resume, usage }"
    />
    <EndpointCard
      method="POST"
      path="/resume/enhance-uploaded"
      description="Enhance uploaded resume for job"
      body="{ resumeId, jobDescription }"
      response="{ resume }"
    />
    <EndpointCard
      method="POST"
      path="/resume/generate"
      description="Generate resume (Gold Standard)"
      body="{ sessionId, jobDescription }"
      response="{ resume }"
    />
    <EndpointCard
      method="GET"
      path="/resume/list"
      description="List all saved resumes"
      response="{ resumes[] }"
    />
    <EndpointCard
      method="GET"
      path="/resume/:id"
      description="Get specific resume"
      response="{ resume }"
    />
    <EndpointCard
      method="GET"
      path="/resume/:id/pdf"
      description="Download resume as PDF"
      body="?template=classic|modern|minimal"
      response="PDF file"
    />
    <EndpointCard
      method="GET"
      path="/resume/:id/ats-analysis"
      description="Get ATS match analysis"
      response="{ score, suggestions }"
    />
    <EndpointCard
      method="DELETE"
      path="/resume/:id"
      description="Delete a resume"
      response="{ message }"
    />
  </Box>
);

export const GoldStandardEndpoints = () => (
  <Box sx={{ p: 2, maxWidth: 700 }}>
    <Typography variant="h5" gutterBottom sx={{ color: "#7e78d2" }}>
      ⭐ Gold Standard Endpoints
    </Typography>
    <EndpointCard
      method="POST"
      path="/gold-standard/start"
      description="Start Gold Standard session"
      body="{ jobDescription }"
      response="{ sessionId, questions }"
    />
    <EndpointCard
      method="POST"
      path="/gold-standard/answer"
      description="Submit story answer"
      body="{ sessionId, questionId, answer }"
      response="{ nextQuestion }"
    />
    <EndpointCard
      method="POST"
      path="/gold-standard/complete"
      description="Complete assessment"
      body="{ sessionId }"
      response="{ personalityScores }"
    />
    <EndpointCard
      method="POST"
      path="/gold-standard/generate-embeddings"
      description="Generate story embeddings"
      body="{ sessionId }"
      response="{ embeddings }"
    />
    <EndpointCard
      method="GET"
      path="/gold-standard/status"
      description="Get session status"
      response="{ status, progress }"
    />
    <EndpointCard
      method="GET"
      path="/gold-standard/results"
      description="Get assessment results"
      response="{ personality, stories }"
    />
  </Box>
);

export const ConversationEndpoints = () => (
  <Box sx={{ p: 2, maxWidth: 700 }}>
    <Typography variant="h5" gutterBottom sx={{ color: "#7e78d2" }}>
      💬 Conversation Endpoints
    </Typography>
    <EndpointCard
      method="POST"
      path="/conversation/start"
      description="Start conversation session"
      body="{ jobDescription, existingResume? }"
      response="{ sessionId, questions }"
    />
    <EndpointCard
      method="POST"
      path="/conversation/message"
      description="Send answer, get next question"
      body="{ sessionId, answer }"
      response="{ question, complete }"
    />
    <EndpointCard
      method="GET"
      path="/conversation/:sessionId"
      description="Get conversation history"
      response="{ messages[] }"
    />
    <EndpointCard
      method="POST"
      path="/conversation/complete"
      description="Complete conversation"
      body="{ sessionId }"
      response="{ summary }"
    />
  </Box>
);

export const AllEndpoints = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h4" gutterBottom sx={{ color: "#7e78d2" }}>
      🔌 Complete API Reference
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      All backend endpoints organized by domain.
    </Typography>
    <Divider sx={{ mb: 3 }} />
    <AuthEndpoints />
    <Divider sx={{ my: 3 }} />
    <ProfileEndpoints />
    <Divider sx={{ my: 3 }} />
    <ResumeEndpoints />
    <Divider sx={{ my: 3 }} />
    <GoldStandardEndpoints />
    <Divider sx={{ my: 3 }} />
    <ConversationEndpoints />
  </Box>
);

AllEndpoints.parameters = {
  docs: {
    description: {
      story: "Complete API endpoint reference for CVstomize backend.",
    },
  },
};
