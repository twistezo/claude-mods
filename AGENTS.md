# AGENTS.md

Theme mods for the Claude desktop app. Layout, scripts and color mapping: [README.md](README.md).

## Color sources

Every color decision follows the theme's own spec. Where the spec gives a color a role (error, string, keyword, border), use it in that role.

| Mod             | Source of truth                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `dracula-theme` | https://draculatheme.com/spec, with roles from https://draculatheme.com/spec#syntax-highlighting-rules |

A spec value can only give way to the desktop app's hard limits below. Record each such choice in README's "How colors map".

## Desktop app limits

- Text under 3:1 anywhere makes the app refuse the whole theme. Run the palette through `createTheme` and confirm `unpainted` is `undefined`.
- `overrideColorScheme` is ignored, so the app's Appearance setting picks the mode. A mod serves both modes.
- Hooks are written out in each mod's `register.ts`: `export const register = on => { on("<event>", async ($, e, next) => ...) }`, with `$` spelled `$.noun.method(...)` at the call site. Shared code returns values only.
- `/plugin` does not run in the desktop app; install through **+** → **Plugins**.

## Change checklist

1. Edit shared logic in `shared/theme`, then `npm run sync`.
2. `npm run check` is green.
3. Validate with the desktop app's own Claude Code, since the CLI on `PATH` may be older: `"$HOME/Library/Application Support/Claude/claude-code/<version>/<hash>/claude.app/Contents/MacOS/claude" plugin validate plugins/<mod>`.
4. Each changed mod gets a `version` bump in `.claude-plugin/plugin.json` and an entry in its `CHANGELOG.md`.
