# Build log — TASK-3.2

## BUILD (2026-11-18)
- Added headless `src/table/action-bar.ts` and `src/ui/table/ActionBar.tsx`; wired `Table.tsx`; storyboard button styles in `styles.css`.
- Tests: `tests/table/action-bar.test.ts` (2), `tests/table/action-bar.acceptance.test.ts` (1, 10,000 states, ~0.3-0.6 s), `tests/ui/action-bar.acceptance.test.tsx` (5), `e2e/action-bar.spec.ts` (5 x 2 browsers).
- `e2e/table.spec.ts`: exactly the three D-4 edits (button-name regex, `Call $<n>` in `checkOrCall`, disabled-bar check at both hand ends). No other assertion touched.
- Finding: axe-core uses `setTimeout` internally, so it hangs under the paused fake clock (SPEC-13 bot-turn scan). Solved in the spec file by swapping in Web Worker-backed timers for the scan only and restoring afterwards; the test then asserts the action count (5) and `data-to-act` ("6") did not change.
- `node --import ./tools/playtest/resolve-ts.js` loads `src/table/action-bar.ts` under type stripping: OK.
- `npm run typecheck`, `npm run lint`: pass (run after each test-file edit).
- `npm run e2e`: 46 passed (Chromium + WebKit); `e2e/action-bar.spec.ts` + `e2e/table.spec.ts` with `--repeat-each 3`: 66 passed.
- `npm test`: 60 files, 222 passed, 1 skipped (pre-existing); coverage 98.55% lines overall.
- `npm run playtest -- --hands 10000 --seed 42`: 0 invariant violations.
- `npm run format`: run.
- Screenshots: `doit/TASK-3.2/bar-turn.png`, `doit/TASK-3.2/bar-waiting.png` (temporary capture spec deleted).
