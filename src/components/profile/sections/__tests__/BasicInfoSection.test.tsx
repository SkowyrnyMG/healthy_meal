import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BasicInfoSection } from "../BasicInfoSection";
import type { BasicInfoFormData } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockInitialData: BasicInfoFormData = {
  weight: 70,
  age: 25,
  gender: "male",
  activityLevel: "moderately_active",
};

const mockEmptyData: BasicInfoFormData = {
  weight: null,
  age: null,
  gender: null,
  activityLevel: null,
};

// ============================================================================
// TESTS
// ============================================================================

describe("BasicInfoSection", () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // RENDERING & INITIAL STATE
  // ========================================

  describe("Rendering & Initial State", () => {
    it("should render all form fields", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      expect(screen.getByLabelText(/waga/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wiek/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/płeć/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/poziom aktywności/i)).toBeInTheDocument();
    });

    it("should render section heading and description", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      expect(screen.getByRole("heading", { level: 2, name: /dane podstawowe/i })).toBeInTheDocument();
      expect(screen.getByText(/te informacje pomagają nam personalizować przepisy/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      expect(screen.getByRole("button", { name: /zapisz/i })).toBeInTheDocument();
    });

    it("should pre-populate form with initial data", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const weightInput = screen.getByLabelText(/waga/i) as HTMLInputElement;
      const ageInput = screen.getByLabelText(/wiek/i) as HTMLInputElement;

      expect(weightInput.value).toBe("70");
      expect(ageInput.value).toBe("25");
    });

    it("should display correct gender selected", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const genderTrigger = screen.getByRole("combobox", { name: /płeć/i });
      expect(genderTrigger).toHaveTextContent("Mężczyzna");
    });

    it("should display correct activity level selected", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const activityTrigger = screen.getByRole("combobox", { name: /poziom aktywności/i });
      expect(activityTrigger).toHaveTextContent("Umiarkowanie aktywny");
    });

    it("should show loading spinner when isSaving is true", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={true} />);

      expect(screen.getByText(/zapisywanie/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zapisywanie/i })).toBeDisabled();
    });

    it("should disable submit button when isSaving is true", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={true} />);

      const submitButton = screen.getByRole("button", { name: /zapisywanie/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ========================================
  // FORM INTERACTION
  // ========================================

  describe("Form Interaction", () => {
    it("should update weight field on user input", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const weightInput = screen.getByLabelText(/waga/i);
      await user.clear(weightInput);
      await user.type(weightInput, "75");

      expect(weightInput).toHaveValue(75);
    });

    it("should update age field on user input", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const ageInput = screen.getByLabelText(/wiek/i);
      await user.clear(ageInput);
      await user.type(ageInput, "30");

      expect(ageInput).toHaveValue(30);
    });

    it("should render gender select field", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const genderTrigger = screen.getByRole("combobox", { name: /płeć/i });
      expect(genderTrigger).toBeInTheDocument();
      expect(genderTrigger).toHaveTextContent("Mężczyzna");
    });

    it("should render activity level select field", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const activityTrigger = screen.getByRole("combobox", { name: /poziom aktywności/i });
      expect(activityTrigger).toBeInTheDocument();
      expect(activityTrigger).toHaveTextContent("Umiarkowanie aktywny");
    });

    it("should clear error when field is corrected", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      // Submit to trigger validation
      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/waga jest wymagana/i)).toBeInTheDocument();
      });

      // Type in weight field
      const weightInput = screen.getByLabelText(/waga/i);
      await user.type(weightInput, "70");

      // Error should be cleared
      expect(screen.queryByText(/waga jest wymagana/i)).not.toBeInTheDocument();
    });

    it("should submit form on button click", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockInitialData);
      });
    });

    it("should disable inputs during submission", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={true} />);

      const weightInput = screen.getByLabelText(/waga/i);
      const ageInput = screen.getByLabelText(/wiek/i);

      expect(weightInput).toBeDisabled();
      expect(ageInput).toBeDisabled();
    });
  });

  // ========================================
  // CLIENT-SIDE VALIDATION
  // ========================================

  describe("Client-Side Validation", () => {
    it("should show error for empty weight", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/waga jest wymagana/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should have min and max attributes for weight input", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const weightInput = screen.getByLabelText(/waga/i);
      expect(weightInput).toHaveAttribute("min", "40");
      expect(weightInput).toHaveAttribute("max", "200");
      expect(weightInput).toHaveAttribute("type", "number");
    });

    it("should have step attribute for weight allowing decimals", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const weightInput = screen.getByLabelText(/waga/i);
      expect(weightInput).toHaveAttribute("step", "0.1");
    });

    it("should show error for empty age", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wiek jest wymagany/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should have min and max attributes for age input", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const ageInput = screen.getByLabelText(/wiek/i);
      expect(ageInput).toHaveAttribute("min", "13");
      expect(ageInput).toHaveAttribute("max", "100");
      expect(ageInput).toHaveAttribute("type", "number");
    });

    it("should have step attribute for age ensuring integers", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const ageInput = screen.getByLabelText(/wiek/i);
      expect(ageInput).toHaveAttribute("step", "1");
    });

    it("should validate age is integer (no decimals)", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const ageInput = screen.getByLabelText(/wiek/i);
      expect(ageInput).toHaveAttribute("step", "1");
      expect(ageInput).toHaveAttribute("type", "number");
    });

    it("should show error for empty gender", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/płeć jest wymagana/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should show error for empty activity level", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/poziom aktywności jest wymagany/i)).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should prevent form submission when validation fails", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/waga jest wymagana/i)).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should display all errors simultaneously", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/waga jest wymagana/i)).toBeInTheDocument();
        expect(screen.getByText(/wiek jest wymagany/i)).toBeInTheDocument();
        expect(screen.getByText(/płeć jest wymagana/i)).toBeInTheDocument();
        expect(screen.getByText(/poziom aktywności jest wymagany/i)).toBeInTheDocument();
      });
    });

    it("should clear error on field change", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      // Submit to show errors
      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wiek jest wymagany/i)).toBeInTheDocument();
      });

      // Type in age field
      const ageInput = screen.getByLabelText(/wiek/i);
      await user.type(ageInput, "25");

      // Error should be cleared
      expect(screen.queryByText(/wiek jest wymagany/i)).not.toBeInTheDocument();
    });

    it("should accept weight at minimum boundary (40 kg)", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={{ ...mockInitialData, weight: 40 }} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("should accept weight at maximum boundary (200 kg)", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(
        <BasicInfoSection initialData={{ ...mockInitialData, weight: 200 }} onSave={mockOnSave} isSaving={false} />
      );

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("should accept age at minimum boundary (13)", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={{ ...mockInitialData, age: 13 }} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("should accept age at maximum boundary (100)", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={{ ...mockInitialData, age: 100 }} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  // ========================================
  // FORM SUBMISSION
  // ========================================

  describe("Form Submission", () => {
    it("should call onSave with correct data structure", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          weight: 70,
          age: 25,
          gender: "male",
          activityLevel: "moderately_active",
        });
      });
    });

    it("should include all form fields in payload", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0];
        expect(callArg).toHaveProperty("weight");
        expect(callArg).toHaveProperty("age");
        expect(callArg).toHaveProperty("gender");
        expect(callArg).toHaveProperty("activityLevel");
      });
    });

    it("should convert weight to number", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0];
        expect(typeof callArg.weight).toBe("number");
      });
    });

    it("should convert age to number", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0];
        expect(typeof callArg.age).toBe("number");
      });
    });

    it("should not submit if form invalid", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/waga jest wymagana/i)).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should handle onSave rejection gracefully", async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error("Save failed"));
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Component should not crash
      expect(screen.getByRole("button", { name: /zapisz/i })).toBeInTheDocument();
    });

    it("should handle decimal weight values", async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      render(
        <BasicInfoSection initialData={{ ...mockInitialData, weight: 75.5 }} onSave={mockOnSave} isSaving={false} />
      );

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            weight: 75.5,
          })
        );
      });
    });

    it("should update form when initialData changes", async () => {
      const { rerender } = render(
        <BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />
      );

      const weightInput = screen.getByLabelText(/waga/i) as HTMLInputElement;
      expect(weightInput.value).toBe("70");

      // Update initial data
      const newData: BasicInfoFormData = {
        weight: 80,
        age: 30,
        gender: "female",
        activityLevel: "very_active",
      };

      rerender(<BasicInfoSection initialData={newData} onSave={mockOnSave} isSaving={false} />);

      expect(weightInput.value).toBe("80");
      await waitFor(() => {
        const genderTrigger = screen.getByRole("combobox", { name: /płeć/i });
        expect(genderTrigger).toHaveTextContent("Kobieta");
      });
    });
  });

  // ========================================
  // ACCESSIBILITY
  // ========================================

  describe("Accessibility", () => {
    it("should have labels for all inputs", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      expect(screen.getByLabelText(/waga/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wiek/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/płeć/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/poziom aktywności/i)).toBeInTheDocument();
    });

    it("should have aria-invalid on weight input when error exists", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        const weightInput = screen.getByLabelText(/waga/i);
        expect(weightInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should have aria-describedby linking to error message", async () => {
      const user = userEvent.setup();
      render(<BasicInfoSection initialData={mockEmptyData} onSave={mockOnSave} isSaving={false} />);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        const weightInput = screen.getByLabelText(/waga/i);
        expect(weightInput).toHaveAttribute("aria-describedby", "weight-error");
        expect(screen.getByText(/waga jest wymagana/i)).toHaveAttribute("id", "weight-error");
      });
    });

    it("should have proper heading hierarchy", () => {
      render(<BasicInfoSection initialData={mockInitialData} onSave={mockOnSave} isSaving={false} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Dane podstawowe");
    });
  });
});
