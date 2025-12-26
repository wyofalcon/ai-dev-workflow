module.exports = {
  babel: {
    plugins: [
      process.env.NODE_ENV === "development" && [
        "@locator/babel-jsx",
        {
          env: "development",
        },
      ],
    ].filter(Boolean),
  },
};
