// The Christmas Eve backdrop as one SVG string: a hanging sign with a robin, a decorated tree,
// a snowman and a lamp on the left, the moon and an A-frame cabin on the right.
// The snow on the ground and on the boughs rises with the context fill; the candle on the sign
// burns down with the prompt cache. Pure string building: the same view always gives the same picture

export type SceneView = {
  // Percent of the context window in use, 0 to 100
  percent: number
  // Whole minutes left on the prompt cache, or null when there is none
  cacheMinutes: number | null
}

type Point = { x: number; y: number }

// One tier of the Christmas tree: where it starts and ends, and how wide it is at its foot
type Tier = { top: number; bottom: number; halfWidth: number }

// The scene's frame; the corner pieces keep their own frames so they stay in view on any screen
const WIDTH: number = 1600
const HEIGHT: number = 900
const LEFT_WIDTH: number = 420
const RIGHT_WIDTH: number = 520

// Where the snow on the ground lies: low at an empty context, over the cabin's door at a full one.
// It piles up slowly at first and faster as the context runs out
const GROUND_EMPTY: number = 790
const GROUND_RISE_LINEAR: number = 1.565
const GROUND_RISE_SQUARED: number = 0.00575

const groundTop = (percent: number): number =>
  GROUND_EMPTY -
  percent * GROUND_RISE_LINEAR -
  percent * percent * GROUND_RISE_SQUARED

// The longest cache the sign shows a full candle for
const CANDLE_FULL_MINUTES: number = 60

const FONT: string = "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"

const COLORS = {
  snow: "#f1f4fd",
  snowShade: "#cfd7ef",
  pineFar: "#202c55",
  mountain: "#4b4178",
  mountainLit: "#665a96",
  mountainSnow: "#bdb8de",
  treeDark: "#174a30",
  treeLit: "#226640",
  trunk: "#5a3a22",
  ornamentRed: "#d8403a",
  ornamentGold: "#f2b632",
  star: "#ffd75a",
  warm: "#ffd884",
  woodDark: "#3f2414",
  wood: "#8b5a33",
  woodBeam: "#5a3520",
  plank: "#734828",
  door: "#b23e36",
  wreath: "#2e7d46",
  curtain: "#d66a4a",
  chimney: "#7f8197",
  brick: "#686a80",
  moon: "#f3ebc7",
  crater: "#e2d7a8",
  boardText: "#f6ead0",
  rope: "#b08a5a",
  robinBody: "#74502f",
  robinWing: "#5c3d22",
  robinBreast: "#e2602a",
  robinBelly: "#f1e4cf",
  beak: "#f0a030",
  hat: "#d6312e",
  snowmanHat: "#1d1d24",
  scarf: "#c8312b",
  carrot: "#f08a2c",
  twig: "#5b3b22",
  lampPost: "#2b2b36",
  giftRed: "#c43b3b",
  giftTeal: "#3d8c94",
  ribbon: "#f2c14e",
} as const

const BULB_COLORS: readonly string[] = [
  "#7fb5ff",
  "#ff7a6b",
  "#ffd25a",
  "#7be0a0",
]

// A steady stand-in for randomness: the same seed always gives the same value in [0, 1)
const hash = (seed: number): number => {
  const value: number = Math.sin(seed * 12.9898 + 78.233) * 43758.5453

  return value - Math.floor(value)
}

// Short numbers keep the SVG small
const n = (value: number): string => String(Math.round(value * 10) / 10)

const clampPercent = (percent: number): number =>
  Math.min(100, Math.max(0, percent))

const points = (list: readonly Point[]): string =>
  list.map(point => `${n(point.x)},${n(point.y)}`).join(" ")

const twinkle = (seed: number, low: number, high: number): string => {
  const seconds: number = 2.4 + hash(seed) * 2.6

  return `<animate attributeName="opacity" values="${high};${low};${high}" dur="${n(seconds)}s" begin="-${n(hash(seed + 1) * seconds)}s" repeatCount="indefinite"/>`
}

const defs = (): string => `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#0b1230"/><stop offset="0.55" stop-color="#1c2350"/><stop offset="0.85" stop-color="#3b3570"/><stop offset="1" stop-color="#5a4a80"/>
</linearGradient>
<radialGradient id="aurora"><stop offset="0" stop-color="#4fd1a5" stop-opacity="0.32"/><stop offset="1" stop-color="#4fd1a5" stop-opacity="0"/></radialGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="#fff6d0" stop-opacity="0.4"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></radialGradient>
<radialGradient id="warmGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.65"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f6ff"/><stop offset="1" stop-color="#c3cce9"/></linearGradient>
<linearGradient id="windowLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeab0"/><stop offset="1" stop-color="#f2b450"/></linearGradient>
<linearGradient id="board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4c28"/><stop offset="1" stop-color="#5e391c"/></linearGradient>
<clipPath id="facade"><polygon points="370,500 268,790 472,790"/></clipPath>
</defs>`

const sky = (percent: number): string => {
  const stars: string[] = []

  for (let index = 0; index < 60; index++) {
    const x: number = hash(index * 3) * WIDTH
    const y: number = hash(index * 3 + 1) * 520
    const radius: number = 0.8 + hash(index * 3 + 2) * 1.6
    const animation: string = index % 3 === 0 ? twinkle(index, 0.2, 0.9) : ""

    stars.push(
      `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="#ffffff" opacity="0.75">${animation}</circle>`,
    )
  }

  // A full context washes the sky out, as a snowstorm does
  const haze: number = percent * 0.0024

  return `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
<ellipse cx="760" cy="260" rx="240" ry="430" transform="rotate(-22 760 260)" fill="url(#aurora)"><animate attributeName="opacity" values="0.6;1;0.6" dur="14s" repeatCount="indefinite"/></ellipse>
<ellipse cx="1180" cy="330" rx="200" ry="380" transform="rotate(18 1180 330)" fill="url(#aurora)"><animate attributeName="opacity" values="1;0.55;1" dur="17s" repeatCount="indefinite"/></ellipse>
${stars.join("")}
<rect width="${WIDTH}" height="${HEIGHT}" fill="#c8cff0" opacity="${haze.toFixed(3)}"/>`
}

const mountains = (peaks: readonly Point[], width: number): string => {
  const outline: Point[] = [{ x: 0, y: 790 }, ...peaks, { x: width, y: 790 }]
  const lit: string[] = []
  const caps: string[] = []

  peaks.forEach((peak, index) => {
    const previous: Point = peaks[index - 1] ?? { x: 0, y: 790 }

    if (peak.y >= previous.y) {
      return
    }

    lit.push(
      `<polygon points="${points([peak, { x: peak.x - 50, y: 790 }, { x: peak.x + 10, y: 790 }])}" fill="${COLORS.mountainLit}"/>`,
    )
    caps.push(
      `<polygon points="${points([peak, { x: peak.x - 26, y: peak.y + 38 }, { x: peak.x - 8, y: peak.y + 30 }, { x: peak.x + 6, y: peak.y + 40 }, { x: peak.x + 22, y: peak.y + 32 }])}" fill="${COLORS.mountainSnow}"/>`,
    )
  })

  return `<polygon points="${points(outline)}" fill="${COLORS.mountain}"/>${lit.join("")}${caps.join("")}`
}

// A clump of snow on a bough tip: a rounded top with a drip hanging over the edge
const snowClump = (x: number, y: number, radius: number): string => {
  const r: number = radius
  const shade: string = `M${n(x - r * 1.3)} ${n(y + r * 0.2)} C${n(x - r * 1.3)} ${n(y + r * 0.9)} ${n(x + r * 1.3)} ${n(y + r * 0.9)} ${n(x + r * 1.3)} ${n(y + r * 0.2)} Z`
  const clump: string = `M${n(x - r * 1.3)} ${n(y)} C${n(x - r * 1.3)} ${n(y - r)} ${n(x + r * 1.3)} ${n(y - r)} ${n(x + r * 1.3)} ${n(y)} C${n(x + r * 1.3)} ${n(y + r * 0.5)} ${n(x + r * 0.7)} ${n(y + r * 0.4)} ${n(x + r * 0.55)} ${n(y + r * 0.85)} C${n(x + r * 0.4)} ${n(y + r * 1.2)} ${n(x + r * 0.05)} ${n(y + r * 0.9)} ${n(x - r * 0.1)} ${n(y + r * 0.5)} C${n(x - r * 0.5)} ${n(y + r * 0.8)} ${n(x - r * 1.3)} ${n(y + r * 0.6)} ${n(x - r * 1.3)} ${n(y)} Z`

  return `<path d="${shade}" fill="${COLORS.snowShade}"/><path d="${clump}" fill="${COLORS.snow}"/>`
}

// A pine in the far trees, its boughs dusted with snow that grows with the context
const pine = (
  x: number,
  base: number,
  height: number,
  width: number,
  snowRadius: number,
): string => {
  const parts: string[] = []

  for (let tier = 0; tier < 4; tier++) {
    const top: number = base - height + tier * height * 0.22
    const bottom: number = top + height * 0.38
    const halfWidth: number = width * (0.35 + tier * 0.22)

    parts.push(
      `<polygon points="${points([
        { x, y: top },
        { x: x + halfWidth, y: bottom },
        { x: x - halfWidth, y: bottom },
      ])}" fill="${COLORS.pineFar}"/>`,
    )

    for (const side of [-1, 1]) {
      parts.push(snowClump(x + side * halfWidth * 0.8, bottom - 3, snowRadius))
    }
  }

  return parts.join("")
}

// A tier's outline: straight sides and a scalloped foot
const tierPath = (centerX: number, tier: Tier): string => {
  const scallops: number = 4
  const step: number = (tier.halfWidth * 2) / scallops
  let path: string = `M${n(centerX)} ${n(tier.top)} L${n(centerX + tier.halfWidth)} ${n(tier.bottom)}`

  for (let index = 0; index < scallops; index++) {
    const start: number = centerX + tier.halfWidth - index * step
    const end: number = start - step

    path += ` Q${n(start - step / 2)} ${n(tier.bottom + 12)} ${n(end)} ${n(tier.bottom)}`
  }

  return `${path} Z`
}

const TREE_X: number = 125
const TREE_TIERS: readonly Tier[] = [
  { top: 330, bottom: 400, halfWidth: 32 },
  { top: 368, bottom: 452, halfWidth: 46 },
  { top: 418, bottom: 515, halfWidth: 61 },
  { top: 476, bottom: 584, halfWidth: 76 },
  { top: 540, bottom: 658, halfWidth: 90 },
  { top: 606, bottom: 738, halfWidth: 104 },
]

const christmasTree = (percent: number): string => {
  const boughs: string[] = []
  const lights: string[] = []
  const caps: string[] = []
  const capRadius: number = 10 + percent * 0.15

  TREE_TIERS.forEach((tier, tierIndex) => {
    boughs.push(
      `<path d="${tierPath(TREE_X, tier)}" fill="${COLORS.treeDark}"/>`,
    )
    // A lighter crown on each tier, so the boughs read as layers
    boughs.push(
      `<path d="${tierPath(TREE_X, { top: tier.top + 4, bottom: tier.bottom - 18, halfWidth: tier.halfWidth * 0.78 })}" fill="${COLORS.treeLit}"/>`,
    )

    // A garland sagging across the tier, colored bulbs between warm dots
    const from: Point = {
      x: TREE_X - tier.halfWidth * 0.8,
      y: tier.bottom - 22,
    }
    const to: Point = { x: TREE_X + tier.halfWidth * 0.8, y: tier.bottom - 30 }
    const bulbs: number = 4 + tierIndex

    for (let index = 0; index <= bulbs * 2; index++) {
      const t: number = index / (bulbs * 2)
      const x: number = from.x + (to.x - from.x) * t
      const y: number =
        from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * 10
      const seed: number = tierIndex * 40 + index

      if (index % 2 === 1) {
        lights.push(
          `<circle cx="${n(x)}" cy="${n(y)}" r="1.8" fill="${COLORS.warm}"/>`,
        )
        continue
      }

      const color: string =
        BULB_COLORS[(tierIndex + index / 2) % BULB_COLORS.length] ?? COLORS.warm

      lights.push(
        `<circle cx="${n(x)}" cy="${n(y)}" r="9" fill="${color}" opacity="0.35">${twinkle(seed, 0.12, 0.45)}</circle><circle cx="${n(x)}" cy="${n(y)}" r="4.5" fill="${color}"/>`,
      )
    }

    // A few baubles hanging under the garland
    for (let index = 0; index < 2 + tierIndex; index++) {
      const x: number =
        TREE_X + (hash(tierIndex * 10 + index) - 0.5) * tier.halfWidth * 1.4
      const y: number = tier.bottom - 8 - hash(tierIndex * 10 + index + 5) * 10
      const color: string =
        index % 2 === 0 ? COLORS.ornamentRed : COLORS.ornamentGold

      lights.push(`<circle cx="${n(x)}" cy="${n(y)}" r="6" fill="${color}"/>`)
    }

    // Snow on the bough tips; deep snow joins the clumps into one white tier
    const tips: number[] =
      tier.halfWidth > 70 ? [-0.86, -0.43, 0, 0.43, 0.86] : [-0.82, 0, 0.82]

    for (const tip of tips) {
      const x: number = TREE_X + tip * tier.halfWidth
      const y: number = tier.bottom - 4 - Math.abs(tip) * 3

      caps.push(snowClump(x, y, capRadius))
    }
  })

  const star: Point[] = []

  for (let index = 0; index < 10; index++) {
    const angle: number = -Math.PI / 2 + (index * Math.PI) / 5
    const radius: number = index % 2 === 0 ? 22 : 9

    star.push({
      x: TREE_X + Math.cos(angle) * radius,
      y: 316 + Math.sin(angle) * radius,
    })
  }

  // The snow hides the lights as it deepens
  const lightsOpacity: number = Math.max(0.3, 1 - percent * 0.006)

  return `<rect x="${TREE_X - 11}" y="730" width="22" height="60" fill="${COLORS.trunk}"/>
${boughs.join("")}
<g opacity="${lightsOpacity.toFixed(2)}">${lights.join("")}</g>
${caps.join("")}
<circle cx="${TREE_X}" cy="316" r="38" fill="url(#warmGlow)">${twinkle(900, 0.6, 1)}</circle>
<polygon points="${points(star)}" fill="${COLORS.star}"/>`
}

const gifts =
  (): string => `<rect x="38" y="758" width="44" height="32" rx="2" fill="${COLORS.giftRed}"/>
<rect x="56" y="758" width="8" height="32" fill="${COLORS.ribbon}"/><rect x="38" y="770" width="44" height="7" fill="${COLORS.ribbon}"/>
<path d="M60 758 C50 744 42 752 56 758 M60 758 C70 744 78 752 64 758" stroke="${COLORS.ribbon}" stroke-width="4" fill="none"/>
<rect x="86" y="770" width="34" height="20" rx="2" fill="${COLORS.giftTeal}"/><rect x="100" y="770" width="6" height="20" fill="${COLORS.snow}"/>`

const snowman =
  (): string => `<circle cx="208" cy="756" r="32" fill="${COLORS.snow}"/>
<circle cx="208" cy="710" r="23" fill="${COLORS.snow}"/>
<path d="M188 712 L150 690 M228 712 L266 688 M160 696 L152 684 M256 694 L262 682" stroke="${COLORS.twig}" stroke-width="3.5" stroke-linecap="round"/>
<path d="M188 726 Q208 738 228 726 L228 734 Q208 746 188 734 Z" fill="${COLORS.scarf}"/>
<rect x="214" y="730" width="10" height="26" rx="3" fill="${COLORS.scarf}"/>
<circle cx="208" cy="748" r="3" fill="${COLORS.snowmanHat}"/><circle cx="208" cy="764" r="3" fill="${COLORS.snowmanHat}"/>
<circle cx="200" cy="704" r="2.6" fill="${COLORS.snowmanHat}"/><circle cx="216" cy="704" r="2.6" fill="${COLORS.snowmanHat}"/>
<polygon points="208,711 230,716 208,717" fill="${COLORS.carrot}"/>
<rect x="186" y="686" width="44" height="6" rx="2" fill="${COLORS.snowmanHat}"/>
<rect x="194" y="656" width="28" height="32" rx="2" fill="${COLORS.snowmanHat}"/>
<rect x="194" y="678" width="28" height="6" fill="${COLORS.hat}"/>
<ellipse cx="208" cy="657" rx="14" ry="3" fill="${COLORS.snow}"/>`

const lamp =
  (): string => `<circle cx="262" cy="628" r="70" fill="url(#warmGlow)" opacity="0.8">${twinkle(950, 0.65, 0.85)}</circle>
<rect x="259" y="640" width="6" height="150" fill="${COLORS.lampPost}"/>
<rect x="252" y="642" width="20" height="5" fill="${COLORS.lampPost}"/>
<polygon points="250,604 274,604 270,640 254,640" fill="${COLORS.warm}" stroke="${COLORS.lampPost}" stroke-width="3"/>
<polygon points="246,604 278,604 262,592" fill="${COLORS.lampPost}"/>
<ellipse cx="262" cy="592" rx="14" ry="5" fill="${COLORS.snow}"/>`

const leftCorner = (percent: number): string => {
  const snowRadius: number = 9 + percent * 0.12

  return `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 ${LEFT_WIDTH} ${HEIGHT}" preserveAspectRatio="xMinYMid meet" overflow="visible">
${mountains(
  [
    { x: 0, y: 610 },
    { x: 70, y: 560 },
    { x: 140, y: 640 },
    { x: 240, y: 530 },
    { x: 340, y: 640 },
    { x: LEFT_WIDTH, y: 600 },
  ],
  LEFT_WIDTH,
)}
${pine(18, 790, 280, 70, snowRadius)}${pine(320, 790, 230, 58, snowRadius)}${pine(400, 790, 300, 70, snowRadius)}
${christmasTree(percent)}
${gifts()}
${snowman()}
${lamp()}
</svg>`
}

const moon = (percent: number): string => {
  const opacity: number = 1 - percent * 0.0035

  return `<g opacity="${opacity.toFixed(2)}">
<circle cx="374" cy="136" r="190" fill="url(#moonGlow)"/>
<circle cx="374" cy="136" r="64" fill="${COLORS.moon}"/>
<circle cx="352" cy="124" r="12" fill="${COLORS.crater}"/><circle cx="394" cy="116" r="7" fill="${COLORS.crater}"/>
<circle cx="390" cy="150" r="9" fill="${COLORS.crater}"/><circle cx="362" cy="162" r="6" fill="${COLORS.crater}"/>
</g>`
}

const CABIN_APEX: Point = { x: 370, y: 470 }

const stringLights = (): string => {
  const bulbs: string[] = []
  const count: number = 14

  for (const side of [-1, 1]) {
    for (let index = 1; index <= count; index++) {
      const t: number = index / (count + 1)
      const x: number = CABIN_APEX.x + side * 124 * t
      const y: number = CABIN_APEX.y + 315 * t
      const seed: number = (side + 2) * 100 + index

      bulbs.push(
        `<circle cx="${n(x)}" cy="${n(y)}" r="5.5" fill="${COLORS.warm}" opacity="0.4">${twinkle(seed, 0.15, 0.5)}</circle><circle cx="${n(x)}" cy="${n(y)}" r="2.6" fill="${COLORS.warm}"/>`,
      )
    }
  }

  return bulbs.join("")
}

const smoke = (): string => {
  const puffs: string[] = []

  for (let index = 0; index < 3; index++) {
    puffs.push(
      `<circle cx="442" cy="548" r="8" fill="#c9cfe6" opacity="0">
<animate attributeName="cy" values="548;420" dur="7.5s" begin="-${index * 2.5}s" repeatCount="indefinite"/>
<animate attributeName="r" values="8;22" dur="7.5s" begin="-${index * 2.5}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0.45;0" dur="7.5s" begin="-${index * 2.5}s" repeatCount="indefinite"/>
</circle>`,
    )
  }

  return puffs.join("")
}

const cabin = (percent: number): string => {
  const roofSnow: number = 12 + percent * 0.14
  const planks: string[] = []

  for (let x = 282; x <= 460; x += 14) {
    planks.push(
      `<line x1="${x}" y1="490" x2="${x}" y2="790" stroke="${COLORS.plank}" stroke-width="2"/>`,
    )
  }

  const icicles: string[] = []

  for (let x = 304; x <= 436; x += 12) {
    icicles.push(
      `<polygon points="${x},668 ${x + 6},668 ${x + 3},${676 + (x % 3) * 3}" fill="${COLORS.snow}"/>`,
    )
  }

  const lowerWindow = (
    x: number,
  ): string => `<rect x="${x}" y="708" width="42" height="40" fill="url(#windowLight)" stroke="${COLORS.woodDark}" stroke-width="3"/>
<polygon points="${x + 2},710 ${x + 14},710 ${x + 2},738" fill="${COLORS.curtain}"/><polygon points="${x + 40},710 ${x + 28},710 ${x + 40},738" fill="${COLORS.curtain}"/>
<line x1="${x + 21}" y1="708" x2="${x + 21}" y2="748" stroke="${COLORS.woodDark}" stroke-width="2.5"/><line x1="${x}" y1="728" x2="${x + 42}" y2="728" stroke="${COLORS.woodDark}" stroke-width="2.5"/>
<rect x="${x - 4}" y="747" width="50" height="5" rx="2" fill="${COLORS.snow}"/>`

  const lantern = (x: number): string =>
    `<circle cx="${x}" cy="722" r="16" fill="url(#warmGlow)"/><rect x="${x - 4}" y="715" width="8" height="13" rx="1.5" fill="${COLORS.warm}" stroke="${COLORS.woodDark}" stroke-width="1.5"/>`

  return `<rect x="425" y="560" width="34" height="170" fill="${COLORS.chimney}"/>
<path d="M425 580 H459 M425 600 H459 M425 620 H459 M425 640 H459 M442 560 V580 M434 580 V600 M450 600 V620 M436 620 V640" stroke="${COLORS.brick}" stroke-width="2"/>
<rect x="420" y="552" width="44" height="12" rx="5" fill="${COLORS.snow}"/>
${smoke()}
<polygon points="370,${n(CABIN_APEX.y - 8)} 238,790 502,790" fill="${COLORS.snow}" stroke="${COLORS.snow}" stroke-width="${n(roofSnow)}" stroke-linejoin="round"/>
<polygon points="370,478 252,790 488,790" fill="${COLORS.woodBeam}"/>
<polygon points="370,500 268,790 472,790" fill="${COLORS.wood}"/>
<g clip-path="url(#facade)">${planks.join("")}</g>
<polygon points="370,522 316,655 424,655" fill="url(#windowLight)" stroke="${COLORS.woodDark}" stroke-width="4"/>
<polygon points="370,592 354,652 386,652" fill="#e7b75a" opacity="0.7"/>
<line x1="370" y1="522" x2="370" y2="655" stroke="${COLORS.woodDark}" stroke-width="3"/>
<line x1="350" y1="572" x2="350" y2="655" stroke="${COLORS.woodDark}" stroke-width="3"/>
<line x1="390" y1="572" x2="390" y2="655" stroke="${COLORS.woodDark}" stroke-width="3"/>
<line x1="340" y1="600" x2="400" y2="600" stroke="${COLORS.woodDark}" stroke-width="3"/>
<rect x="300" y="655" width="140" height="11" fill="${COLORS.woodDark}"/>
<path d="M304 655 V638 M326 655 V638 M348 655 V638 M392 655 V638 M414 655 V638 M436 655 V638 M300 638 H440" stroke="${COLORS.woodDark}" stroke-width="3"/>
${icicles.join("")}
${lowerWindow(288)}${lowerWindow(410)}
<rect x="348" y="700" width="44" height="90" fill="${COLORS.door}" stroke="${COLORS.woodDark}" stroke-width="3"/>
<line x1="363" y1="702" x2="363" y2="788" stroke="#9c3530" stroke-width="2"/><line x1="377" y1="702" x2="377" y2="788" stroke="#9c3530" stroke-width="2"/>
<circle cx="370" cy="726" r="11" fill="none" stroke="${COLORS.wreath}" stroke-width="6"/>
<circle cx="362" cy="720" r="1.8" fill="${COLORS.ornamentRed}"/><circle cx="378" cy="724" r="1.8" fill="${COLORS.ornamentRed}"/><circle cx="368" cy="736" r="1.8" fill="${COLORS.ornamentRed}"/>
<path d="M370 736 L363 744 M370 736 L377 744" stroke="${COLORS.ornamentRed}" stroke-width="3"/>
<circle cx="385" cy="750" r="2.5" fill="${COLORS.ornamentGold}"/>
${lantern(338)}${lantern(402)}
${stringLights()}`
}

const rightCorner = (percent: number): string => {
  const snowRadius: number = 9 + percent * 0.12

  return `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 ${RIGHT_WIDTH} ${HEIGHT}" preserveAspectRatio="xMaxYMid meet" overflow="visible">
${moon(percent)}
${mountains(
  [
    { x: 0, y: 630 },
    { x: 110, y: 570 },
    { x: 210, y: 640 },
    { x: 330, y: 520 },
    { x: 440, y: 610 },
    { x: RIGHT_WIDTH, y: 560 },
  ],
  RIGHT_WIDTH,
)}
${pine(70, 790, 260, 64, snowRadius)}${pine(160, 790, 200, 52, snowRadius)}${pine(500, 790, 300, 70, snowRadius)}
${cabin(percent)}
</svg>`
}

// One drift across the whole width, its crest waving around `top`
const drift = (top: number, seed: number, fill: string): string => {
  const step: number = 160
  let path: string = `M0 ${HEIGHT} L0 ${n(top)}`
  let previous: Point = { x: 0, y: top }

  for (let x = step; x <= WIDTH; x += step) {
    const next: Point = { x, y: top + (hash(seed + x) - 0.5) * 28 }

    path += ` Q${n(previous.x + step / 2)} ${n(Math.min(previous.y, next.y) - 10)} ${n(next.x)} ${n(next.y)}`
    previous = next
  }

  return `<path d="${path} L${WIDTH} ${HEIGHT} Z" fill="${fill}"/>`
}

// The ground: its frame stretches to the window, so the snow keeps its height beside the corners
const ground = (percent: number): string => {
  const top: number = groundTop(percent)
  const sparkles: string[] = []

  for (let index = 0; index < 18; index++) {
    const x: number = hash(index + 500) * WIDTH
    const y: number = top + 20 + hash(index + 600) * (HEIGHT - top - 20)

    sparkles.push(
      `<circle cx="${n(x)}" cy="${n(y)}" r="1.6" fill="#ffffff">${twinkle(index + 700, 0, 0.9)}</circle>`,
    )
  }

  return `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none">
${drift(top, 1, "url(#ground)")}
${drift(top + 60, 2, "#dde3f5")}
${drift(top + 115, 3, "#eef2fc")}
${sparkles.join("")}
</svg>`
}

// The robin perched on the sign, its feet on the board's snow at (125, 172), drawn a size up
const robin =
  (): string => `<g transform="translate(125 172) scale(1.3) translate(-125 -172)">
<path d="M106 152 L84 146 L88 162 Z" fill="${COLORS.robinWing}"/>
<path d="M104 152 C104 128 122 114 138 116 C152 118 158 132 154 148 C150 166 132 172 118 170 C108 168 104 162 104 152 Z" fill="${COLORS.robinBody}"/>
<path d="M140 124 C152 126 156 140 152 152 C148 164 134 168 126 164 C132 152 132 134 140 124 Z" fill="${COLORS.robinBreast}"/>
<path d="M120 168 C130 170 144 166 150 158 C146 168 134 172 120 168 Z" fill="${COLORS.robinBelly}"/>
<path d="M108 146 Q122 136 134 152 Q118 162 108 146 Z" fill="${COLORS.robinWing}"/>
<circle cx="146" cy="128" r="2.6" fill="#1a1a1a"/>
<polygon points="153,130 163,133 153,136" fill="${COLORS.beak}"/>
<path d="M122 169 V174 M132 169 V174" stroke="#3a2a1a" stroke-width="2.5"/>
<path d="M124 121 C126 104 142 100 154 119 Z" fill="${COLORS.hat}"/>
<path d="M132 107 C122 96 110 96 104 104 C114 102 122 106 128 114 Z" fill="${COLORS.hat}"/>
<rect x="121" y="116" width="36" height="7" rx="3.5" fill="${COLORS.snow}"/>
<circle cx="104" cy="104" r="5.5" fill="${COLORS.snow}"/>
</g>`

// Whole minutes left as the sign writes them: 51m, or a dash when there is no cache
const cacheLabel = (minutes: number | null): string =>
  minutes === null ? "-" : `${minutes}m`

const candle = (minutes: number | null): string => {
  const filled: number =
    minutes === null ? 0 : Math.min(1, minutes / CANDLE_FULL_MINUTES)
  const height: number = 5 + filled * 26
  const top: number = 302 - height
  const flame: string =
    minutes === null
      ? ""
      : `<circle cx="88" cy="${n(top - 7)}" r="12" fill="url(#warmGlow)"/>
<ellipse cx="88" cy="${n(top - 6)}" rx="3.6" ry="6.5" fill="#ffc95a"><animate attributeName="ry" values="6.5;5.4;6.8;6.5" dur="1.6s" repeatCount="indefinite"/></ellipse>
<ellipse cx="88" cy="${n(top - 4.5)}" rx="1.6" ry="3" fill="#fff3c4"/>`

  return `<rect x="79" y="302" width="18" height="4" rx="2" fill="${COLORS.ribbon}"/>
<rect x="83" y="${n(top)}" width="10" height="${n(height)}" rx="2" fill="#f3e3b5"/>
${flame}`
}

const sign = (
  view: SceneView,
): string => `<svg x="0" y="0" width="100%" height="100%" viewBox="0 0 ${LEFT_WIDTH} ${HEIGHT}" preserveAspectRatio="xMinYMid meet" overflow="visible">
<path d="M80 -20 V178 M170 -20 V178" stroke="${COLORS.rope}" stroke-width="3"/>
${robin()}
<rect x="63" y="174" width="124" height="80" rx="8" fill="url(#board)" stroke="${COLORS.woodDark}" stroke-width="4"/>
<rect x="66" y="170" width="118" height="8" rx="4" fill="${COLORS.snow}"/>
<text x="125" y="223" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="700" fill="${COLORS.boardText}">${clampPercent(view.percent)}%</text>
<text x="125" y="244" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="600" fill="${COLORS.boardText}">context</text>
<path d="M88 254 V264 M162 254 V264" stroke="${COLORS.rope}" stroke-width="3"/>
<rect x="70" y="262" width="110" height="50" rx="6" fill="url(#board)" stroke="${COLORS.woodDark}" stroke-width="3"/>
${candle(view.cacheMinutes)}
<text x="138" y="290" text-anchor="middle" font-family="${FONT}" font-size="25" font-weight="700" fill="${COLORS.boardText}">${cacheLabel(view.cacheMinutes)}</text>
<text x="138" y="305" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="600" fill="${COLORS.boardText}">cache</text>
</svg>`

// Falling flakes over everything: more of them as the context fills. Each rests where it
// starts, so the scene still shows snow with motion turned off
const snowfall = (percent: number): string => {
  const flakes: string[] = []
  const count: number = 40 + Math.round(percent * 1.4)

  for (let index = 0; index < count; index++) {
    const x: number = hash(index + 1000) * WIDTH
    const y: number = hash(index + 2000) * HEIGHT
    const radius: number = 1.2 + hash(index + 3000) * 2.4
    const seconds: number = 9 + hash(index + 4000) * 9
    const sway: number = (hash(index + 5000) - 0.5) * 60

    flakes.push(
      `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="#ffffff" opacity="${n(0.5 + hash(index + 6000) * 0.4)}"><animateTransform attributeName="transform" type="translate" values="0 ${n(-y - 10)};${n(sway)} ${n((HEIGHT - y) / 2 - y / 2)};0 ${n(HEIGHT + 10 - y)}" dur="${n(seconds)}s" begin="-${n(hash(index + 7000) * seconds)}s" repeatCount="indefinite"/></circle>`,
    )
  }

  return flakes.join("")
}

export const sceneSvg = (view: SceneView): string => {
  const percent: number = clampPercent(view.percent)

  // The root has no viewBox, so each layer gets the whole screen: the sky and the flakes crop to
  // fill it, the corners keep their shape at the sides, and the ground stretches between them
  const fill: string = `x="0" y="0" width="100%" height="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice"`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
${defs()}
<svg ${fill}>${sky(percent)}</svg>
${leftCorner(percent)}
${rightCorner(percent)}
${ground(percent)}
${sign(view)}
<svg ${fill}>${snowfall(percent)}</svg>
</svg>`
}
