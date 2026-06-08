/**
 * Shared rendering helpers for the Tickety web-client tests (Vitest + RTL).
 *
 * React Testing Library is functional by design, so to honour the project's
 * OOP style we wrap the common render + query operations in a small
 * `RenderedView` class. Tests get a fluent, encapsulated object instead of
 * juggling loose query calls, and routing/provider wiring lives in one place.
 */
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "../context/SessionContext";
import { ThemeProvider } from "../context/ThemeContext";

/** Encapsulates a rendered component tree and its query/interaction helpers. */
export class RenderedView {
  constructor(result) {
    this._result = result;
  }
  get container() {
    return this._result.container;
  }
  byTestId(id) {
    return this._result.queryByTestId(id);
  }
  byId(id) {
    return this._result.container.querySelector(`#${id}`);
  }
  text(t) {
    return this._result.queryByText(t);
  }
  rerender(ui) {
    this._result.rerender(ui);
    return this;
  }
}

/** Render bare UI (no router/providers). */
export function renderView(ui) {
  return new RenderedView(render(ui));
}

/**
 * Render UI inside a MemoryRouter. `routes` is an optional map of
 * path -> marker text, so redirect targets can be asserted on.
 */
export function renderWithRouter(ui, { initialPath = "/", routes = {} } = {}) {
  const extra = Object.entries(routes).map(([path, label]) => (
    <Route key={path} path={path} element={<div>{label}</div>} />
  ));
  return new RenderedView(
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path={initialPath} element={ui} />
          {extra}
        </Routes>
      </MemoryRouter>
    )
  );
}

/** Render UI wrapped in the app's real providers (Theme + Session). */
export function renderWithProviders(ui, { initialPath = "/" } = {}) {
  return new RenderedView(
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeProvider>
          <SessionProvider>{ui}</SessionProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
  );
}
