import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteCollectionDialog from "../DeleteCollectionDialog";
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

const emptyCollection: CollectionDTO = {
  ...mockCollection,
  recipeCount: 0,
};

// ============================================================================
// TESTS
// ============================================================================

describe("DeleteCollectionDialog", () => {
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
    vi.spyOn(console, "error").mockImplementation(() => {
      // Mock implementation
    });
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
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("does not render when open=false", () => {
      render(
        <DeleteCollectionDialog
          open={false}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("displays AlertDialog title 'Usuń kolekcję?'", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Usuń kolekcję?")).toBeInTheDocument();
    });

    it("displays warning description", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Ta akcja jest nieodwracalna.")).toBeInTheDocument();
    });

    it("shows collection name in description", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Test Collection/)).toBeInTheDocument();
    });

    it("shows recipe count with proper formatting", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/5 przepisów/)).toBeInTheDocument();
    });

    it("clarifies 'Przepisy pozostaną dostępne' when recipeCount > 0", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/przepisy pozostaną dostępne/i)).toBeInTheDocument();
    });

    it("displays 'Anuluj' and 'Usuń' buttons", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^usuń$/i })).toBeInTheDocument();
    });

    it("delete button has destructive styling (red)", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      expect(deleteButton).toHaveClass("bg-destructive");
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Deletion Flow
  // ==========================================================================

  describe("deletion flow", () => {
    it("delete button calls API with DELETE /api/collections/:id", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/collections/collection-123", {
          method: "DELETE",
        });
      });
    });

    it("shows success toast after deletion", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Kolekcja została usunięta");
      });
    });

    it("calls onSuccess callback with deleted collection ID", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith("collection-123");
      });
    });

    it("closes dialog after successful deletion", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Dialog Closing
  // ==========================================================================

  describe("dialog closing", () => {
    it("'Anuluj' button closes dialog", async () => {
      const user = userEvent.setup();

      render(
        <DeleteCollectionDialog
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

    it("dialog can be closed before deletion", async () => {
      const user = userEvent.setup();

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("dialog cannot be closed during deletion", async () => {
      const user = userEvent.setup();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 204,
                }),
              100
            )
          )
      );

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Recipe Count Display
  // ==========================================================================

  describe("recipe count display", () => {
    it("shows '1 przepis' for count = 1", () => {
      const singleRecipeCollection: CollectionDTO = {
        ...mockCollection,
        recipeCount: 1,
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={singleRecipeCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/1 przepis/)).toBeInTheDocument();
    });

    it("shows '5 przepisów' for count = 5", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/5 przepisów/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P1 - Error Handling - API Errors
  // ==========================================================================

  describe("API errors", () => {
    it("handles 404 not found (already deleted)", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Collection not found" }),
      });

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

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
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
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
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

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
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się usunąć kolekcji");
      });
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();

      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

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
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("dialog remains open on error (user can retry)", async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }),
      });

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Dialog should not have been closed (except for 404)
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // P1 - Error Handling - Loading States
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
                  status: 204,
                }),
              100
            )
          )
      );

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      expect(screen.getByText(/usuwanie/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /usuwanie/i })).toBeDisabled();
    });

    it("delete button shows 'Usuwanie...' text during load", async () => {
      const user = userEvent.setup();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 204,
                }),
              100
            )
          )
      );

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      expect(screen.getByText("Usuwanie...")).toBeInTheDocument();
    });

    it("both buttons disabled during loading", async () => {
      const user = userEvent.setup();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 204,
                }),
              100
            )
          )
      );

      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      expect(cancelButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /usuwanie/i })).toBeDisabled();
    });
  });

  // ==========================================================================
  // P2 - Edge Cases
  // ==========================================================================

  describe("edge cases", () => {
    it("handles very long collection name (truncation)", () => {
      const longNameCollection: CollectionDTO = {
        ...mockCollection,
        name: "A".repeat(100),
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={longNameCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(new RegExp("A".repeat(100)))).toBeInTheDocument();
    });

    it("handles special characters in collection name", () => {
      const specialCharsCollection: CollectionDTO = {
        ...mockCollection,
        name: "Test & Special <Characters>",
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={specialCharsCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Test & Special <Characters>/)).toBeInTheDocument();
    });

    it("handles collection with 0 recipes", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={emptyCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/0 przepisów/)).toBeInTheDocument();
      expect(screen.queryByText(/przepisy pozostaną dostępne/i)).not.toBeInTheDocument();
    });

    it("handles collection with 100+ recipes", () => {
      const largeCollection: CollectionDTO = {
        ...mockCollection,
        recipeCount: 150,
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={largeCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/150 przepisów/)).toBeInTheDocument();
    });

    it("handles null collection gracefully", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={null}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Usuń kolekcję?")).toBeInTheDocument();
      expect(screen.queryByText(/kolekcja zawiera/i)).not.toBeInTheDocument();
    });

    it("does not delete when collection is null", async () => {
      const user = userEvent.setup();

      render(
        <DeleteCollectionDialog
          open={true}
          collection={null}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // P2 - Recipe Count Formatting
  // ==========================================================================

  describe("recipe count formatting", () => {
    it("shows '0 przepisów' for empty collection", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={emptyCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/0 przepisów/)).toBeInTheDocument();
    });

    it("shows '2 przepisy' for 2 recipes", () => {
      const twoRecipesCollection: CollectionDTO = {
        ...mockCollection,
        recipeCount: 2,
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={twoRecipesCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/2 przepisy/)).toBeInTheDocument();
    });

    it("shows '4 przepisy' for 4 recipes", () => {
      const fourRecipesCollection: CollectionDTO = {
        ...mockCollection,
        recipeCount: 4,
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={fourRecipesCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/4 przepisy/)).toBeInTheDocument();
    });

    it("shows '22 przepisów' for 22 recipes", () => {
      const twentyTwoRecipesCollection: CollectionDTO = {
        ...mockCollection,
        recipeCount: 22,
      };

      render(
        <DeleteCollectionDialog
          open={true}
          collection={twentyTwoRecipesCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/22 przepisów/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P2 - Accessibility
  // ==========================================================================

  describe("accessibility", () => {
    it("AlertDialog has proper ARIA attributes", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toBeInTheDocument();
    });

    it("destructive action clearly indicated by button styling", () => {
      render(
        <DeleteCollectionDialog
          open={true}
          collection={mockCollection}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      expect(deleteButton).toHaveClass("bg-destructive");
    });
  });
});
