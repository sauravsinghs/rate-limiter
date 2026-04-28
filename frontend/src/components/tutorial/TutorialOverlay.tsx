import { useEffect, useMemo, useRef, useState } from "react";
import type { TutorialStep } from "./tutorialSteps";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  open: boolean;
  step: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isStepComplete: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getOverlapArea(a: Box, b: Box): number {
  const ax2 = a.left + a.width;
  const ay2 = a.top + a.height;
  const bx2 = b.left + b.width;
  const by2 = b.top + b.height;
  const overlapWidth = Math.max(0, Math.min(ax2, bx2) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(ay2, by2) - Math.max(a.top, b.top));
  return overlapWidth * overlapHeight;
}

function toBox(rect: DOMRect): Box {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export default function TutorialOverlay({
  open,
  step,
  stepIndex,
  totalSteps,
  canGoBack,
  canGoNext,
  isStepComplete,
  onBack,
  onNext,
  onSkip,
}: TutorialOverlayProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !step) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(step.targetSelector);
      if (!element) {
        setRect(null);
        return;
      }
      const bounds = element.getBoundingClientRect();
      setRect({
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      });
    };

    const queueUpdateRect = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        updateRect();
        rafRef.current = null;
      });
    };

    const waitForScrollSettle = async (element: Element) => {
      const maxFrames = 40;
      const epsilon = 0.75;
      let previous = element.getBoundingClientRect();
      let stableFrames = 0;
      for (let frame = 0; frame < maxFrames; frame += 1) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
        const current = element.getBoundingClientRect();
        const delta =
          Math.abs(current.top - previous.top) +
          Math.abs(current.left - previous.left);
        if (delta < epsilon) {
          stableFrames += 1;
          if (stableFrames >= 3) return;
        } else {
          stableFrames = 0;
        }
        previous = current;
      }
    };

    const syncToTarget = async () => {
      const element = document.querySelector(step.targetSelector);
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      const safeTop = 80;
      const safeBottom = window.innerHeight - 140;
      const needsScroll = bounds.top < safeTop || bounds.bottom > safeBottom;
      if (needsScroll) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        await waitForScrollSettle(element);
      }
      updateRect();
    };

    void syncToTarget();
    window.addEventListener("resize", queueUpdateRect);
    window.addEventListener("scroll", queueUpdateRect, true);
    return () => {
      window.removeEventListener("resize", queueUpdateRect);
      window.removeEventListener("scroll", queueUpdateRect, true);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [open, step]);

  const cardStyle = useMemo(() => {
    if (!rect) return undefined;
    const spacing = 14;
    const viewportPadding = 12;
    const cardHeight = cardRef.current?.offsetHeight ?? 300;

    const clampTop = (top: number) =>
      clamp(top, viewportPadding, window.innerHeight - cardHeight - viewportPadding);
    const clampLeft = (left: number, width: number) =>
      clamp(left, viewportPadding, window.innerWidth - width - viewportPadding);

    const controlsElement = document.querySelector(
      '[data-tutorial="simulation-controls"]',
    );
    const controlsRect = controlsElement?.getBoundingClientRect() ?? null;
    const controlsBox = controlsRect ? toBox(controlsRect) : null;
    const targetBox: Box = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    const buildCandidates = (width: number): Box[] => [
      {
        top: clampTop(rect.top + rect.height + spacing),
        left: clampLeft(rect.left, width),
        width,
        height: cardHeight,
      },
      {
        top: clampTop(rect.top - cardHeight - spacing),
        left: clampLeft(rect.left, width),
        width,
        height: cardHeight,
      },
      {
        top: clampTop(rect.top),
        left: clampLeft(rect.left + rect.width + spacing, width),
        width,
        height: cardHeight,
      },
      {
        top: clampTop(rect.top),
        left: clampLeft(rect.left - width - spacing, width),
        width,
        height: cardHeight,
      },
      // Fallback corners for constrained viewports
      {
        top: viewportPadding,
        left: viewportPadding,
        width,
        height: cardHeight,
      },
      {
        top: viewportPadding,
        left: clampLeft(window.innerWidth - width - viewportPadding, width),
        width,
        height: cardHeight,
      },
      {
        top: clampTop(window.innerHeight - cardHeight - viewportPadding),
        left: viewportPadding,
        width,
        height: cardHeight,
      },
      {
        top: clampTop(window.innerHeight - cardHeight - viewportPadding),
        left: clampLeft(window.innerWidth - width - viewportPadding, width),
        width,
        height: cardHeight,
      },
    ];

    const widthsToTry = [
      Math.min(340, window.innerWidth - 24),
      Math.min(300, window.innerWidth - 24),
      Math.min(260, window.innerWidth - 24),
    ].filter((width, index, list) => width > 180 && list.indexOf(width) === index);

    let bestCandidate: Box | null = null;
    let bestWidth = widthsToTry[0] ?? Math.min(340, window.innerWidth - 24);

    for (const width of widthsToTry) {
      const candidates = buildCandidates(width);
      const ranked = candidates
        .map((candidate) => {
          const overlapWithTarget = getOverlapArea(candidate, targetBox);
          const overlapWithControls = controlsBox
            ? getOverlapArea(candidate, controlsBox)
            : 0;
          return {
            candidate,
            overlapWithTarget,
            overlapWithControls,
          };
        })
        .sort((a, b) => {
          if (a.overlapWithTarget !== b.overlapWithTarget) {
            return a.overlapWithTarget - b.overlapWithTarget;
          }
          return a.overlapWithControls - b.overlapWithControls;
        });

      const noTargetOverlap = ranked.find((entry) => entry.overlapWithTarget === 0);
      if (noTargetOverlap) {
        bestCandidate = noTargetOverlap.candidate;
        bestWidth = width;
        break;
      }

      if (!bestCandidate && ranked[0]) {
        bestCandidate = ranked[0].candidate;
        bestWidth = width;
      }
    }

    const best = bestCandidate ?? {
      top: clampTop(rect.top + rect.height + spacing),
      left: clampLeft(rect.left, bestWidth),
      width: bestWidth,
      height: cardHeight,
    };
    return {
      top: `${best.top}px`,
      left: `${best.left}px`,
      width: `${bestWidth}px`,
    };
  }, [rect]);

  if (!open || !step) return null;

  return (
    <div className="tutorial-layer" aria-live="polite">
      <div className="tutorial-backdrop" />
      {rect && (
        <div
          className="tutorial-highlight"
          style={{
            top: `${rect.top - 6}px`,
            left: `${rect.left - 6}px`,
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
          }}
        />
      )}

      <aside ref={cardRef} className="tutorial-card card" style={cardStyle}>
        <div className="tutorial-card-head">
          <span className="tutorial-chip">
            Step {stepIndex + 1} / {totalSteps}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onSkip}
          >
            Exit
          </button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        {step.requirement && (
          <p
            className={`tutorial-requirement ${isStepComplete ? "is-complete" : ""}`}
          >
            {isStepComplete ? "Done: " : "Required: "}
            {step.requirement}
          </p>
        )}
        <div className="tutorial-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
            disabled={!canGoBack}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNext}
            disabled={!canGoNext}
          >
            {stepIndex + 1 >= totalSteps ? "Finish" : "Next"}
          </button>
        </div>
      </aside>
    </div>
  );
}

