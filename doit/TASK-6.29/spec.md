# Spec: TASK-6.29 — Close the last bot-boundary escapes: Function constructor and the global alias

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-6.29 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-025.1, REQ-028.1, REQ-059.2 (context) · Dream: limit-holdem-trainer

## 1. Summary
TASK-6.27 (doc-175, judge J-1-01/J-1-02, review r3 MINORs) left two ways for deliberate code in `src/bots` and
`src/advice` to get past the lint boundary. It can reach the `Function` constructor without writing
`new Function` (`(fn).constructor`, `[].constructor.constructor`, `globalThis.Function`,
`Reflect.apply(Function, …)`), or use the Node `global` alias (`global.Math.random()`, `global['indexedDB']`),
which none of the `globalThis`/`Math` bans see. This task adds lint bans for each form to the bot-determinism
syntax list in `tools/lint/headless-boundary.js`, so they apply to bots, advice and `src/engine/bot-random.ts`.
It also adds one new toolchain acceptance test. That test has one probe per ban, so deleting any single ban
makes the test fail.

## 2. Scope
- In scope:
  - `tools/lint/headless-boundary.js`: two new messages, five new `no-restricted-syntax` entries in
    `BOT_DETERMINISM_RESTRICTED_SYNTAX`, and two new `no-restricted-properties` entries in
    `botDeterminismConfig` (5).
  - One new acceptance test file, `tests/toolchain/bot-function-escapes.acceptance.test.ts`, using in-process
    ESLint with the repo config.
- Not doing:
  - No change under `src/`. The current bot, advice and bot-random code already complies: grep finds no
    `global`, `Function` or `Reflect` in non-UI `src/`, and `constructor` appears only as class constructor
    declarations, which stay allowed (3).
  - No edit to the locked earlier test files (`tests/toolchain/bot-boundary.acceptance.test.ts`,
    `tests/toolchain/bot-import-gaps.acceptance.test.ts`, `tests/toolchain/bot-determinism.test.ts`). The new
    probes go in a new file.
  - Computed keys built at runtime (`fn['constr' + 'uctor']`, `fn[k]`) are not banned. Banning every computed
    member access would break ordinary array and record indexing. Lint guards against accidents and casual
    evasion. It is not a sandbox (see 8).
  - `global` is not banned in the other headless folders (`engine`, `stats`, `playtest`, `table`). The AC names
    bots and advice only (scope concern).
  - No ban on `globalThis.globalThis` or `Reflect` as a whole (scope concern; `Reflect.get(globalThis, …)` is
    already caught because a bare `globalThis` reference is banned).
  - No new dependency, no slow test, no change to bot behaviour or playtest output.
- Scope budget: files=2, lines=190

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The new selectors go in `BOT_DETERMINISM_RESTRICTED_SYNTAX`. That list is repeated by `botDeterminismConfig`, `botSeatPolicyConfig` and `adviceHiddenStateConfig`, so the bans cover `src/bots/**`, `src/advice/**` (including `golden.ts`) and `src/engine/bot-random.ts`. | yes | One place feeds all three configs (`tools/lint/headless-boundary.js:108,143,241,307`). | Add the selectors only to the bot and advice configs |
| A-2 | `globalThis.global` (the same alias, reached through `globalThis`) is banned too, with its own property entry and probe. | yes | Without this ban, `globalThis.global.Math.random()` would slip past both the `global` ban and the `globalThis.Math` ban (checked by the prototype in 3). | Leave it as a scope concern |
| A-3 | The string `'constructor'` is banned as a string literal, and as a template literal with no `${}` parts, anywhere in these files. That covers `fn['constructor']`, `Reflect.get(fn, 'constructor')` and `{ ['constructor']: F } = fn`. | yes | No current file uses the string (grep, 3). This is the simplest way to cover every literal-key form. | Ban only computed member keys |
| A-4 | Messages (developer-facing only): `FUNCTION_CONSTRUCTOR_MESSAGE` = "The Function constructor (including .constructor access) is not allowed in bot decision code (REQ-025.1, REQ-028.1)." and `GLOBAL_ALIAS_MESSAGE` = "The Node global alias is not allowed in bot decision code; it escapes the determinism and headless rules (REQ-028.1, REQ-059.2)." | yes | These follow the "(REQ-…)" convention (`tools/lint/headless-boundary.js:11,82`). The `REQ-028.1` text tells them apart from the built-in `no-new-func` message ("The Function constructor is eval."). | Reuse `NON_DETERMINISTIC_MESSAGE` |
| A-5 | Tests use in-process `ESLint.lintText` with the repo config, not a sandbox `npm run lint`. The "whole repo lints clean" part is checked by `npm run lint` and by `lintFiles` on the real folders. | yes | Same pattern as the `GLOBAL_ESCAPE_PROBES` test (`tests/toolchain/bot-import-gaps.acceptance.test.ts:110-121,236-251`), and it keeps the tooling group fast. | One sandbox `npm run lint` run with probe files |

## 3. Current system
- `eslint.config.js:34-37` registers, in order, `headlessBoundaryConfig`, `botDeterminismConfig`,
  `botSeatPolicyConfig` and `adviceHiddenStateConfig` (all from `tools/lint/headless-boundary.js`). The later
  blocks replace `no-restricted-syntax` for their files, so each one repeats
  `...BOT_DETERMINISM_RESTRICTED_SYNTAX` (`:241` bots, `:307` advice). `no-restricted-properties` is
  set only in `botDeterminismConfig` (`:133`), and no later block overrides it.
- `BOT_DETERMINISM_FILES = ['src/bots/**', 'src/advice/**', 'src/engine/bot-random.ts']` (`:80`).
- `BARE_GLOBAL_REFERENCE` (`:90-106`) bans bare `Math|Date|crypto|performance|globalThis` everywhere except
  member objects, property and key names, type names and callees. A member-object `global` therefore needs its
  own selector. `global.Math.random()` is not caught today, because the object of `.random` is `global.Math`,
  not the identifier `Math`.
- `no-new-func` (`:146`) catches only `new Function(…)`, `Function(…)` and `Function.call/apply/bind`. Its
  message is "The Function constructor is eval." (`node_modules/eslint/lib/rules/no-new-func.js:38`).
- Current uses in the covered files (grep `constructor|\bglobal\b|Reflect|Function\b`): only the class
  constructor declarations at `src/bots/style.ts:92`, `src/advice/ranges.ts:87`, `src/advice/golden.ts:106`,
  `src/advice/preflop-chart.ts:80` and `src/advice/equity.ts:197` (MethodDefinition keys, not member access).
  No `'constructor'` string literal.
- Prototype check: a throwaway ESLint run with the typescript-eslint parser and exactly the selectors in 5, on
  `src/bots/probe.ts`. Every probe in SPEC-01..03 was flagged by exactly one ban, and every clean probe in
  SPEC-04 (class constructor, `{ global: 1, constructor: 2 }`, `o.global`, interface members, `declare global`)
  was flagged by none.
- Tests: Vitest. `tests/toolchain/**` runs in `npm run test:tooling` (`package.json` scripts). The helpers
  `REPO_ROOT` and `TOOLCHAIN_TIMEOUT_MS` come from `tests/support/sandbox.ts:16,31`.
- Existing code to reuse:
  - `tools/lint/headless-boundary.js` `BARE_GLOBAL_REFERENCE` exclusion list (`:91-105`) → pull the non-value
    position exclusions into a shared constant, and build the `Function` and `global` selectors from it.
  - `tests/toolchain/bot-import-gaps.acceptance.test.ts:181-184` `errorsOf` pattern → copy it locally (that
    file is locked; don't import from it).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Ban the routes to the constructor, not the constructor itself: non-computed `.constructor`, the `'constructor'` string literal or template, `{ constructor }` destructuring, `globalThis.Function`, and any value-position `Function` identifier. | Ban `Reflect` entirely; ban all computed member access | This closes every form the AC names with no false positives on current code. Banning `Reflect` would still leave `Function` aliasing open, and banning all computed access would break normal indexing. | no | n/a |
| D-2 | Ban `global` as an identifier in every value position, including as a member object, plus `globalThis.global`. | Add `global` to `BARE_GLOBAL_REFERENCE` (that list lets member objects through, so `global.Math.random()` would still pass) | `global` has no legitimate use in browser-targeted bot code. | no | n/a |
| D-3 | Each ban is its own config entry with at least one probe that only that entry catches. | One combined selector | AC#2: "removing any one ban makes a test fail". | no | n/a |

## 5. Design

### Files to create / modify
- `tools/lint/headless-boundary.js` — add messages, selectors and property bans.
- `tests/toolchain/bot-function-escapes.acceptance.test.ts` — new acceptance probes (SPEC-01..05).

### Components, interfaces and data
- New constants (module-private unless noted): `FUNCTION_CONSTRUCTOR_MESSAGE`, `GLOBAL_ALIAS_MESSAGE` (A-4
  text). Optionally a shared `NAME_ONLY_POSITIONS` string of `:not(…)` exclusions, reused by
  `BARE_GLOBAL_REFERENCE`. If `BARE_GLOBAL_REFERENCE` is refactored, its matches must stay identical.
- New `BOT_DETERMINISM_RESTRICTED_SYNTAX` entries. Each is a separate object with the listed message:
  1. B1 `MemberExpression[computed=false][property.name='constructor']` → FUNCTION_CONSTRUCTOR_MESSAGE
  2. B2 `Literal[value='constructor']` → FUNCTION_CONSTRUCTOR_MESSAGE
  3. B3 `TemplateLiteral[expressions.length=0] > TemplateElement[value.cooked='constructor']` → FUNCTION_CONSTRUCTOR_MESSAGE
  4. B4 `ObjectPattern > Property[computed=false][key.name='constructor']` → FUNCTION_CONSTRUCTOR_MESSAGE
  5. B5 `Identifier[name='Function']` + position exclusions → FUNCTION_CONSTRUCTOR_MESSAGE
  6. B6 `Identifier[name='global']` + position exclusions → GLOBAL_ALIAS_MESSAGE
  - "Position exclusions": `:not(MemberExpression[computed=false] > .property)`,
    `:not(Property[computed=false] > .key)`, `:not(PropertyDefinition[computed=false] > .key)`,
    `:not(MethodDefinition[computed=false] > .key)`, `:not(TSPropertySignature[computed=false] > .key)`,
    `:not(TSMethodSignature[computed=false] > .key)`, `:not(TSTypeReference > .typeName)`,
    `:not(TSQualifiedName > .left)`, `:not(TSQualifiedName > .right)`, `:not(TSTypeQuery > .exprName)`,
    `:not(TSModuleDeclaration > .id)`. Unlike `BARE_GLOBAL_REFERENCE`, there is no member-object or callee
    exclusion. `new Function(…)` is then reported by both B5 and `no-new-func`, which is fine.
- New `botDeterminismConfig` `no-restricted-properties` entries:
  - B7 `{ object: 'globalThis', property: 'Function', message: FUNCTION_CONSTRUCTOR_MESSAGE }`
  - B8 `{ object: 'globalThis', property: 'global', message: GLOBAL_ALIAS_MESSAGE }`
- Update the comments and JSDoc to say why each ban exists (TASK-6.29, J-1-01/J-1-02).

### Rules and algorithms
- Worked examples (file `src/bots/probe.ts` or `src/advice/probe.ts`):
  - `(() => 0).constructor` → B1. `[].constructor.constructor` → B1 (twice).
  - `f['constructor']`, `Reflect.get(f, 'constructor')` → B2. ``f[`constructor`]`` → B3.
  - `const { constructor: F } = (): number => 0;` → B4.
  - `Reflect.apply(Function, undefined, ['return 1'])`, `Reflect.construct(Function, ['return 1'])`,
    `const F = Function;` → B5.
  - `global.Math.random()`, `global['indexedDB']`, `const g = global;` → B6.
  - `globalThis.Function` → B7. `globalThis.global` → B8.
  - Allowed: `class E extends Error { constructor(m: string) { super(m); } }`,
    `const o = { global: 1, constructor: 2 }; o.global`, `interface I { global: number; constructor: number }`,
    `declare global { … }`.

### Error handling and configuration
- Severity `error` through the existing rule entries. No new config knobs.

## 6. Behaviour specification

### SPEC-01: Function-constructor routes fail lint in bot and advice code
- Verifies: AC#1, AC#2
- Behaviour: Given a file at `src/bots/probe.ts` and, separately, at `src/advice/probe.ts`, containing any one of
  these probes: `export const F: unknown = (() => 0).constructor;`, `export const F: unknown =
  [].constructor.constructor;`, `const f = (): number => 0;\nexport const F: unknown = f['constructor'];`,
  `const f = (): number => 0;\nexport const F: unknown = Reflect.get(f, 'constructor');`,
  ``const f = (): number => 0;\nexport const F: unknown = f[`constructor`];``,
  `const { constructor: F } = (): number => 0;\nexport { F };`. When ESLint lints it with the repo config, Then
  the errors (severity 2) include a message containing "Function constructor" and "REQ-028.1".
- Verification: acceptance `tests/toolchain/bot-function-escapes.acceptance.test.ts::constructor access in bot and advice code fails lint`

### SPEC-02: globalThis.Function and the bare Function identifier fail lint
- Verifies: AC#1, AC#2
- Behaviour: Given `src/bots/probe.ts` and `src/advice/probe.ts` containing one of
  `export const F: unknown = globalThis.Function;`,
  `export const r: unknown = Reflect.apply(Function, undefined, ['return 1']);`,
  `export const r: unknown = Reflect.construct(Function, ['return 1']);`, `export const F = Function;`, When
  linted, Then the errors include a message containing "Function constructor" and "REQ-028.1".
- Verification: acceptance `tests/toolchain/bot-function-escapes.acceptance.test.ts::globalThis.Function and Reflect with Function fail lint`

### SPEC-03: The Node global alias fails lint
- Verifies: AC#1, AC#2
- Behaviour: Given `src/bots/probe.ts` and `src/advice/probe.ts` containing one of
  `export const r = global.Math.random();`, `export const d: unknown = global['indexedDB'];`,
  `export const g: unknown = global;`, `export const r: unknown = globalThis.global;`, When linted, Then the
  errors include a message containing "global alias" and "REQ-028.1".
- Verification: acceptance `tests/toolchain/bot-function-escapes.acceptance.test.ts::the Node global alias fails lint`

### SPEC-04: Legitimate code still lints clean and the whole repo is clean
- Verifies: AC#1
- Behaviour: Given the clean probe
  `class E extends Error {\n  constructor(m: string) {\n    super(m);\n  }\n}\nconst o = { global: 1, constructor: 2 };\nexport const g = o.global;\nexport interface I {\n  global: number;\n  constructor: number;\n}\nexport { E };\n`
  at `src/bots/probe.ts` and at `src/advice/probe.ts`, When linted, Then there are no messages containing
  "Function constructor" or "global alias". And When ESLint lints the real `src/bots`, `src/advice` and
  `src/engine/bot-random.ts`, Then there are zero severity-2 messages. And `npm run lint` exits 0.
- Verification: acceptance `tests/toolchain/bot-function-escapes.acceptance.test.ts::real bot and advice code and legitimate constructor and global names lint clean`; command `npm run lint`

### SPEC-05: Each ban is load-bearing
- Verifies: AC#2
- Behaviour: Given the eight bans B1..B8 (5), When any single entry is deleted from
  `tools/lint/headless-boundary.js` and the new test file runs, Then at least one test in it fails. The probe
  map in 5 ("Rules and algorithms") lists, for each ban, a probe that no other rule flags with the asserted
  message.
- Verification: manual For each of B1..B8: comment out that one entry, run `npx vitest run tests/toolchain/bot-function-escapes.acceptance.test.ts`, confirm a failure, restore it.

## 7. Edge cases
- Class `constructor` declarations (MethodDefinition key), object-literal keys, interface members and
  `declare global` must pass: SPEC-04.
- `new Function(…)` is now reported twice (B5 and `no-new-func`). This is harmless, and the existing
  `'Function constructor is eval'` assertion in the locked TASK-6.27 test still holds.
- Optional chaining `fn?.constructor` is still a MemberExpression, so B1 catches it.
- Runtime-built keys (`fn['constr' + 'uctor']`): not covered (Not doing; 8).
- Concurrency, I/O, permissions: N/A (lint configuration only).

## 8. Security considerations
- Trust boundary: none at runtime. This is a developer lint guard for REQ-025.1 (bots don't see hidden cards)
  and REQ-028.1 (seeded randomness only). The threat is deliberate evasion by contributed bot code. Lint can't
  stop every dynamic evasion (computed keys built from strings, `Object.getOwnPropertyNames` walks), so code
  review remains the backstop. Residual holes are listed in "Not doing".
- No new dependencies, secrets or logging. Randomness: N/A.

## 9. Non-functional
- The new test file is in-process ESLint only (no sandbox install), so it should finish in under 20 s within
  `npm run test:tooling`. It is not a slow test.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/toolchain/bot-function-escapes.acceptance.test.ts`
- New tests: `tests/toolchain/bot-function-escapes.acceptance.test.ts` → SPEC-01..04. End-to-end for the Judge:
  create `src/bots/evil.ts` with `export const r = global.Math.random();` and
  `export const F: unknown = [].constructor.constructor;`, run `npm run lint`, and see both new messages and a
  non-zero exit. Delete the file, rerun, and see exit 0. Then run the SPEC-05 mutation check.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-6.29/qa.md`.
