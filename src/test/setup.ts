import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
vi.stubGlobal("import.meta.env", {
  PUBLIC_SUPABASE_URL: "http://localhost:54321",
  PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  OPENROUTER_API_KEY: "test-openrouter-key",
});

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Extend expect matchers (jest-dom is already imported above)
export { expect };
