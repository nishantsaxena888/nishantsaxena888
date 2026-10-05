// Mermaid diagram — renders ```mermaid code sections as SVG. mermaid.js
// is lazy-imported on first use (keeps it out of the main bundle); on
// non-DOM runtimes (native) or a failed render the block degrades to the
// plain code display instead of crashing.
import { useEffect, useRef, useState } from "react";
import { Text, View } from "@/platform/primitives";

let idSeq = 0;
let mermaidPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const lib = m.default || m;
      lib.initialize({ startOnLoad: false, theme: "neutral" });
      return lib;
    });
  }
  return mermaidPromise;
};

export default function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadMermaid()
      .then(async (m) => {
        if (!alive || !ref.current) return;
        const { svg } = await m.render(`md-mermaid-${idSeq++}`, code);
        if (alive && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [code]);

  if (failed) {
    return (
      <View className="rounded-lg border bg-muted/50 overflow-hidden">
        <Text className="px-3 py-1 text-xs text-muted-foreground border-b">
          mermaid
        </Text>
        <Text as="pre" className="p-3 overflow-x-auto text-sm">
          {code}
        </Text>
      </View>
    );
  }
  return (
    <View className="mermaid-diagram rounded-lg border p-3 overflow-x-auto">
      <div ref={ref} />
    </View>
  );
}
