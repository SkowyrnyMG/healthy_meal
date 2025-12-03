import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../Pagination";
import type { PaginationDTO } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const createMockPagination = (overrides?: Partial<PaginationDTO>): PaginationDTO => ({
  page: 1,
  limit: 20,
  total: 100,
  totalPages: 5,
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe("Pagination", () => {
  let mockOnPageChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnPageChange = vi.fn();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render results count", () => {
      const pagination = createMockPagination();
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      // Check for results count text - numbers are in separate spans
      expect(screen.getByText(/Wyświetlanie/)).toBeInTheDocument();
      expect(screen.getByText(/przepisów/)).toBeInTheDocument();
    });

    it("should render prev and next buttons", () => {
      const pagination = createMockPagination();
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText("Poprzednia strona")).toBeInTheDocument();
      expect(screen.getByLabelText("Następna strona")).toBeInTheDocument();
    });

    it("should render current page number", () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByRole("button", { name: "Strona 3" });
      expect(currentPageButton).toBeInTheDocument();
      expect(currentPageButton).toBeDisabled();
    });

    it("should render page numbers for small page count", () => {
      const pagination = createMockPagination({ totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      // All pages should be visible when totalPages <= 7
      expect(screen.getByRole("button", { name: "Strona 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 5" })).toBeInTheDocument();
    });

    it("should show ellipsis for many pages", () => {
      const pagination = createMockPagination({ totalPages: 10, page: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      // Should have ellipsis
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it("should calculate correct start and end items", () => {
      const pagination = createMockPagination({ page: 2, limit: 20, total: 100 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("21")).toBeInTheDocument(); // startItem = (2-1)*20 + 1
      expect(screen.getByText("40")).toBeInTheDocument(); // endItem = 2*20
    });

    it("should handle last page correctly", () => {
      const pagination = createMockPagination({ page: 5, limit: 20, total: 95, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      // Check the results count - numbers are in separate span elements
      expect(screen.getByText("81")).toBeInTheDocument(); // startItem
      expect(screen.getAllByText("95")).toHaveLength(2); // endItem and total (both 95)
    });

    it("should handle zero total correctly", () => {
      const pagination = createMockPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      // When total is 0, should show 0 three times (start, end, total)
      expect(screen.getAllByText("0")).toHaveLength(3);
    });
  });

  // ==========================================================================
  // BUTTON STATES
  // ==========================================================================

  describe("Button States", () => {
    it("should disable prev button on first page", () => {
      const pagination = createMockPagination({ page: 1 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText("Poprzednia strona");
      expect(prevButton).toBeDisabled();
    });

    it("should enable prev button when not on first page", () => {
      const pagination = createMockPagination({ page: 2 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText("Poprzednia strona");
      expect(prevButton).not.toBeDisabled();
    });

    it("should disable next button on last page", () => {
      const pagination = createMockPagination({ page: 5, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText("Następna strona");
      expect(nextButton).toBeDisabled();
    });

    it("should enable next button when not on last page", () => {
      const pagination = createMockPagination({ page: 4, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText("Następna strona");
      expect(nextButton).not.toBeDisabled();
    });

    it("should enable both buttons on middle page", () => {
      const pagination = createMockPagination({ page: 3, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText("Poprzednia strona");
      const nextButton = screen.getByLabelText("Następna strona");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should disable current page button", () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByRole("button", { name: "Strona 3" });
      expect(currentPageButton).toBeDisabled();
    });

    it("should have aria-current on current page", () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByRole("button", { name: "Strona 3" });
      expect(currentPageButton).toHaveAttribute("aria-current", "page");
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe("Interactions", () => {
    it("should call onPageChange when prev button clicked", async () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText("Poprzednia strona");
      await userEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it("should call onPageChange when next button clicked", async () => {
      const pagination = createMockPagination({ page: 2 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText("Następna strona");
      await userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it("should call onPageChange when page number clicked", async () => {
      const pagination = createMockPagination({ page: 1, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const page3Button = screen.getByRole("button", { name: "Strona 3" });
      await userEvent.click(page3Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should not call onPageChange when disabled prev button clicked", async () => {
      const pagination = createMockPagination({ page: 1 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText("Poprzednia strona");
      await userEvent.click(prevButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should not call onPageChange when disabled next button clicked", async () => {
      const pagination = createMockPagination({ page: 5, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText("Następna strona");
      await userEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should not call onPageChange when current page button clicked", async () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByRole("button", { name: "Strona 3" });
      await userEvent.click(currentPageButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================

  describe("Keyboard Navigation", () => {
    it("should handle left arrow key to go to previous page", () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      fireEvent.keyDown(nav, { key: "ArrowLeft" });

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should handle right arrow key to go to next page", () => {
      const pagination = createMockPagination({ page: 2 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      fireEvent.keyDown(nav, { key: "ArrowRight" });

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should not go to previous page on left arrow when on first page", () => {
      const pagination = createMockPagination({ page: 1 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      fireEvent.keyDown(nav, { key: "ArrowLeft" });

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should not go to next page on right arrow when on last page", () => {
      const pagination = createMockPagination({ page: 5, totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      fireEvent.keyDown(nav, { key: "ArrowRight" });

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should ignore other key presses", () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      fireEvent.keyDown(nav, { key: "Enter" });
      fireEvent.keyDown(nav, { key: " " });
      fireEvent.keyDown(nav, { key: "a" });

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PAGE NUMBER DISPLAY LOGIC
  // ==========================================================================

  describe("Page Number Display Logic", () => {
    it("should show all pages when totalPages <= 7", () => {
      const pagination = createMockPagination({ totalPages: 7, page: 4 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      for (let i = 1; i <= 7; i++) {
        expect(screen.getByRole("button", { name: `Strona ${i}` })).toBeInTheDocument();
      }

      // Should not have ellipsis
      expect(screen.queryByText("...")).not.toBeInTheDocument();
    });

    it("should show ellipsis when near start (page <= 3)", () => {
      const pagination = createMockPagination({ totalPages: 10, page: 2 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole("button", { name: "Strona 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 10" })).toBeInTheDocument();
      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("should show ellipsis when near end (page >= totalPages - 2)", () => {
      const pagination = createMockPagination({ totalPages: 10, page: 9 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole("button", { name: "Strona 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 7" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 8" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 9" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 10" })).toBeInTheDocument();
      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("should show double ellipsis when in middle", () => {
      const pagination = createMockPagination({ totalPages: 10, page: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole("button", { name: "Strona 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 6" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 10" })).toBeInTheDocument();

      const ellipses = screen.getAllByText("...");
      expect(ellipses).toHaveLength(2);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle single page", () => {
      const pagination = createMockPagination({ page: 1, totalPages: 1, total: 10 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByLabelText("Poprzednia strona");
      const nextButton = screen.getByLabelText("Następna strona");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();

      // Should show page 1
      expect(screen.getByRole("button", { name: "Strona 1" })).toBeInTheDocument();
    });

    it("should handle zero pages edge case", () => {
      const pagination = createMockPagination({ page: 1, totalPages: 0, total: 0 });

      // This is an edge case - component should still render without crashing
      expect(() => {
        render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);
      }).not.toThrow();
    });

    it("should handle very large page numbers", () => {
      const pagination = createMockPagination({ page: 50, totalPages: 100, total: 2000 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("981")).toBeInTheDocument(); // startItem
      expect(screen.getByText("1000")).toBeInTheDocument(); // endItem
      expect(screen.getByText("2000")).toBeInTheDocument(); // total
    });

    it("should handle partial last page", () => {
      const pagination = createMockPagination({ page: 3, limit: 20, total: 45, totalPages: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      // Last page should show 41-45 (not 41-60)
      expect(screen.getByText("41")).toBeInTheDocument();
      expect(screen.getAllByText("45")).toHaveLength(2); // endItem and total
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper navigation role", () => {
      const pagination = createMockPagination();
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should have aria-label for navigation", () => {
      const pagination = createMockPagination();
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText("Nawigacja po stronach")).toBeInTheDocument();
    });

    it("should have descriptive aria-labels for buttons", () => {
      const pagination = createMockPagination({ totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText("Poprzednia strona")).toBeInTheDocument();
      expect(screen.getByLabelText("Następna strona")).toBeInTheDocument();
      expect(screen.getByLabelText("Strona 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Strona 2")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VISUAL STYLING
  // ==========================================================================

  describe("Visual Styling", () => {
    it("should highlight current page with green background", () => {
      const pagination = createMockPagination({ page: 3 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByRole("button", { name: "Strona 3" });
      expect(currentPageButton).toHaveClass("bg-green-600");
    });

    it("should have consistent button sizes", () => {
      const pagination = createMockPagination({ totalPages: 5 });
      render(<Pagination pagination={pagination} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByRole("button");

      buttons.forEach((button) => {
        expect(button).toHaveClass("h-9", "w-9");
      });
    });
  });
});
