# christmas-theme architecture

## Data

| What           | Source                                                                                                               | Refreshed                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| App colors     | `winterNight` palette in `hooks/register.tsx`, built by `createTheme` (copied from `shared/theme` by `npm run sync`) | Once per load of the mod; applied with `$.theme.set` at `session.start` |
| Snow depth     | `percentUsed` of the `five_hour` window in `rateLimits`, rounded by `limitPercent`                                   | `session.start`, and `session.measure` when `rateLimits` changed        |
| Window reset   | `resetsAt` of that window (`limitResetsAt`); past it, `snowPercent` gives 0                                          | Every 60 s by `$.clock.every`                                           |
| Stored figures | The `snow` atom (`types/index.d.ts`): `percent`, `resetsAt`, `changedAt`; an unchanged reading writes nothing        | As above                                                                |
| Drawn scene    | `sceneSvg` in `hooks/scene.ts`, through `ui.render` for `Backdrop`                                                   | When the atom changes; the motion is SMIL inside the SVG                |

No five-hour reading (off a subscription, or before the first response of a session) leaves the snow at its last depth, 0 in a new session.

## What the limit changes

| 5h limit | Ground snow (frame of 900)           | Bough snow | Lights, moon       | Flakes |
| -------- | ------------------------------------ | ---------- | ------------------ | ------ |
| 0%       | 790, under the snowman               | small      | full               | 40     |
| 44%      | about 710, the snowman's head left   | larger     | dimmer             | 102    |
| 91%      | about 600, cabin to its upper window | joined     | dimmest, sky hazed | 167    |

`groundTop` is a curve fitted to frames of the original demo: slow at first, faster near a full window.

## Smooth motion

| Problem                                                  | What the scene does                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| A redraw restarts every animation, so the flakes jump    | Each animation begins at `-(changedAt in seconds mod its duration)`: a redraw carries on where the last one was |
| Hundreds of animations stall while the app draws a reply | 31 in all: flakes move in 3 layers, one fall and one sway each; lights and stars twinkle in groups of three     |
| A falling layer must loop without a seam                 | Each flake is drawn twice, one screen apart; the layer slides down one screen and starts over                   |

## UI/UX flow

```
 user adds the mod --> opens a new session
                              |
                              v
             app switches to dark mode (forced)
                              |
                              v
 +----------------------------------------------------------------+
 |                                                    moon        |
 |  tree                 +----------------------+        cabin    |
 |  snowman, lamp        | glass panels: blur 24 |        chimney  |
 |                       | navy tint, 55%        |                 |
 |  ~~~~~ snow drift, rising with the 5h limit ~~~~~~~~~~~~~~~~~  |
 +----------------------------------------------------------------+
                              |
     after a turn, the 5h window moved a point (session.measure)
                              v
             atom changes --> scene redrawn, motion continues
                              |
          the window resets --> snow melts to 0 within a minute
```

The scene's root `<svg>` has no `viewBox`, so each layer takes the whole screen: the sky and the flakes crop to fill it, the left and right corners keep their shape (`xMinYMid meet`, `xMaxYMid meet`), and the ground stretches between them.
