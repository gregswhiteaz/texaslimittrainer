# TASK-10.5 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Persisted format: optional `leakCounts: { category, decisions, errors, major }[]` on the stored Session Report (unhinted counts for every postflop category with at least 1 unhinted decision, category order), written once at session end; status/evidence/text derived at display; no DB version change
**Answer: auto-accepted (recommended)** — persisted-format change listed for review.

## Q-2 — User-visible leak text: the 15 titles, evidence names and one-sentence fixes with justifications in spec §5 "Category content"
**Answer: auto-accepted (recommended)** — user-visible strategy copy listed for review.

## Spec Detective notes
- A-1..A-8 accepted. Until TASK-10.8, every leak is listed in category order (A-3). No locked-test edits.
