---
id: doc-6
title: 'TASK-1.7: Run every check in GitHub Actions on each push and pull request'
type: other
created_date: '2026-11-18T02:33:00Z'
updated_date: '2026-11-18T02:33:00Z'
---
# TASK-1.7: Run every check in GitHub Actions on each push and pull request

Status: Done · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-064.1, REQ-064.2, REQ-064.4, TASK-1.1 Q-3 (audit rule) · Branch: doit/TASK-1.7

## What was asked
Run the project's checks (lint, typecheck, build, unit tests, Playwright + axe e2e in Chromium and WebKit) in GitHub Actions on every push and pull request, on a pinned Node version. A failing check must fail the run. AC#5 was added during the run (Q-3): CI also runs the two `npm audit` gates from TASK-1.1. Spec: doit/TASK-1.7/spec.md.

## Assumptions made without asking — please review
All are reversible. Full rationale and alternatives are in spec.md section 2.

| ID | Assumption | Why | To reverse |
|---|---|---|---|
| A-1 | `.nvmrc` = `22.18.0` (exact); `engines.node` stays `>=22.12.0` | Matches local Node | Edit `.nvmrc` (and the test's expected value) |
| A-2 | One job, one runner, sequential steps | Metered minutes; avoids repeating `npm ci` | Split into parallel jobs |
| A-3 | Order: install, audits, Lint, Typecheck, Build, Test, Playwright setup, E2E (Build before Test, differs from AC#1's listed order) | `build.test.ts` runs the build itself, so a build break would first show as a Test failure | Reorder steps and the test |
| A-4 | Runner pinned to `ubuntu-24.04` | Reproducible; Playwright 1.65 supports WebKit there | `ubuntu-latest` |
| A-5 | Actions pinned to full SHAs (checkout v7.0.1, setup-node v7.1.0, cache v6.1.0, upload-artifact v7.0.2) | Supply-chain hardening | Use major tags |
| A-6 | `concurrency` group per event + ref, cancel-in-progress on every ref including `main` | Saves minutes; event name keeps push and PR runs from cancelling each other | Exempt `main` or drop |
| A-7 | Playwright browsers cached (`~/.cache/ms-playwright`, keyed by Playwright version); system deps always installed | Skips a ~250 MB download | Remove the cache steps |
| A-8 | `playwright-report/` uploaded as artifact only when E2E fails, 7-day retention | Diagnose failures cheaply | Drop the upload |
| A-9 | `timeout-minutes: 20`, `permissions: contents: read` | Caps runaway minutes; least privilege | Change values |
| A-10 | Workflow test asserts on the YAML text; no YAML-parser dependency | No new dependency without approval | Add `yaml` devDependency |
| A-11 | No `paths-ignore`; doc-only pushes also run CI | AC#1 says any push; keeps "CI green on the branch" checkable | Add `paths-ignore` |
| A-12 | Workflow `CI`, job `checks`; step names fixed (`Audit shipped dependencies`, `Audit all dependencies`, `Lint`, `Typecheck`, `Build`, `Test`, `E2E`) | Proof commands select steps by name | Rename with the test |
| A-13 | Two separate audit steps right after `npm ci`, before Lint | Step name says which rule failed; fails fast. Downside: later checks do not report while an advisory is open | Move audits to the end |
| A-14 | Two audit proof branches: `audit-shipped` (lodash 4.17.20, high) and `audit-all` (devDependency minimist 1.2.5, critical) | Sequential steps mean one branch can only show the first gate failing | One branch |
| A-15 | (orchestrator, judge round 1) The cancelled PR run was an environmental apt stall: re-run it with no code change instead of sending it back to the builder | Same step took 34 s on the push run of the same commit | Harden the step (see follow-ups) |
| SPEC-09 counter correction | `item_failures` for SPEC-09 reset from 4 to 1 | Repeated verdict calls for round 1 each incremented the counter; there was one real failure | n/a (bookkeeping) |

## Clarifications and decisions
- **Q-1 (D-1) Proof of real runs:** one push of 8 branches. The builder prepares `doit/TASK-1.7` plus throwaway `ci-proof/TASK-1.7/*` branches, each breaking exactly one check and rehearsed locally. The user runs one `git push`, and a later `git push origin --delete` removes them. No failure-injection switch in the workflow.
- **Q-2:** Claude opens a draft PR from `doit/TASK-1.7` to `main` to prove the `pull_request` trigger (PR #1).
- **Q-3 (D-2) Audit rule in CI:** the user chose to add it to this story. New AC#5: CI runs `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical`, and either one failing at its level fails the workflow. An extra proof branch was required, so there are two (A-14).
- **GitHub registration problem:** after the user's push, GitHub started no runs for the new workflow. They began only after the workflow file was committed to `main` as `ee5e68f`, with user approval. Empty re-trigger commits were then added to each proof branch (empty, 0 files, confirmed by the judge). This is why the proof branches are cut from the build commit `391a841` and not the branch tip (J-1-02).

## What was built
One workflow plus a pin, a static test and docs. 190 changed lines in 4 paths, within the budget (4 files, 300 lines). No product code, existing tests, scripts or config were touched, and there are no new dependencies.
- `.github/workflows/ci.yml` (new): triggers on every push and pull request (no filters). Read-only token, 20-minute timeout, concurrency group. Steps: checkout, Node from `.nvmrc` with npm cache, `npm ci`, the two audit gates, Lint, Typecheck, Build, Test, Playwright browser cache and install (Chromium + WebKit), E2E, and report upload when E2E fails. A failure stops the job, with no `continue-on-error` or `|| true`.
- `.nvmrc` (new): `22.18.0`.
- `tests/ci/workflow.test.ts` (new): 8 static tests of the workflow text and the Node pin (triggers, step order, browsers, no ignored failures, Node pin, SHA pins, permissions/timeout/names, audit steps).
- `README.md` (modified): Setup line names the Node version, plus a "Continuous integration" section.

## How it was verified
Local: `npm test` 9 files, 23 tests passed (8 new), lint, typecheck, build, e2e 10 passed (Chromium + WebKit), both audits exit 0 (gate build-1 PASS). Judge also ran 24 holdout mutations against the static tests; all were caught and the unmutated control passed.

Real GitHub runs (base URL `https://github.com/gregswhiteaz/texaslimittrainer/actions/runs/<id>`):

| SPEC | Covers | Run ID | Result |
|---|---|---|---|
| 01-07, 21 | AC#1, 4, 5 (workflow shape) | static tests | pass |
| 08 | green push run on `doit/TASK-1.7` | 44220396247 | success, all 7 check steps green, 4m13s |
| 09 | `pull_request` run for draft PR #1 (draft, base main) | 44220403675 | attempt 1 cancelled (timeout); attempt 2 success, E2E 10 passed |
| 10 | lint proof | 44220395401 | fails at Lint (`no-debugger`) |
| 11 | typecheck proof | 44220396630 | fails at Typecheck (TS2322) |
| 12 | build proof | 44220395299 | fails at Build |
| 13 | test proof | 44220396647 | fails at Test |
| 14 | e2e Chromium proof | 44220396921 | fails at E2E, only `[chromium]` failed, `image-alt (critical)` |
| 15 | e2e WebKit proof | 44220395878 | fails at E2E, only `[webkit]` failed |
| 17 | report artifact | runs above | `playwright-report` on e2e failures, none on the green run |
| 22 | audit-shipped proof | 44220396018 | fails at Audit shipped dependencies (lodash, high) |
| 23 | audit-all proof | 44220396132 | fails at Audit all dependencies (minimist, critical; shipped audit passed) |
| 16, 18, 19, 20, 24 | proof diffs, local suite, 4-path diff, no src/e2e change, local audits | local commands | pass |

Judge rounds:
- Round 1 FAIL (22/23): SPEC-09 only. The PR run was cancelled at the 20-minute job timeout because apt downloads stalled for about 19 minutes in "Install Playwright system dependencies". The same step took 34 s on the push run of the same commit, so this was environmental. Fix: `gh run rerun 44220403675` with no code change.
- Round 2 PASS (23/23): the re-run (attempt 2, head 58a5e55) succeeded with every step green, and the other items were carried forward unchanged. All 5 ACs and 12 DoD items proven. Integrity check clean: `ci.yml` is byte-identical to the spec and to the copy on `main`.

## Review
Round 1 was clean: no BLOCKER or MAJOR findings from either reviewer. The orchestrator verified the four action SHAs against their tags, which closes the security NIT.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): the SPEC-04 `if:` scan (test line 53) misses a step written with `- if:` as its first key.
- MINOR (code): the SPEC-01 test accepts an extra trigger added after `pull_request:` (for example `workflow_dispatch`).
- NIT (code): browser install order before `npm run e2e` is not asserted.
- MINOR (security): `actions/checkout` keeps `persist-credentials: true`. The token is read-only and nothing pushes, so the gain from `persist-credentials: false` is defence in depth only.
- NIT (security): action SHA-to-tag match could not be checked offline. It was verified afterwards by the orchestrator.
- LOW (judge) J-1-02: proof branches were cut from build commit 391a841, so `git diff` against the tip also lists doit/ and backlog/ metadata. Product diffs are exactly the listed files.
- LOW (judge) J-1-03: changes.md lacks run URLs and the green-run duration (the run table above records them). Spec wording said a timeout gives `failure`, but GitHub reports `cancelled`.
- LOW (judge) J-2-01: a recurring apt mirror stall would burn the full 20 minutes before failing.

## How to try it
- Locally mirror CI: `npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e`
- Static test only: `npx vitest run tests/ci`
- On GitHub: push any branch or open a PR, then `gh run list -R gregswhiteaz/texaslimittrainer`.

## Run metrics
Questions asked: 3 · assumptions logged: 14 in the spec plus A-15 · review rounds: 1 · judge rounds: 2 · gate runs: 1 · escalations: 0 (the judge flagged SPEC-09 for escalation after round 1 and the orchestrator resolved it with a re-run) · send-backs: 0 · changed lines: 190 across 4 files.

## Known limitations and follow-ups
Noted only; none created.
- The user should delete the 8 remote proof branches (`git push origin --delete ci-proof/TASK-1.7/...`; command in changes.md) and the local ones.
- Draft PR #1 should be closed or merged when the branch is merged.
- Branch protection / required checks on `main` is not set (out of scope, repo setting).
- Dependabot (or similar) for action SHA pins is not set up.
- Consider a step-level timeout and retry on the Playwright system-dependency install (J-2-01).
- The MINOR/NIT hardening of the static test listed above.

## Lessons for the factory (proposals — not applied)
- GitHub does not register a workflow's triggers until the file exists on the default branch, so the proof-by-push flow stalled and needed a manual commit to `main`. The spec's proof procedure should say up front that the workflow file must first land on `main` (with user approval).
- The `doit` verdict command should be idempotent per round. Repeated invocations for round 1 incremented the SPEC-09 counter 4 times for one real failure and needed a manual correction.
- Proof branches should be cut from the final branch tip, or the spec should say metadata differences are expected. Otherwise SPEC-16 diffs list doit/ and backlog/ files.
- The spec should record run URLs and duration in changes.md as the Builder or Judge step, since §9 asked for them and they were missing.
- The spec text should say a job timeout concludes `cancelled`, not `failure`.
