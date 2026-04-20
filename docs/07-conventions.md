# 07 — Code Conventions

This doc covers the project's TypeScript, React, import, logging, error-handling, and state-management conventions. Match these in every change so the codebase stays homogeneous.

Read [`AGENTS.md`](../AGENTS.md) first.

---

## 1. TypeScript

[`tsconfig.json`](../tsconfig.json) — target `es2020`, `strict: true` with two relaxations the project leans on:

```json
"strict": true,
"noImplicitAny": false,
"strictNullChecks": false,
```

This means **strict mode is on** for class semantics, function strictness, etc., but `any` is permitted where the cost of typing is high (most notably `match.content` from the deadlock-api OpenAPI client and Overwolf message payloads). **Do not** broaden `any` further:

- New code should use real types. Reach for `any` only when you've truly exhausted the typed alternatives (e.g. arbitrary user-supplied JSON).
- Prefer `unknown` + a type guard over `any`.
- Treat new code as if `strictNullChecks` were on — write `value?.thing ?? fallback` and check for `null` explicitly. The relaxation is for legacy code, not a license.

The `paths` alias `deadlock_api_client → src/shared/vendor/deadlock-api-client/index.ts` is mirrored in [`webpack.config.js`](../webpack.config.js). Use `import { MatchesApi } from 'deadlock_api_client'` — never the relative path.

---

## 2. React

- **Functional components only.** Hooks for state and effects.
- `React.FC<Props>` is the preferred typing style — it's used throughout the codebase. Both `React.FC` and explicit `(props: Props) => JSX.Element` are acceptable; mirror the file you're editing.
- **PascalCase** for components and component files (`AppHeader.tsx`, `MatchHistoryView.tsx`). `camelCase` for hooks (`useSteamId.ts`), utilities, and stores.
- One default export per component file when the filename matches the export. Named exports are fine for utilities and barrel re-exports.
- Mount renderer roots with `createRoot`:

  ```ts
  createRoot(document.getElementById('root')!).render(<Main />);
  ```

- Render-time portals (`createPortal(node, document.body)`) only for overlays that must escape stacking contexts (modals, FTUE tooltips). Mirror the existing FTUE / modal pattern.

---

## 3. State management

The hierarchy, in order of preference:

1. **Local `useState` / `useReducer`** in the component or its closest hook.
2. **Hooks under [`src/renderer/hooks/`](../src/renderer/hooks/)** to share stateful logic across components in the same window (e.g. `useLiveMatch`, `useSteamId`).
3. **React Context** for state that must be read by many components in the same window. The codebase currently has exactly one production-used context: [`FTUEContext`](../src/renderer/contexts/FTUEContext.tsx). `LaunchingContext` exists but is not currently mounted.
4. **`MessageChannel`** for state that must cross window boundaries.
5. **Persistent stores** (`localStorage`, IndexedDB) for state that must survive a reload — see [`docs/05-data-and-persistence.md`](05-data-and-persistence.md).

**No Redux. No Zustand. No MobX. No Jotai. No Recoil.** Do not add a state-management library — extend hooks/context.

---

## 4. Imports

### Order and grouping

Mirror the existing files. The conventional order:

1. React + React-DOM
2. Third-party libraries (`axios`, `chart.js`, `@overwolf/odk-ts`)
3. Generated client (`deadlock_api_client`)
4. Internal aliases / barrels
5. Relative imports (parent → sibling)
6. Stylesheet imports (only at app/window roots)

### Use the renderer barrel

Always:

```ts
import { AppHeader, Modal, RefreshButton, FTUETooltip } from '../../components';
```

Never:

```ts
// don't do this
import { Modal } from '../../components/Modal';
import { AppHeader } from '../../components/AppHeader';
```

Deep imports are tolerated only when the barrel does not re-export the symbol (rare).

### Constants

Window names, hotkey ids, game id, and API URLs come from [`src/shared/consts.ts`](../src/shared/consts.ts):

```ts
import { kWindowNames, kHotkeys, kDeadlockClassId } from '../../shared/consts';
```

Don't inline string literals like `'main_desktop'` or `'ToggleInGameMain'` anywhere in TypeScript.

---

## 5. Logging

[`createLogger`](../src/shared/services/Logger.ts) is the only sanctioned way to log:

```ts
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('MatchHistoryView');

logger.log('Loaded match', matchId);
logger.warn('Falling back to cached profile', accountId);
logger.error('Failed to fetch metadata', err);
logger.debug('Diff snapshot', { before, after });
```

Rules:

- Declare `const logger = createLogger('Scope')` at the top of every file that needs to log.
- Pick a stable, human-readable scope: the class/component name, or a short subsystem label (`MessageChannel`, `BackgroundController`, `matchCache`).
- **Never call `console.log` / `console.error` directly** outside of [`Logger.ts`](../src/shared/services/Logger.ts) and [`background.ts`](../src/main/background.ts) (the bootstrap fallback).
- Don't ship `logger.debug` calls behind hot loops — they still execute in production.

---

## 6. Error handling

The project's shape is **catch-and-degrade**, not propagate-to-top. Specifically:

- Wrap `JSON.parse`, every `localStorage` access, every IndexedDB call, and every `overwolf.*` callback in `try/catch`.
- On error: log via the scoped logger and return a sensible default (`null`, `[]`, the previous state).
- For network calls: the API services already do this (`assetsApiService`, `itemsApiService`, etc.). When you write a new fetcher, mirror the pattern.
- React error boundaries are not currently in use. If you introduce one, place it at a window root and log via `createLogger('ErrorBoundary')`.

Examples:

```ts
let parsed: Foo | null = null;
try {
  parsed = JSON.parse(raw) as Foo;
} catch (err) {
  logger.warn('Bad JSON in storage, ignoring', err);
}
```

```ts
overwolf.windows.sendMessage(target, type, payload, (result) => {
  if (!result.success) {
    logger.error(`sendMessage to ${target} failed`, result.error);
  }
});
```

The reasoning: this is a long-running overlay that runs alongside a real-time game. A thrown exception that crashes the React tree is a much worse user experience than a silently degraded view with a logged error.

---

## 7. Comments

- Comment **why**, not what. Don't narrate the code.
- Useful: explain a non-obvious constraint ("Each `createSimpleStore` uses its own DB to avoid `onupgradeneeded` races across windows.").
- Useless: `// Increment counter`, `// Import Modal`, `// Handle the click`.
- File header comments are appropriate for shared utilities (`apiCache.ts`, `matchCache.ts`) — short, high-level, with a usage example.
- TODOs and FIXMEs should include enough context that another agent can act on them without reading three commits of history. Prefer fixing the issue instead.

---

## 8. File and folder layout

Within a feature folder (a view, a window, a complex component), the conventional layout:

```
MyFeature/
  MyFeatureView.tsx           # default export, top-level component
  hooks/                      # feature-local hooks
    useFeatureThing.ts
  components/                 # feature-local subcomponents (icons, cards)
    MyFeatureIcon.tsx
    SomeCard.tsx
  types/                      # feature-local types (only if not shared)
    feature.types.ts
  consts/                     # feature-local constants (only if not shared)
    presets.ts
```

Promote things to `src/shared/` (or `src/renderer/components/`, `src/renderer/hooks/`) when a second feature reaches for them.

---

## 9. Naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase, mirrors export | `RefreshButton.tsx` |
| Hook file | camelCase, prefixed `use` | `useSteamId.ts` |
| Service / store / util file | camelCase | `apiCache.ts`, `notificationPreferences.ts` |
| Type file | camelCase ending `.types.ts` (renderer) or domain-named (shared) | `views.types.ts`, `liveMatch.ts` |
| CSS file | kebab-case, matches feature/component | `match-history.css`, `refresh-button.css` |
| CSS class | BEM-like for components, semantic for layout, prefixed for groups (`ftue-`, `modal-`) | `.rank-slider__trigger`, `.app-header`, `.ftue-tooltip` |
| `localStorage` key (newer) | `dl_<feature>` | `dl_notification_prefs` |
| `localStorage` key (older / FTUE) | `deadlock_companion_<feature>` | `deadlock_companion_active_view` |
| IndexedDB name | `dl-<domain>` | `dl-match-metadata` |
| `MessageType` enum value | `SCREAMING_SNAKE_CASE` ↔ `kebab-case` string | `LIVE_MATCH_START = 'live-match-start'` |
| Manifest hotkey id | `PascalCase` | `ToggleInGameMain` |
| `kHotkeys` / `kWindowNames` value | `camelCase` key, exact-string value | `mainIngame: 'main_ingame'` |

---

## 10. Dependencies

The dependency list in [`package.json`](../package.json) is intentionally minimal. **Do not add a new dependency without explicit user approval.**

When you do need to add one:

- Prefer libraries that are already adjacent (e.g. `chart.js` is in for `react-chartjs-2`).
- Avoid utility-belt libraries (`lodash`, `ramda`) — write the small helper inline.
- Avoid CSS frameworks (Tailwind, Bootstrap) — extend the global CSS architecture.
- Avoid state-management libraries — extend hooks / context.
- Run a sanity check on bundle impact with `webpack --mode=production` before/after.

---

## 11. Code style

There is no committed Prettier or ESLint config that the team enforces in this repo, so style follows what's already there:

- 2-space indent.
- Single quotes for JS/TS strings, double quotes inside JSX attributes.
- Trailing commas where ES2020 supports them (function args, arrays, objects, JSX attrs lists).
- Semicolons — yes.
- Arrow functions for callbacks; `function` declarations for top-level utilities are also acceptable.
- One blank line between major logical sections in larger files.

When editing a file, mirror the surrounding style — don't reformat untouched code.

---

## 12. Things to avoid

- Adding routers, state libs, CSS frameworks, or HTTP clients (covered above).
- Calling `console.log` directly.
- Throwing out of getters (storage, parse, IDB).
- Hardcoding window names, hotkey ids, colors, fonts, or radii.
- Re-implementing a shared component instead of importing from the barrel.
- Inventing new file-layout conventions inside a feature folder.
- Writing comments that narrate code.

---

## 13. Where to look next

- Decision matrix for storage and the canonical key registry → [`05-data-and-persistence.md`](05-data-and-persistence.md)
- Visual identity rules and component inventory → [`02-ui-and-design-system.md`](02-ui-and-design-system.md)
- End-to-end "add a feature" checklists → [`08-adding-a-feature.md`](08-adding-a-feature.md)
