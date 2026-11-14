import type { Register, ThemeSetArgs } from "claude-code"

import { SCENE_SVG } from "./scene"
import { createTheme } from "./shared/create-theme"
import type { Theme } from "./shared/create-theme"
import { dracula } from "./shared/dracula-palette"

const SCENE_NAME: string = "dracula-glow"

const THEME: Theme = createTheme({
  label: "Dracula scene",
  // Dark only: the scene and the glass are dark, so the look has no light half
  dark: dracula,
  backdrop: {
    scene: SCENE_NAME,
    // Strong glass: the scene shows faintly through the panels, text stays readable
    glass: { blur: 64, tint: dracula.background, opacity: 0.85 },
  },
})

// The scene is dark, so the look asks for dark mode
const LOOK: ThemeSetArgs = { ...THEME.look, overrideColorScheme: "dark" }

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
