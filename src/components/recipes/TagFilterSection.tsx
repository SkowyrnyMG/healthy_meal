import { Checkbox } from "@/components/ui/checkbox";
import type { TagDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface TagFilterSectionProps {
  /**
   * Array of available tags
   */
  tags: TagDTO[];

  /**
   * Array of currently selected tag IDs
   */
  selectedTagIds: string[];

  /**
   * Callback when tag selection changes
   */
  onChange: (tagIds: string[]) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * TagFilterSection component for multi-select tag filtering
 *
 * Features:
 * - Checkbox list for all available tags
 * - Multi-select support
 * - Scrollable container for long tag lists
 * - Maximum 50 tags (enforced by API)
 *
 * @example
 * ```tsx
 * <TagFilterSection
 *   tags={tags}
 *   selectedTagIds={filters.tagIds || []}
 *   onChange={setTagIds}
 * />
 * ```
 */
const TagFilterSection = ({ tags, selectedTagIds, onChange }: TagFilterSectionProps) => {
  // Handle checkbox toggle
  const handleToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      // Add tag
      onChange([...selectedTagIds, tagId]);
    } else {
      // Remove tag
      onChange(selectedTagIds.filter((id) => id !== tagId));
    }
  };

  // Handle "Select All" (optional enhancement)
  // const handleSelectAll = () => {
  //   onChange(tags.map(tag => tag.id));
  // };

  // Handle "Deselect All" (optional enhancement)
  // const handleDeselectAll = () => {
  //   onChange([]);
  // };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-900">Kategorie</span>

      {/* Scrollable Tag List */}
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500">Brak dostępnych kategorii</p>
        ) : (
          tags.map((tag) => {
            const isChecked = selectedTagIds.includes(tag.id);

            return (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleToggle(tag.id, checked === true)}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tag.name}
                </label>
              </div>
            );
          })
        )}
      </div>

      {/* Optional: Select All / Deselect All buttons */}
      {/* {tags.length > 0 && (
        <div className="flex gap-2 text-xs">
          <button onClick={handleSelectAll} className="text-green-600 hover:underline">
            Zaznacz wszystkie
          </button>
          <button onClick={handleDeselectAll} className="text-gray-600 hover:underline">
            Odznacz wszystkie
          </button>
        </div>
      )} */}
    </div>
  );
};

export default TagFilterSection;
