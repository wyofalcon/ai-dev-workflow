module.exports = {
  babel: {
    loaderOptions: (babelLoaderOptions, { env, paths }) => {
      // Fix for React Refresh Babel transform error in production build
      // This disables the react-refresh plugin when building for production
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
};