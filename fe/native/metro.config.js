// Metro config — the shared engine lives OUTSIDE this package
// (../app/src + ../client). Metro needs to watch those folders and
// resolve two aliases: "@" → ../app/src, "@clients" → ../client.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const appSrc = path.resolve(__dirname, "../app/src");
const clientDir = path.resolve(__dirname, "../client");

const config = getDefaultConfig(__dirname);

// ../app/node_modules must be watched too — shared code imports web deps
// (axios, zustand, lucide...) resolved from there; Metro can't serve files
// outside projectRoot + watchFolders even when resolution finds them.
config.watchFolders = [
  appSrc,
  clientDir,
  path.resolve(__dirname, "../app/node_modules"),
];

// Metro equivalent of import.meta.glob — enabled for the generated
// mock-active.native.ts / dev-all.native.ts mock loaders.
config.transformer.unstable_allowRequireContext = true;

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  // shared src imports deps (axios, zustand, jwt-decode...) — resolved
  // from this package's node_modules; fe/app's too as a fallback.
  path.resolve(__dirname, "../app/node_modules"),
];

config.resolver.extraNodeModules = {
  "@/platform": path.resolve(__dirname, "../app/src/common/platform"),
  "@/tenants": path.resolve(__dirname, "../app/src/common/tenants"),
  "@": appSrc,
  "@clients": clientDir,
  // shared src imports web deps — Metro's package heuristics miss these
  // under nodeModulesPaths fallback; pin them explicitly.
  "lucide-react": path.resolve(__dirname, "../app/node_modules/lucide-react"),
  "react-router-dom": path.resolve(__dirname, "../app/node_modules/react-router-dom"),
  "sonner": path.resolve(__dirname, "../app/node_modules/sonner"),
};

// lucide-react/dynamic is a root-level subpath file (dynamic.js → .mjs)
// that Metro's subpath lookup misses; pin it straight to the file.
const lucideDynamic = path.resolve(
  __dirname,
  "../app/node_modules/lucide-react/dynamic.js",
);
const emptyShim = path.resolve(__dirname, "shims/empty.js");

// Packages that only make sense in a DOM. They can never render on
// native (views come from .native adapters / native component maps),
// so failed resolutions fall through to a noop stub — keeps the shared
// engine bundle compiling while hooks/logic stay fully shared.
const DOM_ONLY =
  /^(@radix-ui\/|@base-ui\/|sonner|react-router-dom|@tanstack\/react-virtual|cmdk|vaul|embla-carousel|input-otp|react-day-picker|recharts|lucide-react\/dynamic)/;

const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "lucide-react/dynamic") {
    return { type: "sourceFile", filePath: lucideDynamic };
  }
  // Redirect before resolution AND transform — these packages can never
  // run on native and some (radix) even fail babel parsing.
  if (DOM_ONLY.test(moduleName)) {
    return { type: "sourceFile", filePath: emptyShim };
  }
  return upstreamResolve
    ? upstreamResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
