# Spec: TASK-6.21 — Keep bots on SeatPolicy with a lint boundary

Status: READY (approved 2026-11-25)
Task: TASK-6.21 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-025.1 (fairness: decisions see only the seat's own view) · Dream: limit-holdem-trainer

## 1. Summary
Bots must decide only from a `PlayerView` (TASK-1.5, doc-13). Today that is enforced by types plus a regex source
scan in `tests/bots/tag.test.ts` (TASK-6.1 SPEC-09), and a cast or a direct import of `src/engine/hand.ts`
runtime would let a bot see hidden cards. This chore adds an ESLint boundary for `src/bots/**` next to the
existing headless boundary, so `npm run lint` fails on any engine import outside the PlayerView types, then
deletes the source-scan test that the rule replaces. No runtime code changes.

## 2. Scope
- In scope:
  - A `botSeatPolicyConfig` block in `tools/lint/headless-boundary.js`, registered in `eslint.config.js` after
    `botDeterminismConfig`, scoped to `src/bots/**`.
  - One new toolchain acceptance test; removing the SPEC-09 source-scan test and its helpers from
    `tests/bots/tag.test.ts`.
- Not doing:
  - No change under `src/` (bots already comply; see 3). No change to engine, advice, table or playtest code.
  - No boundary for `src/advice/**`. The task description mentions advice, but every AC is about `src/bots`, and
    `src/advice/golden.ts:2` legitimately imports `createHand`/`applyAction` (scope concern, see final report).
  - No transitive check: bots may still import `src/advice/**`, which itself imports engine runtime
    (`src/advice/equity.ts:2-3`). The rule governs what bot files import directly, as SPEC-09 did.
  - No new dependency (uses `@typescript-eslint/no-restricted-imports` from the installed `typescript-eslint`
    8.73.0 and core `no-restricted-syntax`).
  - No change to the headless (REQ-059.2) or determinism (REQ-028.1) rule sets other than reusing their lists.
- Scope budget: files=4, lines=260

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The allow-list is exactly SPEC-09's: type-only imports of any `src/engine/player-view.ts` export type (`PlayerView`, `PublicPlayer`, `SeatPolicy`, `ShownHand`, `EarlierShowdown`), and the names `Action`, `SeatNumber`, `Street` from `src/engine/hand.ts`. Every other engine module (`cards`, `deck`, `hand-evaluator`, `seeded-random`, `bot-random`, `invariants`) is banned, type imports included. | yes | Matches the test being replaced (`tests/bots/tag.test.ts:55-65`), so nothing that is forbidden today becomes allowed. | Also allow `type Card` from `cards` |
| A-2 | Package imports (any specifier not starting with `.`) are also banned in `src/bots/**`, as SPEC-09 did (`tests/bots/tag.test.ts:73-76`). | yes | Replacing the scan must not drop a check it made; no bot imports a package today. | Drop the package ban |
| A-3 | Rule messages: `BOT_BOUNDARY_MESSAGE` = "Bot code may import only PlayerView-boundary types from the engine (PlayerView, SeatPolicy and other src/engine/player-view.ts types; Action, SeatNumber, Street from src/engine/hand.ts), so it cannot see hidden cards (REQ-025.1)." and `BOT_PACKAGE_MESSAGE` = "Bot code may import only project modules by relative path (REQ-025.1)." Developer-facing only. | yes | Follows the "(REQ-…)" suffix convention in `tools/lint/headless-boundary.js:38-50`. | Other wording |
| A-4 | The new test runs `npm run lint` once in the sandbox for the failing probes (AC#1, AC#3) and uses the in-process `ESLint` API for the passing cases, like `tests/toolchain/bot-determinism.test.ts:7-44`. | yes | One sandbox run (~seconds) keeps the tooling group fast. | One sandbox run per probe |

## 3. Current system
- ESLint flat config `eslint.config.js:1-36` composes `typeStrippingConfig`, `headlessBoundaryConfig`,
  `botDeterminismConfig` from `tools/lint/`. Flat config replaces a rule's options per file when a later block
  sets the same rule, which is why `botDeterminismConfig` repeats the headless entries
  (`tools/lint/headless-boundary.js:98-103`).
- `src/bots/**` is already covered by: core `no-restricted-imports` (React, IndexedDB, `**/ui`;
  `headless-boundary.js:31-44,64`), `no-restricted-syntax` with `ImportExpression` banned (dynamic `import()`,
  `headless-boundary.js:52-58`) plus determinism selectors (`headless-boundary.js:117-123`).
- `@typescript-eslint/no-require-imports` (in `tseslint.configs.strict`) already rejects `require()`;
  `erasableSyntaxOnly` (`tsconfig.json`) rejects `import x = require()`.
- Current bot engine imports (all compliant): `import type { Action } from '../engine/hand'` and
  `import type { PlayerView[, SeatPolicy] } from '../engine/player-view'` in `src/bots/{calling-station,decide,maniac,rock,style,tag}.ts:1-2`;
  JSON style imports are relative (`src/bots/tag.ts:13`). No side-effect imports in `src/bots`.
- `src/engine/hand.ts` exports: types `SeatNumber, Stakes, SeatConfig, HandConfig, Street, PlayerState, Pot, Action, ActionRecord, PotAward, HandResult, HandState, ApplyErrorCode, ApplyResult, BetContext`; values `STREET_BET_CAP, minimumStack, assertChips, nextButton, createHand, fullBetTarget, legalActions, splitPot, applyAction, forceFold` (`src/engine/hand.ts:5-702`).
  `src/engine/player-view.ts` exports types `ShownHand, EarlierShowdown, PublicPlayer, PlayerView, SeatPolicy` and
  values `playerView, actWith, showdownOf, rememberShowdown, forgetSeats` (`src/engine/player-view.ts:16-161`).
- The test being replaced: `tests/bots/tag.test.ts:55-95` (`ENGINE_TYPES`, `IMPORT`, `boundaryProblems`) and
  `tests/bots/tag.test.ts:147-180` (`it('bots import only PlayerView-boundary types from the engine')`); it uses
  imports `readdirSync, readFileSync` (line 1), `join, posix` (line 2), `REPO_ROOT` (line 10) only for that test.
- Rule capabilities verified in `node_modules`: core `no-restricted-imports` supports `regex` and
  `allowImportNames` in patterns (`node_modules/eslint/lib/rules/no-restricted-imports.js:105-163`) and reports
  `export * from` as `*` (`:815-818`), but an import with no specifiers (side-effect) yields no names and is NOT
  reported by a group that has `allowImportNames` (`:607-640`). The typescript-eslint wrapper adds
  `allowTypeImports` and skips the base rule for a type-only import whose source matches any
  `allowTypeImports` pattern (`node_modules/@typescript-eslint/eslint-plugin/dist/rules/no-restricted-imports.js:160-215`).
- Tests: Vitest; toolchain tests live in `tests/toolchain/` (group `npm run test:tooling`, `package.json:16`).
  `runInSandbox(files, 'lint')` copies `eslint.config.js` and `tools/lint/*.js` plus probe files and runs
  `npm run lint` (`tests/support/sandbox.ts:19-29,61-100`).
- Locked tests touching the lint boundary or bot interfaces (from `doit/*/state.json` `locked_tests`):
  `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (TASK-1.26, TASK-1.40),
  `tests/toolchain/type-stripping-lint.acceptance.test.ts` (TASK-1.28), `tests/toolchain/boundary.test.ts`,
  `boundary.property.test.ts`, `lint.test.ts` (TASK-1.1, TASK-1.40), `tests/engine/player-view.{acceptance,property}.test.ts`
  (TASK-1.5), `tests/bots/tag{,-playtest}.acceptance.test.ts` (TASK-6.1). None needs to change: they import only
  `HEADLESS_DIRS`, `HEADLESS_FILES`, `BROWSER_ONLY_GLOBALS`, which stay as they are. `tests/bots/tag.test.ts` is
  not locked (TASK-6.1 locked only its two acceptance files), so removing SPEC-09 needs no unlock.
- Existing code to reuse:
  - `tools/lint/headless-boundary.js` → module home, message style, `HEADLESS_RESTRICTED_SYNTAX` and the
    determinism syntax entries (to repeat in the new block).
  - `tests/support/sandbox.ts` → `runInSandbox`, `REPO_ROOT`, `TOOLCHAIN_TIMEOUT_MS`.
  - `tests/toolchain/headless-lint-dirs.acceptance.test.ts:15-22` → `fileBlock` pattern for reading one file's
    stylish block (copy the 6-line helper; it is not exported).
  - `tests/toolchain/bot-determinism.test.ts:7,37-42` → in-process `ESLint` + `lintText` pattern.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Enforce with `@typescript-eslint/no-restricted-imports` (patterns with `regex`, `allowTypeImports`, `allowImportNames`) plus one `no-restricted-syntax` selector for side-effect imports of engine modules. | Custom ESLint rule/plugin; core rule only; esquery-only selectors | Uses installed rules; the TS variant is the only one that tells `import type` from value imports. A separate rule name avoids overriding the headless core `no-restricted-imports` options. Side-effect imports need the selector because `allowImportNames` groups ignore them (3). | no | n/a |
| D-2 | `botSeatPolicyConfig` repeats the bot-determinism `no-restricted-syntax` list (extracted to a `BOT_DETERMINISM_RESTRICTED_SYNTAX` const used by both blocks) and appends the side-effect selector. | Put the selector into `botDeterminismConfig` (would also apply to `src/advice`) | Keeps the new ban scoped to `src/bots`, and follows the existing "repeat on override" precedent. | no | n/a |
| D-3 | Delete SPEC-09's test and helpers from `tests/bots/tag.test.ts` instead of keeping both. | Keep both | AC#3 says it is replaced. | no | n/a |

## 5. Design

### Files to create / modify
- `tools/lint/headless-boundary.js` — add `BOT_BOUNDARY_FILES`, messages, `BOT_BOUNDARY_PATTERNS`, `botSeatPolicyConfig`; extract `BOT_DETERMINISM_RESTRICTED_SYNTAX`.
- `eslint.config.js` — import and register `botSeatPolicyConfig` after `botDeterminismConfig`.
- `tests/toolchain/bot-boundary.acceptance.test.ts` — new: SPEC-01, SPEC-02, SPEC-03.
- `tests/bots/tag.test.ts` — remove SPEC-09 test, `ENGINE_TYPES`, `IMPORT`, `boundaryProblems` and now-unused imports (SPEC-04).

### Components, interfaces and data
In `tools/lint/headless-boundary.js` (exports are lint-internal):
```js
export const BOT_BOUNDARY_FILES = ['src/bots/**'];
export const BOT_BOUNDARY_PATTERNS = [
  { regex: '^(?!\\.)', message: BOT_PACKAGE_MESSAGE },                                   // packages, node: builtins
  { regex: '(^|/)engine/(?!(player-view|hand)$)[^/]+$', message: BOT_BOUNDARY_MESSAGE }, // other engine modules, all kinds
  { regex: '(^|/)engine/player-view$', allowTypeImports: true, message: BOT_BOUNDARY_MESSAGE }, // types only
  { regex: '(^|/)engine/hand$', allowImportNames: ['Action', 'SeatNumber', 'Street'], message: BOT_BOUNDARY_MESSAGE },
];
const BOT_SIDE_EFFECT_IMPORT = {
  selector: "ImportDeclaration[specifiers.length=0][source.value=/(^|\\/)engine\\//]",
  message: BOT_BOUNDARY_MESSAGE,
};
/** Must come after botDeterminismConfig (repeats its no-restricted-syntax list). */
export const botSeatPolicyConfig = {
  name: 'bot-seat-policy',
  files: BOT_BOUNDARY_FILES,
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', { patterns: BOT_BOUNDARY_PATTERNS }],
    'no-restricted-syntax': ['error', ...BOT_DETERMINISM_RESTRICTED_SYNTAX, BOT_SIDE_EFFECT_IMPORT],
  },
};
```
`botDeterminismConfig.rules['no-restricted-syntax']` becomes `['error', ...BOT_DETERMINISM_RESTRICTED_SYNTAX]`
with identical contents to today (no behaviour change for `src/advice/**` or `src/engine/bot-random.ts`).
The builder may adjust regex spelling if a test shows a gap, but the behaviour table below is the contract.

### Rules and algorithms
Outcome for a file under `src/bots/` (F = lint error naming the file, P = no boundary error):
| Source line | Outcome | Caught by |
|---|---|---|
| `import type { PlayerView, SeatPolicy, PublicPlayer, ShownHand, EarlierShowdown } from '../engine/player-view';` | P | — |
| `import type { Action, SeatNumber, Street } from '../engine/hand';` | P | — |
| `import { playerView } from '../engine/player-view';` | F | pattern 3 (value import) |
| `import type { HandState } from '../engine/hand';` | F | pattern 4 (name not allowed) |
| `import { applyAction } from '../engine/hand';` / `import { createHand } ...` / `STREET_BET_CAP` | F | pattern 4 |
| `import * as hand from '../engine/hand';` | F | pattern 4 (`*`) |
| `export { applyAction } from '../engine/hand';` | F | pattern 4 |
| `export * from '../engine/hand';` | F | pattern 4 (`*`) |
| `export { actWith } from '../engine/player-view';` | F | pattern 3 |
| `import '../engine/hand';` | F | side-effect selector |
| `export const load = () => import('../engine/hand');` | F | existing `ImportExpression` ban (REQ-059.2) |
| `import type { Card } from '../engine/cards';` | F | pattern 2 |
| `import { readFileSync } from 'node:fs';` | F | pattern 1 |
| `import tag from './styles/tag.json' with { type: 'json' };`, `import { recommend } from '../advice/recommend';` | P | — |

### Error handling and configuration
- Errors are ESLint errors (severity 2); `npm run lint` runs with `--max-warnings 0` (`package.json:21`) and exits
  non-zero, and stylish output prints each offending file path followed by its messages.

## 6. Behaviour specification

### SPEC-01: Bot imports of hidden engine state fail lint, naming the file
- Verifies: AC#1
- Behaviour: Given sandbox probe files `src/bots/value-import.ts` (`import { applyAction } from '../engine/hand';`), `src/bots/create-hand.ts` (`import { createHand } from '../engine/hand';`), `src/bots/hand-state.ts` (`import type { HandState } from '../engine/hand';`), `src/bots/bet-cap.ts` (`import { STREET_BET_CAP } from '../engine/hand';`), `src/bots/view-fn.ts` (`import { playerView } from '../engine/player-view';`) and `src/bots/cards.ts` (`import type { Card } from '../engine/cards';`), each also exporting what it imports, When `npm run lint` runs, Then it exits non-zero and the stylish block for each of those files contains a line with "PlayerView-boundary" and "REQ-025.1".
- Verification: acceptance `tests/toolchain/bot-boundary.acceptance.test.ts::bot code that imports engine internals fails npm run lint, naming each file`

### SPEC-02: Re-exports, side-effect and dynamic imports also fail
- Verifies: AC#3
- Behaviour: Given, in the same sandbox run as SPEC-01, `src/bots/reexport.ts` (`export { applyAction } from '../engine/hand';`), `src/bots/reexport-all.ts` (`export * from '../engine/hand';`), `src/bots/side-effect.ts` (`import '../engine/hand';`), `src/bots/dynamic.ts` (`export const load = (): Promise<unknown> => import('../engine/hand');`) and `src/bots/package.ts` (`import { readFileSync } from 'node:fs';` re-exported), When `npm run lint` runs, Then each file's block has an error line: "PlayerView-boundary" + "REQ-025.1" for reexport, reexport-all and side-effect; "Dynamic import() is not allowed" for dynamic; "relative path" + "REQ-025.1" for package.
- Verification: acceptance `tests/toolchain/bot-boundary.acceptance.test.ts::re-exports, side-effect, dynamic and package imports in bot code fail npm run lint`

### SPEC-03: PlayerView-boundary types pass, and the real bots are clean
- Verifies: AC#2
- Behaviour: Given `src/bots/probe.ts` with `import type { EarlierShowdown, PlayerView, PublicPlayer, SeatPolicy, ShownHand } from '../engine/player-view';`, `import type { Action, SeatNumber, Street } from '../engine/hand';` and a JSON plus `../advice/recommend` import, When linted with the repo ESLint config, Then it has zero severity-2 messages; and `eslint.lintFiles(['src/bots'])` reports zero errors; and the SPEC-01 `applyAction` source linted as `src/table/probe.ts` has no "PlayerView-boundary" message (rule is scoped to `src/bots`).
- Verification: acceptance `tests/toolchain/bot-boundary.acceptance.test.ts::PlayerView-boundary type imports pass and only src/bots is restricted`

### SPEC-04: The source-scan test is replaced and behaviour is unchanged
- Verifies: AC#3
- Behaviour: Given the change, When the gates run, Then `tests/bots/tag.test.ts` no longer contains `boundaryProblems`, `ENGINE_TYPES` or the "bots import only PlayerView-boundary types" test; `git diff --stat main -- src` is empty; lint, typecheck and `npm test` pass; and `npm run playtest -- --hands 300 --seed 42 --size 6 --lineup tough` prints byte-identical output on `main` and on the branch.
- Verification: command `! grep -nE "boundaryProblems|ENGINE_TYPES|PlayerView-boundary types" tests/bots/tag.test.ts && test -z "$(git diff --stat main -- src)" && npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Type-only import of a forbidden hand type (`HandState`) — SPEC-01.
- Mixed import `import { type Action, applyAction } from '../engine/hand'` — pattern 4 reports `applyAction` (covered by name rule; same mechanism as SPEC-01).
- Namespace import / `export *` — SPEC-02 (`*` is never an allowed name).
- Nested bot folder (`src/bots/styles/x.ts` → `../../engine/hand`) — regexes anchor on `(^|/)engine/`, so depth does not matter; files glob is `src/bots/**`.
- `require()` / `import = require()` — already rejected by `@typescript-eslint/no-require-imports` and `erasableSyntaxOnly`; N/A here.
- A cast to reach hidden fields of a `PlayerView` (`view as unknown as HandState`) — needs a `HandState` type, which SPEC-01 bans; an inline structural cast cannot reach data the view does not carry (TASK-1.5 A-2). N/A.
- Indirect reach through `src/advice` — out of scope (Not doing).

## 8. Security considerations
- Trust boundary: fairness of bot decisions (REQ-025.1). This rule makes the bot→engine import boundary mechanical; the runtime boundary (`playerView` copies only seat-visible fields) is unchanged.
- No new dependency, no secrets, no randomness, no user input. Others N/A.

## 9. Non-functional
- One extra sandbox `npm run lint` in the tooling group (~5–15 s, under `TOOLCHAIN_TIMEOUT_MS` 120 s). Full-repo lint time grows negligibly (one rule on 7 files).
- Playtest output byte-identical (SPEC-04).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 300 --seed 42 --size 6 --lineup tough` (compare with output on `main`; must be byte-identical)
- New tests: `tests/toolchain/bot-boundary.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03. Removed: SPEC-09 test in `tests/bots/tag.test.ts` (SPEC-04).
- Judge scenario: add `import type { HandState } from '../engine/hand';` to a scratch file under `src/bots/`, run `npm run lint`, see it fail naming that file with the REQ-025.1 message; delete it and lint passes.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-6.21/qa.md`.
