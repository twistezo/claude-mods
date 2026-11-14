import { scene } from "./palette"

// One blurred glow: where it starts, how big it is, and how far and how slowly it drifts
type Glow = {
  x: number
  y: number
  r: number
  dx: number
  dy: number
  seconds: number
}

const GLOWS: readonly Glow[] = [
  { x: 300, y: 250, r: 360, dx: 260, dy: 140, seconds: 28 },
  { x: 1300, y: 780, r: 340, dx: -300, dy: -120, seconds: 36 },
  { x: 800, y: 500, r: 260, dx: 180, dy: -160, seconds: 44 },
]

const glowMarkup = (glow: Glow, index: number): string =>
  `<circle class="g${index}" cx="${glow.x}" cy="${glow.y}" r="${glow.r}" fill="${scene.glow[index]}"/>`

const glowKeyframes = (glow: Glow, index: number): string =>
  `@keyframes d${index}{50%{transform:translate(${glow.dx}px,${glow.dy}px) scale(1.2)}}` +
  `.g${index}{animation:d${index} ${glow.seconds}s ease-in-out infinite;transform-box:fill-box;transform-origin:center}`

// A slow drift of glows; still for people who ask for reduced motion
export const SCENE_SVG: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>${GLOWS.map(glowKeyframes).join("")}@media (prefers-reduced-motion: reduce){circle{animation:none}}</style>
<defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter></defs>
<rect width="1600" height="1000" fill="${scene.ground}"/>
<g filter="url(#blur)" opacity="0.55">${GLOWS.map(glowMarkup).join("")}</g>
</svg>`
