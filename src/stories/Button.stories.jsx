import { fn } from "storybook/test";
import { Button } from "./Button";

/**
 * Primary UI component for user interaction.
 *
 * This Button component is themed for CVstomize and demonstrates
 * how to create interactive, documented components in Storybook.
 *
 * **Features:**
 * - Primary (contained) and secondary (outlined) variants
 * - Three sizes: small, medium, large
 * - Custom background colors
 * - Full accessibility support
 */
export default {
  title: "Tutorial/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A themed button component built on Material-UI. Use this as a reference for creating your own component stories.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    backgroundColor: { control: "color" },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
    },
    primary: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    onClick: fn(),
  },
};

/**
 * Primary buttons are used for the main call-to-action.
 * They have a solid background color.
 */
export const Primary = {
  args: {
    primary: true,
    label: "Generate Resume",
    backgroundColor: "#9d99e5",
  },
};

/**
 * Secondary buttons are used for less prominent actions.
 * They have an outlined style.
 */
export const Secondary = {
  args: {
    primary: false,
    label: "Cancel",
    backgroundColor: "#9d99e5",
  },
};

/**
 * Large buttons for prominent placement.
 */
export const Large = {
  args: {
    size: "large",
    label: "Start Building",
    primary: true,
    backgroundColor: "#7e78d2",
  },
};

/**
 * Small buttons for inline actions.
 */
export const Small = {
  args: {
    size: "small",
    label: "Edit",
    primary: false,
  },
};

/**
 * Gold accent for premium features like Gold Standard.
 */
export const GoldAccent = {
  args: {
    primary: true,
    label: "Gold Standard",
    backgroundColor: "#fdbb2d",
  },
};

/**
 * Success state button.
 */
export const Success = {
  args: {
    primary: true,
    label: "Download PDF",
    backgroundColor: "#4caf50",
  },
};

/**
 * Danger/destructive action button.
 */
export const Danger = {
  args: {
    primary: true,
    label: "Delete Resume",
    backgroundColor: "#f44336",
  },
};
