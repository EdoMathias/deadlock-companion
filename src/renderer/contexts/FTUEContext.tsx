import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { track } from '../../shared/services/analytics';

export type FTUEStep =
  | 'welcome'
  | 'live_match_header'
  | 'match_history_header'
  | 'hero_stats_header'
  | 'item_stats_header'
  | 'overlay_editor_header'
  | 'contribute_header'
  | 'profile_header'
  | 'match_history_data_contribution';

export type FTUEScreen = 'main';

/** Steps that belong to the main FTUE flow */
const MAIN_STEPS: FTUEStep[] = [
  'welcome',
  'live_match_header',
  'match_history_header',
  'hero_stats_header',
  'item_stats_header',
  'overlay_editor_header',
  'contribute_header',
  'profile_header',
];

const DATA_CONTRIBUTION_STORAGE_KEY =
  'deadlock_companion_data_contribution_seen';

const ITEM_ALERTS_FEATURE_SEEN_KEY =
  'deadlock_companion_item_alerts_feature_seen';

/** Views that belong to the item-alerts feature (for "NEW" badge logic). */
const ITEM_ALERTS_VIEWS = ['Item Stats', 'Overlay Editor'];

const HERO_STATS_FEATURE_SEEN_KEY =
  'deadlock_companion_hero_stats_feature_seen';

/** Views that belong to the hero-stats feature (for "NEW" badge logic). */
const HERO_STATS_VIEWS = ['Hero Stats'];

const COUNTER_ITEMS_FEATURE_SEEN_KEY =
  'deadlock_companion_counter_items_feature_seen';

/** Views that belong to the counter-items feature (for "NEW" badge logic). */
const COUNTER_ITEMS_VIEWS = ['Overlay Editor'];

interface FTUEContextType {
  isFTUEComplete: boolean;
  completedSteps: Set<FTUEStep>;
  markStepComplete: (step: FTUEStep) => void;
  resetFTUE: () => void;
  shouldShowStep: (step: FTUEStep) => boolean;
  /** Marks all remaining MAIN_STEPS as complete at once. */
  skipTour: () => void;
  /** No-op kept for API compatibility */
  startRotationsFTUE: () => void;
  /** No-op kept for API compatibility */
  markInteractiveMapSeen: () => void;
  /**
   * Returns true when a view has an FTUE the user hasn't seen yet.
   */
  hasUnseenFTUE: (viewName: string) => boolean;
  /** Whether the user has already dismissed the data contribution modal. */
  hasSeenDataContribution: boolean;
  /** Mark the data contribution modal as dismissed. */
  markDataContributionSeen: () => void;
  /** Dismiss the "NEW" badges for the item-alerts feature views. */
  markItemAlertsFeatureSeen: () => void;
  /** Dismiss the "NEW" badges for the hero-stats feature views. */
  markHeroStatsFeatureSeen: () => void;
  /** Dismiss the "NEW" badge for the counter-items feature views. */
  markCounterItemsFeatureSeen: () => void;
}

interface FTUEProviderProps {
  children: ReactNode;
  /** Called when FTUE is reset (e.g. from settings). Use to close settings and switch to main view. */
  onReset?: () => void;
}

const FTUEContext = createContext<FTUEContextType | undefined>(undefined);

const STORAGE_KEY = 'deadlock_companion_ftue_completed';
const STEPS_STORAGE_KEY = 'deadlock_companion_ftue_steps';
const FTUE_STARTED_TRACKED_KEY = 'deadlock_companion_ftue_started_tracked';
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

  // ── Data Contribution ─────────────────────────────────────
  const [hasSeenDataContribution, setHasSeenDataContribution] =
    useState<boolean>(() => {
      try {
        return localStorage.getItem(DATA_CONTRIBUTION_STORAGE_KEY) === 'true';
      } catch {
        return false;
      }
    });

  const markDataContributionSeen = useCallback(() => {
    setHasSeenDataContribution(true);
    try {
      localStorage.setItem(DATA_CONTRIBUTION_STORAGE_KEY, 'true');
    } catch {
      // Ignore errors
    }
  }, []);

  // ── Item-alerts feature "NEW" badge ─────────────────────
  const [hasSeenItemAlertsFeature, setHasSeenItemAlertsFeature] =
    useState<boolean>(() => {
      try {
        return localStorage.getItem(ITEM_ALERTS_FEATURE_SEEN_KEY) === 'true';
      } catch {
        return false;
      }
    });

  const markItemAlertsFeatureSeen = useCallback(() => {
    setHasSeenItemAlertsFeature(true);
    try {
      localStorage.setItem(ITEM_ALERTS_FEATURE_SEEN_KEY, 'true');
    } catch {
      // Ignore errors
    }
  }, []);

  // ── Hero-stats feature "NEW" badge ──────────────────────
  const [hasSeenHeroStatsFeature, setHasSeenHeroStatsFeature] =
    useState<boolean>(() => {
      try {
        return localStorage.getItem(HERO_STATS_FEATURE_SEEN_KEY) === 'true';
      } catch {
        return false;
      }
    });

  const markHeroStatsFeatureSeen = useCallback(() => {
    setHasSeenHeroStatsFeature(true);
    try {
      localStorage.setItem(HERO_STATS_FEATURE_SEEN_KEY, 'true');
    } catch {
      // Ignore errors
    }
  }, []);

  // ── Counter-items feature "NEW" badge ───────────────────
  const [hasSeenCounterItemsFeature, setHasSeenCounterItemsFeature] =
    useState<boolean>(() => {
      try {
        return localStorage.getItem(COUNTER_ITEMS_FEATURE_SEEN_KEY) === 'true';
      } catch {
        return false;
      }
    });

  const markCounterItemsFeatureSeen = useCallback(() => {
    setHasSeenCounterItemsFeature(true);
    try {
      localStorage.setItem(COUNTER_ITEMS_FEATURE_SEEN_KEY, 'true');
    } catch {
      // Ignore errors
    }
  }, []);

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
    track('ftue_step_viewed', { step_name: step });
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
    track('ftue_reset');
    setIsFTUEComplete(false);
    setCompletedSteps(new Set());
    setHasSeenItemAlertsFeature(false);
    setHasSeenHeroStatsFeature(false);
    setHasSeenCounterItemsFeature(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEPS_STORAGE_KEY);
      localStorage.removeItem(ROTATIONS_FTUE_STORAGE_KEY);
      localStorage.removeItem(INTERACTIVE_MAP_FTUE_STORAGE_KEY);
      localStorage.removeItem(DATA_CONTRIBUTION_STORAGE_KEY);
      localStorage.removeItem(ITEM_ALERTS_FEATURE_SEEN_KEY);
      localStorage.removeItem(HERO_STATS_FEATURE_SEEN_KEY);
      localStorage.removeItem(COUNTER_ITEMS_FEATURE_SEEN_KEY);
      localStorage.removeItem(FTUE_STARTED_TRACKED_KEY);
    } catch {
      // Ignore errors
    }
    onReset?.();
  };

  // ── Completion helpers ────────────────────────────────────
  const completeMainFTUE = () => {
    track('ftue_completed');
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

  const skipTour = useCallback(() => {
    track('ftue_skipped');
    setCompletedSteps(() => {
      const newSet = new Set<FTUEStep>(MAIN_STEPS);
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
  }, []);

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
   * For existing users who already completed the tour, show "NEW" badges
   * on views that belong to a newly-released feature.
   */
  const hasUnseenFTUE = useCallback(
    (viewName: string): boolean => {
      if (!isFTUEComplete) return false;
      if (
        !hasSeenItemAlertsFeature &&
        ITEM_ALERTS_VIEWS.includes(viewName)
      ) {
        return true;
      }
      if (
        !hasSeenHeroStatsFeature &&
        HERO_STATS_VIEWS.includes(viewName)
      ) {
        return true;
      }
      if (
        !hasSeenCounterItemsFeature &&
        COUNTER_ITEMS_VIEWS.includes(viewName)
      ) {
        return true;
      }
      return false;
    },
    [
      isFTUEComplete,
      hasSeenItemAlertsFeature,
      hasSeenHeroStatsFeature,
      hasSeenCounterItemsFeature,
    ],
  );

  // ── Fire ftue_started once for a new user (onboarding funnel entry) ──
  useEffect(() => {
    if (isFTUEComplete) return;
    try {
      if (localStorage.getItem(FTUE_STARTED_TRACKED_KEY)) return;
      localStorage.setItem(FTUE_STARTED_TRACKED_KEY, 'true');
    } catch {
      // Ignore errors
    }
    track('ftue_started');
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        skipTour,
        startRotationsFTUE,
        markInteractiveMapSeen,
        hasUnseenFTUE,
        hasSeenDataContribution,
        markDataContributionSeen,
        markItemAlertsFeatureSeen,
        markHeroStatsFeatureSeen,
        markCounterItemsFeatureSeen,
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
