# Spec: TASK-1.28 — Prove every playtest module loads under Node type stripping

Status: READY (approved 2026-11-19)
Task: TASK-1.28 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-6.1, doc-18) · Dream: limit-holdem-trainer

## 1. Summary
`npm run playtest` loads TypeScript through Node's built-in type stripping. Strip-only mode rejects parameter
properties and enums (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`), and Node ESM rejects JSON imports that have no
`with { type: 'json' }` attribute (`ERR_IMPORT_ATTRIBUTE_MISSING`). Vitest uses its own transformer, so it never
caught these. This task adds two guards. An acceptance test loads the real playtest entry through the real loader.
ESLint rules then fail `npm run lint` on that syntax in `src/` and `tools/`, naming the file. TypeScript's
`erasableSyntaxOnly` option backs the lint rules up in `npm run typecheck`.

## 2. Scope
- In scope:
  - New `tools/lint/type-stripping.js`: the shared selectors and an ESLint config block (parameter properties,
    JSON imports/re-exports without an attribute, enums).
  - `eslint.config.js`: register the block before `headlessBoundaryConfig`.
  - `tools/lint/headless-boundary.js`: spread the shared selectors into its `no-restricted-syntax`. ESLint flat
    config replaces a rule's options file by file, so without this the headless block would silently drop the new
    selectors in `src/{engine,bots,advice,stats,playtest,table}`.
  - `tsconfig.json`: `"erasableSyntaxOnly": true`.
  - `tests/support/sandbox.ts`: add `tools/lint/type-stripping.js` to `CONFIG_FILES`, so sandboxed lint runs see the
    new config.
  - Two new acceptance test files (AC#1, AC#2).
- Not doing:
  - Changing `tools/playtest/resolve-ts.js` or adding a transform hook. The loader stays strip-only by design.
  - Loading `tools/chart-print/main.ts` (the AC names only the playtest entry). It still benefits from the lint
    rules, which cover all of `tools/`.
  - Lint rules for `tests/` or `e2e/`. Vitest and Playwright transform those files, and Node never loads them
    through the playtest loader. `erasableSyntaxOnly` still covers them in typecheck.
  - Rules for namespaces, `import x = require()` or other non-erasable forms. Typecheck covers these through
    `erasableSyntaxOnly`, and none exist in the code today.
  - Any change to source modules. The repo already passes every new rule. Verified: `npx eslint .` with the rules
    exits 0, and `tsc --erasableSyntaxOnly` exits 0.
  - New dependencies.
- Scope budget: files=7, lines=230   (type-stripping.js ~30, headless-boundary.js +3/−1, eslint.config.js +2, tsconfig.json +1, sandbox.ts +1, load acceptance test ~70, lint acceptance test ~110)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#2 is enforced by `npm run lint` (ESLint), not by a source-scanning test | yes | The installed typescript-eslint 8.73.0 ships `@typescript-eslint/parameter-properties`, and ESLint 10's `no-restricted-syntax` can match `ImportDeclaration[attributes.length=0]` (both checked against probe files). This is existing tooling, so there's no custom scanner | Vitest test that regex-scans `src/` |
| A-2 | Also set `erasableSyntaxOnly: true` in `tsconfig.json` | yes | TypeScript 6.0.3 supports it. It mirrors Node's strip-only rules exactly, including namespaces and `import =`, which the lint rules don't cover. The whole repo passes it today | Lint rules only |
| A-3 | Lint rules apply to `src/**/*.{ts,tsx}` and `tools/**/*.{ts,js}` | yes | These are the only trees Node loads directly. The AC says `src/`, and `tools/playtest/main.ts` is the entry | `src/` only; whole repo |
| A-4 | Enums are banned too, although the AC names only parameter properties and JSON imports | yes | The task description lists enums as a strip-only blocker. One selector, and there are no enums today | Leave enums to `erasableSyntaxOnly` only |
| A-5 | AC#1 is proven by spawning `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts --hands 1 --seed 1` (exit 0, no error codes in stderr), plus negative controls proving the same loader rejects each blocker | yes | ESM links and evaluates the whole static import graph before `main` runs, so one clean run loads every reachable module. `src/` has no dynamic `import()`, and headless lint bans it (`tools/lint/headless-boundary.js:65-71`). The negative controls show the test would catch a regression | Record loaded URLs with an extra hook and diff them against a static graph walk |
| A-6 | Lint messages are the exact strings in §5 | yes | They are developer-facing and name the cause and the fix | Other wording |

## 3. Current system
- Playtest loader: `package.json` script `playtest` = `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts`.
  `tools/playtest/resolve-ts.js:7-18` only adds a `.ts` extension in resolve and has no transform. Node is 22.18.0
  (`engines` `>=22.18.0`), where type stripping is on by default.
- Entry `tools/playtest/main.ts:3` imports `../../src/playtest/cli`, which reaches engine, bots and advice. The JSON
  chart is imported with its attribute at `src/advice/preflop.ts:3`. The former parameter property is now an
  explicit field at `src/advice/equity.ts:165` (TASK-6.1 A-4).
- ESLint flat config: `eslint.config.js:8-29` (strict + stylistic + react-hooks + `headlessBoundaryConfig` +
  prettier). `headlessBoundaryConfig` sets `no-restricted-syntax` (ImportExpression ban) at
  `tools/lint/headless-boundary.js:65-71` for `HEADLESS_FILES`.
- `npm run lint` = `eslint . --max-warnings 0 && prettier --check .`.
- Tests run under Vitest (`vite.config.ts`, which includes `tests/**/*.test.{ts,tsx}`). Toolchain tests run real npm
  scripts in a temporary copy through `runInSandbox` (`tests/support/sandbox.ts:52-76`, `CONFIG_FILES` at `:17`),
  for example `tests/toolchain/lint.test.ts`.
- Existing code to reuse:
  - `tests/support/sandbox.ts` → `runInSandbox(files, 'lint')`, `TOOLCHAIN_TIMEOUT_MS`, `REPO_ROOT`, `sandboxEnv()`.
  - `tests/toolchain/headless-lint-dirs.acceptance.test.ts:20-26` → the `fileBlock(output, file)` pattern for
    reading one file's ESLint stylish block. Copy it into the new test; locked acceptance files can't be imported
    from or edited.
  - `tests/bots/tag-playtest.acceptance.test.ts:32` → the pattern for spawning the playtest CLI with `spawnSync`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Shared `TYPE_STRIPPING_RESTRICTED_SYNTAX` array exported from `tools/lint/type-stripping.js`. The new block comes before `headlessBoundaryConfig`, and the headless block spreads the same array | Separate block placed after headless (it would drop the headless ImportExpression ban); a custom plugin rule | Flat config replaces `no-restricted-syntax` options for each file, so both blocks must carry the full list | no | n/a |
| D-2 | No new dependency, script or CI step | Add `eslint-plugin-n` or a dedicated npm script | Existing `lint`, `test` and `typecheck` already run in CI (TASK-1.7) | no | n/a |

## 5. Design

### Files to create / modify
- `tools/lint/type-stripping.js` — new: `TYPE_STRIPPING_FILES`, `TYPE_STRIPPING_RESTRICTED_SYNTAX`, `typeStrippingConfig`
- `eslint.config.js` — import and register `typeStrippingConfig` immediately before `headlessBoundaryConfig`
- `tools/lint/headless-boundary.js` — `no-restricted-syntax`: `['error', { ImportExpression … }, ...TYPE_STRIPPING_RESTRICTED_SYNTAX]`
- `tsconfig.json` — add `"erasableSyntaxOnly": true`
- `tests/support/sandbox.ts` — add `'tools/lint/type-stripping.js'` to `CONFIG_FILES`
- `tests/playtest/type-stripping.acceptance.test.ts` — new (SPEC-01, SPEC-02)
- `tests/toolchain/type-stripping-lint.acceptance.test.ts` — new (SPEC-03, SPEC-04)

### Components, interfaces and data
```js
// tools/lint/type-stripping.js
export const TYPE_STRIPPING_FILES = ['src/**/*.{ts,tsx}', 'tools/**/*.{ts,js}'];
export const TYPE_STRIPPING_RESTRICTED_SYNTAX = [
  { selector: ':matches(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration)[source.value=/\\.json$/][attributes.length=0]',
    message: "JSON imports need `with { type: 'json' }`: Node type stripping (npm run playtest) rejects them without it." },
  { selector: 'TSEnumDeclaration',
    message: 'Enums are not erasable: Node type stripping (npm run playtest) rejects them. Use a union of literals or an as-const object.' },
];
export const typeStrippingConfig = {
  name: 'type-stripping',
  files: TYPE_STRIPPING_FILES,
  rules: {
    '@typescript-eslint/parameter-properties': ['error', { prefer: 'class-property' }],
    'no-restricted-syntax': ['error', ...TYPE_STRIPPING_RESTRICTED_SYNTAX],
  },
};
```
Type annotations follow the JSDoc style of `headless-boundary.js` (`checkJs` is on).

### Rules and algorithms
- `import data from './x.json';` → error. `import data from './x.json' with { type: 'json' };` → no error.
  `export { default } from './x.json';` → error.
- `constructor(private readonly c: number) {}` → `@typescript-eslint/parameter-properties` error ("Property c
  should be declared as a class property").
- `export enum E { A }` → enum error.
- These checks apply in headless and non-headless `src/` files alike, and the headless ImportExpression ban still
  applies.

### Error handling and configuration
- Lint failures use ESLint's stylish output. The file path is the block header, then `line:col error <message> <rule>`.
  The exit code is non-zero.
- The AC#1 test fails with the child's stderr as the assertion message, so a regression shows Node's error and the
  offending file URL.

## 6. Behaviour specification

### SPEC-01: The playtest entry and everything it reaches load through the playtest loader
- Verifies: AC#1
- Behaviour: Given the repository as is, When a test spawns `process.execPath` with
  `['--import', './tools/playtest/resolve-ts.js', 'tools/playtest/main.ts', '--hands', '1', '--seed', '1']` (cwd
  `REPO_ROOT`, env `sandboxEnv()`), Then the exit status is 0, stderr contains neither
  `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` nor `ERR_IMPORT_ATTRIBUTE` (prefix match covers MISSING/UNSUPPORTED), and
  stdout is non-empty.
- Verification: acceptance `tests/playtest/type-stripping.acceptance.test.ts::loads every module reachable from tools/playtest/main.ts through the playtest loader`

### SPEC-02: The same loader rejects each blocker (negative controls)
- Verifies: AC#1
- Behaviour: Given a temporary directory (`mkdtempSync` under `os.tmpdir()`, removed afterwards) with
  `param.ts` = `export class C { constructor(private readonly c: number) {} }`, `data.json` = `{"a":1}` and
  `json.ts` = `import d from './data.json';\nexport const v = d;`, When each `.ts` file is run with
  `node --import <REPO_ROOT>/tools/playtest/resolve-ts.js <file>`, Then the exit status is non-zero and stderr
  contains `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` for `param.ts` and `ERR_IMPORT_ATTRIBUTE_MISSING` for `json.ts`.
  (Both codes were observed on Node 22.18.0.)
- Verification: acceptance `tests/playtest/type-stripping.acceptance.test.ts::the playtest loader rejects a parameter property and an attribute-less JSON import`

### SPEC-03: Lint fails on each blocker in src/, naming the file
- Verifies: AC#2
- Behaviour: Given a sandbox (`runInSandbox(files, 'lint')`) with these Prettier-formatted probes:
  `src/advice/param-probe.ts` (parameter property, headless dir), `src/ui/param-probe.ts` (parameter property,
  non-headless), `src/advice/json-probe.ts` and `src/ui/json-probe.ts` (`import d from './data.json';` without an
  attribute), and `src/ui/enum-probe.ts` (`export enum E { A }`), When `npm run lint` runs, Then the exit code is
  non-zero, and the stylish block of each probe file (found by its path) contains the matching rule id:
  `@typescript-eslint/parameter-properties` for the param probes, and `no-restricted-syntax` plus `with { type: 'json' }`
  for the JSON probes and `Enums are not erasable` for the enum probe.
- Verification: acceptance `tests/toolchain/type-stripping-lint.acceptance.test.ts::lint rejects parameter properties, attribute-less JSON imports and enums in src, naming each file`

### SPEC-04: Correct forms pass, and the headless dynamic-import ban survives
- Verifies: AC#2
- Behaviour: Given the same sandbox run as SPEC-03 plus `src/ui/ok-probe.ts` (an explicit `readonly c` field set in
  the constructor, and `import d from './data.json' with { type: 'json' };`, with `src/ui/data.json` present) and
  `src/advice/dyn-probe.ts` (`export const load = () => import('./x');`), When `npm run lint` runs, Then the output
  has no block for `src/ui/ok-probe.ts`, and the block for `src/advice/dyn-probe.ts` contains
  `Dynamic import() is not allowed in headless modules`.
- Verification: acceptance `tests/toolchain/type-stripping-lint.acceptance.test.ts::lint accepts explicit fields and attributed JSON imports and keeps the headless dynamic-import ban`

### SPEC-05: Real repo stays clean under every gate
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When `npm run lint`, `npm run typecheck` (now with `erasableSyntaxOnly`), `npm test`
  and `npm run playtest -- --hands 10000 --seed 42` run, Then each exits 0, the existing toolchain and headless
  lint tests pass unchanged, and the playtest reports 0 violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42`

## 7. Edge cases
- Headless rule-option override: covered by SPEC-03 (advice probes) and SPEC-04 (dyn-probe).
- `export … from './x.json'` re-export: covered by the selector, not separately tested (same selector branch as
  imports, verified by probe during spec research).
- Dynamic `import('./x.json')` without options: N/A. Dynamic import is banned in headless dirs, and `src/ui` is not
  loaded by the playtest.
- `.json` imports in `tests/`: N/A. Tests read JSON with `readFileSync`, and Vitest transforms them anyway.
- Child-process hang: `spawnSync` with `timeout: 30_000` in the SPEC-01/02 tests.

## 8. Security considerations
N/A for trust boundaries: there is no untrusted input. Probe files are fixed test strings written to `mkdtemp`
directories and removed in `finally`. No secrets, no randomness, no new dependencies.

## 9. Non-functional
- SPEC-01/02 add under 1 s (a 1-hand playtest measured at about 0.1 s). The SPEC-03/04 sandbox lint runs in a single
  sandbox, within `TOOLCHAIN_TIMEOUT_MS` (120 s), like the existing lint tests.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests: `tests/playtest/type-stripping.acceptance.test.ts` → SPEC-01, SPEC-02;
  `tests/toolchain/type-stripping-lint.acceptance.test.ts` → SPEC-03, SPEC-04.
- Judge end-to-end check: add `constructor(private readonly x: number) {}` to a class in a scratch copy of
  `src/advice/equity.ts`. Confirm that `npm run lint` names the file, and that `npm run playtest -- --hands 1`
  fails with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. Revert, then run all four gates green.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.28/qa.md`.
