# claude-mods

Mods for the Claude desktop app, published as a plugin marketplace.

| Mod                                      | What it does                                                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`dracula-theme`](plugins/dracula-theme) | [Dracula](https://draculatheme.com) colors: Dracula in dark mode, Alucard in light mode. Static background, no animation. [Changelog](plugins/dracula-theme/CHANGELOG.md). |

## Install

Desktop app (`/plugin` does not run there):

1. Click **+** next to the prompt box, then **Plugins**.
2. **Add marketplace**: `twistezo/claude-mods`.
3. **Add plugin**: `dracula-theme`, then open a new session.

Terminal, then answer `y` to add the marketplace and pick a scope:

```
/plugin install dracula-theme --marketplace twistezo/claude-mods
```

The theme draws only in the desktop and mobile apps. Terminals and editors keep their own look. The mode follows the app's Appearance setting, which can differ from the system's.

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

When a mod changes, bump `version` in its `.claude-plugin/plugin.json` (installs from GitHub update only on a new version) and add an entry to its `CHANGELOG.md`.

## dracula-theme

All colors come from [the Dracula spec](https://draculatheme.com/spec) and live in [`palette.ts`](plugins/dracula-theme/hooks/palette.ts). [`register.ts`](plugins/dracula-theme/hooks/register.ts) turns them into a theme with `makeColors`.

| App role                                                  | Dracula (dark)                          | Alucard (light)    |
| --------------------------------------------------------- | --------------------------------------- | ------------------ |
| Page, cards, panels, menus                                | Background                              | Background         |
| Text                                                      | Foreground                              | Foreground         |
| Muted text                                                | derived by `makeColors`                 | Comment            |
| Code                                                      | the app's `dracula` code theme          | the app's own      |
| Accent                                                    | Purple                                  | Purple             |
| Danger, success, warning                                  | Red, Green, Orange                      | Red, Green, Orange |
| Pro                                                       | Pink                                    | Pink               |
| Git added, removed, modified, merged, closed, conflicting | Green, Red, Orange, Purple, Red, Orange | same               |

Three choices differ from the spec. The first two exist because the desktop app refuses a whole theme when any text is under 3:1:

- Dark muted text is derived: Dracula's Comment is under 3:1 on the app's field and hover fills.
- Danger, success and warning take the classic palette, not the spec's functional colors, which fall under 3:1.
- Every surface stays on Background. In dark mode Background Light showed as a band under the prompt box and flashed over the conversation when switching sessions; in light mode the app needs raised surfaces as light as the page, and Background is Alucard's lightest.

`hooks/make-colors.js` and `hooks/make-colors.d.ts` are copied unchanged from Claude Code's `plugin-authoring` skill. Copy them again when Claude Code updates.

## License

[MIT](LICENSE). Colors: [Dracula Theme](https://draculatheme.com).
