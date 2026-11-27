// Every Dracula color the mods share. Values and names: https://draculatheme.com/spec

import type { Hex, Palette } from "./create-theme"

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

// Alucard Classic, the light mode
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

// Background Darker: Dracula's darkest background variant, outside the shared Palette roles
export const draculaBackgroundDarker: Hex = "#191a21"
