# TASK-1.35: Harden and tidy the merged-branch cleanup script

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a · Branch: doit/TASK-1.35

## What was asked
Follow-ups from the TASK-1.24 reviews of `tools/git/prune-merged-branches.js`:
1. The remote delete must use a lease (`--force-with-lease=<ref>:<listed sha>`), so a branch that moved after listing is refused and the script exits 1 naming it.
2. A test must prove the `missing ref` path (no `main` or no `origin/main`): exit 1, nothing deleted.
3. Rename `lines()` to `outputLines` and `fail()` to `reportError`; all tests still pass.

Spec: doit/TASK-1.35/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | All remote deletes stay in one `git push --porcelain`, with one `--force-with-lease=refs/heads/<b>:<sha>` per branch. Refused branches are read from the porcelain `!` lines. | yes | One network round trip, as before; porcelain is git's stable machine format. | Push one branch at a time. |
| A-2 | Refused branch message on stderr: `prune-merged-branches: refused to delete <branch> on origin: <git summary>`. Push failures with no `!` line keep the old `git <args> failed` plus git stderr. | yes | Matches the existing `<NAME>: <message>` style. | Echo raw git stderr only. |
| A-3 | Tests simulate "moved after listing" with a `git` shim first on `PATH`. It moves the temporary origin's `doit/a` to `doit/b`'s commit just before the real `git push`. | yes | Deterministic, hits the exact window, touches only a temporary origin. | Use a `reference-transaction` hook (depends on delete order); a `pre-push` hook would not prove the lease. |

No questions were asked (autopilot run); the user's answers file records "No ask items".

## What was built
- `tools/git/prune-merged-branches.js`: the remote listing now carries each branch's SHA. `remoteDeleteArgs` builds the single `git push --porcelain origin --force-with-lease=refs/heads/<b>:<sha> … --delete <b> …`. `refusedBranches` parses the porcelain `!` lines (text after the last `:`), and each refused branch is reported on stderr with exit 1. `lines` is now `outputLines`, `fail` is now `reportError`.
- `tests/git/prune-merged-branches-hardening.acceptance.test.ts` (new): SPEC-01 and SPEC-02, using only `mkdtemp` repos with a temporary bare origin.
- `tests/git/prune-merged-branches-lease.test.ts` (new): SPEC-03, pure helper tests for the lease args and refusal parsing.
- Locked TASK-1.24 tests were not touched. Dry-run output, exit codes 0/2 and the README are unchanged.
- Build note: probed git 2.54.0 in a throwaway repo. A stale-lease delete exits 1 and prints `!<TAB>(delete):refs/heads/doit/a<TAB>[rejected] (stale info)` (source field is `(delete)`, not empty as the spec example showed). The parser handles both forms and the unit test covers both.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Acceptance test: branch moved between listing and push is refused, named, exit 1, others deleted | PASS | hardening acceptance test; mutation check (lease args removed makes it fail) |
| SPEC-02 | AC#2 | Acceptance test: missing local `main` and missing `origin/main` each exit 1 with `missing ref`, nothing deleted | PASS | hardening acceptance test |
| SPEC-03 | AC#1 | Unit test of `remoteDeleteArgs` and `refusedBranches` (both porcelain source forms, several refusals) | PASS | lease test |
| SPEC-04 | AC#3 | Greps: `\b(lines\|fail)\(` finds nothing; `const (outputLines\|reportError) = ` count 2; existing tests pass | PASS | build log |

- Gate (build-1): `npm test` 95 files, 347 passed, 6 skipped; lint, typecheck and format clean. Scope: 271 changed lines vs budget 230 (warn band, fail above 460), 3 files.
- Judge round 1: PASS. A dry run end to end in a temporary clone with a temporary bare origin gave exit 0 and unchanged refs. The pre-change script, run through the same move scenario, deletes the moved branch, so the test discriminates old from new. The first judge `npm test` run (load average about 34) had one wall-clock failure in `equity.test.ts`, unrelated and passing on rerun.

## Review
No BLOCKER or MAJOR findings in round 1 (code and security).

### Non-blocking review notes (deliberately not fixed)
- Security NIT: the lease is keyed on `refs/heads/<b>` but the delete refspec uses the short `<b>`. If origin also has a tag of the same name, git refuses the ambiguous name and the push fails. It fails safe (exit 1, nothing wrongly deleted).
- Code MINOR: the push-failure fallback repeats the body of `runOrReport` (report, write stderr, set exit code). Behaviour is the same either way.
- Code NIT: 271 changed lines vs the 230 budget. The extra is mostly the acceptance test, which copies the locked TASK-1.24 fixture because that test cannot be imported from.
- Judge J-1-01 (LOW): local wall-clock assertions can flake under heavy parallel load (see follow-ups).

## How to try it
- `npx vitest run tests/git`
- `npm test`, `npm run lint`, `npm run typecheck`
- Dry run: `node tools/git/prune-merged-branches.js`. `--apply` deletes real branches; the tests only use temporary repos.

## Run metrics
Questions 0 · assumptions logged 3 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 271 (budget 230).

## Known limitations and follow-ups
- Local `git branch -D` deletions are not leased (no remote counterpart), by design.
- Change the delete refspec in `tools/git/prune-merged-branches.js` to `refs/heads/<b>` so it matches the lease ref and avoids tag ambiguity. Owner: no existing task.
- Remove the duplicated failure reporting between the push-failure fallback and `runOrReport` in `tools/git/prune-merged-branches.js` (have `runOrReport` return the spawn result). Owner: no existing task.
- Make local wall-clock performance assertions load-tolerant, or skip them locally as CI does (`tests/advice/equity.test.ts` 'bounds the work when range sets cannot all be dealt' took 2092 ms vs 2000 ms; `hand-evaluator.perf` and `invariants.perf` each failed once under load). Owner: no existing task.

## Lessons for the factory (proposals — not applied)
- Perf and wall-clock tests flaked under load during both the build and the judge run, costing reruns. Propose a rule that the gate and judge rerun a failing perf test in isolation once and record it, or run perf tests serially.
- The spec's porcelain example was wrong (`(delete)` vs empty source). Propose that specs for git-output parsing cite a probe of the installed git version.
- The scope budget was too small for a new acceptance test that must copy a locked fixture. Propose budgeting copied fixtures explicitly when a locked test cannot be imported.
