import { atom, read, update } from "claude-code"
import type {
  AgentInfo,
  Atom,
  EngineInterface,
  ProcessRunResult,
  Register,
  SessionUsage,
} from "claude-code"

import type { BandInfo, LineChanges } from "../types"

import {
  activeAgents,
  countLines,
  hasChanges,
  limitPercent,
  limitResetsAt,
  parseShortstat,
  segments,
  shortenPath,
} from "./band-info"
import type { Segment, UsageLevel } from "./band-info"

type Hex = `#${string}`

// The usage figures a refresh needs, from `$.session.usage()` or a `session.measure` event
type UsageFigures = Pick<SessionUsage, "context" | "rateLimits">

const bandInfo: Atom<BandInfo | null> = atom(
  { plugin: "session-band", key: "info" } as const,
  null,
)

// The app's theme has no cyan role, so the branch keeps Dracula's Cyan
const BRANCH_COLOR: Hex = "#8be9fd"

// A wide (em) space after the folder, then git's branch symbol, muted like the labels
const BRANCH_MARK: string = "\u2003\u2387 "

// A wide (em) space each side keeps the segments apart at any font size
const SEPARATOR: string = "\u2003│\u2003"

const LEVEL_COLOR: Record<UsageLevel, string> = {
  normal: "text",
  warning: "warning",
  danger: "error",
}

// Runs git in the session's folder; null when git is missing or fails to start
const runGit = async (
  $: EngineInterface,
  cwd: string,
  args: readonly string[],
): Promise<string | null> => {
  try {
    const result: ProcessRunResult = await $.process.run(["git", ...args], {
      cwd,
    })

    return result.exitCode === 0 ? result.stdout.trim() : null
  } catch {
    return null
  }
}

// The current branch, a short commit id when detached, or null outside a repository
const readBranch = async (
  $: EngineInterface,
  cwd: string,
): Promise<string | null> => {
  const name: string | null = await runGit($, cwd, ["branch", "--show-current"])

  if (name !== "") {
    return name
  }

  return runGit($, cwd, ["rev-parse", "--short", "HEAD"])
}

// Untracked files counted at most, so a folder full of new files stays quick
const MAX_UNTRACKED_FILES: number = 200

// The commit local work grew from: where the branch left its upstream, or origin's default
// branch for a branch never pushed; the last commit without a remote
const readBase = async (
  $: EngineInterface,
  cwd: string,
): Promise<string | null> => {
  const upstream: string | null =
    (await runGit($, cwd, ["rev-parse", "--abbrev-ref", "@{upstream}"])) ??
    (await runGit($, cwd, [
      "symbolic-ref",
      "--short",
      "refs/remotes/origin/HEAD",
    ]))
  const forkPoint: string | null =
    upstream === null
      ? null
      : await runGit($, cwd, ["merge-base", "HEAD", upstream])

  return forkPoint ?? runGit($, cwd, ["rev-parse", "HEAD"])
}

// Lines in the untracked files, read only: nothing is added to git
const readUntrackedLines = async (
  $: EngineInterface,
  cwd: string,
): Promise<number> => {
  const root: string | null = await runGit($, cwd, [
    "rev-parse",
    "--show-toplevel",
  ])
  const listed: string | null = await runGit($, cwd, [
    "ls-files",
    "--others",
    "--exclude-standard",
    "--full-name",
    "-z",
    ":/",
  ])

  if (root === null || listed === null) {
    return 0
  }

  const files: string[] = listed
    .split("\0")
    .filter(file => file !== "")
    .slice(0, MAX_UNTRACKED_FILES)
  const counts: number[] = await Promise.all(
    files.map(file => readFileLines($, `${root}/${file}`)),
  )

  let total: number = 0

  for (const count of counts) {
    total += count
  }

  return total
}

// A file's lines; 0 when it cannot be read, as a file over 4 MiB
const readFileLines = async (
  $: EngineInterface,
  path: string,
): Promise<number> => {
  try {
    return countLines(await $.fs.read(path))
  } catch {
    return 0
  }
}

// Lines added and removed against origin: unpushed commits, staged and unstaged edits, and
// untracked files; null outside a repository
const readChanges = async (
  $: EngineInterface,
  cwd: string,
): Promise<LineChanges | null> => {
  const base: string | null = await readBase($, cwd)

  if (base === null) {
    return null
  }

  const shortstat: string | null = await runGit($, cwd, [
    "diff",
    "--shortstat",
    base,
  ])

  if (shortstat === null) {
    return null
  }

  const tracked: LineChanges = parseShortstat(shortstat)

  return {
    added: tracked.added + (await readUntrackedLines($, cwd)),
    removed: tracked.removed,
  }
}

// Reads the folder, branch and agents, and keeps them with the usage figures given
const refresh = async (
  $: EngineInterface,
  usage: UsageFigures,
): Promise<void> => {
  const cwd: string = await $.session.cwd()
  const home: string | undefined = await $.env.get("HOME")
  const agents: AgentInfo[] = await $.agent.list()

  const band: BandInfo = {
    path: shortenPath(cwd, home),
    branch: await readBranch($, cwd),
    changes: await readChanges($, cwd),
    context: usage.context.percent ?? null,
    fiveHour: limitPercent(usage.rateLimits, "five_hour"),
    sevenDay: limitPercent(usage.rateLimits, "seven_day"),
    fiveHourResetsAt: limitResetsAt(usage.rateLimits, "five_hour"),
    sevenDayResetsAt: limitResetsAt(usage.rateLimits, "seven_day"),
    agents: activeAgents(agents.map(agent => agent.status)),
  }

  await update($, bandInfo, () => band)
}

export const register: Register = on => {
  on("session.start", async ($, e, next) => {
    const result = await next(e)

    await refresh($, await $.session.usage())

    return result
  })

  // After each turn and when a rate-limit window moves
  on("session.measure", async ($, e, next) => {
    await refresh($, e)

    return next(e)
  })

  // An agent starts: count it once it is on the list. A failed refresh never stops the agent
  on("agent.spawn", async ($, e, next) => {
    const result = await next(e)

    await refresh($, await $.session.usage())

    return result
  }).catch(($, e, next) => next(e))

  // An agent's own turn ends: it may be done
  on("turn.complete", async ($, e, next) => {
    const result = await next(e)

    if (e.agentId !== undefined) {
      await refresh($, await $.session.usage())
    }

    return result
  })

  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const band: BandInfo | null = await read($, bandInfo)

    if (band === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const now: number = await $.clock.now()

    return (
      <Box>
        <Text>
          <Text color="suggestion">{band.path}</Text>
          {band.branch !== null && (
            <Text>
              <Text color="inactive">{BRANCH_MARK}</Text>
              <Text color={BRANCH_COLOR} weight="semibold">
                {band.branch}
              </Text>
            </Text>
          )}
          {hasChanges(band.changes) && (
            <Text>
              <Text color="inactive">{SEPARATOR}</Text>
              <Text color="diffAdded">
                +<Text weight="semibold">{band.changes.added}</Text>
              </Text>{" "}
              <Text color="diffRemoved">
                -<Text weight="semibold">{band.changes.removed}</Text>
              </Text>
            </Text>
          )}
          {segments(band, now).map((segment: Segment) => (
            <Text key={segment.label}>
              <Text color="inactive">
                {SEPARATOR}
                {segment.label}{" "}
              </Text>
              <Text color={LEVEL_COLOR[segment.level]} weight="semibold">
                {segment.value}
              </Text>
              <Text color="inactive">{segment.unit}</Text>
              {segment.reset !== null && (
                <Text>
                  <Text color="inactive"> {segment.reset.label} </Text>
                  <Text color="text" weight="semibold">
                    {segment.reset.value}
                  </Text>
                </Text>
              )}
            </Text>
          ))}
        </Text>
      </Box>
    )
  })
}
