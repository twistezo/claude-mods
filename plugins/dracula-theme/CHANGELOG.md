# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions match `version` in [`plugin.json`](.claude-plugin/plugin.json).

## 0.1.3 - 2026-11-14

### Changed

- The theme logic moved to `shared/theme`, shared with `dracula-pro-theme`. No visible change.

## 0.1.2 - 2026-11-14

### Fixed

- Dark mode: the band under the prompt box matches the page.
- Dark mode: the conversation no longer flashes a lighter color when switching sessions.

### Changed

- Menus use Background instead of Background Light, so every surface is Background in both modes.

## 0.1.1 - 2026-11-14

### Changed

- Dark mode: cards and panels, the prompt box among them, use Background instead of Background Light.

## 0.1.0 - 2026-11-14

### Added

- Dracula colors in dark mode, Alucard in light mode, from the [Dracula spec](https://draculatheme.com/spec).
- Static background that follows the mode.
- The app's `dracula` code theme in dark mode.
