import type { Register, ThemeColors, ThemeSetArgs } from "claude-code"

import { alucard, dracula } from "./palette"
import { SCENE_SVG } from "./scene"
import { createTheme } from "./shared/create-theme"
import type { Theme } from "./shared/create-theme"

const SCENE_NAME = "dracula-glow"

const THEME: Theme = createTheme({
  label: "Dracula scene",
  dark: dracula,
  light: alucard,
})

const COLORS: ThemeColors | undefined = THEME.look.colors

// Dark only: the scene and the glass are dark, so the look sends its dark half alone
const LOOK: ThemeSetArgs = {
  colors: COLORS && { ...COLORS, inputs: { dark: COLORS.inputs.dark } },
  backdrop: {
    scene: SCENE_NAME,
    // Strong glass: the scene shows faintly through the panels, text stays readable
    glass: { blur: 64, tint: dracula.background, opacity: 0.85 },
  },
  overrideColorScheme: "dark",
}

export const register: Register = on => {
  on("session.start", async ($, e, next) => {
    if (THEME.unpainted !== undefined) {
      $.ui.toast(`dracula-scene-theme: ${THEME.unpainted}`)
    }

    await $.theme.set(LOOK)

    return next(e)
  })

  on("ui.render", { component: "Backdrop" }, ($, e, next) => {
    // Only desktop and mobile draw a scene; the checks stay inline so TypeScript narrows e
    if (
      e.props.scene !== SCENE_NAME ||
      (e.surface !== "desktop" && e.surface !== "mobile")
    ) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        source={SCENE_SVG}
        alt="Purple and pink glows drifting slowly"
        isInteractive
      />
    )
  })
}
