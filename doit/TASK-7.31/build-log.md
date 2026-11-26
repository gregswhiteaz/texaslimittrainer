# Build log — TASK-7.31

## BUILD (2026-11-25)

What I did:
- `src/advice/golden.ts`: new private `heroPreflopProblems(data, view)`. It re-deals the hand with `dealtHand` for the
  built hero seat, walks `before` with `legalOf`/`applyAction` while the street is preflop, and grades every hero step
  with `gradeDecision(recommendPreflop(view), step)` (the preflop branch of `recommend`). A Major grade pushes the A-5
  text; it runs before advice (D-2), so a bad line costs no equity. The clear-cut loop now runs in its own try/catch
  and a throw becomes `clear-cut check failed (<message>)` for that spot only (D-3). No exported signature changed.
- `tests/golden/postflop-spots.json`: the 72 spots from spec §3 re-authored (A-6). 10 by (a) chart action with the
  opponents' responses following the new raise (ids kept); 59 by (b) hole-card swap on the same line and board (new
  ids); 2 by (c) line change (`6max-flop-bb-fold-95o` keeps its id; `6max-flop-hj-call-t5s` becomes
  `6max-flop-hj-call-t9s`, since no hand was clear-cut on the old UTG-raise line); `6max-turn-bb-raise-92o` per A-7.
  Prototype differences from the spec: `6max-flop-sb-fold-93o` and `6max-flop-bb-raise-65o` did have hole-card swaps
  (64s, 65s) once candidates were ordered by made-hand category, so they use (b).
- Within a step I preferred a Correct hero line. Five spots have only Minor (borderline-cell) hero steps, which A-3
  allows: `6max-flop-utg-check-a9o`, `6max-flop-utg-fold-k9s`, `6max-flop-utg-fold-a9o` and `fr-flop-mp-check-44`
  (limps; no UTG/MP limp is Correct on the chart, so no swap on those lines is Correct) and `6max-flop-sb-fold-64s`
  (SB open of 64s; the only clear-cut swap). Every other hero preflop step in the file is Correct.
- Every replacement keeps street, table size, recorded action, multiway status (unfolded opponents at the decision
  checked spot by spot for every line change) and observed-stats status; the A-8 counts are unchanged and pinned.
- Justifications rewritten for every changed spot from the evaluator category and a per-street draw check (flush
  draws, straight-completing ranks using a hole card), and from a per-street replay of `before` with positions. The
  92o justification says "kings full" and names the hands ahead correctly for the limped line (KK = kings full,
  K9 = nines full of kings, 44 = fours full, a nine with a kicker above the board four).
- `docs/advice/golden-spots.md`: postflop `before` rule and its failure text, the clear-cut failure text, "Adding a
  spot" step 2, the example's `before` (it showed the old Major line), and the "Changes from TASK-7.31" table (72 rows).
- Tests: new locked `tests/golden/postflop-lines.acceptance.test.ts` (SPEC-01 to SPEC-05) and the SPEC-06 unit test
  plus the heads-up probe's line (now `raise, raise, call`) in `tests/golden/postflop-golden.test.ts`.
- The SPEC-03 test first re-parsed the file with real advice and timed out (5 s) under the full parallel `npm test`;
  it now relies on the module-level parse (which throws on any problem) instead of computing equity twice.

Follow-up (A-1, not changed): three graded examples still have Major hero preflop lines:
`graded-postflop-fold-minor-6max-flop-gutshot` (BTN calls a raise with 52o),
`graded-postflop-check-minor-6max-river-top-pair` (CO opens K6s and calls a re-raise),
`graded-postflop-check-major-6max-turn-trips` (BTN opens T3o).

Commands:
- Prototype audit before: 72 of 120 spots with a Major hero preflop step. After: 0 of 120.
- `npx vitest run tests/golden/`: 6 files, 288 tests passed (about 1.1 s).
- `npm run lint`: pass. `npm run typecheck`: pass. `npm run format`: run.
- `npm run -s playtest -- --hands 2000 --seed 42`: 2000 hands, 0 invariant violations.

### SPEC-08 fact-check table (every changed spot)

Numbers are `goldenPostflopAdvice` (equity %, required %, equity vs calling range %, value threshold). Made hand is `handCategory(evaluate(hole + board))` on the decision street. Line change shows the new `before` and the old one.

| Old id | New id | Hole cards | Line change | Equity / required / vs calling range (threshold) | Made hand (evaluator) |
| --- | --- | --- | --- | --- | --- |
| `6max-flop-co-bet-76o` | `6max-flop-co-bet-76s` | 6c 7c (was 6s 7h) | none | 84.9 / 0 / 70.4 (50) | two-pair |
| `6max-flop-btn-bet-aqo` | `6max-flop-btn-bet-aqo` | Ac Qh (was Ac Qh) | `fold,fold,raise,raise,fold,fold,call,check` (was `fold,fold,raise,call,fold,fold,check`) | 86.6 / 0 / 83 (50) | one-pair |
| `6max-flop-bb-bet-aa` | `6max-flop-bb-bet-aa` | Ad As (was Ad As) | `fold,fold,fold,fold,raise,raise,call,check` (was `fold,fold,fold,fold,raise,call,check`) | 92.5 / 0 / 84.3 (50) | one-pair |
| `6max-flop-btn-bet-97o` | `6max-flop-btn-bet-99` | 9c 9h (was 9s 7h) | none | 91.2 / 0 / 85 (50) | three-of-a-kind |
| `6max-flop-btn-bet-q8o` | `6max-flop-btn-bet-q8s` | Qd 8d (was Qd 8s) | none | 82.2 / 0 / 71.4 (50) | one-pair |
| `6max-flop-utg-check-a5o` | `6max-flop-utg-check-a9o` | Ah 9c (was As 5c) | none | 12.8 / 0 / 5.4 (50) | high-card |
| `6max-flop-co-check-83o` | `6max-flop-co-check-22` | 2c 2d (was 8d 3s) | none | 24.6 / 0 / 16.7 (50) | one-pair |
| `6max-flop-co-call-a7o` | `6max-flop-co-call-a7s` | Ac 7c (was Ah 7d) | none | 27 / 12.5 / 19.9 (65) | one-pair |
| `6max-flop-co-call-a6o` | `6max-flop-co-call-a6s` | Ad 6d (was Ad 6h) | none | 26.8 / 10.5 / 26.8 (65) | one-pair |
| `6max-flop-co-call-j7o` | `6max-flop-co-call-44` | 4c 4s (was 7c Js) | none | 26.6 / 10.5 / 26.6 (65) | one-pair |
| `6max-flop-utg-fold-k9o` | `6max-flop-utg-fold-k9s` | Kc 9c (was 9c Ks) | none | 8.4 / 20 / 7.1 (65) | high-card |
| `6max-flop-utg-fold-a3o` | `6max-flop-utg-fold-a9o` | Ah 9c (was 3d Ah) | none | 5.8 / 20 / 4.7 (65) | high-card |
| `6max-flop-sb-fold-93o` | `6max-flop-sb-fold-64s` | 6c 4c (was 9d 3h) | none | 6.5 / 16.7 / 6.5 (65) | high-card |
| `6max-flop-bb-fold-95o` | `6max-flop-bb-fold-95o` | 9d 5s (was 9d 5s) | `fold,fold,fold,fold,call,check,bet` (was `raise,fold,fold,fold,fold,call,check,bet`) | 9.2 / 25 / 9.2 (65) | high-card |
| `6max-flop-co-raise-jj` | `6max-flop-co-raise-jj` | Jc Jh (was Jc Jh) | `call,fold,raise,fold,fold,call,call,check,bet` (was `call,fold,call,fold,fold,check,check,bet`) | 85.6 / 11.8 / 83.7 (65) | three-of-a-kind |
| `6max-flop-bb-raise-aa` | `6max-flop-bb-raise-aa` | Ac Ah (was Ac Ah) | `fold,fold,fold,fold,raise,raise,call,bet` (was `fold,fold,fold,fold,raise,call,bet`) | 83.6 / 12.5 / 83.6 (65) | one-pair |
| `6max-flop-bb-raise-65o` | `6max-flop-bb-raise-65s` | 6c 5c (was 6s 5c) | none | 83.3 / 11.8 / 83.3 (65) | three-of-a-kind |
| `6max-flop-btn-raise-97o` | `6max-flop-btn-raise-97s` | 9c 7c (was 7c 9d) | none | 85.2 / 15.4 / 85.2 (65) | straight |
| `6max-flop-co-fold-j3o` | `6max-flop-co-fold-j9s` | Jd 9d (was Js 3c) | none | 1.6 / 20 / 1.8 (65) | high-card |
| `6max-flop-hj-fold-t5o` | `6max-flop-hj-fold-88` | 8c 8h (was Th 5s) | none | 2 / 14.8 / 2.1 (65) | one-pair |
| `6max-flop-hj-call-t5s` | `6max-flop-hj-call-t9s` | Ts 9s (was Ts 5s) | `fold,raise,fold,call,fold,call,bet` (was `raise,call,fold,call,fold,call,bet,call`) | 38.7 / 11.8 / 35.9 (65) | high-card |
| `6max-flop-btn-call-97o` | `6max-flop-btn-call-76s` | 7c 6c (was 7h 9s) | none | 30 / 9.5 / 29 (65) | high-card |
| `hu-flop-bb-call-33` | `hu-flop-bb-call-33` | 3c 3d (was 3c 3d) | `call,raise,call,bet,raise` (was `call,check,bet,raise`) | 30.6 / 12.5 / 30.6 (65) | one-pair |
| `hu-flop-btn-fold-73o` | `hu-flop-btn-fold-73s` | 7c 3c (was 3c 7d) | none | 3.8 / 16.7 / 3.8 (65) | high-card |
| `fr-flop-utg-bet-kto` | `fr-flop-utg-bet-kts` | Kc Tc (was Td Ks) | none | 76.5 / 0 / 68.7 (50) | one-pair |
| `fr-flop-mp-check-83o` | `fr-flop-mp-check-44` | 4c 4d (was 3h 8c) | none | 14.1 / 0 / 11.8 (50) | one-pair |
| `fr-flop-btn-check-j3s` | `fr-flop-btn-check-kjs` | Kc Jc (was Jh 3h) | none | 42.4 / 0 / 34.1 (50) | one-pair |
| `fr-flop-hj-call-j2o` | `fr-flop-hj-call-qjs` | Qc Jc (was 2d Jh) | none | 37.6 / 12.5 / 32.1 (65) | one-pair |
| `fr-flop-bb-raise-a3o` | `fr-flop-bb-raise-a3s` | Ac 3c (was Ad 3s) | none | 82.7 / 11.8 / 82.7 (65) | three-of-a-kind |
| `fr-flop-btn-fold-87o` | `fr-flop-btn-fold-66` | 6c 6d (was 8c 7d) | none | 7.2 / 17.4 / 7.2 (65) | one-pair |
| `6max-turn-bb-bet-63s` | `6max-turn-bb-bet-a3s` | Ad 3d (was 3h 6h) | none | 82.1 / 0 / 82.1 (50) | three-of-a-kind |
| `6max-turn-btn-bet-94o` | `6max-turn-btn-bet-a4s` | Ac 4c (was 9h 4s) | none | 86 / 0 / 71.6 (50) | two-pair |
| `6max-turn-utg-bet-k3o` | `6max-turn-utg-bet-a3s` | Ad 3d (was Kh 3c) | none | 90.2 / 0 / 90.2 (50) | straight |
| `6max-turn-btn-bet-86o` | `6max-turn-btn-bet-ats` | Ac Tc (was 6d 8h) | none | 96.7 / 0 / 79 (50) | two-pair |
| `6max-turn-utg-bet-a6o` | `6max-turn-utg-bet-a6s` | Ad 6d (was 6d As) | none | 86.8 / 0 / 70.4 (50) | two-pair |
| `6max-turn-utg-check-92o` | `6max-turn-utg-check-t9s` | Tc 9c (was 9h 2d) | none | 24.6 / 0 / 24.6 (50) | one-pair |
| `6max-turn-co-check-t7o` | `6max-turn-co-check-a2s` | Ac 2c (was Ts 7d) | none | 27 / 0 / 27 (50) | one-pair |
| `6max-turn-bb-check-85o` | `6max-turn-bb-check-85s` | 8c 5c (was 5c 8d) | none | 27.6 / 0 / 27.6 (50) | one-pair |
| `6max-turn-co-fold-98o` | `6max-turn-co-fold-a2s` | Ad 2d (was 8s 9d) | none | 10.9 / 29.6 / 10.9 (65) | high-card |
| `6max-turn-btn-fold-64o` | `6max-turn-btn-fold-55` | 5c 5d (was 6s 4h) | none | 4.6 / 25.8 / 4.6 (65) | one-pair |
| `6max-turn-bb-fold-93o` | `6max-turn-bb-fold-k3s` | Kc 3c (was 9c 3d) | none | 15.3 / 32 / 15.3 (65) | high-card |
| `6max-turn-utg-fold-82o` | `6max-turn-utg-fold-a7s` | Ac 7c (was 2s 8c) | none | 13.2 / 27.6 / 13.2 (65) | high-card |
| `6max-turn-utg-fold-k2o` | `6max-turn-utg-fold-k9s` | Kc 9c (was Kh 2s) | none | 11.5 / 27.6 / 11.5 (65) | high-card |
| `6max-turn-co-fold-j3s` | `6max-turn-co-fold-22` | 2c 2d (was Js 3s) | none | 9.1 / 22.9 / 9.1 (65) | one-pair |
| `6max-turn-co-raise-a6o` | `6max-turn-co-raise-a6s` | Ac 6c (was 6h Ad) | none | 90 / 22.9 / 90 (65) | two-pair |
| `6max-turn-co-raise-t9o` | `6max-turn-co-raise-t9s` | Tc 9c (was Ts 9c) | none | 86.6 / 25.8 / 86.6 (65) | straight |
| `6max-turn-bb-raise-kk` | `6max-turn-bb-raise-kk` | Kd Ks (was Kd Ks) | `fold,fold,fold,fold,raise,raise,call,check,bet,call,bet` (was `fold,fold,fold,fold,raise,call,check,bet,call,bet`) | 86.8 / 25 / 86.8 (65) | two-pair |
| `6max-turn-bb-raise-92o` | `6max-turn-bb-raise-92o` | 2c 9d (was 2c 9d) | `call,fold,fold,fold,fold,check,bet,call,bet,raise` (was `raise,fold,fold,fold,fold,call,bet,call,bet,raise`) | 88 / 24.2 / 88 (65) | three-of-a-kind |
| `6max-turn-bb-check-72o` | `6max-turn-bb-check-k2s` | Kc 2c (was 7s 2c) | none | 19.9 / 0 / 19.9 (50) | one-pair |
| `hu-turn-btn-bet-k2o` | `hu-turn-btn-bet-k2o` | Kd 2c (was Kd 2c) | `raise,call,check,check,check` (was `call,check,check,check,check`) | 81.8 / 0 / 72.4 (50) | one-pair |
| `hu-turn-btn-check-73o` | `hu-turn-btn-check-73s` | 7c 3c (was 7d 3s) | none | 3.7 / 0 / 3.7 (50) | high-card |
| `fr-turn-utg-bet-94o` | `fr-turn-utg-bet-99` | 9c 9d (was 4s 9c) | none | 91.3 / 0 / 89.8 (50) | three-of-a-kind |
| `fr-turn-hj-raise-86s` | `fr-turn-hj-raise-a2s` | Ad 2d (was 6d 8d) | none | 99.7 / 27.6 / 99.7 (65) | flush |
| `6max-river-bb-bet-aks` | `6max-river-bb-bet-aks` | Ad Kd (was Ad Kd) | `raise,fold,fold,fold,fold,raise,call,check,bet,call,check,check` (was `raise,fold,fold,fold,fold,call,check,bet,call,check,check`) | 92.7 / 0 / 92.7 (50) | one-pair |
| `6max-river-sb-bet-j4o` | `6max-river-sb-bet-j8s` | Jd 8d (was Js 4h) | none | 90.7 / 0 / 86.9 (50) | one-pair |
| `6max-river-sb-check-52o` | `6max-river-sb-check-qjo` | Qd Jc (was 2d 5s) | none | 25 / 0 / 25 (50) | one-pair |
| `6max-river-bb-check-93o` | `6max-river-bb-check-43s` | 4c 3c (was 9h 3d) | none | 0.5 / 0 / 0.5 (50) | high-card |
| `6max-river-co-check-72o` | `6max-river-co-check-76s` | 7c 6c (was 2h 7c) | none | 2.8 / 0 / 2.8 (50) | one-pair |
| `6max-river-bb-check-j5o` | `6max-river-bb-check-53s` | 5d 3d (was Jh 5s) | none | 36.1 / 0 / 9.3 (50) | one-pair |
| `6max-river-btn-call-k6o` | `6max-river-btn-call-88` | 8d 8h (was Kc 6h) | none | 33.7 / 12.9 / 33.7 (65) | one-pair |
| `6max-river-utg-fold-92o` | `6max-river-utg-fold-t9s` | Ts 9s (was 2h 9d) | none | 9.2 / 23.5 / 9.2 (65) | high-card |
| `6max-river-btn-fold-t7o` | `6max-river-btn-fold-76s` | 7h 6h (was Tc 7s) | none | 0.9 / 19 / 0.9 (65) | high-card |
| `6max-river-utg-fold-t4o` | `6max-river-utg-fold-jts` | Jc Tc (was 4h Ts) | none | 4.5 / 16 / 4.5 (65) | high-card |
| `6max-river-btn-raise-q3s` | `6max-river-btn-raise-a3s` | Ad 3d (was 3s Qs) | none | 81.5 / 13.8 / 81.5 (65) | three-of-a-kind |
| `6max-river-sb-raise-53o` | `6max-river-sb-raise-55` | 5c 5d (was 5s 3d) | none | 95.8 / 20 / 95.8 (65) | straight |
| `6max-river-bb-raise-aks` | `6max-river-bb-raise-aks` | Ac Kc (was Ac Kc) | `fold,fold,fold,fold,raise,raise,call,check,check,check,bet,call,bet` (was `fold,fold,fold,fold,raise,call,check,check,check,bet,call,bet`) | 100 / 14.3 / 100 (65) | two-pair |
| `6max-river-bb-fold-63s` | `6max-river-bb-fold-k6s` | Kh 6h (was 6d 3d) | none | 4.8 / 16 / 4.8 (65) | one-pair |
| `hu-river-bb-call-tt` | `hu-river-bb-call-tt` | Td Th (was Td Th) | `call,raise,call,bet,call,check,bet,call,check,bet` (was `call,check,bet,call,check,bet,call,check,bet`) | 46.2 / 14.3 / 46.2 (65) | one-pair |
| `fr-river-bb-check-52o` | `fr-river-bb-check-65s` | 6c 5c (was 2s 5d) | none | 0 / 0 / 0 (50) | one-pair |
| `fr-river-bb-fold-t3o` | `fr-river-bb-fold-43s` | 4h 3h (was 3h Tc) | none | 0 / 19 / 0 (65) | high-card |
| `fr-river-utg-call-t5o` | `fr-river-utg-call-aks` | Ac Kc (was 5h Td) | none | 31.5 / 16 / 31.5 (65) | one-pair |
| `fr-river-utg-fold-jto` | `fr-river-utg-fold-jts` | Jc Tc (was Jh Tc) | none | 4.5 / 16 / 4.5 (65) | high-card |
