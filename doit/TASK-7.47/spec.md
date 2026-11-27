# Spec: TASK-7.47 — Make the short-handed TAG postflop test cover river raises

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-7.47 · Parent/epic: TASK-7 · Requirements: n/a (follow-up of TASK-7.46 judge J-1-03, doc-185) · Dream: limit-holdem-trainer

## 1. Summary
The postflop check in the locked `tests/bots/tag-short-handed.acceptance.test.ts` plays 50 hands at 3 seats
(seed 42), and that sample contains no river view where TAG raises, so a mutation in `decideTag` that turns a
river raise into a call passes. This task adds a new, fast acceptance test that plays a 3-seat sample known to
contain TAG river raises and pins every TAG river move to the advice engine's move, so that mutation fails.
The locked file is not edited.

## 2. Scope
- In scope:
  - New file `tests/bots/tag-short-handed-river.acceptance.test.ts` with one test (SPEC-01).
  - A mutation run that shows the new test fails when `decideTag` turns a river raise into a call (SPEC-02).
- Not doing:
  - Editing, unlocking, loosening or renaming anything in `tests/bots/tag-short-handed.acceptance.test.ts`.
  - Any change under `src/` (TAG play, advice engine, runner). The mutation in SPEC-02 is temporary and reverted.
  - Adding the new test to `test:slow` (it is fast and runs in the normal suite).
  - Covering 4 seats, other bot styles, or turn/flop raises (already covered by the locked file's sample).
- Scope budget: files=1, lines=60

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#1's "a targeted river-raise view is added" is met by a NEW acceptance file next to the locked one, rather than an edit to the locked file. | yes | Caller prefers a new file when it avoids a cross-story locked edit; the AC's outcome (river raise->call mutation fails a test) is identical; no assertion in the locked file changes. | Enlarge the locked file's sample from 50 to 500 hands (needs `doit.py unlock TASK-7.46 …`; 8 river raises at seed 42; slows its other checks). |
| A-2 | Sample: cash, 3 seats, seed 3, 200 hands, every seat TAG (runPlaytest default). | yes | Probe (below) found 6 TAG river-raise views in hands 35, 78 and 182, about 125 ms locally (so well under 1 s even at CI's ~3x coverage slowdown, TASK-1.58). Seed 42 needs 500 hands for a comparable count (8) and 150 for the first one. | seed 42 / 500 hands at 3 seats (8 raises, ~300 ms); seed 3 / 200 hands at 4 seats (9 raises, ~220 ms). |
| A-3 | The non-vacuity guard is `riverRaises > 0` (same style as the locked file's `aggressive > 0`), not an exact count. | yes | An exact count would break on any legitimate advice-engine tuning; `> 0` is enough for the mutation to fail. | `>= 6` (exact today). |

## 3. Current system
- `decideTag` (`src/bots/tag.ts:69-87`) returns `recommend(view, {...BOT_ADVICE, equity: BOT_EQUITY, chart?})`'s move;
  only preflop chart cells with an alternative can mix, so every postflop TAG move equals the engine's move.
- `BOT_EQUITY` is deterministic (seeded engine at `BOT_EQUITY_BUDGET`, `src/bots/tag.ts:29-35`), so a seeded
  playtest gives the same views every run.
- `runPlaytest` without `lineUp` seats TAG at every seat (`src/playtest/runner.ts:110`, `defaultPolicyFactory`);
  `seams.onAction` receives the exact view each seat decided on (`src/playtest/runner.ts:96-98`).
- The locked test's postflop check (`tests/bots/tag-short-handed.acceptance.test.ts:118-151`) captures views with
  `composeChecks(checkStep, capture)`, derives the decision seed with `botDecisionSeed(handReplayCode(42, k), view)`
  and compares `decideTag` to `recommend(view, { ...BOT_ADVICE, equity: BOT_EQUITY }).move`. Its 50-hand seed-42
  sample has 19 river views, 0 river raises (probe), hence J-1-03.
- Tests: vitest; `npm test` runs `vitest run --coverage` over everything; `*.acceptance.test.ts` also run in
  `test:sweeps` (`package.json` scripts). Files named `*.acceptance.test.ts` are locked after the first green build.
- Probe (node, `tools/playtest/resolve-ts.js` loader, 3 seats, counting river views where the engine move is `raise`):
  seed 42/50 hands → 0; 42/100 → 0; 42/150 → 1; 42/300 → 2; 42/500 → 8; seeds 1, 2, 7 /50 → 0; seed 3/50 → 1;
  seed 3/200 → 6 (hands 35, 78, 78, 78, 182, 182), 125 ms.
- Existing code to reuse:
  - `tests/bots/tag-short-handed.acceptance.test.ts:118-151` → copy the capture/seed/compare pattern (do not import from it).
  - `src/playtest/runner.ts` → `runPlaytest`, `composeChecks`, `handReplayCode`.
  - `src/engine/invariants.ts` → `checkStep`; `src/engine/bot-random.ts` → `botDecisionSeed`, `botRandom`.
  - `src/bots/tag.ts` → `decideTag`, `BOT_ADVICE`, `BOT_EQUITY`; `src/advice/recommend.ts` → `recommend`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Add a new acceptance file; leave the TASK-7.37/7.46 locked file untouched. | Locked edit enlarging its sample (owner TASK-7.46, unlock needed). | No cross-story unlock; the locked file's other checks keep their runtime; same mutation-killing power. | no | n/a (A-1) |
| D-2 | Pin every river view's TAG move to the engine move, and additionally assert `decideTag(...).type === 'raise'` on views where the engine raises. | Only compare to engine. | The direct `raise` assertion states the user-observable behaviour (TAG raises the river) even if the comparison helper changed. | no | n/a |

## 5. Design

### Files to create / modify
- `tests/bots/tag-short-handed-river.acceptance.test.ts` — new: SPEC-01.

### Components, interfaces and data
- One `describe('TAG river raises at 3 seats (TASK-7.47)')` with one `it('TAG raises the river exactly when the advice engine does, in a 3-seat sample with river raises')`.
- Capture hook: `(_step, view?) => { if (view?.street === 'river') river.push({ code: handReplayCode(3, handsDone + 1), view }); return []; }`,
  with `handsDone` incremented by `runPlaytest`'s `onHand` callback (same as the locked file).

### Rules and algorithms
1. `const summary = runPlaytest({ hands: 200, seed: 3, size: 3 }, () => handsDone++, { onAction: composeChecks(checkStep, capture) });`
2. `expect(summary.violations).toBe(0)`.
3. For each captured `{ code, view }`: `seed = botDecisionSeed(code, view)`;
   `actual = decideTag(view, { random: botRandom(seed) })`; `engine = recommend(view, { ...BOT_ADVICE, equity: BOT_EQUITY }).move`;
   `expect(actual, \`river seat ${view.seat}\`).toEqual(engine)`; if `engine.type === 'raise'` then
   `expect(actual.type).toBe('raise')` and `riverRaises++`.
4. `expect(river.length).toBeGreaterThan(0)` and `expect(riverRaises).toBeGreaterThan(0)` (today: 6).

### Error handling and configuration
- None; errors from `recommend` propagate and fail the test.

## 6. Behaviour specification

### SPEC-01: TAG raises the river when the advice engine does, in a sample that contains river raises
- Verifies: AC#1
- Behaviour: Given a cash playtest at 3 seats, seed 3, 200 hands, TAG in every seat, When every river view a seat
  decided on is replayed through `decideTag` with that view's bot decision seed, Then there are 0 violations, each
  move equals `recommend(view, { ...BOT_ADVICE, equity: BOT_EQUITY }).move`, each view where that move is a raise
  gets a TAG `raise`, and at least one such river raise exists (6 today).
- Verification: acceptance `tests/bots/tag-short-handed-river.acceptance.test.ts::TAG raises the river exactly when the advice engine does, in a 3-seat sample with river raises`

### SPEC-02: A river raise->call mutation in decideTag fails the new test; the locked file is unchanged
- Verifies: AC#1
- Behaviour: Given `decideTag` temporarily mutated to return the legal `call` when `view.street === 'river'` and the
  engine move is `raise`, When the new test runs, Then it fails; after reverting the mutation it passes; and
  `git diff main -- tests/bots/tag-short-handed.acceptance.test.ts src/` is empty.
- Verification: command `npx vitest run tests/bots/tag-short-handed-river.acceptance.test.ts` (fails with the mutation, passes without; builder records both outcomes in build-log.md) and `git diff --stat main -- tests/bots/tag-short-handed.acceptance.test.ts src/` (empty)

## 7. Edge cases
- Empty sample: guarded by `river.length > 0` and `riverRaises > 0` (SPEC-01) so the test cannot pass vacuously.
- Future advice-engine tuning that removes all river raises from the sample: the test fails loudly and the seed/hand
  count must be re-chosen (intended: it signals lost coverage).
- Invalid input, concurrency, permissions, dependency failure: N/A (pure deterministic test, no I/O).

## 8. Security considerations
N/A — test-only change; no untrusted input, secrets, dependencies or randomness affecting fairness (bot seeds are the
existing deterministic `botRandom`).

## 9. Non-functional
- Runtime: the new test runs in under 1 s locally (probe: ~125 ms of play plus the replay) and stays under 3 s under
  `--coverage` in CI (TASK-1.58: ~3x slower). Measured by the vitest per-test duration in the gate run.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/bots/tag-short-handed-river.acceptance.test.ts tests/bots/tag-short-handed.acceptance.test.ts`
- New tests: `tests/bots/tag-short-handed-river.acceptance.test.ts` → SPEC-01. Judge scenario: apply the SPEC-02
  mutation in `src/bots/tag.ts`, run the new test (expect failure on a river view), revert, run again (pass).

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-7.47/qa.md`.
