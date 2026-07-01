/**
 * Analytics build-time + runtime configuration.
 *
 * `POSTHOG_KEY` / `POSTHOG_HOST` are injected at build time by webpack's
 * DefinePlugin (see webpack.config.js), sourced from a gitignored `.env` file
 * (loaded via dotenv). See `.env.example`. The key is a *public* PostHog project
 * key (safe to ship in client code); keeping it in `.env` avoids committing it
 * and lets dev/prod keys differ.
 *
 * If `POSTHOG_KEY` is empty (e.g. a local build without the env var set),
 * analytics initialization no-ops so the app runs normally without telemetry.
 */

// Injected by webpack DefinePlugin — see webpack.config.js.
declare const __POSTHOG_KEY__: string;
declare const __POSTHOG_HOST__: string;

export const POSTHOG_KEY: string = __POSTHOG_KEY__;
export const POSTHOG_HOST: string = __POSTHOG_HOST__;

/**
 * localStorage key for the analytics opt-out flag. Overwolf windows of the same
 * extension share an origin, so this flag is visible to every window.
 */
export const ANALYTICS_OPT_OUT_KEY = 'dl_analytics_opted_out';

/** localStorage key for the persisted anonymous device id (the distinct_id). */
export const ANALYTICS_DEVICE_ID_KEY = 'dl_device_id';
