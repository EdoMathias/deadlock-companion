# 08 — Adding a Feature: End-to-End Checklists

This doc collects the four most common change shapes into copy-pasteable checklists. Each step links to the deeper doc that explains the *why*. Follow the lists in order — they are dependency-ordered.

Read [`AGENTS.md`](../AGENTS.md) before using any of these.

---

## 1. Add a new main-window tab

Add a tab the user can navigate to from the SideNav.

### Pre-flight

- [ ] Pick a `name` (display + identifier — see [`docs/03-views-and-navigation.md`](03-views-and-navigation.md) §2.3). Title-case, with spaces (`'Match History'`).
- [ ] Confirm there isn't an existing view that should be extended instead.
- [ ] Decide whether existing FTUE'd users should see a "NEW" badge on this tab.

### Implementation

1. **Create the view folder** at `src/renderer/main-window/views/<Name>/`.
2. **Create the view component** `<Name>View.tsx`, default export.
   - Use shared components from [`src/renderer/components`](../src/renderer/components/index.ts).
   - Use design tokens from [`variables.css`](../src/renderer/styles/variables.css). No hardcoded colors/fonts.
   - `const logger = createLogger('<Name>View')`.
3. **Create the icon** `components/<Name>Icon.tsx`, default export, SVG.
4. **Add the stylesheet** at `src/renderer/styles/views/<kebab-name>.css`.
5. **Append the `@import`** in [`src/renderer/styles/index.css`](../src/renderer/styles/index.css) (in the views section, in display order).
6. **Re-export from the views barrel** [`src/renderer/main-window/views/index.ts`](../src/renderer/main-window/views/index.ts):
   ```ts
   export { default as <Name>View } from './<Name>/<Name>View';
   ```
7. **Register in `viewsConfig`** [`src/renderer/main-window/config/views.config.ts`](../src/renderer/main-window/config/views.config.ts):
   ```ts
   import <Name>Icon from '../views/<Name>/components/<Name>Icon';
   import { <Name>View } from '../views';

   { name: '<Name>', icon: <Name>Icon, component: <Name>View, active: false },
   ```
   Position it where it should appear in the SideNav (top-to-bottom).

### Optional follow-ups

- [ ] **Add a FTUE tour step** — see [`docs/04-ftue.md`](04-ftue.md) §9. Adds two lines to `FTUEStep` + `MAIN_STEPS` and one `<FTUETooltip>` in `Main.tsx`.
- [ ] **Add a "NEW" badge** for existing users — see [`docs/04-ftue.md`](04-ftue.md) §7. Add a feature key + `MARK_*` action to `FTUEContext`.
- [ ] **Persist a per-tab user preference** (filters, sort) — see [`docs/05-data-and-persistence.md`](05-data-and-persistence.md). For one or two flags, `localStorage` with a `dl_<view>_*` key. For more, promote to a typed store.

### Verification

- [ ] `yarn dev` builds with no TypeScript errors.
- [ ] The new tab appears in the SideNav, matches the visual style of existing tabs, switches when clicked, and persists across reload.
- [ ] If the tab is the default, no other entry has `active: true`.
- [ ] `localStorage.getItem('deadlock_companion_active_view')` updates on switch.

---

## 2. Add a new persistent setting

Add a user-facing setting (toggle, range, dropdown) that survives reloads.

### Decision: where to store it?

Use the matrix in [`docs/05-data-and-persistence.md`](05-data-and-persistence.md) §1:

- One boolean / one string → `localStorage` directly.
- A small JSON shape used by one feature → typed store under [`src/shared/stores/`](../src/shared/stores/).
- A network response → `apiCache` (this is not a "setting").
- Large structured data → `matchCache` (also not a "setting").

### Implementation (typed store path — recommended)

1. **Define the type** in [`src/shared/types/`](../src/shared/types/) (or in the store file if tiny).
2. **Define the default** as a `DEFAULT_<Thing>` const.
3. **Create the store** at `src/shared/stores/<thing>.ts`:
   - Storage key: `dl_<thing>` (e.g. `dl_match_filters`).
   - Functions: `get<Thing>()`, `set<Thing>(partial)`, optionally `update<Thing>(partial)` that merges.
   - On read, `{ ...DEFAULT, ...persisted }` so adding fields stays backward-compatible.
   - Wrap every storage call in `try/catch`. Log via `createLogger('<thing>Store')`.
4. **Register the key** in [`docs/05-data-and-persistence.md`](05-data-and-persistence.md) §6 — add a row to the registry table.
5. **Expose a hook** (optional but conventional) `useThing()` under `src/renderer/hooks/` that wraps `get` + `set` and triggers re-renders via `useState` + `storage` event listener (mirror `useSteamId`).
6. **Add the UI** in `Settings/components/` (or wherever the setting belongs). Use existing input components — buttons, sliders, selects — never roll a new one.

### Implementation (single `localStorage` flag path — only when truly trivial)

1. Pick a key with prefix `dl_<feature>_<flag>` (or `deadlock_companion_<feature>_<flag>` for FTUE-adjacent state).
2. In the consuming component:
   ```ts
   const [enabled, setEnabled] = useState(() => {
     try {
       return localStorage.getItem('dl_my_flag') === 'true';
     } catch {
       return false;
     }
   });

   const toggle = () => {
     setEnabled((prev) => {
       const next = !prev;
       try { localStorage.setItem('dl_my_flag', String(next)); } catch {}
       return next;
     });
   };
   ```
3. Register the key in [`docs/05-data-and-persistence.md`](05-data-and-persistence.md) §6.

### Verification

- [ ] Setting the value, reloading, and re-opening the window restores it.
- [ ] Toggling in `main_desktop` reflects in `main_ingame` (or vice versa) on the next render — if it should sync live, listen for the `storage` event.
- [ ] Resetting the FTUE (Settings → Reset) does not nuke an unrelated setting (only FTUE keys are listed in `resetFTUE()`).

---

## 3. Add a new cross-window message

Send data from the background to a renderer (or vice versa).

### Pre-flight

- [ ] Confirm no existing `MessageType` already carries the data.
- [ ] Decide direction: background → renderer (most common), renderer → background, or broadcast.
- [ ] Decide payload type (must be JSON-serialisable).

### Implementation

1. **Add the enum value** to [`src/main/services/MessageChannel.ts`](../src/main/services/MessageChannel.ts):
   ```ts
   export enum MessageType {
     // ...existing entries...
     MY_NEW_EVENT = 'my-new-event',
   }
   ```
   Add a one-line comment above it explaining sender, receiver(s), and payload type.

2. **Add the payload type** in [`src/shared/types/`](../src/shared/types/) (one type per concern; mirror `liveMatch.ts`):
   ```ts
   export interface MyNewEventPayload {
     foo: string;
     bar: number;
   }
   ```

3. **Send from the background:**
   ```ts
   import { kWindowNames } from '../../shared/consts';
   import { MessageType } from '../services/MessageChannel';
   import type { MyNewEventPayload } from '../../shared/types/myNewEvent';

   const payload: MyNewEventPayload = { foo, bar };
   await this._messageChannel.sendMessage(
     kWindowNames.mainDesktop,
     MessageType.MY_NEW_EVENT,
     payload,
   );
   ```
   Use `broadcastMessage([...])` to fan out.

4. **Listen in the renderer** (typically inside a hook or `useEffect`):
   ```ts
   useEffect(() => {
     const handler = (msg: overwolf.windows.MessageReceivedEvent) => {
       const wrapper = typeof msg.content === 'string'
         ? JSON.parse(msg.content)
         : msg.content;
       if (wrapper?.type !== MessageType.MY_NEW_EVENT) return;
       const data = wrapper.data as MyNewEventPayload;
       // ...
     };
     overwolf.windows.onMessageReceived.addListener(handler);
     return () => overwolf.windows.onMessageReceived.removeListener(handler);
   }, []);
   ```

5. **Renderer → background** (only if needed):
   ```ts
   overwolf.windows.sendMessage(
     'background',
     MessageType.MY_NEW_EVENT,
     { type: MessageType.MY_NEW_EVENT, data: payload, timestamp: Date.now() },
     () => {},
   );
   ```
   The background subscribes via `this._messageChannel.onMessage(MessageType.MY_NEW_EVENT, handler)`.

### Verification

- [ ] Sender and receiver agree on the payload shape (the new type lives in `src/shared/types/`).
- [ ] No raw GEP payloads are sent — they're normalized into the typed shape first.
- [ ] Logger output in both windows shows the message flowing.
- [ ] If the message can fire many times per second (e.g. roster updates), the receiver throttles or debounces appropriately.

---

## 4. Add a new Overwolf window

Add a window — desktop, in-game overlay, or floating widget — visible to the user.

### Pre-flight

- [ ] Decide window category: desktop-only, in-game-only, or both.
- [ ] Decide if it's transparent (overlays usually are) and whether it grabs keyboard focus.
- [ ] Decide its size and minimum size.
- [ ] Decide who shows/hides it (background lifecycle, hotkey, message from another window).

### Implementation — the four-file contract

**File 1 — [`public/manifest.json`](../public/manifest.json):** add to `data.windows`:

```json
"my_window": {
  "file": "my_window.html",
  "in_game_only": true,
  "transparent": true,
  "resizable": false,
  "override_on_update": true,
  "size":     { "width": 600, "height": 400 },
  "min_size": { "width": 600, "height": 400 }
}
```

**File 2 — [`webpack.config.js`](../webpack.config.js):** add an entry and a `HtmlWebpackPlugin`:

```js
entry: {
  // ...
  my_window: './src/renderer/my-window/MyWindow.tsx',
},
// ...
plugins: [
  // ...
  new HtmlWebpackPlugin({
    template: './src/renderer/my-window/my_window.html',
    filename: path.resolve(__dirname, './dist/my_window.html'),
    chunks: ['my_window'],
  }),
]
```

**File 3 — [`src/shared/consts.ts`](../src/shared/consts.ts):** add to `kWindowNames`:

```ts
export const kWindowNames = {
  // ...
  myWindow: 'my_window',
};
```

**File 4 — [`src/main/services/windows-odk/windows.service.ts`](../src/main/services/windows-odk/windows.service.ts):** add to `windowsConfigs`:

```ts
my_window: {
  url: 'my_window.html',
  // odk-ts-specific config — mirror an existing entry of the same category
},
```

### Renderer code

1. Create the folder `src/renderer/my-window/`.
2. Create `MyWindow.tsx` (default export, root component) and mount with `createRoot`.
3. Create `my_window.html` (use one of the existing `*.html` files as a template — they're all minimal shells with a `<div id="root"></div>`).
4. Import the global stylesheet at the top of `MyWindow.tsx`:
   ```ts
   import '../styles/index.css';
   ```
5. If the window has a header, use `AppHeader` from the shared components barrel. If not, paint a background — the window is transparent.
6. Add a per-window stylesheet under `src/renderer/styles/views/<my-window>.css` if needed, and `@import` it in `index.css`.

### Background lifecycle

1. Add `showMyWindow()` / `closeMyWindow()` methods on [`WindowsController`](../src/main/controllers/windows.controller.ts) that delegate to `WindowsService`.
2. Wire them into the appropriate lifecycle hook on `BackgroundController`:
   - On game launch: extend `WindowsController.onGameLaunch()`.
   - On match start/end: extend `BackgroundController.onMatchStart` / `onMatchEnd`.
   - On hotkey: bind a new hotkey (see [`docs/06-overwolf-integration.md`](06-overwolf-integration.md) §2) and wire its callback.
   - On message from another window: subscribe via `messageChannel.onMessage(...)`.

### Optional

- [ ] Add a `MessageType` so the new window can receive data — see checklist 3 above.
- [ ] Add a hotkey to toggle it — see [`docs/06-overwolf-integration.md`](06-overwolf-integration.md) §2.
- [ ] Add a Settings UI to enable/disable it (overlay layout pattern from `overlayLayoutStore`).

### Verification

- [ ] `yarn build` produces `dist/my_window.html` and `dist/js/my_window.js`.
- [ ] Sideloading shows the window when expected.
- [ ] Closing the window from `WindowsController` succeeds without a console error.
- [ ] If transparent: the window paints its own background; clicks pass through only where intended.
- [ ] Bumping `meta.version` in `manifest.json` and `package.json` for the release.

---

## 5. After any of the above — keep the docs honest

Documentation updates are part of the feature. A change that ships without the matching doc update has shipped half-finished — the next agent will misread the codebase. Walk through this list before you consider the change done.

### Build / runtime sanity

- [ ] `yarn dev` (or `yarn build`) — clean build, no TS errors.
- [ ] Run the app in Overwolf, exercise the new path.
- [ ] Search for inadvertent regressions near the changed code (`rg "TODO|FIXME"`).
- [ ] Bump `meta.version` in [`public/manifest.json`](../public/manifest.json) and `version` in [`package.json`](../package.json) for releases.

### Documentation updates (mandatory if any apply)

| If you… | Update |
|---|---|
| Added/renamed/removed/reordered a tab | [`AGENTS.md`](../AGENTS.md) §1 (window/tab list, if shape changed) and the tab list referenced in [`docs/03-views-and-navigation.md`](03-views-and-navigation.md) §2 |
| Added a `localStorage` key, IndexedDB DB/store, or `apiCache` namespace | [`docs/05-data-and-persistence.md`](05-data-and-persistence.md) §6 (canonical key registry) |
| Added a value to `MessageType` | [`docs/06-overwolf-integration.md`](06-overwolf-integration.md) §4 (`MessageType` table) |
| Added an Overwolf window | [`AGENTS.md`](../AGENTS.md) §1 (window table), [`docs/01-architecture.md`](01-architecture.md) §2 (mermaid + lifecycle), [`docs/06-overwolf-integration.md`](06-overwolf-integration.md) §1 |
| Added or changed a hotkey | [`docs/06-overwolf-integration.md`](06-overwolf-integration.md) §2 |
| Added a FTUE step, storage key, or "NEW" feature flag | [`docs/04-ftue.md`](04-ftue.md) §3 (step list), §4 (storage keys), §7 ("NEW" badges) |
| Added a shared component to [`src/renderer/components/index.ts`](../src/renderer/components/index.ts) | [`docs/02-ui-and-design-system.md`](02-ui-and-design-system.md) §3 (component inventory) |
| Added a design token to [`variables.css`](../src/renderer/styles/variables.css) | [`docs/02-ui-and-design-system.md`](02-ui-and-design-system.md) §1 (token tables) |
| Added a new file under `styles/components/` or `styles/views/` | Confirm it's `@import`ed in [`src/renderer/styles/index.css`](../src/renderer/styles/index.css) and noted in [`docs/02-ui-and-design-system.md`](02-ui-and-design-system.md) §2 |
| Added a context or a new hook category | [`docs/07-conventions.md`](07-conventions.md) §3 (state hierarchy) |
| Added a deadlock-api wrapper or asset endpoint | [`docs/06-overwolf-integration.md`](06-overwolf-integration.md) §5 (wrappers + caching table) |
| Added a new dependency (with explicit user approval) | [`AGENTS.md`](../AGENTS.md) §2 (dependency list) |
| Established a new convention or pattern | [`docs/07-conventions.md`](07-conventions.md) (the relevant section) and a "Things to avoid" entry in the related doc |

### Self-check

- [ ] Run `rg "<my new symbol>" docs/ AGENTS.md` — every place that should mention it actually does.
- [ ] If you removed something, `rg "<old symbol>" docs/ AGENTS.md` returns no stale references.
- [ ] All cross-doc links still resolve (file paths and section anchors).
- [ ] Tables in registry sections (storage keys, `MessageType`, hotkeys, windows, components) are alphabetized or grouped consistently with the existing style.

---

## 6. Where to look next

- The doc that explains the *why* behind each step → [`01-architecture.md`](01-architecture.md), [`02-ui-and-design-system.md`](02-ui-and-design-system.md), [`03-views-and-navigation.md`](03-views-and-navigation.md), [`04-ftue.md`](04-ftue.md), [`05-data-and-persistence.md`](05-data-and-persistence.md), [`06-overwolf-integration.md`](06-overwolf-integration.md), [`07-conventions.md`](07-conventions.md).
