# 04 — First-Time User Experience (FTUE)

This doc describes the onboarding system: how the welcome modal, sequenced tooltips, "NEW" feature badges, and post-FTUE educational modals (data contribution) cooperate.

Read [`AGENTS.md`](../AGENTS.md), [`docs/02-ui-and-design-system.md`](02-ui-and-design-system.md), and [`docs/03-views-and-navigation.md`](03-views-and-navigation.md) first.

---

## 1. Goals

The FTUE has three phases, in order:

1. **Welcome** — a single modal on first launch (`FTUEWelcomeModal`) that introduces the app, shows the hotkeys, and offers a "Skip tour" escape hatch.
2. **Tour** — a sequence of `FTUETooltip`s, one per main-window tab, that highlights each tab in the SideNav and briefly explains what it does. When the user clicks "Got it" the tooltip dismisses and (by convention) navigates to that tab so they see what the tab does.
3. **Post-FTUE nudges** — after onboarding completes, certain surfaces show one-time educational modals (`DataContributionModal` on first match-history visit) and "NEW" badges on tabs introduced after a user already finished the tour (`hasUnseenFTUE`).

All FTUE state is owned by [`FTUEContext`](../src/renderer/contexts/FTUEContext.tsx). UI components never read `localStorage` keys directly.

---

## 2. The provider

```tsx
import { FTUEProvider } from './contexts/FTUEContext';

const Main: React.FC = () => (
  <FTUEProvider onReset={() => { /* close settings, switch to default view */ }}>
    <MainInner />
  </FTUEProvider>
);
```

`FTUEProvider` props:

| Prop | Required | Purpose |
|---|---|---|
| `children` | yes | The window's React tree |
| `onReset` | no | Called when `resetFTUE()` runs from Settings — close Settings, return to default tab, collapse SideNav |

Consumers use the hook:

```ts
const {
  isFTUEComplete,
  shouldShowStep,
  markStepComplete,
  skipTour,
  hasUnseenFTUE,
  markItemAlertsFeatureSeen,
  hasSeenDataContribution,
  markDataContributionSeen,
} = useFTUE();
```

`useFTUE()` throws if used outside the provider.

---

## 3. Step model

Step ids are typed:

```ts
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
```

Steps that participate in the main tour are listed (in display order) in `MAIN_STEPS`:

```ts
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
```

The provider sequences them with a single rule:

```ts
shouldShowStep(step) =
     !completedSteps.has(step)
  && !isFTUEComplete
  && MAIN_STEPS.find(s => !completedSteps.has(s)) === step
```

Translation: **at most one main-step UI is visible at a time, and it's always the first one not yet completed.** This guarantees the welcome modal renders alone, then each tooltip renders alone in order.

When every entry in `MAIN_STEPS` is in `completedSteps`, a `useEffect` flips `isFTUEComplete = true` and writes `localStorage`.

`skipTour()` writes all `MAIN_STEPS` into `completedSteps` at once, which immediately satisfies that effect.

---

## 4. Storage keys

These keys are **part of the contract** with users — never rename them, and never read/write them outside of `FTUEContext`:

| Key | Type | Meaning |
|---|---|---|
| `deadlock_companion_ftue_completed` | `'true' \| absent` | Main FTUE complete (welcome + every tooltip) |
| `deadlock_companion_ftue_steps` | JSON `FTUEStep[]` | Set of completed step ids (used to compute `shouldShowStep`) |
| `deadlock_companion_data_contribution_seen` | `'true' \| absent` | User has dismissed `DataContributionModal` |
| `deadlock_companion_item_alerts_feature_seen` | `'true' \| absent` | User has visited `Item Stats` or `Overlay Editor` post-FTUE — clears the "NEW" badge |
| `deadlock_companion_hero_stats_feature_seen` | `'true' \| absent` | User has visited `Hero Stats` post-FTUE — clears the "NEW" badge |
| `deadlock_companion_rotations_ftue_completed` | `'true' \| absent` | Legacy — cleared by `resetFTUE()`, otherwise unused |
| `deadlock_companion_interactive_map_ftue_completed` | `'true' \| absent` | Legacy — cleared by `resetFTUE()`, otherwise unused |

`resetFTUE()` removes all seven. Add any new FTUE-related keys to the cleanup list.

---

## 5. The Welcome modal

[`FTUEWelcomeModal`](../src/renderer/components/FTUEWelcomeModal.tsx) renders only when `shouldShowStep('welcome')` is true. It mounts via `createPortal(node, document.body)` so it sits above everything else regardless of where it is rendered in the tree.

On confirm, it calls `markStepComplete('welcome')`, which immediately satisfies the next step in `MAIN_STEPS` (`live_match_header`) and the first tour tooltip appears.

It also reads the live hotkey bindings via `HotkeysAPI.fetchAll()` — the same API the SideNav uses — so the displayed combos match Settings.

---

## 6. The tour tooltips

Each tour tooltip is a `<FTUETooltip>` rendered inside `Main.tsx` once per nav item. The contract:

```tsx
<FTUETooltip
  step="match_history_header"
  title="Match History"
  message="Browse your recent Deadlock matches."
  targetSelector="[data-ftue-target='Match History']"
  onDismiss={() => {
    window.dispatchEvent(
      new CustomEvent('navigate-view', { detail: 'Match History' }),
    );
  }}
  showSkip
  onSkipAll={() => skipTour()}
/>
```

Behavior:

- The component checks `shouldShowStep(step)` internally — if false, it returns `null`. You don't need to gate it manually.
- `targetSelector` is queried with `document.querySelector`. The selector convention is `[data-ftue-target='<View Name>']` — the SideNav already sets `data-ftue-target={view.name}` on each `SideNavButton`, so as long as the view is in `viewsConfig` the selector resolves automatically.
- It mounts a portal with a darkened backdrop, computes a "spotlight" rectangle around the target, and positions the tooltip relative to it.
- "Got it", clicking outside, and "Skip" all call `markStepComplete(step)`. "Skip" additionally calls `onSkipAll` if provided (which calls `skipTour()` in our usage).
- `onDismiss` runs after `markStepComplete`. Use it to navigate to the highlighted tab so the user lands where the tooltip pointed.

---

## 7. Post-FTUE: "NEW" badges

When a tab is added after a user has already completed the tour (e.g. `Item Stats` and `Overlay Editor` shipped after the original tour), they get a small "NEW" pip on the SideNav until they open it.

The mechanism:

```ts
// in SideNav, generic for any view
const showBadge = isFTUEComplete && hasUnseenFTUE(view.name);
```

`hasUnseenFTUE(viewName)` returns `true` iff the user has finished the tour and at least one feature flag says the matching view is still "new". Each feature has its own views list and own flag:

```ts
const ITEM_ALERTS_VIEWS = ['Item Stats', 'Overlay Editor'];
const HERO_STATS_VIEWS = ['Hero Stats'];
```

When the user opens either item-alerts view, `Main.tsx` calls `markItemAlertsFeatureSeen()`, which writes `deadlock_companion_item_alerts_feature_seen` and clears that badge. Opening `Hero Stats` calls `markHeroStatsFeatureSeen()`, which writes `deadlock_companion_hero_stats_feature_seen` and clears the Hero Stats badge.

To introduce a new "NEW" feature for existing users:

1. Pick a feature key (e.g. `MATCH_FILTERS_FEATURE_SEEN_KEY = 'deadlock_companion_match_filters_feature_seen'`).
2. Define `MATCH_FILTERS_VIEWS = ['Match History']` (or whichever views).
3. Add a `hasSeenMatchFilters` state, persisted in `localStorage`, mirroring the item-alerts pattern.
4. Extend `hasUnseenFTUE` to OR-in the new flag.
5. Expose `markMatchFiltersFeatureSeen` from the context.
6. In `Main.tsx`, call it when `activeView` matches the new feature views.
7. Add the new key to the `resetFTUE()` cleanup list.

This pattern intentionally avoids a generic per-view "NEW" registry — keep features explicit so the FTUE context stays the auditable source of truth.

---

## 8. Post-FTUE: educational modals

`DataContributionModal` is shown the first time the user has a Steam ID and lands on `Match History` after FTUE is complete. The pattern, summarised from `MatchHistoryView`:

```ts
const { isFTUEComplete, hasSeenDataContribution, markDataContributionSeen } = useFTUE();

useEffect(() => {
  if (!isFTUEComplete) return;
  if (hasSeenDataContribution) return;
  if (!steamId) return;
  setShowContributionModal(true);
}, [isFTUEComplete, hasSeenDataContribution, steamId]);

// On modal close: markDataContributionSeen()
```

Use the same shape for any new one-shot educational modal:

1. Add a boolean state + storage key to `FTUEContext`.
2. Expose `hasSeen…` and `mark…Seen` on the context.
3. In the consuming view, gate the modal on `isFTUEComplete && !hasSeen…` plus any prerequisites.
4. Mark seen on close.

---

## 9. Adding a new tour step

Suppose you added a new `Builds` tab and want the tour to introduce it.

1. **Extend the step type** in [`FTUEContext.tsx`](../src/renderer/contexts/FTUEContext.tsx):

   ```ts
   export type FTUEStep =
     | 'welcome'
     | 'live_match_header'
     | 'match_history_header'
     | 'item_stats_header'
     | 'overlay_editor_header'
     | 'contribute_header'
     | 'profile_header'
     | 'builds_header'
     | 'match_history_data_contribution';
   ```

2. **Insert it into `MAIN_STEPS`** in the position that matches the SideNav order. The default tab (`Live Match`) usually goes first; the rest mirror `viewsConfig`.

3. **Add the SideNav target.** Already automatic — the SideNav sets `data-ftue-target={view.name}` on every `SideNavButton`, so as long as the `Builds` view is registered in `viewsConfig`, `[data-ftue-target='Builds']` is queryable.

4. **Render a `FTUETooltip` in `Main.tsx`**, in `MAIN_STEPS` order, after the existing tooltips:

   ```tsx
   <FTUETooltip
     step="builds_header"
     title="Builds"
     message="Browse community-made builds and item recommendations."
     targetSelector="[data-ftue-target='Builds']"
     onDismiss={() => window.dispatchEvent(
       new CustomEvent('navigate-view', { detail: 'Builds' }),
     )}
     showSkip
     onSkipAll={() => skipTour()}
   />
   ```

5. **No new storage key is needed** for a tour step — the unified `deadlock_companion_ftue_steps` array already tracks it. Existing users who finished the old tour will have `isFTUEComplete = true`, so the new tooltip will not appear retroactively. If you want them to see the new tab, use a "NEW" badge instead (section 7) — do not retroactively re-open the tour.

---

## 10. Things to avoid

- Reading `localStorage.getItem('deadlock_companion_ftue_*')` outside of `FTUEContext`. The provider is the only legal owner.
- Rendering an FTUE step UI without checking `shouldShowStep(step)`. Two FTUE pieces visible at once is a bug.
- Renaming a `FTUEStep` value. Old users have the old string in their `deadlock_companion_ftue_steps`; renaming silently re-shows them the step. If you must, also remove the old key in `resetFTUE` AND in a one-shot migration block.
- Calling `markStepComplete` from a side effect that fires multiple times. Once per UI dismissal.
- Using ads, analytics, or network calls during the tour. `AdContainer` is already gated on `isFTUEComplete`; mirror that pattern for any other ambient UI.
- Putting tour copy into a translation system. The app currently ships in English only — keep strings inline until i18n is introduced project-wide.

---

## 11. Where to look next

- Where these modals get themed → [`02-ui-and-design-system.md`](02-ui-and-design-system.md) (`ftue-` prefix, `.modal-overlay` family)
- How a tab name flows from `viewsConfig` to `data-ftue-target` → [`03-views-and-navigation.md`](03-views-and-navigation.md)
- End-to-end "add a tab + a tour step" → [`08-adding-a-feature.md`](08-adding-a-feature.md)
