import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the persistence layer so we control restore/persist/clear and avoid
// touching real sessionStorage across tests.
vi.mock("../services/session.service", () => ({
  restoreSession: vi.fn(() => null),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { SessionProvider, useSession } from "../context/SessionContext";
import * as sessionSvc from "../services/session.service";

function SessionProbe() {
  const { user, updateSession, logout } = useSession();
  return (
    <div>
      <span data-testid="username">{user?.username ?? "anon"}</span>
      <button onClick={() => updateSession({ username: "updated" })}>update</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <SessionProvider>
      <SessionProbe />
    </SessionProvider>
  );

describe("SessionContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionSvc.restoreSession.mockReturnValue(null);
    // logout sets window.location.href; stub it so jsdom doesn't warn/throw.
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
  });

  it("initialises user from restoreSession()", () => {
    sessionSvc.restoreSession.mockReturnValue({ username: "alice" });
    renderProbe();
    expect(screen.getByTestId("username").textContent).toBe("alice");
  });

  it("updateSession merges a patch and persists it", () => {
    sessionSvc.restoreSession.mockReturnValue({ username: "alice", role: "boss" });
    renderProbe();

    fireEvent.click(screen.getByText("update"));

    expect(screen.getByTestId("username").textContent).toBe("updated");
    // persisted object keeps the untouched field and applies the patch
    expect(sessionSvc.saveSession).toHaveBeenCalledWith({
      username: "updated",
      role: "boss",
    });
  });

  it("logout clears persistence and resets the user", () => {
    sessionSvc.restoreSession.mockReturnValue({ username: "alice" });
    renderProbe();

    fireEvent.click(screen.getByText("logout"));

    expect(sessionSvc.clearSession).toHaveBeenCalled();
    expect(screen.getByTestId("username").textContent).toBe("anon");
    expect(window.location.href).toBe("/login");
  });
});
