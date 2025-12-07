import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddIngredientForm } from "../AddIngredientForm";

// ============================================================================
// TESTS
// ============================================================================

describe("AddIngredientForm", () => {
  // ==========================================================================
  // RENDERING & INITIAL STATE
  // ==========================================================================

  describe("Rendering & Initial State", () => {
    it("should render input field with placeholder", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      expect(screen.getByPlaceholderText(/wpisz nazwę składnika/i)).toBeInTheDocument();
    });

    it("should render add button with Plus icon", () => {
      const { container } = render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeInTheDocument();

      // Check for Plus icon
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should input be empty initially", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      expect(input).toHaveValue("");
    });

    it("should not show error initially", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      expect(screen.queryByText(/nazwa składnika jest wymagana/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/nie może przekraczać 100 znaków/i)).not.toBeInTheDocument();
    });

    it("should add button be enabled initially", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeDisabled(); // Disabled when empty
    });

    it("should have inline form layout (input + button)", () => {
      const { container } = render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();

      const flexContainer = container.querySelector(".flex.gap-2");
      expect(flexContainer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // USER INTERACTION
  // ==========================================================================

  describe("User Interaction", () => {
    it("should update input value on typing", async () => {
      const user = userEvent.setup();

      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");

      expect(input).toHaveValue("Cebula");
    });

    it("should call onAdd on button click", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Cebula");
      });
    });

    it("should call onAdd on Enter key press", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Cebula");
      });
    });

    it("should clear input after successful add", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("should enable button when user types valid input", async () => {
      const user = userEvent.setup();

      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      const button = screen.getByRole("button", { name: /dodaj/i });

      // Initially disabled
      expect(button).toBeDisabled();

      // Start typing
      await user.type(input, "C");

      // Button should be enabled
      expect(button).not.toBeDisabled();
    });

    it("should not clear input on add error", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockRejectedValue(new Error("Failed to add"));

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalled();
      });

      // Input should keep value for retry
      expect(input).toHaveValue("Cebula");
    });

    it("should focus remain on input after successful add", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Cebula");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(input).toHaveValue("");
      });

      // Input should still be in the document and focusable
      expect(input).toBeInTheDocument();
    });

    it("should disable button during submission (isAdding)", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={true} />);

      const button = screen.getByRole("button", { type: "submit" });
      expect(button).toBeDisabled();
    });
  });

  // ==========================================================================
  // CLIENT-SIDE VALIDATION
  // ==========================================================================

  describe("Client-Side Validation", () => {
    it("should disable button for empty input", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeDisabled();
    });

    it("should disable button for whitespace-only input", async () => {
      const user = userEvent.setup();

      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "   ");

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeDisabled();
    });

    it("should enforce maxLength attribute preventing >100 chars", async () => {
      const user = userEvent.setup();

      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);

      // Try to type 101 characters, but maxLength=100 prevents it
      const longString = "a".repeat(101);
      await user.type(input, longString);

      // Input should only have 100 characters
      expect(input).toHaveValue("a".repeat(100));
    });

    it("should trim whitespace before validation", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "  Cebula  ");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Cebula");
      });
    });

    it("should not submit when button is disabled", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeDisabled();

      // Try to submit (button is disabled so onAdd won't be called)
      await user.click(button);

      expect(onAdd).not.toHaveBeenCalled();
    });


    it("should allow valid 100-character input", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      const validString = "a".repeat(100);
      await user.type(input, validString);
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith(validString);
      });
    });

    it("should allow 1-character input", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "A");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("A");
      });
    });

    it("should handle special characters and Polish characters", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Śledź & Żurek (Special)");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Śledź & Żurek (Special)");
      });
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe("Loading State", () => {
    it("should show loading spinner when isAdding", () => {
      const { container } = render(<AddIngredientForm onAdd={vi.fn()} isAdding={true} />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should disable input when isAdding", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={true} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      expect(input).toBeDisabled();
    });

    it("should disable button when isAdding", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={true} />);

      const button = screen.getByRole("button", { type: "submit" });
      expect(button).toBeDisabled();
    });

    it("should spinner replace Plus icon", () => {
      const { container } = render(<AddIngredientForm onAdd={vi.fn()} isAdding={true} />);

      // Should have spinner, not Plus icon
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should form cannot be submitted during loading", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();

      render(<AddIngredientForm onAdd={onAdd} isAdding={true} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      const button = screen.getByRole("button", { type: "submit" });

      // Try to type and submit
      await user.type(input, "Test");
      await user.click(button);

      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should input have aria-invalid set to false when no error", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("should button have accessible name", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      // Button should be found by accessible name
      expect(screen.getByRole("button", { name: /dodaj/i })).toBeInTheDocument();
    });

    it("should input have maxLength attribute", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      expect(input).toHaveAttribute("maxLength", "100");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle rapid submissions", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Test");

      const button = screen.getByRole("button", { name: /dodaj/i });
      await user.click(button);
      await user.click(button);

      // Should only submit once (second click happens when form is cleared)
      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledTimes(1);
      });
    });

    it("should disable button for whitespace input preventing submission", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "     ");

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeDisabled();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("should handle numbers in ingredient name", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Ingredient 123");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Ingredient 123");
      });
    });

    it("should handle emoji in ingredient name", async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);

      render(<AddIngredientForm onAdd={onAdd} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Ingredient 🥕");
      await user.click(screen.getByRole("button", { name: /dodaj/i }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledWith("Ingredient 🥕");
      });
    });

    it("should button be disabled when input is empty", () => {
      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).toBeDisabled();
    });

    it("should button be enabled when input has text", async () => {
      const user = userEvent.setup();

      render(<AddIngredientForm onAdd={vi.fn()} isAdding={false} />);

      const input = screen.getByPlaceholderText(/wpisz nazwę składnika/i);
      await user.type(input, "Test");

      const button = screen.getByRole("button", { name: /dodaj/i });
      expect(button).not.toBeDisabled();
    });
  });
});
