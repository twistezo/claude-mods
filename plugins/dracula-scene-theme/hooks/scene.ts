import { scene } from "./palette"

// One blurred glow: where it starts, how big it is, and how far and how fast it drifts
type Glow = {
  x: number
  y: number
  r: number
  dx: number
  dy: number
  seconds: number
}

const GLOWS: readonly Glow[] = [
  { x: 300, y: 250, r: 360, dx: 520, dy: 260, seconds: 12 },
  { x: 1300, y: 780, r: 340, dx: -560, dy: -240, seconds: 16 },
  { x: 800, y: 500, r: 260, dx: 340, dy: -300, seconds: 20 },
]

// Out and back with ease in and out, forever
const EASE =
  'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"'

const drift = (
  attribute: string,
  from: number,
  by: number,
  seconds: number,
): string =>
  `<animate attributeName="${attribute}" values="${from};${from + by};${from}" dur="${seconds}s" ${EASE}/>`

// SMIL, not CSS: the app's scene frame lists SMIL as supported, and CSS transforms did not move there
const glowMarkup = (glow: Glow, index: number): string =>
  `<circle cx="${glow.x}" cy="${glow.y}" r="${glow.r}" fill="${scene.glow[index]}">` +
  drift("cx", glow.x, glow.dx, glow.seconds) +
  drift("cy", glow.y, glow.dy, glow.seconds) +
  drift("r", glow.r, Math.round(glow.r * 0.25), glow.seconds) +
  "</circle>"

export const SCENE_SVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter></defs>
<rect width="1600" height="1000" fill="${scene.ground}"/>
<g filter="url(#blur)" opacity="0.55">${GLOWS.map(glowMarkup).join("")}</g>
</svg>`
