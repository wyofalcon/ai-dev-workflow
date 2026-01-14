import React, { useState } from "react";
import { Box, Typography, Paper, Tooltip } from "@mui/material";

/**
 * FeatureCard - A clickable card representing a feature/tool in the application
 *
 * Used in the HomePage to display the main actions:
 * - BUILD NEW RESUME/CV
 * - UPLOAD EXISTING RESUME/CV
 * - TAILOR TO SPECIFIC JOB
 *
 * Props:
 * @param {string} title - The title text displayed on the card
 * @param {ReactNode} icon - MUI icon component to display
 * @param {string} tooltip - Tooltip text explaining the feature
 * @param {function} onClick - Handler when card is clicked
 * @param {string} color - Accent color for hover states
 * @param {boolean} disabled - Whether the card is disabled
 */
function FeatureCard({
  title,
  icon,
  tooltip,
  onClick,
  color = "#9d99e5",
  disabled = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip
      title={tooltip}
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
        elevation={isHovered ? 8 : 2}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !disabled && onClick && onClick()}
        sx={{
          width: { xs: "100%", sm: 240 },
          height: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.3s ease-in-out",
          backgroundColor: isHovered ? color : "#1e1e1e",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          border: `2px solid ${isHovered ? color : "#333"}`,
          opacity: disabled ? 0.5 : 1,
          "&:hover": {
            backgroundColor: disabled ? "#1e1e1e" : color,
            borderColor: disabled ? "#333" : color,
          },
        }}
      >
        <Box
          sx={{
            mb: 1.5,
            color: isHovered ? "#000" : color,
            transition: "color 0.3s ease-in-out",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: isHovered ? "#000" : "#e0e0e0",
            transition: "color 0.3s ease-in-out",
            px: 2,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
      </Paper>
    </Tooltip>
  );
}

export default FeatureCard;
