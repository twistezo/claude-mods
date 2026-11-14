# claude-mods

Mods for the Claude desktop app, published as a plugin marketplace.

| Mod                                      | Dark mode                           | Light mode | Changelog                                       |
| ---------------------------------------- | ----------------------------------- | ---------- | ----------------------------------------------- |
| [`dracula-theme`](plugins/dracula-theme) | [Dracula](https://draculatheme.com) | Alucard    | [CHANGELOG](plugins/dracula-theme/CHANGELOG.md) |

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
# Copy shared/theme into every mod, after any change there
npm run sync
```

```bash
# Sync check, type-check, lint and format check
npm run check
```

`npm run typecheck` needs `plugins/*/.claude-plugin/types/`, which Claude Code writes when it first loads the mod.

When a mod changes, bump `version` in its `.claude-plugin/plugin.json` (installs from GitHub update only on a new version) and add an entry to its `CHANGELOG.md`. A change in `shared/theme` changes every mod.

## Layout

| Path                              | What it holds                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `shared/theme/create-theme.ts`    | Turns a dark and a light palette into a look: the logic every theme mod shares                    |
| `shared/theme/make-colors.*`      | Copied unchanged from Claude Code's `plugin-authoring` skill; copy again when Claude Code updates |
| `plugins/<mod>/hooks/palette.ts`  | The mod's colors, the only file a new theme needs to write                                        |
| `plugins/<mod>/hooks/register.ts` | Sets the look at session start; the engine needs this hook written out in each mod                |
| `plugins/<mod>/hooks/shared/`     | Copy of `shared/theme`, written by `npm run sync`: an installed mod gets only its own folder      |

## How colors map

Names are the palette's.

| App role                                                  | Dark                                    | Light              |
| --------------------------------------------------------- | --------------------------------------- | ------------------ |
| Page, cards, panels, menus                                | Background                              | Background         |
| Text                                                      | Foreground                              | Foreground         |
| Muted text                                                | derived by `makeColors`                 | Comment            |
| Code                                                      | the app's `dracula` code theme          | the app's own      |
| Accent                                                    | Purple                                  | Purple             |
| Danger, success, warning                                  | Red, Green, Orange                      | Red, Green, Orange |
| Pro                                                       | Pink                                    | Pink               |
| Git added, removed, modified, merged, closed, conflicting | Green, Red, Orange, Purple, Red, Orange | same               |

Three choices differ from the Dracula spec. The first two exist because the desktop app refuses a whole theme when any text is under 3:1:

- Dark muted text is derived: Comment is under 3:1 on the app's field and hover fills.
- Danger, success and warning take the palette's colors, not the spec's functional ones, which fall under 3:1.
- Every surface stays on Background. In dark mode a lighter surface showed as a band under the prompt box and flashed over the conversation when switching sessions; in light mode the app needs raised surfaces as light as the page, and Background is the lightest.

## License

[MIT](LICENSE), for the code. Colors: [Dracula Theme](https://draculatheme.com).
