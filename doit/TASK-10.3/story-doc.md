# TASK-10.3: See my five style stats against healthy ranges for my table size

Status: Done · Completed: 2026-11-24 · Epic: TASK-10 · Milestone: m-1 · Requirements: REQ-044 (044.4, 044.10, 044.11), REQ-045, REQ-046, REQ-061 (061.2), REQ-005.4 · Branch: doit/TASK-10.3

## What was asked
The Session Report shows the user's VPIP, PFR, Aggression, WTSD and W$SD for the session next to an authored healthy range for the table size, with a label (in range, too high, too low, not enough data). Table sizes map to reference sizes (heads-up, 6-max, full ring); sizes 3, 4, 5, 7, 8 are marked approximate. Spec: doit/TASK-10.3/spec.md.

## Assumptions made without asking — please review
Q-1, Q-2, the locked edits and A-1..A-11 were all auto-accepted under the unattended rule (qa.md). Please review them.

| ID | Assumption | Reversible? | To reverse |
|---|---|---|---|
| Q-1 / D-1 | Style counts (the user's 8 counts) are stored on the write-once report at session end. Ranges and labels are derived at display. No DB version change. | yes | Recompute from hand records on open |
| Q-2 / D-2 | AC#2 narrowed to VPIP, PFR, Aggression, W$SD. WTSD ranges authored realistically (HU 40–55, 6-max 30–42, full ring 28–40). Bot WTSD check moves to TASK-7.32. | yes | Widen WTSD ranges |
| D-3 | Locked TASK-10.1 edits: `tests/storage/session-end.acceptance.test.ts` and `e2e/session-report.spec.ts` now pass the stored hand records as the third argument of `sessionReport`. | yes | Keep `style` out of stored reports |
| A-1 | One-decimal values, half-up integer rounding `floor((2000p+w)/(2w))`. Label compares the same rounded tenths, limits inclusive. | yes | Compare unrounded value |
| A-2 | Reference size from configured `players`. Approximate iff 3, 4, 5, 7, 8. | yes | Majority dealt-in count |
| A-3 | Copy: `Your style vs healthy range (6-max)` / `(6-max, approximate)`; row `VPIP You 25.0% · healthy 20–28% · in range`; `—` rows say `not enough data`. | yes | Edit text |
| A-4 | Reports stored earlier, or ended with no hands, have no `style`; no section shown. | yes | Recompute legacy reports |
| A-5 | Rows show value, range and label only. Justifications live in the data file and docs. | yes | Add a tooltip |
| A-6 | No storyboard band-and-dot bar. | yes | Add with the Statistics screen |
| A-7 | A missing or invalid hand record at session end is skipped, so `handsDealt` may be below `handsPlayed`. | yes | Abort the end |
| A-8 | `endSession` reads hand records with one `get` per hand number, not a key range. | yes | Inject a key-range constructor |
| A-9 | The 100,000-hand AC#2 check is opt-in slow (`TLH_SLOW_TESTS=1`, in `test:slow`, ~2.5 min). | yes | Fast sampled variant |
| A-10 | Range limits are whole percents, `low < high`. A justification is one sentence. | yes | One-decimal limits |
| A-11 | Data file `{"format":"tlh-healthy-ranges","version":1,"ranges":{…}}`, validated at module load. | yes | TS constant |

## What was built
- `src/stats/healthy-ranges.json` (new): 15 authored ranges (5 stats × 3 sizes), each with an original one-sentence justification.
- `src/stats/healthy-ranges.ts` (new): `parseHealthyRanges` (fail-fast at load), `statTenths`, `rangeLabel`, `styleSection(players, counts)`. Headless, with no ui imports.
- `src/table/session-report.ts`: optional `style: StyleCounts` on `SessionReport`; `sessionReport(session, endedAt, hands?)` sums the user's per-hand counts; `parseSessionReport` validates `style` (whole numbers, `1 ≤ handsDealt ≤ handsPlayed`, part ≤ whole chain).
- `src/storage/hand-store.ts`: the end transaction also covers `hands`; reads records 1…handsPlayed and skips damaged ones.
- `src/ui/report/ReportScreen.tsx`, `src/ui/styles.css`: the section after the KPI tiles, before the only button, shown only when `style` exists.
- `package.json`: slow AC#2 test added to `test:slow`.
- Docs: `docs/stats/healthy-ranges.md` (new), `docs/storage/reports.md`.
- Tests: new unit, acceptance, storage and UI tests plus `e2e/report-style.spec.ts` (Chromium and WebKit, axe), and the two locked edits above.

## How it was verified
| SPEC item | Covers | Result |
|---|---|---|
| SPEC-01..15 | AC#1–7, DoD#1–13 | PASS (judge round 1, 15/15) |

- `npm test`: 1283 passed, 0 failed (272 files, coverage thresholds met). `npm run lint` and `npm run typecheck` pass. `npm run e2e`: 300 passed, 0 failed.
- Opt-in slow AC#2 alone: 155 s, TAG 6-max VPIP 22.2, PFR 16.2, Aggression 63.1, W$SD 49.9, all inside the 6-max ranges.
- Judge end-to-end in the real app at 2, 4, 6 and 10 players, plus a fold-every-hand session. Rows matched values computed independently from the stored hands. The fold session showed `—` and `not enough data`.
- Judge round 1 passed with no failures (judge/verdict-1.json). Gates: build-1 and fix-2 both PASS.

## Review
Round 1: no BLOCKER or MAJOR from the code and security reviewers.

### Non-blocking review notes (deliberately not fixed)
- Code MINOR: `tests/stats/healthy-ranges-tag.acceptance.test.ts:39` rounds with `Math.round` instead of `statTenths` and has a `console.log`. Margins are wide, so results are unchanged.
- Code NIT: the missing-record path (deleted hand record) is not covered by `tests/storage/session-end-style.test.ts` (the judge checked it by hand).
- Code NIT: `APPROXIMATE_PLAYERS` and the size names duplicate `GameConfigScreen.tsx`. A headless module cannot import from ui, so there are two copies to keep in sync.
- Security MINOR: `endSession` issues one `get` per hand up to `handsPlayed`, which is bounded only by `MAX_SESSION_COUNT` (1e9). Only a hand-edited local record could trigger it (self-inflicted). `reviews/round-1/security.json`.
- Judge J-1-01 (LOW): `statTenths` can be off by one above about 4.5 trillion counts (2000×part leaves the safe-integer range). Unreachable in real sessions.

## How to try it
`npm run dev`, start a default game, play a few hands, choose Leave table. Slow check: `TLH_SLOW_TESTS=1 npx vitest run tests/stats/healthy-ranges-tag.acceptance.test.ts`.

## Run metrics
Questions 2 · assumptions 11 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 1275 (18 files).

## Known limitations and follow-ups
- WTSD finding: all-TAG bots measure about 94% WTSD (6-max, 100,000 hands) because advised play folds only about 3% after the flop. AC#2 was narrowed (Q-2). Until TASK-7.32 (high) lands, a user who follows the advice will see WTSD "too high". [trainer] TASK-7.32 owns the investigation and re-checking WTSD against the ranges.
- [trainer] Cap or harden the unbounded hand reads at session end (security MINOR). Optional; low value.
- [trainer] Test tidy-up: switch the slow test to `statTenths`, drop its `console.log` (locked test), and add a deleted-record case.
- [trainer] J-1-01: cap stored style counts or use exact large-number maths. Unreachable today.
- Not in this story: error rates and hints (TASK-10.4), leaks (TASK-10.5+), sit-and-go finishing position (TASK-10.12), lifetime stats against ranges (TASK-11.8, TASK-11.10), the band-and-dot bar, back-filling old reports.

## Lessons for the factory (proposals — not applied)
- The spec's AC#2 contradicted measured bot behaviour, and this was found only while writing the spec. Proposal: measure the current system against any "bots inside a range" AC before ACs are approved.
