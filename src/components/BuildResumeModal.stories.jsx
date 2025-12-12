import React, { useState } from "react";
import { Button } from "@mui/material";
import BuildResumeModal from "./BuildResumeModal";

export default {
  title: "Modals/BuildResumeModal",
  component: BuildResumeModal,
  parameters: {
    docs: {
      description: {
        component: `
Multi-step wizard modal for building a new resume from scratch.

**Steps:**
1. Job Posting - Enter target job description
2. Upload Resume (Optional) - Reference existing resume
3. Select Sections - Choose what to include
4. Personal Information - Contact details
5. Review & Generate - Final confirmation

**API**: POST /api/resume/build-new
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
        Open Build Resume Modal
      </Button>
      <BuildResumeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

Default.parameters = {
  docs: {
    description: {
      story: "Full build resume wizard starting at step 1.",
    },
  },
};
