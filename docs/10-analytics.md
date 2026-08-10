# 10 — Analytics (PostHog)

This doc is the decision-and-implementation guide for product analytics. Use it
**while building a feature**, not after: first decide whether the feature needs
analytics at all, then — if it does — answer the guiding questions and add the
event the same way every other event is added.

Read [`AGENTS.md`](../AGENTS.md) first. The runtime wiring lives in
[`src/shared/services/analytics/`](../src/shared/services/analytics/); the typed
event catalog [`events.ts`](../src/shared/services/analytics/events.ts) is the
**single source of truth** for every event name and property shape.

Foundation facts (already true, don't re-derive them):

- PostHog, **EU region**. Key injected at build from a gitignored `.env` (see [`.env.example`](../.env.example)); no key → analytics no-ops.
- `distinct_id` is an **anonymous Overwolf `machineId`**. We never send personal data — no Steam ID, no player names.
- The module is initialized **per window** already. Anywhere in `src/` you can `import { track } from '<path>/shared/services/analytics'` and call it. `track()` self-gates on opt-out and buffers until init completes, so you never guard it yourself.

---

## 1. Decision gate — does this feature even need analytics?

Add an event only if it would **answer a real product question or change a
decision**. Instrument the *primary action(s)* of a feature and stop; a single
outcome event usually beats ten micro-events.

Run this gate before writing any `track()` call:

- [ ] **Does it change a decision?** Name the decision the data informs (what to build next, what to cut, what to fix). If you can't name one, don't add the event.
- [ ] **Does it map to a goal?** Every event should serve one of: **activation**, **retention**, **engagement depth**, **feature adoption**, or **reliability**. If it maps to none, skip it.
- [ ] **Is it a meaningful action or value moment?** A user *doing* something or *receiving* value — not incidental UI churn (hovers, re-renders, per-frame updates).
- [ ] **Is it non-duplicative?** Check [`events.ts`](../src/shared/services/analytics/events.ts) — an existing event (often with a new property value) may already cover it.

**Skip analytics** when the thing is: purely cosmetic, dev-only, high-frequency
with no aggregate value, or already implied by another event. When unsure, ship
**one** lifecycle/outcome event and add detail later — under-instrumenting is
cheap to fix; event spam and PII are not.

> Rule of thumb: a new *view* almost always deserves reach + one primary
> interaction. A new *button inside an existing view* usually deserves an event
> only if clicking it is a goal-relevant action (adoption, activation, a funnel
> step) — not just because it exists.

---

## 2. Guiding questions — before you add an event

Answer these; they determine the event name, its properties, and where it fires.

1. **What question does it answer?** One sentence. ("Do users who use Counter Items retain better?")
2. **Which goal?** activation / retention / engagement / adoption / reliability.
3. **What is the action or outcome?** Name it `object_action`, past tense (`match_tracked`, `item_tracking_toggled`, `contribute_upload_failed`).
4. **What context (properties) makes it useful?** Low-cardinality dimensions you'll break down or filter by (`source`, `game_mode`, `overlay_type`, `result`). **No PII, no free text.**
5. **Discrete action, impression, or stream?** A one-off click is a plain event. A passive "it appeared" is an impression (fire once per occurrence). A high-frequency stream (roster ticks, slider drags, keystrokes) must be **aggregated** — count it and emit one summary, or fire on release/commit.
6. **Where does it fire?** Background (game/match/overlay lifecycle) or a renderer component/hook (screens, clicks, filters). See §5.
7. **Event or person property?** An *action* is an event (`track`). A durable *trait* of the user ("has connected Steam") is a person property (`setPersonProperties`) — and still never the PII value itself, only the boolean/derived fact.
8. **Which dashboard/insight consumes it?** If no dashboard would use it, reconsider §1.

---

## 3. Conventions (non-negotiable)

- **Naming:** events and properties are `snake_case`; events are `object_action`, past tense. No `$` prefix (reserved by PostHog).
- **Type-safe only:** add the event + its property type to [`events.ts`](../src/shared/services/analytics/events.ts) first. `track()` is generic over that map — an unlisted name or wrong props is a compile error. Never bypass it.
- **Property over name-explosion:** one `screen_viewed` with a `screen_name` property, not one event per screen. Same for `overlay_shown` / `overlay_type`.
- **No PII, ever:** no Steam ID, player names, raw search strings, emails, file paths. Send booleans (`has_query`), counts, or coarse enums instead. `match_id` is allowed (not personal data).
- **Control volume:** aggregate per-match / per-session; never per-tick. Sliders fire on release (`onMouseUp`), not `onChange`. Track *manual* actions only — exclude auto-dismiss/auto-refresh/mount auto-loads.
- **Respect consent:** `track()` already no-ops when the user opts out (Settings → Privacy). Don't add a parallel path that bypasses it.

---

## 4. How to implement (mechanics)

1. **Add to the catalog** — [`events.ts`](../src/shared/services/analytics/events.ts):
   ```ts
   export interface AnalyticsEventProperties {
     // ...
     my_feature_used: {
       source: 'sidebar' | 'hotkey';
       // low-cardinality context only; no PII
     };
   }
   ```
2. **Fire it at the action site:**
   ```ts
   import { track } from '../../shared/services/analytics'; // adjust depth
   track('my_feature_used', { source: 'sidebar' });
   ```
3. **Durable trait? Set a person property instead of (or alongside) the event:**
   ```ts
   import { setPersonProperties } from '../../shared/services/analytics';
   setPersonProperties({ my_feature_enabled: true });
   ```
4. **New failure point on the deadlock-api?** It's likely already captured by the
   global axios interceptor. If it's a new endpoint, add a mapping in
   [`apiErrorTracking.ts`](../src/shared/services/analytics/apiErrorTracking.ts).
5. **Build & verify** — see §6.

---

## 5. Where to instrument (seam guide)

| What you're measuring | Fire it in |
|---|---|
| Game/match lifecycle, overlay shown, hotkey actions | [`background.controller.ts`](../src/main/controllers/background.controller.ts) or the relevant `src/main/services/*` |
| Screen views, clicks, filters, toggles, dialogs | The renderer component or its hook |
| A store mutation used from several places (e.g. tracking a preset) | The shared hook/store that centralizes it (instrument once — mirror `useNotificationPrefs`) |
| deadlock-api request failures | Automatic via [`apiErrorTracking.ts`](../src/shared/services/analytics/apiErrorTracking.ts) |
| A high-frequency in-match stream | Accumulate counters in the background and emit **one** summary event at the end (mirror `match_tracked`) |

Both sides share the module, so put the event wherever the action actually
happens — don't route a click through IPC just to fire an event.

---

## 6. Verification

- [ ] `yarn build` (or `yarn dev`) is clean — the typed catalog compiled.
- [ ] The event appears in **PostHog → Activity → Live events** with the expected properties, from the expected `window` super-property.
- [ ] **No PII** in the payload — eyeball every property value.
- [ ] Volume is sane — the event does not fire per frame / per keystroke / per drag-step.
- [ ] Opt-out honored — toggling Settings → Privacy off stops the event.

## Things to avoid

- **Vanity events** with no decision attached (§1).
- **PII** in any event or person property.
- **Event-name explosion** — use a property, not a new name per variant.
- **Per-tick / per-keystroke / per-drag** firing — aggregate or fire on commit.
- **Unlisted event names** — always extend [`events.ts`](../src/shared/services/analytics/events.ts) first.
- **Bypassing `track()`** (e.g. calling `posthog.capture` directly) — it skips opt-out, buffering, and super properties.

---

## 7. Where to look next

- The event catalog and module → [`src/shared/services/analytics/`](../src/shared/services/analytics/).
- The feature-building checklists (this guide is referenced from them) → [`08-adding-a-feature.md`](08-adding-a-feature.md).
- Persistence & storage keys (opt-out flag, device id live here) → [`05-data-and-persistence.md`](05-data-and-persistence.md).
