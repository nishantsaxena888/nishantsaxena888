// Babel — babel-preset-expo + module-resolver for the two shared-code
// aliases (kept in sync with metro.config.js extraNodeModules).
const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@/platform": path.resolve(__dirname, "../app/src/common/platform"),
            "@/tenants": path.resolve(__dirname, "../app/src/common/tenants"),
            "@": path.resolve(__dirname, "../app/src"),
            "@clients": path.resolve(__dirname, "../client"),
          },
        },
      ],
    ],
  };
};
