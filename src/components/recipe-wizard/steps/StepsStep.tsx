import { Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { RecipeStepDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface StepsStepProps {
  data: RecipeStepDTO[];
  stepsEnabled: boolean;
  errors: {
    steps?: string;
    stepFields?: {
      instruction?: string;
    }[];
  };
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
  onToggleEnabled: (enabled: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const StepsStep = ({ data, stepsEnabled, errors, onAdd, onRemove, onChange, onToggleEnabled }: StepsStepProps) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Kroki przygotowania</h2>
        <p className="text-sm text-gray-600">Dodaj opcjonalne kroki przygotowania przepisu</p>
      </div>

      {/* Toggle Checkbox */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Checkbox
          id="steps-enabled"
          checked={stepsEnabled}
          onCheckedChange={(checked) => onToggleEnabled(checked === true)}
        />
        <Label htmlFor="steps-enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
          Dodaj kroki przygotowania
        </Label>
      </div>

      {/* Conditional Content Based on Toggle */}
      {stepsEnabled && (
        <>
          {/* General Error Message */}
          {errors.steps && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600" role="alert">
                {errors.steps}
              </p>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-4">
            {data.map((step, index) => {
              const fieldErrors = errors.stepFields?.[index];

              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  {/* Step Header with Number and Remove Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-semibold text-sm">
                        {step.stepNumber}
                      </div>
                      <h3 className="text-sm font-medium text-gray-700">Krok {step.stepNumber}</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(index)}
                      disabled={data.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      aria-label={`Usuń krok ${step.stepNumber}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Step Instruction */}
                  <div className="space-y-2">
                    <Label htmlFor={`step-instruction-${index}`} className="text-xs text-gray-600">
                      Instrukcja <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`step-instruction-${index}`}
                      placeholder="Opisz dokładnie, co należy zrobić w tym kroku..."
                      value={step.instruction}
                      onChange={(e) => onChange(index, e.target.value)}
                      aria-invalid={!!fieldErrors?.instruction}
                      aria-describedby={fieldErrors?.instruction ? `step-instruction-error-${index}` : undefined}
                      className={fieldErrors?.instruction ? "border-red-500" : ""}
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between">
                      {fieldErrors?.instruction && (
                        <p id={`step-instruction-error-${index}`} className="text-xs text-red-600" role="alert">
                          {fieldErrors.instruction}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 ml-auto">{step.instruction.length}/2000</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Step Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onAdd}
            className="w-full border-dashed border-2 hover:border-green-600 hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj krok
          </Button>

          {/* Helper Text */}
          <div className="pt-2 space-y-1">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Wszystkie kroki są wymagane. Wymagany jest co najmniej jeden krok.
            </p>
            <p className="text-xs text-gray-500">
              Numeracja kroków jest automatyczna. Po usunięciu kroku, pozostałe kroki zostaną automatycznie
              przenumerowane.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StepsStep;
