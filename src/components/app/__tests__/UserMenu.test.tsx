import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserMenu from "../UserMenu";
import type { UserInfo } from "../types";

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

// ============================================================================
// TESTS
// ============================================================================

describe("UserMenu", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Reset window.location
    window.location.href = "";

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {
      // Mock implementation
    });
    vi.spyOn(console, "error").mockImplementation(() => {
      // Mock implementation
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should display user name", () => {
      render(<UserMenu user={mockUser} />);

      expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    });

    it("should display user email in dropdown", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("jan.kowalski@example.com")).toBeInTheDocument();
      });
    });

    it("should display user initials in avatar", () => {
      render(<UserMenu user={mockUser} />);

      // Avatar shows initials - check by finding the text "J" in the avatar
      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("should display email username when displayName is null", () => {
      render(<UserMenu user={mockUserWithoutName} />);

      expect(screen.getByText("anna.nowak")).toBeInTheDocument();
    });

    it("should display profile menu item", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Profil / Ustawienia")).toBeInTheDocument();
      });
    });

    it("should display logout menu item", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // DROPDOWN BEHAVIOR
  // ==========================================================================

  describe("Dropdown Behavior", () => {
    it("should open menu on trigger click", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");

      // Menu should not be visible initially
      expect(screen.queryByText("Profil / Ustawienia")).not.toBeInTheDocument();

      await userEvent.click(trigger);

      // Menu should be visible after click
      await waitFor(() => {
        expect(screen.getByText("Profil / Ustawienia")).toBeInTheDocument();
      });
    });

    // Note: Testing click-outside behavior is complex with Radix UI and not critical for unit tests
    // This is better tested with E2E tests
  });

  // ==========================================================================
  // PROFILE NAVIGATION
  // ==========================================================================

  describe("Profile Navigation", () => {
    it("should navigate to profile page when profile item clicked", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Profil / Ustawienia")).toBeInTheDocument();
      });

      const profileItem = screen.getByText("Profil / Ustawienia");
      await userEvent.click(profileItem);

      expect(window.location.href).toBe("/profile");
    });

    // Note: Icon presence tests implementation details of lucide-react library
    // Component functionality is tested through menu item clicks
  });

  // ==========================================================================
  // LOGOUT FLOW
  // ==========================================================================

  describe("Logout Flow", () => {
    it("should call logout API when logout clicked", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutItem = screen.getByText("Wyloguj");
      await userEvent.click(logoutItem);

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

    it("should redirect to home page after successful logout", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutItem = screen.getByText("Wyloguj");
      await userEvent.click(logoutItem);

      await waitFor(() => {
        expect(window.location.href).toBe("/");
      });
    });

    it("should show alert when logout fails", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Logout failed" }),
      });

      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutItem = screen.getByText("Wyloguj");
      await userEvent.click(logoutItem);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Nie udało się wylogować. Spróbuj ponownie.");
      });
    });

    it("should handle network error during logout", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutItem = screen.getByText("Wyloguj");
      await userEvent.click(logoutItem);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Wystąpił błąd podczas wylogowywania.");
      });
    });

    // Note: Icon presence tests implementation details of lucide-react library
    // Logout functionality is tested through button click behavior
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have proper aria-label for trigger button", () => {
      render(<UserMenu user={mockUser} />);

      expect(screen.getByLabelText("Otwórz menu użytkownika")).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");

      // Tab to trigger
      trigger.focus();
      expect(trigger).toHaveFocus();

      // Open with Enter
      await userEvent.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Profil / Ustawienia")).toBeInTheDocument();
      });
    });

    it("should display user info in menu", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        // User name and email should be visible in dropdown
        expect(screen.getAllByText("Jan Kowalski").length).toBeGreaterThan(0);
        expect(screen.getByText("jan.kowalski@example.com")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // VISUAL STYLING
  // ==========================================================================

  describe("Visual Styling", () => {
    it("should display avatar with initials", () => {
      render(<UserMenu user={mockUser} />);

      // Check that avatar initials are displayed
      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("should have red text for logout item", async () => {
      render(<UserMenu user={mockUser} />);

      const trigger = screen.getByLabelText("Otwórz menu użytkownika");
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Wyloguj")).toBeInTheDocument();
      });

      const logoutItem = screen.getByText("Wyloguj").closest("div");
      expect(logoutItem).toHaveClass("text-red-600");
    });

    it("should truncate long user names", () => {
      const userWithLongName: UserInfo = {
        userId: "user-999",
        email: "test@example.com",
        displayName: "Very Long User Name That Should Be Truncated",
      };

      const { container } = render(<UserMenu user={userWithLongName} />);

      const nameSpan = container.querySelector("span.truncate");
      expect(nameSpan).toHaveClass("max-w-[120px]");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle user with very long email", () => {
      const userWithLongEmail: UserInfo = {
        userId: "user-999",
        email: "verylongemailaddressthatmightbreakthelayout@example.com",
        displayName: null,
      };

      expect(() => {
        render(<UserMenu user={userWithLongEmail} />);
      }).not.toThrow();
    });

    it("should handle user with special characters in name", () => {
      const userWithSpecialChars: UserInfo = {
        userId: "user-999",
        email: "test@example.com",
        displayName: "Łukasz Żółty-Kowalski",
      };

      render(<UserMenu user={userWithSpecialChars} />);

      expect(screen.getByText("Łukasz Żółty-Kowalski")).toBeInTheDocument();
    });

    it("should handle empty user data gracefully", () => {
      const emptyUser: UserInfo = {
        userId: "",
        email: "",
        displayName: "",
      };

      expect(() => {
        render(<UserMenu user={emptyUser} />);
      }).not.toThrow();
    });
  });
});
