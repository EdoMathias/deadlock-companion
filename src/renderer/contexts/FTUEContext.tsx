import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type FTUEStep =
  | 'welcome'
  | 'live_match_header'
  | 'match_history_header'
  | 'profile_header';

export type FTUEScreen = 'main';

/** Steps that belong to the main FTUE flow */
const MAIN_STEPS: FTUEStep[] = [
  'welcome',
  'live_match_header',
  'match_history_header',
  'profile_header',
];

interface FTUEContextType {
  isFTUEComplete: boolean;
  completedSteps: Set<FTUEStep>;
  markStepComplete: (step: FTUEStep) => void;
  resetFTUE: () => void;
  shouldShowStep: (step: FTUEStep) => boolean;
  /** No-op kept for API compatibility */
  startRotationsFTUE: () => void;
  /** No-op kept for API compatibility */
  markInteractiveMapSeen: () => void;
  /**
   * Returns true when a view has an FTUE the user hasn't seen yet.
   */
  hasUnseenFTUE: (viewName: string) => boolean;
}

interface FTUEProviderProps {
  children: ReactNode;
  /** Called when FTUE is reset (e.g. from settings). Use to close settings and switch to main view. */
  onReset?: () => void;
}

const FTUEContext = createContext<FTUEContextType | undefined>(undefined);

const STORAGE_KEY = 'deadlock_companion_ftue_completed';
const STEPS_STORAGE_KEY = 'deadlock_companion_ftue_steps';
const ROTATIONS_FTUE_STORAGE_KEY =
  'deadlock_companion_rotations_ftue_completed';
const INTERACTIVE_MAP_FTUE_STORAGE_KEY =
  'deadlock_companion_interactive_map_ftue_completed';

export const FTUEProvider: React.FC<FTUEProviderProps> = ({
  children,
  onReset,
}) => {
  // ── Main FTUE ──────────────────────────────────────────────
  const [isFTUEComplete, setIsFTUEComplete] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // ── Rotations FTUE ────────────────────────────────────────
  const [isRotationsFTUEComplete] = useState<boolean>(true);

  // ── Interactive Map FTUE ──────────────────────────────────
  const [isInteractiveMapFTUEComplete] = useState<boolean>(true);

  /** Runtime flag – kept for compatibility. */
  const [isRotationsFTUEActive] = useState(false);

  // ── Shared completed-steps set ────────────────────────────
  const [completedSteps, setCompletedSteps] = useState<Set<FTUEStep>>(() => {
    try {
      const stored = localStorage.getItem(STEPS_STORAGE_KEY);
      if (stored) {
        const steps = JSON.parse(stored) as FTUEStep[];
        return new Set(steps);
      }
    } catch {
      // Ignore errors
    }
    return new Set<FTUEStep>();
  });

  const markStepComplete = (step: FTUEStep) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.add(step);

      try {
        localStorage.setItem(
          STEPS_STORAGE_KEY,
          JSON.stringify(Array.from(newSet)),
        );
      } catch {
        // Ignore errors
      }

      return newSet;
    });
  };

  const resetFTUE = () => {
    setIsFTUEComplete(false);
    setCompletedSteps(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEPS_STORAGE_KEY);
      localStorage.removeItem(ROTATIONS_FTUE_STORAGE_KEY);
      localStorage.removeItem(INTERACTIVE_MAP_FTUE_STORAGE_KEY);
    } catch {
      // Ignore errors
    }
    onReset?.();
  };

  // ── Completion helpers ────────────────────────────────────
  const completeMainFTUE = () => {
    setIsFTUEComplete(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore errors
    }
  };

  const completeRotationsFTUE = () => {
    // No-op: Rotations FTUE disabled for Deadlock Companion
  };

  const completeInteractiveMapFTUE = () => {
    // No-op: Interactive Map FTUE disabled for Deadlock Companion
  };

  // ── Step sequencing ───────────────────────────────────────
  const shouldShowStep = useCallback(
    (step: FTUEStep): boolean => {
      if (completedSteps.has(step)) return false;
      if (isFTUEComplete) return false;
      const nextMainStep = MAIN_STEPS.find((s) => !completedSteps.has(s));
      return nextMainStep === step;
    },
    [completedSteps, isFTUEComplete],
  );

  /** No-op kept for API compatibility. */
  const startRotationsFTUE = useCallback(() => {}, []);

  /** No-op kept for API compatibility. */
  const markInteractiveMapSeen = useCallback(() => {}, []);

  /**
   * Generic check: does this view have an unseen FTUE?
   * Add a case for each new feature that has its own FTUE flow.
   */
  const hasUnseenFTUE = useCallback((_viewName: string): boolean => {
    return false;
  }, []);

  // ── Auto-complete when all steps in a group are done ──────
  useEffect(() => {
    const allMainComplete = MAIN_STEPS.every((step) =>
      completedSteps.has(step),
    );
    if (allMainComplete && !isFTUEComplete) {
      completeMainFTUE();
    }
  }, [completedSteps, isFTUEComplete]);

  return (
    <FTUEContext.Provider
      value={{
        isFTUEComplete,
        completedSteps,
        markStepComplete,
        resetFTUE,
        shouldShowStep,
        startRotationsFTUE,
        markInteractiveMapSeen,
        hasUnseenFTUE,
      }}
    >
      {children}
    </FTUEContext.Provider>
  );
};

export const useFTUE = (): FTUEContextType => {
  const context = useContext(FTUEContext);
  if (!context) {
    throw new Error('useFTUE must be used within FTUEProvider');
  }
  return context;
};
