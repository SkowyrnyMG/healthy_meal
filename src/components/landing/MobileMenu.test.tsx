import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MobileMenu from "./MobileMenu";

// Mock Shadcn/UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    "aria-label": ariaLabel,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    "aria-label"?: string;
  }) => (
    <button onClick={onClick} className={className} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/sheet", async () => {
  const React = await import("react");
  const { createContext, useContext } = React;

  const SheetContext = createContext<{
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  } | null>(null);

  return {
    Sheet: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => (
      <SheetContext.Provider value={{ open, onOpenChange }}>
        <div data-testid="sheet" data-open={open} role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => onOpenChange?.(!open)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") {
                onOpenChange?.(!open);
              }
            }}
            style={{ display: "none" }}
            aria-label="Close sheet"
          />
          {children}
        </div>
      </SheetContext.Provider>
    ),
    SheetTrigger: ({ children }: { children: React.ReactNode }) => {
      const context = useContext(SheetContext);
      // Simulate asChild behavior: clone the child and add onClick
      const child = React.Children.only(children) as React.ReactElement<{ onClick?: () => void }>;
      return React.cloneElement(child, {
        onClick: () => {
          context?.onOpenChange?.(true);
          if (child.props.onClick) {
            child.props.onClick();
          }
        },
      } as Partial<{ onClick: () => void }>);
    },
    SheetContent: ({ children, side, className }: { children: React.ReactNode; side?: string; className?: string }) => (
      <div data-testid="sheet-content" data-side={side} className={className}>
        {children}
      </div>
    ),
    SheetHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet-header">{children}</div>,
    SheetTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <h2 data-testid="sheet-title" className={className}>
        {children}
      </h2>
    ),
  };
});

vi.mock("lucide-react", () => ({
  Menu: () => <span data-testid="menu-icon">Menu Icon</span>,
}));

describe("MobileMenu - State Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start with menu closed by default", () => {
    render(<MobileMenu />);
    const sheet = screen.getByTestId("sheet");
    expect(sheet).toHaveAttribute("data-open", "false");
  });

  it("should open menu when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);

    const trigger = screen.getByLabelText("Otwórz menu");
    await user.click(trigger);

    const sheet = screen.getByTestId("sheet");
    expect(sheet).toHaveAttribute("data-open", "true");
  });

  it("should close menu when sheet is clicked (onOpenChange)", async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);

    // Open menu first
    const trigger = screen.getByLabelText("Otwórz menu");
    await user.click(trigger);

    // Verify menu is open
    let sheet = screen.getByTestId("sheet");
    expect(sheet).toHaveAttribute("data-open", "true");

    // Click close button to close
    const closeButton = screen.getByLabelText("Close sheet");
    await user.click(closeButton);

    sheet = screen.getByTestId("sheet");
    expect(sheet).toHaveAttribute("data-open", "false");
  });

  it("should close menu after navigation link is clicked", async () => {
    const user = userEvent.setup();
    const mockScrollIntoView = vi.fn();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    const querySelectorSpy = vi.spyOn(document, "querySelector");
    querySelectorSpy.mockReturnValue(mockElement as unknown as Element);

    render(<MobileMenu />);

    // Open menu
    const trigger = screen.getByLabelText("Otwórz menu");
    await user.click(trigger);

    // Click navigation link
    const navLink = screen.getByText("Funkcje");
    await user.click(navLink);

    // Menu should close
    const sheet = screen.getByTestId("sheet");
    expect(sheet).toHaveAttribute("data-open", "false");

    querySelectorSpy.mockRestore();
  });

  it("should close menu after auth button is clicked", async () => {
    const user = userEvent.setup();
    const originalLocation = window.location;

    // Mock window.location
    // @ts-expect-error - Allow mocking location for testing
    delete window.location;
    // @ts-expect-error - Allow mocking location for testing
    window.location = { ...originalLocation, href: "" } as Location;

    render(<MobileMenu isAuthenticated={false} />);

    // Open menu
    const trigger = screen.getByLabelText("Otwórz menu");
    await user.click(trigger);

    // Click login button
    const loginButton = screen.getByText("Zaloguj się");
    await user.click(loginButton);

    // Menu should close (state would be false, but navigation happens)
    const sheet = screen.getByTestId("sheet");
    expect(sheet).toHaveAttribute("data-open", "false");

    // Restore original location
    // @ts-expect-error - Allow restoring location for testing
    window.location = originalLocation;
  });
});

describe("MobileMenu - Navigation Behavior", () => {
  let mockScrollIntoView: ReturnType<typeof vi.fn>;
  let mockQuerySelector: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockScrollIntoView = vi.fn();
    mockQuerySelector = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should call querySelector with correct href when nav link is clicked", async () => {
    const user = userEvent.setup();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockQuerySelector.mockReturnValue(mockElement);

    const querySelectorSpy = vi.spyOn(document, "querySelector");
    querySelectorSpy.mockImplementation(mockQuerySelector as unknown as typeof document.querySelector);

    render(<MobileMenu />);

    const navLink = screen.getByText("Funkcje");
    await user.click(navLink);

    expect(mockQuerySelector).toHaveBeenCalledWith("#features");

    querySelectorSpy.mockRestore();
  });

  it("should trigger smooth scroll on element when nav link is clicked", async () => {
    const user = userEvent.setup();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockQuerySelector.mockReturnValue(mockElement);

    const querySelectorSpy = vi.spyOn(document, "querySelector");
    querySelectorSpy.mockImplementation(mockQuerySelector as unknown as typeof document.querySelector);

    render(<MobileMenu />);

    const navLink = screen.getByText("Jak to działa");
    await user.click(navLink);

    expect(mockQuerySelector).toHaveBeenCalledWith("#how-it-works");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    querySelectorSpy.mockRestore();
  });

  it("should handle missing DOM element gracefully (no crash)", async () => {
    const user = userEvent.setup();
    mockQuerySelector.mockReturnValue(null); // Element not found

    const querySelectorSpy = vi.spyOn(document, "querySelector");
    querySelectorSpy.mockImplementation(mockQuerySelector as unknown as typeof document.querySelector);

    render(<MobileMenu />);

    const navLink = screen.getByText("Funkcje");

    // Should not throw error
    await expect(user.click(navLink)).resolves.not.toThrow();
    expect(mockQuerySelector).toHaveBeenCalledWith("#features");
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    querySelectorSpy.mockRestore();
  });
});

describe("MobileMenu - Auth Button Behavior", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // @ts-expect-error - Allow mocking location for testing
    delete window.location;
    // @ts-expect-error - Allow mocking location for testing
    window.location = { ...originalLocation, href: "" } as Location;
  });

  afterEach(() => {
    // @ts-expect-error - Allow restoring location for testing
    window.location = originalLocation;
  });

  it("should navigate to /auth/login when login button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenu isAuthenticated={false} />);

    const loginButton = screen.getByText("Zaloguj się");
    await user.click(loginButton);

    expect(window.location.href).toBe("/auth/login");
  });

  it("should navigate to /auth/register when register button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenu isAuthenticated={false} />);

    const registerButton = screen.getByText("Zarejestruj się");
    await user.click(registerButton);

    expect(window.location.href).toBe("/auth/register");
  });

  it("should navigate to /dashboard when dashboard button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenu isAuthenticated={true} />);

    const dashboardButton = screen.getByText("Przejdź do panelu");
    await user.click(dashboardButton);

    expect(window.location.href).toBe("/dashboard");
  });
});

describe("MobileMenu - Conditional Rendering", () => {
  it("should show Login and Register buttons when NOT authenticated", () => {
    render(<MobileMenu isAuthenticated={false} />);

    expect(screen.getByText("Zaloguj się")).toBeInTheDocument();
    expect(screen.getByText("Zarejestruj się")).toBeInTheDocument();
    expect(screen.queryByText("Przejdź do panelu")).not.toBeInTheDocument();
  });

  it("should show Dashboard button when authenticated", () => {
    render(<MobileMenu isAuthenticated={true} />);

    expect(screen.getByText("Przejdź do panelu")).toBeInTheDocument();
    expect(screen.queryByText("Zaloguj się")).not.toBeInTheDocument();
    expect(screen.queryByText("Zarejestruj się")).not.toBeInTheDocument();
  });
});

describe("MobileMenu - Navigation Links", () => {
  it("should render all navigation links", () => {
    render(<MobileMenu />);

    expect(screen.getByText("Funkcje")).toBeInTheDocument();
    expect(screen.getByText("Jak to działa")).toBeInTheDocument();
  });

  it("should have correct href attributes for navigation links", async () => {
    const user = userEvent.setup();
    const mockQuerySelector = vi.fn();

    const querySelectorSpy = vi.spyOn(document, "querySelector");
    querySelectorSpy.mockImplementation(mockQuerySelector as unknown as typeof document.querySelector);

    render(<MobileMenu />);

    // Test first link
    const funkLink = screen.getByText("Funkcje");
    await user.click(funkLink);
    expect(mockQuerySelector).toHaveBeenCalledWith("#features");

    // Test second link
    const howItWorksLink = screen.getByText("Jak to działa");
    await user.click(howItWorksLink);
    expect(mockQuerySelector).toHaveBeenCalledWith("#how-it-works");

    querySelectorSpy.mockRestore();
  });
});
