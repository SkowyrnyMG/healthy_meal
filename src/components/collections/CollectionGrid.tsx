import CollectionCard from "./CollectionCard";
import type { CollectionGridProps } from "./types";

/**
 * CollectionGrid component - Responsive grid container for collection cards
 *
 * Features:
 * - Responsive grid layout (1 col mobile → 4 cols desktop)
 * - Maps collections to CollectionCard components
 * - Propagates event handlers to cards
 *
 * Grid breakpoints:
 * - Mobile (default): 1 column
 * - Tablet (sm): 2 columns
 * - Desktop (lg): 3 columns
 * - Large desktop (xl): 4 columns
 *
 * @example
 * ```tsx
 * <CollectionGrid
 *   collections={collections}
 *   onCardClick={(id) => navigate(`/collections/${id}`)}
 *   onEdit={(collection) => openEditDialog(collection)}
 *   onDelete={(collection) => openDeleteDialog(collection)}
 * />
 * ```
 */
const CollectionGrid = ({ collections, onCardClick, onEdit, onDelete }: CollectionGridProps) => {
  // Safety check for empty collections (shouldn't render, but good practice)
  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onClick={onCardClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CollectionGrid;
