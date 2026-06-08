import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../hooks/useAuth";

describe("useAuth", () => {
  it("starts idle with empty messages", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.successMsg).toBe("");
  });

  it("toggles loading around a successful action and clears messages", async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setError("stale error");
    });
    expect(result.current.error).toBe("stale error");

    await act(async () => {
      await result.current.submit(async () => {
        // success path
      });
    });

    // submit() clears messages first, then runs, then drops loading
    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(false);
  });

  it("captures the thrown error message", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.submit(async () => {
        throw new Error("boom");
      });
    });

    expect(result.current.error).toBe("boom");
    expect(result.current.loading).toBe(false);
  });

  it("falls back to a generic message when error has none", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.submit(async () => {
        throw {}; // no .message
      });
    });
    expect(result.current.error).toMatch(/something went wrong/i);
  });

  it("clearMessages resets both error and success", () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setError("e");
      result.current.setSuccessMsg("s");
    });
    act(() => result.current.clearMessages());
    expect(result.current.error).toBe("");
    expect(result.current.successMsg).toBe("");
  });
});
