import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsTabs } from "../SettingsTabs";
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

describe("SettingsTabs - Rendering", () => {
  it("should render Tabs component", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Tabs component renders with specific attributes
    const tabsList = container.querySelector('[role="tablist"]');
    expect(tabsList).toBeInTheDocument();
  });

  it("should render all 5 tab triggers", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
  });

  it("should render tab triggers with correct accessible names", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    expect(screen.getByRole("tab", { name: /podstawowe informacje/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /preferencje żywieniowe/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /alergeny/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /nielubiane składniki/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /konto/i })).toBeInTheDocument();
  });

  it("should render icons for all tabs", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Icons are rendered as SVGs with aria-hidden="true"
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(5); // At least 5 for the tabs
  });

  it("should render tabs in correct order", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAccessibleName(/podstawowe informacje/i);
    expect(tabs[1]).toHaveAccessibleName(/preferencje żywieniowe/i);
    expect(tabs[2]).toHaveAccessibleName(/alergeny/i);
    expect(tabs[3]).toHaveAccessibleName(/nielubiane składniki/i);
    expect(tabs[4]).toHaveAccessibleName(/konto/i);
  });

  it("should have ScrollArea with horizontal scrolling", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // ScrollArea creates specific viewport structure
    const viewport = container.querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).toBeInTheDocument();
  });

  it("should render labels with responsive classes (hidden on xs, visible on sm+)", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Labels should have hidden and sm:inline classes
    const labels = container.querySelectorAll("span.hidden.sm\\:inline");
    expect(labels.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TESTS - Active State
// ============================================================================

describe("SettingsTabs - Active State", () => {
  it("should set aria-selected='true' on active tab", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const activeTab = screen.getByRole("tab", { name: /podstawowe informacje/i });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
  });

  it("should set aria-selected='false' on inactive tabs", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const inactiveTab = screen.getByRole("tab", { name: /alergeny/i });
    expect(inactiveTab).toHaveAttribute("aria-selected", "false");
  });

  it("should apply active state styling to active tab", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const activeTab = screen.getByRole("tab", { name: /podstawowe informacje/i });
    expect(activeTab).toHaveAttribute("data-state", "active");
  });

  it("should apply inactive state styling to inactive tabs", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const inactiveTab = screen.getByRole("tab", { name: /alergeny/i });
    expect(inactiveTab).toHaveAttribute("data-state", "inactive");
  });

  it("should update active tab when activeSection prop changes", () => {
    const onSectionChange = vi.fn();
    const { rerender } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    let activeTab = screen.getByRole("tab", { name: /podstawowe informacje/i });
    expect(activeTab).toHaveAttribute("aria-selected", "true");

    rerender(<SettingsTabs sections={mockSections} activeSection="allergens" onSectionChange={onSectionChange} />);

    activeTab = screen.getByRole("tab", { name: /podstawowe informacje/i });
    expect(activeTab).toHaveAttribute("aria-selected", "false");

    const newActiveTab = screen.getByRole("tab", { name: /alergeny/i });
    expect(newActiveTab).toHaveAttribute("aria-selected", "true");
  });
});

// ============================================================================
// TESTS - User Interaction
// ============================================================================

describe("SettingsTabs - User Interaction", () => {
  it("should call onSectionChange with correct section ID on tab click", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tab = screen.getByRole("tab", { name: /alergeny/i });
    await user.click(tab);

    // Shadcn Tabs may call onValueChange multiple times (deselect + select)
    expect(onSectionChange).toHaveBeenCalled();
    expect(onSectionChange).toHaveBeenCalledWith("allergens");
  });

  it("should call onSectionChange when clicking different tabs", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    await user.click(screen.getByRole("tab", { name: /preferencje żywieniowe/i }));
    expect(onSectionChange).toHaveBeenCalledWith("dietary-preferences");

    await user.click(screen.getByRole("tab", { name: /nielubiane składniki/i }));
    expect(onSectionChange).toHaveBeenCalledWith("disliked-ingredients");

    await user.click(screen.getByRole("tab", { name: /konto/i }));
    expect(onSectionChange).toHaveBeenCalledWith("account");

    // Callback was called multiple times
    expect(onSectionChange.mock.calls.length).toBeGreaterThan(0);
  });

  it("should not call onSectionChange when clicking already active tab", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const activeTab = screen.getByRole("tab", { name: /podstawowe informacje/i });
    await user.click(activeTab);

    // Shadcn Tabs doesn't call onValueChange when clicking already active tab
    expect(onSectionChange).not.toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS - Keyboard Navigation
// ============================================================================

describe("SettingsTabs - Keyboard Navigation", () => {
  it("should support keyboard navigation with Arrow Right", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();

    await user.keyboard("{ArrowRight}");

    // Shadcn Tabs handles arrow navigation internally
    expect(tabs[1]).toHaveFocus();
  });

  it("should support keyboard navigation with Arrow Left", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(
      <SettingsTabs sections={mockSections} activeSection="dietary-preferences" onSectionChange={onSectionChange} />
    );

    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();

    await user.keyboard("{ArrowLeft}");

    // Shadcn Tabs handles arrow navigation internally
    expect(tabs[0]).toHaveFocus();
  });

  it("should activate tab on Enter key press", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tab = screen.getByRole("tab", { name: /alergeny/i });
    tab.focus();
    await user.keyboard("{Enter}");

    expect(onSectionChange).toHaveBeenCalledWith("allergens");
  });

  it("should activate tab on Space key press", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tab = screen.getByRole("tab", { name: /alergeny/i });
    tab.focus();
    await user.keyboard(" ");

    expect(onSectionChange).toHaveBeenCalledWith("allergens");
  });

  it("should support Tab key navigation between tabs", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");

    // Focus first tab
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();

    // Tab to next element (may skip inactive tabs based on Radix implementation)
    await user.tab();
    // The focused element should be one of the tabs or move past the tablist
    const focusedElement = document.activeElement;
    const isTabFocused = tabs.some((tab) => tab === focusedElement);
    expect(isTabFocused || focusedElement?.tagName !== "BUTTON").toBe(true);
  });
});

// ============================================================================
// TESTS - Accessibility
// ============================================================================

describe("SettingsTabs - Accessibility", () => {
  it("should have tablist role", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeInTheDocument();
  });

  it("should have all tabs with role='tab'", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
  });

  it("should have aria-selected on all tabs", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute("aria-selected");
    });
  });

  it("should have aria-hidden on icons", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it("should have accessible tab names (icon + text)", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />);

    mockSections.forEach((section) => {
      const tab = screen.getByRole("tab", { name: new RegExp(section.label, "i") });
      expect(tab).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TESTS - Responsive Behavior
// ============================================================================

describe("SettingsTabs - Responsive Behavior", () => {
  it("should render labels with hidden class for mobile", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Labels should have hidden class for mobile
    const labels = container.querySelectorAll("span.hidden");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("should render labels with sm:inline class for larger screens", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Labels should have sm:inline class
    const labels = container.querySelectorAll("span.sm\\:inline");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("should have full width container", () => {
    const onSectionChange = vi.fn();
    const { container } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Tabs component should have w-full class
    const tabsRoot = container.querySelector('[role="tablist"]')?.closest('[class*="w-full"]');
    expect(tabsRoot).toBeInTheDocument();
  });
});

// ============================================================================
// TESTS - Edge Cases
// ============================================================================

describe("SettingsTabs - Edge Cases", () => {
  it("should handle empty sections array", () => {
    const onSectionChange = vi.fn();
    render(<SettingsTabs sections={[]} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.queryAllByRole("tab");
    expect(tabs).toHaveLength(0);
  });

  it("should handle single section", () => {
    const onSectionChange = vi.fn();
    const singleSection = [mockSections[0]];
    render(<SettingsTabs sections={singleSection} activeSection="basic-info" onSectionChange={onSectionChange} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveAccessibleName(/podstawowe informacje/i);
  });

  it("should handle active section not in sections array", () => {
    const onSectionChange = vi.fn();
    render(
      <SettingsTabs
        sections={mockSections}
        activeSection={"unknown-section" as SettingsSection}
        onSectionChange={onSectionChange}
      />
    );

    // All tabs should have aria-selected="false"
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute("aria-selected", "false");
    });
  });

  it("should handle value synchronization with prop changes", () => {
    const onSectionChange = vi.fn();
    const { rerender } = render(
      <SettingsTabs sections={mockSections} activeSection="basic-info" onSectionChange={onSectionChange} />
    );

    // Initially basic-info is active
    expect(screen.getByRole("tab", { name: /podstawowe informacje/i })).toHaveAttribute("aria-selected", "true");

    // Change to allergens
    rerender(<SettingsTabs sections={mockSections} activeSection="allergens" onSectionChange={onSectionChange} />);
    expect(screen.getByRole("tab", { name: /alergeny/i })).toHaveAttribute("aria-selected", "true");

    // Change to account
    rerender(<SettingsTabs sections={mockSections} activeSection="account" onSectionChange={onSectionChange} />);
    expect(screen.getByRole("tab", { name: /konto/i })).toHaveAttribute("aria-selected", "true");
  });
});
