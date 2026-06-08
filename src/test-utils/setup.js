// Adds jest-dom matchers (toBeInTheDocument, toBeDisabled, ...) to Vitest's expect.
import "@testing-library/jest-dom/vitest";

// Make React available globally so JSX works without explicit imports in test files.
import React from "react";
globalThis.React = React;