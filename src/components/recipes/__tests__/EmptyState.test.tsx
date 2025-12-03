import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyState from "../EmptyState";

// ============================================================================
// TESTS
// ============================================================================

describe("EmptyState", () => {
  const mockOnAddRecipe = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // NO RECIPES STATE
  // ==========================================================================

  describe("No Recipes State", () => {
    it("should render with type='no-recipes'", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      expect(screen.getByText(/nie masz jeszcze przepisów/i)).toBeInTheDocument();
    });

    it("should show appropriate heading for no-recipes", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent(/nie masz jeszcze przepisów/i);
    });

    it("should show descriptive message", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      expect(screen.getByText(/dodaj swój pierwszy przepis/i)).toBeInTheDocument();
    });

    it("should show 'Add Recipe' button when not public view", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} isPublicView={false} />);

      const button = screen.getByRole("button", { name: /dodaj pierwszy przepis/i });
      expect(button).toBeInTheDocument();
    });

    it("should hide 'Add Recipe' button in public view", () => {
      render(<EmptyState type="no-recipes" isPublicView={true} />);

      const button = screen.queryByRole("button", { name: /dodaj pierwszy przepis/i });
      expect(button).not.toBeInTheDocument();
    });

    it("should call onAddRecipe when button clicked", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      const button = screen.getByRole("button", { name: /dodaj pierwszy przepis/i });
      fireEvent.click(button);

      expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
    });

    it("should show different message in public view", () => {
      render(<EmptyState type="no-recipes" isPublicView={true} />);

      expect(screen.getByText(/brak publicznych przepisów w społeczności/i)).toBeInTheDocument();
    });

    it("should render FileX icon for no-recipes state", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      // Lucide icons render as SVGs
      const icon = document.querySelector(".lucide-file-x");
      expect(icon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // NO RESULTS STATE
  // ==========================================================================

  describe("No Results State", () => {
    it("should render with type='no-results'", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      expect(screen.getByText(/nie znaleziono przepisów pasujących do kryteriów/i)).toBeInTheDocument();
    });

    it("should show appropriate heading for no-results", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent(/nie znaleziono przepisów pasujących do kryteriów/i);
    });

    it("should show descriptive message about filters", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      expect(screen.getByText(/spróbuj zmienić filtry/i)).toBeInTheDocument();
    });

    it("should show 'Clear Filters' button", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      const button = screen.getByRole("button", { name: /wyczyść filtry/i });
      expect(button).toBeInTheDocument();
    });

    it("should call onClearFilters when button clicked", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      const button = screen.getByRole("button", { name: /wyczyść filtry/i });
      fireEvent.click(button);

      expect(mockOnClearFilters).toHaveBeenCalledTimes(1);
    });

    it("should show different heading in public view", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} isPublicView={true} />);

      expect(screen.getByText(/nie znaleziono publicznych przepisów pasujących do kryteriów/i)).toBeInTheDocument();
    });

    it("should render Search icon for no-results state", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      // Lucide icons render as SVGs
      const icon = document.querySelector(".lucide-search");
      expect(icon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CONDITIONAL RENDERING
  // ==========================================================================

  describe("Conditional Rendering", () => {
    it("should render correct state based on type prop", () => {
      const { rerender } = render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      expect(screen.getByText(/nie masz jeszcze przepisów/i)).toBeInTheDocument();

      rerender(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} />);

      expect(screen.getByText(/nie znaleziono przepisów pasujących do kryteriów/i)).toBeInTheDocument();
    });

    it("should only render one state at a time", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      // Should show no-recipes state
      expect(screen.getByText(/nie masz jeszcze przepisów/i)).toBeInTheDocument();

      // Should NOT show no-results state
      expect(screen.queryByText(/nie znaleziono przepisów pasujących do kryteriów/i)).not.toBeInTheDocument();
    });

    it("should not render button when callback is undefined", () => {
      render(<EmptyState type="no-recipes" />);

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it("should have descriptive button labels", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName();
      expect(button.textContent).toBeTruthy();
    });

    it("should have container structure", () => {
      render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} />);

      // Check for main container with proper classes
      const container = screen.getByRole("heading").closest("div");
      expect(container).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PUBLIC VIEW MODE
  // ==========================================================================

  describe("Public View Mode", () => {
    it("should pass isPublicView prop correctly", () => {
      const { rerender } = render(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} isPublicView={false} />);

      expect(screen.getByText(/nie masz jeszcze przepisów/i)).toBeInTheDocument();

      rerender(<EmptyState type="no-recipes" onAddRecipe={mockOnAddRecipe} isPublicView={true} />);

      expect(screen.getByText(/brak publicznych przepisów w społeczności/i)).toBeInTheDocument();
    });

    it("should hide action button in public view for no-recipes", () => {
      render(<EmptyState type="no-recipes" isPublicView={true} />);

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("should show clear filters button in public view for no-results", () => {
      render(<EmptyState type="no-results" onClearFilters={mockOnClearFilters} isPublicView={true} />);

      const button = screen.getByRole("button", { name: /wyczyść filtry/i });
      expect(button).toBeInTheDocument();
    });
  });
});
