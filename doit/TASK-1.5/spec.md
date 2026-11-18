# Spec: TASK-1.5 — Give each deciding seat only its own view of the hand

Status: READY (approved 2026-11-18 by user via Q-1/Q-2)
Task: TASK-1.5 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-025.1 (REQ-025.2/025.3 are E07) · Dream: limit-holdem-trainer

## 1. Summary
This task adds `src/engine/player-view.ts`: a `PlayerView` type and a pure `playerView(state, seat)` that builds
everything one seat could see at the table (its own hole cards, the board, every action, every stack and
contribution, the pots, the exact legal actions, and cards shown at earlier showdowns) and nothing else. Decision
code is typed as `SeatPolicy = (view: PlayerView) => Action`, and `actWith(state, policy)` is the engine call that
asks the seat to act: it builds the view, calls the policy and applies the action. Every bot (E06), the playtest
seat policies (TASK-1.6), golden spots, hints and grades (E07) consume this type, so it is plain serialisable data
designed to grow by adding fields (§4 D-1).

## 2. Scope
- In scope:
  - `src/engine/player-view.ts`: types `PlayerView`, `PublicPlayer`, `ShownHand`, `EarlierShowdown`, `SeatPolicy`;
    functions `playerView`, `actWith`, `showdownOf`.
  - Acceptance tests for AC#1–AC#3 (AC#3 via a sandboxed `npm run typecheck`), unit tests for the edges.
- Not doing:
  - Any change to `src/engine/hand.ts` or its tests (the view is built on its public API).
  - A production seat policy or bot (the M1 seeded random-legal policy is TASK-1.6; bots are E06). AC#2 uses a
    test-local seeded policy.
  - Collecting earlier showdowns across hands (the session/table layer and playtest own the list; this task only
    accepts it and provides `showdownOf` to derive one entry from a completed hand).
  - Show/muck order (TASK-1.15), game type and SNG level fields (TASK-5.1/5.4/7.17 add them), hints and grades on the
    user's view (REQ-025.2/025.3, E07), hand records (TASK-3.9), observed opponent statistics (E07).
  - Run-time defence against a deliberately malicious policy (casts, spreading `HandState` into a fake view): the
    policies are this project's own code; the guarantee is the type boundary plus a view that holds no hidden data.
- Scope budget: files=4, lines=620   (player-view.ts ~120, player-view.acceptance.test.ts ~200, player-view.property.test.ts ~140, player-view.test.ts ~160)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | New module `src/engine/player-view.ts` importing only `./hand` and `./cards` (types); `hand.ts` unchanged. Tests `tests/engine/player-view.acceptance.test.ts`, `player-view.property.test.ts`, `player-view.test.ts` | yes | Same one-module-per-concern layout as TASK-1.2/1.3/1.4; leaves TASK-1.4's locked tests untouched | Put the view inside `hand.ts` |
| A-2 | The view is a fresh copy: no object or array in the view is the same reference as one inside the `HandState` (except `earlierShowdowns`, A-3). Fields are copied by name, never by spreading a `PlayerState`/`HandState`, so a field added to the state later cannot reach the view without editing `player-view.ts` and its exact-keys test | yes | A policy that mutates its view (despite `readonly`) cannot corrupt the game, and future secret fields cannot leak by accident | Share references; deep-freeze |
| A-3 | `earlierShowdowns` is passed through by reference, not copied | yes | The list grows for a whole session; copying it on every decision would make each view O(session length) | Copy it each time |
| A-4 | `playerView` works for any dealt-in seat in any state (seat not to act, folded seat, completed hand); `legalActions` is `legalActions(state)` when `seat === state.toAct`, otherwise `[]`. A seat that is not dealt in throws `RangeError('Seat <n> is not dealt in')` | yes | The UI and hints need the user's view while others act; a wrong seat is a programming error, as with `createHand` (TASK-1.4 A-5) | Only allow `toAct`; return null |
| A-5 | `actWith` on a completed hand returns `{ ok: false, error: { code: 'hand-complete', … } }` without calling the policy; an illegal or out-of-turn action from the policy is returned as `applyAction`'s typed error, unchanged (no throw) | yes | Keeps one error model (TASK-1.4 D-2) | Throw |
| A-6 | `SeatPolicy` is synchronous | yes | Bots must decide in ≤ 100 ms (REQ-055.3) with seeded, local computation; the UI's human seat does not go through `actWith` | `Promise<Action>` |
| A-7 | AC#2's "seeded seat policy" is test-local: `Xoshiro128(seed ^ fnv1a32(JSON.stringify(view)))` picks uniformly among `view.legalActions` (without bet/raise when `view.betCount >= 4`), so its choice depends on every field of the view | yes | The production M1 policy belongs to TASK-1.6; a view-hashing policy is the strictest check that equal views give equal actions | Use TASK-1.4's AC#8 policy |

## 3. Current system
- TypeScript 6 strict with `noUncheckedIndexedAccess` and `strictFunctionTypes` (via `strict`) (`tsconfig.json:9-10`);
  `tsconfig.json:22` includes `src` and `tests`, so `npm run typecheck` (`package.json:15`) checks test files too.
  ESLint strict + headless boundary (`tools/lint/headless-boundary.js`, README "Conventions"); Vitest 5 with v8
  coverage ≥ 90% lines in `src/engine/**` (`vite.config.ts:16`); tests in `tests/**`.
- `HandState` (`src/engine/hand.ts:76-100`) holds secrets: every player's `holeCards` (`:32`), the full `deck`
  (`:82`) and `burned` (`:85`). Public parts: `stakes`, `button`, `board`, `street`, `pots`, `currentBet`,
  `betCount`, `toAct`, `actions` (blinds included), per-player stack/contribution/fold/all-in/hasActed, and
  `result` (`:99`). The replay code is not stored in the state (TASK-1.4 A-4).
- `legalActions(state)` (`src/engine/hand.ts:217`) returns exact amounts for `state.toAct`; `applyAction`
  (`:355`) returns a typed `ApplyResult` (`:102`), code `hand-complete` when the hand is over (`:356`).
- Legality never depends on cards (`hand.ts:217-241` reads only stakes, street and contributions), so the same
  action list replays on any deck — AC#2's test relies on this.
- Card positions (TASK-1.4 D-5, `hand.ts:166-176`, `:338-349`): with n seats and deal order = seats clockwise from
  the left of the button, the seat at deal index j holds 0-based deck indices j and j+n; burns at 2n, 2n+4, 2n+6;
  flop 2n+1..2n+3, turn 2n+5, river 2n+7.
- `result.showdown` (`hand.ts:68-72`) lists every remaining hand at showdown today; TASK-1.15 AC#4 makes it hold only
  shown hands ("absent from the hand result and from every later PlayerView"), so deriving earlier showdowns from it
  stays correct after TASK-1.15.
- AC#3 technique: `runInSandbox(files, 'typecheck')` (`tests/support/sandbox.ts:50`) runs the real
  `npm run typecheck` on a throw-away copy of the config plus given files; `tests/toolchain/typecheck.test.ts:20-34`
  asserts on the `TS....` code, file name and exit code the same way.
- What a seat may see is settled by the requirements (no question needed): REQ-025 statement
  (`dreams/limit-holdem-trainer/requirements.md:473`) gives the exhaustive list ("only … their own hole cards, the
  board, all actions and stacks, and cards shown at earlier showdowns"); REQ-025.1 (`:475`) excludes other players'
  hole cards and undealt cards; burned cards are "never revealed to players" (TASK-1.4 `qa.md` Q-3); the replay code
  determines the whole deck and "is not shown anywhere before the hand ends" (REQ-013.4, `requirements.md:268`);
  mucked cards never appear in later views (REQ-019.5 `:372`, TASK-1.15 AC#4).
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/engine/hand.ts:217` → `legalActions` for `view.legalActions`; `:355` `applyAction` inside `actWith`; types
    `Action`, `ActionRecord`, `ApplyResult`, `HandState`, `Pot`, `SeatNumber`, `Stakes`, `Street`.
  - `src/engine/seeded-random.ts:44` → `Xoshiro128`, `:4` `fnv1a32` for the test-local seeded policy and the AC#2
    generator.
  - `src/engine/deck.ts:24,41` → `replayCodeFromWords`, `shuffledDeck` for random hands in the property test.
  - `tests/support/sandbox.ts:50` → `runInSandbox`, `TOOLCHAIN_TIMEOUT_MS` for AC#3.
  - `tests/engine/hand.acceptance.test.ts:27-28,46-56` and `tests/engine/hand.property.test.ts:17-28` → copy the
    `REVERSED`/`at` deck, `play` and `dealHand` helpers (test files are not shared modules in this repo).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Public `PlayerView` shape and decision API as in §5 "Components": plain serialisable data (no class, no brand symbol), explicit `PublicPlayer` without `holeCards`, `legalActions` inside the view, current-hand `result` not included, `SeatPolicy = (view: PlayerView) => Action`, `actWith(state, policy, earlierShowdowns?)` | Branded/opaque view built only by the engine; `Omit<PlayerState,'holeCards'>`; legal actions passed as a 2nd argument; include `result`; leave the driver to TASK-1.6 | Golden spots (TASK-7.11) and hand records (TASK-3.1/3.9) store views as data, which a brand would block; type separation already holds structurally because `HandState` lacks `seat`, `holeCards`, `legalActions`, `earlierShowdowns`. Grows additively (game type, level, player names later) | yes | user (Q-1) |
| D-2 | "Cards shown at earlier showdowns" = `earlierShowdowns: readonly EarlierShowdown[]` (oldest first, each `{ shown: { seat, holeCards }[] }`), supplied by the caller (table/playtest session) as an optional argument defaulting to `[]`; `showdownOf(completedState)` derives the entry for a hand that reached showdown (null for a fold-out or unfinished hand) | Store the list in `HandConfig`/`HandState` (changes TASK-1.4's types); only the current hand's showdown; keep a field but leave it always empty until E03 | Within one hand nobody decides after showdown, so "earlier" means earlier hands, which only the session knows; an argument keeps `hand.ts` unchanged | yes | user (Q-2) |
| D-3 | Hidden from every view: other seats' hole cards (folded or not), the deck order, burned cards, the replay code, mucked cards | — | Settled by REQ-025, REQ-025.1, REQ-013.4, TASK-1.4 Q-3, REQ-019.5 (§3) | no | n/a (requirements) |

## 5. Design

### Files to create / modify
- `src/engine/player-view.ts` — new: view types, `playerView`, `actWith`, `showdownOf`
- `tests/engine/player-view.acceptance.test.ts` — new, locked: AC#1 and AC#3
- `tests/engine/player-view.property.test.ts` — new, locked: AC#2
- `tests/engine/player-view.test.ts` — new: exact keys, copies, seats not to act, errors, `showdownOf`

### Components, interfaces and data
Recommended public shape (Q-1, Q-2). `player-view.ts` imports only `./cards` (type) and `./hand`:
```ts
/** Hole cards a seat turned face up at a showdown. */
export interface ShownHand { readonly seat: SeatNumber; readonly holeCards: readonly [Card, Card] }
/** One earlier hand that reached showdown: only the hands that were shown. */
export interface EarlierShowdown { readonly shown: readonly ShownHand[] }
/** What everyone at the table sees about a player. No hole cards. */
export interface PublicPlayer {
  readonly seat: SeatNumber;
  readonly startingStack: number;
  readonly stack: number;
  readonly folded: boolean;
  readonly allIn: boolean;
  readonly streetContribution: number;
  readonly totalContribution: number;
  readonly hasActed: boolean;
}
/** Everything `seat` can see. Plain data: safe to store in hand records and golden-spot files. */
export interface PlayerView {
  readonly seat: SeatNumber;                         // the viewer
  readonly holeCards: readonly [Card, Card];         // the viewer's own cards
  readonly stakes: Stakes;
  readonly button: SeatNumber;
  readonly street: Street;
  readonly board: readonly Card[];
  readonly players: readonly PublicPlayer[];         // every dealt-in seat, ascending
  readonly pots: readonly Pot[];
  readonly currentBet: number;
  readonly betCount: number;
  readonly toAct: SeatNumber | null;
  readonly actions: readonly ActionRecord[];         // blinds first, every action so far
  readonly legalActions: readonly Action[];          // exact amounts when seat === toAct, else []
  readonly earlierShowdowns: readonly EarlierShowdown[]; // oldest first, as supplied (A-3)
}
/** Any deciding code: bots, playtest seat policies. Accepts only a PlayerView. */
export type SeatPolicy = (view: PlayerView) => Action;

/** The view of `seat`. Throws RangeError if `seat` is not dealt in. Never mutates `state`. */
export function playerView(state: HandState, seat: SeatNumber, earlierShowdowns?: readonly EarlierShowdown[]): PlayerView;
/** Asks state.toAct to act: builds its view, calls `policy` once, applies the returned action. */
export function actWith(state: HandState, policy: SeatPolicy, earlierShowdowns?: readonly EarlierShowdown[]): ApplyResult;
/** The shown hands of a hand that ended at showdown; null for a fold-out or an unfinished hand. */
export function showdownOf(state: HandState): EarlierShowdown | null;
```
Extension path: TASK-1.15 shrinks `result.showdown` to shown hands, and `showdownOf` follows it with no change;
TASK-5.1/5.4/7.17 add `gameType` and the SNG level to the view (the current big bet is already `stakes.bigBet`);
TASK-1.9/1.14 all-in fields arrive on `PublicPlayer` by adding a named copy line; E07 adds observed statistics as a
separate input next to the view, never inside it.

Invariants: `Object.keys(view)` is exactly the 14 keys above and each `players[i]` has exactly the 8 `PublicPlayer`
keys; the only `Card` values in a view are `holeCards`, `board` and `earlierShowdowns`; no object or array in the
view is `===` one inside `state` (A-2); `playerView` is a pure function of `(state, seat, earlierShowdowns)`.

### Rules and algorithms
1. `playerView(state, seat, earlier = [])`: find `seat` in `state.players` (else RangeError, A-4). Return
   `seat`, a copy of its `holeCards`; copies of `stakes`, `board`, `pots` (each `{ amount, eligible: [...] }`),
   `actions` (each record copied); `players` mapped field by field to `PublicPlayer`; `button`, `street`,
   `currentBet`, `betCount`, `toAct` as values; `legalActions = seat === state.toAct ? legalActions(state).map(copy) : []`;
   `earlierShowdowns = earlier`.
2. `actWith(state, policy, earlier = [])`: if `state.result !== null` (equivalently `toAct === null`) return
   `{ ok: false, error: { code: 'hand-complete', message: 'The hand is complete' } }` without calling `policy`.
   Otherwise `view = playerView(state, state.toAct, earlier)`; `action = policy(view)`; return
   `applyAction(state, action)`.
3. `showdownOf(state)`: `state.result?.endedBy === 'showdown'` → `{ shown: result.showdown.map(s => ({ seat: s.seat, holeCards: [s.holeCards[0], s.holeCards[1]] })) }`
   in `result.showdown` order; otherwise `null`.
- Worked example (AC#1): 6 seats, $4/$8, stacks 160, button 1, deck `REVERSED` (0-based index i holds card 51−i).
  All limp (4, 5, 6, 1 call 4; 2 calls 2; 3 checks); on the flop seat 2 checks. Seat 3 is to act. Its view:
  `holeCards [50, 44]` (indices 1 and 7), `board [38, 37, 36]` (indices 13–15; burn card 39 at index 12 absent),
  `street 'flop'`, `pots [{ amount: 24, eligible: [1,2,3,4,5,6] }]`, `currentBet 0`, `betCount 0`, `toAct 3`,
  9 `actions` (2 blinds, 6 preflop, seat 2's check), every player `stack 156`, `streetContribution 0`,
  `totalContribution 4`, `folded false`, `allIn false`, `hasActed` true only for seat 2,
  `legalActions [{ seat: 3, type: 'check' }, { seat: 3, type: 'bet', amount: 4 }]`.

### Error handling and configuration
- `playerView` with a seat not dealt in: `RangeError('Seat <n> is not dealt in')`.
- `actWith`: completed hand → `hand-complete` error, policy not called; policy returns an action not in the legal set
  or for another seat → the `applyAction` error (`illegal-action` / `out-of-turn`), state unchanged.
- No configuration.

## 6. Behaviour specification

### SPEC-01: The engine asks the seat to act with exactly that seat's view
- Verifies: AC#1, DoD#1
- Behaviour: Given the §5 worked example (seat 3 to act on the flop) and `earlier = [showdownOf(prev)]` where `prev` is a 6-seat `REVERSED` hand played to showdown by calling/checking, When `actWith(state, spy, earlier)` runs with a spy policy that records its argument and returns `{ seat: 3, type: 'check' }`, Then the spy is called exactly once, its argument `toEqual`s the exact view in the worked example with `earlierShowdowns` equal to `earlier` (6 shown hands, each equal to `prev`'s hole cards for that seat), `Object.keys` of the view is exactly the 14 `PlayerView` keys and of each player exactly the 8 `PublicPlayer` keys (no `holeCards`, `deck`, `burned`, `result`), and the returned result is `ok` with last action `{ street: 'flop', seat: 3, type: 'check', amount: 0, added: 0 }`.
- Verification: acceptance `tests/engine/player-view.acceptance.test.ts::player-view acceptance > AC#1 the engine passes the acting seat only its own view`

### SPEC-02: Changing hidden cards never changes the view or a seeded policy's action
- Verifies: AC#2, DoD#1, DoD#6
- Behaviour: Given 300 hands from `Xoshiro128(20261117)` (3–10 seats, random button, `shuffledDeck` of a random replay code, actions by the A-7 policy) and every decision point in them, When a second deck keeps the acting seat's two hole-card indices and the board indices dealt so far and rotates all other cards (other seats' hole cards, burns, undealt cards) among the remaining indices by a random non-zero offset, and the same action prefix is replayed on it, Then every hidden index holds a different card, `playerView` for the acting seat on both states is deep-equal (`toEqual`), and the A-7 seeded policy returns deep-equal actions on both; and as a control, swapping one of the acting seat's own hole cards with a hidden card makes the views differ.
- Verification: acceptance `tests/engine/player-view.property.test.ts::player-view property > AC#2 hidden cards never change the view or a seeded policy's action`

### SPEC-03: Passing the full game state to decision code fails the typecheck
- Verifies: AC#3, DoD#1
- Behaviour: Given a sandbox holding `src/engine/{cards,hand-evaluator,hand,player-view}.ts` (read from the repo) and a probe `src/engine/probe.ts` that declares `state: HandState` and `policy: SeatPolicy` and contains (a) `policy(state)` and (b) `actWith(state, (s: HandState) => legalActions(s)[0] as Action)`, When `npm run typecheck` runs, Then it exits non-zero and the output holds two `TS2345` errors located in `src/engine/probe.ts` (one per line (a) and (b)) and contains the text `PlayerView`; and Given the control probe that instead calls `policy(playerView(state, 1))` and `actWith(state, (v: PlayerView) => v.legalActions[0] as Action)`, Then it exits 0.
- Verification: acceptance `tests/engine/player-view.acceptance.test.ts::player-view acceptance > AC#3 decision code typed on PlayerView rejects the full game state`

### SPEC-04: The view holds no reference into the state and leaves it untouched
- Verifies: AC#1
- Behaviour: Given a mid-hand state and its deep clone, When `playerView` is called for each seat and then every array and object in each view is mutated through a cast, Then the state still `toEqual`s the clone, and a recursive walk finds no object or array in the view that is `===` one reachable from the state (except `earlierShowdowns`, which is `===` the argument passed, A-3).
- Verification: unit `tests/engine/player-view.test.ts::playerView > copies everything and never mutates the state`

### SPEC-05: Views of seats not to act, folded seats and completed hands
- Verifies: AC#1
- Behaviour: Given the worked example, When `playerView(state, 5)` runs, Then it carries seat 5's own hole cards (indices 3 and 9: `[48, 42]`), the same public fields as seat 3's view and `legalActions []`; Given seat 4 has folded, Then its view still has its own cards and `legalActions []`; Given a completed hand, Then every seat's view has `toAct null`, `legalActions []` and no `result` key.
- Verification: unit `tests/engine/player-view.test.ts::playerView > seats not to act, folded seats and completed hands`

### SPEC-06: Errors from the view and the driver
- Verifies: AC#1
- Behaviour: Given a 6-seat hand over seats 1–6, When `playerView(state, 7)` runs, Then it throws `RangeError` with message `Seat 7 is not dealt in`; When `actWith` runs on a completed hand, Then it returns `{ ok: false, error: { code: 'hand-complete', message: 'The hand is complete' } }` and the policy is not called; When the policy returns `{ seat: 3, type: 'bet', amount: 8 }` on the flop (legal bet is 4), Then the result is `{ ok: false }` with code `illegal-action`; When it returns an action for seat 4, Then the code is `out-of-turn`.
- Verification: unit `tests/engine/player-view.test.ts::actWith > returns typed errors and skips the policy on a completed hand`

### SPEC-07: Earlier showdowns are derived only from shown hands
- Verifies: AC#1
- Behaviour: Given a hand played to showdown, When `showdownOf` runs, Then it returns `{ shown }` with one `{ seat, holeCards }` per `result.showdown` entry in the same order and nothing else; Given a fold-out hand or an unfinished hand, Then it returns `null`.
- Verification: unit `tests/engine/player-view.test.ts::showdownOf > lists shown hands and is null otherwise`

### SPEC-08: Checks, coverage, headless boundary and no network
- Verifies: DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` runs, Then each exits 0, no `ERROR: Coverage` line is printed and `src/engine/player-view.ts` shows ≥ 90% lines; the grep prints nothing: `player-view.ts` imports only relative engine modules and uses no network API, dynamic import, Node built-in, `Math.random`, `Date`, `performance`, `crypto` or `process`.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -nE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]|node:|Math\.random|Date|performance|crypto|process" src/engine/player-view.ts`

### SPEC-09: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: Given branch `doit/TASK-1.5` is pushed, When its latest CI run completes, Then its conclusion is `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-1.5 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-10: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: Given this task, Then: DoD#3 does not apply (golden-spot suite arrives in E07-S14); DoD#6 does not apply (playtest runner arrives in TASK-1.6; SPEC-02 plays 300 seeded hands through the view as the stand-in); DoD#7 and DoD#12 do not apply (no screen: `git diff --stat main` shows no change under `src/ui/`, `e2e/`, `index.html` or `src/main.tsx`); DoD#9 does not apply (no strategy content). DoD#11: the TASK-1.5 story document is published with `backlog doc` and appears in `backlog doc list --plain`.
- Verification: manual `git diff --stat main -- src/ui e2e index.html src/main.tsx` is empty and `backlog doc list --plain` lists the TASK-1.5 story document

## 7. Edge cases
- Seat not to act, folded seat, completed hand: SPEC-05. Seat not dealt in: SPEC-06.
- Every street and table size 3–10, button anywhere, decisions after folds: SPEC-02 (300 random hands, all decision points).
- Policy returns an illegal, wrong-seat or post-completion action: SPEC-06.
- Policy mutating its view: SPEC-04.
- Hidden cards that collide with shown/earlier cards: N/A — earlier showdowns come from other hands, and a view only
  holds cards the seat legitimately saw.
- Empty `earlierShowdowns` (M1 default) and fold-out hands producing no entry: SPEC-02 (empty), SPEC-07.
- Concurrency, interruption, permissions, dependency failure: N/A — synchronous pure functions without I/O.

## 8. Security considerations
- This task is the hidden-information trust boundary (REQ-025.1). Hidden data — other seats' hole cards, `deck`,
  `burned`, replay code, mucked cards — is excluded by construction (explicit field copies, A-2), checked by exact-key
  tests (SPEC-01) and by the hidden-card property test (SPEC-02). Decision code is typed on `PlayerView` only
  (SPEC-03). The replay code is not in `HandState` at all.
- Threat model: accidental leakage by this project's own code, not a hostile plug-in; casts and object spreads can
  defeat any TypeScript boundary, so code review of E06/E07 must keep bots on `SeatPolicy`.
- Randomness: none in `player-view.ts`; test policies use the seeded `Xoshiro128`. Bot randomness (REQ-028.1, seeded
  from replay code + seat) must be supplied to the policy by its creator, not through the view.
- Secrets, authn/authz, injection, logging: N/A. New dependencies: none.

## 9. Non-functional
- `playerView` cost is O(players + actions) and independent of session length (A-3); no timing assertions in
  `npm test` (TASK-1.20).
- Determinism: `playerView` is pure; `actWith` adds only the policy call (SPEC-02).
- Coverage ≥ 90% lines on `src/engine/player-view.ts` (SPEC-08).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing entry point until the playtest CLI (TASK-1.6); `npx vitest run tests/engine/player-view` runs this task's tests
- New tests (path → SPEC ids):
  - `tests/engine/player-view.acceptance.test.ts` → SPEC-01, SPEC-03 (locked; SPEC-03 uses `TOOLCHAIN_TIMEOUT_MS`)
  - `tests/engine/player-view.property.test.ts` → SPEC-02 (locked)
  - `tests/engine/player-view.test.ts` → SPEC-04, SPEC-05, SPEC-06, SPEC-07
- End-to-end scenario for the Judge (as a developer writing a bot):
  1. `npm run lint && npm run typecheck && npm test` exits 0.
  2. In a scratch file under `src/engine/`, write `const bot: SeatPolicy = (v) => v.legalActions[0] as Action` and
     play a `shuffledDeck` 6-seat hand to completion with `actWith`; then change the call to `bot(state)` and confirm
     `npm run typecheck` fails with TS2345.
  3. Mutation probes (revert after each): spread `...p` into `PublicPlayer` (SPEC-01 key check fails); return every
     seat's cards in `holeCards` or add `deck` to the view (SPEC-01/SPEC-02 fail); give non-acting seats the legal
     actions (SPEC-05 fails); return `state.actions` by reference (SPEC-04 fails); widen `SeatPolicy` to
     `PlayerView | HandState` (SPEC-03 fails).
  4. Run the SPEC-08 grep and the SPEC-10 checks.

## 11. Open questions
- None. Q-1 (D-1, plain-data PlayerView per §5) and Q-2 (D-2, caller-supplied `earlierShowdowns`) answered — see `qa.md`.
- Noted follow-ups (outside this task's scope, for later stories):
  1. Seat identity across hands: `earlierShowdowns` is keyed by seat; when a cash seat's bot is replaced (REQ-007.5) or in a sit-and-go, the session layer (E03/E06) must reset or filter the list, or add a player id to `ShownHand` (additive).
  2. REQ-028.2 replay vs bot memory: if bots use `earlierShowdowns` or observed stats, replaying a single hand needs that session context, which REQ-052.2 hand records do not store — decide in E06 / TASK-3.9 / E07-S09.
  3. Game type and SNG level on the view (TASK-5.1/7.17) need `HandConfig` to carry them; the current big bet is already `stakes.bigBet`.
  4. The type boundary can be defeated by casts or spreads; E06/E07 code review must keep bots on `SeatPolicy`.

## 12. Clarifications log
See `doit/TASK-1.5/qa.md`.
