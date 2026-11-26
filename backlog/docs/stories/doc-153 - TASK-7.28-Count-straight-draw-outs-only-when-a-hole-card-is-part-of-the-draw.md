---
id: doc-153
title: 'TASK-7.28: Count straight-draw outs only when a hole card is part of the draw'
type: other
created_date: '2026-11-26T04:43:00Z'
updated_date: '2026-11-26T04:43:00Z'
---
# TASK-7.28: Count straight-draw outs only when a hole card is part of the draw

Status: Done · Completed: 2026-11-25 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up from the TASK-7.9 review) · Branch: doit/TASK-7.28

## What was asked
`drawOuts` gave the hero 8 open-ended straight outs when the four-card run was entirely on the board and a hole card only paired one of its ranks (7c 2d on 5h 6s 7h 8d). Every player shares that draw, so it is worth nothing to the hero. It also listed straight outs after the hero had already made a flush (9h 8h on 7h 6h 2h). The story: a straight draw counts only when a hole card adds a rank the board does not have, and straight outs are dropped when a flush is already made. Spec: doit/TASK-7.28/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "A hole card is part of the draw" means a hole card's rank is in the four-card run and that rank is not on the board. A hole card that only pairs a board rank in the run does not count. | yes | It is the AC#1 case and matches the flush half, where a board-only four-flush gives no outs. | Revert `openEnderStart` in `src/advice/ranges.ts` to accept any hole rank in the run |
| A-2 | "Made flush" means five or more cards of one suit among hole and board. A made full house or quads cannot hold an open-ended run in 5-6 cards, so flush or straight are the only made hands to exclude. | yes | Smallest rule that satisfies AC#3. `hasStraight` already covers made straights. | Remove the 5+ suit guard in `drawOuts` |
| A-3 | The new playtest SHA and the 12 style-band lines are recorded in `doit/TASK-7.28/build-log.md` (the TASK-7.9 convention). No test or doc pins the SHA. | yes | Same convention as before. | n/a |

## Clarifications and decisions
- Q-1 (autopilot, auto-accepted the recommended option): the old AC#2 example (9c 2d on 5h 6s 7h) is a gutshot, not an open-ender, so it could not pass. It was replaced with hole 8c 2d on 5h 6s 7h (four 4s and four 9s = 8 outs). The AC was changed through the backlog CLI (old AC removed, new one added), so the ACs were renumbered. The new example is AC#4.
- D-1: the shared definition also applies to `hasOpenEnder` / `classifyCombo`. Spec section 5 shows that this leaves every classification unchanged, and a regression test pins it (SPEC-05).

## What was built
- `src/advice/ranges.ts`:
  - `openEnderStart` now needs a run rank that is in the hole and not on the board (`rankMask(hole) & ~rankMask(board)`).
  - `drawOuts` skips straight outs when any suit has 5 or more cards among hole and board.
  - The flush rule and all signatures are unchanged.
- `docs/advice/postflop-rules.md`: the "Draw and outs" bullet describes both rules.
- Consumer: `src/advice/postflop.ts` uses `outs` for implied-odds required equity, so hints and bot play shift slightly.
- Tests:
  - New `tests/advice/straight-outs.acceptance.test.ts` (AC#1, AC#3, AC#4).
  - `tests/advice/ranges.test.ts` adds a `drawOuts` edge-case test and a "classifyCombo is unchanged" test.
- Size: 67 changed lines in 4 files, inside the scope budget (4 files, 140 lines).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 to SPEC-04 | Board-only draw gives no outs; hole-added draw keeps 8 outs; made flush gives no straight outs | Locked acceptance test plus unit tests | PASS | `straight-outs.acceptance.test.ts`, `ranges.test.ts` |
| SPEC-05 | Classifier unchanged (D-1) | Regression test; passes under old and new rules by design | PASS | `ranges.test.ts` |
| SPEC-06 | Playtest SHA recorded | `npm run -s playtest -- --hands 10000 --seed 42` | PASS | before `643c8111...48c1`, after `f6c8d172...e47cbc`, 0 invariant violations, matches the spec prototype. Folds 8093 to 8095. |
| SPEC-07 | Style bands unchanged, 3 seeds | `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`, unedited | PASS | 3/3 seeds, 901 s, 12 lines in build-log.md (seed 42 TAG 20.4/14.6/59.5, Maniac 56.1/53.2/82.3) |

- `npm test`: 317 files passed (6 skipped), 1433 tests passed (48 skipped), coverage thresholds held. Format, lint and typecheck are clean.
- No locked test from another story moved, and no locked-value edits were needed.
- Gates: build-1, fix-2 and fix-3 all PASS (67 changed lines).
- Judge round 1: PASS (7/7, no missing results, no unproven AC or DoD).

## Review
Review round 1 (code and security): no blocking findings. All SPEC correctness and test-strength rubric items passed.

### Non-blocking review notes (deliberately not fixed)
- NIT `src/advice/ranges.ts:452`: `openEnderStart` calls `rankMask(hole)` twice. Behaviour is identical. The judge logged it as LOW J-1-01.
- NIT `docs/advice/postflop-rules.md:42`: one edited line is longer than the ~100-column wrapping around it.

## How to try it
- `npx vitest run tests/advice/straight-outs.acceptance.test.ts tests/advice/ranges.test.ts`
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` (expect `f6c8d172...e47cbc`)
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` (about 15 minutes)

## Run metrics
Questions asked: 1 (auto-accepted) · assumptions logged: 3 (spec table; state.json counter reads 0) · review rounds: 1 · judge rounds: 1 · gate runs: 3 · escalations: 0 · changed lines: 67.

## Known limitations and follow-ups
- Out of scope by design: gutshots, backdoor draws, discounting outs that also help an opponent, straight-flush draws on a made hand, and dropping flush outs when a straight is made.
- No follow-ups. The two NITs change no behaviour.

Not tracked (below the value bar): the double `rankMask(hole)` call and the unwrapped doc line.

## Lessons for the factory (proposals — not applied)
- The task's AC#2 example (9c 2d on 5h 6s 7h) was a gutshot and could not pass, which cost a Q-1 round trip. Proposal: have the spec author check each AC example against the real function (a one-line script) before the AC is accepted.
