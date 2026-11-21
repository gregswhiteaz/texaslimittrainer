---
id: doc-68
title: 'TASK-3.7: Act correctly on capped streets and when short of chips'
type: other
created_date: '2026-11-21T18:38:00Z'
updated_date: '2026-11-21T18:38:00Z'
---
# TASK-3.7: Act correctly on capped streets and when short of chips

Status: Done · Completed: 2026-11-21 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-017 (.2, .3, .7), REQ-022.1 · Branch: doit/TASK-3.7

## What was asked
The action bar must show exactly the options the rules allow. On a capped street there is no Raise. A call for less than the amount owed reads "Call all-in $X". A bet or raise for less than a full bet reads "Bet all-in $X" or "Raise all-in to $X". In a sit-and-go the labels use plain chips ("Call 40", "Raise to 80"). A 100,000-state property must match the engine's legal set, and a test must show that an idle button with `disabled` stripped changes nothing. Spec: doit/TASK-3.7/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A call/bet/raise using the whole stack but exactly the full amount keeps the plain label ("Call $4" with $4 behind). "All-in" wording only when below the full amount. | yes | AC#3 requires it for calls; REQ-017.3/.7 say "smaller than". | Label on stack == 0 (contradicts AC#3) |
| A-2 | Until TASK-2.4 adds sit-and-go, `userActionBar` always uses dollars. Chip labels are proven via `actionBar(view, 'chips')` rendered through `<ActionBar>`, not in the browser. | yes | `GameType` is `'cash'` only; widening changes the persisted `SessionConfig`. | Widen `GameType` (TASK-2.4) |
| A-3 | The 100,000-state property runs in normal `npm test` (about 0.9 s), with no wall-clock assertion. | yes | It is a correctness property and fits the 30 s timeout. | Move to the opt-in slow group |
| A-4 | Generator: seats 1..n with n = 2 + (i mod 9), stakes cycling $2/$4, $4/$8 and chip levels 20/40, 40/80, 600/1,200; short, minimum or buy-in stacks; every seat plays `randomMovePolicy`. | yes | Prototype covered all table sizes and thousands of capped, short-call, short-raise, short-bet and non-reopened decisions. | Hand-picked lists or fast-check |
| A-5 | Browser label checks use new test-only scenes in the e2e scene harness. | yes | Short stacks cannot occur live: `nextHand` tops everyone up. | Debug URL (ships test code) |
| A-6 | The idle bar stays "Fold", "Call", "Raise" with no amounts in both units. | yes | Those labels carry no amounts. | n/a |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): put the widened legalActions property in a new `tests/table/action-bar-limits.acceptance.test.ts`; TASK-3.2's locked tests are untouched (D-3). The new domain is a superset of TASK-3.2's: 2–10 seats, short and buy-in stacks, chip stakes, 100,000 states, and labels including all-in and unit.
- Q-2 (auto-accepted, recommended): plain digits at 1,000+ ("Raise to 1200"), matching every existing money label (D-4).
- D-1: the table layer decides "short all-in" (call below amount owed; bet/raise below `fullBetTarget`). `fullBetTarget` is exported from the engine so there is one rule.
- D-2: API `actionLabel(action, { allIn?, unit? })`, `isShortAllIn(view, action)`, `actionBar(view, unit = 'dollars')`. One-argument calls behave as before.
- D-5: the property's oracle is independent of the code. It recomputes legal actions with a 1,000,000,000 stack and treats an action as short if its amount is below the same action's amount there.

## What was built
- `src/engine/hand.ts`: exports `BetContext` and `fullBetTarget`; `legalActions` uses it. No behaviour change.
- `src/table/action-bar.ts`: `AmountUnit`, all-in and chip wording, `isShortAllIn`, `actionBar(view, unit)`. `userActionBar` still passes dollars (A-2).
- `tests/support/table-scenarios.ts`: `stacks` override on `userTableAfter`; scenes `CAPPED_FLOP`, `CALL_ALL_IN`, `RAISE_ALL_IN`, `BET_ALL_IN`.
- `e2e/support/table-scenes.tsx`, `e2e/support/table-harness-bundle.ts`: four new test-only scenes.
- New tests: `tests/table/action-bar-limits.acceptance.test.ts`, `tests/ui/action-bar-limits.acceptance.test.tsx`, `e2e/action-bar-limits.spec.ts`. Unit additions in `tests/table/action-bar.test.ts`.
- No new dependencies. `ActionBar.tsx`, `Table.tsx` and engine rules are unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | AC#1-3, 6-8 hand-worked bars | Vitest through `<ActionBar>` | Pass | tests/ui/action-bar-limits.acceptance.test.tsx |
| SPEC-04, 09 | AC#4, 9 chip and all-in labels | Vitest | Pass | tests/table/…limits…, tests/ui/…limits… |
| SPEC-08 | AC#5, 9 100,000-state property | Vitest, independent oracle | Pass | tests/table/action-bar-limits.acceptance.test.ts |
| SPEC-10, 12 | AC#10, browser labels, size, axe | Playwright, Chromium + WebKit | Pass | e2e/action-bar-limits.spec.ts |
| SPEC-11 | AC#10 click guard | Vitest; mutation check (removing `model.enabled &&` fails the test) | Pass | build-log.md |
| SPEC-13 | exact-amount edge, full-bet rule | Unit | Pass | tests/table/action-bar.test.ts |
| SPEC-14 | TASK-3.2 locked tests | Run unchanged | Pass | see Review notes on the hash |
| SPEC-15, 16 | lint, typecheck, coverage, playtest | Gates; `npm run playtest -- --hands 10000 --seed 42` | Pass; 0 invariant violations, output byte-identical to base | gates/fix-3.json, build-log.md |
| SPEC-17 | DoD#10-11 | CI run; this doc | See CI | doc published via backlog |

- Final gate (fix-3): `npm test` 500 passed / 7 skipped; coverage 96.78% statements, 94.82% branches; lint and typecheck clean; scope 581 changed lines (budget 700), 9 files (budget 9). `npm run e2e` at build: 120 passed, 6 skipped.
- Judge: see doit/TASK-3.7/judge/.

## Review
Round 1: 0 blocking findings. Security review clean. One NIT was fixed in-story: SPEC-11 now also covers a disabled bar whose buttons carry real actions.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the e2e "stripped disabled" test passes because React drops `onClick` for disabled buttons. The guard itself is proven by SPEC-11.
- MINOR: SPEC-14's recorded TASK-3.2 hash for `e2e/action-bar.spec.ts` is stale, because earlier stories changed that file. Judged as "unchanged by this branch".

## How to try it
`npm test`, `npm run e2e -- e2e/action-bar-limits.spec.ts`, `npm run playtest -- --hands 10000 --seed 42`.

## Run metrics
Questions 2 (auto-accepted) · assumptions 6 · review rounds 1 · judge rounds: see judge/ · gate runs 3 · escalations 0 · changed lines 581.

## Known limitations and follow-ups
- [trainer] Wire `actionBar(view, 'chips')` into `userActionBar` when TASK-2.4 adds the sit-and-go game type (owner: TASK-2.4).
- [trainer] All-in labels are reachable in the live app only once TASK-3.21 removes the TEMPORARY top-up in `nextHand` (owner: TASK-3.21).

## Lessons for the factory (proposals — not applied)
- Spec tests that record a locked-test hash should record "unchanged since base commit" rather than a fixed hash, since earlier stories may legitimately change the file (SPEC-14 went stale).
