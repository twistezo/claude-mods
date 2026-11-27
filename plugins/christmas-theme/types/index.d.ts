// What the scene draws from, kept in the session's state so a redraw reads the latest figures
export type SnowState = {
  // Percent of the context window in use, 0 to 100
  percent: number
  // When the prompt cache the main thread last wrote or read lapses, in `$.clock.now()`
  // milliseconds, or null when there is none (a new session, or just after a compaction)
  cacheExpiresAt: number | null
  // The lifetime the last cache write was given, kept for a later request that only reads
  cacheTtlMs: number | null
  // Whole minutes left on the cache, rounded up, or null when it has lapsed or there is none
  cacheMinutes: number | null
}

declare module "claude-code" {
  interface PluginState {
    "christmas-theme": { snow: SnowState }
  }
}
