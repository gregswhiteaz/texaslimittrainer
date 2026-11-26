# TASK-2.22 changes

- `src/ui/App.tsx` — `openTable` replaces the current history entry (`replaceState`) when it already carries a `tlhTable` string key, otherwise pushes as before (D-1); comment naming TASK-2.22 D-1.
- `e2e/reload-history.spec.ts` — new every-push acceptance spec (SPEC-01..03): after a reload on the Table, Resume + Home, Resume + Back, and a new game via `End session and start` + Home each leave the app with one Back, no reload.
- `docs/ui/navigation.md` — "Browser Back and Forward": replace rule, corrected reload behaviour (no reload when stepping back from an earlier load's entry; two Backs remain without reopening the Table), new reload example, Tests list entry (D-2, SPEC-05).

No new dependencies.
- `src/ui/App.tsx` — CI fix after review r1 (branch run 45803095640, WebKit players-choice timeout): replace only when the current Table entry is an earlier page load's (key ≠ lastTableKey). This load's own entry can still be current while closeTable's history.back() is pending; replacing it then let that Back pop the new Table entry. Orchestrator edit; recorded deviation from D-1/A-1 (see fix-brief.md).
- `docs/ui/navigation.md` — review r2 MINOR: say only an earlier load's Table entry is replaced (orchestrator)
