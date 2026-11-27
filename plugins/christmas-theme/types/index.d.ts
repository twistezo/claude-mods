// What the scene draws from, kept in the session's state so a redraw reads the latest figures
export type SnowState = {
  // Percent of the five-hour rate-limit window in use, 0 to 100
  percent: number
  // When that window resets, in milliseconds, or null when unknown
  resetsAt: number | null
  // When the figures last changed, in `$.clock.now()` milliseconds: the scene's animations take
  // their phase from it, so a redraw carries on where the last one was
  changedAt: number
}

declare module "claude-code" {
  interface PluginState {
    "christmas-theme": { snow: SnowState }
  }
}
