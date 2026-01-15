const locatorPlugin = require("@locator/babel-jsx").default;

// Only use locator plugin in development
const plugins =
  process.env.NODE_ENV === "development"
    ? [[locatorPlugin, { env: "development" }]]
    : [];

module.exports = {
  babel: {
    plugins,
    loaderOptions: (babelLoaderOptions, { env, paths }) => {
      // Fix for React Refresh Babel transform error in production build
      if (env === "production") {
        const origBabelPresetCRAIndex = babelLoaderOptions.presets.findIndex(
          (preset) => {
            return (
              Array.isArray(preset) &&
              preset[0].includes("babel-preset-react-app")
            );
          }
        );

        if (origBabelPresetCRAIndex !== -1) {
          const overridenPreset = [
            babelLoaderOptions.presets[origBabelPresetCRAIndex][0],
            Object.assign(
              babelLoaderOptions.presets[origBabelPresetCRAIndex][1] || {},
              {
                disableReactRefresh: true,
              }
            ),
          ];

          babelLoaderOptions.presets[origBabelPresetCRAIndex] = overridenPreset;
        }
      }

      return babelLoaderOptions;
    },
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
