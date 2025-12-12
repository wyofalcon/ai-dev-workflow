import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, LinearProgress, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

/**
 * A page layout component that demonstrates building a complete page
 * with header, content, and progress indicators.
 */
export const Page = ({ user, currentStep, totalSteps, stepTitle }) => {
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    "Job Description",
    "Upload Resume",
    "Select Sections",
    "Personal Info",
    "Generate",
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#e0e0e0",
      }}
    >
      {/* Progress header */}
      <Box
        sx={{
          padding: "16px 24px",
          borderBottom: "1px solid #333",
          backgroundColor: "#1e1e1e",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "#9d99e5" }}>
            {stepTitle}
          </Typography>
          <Chip
            label={`Step ${currentStep} of ${totalSteps}`}
            size="small"
            sx={{
              backgroundColor: "#9d99e520",
              color: "#9d99e5",
            }}
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "#333",
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg, #9d99e5, #fdbb2d)",
              borderRadius: 4,
            },
          }}
        />

        {/* Step indicators */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 2,
          }}
        >
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const isComplete = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {isComplete ? (
                  <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 20 }} />
                ) : (
                  <RadioButtonUncheckedIcon
                    sx={{
                      color: isCurrent ? "#9d99e5" : "#666",
                      fontSize: 20,
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: isCurrent
                      ? "#9d99e5"
                      : isComplete
                      ? "#4caf50"
                      : "#666",
                    fontWeight: isCurrent ? "bold" : "normal",
                  }}
                >
                  {step}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Main content area */}
      <Box sx={{ padding: "32px 24px" }}>
        <Typography
          variant="body1"
          sx={{ textAlign: "center", color: "#9e9e9e" }}
        >
          {user ? `Welcome back, ${user.name}!` : "Please log in to continue."}
        </Typography>

        <Box
          sx={{
            mt: 4,
            p: 4,
            backgroundColor: "#1e1e1e",
            borderRadius: 2,
            border: "1px solid #333",
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ color: "#fdbb2d", mb: 2 }}>
            Step {currentStep}: {stepTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
            This is where the step content would appear.
            <br />
            The Page component provides the layout structure.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

Page.propTypes = {
  /** The logged-in user */
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  /** Current step number (1-indexed) */
  currentStep: PropTypes.number.isRequired,
  /** Total number of steps */
  totalSteps: PropTypes.number.isRequired,
  /** Title of the current step */
  stepTitle: PropTypes.string.isRequired,
};

Page.defaultProps = {
  user: null,
};

export default Page;
