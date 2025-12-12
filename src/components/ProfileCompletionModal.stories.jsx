import React, { useState } from "react";
import { Button } from "@mui/material";
import ProfileCompletionModal from "./ProfileCompletionModal";

export default {
  title: "Modals/ProfileCompletionModal",
  component: ProfileCompletionModal,
  parameters: {
    docs: {
      description: {
        component:
          "Modal prompting users to complete their profile before generating their first resume. Ensures resumes have complete contact information.",
      },
    },
  },
  tags: ["autodocs"],
};

export const NewUser = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <ProfileCompletionModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (data) => {
          console.log("Saved:", data);
          setOpen(false);
        }}
        currentProfile={null}
        userEmail="user@example.com"
        userDisplayName="John Doe"
      />
    </>
  );
};

NewUser.parameters = {
  docs: {
    description: {
      story: "New user with Google SSO - name pre-filled from Google account.",
    },
  },
};

export const ExistingProfile = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <ProfileCompletionModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (data) => {
          console.log("Saved:", data);
          setOpen(false);
        }}
        currentProfile={{
          fullName: "Jane Smith",
          phone: "(555) 123-4567",
          location: "San Francisco, CA",
          linkedinUrl: "https://linkedin.com/in/janesmith",
        }}
        userEmail="jane@example.com"
        userDisplayName="Jane Smith"
      />
    </>
  );
};

ExistingProfile.parameters = {
  docs: {
    description: {
      story: "User with existing profile data - all fields pre-filled.",
    },
  },
};
