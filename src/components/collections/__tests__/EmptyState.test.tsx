import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyState from "../EmptyState";

// ============================================================================
// TESTS
// ============================================================================

describe("EmptyState (Collections)", () => {
  let mockOnCreateClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnCreateClick = vi.fn();
  });

  // ==========================================================================
  // P0 - Critical Functionality - Rendering
  // ==========================================================================

  describe("rendering", () => {
    it("displays FolderPlus icon", () => {
      const { container } = render(<EmptyState onCreateClick={mockOnCreateClick} />);

      // Icon container with green background should be present
      const iconContainer = container.querySelector(".bg-green-100");
      expect(iconContainer).toBeInTheDocument();
    });

    it("displays heading 'Nie masz jeszcze kolekcji'", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const heading = screen.getByRole("heading", { name: /nie masz jeszcze kolekcji/i });
      expect(heading).toBeInTheDocument();
    });

    it("displays description text", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const description = screen.getByText(/organizuj przepisy w kolekcje/i);
      expect(description).toBeInTheDocument();
    });

    it("displays 'Utwórz pierwszą kolekcję' button", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const button = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      expect(button).toBeInTheDocument();
    });

    it("button has correct styling (green background)", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const button = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      expect(button).toHaveClass("bg-green-600");
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Interaction
  // ==========================================================================

  describe("interaction", () => {
    it("button click calls onCreateClick callback", async () => {
      const user = userEvent.setup();
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const button = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      await user.click(button);

      expect(mockOnCreateClick).toHaveBeenCalledTimes(1);
    });

    it("callback is called only once per click", async () => {
      const user = userEvent.setup();
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const button = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      await user.click(button);

      expect(mockOnCreateClick).toHaveBeenCalledTimes(1);
    });

    it("button is keyboard accessible (Enter key)", async () => {
      const user = userEvent.setup();
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const button = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      button.focus();
      await user.keyboard("{Enter}");

      expect(mockOnCreateClick).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // P1 - Important Features - Visual Structure
  // ==========================================================================

  describe("visual structure", () => {
    it("icon has correct size and color classes", () => {
      const { container } = render(<EmptyState onCreateClick={mockOnCreateClick} />);

      // Check for icon container with green background
      const iconContainer = container.querySelector(".bg-green-100");
      expect(iconContainer).toHaveClass("bg-green-100");
      expect(iconContainer).toHaveClass("rounded-full");
    });

    it("content is centered", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("flex");
      expect(container).toHaveClass("flex-col");
      expect(container).toHaveClass("items-center");
      expect(container).toHaveClass("justify-center");
    });

    it("has minimum height for proper spacing", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("min-h-[400px]");
    });

    it("text is center-aligned", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("text-center");
    });
  });

  // ==========================================================================
  // P2 - Accessibility & Edge Cases
  // ==========================================================================

  describe("accessibility", () => {
    it("heading uses correct hierarchy (h2)", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const heading = screen.getByRole("heading", { name: /nie masz jeszcze kolekcji/i });
      expect(heading.tagName).toBe("H2");
    });

    it("button has descriptive text", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const button = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      expect(button).toHaveTextContent("+ Utwórz pierwszą kolekcję");
    });
  });

  describe("edge cases", () => {
    it("handles missing onCreateClick gracefully", () => {
      // This test ensures component doesn't crash if callback is undefined
      // In TypeScript, this shouldn't happen, but good to test runtime behavior
      expect(() => {
        // @ts-expect-error - Testing runtime behavior with missing prop
        render(<EmptyState />);
      }).not.toThrow();
    });

    it("long description text wraps correctly", () => {
      render(<EmptyState onCreateClick={mockOnCreateClick} />);

      const description = screen.getByText(/organizuj przepisy w kolekcje/i);
      const container = description.closest("p");
      expect(container).toHaveClass("max-w-md");
    });
  });
});
