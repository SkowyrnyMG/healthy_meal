import type { PreparationStepsProps } from "@/components/recipes/types";

/**
 * PreparationSteps component displays numbered preparation steps
 * Uses ordered list with CSS auto-numbering
 */
const PreparationSteps = ({ steps }: PreparationStepsProps) => {
  // Sort steps by stepNumber to ensure correct order
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Przygotowanie</h2>

      {sortedSteps.length > 0 ? (
        <ol className="space-y-4 list-none counter-reset-steps">
          {sortedSteps.map((step) => (
            <li key={step.stepNumber} className="relative pl-10">
              {/* Step Number */}
              <div className="absolute left-0 top-0 flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">
                {step.stepNumber}
              </div>

              {/* Step Instruction */}
              <p className="text-gray-700 leading-relaxed">{step.instruction}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-gray-500 italic">Brak kroków przygotowania</p>
      )}
    </div>
  );
};

export default PreparationSteps;
