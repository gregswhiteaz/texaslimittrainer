# Spec: TASK-3.7 — Act correctly on capped streets and when short of chips

Status: READY (approved 2026-11-21)
Task: TASK-3.7 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: REQ-017.2, REQ-017.3, REQ-017.7, REQ-022.1 (REQ-016.5 reopening is engine behaviour from TASK-1.14) · Dream: limit-holdem-trainer

## 1. Summary
The engine already caps each street, lets a short stack call all-in, and offers short all-in bets and raises
(TASK-1.12, TASK-1.9, TASK-1.14). This story makes the action bar label those cases. A call for less than the
amount owed reads "Call all-in $X". A bet or raise for less than a full bet reads "Bet all-in $X" or "Raise
all-in to $X". In a sit-and-go the same labels use plain chip numbers ("Call 40", "Raise to 80"). A
100,000-state seeded property covers capped streets, short stacks, table sizes 2–10 and chip stakes. It proves
that the bar offers exactly the engine's legal set with the right label for every action. A browser test proves
that an idle button with its `disabled` attribute stripped still changes nothing.

## 2. Scope
- In scope:
  - `src/engine/hand.ts`: export `fullBetTarget` (the existing private full-bet rule, unchanged behaviour) so the
    table layer can tell a short all-in from a full bet.
  - `src/table/action-bar.ts`: `AmountUnit`, all-in and chip labels in `actionLabel`, `isShortAllIn`, and an
    optional `unit` argument on `actionBar`.
  - New Vitest acceptance tests for the hand-worked scenarios and the 100,000-state property. New Playwright
    tests for the browser labels and the disabled-attribute bypass. Unit additions in the unlocked
    `tests/table/action-bar.test.ts`.
  - Test-only scenes (capped flop, call all-in, raise all-in, bet all-in) in the e2e scene harness.
- Not doing:
  - No sit-and-go game type in the session or the UI. `GameType` stays `'cash'` (`src/table/session.ts:68-69`
    says TASK-2.4 widens it). `userActionBar` always passes `'dollars'`. The chip labels are reachable through
    `actionBar(view, 'chips')` and are tested at the model and render level only (A-2).
  - No change to engine rules (cap, all-in, reopening), to `ActionBar.tsx`, `Table.tsx` or the idle bar ("Fold",
    "Call", "Raise" with no amounts).
  - No removal of the TEMPORARY top-up in `nextHand` (`src/table/session.ts:173-177`). TASK-3.21 owns that
    removal.
  - No Hint button (TASK-8.1). No thousands separators in cash labels.
  - No edits to TASK-3.2's locked tests (`e2e/action-bar.spec.ts`, `tests/table/action-bar.acceptance.test.ts`,
    `tests/ui/action-bar.acceptance.test.tsx`). They must keep passing unchanged (D-3).
- Scope budget: files=9, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A call, bet or raise that uses the whole stack but is exactly the full amount keeps the plain label. Examples: $4 behind facing $4 → "Call $4"; $4 behind, no bet → "Bet $4"; $8 behind facing $4 on the flop → "Raise to $8". The "all-in" wording appears only when the amount is below the full amount. | yes | AC#3 fixes this for the call, and REQ-017.3/017.7 say "smaller than" the call or a full bet. Bet and raise follow the same rule. | Say "all-in" whenever the stack hits 0 (contradicts AC#3) |
| A-2 | Until TASK-2.4 adds the sit-and-go game type, `userActionBar(table)` always uses `'dollars'`. The chip labels are proven with `actionBar(view, 'chips')` rendered through `<ActionBar>`, not in the browser. | yes | `GameType = 'cash'` only (`src/table/session.ts:69`), and TASK-2.4 owns widening it. Adding a game type now would change the persisted `SessionConfig`. | Widen `GameType` now (out of scope, persisted format) |
| A-3 | The 100,000-state property runs in the normal `npm test` suite, not in the opt-in slow group. It has no wall-clock assertion. | yes | It is a correctness property. A prototype of the same loop measured about 0.2 s for 100,000 states in node, and TASK-3.2's 10,000-state test runs in 293 ms under Vitest. It fits the 30 s `testTimeout` (`vite.config.ts:10`) easily. | 100k in `TLH_SLOW_TESTS` plus a 10k sample every push |
| A-4 | The property's state generator uses replay code `replayCodeFromWords([i, 0x3a7e, 7, 7])`, seats 1..n with n = 2 + (i mod 9), and button `seats[i mod n]`. The stakes cycle through $2/$4, $4/$8, chips L1 20/40, L3 40/80 and L10 600/1,200 (REQ-008.2), and the chip stakes use the `'chips'` unit. Each seat's stack comes from `Xoshiro128(fnv1a32(`${code}/stacks`))`, choosing one of three buckets: 1..2×bigBet (short), 1..minimumStack, or the buy-in 20×bigBet. Every seat plays `randomMovePolicy`. | yes | The prototype produced 12,942 capped decisions, 10,265 short calls, 5,068 short raises, 1,258 short bets and 537 non-reopened decisions, with at least 2,942 decisions at each table size from 2 to 10. | Hand-picked state lists; fast-check arbitraries |
| A-5 | The browser label checks use new test-only scenes in the existing scene harness (`e2e/support/table-scenes.tsx`). | yes | Short stacks cannot happen in the live app: `nextHand` tops every seat back up to at least `minimumStack` ($96 at $4/$8, `src/table/session.ts:173-177`, `src/engine/hand.ts:137-139`). | Expose a debug URL in the app (ships test code) |
| A-6 | The idle bar stays "Fold", "Call", "Raise" with no amounts in both units. | yes | Those labels carry no amounts (`src/table/action-bar.ts:16-18`). | n/a |

## 3. Current system
- Engine: `legalActions` (`src/engine/hand.ts:322-345`) returns fold/check/call/bet/raise in that order. The call
  amount is `min(owe, stack)` (`:336`). The bet or raise target is `min(fullBetLevel + betUnit, maxTo)` (`:328`).
  Raising requires `betCount < STREET_BET_CAP` (4, `:133`), `!hasActed` and `maxTo > currentBet` (`:329-330`).
  `fullBetLevel` and `betUnit` (`:295-315`) are private and read only `street`, `stakes` and `actions`. A short
  all-in under half a bet neither counts nor clears `hasActed` (`:611-612`, REQ-016.5).
- `Action` has no all-in flag (`src/engine/hand.ts:49-52`). `amount` is the number shown on the bar: call =
  chips added, bet = bet size, raise = "raise to".
- `PlayerView` (`src/engine/player-view.ts:36-57`) carries `stakes`, `street`, `actions`, `currentBet`,
  `players[].streetContribution/stack` and `legalActions`. It structurally satisfies
  `Pick<HandState, 'street' | 'stakes' | 'actions'>`.
- Bar model: `actionLabel(action)` and `actionBar(view)` are in `src/table/action-bar.ts:22-45`, and
  `userActionBar(table)` is at `:48-50`. The idle bar is at `:16-20`. `<ActionBar>` renders native buttons with
  `disabled={!model.enabled}`. Its `onClick` submits only when `model.enabled && action !== null`
  (`src/ui/table/ActionBar.tsx:13-20`). `Table.tsx:145,181` renders `userActionBar(table)`.
- Session: `GameType = 'cash'` only (`src/table/session.ts:68-69`). The buy-in is 20 × big bet (`:40-42`).
  `nextHand` tops stacks below `minimumStack` back up (`:173-177`).
- Locked TASK-3.2 tests (`doit/TASK-3.2/state.json` `locked_tests`): `e2e/action-bar.spec.ts`,
  `tests/table/action-bar.acceptance.test.ts` (the 10,000-state property, 3–10 seats, buy-in stacks, with its own
  `expectedLabel` that has no all-in wording) and `tests/ui/action-bar.acceptance.test.tsx`. At buy-in stacks
  ($160 at $4/$8) no seat can be short in one hand, because the most a capped hand costs is $96. So these tests
  stay green with the new labels.
- Tests: Vitest in node (`vite.config.ts:7-10`, `testTimeout: 30_000`). UI tests use `renderToString` (see
  `tests/ui/action-bar.acceptance.test.tsx:41-52`). Playwright runs in Chromium and WebKit against
  `npm run build && npm run preview` on port 4173 (`playwright.config.ts`). Coverage thresholds are ≥ 90% for
  `src/{engine,…,table}` and ≥ 70% overall (`vite.config.ts:16-18`).
- Existing code to reuse:
  - `tests/support/table-scenarios.ts` → `userTableAfter(fixed, moves, button)` and `fixedDeck`. Extend it with
    an optional per-seat `stacks` override for the scenes.
  - `e2e/support/table-harness-bundle.ts` → `buildTableScenes`, `openTableScene`, the `TableScene` type and
    `stubReplayWords`.
  - `e2e/support/table-locators.ts` → `expectToAct`. `e2e/support/axe.ts` → `expectNoSeriousAxeViolations`.
  - `src/playtest/policy.ts` → `randomMovePolicy` and `seatGenerator`. `src/engine/seeded-random.ts` →
    `Xoshiro128` and `fnv1a32`. `src/engine/hand.ts` → `minimumStack` and `STREET_BET_CAP`.
  - The `renderBar` / `play` helpers pattern from `tests/ui/action-bar.acceptance.test.tsx:21-52`. Copy it into
    the new file, because the locked file cannot be edited to export it.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The table layer classifies "short all-in". A call is short iff `amount < view.currentBet − own streetContribution`. A bet or raise is short iff `amount < fullBetTarget(view)`. `fullBetTarget` is exported from `hand.ts` as `fullBetLevel + betUnit`, and `legalActions` uses it, so both share one rule. | Add an `allIn` flag to `Action` (changes the engine/bot/persisted action shape); re-derive the full level in the table layer (duplicated rule) | This is the smallest change that keeps a single source of truth. The view already holds every field the rule reads. | no | n/a |
| D-2 | API: `type AmountUnit = 'dollars' \| 'chips'`; `actionLabel(action, options?: { allIn?: boolean; unit?: AmountUnit })`; `isShortAllIn(view, action)`; `actionBar(view, unit = 'dollars')`. All existing one-argument calls keep their behaviour. | A `GameType` argument (only `'cash'` exists); a formatter callback | The locked TASK-3.2 tests call `actionBar(view)` and the unit test calls `actionLabel(action)`, so both must stay valid. A two-value unit stays independent of TASK-2.4's game-type naming. | no | n/a |
| D-3 | AC#9's "widen the TASK-3.2 legalActions property" is met by a new acceptance file, `tests/table/action-bar-limits.acceptance.test.ts`. Its domain is a strict superset of TASK-3.2's: 2–10 seats instead of 3–10, short and buy-in stacks, chip stakes, and 100,000 states instead of 10,000. Its assertions are equal or stronger: actions, amounts and labels including all-in and unit. TASK-3.2's locked file stays unchanged and keeps running. | Edit TASK-3.2's locked file (needs an unlock; its `expectedLabel` has no all-in wording) | Strengthening without loosening any locked assertion and without an unlock. | yes | user (Q-1, auto-accepted) |
| D-4 | Chip and dollar amounts are printed as plain integers with no thousands separator, e.g. "Raise to 1200", matching every existing money label (`src/table/action-bar.ts:30-34`, `src/ui/table/Table.tsx:58,76`). | "Raise to 1,200" via `toLocaleString('en-US')` | Consistent with the rest of the app. Whether sit-and-go labels at 1,000+ chips get separators is user-visible text. | yes | user (Q-2, auto-accepted) |
| D-5 | The property's label oracle is independent of the implementation. It recomputes `legalActions` with the acting seat's stack set to 1,000,000,000. An action is "short" iff its amount is below the amount of the same action type in that unlimited set. | Call `isShortAllIn` in the test (circular) | This states the rule as observable behaviour ("less than you could put in with chips to spare") and catches a wrong `fullBetTarget`. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — `BetContext` type, `fullBetTarget` export; `betUnit`/`fullBetLevel` accept `BetContext`;
  `legalActions` uses `fullBetTarget` (no behaviour change).
- `src/table/action-bar.ts` — `AmountUnit`, `LabelOptions`, all-in/chip `actionLabel`, `isShortAllIn`, `actionBar(view, unit)`.
- `tests/table/action-bar-limits.acceptance.test.ts` — new: 100,000-state property (SPEC-08) and the `actionLabel`
  wording (SPEC-09).
- `tests/ui/action-bar-limits.acceptance.test.tsx` — new: hand-worked scenarios rendered through `<ActionBar>`
  (SPEC-01..SPEC-07) and the idle click handler (SPEC-11).
- `tests/table/action-bar.test.ts` — modify (unlocked): unit tests for `fullBetTarget`, `isShortAllIn` and the
  exact-amount edge (SPEC-13).
- `tests/support/table-scenarios.ts` — optional `stacks` override on `userTableAfter`; export `CAPPED_FLOP`,
  `CALL_ALL_IN`, `RAISE_ALL_IN` and `BET_ALL_IN`.
- `e2e/support/table-scenes.tsx` — register scenes `capped-flop`, `call-all-in`, `raise-all-in`, `bet-all-in`.
- `e2e/support/table-harness-bundle.ts` — widen `TableScene` with the four scene names.
- `e2e/action-bar-limits.spec.ts` — new: browser labels, size/axe/no outside requests, disabled-attribute bypass
  (SPEC-10, SPEC-12).

### Components, interfaces and data
- `src/engine/hand.ts`:
  ```ts
  /** The fields the full-bet rule reads; a PlayerView satisfies it. */
  export type BetContext = Pick<HandState, 'street' | 'stakes' | 'actions'>;
  /** The street total ("to" amount) of a full bet or raise now: the last counted bet level plus one bet unit
   *  (REQ-016.5, REQ-017.7). A bet or raise below it is a short all-in. */
  export function fullBetTarget(state: BetContext): number;
  ```
  `betUnit` and `fullBetLevel` change their parameter type to `BetContext` and keep their bodies. `legalActions`
  line 328 becomes `const to = Math.min(fullBetTarget(state), maxTo);`. `applyAction` line 612 is unchanged.
- `src/table/action-bar.ts`:
  ```ts
  export type AmountUnit = 'dollars' | 'chips';
  export interface LabelOptions { readonly allIn?: boolean; readonly unit?: AmountUnit }
  export function actionLabel(action: Action, options?: LabelOptions): string;
  export function isShortAllIn(view: PlayerView, action: Action): boolean;
  export function actionBar(view: PlayerView | null, unit?: AmountUnit): ActionBarModel;
  ```
  - `isShortAllIn`: fold/check → false. call → `action.amount < view.currentBet − own.streetContribution`,
    where `own` is the `view.players` entry with `seat === view.seat`, and a missing entry counts as 0. bet/raise →
    `action.amount < fullBetTarget(view)`.
  - `actionBar(view, unit = 'dollars')`: the idle rule is unchanged (`IDLE_BAR`). Otherwise buttons =
    `view.legalActions.map(action => ({ label: actionLabel(action, { allIn: isShortAllIn(view, action), unit }), action }))`.
  - `userActionBar(table)` is unchanged and calls `actionBar(view)`, so it uses dollars (A-2). Add a comment
    that TASK-2.4 passes `'chips'` for a sit-and-go.
  - The module stays headless. It may import only `../engine/*` and `./session` types (existing unit check
    `tests/table/action-bar.test.ts::action bar module imports no UI code`).
- `tests/support/table-scenarios.ts`: `userTableAfter(fixed, moves, button = 6, stacks: Readonly<Record<number, number>> = {})`.
  Seats missing from `stacks` keep the buy-in, and `TableState.stacks` reflects the overrides. Scenes (default
  six seats, $4/$8, button 6, `fixedDeck({})`):
  - `CAPPED_FLOP` = stacks `{}`, moves `3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:fold 5:raise 6:raise`
  - `CALL_ALL_IN` = stacks `{5: 7}`, moves `3:fold 4:fold 5:call 6:fold 1:fold 2:check 2:bet`
  - `RAISE_ALL_IN` = stacks `{5: 10}`, same moves as `CALL_ALL_IN`
  - `BET_ALL_IN` = stacks `{5: 7}`, moves `3:fold 4:fold 5:call 6:fold 1:fold 2:check 2:check`

### Rules and algorithms
Labels (`m` = `$<n>` for `'dollars'`, `<n>` for `'chips'`, integer printed with no separator (D-4)):

| action | short (`allIn: true`) | otherwise |
|---|---|---|
| fold | `Fold` | `Fold` |
| check | `Check` | `Check` |
| call | `Call all-in m` | `Call m` |
| bet | `Bet all-in m` | `Bet m` |
| raise | `Raise all-in to m` | `Raise to m` |

Worked examples, all checked against the engine with a scratch run. Six seats 1–6, $4/$8 (SB $2, BB $4), button
6, seat 5 is the user, buy-in $160 unless stated. "LIMP" = `3:fold 4:fold 5:call 6:fold 1:fold 2:check`. Moves
use `seat:type`, and the amount is the engine's single legal amount for that type.
- AC#1: moves `3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:fold 5:raise 6:raise`. The
  flop has betCount 4; the user has $12 in and faces $16. Legal = fold, call 4 → `Fold`, `Call $4`.
- AC#2: user stack $7, LIMP then `2:bet`. The user has $3 and owes $4 → `Fold`, `Call all-in $3`.
- AC#3: user stack $8, LIMP then `2:bet`. The user has $4 and owes $4 → `Fold`, `Call $4` (maxTo 4 is not
  above currentBet 4, so no raise).
- AC#4: stakes {SB 20, BB 40, small bet 40, big bet 80} (sit-and-go L3), all stacks 1,500, LIMP then `2:bet`,
  unit `'chips'` → `Fold`, `Call 40`, `Raise to 80`.
- AC#6: user stack $10, LIMP then `2:bet`. The user has $6, owes $4, and the full target is $8 → raise to 6 is
  short → `Fold`, `Call $4`, `Raise all-in to $6`.
- AC#7: user stack $7, LIMP then `2:check`. The user has $3 and no bet is facing; the full target is $4 → bet 3
  is short → `Check`, `Bet all-in $3`.
- AC#8: seat 6 stack $9, moves `3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:call`. Seat 6
  raises all-in to $5, which is under half a $4 bet over $4: not counted, and the user's `hasActed` stays true.
  Seat 2 calls $5. The user owes $1 → `Fold`, `Call $1`, no raise.
- A-1 edges: user stack $8, LIMP then `2:check` → `Check`, `Bet $4`. User stack $12, LIMP then `2:bet` →
  `Fold`, `Call $4`, `Raise to $8` (the user is all-in, but at the full amount).

### Error handling and configuration
- No new errors. `actionLabel` is total over `Action`, the unit defaults to `'dollars'`, and `allIn` defaults to
  false.

## 6. Behaviour specification

### SPEC-01: Capped flop — Fold and Call $4, no Raise
- Verifies: AC#1
- Behaviour: Given the AC#1 hand (§5) at $4/$8 where the user has $12 in on the flop and faces the fourth bet ($16), When the bar for seat 5 is rendered through `<ActionBar>`, Then the enabled buttons read exactly `["Fold", "Call $4"]`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::a capped flop offers Fold and Call $4 and no Raise`

### SPEC-02: Short call — Call all-in $3, no Raise
- Verifies: AC#2
- Behaviour: Given the user (stack $7) limps preflop and faces a $4 flop bet holding $3, When the bar is rendered, Then the enabled buttons read exactly `["Fold", "Call all-in $3"]`, and the Call button's action is `{ type: 'call', amount: 3 }`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::with $3 facing a $4 bet the bar offers Fold and Call all-in $3 and no Raise`

### SPEC-03: Exact call — Call $4, no Raise
- Verifies: AC#3
- Behaviour: Given the user (stack $8) limps preflop and faces a $4 flop bet holding exactly $4, When the bar is rendered, Then the enabled buttons read exactly `["Fold", "Call $4"]`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::with exactly $4 facing a $4 bet the bar offers Fold and Call $4 and no Raise`

### SPEC-04: Sit-and-go chip labels
- Verifies: AC#4, AC#9
- Behaviour: Given six seats of 1,500 chips at sit-and-go L3 (blinds 20/40, limits 40/80), LIMP then a 40-chip flop bet, When `actionBar(view, 'chips')` is rendered, Then the buttons read exactly `["Fold", "Call 40", "Raise to 80"]` and no label contains `$`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::a sit-and-go bar facing 40 chips reads Call 40 and Raise to 80 without a $ sign`

### SPEC-05: Short raise — Raise all-in to $6
- Verifies: AC#6
- Behaviour: Given the user (stack $10) limps, has $6 and nothing in this street, and faces a $4 flop bet at $4/$8, When the bar is rendered, Then the buttons read exactly `["Fold", "Call $4", "Raise all-in to $6"]`, and the raise action is `{ type: 'raise', amount: 6 }`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::with $6 facing a $4 flop bet the bar offers Fold, Call $4 and Raise all-in to $6`

### SPEC-06: Short bet — Bet all-in $3, no Fold
- Verifies: AC#7
- Behaviour: Given the user (stack $7) limps, has $3, and the flop is checked to them at $4/$8, When the bar is rendered, Then the buttons read exactly `["Check", "Bet all-in $3"]`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::with $3 and no bet facing the bar offers Check and Bet all-in $3 and no Fold`

### SPEC-07: A short all-in raise does not reopen betting for the user
- Verifies: AC#8
- Behaviour: Given the AC#8 hand (§5): the user bets $4 on the flop, seat 6 raises all-in to $5, and seat 2 calls, When the action returns to the user, Then the buttons read exactly `["Fold", "Call $1"]`.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::after a short all-in raise to $5 the bar offers Fold and Call $1 and no Raise`

### SPEC-08: 100,000 seeded capped and short-stack states equal the engine's legal set
- Verifies: AC#5, AC#9
- Behaviour: Given the A-4 generator, When it plays until exactly 100,000 decisions and builds `actionBar(playerView(hand, toAct), unit)` at each one, Then for every decision:
  - `bar.enabled` is true.
  - The buttons' actions deep-equal `legalActions(hand)`.
  - The labels equal the D-5 oracle labels for that unit.

  Across the run:
  - Every table size from 2 to 10 occurs.
  - At least one decision is capped (betCount = 4, owing chips, and no raise offered).
  - At least one decision is non-reopened (hasActed, owing chips, betCount < 4, and no raise offered).
  - At least one label of each of these appears: `Call all-in `, `Bet all-in `, `Raise all-in to `, a chip label
    with no `$`, and a dollar label.

  The test has no wall-clock assertion (A-3).
- Verification: acceptance `tests/table/action-bar-limits.acceptance.test.ts::the bar equals the engine's legal set in 100,000 capped and short-stack states`

### SPEC-09: actionLabel wording for all-in and chips
- Verifies: AC#9
- Behaviour: Given seat 5 actions, When `actionLabel` is called, Then:
  - call 3 `{allIn: true}` → `Call all-in $3`; bet 3 `{allIn: true}` → `Bet all-in $3`; raise 6 `{allIn: true}` → `Raise all-in to $6`.
  - call 40 `{unit: 'chips'}` → `Call 40`; raise 80 `{unit: 'chips'}` → `Raise to 80`; bet 40 `{unit: 'chips'}` → `Bet 40`.
  - call 30 `{allIn: true, unit: 'chips'}` → `Call all-in 30`; bet 30 → `Bet all-in 30`; raise 70 → `Raise all-in to 70`.
  - Fold and check → `Fold` and `Check` in both units.
  - With no options, call 4 → `Call $4`.
- Verification: acceptance `tests/table/action-bar-limits.acceptance.test.ts::actionLabel names all-in and chip amounts`

### SPEC-10: Browser — an idle button with its disabled attribute removed changes nothing
- Verifies: AC#10
- Behaviour: Given the app with replay words `[0x9e3779b9, 1, 2, 3]`, the clock paused, and the user having clicked `Call $4` so that seat 6 (a bot) is to act and `data-action-count` is 5, When the test removes `disabled` from every "Your actions" button in the DOM, checks that they are now enabled, and clicks each one (a normal click, not forced), Then `data-action-count` is still 5, seat 6 is still to act, and the buttons still read `["Fold", "Call", "Raise"]`. This runs in Chromium and WebKit.
- Verification: acceptance `e2e/action-bar-limits.spec.ts::an idle button with its disabled attribute removed changes nothing`

### SPEC-11: Idle click handler submits nothing
- Verifies: AC#10
- Behaviour: Given `ActionBar({ model: actionBar(null), onAct: spy })` called as a function in node, When each returned button element's `props.onClick()` is invoked, Then `spy` is never called.
- Verification: acceptance `tests/ui/action-bar-limits.acceptance.test.tsx::an idle button's click handler submits nothing`

### SPEC-12: Browser — capped and all-in labels, size, axe, no outside requests
- Verifies: AC#1, AC#2, AC#6, AC#7, DoD#7, DoD#8
- Behaviour: Given the scene harness, When the scenes are opened in Chromium and WebKit, Then the enabled "Your actions" buttons read exactly:

  | scene | buttons |
  |---|---|
  | `capped-flop` | `["Fold", "Call $4"]` |
  | `call-all-in` | `["Fold", "Call all-in $3"]` |
  | `raise-all-in` | `["Fold", "Call $4", "Raise all-in to $6"]` |
  | `bet-all-in` | `["Check", "Bet all-in $3"]` |

  On `raise-all-in`, every button is at least 44 × 44 CSS px at 1280 × 720, axe reports zero serious or critical
  violations, and no request leaves the page's own origin.
- Verification: acceptance `e2e/action-bar-limits.spec.ts::capped and all-in scenes show the exact labels` and `e2e/action-bar-limits.spec.ts::the all-in bar is 44 px, axe clean and makes no outside requests`

### SPEC-13: Full-bet rule and the exact-amount edge (unit)
- Verifies: AC#9, DoD#1
- Behaviour: Given the states below, When the full-bet rule and the bar are computed, Then:
  - On the AC#6 state, `fullBetTarget` returns 8. On the AC#8 state it also returns 8, because the $5 short
    raise is not counted.
  - Given the A-1 edge states (user stack $8 checked to; user stack $12 facing $4), When `actionBar` is built,
    Then the labels are `["Check", "Bet $4"]` and `["Fold", "Call $4", "Raise to $8"]`.
  - `isShortAllIn` is false for fold and check.
  - `actionBar(view)` equals `actionBar(view, 'dollars')`.
- Verification: unit `tests/table/action-bar.test.ts::short all-in labels follow the engine's full bet target`

### SPEC-14: TASK-3.2 locked tests still pass unchanged
- Verifies: AC#9, DoD#1
- Behaviour: Given TASK-3.2's locked files with their recorded SHA-256, When they run, Then they pass and are byte-identical to `doit/TASK-3.2/state.json` `locked_tests`.
- Verification: integration `npx vitest run tests/table/action-bar.acceptance.test.ts tests/ui/action-bar.acceptance.test.tsx tests/table/action-bar.test.ts && npx playwright test e2e/action-bar.spec.ts`

### SPEC-15: Lint, typecheck, tests, coverage and engine boundary
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then all of the following hold:
  - Lint, typecheck, Vitest (with coverage thresholds of ≥ 90% engine/table and ≥ 70% overall) and Playwright
    pass with zero errors.
  - The existing boundary tests (`tests/toolchain/boundary*.test.ts`) still pass.
  - `src/engine/hand.ts` imports nothing new.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-16: Playtest stays clean after the engine refactor
- Verifies: DoD#6
- Behaviour: Given the `fullBetTarget` refactor, When 10,000 seeded bot hands run, Then the report shows zero invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-17: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-3.7`, When CI runs and the story doc is written, Then the workflow is green, and `backlog doc list --plain` lists a TASK-3.7 doc that records A-2 (chips only at model level until TASK-2.4) and D-3.
- Verification: manual CI run on branch `doit/TASK-3.7` and `backlog doc list --plain`

### SPEC-18: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) do not exist and this story adds no strategy content, When the Judge checks, Then the diff touches no file under `src/advice`, no golden spot and no strategy text.
- Verification: manual Judge confirms the diff has no strategy content and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Stack exactly equal to the call, bet or raise amount: plain label (A-1). SPEC-03, SPEC-13.
- Stack below the call amount: no raise is offered (engine `maxTo > currentBet`). SPEC-02, and SPEC-08 across
  states.
- Capped street, both owing (SPEC-01) and not owing: after a cap the only legal non-owing actions are check, or
  the seat is done. Covered by SPEC-08.
- Short all-in under half a bet followed by a raise from another seat: `fullBetTarget` ignores the uncounted
  level. SPEC-08 (oracle) and SPEC-13.
- An all-in blind (stack below the blind) and 2-seat (heads-up) hands: covered by the SPEC-08 generator (short
  bucket 1..2×bigBet, n = 2).
- Large chip amounts (L10 600/1,200): SPEC-08 includes L10; formatting follows D-4.
- A DOM bypass of `disabled`: SPEC-10 and SPEC-11.
- Concurrency, persistence, network, permissions: N/A. Labels are pure functions with no I/O.

## 8. Security considerations
- Trust boundary: the DOM. A user can edit attributes. Submission is gated in `ActionBar.onClick`
  (`model.enabled && action !== null`) and again by `useTableSession.act`, and the engine rejects any action
  outside `legalActions` (REQ-017.4). SPEC-10 and SPEC-11.
- No new dependencies, secrets, logging, randomness (test seeds only) or network requests (SPEC-12).

## 9. Non-functional
- Building the bar adds one `fullBetTarget` scan of the street's actions per bet or raise button: O(actions), at
  most about 30 records. This is negligible.
- The 100,000-state property should finish well inside the 30 s Vitest timeout (the prototype took about
  0.2 s); A-3 applies.
- Buttons stay ≥ 44 × 44 CSS px with longer labels ("Raise all-in to $6"), checked in SPEC-12.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173`, choose New game → Start
  game and play. Capped streets appear in normal play. Short stacks cannot happen in the live app because of
  the top-up (A-5), so the all-in labels are shown through `npm run e2e -- e2e/action-bar-limits.spec.ts`.
- New tests:
  - `tests/ui/action-bar-limits.acceptance.test.tsx` → SPEC-01..SPEC-07, SPEC-11
  - `tests/table/action-bar-limits.acceptance.test.ts` → SPEC-08, SPEC-09
  - `tests/table/action-bar.test.ts` (added `it`) → SPEC-13
  - `e2e/action-bar-limits.spec.ts` → SPEC-10, SPEC-12 (Chromium and WebKit)
  - Commands → SPEC-14, SPEC-15, SPEC-16
- End-to-end scenario for the Judge:
  1. Run `npm run e2e -- e2e/action-bar-limits.spec.ts e2e/action-bar.spec.ts` and expect every test green in
     both engines.
  2. Run `npx vitest run tests/table/action-bar-limits.acceptance.test.ts` and confirm the 100,000-state test
     passes.
  3. In the preview app, play hands until a street caps. The capped bar shows Fold and Call only.

## 11. Open questions
- None. Q-1 (D-3) and Q-2 (D-4) were answered in `doit/TASK-3.7/qa.md`, both auto-accepted with the
  recommended option.

## 12. Clarifications log
See `doit/TASK-3.7/qa.md`.
