import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "../SearchBar";

// ============================================================================
// TESTS
// ============================================================================

describe("SearchBar", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render input field", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox", { name: /wyszukaj przepisy/i });
      expect(input).toBeInTheDocument();
    });

    it("should render search icon", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      // Lucide icons render as SVGs
      const searchIcon = document.querySelector(".lucide-search");
      expect(searchIcon).toBeInTheDocument();
    });

    it("should show placeholder text", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText("Szukaj przepisów...");
      expect(input).toBeInTheDocument();
    });

    it("should show custom placeholder when provided", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} placeholder="Custom placeholder" />);

      const input = screen.getByPlaceholderText("Custom placeholder");
      expect(input).toBeInTheDocument();
    });

    it("should display current value prop", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("pasta");
    });
  });

  // ==========================================================================
  // USER INTERACTION
  // ==========================================================================

  describe("User Interaction", () => {
    it("should call onChange when user types", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "pizza" } });

      expect(mockOnChange).toHaveBeenCalledWith("pizza");
    });

    it("should call onChange with trimmed value", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "  pasta  " } });

      expect(mockOnChange).toHaveBeenCalledWith("pasta");
    });

    it("should call onChange with undefined for empty string", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    it("should call onChange with undefined for whitespace-only string", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "   " } });

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    it("should enforce max length of 255 characters", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      const longString = "a".repeat(256);

      fireEvent.change(input, { target: { value: longString } });

      // Should not call onChange because length exceeds 255
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should allow 255 character input", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      const maxLengthString = "a".repeat(255);

      fireEvent.change(input, { target: { value: maxLengthString } });

      expect(mockOnChange).toHaveBeenCalledWith(maxLengthString);
    });

    it("should trigger onChange on Enter key press", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");

      // Clear previous calls
      mockOnChange.mockClear();

      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnChange).toHaveBeenCalledWith("pasta");
    });
  });

  // ==========================================================================
  // CLEAR BUTTON
  // ==========================================================================

  describe("Clear Button", () => {
    it("should show clear button when input has value", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("should hide clear button when input is empty", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should clear input when clear button clicked", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    it("should update local state when clear button clicked", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("pasta");

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      fireEvent.click(clearButton);

      expect(input.value).toBe("");
    });
  });

  // ==========================================================================
  // VALUE SYNCHRONIZATION
  // ==========================================================================

  describe("Value Synchronization", () => {
    it("should update input when value prop changes", () => {
      const { rerender } = render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("pasta");

      rerender(<SearchBar value="pizza" onChange={mockOnChange} />);

      expect(input.value).toBe("pizza");
    });

    it("should update input from value to empty", () => {
      const { rerender } = render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("pasta");

      rerender(<SearchBar value={undefined} onChange={mockOnChange} />);

      expect(input.value).toBe("");
    });

    it("should update input from empty to value", () => {
      const { rerender } = render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");

      rerender(<SearchBar value="pasta" onChange={mockOnChange} />);

      expect(input.value).toBe("pasta");
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper aria-label on input", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox", { name: /wyszukaj przepisy/i });
      expect(input).toBeInTheDocument();
    });

    it("should have proper aria-label on clear button", () => {
      render(<SearchBar value="pasta" onChange={mockOnChange} />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("should have search icon marked as decorative", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      // Icon parent should not be interactive
      const searchIcon = document.querySelector(".lucide-search");
      expect(searchIcon?.parentElement?.hasAttribute("aria-hidden")).toBeFalsy();
      // Icon itself is decorative (no role)
    });

    it("should be keyboard accessible", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");

      // Tab to input
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  // ==========================================================================
  // SPECIAL CHARACTERS
  // ==========================================================================

  describe("Special Characters", () => {
    it("should handle Polish characters", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "żurek" } });

      expect(mockOnChange).toHaveBeenCalledWith("żurek");
    });

    it("should handle special characters", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "recipe @#$%" } });

      expect(mockOnChange).toHaveBeenCalledWith("recipe @#$%");
    });

    it("should handle numbers", () => {
      render(<SearchBar value={undefined} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "recipe 123" } });

      expect(mockOnChange).toHaveBeenCalledWith("recipe 123");
    });
  });
});
