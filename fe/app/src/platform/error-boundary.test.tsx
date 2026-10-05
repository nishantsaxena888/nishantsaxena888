import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { reportError, setReporter } from "./report";
import { DefErrorBoundary } from "./error-boundary";

const Thrower = (): never => {
  throw new Error("boom");
};

describe("platform/report", () => {
  afterEach(() => setReporter(() => {}));

  it("routes errors to the installed reporter with context", () => {
    const sink = vi.fn();
    setReporter(sink);
    const err = new Error("x");
    reportError(err, { source: "render:stay-grid", extra: { id: 7 } });
    expect(sink).toHaveBeenCalledWith(err, {
      source: "render:stay-grid",
      extra: { id: 7 },
    });
  });

  it("a throwing reporter cannot crash the caller", () => {
    setReporter(() => {
      throw new Error("sink down");
    });
    expect(() => reportError(new Error("y"))).not.toThrow();
  });
});

describe("DefErrorBoundary", () => {
  beforeEach(() => {
    // React logs caught errors to console — keep test output readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders children when nothing throws", () => {
    render(
      <DefErrorBoundary label="ok-comp">
        <div>healthy</div>
      </DefErrorBoundary>,
    );
    expect(screen.getByText("healthy")).toBeTruthy();
  });

  it("catches a render crash, reports it, and shows the default box", () => {
    const sink = vi.fn();
    setReporter(sink);
    render(
      <DefErrorBoundary label="stay-grid">
        <Thrower />
      </DefErrorBoundary>,
    );
    expect(screen.getByText(/stay-grid.*crashed/)).toBeTruthy();
    expect(sink).toHaveBeenCalledOnce();
    expect(sink.mock.calls[0][1].source).toBe("render:stay-grid");
  });

  it("renders a custom fallback when provided", () => {
    render(
      <DefErrorBoundary label="x" fallback={<div>custom fb</div>}>
        <Thrower />
      </DefErrorBoundary>,
    );
    expect(screen.getByText("custom fb")).toBeTruthy();
  });
});
