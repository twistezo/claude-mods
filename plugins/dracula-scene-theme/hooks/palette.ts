// Every color of the mod lives here. Values and names: https://draculatheme.com/spec

import type { Palette } from "./shared/create-theme"

// Dracula Classic, the dark mode
export const dracula: Palette = {
  background: "#282a36",
  foreground: "#f8f8f2",
  comment: "#6272a4",
  red: "#ff5555",
  orange: "#ffb86c",
  green: "#50fa7b",
  purple: "#bd93f9",
  pink: "#ff79c6",
}

// Alucard Classic: createTheme needs a light half, which this dark-only mod does not send
export const alucard: Palette = {
  background: "#fffbeb",
  foreground: "#1f1f1f",
  comment: "#6c664b",
  red: "#cb3a2a",
  orange: "#a34d14",
  green: "#14710a",
  purple: "#644ac9",
  pink: "#a3144d",
}

// The scene behind the panels: Background Darker under Purple, Pink and Comment
export const scene = {
  ground: "#191a21",
  glow: [dracula.purple, dracula.pink, dracula.comment],
} as const
