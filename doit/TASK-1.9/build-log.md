## BUILD — 2026-11-20

- Engine (`hand.ts`): all-in calls, `allIn` flag, open-seat round closing and actor order, uncalled-bet return in `gather`, `dealNextStreet` helper + D-7 runout, `HandResult.returned`, floor `bigBlind + 1`.
- Checker (`invariants.ts`): C3/C4 account for `returned`; C5 in `checkStep`. Playtest `largestPot` includes `returned`.
- After the engine change, `npx vitest run` → exactly 9 failures, all in E1–E4, E7, E8 and U1–U3 (the listed edits); no other locked assertion failed. Applied E1–E8 and U1–U4 exactly as listed → 109 files, 382 passed, 6 skipped.
- `npx playwright test e2e/next-hand.spec.ts e2e/review.spec.ts` → 12 passed (Chromium + WebKit); E5 `$8` values confirmed.
- `npm run playtest -- --hands 10000 --seed 42` → identical to the §3 baseline (fold 5470, showdown 4530, actions 88831, capped 244, largest pot $70, violations 0).
- New tests: `tests/engine/all-in.acceptance.test.ts` (7), `tests/engine/all-in-invariants.acceptance.test.ts` (2), `tests/table/hand-result-uncalled.acceptance.test.ts` (1), `tests/engine/hand.test.ts::all-in flags, floor and actor order` (1); all passed first run.
- `npm run format` ok; `npm run lint` ok; `npm run typecheck` ok.
- `npm test` (with coverage) → 112 files, 393 passed, 6 skipped; all files 96.72% lines.
- `git diff 9ccffbc --stat` on `invariant-messages.acceptance`, `summary.acceptance`, `src/table/session.ts`, `src/advice`, `src/ui`: empty. Locked E-files: 12 insertions, 11 deletions (E1–E8 only).
