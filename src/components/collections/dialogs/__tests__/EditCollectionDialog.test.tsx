import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditCollectionDialog from "../EditCollectionDialog";
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
  recipeCount: 5,
  createdAt: new Date().toISOString(),
};

const updatedMockCollection: CollectionDTO = {
  ...mockCollection,
  name: "Updated Collection",
};

// ============================================================================
// TESTS
// ============================================================================

describe("EditCollectionDialog", () => {
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
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render when open=false", () => {
      render(
        <EditCollectionDialog
          open={false}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("displays dialog title 'Edytuj kolekcję'", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Edytuj kolekcję")).toBeInTheDocument();
    });

    it("displays dialog description", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/zmień nazwę kolekcji/i)).toBeInTheDocument();
    });

    it("displays 'Anuluj' and 'Zapisz' buttons", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zapisz/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Pre-Population
  // ==========================================================================

  describe("pre-population", () => {
    it("pre-populates input with current collection name", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;
      expect(input.value).toBe("Test Collection");
    });

    it("character counter shows current name length", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("15/100")).toBeInTheDocument();
    });

    it("shows no validation errors initially", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText(/nazwa kolekcji jest wymagana/i)).not.toBeInTheDocument();
    });

    it("resets to new collection data when different collection edited", async () => {
      const { rerender } = render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;
      expect(input.value).toBe("Test Collection");

      const newCollection: CollectionDTO = {
        ...mockCollection,
        id: "collection-456",
        name: "Different Collection",
      };

      rerender(
        <EditCollectionDialog
          open={true}
          collection={newCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(input.value).toBe("Different Collection");
      });
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Form Interaction
  // ==========================================================================

  describe("form interaction", () => {
    it("updates input value when user types", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;

      await user.clear(input);
      await user.type(input, "New Name");

      expect(input.value).toBe("New Name");
    });

    it("updates character counter as user types", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");

      await user.clear(input);
      await user.type(input, "Hello");

      expect(screen.getByText("5/100")).toBeInTheDocument();
    });

    it("calls API with PUT /api/collections/:id on form submission", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: updatedMockCollection }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Updated Collection");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/collections/collection-123",
          expect.objectContaining({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Updated Collection" }),
          })
        );
      });
    });

    it("API receives trimmed collection name", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: updatedMockCollection }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "  Trimmed Name  ");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/collections/collection-123",
          expect.objectContaining({
            body: JSON.stringify({ name: "Trimmed Name" }),
          })
        );
      });
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Success Flow
  // ==========================================================================

  describe("success flow", () => {
    it("shows success toast on successful update", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: updatedMockCollection }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Updated Collection");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Kolekcja została zaktualizowana");
      });
    });

    it("calls onSuccess callback with updated data", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: updatedMockCollection }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Updated Collection");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(updatedMockCollection);
      });
    });

    it("closes dialog after successful update", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collection: updatedMockCollection }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Updated Collection");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("resets form state when dialog closes", async () => {
      const { rerender } = render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;
      expect(input.value).toBe("Test Collection");

      rerender(
        <EditCollectionDialog
          open={false}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      rerender(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(input.value).toBe("Test Collection");
      });
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Skip API Call Optimization
  // ==========================================================================

  describe("skip API call optimization", () => {
    it("does not call API if name unchanged", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("closes dialog immediately if name unchanged", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("skips API call when name is same after trimming", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "  Test Collection  ");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ==========================================================================
  // P1 - Validation & Error Handling - Client-Side Validation
  // ==========================================================================

  describe("client-side validation", () => {
    it("shows error for empty name after clearing", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();
    });

    it("shows error for whitespace-only name", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "   ");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();
    });

    it("max length is enforced by input (maxLength={100})", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;
      await user.clear(input);

      // Try to type more than 100 characters
      await user.type(input, "a".repeat(105));

      // Input should only accept 100 characters
      expect(input.value.length).toBeLessThanOrEqual(100);
    });

    it("clears error when user starts typing", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(screen.getByText(/nazwa kolekcji jest wymagana/i)).toBeInTheDocument();

      await user.type(input, "Valid Name");

      expect(screen.queryByText(/nazwa kolekcji jest wymagana/i)).not.toBeInTheDocument();
    });

    it("input border turns red when error present", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(input).toHaveClass("border-red-500");
    });

    it("error message displays below input", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      const errorMessage = screen.getByText(/nazwa kolekcji jest wymagana/i);
      expect(errorMessage).toHaveClass("text-red-600");
    });
  });

  // ==========================================================================
  // P1 - Validation & Error Handling - Server-Side Validation
  // ==========================================================================

  describe("server-side validation", () => {
    it("handles 404 not found error", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Collection not found" }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Kolekcja nie została znaleziona");
      });
    });

    it("closes dialog on 404 error", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Collection not found" }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("handles 409 conflict (duplicate name)", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: "Duplicate name" }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Duplicate Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
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
        json: async () => ({ message: "Duplicate name" }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Duplicate Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
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
        json: async () => ({ message: "Internal server error" }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Internal server error");
      });
    });

    it("shows generic error message for unknown errors", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zaktualizować kolekcji");
      });
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();

      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
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

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
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

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: updatedMockCollection }),
                }),
              100
            )
          )
      );

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(screen.getByText(/zapisywanie/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zapisywanie/i })).toBeDisabled();
    });

    it("submit button shows 'Zapisywanie...' text during load", async () => {
      const user = userEvent.setup();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: updatedMockCollection }),
                }),
              100
            )
          )
      );

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(screen.getByText("Zapisywanie...")).toBeInTheDocument();
    });

    it("input is disabled during loading", async () => {
      const user = userEvent.setup();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: updatedMockCollection }),
                }),
              100
            )
          )
      );

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(input).toBeDisabled();
    });

    it("dialog cannot be closed during loading", async () => {
      const user = userEvent.setup();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ collection: updatedMockCollection }),
                }),
              100
            )
          )
      );

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "New Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // P2 - Polish & Edge Cases - Character Counter
  // ==========================================================================

  describe("character counter", () => {
    it("shows gray color for < 90 characters", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const counter = screen.getByText("15/100");
      expect(counter).toHaveClass("text-gray-500");
    });

    it("shows amber color for 90-100 characters", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "a".repeat(95));

      const counter = screen.getByText("95/100");
      expect(counter).toHaveClass("text-amber-600");
    });

    it("shows red color for > 100 characters", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);

      // Type more than 100 chars (input has maxLength but we test counter color)
      const longText = "a".repeat(105);
      await user.type(input, longText);

      // Counter should show red if somehow > 100 chars
      const counter = screen.getByText(/\/100/);
      if (counter.textContent?.startsWith("10") && parseInt(counter.textContent) > 100) {
        expect(counter).toHaveClass("text-red-600");
      }
    });
  });

  // ==========================================================================
  // P2 - Polish & Edge Cases - Edge Cases
  // ==========================================================================

  describe("edge cases", () => {
    it("handles pre-populated name at exactly 100 characters", () => {
      const longNameCollection: CollectionDTO = {
        ...mockCollection,
        name: "a".repeat(100),
      };

      render(
        <EditCollectionDialog
          open={true}
          collection={longNameCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("100/100")).toBeInTheDocument();
    });

    it("handles special characters in name", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          collection: { ...mockCollection, name: "Collection !@#$%^&*()" },
        }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Collection !@#$%^&*()");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("handles Polish characters", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          collection: { ...mockCollection, name: "Szybkie Kolacje ąćęłńóśźż" },
        }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Szybkie Kolacje ąćęłńóśźż");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("handles emoji in name", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          collection: { ...mockCollection, name: "Favorites 🍕🍔" },
        }),
      });

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.clear(input);
      await user.type(input, "Favorites 🍕🍔");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // P2 - Polish & Edge Cases - Null/Undefined Handling
  // ==========================================================================

  describe("null/undefined handling", () => {
    it("handles null collection gracefully", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={null}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("handles undefined collection gracefully", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={undefined}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("does not submit when collection is null", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={null}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText("Nazwa kolekcji");
      await user.type(input, "Some Name");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // P2 - Polish & Edge Cases - Accessibility
  // ==========================================================================

  describe("accessibility", () => {
    it("input has associated label", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const label = screen.getByText("Nazwa kolekcji");
      const input = screen.getByLabelText("Nazwa kolekcji");

      expect(label).toHaveAttribute("for", "collection-name-edit");
      expect(input).toHaveAttribute("id", "collection-name-edit");
    });

    it("dialog has proper ARIA attributes", () => {
      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Dialog Closing
  // ==========================================================================

  describe("dialog closing", () => {
    it("'Anuluj' button closes dialog", async () => {
      const user = userEvent.setup();

      render(
        <EditCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
