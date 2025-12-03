import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn - Class Name Utility", () => {
  describe("Basic Functionality", () => {
    it("should merge multiple class strings", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
      expect(cn("text-sm", "font-bold", "text-center")).toBe("text-sm font-bold text-center");
    });

    it("should return empty string for no inputs", () => {
      expect(cn()).toBe("");
    });

    it("should handle single class string", () => {
      expect(cn("px-4")).toBe("px-4");
    });
  });

  describe("Tailwind Conflict Resolution", () => {
    it("should resolve conflicting padding classes (later wins)", () => {
      expect(cn("px-4", "px-2")).toBe("px-2");
      expect(cn("p-4", "p-8")).toBe("p-8");
      expect(cn("py-2", "py-6")).toBe("py-6");
    });

    it("should resolve conflicting color classes (later wins)", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
      expect(cn("bg-green-600", "bg-yellow-400")).toBe("bg-yellow-400");
    });

    it("should preserve non-conflicting classes", () => {
      // p-4 (all padding) and px-2 (horizontal padding only) are different properties
      const result = cn("p-4", "px-2");
      expect(result).toContain("p-4");
      expect(result).toContain("px-2");
    });

    it("should resolve complex Tailwind conflicts", () => {
      // Same property, later should win
      expect(cn("text-lg", "text-sm")).toBe("text-sm");
      expect(cn("rounded-md", "rounded-lg")).toBe("rounded-lg");

      // Different properties, both should be kept
      const result = cn("mt-4", "mb-2");
      expect(result).toContain("mt-4");
      expect(result).toContain("mb-2");
    });
  });

  describe("Conditional Classes", () => {
    it("should filter out falsy values", () => {
      // eslint-disable-next-line no-constant-binary-expression
      expect(cn("base", false && "hidden", "visible")).toBe("base visible");
      expect(cn("base", undefined, null, "text-sm")).toBe("base text-sm");
      expect(cn("base", "", "text-sm")).toBe("base text-sm");
    });

    it("should include truthy conditional classes", () => {
      // eslint-disable-next-line no-constant-binary-expression
      expect(cn("base", true && "active")).toBe("base active");
      // eslint-disable-next-line no-constant-binary-expression
      expect(cn("base", 1 && "active")).toBe("base active");
    });

    it("should handle ternary operators", () => {
      const isActive = true;
      expect(cn("base", isActive ? "active" : "inactive")).toBe("base active");

      const isDisabled = false;
      expect(cn("base", isDisabled ? "disabled" : "enabled")).toBe("base enabled");
    });
  });

  describe("Complex Input Types", () => {
    it("should handle array inputs", () => {
      expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
      expect(cn(["text-sm", "font-bold"])).toBe("text-sm font-bold");
    });

    it("should handle object inputs with boolean values", () => {
      expect(cn({ "px-4": true, "py-2": false })).toBe("px-4");
      expect(cn({ active: true, disabled: false, "text-sm": true })).toBe("active text-sm");
    });

    it("should handle mixed inputs (strings, arrays, objects)", () => {
      const result = cn("base", ["px-4", "py-2"], { active: true, hidden: false }, "text-sm");
      expect(result).toBe("base px-4 py-2 active text-sm");
    });

    it("should handle nested arrays", () => {
      expect(cn(["base", ["px-4", "py-2"]])).toBe("base px-4 py-2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined and null gracefully", () => {
      expect(cn("base", undefined, null, "text-sm")).toBe("base text-sm");
      expect(cn(undefined, "base", null)).toBe("base");
    });

    it("should handle empty strings", () => {
      expect(cn("base", "", "text-sm")).toBe("base text-sm");
      expect(cn("", "", "")).toBe("");
    });

    it("should handle whitespace correctly", () => {
      expect(cn("  base  ", "text-sm  ")).toBe("base text-sm");
    });

    it("should deduplicate identical classes", () => {
      expect(cn("px-4", "px-4")).toBe("px-4");
      expect(cn("text-sm", "font-bold", "text-sm")).toBe("font-bold text-sm");
    });
  });

  describe("Real-World Usage Patterns", () => {
    it("should handle button variant pattern", () => {
      const baseStyles = "inline-flex items-center justify-center rounded-md";
      const variant = "bg-green-600 hover:bg-green-700";
      const size = "px-4 py-2";
      const custom = "mt-4";

      const result = cn(baseStyles, variant, size, custom);
      expect(result).toContain("inline-flex");
      expect(result).toContain("bg-green-600");
      expect(result).toContain("px-4");
      expect(result).toContain("mt-4");
    });

    it("should handle conditional active state", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class", !isActive && "inactive-class");
      expect(result).toBe("base-class active-class");
    });

    it("should override base classes with custom classes", () => {
      const baseClasses = "px-4 py-2 bg-blue-500";
      const customClasses = "px-6 bg-green-600"; // Override padding and background

      const result = cn(baseClasses, customClasses);
      expect(result).toBe("py-2 px-6 bg-green-600");
    });

    it("should handle responsive classes", () => {
      const result = cn("text-sm", "md:text-base", "lg:text-lg");
      expect(result).toContain("text-sm");
      expect(result).toContain("md:text-base");
      expect(result).toContain("lg:text-lg");
    });

    it("should handle state variants (hover, focus, etc.)", () => {
      const result = cn("bg-blue-500", "hover:bg-blue-600", "focus:ring-2", "focus:ring-blue-300");
      expect(result).toContain("bg-blue-500");
      expect(result).toContain("hover:bg-blue-600");
      expect(result).toContain("focus:ring-2");
      expect(result).toContain("focus:ring-blue-300");
    });
  });
});
