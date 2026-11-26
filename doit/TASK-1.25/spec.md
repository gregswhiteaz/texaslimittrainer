# Spec: TASK-1.25 — Run the all-dependency audit at high once picomatch is patched

Status: READY (approved 2026-11-26)
Task: TASK-1.25 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
CI's "Audit all dependencies" step runs `npm audit --audit-level=critical`. That level was chosen in TASK-1.1
(Q-3, doc-5) only to tolerate the dev-only picomatch advisory GHSA-fc5q-39xc-vjpf. That advisory no longer
reports: `npm audit --audit-level=high` finds 0 vulnerabilities today. This task tightens the step to
`npm audit --audit-level=high` and updates the tests and README that pin the old text, so a high advisory in
any dependency, dev or shipped, now fails CI.

## 2. Scope
- In scope: change the one `run:` line in `.github/workflows/ci.yml`; update the CI tests that pin that line;
  update both README mentions (the CI job table and the "Local equivalent" command).
- Not doing:
  - Removing or merging the "Audit shipped dependencies" step (see A-1).
  - Adding audit exceptions or allowlists, or changing any dependency, `package.json` or `package-lock.json`.
  - Editing historical records: doc-5, doc-6, TASK-1.1 and TASK-1.7 task text and notes, or earlier
    `doit/*` folders.
  - Changing other workflows (`visual.yml`, `million.yml`) or Dependabot config.
- Scope budget: files=4, lines=40

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Keep the two audit steps. Only the all-deps level changes from `critical` to `high`. | yes | The all-deps high check now covers the shipped high check, so the shipped step is redundant as a gate. But it runs first, and its step name tells a reader straight away that a failure is in shipped code. It costs about 1 s. Keeping it also keeps the change to one line, with no test restructuring. | Merge into one `Audit dependencies` step running `npm audit --audit-level=high`. This drops one step and needs edits to the step-order arrays and the named-step test. |
| A-2 | Keep the step name "Audit all dependencies" unchanged. | yes | The name still describes what the step does. Changing it would break the step-name assertions for no gain. | Rename to "Audit all dependencies (high)". |
| A-3 | Update the README text in place. Shipped and all deps now share the same rule ("no high or critical advisory"). | yes | The README describes current CI. It must not say "critical" once CI says "high". | Collapse to one sentence that names both commands. |

## 3. Current system
- `.github/workflows/ci.yml:99-102`: job `checks` has the steps `Audit shipped dependencies` →
  `npm audit --omit=dev --audit-level=high` and `Audit all dependencies` → `npm audit --audit-level=critical`.
  They run straight after `npm ci` and before lint.
- Origin of `critical`: doc-5 Q-3 / D-3 (TASK-1.1). The story doc says to tighten to `--audit-level=high` once
  picomatch is patched (`backlog/docs/stories/doc-5 …md:187-188`). TASK-1.7 AC#5 added the two steps
  to CI (doc-6 Q-3).
- Current state (checked 2026-11-26):
  - `npm audit --audit-level=high` reports `found 0 vulnerabilities` and exits 0.
  - picomatch 4.0.7 is still installed as a dev dependency (vite → tinyglobby → picomatch,
    `package-lock.json:2709`, `:2993`). `npm explain picomatch` shows it, although `npm ls picomatch` prints
    `(empty)` because the entry is flagged extraneous.
  - The GitHub advisory API reports GHSA-fc5q-39xc-vjpf as **withdrawn** (2026-11-18). It still has
    `first_patched_version: null` and range `<= 4.0.7`. So the advisory stopped reporting because it was
    withdrawn, not because a patched version shipped. Q-1 approved proceeding anyway; the builder's final
    summary must say the advisory was withdrawn, not patched.
- Tests that pin the line. All of them run in `npm run test:tooling` (`package.json:16`) and in `npm test`:
  - `tests/ci/workflow.test.ts:63-64` (`runs install, audits, lint, typecheck, build, test and e2e in that
    order`) and `:224-231` (`runs each audit gate as its own named step`). Locked as an acceptance file by
    earlier tasks TASK-1.7, TASK-1.8, TASK-1.19 and TASK-1.29 (`doit/<id>/state.json` `locked_tests`).
  - `tests/ci/ci-jobs.acceptance.test.ts:150-151` (`ci.yml runs lint, coverage, two sweep shards, tooling and
    e2e as parallel jobs that keep every check`). Locked by TASK-1.50.
  - Those locks belong to the finished tasks' doit state. They don't block edits on this branch. This task
    edits the files on purpose, and they are listed in this spec. Approved in `qa.md` (Cross-story locked
    edits): only the expected all-deps audit string changes, unlocked under each owner (TASK-1.7, TASK-1.8,
    TASK-1.19, TASK-1.29, TASK-1.50) with reason "TASK-1.25 Q-1".
  - No test under `tests/toolchain/`, and no other `tests/ci/` file, mentions `audit` (grep).
- README: `README.md:58` (CI job table row for `Lint, typecheck, build and playtest`) and `README.md:109`
  ("Local equivalent" command). `npm run lint` runs `prettier --check .` (`package.json:20`). If the table
  cell changes width, Prettier re-pads every row of that table, so the README diff is about 8 lines.
- Existing code to reuse:
  - The existing assertions in `tests/ci/workflow.test.ts` and `tests/ci/ci-jobs.acceptance.test.ts`. Change
    the expected strings only. Add no new tests or helpers.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | All-deps audit level becomes `high`. The shipped step stays (A-1). | Merge steps; keep `critical` | This is what the task's AC asks for. The tolerance it replaced is gone. | yes | Q-1 |
| D-2 | Proceed even though picomatch was not patched (advisory withdrawn). | Wait for a real patched release | The gate's outcome is the same, and the tolerance has no reason left. The final summary records that the advisory was withdrawn, not patched. | yes | Q-1 |

## 5. Design

### Files to create / modify
- `.github/workflows/ci.yml` — line 102: `npm audit --audit-level=critical` → `npm audit --audit-level=high`
- `tests/ci/workflow.test.ts` — expected strings at lines 64 and 229 → `npm audit --audit-level=high`
- `tests/ci/ci-jobs.acceptance.test.ts` — expected string at line 151 → `npm audit --audit-level=high`
- `README.md` — line 58 all-deps phrase and line 109 local command; then run `npm run format`

### Components, interfaces and data
- No code or interface changes. The only change is to the CI step's command text.

### Rules and algorithms
- `npm audit --audit-level=high` exits non-zero when any installed package, dev or shipped, has an advisory
  of severity high or critical. Otherwise it exits 0.
- README line 58 wording after the change: "the two audits (shipped dependencies: no high or critical
  advisory, `npm audit --omit=dev --audit-level=high`; all dependencies: no high or critical advisory,
  `npm audit --audit-level=high`)".
- README line 109 after the change:
  `npm audit --omit=dev --audit-level=high && npm audit --audit-level=high && npm run lint && …` (rest
  unchanged).

### Error handling and configuration
- N/A. GitHub Actions fails the step on a non-zero exit, as it does today.

## 6. Behaviour specification

### SPEC-01: CI runs the all-dependency audit at high
- Verifies: AC#1
- Behaviour: Given `.github/workflows/ci.yml`, When the `checks` job's `run:` commands are read in order, Then
  they are exactly `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm audit --audit-level=high`,
  `npm run lint`, `npm run typecheck`, `npm run build`, `npm run playtest -- --hands 10000 --seed 42`, and no
  workflow line contains `--audit-level=critical`.
- Verification: acceptance `tests/ci/ci-jobs.acceptance.test.ts::ci.yml runs lint, coverage, two sweep shards, tooling and e2e as parallel jobs that keep every check`

### SPEC-02: Each audit gate is its own named step
- Verifies: AC#1
- Behaviour: Given the workflow, When it is read as text, Then it contains
  `- name: Audit shipped dependencies\n        run: npm audit --omit=dev --audit-level=high\n` and
  `- name: Audit all dependencies\n        run: npm audit --audit-level=high\n`.
- Verification: unit `tests/ci/workflow.test.ts::runs each audit gate as its own named step`

### SPEC-03: The tightened audit passes today
- Verifies: AC#1
- Behaviour: Given a clean `npm ci` of the branch, When `npm audit --omit=dev --audit-level=high && npm audit --audit-level=high` runs, Then it exits 0 and both audits print `found 0 vulnerabilities`.
- Verification: command `npm ci && npm audit --omit=dev --audit-level=high && npm audit --audit-level=high`

### SPEC-04: CI on GitHub passes the tightened step
- Verifies: AC#1
- Behaviour: Given the branch `doit/TASK-1.25` pushed to GitHub, When the `CI` workflow run for its head commit
  finishes, Then the step `Audit all dependencies` in job `Lint, typecheck, build and playtest` concluded
  `success`, and its log shows `npm audit --audit-level=high`.
- Verification: manual — `gh run view <run-id> --json jobs --jq '.jobs[] | select(.name=="Lint, typecheck, build and playtest") | .steps[] | select(.name=="Audit all dependencies") | .conclusion'` prints `success`; `gh run view <run-id> --log | grep -- "--audit-level=high"` shows both audit commands. The run ID is recorded in `doit/TASK-1.25/build-log.md`.

### SPEC-05: README matches CI
- Verifies: AC#1
- Behaviour: Given `README.md`, When searched, Then it does not contain `--audit-level=critical` or "all
  dependencies: no critical advisory". The CI table row and the "Local equivalent" command both show
  `npm audit --audit-level=high` for all dependencies, and `npm run lint` (Prettier check) passes.
- Verification: command `! grep -n -- "--audit-level=critical" README.md .github/workflows/ci.yml tests/ci/*.ts && grep -c -- "npm audit --audit-level=high" README.md && npm run lint`

## 7. Edge cases
- A new high advisory appears in a dev dependency before merge: SPEC-03/SPEC-04 fail. This is the intended
  behaviour of the gate. The builder reports it rather than adding an exception (exceptions are in Not doing).
- The withdrawn advisory is reinstated: CI fails at "Audit all dependencies". This is intended. Handling it
  would be a new follow-up, not this task.
- Other cases (input, concurrency, permissions): N/A. This is a static config change.

## 8. Security considerations
- The change only makes a gate stricter: high advisories in build tooling (which runs in CI with the repo
  checked out) now fail the build. No new dependencies, secrets, inputs or permissions. Workflow
  `permissions` and action pins are unchanged.

## 9. Non-functional
- CI time: unchanged (same command, different threshold; about 1 s).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm audit --omit=dev --audit-level=high && npm audit --audit-level=high` (local); end to end,
  push `doit/TASK-1.25` and `gh run watch`
- New tests: none. Changed expectations: `tests/ci/ci-jobs.acceptance.test.ts` (SPEC-01) and
  `tests/ci/workflow.test.ts` (SPEC-02). Fast loop: `npm run test:tooling`.
- End-to-end scenario for the Judge:
  1. Run `npm ci` and the two audits locally (SPEC-03).
  2. Run the SPEC-05 command.
  3. Check the GitHub run for the branch head with the SPEC-04 `gh run view` commands.

## 11. Open questions
- None. Q-1 answered (a): tighten the all-deps audit to `high` now; the final summary states that
  GHSA-fc5q-39xc-vjpf was withdrawn (2026-11-18), not patched. Recorded as D-1/D-2.

## 12. Clarifications log
See `doit/TASK-1.25/qa.md`.
