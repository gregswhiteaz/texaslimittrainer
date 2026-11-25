---
id: doc-149
title: 'TASK-6.21: Keep bots on SeatPolicy with a lint boundary'
type: other
created_date: '2026-11-25T23:03:00Z'
updated_date: '2026-11-25T23:03:00Z'
---
# TASK-6.21: Keep bots on SeatPolicy with a lint boundary

Status: Done · Completed: 2026-11-25 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-025.1 · Branch: doit/TASK-6.21

## What was asked
Bots must decide only from a `PlayerView`. That was enforced by types plus a regex source scan in `tests/bots/tag.test.ts`. The task adds an ESLint boundary for `src/bots/**`, so `npm run lint` fails on any engine import outside the PlayerView types. The old scan is then replaced. Spec: doit/TASK-6.21/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Allow-list equals the old scan: type-only imports from `engine/player-view`, plus `Action`, `SeatNumber`, `Street` from `engine/hand`. Every other engine module is banned, type imports included. | yes | Nothing forbidden today becomes allowed. | Edit `BOT_BOUNDARY_PATTERNS` (e.g. allow `type Card`). |
| A-2 | Package imports (any specifier not starting with `.`) are banned in `src/bots/**`. | yes | The old scan banned them. | Drop the first pattern. |
| A-3 | Rule messages are the `BOT_BOUNDARY_MESSAGE` and `BOT_PACKAGE_MESSAGE` wording from the spec, ending "(REQ-025.1)". | yes | Matches the existing message convention. | Reword the constants. |
| A-4 | The new test runs one sandbox `npm run lint` for the failing probes and uses in-process ESLint for the passing cases. | yes | Keeps the tooling group fast. | One sandbox run per probe. |

## Clarifications and decisions
No questions asked (autopilot accepted A-1..A-4).
- D-1: use `@typescript-eslint/no-restricted-imports` (regex patterns, `allowTypeImports`, `allowImportNames`) plus one `no-restricted-syntax` selector for side-effect engine imports. No new dependency.
- D-2: the new block repeats the bot-determinism syntax list (extracted to `BOT_DETERMINISM_RESTRICTED_SYNTAX`), which keeps the ban scoped to `src/bots`.
- D-3: the SPEC-09 source-scan test was deleted, not kept alongside.

## What was built
- `tools/lint/headless-boundary.js` — added `BOT_BOUNDARY_FILES`, `BOT_BOUNDARY_PATTERNS`, a side-effect import selector and `botSeatPolicyConfig`. Extracted `BOT_DETERMINISM_RESTRICTED_SYNTAX`. Dynamic `import()` was already banned by the headless rules.
- `eslint.config.js` — registers `botSeatPolicyConfig` after `botDeterminismConfig`.
- `tests/toolchain/bot-boundary.acceptance.test.ts` — new, covers SPEC-01..03.
- `tests/bots/tag.test.ts` — removed the SPEC-09 test, `ENGINE_TYPES`, `IMPORT`, `boundaryProblems` and the imports they used.
- No change under `src/`. Runtime behaviour is unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Sandbox `npm run lint` fails on 6 forbidden imports and names each file | Pass | bot-boundary.acceptance.test.ts |
| SPEC-02 | AC#3 | Re-export, `export *`, side-effect, dynamic and package imports fail; also non-normalized paths (r1 fix) | Pass | same file |
| SPEC-03 | AC#2 | PlayerView-boundary types pass, real `src/bots` lints clean, `src/table` is not restricted | Pass | same file |
| SPEC-04 | AC#3 | Old scan removed, `src/` diff empty, lint, typecheck and tests pass | Pass | judge round 1 |

- `npm test`: 1418 passed, 0 failed. Typecheck and lint exit 0.
- Playtest `--hands 300 --seed 42 --size 6 --lineup tough` is identical on main and on the branch once the repo path is normalised.
- Judge round 1: PASS (4/4). It also ran the scenario by hand, where `HandState` and `'../../engine/./hand'` imports failed lint naming both files, and lint passed again after they were deleted.
- Gate runs: 5. Test-integrity check passed and no locked tests were touched.

## Review
- Round 1, code, MAJOR: `non-normalized-engine-path-bypass`. A specifier such as `../engine/./hand` resolves to the engine but matched no pattern. The old scan normalised with `posix.join`, so this lost coverage. Fixed in r2 by a first pattern rejecting `/./`, `//` and `name/..`, plus new sandbox probes (`dot-segment`, `double-slash`, `parent-segment`, `side-effect-dot`).
- Round 2: code and security found nothing. The reviewer noted `../engine/hand/.` is not rejected, but tsc fails it with TS2307.
- Security found nothing in either round.

### Non-blocking review notes (deliberately not fixed)
- J-1-01 MEDIUM: a type-position `import('../engine/hand').HandState` in `src/bots` passes lint and tsc. This is not a regression, since types cannot reach hidden cards at runtime. A `TSImportType` selector would close it.
- J-1-02 LOW: `export {} from '../engine/hand'` passes because it has no bindings.

## How to try it
- `npm run lint`
- `npx vitest run tests/toolchain/bot-boundary.acceptance.test.ts`
- Add `import type { HandState } from '../engine/hand';` to a file under `src/bots/` and run `npm run lint`. It fails naming the file.

## Run metrics
Questions 0 · assumptions 4 · review rounds 2 · judge rounds 1 · gate runs 5 · escalations 0 · changed lines +168/-80 across 4 files.

## Known limitations and follow-ups
- The boundary covers `src/bots` only. `src/advice` is not restricted because `golden.ts` legitimately uses engine runtime.
- Bots can still import `src/advice`, which imports engine runtime (indirect path).
- [trainer] Add a `TSImportType` selector for `src/bots` so type-position `import('../engine/…')` is rejected (J-1-01). Owner: none yet, new task under TASK-6.
- [trainer] Optionally decide whether bots should be barred from importing `src/advice` (indirect engine access). A separate task if wanted.
- Not tracked: J-1-02 (`export {} from` with no bindings) is harmless and below the value bar.

## Lessons for the factory (proposals — not applied)
- The spec said the new rule replaces a scan, but it did not list what the scan did implicitly (path normalisation). Proposal: when a spec replaces a test with a rule, add a step "list every behaviour the old check had, including implicit ones" to the spec template. This cost one review round.
