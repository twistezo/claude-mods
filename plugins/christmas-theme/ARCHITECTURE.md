# christmas-theme architecture

## Data

| What           | Source                                                                                                               | Refreshed                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| App colors     | `winterNight` palette in `hooks/register.tsx`, built by `createTheme` (copied from `shared/theme` by `npm run sync`) | Once per load of the mod; applied with `$.theme.set` at `session.start` |
| Snow depth     | `percentUsed` of the `five_hour` window in `rateLimits`, rounded by `limitPercent`                                   | `session.start`, and `session.measure` when `rateLimits` changed        |
| Window reset   | `resetsAt` of that window (`limitResetsAt`); past it, `snowPercent` gives 0                                          | Every 60 s by `$.clock.every`                                           |
| Stored figures | The `snow` atom (`types/index.d.ts`): `percent`, `resetsAt`, `changedAt`; an unchanged reading writes nothing        | As above                                                                |
| Drawn scene    | `ui.render` for `Backdrop`, one of two ways below                                                                    | When the atom changes                                                   |

No five-hour reading (off a subscription, or before the first response of a session) leaves the snow at its last depth, 0 in a new session.

## Two ways to draw

| Surface                                    | Drawn as                                                                                                                 | A new limit                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Desktop                                    | `Shader` `./snow-shader.ts` over `STILL_SCENE`: `sceneSvg` with no animation, the ground at 0%, boughs and sky as at 35% | Only `values.level` changes: the app eases the snow there |
| Mobile, or an app with no `Shader`         | `sceneSvg` moving: SMIL flakes, twinkles, smoke; ground and dress at the limit                                           | A new Svg `source`: the frame reloads                     |
| Desktop under Reduce Motion, failed shader | `STILL_SCENE` alone                                                                                                      | Nothing changes: no flakes, the ground at 0%              |

Why the desktop draws this way: an `isInteractive` Svg is a sandboxed frame, so a new `source` reloads it and the backdrop goes blank for a moment, and SMIL over the whole window repaints the whole SVG every frame. The still Svg never changes and never animates; the shader does the moving part on the GPU.

## The shader

| Part        | How                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground snow | 3 drifts at `groundTop(level)`, crests from `DRIFTS`, the same curves `drift` in `scene.ts` draws; skipped in the sky above the highest crest |
| Flakes      | 3 depths of cells; a share `0.05 + 0.15 × level / 100` of cells holds a flake, which falls and sways; only a cell with a flake does the math  |
| Cost        | `claude plugin validate` (2.1.331): 2.5 ms a frame on a fast GPU at 30 fps; a weak GPU draws it at 1.47 sharpness to stay in budget           |

`groundTop` and the drift crests live in both `scene.ts` and `snow-shader.ts`, since a shader file imports only `claude-code/shader`. A change to one goes into the other, or the shader's snow line leaves the stake's marks.

## What the limit changes

| 5h limit | Ground snow (frame of 900)         | Stake mark | Flakes, desktop share of cells |
| -------- | ---------------------------------- | ---------- | ------------------------------ |
| 0%       | 790, under the snowman             | foot       | 5%                             |
| 50%      | about 697, the snowman's head left | `50%`      | 12.5%                          |
| 100%     | 576, cabin to its upper window     | `100%`     | 20%                            |

`groundTop` is a curve fitted to frames of the original demo: slow at first, faster near a full window. The stake's marks sit on the same curve, and the drifts lie flat at the left edge, so the snow line meets the mark for its limit.

## UI/UX flow

```
 user adds the mod --> opens a new session
                              |
                              v
             app switches to dark mode (forced)
                              |
                              v
 +----------------------------------------------------------------+
 | stake                                              moon        |
 |  tree                 +----------------------+        cabin    |
 |  snowman, lamp        | glass panels: blur 16 |        chimney  |
 |                       | navy tint, 60%        |                 |
 |  ~~~~~ snow drift, rising with the 5h limit ~~~~~~~~~~~~~~~~~  |
 +----------------------------------------------------------------+
                              |
     after a turn, the 5h window moved a point (session.measure)
                              v
     desktop: shader eases the snow up | mobile: scene redrawn
                              |
          the window resets --> snow melts to 0 within a minute
```

The scene's root `<svg>` has no `viewBox`, so each layer takes the whole screen: the sky and the flakes crop to fill it, the left and right corners keep their shape (`xMinYMid meet`, `xMaxYMid meet`), and the ground stretches between them. The stake's marks meet the snow line while the window is wider than tall; in a tall phone window the corner and the ground scale apart.
