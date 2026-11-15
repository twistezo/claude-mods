import { describe, expect, test } from "claude-code/testing"
import type { SessionRateLimit } from "claude-code"

import type { BandInfo } from "../types"

import {
  activeAgents,
  countLines,
  formatCountdown,
  formatResetDay,
  hasChanges,
  limitPercent,
  limitResetsAt,
  mergeRateLimits,
  parseNumstat,
  segments,
  shortenPath,
  storedRateLimits,
  usageLevel,
  windowPercent,
} from "./band-info"

describe("usageLevel follows the desktop app's meters", () => {
  test("stays normal up to and at 80%", () => {
    expect(usageLevel(0)).toBe("normal")
    expect(usageLevel(80)).toBe("normal")
  })

  test("warns above 80%", () => {
    expect(usageLevel(80.1)).toBe("warning")
    expect(usageLevel(99.9)).toBe("warning")
  })

  test("is danger from 100%, past it too", () => {
    expect(usageLevel(100)).toBe("danger")
    expect(usageLevel(130)).toBe("danger")
  })
})

describe("shortenPath writes the home folder as ~", () => {
  test("shortens a folder inside home", () => {
    expect(shortenPath("/Users/me/projects/app", "/Users/me")).toBe(
      "~/projects/app",
    )
  })

  test("shows home itself as ~", () => {
    expect(shortenPath("/Users/me", "/Users/me")).toBe("~")
  })

  test("leaves a sibling that only shares the prefix", () => {
    expect(shortenPath("/Users/meg/app", "/Users/me")).toBe("/Users/meg/app")
  })

  test("leaves the path when home is unknown or empty", () => {
    expect(shortenPath("/srv/app", undefined)).toBe("/srv/app")
    expect(shortenPath("/srv/app", "")).toBe("/srv/app")
  })
})

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

describe("activeAgents counts agents still at work", () => {
  test("counts pending, running and waiting agents", () => {
    expect(activeAgents(["pending", "running", "waiting"])).toBe(3)
  })

  test("leaves out idle, finished, failed and killed agents", () => {
    expect(activeAgents(["idle", "completed", "failed", "killed"])).toBe(0)
    expect(activeAgents([])).toBe(0)
  })
})

describe("parseNumstat sums git's line counts", () => {
  test("sums added and removed lines across files", () => {
    expect(parseNumstat("340\t5\tsrc/app.ts\n7\t0\tREADME.md\n")).toEqual({
      added: 347,
      removed: 5,
    })
  })

  test("counts a binary file as no lines", () => {
    expect(parseNumstat("-\t-\tlogo.png\n2\t1\tsrc/app.ts")).toEqual({
      added: 2,
      removed: 1,
    })
  })

  test("keeps a path with a tab out of the counts", () => {
    expect(parseNumstat("3\t4\tweird\t9\tname")).toEqual({
      added: 3,
      removed: 4,
    })
  })

  test("reads empty output as no changes", () => {
    expect(parseNumstat("")).toEqual({ added: 0, removed: 0 })
  })
})

describe("countLines counts an untracked file's lines", () => {
  test("counts lines with and without a closing newline", () => {
    expect(countLines("a\nb\n")).toBe(2)
    expect(countLines("a\nb")).toBe(2)
    expect(countLines("one line")).toBe(1)
  })

  test("counts an empty file and a binary file as 0", () => {
    expect(countLines("")).toBe(0)
    expect(countLines("PNG\u0000\u0001data")).toBe(0)
  })
})

describe("hasChanges shows the segment only for real changes", () => {
  test("is true when lines were added or removed", () => {
    expect(hasChanges({ added: 3, removed: 0 })).toBe(true)
    expect(hasChanges({ added: 0, removed: 2 })).toBe(true)
  })

  test("is false with no changes or outside a repository", () => {
    expect(hasChanges({ added: 0, removed: 0 })).toBe(false)
    expect(hasChanges(null)).toBe(false)
  })
})

// Local times, so the expected days and hours hold in any time zone
const NOW: number = new Date(2026, 10, 15, 12, 0).getTime()
const IN_2H_14M: string = new Date(NOW + (2 * 60 + 14) * 60_000).toISOString()
const SUNDAY_15: string = new Date(2026, 10, 15, 15, 0).toISOString()

describe("formatCountdown shows hours and minutes left", () => {
  test("shows hours and minutes", () => {
    expect(formatCountdown((2 * 60 + 14) * 60_000)).toBe("2h 14m")
  })

  test("shows minutes alone under an hour, a partial minute as whole", () => {
    expect(formatCountdown(14 * 60_000)).toBe("14m")
    expect(formatCountdown(30_000)).toBe("1m")
  })

  test("shows 0m once the reset has passed", () => {
    expect(formatCountdown(-5_000)).toBe("0m")
  })
})

describe("formatResetDay shows the day and a 24-hour time", () => {
  test("shows the short day and hours past noon without AM or PM", () => {
    expect(formatResetDay(new Date(SUNDAY_15))).toBe("Sun 15:00")
  })

  test("pads morning hours to two digits", () => {
    expect(formatResetDay(new Date(2026, 10, 16, 9, 5))).toBe("Mon 09:05")
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

describe("segments lists the figures with a reading", () => {
  const full: BandInfo = {
    path: "~/app",
    branch: "main",
    changes: { added: 347, removed: 5 },
    context: 64,
    fiveHour: 86,
    sevenDay: 40,
    fiveHourResetsAt: IN_2H_14M,
    sevenDayResetsAt: SUNDAY_15,
    rateLimitsCached: false,
    agents: 2,
  }

  test("rounds percents to whole numbers", () => {
    const band: BandInfo = {
      ...full,
      context: 30.5,
      fiveHour: null,
      sevenDay: null,
      agents: 0,
    }

    expect(segments(band, NOW)).toEqual([
      {
        label: "ctx",
        value: "31",
        unit: "%",
        level: "normal",
        muted: false,
        reset: null,
      },
    ])
  })

  test("shows every figure in order, with its level, and a reset from above 80%", () => {
    expect(segments(full, NOW)).toEqual([
      {
        label: "ctx",
        value: "64",
        unit: "%",
        level: "normal",
        muted: false,
        reset: null,
      },
      {
        label: "5h",
        value: "86",
        unit: "%",
        level: "warning",
        muted: false,
        reset: { label: "resets in", value: "2h 14m" },
      },
      {
        label: "1w",
        value: "40",
        unit: "%",
        level: "normal",
        muted: false,
        reset: null,
      },
      {
        label: "agents",
        value: "2",
        unit: "",
        level: "normal",
        muted: false,
        reset: null,
      },
    ])
  })

  test("shows the reset at 100% too: a countdown for 5h, a day for 1w", () => {
    const band: BandInfo = { ...full, fiveHour: 100, sevenDay: 103, agents: 0 }

    expect(segments(band, NOW).slice(1)).toEqual([
      {
        label: "5h",
        value: "100",
        unit: "%",
        level: "danger",
        muted: false,
        reset: { label: "resets in", value: "2h 14m" },
      },
      {
        label: "1w",
        value: "103",
        unit: "%",
        level: "danger",
        muted: false,
        reset: { label: "resets", value: "Sun 15:00" },
      },
    ])
  })

  test("shows no reset at or below 80%, or without a reset time", () => {
    const band: BandInfo = {
      ...full,
      fiveHour: 80,
      sevenDay: 100,
      sevenDayResetsAt: "not a date",
      rateLimitsCached: false,
    }

    expect(segments(band, NOW).map(segment => segment.reset)).toEqual([
      null,
      null,
      null,
      null,
    ])
  })

  test("leaves out figures with no reading and agents at zero", () => {
    const empty: BandInfo = {
      ...full,
      context: null,
      fiveHour: null,
      sevenDay: null,
      agents: 0,
    }

    expect(segments(empty, NOW)).toEqual([])
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

  test("a passed 5h reset shows 0% with no reset note", () => {
    const band: BandInfo = {
      path: "~/app",
      branch: "main",
      changes: null,
      context: null,
      fiveHour: 97,
      sevenDay: null,
      fiveHourResetsAt: new Date(NOW - 60_000).toISOString(),
      sevenDayResetsAt: null,
      rateLimitsCached: false,
      agents: 0,
    }

    expect(segments(band, NOW)).toEqual([
      {
        label: "5h",
        value: "0",
        unit: "%",
        level: "normal",
        muted: false,
        reset: null,
      },
    ])
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

describe("segments mutes rate limits kept from an earlier session", () => {
  test("mutes 5h and 1w but not ctx or agents", () => {
    const band: BandInfo = {
      path: "~/app",
      branch: "main",
      changes: null,
      context: 10,
      fiveHour: 86,
      sevenDay: 40,
      fiveHourResetsAt: IN_2H_14M,
      sevenDayResetsAt: SUNDAY_15,
      rateLimitsCached: true,
      agents: 1,
    }

    expect(
      segments(band, NOW).map(segment => [segment.label, segment.muted]),
    ).toEqual([
      ["ctx", false],
      ["5h", true],
      ["1w", true],
      ["agents", false],
    ])
  })
})
