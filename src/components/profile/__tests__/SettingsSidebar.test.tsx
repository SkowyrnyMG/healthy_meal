import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsSidebar } from "../SettingsSidebar";
import { User, Utensils, AlertTriangle, XCircle, Settings } from "lucide-react";
import type { SettingsSection } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockSections = [
  { id: "basic-info" as SettingsSection, label: "Podstawowe informacje", icon: User },
  { id: "dietary-preferences" as SettingsSection, label: "Preferencje żywieniowe", icon: Utensils },
  { id: "allergens" as SettingsSection, label: "Alergeny", icon: AlertTriangle },
  { id: "disliked-ingredients" as SettingsSection, label: "Nielubiane składniki", icon: XCircle },
  { id: "account" as SettingsSection, label: "Konto", icon: Settings },
];

// ============================================================================
// TESTS - Rendering
// ============================================================================

describe("SettingsSidebar - Rendering", () => {
  it("should render all section buttons", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    expect(screen.getByRole("button", { name: /podstawowe informacje/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preferencje żywieniowe/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /alergeny/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nielubiane składniki/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /konto/i })).toBeInTheDocument();
  });

  it("should render navigation element with proper aria-label", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const nav = screen.getByRole("navigation", { name: /ustawienia profilu/i });
    expect(nav).toBeInTheDocument();
  });

  it("should render all section buttons in correct order", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveTextContent("Podstawowe informacje");
    expect(buttons[1]).toHaveTextContent("Preferencje żywieniowe");
    expect(buttons[2]).toHaveTextContent("Alergeny");
    expect(buttons[3]).toHaveTextContent("Nielubiane składniki");
    expect(buttons[4]).toHaveTextContent("Konto");
  });

  it("should render icons for all sections", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Icons are rendered as SVGs with aria-hidden="true"
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons).toHaveLength(5);
  });

  it("should have proper width and layout classes", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("w-64", "flex-shrink-0");
  });
});

// ============================================================================
// TESTS - Active State
// ============================================================================

describe("SettingsSidebar - Active State", () => {
  it("should highlight active section with green background", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const activeButton = screen.getByRole("button", { name: /podstawowe informacje/i });
    expect(activeButton).toHaveClass("bg-green-50", "text-green-700");
  });

  it("should set aria-current='page' on active section", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const activeButton = screen.getByRole("button", { name: /podstawowe informacje/i });
    expect(activeButton).toHaveAttribute("aria-current", "page");
  });

  it("should not set aria-current on inactive sections", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const inactiveButton = screen.getByRole("button", { name: /alergeny/i });
    expect(inactiveButton).not.toHaveAttribute("aria-current");
  });

  it("should apply inactive styling to non-active sections", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const inactiveButton = screen.getByRole("button", { name: /alergeny/i });
    expect(inactiveButton).toHaveClass("text-gray-700");
    expect(inactiveButton).not.toHaveClass("bg-green-50");
  });

  it("should update active section when activeSection prop changes", () => {
    const onSectionChange = vi.fn();
    const { rerender } = render(
      <SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    let activeButton = screen.getByRole("button", { name: /podstawowe informacje/i });
    expect(activeButton).toHaveAttribute("aria-current", "page");

    rerender(<SettingsSidebar sections={mockSections} activeSection="allergens" onSectionChange={onSectionChange} />);

    activeButton = screen.getByRole("button", { name: /podstawowe informacje/i });
    expect(activeButton).not.toHaveAttribute("aria-current");

    const newActiveButton = screen.getByRole("button", { name: /alergeny/i });
    expect(newActiveButton).toHaveAttribute("aria-current", "page");
  });
});

// ============================================================================
// TESTS - User Interaction
// ============================================================================

describe("SettingsSidebar - User Interaction", () => {
  it("should call onSectionChange with correct section ID on button click", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const button = screen.getByRole("button", { name: /alergeny/i });
    await user.click(button);

    expect(onSectionChange).toHaveBeenCalledTimes(1);
    expect(onSectionChange).toHaveBeenCalledWith("allergens");
  });

  it("should call onSectionChange when clicking different sections", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    await user.click(screen.getByRole("button", { name: /preferencje żywieniowe/i }));
    expect(onSectionChange).toHaveBeenLastCalledWith("dietary-preferences");

    await user.click(screen.getByRole("button", { name: /nielubiane składniki/i }));
    expect(onSectionChange).toHaveBeenLastCalledWith("disliked-ingredients");

    await user.click(screen.getByRole("button", { name: /konto/i }));
    expect(onSectionChange).toHaveBeenLastCalledWith("account");

    expect(onSectionChange).toHaveBeenCalledTimes(3);
  });

  it("should allow clicking active section (callback still called)", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const activeButton = screen.getByRole("button", { name: /podstawowe informacje/i });
    await user.click(activeButton);

    expect(onSectionChange).toHaveBeenCalledWith("basic-info");
  });
});

// ============================================================================
// TESTS - Keyboard Navigation
// ============================================================================

describe("SettingsSidebar - Keyboard Navigation", () => {
  it("should activate button on Enter key press", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const button = screen.getByRole("button", { name: /alergeny/i });
    button.focus();
    await user.keyboard("{Enter}");

    expect(onSectionChange).toHaveBeenCalledWith("allergens");
  });

  it("should activate button on Space key press", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const button = screen.getByRole("button", { name: /alergeny/i });
    button.focus();
    await user.keyboard(" ");

    expect(onSectionChange).toHaveBeenCalledWith("allergens");
  });

  it("should support Tab navigation between buttons", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const buttons = screen.getAllByRole("button");

    // Focus first button
    buttons[0].focus();
    expect(buttons[0]).toHaveFocus();

    // Tab to next button
    await user.tab();
    expect(buttons[1]).toHaveFocus();

    // Tab to next button
    await user.tab();
    expect(buttons[2]).toHaveFocus();
  });
});

// ============================================================================
// TESTS - Accessibility
// ============================================================================

describe("SettingsSidebar - Accessibility", () => {
  it("should have semantic navigation element", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("should have descriptive aria-label on navigation", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const nav = screen.getByRole("navigation", { name: /ustawienia profilu/i });
    expect(nav).toBeInTheDocument();
  });

  it("should have aria-hidden on icons", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it("should have accessible button text (not icon-only)", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    mockSections.forEach((section) => {
      const button = screen.getByRole("button", { name: new RegExp(section.label, "i") });
      expect(button).toHaveTextContent(section.label);
    });
  });
});

// ============================================================================
// TESTS - Edge Cases
// ============================================================================

describe("SettingsSidebar - Edge Cases", () => {
  it("should handle empty sections array", () => {
    const onSectionChange = vi.fn();
    render(<SettingsSidebar sections={[]} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("should handle single section", () => {
    const onSectionChange = vi.fn();
    const singleSection = [mockSections[0]];
    render(<SettingsSidebar sections={singleSection} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent("Podstawowe informacje");
  });

  it("should handle active section not in sections array", () => {
    const onSectionChange = vi.fn();
    render(
      <SettingsSidebar
        sections={mockSections}
        activeSection={"unknown-section" as SettingsSection}
        onSectionChange={onSectionChange}
      />
    );

    // No button should have aria-current
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute("aria-current");
    });
  });
});
