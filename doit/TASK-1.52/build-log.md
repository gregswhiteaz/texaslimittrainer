## BUILD (blocked)
- SPEC-01: unit lineUpPolicyFactory at 40/100/20 hands; `npx vitest run --coverage tests/playtest/policy.test.ts` 5 passed, lineUp test 2,918-2,935 ms (3 runs). Sweep file 11.2 s.
- SPEC-02: draw test moved to sweep (8.1 s); fast unit test 1 ms. 4/4 passed.
- e2e helper + worker-delay.spec.ts written. `npx playwright test e2e/worker-delay.spec.ts`: 2 passed (SPEC-07), 4 failed (SPEC-04/05 both engines): A-3's 60,000 ms fake bound is exhausted after ~3 s real, before two 2 s delayed replies land. With maxFakeMs raised (debug only, reverted) SPEC-04 passes on both engines.
- Stopped: blocked.json (SPEC-04, A-3 bound). Locked e2e files not yet edited.

## BUILD (resumed after fix-brief)
- maxFakeMs default → 600,000 (fixed: recorded deviation from A-3).
- Unit lineUpPolicyFactory trimmed to 20 / 100 / 20 hands (fixed: 1.70 s alone, 1.98 s in full unit run; all expects kept, `not.toEqual` still holds at 20).
- Six locked e2e files: only clock-advance lines, the now-unused runFor1000 helpers / userToAct loop and imports changed; no expect line touched.
- `npx playwright test` on the 6 files + worker-delay.spec.ts: 66 passed (Chromium+WebKit). worker-delay at 4,000 ms delay (temporary, reverted): 6 passed.
- `npm run test:unit`: 47 files, 171 passed / 1 skipped, thresholds met, slowest test 3.4 s. `npm run test:sweeps`: 89 files, 310 passed / 2 skipped.
- `npm run e2e` x2: 136 passed / 12 skipped, both runs. typecheck + eslint clean; `npm run format` run.
