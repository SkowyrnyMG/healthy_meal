import type { LucideIcon } from "lucide-react";
import type { SettingsSection } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section configuration for sidebar navigation
 */
interface SectionConfig {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
}

/**
 * Props for SettingsSidebar component
 */
interface SettingsSidebarProps {
  /**
   * Array of section configurations
   */
  sections: SectionConfig[];

  /**
   * Currently active section
   */
  activeSection: SettingsSection;

  /**
   * Callback when section changes
   */
  onSectionChange: (section: SettingsSection) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Vertical navigation sidebar for desktop view
 *
 * Features:
 * - Displays list of section buttons with icons
 * - Active section highlighted with green accent
 * - Keyboard accessible
 */
export const SettingsSidebar = ({ sections, activeSection, onSectionChange }: SettingsSidebarProps) => {
  return (
    <nav className="w-64 flex-shrink-0" aria-label="Ustawienia profilu">
      <ul className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <li key={section.id}>
              <button
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors",
                  isActive ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-green-600" : "text-gray-400")}
                  aria-hidden="true"
                />
                <span>{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
