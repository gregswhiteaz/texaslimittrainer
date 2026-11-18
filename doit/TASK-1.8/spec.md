# Spec: TASK-1.8 — Check game invariants after every playtest action

Status: READY (approved 2026-11-18 by user via Q-1)
Task: TASK-1.8 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-056.1, REQ-062.2, REQ-064.2 · Dream: limit-holdem-trainer

## 1. Summary
This task adds a reusable invariant checker, `src/engine/invariants.ts`. After every playtest action it checks five
invariants: chip conservation, legal action, the 4-bet cap, pot eligibility and no card dealt twice. The checker is
plugged into the playtest runner through a new per-action hook, `onAction`, and replaces the two interim M1 checks
from TASK-1.6 A-4. When an action breaks an invariant, the runner stops that hand. The CLI then exits 1 and prints
which invariant broke, the hand's replay code, a ready-to-run replay command and the full action history
(`formatHand`). CI gains a 10,000-hand playtest step. Tests use a test-only faulty engine to prove that each
invariant can actually fail.

## 2. Scope
- In scope:
  - `src/engine/invariants.ts` (new): `checkStep`, `checkState`, `describeAction`, the invariant ids and the
    `Violation`/`ActionStep` types. It contains no playtest code, so TASK-1.17, TASK-6.9 and engine tests can reuse it.
  - `src/playtest/runner.ts`: an `onAction` hook (default `checkStep`), an injectable engine (test seam), a
    per-hand `violation` record, `violationCounts` and `firstViolation` in the summary, and a hand that stops at its
    first violating action. The A-4 counter goes.
  - `src/playtest/cli.ts`: a violation block appended to the report only when violations > 0 (§5 "Output"). `main`
    accepts the seams object.
  - `.github/workflows/ci.yml`: a `Playtest` step running `npm run playtest -- --hands 10000 --seed 42`.
  - Tests: new checker unit tests on hand-built corrupt states, a fault-injection acceptance suite, a checker
    speed test, a CI workflow assertion, and updates to the TASK-1.6 unit tests whose call signatures and over-cap
    expectation change.
- Not doing:
  - Engine rule changes. The engine still has no cap (TASK-1.12), no all-in calls (TASK-1.9) and no side pots
    (TASK-1.10). `src/engine/hand.ts` is not modified.
  - Checking that dealt cards come from the right deck positions (deal order D-5). Checking only uniqueness, range
    and counts.
  - Chip conservation across hands. Stacks are reset to $160 every hand until TASK-1.16.
  - Checking the state right after `createHand`, before any action. A dealt hand always has a first action, and its
    check covers the deal (A-8).
  - Sharding, 1,000,000-hand runs and throughput proof (TASK-1.17). Line-ups and style checks (E06).
  - A CI failure rehearsal branch (A-7).
  - Any change to the TASK-1.6 locked acceptance files `tests/playtest/playtest.acceptance.test.ts` and
    `tests/playtest/runner.acceptance.test.ts`. Both must keep passing unchanged.
  - Any change to existing report lines, error messages or USAGE (TASK-1.6 Q-1).
- Scope budget: files=11, lines=1150   (invariants.ts ~210, runner.ts ~70 changed, cli.ts ~55 changed, ci.yml 2,
  invariants.test.ts ~260, invariants.acceptance.test.ts ~230, faulty-engine.ts ~110, invariants.perf.test.ts ~50,
  workflow.test.ts ~20, runner.test.ts ~30, cli.test.ts ~40)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The checker lives in `src/engine/invariants.ts`, under the 90% engine coverage threshold and the headless lint boundary | yes | The task notes say: "keep the checker in the engine package so unit tests can reuse it" | `src/playtest/invariants.ts` |
| A-2 | Each invariant is reported at most once per action: one `Violation` per invariant, carrying the message of its first failing sub-check (§5 Rules order). `Invariant violations: N` = the number of (hand, invariant) pairs violated | yes | A 1,000,000-hand run cannot be flooded by a single corrupt state, and counts per invariant stay meaningful | One violation per failing sub-check |
| A-3 | A hand stops at its first violating action, because its state can no longer be trusted. The run continues to the requested hand count. The summary keeps only the first violating hand for printing, so memory stays O(1) in hands | yes | Keeps TASK-1.6's "count and continue" semantics and existing tests (`cli.test.ts:88-103`). Bounded output. **Part of Q-1** | Stop the whole run at the first violation |
| A-4 | "In the legal set" means the action is in the engine's `legalActions(before)`, `seat === before.toAct`, its bet/raise size is checked independently against the street unit (REQ-016.1), and the new history entry matches the action. An action the engine rejects is also a `legal-action` violation (as in TASK-1.6 A-4a) | yes | Engine legality alone would be circular. The independent size and history checks catch a wrong `legalActions` at little cost. Re-deriving the full rules would duplicate `hand.ts:217-241` and break on every rules story (TASK-1.9, 1.12) | Fully independent legal-set derivation |
| A-5 | `Violation.invariant` is a `string`. A custom `onAction` hook replaces the default, and callers compose with `checkStep` (e.g. `(s) => [...checkStep(s), ...mine(s)]`) | yes | Lets TASK-6.9 or E06 add their own checks (e.g. style checks) without touching the runner | Hook runs in addition to a fixed built-in checker |
| A-6 | CI runs `npm run playtest -- --hands 10000 --seed 42` with a fixed seed, as a step named `Playtest` placed right after `Test` | yes | REQ-062 fit criterion uses exactly this command. A fixed seed keeps CI deterministic and any failure reproducible | Seed from `github.run_number` (more coverage, non-deterministic) |
| A-7 | AC#4's "workflow fails if the playtest exits non-zero" is proven by three things: the workflow test (step present, no `continue-on-error`, `\|\| true` or `set +e`, which `workflow.test.ts:50-53` already guards); the in-process proof that `main` returns 1 on a violation; and GitHub's default that a non-zero step exit fails the job. There is no deliberately failing CI branch | yes | A rehearsal would need a production fault that `npm test` catches first, so the run would fail at `Test`, not `Playtest`. TASK-1.7 already proved that any failing step fails the workflow | `ci-proof/TASK-1.8/playtest` branch that changes only the CI command |
| A-8 | Checks run after each player action only. A fault present from the deal (e.g. a duplicate card) is caught at player action 1 | yes | After `createHand` someone is always to act (`hand.ts:195`), so every hand has a first action | Also call `checkState` after `createHand` |
| A-9 | "Eligible players contributed to it" means: for every pot holding chips, each eligible seat put chips in on a completed street (`totalContribution - streetContribution > 0`), and every award winner is eligible for that pot and contributed more than $0. Exact per-pot contribution levels come with side pots (TASK-1.10) | yes | There is exactly one pot today (`hand.ts:88`). Preflop the pot holds $0 and lists seats that have not acted yet (`hand.ts:192`) | Require equal completed-street contributions among eligible seats (wrong once side pots exist) |
| A-10 | `final` is the state the engine returned when it accepted the violating action (so the corruption is visible), or the last good state when it rejected it. `formatHand` prints `Result: abandoned (invariant violation)` only when `final.result` is null (existing text, `cli.ts:158`) | yes | The printed history must contain the offending action whenever the engine recorded it | Always print the last good state |
| A-11 | Faults live in a test-only helper, `tests/support/faulty-engine.ts`, that wraps the real `createHand`/`applyAction`. The fifth-bet fault forces the bet through even after TASK-1.12 adds the cap, so the locked test survives that story | yes | Task note: "Fault injection via a test-only engine wrapper" | Mutate `hand.ts` under a flag (rejected: test code in production) |
| A-12 | Checker speed budget: mean added cost ≤ 2 µs per action on the reference machine (Apple-silicon Mac, Node 22.18.0). Local `npm test` enforces a slack floor of ≤ 10 µs. CI prints but does not enforce (`tests/support/speed.ts`) | yes | Measured runner cost is ≈ 0.8 µs/action (10,000 6-max hands = 162,629 actions in ≈ 127 ms, scratch benchmark 2026-11-18). REQ-062.5 allows 36 ms per hand, so the checker is never the bottleneck | No speed test |

## 3. Current system
- TypeScript 6 strict, extensionless imports. Vitest with v8 coverage: 70% overall, 90% for
  `src/{engine,bots,advice,stats}/**` (`vite.config.ts:17`). Scripts: `package.json:10-18`. The headless lint
  boundary covers `src/engine/**` (`tools/lint/headless-boundary.js:6`).
- Engine state model (`src/engine/hand.ts`):
  - `PlayerState` holds `startingStack`, `stack`, `streetContribution`, `totalContribution`, `folded` and
    `holeCards` (`:27-42`).
  - `Pot{amount, eligible}` (`:44-47`). Pots hold chips from completed streets only. `gather` moves street
    contributions into `pots[0]` at round end (`:252-264`).
  - On a fold, the folder leaves every pot's `eligible` list (`:391-397`).
  - A completed hand has `pots[0].amount = 0` and `streetContribution = 0`. Winners are paid into `stack`, and
    `result.awards[i]` has `{pot, amount, winners[]}` (`:292-308`, `:317-336`).
  - `betCount` counts bets and raises, with the big blind counting 1 preflop (`:92-93`). It is incremented without
    any cap (`:399`). The cap is TASK-1.12.
  - `legalActions(state)` gives the exact legal set (`:217-241`). The unit is `smallBet` preflop/flop and `bigBet`
    turn/river (`:221-224`).
  - `actions` holds blinds first, then one `ActionRecord{street, seat, type, amount, added}` per applied action
    (`:400`).
  - The board and burn cards follow D-5 (`:338-351`). Lengths: preflop 0/0, flop 3/1, turn 4/2, river 5/3, showdown
    5/3. A fold-out keeps `street` (`:86`).
- Playtest (`src/playtest/runner.ts`):
  - `playHand` loops over `actWith` and counts the A-4 violations: a rejection stops the hand, and
    `betCount > MAX_BETS_PER_STREET` (`:84-92`).
  - `actWith` hides the chosen action (`player-view.ts:109-118`), so the runner must call
    `playerView` + policy + `applyAction` itself to give the hook the action.
  - `runPlaytest(options, onHand?, makePolicy?)` (`:156-170`). `summarize` (`:116-153`).
- CLI (`src/playtest/cli.ts`):
  - `formatReport` puts the labelled lines in Q-1 order, ending `Invariant violations: N` (`:107-124`).
  - `formatHand` prints the replay code, hole cards, board, per-street action history and result (`:141-165`).
  - `main` returns 1 when violations > 0 (`:198`), and has a `makePolicy` test seam (`:174`).
- Locked TASK-1.6 acceptance tests call only `runPlaytest(options, onHand)` and `main(argv, io)`. They check that
  report labels appear in order and that `Invariant violations: 0` is present
  (`tests/playtest/playtest.acceptance.test.ts:64-82`). Extra lines after the last label do not break them.
- CI (`.github/workflows/ci.yml`) runs no playtest yet. `tests/ci/workflow.test.ts:35-47` asserts the exact
  ordered list of `npm` commands and must gain the playtest command. `:73-78` asserts named steps.
- Speed tests: `tests/support/speed.ts` (`speedLimitsEnforced()` is false on CI). The pattern to copy is
  `tests/engine/hand-evaluator.perf.test.ts:1-4` (env-var real target, local slack floor).
- Existing code to reuse:
  - `src/engine/hand.ts` → `legalActions` (legal set), the types `Action`, `ApplyResult`, `HandState`, `Pot`.
  - `src/engine/cards.ts:44` → `formatCard` for card text in messages.
  - `src/engine/player-view.ts:62` → `playerView` (what `actWith` does, minus hiding the action).
  - `src/playtest/cli.ts:128-139` → the `actionText` wording. `describeAction` in invariants.ts uses the same words
    for player actions, and `cli.ts` may delegate to it for non-blind records.
  - `src/playtest/cli.ts:141` → `formatHand` for the action history on a violation.
  - `src/playtest/policy.ts` → `randomMovePolicy`. `tests/playtest/runner.test.ts:20-34` → `alwaysRaise` and
    `raiseToCap` policy shapes for tests.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Violation output: on runs with violations, lines are appended after `Invariant violations: N`. Clean-run output stays byte-identical to TASK-1.6. Exact text in §5 "Output". The violating hand stops and the run continues (A-3); exit 1 | (b) always print the counts line; (c) stop the whole run at the first violation; (d) a block per violating hand, capped at 10 | User-visible output was approved in TASK-1.6 Q-1. This is additive and leaves clean runs unchanged | yes | user (Q-1, `doit/TASK-1.8/qa.md`) |
| D-2 | Invariant ids and messages: `chips`, `legal-action`, `bet-cap`, `pot-eligibility`, `cards`, with the fixed message templates in §5 "Rules" (part of Q-1) | Prose names ("chip conservation", …) | Short, stable and grep-able. They match REQ-056.1's five items in order | yes | user (Q-1, `doit/TASK-1.8/qa.md`) |
| D-3 | The last parameter of `playHand`, `runPlaytest` and `main` changes from `makePolicy: PolicyFactory` to `seams: PlaytestSeams = {}` (`{makePolicy?, onAction?, engine?}`) | Add a 4th/6th positional parameter | One extensible options object for TASK-1.17 and E06. Only unit tests pass the old positional `makePolicy`, and they are updated. Locked acceptance tests do not pass it | no | n/a |
| D-4 | `checkStep` takes `{before, action, result}`. It checks `legal-action`, then (when `result.ok`) runs `checkState(result.state)` for the four state invariants. `checkState` is exported for direct use on any `HandState` | One function over the after-state only | `legal-action` needs the before-state and the proposed action. The state checks are reusable alone (TASK-1.17, engine property tests) | no | n/a |
| D-5 | `tests/ci/workflow.test.ts` (locked by TASK-1.7) is edited for AC#4: the playtest command is added to the ordered command list in `runs install, audits, lint, typecheck, build, test and e2e in that order`, and the new SPEC-08 test is added. The orchestrator unlocks the file with a reason before the build | Leave the order test alone and put the new step's assertion elsewhere (impossible, because the exact-list assertion would fail) | AC#4 requires the CI step, and `workflow.test.ts:35-47` asserts the exact command list | no | n/a (required by AC#4) |
| D-6 | The TASK-1.6 unit test `tests/playtest/runner.test.ts::counts rejected actions and over-cap streets as violations` is replaced by SPEC-06 (`stops a hand at its first violation and counts per invariant`), because over-cap hands now stop (A-3, Q-1) | Keep both | The interim A-4 semantics no longer hold | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/invariants.ts` — new: checker, ids, types, `describeAction`
- `src/playtest/runner.ts` — hook, seams, engine injection, per-hand violation, summary fields. A-4 logic removed
- `src/playtest/cli.ts` — violation block in the report. `main(argv, io, seams?)`
- `.github/workflows/ci.yml` — `Playtest` step after `Test`
- `tests/engine/invariants.test.ts` — new unit tests: every sub-check detects a hand-built corrupt state and passes
  its clean twin
- `tests/playtest/invariants.acceptance.test.ts` — new acceptance tests for AC#1, AC#2, AC#3, AC#5
- `tests/support/faulty-engine.ts` — new test helper: the five fault engines and their policies
- `tests/engine/invariants.perf.test.ts` — new: checker overhead per action
- `tests/ci/workflow.test.ts` — add the playtest command to the ordered list, plus a new AC#4 test
- `tests/playtest/runner.test.ts` — seams signature, and the over-cap hand now stops (abandoned)
- `tests/playtest/cli.test.ts` — seams signature, plus the violation-block formatting test

### Components, interfaces and data
`src/engine/invariants.ts` (imports only `./hand` and `./cards`):
```ts
export type InvariantId = 'chips' | 'legal-action' | 'bet-cap' | 'pot-eligibility' | 'cards';
/** Report order (REQ-056.1 order). */
export const INVARIANTS: readonly InvariantId[] = ['chips', 'legal-action', 'bet-cap', 'pot-eligibility', 'cards'];
export const MAX_BETS_PER_STREET = 4;           // runner.ts re-exports it (existing export kept)
export interface Violation { readonly invariant: string; readonly message: string }
export interface ActionStep {
  readonly before: HandState;   // state the action was chosen in
  readonly action: Action;      // what the policy proposed
  readonly result: ApplyResult; // what the engine answered
}
/** chips, bet-cap, pot-eligibility, cards on one state; [] when all hold. Never throws, never mutates. */
export function checkState(state: HandState): readonly Violation[];
/** legal-action for the step, then checkState(result.state) if result.ok. Results in INVARIANTS order, ≤ 1 per id. */
export function checkStep(step: ActionStep): readonly Violation[];
/** "seat 4 folds" | "seat 4 checks" | "seat 4 calls $4" | "seat 4 bets $8" | "seat 4 raises to $16" (cli.ts wording) */
export function describeAction(action: Action): string;
```
On the common path both checkers return the same shared frozen empty array, so they allocate nothing when every
invariant holds.

`src/playtest/runner.ts` additions:
```ts
export type ActionHook = (step: ActionStep) => readonly Violation[];
export interface PlaytestEngine {
  readonly createHand: (config: HandConfig) => HandState;
  readonly applyAction: (state: HandState, action: Action) => ApplyResult;
}
export interface PlaytestSeams {            // all optional; the CLI entry passes none
  readonly makePolicy?: PolicyFactory;      // default randomMovePolicy(seatGenerator(code, seat))
  readonly onAction?: ActionHook;           // default checkStep
  readonly engine?: PlaytestEngine;         // default { createHand, applyAction } from ../engine/hand
}
export interface HandViolation {
  readonly actionNumber: number;            // 1-based among player actions (blinds excluded)
  readonly action: Action;                  // the proposed action
  readonly violations: readonly Violation[];// non-empty
}
// PlayedHand gains:      readonly violation: HandViolation | null;   (violations = violation?.violations.length ?? 0)
// PlaytestSummary gains: readonly violationCounts: Readonly<Record<string, number>>; // every INVARIANTS id (0 if none) + any custom id seen
//                        readonly firstViolation: PlayedHand | null;                 // earliest violating hand
export function playHand(code, size, button, number = 1, seams: PlaytestSeams = {}): PlayedHand;
export function runPlaytest(options, onHand?, seams: PlaytestSeams = {}): PlaytestSummary;
```
`src/playtest/cli.ts`: `main(argv, io, seams?: PlaytestSeams)`. `formatReport(header, summary, mode: 'run' | 'replay' = 'run')`
appends the violation block (below); size and button for the `Replay:` line come from
`firstViolation.record` (`seats.length`, `button`). `replayHand` is unchanged and always uses the real engine.

### Rules and algorithms
1. **Hand loop.** `state = engine.createHand(...)`. While `state.toAct !== null`:
   - `action = policy(playerView(state, state.toAct))`.
   - `result = engine.applyAction(state, action)`.
   - `found = onAction({before: state, action, result})`.
   - If `!result.ok` and `found` is empty, the runner sets `found = [{invariant: 'legal-action', message: 'engine
     rejected <describeAction> (<error.code>)'}]` itself, so a hook can never loop forever on a rejection.
   - If `found` is non-empty: `violation = {actionNumber: k, action, violations: found}`; `state = result.ok ?
     result.state : state` (A-10); stop the hand.
   - Otherwise `state = result.state`.

   `record.actions` is derived from `final.actions` exactly as today (`runner.ts:93-95`). Policies are created once
   per seat per hand, as today.
2. **Summary.**
   - `violations` = Σ `hand.violations`.
   - `violationCounts[id]` = the number of hands whose `violation.violations` contains `id`.
   - `firstViolation` = the first hand with `violation !== null`.
   - All other fields are unchanged. An abandoned or violating hand counts in `foldOuts`/`showdowns` only if its
     `final.result` is non-null.
3. **legal-action** (`checkStep`). The first failing sub-check gives the message:
   - L1. `result.ok === false` → `engine rejected <A> (<code>)`.
   - L2. `action.seat !== before.toAct` → `seat <s> acted but seat <t> was to act` (`<t>` = `none` when null).
   - L3. No `a` in `legalActions(before)` has the same `type` and amount → `<A> is not in the legal set`.
   - L4. With `unit` = `smallBet` on preflop/flop and `bigBet` on turn/river:
     - bet: requires `before.currentBet === 0` and `amount === unit`.
     - raise: requires `amount === before.currentBet + unit`.
     - Otherwise → `<A> does not match the $<unit> <street> betting unit`.
   - L5. `after.actions.length === before.actions.length + 1`, and its last record has `street === before.street`,
     `seat`, `type` and amount equal to the action (fold/check: 0). Its `added` equals 0 for fold/check, `amount` for
     call/bet, and `amount - actor.streetContribution(before)` for raise. Otherwise → `history entry for <A> does not
     match the action`.

   `<A>` = `describeAction(action)`.
4. **chips** (`checkState`). Let `start` = Σ `startingStack`, `inPots` = Σ `pot.amount`, `street` = Σ
   `streetContribution`, and `won(s)` = Σ over awards of seat s's winner amounts (0 while in progress).
   - C1. Every `stack`, `streetContribution` and `totalContribution` is an integer ≥ 0, with `streetContribution ≤
     totalContribution` → `seat <s> has an invalid stack or contribution`.
   - C2. Σ `stack` + `street` + `inPots` = `start` → `table holds $<x> but the hand started with $<start>`.
   - C3. While `result === null`: `inPots` = Σ (`totalContribution` − `streetContribution`) → `pots hold $<p> but
     completed streets took $<c>`. When complete: Σ award amounts = Σ `totalContribution`, and each award's winner
     amounts sum to its `amount` → `awards pay $<a> but players put in $<c>`.
   - C4. For each player, `stack + totalContribution − won(s) === startingStack` → `seat <s> has $<x> but should have
     $<y>`.

   Example: a clean flop state, 6 seats at $160, pot $16 from preflop, seat 2 bet $4 on the flop (stack $148,
   total $12, street $4). Then Σ stack = 960 − 20 = 940, and 940 + 4 + 16 = 960 ✓. Adding $1 to seat 2 breaks C2:
   `table holds $961 but the hand started with $960`.
5. **bet-cap** (`checkState`). In one pass over `actions`, count `big-blind`/`bet`/`raise` records per street.
   - B1. `state.betCount ≤ 4` and every street count ≤ 4.
   - Otherwise → `<street> has <n> bets (at most 4)`, where n is the largest offending value and street is that
     street (for `betCount`, `state.street`).

   Example: preflop BB + raises to 8, 12, 16, 20 → count 5 → `preflop has 5 bets (at most 4)`.
6. **pot-eligibility** (`checkState`). Pot name: index 0 is `main pot`, index i ≥ 1 is `side pot <i>`.
   - P1. Each `eligible` list is ascending, has no duplicates, and lists only dealt-in seats → `<pot> has a malformed
     eligible list`.
   - P2. No eligible seat has folded → `<pot> lists seat <s>, which has folded`.
   - P3. If `pot.amount > 0`, each eligible seat has `totalContribution − streetContribution > 0` → `<pot> lists
     seat <s>, which has not contributed to it`.
   - P4. Every non-folded seat is in `pots[0].eligible` → `seat <s> holds cards but is not eligible for the main
     pot`.
   - P5. If `result !== null`, every award has `pots[award.pot]` present, and every winner is in its `eligible`,
     unfolded and has `totalContribution > 0` → `<pot> paid seat <s>, which is not eligible`.
7. **cards** (`checkState`).
   - K1. Every hole, board and burn card is an integer 0..51 → `<v> is not a card`.
   - K2. Every player has 2 hole cards. Board/burn lengths match the street (§3; a fold-out keeps its street) →
     `<street> has <b> board and <n> burn cards`.
   - K3. All hole + board + burn cards are distinct. Use a 52-entry scratch bitmap → `<card> dealt twice`, where
     `<card>` is `formatCard` (e.g. `Ah dealt twice`).
8. **Faults** (`tests/support/faulty-engine.ts`). Each fault is a `PlaytestSeams` value, plus a policy where noted.
   Each corrupts exactly one invariant:
   - `chipsCreated`: after a successful `applyAction`, it adds $1 to the actor's `stack` → `chips` (C2).
   - `illegalAccepted` + policy "always `check`": if the real engine rejects, it returns `ok: true` with the action
     appended as a record (`added: 0`). The actor is marked as acted and `toAct` moves to the next unfolded seat.
     The first preflop actor owes the big blind, so `check` is illegal → `legal-action` (L3).
   - `fifthBet` + policy "raise whenever offered" (`runner.test.ts:20-26` shape): if the real engine rejects a
     raise at 4 bets (after TASK-1.12), it re-applies with `betCount` 3 and then sets `betCount` to before + 1.
     Before TASK-1.12 the real engine already accepts → `bet-cap` (B1).
   - `ineligibleWinner`: when the returned state is complete and some seat has folded, it rewrites award 0's first
     winner to the lowest folded seat and moves that amount between the two stacks, so chips still balance →
     `pot-eligibility` (P5).
   - `duplicateCard`: `createHand` copies seat 1's first hole card into seat 2's first hole card →
     `cards` (K3) at player action 1.

### Output (stdout, appended after `Invariant violations: N` only when N > 0 — D-1/Q-1)
Run mode:
```
Violations by invariant: chips 0, legal-action 0, bet-cap 1, pot-eligibility 0, cards 0
First violation: hand 3, player action 9 (seat 2 raises to $20)
Violation: bet-cap: preflop has 5 bets (at most 4)
Replay: npm run playtest -- --replay-code 00000000000000010000000000000003 --size 3 --button 3
Hand 3: replay code …, button seat 3          ← formatHand(summary.firstViolation), unchanged format
…
Result: abandoned (invariant violation)
```
- The counts line lists the `INVARIANTS` ids in order, then any custom ids in first-seen order.
- There is one `Violation:` line per entry of `firstViolation.violation.violations`, in `checkStep` order.
- Replay mode (`--replay-code`) has already printed `formatHand` above the summary, so it appends only the counts
  line, the `First violation:` line and the `Violation:` lines. It prints no `Replay:` line and no second hand.

### Error handling and configuration
- Exit codes are unchanged: 0 = no violations, 1 = ≥ 1 violation, 2 = usage error. No new options.
- Policy or engine exceptions propagate, as today: Node prints the stack and exits 1. `checkState`/`checkStep` never
  throw on any `HandState`-shaped input. A missing pot, player or award shows up as a violation, not a crash.

## 6. Behaviour specification

### SPEC-01: Every applied action is checked; clean runs report zero
- Verifies: AC#1, DoD#6
- Behaviour: Given `runPlaytest({hands: 500, seed: 8, size: n}, onHand, {onAction: spy})` for each n in 3..10,
  where `spy` records each step and returns `checkStep(step)`, When it completes, Then:
  - the spy is called exactly `summary.playerActions` times;
  - for each call, `step.before` is the state the action was chosen in, `step.result.ok` is true and
    `checkState(step.result.state)` is `[]`;
  - `summary.violations` is 0 and every `violationCounts` value is 0.

  And `runPlaytest({hands: 10000, seed: 42, size: 6})` with default seams reports `violations` 0.
- Verification: acceptance `tests/playtest/invariants.acceptance.test.ts::AC#1 every applied action is checked and a clean run has zero violations`

### SPEC-02: Each invariant detects its corrupted state
- Verifies: AC#1, AC#2
- Behaviour: Given a clean mid-hand state S (built with `createHand` + legal actions) and, for every sub-check C1–C4,
  L1–L5, B1, P1–P5, K1–K3, a copy of S (or of a step) corrupted to break only that sub-check, When `checkState` /
  `checkStep` runs, Then:
  - the corrupt copy yields exactly one `Violation`, whose `invariant` is the expected id and whose `message` equals
    the §5 template with concrete values (e.g. `table holds $961 but the hand started with $960`);
  - S and the clean step yield `[]`.

  A complete fold-out and a complete showdown state also yield `[]`.
- Verification: unit `tests/engine/invariants.test.ts::each sub-check flags its corrupted state and passes the clean one`

### SPEC-03: Injected engine faults are reported as the right invariant
- Verifies: AC#2
- Behaviour: Given each fault in §5 rule 8 passed to `main(['--hands','20','--seed','42','--size','6'], io, seams)`,
  When the playtest runs, Then:
  - it returns 1;
  - the `Violations by invariant:` line shows ≥ 1 for that fault's invariant (`chips`, `legal-action`, `bet-cap`,
    `pot-eligibility`, `cards`) and 0 for every other built-in id;
  - `Invariant violations: N` equals the sum of the counts.

  Control: for `chipsCreated`, `ineligibleWinner` and `duplicateCard` (default policy), the same argv with default
  seams returns 0 and prints no `Violations by invariant:` line.
- Verification: acceptance `tests/playtest/invariants.acceptance.test.ts::AC#2 each injected engine fault is reported as its invariant`

### SPEC-04: A violation prints replay code, replay command and full history, exit 1
- Verifies: AC#3
- Behaviour: Given the `bet-cap` fault (`fifthBet`) with `--hands 5 --seed 1 --size 3`, When `main` runs, Then:
  - it returns 1;
  - stdout begins with the unchanged TASK-1.6 report lines through `Invariant violations: N`, followed by the
    `Violations by invariant:` line, `First violation: hand <k>, player action <i> (<A>)`, a `Violation: bet-cap:
    <street> has 5 bets (at most 4)` line, `Replay: npm run playtest -- --replay-code <code of hand k> --size 3
    --button <button of hand k>`, and then exactly `formatHand(summary.firstViolation)`;
  - that block contains every action in `firstViolation.final.actions` (blinds included), with the offending raise
    last.

  Given the `illegalAccepted` fault in replay mode (`--replay-code 000000000000002a0000000000000004 --size 6
  --button 4`), Then it returns 1. The hand block appears once, before the summary, and the appended lines have no
  `Replay:` line.
- Verification: acceptance `tests/playtest/invariants.acceptance.test.ts::AC#3 a violation prints the replay code and full action history and exits 1`

### SPEC-05: Violations detected through the per-action hook
- Verifies: AC#5
- Behaviour: Given a custom `onAction` that returns `checkStep(step)` plus `{invariant: 'test-probe', message:
  'probe fired'}` on the 3rd player action of hand 2 only, When `main(['--hands','4','--seed','42','--size','6'],
  io, {onAction})` runs, Then:
  - it returns 1, and `Invariant violations: 1`;
  - the counts line ends `cards 0, test-probe 1`;
  - `First violation: hand 2, player action 3 (…)` and `Violation: test-probe: probe fired` are printed;
  - the hand block is `formatHand` of hand 2, whose history has exactly 2 blinds + 3 player actions;
  - hands 3–4 are still played (`Hands played: 4`).
- Verification: acceptance `tests/playtest/invariants.acceptance.test.ts::AC#5 the per-action hook reports a violation with formatHand and exit 1`

### SPEC-06: Runner stopping rules and seams
- Verifies: AC#1, AC#5
- Behaviour: Given the runner's stopping rules (§5 rule 1), Then:
  - Given a policy that always proposes `{raise, 999}` and default seams, When `runPlaytest({hands: 3, seed: 1,
    size: 3}, onHand, {makePolicy})` runs, Then `violations` is 3 and `violationCounts['legal-action']` is 3. Each
    `final` equals the post-blind state, `violation.actionNumber` is 1 and its message is `engine rejected seat <s>
    raises to $999 (illegal-action)`.
  - Given a hook that always returns `[]`, Then the runner still stops each hand with that `engine rejected …`
    violation.
  - Given `alwaysRaise` with the real engine, Then each over-cap hand stops at the 5th bet: `final.result` is null,
    `final.betCount` is 5, and `foldOuts + showdowns` < 3.
  - `firstViolation` is the earliest violating hand.
- Verification: unit `tests/playtest/runner.test.ts::stops a hand at its first violation and counts per invariant`

### SPEC-07: Violation block formatting and replay-mode variant
- Verifies: AC#3, AC#5
- Behaviour: Given a fixed `PlaytestSummary` with violations 2 (`legal-action` 1, `cards` 1, from one hand) and a
  scripted `firstViolation`, When `formatReport` is called for run mode and for replay mode, Then the output equals
  the §5 text exactly (full-string compare). With violations 0, the output is byte-identical to the TASK-1.6 format
  (existing `formats the report and a hand exactly` expectation unchanged).
- Verification: unit `tests/playtest/cli.test.ts::appends the violation block only when there are violations`

### SPEC-08: CI runs a 10,000-hand playtest that can fail the workflow
- Verifies: AC#4
- Behaviour: Given `.github/workflows/ci.yml`, When parsed as text, Then:
  - a step `- name: Playtest` runs exactly `npm run playtest -- --hands 10000 --seed 42`;
  - it comes after `npm test` and before `npm run e2e` in the ordered command list (the existing order test is
    updated to include it);
  - it has no `if:`, `continue-on-error` or `|| true`.

  And on the story branch the CI run's `Playtest` step concludes `success`, with log containing `Hands played:
  10000` and `Invariant violations: 0`.
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > runs a 10,000-hand playtest step that fails the job on a non-zero exit`

### SPEC-09: Checker speed budget
- Verifies: AC#1
- Behaviour: Given 10,000 6-max hands (seed 42) run twice, once with `onAction: () => EMPTY` and once with
  `checkStep` (after a 1,000-hand warm-up), When timed, Then (checked − unchecked) / playerActions ≤
  `INVARIANTS_MAX_US_PER_ACTION` (default 10; real target 2 on the reference machine). The numbers are printed;
  the limit is not enforced when `CI=true`.
- Verification: unit `tests/engine/invariants.perf.test.ts::checker overhead stays within the per-action budget`

### SPEC-10: Checks pass, coverage, boundaries, network
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` run, Then:
  - all exit 0 and coverage thresholds hold (`src/engine/invariants.ts` ≥ 90% lines);
  - `git diff --stat main -- src/engine/hand.ts` is empty;
  - `src/engine/invariants.ts` imports only `./hand` and `./cards` (the headless lint passes);
  - `grep -nE "fetch\(|http|node:" src/engine/invariants.ts src/playtest` finds nothing new.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-11: CI green, docs, and non-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the finished branch, Then:
  - DoD#6: given the branch, `npm run playtest -- --hands 10000 --seed 42` exits 0 with `Invariant violations: 0`.
  - DoD#10: the CI workflow is green.
  - DoD#11: the story document is published with `backlog doc create`.
  - DoD#3 (golden spots, from E07-S14), DoD#7 and DoD#12 (no screen) and DoD#9 (no strategy content) are N/A.
- Verification: manual `npm run playtest -- --hands 10000 --seed 42; echo $?` → `Invariant violations: 0`, `0`; `gh run list --branch doit/TASK-1.8 --limit 1` → success; `backlog doc list --plain` lists the TASK-1.8 document

## 7. Edge cases
- Rejected action (engine says no): SPEC-06 (runner-added violation even with a silent hook).
- Several invariants broken by one action: one line each, in `INVARIANTS` order (SPEC-07 uses two).
- Violation on the last action of a hand (fold-out or showdown completion), e.g. `ineligibleWinner`: `final.result`
  is non-null, so the hand counts as a fold-out or showdown and `formatHand` prints the (bad) result line. Covered
  by SPEC-03.
- Violation at player action 1 (fault from the deal): `duplicateCard`, SPEC-03.
- Complete states (fold-out keeps its street, showdown street): SPEC-02 clean cases.
- Preflop pot of $0 listing seats that have not contributed: P3 applies only to pots holding chips (A-9), covered
  by the SPEC-02 clean cases.
- Custom invariant ids from hooks: SPEC-05.
- `--hands 1` with a violation: first and last replay codes are equal, and the block still prints. No special
  handling.
- Concurrency, permissions, interruption, dependency failure: N/A (single synchronous process; no files or network).

## 8. Security considerations
- No new trust boundary or CLI option. Violation messages contain only numbers, seat numbers, fixed words and
  `formatCard` text produced by the program, never raw argv.
- The `Replay:` line prints the normalised replay code (hex), size and button.
- The CI step uses no secrets. Permissions stay `contents: read`.
- No new dependencies. Randomness is unchanged: deterministic, non-cryptographic seeds for playtests (TASK-1.6 D-2).
- The test-only fault helper lives under `tests/`. It is excluded from the app build and never imported from `src/`.

## 9. Non-functional
- Checker overhead: ≤ 2 µs mean per action on the reference machine (real target), ≤ 10 µs local slack floor
  (SPEC-09). Baseline engine + runner ≈ 0.8 µs/action.
- `npm run playtest -- --hands 10000 --seed 42` stays < 60 s (locked TASK-1.6 SPEC-01 timeout). Expected ≈ 1.5 s.
- Memory O(1) in hands: the summary keeps only `firstViolation`.
- Determinism: violation output depends only on argv (REQ-062.4). Clean-run output is byte-identical to TASK-1.6.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests (path → SPEC ids):
  - `tests/playtest/invariants.acceptance.test.ts` → SPEC-01, SPEC-03, SPEC-04, SPEC-05 (in process via `main` and
    `runPlaytest`; per-test timeout 120,000 ms)
  - `tests/engine/invariants.test.ts` → SPEC-02
  - `tests/playtest/runner.test.ts` → SPEC-06 (replaces `counts rejected actions and over-cap streets as violations`)
  - `tests/playtest/cli.test.ts` → SPEC-07 (and its `main` calls switch to `{makePolicy}`)
  - `tests/ci/workflow.test.ts` → SPEC-08
  - `tests/engine/invariants.perf.test.ts` → SPEC-09
- End-to-end scenario for the Judge:
  1. Run `npm run playtest -- --hands 10000 --seed 42` twice and `diff` the outputs. They should be identical, with
     exit 0, `Invariant violations: 0` and no `Violations by invariant` line.
  2. Run `npx vitest run tests/playtest/invariants.acceptance.test.ts` and read one printed violation block from a
     fault test, e.g. by temporarily logging `out`.
  3. Paste the block's `Replay:` command (with the real engine). It reproduces the same hand with exit 0, which
     shows the fault was in the injected engine, not in the deal.
  4. Check that the CI run on `doit/TASK-1.8` shows a `Playtest` step.

## 11. Open questions
None. Q-1 was answered on 2026-11-18 with the recommended option (`doit/TASK-1.8/qa.md`): the detail block is printed only when N > 0, the violating hand stops and the run continues, and the run exits 1. Recorded as D-1, D-2 and A-3.

### Follow-ups (not in scope; candidate tasks)
- TASK-1.9: extend `checkStep` L4/L5 and chips C3/C4 for all-in calls (call amount < owe) and uncalled-bet returns.
- TASK-1.10: tighten pot-eligibility P3/P5 so that each eligible seat contributed at least the pot's level, and
  check that side-pot amounts equal their contribution layers.
- TASK-1.12: once the engine caps, add a unit test that a fifth raise is no longer in `legalActions`. Keep `bet-cap`
  as the independent check, and drop the policy's `betCount >= 4` filter.
- TASK-1.16: add a cross-hand chip-conservation check, where each seat's next starting stack = its final stack,
  once real stacks carry over.
- TASK-1.17: combine shard summaries including `violationCounts`, and keep the default `onAction` (`checkStep`) in
  every shard.
- TASK-6.9 / E06: compose style-check hooks with `checkStep` through `PlaytestSeams.onAction` rather than adding a
  new runner seam.
- New: add a deal-order invariant, where hole/board/burn cards equal `deck` positions per D-5 (`hand.ts:338-351`).
- New: add `src/playtest` to `HEADLESS_DIRS` in `tools/lint/headless-boundary.js` (carried over from TASK-1.6).

## 12. Clarifications log
See `doit/TASK-1.8/qa.md`.
