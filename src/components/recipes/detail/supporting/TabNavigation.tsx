import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TabNavigationProps } from "@/components/recipes/types";

/**
 * TabNavigation component for switching between original and modified recipes
 * Uses Shadcn/ui Tabs component for accessibility
 */
const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as "original" | "modified")} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="original" className="text-sm">
          Oryginalny
        </TabsTrigger>
        <TabsTrigger value="modified" className="text-sm">
          Zmodyfikowany
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TabNavigation;
