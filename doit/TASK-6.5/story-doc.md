# TASK-6.5: Face a Rock that folds every hand outside a narrow starting range

Status: Done · Completed: 2026-11-21 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-026 (026.2, 026.3), REQ-061 (061.2); band context REQ-027.4, REQ-027.6 · Branch: doit/TASK-6.5

## What was asked
Add the Rock (very tight) bot. Its style data file holds a narrower preflop starting range for each position and situation of the 6-max chart, with a justification per range and a plain-English description. The style validator checks each Rock range is a narrower subset of the TAG chart. Facing a bet preflop with a hand outside its range, the Rock folds. In the big blind with no raise to face it checks. Removing a class from the file makes the Rock fold it, with no code change. Spec: doit/TASK-6.5/spec.md.

## Assumptions made without asking — please review
All four questions were auto-accepted (recommended option) in the autopilot run; see qa.md.

| ID | Assumption / decision | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 / D-1 | Format: style file stays `tlh-bot-style` v1, with an optional top-level `startingRange`. Required only for Rock. Validated against the TAG chart, passed as a third argument to `parseStyle` (D-5). | yes | Additive, compact, reads like a range; existing style files stay valid | Move to v2 or a grid format |
| Q-2 / D-2 | Rock ranges (counts below). Measured VPIP ~10.5%, PFR ~9.2% for one Rock among TAG. | yes | Inside REQ-027.4 (VPIP 8–15, PFR 6–12) with margin | Edit `rock.json` |
| Q-3 / D-3 | In range: play the advice move, with no mixing and no randomness. Out of range preflop: fold when owed, check when not. Postflop: advice with the free-check shortcut. | yes | REQ-026.2 defines the Rock by its range alone | Add mixing or deviations to the file and `rock.ts` |
| Q-4 / D-4 | Worker `decideBotDefault` routes `'Rock'` to `decideRock`. The old `'Rock'` → TAG unit assertion was replaced. | yes | Matches TASK-6.3/6.4 | Remove the dispatch line |
| A-1 | "Facing a bet" means owed > 0, so the blinds count as the opening bet. | yes | The engine then offers fold | Narrow the definition |
| A-2 | "Non-fold cell" means `cell.action !== 'fold'`. | yes | The main action is what the advice recommends | Count alternatives |
| A-3 | `decideRock` draws no randomness and ignores the seed. | yes | No mixing, so pure function of the view | Accept a generator |
| A-4 | `decideRock` takes an optional `style` (default `ROCK_STYLE`). A style with no range makes it throw a `RangeError`. | yes | Same seam as TASK-6.3/6.4. AC#5 test needs no code change | n/a |
| A-5 | `startingRange` is allowed in any style file. Only Rock requires it. | yes | Additive | Reject outside Rock |
| A-6 | Tests use one collection: `runPlaytest({hands: 1000, seed: 65, size: 6})` with random-move seats. Seat 1 records 1,464 preflop views covering all 26 spots. Each hand class is substituted into each recorded view. | yes | Fast (about 0.1 s) and complete | Natural deals only |
| A-7 | The seated invariant run in the normal suite is 1,000 hands, Rocks at seats 2 and 4. | yes | About 0.1 s | Gate a longer run behind `TLH_SLOW_TESTS` |

## Clarifications and decisions
Q-1..Q-4 and their auto-accepted answers are in the table above. D-5 (`parseStyle(raw, fileName, chart = SIX_MAX_CHART)`, no import cycle) and D-6 (`startingRange` is a `readonly RangeSpot[]` in `APPLICABLE_SPOTS` order, or `null`) were not material.

## What was built
- `src/bots/style.ts`: `RangeSpot`, `BotStyleData.startingRange`, `parseStyle`'s third `chart` parameter, `parseStartingRange` and `startingRangeFor(style, position, situation)`.
- `src/bots/styles/rock.json` (new): description, `mixedSpots: []`, `deviations: []` and the 26 ranges with justifications.
- `src/bots/rock.ts` (new): `ROCK_STYLE` (validated at import), `RockOptions`, `decideRock(view, options?)`.
- `src/table/advice-service.ts`: worker dispatch of `'Rock'`.

### `startingRange` format and validation
`"startingRange": [{ "position", "situation", "hands": "AA AKs AKo", "justification": "..." }]`. `hands` is whitespace-separated hand-class names in `HAND_CLASSES` spelling. Rules, all collected into one `StyleValidationError`:
- The list must cover exactly the 26 `APPLICABLE_SPOTS['6-max']` spots, once each. Unknown, repeated and missing spots are reported.
- Classes must be known and not repeated. Justification must have at least 10 words. An empty `hands` string is valid.
- Every class must be a non-fold cell of the TAG chart for that spot.
- Each spot must have fewer classes than the TAG chart's non-fold count. Each position's union must also be smaller than TAG's union.
- A `Rock` file without `startingRange` fails. Other style files get `startingRange === null`. `tag.json`, `calling-station.json` and `maniac.json` are unchanged.
- Example: adding `72o` to UTG unopened gives exactly `rock.json: style Rock starting range UTG unopened has 72o, which the TAG chart folds`.

### The Rock
Description (from `rock.json`): it plays only a small set of strong starting hands and folds everything else before the flop, even many hands TAG would play. When it plays, it follows the trainer's own advice, so its raises usually mean a big pair or a strong ace. It checks its big blind when that is free. Steal its blinds often, and respect its bets and raises.

Rule: preflop, a class outside the range for (`positionOf`, `situationOf`) gives the legal fold when owed > 0 and the legal check when owed is 0. Inside the range it plays `recommend(view).move`. Postflop it plays the plain advice, with the free-check shortcut when owed is 0. It never folds with owed 0 and draws nothing.

Class counts, Rock / TAG non-fold, per spot:

| Situation | UTG | HJ | CO | BTN | SB | BB |
|---|---|---|---|---|---|---|
| unopened | 15/36 | 20/42 | 29/57 | 45/82 | 25/79 | n/a |
| limpers | n/a | 13/37 | 18/42 | 23/45 | 14/42 | 12/169 |
| raise | 7/14 | 8/14 | 10/18 | 12/24 | n/a | n/a |
| raise-and-calls | 7/24 | 8/35 | 11/32 | 14/39 | n/a | n/a |
| re-raise | 5/34 | 5/39 | 6/52 | 7/75 | 5/59 | 6/22 |
| blind-defence | n/a | n/a | n/a | n/a | 12/23 | 41/91 |
| **Per position (union)** | **15/39** | **20/46** | **29/57** | **45/82** | **25/79** | **41/169** |

The class lists and the one-sentence justification for each of the 26 spots are in `src/bots/styles/rock.json` (the `justification` field of each entry). They're not repeated here. The text is original.

Measured by a prototype of the rule (seed 42, 6-max, seeded TAG elsewhere, 10,000 hands; recorded in spec D-2):

| Line-up | VPIP | PFR |
|---|---|---|
| One Rock (seat 2) | 10.5% | 9.2% |
| Two Rocks (seats 2, 4) | 10.4% | 9.0% |
| Six Rocks | 10.9% | 9.9% |
| Mixed (Rock, Maniac, Calling station, TAG; 1,500 hands) | 9.9% | 8.3% |
| Band (REQ-027.4) | 8–15% | 6–12% |

Zero invariant violations in every run. These are prototype numbers from the spec phase. They aren't asserted by a test (that belongs to TASK-6.11 / TASK-6.17).

### Worked examples (pinned in the acceptance test; views from the seed-65 collection)
- A. BTN re-raise, Th Qs (QTo), owed 4. QTo is a TAG non-fold cell but isn't in the Rock's 7 BTN re-raise classes. The Rock folds, TAG calls 4.
- B. BB after limps, Jd Qd (QJs), owed 0. TAG raises to 8, the Rock checks.
- C. UTG unopened, AQo, owed 4. In range, so the Rock plays the advice: raise 8, same as TAG.
- D. BB blind-defence, A2s, owed 4. In range, chart cell `C`: call 4.
- E. A copy of `rock.json` with `AQo` removed from UTG unopened parses cleanly (14 < 36). With it, Example C's view gives a fold. With the shipped style it raises 8.

### Playtest baseline
The default playtest is unchanged: `npm run -s playtest -- --hands 10000 --seed 42 --size 6` still prints `Player actions: 88920`, `Invariant violations: 0`, and stdout SHA-256 `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`. No Rock is seated in any default line-up.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1: file has 26 ranges, justifications, description | acceptance test | pass | `tests/bots/rock.acceptance.test.ts` |
| SPEC-02 | AC#2: subset and narrower, four mutations | acceptance test | pass | same |
| SPEC-03 | AC#3: fold outside range, any replay code | acceptance test, all classes in all 25 owed spots, also via the worker | pass | same |
| SPEC-04 | AC#4: BB check | acceptance test, 157 classes | pass | same |
| SPEC-05 | AC#5: remove a class, Rock folds it | acceptance test; per-class sweep re-parses edited JSON | pass | same |
| SPEC-06 | Worker plays Rock | acceptance test over 1,464 views | pass | same |
| SPEC-07 | Validation rules | unit | pass | `tests/bots/style.test.ts` |
| SPEC-08 | Baseline unchanged, seated Rocks no violations | command (SHA-256) and unit | pass | build-log.md; `tests/bots/rock.test.ts` |
| SPEC-09 | Decision units | unit | pass | `tests/bots/rock.test.ts` |
| SPEC-10 | Worker dispatch | unit | pass | `tests/table/advice-service.test.ts` |
| SPEC-11 | lint, typecheck, test, boundary, coverage | gates | pass | `gates/build-1.json`, `fix-2.json`, `fix-3.json` |

- Build log: `npm test` 161 files passed / 1 skipped, 568 tests passed / 8 skipped. Coverage: all files 97.05%, bots 99.59%. Lint and typecheck clean. `npm run e2e` 130 passed, 12 skipped. The whole new test set runs in under 1 s. The locked acceptance file has 74 assertions.
- Gates: build-1, fix-2 and fix-3 all PASS. The only warning is the line budget (1,033 changed lines against 950; about 166 are prettier's one-key-per-line `rock.json`, and about 434 the acceptance file).
- CI on the branch: not in the artifacts I read; the judge should confirm.
- Judge: see doit/TASK-6.5/judge/.

## Review
Round 1: no blocking findings. The MINOR and the code NIT were fixed in the story (fix r1, gates fix-2 and fix-3).

### Non-blocking review notes (deliberately not fixed)
- Security NIT (`src/bots/style.ts` echo): `echo()` on an object-valued position or situation makes `String(value)` throw a raw `TypeError` instead of a `StyleValidationError`. Import still fails closed. Style files are bundled, authored data, so no untrusted path reaches it. Not tracked.
- Fixed in-story: MINOR (SPEC-05 sweep bypassed `parseStyle`; it now edits a JSON copy and re-parses) and NIT (the free-check shortcut wasn't observable; the test now passes an `equity` that throws).

## How to try it
- `npx vitest run tests/bots/rock.acceptance.test.ts tests/bots/rock.test.ts tests/bots/style.test.ts`
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` (expect the SHA above)
- `npm run lint && npm run typecheck && npm test`

## Run metrics
Questions: 4 (all auto-accepted) · assumptions in the spec: 7 · review rounds: 1 · judge rounds: pending (judge runs after this doc) · gate runs: 3 · escalations: 0 · changed lines: 1,033 (budget 950, warn).

## Known limitations and follow-ups
- Rock postflop aggression is 0% until value betting lands (TASK-7.8). Postflop advice is only fold/check/call, so REQ-027.4's 35–55% band can't be met yet. Already tracked via TASK-6.11 / TASK-6.17. [trainer]
- The Rock's VPIP/PFR margin shrinks against a Maniac (mixed line-up: 9.9% / 8.3%, about 2 points above the 8% / 6% floors). Re-measure with the 100,000-hand Mixed line-up in TASK-6.11. [trainer]
- Heads-up and full-ring Rock ranges are not done, because only the 6-max chart exists. The task note defers them to the E07-S05 charts.
- Seating Rocks in presets and `--lineup` is TASK-6.6.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The change ran 1,033 lines against a 950 budget. About 166 are prettier's one-key-per-line JSON and about 434 are the acceptance file. Proposal: have the scope budget count generated or formatted data files at a discount, or have the spec size the budget with formatted data in mind.
