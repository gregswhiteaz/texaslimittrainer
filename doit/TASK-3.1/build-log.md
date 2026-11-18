## BUILD (2026-11-18)
- Wrote `src/table/session.ts` (headless, imports engine and bots only), `useTableSession.ts`, `Table.tsx`, updated `App.tsx` and `styles.css`.
- Unit: `npx vitest run tests/table tests/ui/table.acceptance.test.tsx tests/unit` → 4 files, 12 passed. `npm run typecheck`, `npm run lint` clean after each test-file edit.
- E2E notes: `page.clock.install()` keeps time flowing, so the spec pauses it (`install({time: 0})` + `pauseAt(1000)`) before `goto`; the "runFor(1000)" step advances in 50 ms slices because React commits in a real MessageChannel task, so each next bot timer exists only after the previous slice returns. WebKit's default dark-scheme button failed axe contrast; buttons now have explicit white/dark colours.
- `npx playwright test e2e/table.spec.ts` → 12 passed (Chromium + WebKit). `npm run e2e` → 36 passed (incl. unchanged `e2e/smoke.spec.ts`).
- `npm run playtest -- --hands 10000 --seed 42` → Invariant violations: 0.
- Screenshots `table-turn.png` (flop turn) and `table-end.png` ("Hand over") via a temporary Chromium spec (deleted afterwards).
- `npm run format`, lint, typecheck clean. Full `npm test` left to the stop-hook gate.
