import React, { useState } from "react";
import { Box, Typography, Tooltip, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BuildIcon from "@mui/icons-material/Build";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TargetIcon from "@mui/icons-material/TrackChanges";
import HomeGraphic from "./HomeGraphic.js";
import BuildResumeModal from "./BuildResumeModal.js";
import UploadResumeModal from "./UploadResumeModal.js";

function HomePage({ onStart }) {
  const navigate = useNavigate();
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const options = [
    {
      id: "build",
      title: "Build Resume/CV from Scratch",
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      tooltip:
        "🛠️ The classic way. Manually enter your details step-by-step using our structured wizard. Perfect if you know exactly what you want to say.",
      action: () => setShowBuildModal(true),
      color: "#9d99e5",
      disabled: false,
    },
    {
      id: "upload",
      title: "CVstomize Mine",
      icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
      tooltip:
        "📄 Already have a resume? Upload it and we'll extract your info to populate your profile instantly. A great starting point for upgrades.",
      action: () => setShowUploadModal(true),
      color: "#7c78d8",
      disabled: false,
    },
    {
      id: "tailor",
      title: "Tailor to Specific Job",
      icon: <TargetIcon sx={{ fontSize: 40 }} />,
      tooltip:
        "🎯 Quick Tailor (~5 min). Paste a job description and we'll ask targeted questions to build a perfectly tailored resume. Upload your existing resume to make it even faster!",
      action: () => navigate("/create-resume"),
      color: "#fdbb2d",
      disabled: false,
    },
  ];

  return (
    <Box
      id="home-page-container"
      data-testid="home-page"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100vh - 200px)",
        textAlign: "center",
      }}
    >
      <HomeGraphic />
      <Typography
        id="home-title"
        data-testid="home-title"
        variant="h3"
        component="h1"
        gutterBottom
      >
        You're more capable than you think. We'll prove it.
      </Typography>

      <Typography
        id="home-subtitle"
        variant="body1"
        color="text.secondary"
        sx={{ mt: 2, mb: 1, maxWidth: 700 }}
      >
        Traditional resumes only show degrees and job titles.{" "}
        <strong style={{ color: "#fdbb2d" }}>
          CVstomize uncovers your hidden skills
        </strong>{" "}
        — the ones you've gained from life experiences, side projects, and
        stories you've never thought to include.
      </Typography>

      <Typography
        id="home-description"
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 600, fontStyle: "italic" }}
      >
        Stop feeling undervalued. Let's discover what makes you truly valuable.
      </Typography>

      <Typography
        id="home-path-label"
        variant="h6"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Choose your path:
      </Typography>

      <Box
        id="home-options-container"
        data-testid="home-options"
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: "wrap",
          justifyContent: "center",
          mb: 3,
        }}
      >
        {options.map((option) => (
          <Tooltip
            key={option.id}
            title={option.tooltip}
            arrow
            placement="bottom"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(30, 30, 30, 0.95)",
                  color: "#e0e0e0",
                  fontSize: "0.9rem",
                  maxWidth: 300,
                  padding: 2,
                  "& .MuiTooltip-arrow": {
                    color: "rgba(30, 30, 30, 0.95)",
                  },
                },
              },
            }}
          >
            <Paper
              id={`home-option-${option.id}`}
              data-testid={`home-option-${option.id}`}
              elevation={hoveredOption === option.id ? 8 : 2}
              onMouseEnter={() =>
                !option.disabled && setHoveredOption(option.id)
              }
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() =>
                !option.disabled && option.action && option.action()
              }
              sx={{
                width: { xs: "100%", sm: 240 },
                height: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: option.disabled ? "not-allowed" : "pointer",
                transition: "all 0.3s ease-in-out",
                backgroundColor:
                  hoveredOption === option.id ? option.color : "#1e1e1e",
                transform:
                  hoveredOption === option.id ? "scale(1.05)" : "scale(1)",
                border: `2px solid ${
                  hoveredOption === option.id ? option.color : "#333"
                }`,
                opacity: option.disabled ? 0.5 : 1,
                "&:hover": {
                  backgroundColor: option.disabled ? "#1e1e1e" : option.color,
                  borderColor: option.disabled ? "#333" : option.color,
                },
              }}
            >
              <Box
                sx={{
                  mb: 1.5,
                  color: hoveredOption === option.id ? "#000" : option.color,
                  transition: "color 0.3s ease-in-out",
                }}
              >
                {option.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: hoveredOption === option.id ? "#000" : "#e0e0e0",
                  transition: "color 0.3s ease-in-out",
                  px: 2,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
              >
                {option.title}
              </Typography>
            </Paper>
          </Tooltip>
        ))}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3, maxWidth: 700 }}
      >
        💡 <strong>Why we're different:</strong> Other resume builders fill
        templates. We have conversations that reveal skills you didn't know you
        had.
      </Typography>

      <BuildResumeModal
        open={showBuildModal}
        onClose={() => setShowBuildModal(false)}
      />
      <UploadResumeModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </Box>
  );
}

export default HomePage;
