# TASK-8.6 changes

## Source
- `src/table/session-record.ts` — `SessionRecordObserved` type and optional `SessionRecord.observed` (D-1); `sessionRecord(table, meta, counts?)` and `handWrite(table, meta, decisions?, counts?)` write `observed` only when counts are given (D-3), for seated bots with ≥1 hand in ascending seat order; `parseSessionRecord` validates a present `observed` (array, entries, botId of a bot seat and unique, hands 1..handsPlayed, vpipHands 0..hands, pfrHands 0..vpipHands); new `restoreObserved(record)` (A-5).
- `src/ui/table/useTableSession.ts` — `ResumedSession.observed?`; the observed ref starts from it; counts computed before the hand write and passed to `handWrite` (A-6); doc comment updated.
- `src/ui/App.tsx` — `resume` passes `observed: restoreObserved(record)` inside the existing try/catch.
- `src/table/session.ts` — `ObservedCounts` doc comment: now persisted in the session record (no code change).

## Tests
- `tests/table/observed-resume.acceptance.test.ts` (new) — SPEC-01, SPEC-02.
- `tests/table/observed-record.acceptance.test.ts` (new) — SPEC-04.
- `tests/table/observed-record.test.ts` (new) — SPEC-06, SPEC-07.
- `e2e/observed-resume.spec.ts` (new, every push, Chromium + WebKit) — SPEC-03, SPEC-05, SPEC-08.
- `tests/table/observed-snapshot.test.ts` — renamed "restored session starts with an empty snapshot" to "a record written without counts restores an empty snapshot" and fixed its Q-3 comment; assertions unchanged (not locked).

## Docs
- `docs/storage/sessions.md` — `observed` field row, "Observed counts" section, validation bullet, Resume note, DB version 5 (was stale "4"), Upgrades note (no version bump), tests list.
- `docs/ui/hint.md` — Observed stats snapshot paragraph: counts are saved with each hand and restored on Resume.

No new dependencies.
- `src/table/session-record.ts` — review r1 MINOR: dropped the redundant hole check in observedField (object() rejects undefined with the same message) (orchestrator)
