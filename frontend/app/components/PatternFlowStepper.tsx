"use client";

import { CheckIcon } from "@heroicons/react/24/solid";

interface Step {
  id: string;
  label: string;
}

interface PatternFlowStepperProps {
  currentStep: number; // 0-indexed: 0=Bilde, 1=Stil, 2=Størrelse, 3=Bestill
}

const steps: Step[] = [
  { id: "bilde", label: "Bilde" },
  { id: "stil", label: "Stil" },
  { id: "storrelse", label: "Størrelse" },
  { id: "bestill", label: "Bestill" },
];

export default function PatternFlowStepper({ currentStep }: PatternFlowStepperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Container with steps */}
      <div className="flex justify-between items-start relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLastStep = index === steps.length - 1;

          return (
            <div key={step.id} className="flex flex-col items-center relative flex-1">
              {/* Circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 relative z-10 ${
                  isCompleted
                    ? "bg-dark-purple"
                    : isCurrent
                    ? "bg-dark-purple"
                    : "bg-transparent border-2 border-[#C4B5C7]"
                }`}
              >
                {isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
              </div>

              {/* Connecting line */}
              {!isLastStep && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-0.5 -z-0 px-12 ${
                    isCompleted ? "bg-dark-purple" : "bg-[#C4B5C7]"
                  }`}
                />
              )}

              <span
                className={`mt-2 text-xs sm:text-sm font-medium text-center whitespace-nowrap ${
                  isCompleted || isCurrent ? "text-[#6B4E71]" : "text-[#C4B5C7]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
