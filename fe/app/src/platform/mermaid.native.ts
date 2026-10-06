// mermaid.js needs the DOM — on native we resolve null and callers render
// the raw code fallback.
export function loadMermaid(): Promise<any> {
  return Promise.resolve(null);
}
