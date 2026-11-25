# TASK-2.20 changes

- `src/ui/App.tsx` — the Table history key is 32 hex characters from 16 `crypto.getRandomValues` bytes (D-2, replaces `performance.timeOrigin` + counter); module-level `lastTableKey` set in `openTable`; popstate while no Table is shown steps back off this load's last Table entry once (D-3).
- `e2e/support/hold-writes.ts` — new test-only init script `holdSessionsWrite` (holds the first armed `sessions`-only readwrite transaction open with a `count()` chain) plus `armSessionsHold`, `sessionsHoldState`, `releaseSessionsHold`. Imports nothing from `src/`.
- `e2e/pause-history.spec.ts` — new acceptance spec: SPEC-01, SPEC-02 (Home / browser Back wait for a held write), SPEC-04 (random key differs across loads under the paused clock), SPEC-06 (Back, Forward, one Back leaves the app), SPEC-07 (reload + Resume + Back on the real clock).
- `e2e/history.spec.ts` — locked (TASK-2.14), unlocked for case (5) only: drops `{ pausedClock: false }` and the timeOrigin comment so it runs under the paused clock (SPEC-05). No assertion removed or loosened.
- `docs/ui/navigation.md` — Back/Forward section: random key, Forward step-off, revised example, reload note, Home waits for table writes, test list adds `e2e/pause-history.spec.ts`.

No new dependencies.
