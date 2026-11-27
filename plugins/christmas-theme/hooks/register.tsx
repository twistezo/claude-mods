import { atom, read, update } from "claude-code"
import type { Atom, EngineInterface, Register, ThemeSetArgs } from "claude-code"

import type { SnowState } from "../types"
import { sceneSvg } from "./scene"
import { cacheMinutesLeft, cacheTtlMs, contextPercent } from "./session-snow"
import { createTheme } from "./shared/create-theme"
import type { Palette, Theme } from "./shared/create-theme"

const SCENE_NAME: string = "christmas-eve"

// How often the candle checks the cache; the sign shows whole minutes
const CANDLE_TICK_MS: number = 15_000

// A winter night: navy surfaces, snow-white text, icy blue for the accent
const winterNight: Palette = {
  background: "#121833",
  foreground: "#eef1fb",
  comment: "#8e98bf",
  red: "#ff6f61",
  orange: "#f4b860",
  green: "#7fd69b",
  purple: "#8fb4ff",
  pink: "#c6a4ff",
}

const THEME: Theme = createTheme({
  label: "Christmas",
  dark: winterNight,
  backdrop: {
    scene: SCENE_NAME,
    // Light glass: the tree and the cabin stay clear beside the conversation
    glass: { blur: 24, tint: winterNight.background, opacity: 0.55 },
  },
})

// The scene is a night, so the look asks for dark mode
const LOOK: ThemeSetArgs = { ...THEME.look, overrideColorScheme: "dark" }

const snow: Atom<SnowState> = atom(
  { plugin: "christmas-theme", key: "snow" } as const,
  { percent: 0, cacheExpiresAt: null, cacheTtlMs: null, cacheMinutes: null },
)

// Redraws only when a figure the sign or the snow shows has changed
const setSnow = async (
  $: EngineInterface,
  change: (state: SnowState) => SnowState,
): Promise<void> => {
  const current: SnowState = await read($, snow)
  const next: SnowState = change(current)

  if (
    next.percent === current.percent &&
    next.cacheExpiresAt === current.cacheExpiresAt &&
    next.cacheTtlMs === current.cacheTtlMs &&
    next.cacheMinutes === current.cacheMinutes
  ) {
    return
  }

  await update($, snow, () => next)
}

const tickCandle = async ($: EngineInterface): Promise<void> => {
  const now: number = await $.clock.now()

  await setSnow($, state => ({
    ...state,
    cacheMinutes: cacheMinutesLeft(state.cacheExpiresAt, now),
  }))
}

export const register: Register = on => {
  on("session.start", async ($, e, next) => {
    if (THEME.unpainted !== undefined) {
      $.ui.toast(`christmas-theme: ${THEME.unpainted}`)
    }

    await $.theme.set(LOOK)

    const { context } = await $.session.usage()

    await setSnow($, state => ({
      ...state,
      percent: contextPercent(context.percent),
    }))
    await tickCandle($)
    $.clock.every(CANDLE_TICK_MS, () => tickCandle($))

    return next(e)
  })

  // After each main-thread response: the context it filled and the cache it wrote or read.
  // The cache lifetime counts from when the request went out
  on("turn.step", async function* ($, e, next) {
    const sentAt: number = await $.clock.now()
    const result = yield* next(e)

    if (e.agentId !== undefined) {
      return result
    }

    const { context } = await $.session.usage()
    const now: number = await $.clock.now()

    await setSnow($, state => {
      const ttl: number | null = cacheTtlMs(result.usage, state.cacheTtlMs)
      const expiresAt: number | null =
        ttl === null ? state.cacheExpiresAt : sentAt + ttl

      return {
        percent: contextPercent(context.percent),
        cacheExpiresAt: expiresAt,
        cacheTtlMs: ttl ?? state.cacheTtlMs,
        cacheMinutes: cacheMinutesLeft(expiresAt, now),
      }
    })

    return result
  })

  // A compaction or /clear moves the fill between responses
  on("session.measure", async ($, e, next) => {
    if (e.changed.includes("context")) {
      await setSnow($, state => ({
        ...state,
        percent: contextPercent(e.context.percent),
      }))
    }

    return next(e)
  })

  // A compacted conversation starts a new prefix: nothing of it is cached yet.
  // A failed update never stops the compaction
  on("session.compact", async ($, e, next) => {
    const result = await next(e)

    if (
      e.agentId === undefined &&
      e.trigger !== "precompute" &&
      result.skip === undefined
    ) {
      await setSnow($, state => ({
        ...state,
        cacheExpiresAt: null,
        cacheMinutes: null,
      }))
    }

    return result
  }).catch(($, e, next) => next(e))

  on("ui.render", { component: "Backdrop" }, async ($, e, next) => {
    // Only desktop and mobile draw a scene; the checks stay inline so TypeScript narrows e
    if (
      e.props.scene !== SCENE_NAME ||
      (e.surface !== "desktop" && e.surface !== "mobile")
    ) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const state: SnowState = await read($, snow)

    return (
      <Svg
        source={sceneSvg({
          percent: state.percent,
          cacheMinutes: state.cacheMinutes,
        })}
        alt={`A snowy Christmas night; context is ${state.percent}% full`}
        isInteractive
      />
    )
  })
}
