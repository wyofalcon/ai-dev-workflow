const locatorPlugin = require("@locator/babel-jsx").default;

module.exports = {
  babel: {
    plugins: [
      [
        locatorPlugin,
        {
          env: "development",
        },
      ],
    ],
  },
};
