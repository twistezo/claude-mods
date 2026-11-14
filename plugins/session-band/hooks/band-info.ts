import type { AgentStatus, SessionRateLimit } from "claude-code"

import type { BandInfo, LineChanges } from "../types"

export type UsageLevel = "normal" | "warning" | "danger"

// The rate-limit windows the band shows
export type RateLimitKind = "five_hour" | "seven_day"

// One labelled figure after the folder and branch: `ctx 64%`, `agents 2`.
// The value is drawn bold in its level's color, the label and unit muted
export type Segment = {
  label: string
  value: string
  unit: string
  level: UsageLevel
  // Shown once a window turns orange (above 80%): `resets in 2h 14m`, `resets Sun 15:00`
  reset: ResetNote | null
}

// A muted label and a bold time, after a window above 80%
export type ResetNote = {
  label: string
  value: string
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

export const limitResetsAt = (
  rateLimits: readonly SessionRateLimit[],
  kind: RateLimitKind,
): string | null =>
  rateLimits.find(limit => limit.kind === kind)?.resetsAt ?? null

// 2h 14m, or 14m under an hour; a partial minute counts as a whole one
export const formatCountdown = (milliseconds: number): string => {
  const minutes: number = Math.max(0, Math.ceil(milliseconds / 60_000))
  const hours: number = Math.floor(minutes / 60)

  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

// Sun 15:00: the desktop app's day, with a 24-hour local time
export const formatResetDay = (date: Date): string => {
  const day: string = date.toLocaleString("en-US", { weekday: "short" })
  const time: string = date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })

  return `${day} ${time}`
}

// How a window shows its reset: a countdown for the five-hour one, a day for the week
type ResetStyle = "countdown" | "day"

const resetNote = (
  resetsAt: string | null,
  style: ResetStyle,
  now: number,
): ResetNote | null => {
  const at: number = resetsAt === null ? Number.NaN : Date.parse(resetsAt)

  if (Number.isNaN(at)) {
    return null
  }

  return style === "countdown"
    ? { label: "resets in", value: formatCountdown(at - now) }
    : { label: "resets", value: formatResetDay(new Date(at)) }
}

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

const usageSegment = (
  label: string,
  percent: number | null,
  reset: ResetNote | null = null,
): Segment[] =>
  percent === null
    ? []
    : [
        {
          label,
          value: String(Math.round(percent)),
          unit: "%",
          level: usageLevel(percent),
          reset: usageLevel(percent) === "normal" ? null : reset,
        },
      ]

// The figures to show, in order, leaving out the ones with no reading.
// `now` in milliseconds since the epoch, for the countdown to a reset
export const segments = (band: BandInfo, now: number): Segment[] => [
  ...usageSegment("ctx", band.context),
  ...usageSegment(
    "5h",
    band.fiveHour,
    resetNote(band.fiveHourResetsAt, "countdown", now),
  ),
  ...usageSegment(
    "7d",
    band.sevenDay,
    resetNote(band.sevenDayResetsAt, "day", now),
  ),
  ...(band.agents > 0
    ? [
        {
          label: "agents",
          value: String(band.agents),
          unit: "",
          level: "normal" as const,
          reset: null,
        },
      ]
    : []),
]
