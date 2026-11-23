# Spec: TASK-1.54 — Stop file-sync conflict copies from reaching commits

Status: READY (approved 2026-11-23)
Task: TASK-1.54 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
macOS iCloud "Desktop & Documents" sync drops byte-identical conflict copies named `name 2.ext` (or `dir 2`)
into the working tree. They broke typecheck and the gate during TASK-3.10, and one under `backlog/` was
committed. This task adds three guards: `.gitignore` patterns so `git add -A` never stages such copies, a
fast check that runs first in `npm run lint` (so on every push in CI and in every local gate) and fails naming
each copy, and a README note saying the repo must not live in an iCloud-synced folder, with steps to move it.

## 2. Scope
- In scope:
  - `.gitignore` conflict-copy patterns.
  - New `tools/lint/sync-copies.js`: a pure name matcher, a directory walker and a CLI, chained first in the
    `lint` npm script.
  - Adding the new script to the toolchain sandbox's copied config files so the existing lint sandbox tests
    keep working.
  - README: a "Where to keep the repo" section and an updated `npm run lint` row.
  - Tests for all of the above.
- Not doing:
  - Moving the repo or changing iCloud settings (that is a user action).
  - Deleting any conflict copies that exist now, or touching any `backlog/` file. That includes the copy
    already committed on the TASK-3.10 branch.
  - A git pre-commit hook (hooks aren't versioned and the doit commit step would need opting in).
  - A new CI job or workflow step. The check runs inside the existing `Lint` step.
  - Detecting other sync tools' naming schemes (Dropbox "conflicted copy", OneDrive "-HOSTNAME").
- Scope budget: files=6, lines=230

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Conflict copies are `<base> <N>` or `<base> <N>.<ext>`, where `<N>` is a decimal number placed just before the final extension (e.g. `foo.test 2.ts`, `src 2`). | yes | This is how macOS/iCloud names duplicates; every copy seen tonight matched it. | Also match Dropbox/OneDrive schemes (out of scope). |
| A-2 | The walker skips only directories named `.git` and `node_modules`. Copies in `dist/`, `coverage/`, `test-results/` and `playwright-report/` are reported too. | yes | Any copy means the repo is in a synced folder, so the fix is to move the repo. Walking ~3k entries takes about 20 ms. | Also skip generated output folders. |
| A-3 | `.gitignore` gets the patterns `* [0-9]`, `* [0-9][0-9]`, `* [0-9].*`, `* [0-9][0-9].*`. Their only plausible false positive is a future file whose name has a space followed by a digit and a dot (e.g. a backlog title that starts with "3.5"). A test asserts that no tracked file is ignored by them. | yes | A glob can't anchor on "last dot", so these are the tightest patterns gitignore can express. Today no tracked path contains a space followed by a digit (`git ls-files` checked). | Skip the gitignore and rely only on the lint check. Rejected because the doit commit step stages files without running lint. |
| A-4 | The check runs at the front of `npm run lint` (`node tools/lint/sync-copies.js && eslint … && prettier …`), not inside `npm test`. | yes | The CI `Lint` step runs on every push (`.github/workflows/ci.yml:104-105`) and the doit gate runs lint. It costs well under 100 ms. | A Vitest test in `test:unit` (it would need a repo walk inside the coverage run). |

## 3. Current system
- Lint script: `package.json` `"lint": "eslint . --max-warnings 0 && prettier --check ."`. CI runs it on
  every push/PR in the `checks` job: `.github/workflows/ci.yml:104-105` (`- name: Lint` / `run: npm run lint`).
- ESLint ignores `backlog`, `doit`, `dreams` etc. (`eslint.config.js:12-23`), and Prettier ignores them too
  (`.prettierignore`). So a copy under `backlog/` is never seen by today's lint, which is why one got
  committed.
- `.gitignore` is 9 lines (`node_modules/`, `dist/`, `coverage/`, `.DS_Store`, …) with no sync-copy pattern.
- `tools/lint/*.js` are plain ESM JS with JSDoc. They are typechecked (`tsconfig.json` has
  `allowJs`/`checkJs` and includes `tools`) and linted under the type-stripping rules
  (`tools/lint/type-stripping.js:5`).
- Toolchain sandbox: `tests/support/sandbox.ts:18-27` (`CONFIG_FILES`) copies config plus `tools/lint/*.js`
  into a temp dir and runs `npm run lint`. Without the new script in that list, `npm run lint` in the sandbox
  fails with "Cannot find module", and `tests/toolchain/lint.test.ts` breaks.
- Tooling tests: `tests/toolchain/**` runs in `npm run test:tooling`, and in CI only when tooling paths change
  (`tools/ci/tooling-changed.js:16-26` covers `tools/`, `tests/toolchain/`, `tests/support/`, `package.json`).
  This task touches those paths, so its own CI run executes the new tests.
- README: `## Setup` at `README.md:5`, Commands table with the `npm run lint` row at `README.md:25`,
  `## Conventions` at `README.md:249`.
- `git ls-files` contains no path with a space followed by a digit. The only copy in the tree right now is
  `.git/index 2`, which the walker skips.
- Existing code to reuse:
  - `tests/support/sandbox.ts` → `runInSandbox(files, 'lint')`, `TOOLCHAIN_TIMEOUT_MS`, `REPO_ROOT`.
  - `tests/toolchain/lint.test.ts` → pattern for a lint-in-sandbox test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Use both guards: `.gitignore` patterns (stops staging) plus a lint-front check (fails loudly and names files, including copies that gitignore would hide from git but that tsc/vitest would still pick up under `src/`/`tests/`). | Only gitignore, so copies under `src/` keep breaking typecheck silently. Only the check, which misses the doit commit step that stages without lint. | The AC allows either. Together they cover both failure modes seen in TASK-3.10. | no | n/a |
| D-2 | The check is a Node ESM script with no dependencies (`node:fs`, `node:path`), not a new devDependency. | Shell `find` (not portable to Windows, harder to test); an ESLint rule (ESLint ignores `backlog/`). | Smallest robust option, and every-push cost stays tiny. | no | n/a |

## 5. Design

### Files to create / modify
- `tools/lint/sync-copies.js` — new: matcher, walker and CLI.
- `package.json` — `lint` script becomes `node tools/lint/sync-copies.js && eslint . --max-warnings 0 && prettier --check .`.
- `.gitignore` — comment plus the four patterns from A-3.
- `tests/support/sandbox.ts` — add `'tools/lint/sync-copies.js'` to `CONFIG_FILES`.
- `tests/toolchain/sync-copies.test.ts` — new tests (SPEC-01..06).
- `README.md` — new `## Where to keep the repo` section after `## Setup`, and the lint row text.

### Components, interfaces and data
`tools/lint/sync-copies.js` (ESM, JSDoc-typed):
- `export const SYNC_COPY_NAME = /^.+ \d+(\.[^.]+)?$/;`
- `export function isSyncConflictCopy(name: string): boolean`. Tests a basename against `SYNC_COPY_NAME`.
- `export function findSyncConflictCopies(root: string): string[]`. Walks recursively with
  `readdirSync(dir, { withFileTypes: true })` and does not follow symlinks. Skips entries named `.git` or
  `node_modules` at any depth. Returns POSIX-style paths relative to `root`, sorted, for every file **or
  directory** whose basename matches. A matching directory is reported once and is not descended into.
- CLI: runs only when the file is the entry point (`import.meta.url` equals the `pathToFileURL` of
  `process.argv[1]`). Its root is `process.argv[2] ?? process.cwd()`. If nothing is found it prints nothing
  and exits 0. Otherwise it writes to stderr:
  ```
  File-sync conflict copies found (remove them; see README "Where to keep the repo"):
    src/x 2.ts
    backlog/docs/doc-100 - Foo 2.md
  ```
  and exits 1.

### Rules and algorithms
Matcher examples (basename):
| Name | Match? |
|---|---|
| `x 2.ts` | yes |
| `doc-100 - Hand records 2.md` | yes |
| `foo.test 2.ts` | yes |
| `src 2` | yes |
| `index 12` | yes |
| `.env 2` | yes |
| `x.ts` | no |
| `task-1.54 - Stop-file-sync-conflict-copies-from-reaching-commits.md` | no |
| `task-9 - 3.5bb-sizing.md` | no (two dots after the digit) |
| `x2.ts` / `x-2.ts` | no (no space) |
| ` 2.ts` | no (empty base) |

### Error handling and configuration
- If a directory can't be read (EACCES), the error propagates. The CLI exits non-zero with Node's stack
  trace. This is acceptable for a dev tool, and lint failing loudly is the safe direction.
- No configuration. The skip list is fixed (`.git`, `node_modules`).

## 6. Behaviour specification

### SPEC-01: Matcher recognises conflict-copy names only
- Verifies: AC#1
- Behaviour: Given every name in the §5 table, When `isSyncConflictCopy(name)` runs, Then it returns exactly the Match? column.
- Verification: unit `tests/toolchain/sync-copies.test.ts::isSyncConflictCopy matches iCloud conflict names and nothing else`

### SPEC-02: Check fails naming every copy, skipping .git and node_modules
- Verifies: AC#1
- Behaviour: Given a temp dir containing `src/x 2.ts`, `src/x.ts`, `backlog/docs/doc-100 - Foo 2.md`, `e2e 2/a.ts`, `.git/index 2` and `node_modules/pkg/a 2.js`, When `node tools/lint/sync-copies.js <dir>` runs, Then the exit code is 1, stderr contains `src/x 2.ts`, `backlog/docs/doc-100 - Foo 2.md` and `e2e 2`, and stderr does not contain `index 2`, `a 2.js` or `src/x.ts`.
- Verification: acceptance `tests/toolchain/sync-copies.test.ts::the check fails naming each conflict copy and skips .git and node_modules`

### SPEC-03: Check passes on a clean tree
- Verifies: AC#1
- Behaviour: Given a temp dir containing only `src/x.ts` and `backlog/tasks/task-1.54 - Stop-file-sync.md`, When the CLI runs on it, Then the exit code is 0 and output is empty.
- Verification: acceptance `tests/toolchain/sync-copies.test.ts::the check passes when there are no conflict copies`

### SPEC-04: `npm run lint` fails on a conflict copy
- Verifies: AC#1
- Behaviour: Given the toolchain sandbox with probe file `src/ui/probe 2.ts` (`export const x = 1;\n`), When `npm run lint` runs, Then the exit code is non-zero and the output contains `src/ui/probe 2.ts` and `File-sync conflict copies found`.
- Verification: acceptance `tests/toolchain/sync-copies.test.ts::npm run lint fails naming a conflict copy`

### SPEC-05: Git ignores conflict copies and no tracked file
- Verifies: AC#1
- Behaviour: Given the repo `.gitignore`, When `git check-ignore --no-index` runs on `src/x 2.ts`, `backlog/docs/doc-100 - Foo 2.md`, `src 2/a.ts` and `tests/foo.test 12.ts`, Then all four are ignored (exit 0, each path printed). And When `git ls-files -ci --exclude-standard` runs, Then its output is empty, and no path in `git ls-files` satisfies `isSyncConflictCopy` on its basename.
- Verification: acceptance `tests/toolchain/sync-copies.test.ts::gitignore ignores conflict copies but no tracked file`

### SPEC-06: README guidance on where to keep the repo
- Verifies: AC#2
- Behaviour: Given `README.md`, When it is read, Then it has a `## Where to keep the repo` heading. That section says the repo must not live in an iCloud-synced folder and names "Desktop & Documents". It gives a `mv` command that moves the clone to a non-synced folder (e.g. `~/Code`). It says to delete conflict copies listed by `npm run lint`. It also mentions the alternative of turning off "Desktop & Documents Folders" in System Settings → Apple Account → iCloud → iCloud Drive.
- Verification: acceptance `tests/toolchain/sync-copies.test.ts::README says not to keep the repo in an iCloud-synced folder and how to move it`

## 7. Edge cases
- Empty tree → SPEC-03 (exit 0).
- Copy is a directory (`e2e 2`) → SPEC-02 (reported once, not descended into).
- Copies inside `.git`/`node_modules` (e.g. `.git/index 2`, present right now) → SPEC-02 (skipped).
- Numbered variants ` 3`, ` 12` → SPEC-01 and SPEC-05.
- Copy before the final extension of a multi-dot name (`foo.test 2.ts`) → SPEC-01 and SPEC-05.
- Legitimate backlog names with spaces → SPEC-01, SPEC-03 and SPEC-05.
- Symlinks: not followed (`Dirent.isDirectory()` is false for symlinks). The sandbox symlinks `node_modules`
  anyway.
- Concurrency/interruption: N/A, because the check is a read-only, single-pass walk.

## 8. Security considerations
- Trust boundaries: none new. The script reads directory names only and never file contents.
- No new dependencies, secrets, randomness or network access. Output contains only repo-relative paths.

## 9. Non-functional
- The check adds less than 100 ms to `npm run lint` on the current tree (~3,000 entries outside `.git` and
  `node_modules`). This isn't asserted in tests, in line with the "slow tests opt-in" rule. The Judge can run
  `time node tools/lint/sync-copies.js`.
- No new test in `test:unit` or `test:sweeps`. The new tests live in `tests/toolchain/` (the tooling group).

## 10. Test plan
- Test command: `npm run test:tooling -- tests/toolchain/sync-copies.test.ts tests/toolchain/lint.test.ts && npm run test:unit`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/lint/sync-copies.js` (exit 0 on a clean tree). Repro: `cp src/main.tsx "src/main 2.tsx" && npm run lint; rm "src/main 2.tsx"`
- New tests: `tests/toolchain/sync-copies.test.ts` → SPEC-01..06. `tests/toolchain/lint.test.ts` (existing)
  must still pass with the sandbox change.
- End-to-end for the Judge:
  1. Run `touch "src/zz 2.ts"`.
  2. `npm run lint` should exit 1 naming `src/zz 2.ts`.
  3. `git status --porcelain` should not list it.
  4. `git add -A --dry-run` should not list it.
  5. Run `rm "src/zz 2.ts"`. `npm run lint` should now exit 0.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-1.54/qa.md`.
