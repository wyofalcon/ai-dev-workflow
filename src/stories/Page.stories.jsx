import { Page } from "./Page";

/**
 * Page layout component for the multi-step resume builder.
 *
 * This demonstrates:
 * - Complex layout composition
 * - Progress indicators
 * - Conditional user greeting
 * - Step navigation UI
 */
export default {
  title: "Tutorial/Page",
  component: Page,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A page layout showing the multi-step wizard structure used throughout CVstomize.",
      },
    },
  },
  tags: ["autodocs"],
};

/**
 * First step - entering the job description.
 */
export const Step1JobDescription = {
  args: {
    currentStep: 1,
    totalSteps: 5,
    stepTitle: "Job Description",
    user: { name: "Jane Developer" },
  },
};

/**
 * Middle of the wizard - selecting sections.
 */
export const Step3SelectSections = {
  args: {
    currentStep: 3,
    totalSteps: 5,
    stepTitle: "Select Sections",
    user: { name: "Jane Developer" },
  },
};

/**
 * Final step - generating the resume.
 */
export const Step5Generate = {
  args: {
    currentStep: 5,
    totalSteps: 5,
    stepTitle: "Generate Resume",
    user: { name: "Jane Developer" },
  },
};

/**
 * Page without a logged-in user.
 */
export const LoggedOut = {
  args: {
    currentStep: 1,
    totalSteps: 5,
    stepTitle: "Job Description",
    user: null,
  },
};
