// Mermaid loader seam — web lazily imports mermaid.js (keeps it out of the
// main bundle); the native variant resolves null so callers degrade to a
// plain-code fallback instead of bundling a DOM-only library.
let promise: Promise<any> | null = null;

export function loadMermaid(): Promise<any> {
  if (!promise) {
    promise = import("mermaid").then((m) => {
      const lib = m.default || m;
      lib.initialize({ startOnLoad: false, theme: "neutral" });
      return lib;
    });
  }
  return promise;
}
