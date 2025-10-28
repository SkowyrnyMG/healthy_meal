import { useState } from "react";
import { ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecipeFormStep, RecipeFormMode } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface WizardNavigationProps {
  currentStep: RecipeFormStep;
  totalSteps: number;
  mode: RecipeFormMode;
  recipeId?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => Promise<void>;
  onDiscardAll: () => void;
  isSubmitting: boolean;
  canProceed: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const WizardNavigation = ({
  currentStep,
  totalSteps,
  mode,
  onPrevious,
  onNext,
  onSubmit,
  onDiscardAll,
  isSubmitting,
  canProceed,
}: WizardNavigationProps) => {
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleConfirmDiscard = () => {
    onDiscardAll();
    setIsDiscardDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {/* Left side: Previous & Decline buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || isSubmitting}
            className={isFirstStep ? "invisible" : ""}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Poprzedni
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDiscardDialogOpen(true)}
            disabled={isSubmitting}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Odrzuć zmiany
          </Button>
        </div>

        {/* Right side: Save/Next/Submit buttons */}
        <div className="flex items-center gap-2">
          {/* Save button - only in edit mode and not on last step */}
          {mode === "edit" && !isLastStep && (
            <Button
              type="button"
              variant="outline"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Save className="h-4 w-4 mr-1" />
              Zapisz
            </Button>
          )}

          {/* Next/Submit Button */}
          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {mode === "create" ? "Zapisz przepis" : "Zapisz zmiany"}
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceed || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Następny
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Odrzucić wszystkie zmiany?</DialogTitle>
            <DialogDescription className="text-gray-600">
              Czy na pewno chcesz odrzucić wszystkie zmiany? Wszystkie podane dane zostaną utracone w tym procesie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscardDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDiscard}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Tak, odrzuć
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WizardNavigation;
