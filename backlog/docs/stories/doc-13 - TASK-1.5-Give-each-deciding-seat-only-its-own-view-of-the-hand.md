---
id: doc-13
title: 'TASK-1.5: Give each deciding seat only its own view of the hand'
type: other
created_date: '2026-11-18T06:47:00Z'
updated_date: '2026-11-18T06:47:00Z'
---
# TASK-1.5: Give each deciding seat only its own view of the hand

Status: Done (Judge and CI pending at time of writing) · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-025.1 (REQ-025.2/025.3 belong to E07) · Branch: doit/TASK-1.5

## What was asked
Anything that decides for a seat (bots, playtest policies, later hints and grades) must see only what that seat could see at a real table. The acceptance criteria:
1. When the engine asks a seat to act, it passes a `PlayerView` holding that seat's hole cards, the board, all actions, all stacks and cards shown at earlier showdowns, and no other player's hole cards or undealt cards.
2. When the other players' hole cards and the undealt deck change at a fixed decision point, the view is deep-equal and a seeded seat policy returns the same action.
3. Decision code that is given the full game state instead of a `PlayerView` makes `npm run typecheck` report a type error.

Spec: doit/TASK-1.5/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | New module `src/engine/player-view.ts` that imports only `./hand` and `./cards`. `hand.ts` is unchanged. Three new test files. | yes | Same one-module-per-concern layout as TASK-1.2 to 1.4. TASK-1.4's locked tests stay untouched. | Move the view into `hand.ts` |
| A-2 | The view is a fresh copy. Fields are copied by name and never spread from `PlayerState` or `HandState`. No object in the view is shared with the state, except `earlierShowdowns` (A-3). | yes | A policy that mutates its view cannot corrupt the game. A secret field added to the state later cannot leak without editing `player-view.ts` and its exact-keys test. | Share references, or deep-freeze |
| A-3 | `earlierShowdowns` is passed through by reference and not copied. | yes | The list grows for a whole session. Copying it on every decision would cost O(session length). | Copy it on each call |
| A-4 | `playerView` works for any dealt-in seat in any state. `legalActions` is filled only when `seat === state.toAct` and is `[]` otherwise. A seat that is not dealt in throws `RangeError('Seat <n> is not dealt in')`. | yes | The UI and hints need the user's view while others act. A wrong seat is a programming error, as with `createHand`. | Allow only `toAct`, or return null |
| A-5 | `actWith` on a completed hand returns `{ ok: false, error: { code: 'hand-complete' } }` without calling the policy. An illegal or out-of-turn action comes back as `applyAction`'s typed error, with no throw. | yes | Keeps one error model (TASK-1.4 D-2). | Throw |
| A-6 | `SeatPolicy` is synchronous. | yes | Bots must decide in 100 ms or less (REQ-055.3) with local seeded computation. The human seat does not use `actWith`. | `Promise<Action>` |
| A-7 | AC#2's seeded policy is test-local. It seeds `Xoshiro128(seed ^ fnv1a32(JSON.stringify(view)))` and picks uniformly among `view.legalActions`, with no bet or raise when `betCount >= 4`. | yes | The production seeded policy is TASK-1.6. A policy that hashes the whole view is the strictest check that equal views give equal actions. | Reuse TASK-1.4's AC#8 policy |

Note: `state.json` records `assumptions: 0`, but the seven above are in the spec's table. The counter was not updated.

## Clarifications and decisions
- Q-1 (D-1), public interface of the view. The user chose a plain, serialisable `PlayerView` as in spec section 5, with no brand. `SeatPolicy` is synchronous, the `actWith` driver is included and `result` is excluded. The rejected option was an opaque, engine-only branded view.
- Q-2 (D-2), source of "cards shown at earlier showdowns". The user chose that the caller passes it in. It is an `earlierShowdowns` parameter, oldest first, default `[]`, passed by reference. `showdownOf(completedState)` builds one entry, and `hand.ts` is unchanged. The rejected options were storing it in hand state and using the current hand only.

## What was built
- `src/engine/player-view.ts` (new). It exports the types `PlayerView`, `PublicPlayer`, `ShownHand`, `EarlierShowdown` and `SeatPolicy`, and the functions below.
  - `playerView(state, seat, earlierShowdowns = [])` builds the view field by field. It has 14 view keys and 8 `PublicPlayer` keys. There is no `deck`, `burned`, `result` or other seat's `holeCards`.
  - `actWith(state, policy, earlierShowdowns = [])` builds the view for `state.toAct`, calls the policy and applies the action through `applyAction`.
  - `showdownOf(state)` returns `{ shown: [{ seat, holeCards }] }` in `result.showdown` order, or `null` for a fold-out or unfinished hand.
- Tests (new):
  - `tests/engine/player-view.acceptance.test.ts` covers AC#1 and AC#3.
  - `tests/engine/player-view.property.test.ts` covers AC#2.
  - `tests/engine/player-view.test.ts` has the unit tests for copies, non-acting, folded and completed views, errors and `showdownOf`.
- No new dependencies. No UI changes.

```ts
const result = actWith(state, (view) => ({ seat: view.seat, type: 'check' }), earlier);
```

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Acceptance: a spy policy receives exactly the worked-example view (14 keys, 8 player keys) | Pass | `player-view.acceptance.test.ts` |
| SPEC-02 | AC#2 | Property: 300 seeded hands with 3 to 10 seats, hidden cards rotated at every decision point, plus an own-card swap control | Pass | `player-view.property.test.ts` |
| SPEC-03 | AC#3 | Acceptance: sandboxed `npm run typecheck` gives two TS2345 errors on the probe and exits 0 on the control | Pass | `player-view.acceptance.test.ts` |
| SPEC-04 to 07 | AC#1 | Unit: no shared references or mutation, non-acting, folded and completed views, errors, `showdownOf` | Pass | `player-view.test.ts` |
| SPEC-08 | DoD#2, 4, 5, 8 | `npm run lint`, `npm run typecheck`, `npm test` and the import grep | Pass | gates `build-1` and `fix-2` |
| SPEC-09 | DoD#10 | CI on the branch | Pending | runs after this document |
| SPEC-10 | DoD conditionals | Not applicable, apart from publishing this document | Done | `backlog doc` |

- Gates: 2 runs (`build-1` and `fix-2`), both PASS on all 9 checks. Locked tests: the AC#1/AC#3 acceptance file and the AC#2 property file.
- Judge: pending, 0 rounds so far.
- Review mutation testing: the code reviewer ran the tests against 14 mutants of `player-view.ts`, and all 14 were caught. Mutants 1 to 4 and 12 also fail the AC#2 property test, so it can genuinely fail. The mutants were: spreading `...p`, adding `burned`, adding `deck`, another seat's card, actions, hole cards or `eligible` shared by reference, copying `earlierShowdowns`, `legalActions` for every seat, a plain `Error`, `showdownOf` on a fold-out, the wrong seat in `actWith`, removing the hand-complete check, and widening `SeatPolicy`.

## Review
Round 1 found no BLOCKER or MAJOR issues in either review (code: 1 NIT; security: 2 MINOR). One review round, nothing to fix.

### Non-blocking review notes (deliberately not fixed)
- Security MINOR: `showdownOf` copies every entry of `result.showdown`. Today `hand.ts` fills that with every non-folded seat, including seats that would muck. The "only shown hands" guarantee relies on TASK-1.15 shrinking `result.showdown`. Nothing in `src/` calls `showdownOf` or `actWith` yet, so it is not reachable. TASK-1.15 should add a test that a mucked losing hand is absent from `showdownOf`.
- Security MINOR: `earlierShowdowns` is a shared mutable array (A-3). A cast could mutate it and later seats would see the change. It holds only public data, so this is an integrity risk and not a leak. The session owner could freeze each entry and the list when appending.
- Code NIT: the AC#2 property test uses only the default empty `earlierShowdowns`. This is allowed by the spec, and SPEC-01 covers a non-empty list.
- Size: 619 lines in scope against a 620 budget.

## How to try it
```
npx vitest run tests/engine/player-view
npm run lint && npm run typecheck && npm test
```

## Run metrics
Questions asked: 2 · assumptions logged: 7 · review rounds: 1 (0 blocking findings) · judge rounds: pending · gate runs: 2 · escalations: 0 · changed lines: 619 across 4 files.

## Known limitations and follow-ups
Noted and not created as tasks, so they need approval.
1. Seat identity across hands. `earlierShowdowns` is keyed by seat. When a cash bot is replaced or in a sit-and-go, the session layer must reset or filter the list, or add a player id to `ShownHand`.
2. Replay against bot memory (REQ-028.2). If bots use `earlierShowdowns` or observed stats, replaying one hand needs that session context, which hand records do not store.
3. Game type and sit-and-go level on the view need `HandConfig` to carry them (TASK-5.1, 5.4 and 7.17).
4. The type boundary can be defeated by casts or spreads. Bots in E06 and E07 must be reviewed to keep them on `SeatPolicy`.
5. TASK-1.15: add the mucked-card test for `showdownOf`.
6. Freeze `earlierShowdowns` entries when the session layer appends them.

## Lessons for the factory (proposals — not applied)
- The run went smoothly, with one review round and no send-backs. One small gap: `state.json` `assumptions` stayed at 0 while the spec listed 7. The counter should be derived from the spec's Assumptions table, or the Spec Writer should set it.
