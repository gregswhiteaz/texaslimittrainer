# TASK-6.29: Close the last bot-boundary escapes: Function constructor and the global alias

Status: Judge PASS (not set Done) · Completed: 2026-11-27 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-025.1, REQ-028.1, REQ-059.2 · Branch: doit/TASK-6.29

## What was asked
TASK-6.27 left routes by which deliberate code in `src/bots` and `src/advice` could get past the lint boundary. Code could reach the `Function` constructor without writing `new Function`. It could also use the Node `global` alias, which the `globalThis` and `Math` bans don't see. This task bans each form and adds toolchain tests with one probe per ban. Spec: doit/TASK-6.29/spec.md.
- AC#1: forms using `.constructor`, `globalThis.Function`, `Reflect.apply/construct` with `Function`, or bare `global` fail lint, and the whole repo still lints clean.
- AC#2: a probe per form fails lint, and removing any one ban makes a test fail.
- AC#3 (added during review, see Review): the Node `process` global is closed too.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | New selectors go in `BOT_DETERMINISM_RESTRICTED_SYNTAX`, so they cover `src/bots/**`, `src/advice/**` and `src/engine/bot-random.ts`. | yes | One list feeds all three configs. | Move the selectors into the bot and advice configs only. |
| A-2 | `globalThis.global` is banned too. | yes | Otherwise `globalThis.global.Math.random()` slips past both bans. | Remove the property entry B8. |
| A-3 | The string `'constructor'` (also as a template literal with no `${}`) is banned anywhere in these files. | yes | No current file uses it, and it covers `fn['constructor']`, `Reflect.get(fn,'constructor')` and destructuring. | Ban only computed member keys. |
| A-4 | Messages: `FUNCTION_CONSTRUCTOR_MESSAGE`, `GLOBAL_ALIAS_MESSAGE` (developer-facing). | yes | They follow the "(REQ-…)" convention and differ from ESLint's built-in `no-new-func` text. | Reuse `NON_DETERMINISTIC_MESSAGE`. |
| A-5 | Tests use in-process `ESLint.lintText` with the repo config. | yes | Same pattern as the earlier probes, and it stays fast. | Run a sandbox `npm run lint`. |
| Autopilot | `process` global closed in this story as AC#3 (recorded deviation from the locked spec). | yes | Review r1 security MAJOR, same class as the `global` alias. It matches the choice made in TASK-6.27 ("Fix both here"). | Remove B9 and B10 and `bot-process-escapes.acceptance.test.ts`. |

## Clarifications and decisions
No questions asked (qa.md: no ask items). Decision: the `process` gap was fixed in-story rather than split off (autopilot).

## What was built
All changes are in lint config plus tests. Nothing under `src/` changed, because the current code already complies.
- `tools/lint/headless-boundary.js`:
  - Shared `NAME_ONLY_POSITIONS`, reused by `BARE_GLOBAL_REFERENCE` (same matches as before).
  - New messages: `FUNCTION_CONSTRUCTOR_MESSAGE`, `GLOBAL_ALIAS_MESSAGE`, `PROCESS_GLOBAL_MESSAGE`.
  - Seven new `no-restricted-syntax` entries in `BOT_DETERMINISM_RESTRICTED_SYNTAX`:
    - B1: `.constructor` access.
    - B2: `'constructor'` string literal.
    - B3: `'constructor'` template literal.
    - B4: `{ constructor }` destructuring.
    - B5: value-position `Function`.
    - B6: value-position `global`.
    - B9: value-position `process`.
  - Three new `no-restricted-properties` entries in `botDeterminismConfig`: B7 `globalThis.Function`, B8 `globalThis.global`, B10 `globalThis.process`.
  - Class `constructor` declarations, property names and type positions stay allowed.
- `tests/toolchain/bot-function-escapes.acceptance.test.ts` (new, locked): one probe per ban, clean probes, and a real-folder lint.
- `tests/toolchain/bot-process-escapes.acceptance.test.ts` (new): probes for `process.hrtime()[1]`, `process.uptime()`, `process.getBuiltinModule(...)`, `globalThis.process.hrtime()`, and a clean `declare global` / `process` property-name probe.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Function-constructor routes fail lint | Acceptance probes | PASS | gates/build-1.json, fix-4.json |
| SPEC-02 | `globalThis.Function`, bare `Function` | Acceptance probes | PASS | same |
| SPEC-03 | `global` alias fails lint | Acceptance probes | PASS | same |
| SPEC-04 | Legitimate code and the whole repo lint clean | Clean probes and `lintFiles` on real folders | PASS | same |
| SPEC-05 | Each ban is load-bearing | Mutation check (delete one ban, a test fails) | PASS | judge/verdict-1.json |
| AC#3 | `process` global | `bot-process-escapes` probes | PASS | gates/fix-3.json, fix-4.json |

- Gates: 4 runs (build, fix 2, 3 and 4), all PASS. `npm test` exit 0.
- Judge round 1: PASS, no failed items or unproven AC or DoD (AC#3 included).

## Review
- Round 1: security MAJOR. The Node `process` global (`process.hrtime()`, `process.getBuiltinModule`) was open. It was fixed in-story as AC#3 (B9, B10 plus tests).
- Round 2: clean, with the MINORs below.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code r2): the name and doc of `FUNCTION_AND_GLOBAL_ESCAPES` (`tools/lint/headless-boundary.js:125`) omit `process`.
- MINOR (security r2): keys built at runtime (`fn['constr'+'uctor']`) are not caught. This is an accepted limit; lint is not a sandbox.
- MINOR (security r2, pre-existing): `src/engine/bot-random.ts` has no import restriction, so it can import `node:*` built-ins.
- NIT: `errorsOf` is duplicated across the two new test files (by design).

## How to try it
- `npm run lint`
- `npx vitest run tests/toolchain/bot-function-escapes.acceptance.test.ts tests/toolchain/bot-process-escapes.acceptance.test.ts`
- Add `global.Math.random()` to a file in `src/bots` and run `npm run lint`. It should fail with the global-alias message.

## Run metrics
Questions 0 · assumptions logged 5 (plus the autopilot `process` decision) · review rounds 2 · judge rounds 1 · gate runs 4 · escalations 0 · changed lines 256 (at last gate; 2 source or lint files plus 2 test files).

## Known limitations and follow-ups
- [trainer] Add an import restriction on `src/engine/bot-random.ts` (no `node:*` built-ins), as the bots folder already has. Owner: no existing task known.
- [trainer] Rename `FUNCTION_AND_GLOBAL_ESCAPES` and update its doc to mention `process` (`tools/lint/headless-boundary.js:125`).
- Runtime-built computed keys remain a deliberate limit. Lint guards against accidents, not a sandbox.

### Not tracked (infra, below the value bar)
- Duplicated `errorsOf` helper in the two test files. By design, and it hasn't caused a failure.

## Lessons for the factory (proposals — not applied)
- The spec for a "close escape hatches" story should list the sibling globals (`process`, `require`, built-in modules) up front. Review found `process` only in r1, after build, which cost one fix round (gates 3 and 4).
