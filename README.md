# claude-mods

Mods for the Claude desktop app, published as a plugin marketplace.

| Mod                                      | What it does                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`dracula-theme`](plugins/dracula-theme) | [Dracula](https://draculatheme.com) colors: Dracula in dark mode, Alucard in light mode. Static background, no animation. |

## Install

Type at the prompt of a Claude Code session, then answer `y` to add the marketplace and pick a scope:

```
/plugin install dracula-theme --marketplace twistezo/claude-mods
```

The theme draws only in the desktop and mobile apps. Terminals and editors keep their own look.

## Develop

Requires Node from `.nvmrc`.

```bash
npm install
```

Add this folder as a local marketplace and install from it, once:

```
/plugin marketplace add /path/to/claude-mods
/plugin install dracula-theme@claude-mods
```

After an edit, run `/reload-plugins` in the session. A local marketplace is read from this folder, so no reinstall is needed.

```bash
# Type-check, lint and format check
npm run check
```

`npm run typecheck` needs `plugins/*/.claude-plugin/types/`, which Claude Code writes when it first loads the mod.

When a mod changes, bump `version` in its `.claude-plugin/plugin.json`: installs from GitHub update only on a new version.

## dracula-theme

All colors come from [the Dracula spec](https://draculatheme.com/spec) and live in [`palette.ts`](plugins/dracula-theme/hooks/palette.ts). [`register.ts`](plugins/dracula-theme/hooks/register.ts) turns them into a theme with `makeColors`.

| App role                                                  | Dracula (dark)                          | Alucard (light)    |
| --------------------------------------------------------- | --------------------------------------- | ------------------ |
| Page, cards, panels (prompt box)                          | Background                              | Background         |
| Menus                                                     | Background Light                        | Background         |
| Text                                                      | Foreground                              | Foreground         |
| Muted text                                                | derived by `makeColors`                 | Comment            |
| Code                                                      | the app's `dracula` code theme          | the app's own      |
| Accent                                                    | Purple                                  | Purple             |
| Danger, success, warning                                  | Red, Green, Orange                      | Red, Green, Orange |
| Pro                                                       | Pink                                    | Pink               |
| Git added, removed, modified, merged, closed, conflicting | Green, Red, Orange, Purple, Red, Orange | same               |

The desktop app refuses a whole theme when any text is under 3:1, so three choices differ from the spec:

- Dark muted text is derived: Dracula's Comment is under 3:1 on Background Light.
- Danger, success and warning take the classic palette, not the spec's functional colors, which fall under 3:1.
- Alucard's raised surfaces stay on Background: the app needs them as light as the page or lighter, and Background is Alucard's lightest.

`hooks/make-colors.js` and `hooks/make-colors.d.ts` are copied unchanged from Claude Code's `plugin-authoring` skill. Copy them again when Claude Code updates.

## License

[MIT](LICENSE). Colors: [Dracula Theme](https://draculatheme.com).
