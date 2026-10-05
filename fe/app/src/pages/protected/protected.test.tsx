import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const navigate = vi.fn();
vi.mock("@/platform/navigation", () => ({
  useNav: () => ({ navigate }),
}));
vi.mock("@/components/shared/dashboard-renderer", () => ({
  DashboardRenderer: () => <div>admin-surface</div>,
}));

const listeners: Record<string, (() => void)[]> = {};
vi.mock("@/platform/host", () => ({
  onAppEvent: (name: string, cb: () => void) => {
    (listeners[name] ||= []).push(cb);
    return () => {
      listeners[name] = listeners[name].filter((f) => f !== cb);
    };
  },
}));

import Protected from "./protected";
import { storage, useMemoryStorage } from "@/platform/storage";

const jwt = (payload: object) => {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "none" })}.${b64(payload)}.dev`;
};

const config = (requireAuth: boolean | undefined) => ({
  data: { admin: requireAuth === undefined ? {} : { require_auth: requireAuth } },
});

describe("Protected admin gate", () => {
  beforeEach(() => {
    navigate.mockClear();
    useMemoryStorage();
    for (const k of Object.keys(listeners)) delete listeners[k];
  });

  it("redirects to /login when no token and auth required", async () => {
    render(<Protected config={config(true)} />);
    await act(async () => {});
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("redirects when the token is expired", async () => {
    storage.setItem("token", jwt({ exp: Math.floor(Date.now() / 1000) - 60 }));
    render(<Protected config={config(true)} />);
    await act(async () => {});
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("renders the dashboard with a valid token", async () => {
    storage.setItem("token", jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    render(<Protected config={config(true)} />);
    await act(async () => {});
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByText("admin-surface")).toBeTruthy();
  });

  it("bounces mid-session when auth-change fires after token clears", async () => {
    storage.setItem("token", jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    render(<Protected config={config(true)} />);
    await act(async () => {});
    storage.removeItem("token");
    await act(async () => {
      listeners["auth-change"]?.forEach((cb) => cb());
    });
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("require_auth=false renders admin without a token", async () => {
    render(<Protected config={config(false)} />);
    await act(async () => {});
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByText("admin-surface")).toBeTruthy();
  });

  it("default (require_auth unset) treats admin as protected", async () => {
    render(<Protected config={config(undefined)} />);
    await act(async () => {});
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
