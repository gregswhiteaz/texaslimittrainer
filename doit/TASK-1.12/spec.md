# Spec: TASK-1.12 — Cap each street at one bet plus three raises

Status: READY (approved 2026-11-20)
Task: TASK-1.12 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-016.2, REQ-016.3, REQ-016.4 · Dream: limit-holdem-trainer

## 1. Summary
The engine's `legalActions` stops offering a raise once a street has 4 bets (bet + 3 raises; preflop the big
blind is the first bet), for any table size including heads-up, so `applyAction` rejects a fifth bet. The playtest's
random-move policy drops its interim "never make a fifth bet" filter and draws straight from the engine's legal set;
because that filter removed exactly the entries the engine now omits, every playtest report stays byte-identical.
Preflop advice reads its cap from the engine constant, and the invariant checker keeps its own independent bet-cap
check.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: export `STREET_BET_CAP = 4`; `legalActions` omits `raise` when `state.betCount >= STREET_BET_CAP`.
  - `src/playtest/policy.ts`: `randomMovePolicy` draws uniformly over `view.legalActions` (no betCount filter).
  - `src/advice/preflop.ts`: replace the local `const CAP = 4` with the engine's `STREET_BET_CAP`.
  - Test fixtures and unit tests that assumed an uncapped engine (listed in §5).
  - New acceptance tests for AC#1–AC#4 and AC#6's engine half.
- Not doing:
  - Short all-in bets/raises and the half-bet reopening rule (REQ-016.5; TASK-1.14).
  - Rejection messages and "state unchanged" guarantees for illegal actions (TASK-1.13); this task relies on the
    existing `illegal-action` rejection only.
  - Any UI change: the action bar already renders `legalActions`, so capped streets show no Raise automatically;
    capped-street UX is TASK-3.7.
  - Changing `MAX_BETS_PER_STREET`, the bet-cap message, `cappedStreets` or the playtest report format.
  - Changing `minimumStack` or the A-4 stakes bound.
  - Editing any locked test other than the single Q-1 edit.
- Scope budget: files=9, lines=360

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The engine constant is named `STREET_BET_CAP` and lives in `src/engine/hand.ts`; the invariant checker keeps its own `MAX_BETS_PER_STREET = 4` (`src/engine/invariants.ts:21`) and does not import the engine constant. | yes | AC#6 asks for the checker to stay independent of the engine cap; one shared constant would let a single wrong edit break both. | Import one constant everywhere (rejected: defeats AC#6). |
| A-2 | The `bet` branch of `legalActions` needs no cap guard: `bet` is offered only when `currentBet === 0`, which means `betCount === 0` on that street (`src/engine/hand.ts:279-282`, `:402`, `:440`). | yes | No reachable state has a bet offered at 4 bets. | Guard it as well (dead code that can't be covered). |
| A-3 | The AC#4 run is 100,000 hands split over sizes 2–10 (11,112 hands at size 2 and 11,111 at each of 3–10), using `randomMovePolicy` through `runPlaytest` with seeds `1200 + size`. | yes | Measured at ~2.7 s locally with full invariant checks (72,650 capped streets), so it fits CI time; random play hits the cap often, so the test isn't vacuous. | One size per hand from a seeded draw (needs a new runner seam). |
| A-4 | The `fifthBet` fault fixture changes how it injects the fault: after an accepted action that leaves 4 or more bets on a street of an unfinished hand, it reports `betCount: 3`, so the real engine offers (and accepts) a fifth raise that the checker must catch from the action records. | yes | Now that the engine caps, the old fixture can't produce a fifth bet without also creating a `legal-action` violation, and locked `tests/playtest/invariants.acceptance.test.ts` (TASK-1.8) requires the fault to show as `bet-cap` only. Checked against a patched copy: AC#2 and AC#3 there pass unchanged. | Force the raise outside the legal set (fails the locked TASK-1.8 test with an extra `legal-action` violation). |

## 3. Current system
- Engine: `legalActions` (`src/engine/hand.ts:258-282`) returns fold, check, call, bet, raise in that order;
  `canRaise` (`:268`) checks only the stack. `applyAction` accepts only actions in that set (`:486-490`) and
  increments `betCount` on bet/raise (`:526`). `betCount` starts at 1 preflop (`:235`, big blind) and resets to 0 on
  each new street (`:440`) and on fold-out (`:402`). `HandState.betCount` is documented as "Bets + raises this street;
  the big blind counts as 1 preflop" (`:94-95`).
- Player view copies `legalActions(state)` for the seat to act (`src/engine/player-view.ts:103`), so policies,
  advice and the UI all see the engine set.
- Playtest policy: `randomMovePolicy` (`src/playtest/policy.ts:11-21`) filters bet/raise when `view.betCount >= 4`
  and then draws `allowed[rng.nextInt(allowed.length)]`. The default policy is TAG at 6 players and random-move at
  other sizes (`src/playtest/runner.ts:98-103`).
- Advice: `recommendPreflop` (`src/advice/preflop.ts:76-117`) uses `canRaise = view.betCount < CAP && legalActions
  has raise` with `const CAP = 4` (`:46`, `:92`); a capped raise becomes a call.
- Invariants: `MAX_BETS_PER_STREET = 4` (`src/engine/invariants.ts:21`); `betCapMessage` (`:188-207`) counts
  big-blind/bet/raise records per street and also checks `state.betCount`. `legalActionMessage` (`:61-70`) flags any
  accepted action not in `legalActions(before)`.
- Fault fixtures: `tests/support/faulty-engine.ts:68-75` (`fifthBet`) and `:141-167` (`FAULTS`).
- Tests: Vitest (`npm test` = `vitest run --coverage`), fast-check for property tests, ESLint + Prettier
  (`package.json` scripts). Test helpers worth copying: `newHand`/`play` scripting in
  `tests/engine/heads-up.acceptance.test.ts:15-40`; the preflop and turn 4-bet scripts `PREFLOP_4`/`TURN_4` in
  `tests/playtest/policy.test.ts:26-44`.
- Existing code to reuse:
  - `src/playtest/runner.ts` `runPlaytest` / `PlayedHand.final.actions` → the AC#4 100k run (with the default
    `checkStep` hook, so it also proves zero invariant violations).
  - `src/playtest/policy.ts` `randomMovePolicy`, `seatGenerator` → AC#4 policy factory.
  - `tests/support/faulty-engine.ts` `FAULTS.fifthBet` → AC#6 checker-independence proof.
  - `src/engine/invariants.ts` `checkState` → unit check that a 5-bet state is still flagged.

### Tests affected by the engine cap (verified by running the suite against a patched copy)
| File | Locked? (owner) | Effect | Action |
|---|---|---|---|
| `tests/engine/chip-safety.acceptance.test.ts` — "AC#1 the worst legal hand at the stack bound…" | **locked (TASK-1.31)** | fails: with the cap, the worst capped hand at stakes 2^45 puts in only ~62% of `MAX_SAFE_INTEGER`, below its `> 0.9 * MAX` check | D-3 (Q-1) |
| `tests/playtest/invariants.acceptance.test.ts` AC#2, AC#3 | locked (TASK-1.8) | fails with the old `fifthBet` fixture; passes unchanged with A-4 fixture | fixture only (A-4); no edit |
| `tests/playtest/runner.test.ts` "stops a hand at its first violation…" | no | relied on the real engine accepting a fifth raise (`alwaysRaise`, `final.betCount` 5) | rewrite the over-cap part with `FAULTS.fifthBet.seams` |
| `tests/playtest/runner.test.ts` "fault engines fail fast…" | no | passes with the A-4 fixture | none |
| `tests/playtest/policy.test.ts` "never bets or raises once the street has 4 bets" | no | the engine no longer offers the raise | replace (SPEC-08) |
| `tests/engine/hand.property.test.ts` (TASK-1.4), `tests/engine/side-pots.property.test.ts` (TASK-1.10), `tests/engine/player-view.property.test.ts` (TASK-1.5), `tests/bots/tag.acceptance.test.ts` (TASK-6.1) | locked | their `betCount >= 4` filters become no-ops; still pass | none |
| `tests/playtest/runner.acceptance.test.ts` (TASK-1.6), `tests/playtest/playtest.acceptance.test.ts` (TASK-1.6), `tests/advice/preflop.acceptance.test.ts` (TASK-7.2), all `tests/ui`, `tests/table` | locked / no | pass | none |

### Playtest baseline
Byte-identical. `legalActions` lists raise last, and when `betCount >= 4` the old filter removed exactly the
bet/raise entries (bet is never offered then, A-2). So the engine's capped set is the same array, in the same
order, that `randomMovePolicy` already drew from with `nextInt(length)`: same draw, same action, same RNG stream.
TAG (6-max) already downgraded capped raises via `recommendPreflop`. Checked on a patched copy: `npm run playtest --
--hands 10000 --seed 42 --size N` gives identical output for N = 2, 3, 6, 9, 10 (6-max: fold 5470, showdown 4530,
actions 88831, capped 244, Largest pot $70).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The cap is enforced in `legalActions` (the single source `applyAction`, views, advice and UI already use); `applyAction` gains no separate check. | A separate check in `applyAction` | `applyAction` already rejects anything outside `legalActions` with `illegal-action` (`src/engine/hand.ts:486-490`). | no | n/a |
| D-2 | `recommendPreflop` keeps its `betCount < cap` clause, now reading `STREET_BET_CAP`, so the advice rule and the engine cap can't drift. | Delete the clause (legalActions alone suffices) | AC#5 asks for the advice rule to agree with the engine; keeping it by name makes that visible and testable. | no | n/a |
| D-3 | In the locked `tests/engine/chip-safety.acceptance.test.ts` (TASK-1.31), case "AC#1 the worst legal hand at the stack bound…", change only `createHand(config())` to `createHand(config({ stakes: boundStakes(56_294_995_342_130) }))` (the largest stake the A-4 bound allows); every assertion stays as it is. | Lower the threshold to 0.6 (weakens); delete the case | The locked test assumed uncapped raising, which contradicts REQ-016; at the new stake each seat puts in 900,719,925,474,088 and the award is ~99.99% of MAX, so the test is no weaker. Unlock recorded under TASK-1.31. | yes | Q-1 (auto-accepted) |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — export `STREET_BET_CAP`; cap `canRaise`.
- `src/playtest/policy.ts` — remove the betCount filter; update the doc comment.
- `src/advice/preflop.ts` — import `STREET_BET_CAP` from `../engine/hand`; drop `const CAP`.
- `tests/engine/bet-cap.acceptance.test.ts` — new: SPEC-01..07.
- `tests/engine/invariants.test.ts` — add SPEC-07's unit half.
- `tests/playtest/policy.test.ts` — replace the filter test (SPEC-08).
- `tests/playtest/runner.test.ts` — over-cap part via `FAULTS.fifthBet.seams`.
- `tests/support/faulty-engine.ts` — `fifthBet` per A-4; update its doc comment.
- `tests/engine/chip-safety.acceptance.test.ts` — locked (unlock recorded under TASK-1.31); only the D-3 stake edit.

### Components, interfaces and data
- `export const STREET_BET_CAP = 4;` in `src/engine/hand.ts`, with a doc comment: "Most bets per street: a bet and
  three raises; preflop the big blind is the first bet (REQ-016.2–016.4)."
- `legalActions(state)`: `canRaise = state.betCount < STREET_BET_CAP && raiseTo - player.streetContribution <=
  player.stack`. Signature, order and every other branch stay the same.
- `randomMovePolicy(rng)`: `allowed = view.legalActions`; still throws `RangeError` when it is empty; still one
  `nextInt` draw per decision. Doc comment: "uniform over view.legalActions (the engine enforces the 4-bet cap)".
- `recommendPreflop`: `canRaise = view.betCount < STREET_BET_CAP && view.legalActions.some(raise)`.
- `fifthBet(state, action)` fixture:
  ```ts
  const result = applyAction(state, action);
  if (!result.ok || result.state.result !== null || result.state.betCount < 4) return result;
  return { ok: true, state: { ...result.state, betCount: 3 } };
  ```
  Doc comment: "bet-cap (B1): hides the fourth bet from the engine, so it offers and accepts a fifth; the checker
  must catch it from the action records."
- `src/engine/invariants.ts` doesn't change and must not import `STREET_BET_CAP`.

### Rules and algorithms
- Cap = 4 bets per street, any table size 2–10. Bets counted: preflop big blind (1) + raises; postflop bet (1) +
  raises. When `betCount === 4` the seat to act that still owes chips gets exactly `[fold, call]`, with
  call = `min(owed, stack)`.
- Worked examples at $4/$8 (smallBet 4, bigBet 8):
  - 6-max preflop, button 1: seat 4 raises to 8, seat 5 to 12, seat 6 to 16 → seat 1 gets
    `[{fold}, {call, 16}]`; seat 1 raising to 20 is rejected with `illegal-action`.
  - 3 seats, turn: seat 2 bets 8, seat 3 raises to 16, seat 1 to 24, seat 2 to 32 → seat 3 gets
    `[{fold}, {call, 16}]`.
  - Heads-up, button 1 (SB $2), seat 2 BB $4: seat 1 raises to 8, seat 2 to 12, seat 1 to 16 → seat 2 gets
    `[{fold}, {call, 4}]`.
  - Heads-up flop (after preflop call/check): bet 4, raise 8, raise 12, raise 16 → the other seat gets
    `[{fold}, {call, 4}]`.

### Error handling and configuration
- A raise at the cap returns `{ ok: false, error: { code: 'illegal-action', message: 'Illegal action for seat
  <n>' } }` (the existing message, `src/engine/hand.ts:490`); the input state is not changed.
- No new configuration.

## 6. Behaviour specification

### SPEC-01: Preflop caps after the big blind and three raises
- Verifies: AC#1
- Behaviour: Given a 6-seat $4/$8 hand, button 1, $160 stacks, When seats 4, 5, 6 raise to 8, 12, 16 (betCount 4),
  Then `legalActions` for seat 1 is exactly `[{seat:1,type:'fold'}, {seat:1,type:'call',amount:16}]`, the same
  holds for each later seat still to act (seat 2 call 14, seat 3 call 12 after earlier folds/calls), and
  `applyAction` with `{seat:1,type:'raise',amount:20}` returns `ok:false` with code `illegal-action`. Control: after
  only two raises (betCount 3) a raise to 16 is offered.
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#1 preflop allows the big blind plus three raises, then only call or fold`

### SPEC-02: Flop, turn and river cap after a bet and three raises
- Verifies: AC#2
- Behaviour: Given a 3-seat $4/$8 hand that reaches each of the flop, turn and river, When a bet and three raises are
  made on that street (flop 4/8/12/16, turn and river 8/16/24/32), Then the next seat's legal actions are exactly
  fold and call (call 12 on the flop, 24 on turn/river), and a raise one unit higher is rejected `illegal-action`.
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#2 flop, turn and river allow a bet plus three raises, then only call or fold`

### SPEC-03: Heads-up cap preflop and on the flop
- Verifies: AC#3
- Behaviour: Given a heads-up $4/$8 hand where button seat 1 posted $2 and seat 2 posted $4, When seat 1 raises to 8,
  seat 2 to 12 and seat 1 to 16, Then seat 2's legal actions are exactly `[fold, call 4]`. Given a heads-up flop
  (preflop: button calls, big blind checks), When the first player bets 4 and raises to 8, 12, 16 alternate, Then the
  player to act has exactly `[fold, call 4]`.
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#3 heads-up caps preflop at the big blind plus three raises and the flop at four bets`

### SPEC-04: 100,000 random seeded hands never exceed 4 bets on a street
- Verifies: AC#4, DoD#6
- Behaviour: Given `runPlaytest` with `makePolicy: (code, seat) => randomMovePolicy(seatGenerator(code, seat))`
  for sizes 2–10 (A-3: 11,112 hands at size 2, 11,111 at each other size, seed `1200 + size`, 100,000 in total),
  When every hand is played, Then for every `PlayedHand` the count of big-blind/bet/raise records per street in
  `final.actions` is at most 4, at least one street reaches exactly 4 (non-vacuous), every summary reports 0
  violations, and the hand totals sum to 100,000. Test timeout 60 s.
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#4 100,000 random seeded hands with 2 to 10 players never put more than 4 bets on a street`

### SPEC-05: A fifth bet is not legal
- Verifies: AC#6
- Behaviour: Given any state with `betCount === 4` reached by the SPEC-01/02 scripts, When `legalActions` is read,
  Then no entry has type `raise` or `bet`, and `STREET_BET_CAP === 4`; When the fifth raise is applied, Then
  `applyAction` returns `ok:false`, code `illegal-action`.
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#6 a fifth raise is not legal`

### SPEC-06: Advice and engine agree on a capped street
- Verifies: AC#5
- Behaviour: Given the 6-max preflop view at 4 bets (seat 1 after seats 4, 5, 6 raise to 8, 12, 16) for a hand
  whose chart action is raise (e.g. `As Ah`), When `legalActions` and `recommendPreflop` are consulted, Then the
  view's legal set has no raise, `recommendPreflop(view).action` is `'call'` and its `alternative` is not
  `'raise'`, and the advice's cap equals the engine's (`STREET_BET_CAP === 4` is what `src/advice/preflop.ts`
  uses; at betCount 3 the same hand is advised `raise`).
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#5 legalActions and recommendPreflop both withhold the raise at 4 bets`

### SPEC-07: The checker's bet-cap check stays independent of the engine cap
- Verifies: AC#6
- Behaviour: Given `FAULTS.fifthBet.seams` (A-4) at `--size 6 --seed 42`, When `runPlaytest` plays 20 hands, Then
  `violationCounts['bet-cap'] >= 1` and every other count is 0, and the first violation message is
  `<street> has 5 bets (at most 4)`. Given a hand state whose action records hold 5 bets on one street but whose
  `betCount` is 3, When `checkState` runs, Then it returns a `bet-cap` violation. `src/engine/invariants.ts` contains
  no reference to `STREET_BET_CAP`.
- Verification: acceptance `tests/engine/bet-cap.acceptance.test.ts::AC#6 the invariant checker still catches a fifth bet the engine was tricked into accepting`; unit `tests/engine/invariants.test.ts::bet-cap counts action records, not the engine cap`

### SPEC-08: The playtest policy has no betCount filter
- Verifies: AC#6
- Behaviour: Given a view at 4 bets whose `legalActions` was hand-built to include a raise (a synthetic view, not
  from the engine), When `randomMovePolicy` decides over 1,000 seeds, Then `raise` is among its choices (it draws
  over `view.legalActions` unfiltered); Given the real capped spots PREFLOP_4 and TURN_4, Then its choices are
  exactly `{call, fold}` because the engine offers nothing else. `src/playtest/policy.ts` contains no `betCount`.
- Verification: unit `tests/playtest/policy.test.ts::draws from the engine's legal set without its own bet-cap filter`

### SPEC-09: Playtest report unchanged and checks pass
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#6, DoD#10
- Behaviour: Given the change, When `npm run playtest -- --hands 10000 --seed 42 --size 6` runs, Then it exits 0
  with `Ended by fold: 5470`, `Ended at showdown: 4530`, `Player actions: 88831`, `Streets capped at 4 bets: 244`,
  `Largest pot: $70`, `Invariant violations: 0`; and `npm run lint`, `npm run typecheck`, `npm test` (coverage
  thresholds included) all exit 0 with no engine/advice imports of UI code.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42 --size 6`

### SPEC-10: Story documentation and N/A DoD items
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: Given the task is done, Then a Backlog doc describes the cap, the policy change and the fixture
  change; DoD#3 (golden-spot suite not yet created), DoD#7 and DoD#12 (no screen added or changed), DoD#8 (no
  network code touched) and DoD#9 (no strategy content) are N/A and recorded as such.
- Verification: manual `backlog doc list --plain` shows the TASK-1.12 doc; `git diff --stat main` touches no `src/ui` file and no chart JSON

## 7. Edge cases
- Boundary: exactly 3 bets → raise offered (SPEC-01 control, SPEC-06); exactly 4 → not offered (SPEC-01..05).
- Heads-up (2 seats) → SPEC-03, SPEC-04.
- 10 seats → SPEC-04 (size 10).
- Short stack at the cap: call is `min(owed, stack)` (unchanged, covered by existing all-in tests and SPEC-04's
  random play).
- Player owes nothing at 4 bets: can't happen (the round closes once everyone has matched; A-2).
- New street resets the count: SPEC-02 plays a capped flop then a capped turn and river in one hand.
- Invalid input: a raise at the cap → SPEC-01/05 (`illegal-action`).
- Concurrency, permissions, dependency failure: N/A (pure synchronous functions).

## 8. Security considerations
- Trust boundaries: none new; actions enter through `applyAction`, which validates against `legalActions`.
- Authn/authz, secrets, injection, logging: N/A.
- New dependencies: none.
- Randomness: unchanged (seeded Xoshiro128 for reproducible playtests; not a fairness surface here).

## 9. Non-functional
- AC#4 test: ≤ 60 s timeout; measured ~2.7 s locally for 100,008 hands with full invariant checks.
- Playtest output byte-identical to the baseline (SPEC-09).
- Coverage: `legalActions` keeps 100% branch coverage (both sides of the cap clause are exercised).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6`
- E2E check (builder must run): `npx playwright test e2e/action-bar.spec.ts e2e/table.spec.ts`. These use raises in the UI and weren't run during spec research.
- New tests (path → SPEC ids):
  - `tests/engine/bet-cap.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06, SPEC-07
  - `tests/engine/invariants.test.ts` → SPEC-07
  - `tests/playtest/policy.test.ts` → SPEC-08
- End-to-end scenario for the Judge:
  1. `npm run playtest -- --hands 10000 --seed 42 --size 6` → exit 0; fold 5470, showdown 4530, actions 88831,
     capped 244, Largest pot $70, `Invariant violations: 0`.
  2. `npm run playtest -- --size 2` and `--size 10` → exit 0, `Invariant violations: 0`.
  3. `grep -n betCount src/playtest/policy.ts` → no output; `grep -n STREET_BET_CAP src/engine/invariants.ts` → no
     output.
  4. `npm test` → all pass, including the locked TASK-1.8 invariants acceptance test unchanged.
  5. `npx playwright test e2e/action-bar.spec.ts e2e/table.spec.ts` (Chromium and WebKit) → all pass. These e2e specs use raises, and they weren't run during spec research, so the builder must run them after the engine change and before handing over.

## 11. Open questions
- None. Q-1 answered (auto-accepted recommended option (a)); see D-3 and `doit/TASK-1.12/qa.md`.

## 12. Clarifications log
See `doit/TASK-1.12/qa.md`.
