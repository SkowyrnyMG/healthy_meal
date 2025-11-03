import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "./types";

/**
 * EmptyState component - Displayed when user has no collections
 *
 * Features:
 * - Friendly empty state message
 * - Call-to-action button to create first collection
 * - Centered layout with icon
 *
 * @example
 * ```tsx
 * <EmptyState onCreateClick={() => openCreateDialog()} />
 * ```
 */
const EmptyState = ({ onCreateClick }: EmptyStateProps) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <FolderPlus className="h-12 w-12 text-green-600" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">Nie masz jeszcze kolekcji</h2>

      {/* Description */}
      <p className="mb-6 max-w-md text-gray-600">Organizuj przepisy w kolekcje, aby łatwiej je znaleźć</p>

      {/* Call-to-Action Button */}
      <Button onClick={onCreateClick} className="bg-green-600 text-white hover:bg-green-700">
        + Utwórz pierwszą kolekcję
      </Button>
    </div>
  );
};

export default EmptyState;
