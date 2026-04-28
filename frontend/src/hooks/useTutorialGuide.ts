import { useEffect, useMemo, useState } from "react";
import type {
  TutorialContext,
  TutorialStep,
} from "../components/tutorial/tutorialSteps";

interface UseTutorialGuideArgs {
  steps: TutorialStep[];
  context: TutorialContext;
}

export function useTutorialGuide({ steps, context }: UseTutorialGuideArgs) {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [maxVisitedStepIndex, setMaxVisitedStepIndex] = useState(0);

  const currentStep = steps[stepIndex] ?? null;

  const isCurrentStepComplete = useMemo(() => {
    if (!currentStep) return false;
    if (!currentStep.isComplete) return true;
    return currentStep.isComplete(context);
  }, [context, currentStep]);

  useEffect(() => {
    if (!isActive) return;
    setMaxVisitedStepIndex((previous) => Math.max(previous, stepIndex));
  }, [isActive, stepIndex]);

  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (!currentStep.isComplete) return;
    if (!currentStep.isComplete(context)) return;
    if (currentStep.allowManualAdvance) return;
    const isRevisit = stepIndex < maxVisitedStepIndex;
    if (isRevisit && !currentStep.autoAdvanceOnRevisit) return;
    setStepIndex((previous) => {
      if (previous >= steps.length - 1) return previous;
      return previous + 1;
    });
  }, [
    context,
    currentStep,
    isActive,
    maxVisitedStepIndex,
    stepIndex,
    steps.length,
  ]);

  const start = () => {
    setIsActive(true);
    setIsFinished(false);
    setStepIndex(0);
    setMaxVisitedStepIndex(0);
  };

  const stop = () => {
    setIsActive(false);
  };

  const next = () => {
    if (!currentStep) return;
    if (!isCurrentStepComplete && !currentStep.allowManualAdvance) return;
    setStepIndex((previous) => {
      const isLast = previous >= steps.length - 1;
      if (isLast) {
        setIsFinished(true);
        setIsActive(false);
        return previous;
      }
      return previous + 1;
    });
  };

  const back = () => {
    setStepIndex((previous) => Math.max(0, previous - 1));
  };

  const skip = () => {
    setIsActive(false);
    setIsFinished(true);
  };

  const canGoBack = stepIndex > 0;
  const canGoNext =
    Boolean(currentStep) &&
    (Boolean(currentStep?.allowManualAdvance) || isCurrentStepComplete);

  return {
    isActive,
    isFinished,
    stepIndex,
    totalSteps: steps.length,
    currentStep,
    isCurrentStepComplete,
    canGoBack,
    canGoNext,
    start,
    stop,
    next,
    back,
    skip,
  };
}

