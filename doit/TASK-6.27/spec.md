# Spec: TASK-6.27 — Close the remaining bot import gaps (type-position imports, advice path)

Status: READY (approved 2026-11-26)
Task: TASK-6.27 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-025.1 (bot decisions see only the seat's own view), REQ-026.1, REQ-029.3 (context) · Dream: limit-holdem-trainer

## 1. Summary
TASK-6.21 added an ESLint boundary that stops `src/bots/**` from importing engine internals, but a
type-position import such as `type H = import('../engine/hand').HandState` slips past it (doc-149, J-1-01;
confirmed in 3). This task adds `TSImportType` selectors to the bot boundary so those fail lint with the
REQ-025.1 message while the allowed PlayerView types still pass (AC#1). For AC#2 the user chose (Q-1, option
(a)): bots may keep importing `src/advice`, and a new lint block keeps engine hand state out of the advice code
bots can reach, with bots barred from `src/advice/golden.ts` (D-3, SPEC-03..05). At finish the orchestrator
records a Backlog decision for D-3 (SPEC-08).

## 2. Scope
- In scope:
  - Two `no-restricted-syntax` selectors for `TSImportType` in `botSeatPolicyConfig`
    (`tools/lint/headless-boundary.js`).
  - The AC#2 decision (D-3, option (a)) recorded in this spec and in a comment beside the lint block it governs;
    an advice boundary block plus a bot ban on `src/advice/golden.ts` (5, SPEC-03..06).
  - One new toolchain acceptance test file with one sandbox `npm run lint` run.
- In scope (orchestrator, Backlog CLI step at finish, because builders don't edit Backlog):
  - One Backlog decision, `backlog decision create "<title>" -s accepted` (SPEC-08), as in TASK-6.20/6.24.
- Not doing:
  - No change under `src/` (bots and advice already comply; see 3). No change to bot behaviour or playtest output.
  - No edit to the locked `tests/toolchain/bot-boundary.acceptance.test.ts` (TASK-6.21, `doit/TASK-6.21/state.json` `locked_tests`); new probes go in a new file.
  - No `TSImportType` check for `src/advice/**` (types cannot reach runtime, and advice has no such imports today).
  - No transitive import-graph walker; the advice check is per-file lint, like the bot boundary.
  - J-1-02 (`export {} from '../engine/hand'`, no bindings) stays out, as doc-149 decided.
  - Barring bots from `src/advice` (Q-1 option (b), not chosen); no bot rewrite.
  - No requirements-document edit; the decision is recorded in this spec, the code comment, a Backlog decision and the task summary (A-4).
  - No new dependency; no speed/scale test (none is needed; nothing goes in the slow group).
- Scope budget: files=3, lines=230   (the Backlog decision is made by the orchestrator via the CLI and does not count)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Type-position imports follow the same allow-list as `import type`: any `import('…/engine/player-view')` type (including `typeof import(…)`) passes; from `engine/hand` only `.Action`, `.SeatNumber`, `.Street` pass (so `typeof import('../engine/hand')` and `import('../engine/hand').HandState` fail); any other engine module fails; a non-normalized specifier (`/./`, `//`, `name/..`) fails. | yes | Matches `BOT_BOUNDARY_PATTERNS` (`tools/lint/headless-boundary.js:142-153`), so nothing forbidden as `import type` is allowed as `import()`. | Ban every `TSImportType` of the engine in bots |
| A-2 | The failures reuse `BOT_BOUNDARY_MESSAGE` (`tools/lint/headless-boundary.js:136-137`) unchanged. | yes | AC#1 asks for "the REQ-025.1 boundary message". | A dedicated message |
| A-3 | Tests: one sandbox `npm run lint` for every failing probe and in-process `ESLint.lintText`/`lintFiles` for passing cases, in one new file `tests/toolchain/bot-import-gaps.acceptance.test.ts` (tooling group). | yes | Same pattern as TASK-6.21 A-4; one sandbox run (~5–15 s) keeps the tooling group fast. | Extend the locked file (needs an unlock) |
| A-4 | The AC#2 decision is recorded as D-3 here, as a comment on the lint block, as a Backlog decision (`backlog decision create "<title>" -s accepted`; the CLI has no body option, so the rationale goes in the task's final summary, as TASK-6.20/6.24 did), and in the task's final summary; `dreams/limit-holdem-trainer/requirements.md` is not edited. | yes | REQ-025.1 already states the rule; the decision is about how it is enforced, not what it requires. Decisions decision-1/decision-2 follow the same path (`backlog decision list --plain`). | Add a note under REQ-025 |
| A-5 | Advice message `ADVICE_BOUNDARY_MESSAGE` = "Advice code that bots use may import only PlayerView-boundary engine types and the pure card, evaluator and random helpers, so bots cannot reach hidden cards through it (REQ-025.1)." and bots importing `advice/golden` get `BOT_BOUNDARY_MESSAGE`. Developer-facing only. | yes | Follows the "(REQ-…)" message convention (`tools/lint/headless-boundary.js:32-53`). | Other wording |

## 3. Current system
- Bot boundary today: `botSeatPolicyConfig` (`tools/lint/headless-boundary.js:166-173`) uses
  `@typescript-eslint/no-restricted-imports` with `BOT_BOUNDARY_PATTERNS` (`:142-153`) plus
  `no-restricted-syntax` = `BOT_DETERMINISM_RESTRICTED_SYNTAX` (`:102-107`) + `BOT_SIDE_EFFECT_IMPORT` (`:156-159`).
  Registered last before prettier in `eslint.config.js` (after `botDeterminismConfig`).
- **Gap confirmed** (in-process ESLint with the repo config, typescript-eslint 8.73.0): in `src/bots/probe.ts`,
  `export type H = import('../engine/hand').HandState;` and `export type M = typeof import('../engine/hand');`
  produce zero lint messages. `no-restricted-imports` does not look at type-position imports.
- AST (typescript-estree 8.73.0): `import('../engine/hand').HandState` is
  `TSImportType { source: Literal { value: '../engine/hand' }, qualifier: Identifier { name: 'HandState' } }`;
  `typeof import('../engine/hand')` is `TSTypeQuery { exprName: TSImportType { qualifier: null } }`. A dotted
  qualifier (`import('x').A.B`) is a `TSQualifiedName`. The property is `source` (not the older `argument`).
- `src/bots` imports from `src/advice` today (multi-line blocks read in full):
  - `src/bots/tag.ts:3-10` — `equityWithBudget` (+ types) from `advice/equity`, type `PostflopOptions` from `advice/postflop`, `adviceOptions`, `recommend` from `advice/recommend`.
  - `src/bots/rock.ts:3-5` — `handClassOf` (`advice/hand-class`), `chartSpotOf` (`advice/preflop`), `adviceOptions`, `recommend`.
  - `src/bots/maniac.ts:3`, `src/bots/calling-station.ts:3` — `adviceOptions`, `recommend`.
  - `src/bots/style.ts:3-12` — `HAND_CLASSES` (`advice/hand-class`), `SIX_MAX_CHART` (`advice/preflop`), `APPLICABLE_SPOTS`, `chartCell` (`advice/preflop-chart`), type `Recommendation`.
  - TAG plays the advice engine's action (REQ-026.1, `dreams/limit-holdem-trainer/requirements.md:492`; `src/bots/tag.ts:38-44`), and every other style starts from `recommend`.
- Advice modules a bot can reach (transitive closure from the imports above): `recommend`, `postflop`,
  `preflop`, `preflop-chart`, `equity`, `ranges`, `hand-class`, `explain`, `explanations`, plus chart/range JSON.
  Not reachable from bots: `golden.ts`, `grade.ts`, `chart-print.ts` (no module in the closure imports them;
  `golden.ts` is imported only by `tests/golden/*`).
- Engine runtime that reachable advice imports — all pure helpers with no hand state:
  - `engine/cards` (`cardRank`, `cardSuit`, `RANK_CHARS`, `formatCard`) — `src/advice/hand-class.ts:1`, `ranges.ts:1`, `equity.ts:1`.
  - `engine/hand-evaluator` (`evaluate` etc.) — `src/advice/equity.ts:2`, `ranges.ts:3-8`.
  - `engine/seeded-random` (`splitMix32`) — `src/advice/equity.ts:3` (Monte Carlo sampling).
  - `engine/hand` constant `STREET_BET_CAP` only (+ types `Action`, `SeatNumber`) — `src/advice/preflop.ts:1`, `ranges.ts:2`, `postflop.ts:2`.
  - `engine/player-view` types only — `recommend.ts:1`, `preflop.ts:2`, `postflop.ts:3`, `ranges.ts:9`.
- Where hidden cards live: only in `HandState` (other seats' hole cards, the deck), built by `createHand`
  and passed to `playerView` (`src/engine/player-view.ts:63-72`), which copies only seat-visible fields.
  Every bot-reachable advice entry point takes a `PlayerView` (`src/advice/recommend.ts:1`). No advice file
  except `golden.ts` mentions `HandState`, `createHand`, `applyAction` or the deck (grep of `src/advice`).
  `golden.ts:1-10` imports `createHand`, `applyAction`, `HandState`, `playerView` to build fixed golden-spot
  hands from test data — never the live hand. Bots get no replay code or seed (they get a `BotRandom` of draws,
  `src/bots/tag.ts:19-24`), so even the PRNG in `seeded-random` cannot rebuild the deck.
  Conclusion: the bots → advice → engine path is **theoretical today**: nothing on it can see hidden cards.
  The real risk is future drift — a HandState-taking helper added to a bot-reachable advice file, or a bot
  importing `advice/golden` — which no check stops today.
- REQ-029.3 (`requirements.md:542`, added by TASK-6.20): a bot decision depends only on the current hand.
  The advice path already honours it: bots use `BOT_ADVICE` = `{ opponentRanges: 'actions' }`, "never observed
  stats" (`src/bots/tag.ts:34-36`); observed stats enter only via `userAdviceOptions` (`src/advice/recommend.ts:24-29`).
  Not this task's concern beyond noting it.
- Tests: Vitest; toolchain tests in `tests/toolchain/` (`npm run test:tooling`, `package.json:16`); full
  `npm test` (`package.json:13`) includes them. `runInSandbox(files, 'lint')` copies the config files incl.
  `tools/lint/headless-boundary.js` and the probes only — no real `src/` (`tests/support/sandbox.ts:18-28,60-75`).
- Existing code to reuse:
  - `tools/lint/headless-boundary.js` → `BOT_BOUNDARY_MESSAGE`, `BOT_BOUNDARY_PATTERNS` regex spellings, the non-normalized-path regex (`:145`), `BOT_DETERMINISM_RESTRICTED_SYNTAX`.
  - `tests/support/sandbox.ts` → `runInSandbox`, `REPO_ROOT`, `TOOLCHAIN_TIMEOUT_MS`.
  - `tests/toolchain/bot-boundary.acceptance.test.ts:52-67` → `fileBlock` / `expectError` helpers (copy; not exported) and the in-process `ESLint` pattern (`:95-114`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Close the type-position gap with `no-restricted-syntax` `TSImportType` selectors appended to `botSeatPolicyConfig`'s existing list. | Custom rule; ban all `TSImportType` in bots | `no-restricted-imports` ignores `TSImportType`; selectors use installed rules and keep the PlayerView types usable (AC#1). | no | n/a |
| D-2 | Probes live in a new test file; the locked TASK-6.21 file is untouched. | Unlock and extend it | No locked-test edit needed. | no | n/a |
| D-3 | AC#2: bots may keep importing `src/advice`; a lint block (`adviceHiddenStateConfig`) stops every advice file except `golden.ts` from importing engine hand state, and bots may not import `advice/golden` (option (a)). | (b) bar bots from `src/advice` (rewrite all five styles); (c) allow with no new check | Every bot builds on the advice engine (TAG plays it exactly, REQ-026.1); the path is safe today (3), so a per-file lint guard against future drift keeps REQ-025.1 mechanical without a rewrite. | yes | Approved by user (Q-1), 2026-11-26 |

## 5. Design

### Files to create / modify
- `tools/lint/headless-boundary.js` — add `BOT_TYPE_IMPORT_SYNTAX` (two selectors) to `botSeatPolicyConfig`; also `ADVICE_BOUNDARY_MESSAGE`, `ADVICE_BOUNDARY_FILES`, `ADVICE_BOUNDARY_IGNORES`, `ADVICE_BOUNDARY_PATTERNS`, `adviceHiddenStateConfig`, and an `advice/golden` pattern in `BOT_BOUNDARY_PATTERNS`, with a D-3 comment.
- `eslint.config.js` — import and register `adviceHiddenStateConfig` after `botSeatPolicyConfig`.
- `tests/toolchain/bot-import-gaps.acceptance.test.ts` — new: SPEC-01..05.
- Not for the builder: `backlog/decisions/` (one decision, SPEC-08) — the orchestrator makes it with the CLI at finish.

### Components, interfaces and data
AC#1, in `tools/lint/headless-boundary.js`:
```js
// Type-position import('…') is a TSImportType, which no-restricted-imports does not check (TASK-6.27).
const BOT_TYPE_IMPORT_SYNTAX = [
  { // other engine modules, and any non-normalized path
    selector:
      "TSImportType[source.value=/(^|\\/)engine\\//]:not([source.value=/(^|\\/)engine\\/(player-view|hand)$/])," +
      "TSImportType[source.value=/\\/\\.\\/|\\/\\/|(^|\\/)[^.\\/][^\\/]*\\/\\.\\.(\\/|$)/]",
    message: BOT_BOUNDARY_MESSAGE,
  },
  { // engine/hand: only Action, SeatNumber, Street
    selector:
      "TSImportType[source.value=/(^|\\/)engine\\/hand$/]:not([qualifier.type='Identifier'][qualifier.name=/^(Action|SeatNumber|Street)$/])",
    message: BOT_BOUNDARY_MESSAGE,
  },
];
// botSeatPolicyConfig 'no-restricted-syntax':
//   ['error', ...BOT_DETERMINISM_RESTRICTED_SYNTAX, BOT_SIDE_EFFECT_IMPORT, ...BOT_TYPE_IMPORT_SYNTAX]
```
The builder may respell selectors if esquery needs it; the table in "Rules" is the contract.

AC#2 check (D-3):
```js
export const ADVICE_BOUNDARY_FILES = ['src/advice/**'];
// golden.ts builds fixed golden-spot hands for tests with createHand/applyAction; bots may not import it.
export const ADVICE_BOUNDARY_IGNORES = ['src/advice/golden.ts'];
export const ADVICE_BOUNDARY_PATTERNS = [
  { regex: '/\\./|//|(^|/)[^./][^/]*/\\.\\.(/|$)', message: ADVICE_BOUNDARY_MESSAGE },
  { regex: '(^|/)engine/(?!(player-view|hand|cards|hand-evaluator|seeded-random)$)[^/]+$', message: ADVICE_BOUNDARY_MESSAGE },
  { regex: '(^|/)engine/player-view$', allowTypeImports: true, message: ADVICE_BOUNDARY_MESSAGE },
  { regex: '(^|/)engine/hand$', allowImportNames: ['Action', 'SeatNumber', 'Street', 'STREET_BET_CAP'], message: ADVICE_BOUNDARY_MESSAGE },
];
/** D-3 (TASK-6.27, Q-1): bots may import src/advice; this keeps hand state out of it (REQ-025.1). */
export const adviceHiddenStateConfig = {
  name: 'advice-hidden-state',
  files: ADVICE_BOUNDARY_FILES,
  ignores: ADVICE_BOUNDARY_IGNORES,
  rules: { '@typescript-eslint/no-restricted-imports': ['error', { patterns: ADVICE_BOUNDARY_PATTERNS }] },
};
// and in BOT_BOUNDARY_PATTERNS: { regex: '(^|/)advice/golden$', message: BOT_BOUNDARY_MESSAGE }
```
No other block sets `@typescript-eslint/no-restricted-imports` for `src/advice/**`, so nothing is overridden.
Package imports in advice stay allowed (out of scope).

### Rules and algorithms
AC#1 — outcome for a line in a file under `src/bots/` (F = boundary error, P = none):
| Source line | Outcome |
|---|---|
| `export type H = import('../engine/hand').HandState;` | F |
| `export type M = typeof import('../engine/hand');` | F |
| `export type C = import('../engine/cards').Card;` | F |
| `export type S = import('../engine/./hand').Action;` | F (non-normalized) |
| `export type D = import('../../engine/deck').ReplayCode;` (in `src/bots/styles/`) | F |
| `export type P = import('../engine/player-view').PlayerView;` (also `SeatPolicy`, `PublicPlayer`, `ShownHand`, `EarlierShowdown`) | P |
| `export type A = import('../engine/hand').Action;` (also `SeatNumber`, `Street`) | P |
| `export type R = import('../advice/recommend').Recommendation;` | P |

AC#2 — outcome for a file under `src/advice/` other than `golden.ts`:
| Source line | Outcome |
|---|---|
| `import { createHand } from '../engine/hand';` / `applyAction` / `type HandState` | F |
| `import { playerView } from '../engine/player-view';` | F |
| `import { shuffle… } from '../engine/deck';` / `engine/invariants` / `engine/bot-random` | F |
| `import { STREET_BET_CAP, type Action } from '../engine/hand';` | P |
| `import { evaluate } from '../engine/hand-evaluator';`, `engine/cards`, `engine/seeded-random` | P |
| `src/advice/golden.ts` as it is today | P (ignored) |
And in `src/bots/`: `import { parseGoldenSpots } from '../advice/golden';` → F.

### Error handling and configuration
ESLint errors (severity 2); `npm run lint` uses `--max-warnings 0` (`package.json:20`) and exits non-zero;
stylish output names each offending file.

## 6. Behaviour specification

### SPEC-01: Type-position engine imports in bot code fail lint
- Verifies: AC#1
- Behaviour: Given sandbox probes `src/bots/type-hand-state.ts` (`export type H = import('../engine/hand').HandState;`), `src/bots/type-hand-module.ts` (`export type M = typeof import('../engine/hand');`), `src/bots/type-cards.ts` (`export type C = import('../engine/cards').Card;`), `src/bots/type-dot.ts` (`export type S = import('../engine/./hand').Action;`) and `src/bots/styles/type-deck.ts` (`export type D = import('../../engine/deck').ReplayCode;`), When `npm run lint` runs, Then it exits non-zero and each file's stylish block has an error line containing "PlayerView-boundary" and "REQ-025.1".
- Verification: acceptance `tests/toolchain/bot-import-gaps.acceptance.test.ts::type-position engine imports in bot code fail npm run lint`

### SPEC-02: PlayerView-boundary types in type position still pass
- Verifies: AC#1
- Behaviour: Given `src/bots/probe.ts` declaring `export type T = [import('../engine/player-view').PlayerView, import('../engine/player-view').SeatPolicy, import('../engine/player-view').PublicPlayer, import('../engine/player-view').ShownHand, import('../engine/player-view').EarlierShowdown, import('../engine/hand').Action, import('../engine/hand').SeatNumber, import('../engine/hand').Street, import('../advice/recommend').Recommendation];`, When linted in-process with the repo ESLint config, Then it has zero severity-2 messages; and `eslint.lintFiles(['src/bots'])` reports zero severity-2 messages.
- Verification: acceptance `tests/toolchain/bot-import-gaps.acceptance.test.ts::PlayerView-boundary types in type position pass`

### SPEC-03: Advice code cannot import hand state
- Verifies: AC#2
- Behaviour: Given, in the SPEC-01 sandbox run, probes `src/advice/probe-create-hand.ts` (`import { createHand } from '../engine/hand'; export { createHand };`), `src/advice/probe-hand-state.ts` (`import type { HandState } from '../engine/hand'; export type { HandState };`), `src/advice/probe-view-fn.ts` (`import { playerView } from '../engine/player-view'; export { playerView };`) and `src/advice/probe-deck.ts` (`import type { ReplayCode } from '../engine/deck'; export type { ReplayCode };`), When `npm run lint` runs, Then each file's block has an error line containing "Advice code that bots use" and "REQ-025.1".
- Verification: acceptance `tests/toolchain/bot-import-gaps.acceptance.test.ts::advice code that imports hand state fails npm run lint`

### SPEC-04: Bots cannot import the golden-spot module
- Verifies: AC#2
- Behaviour: Given, in the same sandbox run, `src/bots/golden.ts` (`import { parseGoldenSpots } from '../advice/golden'; export { parseGoldenSpots };`), When `npm run lint` runs, Then its block has an error line containing "PlayerView-boundary" and "REQ-025.1".
- Verification: acceptance `tests/toolchain/bot-import-gaps.acceptance.test.ts::bot code that imports advice/golden fails npm run lint`

### SPEC-05: Real advice and bot code stay clean; allowed helpers pass
- Verifies: AC#2
- Behaviour: Given the repo, When linted in-process, Then `eslint.lintFiles(['src/advice', 'src/bots'])` reports zero severity-2 messages; and `src/advice/probe.ts` with `import { STREET_BET_CAP, type Action } from '../engine/hand'; import { evaluate } from '../engine/hand-evaluator'; import { formatCard } from '../engine/cards'; import { splitMix32 } from '../engine/seeded-random'; import type { PlayerView } from '../engine/player-view';` (all re-exported) has zero severity-2 messages; and the SPEC-03 `createHand` source linted as `src/advice/golden.ts` has no "Advice code that bots use" message.
- Verification: acceptance `tests/toolchain/bot-import-gaps.acceptance.test.ts::bot-reachable advice code lints clean and golden.ts is exempt`

### SPEC-06: The decision is recorded in the spec and the lint module
- Verifies: AC#2
- Behaviour: Given the build, When the spec and lint module are read, Then D-3 states option (a) with "Approved by user (Q-1)", and `tools/lint/headless-boundary.js` has a comment above `adviceHiddenStateConfig` naming TASK-6.27 and D-3/Q-1 and saying bots may import `src/advice`.
- Verification: command `grep -n "TASK-6.27" tools/lint/headless-boundary.js && grep -n "Approved\|user (Q-1)" doit/TASK-6.27/spec.md`

### SPEC-07: No behaviour change
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the gates run, Then `git diff --stat main -- src` is empty, lint, typecheck and `npm test` pass, and the locked `tests/toolchain/bot-boundary.acceptance.test.ts` is unchanged.
- Verification: command `test -z "$(git diff --stat main -- src tests/toolchain/bot-boundary.acceptance.test.ts)" && npm run lint && npm run typecheck && npm test`

### SPEC-08: The decision is recorded as a Backlog decision (orchestrator, at finish)
- Verifies: AC#2
- Behaviour: Given the user chose option (a) (Q-1), When the orchestrator at finish runs `backlog decision create "Bots may import src/advice; a lint guard keeps engine hand state out of it (TASK-6.27 Q-1)" -s accepted --plain`, Then `backlog decision list --plain` lists that title with status accepted, and TASK-6.27's final summary cites its id, Q-1 and the D-3 rationale (A-4). The builder does not run this.
- Verification: command `backlog decision list --plain | grep "TASK-6.27 Q-1"`

## 7. Edge cases
- `typeof import(...)` (no qualifier) from `engine/hand` — SPEC-01.
- Nested bot folder (`../../engine/deck`) — SPEC-01.
- Non-normalized type-position path — SPEC-01.
- Dotted qualifier `import('../engine/hand').Action.x` — qualifier is a `TSQualifiedName`, so the hand selector reports it (not Identifier); tsc rejects it anyway. Covered by the same selector; no probe.
- Generic `import('../engine/player-view').X<T>` — allowed like any player-view type; no hidden data.
- Mixed `import { STREET_BET_CAP, createHand }` in advice — `allowImportNames` reports `createHand` (same mechanism as SPEC-03).
- Advice `golden.ts` — exempt by `ignores` (SPEC-05); bots barred from it (SPEC-04).
- Bots reaching `advice/grade.ts` — imports only PlayerView types and advice modules (`src/advice/grade.ts:1-8`); falls under the advice block; no hidden state. N/A.

## 8. Security considerations
- Trust boundary: fairness of bot decisions (REQ-025.1). AC#1 closes a compile-time-only hole (types cannot
  reach runtime data, so not a live leak). AC#2 (D-3) makes the "advice never touches hand state"
  property mechanical for every module a bot can reach. Runtime boundary (`playerView`) unchanged.
- No new dependency, secrets, randomness or user input. Others N/A.

## 9. Non-functional
- One extra sandbox `npm run lint` in the tooling group (~5–15 s, under `TOOLCHAIN_TIMEOUT_MS` 120 s). No speed/scale test; nothing added to the slow group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/toolchain/bot-import-gaps.acceptance.test.ts`
- New tests: `tests/toolchain/bot-import-gaps.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05.
- SPEC-08 is an orchestrator step at finish; check it after the orchestrator runs it.
- Judge scenario: add `export type H = import('../engine/hand').HandState;` to a scratch file in `src/bots/`, run `npm run lint`, see it fail naming the file with the REQ-025.1 message; replace with `import('../engine/hand').Action` and lint passes. Then add `import { createHand } from '../engine/hand';` to a scratch file in `src/advice/` and see lint fail; delete both.

## 11. Open questions
None. Q-1 answered by the user on 2026-11-26: option (a) — allow bots to use `src/advice` and add the lint guard (D-3).

## 12. Clarifications log
See `doit/TASK-6.27/qa.md`.
