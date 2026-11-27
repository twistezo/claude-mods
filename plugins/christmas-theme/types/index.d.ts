// What the scene draws from, kept in the session's state so a redraw reads the latest figures
export type SnowState = {
  // The five-hour window's `percentUsed` as last read, or null before any reading
  used: number | null
  // When that window resets, as ISO 8601, or null when unknown
  resetsAt: string | null
  // The snow's depth: the whole percent session-band shows for `5h`, 0 once the window resets
  percent: number
  // When the figures last changed, in `$.clock.now()` milliseconds: the moving scene's
  // animations take their phase from it, so a redraw carries on where the last one was
  changedAt: number
}

declare module "claude-code" {
  interface PluginState {
    "christmas-theme": { snow: SnowState }
  }
}
