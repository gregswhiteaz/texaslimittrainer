# TASK-2.3 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — Stake control and wording (D-1)
Native `<select id="config-stake">` in the existing Stakes row; label "Stakes (small bet / big bet)"; options "$2 / $4",
"$3 / $6", "$4 / $8", "$6 / $12", "$10 / $20", "$20 / $40" with "$4 / $8" selected; buy-in stays read-only text that
follows the stake, e.g. "$120 (20 big bets)" at $3/$6. Matches storyboard Config.dc.html:41-45 and TASK-2.1 Q-4 row text.
Alternatives: options without spaces ("$2/$4"); a radio group.
**Answer: auto-accepted (recommended)** — as described.

## Q-2 — Amend locked TASK-2.1 test (D-2)
`tests/ui/home.acceptance.test.tsx::game config shows the first-use cash session with five TAG bots`: strip tags from
each `<dt>`; read the selected option's text when a `<dd>` holds a `<select>`; replace "no input/select/textarea" with
"exactly one select and still no input or textarea"; every expected value byte-identical. Needed because the AC requires
a stake control.
**Answer: auto-accepted (recommended)** — approve. Unlock recorded under TASK-2.1.
