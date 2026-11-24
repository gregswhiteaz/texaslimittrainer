# Changes — TASK-2.6

- `src/table/session-record.ts` — optional `endedAt` (parsed, never written), `MAX_SESSION_COUNT` cap on `handsPlayed`/`nextBotId`, `PausedSession`, `findPausedSession(values)`.
- `src/table/table-view.ts` — `limitsText(config)` extracted from `headerText` (output unchanged), `resumeSummary(record)`.
- `src/table/hand-record.ts` — `HandStore.pausedSession()` in the interface.
- `src/storage/hand-store.ts` — `pausedSession()`: one readonly `getAll` on `sessions`, then `findPausedSession`.
- `src/ui/home/HomeScreen.tsx` — optional `paused`/`onResume` props, the Resume session entry, `data-paused` on the nav.
- `src/ui/styles.css` — `.menu-secondary` (storyboard colours) sharing the menu button layout with `.menu-primary`.
- `src/ui/App.tsx` — reads the paused session while on Home (logs rejected records and read failures), Resume handler (restoreSession, A-5), resumed table screen.
- `src/ui/table/TableScreen.tsx` — optional `config` or `resume` passed to `Table`.
- `src/ui/table/useTableSession.ts` — `ResumedSession` and the `resume` option: initial table, session id and start time from it; no start record write.
- `tests/support/session-play.ts` — new: headless `checkOrCall`, `playHand`, `playSession` (no vitest imports).
- `tests/table/resume.acceptance.test.ts` — new: SPEC-01, SPEC-04, SPEC-07, SPEC-08, SPEC-09.
- `tests/storage/resume.acceptance.test.ts` — new: SPEC-02, SPEC-03, SPEC-05, SPEC-06.
- `tests/ui/home-resume.acceptance.test.tsx` — new: SPEC-10.
- `e2e/resume.spec.ts` — new, every push: SPEC-11, SPEC-12, SPEC-13 (Chromium and WebKit, axe).
- `e2e/support/hand-records.ts` — `seedStoredSessions(records)`.
- `e2e/support/records-harness.tsx` — the wrapped store forwards `pausedSession`.
- `docs/storage/sessions.md` — `endedAt`, the counter cap, the paused-session rule and the Resume flow.

No new dependencies.
