import React from "react";
import { reportError } from "./report";

interface BoundaryProps {
  // Stable label for reports — e.g. "def:stay-grid".
  label: string;
  // Rendered instead of children on crash. When omitted a neutral
  // inline box is shown (dev-friendly but not a white screen in prod).
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

// Per-definition boundary: one crashing component renders this inline
// box instead of unmounting the whole page. Reports through the
// platform/report seam so production sinks still see the failure.
export class DefErrorBoundary extends React.Component<
  BoundaryProps,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, {
      source: `render:${this.props.label}`,
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div
        style={{
          padding: "15px",
          margin: "10px",
          border: "1px solid #f87171",
          backgroundColor: "#fff1f1",
          borderRadius: "4px",
          color: "#991b1b",
        }}
      >
        <strong>Render Error:</strong> "{this.props.label}" crashed. The rest
        of the page is unaffected.
      </div>
    );
  }
}
