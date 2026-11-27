import { describe, expect, test } from "claude-code/testing"
import type { TurnUsage } from "claude-code"

import { cacheMinutesLeft, cacheTtlMs, contextPercent } from "./session-snow"

const MINUTE_MS: number = 60_000
const HOUR_MS: number = 60 * MINUTE_MS

// A response that neither wrote nor read the cache, changed by each case
const usage = (change: Partial<TurnUsage>): TurnUsage => ({
  input_tokens: 1200,
  output_tokens: 300,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  model: "claude-opus-5-5",
  ...change,
})

describe("contextPercent is the whole percent the sign shows", () => {
  test("is 0 before the first reading", () => {
    expect(contextPercent(undefined)).toBe(0)
  })

  test("rounds to a whole percent", () => {
    expect(contextPercent(43.6)).toBe(44)
    expect(contextPercent(4.4)).toBe(4)
  })

  test("stays within 0 to 100 for a reading past either end", () => {
    expect(contextPercent(-3)).toBe(0)
    expect(contextPercent(104)).toBe(100)
  })
})

describe("cacheTtlMs reads how long the cache lasts from a response", () => {
  test("is one hour after a one-hour write", () => {
    const written = usage({
      cache_creation_input_tokens: 9000,
      ephemeral_1h_input_tokens: 9000,
      ephemeral_5m_input_tokens: 0,
    })

    expect(cacheTtlMs(written, null)).toBe(HOUR_MS)
  })

  test("is five minutes after a five-minute write", () => {
    const written = usage({
      cache_creation_input_tokens: 9000,
      ephemeral_1h_input_tokens: 0,
      ephemeral_5m_input_tokens: 9000,
    })

    expect(cacheTtlMs(written, HOUR_MS)).toBe(5 * MINUTE_MS)
  })

  test("takes the shorter lifetime when a response wrote both", () => {
    const written = usage({
      cache_creation_input_tokens: 9000,
      ephemeral_1h_input_tokens: 6000,
      ephemeral_5m_input_tokens: 3000,
    })

    expect(cacheTtlMs(written, null)).toBe(5 * MINUTE_MS)
  })

  test("is five minutes for a write with no lifetime reported", () => {
    expect(cacheTtlMs(usage({ cache_creation_input_tokens: 9000 }), null)).toBe(
      5 * MINUTE_MS,
    )
  })

  test("keeps the last write's lifetime when a response only read", () => {
    const read = usage({ cache_read_input_tokens: 50_000 })

    expect(cacheTtlMs(read, HOUR_MS)).toBe(HOUR_MS)
    expect(cacheTtlMs(read, null)).toBe(5 * MINUTE_MS)
  })

  test("is null when a response neither wrote nor read, or none arrived", () => {
    expect(cacheTtlMs(usage({}), HOUR_MS)).toBeNull()
    expect(cacheTtlMs(null, HOUR_MS)).toBeNull()
  })
})

describe("cacheMinutesLeft is what the candle shows", () => {
  const now: number = 1_000_000_000

  test("reads 60m for a fresh one-hour cache", () => {
    expect(cacheMinutesLeft(now + HOUR_MS, now)).toBe(60)
  })

  test("rounds a part minute up, so the last seconds still read 1m", () => {
    expect(cacheMinutesLeft(now + 51 * MINUTE_MS - 1, now)).toBe(51)
    expect(cacheMinutesLeft(now + 1, now)).toBe(1)
  })

  test("is null once the cache has lapsed, or when there is none", () => {
    expect(cacheMinutesLeft(now, now)).toBeNull()
    expect(cacheMinutesLeft(now - MINUTE_MS, now)).toBeNull()
    expect(cacheMinutesLeft(null, now)).toBeNull()
  })
})
