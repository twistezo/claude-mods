import { atom, read, update } from "claude-code"
import type {
  Atom,
  EngineInterface,
  Register,
  SessionRateLimit,
  ThemeSetArgs,
} from "claude-code"

import type { SnowState } from "../types"
import { sceneSvg } from "./scene"
import { limitPercent, limitResetsAt, snowPercent } from "./session-snow"
import { createTheme } from "./shared/create-theme"
import type { Palette, Theme } from "./shared/create-theme"

const SCENE_NAME: string = "christmas-eve"

// How often the snow checks whether the five-hour window has reset
const RESET_CHECK_MS: number = 60_000

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
    // The app's own glass strength, tinted navy: the tree and the cabin stay clear beside the conversation
    glass: { blur: 16, tint: winterNight.background, opacity: 0.6 },
  },
})

// The desktop's scene under the shader: no animation, the ground at its lowest, and the boughs, sky
// and moon as at a limit a third used. Built once, so it never changes while the mod is loaded
const STILL_DRESS_PERCENT: number = 35
const STILL_SCENE: string = sceneSvg({
  snowPercent: 0,
  dressPercent: STILL_DRESS_PERCENT,
  seconds: null,
})

// The scene is a night, so the look asks for dark mode
const LOOK: ThemeSetArgs = { ...THEME.look, overrideColorScheme: "dark" }

const snow: Atom<SnowState> = atom(
  { plugin: "christmas-theme", key: "snow" } as const,
  { percent: 0, resetsAt: null, changedAt: 0 },
)

// Redraws only when the snow's depth changes; the redraw takes its animation phase from `changedAt`
const setSnow = async (
  $: EngineInterface,
  percent: number,
  resetsAt: number | null,
): Promise<void> => {
  const current: SnowState = await read($, snow)

  if (current.percent === percent && current.resetsAt === resetsAt) {
    return
  }

  const changedAt: number = await $.clock.now()

  await update($, snow, () => ({ percent, resetsAt, changedAt }))
}

// A reading of the five-hour window; one without it leaves the snow as it is
const readLimit = async (
  $: EngineInterface,
  rateLimits: readonly SessionRateLimit[],
): Promise<void> => {
  const percent: number | null = limitPercent(rateLimits)

  if (percent === null) {
    return
  }

  const resetsAt: number | null = limitResetsAt(rateLimits)

  await setSnow(
    $,
    snowPercent(percent, resetsAt, await $.clock.now()),
    resetsAt,
  )
}

// A window that has reset melts the snow before the next response reports it
const checkReset = async ($: EngineInterface): Promise<void> => {
  const state: SnowState = await read($, snow)
  const percent: number = snowPercent(
    state.percent,
    state.resetsAt,
    await $.clock.now(),
  )

  await setSnow($, percent, percent === state.percent ? state.resetsAt : null)
}

export const register: Register = on => {
  on("session.start", async ($, e, next) => {
    if (THEME.unpainted !== undefined) {
      $.ui.toast(`christmas-theme: ${THEME.unpainted}`)
    }

    await $.theme.set(LOOK)
    await readLimit($, (await $.session.usage()).rateLimits)
    $.clock.every(RESET_CHECK_MS, () => checkReset($))

    return next(e)
  })

  // After each turn, and when the five-hour window moves a whole point
  on("session.measure", async ($, e, next) => {
    if (e.changed.includes("rateLimits")) {
      await readLimit($, e.rateLimits)
    }

    return next(e)
  })

  on("ui.render", { component: "Backdrop" }, async ($, e, next) => {
    // Only desktop and mobile draw a scene; the checks stay inline so TypeScript narrows e
    if (
      e.props.scene !== SCENE_NAME ||
      (e.surface !== "desktop" && e.surface !== "mobile")
    ) {
      return next(e)
    }

    const { Svg, Shader } = $.ui.resolve(e)
    const state: SnowState = await read($, snow)
    const alt: string = `A snowy Christmas night; the five-hour limit is ${state.percent}% used`

    // The desktop: the still Svg never changes, so it never reloads; the shader draws the snow at
    // the limit's level and eases it there. Reduce Motion or a failed shader shows the still alone
    if (e.surface === "desktop" && Shader !== undefined) {
      return (
        <Shader module="./snow-shader.ts" values={{ level: state.percent }}>
          <Svg source={STILL_SCENE} alt={alt} isInteractive />
        </Shader>
      )
    }

    // The phone, or an app with no shaders: the moving Svg, drawn anew at each change of the
    // limit. A state stored before `changedAt` existed starts the animations from 0
    const seconds: number = (state.changedAt || 0) / 1000

    return (
      <Svg
        source={sceneSvg({
          snowPercent: state.percent,
          dressPercent: state.percent,
          seconds,
        })}
        alt={alt}
        isInteractive
      />
    )
  })
}
