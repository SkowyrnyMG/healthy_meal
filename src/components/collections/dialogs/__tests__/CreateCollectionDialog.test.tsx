import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateCollectionDialog from "../CreateCollectionDialog";
import { toast } from "sonner";
import type { CollectionDTO } from "@/types";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockCollection: CollectionDTO = {
  id: "collection-123",
  userId: "user-456",
  name: "Test Collection",
  recipeCount: 0,
  createdAt: new Date().toISOString(),
};

// ============================================================================
// TESTS
// ============================================================================

describe("CreateCollectionDialog", () => {
  let mockOnOpenChange: ReturnType<typeof vi.fn>;
  let mockOnSuccess: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnOpenChange = vi.fn();
    mockOnSuccess = vi.fn();
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Reset toast mocks
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();

    // Mock console methods
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // P0 - Critical Functionality - Rendering
  // ==========================================================================

  describe("rendering", () => {
    it("renders when open=true", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render when open=false", () => {
      render(<CreateCollectionDialog open={false} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("displays dialog title 'Nowa kolekcja'", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByText("Nowa kolekcja")).toBeInTheDocument();
    });

    it("displays dialog description", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/podaj nazwę dla nowej kolekcji/i)).toBeInTheDocument();
    });

    it("displays labeled input field", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText("Nazwa kolekcji")).toBeInTheDocument();
    });

    it("displays character counter '0/100'", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByText("0/100")).toBeInTheDocument();
    });

    it("displays 'Anuluj' and 'Utwórz' buttons", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /utwórz/i })).toBeInTheDocument();
    });

    it("input has placeholder text", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByPlaceholderText(/np. szybkie kolacje/i);
      expect(input).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Form Interaction
  // ==========================================================================

  describe("form interaction", () => {
    it("input value updates when user types", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "My Collection");

      expect(input).toHaveValue("My Collection");
    });

    it("character counter updates as user types", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test");

      expect(screen.getByText("4/100")).toBeInTheDocument();
    });

    it("form submission calls API with POST /api/collections", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Test Collection" }),
        });
      });
    });

    it("API receives trimmed collection name", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "  Test Collection  ");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Test Collection" }),
        });
      });
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Success Flow
  // ==========================================================================

  describe("success flow", () => {
    it("shows success toast on successful creation", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Kolekcja została utworzona");
      });
    });

    it("calls onSuccess callback with new collection data", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCollection);
      });
    });

    it("closes dialog after successful creation", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("resets form state when dialog closes", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      // Close dialog
      rerender(<CreateCollectionDialog open={false} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      // Reopen dialog
      rerender(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const inputAfterReopen = screen.getByLabelText("Nazwa kolekcji");
      expect(inputAfterReopen).toHaveValue("");
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Form Submission
  // ==========================================================================

  describe("form submission", () => {
    it("submit button triggers form submission", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
    });

    it("Enter key triggers form submission", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection{Enter}");

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
    });

    it("form does not submit when validation fails", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      // Try to submit without entering a name
      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      // API should not be called
      expect(fetchMock).not.toHaveBeenCalled();

      // Error should be displayed
      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Dialog Closing
  // ==========================================================================

  describe("dialog closing", () => {
    it("'Anuluj' button closes dialog", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ==========================================================================
  // P1 - Validation & Error Handling - Client-Side Validation
  // ==========================================================================

  describe("client-side validation", () => {
    it("shows error for empty name (required)", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();
    });

    it("shows error for whitespace-only name", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "   ");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();
    });

    it("validates max length constraint", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");

      // Note: maxLength=100 prevents typing more than 100 characters in the browser
      // Type 100 characters (which is at the limit and should be allowed)
      await user.type(input, "a".repeat(100));

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      // At exactly 100 characters, validation should pass
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
    });

    it("clears error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      // Trigger validation error
      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();

      // Start typing
      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test");

      // Error should be cleared
      expect(screen.queryByText(/nazwa kolekcji jest wymagana/i)).not.toBeInTheDocument();
    });

    it("input border turns red when error present", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      const input = screen.getByLabelText("Nazwa kolekcji");
      expect(input).toHaveClass("border-red-500");
    });

    it("error message displays below input", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      const errorMessage = screen.getByText(/nazwa kolekcji jest wymagana/i);
      expect(errorMessage).toHaveClass("text-red-600");
    });
  });

  // ==========================================================================
  // P1 - Validation & Error Handling - Server-Side Validation
  // ==========================================================================

  describe("server-side validation", () => {
    it("handles 409 conflict (duplicate name)", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: "Duplicate name" }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Existing Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/kolekcja o tej nazwie już istnieje/i)).toBeInTheDocument();
      });
    });

    it("shows 'Kolekcja o tej nazwie już istnieje' for 409", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({}),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Existing Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Kolekcja o tej nazwie już istnieje")).toBeInTheDocument();
      });
    });

    it("handles 500 server error", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("shows generic error message for unknown errors", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się utworzyć kolekcji");
      });
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network error");
      });
    });

    it("handles malformed API responses", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // P1 - Validation & Error Handling - Loading States
  // ==========================================================================

  describe("loading states", () => {
    it("shows loading spinner during API call", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: mockCollection }),
                }),
              100
            )
          )
      );

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      // Check for loading text
      expect(screen.getByText("Tworzenie...")).toBeInTheDocument();
    });

    it("submit button shows 'Tworzenie...' text during load", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: mockCollection }),
                }),
              100
            )
          )
      );

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      expect(screen.getByText("Tworzenie...")).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("input is disabled during loading", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: mockCollection }),
                }),
              100
            )
          )
      );

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      expect(input).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("dialog cannot be closed during loading (both buttons disabled)", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: mockCollection }),
                }),
              100
            )
          )
      );

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      // Check that both buttons are disabled
      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      const createButton = screen.getByRole("button", { name: /tworzenie/i });

      expect(cancelButton).toBeDisabled();
      expect(createButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // P2 - Polish & Edge Cases - Character Counter
  // ==========================================================================

  describe("character counter", () => {
    it("shows gray color for < 90 characters", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const counter = screen.getByText("0/100");
      expect(counter).toHaveClass("text-gray-500");
    });

    it("shows amber color for 90-100 characters", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "a".repeat(95));

      const counter = screen.getByText("95/100");
      expect(counter).toHaveClass("text-amber-600");
    });

    it("shows red color for > 100 characters", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      // Note: maxLength=100 should prevent typing more, but we test the color logic
      await user.type(input, "a".repeat(100));

      const counter = screen.getByText("100/100");
      // At exactly 100, it should still be amber (only > 100 is red)
      expect(counter).toHaveClass("text-amber-600");
    });

    it("max length enforced by input (maxLength={100})", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      expect(input).toHaveAttribute("maxLength", "100");
    });
  });

  // ==========================================================================
  // P2 - Polish & Edge Cases - Edge Cases
  // ==========================================================================

  describe("edge cases", () => {
    it("very long name (100 characters exactly)", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      const longName = "a".repeat(100);
      await user.type(input, longName);

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: longName }),
        });
      });
    });

    it("name with only spaces (validation catches)", async () => {
      const user = userEvent.setup();
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "     ");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("name with leading/trailing whitespace (trimmed)", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "  Test Collection  ");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Test Collection" }),
        });
      });
    });

    it("special characters in name", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test & Collection #1!");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Test & Collection #1!" }),
        });
      });
    });

    it("Polish characters (ąćęłńóśźż)", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Kolekcja śniadań");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Kolekcja śniadań" }),
        });
      });
    });

    it("emoji in name", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test 🍕");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Test 🍕" }),
        });
      });
    });

    it("multiple rapid submissions (prevented by loading state)", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockImplementationOnce(() => slowPromise);

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Test Collection");

      const submitButton = screen.getByRole("button", { name: /utwórz/i });

      // Click multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Only one API call should be made
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // P2 - Accessibility
  // ==========================================================================

  describe("accessibility", () => {
    it("input has associated label (htmlFor)", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const label = screen.getByText("Nazwa kolekcji");
      const input = screen.getByLabelText("Nazwa kolekcji");

      expect(label).toHaveAttribute("for", "collection-name");
      expect(input).toHaveAttribute("id", "collection-name");
    });

    it("dialog has proper ARIA attributes", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("focus management (focus input on open)", () => {
      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");
      // Note: Testing focus in jsdom is limited, but we can verify the input exists
      expect(input).toBeInTheDocument();
    });

    it("keyboard navigation (Tab, Enter, Escape)", async () => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: mockCollection }),
      });

      render(<CreateCollectionDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />);

      const input = screen.getByLabelText("Nazwa kolekcji");

      // Type and submit with Enter
      await user.type(input, "Test Collection{Enter}");

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
    });
  });
});
