# Spec: TASK-1.35 — Harden and tidy the merged-branch cleanup script

Status: READY (approved 2026-11-19)
Task: TASK-1.35 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
Follow-ups from the TASK-1.24 reviews of `tools/git/prune-merged-branches.js` (doc-30). The remote delete
becomes lease-protected: each remote `doit/*` branch is deleted only if it still points at the SHA the script
listed, so a branch someone pushed to after the listing survives and the script exits 1 naming it. A new
test covers the untested `missing ref` path, and two helpers get clearer names (`lines` → `outputLines`,
`fail` → `reportError`).

## 2. Scope
- In scope:
  - `tools/git/prune-merged-branches.js`: list remote branches with their SHAs, delete them with one
    `git push --porcelain origin --force-with-lease=refs/heads/<b>:<sha> … --delete <b> …`, report each refused
    branch, and rename the two helpers.
  - New tests in new files (the TASK-1.24 acceptance test is locked).
- Not doing:
  - Changing `tests/git/prune-merged-branches.acceptance.test.ts` or `tests/git/prune-merged-branches.test.ts`.
    Both must keep passing unchanged.
  - Leasing local `git branch -D` deletions. A local race has no remote counterpart.
  - Changing the dry-run output, `formatPlan`, `parseOptions`, exit codes 0/2, or the README.
  - Renaming `formatPlan`'s local `const lines` array. AC#3 renames only the module-level helper.
  - Running the script against the real repository's `origin` from any test or from Claude with `--apply`.
    Tests use only `mkdtemp` directories with a temporary bare origin.
- Scope budget: files=3, lines=230   (script about +35/-10, new acceptance test about 140, new unit test about 45)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | All remote deletes stay in one `git push --porcelain`, with one `--force-with-lease=refs/heads/<b>:<sha>` per branch. Refused branches come from the porcelain `!` lines. | yes | One network round trip, as today (`prune-merged-branches.js:112`). Porcelain output is git's stable machine format, so the script can name each refused branch. | One push per branch (N round trips) |
| A-2 | Message for each refused branch: `prune-merged-branches: refused to delete <branch> on origin: <git summary>`, on stderr. Push failures with no `!` line keep the existing `git <args> failed` + git stderr. | yes | Matches the existing `<NAME>: <message>` style (`:52`) | Echo raw git stderr only |
| A-3 | The tests simulate "moves after listing" with a `git` shim placed first on `PATH` for the script run only. Before it runs the real `git push`, the shim moves origin's `refs/heads/doit/a` to `doit/b`'s commit in the temporary bare origin. | yes | Deterministic. It hits the exact window between listing and push, does not depend on the order of local and remote deletes, and touches only the temporary origin. | `reference-transaction` hook in the clone (depends on local-before-remote order); `pre-push` hook (the server would reject even without a lease, so the test would not prove the lease) |

## 3. Current system
- Script: `tools/git/prune-merged-branches.js` is plain ESM with JSDoc, typechecked via `checkJs` (TASK-1.24 A-4). Relevant lines:
  - `git` wrapper `:49`, `fail` `:52`, `lines` `:55`.
  - `missing ref` check `:74-79`.
  - The remote listing uses `--format=%(refname:lstrip=3)` with names only (`:89-96`).
  - `runOrReport` writes `git <args> failed` + stderr and sets exit 1 (`:104-110`).
  - Local deletes `:111`. The unleased remote delete `git push origin --delete ...` is at `:112`.
  - The `Deleted N local and M remote branches.` line is printed only on success (`:113-115`).
  - `formatPlan` has a local `const lines` (`:35`) that shadows the module-level `lines` helper. This is the code-review MINOR.
- Tests: Vitest, `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`), 30 s timeout (`vite.config.ts:10`).
  `tests/git/prune-merged-branches.acceptance.test.ts` (locked) has no test for `missing ref`. It covers
  dry run, apply, skip, none, and usage/fetch errors (`:99-192`).
- Existing code to reuse (copy the patterns; do not import from the locked test file):
  - `tests/git/prune-merged-branches.acceptance.test.ts:23-38` → the isolated git `env` (`GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CEILING_DIRECTORIES`, stripped `GIT_*`)
  - `:44-57` → `git`, `prune`, `refs`, `branches` helpers
  - `:63-86` → the `setUpMain` / `setUpFixture` fixture (`doit/a`, `doit/c` merged; `doit/b` ahead)
  - `:88-97` → the `forbidPush` pre-receive marker
  - `tests/support/sandbox.ts:15` → `REPO_ROOT`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The lease names the full ref (`refs/heads/<b>`) and the SHA from the script's own `for-each-ref` listing, not the implicit `--force-with-lease` (which uses the remote-tracking ref) | Bare `--force-with-lease` | The AC requires `<ref>:<listed sha>`. An explicit SHA cannot drift if a background fetch updates the tracking ref. | no | n/a |

## 5. Design

### Files to create / modify
- `tools/git/prune-merged-branches.js` — modify: leased remote delete, refused-branch reporting, helper renames.
- `tests/git/prune-merged-branches-hardening.acceptance.test.ts` — new: SPEC-01, SPEC-02 (temporary repos only).
- `tests/git/prune-merged-branches-lease.test.ts` — new: SPEC-03 (pure helpers).

### Components, interfaces and data
New pure exports in `tools/git/prune-merged-branches.js`:
- `remoteDeleteArgs(branches: { name: string, sha: string }[]): string[]` returns
  `['push', '--porcelain', 'origin', ...branches.map(b => '--force-with-lease=refs/heads/' + b.name + ':' + b.sha), '--delete', ...branches.map(b => b.name)]`.
- `refusedBranches(porcelain: string): { name: string, summary: string }[]` takes each line that starts with
  `!\t` and splits it on `\t`. `name` is field 2 (`<from>:<to>`) after its last `:`, with a leading
  `refs/heads/` stripped. `summary` is field 3, trimmed.
  Example: `'!\t:refs/heads/doit/a\t[rejected] (stale info)\nDone\n'` →
  `[{ name: 'doit/a', summary: '[rejected] (stale info)' }]`. Lines starting with `-`, `=` or `To ` are ignored.
- Renames: `const lines` helper (`:55`) → `outputLines`; `const fail` (`:52`) → `reportError`. Every call site
  changes with it. `formatPlan`'s local `lines` array stays.

### Rules and algorithms
- The remote listing uses `--format=%(objectname) %(refname:lstrip=3)` and is parsed into `{ name, sha }`.
  `formatPlan` still receives `remote: names`.
- With `--apply` and at least one remote branch, run `git(remoteDeleteArgs(remote))`. Then:
  - Status 0: success.
  - Non-zero with refused branches: for each, `reportError('refused to delete <name> on origin: <summary>')`; exit code 1.
  - Non-zero with no `!` lines: the existing `git <args> failed` + git stderr; exit code 1.
- Local deletes, their order, the dry run and all other paths are unchanged.

### Error handling and configuration
| Condition | stderr | Exit |
|---|---|---|
| Remote branch moved since listing | `prune-merged-branches: refused to delete <branch> on origin: <git summary>` (one line per refused branch) | 1 |
| `main` or `origin/main` missing | `prune-merged-branches: missing ref <main or origin/main>` (unchanged) | 1 |
| Other push failure | `prune-merged-branches: git push --porcelain origin … failed` + git stderr | 1 |

## 6. Behaviour specification

### SPEC-01: A remote branch that moved after listing is not deleted
- Verifies: AC#1
- Behaviour: Setup:
  - The SPEC-04 fixture from TASK-1.24: `doit/a` and `doit/c` merged and pushed, `doit/b` one commit ahead.
  - A `git` shim on `PATH`, used only for the script run. On any invocation containing the argument `push`,
    it first runs `<real git> --git-dir=<origin> update-ref refs/heads/doit/a refs/heads/doit/b`, then `exec`s the real git.

  When `--apply` runs:
  - It exits 1.
  - stderr contains `prune-merged-branches: refused to delete doit/a on origin` and does not mention `doit/c`.
  - stdout does not contain `Deleted `.
  - origin's branches are `['doit/a', 'doit/b', 'main']`, and origin's `doit/a` equals `doit/b`'s SHA (the moved
    branch survives; `doit/c` was deleted).
  - The clone's local branches are `['doit/b', 'main']`.
- Verification: acceptance `tests/git/prune-merged-branches-hardening.acceptance.test.ts::refuses to delete a remote branch that moved after listing`

### SPEC-02: Missing main or origin/main deletes nothing
- Verifies: AC#2
- Behaviour: Two cases, each with `forbidPush` installed:
  - (a) The SPEC-04 fixture, then `git checkout doit/b` and `git branch -D main` in the clone, so local `main` is missing.
  - (b) The SPEC-04 fixture, then `git --git-dir=<origin> update-ref -d refs/heads/main` and a clone `git fetch --prune origin`, so `origin/main` is missing.

  In each case, when `--apply` runs:
  - It exits 1.
  - stderr is exactly `prune-merged-branches: missing ref main\n` for (a), or `prune-merged-branches: missing ref origin/main\n` for (b).
  - stdout is `''`.
  - `for-each-ref` of the clone and of the origin are byte-identical before and after the run.
  - The push marker does not exist.
- Verification: acceptance `tests/git/prune-merged-branches-hardening.acceptance.test.ts::exits 1 with missing ref and deletes nothing`

### SPEC-03: Lease arguments and refusal parsing
- Verifies: AC#1
- Behaviour: Given `remoteDeleteArgs([{ name: 'doit/a', sha: 'a1' }, { name: 'doit/c', sha: 'c3' }])`, Then it returns
  `['push', '--porcelain', 'origin', '--force-with-lease=refs/heads/doit/a:a1', '--force-with-lease=refs/heads/doit/c:c3', '--delete', 'doit/a', 'doit/c']`.

  Given `refusedBranches`:
  - with `'To /tmp/o.git\n-\t:refs/heads/doit/c\t[deleted]\n!\t:refs/heads/doit/a\t[rejected] (stale info)\nDone\n'`,
    it returns `[{ name: 'doit/a', summary: '[rejected] (stale info)' }]`;
  - with `''`, it returns `[]`.
- Verification: unit `tests/git/prune-merged-branches-lease.test.ts::builds leased delete args and parses refusals`

### SPEC-04: Helpers renamed, all tests still pass
- Verifies: AC#3
- Behaviour: In `tools/git/prune-merged-branches.js`:
  - `grep -nE '\b(lines|fail)\(' tools/git/prune-merged-branches.js` prints nothing.
  - `grep -cE 'const (outputLines|reportError) = ' tools/git/prune-merged-branches.js` prints `2`.
  - `npm test` passes, including the unchanged TASK-1.24 tests.
- Verification: command `grep -nE '\b(lines|fail)\(' tools/git/prune-merged-branches.js; test $(grep -cE 'const (outputLines|reportError) = ' tools/git/prune-merged-branches.js) -eq 2 && npm test`

## 7. Edge cases
- No remote branches to delete: no push runs. Already covered by the locked TASK-1.24 test `reports none when nothing is merged`.
- Several branches move: each one is reported on its own line by `refusedBranches`. The SPEC-03 parsing covers this per line.
- Push fails for a non-lease reason (network, hook): the existing generic failure path, exit 1. Covered by the unchanged `runOrReport` behaviour.
- Concurrency: the lease itself is the mitigation (SPEC-01).
- Branch names containing `:` or tabs: git refnames cannot contain `:`, and tabs cannot occur, so parsing on the last `:` and on tabs is safe.

## 8. Security considerations
- Trust boundary: branch names and SHAs come from local `git for-each-ref`. They are passed as argv to
  `spawnSync` with no shell, so no injection is possible.
- The lease closes the reviewed MINOR: work pushed to a `doit/*` branch after listing is no longer deleted.
- No secrets, no new dependencies, no randomness. Tests isolate git config (`GIT_CONFIG_GLOBAL=/dev/null`,
  `GIT_CEILING_DIRECTORIES`) and never touch the real repo or origin.

## 9. Non-functional
- Still one remote round trip for deletes. Each new test runs well under the 30 s Vitest timeout (`vite.config.ts:10`).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/git/prune-merged-branches.js` (dry run only; `--apply` is run only by the user)
- New tests:
  - `tests/git/prune-merged-branches-hardening.acceptance.test.ts` → SPEC-01, SPEC-02
  - `tests/git/prune-merged-branches-lease.test.ts` → SPEC-03
- End-to-end scenario for the Judge:
  1. Run `npm test`, `npm run lint` and `npm run typecheck`.
  2. Run the SPEC-04 grep commands.
  3. In the project root, run `node tools/git/prune-merged-branches.js` (dry run). Confirm it exits 0 and that
     `git for-each-ref` output is unchanged afterwards.
  4. Do not run `--apply` against the real origin.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-1.35/qa.md`. No questions were needed.
