// Lines added and removed, as `git diff --numstat` counts them
export type LineChanges = {
  added: number
  removed: number
}

// What the band shows, kept in the session's state so a redraw reads the latest figures
export type BandInfo = {
  // The session's folder, with the home folder written as ~
  path: string
  // The current branch, a short commit id when detached, or null outside a repository
  branch: string | null
  // Lines added and removed against origin, as `readChanges` counts them, or null outside a
  // repository
  changes: LineChanges | null
  // Percent of the context window in use, or null before the first response
  context: number | null
  // Percent used of the five-hour and seven-day rate-limit windows, or null without a reading
  fiveHour: number | null
  sevenDay: number | null
  // When each window resets, as ISO 8601, or null without a reading
  fiveHourResetsAt: string | null
  sevenDayResetsAt: string | null
  // The rate limits come from an earlier session, as this one has no reading yet
  rateLimitsCached: boolean
  // Agents working in the background right now
  agents: number
}

declare module "claude-code" {
  interface PluginState {
    "session-band": { info: BandInfo | null }
  }
}
