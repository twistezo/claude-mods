import type { Register, ThemeSetArgs } from "claude-code"

import { makeColors } from "./make-colors.js"
import { alucard, dracula } from "./palette"
import type { Palette } from "./palette"

type Definition = Parameters<typeof makeColors>[0]
type Mode = NonNullable<Definition["dark"]>
type Roles = NonNullable<Mode["roles"]>
type Git = NonNullable<Mode["git"]>
type Anchors = NonNullable<NonNullable<Mode["gray"]>["anchors"]>
type Role = Exclude<NonNullable<Roles["accent"]>, string>

// The ramp stop each mode reads role text from (see make-colors.js)
type TextStops = { text: number; success: number }

const DARK_STOPS: TextStops = { text: 300, success: 400 }
const LIGHT_STOPS: TextStops = { text: 600, success: 600 }

// Pins the exact spec color to the stop the mode reads text and fills from,
// so makeColors does not shift its lightness
const role = (hex: string, stop: number): Role => ({
  seed: hex,
  fillShade: stop,
  stops: { [stop]: hex },
})

// Classic palette, not the spec's functional colors: functional ones drop text under 3:1,
// and the app then refuses the whole theme
const roles = (palette: Palette, stops: TextStops): Roles => ({
  accent: role(palette.purple, stops.text),
  danger: role(palette.red, stops.text),
  success: role(palette.green, stops.success),
  warning: role(palette.orange, stops.text),
  pro: role(palette.pink, stops.text),
})

const git = (palette: Palette): Git => ({
  added: palette.green,
  removed: palette.red,
  modified: palette.orange,
  merged: palette.purple,
  closed: palette.red,
  conflicting: palette.orange,
})

// Every surface on Background. A lighter one (Background Light) shows as a band under the
// prompt box and flashes over the conversation while a session opens
const surfaces = (palette: Palette): Anchors => ({
  "surface-0": palette.background,
  "surface-1": palette.background,
  "surface-2": palette.background,
  "surface-3": palette.background,
  "text-primary": palette.foreground,
})

// No text-muted: Dracula's Comment is under 3:1 on the app's field and hover fills, so makeColors derives one
const darkAnchors: Anchors = surfaces(dracula)

const lightAnchors: Anchors = {
  ...surfaces(alucard),
  "text-muted": alucard.comment,
}

const { theme, problems } = makeColors({
  label: "Dracula",
  // The app ships Dracula for code; it has no Alucard, so light mode keeps the app's own
  codeTheme: { dark: "dracula" },
  dark: {
    gray: { anchors: darkAnchors },
    roles: roles(dracula, DARK_STOPS),
    git: git(dracula),
  },
  light: {
    gray: { anchors: lightAnchors },
    roles: roles(alucard, LIGHT_STOPS),
    git: git(alucard),
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  // A palette name follows the mode: Dracula background in dark, Alucard in light
  backdrop: { color: "surface-0" },
}

export const register: Register = on => {
  on("session.start", async ($, e, next) => {
    const unpainted: string | undefined = problems.find(line =>
      line.startsWith("Desktop won't paint"),
    )

    if (unpainted !== undefined) {
      $.ui.toast(`dracula-theme: ${unpainted}`)
    }

    await $.theme.set(LOOK)

    return next(e)
  })
}
