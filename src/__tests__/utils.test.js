import { describe, it, expect } from "vitest";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateServiceName,
  validate,
} from "../utils/validators";
import { ADMIN_ROLES, ROLE_LABELS, OTP_EXPIRY_MINUTES, RESEND_COOLDOWN_SECONDS }
  from "../utils/constants";

describe("validators", () => {
  describe("validateUsername", () => {
    it("rejects names shorter than 3 chars", () => {
      expect(validateUsername("ab")).toBeTruthy();
      expect(validateUsername("")).toBeTruthy();
      expect(validateUsername("  a ")).toBeTruthy(); // trimmed length < 3
    });
    it("accepts a valid name", () => {
      expect(validateUsername("alice")).toBeNull();
    });
  });

  describe("validateEmail", () => {
    it("rejects an address without @", () => {
      expect(validateEmail("aliceexample.com")).toBeTruthy();
      expect(validateEmail("")).toBeTruthy();
    });
    it("accepts an address containing @", () => {
      expect(validateEmail("alice@example.com")).toBeNull();
    });
  });

  describe("validatePassword", () => {
    it("rejects short passwords", () => {
      expect(validatePassword("a1b2")).toBeTruthy();
    });
    it("rejects passwords with no digit", () => {
      expect(validatePassword("nodigitshere")).toBeTruthy();
    });
    it("accepts a 6+ char password with a digit", () => {
      expect(validatePassword("secret1")).toBeNull();
    });
  });

  describe("validateServiceName", () => {
    it("rejects names shorter than 2 chars", () => {
      expect(validateServiceName("a")).toBeTruthy();
    });
    it("accepts a valid service name", () => {
      expect(validateServiceName("Clinic")).toBeNull();
    });
  });

  describe("validate (first-error aggregator)", () => {
    it("returns the first non-null error", () => {
      expect(validate(null, "second error", "third")).toBe("second error");
    });
    it("returns null when all checks pass", () => {
      expect(validate(null, null, null)).toBeNull();
    });
  });
});

describe("constants", () => {
  it("exposes the three admin roles", () => {
    expect(ADMIN_ROLES).toEqual({ BOSS: "boss", MANAGER: "manager", AGENT: "agent" });
  });
  it("has a label for every role value", () => {
    for (const value of Object.values(ADMIN_ROLES)) {
      expect(ROLE_LABELS[value]).toBeTruthy();
    }
  });
  it("defines OTP timing constants", () => {
    expect(OTP_EXPIRY_MINUTES).toBe(10);
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});
