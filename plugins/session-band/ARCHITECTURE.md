# session-band architecture

## Data

| Segment                      | Source                                                                                                                                                                                         | Refreshed                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Folder                       | `$.session.cwd()`, `HOME` from `$.env`                                                                                                                                                         | On refresh                                                                             |
| Branch                       | `git branch --show-current`, else `git rev-parse --short HEAD`                                                                                                                                 | On refresh                                                                             |
| `+added -removed`            | `git diff --numstat` against the upstream fork point, `origin/HEAD` or `HEAD`, plus lines of untracked files (`git ls-files -z`, max 200 files)                                                | On refresh                                                                             |
| `ctx`                        | `context.percent` from `$.session.usage()` or the `session.measure` event                                                                                                                      | On refresh                                                                             |
| `5h`, `1w`                   | `rateLimits` from the last API response; before the first one, the `rateLimits` key in `$.store` (shared by all sessions). Code in `shared/rate-limits`, which christmas-theme's snow uses too | On refresh; written to `$.store` only when `session.measure` says `rateLimits` changed |
| Reset note, 0% after a reset | `resetsAt` compared with `$.clock.now()`                                                                                                                                                       | On every redraw                                                                        |
| `agents`                     | `$.agent.list()`, statuses `pending`, `running`, `waiting`                                                                                                                                     | On refresh                                                                             |

A refresh reads everything above into the `bandInfo` atom. It runs on:

| Event             | When                                                |
| ----------------- | --------------------------------------------------- |
| `session.start`   | A session opens                                     |
| `session.measure` | After each turn, and when a rate-limit window moves |
| `agent.spawn`     | An agent starts                                     |
| `turn.complete`   | An agent ends a turn                                |

Nothing refreshes on a file save, a commit or a branch switch made outside a turn: the band shows them after the next event. The band itself redraws from the atom on each `ui.render` of `AbovePrompt`.

## UI/UX flow

```
 ~/projects/app  ⎇ main │ +347 -5 │ ctx 64% │ 5h 86% resets in 2h 14m │ 1w 30% │ agents 2
 |               |        |         |         |                         |        |
 folder          branch   lines vs  context   5-hour limit              weekly   running
 (~ = home)      (cyan)   origin    window    countdown above 80%       limit    agents
```

```
 segment hidden when:          color:
 - no repository: branch,      normal   <= 80%  text
   lines                       warning   > 80%  orange, reset shown
 - no changes: lines           danger  >= 100%  red, reset shown
 - no reading: ctx, 5h, 1w     cached           muted gray until the first response
 - 0 agents: agents            reset passed     reads 0%
 - a survey is open: whole band
```

```
 new conversation --> 5h / 1w from the last session, muted
        |
        v
 first response --> live 5h / 1w, colored by level, kept for the next conversation
```
