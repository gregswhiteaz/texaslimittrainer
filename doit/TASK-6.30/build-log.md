# Build log: TASK-6.30

## BUILD
- SPEC-02: replaced the REQ-028 fit criterion (line 528) and appended changelog row 1.19 in `dreams/limit-holdem-trainer/requirements.md` with the exact §5 text (diff: 1 line changed, 1 added).
- SPEC-01: `backlog decision create "Style check: judge the one-action rule only on mixed spots seen at least 10 times; rarer spots listed as not judged (TASK-6.30 Q-1)" -s accepted --plain` → decision-9.
- SPEC-04: `backlog task create "Judge the one-action style check only on mixed spots seen at least 10 times" -p TASK-6 -l dream-limit-holdem-trainer,follow-up -m m-1 --priority Low --ref <spec> --ref dreams/limit-holdem-trainer/requirements.md -d <§5 description> --ac x6 --dep TASK-6.30 --plain` → TASK-6.31 (spec path passed from a scratchpad file because of the protected-path hook).
- SPEC-03: `backlog task edit TASK-6.30 --append-notes` with Q-1 B (N = 10), key numbers (3-seat limpers 1/0, 5.6% at n = 10, fit-criterion minimum 13, N = 10 excludes only 3-seat limpers), pointer to spec §3 and TASK-6.31.
- Not done (orchestrator): AC#1 tick, Done status.
- No product code; no tests added (spec §10).
- Ran `npm run format` (no changes) and `doit.py gate TASK-6.30`: PASS (test, lint, typecheck ok; scope warn 3 diff lines = 1 changed + 1 added, as budgeted).

## FIX (review r1)
- Item 1 [MAJOR] check-styles.acceptance co-owner TASK-6.25 missing: fixed via `backlog task edit TASK-6.31 -d ... --acceptance-criteria x6` (description and AC#4 now say owners TASK-6.11 and TASK-6.25, unlock under both; AC numbering kept 1-6). Per orchestrator note, also added to the TASK-6.31 description that the comments in tests/playtest/check-styles-three-seats.acceptance.test.ts:9 and docs/advice/range-model.md:294 should cite the REQ-028 fit criterion, not REQ-027.5. Appended TASK-6.30 notes (`--append-notes`): co-owner correction and fit-criterion smallest spot raise-and-calls 13 / 12 / 16 at seeds 42 / 7 / 1234 under N = 10.
- Deviation: spec sections 3 and 5 still name only TASK-6.11 as owner (spec is locked; not edited). The backlog records are the corrected source.
- No product code changed.
