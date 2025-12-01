import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    // Arrange
    const className1 = "text-red-500";
    const className2 = "bg-blue-500";

    // Act
    const result = cn(className1, className2);

    // Assert
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("handles Tailwind conflicts correctly", () => {
    // Arrange - second class should override first
    const conflictingClasses = "text-red-500 text-blue-500";

    // Act
    const result = cn(conflictingClasses);

    // Assert
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes with undefined/null", () => {
    // Arrange
    const baseClass = "p-4";
    const conditionalClass = undefined;
    const nullClass = null;

    // Act
    const result = cn(baseClass, conditionalClass, nullClass, "mt-2");

    // Assert
    expect(result).toBe("p-4 mt-2");
  });

  it("handles arrays of classes", () => {
    // Arrange
    const classes = ["flex", "items-center", "justify-between"];

    // Act
    const result = cn(classes);

    // Assert
    expect(result).toBe("flex items-center justify-between");
  });

  it("handles objects with boolean values", () => {
    // Arrange
    const conditionalClasses = {
      "text-red-500": true,
      "bg-blue-500": false,
      "p-4": true,
    };

    // Act
    const result = cn(conditionalClasses);

    // Assert
    expect(result).toContain("text-red-500");
    expect(result).toContain("p-4");
    expect(result).not.toContain("bg-blue-500");
  });

  it("handles empty input", () => {
    // Act
    const result = cn();

    // Assert
    expect(result).toBe("");
  });

  it("merges and deduplicates padding classes", () => {
    // Arrange - twMerge should handle Tailwind conflicts
    const classes = "p-2 p-4";

    // Act
    const result = cn(classes);

    // Assert
    expect(result).toBe("p-4");
  });

  it("combines multiple input types", () => {
    // Arrange
    const stringClass = "flex";
    const arrayClass = ["items-center"];
    const objectClass = { "justify-between": true, "gap-2": false };
    //eslint-disable-next-line
    const conditionalClass = true && "p-4";

    // Act
    const result = cn(stringClass, arrayClass, objectClass, conditionalClass);

    // Assert
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("justify-between");
    expect(result).toContain("p-4");
    expect(result).not.toContain("gap-2");
  });
});
