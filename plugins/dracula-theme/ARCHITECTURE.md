# dracula-theme architecture

## Data

| What                       | Source                                                                                                                                         | Refreshed                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Dracula and Alucard colors | `hooks/shared/dracula-palette.ts`, copied from `shared/theme` by `npm run sync`; values from the [Dracula spec](https://draculatheme.com/spec) | Never at run time; a mod update and a new session                   |
| Full app theme             | `makeColors` builds it from the palette when `register.ts` loads                                                                               | Once per load of the mod                                            |
| Applied look               | `$.theme.set`                                                                                                                                  | At `session.start`; the app then follows its own dark or light mode |

## UI/UX flow

```
 user adds the mod --> opens a new session
                              |
                              v
                 +---------------------------+
                 | app mode?                 |
                 +---------------------------+
                   | dark              | light
                   v                   v
              Dracula colors      Alucard colors
              code: "dracula"     code: app default
                   |                   |
                   +---------+---------+
                             v
             page, panels, prompt: one Background
             accents: purple, danger: red, success: green,
             warning: orange, pro: pink, git diff colors
                             |
                             v
             color the app cannot use --> toast at session start
```
