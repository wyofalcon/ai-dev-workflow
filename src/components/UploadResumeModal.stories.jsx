import React, { useState } from "react";
import { Button } from "@mui/material";
import UploadResumeModal from "./UploadResumeModal";

export default {
  title: "Modals/UploadResumeModal",
  component: UploadResumeModal,
  parameters: {
    docs: {
      description: {
        component: `
Multi-step wizard modal for uploading and enhancing an existing resume.

**Steps:**
1. Upload Resume - Select PDF/DOCX/TXT file
2. Target Job Posting - Enter job description
3. Select Sections - Choose what to include
4. Review & Generate - Final confirmation

**APIs:**
- Parse: POST /api/profile/parse-resume
- Enhance: POST /api/resume/enhance-uploaded

**Feature**: Automatically syncs parsed data to user profile.
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export const Default = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Upload Resume Modal
      </Button>
      <UploadResumeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

Default.parameters = {
  docs: {
    description: {
      story: "Full upload resume wizard starting at step 1.",
    },
  },
};
