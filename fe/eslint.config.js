// fe/-level lint entry — covers client folders. eslint resolves config
// only from cwd, so `fe/app` cannot lint ../client directly; this file
// re-exports the client-side boundary config that lives beside the
// eslint dependencies in fe/app.
export { clientConfig as default } from "./app/eslint.config.js";
