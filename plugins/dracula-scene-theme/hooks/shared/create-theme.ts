// Builds a theme mod's look from a dark and a light palette.
// Source of truth: shared/theme. `npm run sync` copies it to every mod's hooks/shared

import type { ThemeSetArgs } from "claude-code"

import { makeColors } from "./make-colors.js"

type Hex = `#${string}`

export type Palette = {
  background: Hex
  foreground: Hex
  comment: Hex
  red: Hex
  orange: Hex
  green: Hex
  purple: Hex
  pink: Hex
}

type ThemeOptions = {
  // The theme's name, shown by the app: 1 to 64 characters
  label: string
  dark: Palette
  light: Palette
}

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

// The app ships Dracula for code; it has nothing for Alucard, so light mode keeps the app's own
const DARK_CODE_THEME = "dracula"

// Pins the exact palette color to the stop the mode reads text and fills from,
// so makeColors does not shift its lightness
const role = (hex: string, stop: number): Role => ({
  seed: hex,
  fillShade: stop,
  stops: { [stop]: hex },
})

// The palette's own colors, not the spec's functional ones: those drop text under 3:1,
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

// Every surface on Background: a lighter one shows as a band under the prompt box
// and flashes over the conversation while a session opens
const surfaces = (palette: Palette): Anchors => ({
  "surface-0": palette.background,
  "surface-1": palette.background,
  "surface-2": palette.background,
  "surface-3": palette.background,
  "text-primary": palette.foreground,
})

export type Theme = {
  look: ThemeSetArgs
  // The line that would stop the desktop app painting the look, if any
  unpainted: string | undefined
}

// Values only: the engine needs each mod's hooks written out in the mod itself
export const createTheme = (options: ThemeOptions): Theme => {
  const { theme, problems } = makeColors({
    label: options.label,
    codeTheme: { dark: DARK_CODE_THEME },
    dark: {
      // No text-muted: Comment is under 3:1 on the app's field and hover fills, so makeColors derives one
      gray: { anchors: surfaces(options.dark) },
      roles: roles(options.dark, DARK_STOPS),
      git: git(options.dark),
    },
    light: {
      gray: {
        anchors: {
          ...surfaces(options.light),
          "text-muted": options.light.comment,
        },
      },
      roles: roles(options.light, LIGHT_STOPS),
      git: git(options.light),
    },
  })

  const look: ThemeSetArgs = {
    colors: theme,
    // A palette name follows the mode: the dark Background in dark, the light one in light
    backdrop: { color: "surface-0" },
  }

  const unpainted: string | undefined = problems.find(line =>
    line.startsWith("Desktop won't paint"),
  )

  return { look, unpainted }
}
