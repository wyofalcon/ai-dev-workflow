const locatorPlugin = require("@locator/babel-jsx").default;

// Only use locator plugin in development
const plugins = process.env.NODE_ENV === 'development'
  ? [[locatorPlugin, { env: "development" }]]
  : [];

module.exports = {
  babel: {
    plugins,
  },
  webpack: {
    configure: (webpackConfig) => {
      // Handle ESM packages that use external type 'module'
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });

      // Fix for packages using 'external type module'
      // This allows async chunks to work with ESM modules
      webpackConfig.experiments = {
        ...webpackConfig.experiments,
        topLevelAwait: true,
      };

      // Ensure output supports dynamic imports
      if (webpackConfig.output) {
        webpackConfig.output.environment = {
          ...webpackConfig.output.environment,
          dynamicImport: true,
        };
      }

      return webpackConfig;
    },
  },
};
