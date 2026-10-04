// RenderEngine contract — "a page is JSON". These pin the mapping layer
// every platform (web/RN/desktop) reimplements: def.type → component,
// children recursion, dynamic-def actionData, unknown-type diagnostics.
// View components are stubs — the test is about the engine, not the DOM.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenderEngineProvider } from "./render-engine-context";
import { RenderDefinition } from "./render-definition";

// Control useDynamicData so tests never touch the network layer.
const dyn = vi.hoisted(() => ({
  state: {
    apiData: undefined as any,
    loading: false,
    skeletonLoading: false,
    error: null as any,
    firstLoadError: null as any,
    action: vi.fn(),
    searchParameters: {},
  },
}));
vi.mock("./use-dynamic-data", () => ({
  useDynamicData: () => dyn.state,
}));

const Stub = ({ content, children, actionData }: any) => (
  <div data-testid="stub">
    {content?.text}
    {actionData ? "|dynamic|" : ""}
    {children}
  </div>
);
const Other = ({ content }: any) => <b data-testid="other">{content?.x}</b>;

const MAP = { stub: Stub, other: Other };

const renderDef = (def: any, map = MAP) =>
  render(
    <RenderEngineProvider componentMap={map}>
      <RenderDefinition def={def} />
    </RenderEngineProvider>,
  );

const base = {
  id: "d1",
  type: "stub",
  content: { text: "hello" },
  properties: { type: "static" },
};

describe("def.type → componentMap", () => {
  it("renders the mapped component with content", () => {
    renderDef(base);
    expect(screen.getByTestId("stub")).toHaveTextContent("hello");
  });

  it("different types resolve to different components", () => {
    renderDef({ ...base, type: "other", content: { x: "2" } });
    expect(screen.getByTestId("other")).toHaveTextContent("2");
  });

  it("unknown type renders a diagnostic, not a crash", () => {
    renderDef({ ...base, type: "nope" });
    expect(screen.getByText(/Component Matching Error/)).toBeInTheDocument();
    expect(screen.getByText("nope")).toBeInTheDocument();
  });
});

describe("children recursion", () => {
  it("renders nested defs inside the parent", () => {
    renderDef({
      ...base,
      children: [{ ...base, id: "c1", content: { text: "child" } }],
    });
    const stubs = screen.getAllByTestId("stub");
    expect(stubs).toHaveLength(2);
    expect(stubs[0]).toHaveTextContent("child");
  });
});

describe("dynamic defs", () => {
  it("properties.type 'dynamic' → component receives actionData", () => {
    renderDef({
      ...base,
      properties: {
        type: "dynamic",
        action: [{ key: "rows", endpoint: "item", method: "GET" }],
      },
    });
    expect(screen.getByTestId("stub")).toHaveTextContent("|dynamic|");
  });

  it("static defs get actionData undefined", () => {
    renderDef(base);
    expect(screen.getByTestId("stub")).not.toHaveTextContent("|dynamic|");
  });
});

describe("load states", () => {
  it("skeletonLoading renders the loading surface", () => {
    dyn.state.skeletonLoading = true;
    renderDef(base);
    expect(screen.getByText(/Loading Component/)).toBeInTheDocument();
    dyn.state.skeletonLoading = false;
  });

  it("firstLoadError renders the error surface", () => {
    dyn.state.firstLoadError = "kaput";
    renderDef(base);
    expect(screen.getByText(/Initial Component Load Error/)).toBeInTheDocument();
    expect(screen.getByText("kaput")).toBeInTheDocument();
    dyn.state.firstLoadError = null;
  });
});
