import { useState } from "react";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTagCreation from "../tag-creation/CustomTagCreation";
import { useTags } from "@/components/hooks/useTags";
import type { TagDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface TagsStepProps {
  selectedTagIds: string[];
  errors: {
    tags?: string;
  };
  onToggle: (tagId: string) => void;
  onCustomTagCreated: (newTag: TagDTO) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const TagsStep = ({ selectedTagIds, errors, onToggle, onCustomTagCreated }: TagsStepProps) => {
  const { tags, isLoading, error } = useTags();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleTagCreated = (newTag: TagDTO) => {
    onCustomTagCreated(newTag);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Kategorie</h2>
        <p className="text-sm text-gray-600">Wybierz do 5 kategorii, które najlepiej opisują Twój przepis</p>
      </div>

      {/* Tag Counter */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm text-gray-700">Wybrane kategorie:</span>
        <span className={`text-sm font-semibold ${selectedTagIds.length >= 5 ? "text-red-600" : "text-green-600"}`}>
          {selectedTagIds.length}/5
        </span>
      </div>

      {/* General Error Message */}
      {errors.tags && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600" role="alert">
            {errors.tags}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Nie udało się pobrać kategorii. Możesz kontynuować bez wybierania kategorii lub odświeżyć stronę.
          </p>
        </div>
      )}

      {/* Tags Grid */}
      {!isLoading && !error && tags.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">Brak dostępnych kategorii. Możesz utworzyć własną kategorię poniżej.</p>
        </div>
      )}

      {!isLoading && !error && tags.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            const isDisabled = !isSelected && selectedTagIds.length >= 5;

            return (
              <div
                key={tag.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? "bg-green-50 border-green-600"
                    : isDisabled
                      ? "bg-gray-50 border-gray-200 opacity-50"
                      : "bg-white border-gray-200 hover:border-green-600"
                }`}
              >
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggle(tag.id)}
                  disabled={isDisabled}
                  aria-describedby={`tag-label-${tag.id}`}
                />
                <Label
                  htmlFor={`tag-${tag.id}`}
                  id={`tag-label-${tag.id}`}
                  className={`text-sm font-medium cursor-pointer ${isDisabled ? "text-gray-400" : "text-gray-700"}`}
                >
                  {tag.name}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Tag Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="w-full border-dashed border-2 hover:border-green-600 hover:bg-green-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj nową kategorię
      </Button>

      {/* Custom Tag Creation Dialog */}
      <CustomTagCreation isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onTagCreated={handleTagCreated} />

      {/* Helper Text */}
      <div className="pt-2">
        <p className="text-xs text-gray-500">
          Kategorie są opcjonalne, ale pomagają użytkownikom znaleźć Twój przepis. Możesz wybrać maksymalnie 5
          kategorii.
        </p>
      </div>
    </div>
  );
};

export default TagsStep;
