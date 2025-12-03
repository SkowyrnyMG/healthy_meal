import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MobileNav from "../MobileNav";
import type { NavLink, UserInfo } from "../types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock window.location
delete (window as any).location;
window.location = { href: "" } as any;

// Mock alert
global.alert = vi.fn();

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser: UserInfo = {
  userId: "user-123",
  email: "jan.kowalski@example.com",
  displayName: "Jan Kowalski",
};

const mockUserWithoutName: UserInfo = {
  userId: "user-456",
  email: "anna.nowak@example.com",
  displayName: null,
};

const mockNavLinks: NavLink[] = [
  { href: "/dashboard", label: "Panel" },
  { href: "/recipes", label: "Przepisy" },
  { href: "/favorites", label: "Ulubione" },
  { href: "/collections", label: "Kolekcje" },
];

// ============================================================================
// TESTS
// ============================================================================

describe("MobileNav", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Reset window.location
    window.location.href = "";

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SHEET BEHAVIOR
  // ==========================================================================

  describe("Sheet Behavior", () => {
    it("should open sheet on trigger click", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");

      // Sheet should not be visible initially
      expect(screen.queryByText("Menu")).not.toBeInTheDocument();

      await userEvent.click(trigger);

      // Sheet should be visible after click
      await waitFor(() => {
        expect(screen.getByText("Menu")).toBeInTheDocument();
      });
    });

    it("should display menu icon in trigger", () => {
      const { container } = render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      // Check for Menu icon (lucide-react)
      const icon = container.querySelector("svg.lucide-menu");
      expect(icon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // USER INFO DISPLAY
  // ==========================================================================

  describe("User Info Display (Authenticated)", () => {
    it("should display user name", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
      });
    });

    it("should display user email", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("jan.kowalski@example.com")).toBeInTheDocument();
      });
    });

    it("should display user avatar with initials", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("J")).toBeInTheDocument();
      });
    });

    it("should display email username when displayName is null", async () => {
      render(<MobileNav user={mockUserWithoutName} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("anna.nowak")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // NAVIGATION LINKS (AUTHENTICATED)
  // ==========================================================================

  describe("Navigation Links", () => {
    it("should render all nav links when authenticated", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Panel")).toBeInTheDocument();
        expect(screen.getByText("Przepisy")).toBeInTheDocument();
        expect(screen.getByText("Ulubione")).toBeInTheDocument();
        expect(screen.getByText("Kolekcje")).toBeInTheDocument();
      });
    });

    it("should highlight active link", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        const dashboardLink = screen.getByText("Panel").closest("button");
        expect(dashboardLink).toHaveClass("text-green-600");
        expect(dashboardLink).toHaveClass("bg-green-50");
      });
    });

    it("should navigate on link click", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Przepisy")).toBeInTheDocument();
      });

      const recipesLink = screen.getByText("Przepisy");
      await userEvent.click(recipesLink);

      expect(window.location.href).toBe("/recipes");
    });

    it("should not render nav links when user is null", async () => {
      render(<MobileNav user={null} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Panel")).not.toBeInTheDocument();
      });
    });

    it("should handle active state for nested routes", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/recipes/123" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        const recipesLink = screen.getByText("Przepisy").closest("button");
        expect(recipesLink).toHaveClass("text-green-600");
      });
    });
  });

  // ==========================================================================
  // NEW RECIPE BUTTON
  // ==========================================================================

  describe("New Recipe Button", () => {
    it("should show new recipe button when authenticated", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Nowy przepis")).toBeInTheDocument();
      });
    });

    it("should navigate to new recipe page when clicked", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Nowy przepis")).toBeInTheDocument();
      });

      const newRecipeButton = screen.getByText("Nowy przepis");
      await userEvent.click(newRecipeButton);

      expect(window.location.href).toBe("/recipes/new");
    });

    it("should not show new recipe button when showNewRecipeButton is false", async () => {
      render(
        <MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" showNewRecipeButton={false} />
      );

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Nowy przepis")).not.toBeInTheDocument();
      });
    });

    it("should not show new recipe button when user is null", async () => {
      render(<MobileNav user={null} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Nowy przepis")).not.toBeInTheDocument();
      });
    });

    // Note: Icon presence tests implementation details of lucide-react library
    // Button functionality is tested through click behavior
  });

  // ==========================================================================
  // PROFILE & LOGOUT (AUTHENTICATED)
  // ==========================================================================

  describe("Profile & Logout", () => {
    it("should show profile button when authenticated", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Profil / Ustawienia")).toBeInTheDocument();
      });
    });

    it("should navigate to profile page when profile button clicked", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Profil / Ustawienia")).toBeInTheDocument();
      });

      const profileButton = screen.getByText("Profil / Ustawienia");
      await userEvent.click(profileButton);

      expect(window.location.href).toBe("/profile");
    });

    it("should show logout button when authenticated", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });
    });

    it("should call logout API when logout clicked", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutButton = screen.getByText("Wyloguj");
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/auth/logout",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
      });
    });

    it("should redirect to home after successful logout", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutButton = screen.getByText("Wyloguj");
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/");
      });
    });

    it("should show alert when logout fails", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Logout failed" }),
      });

      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutButton = screen.getByText("Wyloguj");
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Nie udało się wylogować. Spróbuj ponownie.");
      });
    });

    it("should handle network error during logout", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutButton = screen.getByText("Wyloguj");
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Wystąpił błąd podczas wylogowywania.");
      });
    });
  });

  // ==========================================================================
  // AUTH BUTTONS (NOT AUTHENTICATED)
  // ==========================================================================

  describe("Auth Buttons (Not Authenticated)", () => {
    it("should show login and register buttons when not authenticated", async () => {
      render(<MobileNav user={null} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Zaloguj się")).toBeInTheDocument();
        expect(screen.getByText("Zarejestruj się")).toBeInTheDocument();
      });
    });

    it("should not show profile/logout when not authenticated", async () => {
      render(<MobileNav user={null} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Profil / Ustawienia")).not.toBeInTheDocument();
        expect(screen.queryByText("Wyloguj")).not.toBeInTheDocument();
      });
    });

    it("should show alert when login button clicked (not implemented)", async () => {
      render(<MobileNav user={null} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Zaloguj się")).toBeInTheDocument();
      });

      const loginButton = screen.getByText("Zaloguj się");
      await userEvent.click(loginButton);

      expect(global.alert).toHaveBeenCalledWith("Ta funkcja będzie wkrótce dostępna");
    });

    it("should show alert when register button clicked (not implemented)", async () => {
      render(<MobileNav user={null} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Zarejestruj się")).toBeInTheDocument();
      });

      const registerButton = screen.getByText("Zarejestruj się");
      await userEvent.click(registerButton);

      expect(global.alert).toHaveBeenCalledWith("Ta funkcja będzie wkrótce dostępna");
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper aria-label for trigger button", () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      expect(screen.getByLabelText("Otwórz menu mobilne")).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");

      // Tab to trigger
      trigger.focus();
      expect(trigger).toHaveFocus();

      // Open with Enter
      await userEvent.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Menu")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle empty navLinks array", async () => {
      render(<MobileNav user={mockUser} navLinks={[]} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");

      expect(() => userEvent.click(trigger)).not.toThrow();
    });

    it("should handle long navigation paths", async () => {
      const longNavLinks: NavLink[] = [
        { href: "/very/long/path/to/dashboard", label: "Dashboard" },
        { href: "/another/very/long/path", label: "Another Page" },
      ];

      render(<MobileNav user={mockUser} navLinks={longNavLinks} currentPath="/very/long/path/to/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        const dashboardLink = screen.getByText("Dashboard").closest("button");
        expect(dashboardLink).toHaveClass("text-green-600");
      });
    });

    it("should handle special characters in user data", async () => {
      const specialUser: UserInfo = {
        userId: "user-999",
        email: "łukasz.żółty@example.com",
        displayName: "Łukasz Żółty-Kowalski",
      };

      render(<MobileNav user={specialUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Łukasz Żółty-Kowalski")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // VISUAL STYLING
  // ==========================================================================

  describe("Visual Styling", () => {
    it("should display avatar with initials", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("J")).toBeInTheDocument();
      });
    });

    it("should have red text for logout button", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        const logoutButton = screen.getByText("Wyloguj").closest("button");
        expect(logoutButton).toHaveClass("text-red-600");
      });
    });

    it("should have green background for new recipe button", async () => {
      render(<MobileNav user={mockUser} navLinks={mockNavLinks} currentPath="/dashboard" />);

      const trigger = screen.getByLabelText("Otwórz menu mobilne");
      await userEvent.click(trigger);

      await waitFor(() => {
        const newRecipeButton = screen.getByText("Nowy przepis").closest("button");
        expect(newRecipeButton).toHaveClass("bg-green-600");
      });
    });
  });
});
