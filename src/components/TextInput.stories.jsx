import React, { useState } from "react";
import TextInput from "./TextInput";

export default {
  title: "Forms/TextInput",
  component: TextInput,
  parameters: {
    docs: {
      description: {
        component:
          "Multi-line text input with title and placeholder. Used for job descriptions, personal stories, and resume text.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    placeholder: { control: "text" },
  },
};

export const JobDescription = {
  args: {
    title: "Job Description",
    placeholder: "Paste the job description here...",
    value: "",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Input for pasting target job descriptions for resume tailoring.",
      },
    },
  },
};

export const PersonalStories = {
  args: {
    title: "Your Secret Weapon",
    placeholder:
      "Share experiences, projects, or skills that make you unique...",
    value: "",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Input for personal stories and experiences that enhance resume content.",
      },
    },
  },
};

export const ResumeText = {
  args: {
    title: "Resume Text",
    placeholder: "Paste your existing resume text here...",
    value: "",
  },
  parameters: {
    docs: {
      description: {
        story: "Input for pasting existing resume content for parsing.",
      },
    },
  },
};

export const WithContent = () => {
  const [value, setValue] = useState(
    "This is some sample content that the user has typed."
  );
  return (
    <TextInput
      title="Example with Content"
      placeholder="Start typing..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

WithContent.parameters = {
  docs: {
    description: {
      story: "Interactive example showing the component with user input.",
    },
  },
};
