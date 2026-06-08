import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

/** Tiny consumer that surfaces the theme context for assertions. */
function ThemeProbe() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="isDark">{String(isDark)}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("light")}>set-light</button>
      <button onClick={() => setTheme("purple")}>set-invalid</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>
  );

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to dark and applies data-theme to <html>", () => {
    renderProbe();
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("isDark").textContent).toBe("true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("toggleTheme flips between dark and light", () => {
    renderProbe();
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("isDark").textContent).toBe("false");
  });

  it("setTheme accepts valid values and ignores invalid ones", () => {
    renderProbe();
    fireEvent.click(screen.getByText("set-light"));
    expect(screen.getByTestId("theme").textContent).toBe("light");

    fireEvent.click(screen.getByText("set-invalid"));
    // unchanged — 'purple' is rejected
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("persists the chosen theme to localStorage", () => {
    renderProbe();
    fireEvent.click(screen.getByText("set-light"));
    expect(localStorage.getItem("tickety_theme")).toBe("light");
  });

  it("restores a previously stored theme on mount", () => {
    localStorage.setItem("tickety_theme", "light");
    renderProbe();
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});
