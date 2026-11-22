# TASK-6.7: Record an edited line-up as Custom

Status: Done (judge pending) · Completed: 2026-11-22 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-009 (REQ-009.6) · Branch: doit/TASK-6.7

## What was asked
When the player picks a line-up preset (Mixed, Tough, Soft) and then edits a bot's style, the table must be recorded as `Custom`, so results against presets stay apart from results against edited tables. An unedited preset keeps its name; editing a seat and changing it back restores the preset name; the config handed to the table on Start game carries the name and the actual styles. Spec: doit/TASK-6.7/spec.md.

## Assumptions made without asking — please review
No questions were asked. The state.json counter reads 0 assumptions; the five below are in spec §2.
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#1's example ("Mixed at 6 seats, seat 4 Maniac -> Rock") holds only with the user at seat 1. At the default seat 5 the Maniac is seat 2; with the user at seat 4, seat 4 is the user. Tested with the user at seat 1, plus a unit test at seat 5. | yes | TASK-6.6's clockwise placement rule | Reword the AC |
| A-2 | Bot display names are ignored when resolving the name; only styles decide Preset vs Custom. | yes | REQ-009.6 talks about styles only | Treat a renamed bot as Custom |
| A-3 | `lineUpSessionConfig` keeps `gameType`, `stake`, `speed`, `button` from `base`; sets `players`, `userSeat`, `seats`, `lineUp`. The user seat is named `You` (as `DEFAULT_SEATS`). | yes | Game Config already holds the other fields | Pass every field |
| A-4 | `lineUpSessionConfig` throws `RangeError('Button must be a seat at the table')` if `base.button` is not an integer in 1..players. It never clamps. So Game Config must set a valid button for small tables (default button 6 fails at heads-up). | yes | Choosing the button is REQ-010's job; clamping would hide caller bugs | Clamp or move to seat 1 |
| A-5 | Malformed seats throw `RangeError` with the messages below (same style as `seatLineUp`). | yes | Consistency | Return Custom |

## Clarifications and decisions
- D-1: the name is compared only against the chosen preset. Mixed edited to equal the Soft assignment is `Custom`, not Soft. Heads-up Mixed and Tough (both one TAG) keep their chosen name. The `LineUpName` doc comment in `src/table/session.ts` was corrected to say this.
- D-2: both functions live in `src/bots/lineup.ts` with type-only imports from `../table/session`.
- D-3: acceptance tests are in a new file, because `lineup.acceptance.test.ts` (TASK-6.6) is locked.

## What was built
- `src/bots/lineup.ts` -> `resolveLineUpName(preset, seats)`: returns `preset` iff every bot seat's style equals `seatLineUp(preset, n, userSeat)` for that seat; otherwise `'Custom'`. `lineUpSessionConfig(base, preset, seats)`: returns `{ ...base, players, userSeat, lineUp, seats }`; a cash base keeps its stake, a sit-and-go base has no `stake` key. Inputs are not mutated.
- `src/table/session.ts` -> comment fix only.
- Tests: `tests/bots/lineup-name.acceptance.test.ts` (AC#1-4), `tests/bots/lineup.test.ts` (units).

Worked examples (Mixed cycles TAG, Calling station, Maniac, Rock over bots 1..n-1; Soft alternates Calling station/Rock):
- Mixed, 6 seats, user seat 1: seats 2..6 = TAG, CS, Maniac, Rock, TAG. Seat 4 Maniac -> Rock: Custom.
- Mixed, 6 seats, user seat 5 (default): seats 6,1,2,3,4 = TAG, CS, Maniac, Rock, TAG. Seat 2 Maniac -> Rock: Custom.
- Soft, 6 seats, user seat 1: seat 3 Rock -> TAG: Custom; back to Rock: Soft.
- Mixed edited to the Soft pattern: Custom (D-1). Tough at 2 seats resolved with preset Mixed: Mixed.

Errors (all `RangeError`, checked in this order): `Seats must be numbered 1 to the table size in ascending order`; `A line-up must have exactly one user seat`; `Every bot seat must have a style and a name`; from `seatLineUp`: `Table size must be a whole number from 2 to 10`, `Unknown line-up preset: <x>`; builder only: `Button must be a seat at the table`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance test | pass | gates/fix-3.json |
| SPEC-02 | AC#2 (162 line-ups: 3 presets x sizes 2..10 x every user seat) | acceptance test | pass | same |
| SPEC-03 | AC#3 | acceptance test | pass | same |
| SPEC-04 | AC#4 | acceptance test | pass | same |
| SPEC-05 | default seat, chosen-preset rule, sit-and-go base, no mutation | unit test | pass | same |
| SPEC-06 | every RangeError path and check order | unit test | pass | same |
| SPEC-07 | lint, typecheck, test, coverage, boundary, playtest, docs | command | pass | build log; this doc is the documentation item |

- Gates: build-1, fix-2, fix-3 all PASS (test, lint, typecheck, spec unchanged, scope budget, test integrity). Changed lines 266.
- `npm test`: 170 files passed, 595 tests passed; 97.42% lines overall; `lineup.ts` unit coverage 100%. `npm run test:unit` thresholds met.
- Playtest (10000 hands, seed 42, size 6, mixed): Invariant violations: 0.
- CI on the branch: not checked by this doc (not in the artifacts).
- Judge: see doit/TASK-6.7/judge/.

## Review
Round 1: 0 blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (fixed): the error-check order was not pinned by tests. Fix r1 added combined-fault cases.
- MINOR: `lineUpSessionConfig` looks up the user seat a second time with a cast (`src/bots/lineup.ts`). No behaviour issue; not tracked.
- MINOR (security): a seat whose `kind` is not 'user'/'bot', or an unknown style string, is not rejected at runtime. Only typed Game Config calls this today. Added as an AC to TASK-2.6 (stored-data validation).

## How to try it
`npx vitest run tests/bots/lineup-name.acceptance.test.ts tests/bots/lineup.test.ts`, or `npm test`.

## Run metrics
Questions 0 · assumptions logged 5 (in spec) · review rounds 1 · judge rounds: see judge/ · gate runs 3 · escalations 0 · changed lines 266.

## Known limitations and follow-ups
- [trainer] Game Config (TASK-2.5/2.8) must set a valid button (1..players) before calling `lineUpSessionConfig`, or Start game throws at small tables. TASK-2.5 does not mention the button; TASK-2.13 (random starting button) is related. Add an AC to TASK-2.5.
- Out of scope: Game Config UI, persistence (E03), random seat/button (REQ-010), bust replacements (TASK-6.8).

## Lessons for the factory (proposals — not applied)
None; the run was smooth. The one review fix (error-order tests) could be avoided by having the spec template require combined-fault tests whenever it states a check order.
