# Spec: TASK-6.22 — Make the headless bot step use the seeded TAG decision

Status: READY (approved 2026-11-25)
Task: TASK-6.22 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-028.1 (bot randomness only from the replay code and seat) · Dream: limit-holdem-trainer

## 1. Summary
`stepBot(table, policy = tagPolicy)` (`src/table/session.ts:660`) decides with the pure `decideTag(view)`, so a
bot stepped headlessly never mixes in TAG's mixed preflop spots, while the app worker
(`src/table/advice-service.ts:69-70`) and the playtest (`src/playtest/policy.ts:13-15`) decide with
`decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`. This task makes `stepBot`'s default
decision the seeded one, so headless play matches the app for TAG bots, and updates the locked TASK-3.1 session
acceptance test to compare against the exact seeded decision (follow-up from TASK-6.2, doc-73, A-3).

## 2. Scope
- In scope:
  - `stepBot`'s default (no `policy` argument) becomes `decideTag(turn.view, { random: botRandom(turn.seed) })`,
    where `turn = botTurn(table)` and `turn.seed === botDecisionSeed(table.replayCode, turn.view)`
    (`src/table/session.ts:648`).
  - An explicit `policy` argument still decides exactly as today.
  - One exact-equality edit to the locked `tests/table/session.acceptance.test.ts:177` (TASK-3.1), approved by Q-1.
  - One new acceptance test pinning a real mixed spot through `stepBot`.
- Not doing:
  - No change to the app path: `botTurn`, `applyBotDecision`, `useTableSession` and the advice worker are
    untouched. `stepBot` has no caller under `src/` other than its own definition (grep of `src`, `tools`, `e2e`),
    so live play, replayed hands and stored hand records of real sessions do not change.
  - No style-aware default: every bot seat stepped by the default decides as TAG (seeded), whatever its
    `style` (A-1). Style-aware headless stepping is a scope concern.
  - No change to `decideTag`, `tagPolicy` (still exported; tests import it), `BOT_ADVICE` (TASK-7.32 action
    ranges stay in force because the default calls `decideTag`, which spreads `BOT_ADVICE`,
    `src/bots/tag.ts:43-48`), bot-random, or the playtest.
  - No new dependency, no new slow test, no change to `package.json` scripts.
  - No edit to any other locked test (none fail; see 3).
- Scope budget: files=3, lines=90

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The default decides with `decideTag` for every bot seat, ignoring `turn.style`. | yes | AC#1 names `decideTag` exactly; today's default is TAG for every style too, so non-TAG seats change only by gaining TAG's mixing. Default sessions are all TAG (`src/table/session.ts:79-86`). | Default to `decideStyle(turn.view, turn.style, botRandom(turn.seed))`, identical to the worker for every style (scope concern) |
| A-2 | `stepBot`'s signature becomes `stepBot(table: TableState, policy?: SeatPolicy): TableState`; with `policy` undefined it uses the seeded decision. No new export. | yes | The seed needs the table's replay code, which a `SeatPolicy` default value can't see; `botTurn` already computes it. Every existing call shape (`stepBot(t)`, `stepBot(t, policy)`) still compiles. | Export a `seededTagStep` helper; add a `defaultBotPolicy(table)` factory |
| A-3 | The new acceptance test pins replay code `replayCodeFromWords([26, 1, 2, 3])` in the default session: its first bot step (seat 3, first to act) is `raise` seeded, versus `fold` unseeded. | yes | Measured on the trial change: of 496 bot steps over the TASK-3.1 test's 50 codes with check/call user play, exactly 2 differ (code 26 seat 3 fold→raise; code 46 seat 1 fold→call). Code 26's diff is the first action, independent of user play. | Pin code 46 as well |

## 3. Current system
- `src/table/session.ts:639-649` `botTurn(table)` returns `{ hand, view, style, seed: botDecisionSeed(replayCode, view) }`
  and throws `RangeError('Not a bot turn')` off a bot turn; `:652-657` `applyBotDecision`; `:660-663`
  `stepBot(table, policy = tagPolicy)` applies `policy(turn.view)`. Imports: `botDecisionSeed` at `:24`,
  `tagPolicy` at `:33`.
- `src/bots/tag.ts:43-58` `decideTag(view, { random })` — mixes only when `random` is given; `:61` `tagPolicy`
  is the unseeded wrapper.
- `src/engine/bot-random.ts:28-41` `botDecisionSeed`, `botRandom(seed)` (RangeError for a non-u32 seed; cannot
  occur for a seed from `botDecisionSeed`).
- App worker: `src/table/advice-service.ts:66-70` `decideStyle(view, style, botRandom(request.seed))`; for TAG
  this is `decideTag(view, { random })` (`src/bots/decide.ts:10-15`). Playtest: `src/playtest/policy.ts:13-15`
  `seededTagPolicy(code)`.
- Tests: vitest. `npm test` = full suite with coverage; acceptance files `*.acceptance.test.*`; slow tests
  gated by `TLH_SLOW_TESTS` (`package.json` `test:slow`).
- Impact measured on a throwaway worktree with the change applied (fast suite excluding tooling: 1 failed /
  1297 passed / 40 skipped, 67 s; plus `TLH_SLOW_TESTS=1` `tests/storage/trend-data-3000.acceptance.test.ts`,
  the only slow test reaching `stepBot`, passed). The only failure is the TASK-3.1 test below.
- Locked tests that call `stepBot` with its default (owner = task whose `doit/*/state.json` locks them); all
  pass unchanged except the first:
  - `tests/table/session.acceptance.test.ts` — TASK-3.1 — FAILS at `:177` ("every bot action is the TAG decision on its own view").
  - `tests/table/bot-seed.acceptance.test.ts` — TASK-6.18 — passes
  - `tests/bots/bot-random.acceptance.test.ts` — TASK-6.18 — passes
  - `tests/bots/replacement.acceptance.test.ts` — TASK-6.8 — passes
  - `tests/storage/hand-records.acceptance.test.ts` — TASK-3.9 — passes
  - `tests/storage/session-records.acceptance.test.ts`, `tests/table/hand-record-validation.acceptance.test.ts` — TASK-3.10 — pass
  - `tests/storage/resume.acceptance.test.ts` — TASK-2.6 — passes
  - `tests/table/next-hand.acceptance.test.ts` — TASK-3.4 — passes
  - `tests/table/pace.acceptance.test.ts` — TASK-3.13 — passes
  - `tests/table/table-size.acceptance.test.ts` — TASK-2.2 — passes
  - `tests/table/leave-mid-hand.acceptance.test.ts` — TASK-10.2 — passes
  - `tests/table/short-stack.acceptance.test.ts` — TASK-3.21 — passes (drives bots through the app path, `:157`)
  - `tests/ui/table-display.acceptance.test.tsx` — TASK-3.3 — passes
  - Explicit-policy only (unaffected): `tests/table/game-type.acceptance.test.ts` (TASK-2.4),
    `tests/advice/range-model.acceptance.test.ts` (TASK-7.5), `tests/ui/hint.acceptance.test.tsx` and
    `tests/ui/hint-toggle.acceptance.test.tsx` (TASK-8.1).
- Existing code to reuse:
  - `src/table/session.ts:639` `botTurn` → the view and the seed (do not recompute `botDecisionSeed`).
  - `src/engine/bot-random.ts:35` `botRandom` → the generator.
  - `src/bots/tag.ts:43` `decideTag` → the decision (keeps `BOT_ADVICE`, `BOT_EQUITY`, `TAG_STYLE`).
  - `tests/table/session.acceptance.test.ts:20-62` `CODES`, `play`, `checkOrCall` → already in the locked test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Default decision = `decideTag(turn.view, { random: botRandom(turn.seed) })` inside `stepBot`. | `decideStyle` per seat style (A-1); keep `tagPolicy` | AC#1 wording; matches worker and playtest for TAG. | no | n/a |
| D-2 | Edit the locked TASK-3.1 test at `:177` to the exact seeded expectation; no widened assertion. | Leave it and skip AC#2; loosen to "seeded or unseeded" | AC#2 requires exact equality; this needs the owner's approval. | yes | user (Q-1) |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — `stepBot` default; import `botRandom` alongside `botDecisionSeed`; import `decideTag`
  instead of `tagPolicy`.
- `tests/table/session.acceptance.test.ts` — locked (TASK-3.1): exact seeded expectation at `:177` (Q-1).
- `tests/table/bot-step-seeded.acceptance.test.ts` — new: SPEC-01, SPEC-02.

### Components, interfaces and data
- `export function stepBot(table: TableState, policy?: SeatPolicy): TableState`
  - `const turn = botTurn(table);` (throws `RangeError('Not a bot turn')` as today)
  - `action = policy === undefined ? decideTag(turn.view, { random: botRandom(turn.seed) }) : policy(turn.view)`
  - `return applyBotDecision(table, turn, action);` (RangeError on an illegal action, as today)
  - Doc comment: "One bot action on the bot's own view: `policy` when given, else the seeded TAG decision
    `decideTag(view, { random: botRandom(botDecisionSeed(replayCode, view)) })`, as the app worker decides a TAG seat."
- Locked-test edit (exact text, owner approval Q-1): add
  `import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';` and replace line 177
  `const expected = decideTag(playerView(before, seat));` with
  `const view = playerView(before, seat);` and
  `const expected = decideTag(view, { random: botRandom(botDecisionSeed(code, view)) });`.
  The three assertions on `record` (`:179-182`) are unchanged. Verified on the trial worktree: 7/7 pass.

### Rules and algorithms
- Worked example (A-3): default session, `code = replayCodeFromWords([26, 1, 2, 3])`, `dealHand(seatSession(), code)`;
  `hand.toAct === 3`. `decideTag(view)` = fold; `decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`
  = raise; `stepBot(table)` records seat 3 `raise`.

### Error handling and configuration
- Unchanged: `RangeError('Not a bot turn')` off a bot turn; RangeError from `applyBotDecision` for an illegal
  policy action; errors from `recommend` propagate through `decideTag`.

## 6. Behaviour specification

### SPEC-01: The default step equals the seeded TAG decision in a mixed spot
- Verifies: AC#1
- Behaviour: Given the default session dealt with `replayCodeFromWords([26, 1, 2, 3])` at its first bot turn
  (seat 3), When `stepBot(table)` is called with no policy, Then the new last action record is seat 3 with the
  type and amount of `decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`, which is `raise`,
  and differs from the unseeded `decideTag(view)` (`fold`), proving the spot is mixed.
- Verification: acceptance `tests/table/bot-step-seeded.acceptance.test.ts::the default bot step takes the seeded TAG decision in a mixed spot`

### SPEC-02: The default step equals the worker's decision for every TAG bot step of a hand
- Verifies: AC#1
- Behaviour: Given the default session (all TAG bots) dealt with each of `replayCodeFromWords([26,1,2,3])` and
  `replayCodeFromWords([46,1,2,3])`, the user checking or calling, When every bot turn is stepped with
  `stepBot(table)`, Then each bot action equals `handleAdviceRequest({ id, kind: 'bot', view, style: 'TAG',
  seed: botTurn(table).seed })`'s `value` (the app worker's decision).
- Verification: acceptance `tests/table/bot-step-seeded.acceptance.test.ts::every default bot step matches the app worker's decision`

### SPEC-03: The locked TASK-3.1 test compares to the exact seeded decision
- Verifies: AC#2
- Behaviour: Given the TASK-3.1 test "every bot action is the TAG decision on its own view" over its 50 codes,
  When it is updated (Q-1), Then each bot record's seat, type and amount equal
  `decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })` with `toBe` equality, no other assertion
  changes, and the test passes.
- Verification: acceptance `tests/table/session.acceptance.test.ts::every bot action is the TAG decision on its own view`

### SPEC-04: An explicit policy still decides
- Verifies: AC#1
- Behaviour: Given a dealt table at a bot turn, When `stepBot(table, policy)` is called with a policy, Then the
  action applied is `policy(view)` (an illegal one throws RangeError, unchanged).
- Verification: unit `tests/table/session.test.ts` (existing `rejectingPolicy` case at `:62`) and
  `tests/table/bot-turn.test.ts` (existing split-step equivalence at `:120-142`)

## 7. Edge cases
- Not a bot turn / no replay code: `botTurn` throws `RangeError('Not a bot turn')` before any seed is drawn —
  existing `tests/table/session.acceptance.test.ts:158`, `tests/table/session.test.ts:48,68`.
- Non-TAG seat with the default: decides as seeded TAG (A-1); no locked test pins this (all pass).
- Invalid seed: N/A — `botDecisionSeed` always returns an unsigned 32-bit integer.
- Concurrency / interruption / permissions: N/A — pure function.

## 8. Security considerations
- Randomness: the seeded generator is the existing REQ-028.1 per-seat xoshiro (fairness by determinism, not
  secrecy); no `Math.random`. No new trust boundary, input, secret, log or dependency.

## 9. Non-functional
- The normal suite stays fast: the new file plays at most 3 hands (< 2 s locally); no new slow test. The
  seeded default adds one `botDecisionSeed` (already computed by `botTurn`) and one generator per step.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — `stepBot` is a headless helper with no app caller; exercise it with `npx vitest run tests/table/bot-step-seeded.acceptance.test.ts tests/table/session.acceptance.test.ts`
- New tests: `tests/table/bot-step-seeded.acceptance.test.ts` → SPEC-01, SPEC-02. Edited locked test →
  SPEC-03. Existing unit tests → SPEC-04.
- Judge scenario: run the command above; then `npm test` and confirm only the expected files changed
  (`git diff --stat` shows the 3 files) and no other locked test was edited.

## 11. Open questions
- None. Q-1 approved: the locked TASK-3.1 edit is allowed (exact-equality, one import).

## 12. Clarifications log
See `doit/TASK-6.22/qa.md`.
