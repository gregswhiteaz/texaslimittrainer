# TASK-12.2 build log

## BUILD (2026-11-25)
- I built the code to spec: `SettingsWriter` and `writeSettings`, App settings state (read at launch, `changeSettings`), the Settings Display checkbox, `showOpponentStyles` from TableScreen through Table and TableView to the bot Seat, CSS for a 44x44 input, and the docs.
- New tests: `tests/storage/settings-write.test.ts` (SPEC-07), `tests/ui/opponent-styles.acceptance.test.tsx` (SPEC-01/03/04), `e2e/opponent-styles.spec.ts` (SPEC-02/05/06/08). I made the D-4 edits 1-3 to `e2e/settings.spec.ts`.
- `npx prettier --write` on every touched file. `npm run lint`: clean. `npm run typecheck`: clean.
- `npm test`: 307 files passed, 5 skipped. 1401 tests passed, 46 skipped. Coverage 93.4% statements overall.
- `npm run build && npx playwright test`: 338 passed, 18 skipped, 2 failed. The failures are `e2e/settings.spec.ts` "every Settings control is reachable by Tab…" in chromium and webkit. The tab walk starts from the focused h1, which comes after ← Home in the DOM, so it returns [checkbox, ← Home] where the test expects DOM order [← Home, checkbox]. Edits 1-3 can't fix this.
- A temporary probe (deleted) showed the checkbox input is 44x44 in both browsers.
- I wrote `blocked.json` (SPEC-09), recommending a 4th locked edit with an exact rotated expected order.
- I couldn't undo the intent-to-add index entries for the 3 new test files (the hook blocks git). They are harmless and will be committed anyway.
