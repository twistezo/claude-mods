import { SCENE_GROUND } from "./palette"
import type { Hex } from "./shared/create-theme"
import { dracula } from "./shared/dracula-palette"

// One blurred glow: its color, where it starts, how big it is, and how far and how fast it drifts
type Glow = {
  color: Hex
  x: number
  y: number
  radius: number
  driftX: number
  driftY: number
  seconds: number
}

const GLOWS: readonly Glow[] = [
  {
    color: dracula.purple,
    x: 300,
    y: 250,
    radius: 360,
    driftX: 520,
    driftY: 260,
    seconds: 12,
  },
  {
    color: dracula.pink,
    x: 1300,
    y: 780,
    radius: 340,
    driftX: -560,
    driftY: -240,
    seconds: 16,
  },
  {
    color: dracula.comment,
    x: 800,
    y: 500,
    radius: 260,
    driftX: 340,
    driftY: -300,
    seconds: 20,
  },
]

// Out and back with ease in and out, forever
const EASE: string =
  'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"'

const drift = (
  attribute: string,
  from: number,
  by: number,
  seconds: number,
): string =>
  `<animate attributeName="${attribute}" values="${from};${from + by};${from}" dur="${seconds}s" ${EASE}/>`

// SMIL, not CSS: the app's scene frame lists SMIL as supported, and CSS transforms did not move there
const glowMarkup = (glow: Glow): string =>
  `<circle cx="${glow.x}" cy="${glow.y}" r="${glow.radius}" fill="${glow.color}">` +
  drift("cx", glow.x, glow.driftX, glow.seconds) +
  drift("cy", glow.y, glow.driftY, glow.seconds) +
  drift("r", glow.radius, Math.round(glow.radius * 0.25), glow.seconds) +
  "</circle>"

export const SCENE_SVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter></defs>
<rect width="1600" height="1000" fill="${SCENE_GROUND}"/>
<g filter="url(#blur)" opacity="0.55">${GLOWS.map(glowMarkup).join("")}</g>
</svg>`
