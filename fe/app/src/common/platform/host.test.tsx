// Platform host seam — app events + reload contract. jsdom gives real
// DOM events; the RN port's emitter must satisfy this same spec.
import { describe, expect, it, vi } from "vitest";
import { emitAppEvent, onAppEvent } from "./host";

describe("emitAppEvent / onAppEvent", () => {
  it("emit → subscribed listener fires", () => {
    const cb = vi.fn();
    const off = onAppEvent("auth-change", cb);
    emitAppEvent("auth-change");
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    emitAppEvent("auth-change");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("detail payload reaches the listener (client-change)", () => {
    let detail: any;
    const off = onAppEvent("client-change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    emitAppEvent("client-change", "uday");
    expect(detail).toBe("uday");
    off();
  });

  it("listeners are isolated per event name", () => {
    const cb = vi.fn();
    const off = onAppEvent("auth-change", cb);
    emitAppEvent("client-change");
    expect(cb).not.toHaveBeenCalled();
    off();
  });
});
