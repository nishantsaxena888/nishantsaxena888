// Stub for DOM-only packages that Metro can't resolve or that can never
// render on native (radix, sonner, react-router-dom, ...). Named imports
// become noop functions — enough for the bundle to compile. Native views
// come from .native adapters / client native component maps instead.
module.exports = new Proxy(
  {},
  { get: () => () => null },
);
