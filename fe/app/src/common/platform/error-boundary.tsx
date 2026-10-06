import React from "react";
import { reportError } from "./report";

interface BoundaryProps {
  // Stable label for reports — e.g. "def:stay-grid".
  label: string;
  // When this value changes the boundary resets — a crash under one def
  // must not leak into the next def rendered in this slot.
  resetKey?: unknown;
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

  componentDidUpdate(prevProps: BoundaryProps) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
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
        <strong>Render Error:</strong> "{this.props.label}" crashed.{" "}
        <button
          onClick={() => this.setState({ failed: false })}
          style={{ textDecoration: "underline", fontWeight: 600 }}
        >
          Retry
        </button>
      </div>
    );
  }
}
