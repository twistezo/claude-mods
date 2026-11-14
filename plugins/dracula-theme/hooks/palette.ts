// Every color of the mod lives here. Values and names: https://draculatheme.com/spec

type Hex = `#${string}`

export type Palette = {
  background: Hex
  backgroundLight: Hex
  foreground: Hex
  comment: Hex
  red: Hex
  orange: Hex
  green: Hex
  purple: Hex
  pink: Hex
}

// Dracula Classic, the dark mode
export const dracula: Palette = {
  background: "#282a36",
  backgroundLight: "#343746",
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
  backgroundLight: "#dedccf",
  foreground: "#1f1f1f",
  comment: "#6c664b",
  red: "#cb3a2a",
  orange: "#a34d14",
  green: "#14710a",
  purple: "#644ac9",
  pink: "#a3144d",
}
