import React from "react";
import type { Preview } from "@storybook/react-webpack5";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../src/theme";

// Decorator to wrap all stories with MUI ThemeProvider
const withMuiTheme = (Story: React.ComponentType) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <div
      style={{
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <Story />
    </div>
  </ThemeProvider>
);

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      sort: "requiredFirst",
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#121212" },
        { name: "paper", value: "#1e1e1e" },
        { name: "light", value: "#ffffff" },
      ],
    },
    docs: {
      toc: true, // Enable table of contents
    },
    layout: "centered",
    options: {
      storySort: {
        method: "alphabetical",
        order: [
          "Introduction",
          "Design System",
          "Pages",
          "Modals",
          "Forms",
          "UI",
          "Features",
          "API",
          "*",
        ],
      },
    },
  },
  decorators: [withMuiTheme],
  tags: ["autodocs"],
};

export default preview;
