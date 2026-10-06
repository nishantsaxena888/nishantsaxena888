// GENERATED — do not edit by hand.
// `npm run client <name>` rewrites this file. Native variant of
// mock-active.ts — import.meta.glob is Vite-only; require.context is the
// Metro equivalent (synchronous like eager:true). Keys are rewritten to
// the same ../../../client/... shape loadGlobs expects.
const ctx = (require as any).context(
  "../../../client/uday/mock",
  true,
  /\.json$/,
);
export const mockFiles: Record<string, unknown> = Object.fromEntries(
  ctx.keys().map((k: string) => [
    `../../../client/uday/mock/${k.replace(/^\.\//, "")}`,
    ctx(k),
  ]),
);
