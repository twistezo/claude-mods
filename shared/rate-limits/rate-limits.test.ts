import { describe, expect, test } from "claude-code/testing"
import type { SessionRateLimit } from "claude-code"

import {
  limitPercent,
  limitResetsAt,
  mergeRateLimits,
  storedRateLimits,
  wholePercent,
  windowPercent,
} from "./rate-limits"

const NOW: number = new Date(2026, 10, 15, 12, 0).getTime()
const IN_2H_14M: string = new Date(NOW + (2 * 60 + 14) * 60_000).toISOString()
const SUNDAY_15: string = new Date(2026, 10, 15, 15, 0).toISOString()

describe("limitPercent picks one rate-limit window", () => {
  const limits: SessionRateLimit[] = [
    { kind: "five_hour", percentUsed: 16 },
    { kind: "spend_limit", percentUsed: 50 },
  ]

  test("returns the window's percent", () => {
    expect(limitPercent(limits, "five_hour")).toBe(16)
  })

  test("returns null when the window has no reading", () => {
    expect(limitPercent(limits, "seven_day")).toBe(null)
    expect(limitPercent([], "five_hour")).toBe(null)
  })
})

describe("limitResetsAt picks one window's reset time", () => {
  test("returns the window's reset time, or null without one", () => {
    const limits: SessionRateLimit[] = [
      { kind: "five_hour", percentUsed: 100, resetsAt: IN_2H_14M },
      { kind: "seven_day", percentUsed: 40 },
    ]

    expect(limitResetsAt(limits, "five_hour")).toBe(IN_2H_14M)
    expect(limitResetsAt(limits, "seven_day")).toBe(null)
    expect(limitResetsAt([], "five_hour")).toBe(null)
  })
})

describe("windowPercent empties a window once its reset has passed", () => {
  test("keeps the percent before the reset", () => {
    expect(windowPercent(97, IN_2H_14M, NOW)).toBe(97)
  })

  test("reads 0% once the reset time has passed", () => {
    const passed: string = new Date(NOW - 60_000).toISOString()

    expect(windowPercent(97, passed, NOW)).toBe(0)
  })

  test("keeps the percent without a reset time, and null without a reading", () => {
    expect(windowPercent(97, null, NOW)).toBe(97)
    expect(windowPercent(97, "not a date", NOW)).toBe(97)
    expect(windowPercent(null, IN_2H_14M, NOW)).toBe(null)
  })
})

describe("wholePercent is the figure a window shows", () => {
  test("rounds to the nearest whole percent", () => {
    expect(wholePercent(33.6)).toBe(34)
    expect(wholePercent(33.4)).toBe(33)
    expect(wholePercent(0)).toBe(0)
  })
})

describe("storedRateLimits reads back the last kept rate limits", () => {
  test("keeps well-formed entries with a reset time", () => {
    const kept: SessionRateLimit[] = [
      { kind: "five_hour", percentUsed: 42, resetsAt: IN_2H_14M },
      { kind: "seven_day", percentUsed: 30.5, resetsAt: SUNDAY_15 },
    ]

    expect(storedRateLimits(kept)).toEqual(kept)
  })

  test("drops entries without a usable reset time, as they would never expire", () => {
    expect(
      storedRateLimits([
        { kind: "seven_day", percentUsed: 92 },
        { kind: "five_hour", percentUsed: 85, resetsAt: "not a date" },
      ]),
    ).toEqual([])
  })

  test("drops malformed entries", () => {
    expect(
      storedRateLimits([
        { kind: "five_hour", percentUsed: "42" },
        { percentUsed: 10 },
        { kind: "seven_day", percentUsed: 5, resetsAt: 123 },
        null,
        "five_hour",
        { kind: "seven_day", percentUsed: 7, resetsAt: SUNDAY_15 },
      ]),
    ).toEqual([{ kind: "seven_day", percentUsed: 7, resetsAt: SUNDAY_15 }])
  })

  test("reads anything that is not a list as no limits", () => {
    expect(storedRateLimits(undefined)).toEqual([])
    expect(storedRateLimits({ kind: "five_hour" })).toEqual([])
  })
})

describe("mergeRateLimits keeps every window a session has seen", () => {
  const keptFiveHour: SessionRateLimit = {
    kind: "five_hour",
    percentUsed: 20,
    resetsAt: IN_2H_14M,
  }
  const keptSevenDay: SessionRateLimit = {
    kind: "seven_day",
    percentUsed: 40,
    resetsAt: SUNDAY_15,
  }

  test("a fresh window replaces the kept one of the same kind", () => {
    const fresh: SessionRateLimit = { ...keptFiveHour, percentUsed: 35 }

    expect(mergeRateLimits([keptFiveHour, keptSevenDay], [fresh])).toEqual([
      fresh,
      keptSevenDay,
    ])
  })

  test("a reading without the weekly window keeps the kept one", () => {
    expect(mergeRateLimits([keptSevenDay], [keptFiveHour])).toEqual([
      keptFiveHour,
      keptSevenDay,
    ])
  })

  test("keeps the fresh reading when nothing was kept", () => {
    expect(mergeRateLimits([], [keptFiveHour])).toEqual([keptFiveHour])
  })
})
