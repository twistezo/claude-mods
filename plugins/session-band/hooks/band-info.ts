import type { AgentStatus, SessionRateLimit } from "claude-code"

import type { BandInfo, LineChanges } from "../types"

export type UsageLevel = "normal" | "warning" | "danger"

// The rate-limit windows the band shows
export type RateLimitKind = "five_hour" | "seven_day"

// One labelled figure after the folder and branch: `ctx 64%`, `agents 2`
export type Segment = {
  label: string
  value: string
  level: UsageLevel
}

// The desktop app's own meters: warning above 80%, danger from 100%
const WARNING_ABOVE: number = 80
const DANGER_FROM: number = 100

// An agent still at work: queued, running or waiting on a tool
const ACTIVE_STATUSES: readonly AgentStatus[] = [
  "pending",
  "running",
  "waiting",
]

export const usageLevel = (percent: number): UsageLevel => {
  if (percent >= DANGER_FROM) {
    return "danger"
  }

  return percent > WARNING_ABOVE ? "warning" : "normal"
}

// /Users/me/projects/app with home /Users/me becomes ~/projects/app
export const shortenPath = (path: string, home: string | undefined): string => {
  if (home === undefined || home === "") {
    return path
  }

  if (path === home) {
    return "~"
  }

  return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path
}

export const limitPercent = (
  rateLimits: readonly SessionRateLimit[],
  kind: RateLimitKind,
): number | null =>
  rateLimits.find(limit => limit.kind === kind)?.percentUsed ?? null

export const activeAgents = (statuses: readonly AgentStatus[]): number =>
  statuses.filter(status => ACTIVE_STATUSES.includes(status)).length

// The count before a word in ` 3 files changed, 347 insertions(+), 5 deletions(-)`
const countBefore = (parts: readonly string[], word: string): number => {
  const part: string | undefined = parts.find(text => text.includes(word))

  return part === undefined ? 0 : Number.parseInt(part.trim(), 10)
}

// Reads `git diff --shortstat`; an empty output means no changes
export const parseShortstat = (text: string): LineChanges => {
  const parts: string[] = text.split(",")

  return {
    added: countBefore(parts, "insertion"),
    removed: countBefore(parts, "deletion"),
  }
}

// A text file's lines, the last one counted without a closing newline; 0 for a binary file
export const countLines = (text: string): number => {
  if (text === "" || text.includes("\u0000")) {
    return 0
  }

  const breaks: number = text.split("\n").length - 1

  return text.endsWith("\n") ? breaks : breaks + 1
}

export const hasChanges = (
  changes: LineChanges | null,
): changes is LineChanges =>
  changes !== null && (changes.added > 0 || changes.removed > 0)

export const formatPercent = (percent: number): string =>
  `${Math.round(percent)}%`

const usageSegment = (label: string, percent: number | null): Segment[] =>
  percent === null
    ? []
    : [{ label, value: formatPercent(percent), level: usageLevel(percent) }]

// The figures to show, in order, leaving out the ones with no reading
export const segments = (band: BandInfo): Segment[] => [
  ...usageSegment("ctx", band.context),
  ...usageSegment("5h", band.fiveHour),
  ...usageSegment("7d", band.sevenDay),
  ...(band.agents > 0
    ? [
        {
          label: "agents",
          value: String(band.agents),
          level: "normal" as const,
        },
      ]
    : []),
]
