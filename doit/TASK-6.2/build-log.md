
## BUILD (stopped, blocked)
- Implemented D-1, D-3, D-4, D-6, D-7 and the SPEC-09/10 lint tests (`npx vitest run tests/toolchain/bot-determinism.test.ts`: 3 passed).
- Playtest baseline confirmed against the real code: `npm run -s playtest -- --hands 10000 --seed 42 --size 6` → Player actions 88920, 0 violations, SHA-256 `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`, two runs byte-identical (matches spec).
- Typecheck clean; lint clean after `npm run format`.
- Full `npx vitest run`: 8 failed / 521 passed. After formatting, the two toolchain lint failures pass. Remaining: the expected D-5 locked tests (tag-playtest AC#5/AC#6, advice-worker, bot-random :85), the unlocked runner unit (`:205`), and **`tests/playtest/games.acceptance.test.ts` AC#6 (locked, TASK-1.16, not in D-5)**: no sit-and-go completes in 10,000 hands at seed 42 under the seeded default policy. Stopped and wrote `blocked.json`.
- Not yet done: SPEC-01..08, SPEC-11 tests, D-5 edits, e2e, hand-worked example check.

## BUILD (resumed after Q-4)
- Deleted `blocked.json`. Applied D-5 items 1–4 and item 5 (Q-4: games.acceptance AC#6 sng run gets an explicit pre-6.2 `makePolicy`; assertions byte-identical).
- D-5 item 4: only `tests/bots/bot-random.acceptance.test.ts:85` failed and was edited; `:174-176` passed unchanged.
- **Hand-worked examples differ from the spec's seat numbers** (the spec assumed button 6; the seed-42 run has button 1 in hand 1). Real values, now asserted in `tests/bots/tag-mixing.acceptance.test.ts`:
  - Example 1 (recommendation kept): code `000000000000002a0000000000000001`, seat 1 (BTN), ATo, `raise`, fold / alternative raise, k=0, seed `600557987`, u=`3626515352` ≥ 1073741824 → `fold`.
  - Example 2 (alternative chosen): code `000000000000002a0000000000000004`, seat 3 (CO), A6o, `unopened`, fold / alternative raise, k=0, seed `1408880392`, u=`168862582` < 1073741824 → `raise`. `handleAdviceRequest` with that seed returns the same raise.
  - The spec's seeds `4290467780`/`584394998` belong to hand 1 seat 6 (JTs CO, no alternative) and `3582685763`/`2590574823` to hand 4 seat 5 (96o SB, re-raise) — not mixed spots.
- Playtest baseline unchanged from spec: SHA-256 `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`, Player actions 88920, 0 violations; two runs byte-identical.
- `npm run format` done; `npm run lint` clean; `npm run typecheck` clean.
- `npm test`: 155 files passed, 1 skipped; 538 tests passed, 7 skipped. Coverage all files 96.9% statements; `src/bots/style.ts` 100% lines, `src/bots/tag.ts` 100% lines.
- `npm run e2e`: 130 passed, 12 skipped.
