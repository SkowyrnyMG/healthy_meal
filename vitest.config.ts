import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for DOM testing
    environment: "jsdom",

    // Global setup and teardown
    globals: true,

    // Setup files for test configuration
    setupFiles: ["./src/test/setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
        "**/mockData/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
    },

    // Include test files
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Exclude files
    exclude: ["node_modules", "dist", ".astro", "e2e"],
  },

  resolve: {
    // Match Astro's path aliases
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
