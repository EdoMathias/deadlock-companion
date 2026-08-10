# AGENTS.md — Deadlock Companion

This file is the entry point for any AI coding agent (Cursor, Codex CLI, Claude Code, Aider, Continue, etc.) working in this repository. Read it in full before making changes. Drill into the focused sub-guides under [`docs/`](docs/) only when you need depth on a specific area.

The goal of this document set is to keep contributions **consistent** with the existing UI, code style, persistence strategy, and Overwolf integration so the app continues to feel and behave like one cohesive product.

---

## 1. What this app is

Deadlock Companion is an **Overwolf** companion app for Valve's *Deadlock* (Overwolf game class id `24482`). It is a TypeScript + React 18 application built with webpack and packaged as an `.opk`. It runs as multiple cooperating windows:

| Window | Purpose | Visible when |
|---|---|---|
| `background` | Headless controller process. Owns Overwolf APIs, hotkeys, GEP, message routing. | Always (hidden) |
| `main_desktop` | Full-featured main UI on the Windows desktop. | Game not running, or user opens it manually |
| `main_ingame` | Same React app, rendered as an in-game overlay. | Deadlock is running |
| `companion_app_ready` | Small pop-up confirming the companion launched in-game. | First seconds after match start |
| `alert_overlay` | In-game item-purchase alert toast stack. | During an active match |
| `counter_items` | In-game counter-item advisor based on enemy team composition. | During an active match (toggle via Alt+Shift+F) |
| `uninstall` | Tiny page that opens the feedback form on uninstall. | Triggered by Overwolf |

All renderer windows share a single React component tree, design system, and `@overwolf/odk-ts` integration.

See [`docs/01-architecture.md`](docs/01-architecture.md) and [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md).

---

## 2. Build and run

Package manager: **yarn** (a `yarn.lock` is committed). Node version is whatever Overwolf's docs currently recommend (LTS).

```bash
yarn install         # install dependencies
yarn dev             # webpack --watch, builds into dist/ for sideloading in Overwolf
yarn build           # one-shot build + packs an .opk into releases/
```

Manifest lives at [`public/manifest.json`](public/manifest.json) and is copied into `dist/` by [`webpack.config.js`](webpack.config.js). To sideload, point Overwolf "Load unpacked extension" at the `dist/` folder.

**Webpack is multi-entry.** Each window has its own entry + `HtmlWebpackPlugin`. When you add a window you must update three places — see [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md) and [`docs/08-adding-a-feature.md`](docs/08-adding-a-feature.md).

Dependencies (from [`package.json`](package.json)) — keep this set minimal:

- Runtime: `react`, `react-dom`, `react-chartjs-2`, `chart.js`, `axios`, `posthog-js`, `@overwolf/odk-ts`
- Tooling: `typescript@^4.2`, `webpack@^5`, `ts-loader`, `style-loader`, `css-loader`, `html-webpack-plugin`, `copy-webpack-plugin`, `clean-webpack-plugin`, `zip-a-folder`, `dotenv`, `@overwolf/types`, `@overwolf/overwolf-api-ts`

Do **not** add new dependencies without an explicit user request — bundle size matters for an Overwolf app.

---

## 3. Folder map

```
src/
  main/                         # background process (no JSX, runs in background.html)
    background.ts               # entry: BackgroundController.instance().run()
    background.html             # empty shell, webpack injects the script
    controllers/
      background.controller.ts  # singleton orchestrator: GEP, hotkeys, tray, messages
      windows.controller.ts     # show/hide/close all windows via odk-ts
    services/
      windows-odk/              # WindowsService + MonitorsService (odk-ts wrappers)
      MessageChannel.ts         # cross-window pub/sub built on overwolf.windows.sendMessage
      game-events.service.ts    # GEP subscription, retries, info-update routing
      game-state.service.ts     # overwolf.games.onGameInfoUpdated for Deadlock
      hotkeys.service.ts        # OWHotkeys.onHotkeyDown bindings
      app-launch.service.ts     # dock/icon launches (ignores game-launch origins)
      item-purchase-tracker.service.ts  # diffs items_N + roster, emits alerts
      tray-icon.service.ts      # system tray menu
      index.ts                  # service barrel

  renderer/                     # all React UI (one tree, multiple webpack entries)
    main-window/                # main_desktop AND main_ingame
      Main.tsx                  # top-level layout, providers, view switching
      main.html
      config/views.config.ts    # ordered list of tabs (the "router")
      types/views.types.ts      # ViewConfig type
      views/                    # one folder per tab
        index.ts                # barrel
        LiveMatch/  MatchHistory/  Profile/  Rotations/
        Contribute/  HeroStats/  ItemStats/  OverlayEditor/  Settings/
      components/
        SideNav/                # collapsible vertical nav
        AdContainer/            # OwAd wrapper (gated by FTUE complete)

    companion-ready-window/     # CompanionAppReady.tsx (auto-closes after 10s)
    alert-overlay-window/       # AlertOverlay.tsx (item purchase toasts)
    rotation-window/            # legacy rotation overlay (currently disabled)
    uninstall-window/           # static feedback-form HTML

    components/                 # shared cross-window components (use the barrel)
    contexts/                   # FTUEContext, LaunchingContext
    hooks/                      # useLiveMatch, useGameEventMatches, useSteamId, ...
    services/                   # matchCache (IndexedDB), ReleaseNotesService
    styles/                     # global CSS (see docs/02)
      index.css                 # ordered @import manifest — UPDATE WHEN ADDING A FILE
      variables.css             # design tokens (single source of truth)
      base.css   layout.css
      components/*.css          # shared component styles
      views/*.css               # per-view styles

  shared/                       # imported by main AND renderer
    consts.ts                   # kWindowNames, kHotkeys, game id, API URLs
    services/
      Logger.ts                 # createLogger('Scope') — use this, not console
      hotkeys.ts                # HotkeysAPI for the settings UI
      httpcacheScan.ts          # Steam http cache scan
      matchMetadataFetcher.ts   # typed deadlock-api matches
      steamWebApi.ts            # Steam Web API fallback
      deadlock-api/             # configured client + assets/items/analytics wrappers
    stores/
      notificationPreferences.ts  # dl_notification_prefs
      overlayLayoutStore.ts       # dl_overlay_layout
    utils/
      apiCache.ts               # localStorage TTL cache (deadlock_cache_*)
      indexedDBStorage.ts       # generic IDB wrapper + createSimpleStore
      dateUtils.ts  timeFormat.ts  steamUtils.ts
    types/                      # shared TS types (items, liveMatch, etc.)
    vendor/deadlock-api-client/ # generated OpenAPI client — DO NOT hand-edit

public/
  manifest.json                 # Overwolf manifest (windows, hotkeys, perms)
  css/  icons/  img/            # static assets copied verbatim into dist/
```

---

## 4. Golden rules (read this whole section)

These are the non-negotiable patterns. Violations are visible to users (mismatched theme), break sideloading (manifest drift), or cause silent data loss (storage races).

### UI / styling

- **Use design tokens.** Every color, font, and radius lives in [`src/renderer/styles/variables.css`](src/renderer/styles/variables.css). Reference them (`var(--color-bg-card)`, `var(--color-accent-primary)`, `var(--radius-md)`, `var(--font-ark)`) — never hardcode hex values or `'Inter'`. Full token list and rationale: [`docs/02-ui-and-design-system.md`](docs/02-ui-and-design-system.md).
- **CSS goes through the manifest.** Add new stylesheets under `src/renderer/styles/components/` or `src/renderer/styles/views/` and append the `@import` to [`src/renderer/styles/index.css`](src/renderer/styles/index.css). Do not inline `<style>` blocks or import CSS from random component folders.
- **Reuse shared components from the barrel.** Import `AppHeader`, `Modal`, `RefreshButton`, `HeroSelect`, `RankRangeSlider`, `IngestCacheCard`, the FTUE pieces, etc. from [`src/renderer/components`](src/renderer/components/index.ts) — do not re-implement them.
- **Window chrome.** A renderer window's drag handle is its `AppHeader`; controls inside the header must `stopPropagation` so dragging doesn't fire. Use `@overwolf/odk-ts` `Windows.Self()` for minimize/maximize/close — never call `overwolf.windows.*` directly for chrome.

### Navigation

- Tabs in the main window are **config-driven**. Add a tab by extending [`viewsConfig`](src/renderer/main-window/config/views.config.ts) and the [`views/index.ts`](src/renderer/main-window/views/index.ts) barrel — do not hand-route inside `Main.tsx`.
- The view's `name` string is shared with the SideNav label, the FTUE `data-ftue-target`, and the `navigate-view` `CustomEvent` payload. Keep all four spellings identical.
- To switch tabs from anywhere, dispatch `window.dispatchEvent(new CustomEvent('navigate-view', { detail: 'View Name' }))` instead of poking state.

See [`docs/03-views-and-navigation.md`](docs/03-views-and-navigation.md).

### Cross-window communication

- **Always go through `MessageChannel`.** Add a value to the `MessageType` enum in [`src/main/services/MessageChannel.ts`](src/main/services/MessageChannel.ts), send with `messageChannel.sendMessage(targetWindow, MessageType.X, data)`, and listen in renderers via `overwolf.windows.onMessageReceived` (parsing `message.content` and switching on `payload.type`).
- Window names are constants in [`src/shared/consts.ts`](src/shared/consts.ts) (`kWindowNames.mainDesktop`, etc.) — never hardcode the strings.

See [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md).

### Persistence

Pick the right storage for the data — wrong choices cause race conditions or visible UI lag.

| Data shape | Use | Key prefix |
|---|---|---|
| Network response with TTL (Steam profile, item metadata, analytics) | [`apiCache`](src/shared/utils/apiCache.ts) | `deadlock_cache_` |
| Large structured data (match metadata, rosters, history) | [`matchCache`](src/renderer/services/matchCache.ts) over IndexedDB | one DB per domain (`dl-match-*`) |
| Small user prefs / flags | `localStorage` directly | `dl_` or `deadlock_companion_` |
| Notification + overlay state | [`notificationPreferences`](src/shared/stores/notificationPreferences.ts) / [`overlayLayoutStore`](src/shared/stores/overlayLayoutStore.ts) | `dl_notification_prefs`, `dl_overlay_layout` |

Always wrap storage reads in `try/catch` and degrade gracefully — never throw out of a getter. Full rationale and the canonical key registry: [`docs/05-data-and-persistence.md`](docs/05-data-and-persistence.md).

### Logging and errors

- `const logger = createLogger('MyScope');` in every file. Do not call `console.log` directly except inside [`src/shared/services/Logger.ts`](src/shared/services/Logger.ts) and [`src/main/background.ts`](src/main/background.ts) (which is the bootstrap fallback).
- Wrap `JSON.parse`, `localStorage`, IndexedDB calls, and `overwolf.*` callbacks in `try/catch`. Log via the logger and continue with a sensible default.

### FTUE

- All onboarding state lives in [`FTUEContext`](src/renderer/contexts/FTUEContext.tsx). Wrap with `FTUEProvider`, consume via `useFTUE()`. Never read FTUE storage keys directly.
- Onboarding steps are sequenced — only the first incomplete step renders at a time. To add one, extend `FTUEStep` and `MAIN_STEPS`, then add an `<FTUETooltip step="..." targetSelector="[data-ftue-target='View Name']" />` in `Main.tsx`.

See [`docs/04-ftue.md`](docs/04-ftue.md).

### Game integration

- New GEP features go into [`GameEventsService`](src/main/services/game-events.service.ts) `setRequiredFeatures` and are routed in `BackgroundController.handleInfoUpdate` / `handleGameEvent`.
- New hotkeys must be declared in `manifest.json` AND mirrored in [`kHotkeys`](src/shared/consts.ts) AND bound in [`HotkeysService`](src/main/services/hotkeys.service.ts) AND wired in `BackgroundController`.

### Conventions

- Functional React + hooks only. PascalCase components. TypeScript strict.
- Prefer local `useState` first; React Context only for cross-component state inside one window (currently only `FTUEProvider`). No Redux/Zustand.
- Prefer importing components from the renderer barrel over deep paths.
- Comments explain non-obvious intent only — never narrate the code.

Full conventions: [`docs/07-conventions.md`](docs/07-conventions.md).

### Keep these docs in sync (read this)

**Treat documentation updates as part of the feature, not an afterthought.** If a change touches anything covered by these guides, update the relevant doc in the same change. Out-of-date docs are worse than no docs — they actively mislead the next agent.

You **must** update docs when you:

- Add, rename, remove, or reorder a tab → [`docs/03-views-and-navigation.md`](docs/03-views-and-navigation.md) (and the SideNav-order references in [`AGENTS.md`](AGENTS.md) §3 if the tab list changes).
- Add or rename a `localStorage` key, IndexedDB DB/store, or `apiCache` namespace → [`docs/05-data-and-persistence.md`](docs/05-data-and-persistence.md) §6 (canonical key registry).
- Add a value to `MessageType` → [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md) §4 (the enum reference table).
- Add or change an Overwolf window → [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md) §1 and the window list in [`AGENTS.md`](AGENTS.md) §1. If the window is an overlay widget managed by `overlayLayoutStore`, also add a dedicated preview branch in [`WidgetPreview.tsx`](src/renderer/main-window/views/OverlayEditor/components/WidgetPreview.tsx) so the Overlay Editor screen shows an accurate mock of the new widget.
- Add or change a hotkey → [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md) §2.
- Add a FTUE step, storage key, or "NEW" feature flag → [`docs/04-ftue.md`](docs/04-ftue.md) §3, §4, §7.
- Add a shared component to [`src/renderer/components/index.ts`](src/renderer/components/index.ts) → [`docs/02-ui-and-design-system.md`](docs/02-ui-and-design-system.md) §3 (component inventory).
- Add a design token to [`variables.css`](src/renderer/styles/variables.css), or a new file under `styles/components/` or `styles/views/` → [`docs/02-ui-and-design-system.md`](docs/02-ui-and-design-system.md) §1, §2.
- Add a new context, hook category, or convention → [`docs/07-conventions.md`](docs/07-conventions.md).
- Add a new dependency (only with explicit user approval) → [`AGENTS.md`](AGENTS.md) §2.
- Ship a new app version → bump the version in both [`package.json`](package.json) and [`public/manifest.json`](public/manifest.json), and add a matching authored release note at `docs/release-notes/release-<version>.md` following [`docs/09-release-notes.md`](docs/09-release-notes.md).

If you're unsure whether something needs a doc update, the answer is yes — at minimum, mention it in the relevant doc's "Things to avoid" or registry sections. Per-change checklists with the exact lines to edit live in [`docs/08-adding-a-feature.md`](docs/08-adding-a-feature.md) §5.

---

## 5. Sub-guide index

Pick the doc that matches what you're about to do:

| Doc | When to read |
|---|---|
| [`docs/01-architecture.md`](docs/01-architecture.md) | You need the big picture — background vs renderers, message flow, window lifecycle. |
| [`docs/02-ui-and-design-system.md`](docs/02-ui-and-design-system.md) | You're touching styles, building a component, or picking colors. |
| [`docs/03-views-and-navigation.md`](docs/03-views-and-navigation.md) | You're adding/removing/reordering a main-window tab. |
| [`docs/04-ftue.md`](docs/04-ftue.md) | You're adding a tour step, "NEW" badge, or onboarding modal. |
| [`docs/05-data-and-persistence.md`](docs/05-data-and-persistence.md) | You need to store something — anywhere. |
| [`docs/06-overwolf-integration.md`](docs/06-overwolf-integration.md) | You're touching the manifest, hotkeys, GEP, messages, the deadlock-api client, or the alert overlay pipeline. |
| [`docs/07-conventions.md`](docs/07-conventions.md) | You're unsure about TS, imports, error handling, or state management style. |
| [`docs/08-adding-a-feature.md`](docs/08-adding-a-feature.md) | End-to-end checklists for the four most common changes. |
| [`docs/09-release-notes.md`](docs/09-release-notes.md) | You're writing a release note. Authored notes live in [`docs/release-notes/`](docs/release-notes/), one `release-<version>.md` per shipped version. |

---

## 6. When in doubt

1. Search for the closest existing pattern (`rg "MessageType.LIVE_MATCH_START"`, `rg "createLogger\("`, `rg "var\(--color-"`).
2. Mirror that pattern.
3. If you're tempted to invent a new convention, stop and check the relevant sub-doc — there is almost always a designated way.
4. Do not introduce new top-level folders, new state-management libraries, new CSS systems (Tailwind, styled-components, etc.), or new HTTP clients. Extend what's here.
