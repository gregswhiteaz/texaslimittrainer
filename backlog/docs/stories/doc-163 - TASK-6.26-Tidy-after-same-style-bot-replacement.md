---
id: doc-163
title: 'TASK-6.26: Tidy after same-style bot replacement'
type: other
created_date: '2026-11-26T13:45:00Z'
updated_date: '2026-11-26T13:45:00Z'
---
# TASK-6.26: Tidy after same-style bot replacement (dead Replay option, stale comments, style justifications)

Status: Done · Completed: 2026-11-26 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-007.5 (context only) · Branch: doit/TASK-6.26

## What was asked
Follow-up from TASK-6.25 (doc-130). Replacements now keep their style, so: (1) remove the dead replaced-styles branch from the playtest Replay line and keep its test checking live behaviour; (2) fix the stale `lineUp` comment, make the Rock CO raise justification name AJo, and make the Maniac fold-to-call justification one clear sentence; (3) shrink the replacement acceptance test from 10,000 codes to a small fixed set with the same check count. Spec: doit/TASK-6.26/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Rock CO/raise justification names the additions (medium pairs, suited broadway, ace-jack offsuit). **Deviation:** built text says "ace-jack offsuit (AJo)", not the spec's exact "ace-jack offsuit". | yes | AC#2 says the text must name AJo; orchestrator chose the literal "(AJo)" (qa.md). | Delete " (AJo)" in `src/bots/styles/rock.json`. |
| A-2 | Maniac fold-to-call justification rewritten as one sentence about paying off value bets and staying in its 65 to 85 percent aggression band. | yes | The old clause was unclear. | Edit `maniac.json`. |
| A-3 | The cli test keeps the "swapped styles" hand but now asserts its Replay line equals the unswapped one (no `--styles`). | yes | Keeps 102 assertions, so no integrity warning, and guards that the Replay line carries only the line-up name. | Delete the block (assertion count drops by 1, gate WARN). |
| A-4 | Fixed code set is 8 codes (`replayCodeFromWords([i+1,6,8,3])`, i=0..7). | yes | Style no longer depends on the code; every per-code check is kept. | Use 1 or 16 codes. |
| A-5 | Locked `tests/bots/replacement.acceptance.test.ts` (owner TASK-6.8) was unlocked by the orchestrator under TASK-6.8 before the build. | yes | AC#3 requires the edit; no assertion was dropped. | n/a |

## Clarifications and decisions
No questions asked. Decision: judge on substance for the Rock text deviation (see A-1).

## What was built
- `src/playtest/cli.ts`: removed dead `replacedStylesOption`; the Replay line now ends at the line-up option.
- `src/playtest/runner.ts`: `PlaytestOptions.lineUp` comment says a busted bot is replaced by a new bot of the same style.
- `src/bots/styles/rock.json`, `maniac.json`: the two justifications.
- `tests/playtest/cli.test.ts`: `--styles` test renamed; swapped-styles Replay line asserted equal to the unswapped one; 102 assertions kept.
- `tests/bots/replacement.acceptance.test.ts`: 10,000 codes became 8; 4 tests, 18 assertions kept.
No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02 | AC#1 | cli test; `grep -c replacedStylesOption` = 0; `--styles` replay output | PASS | Replay line ends at `--lineup mixed --styles ...` |
| SPEC-03 | AC#1 | `doit.py test-integrity` | PASS | Exit 0, no warnings |
| SPEC-04 | AC#2 | JSON and comment read; node check | PASS (Maniac true; Rock check prints false by design, see A-1) | Judge J-1-01 LOW |
| SPEC-05, 06 | AC#3 | replacement acceptance tests | PASS | 18 assertions kept |
- `npm test`: 326 files passed, 7 skipped; 1456 tests passed, 52 skipped. Branch CI green at 0784b5c.
- End to end: `npm run playtest -- --hands 2000 --lineup mixed --seed 42` gives 0 invariant violations and 29 bots replaced.
- Judge round 1: PASS, 6/6.

## Review
No blocking findings. Security review: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code review) and LOW (judge J-1-01): the SPEC-04 verification substring in spec.md and spec-items.json still expects "ace-jack offsuit, and still folds", so it prints `false` for Rock. The text is correct and matches the orchestrator's recorded choice. No product fix.

## How to try it
`npm run playtest -- --replay-code 0123456789abcdef0123456789abcdef --lineup mixed --styles rock,calling-station,maniac,tag,tag`
`npm run playtest -- --hands 2000 --lineup mixed --seed 42`
`npx vitest run tests/bots/replacement.acceptance.test.ts tests/playtest/cli.test.ts`

## Run metrics
Questions 0 · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines: see git diff 42e0cd8..HEAD (6 files).

## Known limitations and follow-ups
None. Rock/Maniac justification wording is easy to adjust (A-1, A-2).

## Lessons for the factory (proposals — not applied)
- When the orchestrator changes literal text after the spec is frozen, also update the spec's verification command, so the check does not print `false` on a correct build. Cost here was one MINOR and one LOW finding, with no rework.
