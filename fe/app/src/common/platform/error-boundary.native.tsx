import React from "react";
import { Pressable, Text, View } from "react-native";
import { reportError } from "./report";

interface BoundaryProps {
  label: string;
  resetKey?: unknown;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

// Native twin of error-boundary.tsx — same contract, RN fallback UI.
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
      <View
        style={{
          padding: 15,
          margin: 10,
          borderWidth: 1,
          borderColor: "#f87171",
          backgroundColor: "#fff1f1",
          borderRadius: 4,
        }}
      >
        <Text style={{ color: "#991b1b", fontWeight: "700" }}>
          Render Error: "{this.props.label}" crashed.
        </Text>
        <Pressable onPress={() => this.setState({ failed: false })}>
          <Text style={{ color: "#991b1b", textDecorationLine: "underline" }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }
}
