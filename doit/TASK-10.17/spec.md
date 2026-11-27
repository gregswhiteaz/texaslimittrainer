# Spec: TASK-10.17 — Ignore a forced-fold-voided raise when classifying the preflop situation, and tidy the forced-fold code

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-10.17 · Parent/epic: TASK-10 · Requirements: n/a (follow-up of TASK-10.13, doc-178, its A-2) · Dream: limit-holdem-trainer

## 1. Summary
When the user leaves mid-hand holding a strict top bet, `forceFold` voids that bet down to the live top
(TASK-10.13 R2): the amount to match drops but the voided raise record stays in the history. `situationOf`
counts it anyway, so bots (and any advice) read the "facing a raise" chart cells for a pot that is
effectively unraised. This task makes `situationOf` skip voided bets/raises, using one new engine helper that
applies the exact voiding rule the engine already uses, and applies two review tidy-ups from TASK-10.13.

## 2. Scope
- In scope:
  - New exported engine helper `voidedBets` in `src/engine/hand.ts` (same rule as `liveLevels`).
  - `situationOf` (`src/advice/preflop.ts:104-118`) ignores raise records that `voidedBets` reports.
  - Tidy-up 1: `forceFold`'s ring start at `src/engine/hand.ts:791` becomes `clockwiseAfter(open, toAct - 1)`
    with a comment (no ternary).
  - Tidy-up 2: `sole` in `src/engine/invariants.ts:291-292` is computed once, before the awards loop.
  - Advice lint allow-list: add `'voidedBets'` to the advice `engine/hand` `allowImportNames`
    (`tools/lint/headless-boundary.js:320-324`) and update the adjacent comment (`:327-328`) (A-5).
  - Tests for the above, including a lint probe.
- Not doing:
  - No change to `liveLevels`, `forceFold` settlement, pots, legal actions, `currentBet`/`betCount` or any
    engine output (byte-identical).
  - No change to `PlayerView` / `playerView` fields (the view already carries everything needed).
  - No change to `positionOf`, `chartSpotOf`'s fallback, the charts, explanations, postflop advice or bots'
    own code (they benefit through `situationOf`/`chartSpotOf`).
  - No change to the bots' `engine/hand` allow-list (`tools/lint/headless-boundary.js:232-236`), to the
    advice/bot `TSImportType` selectors, or to any existing (locked) `tests/toolchain/*` file.
  - No UI, copy or storage changes; no new dependencies.
- Scope budget: files=7, lines=230

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A record counts as voided exactly when the engine's rule voids it: at a same-street fold of a seat whose street chips exceed the live top (highest street chips of a not-folded seat; preflop at least the big blind), every earlier same-street `bet`/`raise` record whose `amount` exceeds that live top is voided. This also covers a normally-folded seat's raise voided by a later forced fold (the engine voids those levels too). | yes | Mirrors `liveLevels` (`src/engine/hand.ts:322-354`), so the advice's situation agrees with the engine's `currentBet`/`betCount`. | Ignore only the leaver's own raises (would disagree with the engine in multi-raise cases). |
| A-2 | The helper lives in the engine (`src/engine/hand.ts`) and is exported; advice imports it. | yes | The voiding rule is engine semantics; advice may import `engine/hand` once `voidedBets` is on its allow-list (A-5). Avoids a second copy of the rule in advice. | Re-implement the walk inside `situationOf`. |
| A-3 | Calls are not filtered: a call made after a raise that is later voided stays a call (so it reads as a limper if no live raise precedes it). Such a call can only exist as a short all-in call (a full call would match the leaver, who then is not a strict top). | yes | Rare; the caller did put chips in above the blind, and "limpers" is the closest unraised spot. | Treat it as a raise; drop it entirely. |
| A-5 | `src/advice` may import from `engine/hand` only `Action`, `SeatNumber`, `Street`, `STREET_BET_CAP` (`tools/lint/headless-boundary.js:320-324`); `voidedBets` is added to that advice `allowImportNames` list and the comment at `:327-328` is updated to name it. `preflop.ts` imports no `BetContext` type: it passes an inline object literal `{ street: 'preflop', stakes: view.stakes, actions: view.actions }`, which type-checks structurally, so no type name needs allowing (the `ADVICE_TYPE_IMPORT_SYNTAX` selector at `:331-342` stays as is). | yes | `voidedBets` is a pure function over the public action history and stakes that the view already exposes; it returns indices only and reveals no hidden state (hole cards, deck), so REQ-025.1's boundary still holds. | Re-implement the walk inside `src/advice` (duplicated rule); pass the result through `PlayerView` (view format change). |
| A-4 | Seeded playtests never call `forceFold` (only `src/table/session.ts:504` does), so playtest and golden outputs are unchanged by the `situationOf` change. | yes | `grep forceFold src` finds only `hand.ts` and `table/session.ts`. | n/a |

## 3. Current system
- `situationOf(view)` (`src/advice/preflop.ts:104-118`) filters preflop non-blind records, counts `raise`
  records and classifies: 0 raises → `limpers` if another seat called else `unopened`; >1 → `re-raise`; 1 →
  `blind-defence` for SB/BB, else `raise-and-calls`/`raise` by calls after the raise.
- Callers: `chartSpotOf` (`src/advice/preflop.ts:89-101`) → `recommendPreflop`, `src/bots/rock.ts:34`,
  `src/table/review.ts:136`; `src/advice/golden.ts:422,443`.
- `forceFold` (`src/engine/hand.ts:734-799`) appends `{ street, seat, type: 'fold', amount: 0, added: 0 }`
  (`:752`) and, when the folder held a strict top bet, lowers `currentBet`/`betCount` via `liveLevels`
  (`:766-788`). The ring start is `clockwiseAfter(open, toAct === seat ? seat : toAct - 1)` (`:791`).
- `liveLevels(state: BetContext)` (`src/engine/hand.ts:329-354`, private) is the voiding rule; `BetContext =
  Pick<HandState, 'street' | 'stakes' | 'actions'>` (`:314`) and "a PlayerView satisfies it" (`:313`).
- `clockwiseAfter(seats, from)` (`src/engine/hand.ts:123-127`) returns `seats` starting at the first seat
  `> from`. `open` (`settle`, `:714`) excludes folded seats, so the folder is never in it.
- `playerView` copies `state.actions` in order with all fields (`src/engine/player-view.ts:98-104`), so view
  action indices equal state action indices.
- Invariants: `sole` is recomputed inside `for (const award …) for (const { seat } …)`
  (`src/engine/invariants.ts:288-293`) but depends on neither loop variable.
- Advice lint boundary: `src/advice/**` may import sibling advice files and engine
  `player-view`/`hand`/`cards`/`hand-evaluator`/`seeded-random` (`tools/lint/headless-boundary.js:308-325`);
  from `engine/hand` only the names `Action`, `SeatNumber`, `Street`, `STREET_BET_CAP` (`:320-324`,
  `allowImportNames`). Bots have their own list without `STREET_BET_CAP` (`:232-236`) and may import advice.
  Toolchain tests probe lint in-process with `new ESLint({ cwd: REPO_ROOT }).lintText(code, { filePath })`
  (`tests/toolchain/bot-import-gaps.acceptance.test.ts:181-184`, `REPO_ROOT` from `tests/support/sandbox`).
- Tests: Vitest (`npm test`, coverage), `*.acceptance.test.ts` / `*.property.test.ts` naming; worked
  forced-fold examples in `tests/engine/force-fold-top-bet.acceptance.test.ts` (E2 at `:57-70`);
  `situationOf` tests build views with `createHand`+`applyAction` (`tests/advice/preflop.test.ts:18-45`).
- Existing code to reuse:
  - `src/engine/hand.ts` `liveLevels`/`betUnit` → same walk (`put` map, `folded` set, preflop floor) for the
    new helper; a private shared walker is fine if engine output stays byte-identical.
  - `tests/engine/force-fold-top-bet.acceptance.test.ts:18-48` → `deal`/`play` helper pattern (copy into
    the new test, do not import from a test file).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Add `export function voidedBets(state: BetContext): ReadonlySet<number>` to `src/engine/hand.ts`; `situationOf` calls it with `{ street: 'preflop', stakes: view.stakes, actions: view.actions }`. | Inline the rule in advice; add a field to `PlayerView`. | One source of truth for voiding; no view/data-format change; within the lint boundary. | no | n/a |
| D-2 | Tidy-up 1 exactly as the AC states: `clockwiseAfter(open, toAct - 1)` with a comment explaining why it also covers `toAct === seat`. | Keep the ternary. | Equivalent: when `toAct === seat` the folder is not in `open`, so the ring after `seat - 1` and after `seat` start at the same seat (seat 1 → `from` 0 → whole list, same as from 1). | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — add exported `voidedBets`; tidy the `forceFold` ring start (`:790-791`).
- `src/engine/invariants.ts` — hoist `sole` above the awards loop.
- `src/advice/preflop.ts` — `situationOf` drops voided records before classifying; doc comment updated.
- `tools/lint/headless-boundary.js` — add `'voidedBets'` to the advice `engine/hand` `allowImportNames`; update the comment.
- `tests/toolchain/advice-voided-bets-import.acceptance.test.ts` — new: SPEC-06 lint probe.
- `tests/advice/preflop-voided-raise.acceptance.test.ts` — new: SPEC-01..03.
- `tests/engine/voided-bets.test.ts` — new: SPEC-04.

### Components, interfaces and data
- `voidedBets(state: BetContext): ReadonlySet<number>` — indices into `state.actions` of records on
  `state.street` with type `bet` or `raise` that a fold has voided. Pure, never mutates. Empty set when no
  void. Doc comment cites TASK-10.13 R2 and TASK-10.17.
- `situationOf(view)` — signature unchanged. Builds `voided = voidedBets({ street: 'preflop', stakes:
  view.stakes, actions: view.actions })` and filters out records whose index is in `voided` (index taken from
  `view.actions` before the street/blind filter), then classifies exactly as today.

### Rules and algorithms
- Voiding walk (A-1), over `state.actions` with index `i`:
  - Record on another street: if `fold`, add its seat to `folded`; skip.
  - Same street: `put[seat] += added`. If `fold`: add seat to `folded`; `live = max(floor, put[s] for s not
    folded)` with `floor = bigBlind` preflop else 0; if `put[seat] > live`, add to the result every index
    `j < i` on this street whose record is `bet`/`raise` with `amount > live`.
- Worked examples (stakes 2/4/4/8, seats 1-6 at 160, button 6; SB 1, BB 2; indices count the blinds 0, 1):
  - E2: `3:call:4 4:raise:8 5:fold 6:fold`, then `forceFold(4)` → voided {3}. Seat 1 (to act) view:
    `situationOf` = `limpers` (today: `blind-defence`).
  - U: `3:raise:8 4:fold 5:fold 6:fold`, then `forceFold(3)` → voided {2}. Seat 1 view: `unopened` (today
    `blind-defence`).
  - P (partial): `3:raise:8 4:raise:12 5:fold 6:fold 1:fold`, then `forceFold(4)` (live top 8) → voided
    {3}; the raise to 8 survives. Seat 2 view: `blind-defence` (today `re-raise`).
  - L (later raise): E2, then `1:raise:8` → voided still {3}. Seat 2 view: `blind-defence` (today
    `re-raise`).
  - No forced fold (any hand through `applyAction` only): voided = {} and `situationOf` unchanged.

### Error handling and configuration
- None new. `voidedBets` never throws on a valid history.

## 6. Behaviour specification

### SPEC-01: A voided raise reads as unraised for the next decider
- Verifies: AC#1
- Behaviour: Given hand E2 (seat 3 limps, seat 4 raises to 8, seats 5 and 6 fold) and `forceFold(state, 4)`,
  When `situationOf(playerView(state, 1))` runs, Then it returns `'limpers'`, and
  `chartSpotOf(view, '6-max')` returns `{ position: 'SB', situation: 'limpers' }`. Given hand U (seat 3
  raises to 8, seats 4-6 fold) and `forceFold(state, 3)`, When `situationOf` runs for seat 1, Then it
  returns `'unopened'`.
- Verification: acceptance `tests/advice/preflop-voided-raise.acceptance.test.ts::a raise voided by a forced fold is ignored`

### SPEC-02: Only the voided part is ignored
- Verifies: AC#1
- Behaviour: Given hand P and `forceFold(state, 4)`, When `situationOf` runs for seat 2, Then it returns
  `'blind-defence'` (the raise to 8 still counts). Given hand E2, `forceFold(state, 4)`, then seat 1 raises to
  8, When `situationOf` runs for seat 2, Then it returns `'blind-defence'` (the new raise counts, the voided
  one does not).
- Verification: acceptance `tests/advice/preflop-voided-raise.acceptance.test.ts::raises that survive or follow a void still count`

### SPEC-03: Unchanged without a void
- Verifies: AC#2
- Behaviour: Given hands with no forced fold, When `situationOf` runs, Then results equal today's: the
  existing `tests/advice/preflop.test.ts`, `tests/bots/*`, `tests/golden/` suites pass unchanged, and for
  hands P and E2 before `forceFold` seat 2 / seat 1 read `'re-raise'` / `'blind-defence'`; and
  `npm run -s playtest -- --hands 10000 --seed 42` output is byte-identical to the base commit's output.
- Verification: command `npx vitest run tests/advice tests/bots tests/golden && npm run -s playtest -- --hands 10000 --seed 42 > after.txt` diffed against the same command run on the base commit (`git stash`/worktree of `main`), plus acceptance `tests/advice/preflop-voided-raise.acceptance.test.ts::without a forced fold the situation is unchanged`

### SPEC-04: voidedBets reports the engine's voided records
- Verifies: AC#1, AC#2
- Behaviour: Given E2 + `forceFold(4)` → `voidedBets(state)` is `{3}`; P + `forceFold(4)` → `{3}`; U +
  `forceFold(3)` → `{2}`; E2 before the forced fold → empty; a forced fold of a seat that is not a strict top
  (e.g. `3:raise:8 4:call:8` then `forceFold(4)`) → empty. The state passed in is not mutated.
- Verification: unit `tests/engine/voided-bets.test.ts::voidedBets matches the forced-fold voiding rule`

### SPEC-05: Forced-fold and invariants tidy-ups keep every engine result
- Verifies: AC#3
- Behaviour: Given `forceFold` uses `clockwiseAfter(open, toAct - 1)` (with a comment) and `checkState`
  computes `sole` once before the awards loop, When the engine suites and the 10,000-hand playtest run, Then
  all pass, `tests/engine/force-fold*.test.ts` pass unchanged, and the playtest output is byte-identical to
  the base commit's with 0 invariant violations.
- Verification: command `npx vitest run tests/engine tests/table tests/playtest && npm run -s playtest -- --hands 10000 --seed 42` (output diffed against the base commit's)

### SPEC-06: Advice may import voidedBets and nothing else new from engine/hand
- Verifies: AC#1
- Behaviour: Given the advice lint boundary, When `import { voidedBets } from '../engine/hand';\n\nexport const v = voidedBets;\n` is linted as `src/advice/probe.ts` (ESLint `lintText`, `cwd` REPO_ROOT), Then it has 0 errors; When `import { applyAction } from '../engine/hand';\n\nexport const a = applyAction;\n` is linted at the same path, Then it has at least one error whose message contains `Advice code that bots use may import only`; When the `voidedBets` probe is linted as `src/bots/probe.ts`, Then it has at least one error (bots' list unchanged); and `npm run lint` exits 0.
- Verification: acceptance `tests/toolchain/advice-voided-bets-import.acceptance.test.ts::advice may import voidedBets from engine/hand but not other engine values`, plus command `npm run lint`

## 7. Edge cases
- Forced fold of a seat that is not a strict top: nothing voided (SPEC-04).
- Partial void with a surviving earlier raise (SPEC-02, P).
- New raise after a void (SPEC-02, L).
- Forced fold out of turn vs while to act: same history shape; ring tidy-up covers both (SPEC-05, existing
  `tests/engine/force-fold*.test.ts`).
- Seat 1 as folder with `toAct === seat` (`toAct - 1 = 0`): `clockwiseAfter` returns the whole list,
  identical to today (D-2); covered by the existing property test `tests/engine/force-fold.property.test.ts`.
- Short all-in call after a later-voided raise: A-3 (no dedicated test; rare).
- `situationOf` on a postflop view (golden.ts:422): helper is called with `street: 'preflop'`, so preflop
  voids are used regardless of the view's street.
- Concurrency, permissions, dependency failure: N/A (pure functions).

## 8. Security considerations
The advice boundary (REQ-025.1) widens by one pure name, `voidedBets`, which reads only the public action
history and stakes and returns record indices; no hidden cards or deck are reachable (A-5, SPEC-06 shows other
`engine/hand` values stay blocked). Otherwise N/A — no untrusted input, secrets, storage, randomness or new
dependencies.

## 9. Non-functional
- `voidedBets` is O(actions²) worst case on a ≤ ~40-record street; no measurable cost. Existing perf tests
  (`tests/advice/*.perf.test.ts`, opt-in) unchanged.
- Coverage thresholds of `npm test` hold.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests: `tests/advice/preflop-voided-raise.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03;
  `tests/engine/voided-bets.test.ts` → SPEC-04; `tests/toolchain/advice-voided-bets-import.acceptance.test.ts` → SPEC-06. SPEC-05 relies on existing engine suites + playtest diff.
- Judge end-to-end: run the playtest on the base commit and on the branch and diff (must be identical); run
  `npx vitest run tests/golden/`; build E2 in a REPL/test and confirm seat 1's `recommendPreflop` reads the
  SB `limpers` cell.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-10.17/qa.md`.
