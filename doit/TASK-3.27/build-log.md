# TASK-3.27 build log

## BUILD 1 (2026-11-21)
- Edited `e2e/rapid-pace.spec.ts` only (strengthen-only, Q-2): `meterBotAction` checks worker posts before the
  user's-turn/hand-over `null` return (SPEC-01/03); self-test start-up now `runFor(1)` until the deal shows (cap
  2 000 fake ms), then `actionCount` `toBe(2)` (was `> 0`) and seat 3 row `toContainText('To act')` (SPEC-02).
  No assertion removed or loosened. Diff: 7 insertions, 5 deletions.
- Self-test duration (`-g paused`, list reporter, local): before chromium 2.4 s / webkit 3.3 s; after chromium
  2.8 s / webkit 4.3 s (about +0.4–1.0 s per project, under the 10 s limit).
- SPEC-04: `npx playwright test e2e/rapid-pace.spec.ts -g "paused" --project chromium --project webkit
  --repeat-each 50 --reporter=line` → 200 passed (100 chromium, 100 webkit), 0 failed (2.0 m).
  CI run: pending — the orchestrator pushes the branch; record the run URL then.
- SPEC-05 M1 (`RAPID_BOT_DELAY_MS = 400`, temporary, reverted): guard failed in both projects ("bot action 1:
  101 ms of fake time", expected <= 100); self-test passed in both (A-1).
- SPEC-05 M2 (self-test `setTimeout` wrapper passes `ms` unchanged, temporary, reverted): self-test failed in
  both projects (`expected >= 400, received 1`); guard passed.
- SPEC-05 stress (WebKit, temp copies under `e2e/`, deleted): init script subclass-free wrap of
  `Worker.prototype.addEventListener('message')` delaying each reply by a random 0–4000 `MessageChannel` hops,
  plus `page.waitForTimeout(15)` after the helper's count read; `--repeat-each 30`:
  fixed order 30/30 passed; control (old order) 23 passed / 7 failed, every failure `a bot is to act` (null).
- Final: `npm run format` (no changes), `npm run lint` clean, `npm run typecheck` clean, `npm test` 548 passed /
  7 skipped (157 files + 1 skipped), `npm run e2e` 130 passed / 12 skipped.
