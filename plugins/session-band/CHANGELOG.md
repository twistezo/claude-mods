# Changelog

## 0.1.11 - 2026-11-15

- The branch symbol `⎇` takes the labels' smaller size.

## 0.1.10 - 2026-11-15

- Labels (`ctx`, `5h`, `1w`, `agents`, `resets in`) one size smaller than the figures.
- The weekly limit reads `1w` instead of `7d`.

## 0.1.9 - 2026-11-15

- A rate limit whose reset time has passed reads 0% instead of the last response's stale percent; no more `resets in 0m`.

## 0.1.8 - 2026-11-14

- Above 80%, a rate limit shows its reset: `5h 86% resets in 2h 14m`, `7d 92% resets Sun 15:00` (24-hour local time).

## 0.1.7 - 2026-11-14

- Back to 0.1.4 exactly: bars under percents removed, as a bar takes a full text row and could not sit tight and centered.

## 0.1.6 - 2026-11-14

- Bars drawn with `▔`, which sits at the top of its row, so they hug the percent above.

## 0.1.5 - 2026-11-14

- A bar of `━` under each percent, filled in the level's color; the row is centered vertically.
- Git counts bold on one element, like the other numbers.

## 0.1.4 - 2026-11-14

- Branch shown as `⎇ name` instead of `(name)`; the name's color and bold weight sit on one element, so it renders bold.

## 0.1.3 - 2026-11-14

- Back to the app's own band background: the page color left a visible outline.

## 0.1.2 - 2026-11-14

- Band background is the page color, so it blends in.

## 0.1.1 - 2026-11-14

- Wider gaps: an em space each side of the separators.
- Branch name and numbers in bold; labels and `%` muted.

## 0.1.0 - 2026-11-14

- Row above the prompt: `~/folder (branch) │ +347 -5 │ ctx 64% │ 5h 16% │ 7d 30% │ agents 2`.
- Lines added and removed against origin: unpushed commits, staged and unstaged edits, and untracked files (read only); hidden with no changes.
- Usage colors follow the desktop app's meters: warning above 80%, danger from 100%.
- Agents counted while pending, running or waiting; hidden at zero.
