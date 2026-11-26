# TASK-6.20 changes

- `dreams/limit-holdem-trainer/requirements.md` — added clause REQ-029.3 (bot decisions use only the current hand) and change-log row 1.12 (SPEC-02).
- `src/engine/player-view.ts` — doc comment on `PlayerView.earlierShowdowns`: bot decisions must not depend on it (REQ-029.3); advice and grader may use it.
- `tests/bots/no-session-memory.acceptance.test.ts` — new guard test `bot actions ignore earlier showdowns` (SPEC-03).
- `doit/TASK-6.20/changes.md`, `doit/TASK-6.20/build-log.md` — work-folder records.

No new dependencies.
