## BUILD (2026-11-27)
- SPEC-02: edited `dreams/limit-holdem-trainer/requirements.md` with the exact §5 text for REQ-019.5 and REQ-019.8 and added changelog row 1.17 (2026-11-27). `git diff main -- dreams/limit-holdem-trainer/requirements.md` → 2 lines changed, 1 added.
- SPEC-01: `backlog decision create "User's hand follows the automatic show/muck rule; no Show/Muck control; uncalled winners never show (TASK-3.24 Q-1)" -s accepted --plain` → decision-6; `backlog decision list --plain` shows it accepted.
- SPEC-03: `backlog task edit TASK-3.24 --append-notes` with the Q-1 answer and key facts (passed via a scratchpad file, deleted afterwards). `git diff --stat main -- src tests e2e tools docs` → empty. No follow-up story created. AC#1 not ticked (orchestrator, SPEC-04).
- `npm run format`, `npm run lint` (clean), `npm run typecheck` (clean).
- `python3 /Users/gregwhite/.claude/skills/doit/scripts/doit.py gate TASK-3.24` → PASS (test, lint, typecheck ok; 5 lines, 1 file).
