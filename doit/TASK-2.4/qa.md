# TASK-2.4 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — What Start game with Sit-and-go does in this story (D-1)
Options: (a) table opens with every seat at 1,500 chips at fixed level-1 limits 20/40 (blinds 10/20); limits never
rise, no results, top-up refills to 1,500; only the action bar shows plain chips (AC#6), stacks/pot keep "$" until
TASK-5.3 [Recommended]; (b) Start disabled for Sit-and-go (contradicts AC#5); (c) a $4/$8 cash table labelled sng.
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — Sit-and-go table header (D-2)
Options: (a) `Sit-and-go · 6 players · 20/40 · Hand #1` (no $); cash header unchanged [Recommended]; (b) add "Level 1"
now; (c) keep `$20/$40`.
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — SessionConfig shape (D-3, public interface; TASK-2.10 will persist it)
Options: (a) discriminated union — CashSessionConfig {gameType:'cash', stake} | SitAndGoSessionConfig
{gameType:'sit-and-go'} with no stake key; DEFAULT_SESSION_CONFIG typed as cash; resolveSessionConfig drops stake for
sng [Recommended]; (b) optional `stake?`; (c) keep stake and ignore it (contradicts AC#5).
**Answer: auto-accepted (recommended)** — (a). Nothing is persisted yet, so this is reversible.

## Q-4 — Game-type control and wording (D-4)
Options: (a) radio group in the "Game type" row per storyboard Config.dc.html:27-33 — "Cash game" / "Sit-and-go", Cash
checked, ≥44 px, checked 2px #D7262E border, other 1px #343A43; Stakes and Buy-in rows removed while Sit-and-go is
checked [Recommended]; (b) a native select (breaks the exactly-one-combobox locked tests); (c) toggle buttons.
**Answer: auto-accepted (recommended)** — (a).

## Q-5 — Amend two locked tests, extraction only (D-5)
TASK-2.1 `tests/ui/home.acceptance.test.tsx` (radio row value = checked label text; controls `['<input ', '<input ',
'<select ']`) and TASK-2.3 `tests/ui/game-config-stake.acceptance.test.tsx` (`<(a|input|form)` → `<(a|form)` plus a
new exact check: two inputs, both radios). Expected values byte-identical; nothing deleted.
**Answer: auto-accepted (recommended)** — approve. Unlocks recorded under TASK-2.1 and TASK-2.3.
