// What the scene shows of the session: how full the context is and how long the prompt cache lasts

import type { TurnUsage } from "claude-code"

const MINUTE_MS: number = 60_000
const FIVE_MINUTES_MS: number = 5 * MINUTE_MS
const ONE_HOUR_MS: number = 60 * MINUTE_MS

// The context fill as a whole percent from 0 to 100; 0 before the first reading
export const contextPercent = (percent: number | undefined): number =>
  percent === undefined ? 0 : Math.min(100, Math.max(0, Math.round(percent)))

// The cache lifetime a response gives: the one it wrote for (the shorter when it wrote both,
// as the engine's own `cacheTtl` counts it), the last write's when it only read,
// or null when it neither wrote nor read
export const cacheTtlMs = (
  usage: TurnUsage | null,
  previousTtlMs: number | null,
): number | null => {
  if (usage === null) {
    return null
  }

  if ((usage.ephemeral_5m_input_tokens ?? 0) > 0) {
    return FIVE_MINUTES_MS
  }

  if ((usage.ephemeral_1h_input_tokens ?? 0) > 0) {
    return ONE_HOUR_MS
  }

  if (usage.cache_creation_input_tokens > 0) {
    // A write with no lifetime reported: the API's default
    return FIVE_MINUTES_MS
  }

  if (usage.cache_read_input_tokens > 0) {
    return previousTtlMs ?? FIVE_MINUTES_MS
  }

  return null
}

// Whole minutes left, rounded up so a fresh one-hour cache reads 60m; null once it has lapsed
export const cacheMinutesLeft = (
  expiresAt: number | null,
  now: number,
): number | null => {
  if (expiresAt === null || expiresAt <= now) {
    return null
  }

  return Math.ceil((expiresAt - now) / MINUTE_MS)
}
