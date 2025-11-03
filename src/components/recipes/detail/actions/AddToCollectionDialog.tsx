import { useState, useEffect, useCallback } from "react";
import { Loader2, FolderPlus, Folder, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { CollectionDTO } from "@/types";

/**
 * Props for AddToCollectionDialog component
 */
interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (collectionId: string) => Promise<void>;
  recipeId: string;
  isLoading: boolean;
}

/**
 * AddToCollectionDialog component for adding recipe to a collection
 * Fetches user's collections on mount and displays them for selection
 * Shows which collections already contain the recipe
 * Allows removing recipe from collections
 */
const AddToCollectionDialog = ({ isOpen, onClose, onConfirm, recipeId, isLoading }: AddToCollectionDialogProps) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [isFetchingCollections, setIsFetchingCollections] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [recipeCollectionIds, setRecipeCollectionIds] = useState<Set<string>>(new Set());
  const [removingCollectionId, setRemovingCollectionId] = useState<string | null>(null);

  /**
   * Fetch user's collections from API
   */
  const fetchCollections = useCallback(async () => {
    setIsFetchingCollections(true);
    setFetchError(null);

    try {
      const response = await fetch("/api/collections");

      if (!response.ok) {
        throw new Error("Nie udało się pobrać kolekcji");
      }

      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[AddToCollectionDialog] Error fetching collections:", error);
      setFetchError(error instanceof Error ? error.message : "Wystąpił błąd podczas pobierania kolekcji");
      toast.error("Nie udało się pobrać listy kolekcji");
    } finally {
      setIsFetchingCollections(false);
    }
  }, []);

  /**
   * Fetch collections that already contain this recipe
   */
  const fetchRecipeCollections = useCallback(async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/collections`);

      if (!response.ok) {
        throw new Error("Nie udało się sprawdzić kolekcji");
      }

      const data = await response.json();
      setRecipeCollectionIds(new Set(data.collectionIds || []));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[AddToCollectionDialog] Error fetching recipe collections:", error);
      // Don't show error to user, just assume recipe is not in any collections
      setRecipeCollectionIds(new Set());
    }
  }, [recipeId]);

  /**
   * Fetch collections when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      fetchRecipeCollections();
    } else {
      // Reset state when dialog closes
      setSelectedCollectionId("");
      setFetchError(null);
    }
  }, [isOpen, fetchCollections, fetchRecipeCollections]);

  /**
   * Handle collection selection
   */
  const handleSelect = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
  };

  /**
   * Handle form submission (add to collection)
   */
  const handleSubmit = async () => {
    if (!selectedCollectionId) return;

    try {
      await onConfirm(selectedCollectionId);
      setSelectedCollectionId("");

      // Refresh the list of collections containing this recipe
      await fetchRecipeCollections();
    } catch (error) {
      // Error handling is done in parent component
      // eslint-disable-next-line no-console
      console.error("[AddToCollectionDialog] Error in handleSubmit:", error);
    }
  };

  /**
   * Handle removing recipe from collection
   */
  const handleRemove = async (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection

    setRemovingCollectionId(collectionId);

    try {
      const response = await fetch(`/api/collections/${collectionId}/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Nie udało się usunąć przepisu z kolekcji");
      }

      toast.success("Przepis został usunięty z kolekcji");

      // Remove from local state
      setRecipeCollectionIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[AddToCollectionDialog] Error removing from collection:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setRemovingCollectionId(null);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    setSelectedCollectionId("");
    onClose();
  };

  /**
   * Check if recipe is already in a collection
   */
  const isRecipeInCollection = (collectionId: string): boolean => {
    return recipeCollectionIds.has(collectionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zarządzaj kolekcjami</DialogTitle>
          <DialogDescription>Dodaj przepis do kolekcji lub usuń go z istniejących kolekcji.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {isFetchingCollections && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          )}

          {/* Error State */}
          {!isFetchingCollections && fetchError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-600 mb-4">{fetchError}</p>
              <Button onClick={fetchCollections} variant="outline" size="sm">
                Spróbuj ponownie
              </Button>
            </div>
          )}

          {/* Collections List */}
          {!isFetchingCollections && !fetchError && collections.length > 0 && (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {collections.map((collection) => {
                  const alreadyInCollection = isRecipeInCollection(collection.id);
                  const isRemoving = removingCollectionId === collection.id;
                  return (
                    <div
                      key={collection.id}
                      className={`relative w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                        alreadyInCollection
                          ? "border-green-600 bg-green-50"
                          : selectedCollectionId === collection.id
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={() => !alreadyInCollection && handleSelect(collection.id)}
                        disabled={alreadyInCollection || isRemoving}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <Folder
                          className={`w-5 h-5 flex-shrink-0 ${
                            alreadyInCollection
                              ? "text-green-600"
                              : selectedCollectionId === collection.id
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="truncate">{collection.name}</span>
                            {alreadyInCollection && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-green-700">
                                <Check className="w-3 h-3" />
                                dodano
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {collection.recipeCount}{" "}
                            {collection.recipeCount === 1
                              ? "przepis"
                              : collection.recipeCount >= 2 && collection.recipeCount <= 4
                                ? "przepisy"
                                : "przepisów"}
                          </div>
                        </div>
                      </button>

                      {/* Remove button for collections that contain the recipe */}
                      {alreadyInCollection && (
                        <button
                          onClick={(e) => handleRemove(collection.id, e)}
                          disabled={isRemoving}
                          className="ml-2 p-1.5 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Usuń z kolekcji"
                        >
                          {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Selection indicator for new selections */}
                      {!alreadyInCollection && selectedCollectionId === collection.id && (
                        <div className="ml-2 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {!isFetchingCollections && !fetchError && collections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderPlus className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600">Nie masz jeszcze żadnych kolekcji</p>
              <p className="text-sm text-gray-500 mt-1">Utwórz kolekcję, aby organizować swoje przepisy</p>
              <Button
                onClick={() => {
                  handleClose();
                  window.location.href = "/collections";
                }}
                className="mt-4 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Przejdź do kolekcji
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading || isFetchingCollections}>
            Zamknij
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCollectionId || isLoading || isFetchingCollections}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dodawanie...
              </>
            ) : (
              "Dodaj do kolekcji"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCollectionDialog;
