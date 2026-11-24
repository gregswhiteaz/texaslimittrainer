# TASK-2.7 changes

## Created
- `src/ui/config/EndSessionDialog.tsx` — the modal `End your paused session?` dialog (summary, report line, Cancel focused, `End session and start`; buttons disabled and Escape ignored while ending).
- `tests/storage/end-paused.acceptance.test.ts` — SPEC-04, SPEC-05, SPEC-06 (`endPausedSessions` against `fake-indexeddb`).
- `tests/ui/end-session-dialog.acceptance.test.tsx` — SPEC-07 (dialog markup only with a prompt).
- `e2e/new-game-confirm.spec.ts` — SPEC-01, SPEC-02, SPEC-03, SPEC-08, SPEC-09, SPEC-10.

## Modified
- `src/storage/hand-store.ts` — `endPausedSessions(sessionId, endedAt)`: ends the confirmed session with the existing `ended(...)` transaction, then every other valid unended session at its own `updatedAt`, collecting their failures in `rejected`.
- `src/table/session-report.ts` — `PausedSessionsEnd` type and `endPausedSessions` on `SessionEnder`.
- `src/table/session-record.ts` — export the existing `isEnded` (no behaviour change).
- `src/ui/config/GameConfigScreen.tsx` — optional `endPrompt` prop renders the dialog after the config actions; Start game ref so closing the dialog returns focus to it (WebKit does not focus clicked buttons).
- `src/ui/App.tsx` — `startGame` (click-time paused read with request token), `confirmEnd`, `cancelEnd`, `endPrompt` state; config Cancel / ← Home bumps the token and clears the prompt.
- `src/ui/styles.css` — `.end-session-*` added to the bust dialog selectors, plus summary weight and disabled buttons.
- `docs/ui/navigation.md` — Game Config row and the Start-game dialog section, tests.
- `docs/storage/sessions.md` — Start game with a paused session, `endedAt` writers, tests.
- `docs/storage/reports.md` — `endPausedSessions` rules, tests.

## Work-folder files
- `doit/TASK-2.7/blocked.json` — locked `e2e/next-hand.spec.ts` (TASK-3.4) needs an edit (D-5 missed it).

No new dependencies.
- `e2e/next-hand.spec.ts` — second page in its own browser context (TASK-3.4 locked; unlocked for TASK-2.7 block 1; orchestrator edit; no assertion change)
