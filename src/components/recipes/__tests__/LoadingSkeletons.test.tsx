import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import LoadingSkeletons from "../LoadingSkeletons";

// ============================================================================
// TESTS
// ============================================================================

describe("LoadingSkeletons", () => {
  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render skeleton cards", () => {
      const { container } = render(<LoadingSkeletons />);

      // Check for skeleton elements
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render default count of 8 skeletons", () => {
      const { container } = render(<LoadingSkeletons />);

      // Count the skeleton containers
      const gridContainer = container.querySelector(".grid");
      const skeletonCards = gridContainer?.children;

      expect(skeletonCards?.length).toBe(8);
    });

    it("should render custom count when provided", () => {
      const { container } = render(<LoadingSkeletons count={12} />);

      const gridContainer = container.querySelector(".grid");
      const skeletonCards = gridContainer?.children;

      expect(skeletonCards?.length).toBe(12);
    });

    it("should render 1 skeleton when count=1", () => {
      const { container } = render(<LoadingSkeletons count={1} />);

      const gridContainer = container.querySelector(".grid");
      const skeletonCards = gridContainer?.children;

      expect(skeletonCards?.length).toBe(1);
    });

    it("should render 20 skeletons when count=20", () => {
      const { container } = render(<LoadingSkeletons count={20} />);

      const gridContainer = container.querySelector(".grid");
      const skeletonCards = gridContainer?.children;

      expect(skeletonCards?.length).toBe(20);
    });
  });

  // ==========================================================================
  // LAYOUT
  // ==========================================================================

  describe("Layout", () => {
    it("should use CSS Grid layout", () => {
      const { container } = render(<LoadingSkeletons />);

      const gridContainer = container.querySelector(".grid");
      expect(gridContainer).toBeInTheDocument();
    });

    it("should have grid layout classes matching RecipeGrid", () => {
      const { container } = render(<LoadingSkeletons />);

      const gridContainer = container.querySelector(".grid");

      // Should have responsive grid columns: 1 (mobile), 2 (sm), 3 (lg), 4 (xl)
      expect(gridContainer?.classList.contains("grid-cols-1")).toBe(true);
      expect(gridContainer?.classList.contains("sm:grid-cols-2")).toBe(true);
      expect(gridContainer?.classList.contains("lg:grid-cols-3")).toBe(true);
      expect(gridContainer?.classList.contains("xl:grid-cols-4")).toBe(true);
    });

    it("should have proper gap between cards", () => {
      const { container } = render(<LoadingSkeletons />);

      const gridContainer = container.querySelector(".grid");
      expect(gridContainer?.classList.contains("gap-4")).toBe(true);
    });
  });

  // ==========================================================================
  // STRUCTURE
  // ==========================================================================

  describe("Structure", () => {
    it("should have skeleton card container structure", () => {
      const { container } = render(<LoadingSkeletons count={1} />);

      // Check for card container with proper classes
      const card = container.querySelector(".min-h-\\[300px\\]");
      expect(card).toBeInTheDocument();
    });

    it("should have skeleton elements inside each card", () => {
      const { container } = render(<LoadingSkeletons count={1} />);

      // Each card should contain multiple Skeleton components
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(3); // Image, title, description, nutrition
    });

    it("should have rounded-lg border on cards", () => {
      const { container } = render(<LoadingSkeletons count={1} />);

      const card = container.querySelector(".rounded-lg");
      expect(card).toBeInTheDocument();
    });

    it("should have border and background colors", () => {
      const { container } = render(<LoadingSkeletons count={1} />);

      const card = container.querySelector(".border-2");
      expect(card).toBeInTheDocument();

      const bgCard = container.querySelector(".bg-white");
      expect(bgCard).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle count = 0", () => {
      const { container } = render(<LoadingSkeletons count={0} />);

      const gridContainer = container.querySelector(".grid");
      const skeletonCards = gridContainer?.children;

      expect(skeletonCards?.length).toBe(0);
    });

    it("should handle very large count", () => {
      const { container } = render(<LoadingSkeletons count={100} />);

      const gridContainer = container.querySelector(".grid");
      const skeletonCards = gridContainer?.children;

      expect(skeletonCards?.length).toBe(100);
    });

    it("should maintain structure across different counts", () => {
      const counts = [1, 5, 10, 15];

      counts.forEach((count) => {
        const { container, unmount } = render(<LoadingSkeletons count={count} />);

        const gridContainer = container.querySelector(".grid");
        expect(gridContainer).toBeInTheDocument();

        const skeletonCards = gridContainer?.children;
        expect(skeletonCards?.length).toBe(count);

        unmount();
      });
    });
  });
});
