// The desktop's snow, on the GPU over the still Svg from scene.ts: the ground snow at the level of
// the five-hour limit, and three depths of falling flakes. The mod sends the limit as `level`; the
// app eases the snow to each new level, so it rises smoothly and the Svg under it never changes.
//
// The ground is drawn as scene.ts draws its drifts, in the same 1600 x 900 frame stretched to the
// window, so at the snow stake by the left edge the snow line meets the stake's marks
import {
  clamp,
  floor,
  fract,
  int,
  length,
  min,
  mix,
  picture,
  range,
  shader,
  sin,
  size,
  table,
  time,
  unsigned,
  values,
  vec2,
  vec3,
  vec4,
} from "claude-code/shader"

const { level } = values({ level: [0, 100] })

const FRAME_WIDTH = 1600
const FRAME_HEIGHT = 900
const STEP = 160

// Keep in step with `groundTop` in scene.ts
const groundTop = (percent: number) =>
  790 - percent * 1.565 - percent * percent * 0.00575

// Keep in step with `DRIFT_OFFSETS` in scene.ts: each drift's crest at x = 320, 480 ... 1600
const DRIFTS = table([
  0.2, -13.5, -9.3, 2.9, 7.5, -10, -8.9, -2.4, 5.4, -1.9, 12.4, 1.8, -13.9, 5.2,
  -12.2, 2.7, 10.4, 10.9, -11.3, 12.1, -0.4, -12.7, 1.1, 9.9, 0.3, -11.4, -0.4,
])
const OFFSETS_PER_DRIFT = 9
// How far any crest rises above `top`: the lowest offset and its curve's control point, with room
const CREST_RISE = 30

// Each drift: how far below the top drift it lies, and its color (the top one's runs to its foot)
const DRIFT_DROPS = table([0, 60, 115])
const DRIFT_COLORS = table([
  [0.953, 0.965, 1],
  [0.867, 0.89, 0.961],
  [0.933, 0.949, 0.988],
])
const TOP_DRIFT_FOOT = vec3(0.765, 0.8, 0.914)

// The crest of one drift over a segment, `t` 0 to 1 across it: a curve from one point to the next,
// its control point midway and 10 above the lower end; flat at `top` before the first point
const crest = (
  segment: number,
  t: number,
  flat: number,
  top: number,
  drift: number,
) => {
  const first = drift * OFFSETS_PER_DRIFT
  const from = segment < 1.5 ? 0 : DRIFTS.at(first + segment - 2)
  const to = DRIFTS.at(first + segment - 1)
  const bend = min(from, to) - 10
  const curve = (1 - t) * (1 - t) * from + 2 * t * (1 - t) * bend + t * t * to

  return top + curve * (1 - flat)
}

// Falling flakes, far to near: cell size and fall speed in points a second, radius, opacity
const FLAKES = table([
  [46, 30, 1.1, 0.55],
  [62, 44, 1.6, 0.75],
  [84, 64, 2.3, 0.9],
])

// A steady hash of a cell, for where its flake sits and whether it has one
const stir = (ix: number, iy: number, seed: number) => {
  let a = int(int(ix) * 0x2f6b4a9d + int(seed) * 0x51a3)
  a = int(a ^ (int(iy) * 0x6d1c85e3))
  a = int((a ^ (a >>> 15)) * 0x19e4b7a5)

  return int(a ^ (a >>> 13))
}
const slice = (h: number, shift: number) =>
  unsigned(int((h >>> shift) & 1023)) / 1024

const snow = picture(p => {
  // The ground's frame, y down from the window's top, as the Svg's stretched ground layer has it
  const x = p.uv.x * FRAME_WIDTH
  const y = (1 - p.uv.y) * FRAME_HEIGHT
  const unitsPerPixel = (FRAME_HEIGHT / size.y) * p.px
  const top = groundTop(level)
  let color = vec4(0)

  // The sky above the highest crest has no ground snow: skip the drifts there
  if (y > top - CREST_RISE) {
    const segment = clamp(floor(x / STEP), 1, FRAME_WIDTH / STEP - 1)
    const t = clamp((x - segment * STEP) / STEP, 0, 1)
    const flat = x < STEP ? 1 : 0
    const depth = clamp((y - top + 14) / (FRAME_HEIGHT - top + 14), 0, 1)

    for (const drift of range(3)) {
      const edge = crest(segment, t, flat, top + DRIFT_DROPS.at(drift), drift)
      const cover = clamp((y - edge) / unitsPerPixel + 0.5, 0, 1)
      const fill = vec3(
        drift < 0.5
          ? mix(vec3(DRIFT_COLORS.at(0)), TOP_DRIFT_FOOT, depth)
          : vec3(DRIFT_COLORS.at(drift)),
      )
      color = vec4(vec4(fill * cover, cover) + color * (1 - cover))
    }
  }

  // More flakes fall as the limit fills: a share of the cells hold one
  const share = 0.05 + (level / 100) * 0.15
  const down = size.y - p.point.y

  for (const depthIndex of range(3)) {
    const flake = vec4(FLAKES.at(depthIndex))
    const cell = flake.x
    const column = floor(p.point.x / cell)
    const sway = sin(time * 0.7 + column * 2.3 + depthIndex) * cell * 0.12
    const at = vec2((p.point.x - sway) / cell, (down - time * flake.y) / cell)
    const home = vec2(floor(at))
    const h = stir(home.x, home.y, depthIndex + 7)

    // Most cells are empty: only one that holds a flake works out where it sits
    if (slice(h, 0) < share) {
      const spot = vec2(0.25 + 0.5 * slice(h, 10), 0.25 + 0.5 * slice(h, 20))
      const gap = length(vec2((fract(at) - spot) * cell))
      const radius = flake.z * (0.7 + 0.6 * slice(h, 5))
      const alpha = clamp((radius - gap) / p.px + 0.5, 0, 1) * flake.w
      color = vec4(vec4(alpha, alpha, alpha, alpha) + color * (1 - alpha))
    }
  }

  return color
})

export default shader({ fps: 30, passes: [snow] })
