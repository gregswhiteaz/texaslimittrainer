## BUILD (2026-11-18)
- Made `src/assets/tlh-logo.jpg` with `sips` (512 × 512, 52,065 bytes); original brand file unchanged.
- Wrote `card-art.ts` (original SVG paths: monoline ranks in a 28-unit box at (6, 6), stroke 4.5; filled suits 30 tall ending at (54, 78)) and `PlayingCard.tsx` per the §5 markup contract.
- Unit: `npx vitest run tests/ui` → 2 files, 9 passed. `npm run typecheck`, `npm run lint` clean after each test-file edit.
- E2E: `npx playwright test e2e/cards.spec.ts` → 10 passed (Chromium + WebKit). `cards.spec.ts` sets `deviceScaleFactor: 1` because the Desktop Safari device defaults to 2 (SPEC-02 states DSF 1).
- Baselines: `npx playwright test e2e/cards.visual.spec.ts --update-snapshots` → 6 PNGs; rerun without update → 2 passed.
- `npm run e2e` → 24 passed. `npm run format`, lint, typecheck clean.
- Saved review screenshot `doit/TASK-3.5/gallery.png` via a temporary spec (deleted afterwards).
- Full `npm test` left to the stop-hook gate.
