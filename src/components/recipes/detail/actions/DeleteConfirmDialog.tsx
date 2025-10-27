import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DeleteConfirmDialogProps } from "@/components/recipes/types";

/**
 * DeleteConfirmDialog component for recipe deletion confirmation
 * Shows warning message and requires explicit confirmation
 */
const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, isLoading }: DeleteConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle>Usuń przepis</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Czy na pewno chcesz usunąć ten przepis? Ta operacja jest nieodwracalna. Wszystkie modyfikacje i powiązane
            dane również zostaną usunięte.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń przepis"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
