import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileSettingsLayout from "../ProfileSettingsLayout";
import * as useProfileSettingsModule from "@/components/hooks/useProfileSettings";
import type { ProfileDTO, AllergenDTO, UserAllergenDTO, DislikedIngredientDTO } from "@/types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock child components
vi.mock("../SettingsSidebar", () => ({
  SettingsSidebar: ({ sections, activeSection, onSectionChange }: any) => (
    <div data-testid="settings-sidebar">
      {sections.map((section: any) => (
        <button
          key={section.id}
          data-testid={`sidebar-${section.id}`}
          aria-current={activeSection === section.id ? "page" : undefined}
          onClick={() => onSectionChange(section.id)}
        >
          {section.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../SettingsTabs", () => ({
  SettingsTabs: ({ sections, activeSection, onSectionChange }: any) => (
    <div data-testid="settings-tabs">
      {sections.map((section: any) => (
        <button
          key={section.id}
          data-testid={`tab-${section.id}`}
          role="tab"
          aria-selected={activeSection === section.id}
          onClick={() => onSectionChange(section.id)}
        >
          {section.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../sections/BasicInfoSection", () => ({
  BasicInfoSection: ({ initialData, onSave, isSaving }: any) => (
    <div data-testid="basic-info-section">
      <p>Weight: {initialData.weight ?? "null"}</p>
      <p>Age: {initialData.age ?? "null"}</p>
      <p>Gender: {initialData.gender ?? "null"}</p>
      <p>Activity Level: {initialData.activityLevel ?? "null"}</p>
      <p>Saving: {isSaving ? "true" : "false"}</p>
      <button onClick={() => onSave({ weight: 75, age: 30, gender: "male", activityLevel: "moderately_active" })}>
        Save Basic Info
      </button>
    </div>
  ),
}));

vi.mock("../sections/DietaryPreferencesSection", () => ({
  DietaryPreferencesSection: ({ initialData, onSave, isSaving }: any) => (
    <div data-testid="dietary-preferences-section">
      <p>Diet Type: {initialData.dietType ?? "null"}</p>
      <p>Target Goal: {initialData.targetGoal ?? "null"}</p>
      <p>Target Value: {initialData.targetValue ?? "null"}</p>
      <p>Saving: {isSaving ? "true" : "false"}</p>
      <button onClick={() => onSave({ dietType: "balanced", targetGoal: "maintain_weight", targetValue: null })}>
        Save Dietary Preferences
      </button>
    </div>
  ),
}));

vi.mock("../sections/AllergensSection", () => ({
  AllergensSection: ({ allAllergens, selectedAllergenIds, onSave, isSaving, isLoading }: any) => (
    <div data-testid="allergens-section">
      <p>All Allergens Count: {allAllergens.length}</p>
      <p>Selected Count: {selectedAllergenIds.size}</p>
      <p>Saving: {isSaving ? "true" : "false"}</p>
      <p>Loading: {isLoading ? "true" : "false"}</p>
      <button onClick={() => onSave(["allergen-1", "allergen-2"])}>Save Allergens</button>
    </div>
  ),
}));

vi.mock("../sections/DislikedIngredientsSection", () => ({
  DislikedIngredientsSection: ({ ingredients, onAdd, onRemove, isAdding, removingId }: any) => (
    <div data-testid="disliked-ingredients-section">
      <p>Ingredients Count: {ingredients.length}</p>
      <p>Adding: {isAdding ? "true" : "false"}</p>
      <p>Removing ID: {removingId ?? "null"}</p>
      <button onClick={() => onAdd("Cebula")}>Add Ingredient</button>
      <button onClick={() => onRemove("ingredient-1")}>Remove Ingredient</button>
    </div>
  ),
}));

vi.mock("../sections/AccountSection", () => ({
  AccountSection: () => <div data-testid="account-section">Account Section Content</div>,
}));

// Mock useProfileSettings hook
vi.mock("@/components/hooks/useProfileSettings");

// ============================================================================
// TEST DATA
// ============================================================================

const mockProfile: ProfileDTO = {
  weight: 70,
  age: 25,
  gender: "male",
  activityLevel: "moderately_active",
  dietType: "balanced",
  targetGoal: "maintain_weight",
  targetValue: null,
};

const mockAllergens: AllergenDTO[] = [
  { id: "allergen-1", name: "Orzechy", description: "Alergia na orzechy" },
  { id: "allergen-2", name: "Mleko", description: "Alergia na mleko" },
];

const mockUserAllergens: UserAllergenDTO[] = [{ id: "allergen-1", name: "Orzechy" }];

const mockDislikedIngredients: DislikedIngredientDTO[] = [
  { id: "ingredient-1", name: "Brokuły" },
  { id: "ingredient-2", name: "Szpinak" },
];

// ============================================================================
// TESTS
// ============================================================================

describe("ProfileSettingsLayout", () => {
  const mockSaveBasicInfo = vi.fn();
  const mockSaveDietaryPreferences = vi.fn();
  const mockSaveAllergens = vi.fn();
  const mockAddDislikedIngredient = vi.fn();
  const mockRemoveDislikedIngredient = vi.fn();
  const mockRefetchAll = vi.fn();

  const defaultHookState = {
    state: {
      profile: mockProfile,
      allAllergens: mockAllergens,
      userAllergens: mockUserAllergens,
      dislikedIngredients: mockDislikedIngredients,
      isLoadingProfile: false,
      isLoadingAllergens: false,
      isLoadingDislikedIngredients: false,
      isSavingBasicInfo: false,
      isSavingDietaryPreferences: false,
      isSavingAllergens: false,
      isAddingIngredient: false,
      removingIngredientId: null,
      error: null,
    },
    saveBasicInfo: mockSaveBasicInfo,
    saveDietaryPreferences: mockSaveDietaryPreferences,
    saveAllergens: mockSaveAllergens,
    addDislikedIngredient: mockAddDislikedIngredient,
    removeDislikedIngredient: mockRemoveDislikedIngredient,
    refetchAll: mockRefetchAll,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue(defaultHookState);
  });

  // ========================================
  // RENDERING & LAYOUT
  // ========================================

  describe("Rendering & Layout", () => {
    it("should render desktop sidebar", () => {
      render(<ProfileSettingsLayout />);

      const sidebar = screen.getByTestId("settings-sidebar");
      expect(sidebar).toBeInTheDocument();
    });

    it("should render mobile tabs", () => {
      render(<ProfileSettingsLayout />);

      const tabs = screen.getByTestId("settings-tabs");
      expect(tabs).toBeInTheDocument();
    });

    it("should render page title", () => {
      render(<ProfileSettingsLayout />);

      const title = screen.getByRole("heading", { level: 1, name: /ustawienia profilu/i });
      expect(title).toBeInTheDocument();
    });

    it("should render basic info section by default", () => {
      render(<ProfileSettingsLayout />);

      const section = screen.getByTestId("basic-info-section");
      expect(section).toBeInTheDocument();
    });

    it("should show loading skeleton when profile is loading", () => {
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          profile: null,
          isLoadingProfile: true,
        },
      });

      render(<ProfileSettingsLayout />);

      // Skeleton elements are rendered (checking for multiple skeleton items)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show error alert when error exists", () => {
      const errorMessage = "Nie udało się pobrać danych profilu";
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          error: errorMessage,
        },
      });

      render(<ProfileSettingsLayout />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("should show retry button on error", () => {
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          error: "Error occurred",
        },
      });

      render(<ProfileSettingsLayout />);

      const retryButton = screen.getByRole("button", { name: /spróbuj ponownie/i });
      expect(retryButton).toBeInTheDocument();
    });

    it("should render all 5 section buttons in sidebar", () => {
      render(<ProfileSettingsLayout />);

      expect(screen.getByTestId("sidebar-basic-info")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-dietary-preferences")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-allergens")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-disliked-ingredients")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-account")).toBeInTheDocument();
    });
  });

  // ========================================
  // SECTION NAVIGATION
  // ========================================

  describe("Section Navigation", () => {
    it("should default to basic-info section", () => {
      render(<ProfileSettingsLayout />);

      const basicInfoSection = screen.getByTestId("basic-info-section");
      expect(basicInfoSection).toBeInTheDocument();

      const activeButton = screen.getByTestId("sidebar-basic-info");
      expect(activeButton).toHaveAttribute("aria-current", "page");
    });

    it("should switch to dietary-preferences section", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const button = screen.getByTestId("sidebar-dietary-preferences");
      await user.click(button);

      const section = screen.getByTestId("dietary-preferences-section");
      expect(section).toBeInTheDocument();
    });

    it("should switch to allergens section", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const button = screen.getByTestId("sidebar-allergens");
      await user.click(button);

      const section = screen.getByTestId("allergens-section");
      expect(section).toBeInTheDocument();
    });

    it("should switch to disliked-ingredients section", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const button = screen.getByTestId("sidebar-disliked-ingredients");
      await user.click(button);

      const section = screen.getByTestId("disliked-ingredients-section");
      expect(section).toBeInTheDocument();
    });

    it("should switch to account section", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const button = screen.getByTestId("sidebar-account");
      await user.click(button);

      const section = screen.getByTestId("account-section");
      expect(section).toBeInTheDocument();
    });

    it("should show only active section content", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      // Initially shows basic-info
      expect(screen.getByTestId("basic-info-section")).toBeInTheDocument();
      expect(screen.queryByTestId("dietary-preferences-section")).not.toBeInTheDocument();

      // Switch to dietary-preferences
      await user.click(screen.getByTestId("sidebar-dietary-preferences"));

      expect(screen.queryByTestId("basic-info-section")).not.toBeInTheDocument();
      expect(screen.getByTestId("dietary-preferences-section")).toBeInTheDocument();
    });

    it("should sync navigation between sidebar and tabs", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      // Click sidebar button
      await user.click(screen.getByTestId("sidebar-allergens"));

      // Check tab has correct aria-selected
      const tab = screen.getByTestId("tab-allergens");
      expect(tab).toHaveAttribute("aria-selected", "true");
    });

    it("should update aria-current on active section in sidebar", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const allergensButton = screen.getByTestId("sidebar-allergens");
      await user.click(allergensButton);

      expect(allergensButton).toHaveAttribute("aria-current", "page");

      const basicInfoButton = screen.getByTestId("sidebar-basic-info");
      expect(basicInfoButton).not.toHaveAttribute("aria-current", "page");
    });

    it("should maintain section state during navigation", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      // Switch to allergens
      await user.click(screen.getByTestId("sidebar-allergens"));
      expect(screen.getByTestId("allergens-section")).toBeInTheDocument();

      // Switch to account
      await user.click(screen.getByTestId("sidebar-account"));
      expect(screen.getByTestId("account-section")).toBeInTheDocument();

      // Switch back to allergens
      await user.click(screen.getByTestId("sidebar-allergens"));
      expect(screen.getByTestId("allergens-section")).toBeInTheDocument();
    });

    it("should support navigation via tabs", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("tab-dietary-preferences"));

      const section = screen.getByTestId("dietary-preferences-section");
      expect(section).toBeInTheDocument();
    });
  });

  // ========================================
  // DATA PROPAGATION
  // ========================================

  describe("Data Propagation", () => {
    it("should pass profile data to BasicInfoSection", () => {
      render(<ProfileSettingsLayout />);

      const section = screen.getByTestId("basic-info-section");
      expect(section).toHaveTextContent("Weight: 70");
      expect(section).toHaveTextContent("Age: 25");
      expect(section).toHaveTextContent("Gender: male");
      expect(section).toHaveTextContent("Activity Level: moderately_active");
    });

    it("should pass profile data to DietaryPreferencesSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-dietary-preferences"));

      const section = screen.getByTestId("dietary-preferences-section");
      expect(section).toHaveTextContent("Diet Type: balanced");
      expect(section).toHaveTextContent("Target Goal: maintain_weight");
      expect(section).toHaveTextContent("Target Value: null");
    });

    it("should pass allergens data to AllergensSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-allergens"));

      const section = screen.getByTestId("allergens-section");
      expect(section).toHaveTextContent("All Allergens Count: 2");
    });

    it("should pass userAllergens to AllergensSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-allergens"));

      const section = screen.getByTestId("allergens-section");
      expect(section).toHaveTextContent("Selected Count: 1");
    });

    it("should pass dislikedIngredients to DislikedIngredientsSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-disliked-ingredients"));

      const section = screen.getByTestId("disliked-ingredients-section");
      expect(section).toHaveTextContent("Ingredients Count: 2");
    });

    it("should pass saveBasicInfo callback to BasicInfoSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const button = screen.getByRole("button", { name: /save basic info/i });
      await user.click(button);

      expect(mockSaveBasicInfo).toHaveBeenCalledWith({
        weight: 75,
        age: 30,
        gender: "male",
        activityLevel: "moderately_active",
      });
    });

    it("should pass saveDietaryPreferences callback to DietaryPreferencesSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-dietary-preferences"));

      const button = screen.getByRole("button", { name: /save dietary preferences/i });
      await user.click(button);

      expect(mockSaveDietaryPreferences).toHaveBeenCalledWith({
        dietType: "balanced",
        targetGoal: "maintain_weight",
        targetValue: null,
      });
    });

    it("should pass saveAllergens callback to AllergensSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-allergens"));

      const button = screen.getByRole("button", { name: /save allergens/i });
      await user.click(button);

      expect(mockSaveAllergens).toHaveBeenCalledWith(["allergen-1", "allergen-2"]);
    });

    it("should pass addDislikedIngredient callback to DislikedIngredientsSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-disliked-ingredients"));

      const button = screen.getByRole("button", { name: /add ingredient/i });
      await user.click(button);

      expect(mockAddDislikedIngredient).toHaveBeenCalledWith("Cebula");
    });

    it("should pass removeDislikedIngredient callback to DislikedIngredientsSection", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      await user.click(screen.getByTestId("sidebar-disliked-ingredients"));

      const button = screen.getByRole("button", { name: /remove ingredient/i });
      await user.click(button);

      expect(mockRemoveDislikedIngredient).toHaveBeenCalledWith("ingredient-1");
    });

    it("should pass loading states to BasicInfoSection", () => {
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          isSavingBasicInfo: true,
        },
      });

      render(<ProfileSettingsLayout />);

      const section = screen.getByTestId("basic-info-section");
      expect(section).toHaveTextContent("Saving: true");
    });

    it("should pass saving states to DietaryPreferencesSection", async () => {
      const user = userEvent.setup();
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          isSavingDietaryPreferences: true,
        },
      });

      render(<ProfileSettingsLayout />);
      await user.click(screen.getByTestId("sidebar-dietary-preferences"));

      const section = screen.getByTestId("dietary-preferences-section");
      expect(section).toHaveTextContent("Saving: true");
    });

    it("should pass saving and loading states to AllergensSection", async () => {
      const user = userEvent.setup();
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          isSavingAllergens: true,
          isLoadingAllergens: true,
        },
      });

      render(<ProfileSettingsLayout />);
      await user.click(screen.getByTestId("sidebar-allergens"));

      const section = screen.getByTestId("allergens-section");
      expect(section).toHaveTextContent("Saving: true");
      expect(section).toHaveTextContent("Loading: true");
    });
  });

  // ========================================
  // ERROR HANDLING & RETRY
  // ========================================

  describe("Error Handling & Retry", () => {
    it("should display error message from hook", () => {
      const errorMessage = "Wystąpił błąd podczas pobierania danych";
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          error: errorMessage,
        },
      });

      render(<ProfileSettingsLayout />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("should call refetchAll when retry button is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          error: "Error message",
        },
      });

      render(<ProfileSettingsLayout />);

      const retryButton = screen.getByRole("button", { name: /spróbuj ponownie/i });
      await user.click(retryButton);

      expect(mockRefetchAll).toHaveBeenCalledTimes(1);
    });

    it("should hide section content when error is present", () => {
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          error: "Error occurred",
        },
      });

      render(<ProfileSettingsLayout />);

      expect(screen.queryByTestId("basic-info-section")).not.toBeInTheDocument();
    });

    it("should show error even when switching sections", async () => {
      const user = userEvent.setup();
      const errorMessage = "Persistent error";
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          error: errorMessage,
        },
      });

      render(<ProfileSettingsLayout />);

      // Try to switch sections
      await user.click(screen.getByTestId("sidebar-allergens"));

      // Error should still be visible
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByTestId("allergens-section")).not.toBeInTheDocument();
    });

    it("should handle null profile gracefully in BasicInfoSection", () => {
      vi.mocked(useProfileSettingsModule.useProfileSettings).mockReturnValue({
        ...defaultHookState,
        state: {
          ...defaultHookState.state,
          profile: null,
          isLoadingProfile: false,
        },
      });

      render(<ProfileSettingsLayout />);

      const section = screen.getByTestId("basic-info-section");
      expect(section).toHaveTextContent("Weight: null");
      expect(section).toHaveTextContent("Age: null");
      expect(section).toHaveTextContent("Gender: null");
      expect(section).toHaveTextContent("Activity Level: null");
    });
  });

  // ========================================
  // ACCESSIBILITY
  // ========================================

  describe("Accessibility", () => {
    it("should have proper heading hierarchy with h1", () => {
      render(<ProfileSettingsLayout />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Ustawienia profilu");
    });

    it("should have aria-current attribute on active sidebar button", () => {
      render(<ProfileSettingsLayout />);

      const activeButton = screen.getByTestId("sidebar-basic-info");
      expect(activeButton).toHaveAttribute("aria-current", "page");
    });

    it("should have aria-selected attribute on active tab", () => {
      render(<ProfileSettingsLayout />);

      const activeTab = screen.getByTestId("tab-basic-info");
      expect(activeTab).toHaveAttribute("aria-selected", "true");
    });

    it("should update aria-current when section changes via sidebar", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const allergensButton = screen.getByTestId("sidebar-allergens");
      await user.click(allergensButton);

      expect(allergensButton).toHaveAttribute("aria-current", "page");

      const basicInfoButton = screen.getByTestId("sidebar-basic-info");
      expect(basicInfoButton).not.toHaveAttribute("aria-current");
    });

    it("should update aria-selected when section changes via tabs", async () => {
      const user = userEvent.setup();
      render(<ProfileSettingsLayout />);

      const accountTab = screen.getByTestId("tab-account");
      await user.click(accountTab);

      expect(accountTab).toHaveAttribute("aria-selected", "true");

      const basicInfoTab = screen.getByTestId("tab-basic-info");
      expect(basicInfoTab).toHaveAttribute("aria-selected", "false");
    });
  });
});
