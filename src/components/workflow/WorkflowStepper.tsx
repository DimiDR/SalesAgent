'use client';

import { Check, Circle, ChevronRight } from 'lucide-react';
import { WORKFLOW_STEPS, WorkflowStep, WorkflowStatus } from '@/types';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  stepStatuses: Record<WorkflowStep, WorkflowStatus>;
  onStepClick?: (step: WorkflowStep) => void;
}

export default function WorkflowStepper({
  currentStep,
  stepStatuses,
  onStepClick,
}: WorkflowStepperProps) {
  const getStepIndex = (step: WorkflowStep) =>
    WORKFLOW_STEPS.findIndex((s) => s.step === step);

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = stepStatuses[step.step];
          const isActive = step.step === currentStep;
          const isPast = index < currentIndex;
          const isCompleted = status?.status === 'completed';

          return (
            <div key={step.step} className="flex items-center flex-1">
              <button
                onClick={() => onStepClick?.(step.step)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all w-full
                  ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${onStepClick ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {/* Step indicator */}
                <div
                  className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-blue-200 text-blue-600'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step info */}
                <div className="text-left min-w-0">
                  <p
                    className={`
                      text-sm font-medium truncate
                      ${
                        isActive
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-green-600'
                          : 'text-gray-700'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {status?.status === 'completed'
                      ? 'Abgeschlossen'
                      : status?.status === 'in_progress'
                      ? 'In Bearbeitung'
                      : 'Ausstehend'}
                  </p>
                </div>
              </button>

              {/* Connector */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-2">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = stepStatuses[step.step];
          const isActive = step.step === currentStep;
          const isCompleted = status?.status === 'completed';

          return (
            <button
              key={step.step}
              onClick={() => onStepClick?.(step.step)}
              className={`
                flex items-center gap-3 p-3 rounded-lg w-full transition-all
                ${isActive ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'}
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <p
                  className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {index + 1}. {step.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
