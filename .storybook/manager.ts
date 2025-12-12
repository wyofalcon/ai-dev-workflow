import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const theme = create({
  base: "dark",

  // Brand
  brandTitle: "CVstomize Design System",
  brandUrl: "https://github.com/wyofalcon/cvstomize",
  brandTarget: "_blank",

  // Colors
  colorPrimary: "#9d99e5",
  colorSecondary: "#7e78d2",

  // UI
  appBg: "#121212",
  appContentBg: "#1e1e1e",
  appBorderColor: "#333333",
  appBorderRadius: 8,

  // Text colors
  textColor: "#e0e0e0",
  textInverseColor: "#121212",
  textMutedColor: "#9e9e9e",

  // Toolbar
  barTextColor: "#e0e0e0",
  barHoverColor: "#9d99e5",
  barSelectedColor: "#7e78d2",
  barBg: "#1e1e1e",

  // Form colors
  buttonBg: "#7e78d2",
  buttonBorder: "#7e78d2",
  inputBg: "#2d2d2d",
  inputBorder: "#333333",
  inputTextColor: "#e0e0e0",
  inputBorderRadius: 4,
});

addons.setConfig({
  theme,
  sidebar: {
    showRoots: true,
    collapsedRoots: ["api", "development"],
  },
  toolbar: {
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});
