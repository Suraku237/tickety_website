import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest config for the Tickety web client tests.
// Vitest natively supports import.meta.env (used by api.service.js), ESM,
// and a jsdom DOM — which is why it's used here rather than Jest.
export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-utils/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    css: false,
  },
});