# TASK-7.41: Split the full-ring re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised

Status: ready for Done (orchestrator sets it) · Completed: 2026-11-28 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: dreams/limit-holdem-trainer/requirements.md (no REQ ids listed in the task) · Branch: doit/TASK-7.41

## What was asked
Follow-up to TASK-7.21 and the 6-max story TASK-7.40. At 8–10 seats, a hand with two or more preflop raises must read one of two spots: "your raise was re-raised" (`re-raise`) when the viewer raised and a later raise faces them, or "re-raised when I had not raised" (`re-raise-not-mine`) otherwise. The full-ring chart grows from 41 to 50 spots (+9 new grids; the 9 existing `re-raise` grids are re-justified). Acceptance criteria: (1) routing, (2) 50 spots with 169 classes each, agreeing text, and an own-raise share the user approves, (3) new wording approved by the user, (4) golden spots cover each situation, (5) the user signs off the 18 spots, (6) a capped fourth bet turns a raise cell into a call. Spec: doit/TASK-7.41/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Rock is not changed. At 8–10 seats it now reads its 6-max `re-raise-not-mine` range (AA KK QQ AKs AKo) for cold spots instead of `re-raise` (CO, BTN, BB also had JJ; BTN also AQs). | yes | `src/bots/rock.ts:34` uses `situationOf` at the view's size, so the split reaches Rock automatically (as TASK-7.40 A-3 foresaw). Shown in the sign-off package. | Force `re-raise` for Rock at full ring (needs code) |
| A-2 | TAG gets no mixing for full-ring `re-raise-not-mine`. | yes | `tag.json` has no re-raise mix either; same as TASK-7.40 A-4. | Add a mix |
| A-3 | 3 golden spots appended: `fr-co-re-raise-not-mine-ajs` (fold), `fr-bb-re-raise-not-mine-99` (call), `fr-btn-re-raise-not-mine-aa` (raise). Existing 8 full-ring `re-raise` goldens stay byte-identical. | yes | AC#4; locked coverage test needs at least 1 per size and situation. | 1 spot only |
| A-4 | 9-max before/after figures come from the opt-in `size-ranges-playtest` slow test, run on the base commit and the final chart. Informative only (the test logs, does not assert). | yes | Full-ring twin of TASK-7.40 AC#8. | Add a new slow test |
| A-5 | Not-mine justifications say a fourth bet without our own raise lands here and a `raise` then becomes a call; no six-max text is copied. | yes | Same as 6-max rule; enforced by `reference-charts.test.ts`. | — |

## Clarifications and decisions
- Q-1 (own-raise continue share): recommended taken — keep 80–90% of the seat's opening range, nothing outside it; BB keeps at least 80% of the hands it raised, within blind defence.
- Q-2 (rule for the 9 new grids): recommended taken — continue only with hands that continue against one raise; premium-only raises (AA/KK/QQ, AK); width 2–8% UTG..SB, 4–16% BB; strictly fewer combos than the one-raise spot.
- Q-3 (sign-off scope): recommended taken — one review from signoff.md for the 18 re-raise spots before code review; TASK-7.38 narrowed by note to the other 32 full-ring spots plus heads-up; locked-test re-pins and the D-7 seeded-example rule pre-approved.
- Q-4: existing `re-raise` label and context sentence kept word for word.
- Chart sign-off (AC#5): user signed off the 18 spots on 2026-11-28.
- D-1 existing `situationOf` rule, no code change beyond the spot list; D-2 full-ring order 8+8+7+7+9+9+2 = 50, new spots appended after `re-raise`; D-3 label and context strings reuse TASK-7.40 wording.
- Deviation: SPEC-06 said the big blind "calls 4"; the BB has 4 in and faces a fourth bet to 16, so the legal call adds 12 (`src/engine/hand.ts:413`). The test asserts `{ seat: 3, type: 'call', amount: 12 }`. The spec number was wrong; the behaviour is correct.

## What was built
- `src/advice/preflop-chart.ts`: one line, the 9 `re-raise-not-mine` spots added to `APPLICABLE_SPOTS['full-ring']` (41 to 50). Routing needed no change.
- `src/advice/charts/full-ring.json` (data):
  - 9 new `re-raise-not-mine` grids and justifications, widths 3.0–5.4% (UTG..SB) and 6.6% (BB), each a strict subset of its one-raise parent; no dominance inversion.
  - 9 `re-raise` justifications rewritten for own-raise routes, each ending with the capped-fourth-bet sentence.
  - `re-raise` grids trimmed or widened to the Q-1 share (0.825–0.873): outside-open continues removed at UTG+1, MP, LJ, HJ, CO, SB; BTN widened 0.725 to 0.846; UTG and BB unchanged.
  - Chart-level text extended: "...; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them."
- Tests: new `tests/advice/full-ring-re-raise-split.acceptance.test.ts` (SPEC-01..06); bands for 9 new keys in `reference-charts.test.ts` (BTN re-raise band 5–28% to 25–35% because the share needs 29.9% or more); one 9-seat case in `preflop.test.ts`.
- Locked re-pins (expected values only, check counts kept; owners TASK-7.27, 7.6, 7.40, 7.11): `chart-print-sizes` 41 to 50, `table-sizes` 41 to 50 plus new situation, `re-raise-split` AC#6, `preflop-spots.json` +3 spots. Unlock history in the four owners' state.json.
- 9-max all-TAG before/after: VPIP 15.1 to 14.7, PFR 11.3 to 11.2, aggression 63.8 to 65.2, WTSD 38.3 to 37.6, W$SD 50.9 to 52.1 (all in healthy ranges). Rock's full-ring shift is the visible side effect (A-1).
- Heads-up, six-max charts, `preflop.ts`, `explanations.ts` and bots unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance: routes read own or not-mine spot | pass | new acceptance file |
| SPEC-02 | AC#2 | 50 spots, 169 classes each | pass | same |
| SPEC-03 | AC#2 | own shares in approved band | pass | shares 0.825–0.873, BB 118/118 |
| SPEC-04 | AC#2 | not-mine continues only with one-raise continues | pass | same |
| SPEC-05 | AC#3 | approved wording | pass | same |
| SPEC-06 | AC#6 | capped fourth bet turns raise into call (call 12) | pass | same |
| SPEC-07 | AC#4 | golden coverage per size and situation | pass | `preflop.acceptance.test.ts` |
| SPEC-08 | AC#5 | lint, typecheck, npm test, no diff to other charts | pass | gates build-1, fix-2 PASS |
| SPEC-09 | AC#5, AC#2 | orchestrator checks 8 sections and note | pass | signoff.md |
| SPEC-10 | AC#5 | slow playtest and `npm run test:slow` | pass | 27 files, 114 tests |
| SPEC-11 | AC#2 | 18 spots walked against routes and grids | pass | judge round 1 |

- `npm test`: exit 0; 356 files passed / 11 skipped; 1581 tests passed / 60 skipped; coverage 92.84% statements. Lint and typecheck clean.
- Judge round 1: PASS 11/11, integrity PASS, plus 13 extra routes not in the spec (10-seat cold, limp-iso-3bet, SB complete-then-two-raises, own 3-bet facing 4-bet, and others) times 169 classes: 14,453 route checks, 0 failures.
- Gates: build-1 PASS, fix-2 PASS. No judge failures; item_failures all 0.

## Review
No blocking findings. Security review: none (static chart data, one spot-list line, tests with no-shell argv).

### Non-blocking review notes (deliberately not fixed)
- MINOR (J-1-01/J-1-02, LOW): the own-raise capped-fourth-bet sentence is only exercised on one capped route (visible via `chart:print`), so test coverage of that wording is narrow.
- MINOR: golden spot `fr-bb-re-raise-not-mine-99` justification says "one more bet", but on route F19 the BB calls two small bets (8 more on top of the 4 in, facing 12). Test data only; the app does not display golden text.

## How to try it
- `npm run chart:print full-ring` (first line: `full-ring chart: 50 spots`)
- `npm test`
- `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts` and `npm run test:slow`

## Run metrics
Questions asked 4 (Q-1..Q-4, all recommended) · assumptions logged 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 773 (scope budget 750).

## Known limitations and follow-ups
- Rock plays tighter in cold two-raise spots at 8–10 seats (A-1); intended, reversible.
- TASK-7.38 keeps the other 32 full-ring spots and heads-up (already noted on that task).
- No new follow-up tasks needed.

### Not tracked (below the value bar)
- Narrow coverage of the own-raise capped sentence (one route).
- Golden spot wording "one more bet" at fr-bb-re-raise-not-mine-99 (test data, not shown in the app).

## Lessons for the factory (proposals — not applied)
- Spec SPEC-06 stated a call amount of 4 where the engine's legal call is 12; spec authors should derive amounts from `legalActions` rather than from blind sizes. The builder caught it, so no harm.
- The builder hook blocks writes to the work folder, so signoff.md had to be copied by the orchestrator; consider allowing the builder to write signoff.md there.
