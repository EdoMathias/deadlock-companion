# 05 — Data and Persistence

This doc explains where to store every kind of data the app handles. Pick the wrong storage and you'll get either UI lag (huge `localStorage`), data loss (IndexedDB upgrade races), or stale data (no TTL).

Read [`AGENTS.md`](../AGENTS.md) and [`docs/01-architecture.md`](01-architecture.md) first.

---

## 1. Decision matrix

| Data shape | Storage | Why |
|---|---|---|
| Network response with a TTL (Steam profile, item metadata, analytics, patch list) | [`apiCache`](../src/shared/utils/apiCache.ts) — `localStorage` with TTL | Small, frequently re-read, fine to lose on quota errors |
| Large structured collections (match metadata, history lists, profiles per match, roster snapshots, GEP-discovered matches) | [`matchCache`](../src/renderer/services/matchCache.ts) — IndexedDB via [`createSimpleStore`](../src/shared/utils/indexedDBStorage.ts) | Bypasses 5–10 MB localStorage cap; async; survives across reloads |
| User preferences and small flags (which view is active, FTUE state, dismissed prompts) | `localStorage` directly with a `dl_` or `deadlock_companion_` prefix | Tiny strings, synchronous read at boot is fine |
| Notification preferences (item-tracking ids, presets) | [`notificationPreferences`](../src/shared/stores/notificationPreferences.ts) store under `dl_notification_prefs` | Already a typed store; do not duplicate |
| Overlay layout (alert position, dock edge, dismiss timeout, enabled flag) | [`overlayLayoutStore`](../src/shared/stores/overlayLayoutStore.ts) under `dl_overlay_layout` | Already a typed store with defaults |
| Authoritative game state (live roster, match id, items per player) | **In-memory in `BackgroundController`**, broadcast via `MessageChannel` on demand | Game state is volatile and renderers are recreated; one source of truth |
| Sensitive secrets (API keys baked at build time) | `webpack.DefinePlugin` → runtime `atob()` | Avoids committing readable plaintext; not security, just hygiene |

---

## 2. `apiCache` — TTL'd localStorage cache

[`src/shared/utils/apiCache.ts`](../src/shared/utils/apiCache.ts). Use for small JSON responses you don't want to refetch every page load.

```ts
import { apiCache } from '../../shared/utils/apiCache';

const cached = apiCache.get<SteamProfile>('steam_profile', accountId);
if (cached) return cached;

const fresh = await fetchFromApi();
apiCache.set('steam_profile', accountId, fresh, apiCache.TTL.STEAM_PROFILE);
return fresh;
```

Rules:

- **Always namespace by domain.** First arg is the namespace (e.g. `steam_profile`, `item_metadata`); second arg is the entity id.
- **Always pass an explicit TTL** from `apiCache.TTL`. Do not invent your own ms literals — extend the `CACHE_TTL` constant if you need a new one.
- All reads/writes silently swallow errors — the cache is best-effort. **Never** throw out of a `get`/`set`.
- Keys are written under the prefix `deadlock_cache_<namespace>_<id>`. `apiCache.invalidateAll()` wipes the namespace.

Current TTLs (in `CACHE_TTL`):

| Constant | Value | Used for |
|---|---|---|
| `STEAM_PROFILE` | 24 h | Steam name + avatar — rarely changes |
| `ACCOUNT_STATS` | 30 min | Per-account stats from deadlock-api |
| `ITEM_METADATA` | 24 h | Items API — schema rarely changes |
| `ITEM_ANALYTICS` | 1 h | Win rates / combos — matches API caching |
| `HERO_ANALYTICS` | 1 h | Hero win/pick/ban rates — matches API caching |
| `PATCHES` | 24 h | Patch list |

Known `apiCache` namespaces in use: `steam_profile`, `account_stats`, `item_metadata`, `heroes_metadata`, `item_stats`, `hero_stats`, `hero_ban_stats`, `patches`.

To add a new cached endpoint: add a TTL constant, namespace the key, wrap your fetcher with `get` → `set`.

---

## 3. `matchCache` — IndexedDB

[`src/renderer/services/matchCache.ts`](../src/renderer/services/matchCache.ts). Use for structured collections too large or too numerous for `localStorage`.

```ts
import { matchCache } from '../../services/matchCache';

const history = await matchCache.getHistory(accountId);
if (!history) {
  const fresh = await fetchHistory(accountId);
  await matchCache.setHistory(accountId, fresh);
}
```

### Why multiple databases?

`matchCache` deliberately uses **one IndexedDB per domain** rather than one DB with multiple object stores:

```
dl-match-history     (object store: 'history')      — TTL 30 min
dl-match-metadata    (object store: 'metadata')     — no TTL (immutable)
dl-steam-profiles    (object store: 'profiles')     — no TTL
dl-game-event-matches (object store: 'matches')     — no TTL
dl-roster-snapshots  (object store: 'snapshots')    — no TTL
```

Sharing a DB across stores forces a coordinated `version` bump every time you add a store, which races badly when multiple windows (`main_desktop` + `main_ingame`) open the DB simultaneously. Per-domain DBs avoid the `onupgradeneeded` race entirely.

**When adding a new domain**, follow the same pattern:

```ts
import { createSimpleStore } from '../../shared/utils/indexedDBStorage';

const myStore = createSimpleStore<MyShape>('dl-my-domain', 'records');
```

Use the `dl-` prefix and a singular object-store name. Wrap every call site in `try/catch` — IndexedDB rejects under quota pressure or in private browsing.

### TTL pattern

For data that should expire, store `{ data, expiry }` and check `Date.now() > expiry` on read, deleting if stale (mirror `getHistory`/`setHistory`). For immutable data (full match metadata, GEP-discovered matches), skip the TTL.

---

## 4. Direct `localStorage` — small flags only

For booleans, single ids, and tiny JSON, `localStorage` is fine. Always:

- Prefix the key with `dl_` (newer) or `deadlock_companion_` (older); never use a bare key.
- Wrap in `try/catch` (private mode and quota errors).
- Provide a sensible default if read fails.

Example (from FTUE):

```ts
const completed = (() => {
  try {
    return localStorage.getItem('deadlock_companion_ftue_completed') === 'true';
  } catch {
    return false;
  }
})();
```

If you find yourself writing more than ~3 keys for one feature, promote them to a typed store under `src/shared/stores/` (mirror `notificationPreferences.ts`).

---

## 5. Typed stores

[`src/shared/stores/`](../src/shared/stores/) hosts opinionated wrappers around a single `localStorage` key. Each one:

- Owns exactly one storage key.
- Exposes typed `get` / `set` / mutators.
- Merges persisted partial state with `DEFAULT_*` constants on read so adding fields is backward-compatible.

| File | Key | Shape |
|---|---|---|
| [`notificationPreferences.ts`](../src/shared/stores/notificationPreferences.ts) | `dl_notification_prefs` | `NotificationPreferences` (`tracked_item_ids`, presets) |
| [`overlayLayoutStore.ts`](../src/shared/stores/overlayLayoutStore.ts) | `dl_overlay_layout` | `OverlayLayoutConfig` (per-widget enabled/dock_edge/layout_mode/dismiss_timeout_s) |
| [`ultimateNotificationPreferences.ts`](../src/shared/stores/ultimateNotificationPreferences.ts) | `dl_ultimate_notification_prefs` | `UltimateNotificationPreferences` (`notify_self`, `notify_allies`, `notify_enemies`) |

When promoting flags to a store:

1. Define a `Default<Thing>` constant.
2. Write `getX` / `setX` / `updateX(partial)`; on read, spread `Default` first.
3. Wrap storage calls in `try/catch`.
4. Export a single namespace object (e.g. `notificationPreferences.get()`).

---

## 6. Canonical key registry

If you add a key, add it here. If a key is missing here, treat its existence as a bug.

### `localStorage` (renderer)

| Key | Owner | Purpose |
|---|---|---|
| `deadlock_companion_active_view` | `Main.tsx` | Last selected main-window tab |
| `deadlock_companion_steam_id` | `useSteamId` / `game-events.service.ts` | Cached Steam ID64 |
| `deadlock_companion_api_key` | `deadlockApiClient.ts` | Optional Patreon API key |
| `deadlock_companion_view_mode` | `useViewMode` | View mode flag |
| `deadlock_companion_release_notes_viewed` | `ReleaseNotesService` | Last seen release note |
| `deadlock_companion_ftue_completed` | `FTUEContext` | Main FTUE complete |
| `deadlock_companion_ftue_steps` | `FTUEContext` | Completed FTUE step set |
| `deadlock_companion_data_contribution_seen` | `FTUEContext` | DataContributionModal dismissed |
| `deadlock_companion_item_alerts_feature_seen` | `FTUEContext` | "NEW" badge cleared for Item Stats / Overlay Editor |
| `deadlock_companion_hero_stats_feature_seen` | `FTUEContext` | "NEW" badge cleared for Hero Stats |
| `deadlock_companion_counter_items_feature_seen` | `FTUEContext` | "NEW" badge cleared for Counter Items (clears on Overlay Editor visit) |
| `deadlock_companion_rotations_ftue_completed` | `FTUEContext` | Legacy — only cleared by reset |
| `deadlock_companion_interactive_map_ftue_completed` | `FTUEContext` | Legacy — only cleared by reset |
| `deadlock_companion_discord_badge_clicked` | `SideNav` | Discord "new" pip dismissed |
| `dl_notification_prefs` | `notificationPreferences` store | Tracked items + preset state |
| `dl_overlay_layout` | `overlayLayoutStore` | Per-widget overlay layout |
| `dl_ultimate_notification_prefs` | `ultimateNotificationPreferences` store | Ultimate-alert team filters (notify_self/allies/enemies) |
| `dl_ingest_card_expanded` | `IngestCacheCard` | User expanded the card |
| `dl_ingest_card_auto_expand` | `IngestCacheCard` | One-shot auto-expand flag |
| `dl_ingest_prompt_dismissed` | `IngestPromptModal` | "Don't ask again" |
| `dl_ingest_prompt_*` (other) | `BackgroundController` | Daily / permanent throttle for ingest prompt |
| `deadlock_cache_<namespace>_<id>` | `apiCache` | TTL'd network responses |
| `deadlock_cache_counter_item_stats_<heroId>_vs_<enemyIds>` | `apiCache` via `fetchCounterItemStats` | Counter-item recommendations vs enemy team (1 h TTL) |

### IndexedDB

| DB | Object store | Key | TTL |
|---|---|---|---|
| `dl-match-history` | `history` | `accountId` (string) | 30 min |
| `dl-match-metadata` | `metadata` | `matchId` (string) | none |
| `dl-steam-profiles` | `profiles` | `matchId` (string) | none |
| `dl-game-event-matches` | `matches` | `match_id` (string) | none |
| `dl-roster-snapshots` | `snapshots` | `matchId` (string) | none |

---

## 7. Things to avoid

- Storing JSON arrays larger than ~10 KB in `localStorage` — use IndexedDB.
- Sharing a single IndexedDB across multiple object stores — use one DB per domain.
- Reading or writing FTUE storage keys outside `FTUEContext` (or notification keys outside the store, or layout keys outside the store).
- Adding a new key without registering it in section 6 of this doc.
- Throwing out of a getter on quota or parse error — return a default.
- Caching mutable game state (live roster, match id) on disk — keep that in `BackgroundController` memory and broadcast over `MessageChannel`.
- Hand-rolling a new HTTP cache. Use `apiCache`.
- Mixing TTL and non-TTL data inside the same `matchCache` namespace. If a domain needs TTL, give it the `{ data, expiry }` shape consistently.

---

## 8. Where to look next

- How `MessageChannel` carries volatile game state instead of persisting it → [`06-overwolf-integration.md`](06-overwolf-integration.md)
- How the FTUE keys above are managed → [`04-ftue.md`](04-ftue.md)
- End-to-end "add a persistent setting" → [`08-adding-a-feature.md`](08-adding-a-feature.md)
