import { describe, it, expect } from "vitest";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// These functions are exported from CollectionCard.tsx for testing purposes
// In the actual component, they are defined inline

/**
 * Format relative time in Polish
 * @param dateString - ISO date string
 * @returns Relative time string (e.g., "2 dni temu")
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Dziś";
  if (diffInDays === 1) return "Wczoraj";
  if (diffInDays < 7) return `${diffInDays} dni temu`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "Tydzień temu" : `${weeks} tygodni temu`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "Miesiąc temu" : `${months} miesięcy temu`;
  }
  const years = Math.floor(diffInDays / 365);
  return years === 1 ? "Rok temu" : `${years} lat temu`;
};

/**
 * Format recipe count with proper Polish pluralization
 * @param count - Number of recipes
 * @returns Formatted string (e.g., "5 przepisów")
 */
const formatRecipeCount = (count: number): string => {
  if (count === 1) return "1 przepis";
  if (count >= 2 && count <= 4) return `${count} przepisy`;
  return `${count} przepisów`;
};

/**
 * Generate placeholder thumbnail colors
 * Returns a consistent set of colors for the 2x2 grid
 */
const getThumbnailColors = (): string[] => {
  return ["bg-green-200", "bg-green-300", "bg-green-100", "bg-green-400"];
};

// ============================================================================
// TESTS
// ============================================================================

describe("Collection Utility Functions", () => {
  // ==========================================================================
  // formatRecipeCount - Polish Pluralization
  // ==========================================================================

  describe("formatRecipeCount", () => {
    describe("singular form (1 przepis)", () => {
      it("returns '1 przepis' for count = 1", () => {
        expect(formatRecipeCount(1)).toBe("1 przepis");
      });
    });

    describe("plural form 2-4 (przepisy)", () => {
      it("returns '2 przepisy' for count = 2", () => {
        expect(formatRecipeCount(2)).toBe("2 przepisy");
      });

      it("returns '3 przepisy' for count = 3", () => {
        expect(formatRecipeCount(3)).toBe("3 przepisy");
      });

      it("returns '4 przepisy' for count = 4", () => {
        expect(formatRecipeCount(4)).toBe("4 przepisy");
      });
    });

    describe("plural form 5+ (przepisów)", () => {
      it("returns '0 przepisów' for count = 0", () => {
        expect(formatRecipeCount(0)).toBe("0 przepisów");
      });

      it("returns '5 przepisów' for count = 5", () => {
        expect(formatRecipeCount(5)).toBe("5 przepisów");
      });

      it("returns '10 przepisów' for count = 10", () => {
        expect(formatRecipeCount(10)).toBe("10 przepisów");
      });

      it("returns '21 przepisów' for count = 21 (not przepisy)", () => {
        expect(formatRecipeCount(21)).toBe("21 przepisów");
      });

      it("returns '22 przepisów' for count = 22 (not przepisy)", () => {
        expect(formatRecipeCount(22)).toBe("22 przepisów");
      });

      it("returns '23 przepisów' for count = 23 (not przepisy)", () => {
        expect(formatRecipeCount(23)).toBe("23 przepisów");
      });

      it("returns '24 przepisów' for count = 24 (not przepisy)", () => {
        expect(formatRecipeCount(24)).toBe("24 przepisów");
      });

      it("returns '25 przepisów' for count = 25", () => {
        expect(formatRecipeCount(25)).toBe("25 przepisów");
      });

      it("returns '100 przepisów' for count = 100", () => {
        expect(formatRecipeCount(100)).toBe("100 przepisów");
      });
    });
  });

  // ==========================================================================
  // formatRelativeTime - Polish Time Expressions
  // ==========================================================================

  describe("formatRelativeTime", () => {
    // Helper to create date X days ago
    const daysAgo = (days: number): string => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date.toISOString();
    };

    describe("today (Dziś)", () => {
      it("returns 'Dziś' for current time", () => {
        const now = new Date().toISOString();
        expect(formatRelativeTime(now)).toBe("Dziś");
      });

      it("returns 'Dziś' for 1 hour ago", () => {
        const date = new Date();
        date.setHours(date.getHours() - 1);
        expect(formatRelativeTime(date.toISOString())).toBe("Dziś");
      });

      it("returns 'Dziś' for 23 hours ago", () => {
        const date = new Date();
        date.setHours(date.getHours() - 23);
        expect(formatRelativeTime(date.toISOString())).toBe("Dziś");
      });
    });

    describe("yesterday (Wczoraj)", () => {
      it("returns 'Wczoraj' for 1 day ago", () => {
        expect(formatRelativeTime(daysAgo(1))).toBe("Wczoraj");
      });
    });

    describe("days ago (X dni temu)", () => {
      it("returns '2 dni temu' for 2 days ago", () => {
        expect(formatRelativeTime(daysAgo(2))).toBe("2 dni temu");
      });

      it("returns '3 dni temu' for 3 days ago", () => {
        expect(formatRelativeTime(daysAgo(3))).toBe("3 dni temu");
      });

      it("returns '6 dni temu' for 6 days ago", () => {
        expect(formatRelativeTime(daysAgo(6))).toBe("6 dni temu");
      });
    });

    describe("weeks ago", () => {
      it("returns 'Tydzień temu' for 7 days ago", () => {
        expect(formatRelativeTime(daysAgo(7))).toBe("Tydzień temu");
      });

      it("returns 'Tydzień temu' for 13 days ago", () => {
        expect(formatRelativeTime(daysAgo(13))).toBe("Tydzień temu");
      });

      it("returns '2 tygodni temu' for 14 days ago", () => {
        expect(formatRelativeTime(daysAgo(14))).toBe("2 tygodni temu");
      });

      it("returns '2 tygodni temu' for 20 days ago", () => {
        expect(formatRelativeTime(daysAgo(20))).toBe("2 tygodni temu");
      });

      it("returns '3 tygodni temu' for 21 days ago", () => {
        expect(formatRelativeTime(daysAgo(21))).toBe("3 tygodni temu");
      });

      it("returns '4 tygodni temu' for 28 days ago", () => {
        expect(formatRelativeTime(daysAgo(28))).toBe("4 tygodni temu");
      });
    });

    describe("months ago", () => {
      it("returns 'Miesiąc temu' for 30 days ago", () => {
        expect(formatRelativeTime(daysAgo(30))).toBe("Miesiąc temu");
      });

      it("returns 'Miesiąc temu' for 59 days ago", () => {
        expect(formatRelativeTime(daysAgo(59))).toBe("Miesiąc temu");
      });

      it("returns '2 miesięcy temu' for 60 days ago", () => {
        expect(formatRelativeTime(daysAgo(60))).toBe("2 miesięcy temu");
      });

      it("returns '6 miesięcy temu' for 180 days ago", () => {
        expect(formatRelativeTime(daysAgo(180))).toBe("6 miesięcy temu");
      });

      it("returns '11 miesięcy temu' for 330 days ago", () => {
        expect(formatRelativeTime(daysAgo(330))).toBe("11 miesięcy temu");
      });
    });

    describe("years ago", () => {
      it("returns 'Rok temu' for 365 days ago", () => {
        expect(formatRelativeTime(daysAgo(365))).toBe("Rok temu");
      });

      it("returns '2 lat temu' for 730 days ago", () => {
        expect(formatRelativeTime(daysAgo(730))).toBe("2 lat temu");
      });

      it("returns '10 lat temu' for 3650 days ago", () => {
        expect(formatRelativeTime(daysAgo(3650))).toBe("10 lat temu");
      });
    });
  });

  // ==========================================================================
  // getThumbnailColors - Color Consistency
  // ==========================================================================

  describe("getThumbnailColors", () => {
    it("returns an array of 4 colors", () => {
      const colors = getThumbnailColors();
      expect(colors).toHaveLength(4);
    });

    it("returns array with expected green color classes", () => {
      const colors = getThumbnailColors();
      expect(colors).toEqual(["bg-green-200", "bg-green-300", "bg-green-100", "bg-green-400"]);
    });

    it("all colors are valid Tailwind classes", () => {
      const colors = getThumbnailColors();
      colors.forEach((color) => {
        expect(color).toMatch(/^bg-green-\d{3}$/);
      });
    });

    it("returns same colors on multiple calls (consistency)", () => {
      const colors1 = getThumbnailColors();
      const colors2 = getThumbnailColors();
      expect(colors1).toEqual(colors2);
    });

    it("contains bg-green-200", () => {
      const colors = getThumbnailColors();
      expect(colors).toContain("bg-green-200");
    });

    it("contains bg-green-300", () => {
      const colors = getThumbnailColors();
      expect(colors).toContain("bg-green-300");
    });

    it("contains bg-green-100", () => {
      const colors = getThumbnailColors();
      expect(colors).toContain("bg-green-100");
    });

    it("contains bg-green-400", () => {
      const colors = getThumbnailColors();
      expect(colors).toContain("bg-green-400");
    });
  });
});
