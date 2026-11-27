import { describe, expect, test } from "claude-code/testing"

import type { BandInfo } from "../types"

import {
  activeAgents,
  countLines,
  formatCountdown,
  formatResetDay,
  hasChanges,
  parseNumstat,
  segments,
  shortenPath,
  usageLevel,
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

describe("segments empties a window once its reset has passed", () => {
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
