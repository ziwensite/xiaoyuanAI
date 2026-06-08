import { describe, it, expect, vi } from "vitest";
import { combineSignals } from "../src/opencode-client";

describe("combineSignals", () => {
  it("returns a signal that aborts when any input signal aborts", () => {
    const ctrl1 = new AbortController();
    const combined = combineSignals(ctrl1.signal);
    expect(combined.aborted).toBe(false);
    ctrl1.abort();
    expect(combined.aborted).toBe(true);
  });

  it("works with no signals", () => {
    const combined = combineSignals();
    expect(combined.aborted).toBe(false);
  });

  it("handles already-aborted signals", () => {
    const ctrl1 = new AbortController();
    ctrl1.abort("test reason");
    const combined = combineSignals(ctrl1.signal);
    expect(combined.aborted).toBe(true);
    expect(combined.reason).toBe("test reason");
  });

  it("aborts when any of multiple signals aborts", () => {
    const ctrl1 = new AbortController();
    const ctrl2 = new AbortController();
    const combined = combineSignals(ctrl1.signal, ctrl2.signal);
    expect(combined.aborted).toBe(false);
    ctrl2.abort();
    expect(combined.aborted).toBe(true);
  });

  it("cleans up listeners after abort", () => {
    const ctrl1 = new AbortController();
    const ctrl2 = new AbortController();
    const removeSpy1 = vi.spyOn(ctrl1.signal, "removeEventListener");
    const removeSpy2 = vi.spyOn(ctrl2.signal, "removeEventListener");

    combineSignals(ctrl1.signal, ctrl2.signal);
    ctrl1.abort();

    expect(removeSpy1).toHaveBeenCalled();
    expect(removeSpy2).toHaveBeenCalled();
  });

  it("handles undefined signals gracefully", () => {
    const ctrl = new AbortController();
    const combined = combineSignals(undefined, ctrl.signal, undefined);
    expect(combined.aborted).toBe(false);
    ctrl.abort();
    expect(combined.aborted).toBe(true);
  });
});