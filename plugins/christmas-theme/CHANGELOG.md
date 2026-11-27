# Changelog

## 0.3.0 - 2026-11-27

- Desktop: snow drawn on the GPU over a still scene. The backdrop no longer goes blank when the limit moves, and the snow rises smoothly to each new level.
- Lighter on the app: no animation left in the scene itself on the desktop; flakes fall in the shader at 30 fps.
- A red and white snow stake by the left edge, marked 25%, 50%, 75% and 100% of the five-hour limit; the snow buries it as the limit fills.
- Lighter glass over the conversation (blur 16, 60%).

## 0.2.0 - 2026-11-27

- Snow follows the five-hour rate limit instead of the context window, and melts away when the window resets.
- Robin, sign and cache candle removed.
- Smooth snowfall: the flakes keep falling through replies and redraws instead of jumping back.

## 0.1.0 - 2026-11-27

- Dark only: a snowy Christmas night behind the conversation, with a tree, a snowman, a lamp and an A-frame cabin.
- Snow on the ground and on the boughs piles up as the context window fills, and settles again after a compaction.
- A robin's sign shows the context fill; a candle under it burns down with the prompt cache's remaining minutes, and shows `-` when there is none.
