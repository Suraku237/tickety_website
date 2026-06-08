import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { register, login, verifyEmail, resendOtp } from "../services/api.service";

/**
 * The API service talks to the backend purely through `fetch`. We replace the
 * global fetch with a controllable mock so the private _post/_get helpers are
 * exercised through the exported endpoint functions — no network involved.
 */
function mockFetchOnce({ status = 200, body = {} } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    json: async () => body,
  });
}

describe("api.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals?.();
  });

  it("login posts to /login and attaches the status code", async () => {
    mockFetchOnce({ status: 200, body: { success: true, user: { id: 1 } } });

    const result = await login({ email: "a@x.com", password: "secret1" });

    // includeStatus=true for login → statusCode merged into the payload
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/login$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "a@x.com", password: "secret1" });
  });

  it("register posts to /register without a status code", async () => {
    mockFetchOnce({ status: 201, body: { success: true } });

    const result = await register({
      username: "alice", email: "a@x.com", password: "secret1",
    });

    expect(result).toEqual({ success: true }); // includeStatus=false
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/register$/);
  });

  it("verifyEmail and resendOtp hit their endpoints", async () => {
    mockFetchOnce({ body: { success: true } });
    await verifyEmail({ email: "a@x.com", code: "123456" });
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/verify-email$/);

    mockFetchOnce({ body: { success: true } });
    await resendOtp({ email: "a@x.com" });
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/resend-otp$/);
  });

  it("returns a friendly connection error when fetch rejects", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await login({ email: "a@x.com", password: "secret1" });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/connection error/i);
  });
});
