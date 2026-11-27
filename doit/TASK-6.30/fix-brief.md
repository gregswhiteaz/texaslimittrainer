# Fix brief — TASK-6.30 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] backlog/tasks/task-6.31:check-styles-acceptance-co-owner-task-6.25-missing (code review)
- Where: backlog/tasks/task-6.31 - Judge-the-one-action-style-check-only-on-mixed-spots-seen-at-least-10-times.md:1
- Problem: TASK-6.31's locked re-pin list names only TASK-6.11 as owner of tests/playtest/check-styles.acceptance.test.ts, but the file is locked by two tasks: TASK-6.11 (sha 51a788b3...) and TASK-6.25 (sha 29c7ffab..., which is the file's current sha). Locks are per task (SKILL.md: unlock under the owning task so test-integrity <OWNER-ID> stays clean), so re-pinning mixedSpots(300) after unlocking only under TASK-6.11 leaves `doit.py test-integrity TASK-6.25` reporting a modified locked test. The same omission is in spec.md section 3 'What the change touches' and section 5 follow-up description / AC#4.
- Evidence: Scratch copy of HEAD with the N = 10 rule applied (outside the repo, since removed): vitest (excluding tests/ci, tests/git, tests/toolchain) gave 2 failures: tests/playtest/check-styles.acceptance.test.ts mixedSpots(300) never-mixing case (locked, TASK-6.11 + TASK-6.25) and tests/playtest/style-check.test.ts:268 (unlocked, listed). Slow 'original hand counts' twins in check-styles.acceptance passed; 100k Mixed 6-max seeds 7 and 1234 passed (raise-and-calls 12 and 16, still judged). check-styles-three-seats does not assert the exit code today, so it does not break; restoring exit 0 is a strengthen edit (listed, owner TASK-7.46). cli.test.ts breaks only when the usage text changes (listed, unlocked). `python3 -c` over doit/*/state.json locked_tests shows check-styles.acceptance.test.ts under TASK-6.11 and TASK-6.25; `shasum -a 256` of the file equals TASK-6.25's recorded sha.
- Expected fix: Orchestrator: `backlog task edit TASK-6.31` to change the description's 'owner TASK-6.11' for check-styles.acceptance.test.ts to 'owners TASK-6.11 and TASK-6.25 (unlock under both)' and the same in AC#4 (edit the AC text via the CLI); add a matching line to TASK-6.30's implementation notes. Optionally correct spec section 3/5 wording for the record.


## Orchestrator note
Backlog CLI edits only (don't edit the locked spec; record the deviation in build-log.md):
- TASK-6.31: description and AC#4 must name both lock owners of tests/playtest/check-styles.acceptance.test.ts — TASK-6.11 and TASK-6.25 ("unlock under both"). Keep AC numbering (use --acceptance-criteria with the full list in order).
- TASK-6.31: add to its description that the comments in tests/playtest/check-styles-three-seats.acceptance.test.ts:9 and docs/advice/range-model.md:294 should cite the REQ-028 fit criterion, not REQ-027.5.
- TASK-6.30 notes: add the fit-criterion smallest-spot counts on all three CI seeds (raise-and-calls 13 / 12 / 16 decisions at seeds 42 / 7 / 1234 under N = 10) and the co-owner correction.
