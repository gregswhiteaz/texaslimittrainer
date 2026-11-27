# Build log: TASK-7.45

## BUILD
- SPEC-02: replaced the REQ-035.6 line and appended changelog row 1.18 in `dreams/limit-holdem-trainer/requirements.md` with the exact §5 text (diff: 1 line changed, 1 added).
- SPEC-01: `backlog decision create "Observed-opponent ranges: ... (TASK-7.45 Q-1)" -s accepted --plain` → decision-8.
- SPEC-04: `backlog task create ... -p TASK-7 -l dream-limit-holdem-trainer,follow-up -m m-1 --priority Medium --type enhancement --ref <spec> --ref requirements.md --doc doc-104 -d <§5 description> --ac x7 --dep TASK-7.45 --plain` → TASK-7.48.
- SPEC-03: `backlog task edit TASK-7.45 --append-notes` with Q-1 D, key numbers, cap thresholds, pointer to spec §3 and TASK-7.48.
- Not done (orchestrator): AC#1 tick, Done status.
- No product code; no tests added (spec §10).
- Ran `npm run format` (no changes) and `doit.py gate TASK-7.45`: PASS (test, lint, typecheck ok; scope warn 3 diff lines = 1 changed + 1 added, as budgeted).

## FIX r1
- Item 1 [BLOCKER] locked-repin-list-incomplete: fixed via `backlog task edit TASK-7.48 -d ... --acceptance-criteria x7` (all 7 ACs re-sent in order, numbering kept). Description now lists small-table-ranges.acceptance AC#1 (owner TASK-7.35; line 153, 60 -> 100 capped) and review-numbers.acceptance tests at lines 227/269 (owner TASK-9.3; 34.3% -> 34.4%/33.7%) as locked re-pins; adds observed-ranges.test.ts 'caps the observed hands at 100' (line 230, 35 -> 23.76) to the unlocked list; states 6max-turn-bb-call-a6s is no longer clear-cut (margin 12.7 < 15) and must be re-tuned with sign-off (AC#6); notes e2e/observed-resume.spec.ts unchecked. AC#5 now names each locked file and owner instead of "task notes". Locked spec sections 3/5 not edited (orchestrator note: recorded deviation; the task description says it is the complete list). No product code.
