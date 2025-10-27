import { useState } from "react";
import { Loader2, FolderPlus, Folder } from "lucide-react";
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
import type { AddToCollectionDialogProps } from "@/components/recipes/types";

/**
 * AddToCollectionDialog component for adding recipe to a collection
 * Displays list of user's collections with selection
 */
const AddToCollectionDialog = ({ isOpen, onClose, onConfirm, collections, isLoading }: AddToCollectionDialogProps) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  /**
   * Handle collection selection
   */
  const handleSelect = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!selectedCollectionId) return;
    await onConfirm(selectedCollectionId);
    setSelectedCollectionId("");
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    setSelectedCollectionId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj do kolekcji</DialogTitle>
          <DialogDescription>Wybierz kolekcję, do której chcesz dodać ten przepis.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {collections.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleSelect(collection.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                      selectedCollectionId === collection.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder
                        className={`w-5 h-5 ${
                          selectedCollectionId === collection.id ? "text-green-600" : "text-gray-500"
                        }`}
                      />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{collection.name}</div>
                        <div className="text-sm text-gray-500">
                          {collection.recipeCount}{" "}
                          {collection.recipeCount === 1
                            ? "przepis"
                            : collection.recipeCount >= 2 && collection.recipeCount <= 4
                              ? "przepisy"
                              : "przepisów"}
                        </div>
                      </div>
                    </div>
                    {selectedCollectionId === collection.id && (
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderPlus className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600">Nie masz jeszcze żadnych kolekcji</p>
              <p className="text-sm text-gray-500 mt-1">Utwórz kolekcję, aby organizować swoje przepisy</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedCollectionId || isLoading}>
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
