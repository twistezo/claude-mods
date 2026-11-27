import { describe, expect, test } from "claude-code/testing"
import type { SessionRateLimit } from "claude-code"

import { limitPercent, limitResetsAt, snowPercent } from "./session-snow"

const RESETS_AT: string = "2026-11-27T18:00:00.000Z"

const fiveHour = (percentUsed: number, resetsAt?: string): SessionRateLimit =>
  resetsAt === undefined
    ? { kind: "five_hour", percentUsed }
    : { kind: "five_hour", percentUsed, resetsAt }

const sevenDay: SessionRateLimit = { kind: "seven_day", percentUsed: 80 }

describe("limitPercent reads the five-hour window", () => {
  test("rounds its use to a whole percent", () => {
    expect(limitPercent([fiveHour(43.6)])).toBe(44)
  })

  test("ignores the seven-day window", () => {
    expect(limitPercent([sevenDay, fiveHour(12)])).toBe(12)
  })

  test("stays within 0 to 100", () => {
    expect(limitPercent([fiveHour(-2)])).toBe(0)
    expect(limitPercent([fiveHour(104)])).toBe(100)
  })

  test("is null without a five-hour reading, off a subscription or before the first response", () => {
    expect(limitPercent([])).toBeNull()
    expect(limitPercent([sevenDay])).toBeNull()
  })
})

describe("limitResetsAt reads when the window resets", () => {
  test("parses the ISO time", () => {
    expect(limitResetsAt([fiveHour(10, RESETS_AT)])).toBe(Date.parse(RESETS_AT))
  })

  test("is null when the time is missing or unreadable", () => {
    expect(limitResetsAt([fiveHour(10)])).toBeNull()
    expect(limitResetsAt([fiveHour(10, "soon")])).toBeNull()
    expect(limitResetsAt([])).toBeNull()
  })
})

describe("snowPercent melts the snow once the window resets", () => {
  const resetsAt: number = Date.parse(RESETS_AT)

  test("keeps the reading before the reset", () => {
    expect(snowPercent(70, resetsAt, resetsAt - 1)).toBe(70)
  })

  test("is 0 from the moment of the reset", () => {
    expect(snowPercent(70, resetsAt, resetsAt)).toBe(0)
    expect(snowPercent(70, resetsAt, resetsAt + 60_000)).toBe(0)
  })

  test("keeps the reading when the reset time is unknown", () => {
    expect(snowPercent(70, null, resetsAt)).toBe(70)
  })
})
