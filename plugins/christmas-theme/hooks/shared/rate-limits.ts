// Reads, keeps and shows the account's rate-limit windows, the same way in every mod that shows them.
// session-band's `5h` and `1w` are the reference: christmas-theme's snow takes the `5h` figure from here too.
// Source of truth: shared/rate-limits. `npm run sync` copies it to each mod that uses it, into hooks/shared

import type { EngineInterface, SessionRateLimit } from "claude-code"

// The rate-limit windows the mods show
export type RateLimitKind = "five_hour" | "seven_day"

// The rate limits to show, and whether they were kept from an earlier session
export type ShownRateLimits = {
  rateLimits: readonly SessionRateLimit[]
  cached: boolean
}

// The store key for the last rate limits any session saw; each mod keeps its own store
const RATE_LIMITS_KEY: string = "rateLimits"

const findLimit = (
  rateLimits: readonly SessionRateLimit[],
  kind: RateLimitKind,
): SessionRateLimit | undefined => rateLimits.find(limit => limit.kind === kind)

export const limitPercent = (
  rateLimits: readonly SessionRateLimit[],
  kind: RateLimitKind,
): number | null => findLimit(rateLimits, kind)?.percentUsed ?? null

export const limitResetsAt = (
  rateLimits: readonly SessionRateLimit[],
  kind: RateLimitKind,
): string | null => findLimit(rateLimits, kind)?.resetsAt ?? null

// A reset time in milliseconds since the epoch; NaN when missing or not a date
export const parseResetsAt = (resetsAt: string | null | undefined): number =>
  resetsAt === null || resetsAt === undefined
    ? Number.NaN
    : Date.parse(resetsAt)

// A window whose reset time has passed is empty again: the last response's percent is stale
export const windowPercent = (
  percent: number | null,
  resetsAt: string | null,
  now: number,
): number | null => {
  const at: number = parseResetsAt(resetsAt)

  return percent !== null && !Number.isNaN(at) && at <= now ? 0 : percent
}

// The whole percent a window shows: the band's figure, and the snow's depth
export const wholePercent = (percent: number): number => Math.round(percent)

const isStoredRateLimit = (entry: unknown): entry is SessionRateLimit => {
  if (typeof entry !== "object" || entry === null) {
    return false
  }

  const fields: Record<string, unknown> = entry as Record<string, unknown>

  return (
    typeof fields.kind === "string" &&
    typeof fields.percentUsed === "number" &&
    typeof fields.resetsAt === "string" &&
    !Number.isNaN(parseResetsAt(fields.resetsAt))
  )
}

// Rate limits read back from the mod's store: well-formed entries only, as an older or
// broken write may have left anything there. An entry needs a reset time, so a kept
// reading always expires: once its reset passes it reads 0%
export const storedRateLimits = (value: unknown): SessionRateLimit[] =>
  Array.isArray(value) ? value.filter(isStoredRateLimit) : []

// The limits to keep: the fresh windows, plus the kept ones the fresh reading left out,
// so a reading without `seven_day` does not drop the kept `1w`
export const mergeRateLimits = (
  stored: readonly SessionRateLimit[],
  fresh: readonly SessionRateLimit[],
): SessionRateLimit[] => [
  ...fresh,
  ...stored.filter(kept => !fresh.some(limit => limit.kind === kept.kind)),
]

// The two below take `$`, so they are function declarations, not arrow functions: the engine
// follows `$` past an import only into a function declaration

// Keeps a new reading for the next session, merged by window so one left out stays kept.
// Call it only when a `session.measure` says `rateLimits` changed, so a session holding an
// older reading never writes it over a newer one
export async function saveRateLimits(
  $: EngineInterface,
  fresh: readonly SessionRateLimit[],
): Promise<void> {
  if (fresh.length === 0) {
    return
  }

  const stored: SessionRateLimit[] = storedRateLimits(
    await $.store.get(RATE_LIMITS_KEY),
  )

  await $.store.set(RATE_LIMITS_KEY, mergeRateLimits(stored, fresh))
}

// This session's rate limits; until it has a reading of its own (a new conversation before
// its first response), the kept ones, marked cached. Kept limits have no account attached,
// as the engine names none: after an account switch they show until the first response
export async function shownRateLimits(
  $: EngineInterface,
  fresh: readonly SessionRateLimit[],
): Promise<ShownRateLimits> {
  if (fresh.length > 0) {
    return { rateLimits: fresh, cached: false }
  }

  const stored: SessionRateLimit[] = storedRateLimits(
    await $.store.get(RATE_LIMITS_KEY),
  )

  return { rateLimits: stored, cached: stored.length > 0 }
}
