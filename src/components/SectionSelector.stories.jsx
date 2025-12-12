import React, { useState } from "react";
import SectionSelector from "./SectionSelector";

const ALL_SECTIONS = [
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
];

const RECOMMENDED_SECTIONS = [
  "Professional Summary",
  "Work Experience",
  "Education",
  "Skills",
];

export default {
  title: "Forms/SectionSelector",
  component: SectionSelector,
  parameters: {
    docs: {
      description: {
        component:
          "Checkbox list for selecting which sections to include in the generated resume. Shows recommended badges for common sections.",
      },
    },
  },
  tags: ["autodocs"],
};

export const DefaultSelection = () => {
  const [selected, setSelected] = useState(RECOMMENDED_SECTIONS);
  return (
    <SectionSelector
      allSections={ALL_SECTIONS}
      recommendedSections={RECOMMENDED_SECTIONS}
      selectedSections={selected}
      setSelectedSections={setSelected}
    />
  );
};

DefaultSelection.parameters = {
  docs: {
    description: {
      story: "Default state with recommended sections pre-selected.",
    },
  },
};

export const AllSelected = () => {
  const [selected, setSelected] = useState(ALL_SECTIONS);
  return (
    <SectionSelector
      allSections={ALL_SECTIONS}
      recommendedSections={RECOMMENDED_SECTIONS}
      selectedSections={selected}
      setSelectedSections={setSelected}
    />
  );
};

AllSelected.parameters = {
  docs: {
    description: {
      story: "All sections selected for a comprehensive resume.",
    },
  },
};

export const MinimalSelection = () => {
  const [selected, setSelected] = useState(["Work Experience", "Skills"]);
  return (
    <SectionSelector
      allSections={ALL_SECTIONS}
      recommendedSections={RECOMMENDED_SECTIONS}
      selectedSections={selected}
      setSelectedSections={setSelected}
    />
  );
};

MinimalSelection.parameters = {
  docs: {
    description: {
      story: "Minimal selection for a focused, concise resume.",
    },
  },
};
