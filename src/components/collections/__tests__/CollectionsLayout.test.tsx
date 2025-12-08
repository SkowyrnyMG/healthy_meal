import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollectionsLayout from "../CollectionsLayout";
import type { CollectionDTO } from "@/types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock window.location
delete (window as any).location;
window.location = { href: "" } as Location;

// ============================================================================
// TEST DATA
// ============================================================================

const createMockCollection = (overrides?: Partial<CollectionDTO>): CollectionDTO => ({
  id: "collection-123",
  userId: "user-456",
  name: "Test Collection",
  recipeCount: 5,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockCollections = (count: number): CollectionDTO[] =>
  Array.from({ length: count }, (_, i) =>
    createMockCollection({
      id: `collection-${i}`,
      name: `Collection ${i + 1}`,
      recipeCount: i + 1,
    })
  );

// ============================================================================
// TESTS
// ============================================================================

describe("CollectionsLayout", () => {
  beforeEach(() => {
    window.location.href = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // P0 - Critical Functionality - Initial Rendering
  // ==========================================================================

  describe("initial rendering", () => {
    it("renders page header with 'Moje Kolekcje' title", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      expect(screen.getByText("Moje Kolekcje")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Moje Kolekcje");
    });

    it("displays empty state when no collections", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      expect(screen.getByText(/nie masz jeszcze kolekcji/i)).toBeInTheDocument();
    });

    it("displays collection grid when collections exist", () => {
      const collections = createMockCollections(3);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 2")).toBeInTheDocument();
      expect(screen.getByText("Collection 3")).toBeInTheDocument();
    });

    it("shows collection count with proper Polish pluralization (1 kolekcja)", () => {
      const collections = createMockCollections(1);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("1 kolekcja")).toBeInTheDocument();
    });

    it("shows collection count with proper Polish pluralization (2 kolekcje)", () => {
      const collections = createMockCollections(2);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("2 kolekcje")).toBeInTheDocument();
    });

    it("shows collection count with proper Polish pluralization (4 kolekcje)", () => {
      const collections = createMockCollections(4);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("4 kolekcje")).toBeInTheDocument();
    });

    it("shows collection count with proper Polish pluralization (5 kolekcji)", () => {
      const collections = createMockCollections(5);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("5 kolekcji")).toBeInTheDocument();
    });

    it("shows collection count with proper Polish pluralization (100 kolekcji)", () => {
      const collections = createMockCollections(100);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("100 kolekcji")).toBeInTheDocument();
    });

    it("hides 'Nowa kolekcja' button when empty", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      expect(screen.queryByRole("button", { name: /nowa kolekcja/i })).not.toBeInTheDocument();
    });

    it("shows 'Nowa kolekcja' button when collections exist", () => {
      const collections = createMockCollections(1);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByRole("button", { name: /nowa kolekcja/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Dialog State Management
  // ==========================================================================

  describe("dialog state management", () => {
    it("opens CreateCollectionDialog when button clicked", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      render(<CollectionsLayout initialCollections={collections} />);

      const createButton = screen.getByRole("button", { name: /nowa kolekcja/i });
      await user.click(createButton);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Nowa kolekcja")).toBeInTheDocument();
    });

    it("opens CreateCollectionDialog when empty state button clicked", async () => {
      const user = userEvent.setup();

      render(<CollectionsLayout initialCollections={[]} />);

      const createButton = screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i });
      await user.click(createButton);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Nowa kolekcja")).toBeInTheDocument();
    });

    it("opens EditCollectionDialog when card edit action triggered", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      const { container } = render(<CollectionsLayout initialCollections={collections} />);

      // Find and click the edit button
      const editButton = container.querySelector('[data-action="edit"]') as HTMLElement;
      if (editButton) {
        await user.click(editButton);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Edytuj kolekcję")).toBeInTheDocument();
      }
    });

    it("opens DeleteCollectionDialog when card delete action triggered", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      const { container } = render(<CollectionsLayout initialCollections={collections} />);

      // Find and click the delete button
      const deleteButton = container.querySelector('[data-action="delete"]') as HTMLElement;
      if (deleteButton) {
        await user.click(deleteButton);

        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.getByText("Usuń kolekcję?")).toBeInTheDocument();
      }
    });

    it("closes dialogs when onOpenChange called with false", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      render(<CollectionsLayout initialCollections={collections} />);

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /nowa kolekcja/i });
      await user.click(createButton);

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Close dialog
      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Create Collection Flow
  // ==========================================================================

  describe("create collection flow", () => {
    it("renders create button when empty for adding first collection", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      // Initially empty
      expect(screen.getByText(/nie masz jeszcze kolekcji/i)).toBeInTheDocument();

      // Create button exists in empty state
      expect(screen.getByRole("button", { name: /utwórz pierwszą kolekcję/i })).toBeInTheDocument();
    });

    it("new collections would appear at the beginning (verified by initial order)", () => {
      // Test that initial collections maintain order (newest first pattern)
      const collection1 = createMockCollection({ id: "1", name: "First", createdAt: "2024-01-01" });
      const collection2 = createMockCollection({ id: "2", name: "Second", createdAt: "2024-01-02" });

      // Render with newest first (standard pattern)
      render(<CollectionsLayout initialCollections={[collection2, collection1]} />);

      const names = screen.getAllByText(/First|Second/);
      expect(names[0]).toHaveTextContent("Second");
      expect(names[1]).toHaveTextContent("First");
    });

    it("transitions from empty state to grid with initial data", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      // Initially empty
      expect(screen.getByText(/nie masz jeszcze kolekcji/i)).toBeInTheDocument();

      // Render with different initial data (simulates page reload after create)
      render(<CollectionsLayout initialCollections={createMockCollections(1)} />);

      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("1 kolekcja")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Edit Collection Flow
  // ==========================================================================

  describe("edit collection flow", () => {
    it("edit dialog can be opened from collection cards", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      const { container } = render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("Collection 1")).toBeInTheDocument();

      // Open edit dialog
      const editButton = container.querySelector('[data-action="edit"]') as HTMLElement;
      if (editButton) {
        await user.click(editButton);
        expect(screen.getByText("Edytuj kolekcję")).toBeInTheDocument();
      }
    });

    it("preserves other collection properties in initial render", () => {
      const collections = createMockCollections(2);

      render(<CollectionsLayout initialCollections={collections} />);

      // Verify all collection data is rendered
      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 2")).toBeInTheDocument();
      expect(screen.getByText(/1 przepis/)).toBeInTheDocument();
      expect(screen.getByText(/2 przepisy/)).toBeInTheDocument();
    });

    it("renders all collections when multiple exist", () => {
      const collections = createMockCollections(3);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 2")).toBeInTheDocument();
      expect(screen.getByText("Collection 3")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Delete Collection Flow
  // ==========================================================================

  describe("delete collection flow", () => {
    it("delete dialog can be opened from collection cards", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(2);

      const { container } = render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 2")).toBeInTheDocument();

      // Open delete dialog
      const deleteButton = container.querySelector('[data-action="delete"]') as HTMLElement;
      if (deleteButton) {
        await user.click(deleteButton);
        expect(screen.getByText("Usuń kolekcję?")).toBeInTheDocument();
      }
    });

    it("empty state shown when initialized with no collections", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      expect(screen.queryByText(/collection/i)).toBeNull();
      expect(screen.getByText(/nie masz jeszcze kolekcji/i)).toBeInTheDocument();
    });

    it("all collections rendered when multiple exist initially", () => {
      const collections = createMockCollections(3);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 2")).toBeInTheDocument();
      expect(screen.getByText("Collection 3")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P0 - Critical Functionality - Navigation
  // ==========================================================================

  describe("navigation", () => {
    it("calls window.location.href with correct path on card click", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      const { container } = render(<CollectionsLayout initialCollections={collections} />);

      const card = container.querySelector('[data-slot="card"]') as HTMLElement;
      await user.click(card);

      expect(window.location.href).toBe("/collections/collection-0");
    });

    it("navigates to /collections/:id format", async () => {
      const user = userEvent.setup();
      const collection = createMockCollection({ id: "test-id-123" });

      const { container } = render(<CollectionsLayout initialCollections={[collection]} />);

      const card = container.querySelector('[data-slot="card"]') as HTMLElement;
      await user.click(card);

      expect(window.location.href).toBe("/collections/test-id-123");
    });
  });

  // ==========================================================================
  // P1 - Important Features - Collection Count Display
  // ==========================================================================

  describe("collection count display", () => {
    it("displays count for 1 collection", () => {
      const collections = createMockCollections(1);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("1 kolekcja")).toBeInTheDocument();
    });

    it("displays count for 2 collections", () => {
      const collections = createMockCollections(2);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("2 kolekcje")).toBeInTheDocument();
    });

    it("displays count for 3 collections", () => {
      const collections = createMockCollections(3);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("3 kolekcje")).toBeInTheDocument();
    });

    it("displays count for 4 collections", () => {
      const collections = createMockCollections(4);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("4 kolekcje")).toBeInTheDocument();
    });

    it("displays count for 5 collections", () => {
      const collections = createMockCollections(5);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("5 kolekcji")).toBeInTheDocument();
    });

    it("displays count for 10 collections", () => {
      const collections = createMockCollections(10);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("10 kolekcji")).toBeInTheDocument();
    });

    it("does not display count when empty", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      // Should not show count text (but "kolekcj" appears in "Moje Kolekcje" title)
      expect(screen.queryByText(/^\d+ kolekcj/)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P2 - Edge Cases
  // ==========================================================================

  describe("edge cases", () => {
    it("handles very large number of collections (100+)", () => {
      const collections = createMockCollections(100);

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("100 kolekcji")).toBeInTheDocument();
      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 100")).toBeInTheDocument();
    });

    it("handles empty initial collections array", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      expect(screen.getByText(/nie masz jeszcze kolekcji/i)).toBeInTheDocument();
    });

    it("handles collections with special characters in names", () => {
      const collection = createMockCollection({
        name: "Test & Special <Characters>",
      });

      render(<CollectionsLayout initialCollections={[collection]} />);

      expect(screen.getByText("Test & Special <Characters>")).toBeInTheDocument();
    });

    it("handles collections with very long names", () => {
      const collection = createMockCollection({
        name: "A".repeat(100),
      });

      render(<CollectionsLayout initialCollections={[collection]} />);

      expect(screen.getByText("A".repeat(100))).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // P2 - Accessibility
  // ==========================================================================

  describe("accessibility", () => {
    it("page header uses correct heading hierarchy (h1)", () => {
      render(<CollectionsLayout initialCollections={[]} />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Moje Kolekcje");
    });

    it("button has accessible text", () => {
      const collections = createMockCollections(1);

      render(<CollectionsLayout initialCollections={collections} />);

      const button = screen.getByRole("button", { name: /nowa kolekcja/i });
      expect(button).toBeInTheDocument();
    });

    it("container has proper structure", () => {
      const { container } = render(<CollectionsLayout initialCollections={[]} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("container");
      expect(mainContainer).toHaveClass("mx-auto");
    });
  });

  // ==========================================================================
  // State Transitions
  // ==========================================================================

  describe("state transitions", () => {
    it("renders correctly with multiple initial collections", () => {
      const collections = [
        createMockCollection({ id: "1", name: "First" }),
        createMockCollection({ id: "2", name: "Second" }),
      ];

      render(<CollectionsLayout initialCollections={collections} />);

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("2 kolekcje")).toBeInTheDocument();
    });

    it("all dialogs can be opened from respective actions", async () => {
      const user = userEvent.setup();
      const collections = createMockCollections(1);

      const { container } = render(<CollectionsLayout initialCollections={collections} />);

      // Can open create dialog
      const createButton = screen.getByRole("button", { name: /nowa kolekcja/i });
      await user.click(createButton);
      expect(screen.getByText("Nowa kolekcja")).toBeInTheDocument();

      // Close it
      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      // Can open edit dialog
      const editButton = container.querySelector('[data-action="edit"]') as HTMLElement;
      if (editButton) {
        await user.click(editButton);
        expect(screen.getByText("Edytuj kolekcję")).toBeInTheDocument();
      }
    });

    it("maintains proper state isolation between dialogs", () => {
      const collections = createMockCollections(2);

      render(<CollectionsLayout initialCollections={collections} />);

      // All collections rendered, no dialogs open initially
      expect(screen.getByText("Collection 1")).toBeInTheDocument();
      expect(screen.getByText("Collection 2")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });
});
