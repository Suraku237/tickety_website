import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Control the session layer both guards depend on.
vi.mock("../services/session.service", () => ({
  isLoggedIn: vi.fn(),
  restoreSession: vi.fn(),
}));

import * as sessionSvc from "../services/session.service";
import ProtectedRoute from "../components/ProtectedRoute";
import RoleRoute from "../components/RoleRoute";

function renderRoute(element, initialPath = "/secret") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/secret" element={element} />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/dashboard" element={<div>DASHBOARD</div>} />
        <Route path="/queues" element={<div>QUEUES</div>} />
        <Route path="/counter" element={<div>COUNTER</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders children when logged in", () => {
    sessionSvc.isLoggedIn.mockReturnValue(true);
    renderRoute(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
    expect(screen.getByText("SECRET")).toBeInTheDocument();
  });

  it("redirects to /login when not logged in", () => {
    sessionSvc.isLoggedIn.mockReturnValue(false);
    renderRoute(<ProtectedRoute><div>SECRET</div></ProtectedRoute>);
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
    expect(screen.queryByText("SECRET")).toBeNull();
  });
});

describe("RoleRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders children when the role is allowed", () => {
    sessionSvc.restoreSession.mockReturnValue({ admin_role: "boss" });
    renderRoute(<RoleRoute allowed={["boss"]}><div>BOSS AREA</div></RoleRoute>);
    expect(screen.getByText("BOSS AREA")).toBeInTheDocument();
  });

  it("redirects a manager to /queues when not allowed", () => {
    sessionSvc.restoreSession.mockReturnValue({ admin_role: "manager" });
    renderRoute(<RoleRoute allowed={["boss"]}><div>BOSS AREA</div></RoleRoute>);
    expect(screen.getByText("QUEUES")).toBeInTheDocument();
  });

  it("redirects an agent to /counter when not allowed", () => {
    sessionSvc.restoreSession.mockReturnValue({ admin_role: "agent" });
    renderRoute(<RoleRoute allowed={["boss"]}><div>BOSS AREA</div></RoleRoute>);
    expect(screen.getByText("COUNTER")).toBeInTheDocument();
  });

  it("redirects to /dashboard fallback when there is no role", () => {
    sessionSvc.restoreSession.mockReturnValue(null);
    renderRoute(<RoleRoute allowed={["boss"]}><div>BOSS AREA</div></RoleRoute>);
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
  });
});
