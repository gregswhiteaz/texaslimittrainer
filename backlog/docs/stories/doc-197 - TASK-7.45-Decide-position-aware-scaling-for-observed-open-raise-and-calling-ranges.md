---
id: doc-197
title: >-
  TASK-7.45: Decide position-aware scaling for observed open-raise and calling
  ranges
type: other
created_date: '2026-11-27T21:29:00Z'
updated_date: '2026-11-27T21:29:00Z'
---
# TASK-7.45: Decide position-aware scaling for observed open-raise and calling ranges

Status: In Progress (orchestrator sets Done) · Completed: 2026-11-27 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-035 (035.2, 035.6), REQ-046.1, REQ-029.2 · Branch: doit/TASK-7.45

## What was asked
A decision spike (follow-up from TASK-7.29 Q-4 a). After TASK-7.43/7.44, three-bet and four-bet lines scale by PFR relative to a typical player, but open-raise still scales toward raw PFR and calling lines (limp, call-raise, call-three-bet) toward raw VPIP. That ignores position: every open-raise seat converges on the same PFR, every calling seat on the same VPIP. The task asked for options with measured widths for typical, loose and tight players at each table size, and for the user's decision to be recorded, with any change becoming a follow-up story with re-pinned expectations. Spec: doit/TASK-7.45/spec.md. No product code was to change.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create ... -s accepted`; evidence tables live in the task notes and spec, not the decision body. | yes | The CLI has no body option; decision-1 to decision-7 did the same; hand-editing is forbidden. | Add detail via CLI if it gains a body option. |
| A-2 | `dreams/limit-holdem-trainer/rtm.md` is not edited. | yes | TASK-7.29 and TASK-3.24 reworded REQs without touching it. | Refresh the matrix separately. |
| A-3 | Next changelog row is 1.18, dated the build day (2026-11-27). | yes | Last row was 1.17. | n/a |
| A-4 | Typical VPIP = midpoint of the healthy VPIP band per size in `src/stats/healthy-ranges.json`: heads-up 77.5, 6-max 24, full ring 16.5. Planned as a copied `TYPICAL_VPIP` constant in `src/advice/ranges.ts` with a drift test, like `TYPICAL_PFR`. | yes | Same source as typical PFR; advice may not import `src/stats`. | Pick another reference in TASK-7.48. |
| A-5 | Figures come from the project's own functions on this branch (`DEFAULT_RANGES`, `scaledWidthPct`, `relativePfrPct`, `resizeRange`, `estimateOpponentRanges`, ...), at n = 100 hands; probe scripts were in the scratchpad and are not committed. | yes | Measured, not estimated. | Re-run in TASK-7.48. |
| A-6 | Profiles measured: the size's typical player, 22/18, 40/30, 60/45, 12/9, loose-passive 55/6 (and heads-up 85/65). | yes | Covers typical, loose, tight and the calling-station case. | n/a |

## Clarifications and decisions
- **Q-1 (user answered D, recommended):** open-raise o = min(100, d × PFR ÷ typical PFR); limp, call-raise and call-three-bet o = min(100, d × VPIP ÷ typical VPIP). Rejected: A keep raw; B ratio for open-raise only; C ratio for both with calling capped at 2 × default (makes every loose full-ring player look the same on calling lines); a PFR ratio on calling lines (reads a 55/6 station as a rock, 6-max BB call-raise 13.8 vs default 41.48).
- **D-1** the rule above; blend `d + (o − d) × min(n,100) ÷ 100`, 30-hand threshold, resize rule, three-bet/four-bet rule and `check` line unchanged. **D-2** this task records the decision and REQ change; code, constants, docs and test re-pins go to one follow-up. **D-3** typical VPIP per A-4.
- Recorded as **decision-8**.

Key measured numbers (today's rule): a typical 6-max 24/18 player's BTN open goes 34.54 to 18.0 (UTG open 12.22 to 18.0, wider), SB limp 44.65 to 24.0, BB call-raise 41.48 to 24.0. Heads-up typical BTN call-raise 11.76 to 77.5. Under D a typical player keeps the authored ranges. D's 100 cap binds only on the widest blind lines: 6-max SB limp (VPIP 53.8 and up) and BB call-raise (57.9 and up), full-ring SB limp (44.7 and up) and BB call-raise (59.8 and up). The task's "BB call-raise at 60/45" case: 41.48 × 60 ÷ 24 = 103.7, capped at 100. Full option tables are in spec.md §3.

## What was built
Documentation and Backlog records only; no code under src, tests, e2e, tools or docs.
- `dreams/limit-holdem-trainer/requirements.md`: REQ-035.6 reworded to the relative rule (open-raise by PFR ÷ typical PFR, calling lines by VPIP ÷ typical VPIP, each at most 100) and changelog row 1.18 added (3 diff lines). REQ-035.2 untouched.
- Backlog (via CLI): **decision-8**; TASK-7.45 implementation notes with the Q-1 D answer and key numbers; follow-up **TASK-7.48** "Scale observed open-raise and calling ranges by PFR and VPIP relative to a typical player" (7 ACs, depends on TASK-7.45).
- TASK-7.48 scope: add `TYPICAL_VPIP`/drift test, change `OBSERVED_LINE_STAT`, reuse `relativePfrPct`; update `docs/advice/range-model.md`; re-pin these locked tests under their owners: observed-ranges.acceptance AC#2 (TASK-7.13); observed-resize.acceptance AC#1, AC#2, AC#3 PFR-5 case (TASK-7.43); observed-reraise.acceptance AC#4, AC#5 (TASK-7.44); small-table-ranges.acceptance AC#1 (TASK-7.35); the two tests at lines 227 and 269 of tests/ui/review-numbers.acceptance.test.tsx (TASK-9.3); plus unlocked tests including "scales each line by its stat" and "caps the observed hands at 100". Must pass unchanged: observed-ranges AC#5/AC#6, observed-range-tidy AC#1, the PFR 0 / VPIP 0 floor cases.
- Golden spots (width now to under D): 6max-flop-btn-raise-a8s BB call-raise 41.26 to 54.70; 6max-turn-bb-call-a6s BTN open-raise 18.00 to 34.54; 6max-turn-btn-fold-55 CO open-raise 16.71 to 20.39; 6max-river-bb-bet-aks UTG call-three-bet 24.26 to 12.07. a6s needs a re-tune, which needs the user's sign-off (TASK-7.48 AC#6).
- Effect scope: only the user's hint, decision record and review use the snapshot; stored hand grades are unchanged; bots never receive observed stats (REQ-029.2).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 decision recorded | AC#1 | `backlog decision list --plain` | Pass | decision-8, accepted |
| SPEC-02 REQ-035.6 + row 1.18 exact text | AC#1 | `git diff main -- requirements.md` | Pass | 1 changed, 1 added line |
| SPEC-03 no product code; evidence in notes | AC#1 | diff scope + task notes | Pass | gate scope warn only (3 lines, budgeted) |
| SPEC-04 follow-up with re-pinned expectations | AC#1 | `backlog task TASK-7.48` | Pass | 7 ACs, full re-pin list with owners |
| SPEC-05 AC#1 ticked | AC#1 | orchestrator step | Pending at finish | done by orchestrator |

- Gates: 4 runs (build, fix 2-4), all PASS (npm test, lint, typecheck).
- Review r1: code reviewer BLOCKER (below), security none. Review r2: code 2 NITs, security none.
- Judge round 1: PASS (5/5, no failed or unproven items). The judge verified the re-pin list by applying option D to a scratch copy.
- Playtests/e2e: N/A (no product change).

## Review
- **BLOCKER (r1, fixed):** TASK-7.48's locked re-pin list was incomplete. Applying D to a scratch copy showed it also breaks small-table-ranges.acceptance AC#1 (TASK-7.35), two tests in review-numbers.acceptance (TASK-9.3), and the unlocked "caps the observed hands at 100". Fixed by rewriting TASK-7.48's description and AC#5 via the CLI. **Recorded deviation:** the locked spec.md §3/§5 lists stay incomplete (spec §3 wrongly said the relational locked tests survive). TASK-7.48 is the authoritative list.

### Non-blocking review notes
- NIT: TASK-7.48 says e2e/observed-resume.spec.ts "was not run under the new rule". The reviewer ran it under D: 6 passed.
- NIT: tests/golden/postflop-lines.acceptance.test.ts is not named as failing at load under the a6s change; TASK-7.48 AC#6 ("When npm test runs") already covers it.
- Security: nothing found; when TASK-7.48 adds code, keep divisors constant and non-zero and keep the 100 cap.

## How to try it
Nothing to run for users. To inspect: `backlog decision list --plain`, `backlog task TASK-7.48 --plain`, `git diff main -- dreams/limit-holdem-trainer/requirements.md`.

## Run metrics
Questions asked: 1 (Q-1) · assumptions logged: 6 (spec) · review rounds: 2 · judge rounds: 1 · gate runs: 4 · escalations: 0 · sendbacks: 0 · changed lines in product files: 3 (requirements.md only).

## Known limitations and follow-ups
- [trainer] Implement the relative rule, `TYPICAL_VPIP`, docs and re-pins, with the a6s golden re-tune needing user sign-off: owned by TASK-7.48 (already created as part of this task).
- [trainer] When TASK-7.48 re-pins locked tests, also note the two NITs above (observed-resume e2e passes under D; postflop-lines acceptance loads golden spots): owned by TASK-7.48.
- Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- Spec phase for a decision spike that lists "tests the rule would break" claimed relational locked tests survive without running the full suite on a scratch copy; this caused a BLOCKER and an extra review/fix round. Proposal: require the spec to apply the chosen option(s) to a scratch copy and run the whole suite before listing affected locked tests, and to say so in §3.
- The spec was locked while its own list was wrong, so the fix had to live in the follow-up task and leave a recorded deviation. Proposal: allow the orchestrator to amend a locked spec's fact list when a reviewer proves it wrong.
