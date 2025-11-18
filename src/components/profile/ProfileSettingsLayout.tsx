import { useState } from "react";
import { User, Utensils, AlertTriangle, XCircle, Settings } from "lucide-react";
import type { SettingsSection } from "@/types";
import { useProfileSettings } from "@/components/hooks/useProfileSettings";
import { SettingsSidebar } from "./SettingsSidebar";
import { SettingsTabs } from "./SettingsTabs";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { DietaryPreferencesSection } from "./sections/DietaryPreferencesSection";
import { AllergensSection } from "./sections/AllergensSection";
import { DislikedIngredientsSection } from "./sections/DislikedIngredientsSection";
import { AccountSection } from "./sections/AccountSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section configuration for navigation
 */
interface SectionConfig {
  id: SettingsSection;
  label: string;
  icon: typeof User;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Navigation sections configuration
 */
const SECTIONS: SectionConfig[] = [
  { id: "basic-info", label: "Dane podstawowe", icon: User },
  { id: "dietary-preferences", label: "Preferencje żywieniowe", icon: Utensils },
  { id: "allergens", label: "Alergeny", icon: AlertTriangle },
  { id: "disliked-ingredients", label: "Niechciane składniki", icon: XCircle },
  { id: "account", label: "Konto", icon: Settings },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Main layout component for profile settings page
 *
 * Features:
 * - Responsive navigation (sidebar on desktop, tabs on mobile)
 * - Section content switching
 * - Loading and error states
 * - Integrates with useProfileSettings hook
 */
const ProfileSettingsLayout = () => {
  // ========================================
  // STATE
  // ========================================

  const [activeSection, setActiveSection] = useState<SettingsSection>("basic-info");

  const {
    state,
    saveBasicInfo,
    saveDietaryPreferences,
    saveAllergens,
    addDislikedIngredient,
    removeDislikedIngredient,
    refetchAll,
  } = useProfileSettings();

  // ========================================
  // HANDLERS
  // ========================================

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Render loading skeleton for initial load
   */
  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );

  /**
   * Render error state with retry button
   */
  const renderError = () => (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>{state.error}</span>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          Spróbuj ponownie
        </Button>
      </AlertDescription>
    </Alert>
  );

  /**
   * Render active section content
   */
  const renderSectionContent = () => {
    // Show error if present
    if (state.error) {
      return renderError();
    }

    // Show loading skeleton during initial load
    const isInitialLoading = state.isLoadingProfile || state.isLoadingAllergens || state.isLoadingDislikedIngredients;

    if (isInitialLoading && !state.profile) {
      return renderLoadingSkeleton();
    }

    switch (activeSection) {
      case "basic-info":
        return (
          <BasicInfoSection
            initialData={{
              weight: state.profile?.weight ?? null,
              age: state.profile?.age ?? null,
              gender: (state.profile?.gender as "male" | "female" | null) ?? null,
              activityLevel:
                (state.profile?.activityLevel as
                  | "sedentary"
                  | "lightly_active"
                  | "moderately_active"
                  | "very_active"
                  | "extremely_active"
                  | null) ?? null,
            }}
            onSave={saveBasicInfo}
            isSaving={state.isSavingBasicInfo}
          />
        );

      case "dietary-preferences":
        return (
          <DietaryPreferencesSection
            initialData={{
              dietType:
                (state.profile?.dietType as
                  | "high_protein"
                  | "keto"
                  | "vegetarian"
                  | "weight_gain"
                  | "weight_loss"
                  | "balanced"
                  | null) ?? null,
              targetGoal:
                (state.profile?.targetGoal as "lose_weight" | "gain_weight" | "maintain_weight" | null) ?? null,
              targetValue: state.profile?.targetValue ?? null,
            }}
            onSave={saveDietaryPreferences}
            isSaving={state.isSavingDietaryPreferences}
          />
        );

      case "allergens":
        return (
          <AllergensSection
            allAllergens={state.allAllergens}
            selectedAllergenIds={new Set(state.userAllergens.map((a) => a.id))}
            onSave={saveAllergens}
            isSaving={state.isSavingAllergens}
            isLoading={state.isLoadingAllergens}
          />
        );

      case "disliked-ingredients":
        return (
          <DislikedIngredientsSection
            ingredients={state.dislikedIngredients}
            onAdd={addDislikedIngredient}
            onRemove={removeDislikedIngredient}
            isAdding={state.isAddingIngredient}
            removingId={state.removingIngredientId}
          />
        );

      case "account":
        return <AccountSection />;

      default:
        return null;
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Ustawienia profilu</h1>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Navigation (Desktop) */}
        <div className="hidden md:block">
          <SettingsSidebar sections={SECTIONS} activeSection={activeSection} onSectionChange={handleSectionChange} />
        </div>

        {/* Tab Navigation (Mobile) */}
        <div className="md:hidden">
          <SettingsTabs sections={SECTIONS} activeSection={activeSection} onSectionChange={handleSectionChange} />
        </div>

        {/* Section Content */}
        <div className="flex-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">{renderSectionContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsLayout;
