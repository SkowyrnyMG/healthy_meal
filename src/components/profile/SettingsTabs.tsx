import type { LucideIcon } from "lucide-react";
import type { SettingsSection } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section configuration for tab navigation
 */
interface SectionConfig {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
}

/**
 * Props for SettingsTabs component
 */
interface SettingsTabsProps {
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
 * Horizontal tab navigation for mobile view
 *
 * Features:
 * - Uses Shadcn Tabs component
 * - Horizontally scrollable for overflow
 * - Shows icons with labels
 */
export const SettingsTabs = ({ sections, activeSection, onSectionChange }: SettingsTabsProps) => {
  return (
    <Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as SettingsSection)} className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList className="inline-flex h-auto w-max gap-1 bg-gray-100 p-1">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex items-center gap-2 px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-green-700"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
};
