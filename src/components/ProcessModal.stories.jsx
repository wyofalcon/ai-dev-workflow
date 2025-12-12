import React, { useState } from "react";
import { Button } from "@mui/material";
import ProcessModal from "./ProcessModal";

// Mock cvState for the story
const createMockCvState = () => ({
  files: [],
  setFiles: () => {},
  resumeText: "",
  setResumeText: () => {},
  personalStories: "",
  setPersonalStories: () => {},
  jobDescription: "",
  setJobDescription: () => {},
  setGeneratedCv: () => {},
  isLoading: false,
  setIsLoading: () => {},
  error: "",
  setError: () => {},
  selectedSections: [
    "Professional Summary",
    "Work Experience",
    "Education",
    "Skills",
  ],
  setSelectedSections: () => {},
  ALL_SECTIONS: [
    "Professional Summary",
    "Work Experience",
    "Education",
    "Skills",
    "Certifications",
    "Projects",
    "Volunteer Experience",
    "Publications",
    "Awards & Honors",
    "Languages",
  ],
  RECOMMENDED_SECTIONS: [
    "Professional Summary",
    "Work Experience",
    "Education",
    "Skills",
  ],
});

export default {
  title: "Modals/ProcessModal",
  component: ProcessModal,
  parameters: {
    docs: {
      description: {
        component: `
Legacy multi-step wizard for resume generation process.

**Steps:**
1. Your Secret Weapon - Personal stories input
2. Upload Resume - File upload
3. Job Description - Target job input
4. Customize Sections - Section selection

**Note**: This is the older wizard flow. Newer flows use BuildResumeModal and UploadResumeModal.
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export const Default = () => {
  const [open, setOpen] = useState(true);
  const cvState = createMockCvState();
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Process Modal
      </Button>
      <ProcessModal
        open={open}
        handleClose={() => setOpen(false)}
        cvState={cvState}
      />
    </>
  );
};

Default.parameters = {
  docs: {
    description: {
      story: "Full process wizard for resume generation.",
    },
  },
};
