// Metro config — the shared engine lives OUTSIDE this package
// (../app/src + ../client). Metro needs to watch those folders and
// resolve two aliases: "@" → ../app/src, "@clients" → ../client.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const appSrc = path.resolve(__dirname, "../app/src");
const clientDir = path.resolve(__dirname, "../client");

const config = getDefaultConfig(__dirname);

config.watchFolders = [appSrc, clientDir];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  // shared src imports deps (axios, zustand, jwt-decode...) — resolved
  // from this package's node_modules; fe/app's too as a fallback.
  path.resolve(__dirname, "../app/node_modules"),
];

config.resolver.extraNodeModules = {
  "@": appSrc,
  "@clients": clientDir,
};

module.exports = config;
