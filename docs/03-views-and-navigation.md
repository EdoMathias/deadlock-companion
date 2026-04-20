# 03 — Views and Navigation

This doc covers the main-window tab system: how views are registered, how navigation works, and the exact steps to add or modify a tab.

Read [`AGENTS.md`](../AGENTS.md) and [`docs/02-ui-and-design-system.md`](02-ui-and-design-system.md) first.

---

## 1. Mental model

The main window does not use React Router. It treats "the active view" as a single string in `useState`, persists it in `localStorage`, and renders the corresponding component from a config array. This keeps the renderer a single tree (helpful for the FTUE provider, the SideNav highlight, and ad placement) and makes adding a tab a one-file change in spirit.

```
┌──────────────────────────────────────────────────────────────────┐
│ AppHeader                                                        │
├────────────┬────────────────────────────────────────┬────────────┤
│            │                                        │            │
│            │                                        │            │
│  SideNav   │   <ActiveViewComponent />              │ AdContainer│
│            │   (looked up from viewsConfig by name) │            │
│            │                                        │            │
│            │                                        │ AdContainer│
└────────────┴────────────────────────────────────────┴────────────┘
```

Settings is **not** a config view — it's an overlay rendered inside `main-content-container` when `MainInner.showSettings` is true. Treat it as a system surface, not a tab.

---

## 2. The configuration

[`src/renderer/main-window/config/views.config.ts`](../src/renderer/main-window/config/views.config.ts) is the registry:

```ts
import { ViewConfig } from '../types/views.types';
import { LiveMatchView, MatchHistoryView, ProfileView, ContributeView,
         ItemStatsView, OverlayEditorView } from '../views';
import LiveMatchIcon from '../views/LiveMatch/components/LiveMatchIcon';
// ...

export const viewsConfig: ViewConfig[] = [
  { name: 'Live Match',     icon: LiveMatchIcon,     component: LiveMatchView,     active: true },
  { name: 'Match History',  icon: MatchHistoryIcon,  component: MatchHistoryView,  active: false },
  { name: 'Item Stats',     icon: ItemStatsIcon,     component: ItemStatsView,     active: false },
  { name: 'Overlay Editor', icon: OverlayEditorIcon, component: OverlayEditorView, active: false },
  { name: 'Contribute',     icon: ContributeIcon,    component: ContributeView,    active: false },
  { name: 'Profile',        icon: ProfileIcon,       component: ProfileView,       active: false },
];
```

`ViewConfig` is defined in [`src/renderer/main-window/types/views.types.ts`](../src/renderer/main-window/types/views.types.ts):

```ts
export type ViewConfig = {
  name: string;                          // display name AND identifier
  icon: React.ComponentType;             // SVG icon component
  component: React.ComponentType;        // view body
  active?: boolean;                      // default tab when no localStorage value
};
```

### Order matters

The array order is the SideNav order top-to-bottom. The first entry with `active: true` (or the first entry, as a fallback) is the default tab on first launch. The default today is `'Live Match'`.

### `name` is the identifier

The view's `name` string is used in **four** places. They must all match exactly (case, whitespace, punctuation):

1. The label in the SideNav.
2. The persisted value under `localStorage` key `deadlock_companion_active_view`.
3. The `data-ftue-target="<name>"` attribute set on the `SideNavButton` (so `FTUETooltip`'s `targetSelector` can find it).
4. The `detail` payload of the `navigate-view` `CustomEvent`.

If you rename a view, update all four. If the renamed view had a persisted value, users will fall back to the default — that's acceptable for renames.

---

## 3. The view barrel

[`src/renderer/main-window/views/index.ts`](../src/renderer/main-window/views/index.ts) re-exports each view's default export under a stable name. The convention is one folder per view, with the view component named `<Name>View.tsx` (or just `<Name>.tsx` for legacy views like `Rotations` and `Settings`):

```
views/
  index.ts
  LiveMatch/
    LiveMatchView.tsx
    components/
      LiveMatchIcon.tsx
      ...
  MatchHistory/
    MatchHistoryView.tsx
    MatchDetailView.tsx
    components/
  ItemStats/
    ItemStatsView.tsx
    components/
    hooks/
  ...
```

A view's icon component lives in its own `components/` folder so the icon and the view ship together.

---

## 4. Cross-view navigation: the `navigate-view` event

`MainInner` listens for a top-level `CustomEvent`:

```ts
useEffect(() => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (!viewsConfig.some((v) => v.name === detail)) return;
    setShowSettings(false);
    setActiveView(detail);
  };
  window.addEventListener('navigate-view', handler);
  return () => window.removeEventListener('navigate-view', handler);
}, []);
```

To switch tabs from anywhere — a button inside a card, a deep link from a message, the IngestCacheCard, etc. — dispatch the event:

```ts
window.dispatchEvent(
  new CustomEvent('navigate-view', { detail: 'Match History' }),
);
```

Why an event and not a callback prop? It avoids prop-drilling through the entire view tree, works from non-React code (e.g. message handlers), and lets `MainInner` reset Settings as a side effect of any navigation.

**Do not** read or write `activeView` from a child component, and do not call `setActiveView` via context — there is no context. The event is the public API.

---

## 5. Persisted view selection

The active view is stored in `localStorage` under `deadlock_companion_active_view`. `MainInner` reads it once at mount and falls back to the first `active: true` (or the first config entry) if absent or invalid.

Wrap the read/write in `try/catch` — quota errors and disabled-storage modes must not crash the window. The current implementation already does this; mirror that pattern when adding any other persisted view-level preference.

---

## 6. Cross-window message-driven navigation

Some messages from background should switch the active tab automatically. The pattern in `MainInner`:

```ts
overwolf.windows.onMessageReceived.addListener((message) => {
  const payload = typeof message.content === 'string'
    ? JSON.parse(message.content)
    : message.content;

  if (payload?.type === MessageType.LIVE_MATCH_START) {
    window.dispatchEvent(new CustomEvent('navigate-view', { detail: 'Live Match' }));
  }
  if (payload?.type === MessageType.INGEST_PROMPT) {
    setIngestPromptOpen(true);
  }
});
```

When a new message should drive navigation, follow the same pattern: parse, switch on `payload.type`, then **dispatch** `navigate-view` rather than calling `setActiveView` directly.

---

## 7. Adding a new tab — step-by-step

1. **Create the view folder.**

   ```
   src/renderer/main-window/views/MyFeature/
     MyFeatureView.tsx                # default export, functional component
     components/
       MyFeatureIcon.tsx              # default export, SVG icon component
   ```

2. **Implement the view.**

   ```tsx
   import React from 'react';

   const MyFeatureView: React.FC = () => {
     return (
       <div className="my-feature-view">
         <h2>My Feature</h2>
       </div>
     );
   };

   export default MyFeatureView;
   ```

   - Use only design tokens from [`variables.css`](../src/renderer/styles/variables.css).
   - Use shared components from [`src/renderer/components`](../src/renderer/components/index.ts) (`AppHeader` is already rendered by `Main` — do **not** add another).
   - Wrap fallible logic in `try/catch` and log via `createLogger('MyFeatureView')`.

3. **Add a stylesheet** at `src/renderer/styles/views/my-feature.css` and append the `@import` line to [`src/renderer/styles/index.css`](../src/renderer/styles/index.css):

   ```css
   @import './views/my-feature.css';
   ```

4. **Re-export from the views barrel** [`src/renderer/main-window/views/index.ts`](../src/renderer/main-window/views/index.ts):

   ```ts
   export { default as MyFeatureView } from './MyFeature/MyFeatureView';
   ```

5. **Register in `viewsConfig`** [`src/renderer/main-window/config/views.config.ts`](../src/renderer/main-window/config/views.config.ts):

   ```ts
   import MyFeatureIcon from '../views/MyFeature/components/MyFeatureIcon';
   import { MyFeatureView } from '../views';

   export const viewsConfig: ViewConfig[] = [
     // ...existing entries...
     { name: 'My Feature', icon: MyFeatureIcon, component: MyFeatureView, active: false },
   ];
   ```

6. **(Optional) Add a FTUE step** for the new tab. See [`docs/04-ftue.md`](04-ftue.md) — the SideNavButton already sets `data-ftue-target={view.name}`, so the only changes are extending `FTUEStep` + `MAIN_STEPS` and rendering one more `<FTUETooltip>` inside `Main.tsx`.

7. **(Optional) Mark feature-introduction badge.** If the tab is a new feature for existing users, add a `hasUnseenFTUE('My Feature')` check on the SideNav button (already wired generically) and call `markFeatureSeen()` (or similar) when the view mounts. Mirror the `Item Stats` / `Overlay Editor` pattern.

That's it — no router, no wiring inside `Main.tsx` beyond the optional FTUE bits.

---

## 8. Removing or hiding a tab

- **Hide:** comment the entry out of `viewsConfig`. Do not delete the view folder yet — give existing users a build to migrate.
- **Remove:** delete the entry, the barrel re-export, the view folder, and the stylesheet `@import` in `index.css`. Remove any FTUE step that targeted it.

If the removed tab was the persisted `activeView` for some users, they will fall back to the default on next launch — no migration code needed.

---

## 9. Things to avoid

- Adding `React Router` or any other router. The config-driven approach is intentional.
- Reading `activeView` from a deep child component. Use the `navigate-view` event.
- Using `setShowSettings(true)` from outside `MainInner`. If you need to expose Settings from a view, dispatch `navigate-view` to a stable destination first and let the user open Settings via the header button.
- Calling `setActiveView` from a message handler. Always dispatch `navigate-view` so any side effects (closing Settings, FTUE tooltip dismissal) run consistently.
- Putting per-view CSS inside a `.module.css` unless the styles are truly local. Default is global classes inside `styles/views/`.

---

## 10. Where to look next

- FTUE tour steps and "NEW" badges → [`04-ftue.md`](04-ftue.md)
- Visual styling rules for the view body → [`02-ui-and-design-system.md`](02-ui-and-design-system.md)
- End-to-end "add a tab" checklist (cross-cutting) → [`08-adding-a-feature.md`](08-adding-a-feature.md)
