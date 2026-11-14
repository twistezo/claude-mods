import { describe, expect, test } from "claude-code/testing"
import type { SessionRateLimit } from "claude-code"

import type { BandInfo } from "../types"

import {
  activeAgents,
  countLines,
  hasChanges,
  limitPercent,
  parseShortstat,
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

describe("parseShortstat reads git's line counts", () => {
  test("reads insertions and deletions", () => {
    expect(
      parseShortstat(" 3 files changed, 347 insertions(+), 5 deletions(-)"),
    ).toEqual({ added: 347, removed: 5 })
  })

  test("reads the singular forms", () => {
    expect(
      parseShortstat(" 1 file changed, 1 insertion(+), 1 deletion(-)"),
    ).toEqual({ added: 1, removed: 1 })
  })

  test("counts a missing side as zero", () => {
    expect(parseShortstat(" 2 files changed, 12 insertions(+)")).toEqual({
      added: 12,
      removed: 0,
    })
    expect(parseShortstat(" 1 file changed, 4 deletions(-)")).toEqual({
      added: 0,
      removed: 4,
    })
  })

  test("reads empty output as no changes", () => {
    expect(parseShortstat("")).toEqual({ added: 0, removed: 0 })
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

describe("segments lists the figures with a reading", () => {
  const full: BandInfo = {
    path: "~/app",
    branch: "main",
    changes: { added: 347, removed: 5 },
    context: 64,
    fiveHour: 86,
    sevenDay: 100,
    agents: 2,
  }

  test("rounds percents to whole numbers", () => {
    expect(
      segments({
        ...full,
        context: 30.5,
        fiveHour: null,
        sevenDay: null,
        agents: 0,
      }),
    ).toEqual([{ label: "ctx", value: "31", unit: "%", level: "normal" }])
  })

  test("shows every figure in order, with its level", () => {
    expect(segments(full)).toEqual([
      { label: "ctx", value: "64", unit: "%", level: "normal" },
      { label: "5h", value: "86", unit: "%", level: "warning" },
      { label: "7d", value: "100", unit: "%", level: "danger" },
      { label: "agents", value: "2", unit: "", level: "normal" },
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

    expect(segments(empty)).toEqual([])
  })
})
