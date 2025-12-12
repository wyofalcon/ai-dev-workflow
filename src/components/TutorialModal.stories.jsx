import React from "react";
import TutorialModal from "./TutorialModal";

export default {
  title: "Modals/TutorialModal",
  component: TutorialModal,
  parameters: {
    docs: {
      description: {
        component:
          "Tutorial modal explaining how to use CVstomize. Shows step-by-step instructions for new users.",
      },
    },
  },
  tags: ["autodocs"],
};

export const Open = () => (
  <div style={{ position: "relative", minHeight: 400 }}>
    <TutorialModal setIsOpen={() => {}} />
  </div>
);

Open.parameters = {
  docs: {
    description: {
      story: "Tutorial modal with all instructions visible.",
    },
  },
};
