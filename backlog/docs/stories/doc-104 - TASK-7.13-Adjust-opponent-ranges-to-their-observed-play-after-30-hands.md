---
id: doc-104
title: 'TASK-7.13: Adjust opponent ranges to their observed play after 30 hands'
type: other
created_date: '2026-11-23T19:21:00Z'
updated_date: '2026-11-23T19:21:00Z'
---
# TASK-7.13: Adjust opponent ranges to their observed play after 30 hands

Status: Done · Completed: 2026-11-23 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-035 (035.2, 035.3, 035.4, 035.6), REQ-029.2, REQ-036, REQ-037 · Branch: doit/TASK-7.13

## What was asked
Once the trainer has watched an opponent for 30 or more hands, the advice engine should rebuild that opponent's preflop starting range from what they actually did (VPIP and PFR), not from the typical-player chart. Each postflop recommendation must say, per opponent, whether it used a 'typical player' or 'based on N hands of this opponent'. When any range is based on observed habits, the explanation must name and define "opponent type". Bots must never receive this information (REQ-029.2). Spec: doit/TASK-7.13/spec.md.

Nothing supplies the stats yet. The engine accepts an optional snapshot, and wiring it to the session and the screen belongs to TASK-8.1, TASK-9.3 and TASK-3.12.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Strongest width %" is the shortest prefix of the hand order whose combo count reaches width/100 x 1326 (tolerance 1e-9), at least AA. Width >= 100 gives all 169 classes. | yes | Deterministic, never narrower than asked, AA at width 0 | Nearest prefix, or exact combo trimming |
| A-2 | The default width d is the default range's combos / 1326 x 100, counted before dead cards are removed. | yes | A property of the authored range, not of the deal | Count after dead cards |
| A-3 | The BB `check` line, non-six-max tables and `'unseen'` mode are never scaled; their basis stays 'typical player'. | yes | REQ-035.6 names only raising and calling ranges | Scale check by VPIP |
| A-4 | Snapshot entries for the hero, folded seats or absent seats are ignored; a live opponent with no entry or under 30 hands is a typical player. | yes | The snapshot is per session, not per hand | Throw on extra seats |
| A-5 | The basis is decided before the dead-card "fully blocked" and equity fallbacks, which don't change it. | yes | Fallbacks are rare and don't change the opponent model | Report 'typical player' on fallback |
| A-6 | Hand-order ties (same one-decimal equity) break by `HAND_CLASSES` grid order. | yes | Deterministic and documented | Suited before offsuit |
| A-7 | An invalid snapshot throws `RangeError`. PFR above VPIP is not rejected. | yes | Matches other engine inputs in ranges.ts | Clamp silently |
| A-8 | When scaled, the start range is wholly the strongest-width prefix, even when o = d. | yes | The task's literal rule | Resize the authored range |

## Clarifications and decisions
Overnight autopilot run: all questions were auto-accepted at the recommended option under the user's unattended rule.
- Q-1 / D-1 (hand order): the 169 classes are ranked by preflop all-in equity against one random hand, using the project's own seeded `computeEquity`. The order is stored in `src/advice/ranges/hand-order.json` with a justification of 50 words or more, and validated on load. Ties follow grid order.
- Q-2 / D-2 (interface): optional `observedOpponents` snapshot (seat, hands, VPIP %, PFR %), used only for action ranges. `estimateOpponentRanges(view, observed?)` returns `basis` and `widthPct`. `PostflopRecommendation.opponentBasis` is new. `adviceOptions` is unchanged, so bots never receive the snapshot.
- Q-3 / D-3 (wording): a lead clause on the first sentence, "Ranges here follow the opponent type, {def:opponent-type}, of each player you have watched for 30 or more hands; ...". It appears only when at least one range is scaled and keeps the explanation within 3 sentences. This is user-visible copy to review.
- Q-4 / D-4: locked re-pin of postflop.acceptance AC#1 (adds `opponentBasis` for seats 1, 2, 6; count unchanged).
- Block 1: three locked tests contradicted the spec. (a) value-bet AC#9 key list adds `opponentBasis`. (b) preflop AC#6 sandbox list adds hand-order.json. (c) range-model AC#8 expects `estimateOpponentRanges(view, 'Maniac')` to be a type error. Recorded spec amendment: a non-array `observed` argument is ignored, and no locked edit was made. (a) and (b) were orchestrator edits with the counts kept and no assertion loosened.

## What was built
Data flow: the snapshot goes into `recommendPostflop({observedOpponents})`, which in actions mode passes it to `estimateOpponentRanges(view, observed)`. For each live opponent with 30 or more hands, the width is `d + (o - d) x min(n, 100) / 100`. Here o is PFR for raising lines (open-raise, three-bet, four-bet) and VPIP for limp, call-raise and call-three-bet. The start range becomes the strongest width % of the hand order, never smaller than AA. The basis is returned per opponent, in seat order, as `opponentBasis`, and the explanation gains the opponent-type lead clause.

- `src/advice/ranges/hand-order.json` — new authored hand order with justification (generated once by a deleted script; the unit test recomputes it).
- `src/advice/ranges.ts` — hand-order loader and validation, `ObservedOpponent`, `OpponentBasis`, `rangeWidthPct`, `scaledWidthPct`, `strongestClasses`, snapshot validation and scaling, `basis` and `widthPct`.
- `src/advice/postflop.ts` — `observedOpponents` option and `opponentBasis`.
- `src/advice/explanations.ts` — authored basis texts, the lead clause, `basisText` and `OBSERVED_MIN_HANDS` (placed here to break an import cycle between ranges.ts and explain.ts).
- `src/advice/explain.ts` — lead clause in `explainPostflop`, re-exports `basisText`.
- Docs: `docs/advice/range-model.md` (formula, hand order, AA floor, basis, known limits), `explanations.md`, `postflop-rules.md`.
- Tests: `tests/advice/observed-ranges.acceptance.test.ts` (AC#1-7), `observed-ranges.test.ts` (unit SPEC-08..10), `explain.test.ts`, plus the three locked re-pins above.
- No new dependencies. Defaults unchanged: with no snapshot, behaviour is byte-identical to before.

Hand-order extremes (equity vs one random hand): AA 85.5, KK 82.4, QQ 79.7 at the top; 62o 33.9, 42o 33.4, 32o 32.1 at the bottom.

```ts
recommendPostflop(view, { observedOpponents: [{ seat: 4, hands: 45, vpip: 38, pfr: 12 }] })
// opponentBasis: [{seat:4, hands:45, text:'based on 45 hands of this opponent'}, {seat:6, hands:null, text:'typical player'}]
```

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Under 30 hands uses default range and typical basis | AC#1 plus holdout | PASS | start equals no-snapshot result; 29 vs 30 boundary |
| SPEC-02 | Different stats give different ranges at the formula width | AC#2, hand-computed width pin | PASS | PFR for raiser, VPIP for caller |
| SPEC-03/04 | Postflop basis, single and multiway | AC#3, AC#4 | PASS | per-opponent, seat order, mixed basis |
| SPEC-05/06 | Formula values; zero width floors at AA | AC#5, AC#6, n>100 cap tests | PASS | scaledWidthPct(20,60,250)=60 |
| SPEC-07 | Explanation names and defines opponent type | AC#7 | PASS | 3 sentences or fewer |
| SPEC-08 | Hand order authored, valid, reproducible | unit test | PASS | AA, KK, AKs, AKo, T9s, 72o, 32o recomputed; judge recomputed all 169 |
| SPEC-09 | Invalid snapshots rejected | unit test | PASS | exact RangeError messages |
| SPEC-10 | Bots and unseen mode never use observed stats | unit test | PASS | adviceOptions whitelist |
| SPEC-11 | Playtest unchanged | `playtest --hands 10000 --seed 42` | PASS | SHA-256 1eb65ef2...a238a5, 0 invariant violations |
| SPEC-12/13 | Repo checks, coverage, docs | npm test, lint, typecheck | PASS | 970 passed, 0 failed, 41 skipped (opt-in slow tests) |
| SPEC-14 | CI and N/A items | CI run 45246047077 on head 056065c | PASS | all jobs success; Visual 45246047220 success |

- Judge round 1 failed only SPEC-14. A GitHub billing hold (failed payment or spending limit) kept every CI job from starting, and the fix commit 056065c was not yet pushed. No code defect was found. After the hold was resolved, 056065c was pushed and CI run 45246047077 was green. Judge round 2 passed all 14 items.
- The judge also ran holdout checks (8,723 assertions, 0 failures), confirmed the typical path is byte-identical to the base commit across 123 spots, and ran mutation checks (removing the cap, using VPIP for open-raise, a threshold of >30, dropping the AA floor, scaling the check line). Each mutation made a test fail.

## Review
- Round 1 (code): two MAJORs, both test strength. `rangeWidthPct` was only checked against itself, and the min(n,100) cap had no test that could fail. Both were fixed with a hand-computed (6+4+12)/1326 value, a typical UTG open-raise width counted in the test on a view with dead cards, `scaledWidthPct(20,60,250)`, and an estimate at 150 hands. Orchestrator MINORs were also fixed: stat choice per line (all six lines now tested), the ranges/explain import cycle (broken via explanations.ts), and a known-limits note in docs and hand-order.json.
- Round 2: no blocking findings from code or security.
- Security: snapshot values are validated, the snapshot is stored in a Map (no prototype pollution), bots are shielded by the `adviceOptions` whitelist, and no hidden information is involved.

### Non-blocking review notes (deliberately not fixed)
- Security MINOR `non-object-snapshot-entry-typeerror` (ranges.ts:572): a null or undefined snapshot entry throws TypeError, not the documented RangeError, and a non-integer seat is silently ignored. It has no reachable path today and fails closed.
- Code MINOR `basis-text-reimplements-fill-template` (explanations.ts:100): `basisText` uses `String.replace('{hands}', ...)` instead of `fillTemplate`, so a second placeholder or a `{def:...}` would be silently left unfilled. It is acceptable because it keeps the import cycle broken.
- Code NIT `re-export-only-for-tests` (explain.ts:17): `basisText` is re-exported from explain.ts only for explain.test.ts. `OBSERVED_MIN_HANDS` also lives in the authored-text module and is re-exported from ranges.ts.
- Judge LOW J-2-01 (also J-1-02): a zero scaled width can be reported as about 3.55e-15 instead of 0, because of floating point in `d + (o - d) x 100 / 100`. The range is still exactly AA.

## How to try it
- `npm test`, or `npx vitest run tests/advice/observed-ranges.acceptance.test.ts tests/advice/observed-ranges.test.ts`
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` should give 1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5.
- In a scratch script, call `recommend(view, {observedOpponents: [...]})` on a multiway flop view and print `opponentBasis` and `explanation`.

## Run metrics
Questions asked 4 (plus one block with 3 sub-items), all auto-accepted · assumptions logged 8 · review rounds 2 (findings 2, then 0) · judge rounds 2 (FAIL on SPEC-14 only, then PASS) · gate runs 4 (fix-3 failed only because tool binaries were missing; fix-4 passed) · escalations 0 · changed lines 1069 over 14 files (budget 900 lines and 13 files, so over budget but under the fail limit of 1800) · 46 files changed in total including doit bookkeeping.

## Known limitations and follow-ups
- [trainer] Add an object/null check and a 1..6 integer seat check to snapshot validation (ranges.ts `observedBySeat`), and validate the snapshot in `AdviceRequest` if it ever crosses the worker boundary. Owner: whichever of TASK-8.1 / TASK-9.3 / TASK-3.12 first builds the snapshot. Pin it with a test of a null entry expecting RangeError.
- [trainer] Make a zero scaled width exactly 0 (use a weight `w = min(n,100)/100` and `d*(1-w) + o*w`). Pin it with a test of CO open-raise, PFR 0, 100 hands giving `widthPct === 0`. Owner: a small fix in the TASK-7 epic.
- [trainer] Have `basisText` reuse `fillTemplate`, and import it from explanations in explain.test.ts so the explain.ts re-export can go. Low priority cleanup.
- [trainer] TASK-7.29 (already created): decide the hand order and re-raise scaling. The equity-vs-random order puts Q2o above 76s and undervalues suited connectors, and PFR scaling can widen re-raise ranges. Both are documented as known limits in range-model.md and hand-order.json.
- [trainer] Wiring is out of scope here. TASK-8.1 (hint), TASK-9.3 (review) and TASK-3.12 (decision record) must build the snapshot from `styleStats` and display `opponentBasis`. TASK-8.1 AC#3 owns the 'typical player' basis for preflop advice.
- Not tracked (infra, below the value bar): the GitHub billing hold that stopped CI in judge round 1. It was external and is resolved, so there is nothing to change in the repo.

## Lessons for the factory (proposals — not applied)
- The spec's locked-test scan missed three existing locked tests (value-bet AC#9 exact key list, preflop AC#6 sandbox file list, range-model AC#8 type error) and the build blocked once. Proposal: in the spec stage, grep locked tests for exact key lists, file lists and `@ts-expect-error` on any function whose signature or return shape changes, and list the re-pins up front.
- The first build had to run in a worktree without node_modules. Gate fix-3 failed with "vitest: command not found" and cost a gate run. Proposal: the gate should check for node_modules first and report that as an environment problem.
- Stale gitignored sync-conflict copies (`spec-items 2.json`, `state 2.json`) made `npm run lint` fail until they were moved. Proposal: have doit clean `* 2.*` conflict copies in doit/ at stage start. This did cause a real lint failure.
- The judge round was wasted on a billing hold (SPEC-14), and the fix commit had not been pushed. Proposal: the orchestrator should push each fix commit before the judge stage, and detect "jobs not started" CI failures so they aren't scored as a code failure.
- Both review MAJORs were tests that used the implementation as its own oracle. Proposal: add a spec-template rule that each numeric AC value must be pinned to a number computed independently in the test, and that each cap or threshold in the edge-case list needs a test on the far side of the boundary.
