# Changes: TASK-2.14

- `src/table/session-record.ts` — `nextBotName` capped at `MAX_SESSION_COUNT` in `parseSessionRecord` (D-3, AC#7); doc comments.
- `src/ui/table/Table.tsx` — optional `onHome` on `TableViewProps`/`TableProps`; `Home` button before Leave table in a `.table-header-actions` group, rendered only when `onHome` is given (D-1, A-6).
- `src/ui/table/TableScreen.tsx` — `onHome` prop passed to `Table`.
- `src/ui/table/useTableSession.ts` — module-level write chain and exported `tableWritesSettled()` (A-2, D-4).
- `src/ui/App.tsx` — `goHome` for the Home control and Leave table; Home's read waits for `tableWritesSettled()`; `openTable` pushes a `{ tlhTable: key }` history entry; `popstate` on the Table pauses to Home (D-2).
- `src/ui/styles.css` — `.table-header-actions` group; `.table-home` shares the `.table-leave` rule.
- `e2e/support/paused-clock.ts` — exported `axeWithPausedClock` (copies of `useWorkerTimers`/`restorePausedTimers` from the locked `e2e/resume.spec.ts`).
- `tests/table/session-cap.acceptance.test.ts` — new: SPEC-08.
- `tests/ui/table-home.acceptance.test.tsx` — new: SPEC-01.
- `e2e/home-control.spec.ts` — new, every push: SPEC-02, SPEC-03, SPEC-04, SPEC-06, SPEC-05 (serial, one page per browser).
- `e2e/history.spec.ts` — new, every push: SPEC-07, SPEC-09.
- `docs/storage/sessions.md` — "Pause from the Table" section, `nextBotName` cap, Tests list.
- `docs/ui/navigation.md` — new: screens, the Home control, browser Back/Forward (D-2).

No new dependencies.
