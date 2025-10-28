import { Progress } from "@/components/ui/progress";
import type { RecipeFormStep } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface ProgressIndicatorProps {
  currentStep: RecipeFormStep;
  totalSteps: number;
  mode?: "create" | "edit";
  onStepClick?: (step: RecipeFormStep) => void;
}

// ============================================================================
// STEP LABELS
// ============================================================================

const STEP_LABELS: Record<RecipeFormStep, string> = {
  1: "Podstawowe informacje",
  2: "Składniki",
  3: "Kroki przygotowania",
  4: "Wartości odżywcze",
  5: "Kategorie",
  6: "Podsumowanie",
};

// ============================================================================
// COMPONENT
// ============================================================================

const ProgressIndicator = ({ currentStep, totalSteps, mode = "create", onStepClick }: ProgressIndicatorProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  const isClickable = mode === "edit" && onStepClick;

  return (
    <div className="space-y-4">
      {/* Step Counter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Krok {currentStep} z {totalSteps}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">{STEP_LABELS[currentStep]}</p>
        </div>
        <span className="text-xs font-semibold text-green-600">{Math.round(progressPercentage)}%</span>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPercentage} className="h-2" />

      {/* Desktop: Breadcrumb-style step labels */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-2">
          {(Object.keys(STEP_LABELS) as unknown as RecipeFormStep[]).map((step) => {
            const stepNum = Number(step) as RecipeFormStep;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div
                key={stepNum}
                className="flex flex-col items-center"
                onClick={() => isClickable && onStepClick(stepNum)}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onStepClick(stepNum);
                  }
                }}
                aria-label={isClickable ? `Przejdź do kroku ${stepNum}: ${STEP_LABELS[stepNum]}` : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-all ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isCurrent
                        ? "bg-green-100 text-green-600 border-2 border-green-600"
                        : "bg-gray-100 text-gray-400"
                  } ${isClickable ? "cursor-pointer hover:ring-2 hover:ring-green-300 hover:ring-offset-2" : ""}`}
                >
                  {stepNum}
                </div>
                <span
                  className={`text-xs text-center transition-colors ${
                    isCurrent ? "text-gray-900 font-medium" : "text-gray-500"
                  } ${isClickable ? "cursor-pointer" : ""}`}
                >
                  {STEP_LABELS[stepNum]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
