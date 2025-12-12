import React from "react";
import { Box, Typography } from "@mui/material";
import HomeGraphic from "./HomeGraphic";
import UploadGraphic from "./UploadGraphic";
import StoriesGraphic from "./StoriesGraphic";
import JobDescriptionGraphic from "./JobDescriptionGraphic";
import SectionsGraphic from "./SectionsGraphic";

export default {
  title: "Graphics/SVG Icons",
  parameters: {
    docs: {
      description: {
        component:
          "Decorative SVG graphics used throughout the application for visual appeal. All use gradient fills matching the app's color scheme.",
      },
    },
  },
  tags: ["autodocs"],
};

export const Home = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      HomeGraphic
    </Typography>
    <HomeGraphic />
    <Typography variant="body2" color="text.secondary">
      Displayed on the homepage above the main heading.
    </Typography>
  </Box>
);

export const Upload = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      UploadGraphic
    </Typography>
    <UploadGraphic />
    <Typography variant="body2" color="text.secondary">
      Used in the resume upload step of wizards.
    </Typography>
  </Box>
);

export const Stories = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      StoriesGraphic
    </Typography>
    <StoriesGraphic />
    <Typography variant="body2" color="text.secondary">
      Used in the personal stories step.
    </Typography>
  </Box>
);

export const JobDescription = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      JobDescriptionGraphic
    </Typography>
    <JobDescriptionGraphic />
    <Typography variant="body2" color="text.secondary">
      Used in the job description input step.
    </Typography>
  </Box>
);

export const Sections = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      SectionsGraphic
    </Typography>
    <SectionsGraphic />
    <Typography variant="body2" color="text.secondary">
      Used in the section selector step.
    </Typography>
  </Box>
);

export const AllGraphics = () => (
  <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 4 }}>
    <Box sx={{ textAlign: "center" }}>
      <HomeGraphic />
      <Typography variant="caption">Home</Typography>
    </Box>
    <Box sx={{ textAlign: "center" }}>
      <UploadGraphic />
      <Typography variant="caption">Upload</Typography>
    </Box>
    <Box sx={{ textAlign: "center" }}>
      <StoriesGraphic />
      <Typography variant="caption">Stories</Typography>
    </Box>
    <Box sx={{ textAlign: "center" }}>
      <JobDescriptionGraphic />
      <Typography variant="caption">Job Desc</Typography>
    </Box>
    <Box sx={{ textAlign: "center" }}>
      <SectionsGraphic />
      <Typography variant="caption">Sections</Typography>
    </Box>
  </Box>
);

AllGraphics.parameters = {
  docs: {
    description: {
      story: "All SVG graphics displayed together for comparison.",
    },
  },
};
