# TASK-1.36: Tune Dependabot so its PRs match the runtime and peer pins

Status: Done (AC#3 ticked; AC#1/#2 proven live later via TASK-1.34 AC#4/#5) · Completed: 2026-11-19 · Epic: TASK-1 · Milestone: m-0 · Requirements: n/a · Branch: doit/TASK-1.36

## What was asked
Dependabot's first npm run (2026-11-19, run 44461332976) proposed `@types/node` 22 -> 26 although the app runs on Node 22, and its `typescript` 6.0.3 -> 7.0.2 update failed with "Error while updating peer dependency", because every published `typescript-eslint` (latest 8.73.0) declares peer `typescript: ">=4.8.4 <6.1.0"`.
- AC#1: no `@types/node` major PRs.
- AC#2: `typescript` and `typescript-eslint` move together, and no failing peer-dependency job.
- AC#3: the config is pinned by an acceptance test.

Spec: doit/TASK-1.36/spec.md. This revisits TASK-1.24 assumption A-3 (no ignore rules).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `typescript` semver-major updates are ignored as well as grouped | yes | No typescript-eslint release supports TS 7, so a major PR can only fail or break lint | Delete the `typescript` ignore item |
| A-2 | `typescript` minor/patch are not ignored; they arrive in the `typescript` group PR and CI decides mergeability | yes | Keeps patch fixes flowing | Add `version-update:semver-minor` to the typescript ignore |
| A-3 | The group lists only the direct deps `typescript` and `typescript-eslint` (`@typescript-eslint/*` are transitive) | yes | Smallest correct pattern list | Add `'@typescript-eslint/*'` |
| A-4 | Both packages are removed from `npm-minor-patch` via `exclude-patterns`, not by group order | yes | Dependabot's multi-group assignment can't be pinned by test | Reorder groups and drop `exclude-patterns` |
| A-5 | README gets one added sentence, no other doc changes | yes | README documents the Dependabot schedule and must stay accurate | Remove the sentence |

## Clarifications and decisions
- Q-1: how to add AC#3 assertions to TASK-1.24's locked `tests/ci/dependabot.acceptance.test.ts`? Answer (a): append one new `it(...)`, every existing line unchanged. Recorded as an approved cross-story locked-test edit (`doit.py unlock TASK-1.24`).
- Q-2 (after judge round 1): how to close with live-only ACs? Answer: tick AC#3, mark Done with AC#1/#2 unticked and a note. Live proof moves to TASK-1.34 AC#4/#5.
- D-1: add semver-major `ignore` for `@types/node` and `typescript`.
- D-2: AC#3 assertions are appended to the existing test file rather than a new file (Q-1).
- Deliberately not done: no `cooldown` key. The ETARGET in the log came from Dependabot's built-in 3-day npm cooldown. `typescript-eslint@8.73.0` was published 2026-11-16T17:07Z, after the cutoff. That clears on its own before the next Monday run, and `cooldown` can't switch it off anyway.

## What was built
Config-only change, no dependency changes. In `.github/dependabot.yml` the npm entry's tail is now exactly:
```yaml
    groups:
      npm-minor-patch:
        update-types: [minor, patch]
        exclude-patterns: [typescript, typescript-eslint]
      typescript:
        patterns: [typescript, typescript-eslint]
    ignore:
      - dependency-name: '@types/node'
        update-types: ['version-update:semver-major']
      - dependency-name: typescript
        update-types: ['version-update:semver-major']
```
- `.github/dependabot.yml` -> the block above. The github-actions entry is untouched.
- `tests/ci/dependabot.acceptance.test.ts` -> one appended `it` (17 added lines, 0 removed) covering the ignore, the group, the exclusion, and no `ignore` on the github-actions entry.
- `README.md` -> one sentence in `### Dependency updates` about the `typescript` group and the ignored majors.

Resulting behaviour:
- `@types/node` minor/patch go in `npm-minor-patch`; the 26.x major is ignored.
- `typescript` 6.x and every `typescript-eslint` update go in the `typescript` PR; TS 7 is ignored.
- All other packages behave as before.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | `@types/node` majors ignored | acceptance test (new `it`) | PASS | Judge parsed the YAML, and mutations of the rule fail the test |
| SPEC-02 | one `typescript` group, with `exclude-patterns` | same test | PASS | Judge's simulated routing: TS and typescript-eslint updates land only in the `typescript` group |
| SPEC-03 | `typescript` majors ignored, existing test unchanged | same test | PASS | Existing `declares weekly github-actions and npm updates` passes, 0 lines removed |
| SPEC-04 | next live npm run succeeds | manual, after push | DEFERRED | Needs the config on `main` and a live run; tracked by TASK-1.34 AC#4/#5 |
| SPEC-05 | README states the rules | `grep -n -A8 "### Dependency updates" README.md` | PASS | README lines 60-62 |

- `npm test`: 87 files, 319 passed, 3 skipped. `npm run lint` and `npm run typecheck` are clean (Prettier clean). Build gate run 1 passed.
- Judge round 1: verdict FAIL only because SPEC-04 can't be verified before the push, so AC#1/#2 were unproven. There were no blocking findings. Resolved by the user's Q-2 decision: close with AC#3 ticked and move the live proof to TASK-1.34 AC#4/#5.
- Test integrity for TASK-1.36 is clean. The TASK-1.24 integrity check warns that `tests/table/session.test.ts` assertions dropped 21 -> 15. That comes from TASK-1.26's approved removal of TASK-3.1's import-scan test, not from this task.

## Review
Round 1 had no BLOCKER or MAJOR findings (code and security reviewers).

### Non-blocking review notes (deliberately not fixed)
- Code MINOR (`tests/ci/dependabot.acceptance.test.ts:50`): the new `it` uses `toContain` on fragments. An extra key later added to the npm tail would still pass, for example an `update-types` on the `typescript` group or a third ignore rule. Suggested fix: compare the whole tail from `    groups:` to the exact §5 block.
- Security MINOR (`.github/dependabot.yml:26`): ignore rules also suppress Dependabot security PRs, so an advisory fixed only in a new major of `@types/node` or `typescript` would get no PR. There is no runtime reach (both are devDependencies), minor/patch fixes still flow, and CI's `npm audit --audit-level=critical` is a backstop.

## How to try it
- `npm test -- tests/ci/dependabot.acceptance.test.ts`
- `npm run lint && npm run typecheck`
- After the push, check the next Dependabot run: `gh run list --workflow "Dependabot Updates" --limit 4`, then `gh run view <id> --log | grep -E "ETARGET|peer dependency|Handled error"` (expect no match), and `gh pr list --author app/dependabot`.

## Run metrics
Questions asked: 2 (Q-1 in spec, Q-2 after judge) · assumptions logged: 5 · review rounds: 1 · judge rounds: 1 · gate runs: 1 · escalations: 0 · changed lines: 28 (3 files).

## Known limitations and follow-ups
- SPEC-04 (live Dependabot run) is unproven until the config is on `main`. Owned by TASK-1.34 AC#4/#5, which on success also tick TASK-1.36 AC#1/#2.
- The major-version ignores are an interim workaround and need a removal trigger. Revisit them when typescript-eslint supports the next TypeScript major, or when the project leaves Node 22. Suggested owner: TASK-1.34, or a new task (the major-only security suppression above is why this matters).
- Tighten the appended test in `tests/ci/dependabot.acceptance.test.ts` to compare the whole npm `groups:`/`ignore:` tail to the exact §5 block. This is a locked TASK-1.24 file, so it needs another approved edit.

## Lessons for the factory (proposals — not applied)
- The judge returns FAIL whenever a spec item is manual-after-push, so every config-only story with a live-only AC will pay an extra round plus a user question (Q-2). Proposal: when a spec marks an item as "deferred, tracked by <task>", the spec stage should state up front which ACs close with it and which move to the tracker task's ACs, so the Q-2 decision is made at spec approval.
- Config-text tests drift towards fragment assertions. Proposal: the spec template could say "when a section is described as exactly X, the test pins it exactly".
