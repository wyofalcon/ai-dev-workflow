import Footer from "./Footer";

export default {
  title: "Layout/Footer",
  component: Footer,
  parameters: {
    docs: {
      description: {
        component: "Application footer with copyright and GitHub links.",
      },
    },
  },
  tags: ["autodocs"],
};

export const Default = {
  parameters: {
    docs: {
      description: {
        story: "The standard footer displayed at the bottom of every page.",
      },
    },
  },
};
