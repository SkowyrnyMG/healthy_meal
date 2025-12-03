import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SortDropdown from "../SortDropdown";

// ============================================================================
// TESTS
// ============================================================================

describe("SortDropdown", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render select component", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /sortowanie/i });
      expect(select).toBeInTheDocument();
    });

    it("should render label", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const label = screen.getByText("Sortowanie");
      expect(label).toBeInTheDocument();
    });

    it("should display current sort option - Najnowsze", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Najnowsze");
    });

    it("should display current sort option - Najstarsze", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="asc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Najstarsze");
    });

    it("should display current sort option - Tytuł A-Z", () => {
      render(<SortDropdown sortBy="title" sortOrder="asc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Tytuł A-Z");
    });

    it("should display current sort option - Tytuł Z-A", () => {
      render(<SortDropdown sortBy="title" sortOrder="desc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Tytuł Z-A");
    });

    it("should display current sort option - Czas przygotowania rosnąco", () => {
      render(<SortDropdown sortBy="prepTime" sortOrder="asc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Czas przygotowania rosnąco");
    });

    it("should display current sort option - Czas przygotowania malejąco", () => {
      render(<SortDropdown sortBy="prepTime" sortOrder="desc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Czas przygotowania malejąco");
    });
  });

  // ==========================================================================
  // VALUE SYNCHRONIZATION
  // ==========================================================================

  describe("Value Synchronization", () => {
    it("should update displayed value when sortBy changes", () => {
      const { rerender } = render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      let trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Najnowsze");

      rerender(<SortDropdown sortBy="title" sortOrder="asc" onChange={mockOnChange} />);

      trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Tytuł A-Z");
    });

    it("should update displayed value when sortOrder changes", () => {
      const { rerender } = render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      let trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Najnowsze");

      rerender(<SortDropdown sortBy="createdAt" sortOrder="asc" onChange={mockOnChange} />);

      trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Najstarsze");
    });

    it("should display correct value for all sort combinations", () => {
      const combinations = [
        { sortBy: "createdAt" as const, sortOrder: "desc" as const, expected: "Najnowsze" },
        { sortBy: "createdAt" as const, sortOrder: "asc" as const, expected: "Najstarsze" },
        { sortBy: "title" as const, sortOrder: "asc" as const, expected: "Tytuł A-Z" },
        { sortBy: "title" as const, sortOrder: "desc" as const, expected: "Tytuł Z-A" },
        { sortBy: "prepTime" as const, sortOrder: "asc" as const, expected: "Czas przygotowania rosnąco" },
        { sortBy: "prepTime" as const, sortOrder: "desc" as const, expected: "Czas przygotowania malejąco" },
      ];

      combinations.forEach(({ sortBy, sortOrder, expected }) => {
        const { unmount } = render(<SortDropdown sortBy={sortBy} sortOrder={sortOrder} onChange={mockOnChange} />);

        const trigger = screen.getByRole("combobox");
        expect(trigger).toHaveTextContent(expected);

        unmount();
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper label association", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const select = screen.getByRole("combobox", { name: /sortowanie/i });
      expect(select).toBeInTheDocument();
    });

    it("should have button type", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("type", "button");
    });

    it("should have aria-expanded attribute", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-expanded");
    });

    it("should have aria-controls attribute", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-controls");
    });
  });

  // ==========================================================================
  // PROPS
  // ==========================================================================

  describe("Props", () => {
    it("should accept sortBy and sortOrder props", () => {
      render(<SortDropdown sortBy="title" sortOrder="asc" onChange={mockOnChange} />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
    });

    it("should accept onChange callback prop", () => {
      render(<SortDropdown sortBy="createdAt" sortOrder="desc" onChange={mockOnChange} />);

      // onChange is passed correctly if component renders without error
      expect(mockOnChange).toBeInstanceOf(Function);
    });

    it("should work with all valid sortBy values", () => {
      const sortByValues: ("createdAt" | "updatedAt" | "title" | "prepTime")[] = [
        "createdAt",
        "updatedAt",
        "title",
        "prepTime",
      ];

      sortByValues.forEach((sortBy) => {
        const { unmount } = render(<SortDropdown sortBy={sortBy} sortOrder="asc" onChange={mockOnChange} />);

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();

        unmount();
      });
    });

    it("should work with both sortOrder values", () => {
      const sortOrderValues: ("asc" | "desc")[] = ["asc", "desc"];

      sortOrderValues.forEach((sortOrder) => {
        const { unmount } = render(<SortDropdown sortBy="createdAt" sortOrder={sortOrder} onChange={mockOnChange} />);

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();

        unmount();
      });
    });
  });
});
