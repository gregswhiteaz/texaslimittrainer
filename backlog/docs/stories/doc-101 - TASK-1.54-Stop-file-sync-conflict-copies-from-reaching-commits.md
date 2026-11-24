---
id: doc-101
title: 'TASK-1.54: Stop file-sync conflict copies from reaching commits'
type: other
created_date: '2026-11-23T13:55:00Z'
updated_date: '2026-11-23T13:55:00Z'
---
# TASK-1.54: Stop file-sync conflict copies from reaching commits

Status: Done (pending judge) · Completed: 2026-11-23 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a · Branch: doit/TASK-1.54

## What was asked
iCloud "Desktop & Documents" sync dropped `name 2.ext` conflict copies into the working tree during TASK-3.10. They broke typecheck and the gate, and one under `backlog/` was committed. AC#1: such a file must fail lint/CI naming it, or be git-ignored. AC#2: docs must say the repo must not live in an iCloud-synced folder, and how to move it. Spec: doit/TASK-1.54/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Conflict copies are `<base> <N>` or `<base> <N>.<ext>` (number just before the final extension). | yes | macOS/iCloud naming; all copies seen matched. | Extend the regex in `tools/lint/sync-copies.js`. |
| A-2 | The walker skips only `.git` and `node_modules`; copies in `dist/`, `coverage/` etc. are reported. | yes | Any copy means the repo is in a synced folder. | Add names to the skip list. |
| A-3 | `.gitignore` gets `* [0-9]`, `* [0-9][0-9]`, `* [0-9].*`, `* [0-9][0-9].*`. A future legit file like `foo 2.test.ts` would be silently ignored. A test asserts no tracked file is ignored. | yes | Tightest patterns gitignore can express; the doit commit step stages without lint. | Remove the patterns; rely on lint only. |
| A-4 | The check runs first in `npm run lint`, not in `npm test`. | yes | CI `Lint` step and the doit gate both run lint; cost about 30 ms. | Move to a Vitest test. |

## Clarifications and decisions
No questions (overnight autopilot). D-1: use both guards (gitignore plus lint-front check). D-2: dependency-free Node ESM script.

## What was built
- `tools/lint/sync-copies.js` (new) — matcher, walker (does not follow symlinks; reports a matching directory once) and CLI that prints each copy to stderr and exits 1.
- `package.json` — `lint` runs `node tools/lint/sync-copies.js` first.
- `.gitignore` — the four patterns with a comment.
- `tests/support/sandbox.ts` — copies the new script into the toolchain sandbox.
- `tests/toolchain/sync-copies.test.ts` (new) — SPEC-01..06 plus a walker unit test.
- `README.md` — new "Where to keep the repo" section and updated lint row.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | matcher | unit test | pass | build gate |
| SPEC-02/03 | CLI fails/passes, skips .git and node_modules | acceptance | pass | build gate |
| SPEC-04 | `npm run lint` fails in sandbox | acceptance | pass | build gate |
| SPEC-05 | gitignore covers copies, no tracked file | acceptance | pass | build gate |
| SPEC-06 | README guidance | acceptance | pass | build gate |

- Build gate (gates/build-1.json, fix-2.json): test command, lint, typecheck all pass; 229 changed lines vs budget 230. `npm test`: 936 passed; `npm run test:tooling`: 116 passed. `node tools/lint/sync-copies.js` takes 0.03 s.
- Builder ran the e2e: `touch "src/zz 2.ts"` made lint exit 1 naming it, and it was absent from `git status` and `git add -A --dry-run`.
- Judge: see doit/TASK-1.54/judge/.

## Review
Round 1: no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the CLI entry-point check compares `import.meta.url` with the unresolved `argv[1]`. Run via a symlinked path, it silently exits 0. `npm run lint` is unaffected. Same idiom as 7 other tools scripts.
- NIT: `* [0-9].*` is wider than the lint matcher, so `foo 2.test.ts` would be unstaged without a lint signal (accepted in A-3).
- NIT: matched names go to stderr raw (control characters); no practical attacker gain.
- NIT: the branch diff includes an unrelated TASK-2.6 AC#8 edit from the spec commit's backlog bookkeeping.

## How to try it
`node tools/lint/sync-copies.js` (exit 0 when clean). Repro: `cp src/main.tsx "src/main 2.tsx" && npm run lint; rm "src/main 2.tsx"`.

## Run metrics
Questions 0 · assumptions 4 · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 229 (6 files).

## Known limitations and follow-ups
- User action: move the repo out of iCloud Desktop & Documents (README section explains). `.git/index 2` exists, so git internals are being copied too.
- User action: remove the stray doc-100 conflict copy on the parked TASK-3.10 branch.
- Not tracked (infra, below the value bar; none caused a real failure): symlinked entry-point check; gitignore pattern wider than the lint matcher; raw names to stderr.

## Lessons for the factory (proposals — not applied)
None. The run was smooth.
