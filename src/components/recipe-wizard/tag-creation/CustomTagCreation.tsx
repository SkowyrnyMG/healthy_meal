import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/components/hooks/useRecipeFormWizard";
import type { TagDTO, CreateTagCommand } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface CustomTagCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onTagCreated: (tag: TagDTO) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CustomTagCreation = ({ isOpen, onClose, onTagCreated }: CustomTagCreationProps) => {
  const [tagName, setTagName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug when tag name changes
  useEffect(() => {
    if (tagName) {
      setSlug(generateSlug(tagName));
    } else {
      setSlug("");
    }
  }, [tagName]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTagName("");
      setSlug("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedName = tagName.trim();
    if (!trimmedName) {
      setError("Nazwa kategorii jest wymagana");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Nazwa kategorii może mieć maksymalnie 100 znaków");
      return;
    }

    if (!slug) {
      setError("Nie udało się wygenerować identyfikatora kategorii");
      return;
    }

    setIsSubmitting(true);

    try {
      const command: CreateTagCommand = {
        name: trimmedName,
        slug: slug,
      };

      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się utworzyć kategorii");
      }

      const result = await response.json();

      // Success - notify parent and close dialog
      onTagCreated(result.tag);
      onClose();
    } catch (err) {
      console.error("Error creating tag:", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dodaj nową kategorię</DialogTitle>
            <DialogDescription>
              Utwórz własną kategorię, która będzie dostępna dla wszystkich przepisów
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tag Name Input */}
            <div className="space-y-2">
              <Label htmlFor="tag-name" className="text-sm font-medium text-gray-700">
                Nazwa kategorii <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tag-name"
                type="text"
                placeholder="np. Wegetariańskie"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-gray-500">{tagName.length}/100</p>
            </div>

            {/* Slug Preview */}
            {slug && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Identyfikator (generowany automatycznie)</Label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <code className="text-xs text-gray-700">{slug}</code>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !tagName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Dodawanie..." : "Dodaj kategorię"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomTagCreation;
