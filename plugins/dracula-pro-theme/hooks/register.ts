import type { Register } from "claude-code"

import { alucardPro, draculaPro } from "./palette"
import { createTheme } from "./shared/create-theme"
import type { Theme } from "./shared/create-theme"

const THEME: Theme = createTheme({
  label: "Dracula PRO",
  dark: draculaPro,
  light: alucardPro,
})

export const register: Register = on => {
  on("session.start", async ($, e, next) => {
    if (THEME.unpainted !== undefined) {
      $.ui.toast(`dracula-pro-theme: ${THEME.unpainted}`)
    }

    await $.theme.set(THEME.look)

    return next(e)
  })
}
