## BUILD
- Replaced the 4 racy immediate calls reads in 'onHandComplete fires exactly once per hand even with the same replay code' with `expect.poll` (exact matchers unchanged; post-advance paused.calls check stays immediate per A-2).
- `npm run format`: ok.
- SPEC-02: `npx playwright test e2e/hand-records.spec.ts --repeat-each 20 --project=chromium --project=webkit` → 360 passed, 0 failed (18 tests x 20 x 2 browsers; target test 20/20 chromium, 20/20 webkit).
