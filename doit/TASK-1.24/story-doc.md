# TASK-1.24: Protect main and keep CI action pins current

Status: Done · Completed: 2026-11-18 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up of TASK-1.7, doc-6) · Branch: doit/TASK-1.24

## What was asked
Three repository-hygiene items left over from TASK-1.7:
- AC#1: a `.github/dependabot.yml` so Dependabot opens weekly update PRs for `github-actions` and `npm`.
- AC#2 (cleanup): a way to delete `doit/*` branches already merged into `main`, locally and on `origin`.
- AC#3 (branch protection): `main` should not accept a PR whose CI check has not passed. After Q-1 this AC means documenting the setting, because GitHub refuses it on this private free-plan repo.

AC numbers here follow the spec (`doit/TASK-1.24/spec.md`), which matches the live task after Q-1 renumbered the criteria. Spec: `doit/TASK-1.24/spec.md`.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Dependabot runs weekly, Monday 06:00 Etc/UTC, `directory: /`, for both ecosystems | yes | AC says weekly; a fixed slot makes the first run predictable | Edit `schedule` in `.github/dependabot.yml` |
| A-2 | Groups: one `actions` group for all Actions updates; npm `minor` and `patch` in one group; npm majors open one PR each; PR limit left at the default (5) | yes | About 25 pinned npm packages would otherwise open several PRs a week; majors stay separate because they break things | Remove or change `groups` |
| A-3 | No `ignore` rules and no `versioning-strategy` override | yes | Smallest config; the repo already pins exact versions | Add `ignore` entries (e.g. `@types/node` majors) |
| A-4 | Cleanup script is `tools/git/prune-merged-branches.js`, run with `node`, no npm script | yes | Matches the `tools/ci/*.js` style; it is not a CI step | Add an npm script or move the file |
| A-5 | The script runs `git fetch --prune origin` in both modes | yes | Stale remote-tracking refs would give a wrong list | Drop the fetch (not advised) |
| A-6 | "Merged" means local `doit/*` reachable from local `main`, and `origin/doit/*` reachable from `origin/main`; the checked-out branch is never deleted and is reported as skipped | yes | A branch merged locally but not yet pushed keeps its remote copy | Use `main` for both lists |
| A-7 | Local deletion uses `git branch -D` (only for names already proven merged into `main`); remote deletion is one `git push origin --delete <names...>` | yes | `git branch -d` checks against HEAD or upstream and refuses merged branches when run from another branch | Use `-d` and require running on `main` |
| A-8 | README `gh api` commands use `repos/{owner}/{repo}` placeholders and a heredoc `sh` block | yes | Survives a rename; Prettier does not reformat `sh` blocks, so the pinned text stays stable | Hard-code the slug |

## Clarifications and decisions
- Q-1: How to meet branch protection, given GitHub answers HTTP 403 on this private free-plan repo. The user chose (a), document now and apply later. Consequence: the README documents the exact `gh api -X PUT` command (required check = CI job name, `strict: false`, no required reviews, `enforce_admins: false` so direct pushes keep working) and the verify command. Applying it becomes a follow-up.
- D-1: The cleanup is a dry-run-by-default script plus a README step, not README prose. Deleting about 50 branches by pasted pipelines is error-prone, and a script can be tested against a throwaway repo.
- D-2: Branch protection is documented and its 403 limitation is stated. The alternatives were making the repo public, GitHub Pro, or a local pre-push hook. Approved by Q-1.

## What was built
- `.github/dependabot.yml`: weekly `github-actions` and `npm` updates with the groups above.
- `tools/git/prune-merged-branches.js`: `node tools/git/prune-merged-branches.js [--apply]`.
  - Dry run is the default and deletes nothing.
  - Every git call goes through `spawnSync` with an argument array, never a shell.
  - Exports `parseOptions` and `formatPlan`.
  - Exit codes: 2 for a usage error or when run outside a repo; 1 for a fetch failure, a missing `main` or `origin/main`, or a failed delete.
  - Example output: `Dry run: nothing deleted...`, then `Local doit/* branches merged into main (N):`, then `Remote doit/* branches on origin merged into origin/main (M):`, with an optional `Skipped (checked out): ...` line. `--apply` ends with `Deleted N local and M remote branches.`
- `README.md`: three subsections under "Continuous integration": "Dependency updates", "Branch protection" (PUT command, verify command, 403 note, "rename the job, change the context") and "Branch cleanup".
- Tests: `tests/ci/dependabot.acceptance.test.ts`, `tests/ci/branch-protection.acceptance.test.ts` (pins the README required-check name to the single job name in `ci.yml`), `tests/git/prune-merged-branches.acceptance.test.ts` (real git in mkdtemp clones with a bare `origin`, git config isolated), `tests/git/prune-merged-branches.test.ts` (unit tests).
- No new dependencies. `ci.yml` and `tests/ci/workflow.test.ts` are unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Dependabot config | Acceptance test, plus judge parsed the YAML with a real parser | PASS | Matches spec §5 exactly |
| SPEC-02 | Dependabot README and GitHub side | Acceptance test for the README. The GitHub part is a manual check after the push | PASS (README); GitHub part pending | `dependabot.yml` is not on `origin/main` yet (J-1-01) |
| SPEC-03 | Branch protection documented and pinned to the CI job | Acceptance test; judge ran the read-only GET | PASS | GET returned HTTP 403 "Upgrade to GitHub Pro or make this repository public..."; PUT was not run |
| SPEC-04 | Dry run lists, deletes nothing | Acceptance test | PASS | Refs unchanged before and after |
| SPEC-05 | `--apply` deletes locally and on origin | Acceptance test | PASS | `Deleted 2 local and 2 remote branches.` |
| SPEC-06 | Checked-out branch and unpushed merges kept | Acceptance test | PASS | |
| SPEC-07 | Nothing to clean | Acceptance test | PASS | |
| SPEC-08 | Usage and environment errors | Unit and acceptance tests | PASS | |
| SPEC-09 | README cleanup step and real-repo dry run | Acceptance test; judge dry run in the project root | PASS | Listed 25 local and 24 remote merged branches, matching `git branch --merged`; refs unchanged |

- Test suite: `npm test` passed with 80 files and 292 tests (2 pre-existing skips). `npm run lint` and `npm run typecheck` were clean. Gate run 1: PASS, with a warning that the scope was 512 changed lines against a 470 budget (fails only above 940).
- Judge: 1 round, PASS, with 29 holdout checks (prefix filtering, nested names, detached HEAD, subdirectory, missing refs, push failure, shell-metacharacter names) and a test-integrity check, all clean. `--apply` was never run against the real repo.
- Judge findings (both LOW):
  - J-1-01: the Dependabot GitHub check cannot be observed until `main` is pushed.
  - J-1-02: said the spec's AC numbers were swapped against the task. This was a false alarm. The judge read a task snapshot taken before Q-1 renumbered the ACs, and the live task matches the spec.

## Review
Round 1: 0 BLOCKER and 0 MAJOR findings from the code and security reviewers, so nothing needed a fix.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): `formatPlan` has a local `lines` array, and the module also has a `lines(output)` helper. Rename the helper to `outputLines` or `splitLines`.
- MINOR (code): the "missing `main` or `origin/main`" exit 1 path is implemented but no test covers it.
- NIT (code): `fail(message)` only writes to stderr, so the name overstates it. Rename it to `reportError`.
- MINOR (security): remote deletion has no lease. If someone pushes to `origin/doit/X` between the fetch and the delete, those commits are lost. This is not realistic for a single-user repo. Optional fix: delete with `--force-with-lease=doit/X:<sha>`.

## How to try it
```sh
node tools/git/prune-merged-branches.js          # dry run
node tools/git/prune-merged-branches.js --apply  # after pushing main
gh api repos/{owner}/{repo}/branches/main/protection   # 403 until public or Pro
npm test
```
Dependabot: after pushing `main`, open the repo's network/updates page, click "Check for updates", then run `gh pr list --author app/dependabot --state all`.

## Run metrics
Questions asked: 1 (Q-1) · assumptions logged: 8 · review rounds: 1 · judge rounds: 1 · gate runs: 1 · escalations: 0 · changed lines: 512 across 7 files (budget 470 and 7).

## Known limitations and follow-ups
- Branch protection is documented but not applied (private free-plan repo returns 403).
- Squash-merged branches are not detected, and only `doit/*` is pruned.
- Follow-ups, each one line:
  1. Apply the README branch-protection command once the repo is public or on GitHub Pro, then verify that a PR with failing CI cannot be merged (AC#3 deferred part).
  2. After `main` is pushed, confirm Dependabot lists both ecosystems without errors and opens PRs (J-1-01, AC#1).
  3. In `tools/git/prune-merged-branches.js`, delete remote branches with `--force-with-lease=<ref>:<sha>` (security MINOR).
  4. In `tools/git/prune-merged-branches.js`, rename the `lines()` helper (code MINOR) and rename `fail()` to `reportError` (NIT).
  5. Add a test to `tests/git/prune-merged-branches.acceptance.test.ts` for the missing `main` or `origin/main` case, expecting exit 1 and `missing ref` (code MINOR).
  6. Run `node tools/git/prune-merged-branches.js --apply` after pushing `main` to clear the merged `doit/*` branches (user step).

## Lessons for the factory (proposals — not applied)
- The judge worked from a task snapshot taken before Q-1 renumbered the ACs, which produced the false finding J-1-02. Refresh `task.md` after any AC rewording, or have the judge read the live `backlog task view`.
- The spec's scope budget (470 lines) was exceeded (512), mostly by the tests. Budget test lines separately, or estimate them higher.
- `state.json` recorded `questions: 0` and `assumptions: 0` although Q-1 and A-1..A-8 exist. Fix the counters.
