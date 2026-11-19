# TASK-1.28: Prove every playtest module loads under Node type stripping

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up of TASK-6.1, doc-18) · Branch: doit/TASK-1.28

## What was asked
`npm run playtest` loads TypeScript through Node's built-in type stripping, which rejects parameter properties and enums and requires `with { type: 'json' }` on JSON imports. Vitest uses its own transformer, so it never caught these. The story asks for (AC#1) a test that loads every playtest module through the real loader, and (AC#2) a lint failure naming the file when `src/` uses parameter properties or attribute-less JSON imports. Spec: doit/TASK-1.28/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#2 is enforced by `npm run lint`, not a source-scanning test | yes | typescript-eslint's `parameter-properties` and `no-restricted-syntax` with `ImportDeclaration[attributes.length=0]` already exist | Replace with a Vitest regex scan of `src/` |
| A-2 | `"erasableSyntaxOnly": true` added to `tsconfig.json` | yes | Mirrors Node's strip-only rules, including namespaces and `import =`, which the lint rules don't cover. Repo already passes | Remove the option |
| A-3 | Lint rules apply to `src/**/*.{ts,tsx}` and `tools/**/*.{ts,js}` | yes | The only trees Node loads directly | Narrow to `src/` or widen to the whole repo |
| A-4 | Enums are banned too (the AC names only parameter properties and JSON imports) | yes | The task description lists enums as a blocker; one selector, none exist today | Drop the enum selector |
| A-5 | AC#1 is proven by spawning `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts --hands 1 --seed 1`, plus negative controls | yes | ESM links the whole static import graph before `main` runs, and `src/` has no dynamic `import()` (banned by headless lint), so one clean run loads every reachable module | Record loaded URLs with an extra hook and diff against a static graph walk |
| A-6 | Lint messages are the exact strings in spec §5 | yes | Developer-facing; name the cause and the fix | Reword |

state.json records 0 questions and 0 assumptions; the table above comes from spec.md.

## Clarifications and decisions
- No questions asked.
- D-1: ESLint flat config replaces a rule's options file by file. So `tools/lint/headless-boundary.js` spreads the shared selectors into its own `no-restricted-syntax`. Otherwise `src/{engine,bots,advice,stats,playtest,table}` would silently lose the new selectors.
- The loader `tools/playtest/resolve-ts.js` stays strip-only by design (no transform hook added).

## What was built
Two guards plus a backstop:
- `tools/lint/type-stripping.js` (new): `TYPE_STRIPPING_FILES`, shared `TYPE_STRIPPING_RESTRICTED_SYNTAX` (attribute-less JSON imports and re-exports, enums) and `typeStrippingConfig` (adds `@typescript-eslint/parameter-properties`).
- `eslint.config.js`: registers `typeStrippingConfig` just before `headlessBoundaryConfig`.
- `tools/lint/headless-boundary.js`: spreads the shared selectors (D-1).
- `tsconfig.json`: `erasableSyntaxOnly: true`, enforced by `npm run typecheck`.
- `tests/support/sandbox.ts`: copies the new lint file into sandboxes.
- `tests/playtest/type-stripping.acceptance.test.ts` (new): SPEC-01, SPEC-02.
- `tests/toolchain/type-stripping-lint.acceptance.test.ts` (new): SPEC-03, SPEC-04.

No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Spawns the real loader on the real playtest entry (exit 0, no error codes) | Pass | tests/playtest/type-stripping.acceptance.test.ts |
| SPEC-02 | AC#1 | Negative controls: same loader rejects parameter property, enum, attribute-less JSON import | Pass | same file |
| SPEC-03 | AC#2 | Sandboxed `npm run lint` fails on each blocker in `src/`, naming the file (including headless dirs) | Pass | tests/toolchain/type-stripping-lint.acceptance.test.ts |
| SPEC-04 | AC#2 | Correct forms pass; headless dynamic-import ban survives the config change | Pass | same file |
| SPEC-05 | both | Real repo clean under lint, typecheck, test | Pass | gates/build-1.json |

- `npm test`: 86 files, 313 passed, 3 skipped. Lint, typecheck and format exit 0. `npm run playtest -- --hands 10000 --seed 42`: 0 invariant violations.
- Gate build-1: PASS, 195 changed lines in 7 files.
- Judge round 1: PASS, no missing or unproven ACs.

## Review
Round 1 code and security reviews found no BLOCKER or MAJOR issues. The security review found nothing (tooling-only change).

### Non-blocking review notes (deliberately not fixed)
- NIT: `tests/playtest/type-stripping.acceptance.test.ts:23` repeats the spawn options that `runWithLoader` builds, because the spec wants the literal relative loader path. Defensible.

## How to try it
- `npx vitest run tests/playtest/type-stripping.acceptance.test.ts tests/toolchain/type-stripping-lint.acceptance.test.ts`
- `npm run lint && npm run typecheck`
- `npm run playtest -- --hands 100 --seed 1`

## Run metrics
Questions 0 · assumptions logged 6 (in spec) · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 195.

## Known limitations and follow-ups
- Add a load test (spawn with the type-stripping loader, assert exit 0) for `tools/chart-print/main.ts`, the second entry that uses the loader. It gets lint coverage today but no load test. Owner: extend TASK-1.28's test file, or a new chore under TASK-1.
- A dynamic `import()` added outside the headless dirs would escape the single-run load proof in SPEC-01; the headless lint ban covers only `src/{engine,bots,advice,stats,playtest,table}`.

## Lessons for the factory (proposals — not applied)
Nothing went wrong or slow in this run (one build, one review round, one judge round).
