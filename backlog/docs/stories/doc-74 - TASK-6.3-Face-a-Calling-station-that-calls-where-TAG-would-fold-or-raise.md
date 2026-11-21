---
id: doc-74
title: 'TASK-6.3: Face a Calling station that calls where TAG would fold or raise'
type: other
created_date: '2026-11-21T23:17:00Z'
updated_date: '2026-11-21T23:17:00Z'
---
# TASK-6.3: Face a Calling station that calls where TAG would fold or raise

Status: Done (pending Judge) · Completed: 2026-11-21 · Epic: TASK-6 · Milestone: m-1 · Requirements: REQ-026 (026.2, 026.3); band context REQ-027.2 · Branch: doit/TASK-6.3

## What was asked
Add the Calling station (loose-passive) bot. It starts from the same advice as TAG, then applies deviations stored in its own style data file: where advice is fold against a bet, or raise, it calls instead with the file's probability. Changing a probability in the file must change the call rate with no code change. With no bet to face it never folds. Spec: doit/TASK-6.3/spec.md.

## Assumptions made without asking — please review
Q-1, Q-2 and Q-3 were auto-accepted (autopilot, recommended options). A-1..A-7 were decided without asking.

| ID | Assumption / decision | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 / D-1 | Style format gets an optional top-level `deviations` list in `tlh-bot-style` v1 (see "Deviations format"). Absent means `[]`, so `tag.json` is unchanged; version stays 1. | yes | Minimal, keeps TASK-6.2 locked tests valid, and later bots can add pairs. | Change the schema in `parseStyle`; edit JSON |
| Q-2 / D-2 | Values: preflop fold→call **0.5**, preflop raise→call **0.6**, postflop fold→call **0.5**. Prototype over 10,000 hands, seed 42, 6-max: one station among TAGs VPIP 59.0% / PFR 6.8%; two stations 57.1% / 6.1%; six stations 52.4% / 4.9%. All inside REQ-027.2 (VPIP 45–65, PFR 3–10), 0 violations. Same rule at 0/0/0 gave 22.4% / 16.9%. | yes | Lands the band; data-only change. | Edit probabilities in `calling-station.json` |
| Q-3 / D-3 | The worker's `decideBotDefault` sends `'Calling station'` to `decideCallingStation`; every other style still goes to `decideTag`. | yes | `style` already reaches the worker; no user can seat a station yet. | Revert the ~2-line dispatch |
| A-1 | `decideCallingStation(view)` with no `random` never deviates (mirrors TAG). | yes | Same behaviour as TAG. | Make `random` required |
| A-2 | A deviating decision (style has a deviation for street class + advice, generator given) takes exactly one `nextUint32()` draw and deviates iff `u < p × 2^32`, even at p = 0 or 1. Other decisions draw nothing. | yes | Same rule as `drawMixed`. | Use `nextInt(100)` |
| A-3 | No TAG-style mixing: `"mixedSpots": []`, never read by the station. | yes | REQ-026.2 defines it by call deviations only. | Apply mixing when no deviation applies |
| A-4 | "Call instead of raise" with nothing owed (big blind option in a limped pot) plays **check**. | yes | No call is legal at 0 owed; AC#5 forbids folding. | Keep the raise |
| A-5 | `deviations` optional, `version` stays 1, TAG's file unchanged. | yes | Keeps locked tests untouched. | Make required, edit `tag.json` |
| A-6 | `decideCallingStation` takes an optional `style` (default `CALLING_STATION_STYLE`); AC#4's test parses a modified JSON copy and passes it in. | yes | A test can't rewrite a bundled JSON import. | Temp file and re-import |
| A-7 | Test-only memoised `computeEquity` shared by both bots in the 10,000-point comparisons. | yes | Postflop points cost about 10 ms each otherwise. | Preflop-only points |

Scope concern, resolved as follow-up dependencies: postflop advice never bets or raises (value betting is TASK-7.8), so postflop aggression is 0% for every bot (TAG included). The Calling station's 10–25% aggression band (REQ-027.2) cannot be met until TASK-7.8 lands, so TASK-6.16 and TASK-6.17 now depend on TASK-7.8. Also, the postflop fold→call deviation rarely fires in bot-only tables (5 of 154 fold points in the collected set).

## Clarifications and decisions
Q-1, Q-2, Q-3: see the table above and doit/TASK-6.3/qa.md. D-4: decision rule (free postflop check shortcut, advice, at most one draw; passive move is call if owed > 0, else check). D-5: the 10,000 decision points are `views[i mod n]` of views collected once (`runPlaytest({hands:200, seed:61, size:6})`, TAG at seat 1) paired with codes `handReplayCode(6003, i+1)` (fold) or `(6004, i+1)` (raise); each bot gets a fresh `botRandom(botDecisionSeed(code, view))`.

## What was built
- `src/bots/style.ts` → `Deviation` type, `BotStyleData.deviations`, validation inside `parseStyle`, `findDeviation`, `drawDeviation(p, random)` (true iff `u < p × 2^32`).
- `src/bots/styles/calling-station.json` (new) → description, `mixedSpots: []`, three deviations with justifications.
- `src/bots/calling-station.ts` (new) → `CALLING_STATION_STYLE` (validated at import), `decideCallingStation(view, {random?, style?, ...RecommendOptions})`.
- `src/table/advice-service.ts` → D-3 dispatch.
- Tests: `tests/bots/calling-station.acceptance.test.ts` (6, locked), `tests/bots/calling-station.test.ts`, `tests/bots/style.test.ts`, `tests/table/advice-service.test.ts`.
- The default line-ups are unchanged (app all TAG, playtest all seeded TAG); line-up presets belong to TASK-6.6.

### Deviations format
Optional top-level list; each entry is `{street: "preflop"|"postflop", advice: "fold"|"raise", instead: "call", probability: 0..1, justification}`. Supported pairs: preflop/fold, preflop/raise, postflop/fold, each at most once. The validator collects every problem: not a list, unsupported pair, duplicate pair, probability missing/non-finite/outside [0,1], justification under 10 words. Echoed values are cut to 20 characters. Only valid entries are kept.

### Calling station description and justifications (original text, file `calling-station.json`)
- Description: "Calling station (loose-passive) plays far too many hands and rarely raises. It starts from the trainer's own advice, like TAG, but where the advice is to fold against a bet it often calls instead, and where the advice is to raise it usually just calls. It hardly ever bets on its own, so bet your good hands for value against it and don't try to bluff it off a hand."
- preflop fold→call 0.5: "Calling half of the hands the chart folds against a bet roughly doubles TAG's starting range, which puts the station's VPIP near the middle of its 45 to 65 percent band."
- preflop raise→call 0.6: "Just calling with most hands the chart raises leaves only a few raises, which keeps the station's PFR inside its 3 to 10 percent band and makes its raises mean a strong hand."
- postflop fold→call 0.5: "Calling half the time when the pot odds say fold is the station's defining leak: it pays off value bets with weak pairs and missed draws, which the learner should exploit."

### Decision rule and worked examples
1. Postflop with nothing owed: check, no draw. 2. Take the advice. 3. No generator: advice. 4. No deviation for (street class, advice action): advice, no draw. 5. One draw: deviate to call (check if owed is 0), else the advice.
- **Example A (raise→call):** seat 1, SB, preflop, AQo, limped pot, code `handReplayCode(6004, 2)`, seed 3757549955, u = 1339328068 < 0.6×2^32, so the station plays `call 2`; TAG plays `raise 8`. At D-5 point 0 (seed 3761756536, u 3312332681) both raise to 8.
- **Example B (postflop fold→call):** flop, 5c 3c, advice fold, code `handReplayCode(6003, 31)`, seed 2826725471, u = 523750097 < 0.5×2^32, so the station plays `call 4`; TAG folds.
- **Example C (no deviation):** CO, preflop, 97o, advice fold, code `handReplayCode(6003, 1)`, seed 4053618777, u = 2247995765 ≥ 0.5×2^32, so the station folds like TAG.
All three were reproduced against the real code (build-log.md) and asserted in the acceptance test.

### Measured comparison counts (D-5 points, from build-log/spec prototype)
Fold points (AC#2): station calls 5040, TAG 84. Raise points (AC#3): station 6047, TAG 76. AC#4 with preflop fold→call at 0.2: station calls 2137 (lower than 5040). The tests assert the relations (greater / lower / equal), not these exact counts. build-log.md records the Examples A–C match; it doesn't separately re-record these counts.

## How it was verified
Judge: see doit/TASK-6.3/judge/.

| SPEC item | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01 | AC#1 | acceptance: style file parameters, description, validator errors | pass |
| SPEC-02 | AC#2 | acceptance: fold points, station calls > TAG | pass |
| SPEC-03 | AC#3 | acceptance: raise points | pass |
| SPEC-04 | AC#4 | acceptance: 0.2 lower, 0 = removed, 1 = all preflop folds call | pass |
| SPEC-05 | AC#5 | acceptance: never folds with nothing owed | pass |
| SPEC-06, SPEC-10 | worker | acceptance + advice-service unit | pass |
| SPEC-07, SPEC-09 | validator, draws | unit tests | pass |
| SPEC-08 | DoD#6 | playtest baseline | unchanged |
| SPEC-11 | DoD | lint, typecheck, test, coverage | pass |

- Playtest baseline unchanged: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` gives `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (Player actions 88920, violations 0).
- `npm test`: 157 files passed / 1 skipped; 548 tests passed / 7 skipped; coverage 96.96% overall, `style.ts` 100%, `calling-station.ts` 100% lines. Lint and typecheck clean. `npm run e2e`: 130 passed, 12 skipped.
- Gates: build #1 PASS, fix #2 PASS. Both warn on lines (840 changed vs 650 budget; mostly tests). Files within budget, test integrity pass.
- CI on the branch: not yet checked at doc time.

## Review
Round 1: 0 blocking findings. Security: clean (fail-closed validation, strict equality dispatch, no `Math.random`/`Date`, no new dependencies).

### Non-blocking review notes (deliberately not fixed)
- MINOR: `tests/bots/calling-station.test.ts:26` duplicates the D-5 view collection of the locked acceptance file (about 40 lines). Not tracked.
- NIT: `src/bots/calling-station.ts:32` has an unreachable missing-hero guard (parity with `decideTag`). Not tracked.

## How to try it
- `npx vitest run tests/bots/calling-station.acceptance.test.ts tests/bots/calling-station.test.ts`
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` (expect the hash above)
- Change a probability in a copy of `calling-station.json`, parse with `parseStyle`, pass as `style` to `decideCallingStation`.

## Run metrics
Questions 3 (auto-accepted) · assumptions 7 · review rounds 1 · judge rounds: pending · gate runs 2 · escalations 0 · changed lines 840 (budget 650).

## Known limitations and follow-ups
- [trainer] Postflop bets and raises for bots are not built; the Calling station's aggression band depends on TASK-7.8. TASK-6.16 and TASK-6.17 now depend on it (already wired).
- [trainer] No line-up seats a Calling station yet and no playtest policy exists for it; owned by TASK-6.6.
- [trainer] VPIP/PFR band measurement is owned by TASK-6.11 and TASK-6.17.

Not tracked (infra, below the value bar): the duplicated view-collection helper in tests (MINOR); the unreachable hero guard (NIT).

## Lessons for the factory (proposals — not applied)
- The spec budget of 650 lines was exceeded by 190 (tests). Budgets for stories with a large acceptance file and validator cases should be sized for tests from the start.
- Spec work: the aggression-band dependency (postflop advice never bets) surfaced only during spec; checking band requirements against engine capability at task-creation time would have set the TASK-7.8 dependency earlier.
