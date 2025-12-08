import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DislikedIngredientsSection } from "../DislikedIngredientsSection";
import type { DislikedIngredientDTO } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockIngredients: DislikedIngredientDTO[] = [
  // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
  { id: "1", ingredientName: "Cebula", userId: "user-1" },
  // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
  { id: "2", ingredientName: "Czosnek", userId: "user-1" },
  // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
  { id: "3", ingredientName: "Papryka", userId: "user-1" },
];

// ============================================================================
// TESTS
// ============================================================================

describe("DislikedIngredientsSection", () => {
  // ==========================================================================
  // RENDERING & INITIAL STATE
  // ==========================================================================

  describe("Rendering & Initial State", () => {
    it("should render section heading and description", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByRole("heading", { name: /niechciane składniki/i })).toBeInTheDocument();
      expect(screen.getByText(/dodaj składniki, które chcesz wykluczyć z przepisów/i)).toBeInTheDocument();
    });

    it("should render AddIngredientForm at top", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      // Form should be present with input and button
      expect(screen.getByPlaceholderText(/wpisz nazwę składnika/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dodaj/i })).toBeInTheDocument();
    });

    it("should render all disliked ingredients as IngredientItem components", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText("Cebula")).toBeInTheDocument();
      expect(screen.getByText("Czosnek")).toBeInTheDocument();
      expect(screen.getByText("Papryka")).toBeInTheDocument();
    });

    it("should display ingredient count", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText(/liczba składników: 3/i)).toBeInTheDocument();
    });

    it("should show empty state when no ingredients", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText(/nie masz jeszcze żadnych niechcianych składników/i)).toBeInTheDocument();
      expect(screen.getByText(/dodaj składniki, których nie lubisz lub chcesz unikać/i)).toBeInTheDocument();
    });

    it("should render XCircle icon in empty state", () => {
      const { container } = render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      // Check for XCircle icon (lucide-react adds specific classes)
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should render ingredients in order", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const items = screen.getAllByRole("button", { name: /usuń/i });
      expect(items).toHaveLength(3);
    });
  });

  // ==========================================================================
  // USER INTERACTION - ADDING
  // ==========================================================================

  describe("User Interaction - Adding", () => {
    it("should call onAdd when form submitted", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={onAdd}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Cebula");
      });
    });

    it("should clear form after successful add", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={onAdd}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("should show loading state during add (isAdding)", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={true}
          removingId={null}
        />
      );

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      // @ts-expect-error TS2339: Property 'type' does not exist on type 'HTMLInputElement'.
      const button = screen.getByRole("button", { type: "submit" });

      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    it("should disable form during add", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={true}
          removingId={null}
        />
      );

      expect(screen.getByPlaceholderText(/wpisz nazwę składnika/i)).toBeDisabled();
      // @ts-expect-error TS2339: Property 'type' does not exist on type 'HTMLInputElement'.
      expect(screen.getByRole("button", { type: "submit" })).toBeDisabled();
    });

    it("should handle add errors gracefully", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockRejectedValue(new Error("Failed to add"));

      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={onAdd}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Cebula");
      });

      // Input should keep value on error for retry
      expect(input).toHaveValue("Cebula");
    });
  });

  // ==========================================================================
  // USER INTERACTION - REMOVING
  // ==========================================================================

  describe("User Interaction - Removing", () => {
    it("should call onRemove with ingredient ID", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn().mockResolvedValue(undefined);

      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={onRemove}
          isAdding={false}
          removingId={null}
        />
      );

      const removeButton = screen.getByRole("button", { name: /usuń cebula/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith("1");
      });
    });

    it("should show loading spinner on ingredient being removed", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId="1"
        />
      );

      // Button for Cebula (id: "1") should show loading spinner
      const button = screen.getByRole("button", { name: /usuń cebula/i });
      expect(button).toBeDisabled();
    });

    it("should disable remove button during remove", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId="2"
        />
      );

      const button = screen.getByRole("button", { name: /usuń czosnek/i });
      expect(button).toBeDisabled();
    });

    it("should track removing state per ingredient (removingId)", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId="1"
        />
      );

      // Only first ingredient should be disabled
      expect(screen.getByRole("button", { name: /usuń cebula/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /usuń czosnek/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /usuń papryka/i })).not.toBeDisabled();
    });

    it("should allow removing different ingredients when none are being removed", async () => {
      const onRemove = vi.fn().mockResolvedValue(undefined);

      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={onRemove}
          isAdding={false}
          removingId={null}
        />
      );

      // All buttons should be enabled
      expect(screen.getByRole("button", { name: /usuń cebula/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /usuń czosnek/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /usuń papryka/i })).not.toBeDisabled();
    });

    it("should handle remove errors gracefully", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn().mockRejectedValue(new Error("Failed to remove"));

      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={onRemove}
          isAdding={false}
          removingId={null}
        />
      );

      const removeButton = screen.getByRole("button", { name: /usuń cebula/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith("1");
      });

      // Component should not crash
      expect(screen.getByText("Cebula")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  describe("Empty State", () => {
    it("should show empty state when array is empty", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText(/nie masz jeszcze żadnych niechcianych składników/i)).toBeInTheDocument();
    });

    it("should hide empty state when ingredients exist", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.queryByText(/nie masz jeszcze żadnych niechcianych składników/i)).not.toBeInTheDocument();
    });

    it("should update count display (0 ingredients)", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      // Count should not be displayed when empty
      expect(screen.queryByText(/liczba składników/i)).not.toBeInTheDocument();
    });

    it("should have proper styling for empty state", () => {
      const { container } = render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      // Check for dashed border styling
      const emptyState = container.querySelector(".border-dashed");
      expect(emptyState).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const heading = screen.getByRole("heading", { name: /niechciane składniki/i });
      expect(heading.tagName).toBe("H2");
    });

    it("should have accessible labels for add form", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      expect(input).toBeInTheDocument();

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeInTheDocument();
    });

    it("should have aria-labels for remove buttons", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByRole("button", { name: /usuń cebula/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /usuń czosnek/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /usuń papryka/i })).toBeInTheDocument();
    });

    it("should announce ingredient count to screen readers", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const countText = screen.getByText(/liczba składników: 3/i);
      expect(countText).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTEGRATION WITH SUB-COMPONENTS
  // ==========================================================================

  describe("Integration with Sub-components", () => {
    it("should pass onAdd callback to AddIngredientForm", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={onAdd}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Test");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Test");
      });
    });

    it("should pass isAdding to AddIngredientForm", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={true}
          removingId={null}
        />
      );

      expect(screen.getByPlaceholderText(/wpisz nazwę składnika/i)).toBeDisabled();
    });

    it("should pass onRemove callback to IngredientItem", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn().mockResolvedValue(undefined);

      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={onRemove}
          isAdding={false}
          removingId={null}
        />
      );

      await user.click(screen.getByRole("button", { name: /usuń cebula/i }));

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith("1");
      });
    });

    it("should pass isRemoving to correct IngredientItem", () => {
      render(
        <DislikedIngredientsSection
          ingredients={mockIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId="2"
        />
      );

      // Only second item should be disabled
      expect(screen.getByRole("button", { name: /usuń cebula/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /usuń czosnek/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /usuń papryka/i })).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle ingredient with very long name", () => {
      const longNameIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Very Long Ingredient Name That Exceeds Normal Length Expectations For Testing",
        // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
        userId: "user-1",
      };

      render(
        <DislikedIngredientsSection
          ingredients={[longNameIngredient]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(
        screen.getByText("Very Long Ingredient Name That Exceeds Normal Length Expectations For Testing")
      ).toBeInTheDocument();
    });

    it("should handle ingredient with special characters", () => {
      const specialCharIngredient: DislikedIngredientDTO = {
        id: "99",
        ingredientName: "Ingredient (Special) & Characters!",
        // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
        userId: "user-1",
      };

      render(
        <DislikedIngredientsSection
          ingredients={[specialCharIngredient]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText("Ingredient (Special) & Characters!")).toBeInTheDocument();
    });

    it("should handle single ingredient", () => {
      render(
        <DislikedIngredientsSection
          ingredients={[mockIngredients[0]]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText(/liczba składników: 1/i)).toBeInTheDocument();
      expect(screen.getByText("Cebula")).toBeInTheDocument();
    });

    it("should handle many ingredients (10+)", () => {
      const manyIngredients = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        ingredientName: `Składnik ${i + 1}`,
        userId: "user-1",
      })) as unknown as DislikedIngredientDTO[];

      render(
        <DislikedIngredientsSection
          ingredients={manyIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText(/liczba składników: 15/i)).toBeInTheDocument();
    });

    it("should handle Polish characters in ingredient names", () => {
      const polishIngredients: DislikedIngredientDTO[] = [
        // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
        { id: "1", ingredientName: "Śledź", userId: "user-1" },
        // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
        { id: "2", ingredientName: "Żurek", userId: "user-1" },
        // @ts-expect-error TS2322: Type '{ id: string; ingredientName: string; userId: string; }' is not assignable to type 'DislikedIngredientDTO'.
        { id: "3", ingredientName: "Łosoś", userId: "user-1" },
      ];

      render(
        <DislikedIngredientsSection
          ingredients={polishIngredients}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          isAdding={false}
          removingId={null}
        />
      );

      expect(screen.getByText("Śledź")).toBeInTheDocument();
      expect(screen.getByText("Żurek")).toBeInTheDocument();
      expect(screen.getByText("Łosoś")).toBeInTheDocument();
    });
  });
});
