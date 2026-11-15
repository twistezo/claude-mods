# dracula-scene-theme architecture

## Data

| What                             | Source                                                                                                                                         | Refreshed                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Dracula colors                   | `hooks/shared/dracula-palette.ts`, copied from `shared/theme` by `npm run sync`; values from the [Dracula spec](https://draculatheme.com/spec) | Never at run time; a mod update and a new session                           |
| Full app theme, glass, dark mode | `createTheme` in `register.tsx` when the mod loads                                                                                             | Once per load of the mod                                                    |
| Applied look                     | `$.theme.set`                                                                                                                                  | At `session.start`                                                          |
| Scene picture                    | `SCENE_SVG`, built from `GLOWS` in `scene.ts` when the mod loads                                                                               | Once per load; the motion is SMIL inside the SVG, so no hook runs per frame |
| Drawn scene                      | `ui.render` for `Backdrop`                                                                                                                     | Whenever the app draws its backdrop                                         |

## UI/UX flow

```
 user adds the mod --> opens a new session
                              |
                              v
             app switches to dark mode (forced)
                              |
                              v
 +--------------------------------------------------------+
 |  scene: purple, pink and gray glows drift slowly       |
 |  (12 s, 16 s, 20 s loops, out and back)                |
 |   +--------------------------------------------------+ |
 |   | glass panels: blur 64, Background tint, 85%      | |
 |   | Dracula text, accents and git colors on top      | |
 |   +--------------------------------------------------+ |
 +--------------------------------------------------------+
                              |
                              v
 other surfaces (no scene support) --> plain Dracula colors
 color the app cannot use          --> toast at session start
```
