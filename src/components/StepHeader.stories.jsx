import React from "react";
import StepHeader from "./StepHeader";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";
import TuneIcon from "@mui/icons-material/Tune";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

export default {
  title: "UI/StepHeader",
  component: StepHeader,
  parameters: {
    docs: {
      description: {
        component: "Header component for wizard steps with icon and title.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
  },
};

export const UploadStep = {
  args: {
    icon: <UploadFileIcon sx={{ fontSize: 30, mr: 1, color: "#9d99e5" }} />,
    title: "Upload Your Resume",
  },
};

export const StoriesStep = {
  args: {
    icon: <AutoStoriesIcon sx={{ fontSize: 30, mr: 1, color: "#fdbb2d" }} />,
    title: "Your Secret Weapon",
  },
};

export const JobDescriptionStep = {
  args: {
    icon: <DescriptionIcon sx={{ fontSize: 30, mr: 1, color: "#22c1c3" }} />,
    title: "Job Description",
  },
};

export const CustomizeStep = {
  args: {
    icon: <TuneIcon sx={{ fontSize: 30, mr: 1, color: "#e91e63" }} />,
    title: "Customize Sections",
  },
};
