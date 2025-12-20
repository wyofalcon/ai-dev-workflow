// ESLint configuration for Storybook files only
// This file is used when running Storybook locally (npm run storybook)
// It's not included in Docker builds to avoid missing dependency errors

module.exports = {
  extends: ["plugin:storybook/recommended"],
  rules: {
    // Add any Storybook-specific rules here
  },
};
