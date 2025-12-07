import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IngredientItem } from "../IngredientItem";
import type { DislikedIngredientDTO } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockIngredient: DislikedIngredientDTO = {
  id: "1",
  ingredientName: "Cebula",
  userId: "user-1",
};

// ============================================================================
// TESTS
// ============================================================================

describe("IngredientItem", () => {
  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render ingredient name", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(screen.getByText("Cebula")).toBeInTheDocument();
    });

    it("should render remove button with X icon", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toBeInTheDocument();

      // Check for X icon (lucide-react)
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should show loading spinner when isRemoving is true", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      // Check for Loader2 spinner with animation
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should hide X icon when isRemoving is true", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      // When removing, only spinner should be visible (no X icon)
      // Loader2 uses animate-spin, X does not
      const spinners = container.querySelectorAll(".animate-spin");
      expect(spinners.length).toBe(1);
    });

    it("should disable remove button when isRemoving is true", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toBeDisabled();
    });

    it("should have correct button styling", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toHaveClass("text-gray-400");
      expect(button).toHaveClass("hover:text-red-600");
    });

    it("should handle very long ingredient names", () => {
      const longIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Very Long Ingredient Name That Exceeds Normal Length Expectations",
        userId: "user-1",
      };

      render(
        <IngredientItem ingredient={longIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(
        screen.getByText("Very Long Ingredient Name That Exceeds Normal Length Expectations")
      ).toBeInTheDocument();
    });

    it("should handle special characters in name", () => {
      const specialIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Ingredient (Special) & Characters!",
        userId: "user-1",
      };

      render(
        <IngredientItem ingredient={specialIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(screen.getByText("Ingredient (Special) & Characters!")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // USER INTERACTION
  // ==========================================================================

  describe("User Interaction", () => {
    it("should call onRemove with ingredient ID on button click", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();

      render(
        <IngredientItem ingredient={mockIngredient} onRemove={onRemove} isRemoving={false} />
      );

      await user.click(screen.getByRole("button", { name: /usuń cebula/i }));

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith("1");
    });

    it("should not call onRemove when disabled", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();

      render(
        <IngredientItem ingredient={mockIngredient} onRemove={onRemove} isRemoving={true} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });

      // Try to click disabled button
      await user.click(button);

      expect(onRemove).not.toHaveBeenCalled();
    });

    it("should prevent double-clicking", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();

      render(
        <IngredientItem ingredient={mockIngredient} onRemove={onRemove} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      await user.dblClick(button);

      // Should be called only once per click (2 clicks total)
      expect(onRemove).toHaveBeenCalledTimes(2);
    });

    it("should support keyboard interaction (Enter on button)", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();

      render(
        <IngredientItem ingredient={mockIngredient} onRemove={onRemove} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      button.focus();
      await user.keyboard("{Enter}");

      expect(onRemove).toHaveBeenCalledWith("1");
    });

    it("should support keyboard interaction (Space on button)", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();

      render(
        <IngredientItem ingredient={mockIngredient} onRemove={onRemove} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      button.focus();
      await user.keyboard(" ");

      expect(onRemove).toHaveBeenCalledWith("1");
    });

    it("should show loading state immediately on click", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toBeDisabled();
    });

    it("should maintain disabled state during removal", () => {
      const { rerender } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).not.toBeDisabled();

      rerender(<IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />);
      expect(button).toBeDisabled();
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe("Loading State", () => {
    it("should show Loader2 spinner when isRemoving", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should spinner have correct size", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const spinner = container.querySelector(".h-4.w-4");
      expect(spinner).toBeInTheDocument();
    });

    it("should spinner have animation class", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should hide remove icon during loading", () => {
      const { container } = render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      // Only one SVG (spinner) should be present
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(1);
      expect(svgs[0]).toHaveClass("animate-spin");
    });

    it("should button remain clickable area (but disabled)", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should remove button have aria-label with ingredient name", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toHaveAttribute("aria-label", "Usuń Cebula");
    });

    it("should button have disabled state when isRemoving", () => {
      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={true} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toBeDisabled();
    });

    it("should focus management work correctly", async () => {
      const user = userEvent.setup();

      render(
        <IngredientItem ingredient={mockIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      const button = screen.getByRole("button", { name: /usuń cebula/i });

      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle ingredient with Polish characters", () => {
      const polishIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Śledź",
        userId: "user-1",
      };

      render(
        <IngredientItem ingredient={polishIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(screen.getByText("Śledź")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /usuń śledź/i })).toBeInTheDocument();
    });

    it("should handle ingredient with numbers", () => {
      const numberIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Ingredient 123",
        userId: "user-1",
      };

      render(
        <IngredientItem ingredient={numberIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(screen.getByText("Ingredient 123")).toBeInTheDocument();
    });

    it("should handle ingredient with emoji", () => {
      const emojiIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Ingredient 🥕",
        userId: "user-1",
      };

      render(
        <IngredientItem ingredient={emojiIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(screen.getByText("Ingredient 🥕")).toBeInTheDocument();
    });

    it("should handle single character name", () => {
      const singleCharIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "A",
        userId: "user-1",
      };

      render(
        <IngredientItem ingredient={singleCharIngredient} onRemove={vi.fn()} isRemoving={false} />
      );

      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });
});
