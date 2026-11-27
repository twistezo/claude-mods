# christmas-theme architecture

## Data

| What             | Source                                                                                                                       | Refreshed                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| App colors       | `winterNight` palette in `hooks/register.tsx`, built by `createTheme` (copied from `shared/theme` by `npm run sync`)         | Once per load of the mod; applied with `$.theme.set` at `session.start` |
| Context fill     | `context.percent` from `$.session.usage()`, rounded by `contextPercent`                                                      | `session.start`, each main-thread `turn.step`, `session.measure`        |
| Cache lifetime   | The step's `usage`: `ephemeral_5m_input_tokens`, `ephemeral_1h_input_tokens`, a plain write or a read (`cacheTtlMs`)         | Each main-thread `turn.step`; counted from when its request went out    |
| Cache minutes    | `cacheMinutesLeft(cacheExpiresAt, $.clock.now())`                                                                            | Each `turn.step`, and every 15 s by `$.clock.every`                     |
| No cache (`-`)   | A finished `session.compact` of the main conversation (not `precompute`)                                                     | On that compaction                                                      |
| All of the above | The `snow` atom (`types/index.d.ts`); a write that changes nothing is skipped, so the scene redraws only on a visible change | As above                                                                |
| Drawn scene      | `sceneSvg` in `hooks/scene.ts`, from the `snow` atom, through `ui.render` for `Backdrop`                                     | On each change of the atom; the motion is SMIL inside the SVG           |

## What the context changes

| Context | Ground snow (frame of 900)           | Bough snow | Lights, moon       | Flakes |
| ------- | ------------------------------------ | ---------- | ------------------ | ------ |
| 0%      | 790, under the snowman               | small      | full               | 40     |
| 44%     | about 710, the snowman's head left   | larger     | dimmer             | 102    |
| 91%     | about 600, cabin to its upper window | joined     | dimmest, sky hazed | 167    |

`groundTop` is a curve fitted to those frames of the original demo: slow at first, faster near a full window.

## UI/UX flow

```
 user adds the mod --> opens a new session
                              |
                              v
             app switches to dark mode (forced)
                              |
                              v
 +----------------------------------------------------------------+
 | robin sign: 44% context     moon                               |
 |             candle 60m cache                                   |
 |  tree                 +----------------------+        cabin    |
 |  snowman, lamp        | glass panels: blur 24 |        chimney  |
 |                       | navy tint, 55%        |                 |
 |  ~~~~~ snow drift, rising with the context fill ~~~~~~~~~~~~~  |
 +----------------------------------------------------------------+
                              |
        each model response (turn.step)
                              v
      fill and cache read --> atom changes --> scene redrawn
                              |
           every 15 s: the candle's minutes tick down
                              |
           /compact: fill drops, the sign shows "-" for the cache
```

The scene's root `<svg>` has no `viewBox`, so each layer takes the whole screen: the sky and the flakes crop to fill it, the left and right corners keep their shape (`xMinYMid meet`, `xMaxYMid meet`), and the ground stretches between them.
