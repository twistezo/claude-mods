import type { AgentStatus } from "claude-code"

import type { BandInfo, LineChanges } from "../types"

import {
  parseResetsAt,
  wholePercent,
  windowPercent,
} from "./shared/rate-limits"

export type UsageLevel = "normal" | "warning" | "danger"

// One labelled figure after the folder and branch: `ctx 64%`, `agents 2`.
// The value is drawn bold in its level's color, the label and unit muted
export type Segment = {
  label: string
  value: string
  unit: string
  level: UsageLevel
  // A rate limit kept from an earlier session, drawn muted until this session reads its own
  muted: boolean
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
  const at: number = parseResetsAt(resetsAt)

  if (Number.isNaN(at)) {
    return null
  }

  return style === "countdown"
    ? { label: "resets in", value: formatCountdown(at - now) }
    : { label: "resets", value: formatResetDay(new Date(at)) }
}

export const activeAgents = (statuses: readonly AgentStatus[]): number =>
  statuses.filter(status => ACTIVE_STATUSES.includes(status)).length

// A count from `git diff --numstat`; `-` (a binary file) counts as 0
const numstatCount = (field: string | undefined): number => {
  const count: number = Number.parseInt(field ?? "", 10)

  return Number.isNaN(count) ? 0 : count
}

// Reads `git diff --numstat`, one `added<TAB>removed<TAB>path` line per file. Numbers only,
// so a translated git reads the same; an empty output means no changes
export const parseNumstat = (text: string): LineChanges => {
  let added: number = 0
  let removed: number = 0

  for (const line of text.split("\n")) {
    const [addedField, removedField] = line.split("\t")

    added += numstatCount(addedField)
    removed += numstatCount(removedField)
  }

  return { added, removed }
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
  muted: boolean = false,
): Segment[] =>
  percent === null
    ? []
    : [
        {
          label,
          value: String(wholePercent(percent)),
          unit: "%",
          level: usageLevel(percent),
          muted,
          reset: usageLevel(percent) === "normal" ? null : reset,
        },
      ]

// The figures to show, in order, leaving out the ones with no reading.
// `now` in milliseconds since the epoch, for the countdown to a reset
export const segments = (band: BandInfo, now: number): Segment[] => [
  ...usageSegment("ctx", band.context),
  ...usageSegment(
    "5h",
    windowPercent(band.fiveHour, band.fiveHourResetsAt, now),
    resetNote(band.fiveHourResetsAt, "countdown", now),
    band.rateLimitsCached,
  ),
  ...usageSegment(
    "1w",
    windowPercent(band.sevenDay, band.sevenDayResetsAt, now),
    resetNote(band.sevenDayResetsAt, "day", now),
    band.rateLimitsCached,
  ),
  ...(band.agents > 0
    ? [
        {
          label: "agents",
          value: String(band.agents),
          unit: "",
          level: "normal" as const,
          muted: false,
          reset: null,
        },
      ]
    : []),
]
