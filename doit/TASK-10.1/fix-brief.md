# Fix brief — TASK-10.1 (review round 2)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] src/ui/App.tsx:ending-guard-never-reset-hangs-second-leave (code review)
- Where: src/ui/App.tsx:70
- Problem: The StrictMode guard endingId keys on the session id and is never cleared. If endSession rejects (for example an IndexedDB failure), the app goes Home and the session is still stored without endedAt, so Home offers Resume. Resume reuses the same record.sessionId. Leave table then sets {name:'ending', sessionId} with that same id, the effect sees endingId.current === leaving and returns early, and the app stays on the blank aria-busy ending screen with no way out. The round-1 code called endSession on every Leave, so this hang is a regression.
- Evidence: hand-store.ts ended(): an abort or error rejects and changes nothing, so the session stays resumable. App.resume() passes sessionId: record.sessionId. App.tsx:70 is `if (leaving === null || endingId.current === leaving) return;` and nothing resets endingId.
- Expected fix: Key the guard on the ending screen object rather than the id: `const ending = screen.name === 'ending' ? screen : null`, store that object in the ref, and use [ending] as the dependency. StrictMode's re-run sees the same object, while each Leave creates a new one. A simpler option is to set endingId.current = null in both settle handlers. Add a unit or e2e case: make endSession fail once, Resume, Leave again, and expect the report or Home.


Use the reviewer's preferred fix (key the guard on the ending screen object, dependency [ending]) and add the regression test: endSession fails once (e.g. reject the first transaction), the user resumes the same session from Home and leaves again, and the Session Report (or Home on a 0-hand session) appears — never a stuck busy screen. Verify the test fails against the current code, then restore. Keep e2e/session-end-order.spec.ts passing.
