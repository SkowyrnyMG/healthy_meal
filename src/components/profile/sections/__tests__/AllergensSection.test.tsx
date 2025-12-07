import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AllergensSection } from "../AllergensSection";
import type { AllergenDTO } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockAllergens: AllergenDTO[] = [
  { id: "1", name: "Gluten" },
  { id: "2", name: "Lactose" },
  { id: "3", name: "Nuts" },
  { id: "4", name: "Shellfish" },
  { id: "5", name: "Eggs" },
];

// ============================================================================
// TESTS
// ============================================================================

describe("AllergensSection", () => {
  // ==========================================================================
  // RENDERING & INITIAL STATE
  // ==========================================================================

  describe("Rendering & Initial State", () => {
    it("should render section heading and description", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByRole("heading", { name: /alergeny/i })).toBeInTheDocument();
      expect(screen.getByText(/zaznacz alergeny, które chcesz wykluczyć z przepisów/i)).toBeInTheDocument();
    });

    it("should render all allergen checkboxes", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      mockAllergens.forEach((allergen) => {
        expect(screen.getByLabelText(allergen.name)).toBeInTheDocument();
      });
    });

    it("should check selected allergens based on selectedAllergenIds prop", () => {
      const selectedIds = new Set(["1", "3"]);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={selectedIds}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByLabelText("Gluten")).toBeChecked();
      expect(screen.getByLabelText("Lactose")).not.toBeChecked();
      expect(screen.getByLabelText("Nuts")).toBeChecked();
      expect(screen.getByLabelText("Shellfish")).not.toBeChecked();
    });

    it("should display selected count", () => {
      const selectedIds = new Set(["1", "3"]);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={selectedIds}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByText(/wybrano: 2 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should render save button", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByRole("button", { name: /zapisz/i })).toBeInTheDocument();
    });

    it("should show loading skeleton when isLoading is true", () => {
      render(
        <AllergensSection
          allAllergens={[]}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={true}
        />
      );

      // Should render 9 skeleton items
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThanOrEqual(9);

      // Should not render checkboxes or save button
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /zapisz/i })).not.toBeInTheDocument();
    });

    it("should show empty state when allergens array is empty", () => {
      render(
        <AllergensSection
          allAllergens={[]}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByText(/brak dostępnych alergenów do wyboru/i)).toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /zapisz/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // GRID LAYOUT
  // ==========================================================================

  describe("Grid Layout", () => {
    it("should render checkboxes in responsive grid", () => {
      const { container } = render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      // Find grid container
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("gap-4");
      expect(grid).toHaveClass("sm:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
    });

    it("should render 9 skeleton items during loading", () => {
      const { container } = render(
        <AllergensSection
          allAllergens={[]}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={true}
        />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(9);
    });

    it("should maintain layout with 1 allergen", () => {
      render(
        <AllergensSection
          allAllergens={[mockAllergens[0]]}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByLabelText("Gluten")).toBeInTheDocument();
      expect(screen.getByText(/wybrano: 0 z 1 alergenów/i)).toBeInTheDocument();
    });

    it("should maintain layout with 10 allergens", () => {
      const manyAllergens = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Allergen ${i + 1}`,
      }));

      render(
        <AllergensSection
          allAllergens={manyAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByText(/wybrano: 0 z 10 alergenów/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // USER INTERACTION
  // ==========================================================================

  describe("User Interaction", () => {
    it("should check an allergen when clicked", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      const checkbox = screen.getByLabelText("Gluten");
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(screen.getByText(/wybrano: 1 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should uncheck an allergen when clicked", async () => {
      const user = userEvent.setup();
      const selectedIds = new Set(["1"]);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={selectedIds}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      const checkbox = screen.getByLabelText("Gluten");
      expect(checkbox).toBeChecked();

      await user.click(checkbox);

      expect(checkbox).not.toBeChecked();
      expect(screen.getByText(/wybrano: 0 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should select multiple allergens", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      await user.click(screen.getByLabelText("Gluten"));
      await user.click(screen.getByLabelText("Nuts"));
      await user.click(screen.getByLabelText("Eggs"));

      expect(screen.getByLabelText("Gluten")).toBeChecked();
      expect(screen.getByLabelText("Nuts")).toBeChecked();
      expect(screen.getByLabelText("Eggs")).toBeChecked();
      expect(screen.getByText(/wybrano: 3 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should deselect all allergens", async () => {
      const user = userEvent.setup();
      const selectedIds = new Set(["1", "2", "3"]);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={selectedIds}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      await user.click(screen.getByLabelText("Gluten"));
      await user.click(screen.getByLabelText("Lactose"));
      await user.click(screen.getByLabelText("Nuts"));

      expect(screen.getByText(/wybrano: 0 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should update selected count when selection changes", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByText(/wybrano: 0 z 5 alergenów/i)).toBeInTheDocument();

      await user.click(screen.getByLabelText("Gluten"));
      expect(screen.getByText(/wybrano: 1 z 5 alergenów/i)).toBeInTheDocument();

      await user.click(screen.getByLabelText("Nuts"));
      expect(screen.getByText(/wybrano: 2 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should toggle checkbox with keyboard (Space)", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      const checkbox = screen.getByLabelText("Gluten");
      checkbox.focus();
      await user.keyboard(" ");

      expect(checkbox).toBeChecked();
    });
  });

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================

  describe("Form Submission", () => {
    it("should call onSave with selected allergen IDs", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={onSave}
          isSaving={false}
          isLoading={false}
        />
      );

      await user.click(screen.getByLabelText("Gluten"));
      await user.click(screen.getByLabelText("Nuts"));

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      const calledWithSet = onSave.mock.calls[0][0];
      expect(calledWithSet).toBeInstanceOf(Set);
      expect(calledWithSet.has("1")).toBe(true); // Gluten
      expect(calledWithSet.has("3")).toBe(true); // Nuts
      expect(calledWithSet.size).toBe(2);
    });

    it("should disable all checkboxes during save", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={true}
          isLoading={false}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it("should disable save button during save", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={true}
          isLoading={false}
        />
      );

      const saveButton = screen.getByRole("button", { name: /zapisywanie/i });
      expect(saveButton).toBeDisabled();
    });

    it("should show loading spinner when isSaving is true", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={true}
          isLoading={false}
        />
      );

      expect(screen.getByRole("button", { name: /zapisywanie/i })).toBeInTheDocument();
      expect(screen.getByText(/zapisywanie/i)).toBeInTheDocument();
    });

    it("should maintain selection after successful save", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={onSave}
          isSaving={false}
          isLoading={false}
        />
      );

      await user.click(screen.getByLabelText("Gluten"));
      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByLabelText("Gluten")).toBeChecked();
    });

    it("should handle save error gracefully", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={onSave}
          isSaving={false}
          isLoading={false}
        />
      );

      await user.click(screen.getByLabelText("Gluten"));
      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      // Component should not crash
      expect(screen.getByLabelText("Gluten")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have labels associated with checkboxes", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      mockAllergens.forEach((allergen) => {
        const checkbox = screen.getByLabelText(allergen.name);
        expect(checkbox).toHaveAttribute("id", `allergen-${allergen.id}`);
      });
    });

    it("should have aria-label on checkboxes", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      mockAllergens.forEach((allergen) => {
        const checkbox = screen.getByRole("checkbox", {
          name: new RegExp(`alergen: ${allergen.name}`, "i"),
        });
        expect(checkbox).toBeInTheDocument();
      });
    });

    it("should have proper heading hierarchy", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      const heading = screen.getByRole("heading", { name: /alergeny/i });
      expect(heading.tagName).toBe("H2");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      // Tab to first checkbox
      await user.tab();
      expect(screen.getByLabelText("Gluten")).toHaveFocus();

      // Space to toggle
      await user.keyboard(" ");
      expect(screen.getByLabelText("Gluten")).toBeChecked();
    });

    it("should announce selected count to screen readers", () => {
      const selectedIds = new Set(["1", "3"]);

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={selectedIds}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      const countText = screen.getByText(/wybrano: 2 z 5 alergenów/i);
      expect(countText).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STATE SYNCHRONIZATION
  // ==========================================================================

  describe("State Synchronization", () => {
    it("should sync local state when selectedAllergenIds prop changes", () => {
      const { rerender } = render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set(["1"])}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByLabelText("Gluten")).toBeChecked();
      expect(screen.getByText(/wybrano: 1 z 5 alergenów/i)).toBeInTheDocument();

      rerender(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set(["1", "2", "3"])}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByLabelText("Gluten")).toBeChecked();
      expect(screen.getByLabelText("Lactose")).toBeChecked();
      expect(screen.getByLabelText("Nuts")).toBeChecked();
      expect(screen.getByText(/wybrano: 3 z 5 alergenów/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle allergen with very long name", () => {
      const longNameAllergen: AllergenDTO = {
        id: "99",
        name: "Very Long Allergen Name That Exceeds Normal Length Expectations",
      };

      render(
        <AllergensSection
          allAllergens={[...mockAllergens, longNameAllergen]}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(
        screen.getByLabelText("Very Long Allergen Name That Exceeds Normal Length Expectations")
      ).toBeInTheDocument();
    });

    it("should handle allergen with special characters", () => {
      const specialCharAllergen: AllergenDTO = {
        id: "99",
        name: "Allergen (Special) & Characters!",
      };

      render(
        <AllergensSection
          allAllergens={[...mockAllergens, specialCharAllergen]}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByLabelText("Allergen (Special) & Characters!")).toBeInTheDocument();
    });

    it("should handle all allergens selected", async () => {
      const user = userEvent.setup();

      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      for (const allergen of mockAllergens) {
        await user.click(screen.getByLabelText(allergen.name));
      }

      expect(screen.getByText(/wybrano: 5 z 5 alergenów/i)).toBeInTheDocument();
    });

    it("should handle empty selected set", () => {
      render(
        <AllergensSection
          allAllergens={mockAllergens}
          selectedAllergenIds={new Set()}
          onSave={vi.fn()}
          isSaving={false}
          isLoading={false}
        />
      );

      expect(screen.getByText(/wybrano: 0 z 5 alergenów/i)).toBeInTheDocument();
    });
  });
});
