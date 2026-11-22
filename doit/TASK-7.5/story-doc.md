# TASK-7.5: Estimate each opponent's range from their actions in the hand

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-035.1, REQ-035.3, REQ-035.5, REQ-061.2 · Branch: doit/TASK-7.5

Judge: see doit/TASK-7.5/judge/ (this doc was written before the judge ran).

## What was asked
Postflop advice treated every live opponent as holding any unseen two cards. This story gives each opponent an authored
6-max starting range (by position and preflop line), narrows it street by street with the Strong/Pair/Draw/Air rule, and
computes the user's hint and review equity against those ranges. The advice engine must not be able to see a bot's style
or parameters (compile error). Spec: doit/TASK-7.5/spec.md. Observed-stat scaling (TASK-7.13), the basis label
(hint/review stories) and heads-up/full-ring ranges (TASK-7.6) are out of scope.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 (A) | **Only the user's hint and review use action ranges.** Bots and default `recommend(view)` stay on every-unseen-combo; playtest SHA 442dbf55…08fbc unchanged; no locked-test edits | yes | Switching bots would break locked tests (see Follow-ups) | Pass `ACTION_RANGE_ADVICE` from bots; re-baseline tests (needs user approval) |
| Q-2 | 36 original 6-max ranges, 7 lines, with width bands (% of 1,326 combos): open-raise UTG 10-18, HJ 12-22, CO 16-28, BTN 22-40, SB 18-35, BB 8-20; limp UTG/HJ/CO 5-22, BTN 5-30, SB 20-60; check (BB) 60-95; call-raise UTG-BTN 6-25, SB 8-30, BB 25-60; 3-bet 3-12; call-3-bet 5-25; 4-bet 1.5-6 | yes | Models a typical low-stakes player; validator enforces bands and justification lengths | Edit `six-max.json` |
| Q-3 | Narrowing: Strong = two pair+ strictly above the board's own category; Pair = pocket pair or hole card matching board rank; Draw needs a hole card in the 4-flush/4-run (A234, JQKA not open-ended); one narrowing per street by the most aggressive action (raise > bet > call > check) | yes | Check-raise should read as strong, not "draws only" | Change classifier/aggregation in `ranges.ts` |
| A-1 | Code in `src/advice/ranges.ts`, data in `ranges/six-max.json`, doc in `docs/advice/range-model.md` (separate from `postflop-rules.md` so the locked rules-consistency test is not affected) | yes | Mirrors chart layout | Move files |
| A-2 | Combos expanded from classes minus hero cards and board; earlier showdown cards not dead | yes | Matches `unseenCombos` | — |
| A-3 | Non-6-player tables have no authored ranges: opponents start from every unseen combo, postflop narrowing still applies | yes | Heads-up/full-ring is TASK-7.6; locked grade AC#7 uses a heads-up flop | Add ranges in 7.6 |
| A-4 | Preflop line = last voluntary preflop action keyed by number of raises before it; blind-only all-in keyed as a call | yes | Finite and total | Key by full sequence |
| A-5 | If a street's narrowing would empty a range, skip it and keep the previous range | yes | `computeEquity` throws on empty | Reset to default |
| A-6 | On equity `RangeError` in actions mode: retry with un-narrowed starting ranges, then every unseen combo | yes | Hints must not crash on rare multiway conflicts | Throw |
| A-7 | No observed-stats input; every opponent is "typical" | yes | TASK-7.13 owns it | Add input there |
| A-8 | Perf scenarios follow `postflop.perf.test.ts` (20x slack locally, not enforced when CI=true) | yes | Precedent | — |

Spec-text deviations (D-4): `ACTION_RANGE_ADVICE` is typed as `PostflopOptions` (not `RecommendOptions`), and the
type-ban guard is `ExactOptions<O, Allowed>` as `O & Allowed & {extra keys: never}` with `O extends object` rather than
the form first written in the spec (changed in review round 1, below). Also D-1/D-5: no new field on recommendations
(locked 7.3 `toStrictEqual` pins the key set).

## Clarifications and decisions
Q-1, Q-2, Q-3 were auto-accepted (autopilot) as recommended; see `doit/TASK-7.5/qa.md`. D-2: ranges authored, not
derived from the TAG chart (that would model every opponent as the TAG bot). D-3: classification and aggregation rules.

## What was built
- `src/advice/ranges.ts` — line taxonomy, default-range validator, hand-class notation, combo expansion, classifier,
  `narrow` step, `estimateOpponentRanges(view)` (takes only a `PlayerView`); `unseenCombos` moved here.
- `src/advice/ranges/six-max.json` — 36 ranges, each with a justification.
- `src/advice/postflop.ts` — `opponentRanges: 'unseen' | 'actions'` (default `'unseen'`) and the fallback chain.
- `src/advice/recommend.ts`, `grade.ts` — generic `ExactOptions` guard, `adviceOptions`, `ACTION_RANGE_ADVICE`.
- Bots (`tag`, `calling-station`, `maniac`, `rock`) call `recommend(view, adviceOptions(options))`, which copies only
  `equity`, `chart`, `opponentRanges`.
- `src/table/advice-service.ts` (recommend/grade), `src/table/review.ts` (`userReviewEntries`), `Table.tsx` use action ranges.
- `docs/advice/range-model.md` (new; part of the product: inputs, lines, file format, notation, narrowing rule,
  worked fixture board `Ks 8d 7c`, safety rules) and `docs/advice/postflop-rules.md` (updated, links it).
- Tests: `range-model.acceptance.test.ts` (AC#1-9, locked), `ranges.test.ts`, `postflop-ranges.test.ts`, perf
  scenarios in `postflop.perf.test.ts`, updated `advice-service.test.ts` and `review.test.ts`.
No new dependencies. 36 files, about 2,196 changed lines.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..09 | AC#1-9 (ranges present and justified, exact CO range, bet/check/call/raise narrowing, re-classification per street, style-independence, type ban, user advice and docs) | `tests/advice/range-model.acceptance.test.ts` (55 asserts) | Pass | gates/fix-3.json |
| SPEC-10, 11 | Notation, classifier edge cases, range content sanity | `ranges.test.ts` (79 asserts) | Pass | gates/fix-3.json |
| SPEC-12, 13 | Totality/determinism, fallbacks, defaults unchanged | `postflop-ranges.test.ts` (31 asserts) | Pass | gates/fix-3.json |
| SPEC-14 | Latency | perf scenarios | Pass | gates/fix-3.json |
| SPEC-15 | Checks, coverage, boundaries | gate | Pass | gates/fix-3.json |
Gate runs: build-1 PASS, fix-2 PASS, fix-3 PASS. All earlier locked tests and the playtest baseline are unchanged
(Q-1). Judge rounds: not yet run (see judge folder).

## Review
Round 1 (code + security): one MAJOR. The exact-keys guard did not reject an options variable carrying only bot keys
(e.g. `{ style: 'Rock' }`), because the all-optional weak type let inference fall back. This bypassed the REQ-035.3
type ban for `recommend`, `recommendPostflop` and `gradeView`. Fixed by making `ExactOptions` intersect `Allowed` and
constraining `O extends object`; tests with `@ts-expect-error` cases were added. Round 2: 0 findings from both reviewers;
security noted no runtime change.

### Non-blocking review notes (deliberately not fixed)
None recorded: round 1 had only the one MAJOR, round 2 had no findings.

## How to try it
- `npm test` (includes the new advice tests); `npx vitest run tests/advice/range-model.acceptance.test.ts`.
- Read `docs/advice/range-model.md`; ask for a hint at a postflop spot in the app (uses action ranges).

## Run metrics
Questions 3 (all auto-accepted) · assumptions 8 + 3 plan-level · review rounds 2 · judge rounds 0 so far · gate runs 3 ·
escalations 0 · changed lines ~2,196.

## Known limitations and follow-ups
1. [trainer] Switch bots to action ranges (REQ-029.2): pass `ACTION_RANGE_ADVICE` from bots. Measured impact on locked
   tests: TASK-7.3 postflop AC#1 (1,081-combo assertion) and TASK-6.3 calling-station Example B break; TASK-9.1 review
   grades likely move. Needs user approval for those re-baselines and a new playtest SHA. Owner: new task.
2. [trainer] Heads-up and full-ring default ranges: owned by TASK-7.6 (currently fall back to every unseen combo, A-3).
3. [trainer] Observed-stat scaling after 30 hands (REQ-035.2/035.6): owned by TASK-7.13.
4. REQ-035.4 basis label ("estimated from actions") is for the hint/review stories (TASK-8.1 and review stories).

## Lessons for the factory (proposals — not applied)
- The spec's guard type (`ExactOptions`) was written as a literal form that had a hole (weak-type fallback); the review
  caught it. Proposal: when a spec requires a compile-time ban, include the "variable, not just literal" cases as
  `@ts-expect-error` examples in the acceptance test from the start.
