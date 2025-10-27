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
import type { DeleteModificationDialogProps } from "@/components/recipes/types";

/**
 * DeleteModificationDialog component for modification deletion confirmation
 * Shows warning message about losing modified version
 */
const DeleteModificationDialog = ({ isOpen, onClose, onConfirm, isLoading }: DeleteModificationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>Usuń modyfikację</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Czy na pewno chcesz usunąć tę modyfikację? Zmodyfikowana wersja przepisu zostanie utracona. Oryginalny
            przepis pozostanie niezmieniony.
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
              "Usuń modyfikację"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteModificationDialog;
