// How deep the snow lies: how much of the five-hour rate-limit window is used

import type { SessionRateLimit } from "claude-code"

const FIVE_HOUR_KIND: string = "five_hour"

// The five-hour window as the last API response reported it, or undefined without a reading
const fiveHourLimit = (
  rateLimits: readonly SessionRateLimit[],
): SessionRateLimit | undefined =>
  rateLimits.find(limit => limit.kind === FIVE_HOUR_KIND)

// When the five-hour window resets, in milliseconds, or null when unknown
export const limitResetsAt = (
  rateLimits: readonly SessionRateLimit[],
): number | null => {
  const resetsAt: string | undefined = fiveHourLimit(rateLimits)?.resetsAt
  const at: number = resetsAt === undefined ? Number.NaN : Date.parse(resetsAt)

  return Number.isNaN(at) ? null : at
}

// The window's use as a whole percent from 0 to 100, or null without a reading
export const limitPercent = (
  rateLimits: readonly SessionRateLimit[],
): number | null => {
  const used: number | undefined = fiveHourLimit(rateLimits)?.percentUsed

  return used === undefined
    ? null
    : Math.min(100, Math.max(0, Math.round(used)))
}

// The snow melts away once the window has reset, until the next response reports it again
export const snowPercent = (
  percent: number,
  resetsAt: number | null,
  now: number,
): number => (resetsAt !== null && resetsAt <= now ? 0 : percent)
