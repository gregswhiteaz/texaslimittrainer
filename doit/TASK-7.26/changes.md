# TASK-7.26 changes

- `src/advice/ranges/heads-up.json` — new: 12 authored heads-up default ranges (Appendix A hands) with a file justification and one original justification per range.
- `src/advice/ranges/full-ring.json` — new: 54 authored full-ring default ranges (Appendix A hands) with a file justification and one original justification per range.
- `src/advice/ranges.ts` — `APPLICABLE_LINES` for heads-up, 6-max and full-ring (6-max order unchanged); `parseDefaultRanges` accepts all three sizes; new `HEADS_UP_RANGES`, `FULL_RING_RANGES`, `DEFAULT_RANGES`, `rangesFor`; `estimateOpponentRanges` picks the ranges by dealt-in seats (2, 6, 8–10) and keys positions by the size; doc comments for `OpponentRange.position/line`.
- `tests/advice/size-ranges.acceptance.test.ts` — new: AC#1 (SPEC-01), AC#2 heads-up (SPEC-03), AC#2 full ring at 8/9/10 seats (SPEC-04), AC#3 bands (SPEC-05).
- `tests/advice/size-ranges-playtest.acceptance.test.ts` — new: SPEC-07 opt-in slow 100,000-hand all-TAG measurement at sizes 2 and 9.
- `tests/advice/ranges.test.ts` — SPEC-02 `validates heads-up and full-ring range files` and SPEC-06 `heads-up and full-ring range content sanity`; `copyOf` takes the raw file.
- `tests/advice/postflop-ranges.test.ts` — SPEC-09: heads-up block now asserts the authored start; the no-default-ranges fallback moves to a 5-seat view; test renamed.
- `package.json` — `test:slow` also runs `tests/advice/size-ranges-playtest.acceptance.test.ts`.
- `docs/advice/range-model.md` — positions and data file per size, pair counts 12/36/54, heads-up and full-ring section with the band table, observed scaling at every size with ranges, "Other table sizes" (3, 4, 5, 7 seats, TASK-7.35), effect at heads-up and full ring.
- `docs/advice/postflop-rules.md` — "Not applied yet" bullet now names only 3, 4, 5 and 7 seats (TASK-7.35).
- `tests/golden/postflop-spots.json` — Q-2 like-for-like replacements (locked, owner TASK-7.14, unlocked for Q-2): six heads-up/full-ring spots keep their street, size, action, line and board; only hole cards, id and justification change (`fr-flop-hj-fold-aqs`→`fr-flop-hj-fold-a2s`, `hu-river-bb-check-aqo`→`hu-river-bb-check-t8o`, `hu-river-btn-call-93s`→`hu-river-btn-call-q9s`, `hu-river-btn-call-t5s`→`hu-river-btn-call-77`, `fr-river-utg-bet-kjo`→`fr-river-utg-bet-ajs`, `fr-river-utg-fold-ato`→`fr-river-utg-fold-jto`). Counts 120 / 86 / 18 / 16 kept.
- `docs/advice/golden-spots.md` — "Changes from TASK-7.26" log: old id, new id, reason with the new margin.

No new dependency.
- `tests/advice/preflop.acceptance.test.ts` — sandbox file list adds heads-up.json and full-ring.json (TASK-7.2 locked; unlocked; orchestrator edit, no assertion change)
- `tests/golden/postflop-spots.json` — fr-river-utg-fold-jto justification reworded (J-1-01; TASK-7.14 locked; unlocked; orchestrator edit)
