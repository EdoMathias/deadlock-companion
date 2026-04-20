# 02 — UI and Design System

This doc defines the visual identity, the CSS architecture, and the shared component inventory. Follow it for every UI change so screens stay cohesive across windows.

Read [`AGENTS.md`](../AGENTS.md) and [`docs/01-architecture.md`](01-architecture.md) first.

---

## 1. Visual identity

Deadlock Companion uses a dark, atmospheric palette inspired by the game itself: **deep charcoal and forest-green surfaces, warm cream typography, sage-green accents**. The theme should feel grounded and tactile — never neon or "techy".

| Surface tier | Token | Hex | Use |
|---|---|---|---|
| App background | `--color-bg-primary` | `#222021` | Outermost background of every window |
| Section / panel | `--color-bg-secondary` | `#2f4442` | Side nav, ad slots, secondary panels |
| Card / popover | `--color-bg-card` | `#3f5d4d` | Cards, modals, dropdown menus, raised surfaces |
| Border | `--color-border` | `rgba(63, 93, 77, 0.6)` | Hairlines on cards, inputs, dividers |

| Text tier | Token | Hex | Use |
|---|---|---|---|
| Primary | `--color-text-primary` | `#efdebf` | Body, headings, default content |
| Secondary | `--color-text-secondary` | `#c5b89a` | Captions, meta info |
| Muted | `--color-text-muted` | `#9c8c72` | Disabled, placeholders, low-emphasis labels |

| Semantic | Token | Hex | Use |
|---|---|---|---|
| Accent / brand | `--color-accent-primary` | `#72947f` | Active nav, primary buttons, focus ring |
| Accent dark | `--color-accent-secondary` | `#3f5d4d` | Hover/pressed states on accent surfaces |
| Success | `--color-success` | `#72947f` | Win indicators, "online" |
| Warning | `--color-warning` | `#c8a96a` | Cautions, "stale" cache |
| Danger | `--color-danger` | `#a84632` | Loss indicators, destructive confirms |

### Typography

```
--font-ark: 'Inter', system-ui, sans-serif;
--font-size: 16px;
```

The Google Fonts stylesheet is loaded by `variables.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

Use `var(--font-ark)` for every `font-family` declaration. Only the four loaded weights (400/500/600/700) are guaranteed to render correctly — do not request 800/900.

### Radius scale

```
--radius:    0.625rem;   /* 10px — default */
--radius-sm: calc(var(--radius) - 4px);   /* 6px  — small inputs, chips */
--radius-md: calc(var(--radius) - 2px);   /* 8px  — buttons, tags */
--radius-lg: var(--radius);               /* 10px — cards */
--radius-xl: calc(var(--radius) + 4px);   /* 14px — modals, popovers */
```

### Legacy / shadcn-compatible aliases

`variables.css` also defines a parallel set of `--background`, `--foreground`, `--card`, `--primary`, `--destructive`, `--sidebar*`, `--chart-*`, etc. that map onto the canonical tokens above. **Prefer the `--color-*` and `--color-bg-*` names** in new code — the aliases exist for legacy components and should not grow.

The full source of truth: [`src/renderer/styles/variables.css`](../src/renderer/styles/variables.css).

---

## 2. CSS architecture

### One global stylesheet, ordered imports

There is exactly one CSS entry point per renderer: [`src/renderer/styles/index.css`](../src/renderer/styles/index.css). It `@import`s every stylesheet in a deliberate order:

```
1. variables.css         — design tokens
2. base.css              — resets, body, scrollbars, utilities
3. layout.css            — app-layout, app-body, side-nav, main-content, ad-sidebar
4. components/*.css      — buttons, modals, inputs, tabs, cards, header, widgets, refresh-button, ingest
5. views/*.css           — overview, topmaps, settings, ftue, ingame, dashboard, library,
                            widgets, rotations, deadlock-views, companion-ready, contribute
```

`Main.tsx` (and any other window's root component) imports `'../styles/index.css'` once. **Every new stylesheet must be added to `index.css`** — do not import CSS from random component files.

### When to add a stylesheet vs extend an existing one

- **New shared component** → new file under `styles/components/<component>.css`.
- **New view (tab)** → new file under `styles/views/<view>.css`.
- **One-off tweak to an existing component** → edit the existing file — keep one component per CSS file.

### Class naming

Three coexisting conventions, used for different scopes:

| Style | When | Example |
|---|---|---|
| BEM-like (`block__element--modifier`) | Component-scoped styling that won't leak | `.rank-slider__trigger`, `.hero-select__dropdown`, `.match-card__header--win` |
| Semantic / atomic | Layout primitives and chrome | `.app-layout`, `.app-header`, `.main-content`, `.ad-sidebar` |
| Prefix grouping | Feature families | `.ftue-tooltip`, `.ftue-spotlight`, `.modal-overlay`, `.modal-overlay--content` |

Pick one style per file and stay consistent inside it. **Do not** introduce CSS-in-JS, Tailwind utility classes, styled-components, or `inline-block`-only `style={}` props for theming. Inline `style` is acceptable only for runtime-computed values (positions, sizes, transforms).

### CSS Modules — allowed but optional

`index.css` documents an opt-in path:

> For component-specific styles that need CSS Modules: create a `.module.css` next to the component, `import styles from './X.module.css'`, use `className={styles.x}`. Keep shared styles in this architecture for global consistency.

Use Modules only when (a) you need true scope isolation and (b) the styles will not be reused by other components. Default is global classes in the manifest.

---

## 3. Shared component inventory

All cross-window components live under [`src/renderer/components/`](../src/renderer/components/) and are re-exported from [`src/renderer/components/index.ts`](../src/renderer/components/index.ts). **Always import from the barrel** — deep imports break refactors.

```ts
import { AppHeader, Modal, RefreshButton, RankRangeSlider, FTUETooltip } from '../../components';
```

| Component | Purpose | Notable props |
|---|---|---|
| `AppHeader` | Window chrome with drag handle, title, hotkey hint, action buttons, min/max/close. | `title`, `appVersion?`, `hotkeyTextInGame?`, `hotkeyTextDesktop?`, `actionButtons?: { icon, title, onClick }[]` |
| `Modal` | Generic confirm/cancel dialog with overlay. | `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `variant?: 'danger' \| 'default'` |
| `RankRangeSlider` | Dual-handle slider for rank filtering, sourced from `shared/data/ranks`. | `minBadge?`, `maxBadge?`, `onChange(min, max)` (`undefined` = "all ranks") |
| `HeroSelect` | Searchable single-select for `HEROES`. | `value: number \| string \| null`, `onChange(string \| null)` |
| `RefreshButton` | Refresh action with loading state, "X ago" timestamp, cached badge. | `onRefresh`, `isLoading`, `isCached`, `lastRefreshTime`, `tooltipText?` |
| `IngestCacheCard` | Collapsible promo card linking to the Contribute view. | (no props — uses `localStorage` + `navigate-view`) |
| `IngestPromptModal` | Modal asking the user to enable httpcache ingest. | `isOpen`, `onClose`, `onGoToScanner`, `scope?: 'global' \| 'content'` |
| `LaunchingOverlay` | Full-screen "launching..." overlay tied to `LaunchingContext`. | (no props — reads `useLaunching()`) |
| `UnassignedHotkeyModal` | Prompts the user to assign missing hotkeys. | `unassignedHotkeys: string[]`, `onOpenSettings`, `onDismiss` |
| `ReleaseNotesModal` | Renders an HTML release note via `dangerouslySetInnerHTML`. | `isOpen`, `note: ReleaseNoteEntry \| null`, `onClose`, `scope?` |
| `DataContributionModal` | Educational modal about the ingest project. | `isOpen`, `onClose`, `scope?` |
| `FTUEWelcomeModal` | First-run welcome modal, gated by `shouldShowStep('welcome')`. | (no props) |
| `FTUETooltip` | Spotlight + tooltip pointing at a `data-ftue-target` element. | `step`, `title`, `message`, `position?`, `targetSelector?`, `onDismiss?`, `showSkip?`, `onSkipAll?` |
| `Button` (alias) | The Settings view's `Button` re-exported as the project's "primary button". | `variant`, `onClick`, etc. — see source |

When you build a new shared component:

1. Create `src/renderer/components/MyComponent.tsx` (named export).
2. Add a stylesheet `src/renderer/styles/components/my-component.css` and `@import` it in `index.css`.
3. Re-export from `src/renderer/components/index.ts`.
4. Use only design tokens — no hardcoded colors, fonts, or radii.
5. If it lives in a portal, mount via `createPortal(node, document.body)` (see `FTUETooltip`, `FTUEWelcomeModal`).

---

## 4. Window chrome rules

Every window's title bar is the `AppHeader` component, which handles dragging through `@overwolf/odk-ts` `Windows.Self()`:

- The header listens for `mousedown` and starts an Overwolf drag.
- Action buttons inside the header MUST `event.stopPropagation()` on `mousedown` — otherwise clicking them initiates a drag.
- Min / Max / Close are baked into `AppHeader`; do not roll your own. Close on `main_ingame` calls **hide**, not close, so the in-game window can be reopened with a hotkey.

For non-main windows (`alert_overlay`, `companion_app_ready`):

- They do not show `AppHeader` — they have a custom minimal chrome.
- They are sized in [`public/manifest.json`](../public/manifest.json) and positioned by the background via odk-ts.
- They are **transparent** and **OSR** (`in_game_only`) — the React tree must not assume an opaque viewport. Always paint a background on a wrapping element.

---

## 5. Ad placement

Ads are exclusively rendered via [`AdContainer`](../src/renderer/main-window/components/AdContainer/AdContainer.tsx):

```tsx
<AdContainer width={400} height={600} />   // sidebar slot, supports high-impact mode
<AdContainer width={400} height={300} />   // sidebar slot, secondary
```

Rules:

- **Never instantiate `OwAd` directly.** `AdContainer` polls for `window.OwAd`, retries up to 10 s, builds a config, and handles the `high-impact-ad-loaded` / `removed` lifecycle (which expands the slot and hides siblings).
- Ads are gated on `isFTUEComplete` — they do not render during onboarding. This is enforced inside `AdContainer`; do not bypass.
- Ads only belong in the right-hand `aside.ad-sidebar` of the main window. Do not place ads inside views, modals, or other windows.
- All ad failures are caught and logged through `createLogger('AdContainer')`. They must never crash the React tree.

---

## 6. Scrollbars and small visual touches

`base.css` styles the scrollbar globally:

- Track: transparent
- Thumb: `var(--color-accent-primary)` with rounded corners

If a scroll container needs the styled scrollbar, add the class `.custom-scrollbar` (defined in `base.css`). The accent-glow utility `.cyber-glow` uses `color-mix` on `--color-accent-primary` — use it sparingly (active nav, focus emphasis).

---

## 7. Doing it wrong vs. doing it right

| Don't | Do |
|---|---|
| `color: #efdebf;` | `color: var(--color-text-primary);` |
| `font-family: 'Inter', sans-serif;` | `font-family: var(--font-ark);` |
| `border-radius: 8px;` | `border-radius: var(--radius-md);` |
| `import './MyComponent.css'` from a `.tsx` | Add to `styles/components/` and import in `index.css` |
| Build a new modal from scratch | Reuse `Modal` or follow the FTUE modal pattern (`createPortal` + `.modal-overlay`) |
| `import { Modal } from '../../components/Modal'` | `import { Modal } from '../../components'` |
| Add a Tailwind/styled-components dependency | Extend the existing global CSS architecture |

---

## 8. Where to look next

- Adding a tab and wiring its CSS → [`03-views-and-navigation.md`](03-views-and-navigation.md)
- FTUE-specific UI patterns (`createPortal`, spotlights, "NEW" badges) → [`04-ftue.md`](04-ftue.md)
- Naming conventions for files and exports → [`07-conventions.md`](07-conventions.md)
