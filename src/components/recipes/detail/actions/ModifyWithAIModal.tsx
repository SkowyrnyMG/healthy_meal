import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ModifyWithAIModalProps } from "@/components/recipes/types";
import type { CreateModificationCommand, ModificationParameters } from "@/types";

/**
 * ModifyWithAIModal component for creating AI-powered recipe modifications
 * Shows dynamic form fields based on selected modification type
 */
const ModifyWithAIModal = ({
  isOpen,
  onClose,
  onConfirm,
  hasExistingModification,
  isLoading,
}: ModifyWithAIModalProps) => {
  const [modificationType, setModificationType] = useState<CreateModificationCommand["modificationType"] | "">("");
  const [parameters, setParameters] = useState<ModificationParameters>({});

  /**
   * Reset form state
   */
  const resetForm = () => {
    setModificationType("");
    setParameters({});
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!modificationType) return;

    const command: CreateModificationCommand = {
      modificationType,
      parameters,
    };

    await onConfirm(command);
    resetForm();
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Check if form is valid
   */
  const isFormValid = (): boolean => {
    if (!modificationType) return false;

    switch (modificationType) {
      case "reduce_calories":
        return !!(parameters.targetCalories || parameters.reductionPercentage);
      case "increase_calories":
        return !!(parameters.targetCalories || parameters.increasePercentage);
      case "increase_protein":
        return !!parameters.targetProtein;
      case "increase_fiber":
        return !!parameters.targetFiber;
      case "portion_size":
        return !!parameters.newServings;
      case "ingredient_substitution":
        return !!parameters.originalIngredient;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modyfikuj przepis z AI</DialogTitle>
          <DialogDescription>Wybierz typ modyfikacji i podaj odpowiednie parametry.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Banner if existing modification */}
          {hasExistingModification && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">Istniejąca modyfikacja zostanie zastąpiona nową.</p>
            </div>
          )}

          {/* Modification Type Selector */}
          <div className="space-y-2">
            <label htmlFor="modification-type" className="text-sm font-medium text-gray-700">
              Typ modyfikacji
            </label>
            <Select
              value={modificationType}
              onValueChange={(value) => setModificationType(value as CreateModificationCommand["modificationType"])}
            >
              <SelectTrigger id="modification-type">
                <SelectValue placeholder="Wybierz typ modyfikacji" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reduce_calories">Zmniejsz kalorie</SelectItem>
                <SelectItem value="increase_calories">Zwiększ kalorie</SelectItem>
                <SelectItem value="increase_protein">Zwiększ białko</SelectItem>
                <SelectItem value="increase_fiber">Zwiększ błonnik</SelectItem>
                <SelectItem value="portion_size">Zmień wielkość porcji</SelectItem>
                <SelectItem value="ingredient_substitution">Zamień składnik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Parameter Fields */}
          {modificationType === "reduce_calories" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="target-calories-reduce" className="text-sm font-medium text-gray-700">
                  Docelowa kaloryczność (kcal)
                </label>
                <Input
                  id="target-calories-reduce"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="np. 300"
                  value={parameters.targetCalories || ""}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      targetCalories: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="text-center text-sm text-gray-500">lub</div>
              <div className="space-y-2">
                <label htmlFor="reduction-percentage" className="text-sm font-medium text-gray-700">
                  Redukcja o (%)
                </label>
                <Slider
                  id="reduction-percentage"
                  min={1}
                  max={50}
                  step={1}
                  value={[parameters.reductionPercentage || 10]}
                  onValueChange={([value]) => setParameters({ ...parameters, reductionPercentage: value })}
                />
                <div className="text-center text-sm text-gray-600">{parameters.reductionPercentage || 10}%</div>
              </div>
            </div>
          )}

          {modificationType === "increase_calories" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="target-calories-increase" className="text-sm font-medium text-gray-700">
                  Docelowa kaloryczność (kcal)
                </label>
                <Input
                  id="target-calories-increase"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="np. 600"
                  value={parameters.targetCalories || ""}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      targetCalories: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="text-center text-sm text-gray-500">lub</div>
              <div className="space-y-2">
                <label htmlFor="increase-percentage" className="text-sm font-medium text-gray-700">
                  Zwiększenie o (%)
                </label>
                <Slider
                  id="increase-percentage"
                  min={1}
                  max={100}
                  step={1}
                  value={[parameters.increasePercentage || 20]}
                  onValueChange={([value]) => setParameters({ ...parameters, increasePercentage: value })}
                />
                <div className="text-center text-sm text-gray-600">{parameters.increasePercentage || 20}%</div>
              </div>
            </div>
          )}

          {modificationType === "increase_protein" && (
            <div className="space-y-2">
              <label htmlFor="target-protein" className="text-sm font-medium text-gray-700">
                Docelowa zawartość białka (g)
              </label>
              <Input
                id="target-protein"
                type="number"
                min="1"
                max="500"
                placeholder="np. 30"
                value={parameters.targetProtein || ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    targetProtein: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>
          )}

          {modificationType === "increase_fiber" && (
            <div className="space-y-2">
              <label htmlFor="target-fiber" className="text-sm font-medium text-gray-700">
                Docelowa zawartość błonnika (g)
              </label>
              <Input
                id="target-fiber"
                type="number"
                min="1"
                max="100"
                placeholder="np. 10"
                value={parameters.targetFiber || ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    targetFiber: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>
          )}

          {modificationType === "portion_size" && (
            <div className="space-y-2">
              <label htmlFor="new-servings" className="text-sm font-medium text-gray-700">
                Nowa liczba porcji
              </label>
              <Input
                id="new-servings"
                type="number"
                min="1"
                max="100"
                placeholder="np. 4"
                value={parameters.newServings || ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    newServings: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>
          )}

          {modificationType === "ingredient_substitution" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="original-ingredient" className="text-sm font-medium text-gray-700">
                  Składnik do zamiany
                </label>
                <Input
                  id="original-ingredient"
                  type="text"
                  placeholder="np. masło"
                  value={parameters.originalIngredient || ""}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      originalIngredient: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="preferred-substitute" className="text-sm font-medium text-gray-700">
                  Preferowany zamiennik (opcjonalnie)
                </label>
                <Input
                  id="preferred-substitute"
                  type="text"
                  placeholder="np. olej kokosowy"
                  value={parameters.preferredSubstitute || ""}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      preferredSubstitute: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Modyfikowanie...
              </>
            ) : (
              "Potwierdź"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModifyWithAIModal;
