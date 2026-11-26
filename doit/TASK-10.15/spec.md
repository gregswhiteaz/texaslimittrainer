# Spec: TASK-10.15 — Simplify preflop leak pairing in src/stats/leaks.ts

Status: READY (approved 2026-11-26)
Task: TASK-10.15 · Parent/epic: TASK-10 · Requirements: n/a (follow-up from TASK-10.6 review, doc-131) · Dream: limit-holdem-trainer

## 1. Summary
A pure refactor of `handCategoryDecisions` in `src/stats/leaks.ts`, from two TASK-10.6 review notes (doc-131).
At the moment it rebuilds the dealt-in seat list and recomputes the user's position group for every paired preflop
decision, although both are fixed for the hand. It also repeats the "user's non-blind action" test that
`userMade` in `src/table/hand-record.ts` already does. After this task the group is computed at most once per hand,
and the pairing uses `userMade`. Every result, every thrown error and every existing test stays exactly as it is.

## 2. Scope
- In scope:
  - `src/table/hand-record.ts`: export the existing `userMade` helper. Its body and behaviour do not change.
  - `src/stats/leaks.ts`: `handCategoryDecisions` pairs decisions over `userMade(hand.actions, hand.userSeat)` and
    computes the seat list and the user's `positionGroup` at most once per hand, the first time a preflop decision
    pairs.
  - One new unit test file, `tests/stats/preflop-pairing.test.ts`.
- Not doing:
  - No change to the outputs of `handCategoryDecisions`, `positionGroup`, `preflopAction`, `decisionCategory`,
    `categoryCounts`, `sessionLeaks` or `sessionReport`. No change to the `CategoryHand`/`CategoryDecision` types
    or the pairing rule (TASK-10.6 A-3).
  - No edit to any existing test file, locked or not (see §3 for the locked ones).
  - No change to `leak-categories.json`, docs, UI, stored data or `src/table/session-report.ts`.
  - No other refactor of `hand-record.ts` (for example the two `userMade` call sites there stay as they are).
- Scope budget: files=3, lines=110

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The group is computed lazily: on the first preflop decision that pairs, then reused. It is not computed eagerly before the loop. | yes | Eager computation would throw `RangeError('Seat N is not dealt in')` for a `CategoryHand` whose user seat is not in `seats` even when no preflop decision pairs. Today that hand does not throw. Lazy keeps results and errors identical, and still meets "once per hand". | Compute eagerly whenever `button` is set (stored records are validated so the user seat and button are dealt in, `src/table/hand-record.ts:345,493`, but `CategoryHand` is a structural type) |
| A-2 | Reuse is done by exporting `userMade` as is, not by extracting a new per-record predicate. | yes | AC#2 says "reuses the hand-record helper". Exporting is a one-word change. The `raisedBefore` flag still needs a walk over all actions, which is done by matching each action record against the next `userMade` entry by reference (§5). | Export a new `isUserAction(record, userSeat)` predicate and have `userMade` call it |
| A-3 | The new test goes in a new file, not in `tests/stats/preflop-leaks.test.ts`. | yes | The AC says the existing leak tests pass "unchanged". A new file keeps every existing test file byte-identical, which SPEC-04 checks with `git diff`. | Add an `it` to `tests/stats/preflop-leaks.test.ts` |

## 3. Current system
- `src/stats/leaks.ts:238-266`: `handCategoryDecisions`. With a `button`, it walks `hand.actions`. A record is the
  user's non-blind action when `record.seat === userSeat && type !== 'small-blind' && type !== 'big-blind'`
  (`:245-249`). That is the duplicate of `userMade`. The j-th such record pairs with `decisions[j]`. On a preflop
  match it rebuilds `hand.seats.map((s) => s.seat)` and calls `positionGroup(seats, button, userSeat)` for each
  match (`:256-257`). `raisedBefore` becomes true after any preflop `raise` record, including the user's own
  (`:261`).
- `src/stats/leaks.ts:161-181`: `positionGroup` throws `RangeError` when the seat or button is not dealt in.
- `src/table/hand-record.ts:137-141`: `userMade(actions, userSeat: unknown): ActionRecord[]` is a module-private
  `filter`. It returns the same record objects in order. It is used at `:230` and `:446`.
- Imports: `src/stats/leaks.ts:1-4` has only type imports from advice/engine plus the JSON. `src/stats/trends.ts:5-7`
  already imports runtime values from `src/table/*`, so a `stats` → `table` import is an existing pattern. There is
  no cycle: `hand-record.ts` and the modules it imports at runtime (`advice/grade`, `advice/postflop`,
  `advice/recommend`, `engine/deck`, `table/session`) do not import `stats/leaks`. Only
  `src/table/session-report.ts` and `src/ui/report/ReportScreen.tsx` import it (grep for `stats/leaks'` under
  `src`). The headless boundary lint (`tools/lint/headless-boundary.js:7`) allows `stats` → `table`.
- Callers: `src/table/session-report.ts:203` is the only production caller of `handCategoryDecisions`.
- Tests: Vitest via `npm test` (coverage, 90% headless threshold). Pairing behaviour is covered by
  `tests/stats/preflop-leaks.test.ts::handCategoryDecisions pairs preflop decisions with their action records`
  (`:84-222`) and by `tests/stats/preflop-leaks.acceptance.test.ts` AC#4–AC#6.
- Locked tests (must not change, all pass unchanged):
  - `tests/stats/preflop-leaks.acceptance.test.ts` and `tests/ui/report-preflop-leaks.acceptance.test.tsx`, owner
    TASK-10.6 (`doit/TASK-10.6/state.json`).
  - `tests/stats/leaks.acceptance.test.ts`, `tests/ui/report-leaks.acceptance.test.tsx` and
    `e2e/report-leaks.spec.ts`, owner TASK-10.5 (`doit/TASK-10.5/state.json`).
- Existing code to reuse:
  - `src/table/hand-record.ts:137` → `userMade`, in place of the inline blind check.
  - `tests/stats/preflop-leaks.test.ts:29-56` → the shape of the `act`, `decision` and `hand` fixture helpers.
    Copy them into the new test file, because that file does not export them.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `src/stats/leaks.ts` gets a runtime import of `userMade` from `../table/hand-record`. | Move `userMade` into `src/stats` or `src/engine` and import it from both places | It is the smallest change, AC#2 names the hand-record helper, and `stats/trends.ts` sets the precedent. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/hand-record.ts` — add `export` to `userMade`. Nothing else changes.
- `src/stats/leaks.ts` — import `userMade`. Rewrite the body of `handCategoryDecisions` as below and keep the doc
  comment accurate.
- `tests/stats/preflop-pairing.test.ts` — new unit tests for SPEC-01..SPEC-03.

### Components, interfaces and data
- `export function userMade(actions: readonly ActionRecord[], userSeat: unknown): ActionRecord[]`. The signature
  and behaviour are unchanged.
- `handCategoryDecisions(hand: CategoryHand): CategoryDecision[]`. The signature, return values and thrown errors
  are unchanged.

### Rules and algorithms
Reference shape (the builder may vary names but not behaviour):
```ts
const spots = new Map<number, PreflopSpot>();
if (hand.button !== undefined) {
  const { button, userSeat, decisions } = hand;
  const made = userMade(hand.actions, userSeat);
  let group: PositionGroup | undefined;
  let raisedBefore = false;
  let j = 0;
  for (const record of hand.actions) {
    if (record === made[j]) {
      const d = decisions[j];
      if (d?.street === 'preflop' && record.street === 'preflop' && record.type === d.action?.type) {
        group ??= positionGroup(hand.seats.map((s) => s.seat), button, userSeat);
        spots.set(j, { group, raisedBefore });
      }
      j++;
    }
    if (record.street === 'preflop' && record.type === 'raise') raisedBefore = true;
  }
}
```
- Matching by reference is exact: `userMade` is a `filter`, so `made` holds the same objects in the same order. If
  one object appears twice in `actions`, both occurrences are in `made` and match in turn, the same as the
  current counter.
- `hand.seats` is read at most once per call. It is read only when a preflop decision pairs.
- Worked example (existing `limpReraise` fixture, user seat 3, button 6, 6 seats): records after the blinds are
  `3 call, 4 raise, 5 fold, 6 fold, 1 fold, 2 fold, 3 raise`. `made` = [3 call, 3 raise]. The first pairs with
  `group` computed as `middle` and `raisedBefore` false. The second reuses `middle`, with `raisedBefore` true.
  The result is the same as today.

### Error handling and configuration
- Errors are unchanged. `positionGroup`'s `RangeError` is still raised only when a preflop decision pairs and the
  user seat or button is not dealt in. There is no configuration.

## 6. Behaviour specification

### SPEC-01: seat list and group computed once per hand
- Verifies: AC#1
- Behaviour: Given a 6-seat `CategoryHand` (button 6, user seat 3) whose `seats` is a getter that counts reads,
  with actions `SB 1, BB 2, 3 call, 4 raise, 5 fold, 6 fold, 1 fold, 2 fold, 3 raise, 3 call` and three preflop
  decisions `call, raise, call`, When `handCategoryDecisions` runs, Then `seats` is read exactly once. The spots are
  `[{middle,false},{middle,true},{middle,true}]`, and `categoryCounts` gives `middle-call` (2 decisions) then
  `middle-raise` (1).
- Verification: unit `tests/stats/preflop-pairing.test.ts::handCategoryDecisions computes the seat list and group once per hand`

### SPEC-02: no group work when nothing pairs, so errors stay identical
- Verifies: AC#1
- Behaviour: Given a hand with a button whose only preflop decision does not pair (decision `raise`, user record
  `fold`), When `handCategoryDecisions` runs, Then `seats` is read 0 times and the decision has no `preflop`
  spot. Given a hand whose `userSeat` (7) is not in `seats` and that has a postflop decision only, When it runs,
  Then it does not throw and returns that decision. Given the same seats with a paired preflop decision for seat 7,
  Then it throws `new RangeError('Seat 7 is not dealt in')`, as it does today.
- Verification: unit `tests/stats/preflop-pairing.test.ts::handCategoryDecisions only computes the group when a preflop decision pairs`

### SPEC-03: pairing reuses userMade with the same results
- Verifies: AC#2
- Behaviour: Given `src/stats/leaks.ts` after the change, When it is inspected, Then it imports `userMade` from
  `../table/hand-record` and contains no `'small-blind'` or `'big-blind'` literal. `userMade` is exported from
  `src/table/hand-record.ts` with its body unchanged. Given a hand where the user posts the small blind and later
  acts preflop (user seat 1: `SB 1, BB 2, 3 fold, 4 fold, 5 fold, 6 raise, 1 call`, decision `call`), When
  `handCategoryDecisions` runs, Then the blind is skipped and the spot is `{ group: 'blinds', raisedBefore: true }`.
- Verification: command `grep -q "import { userMade } from '../table/hand-record';" src/stats/leaks.ts && ! grep -qE "'(small|big)-blind'" src/stats/leaks.ts && grep -q "^export function userMade" src/table/hand-record.ts && npx vitest run tests/stats/preflop-pairing.test.ts -t "skips the user's blind"`

### SPEC-04: every existing leak test passes unchanged
- Verifies: AC#1, AC#2
- Behaviour: Given the base commit `e6bea12`, When the build is complete, Then no existing file under `tests/` or
  `e2e/` is modified or deleted, and the full suite passes. That includes the locked TASK-10.5 and TASK-10.6 tests
  and `tests/stats/preflop-leaks.test.ts`, `tests/stats/leaks.test.ts` and the session-report tests.
- Verification: command `git diff --exit-code --diff-filter=MD e6bea12 -- tests e2e && npm test`

## 7. Edge cases
- A hand with no button: no pairing and no seat read (the existing unit test, plus SPEC-02 by construction).
- No user preflop decision pairs: no group computed, no throw (SPEC-02).
- User seat not dealt in: the throw happens only when something pairs, as today (SPEC-02).
- The user's own blind post: skipped by `userMade` (SPEC-03).
- A trailing forced fold with no decision: `decisions[j]` is undefined and is ignored (existing
  `preflop-leaks.test.ts` case, kept passing by SPEC-04).
- Concurrency, permissions, dependency failure: N/A. This is a pure synchronous function.

## 8. Security considerations
- N/A. There is no new input, dependency, storage, logging or randomness. Input validation of stored records
  (`parseHandRecord`) is unchanged.

## 9. Non-functional
- `positionGroup` (a sort plus index search) runs at most once per hand instead of once per paired preflop
  decision. No timing target. Behaviour is identical (SPEC-04).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/stats tests/table/session-report.test.ts tests/ui/report-leaks.acceptance.test.tsx tests/ui/report-preflop-leaks.acceptance.test.tsx`
- New tests (path → SPEC ids):
  - `tests/stats/preflop-pairing.test.ts` → SPEC-01, SPEC-02, SPEC-03 (the third `it` is named
    `handCategoryDecisions skips the user's blind and pairs the next action`).
- Judge scenario: run the Run command and confirm everything passes. Run SPEC-03's and SPEC-04's commands. Read
  the `handCategoryDecisions` diff and confirm `positionGroup` is called inside a `??=` guard (or an equivalent
  once-only guard) and that the inline blind check is gone.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-10.15/qa.md`.
