import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession,
  restoreSession,
  isLoggedIn,
  clearSession,
} from "../services/session.service";

describe("session.service", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and restores a user object", () => {
    const user = { user_id: "1", username: "alice", admin_role: "boss" };
    saveSession(user);
    expect(restoreSession()).toEqual(user);
  });

  it("restoreSession returns null when nothing stored", () => {
    expect(restoreSession()).toBeNull();
  });

  it("restoreSession returns null on corrupted JSON", () => {
    sessionStorage.setItem("tickety_user", "{not valid json");
    expect(restoreSession()).toBeNull();
  });

  it("isLoggedIn reflects presence of a session", () => {
    expect(isLoggedIn()).toBe(false);
    saveSession({ username: "bob" });
    expect(isLoggedIn()).toBe(true);
  });

  it("clearSession removes the stored user", () => {
    saveSession({ username: "bob" });
    clearSession();
    expect(restoreSession()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});
