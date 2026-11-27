# Spec: TASK-7.45 — Decide position-aware scaling for observed open-raise and calling ranges

Status: READY (approved 2026-11-27)
Task: TASK-7.45 · Parent/epic: TASK-7 · Requirements: REQ-035 (035.2, 035.6), REQ-046.1, REQ-029.2 · Dream: limit-holdem-trainer

## 1. Summary
A decision spike, follow-up from TASK-7.29 Q-4 a (decision-5). After TASK-7.43 and TASK-7.44, an observed
opponent's range is the authored default resized to a scaled width. Three-bet and four-bet lines scale toward
d × PFR ÷ typical PFR, but `open-raise` still scales toward raw PFR and the calling lines (`limp`, `call-raise`,
`call-three-bet`) toward raw VPIP. That ignores position: every open-raise seat converges on the same PFR and
every calling seat on the same VPIP. This spec measured four options for typical, loose and tight players at
heads-up, 6-max and full ring. The user chose Q-1 D (qa.md, 2026-11-27): open-raise scales by PFR relative to
the typical PFR and calling lines by VPIP relative to the typical VPIP, each capped at 100. This task records
that as decision-8, rewords REQ-035.6 (changelog row 1.18) and creates one follow-up build story with
re-pinned expectations. No product code changes.

## 2. Scope
- In scope:
  - Record the user's Q-1 D answer as one Backlog decision (SPEC-01).
  - Builder: reword REQ-035.6 and add changelog row 1.18 in `dreams/limit-holdem-trainer/requirements.md`
    with the exact text in §5 (SPEC-02). Nothing else.
  - Orchestrator (at finish, CLI only): the decision (SPEC-01), the follow-up story (SPEC-04), TASK-7.45
    implementation notes (SPEC-03), and tick AC#1 (SPEC-05).
- Not doing:
  - Any change under `src`, `tests`, `e2e`, `tools` or `docs`. Code, constants, test re-pins and docs belong
    to the follow-up.
  - Changing the three-bet/four-bet rule (TASK-7.44), the resize rule or hand order (TASK-7.43), the blend
    formula `d + (o − d) × min(n,100) ÷ 100`, the 30-hand threshold, the default range files or the `check`
    line (not scaled).
  - A new stat (cold-call %, 3-bet %): the snapshot has only `hands/vpip/pfr` (TASK-7.29 §3: a new stat changes
    the persisted session record).
  - Bots: they never receive observed stats (REQ-029.2), so no option changes bot play or playtests.
  - Regenerating `dreams/limit-holdem-trainer/rtm.md` (A-2).
  - Any speed or scale check (standing rule: opt-in `npm run test:slow` only).
- Scope budget: files=1, lines=2   (`requirements.md` only: 1 changed clause line (REQ-035.6) and 1 new
  changelog row. Backlog files are written by the CLI and not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice> (TASK-7.45 Q-1)" -s accepted --plain`; the evidence tables go in TASK-7.45's implementation notes and final summary, pointing to this spec. | yes | The CLI has no body option; decision-1 to decision-7 used the same path; CLAUDE.md forbids hand-editing decision files. | Edit the decision file by hand (forbidden). |
| A-2 | `rtm.md` is not edited. | yes | TASK-7.29 and TASK-3.24 reworded REQs without touching `rtm.md`; the matrix is refreshed separately. | Edit the rtm row here. |
| A-3 | The next changelog row is 1.18, dated the day the build runs. | yes | The last row is 1.17 (`requirements.md:1377`). | n/a |
| A-4 | "Typical VPIP" (option D, chosen) is the midpoint of the healthy VPIP band per reference size in `src/stats/healthy-ranges.json`: heads-up (65+90)/2 = 77.5, 6-max (20+28)/2 = 24, full ring (13+20)/2 = 16.5. In code it is a copied constant `TYPICAL_VPIP` in `src/advice/ranges.ts` with a drift test, exactly like `TYPICAL_PFR` (`src/advice/ranges.ts:352-362`, test `tests/advice/observed-ranges.test.ts:311-321`), because advice code may not import `src/stats` (lint boundary, comment at `src/advice/ranges.ts:352-353`). | yes | Same source and pattern the user approved for typical PFR (TASK-7.29 A-4, TASK-7.44). | A fixed number for all sizes; the seat's default width. |
| A-5 | Figures in §3 come from the project's own functions on this branch: `DEFAULT_RANGES`, `defaultRange`, `rangeWidthPct`, `scaledWidthPct`, `relativePfrPct`, `typicalPfr`, `resizeRange`, `estimateOpponentRanges` and `parsePostflopGoldenSpots`. Probe scripts lived in the session scratchpad and are not committed. Widths are shown at n = 100 hands, where the width equals o; at fewer hands the blend moves the same distance proportionally. | yes | Reproducible from the cited functions (see §10 for the Judge's spot checks). | Commit a `tools/` probe. |
| A-6 | Players measured: the size's typical player (healthy midpoints: heads-up 77.5/57.5, 6-max 24/18, full ring 16.5/12.5), the task's ordinary 22/18, loose 40/30 and 60/45, tight 12/9, and a loose-passive 55/6 (calling station). Heads-up also lists 85/65. | yes | Covers the task's "typical, loose and tight" plus the case that separates PFR-based from VPIP-based calling rules. | Fewer profiles. |

## 3. Current system
Facts the decision rests on (all opened and checked, or measured per A-5):

- **Where the rule lives.** `estimateOpponentRanges` (`src/advice/ranges.ts:666-711`) picks the stat by line
  from `OBSERVED_LINE_STAT` (`:622-630`): `open-raise` → `pfr`; `limp`, `call-raise`, `call-three-bet` →
  `vpip`; `three-bet`, `four-bet` → `relative-pfr`; `check` → none. For `relative-pfr` it computes
  `o = relativePfrPct(d, pfr, typicalPfr(size))` = `min(100, d × pfr ÷ typical)` (`:365-367`), otherwise
  `o = obs[stat]`. Then `widthPct = scaledWidthPct(d, o, hands)` (`:347-350`) and
  `classes = resizeRange(defaultClasses, widthPct)` (`:388-407`).
- **REQ text.** REQ-035.6 (`dreams/limit-holdem-trainer/requirements.md:646`) fixes raw PFR for open-raise and
  raw VPIP for calling ranges. REQ-035.2 (`:642`) says "scaled toward their observed VPIP and PFR by a
  documented formula", so it holds under every option. Healthy bands are REQ-046.1 (`:842`).
- **Healthy bands** (`src/stats/healthy-ranges.json`): VPIP heads-up 65–90, 6-max 20–28, full ring 13–20; PFR
  40–75, 14–22, 9–16. Midpoints: VPIP 77.5 / 24 / 16.5 (A-4), PFR 57.5 / 18 / 12.5 (`TYPICAL_PFR`).
- **The problem, measured.** Under today's rule a *typical* player does not keep the authored ranges:
  - 6-max (24/18): BTN open 34.54 → 18.0, UTG open 12.22 → 18.0 (the early seat gets *wider*), SB limp
    44.65 → 24.0, BB call-raise 41.48 → 24.0, UTG call-raise 11.76 → 24.0.
  - Heads-up (77.5/57.5): BB open-raise (raising a limp) 14.93 → 57.5, BTN call-raise 11.76 → 77.5, BB
    call-three-bet 12.22 → 77.5. Raw VPIP is a whole-hand rate, so heads-up calling lines become 4 to 7 times
    their default.
  - Full ring (16.5/12.5): BTN open 27.30 → 12.5, UTG open 6.94 → 12.5, UTG call-three-bet 3.62 → 16.5.

### Options measured
Evidence shown to the user for Q-1. The user chose D (D-1); A, B and C are kept here only as the measured comparison.

- **A — keep**: o = raw PFR (open-raise), raw VPIP (calling). Today's rule.
- **B — ratio for open-raise only**: open-raise o = min(100, d × PFR ÷ typical PFR); calling keeps raw VPIP.
- **C — ratio for both, capped at 2×**: B for open-raise; calling o = min(100, 2 × d, d × VPIP ÷ typical VPIP).
  The cap keeps any calling range at most double its default.
- **D — ratio for both, cap 100 only**: B for open-raise; calling o = min(100, d × VPIP ÷ typical VPIP). This
  is the TASK-7.44 rule with VPIP in place of PFR for calling lines.
- (Rejected variant, measured for completeness) reuse the PFR ratio on calling lines (d × PFR ÷ typical PFR):
  a 55/6 calling station at 6-max gets BB call-raise 13.8 and SB limp 14.9, far *below* the defaults 41.48
  and 44.65, so it reads a station as a rock. Not offered.

Open-raise widths (%, n = 100). Each cell is **A / B** (B = C = D for open-raise):

| Size | Seat (default d) | typical | 22/18 | 40/30 | 60/45 | 12/9 | 55/6 |
|---|---|---|---|---|---|---|---|
| heads-up | BTN (49.32) | 57.5 / 49.3 | 18.0 / 15.4 | 30.0 / 25.7 | 45.0 / 38.6 | 9.0 / 7.7 | 6.0 / 5.1 |
| heads-up | BB (14.93) | 57.5 / 14.9 | 18.0 / 4.7 | 30.0 / 7.8 | 45.0 / 11.7 | 9.0 / 2.3 | 6.0 / 1.6 |
| 6-max | UTG (12.22) | 18.0 / 12.2 | 18.0 / 12.2 | 30.0 / 20.4 | 45.0 / 30.5 | 9.0 / 6.1 | 6.0 / 4.1 |
| 6-max | HJ (16.29) | 18.0 / 16.3 | 18.0 / 16.3 | 30.0 / 27.1 | 45.0 / 40.7 | 9.0 / 8.1 | 6.0 / 5.4 |
| 6-max | CO (23.53) | 18.0 / 23.5 | 18.0 / 23.5 | 30.0 / 39.2 | 45.0 / 58.8 | 9.0 / 11.8 | 6.0 / 7.8 |
| 6-max | BTN (34.54) | 18.0 / 34.5 | 18.0 / 34.5 | 30.0 / 57.6 | 45.0 / 86.3 | 9.0 / 17.3 | 6.0 / 11.5 |
| 6-max | SB (21.27) | 18.0 / 21.3 | 18.0 / 21.3 | 30.0 / 35.4 | 45.0 / 53.2 | 9.0 / 10.6 | 6.0 / 7.1 |
| 6-max | BB (9.65) | 18.0 / 9.7 | 18.0 / 9.7 | 30.0 / 16.1 | 45.0 / 24.1 | 9.0 / 4.8 | 6.0 / 3.2 |
| full ring | UTG (6.94) | 12.5 / 6.9 | 18.0 / 10.0 | 30.0 / 16.7 | 45.0 / 25.0 | 9.0 / 5.0 | 6.0 / 3.3 |
| full ring | MP (9.80) | 12.5 / 9.8 | 18.0 / 14.1 | 30.0 / 23.5 | 45.0 / 35.3 | 9.0 / 7.1 | 6.0 / 4.7 |
| full ring | CO (17.80) | 12.5 / 17.8 | 18.0 / 25.6 | 30.0 / 42.7 | 45.0 / 64.1 | 9.0 / 12.8 | 6.0 / 8.5 |
| full ring | BTN (27.30) | 12.5 / 27.3 | 18.0 / 39.3 | 30.0 / 65.5 | 45.0 / 98.3 | 9.0 / 19.7 | 6.0 / 13.1 |
| full ring | SB (12.97) | 12.5 / 13.0 | 18.0 / 18.7 | 30.0 / 31.1 | 45.0 / 46.7 | 9.0 / 9.3 | 6.0 / 6.2 |
| full ring | BB (6.49) | 12.5 / 6.5 | 18.0 / 9.3 | 30.0 / 15.6 | 45.0 / 23.3 | 9.0 / 4.7 | 6.0 / 3.1 |

The open-raise ratio reaches the cap of 100 only for an 85/65 player on the button (6-max 100, full ring 100);
60/45 on the full-ring BTN gives 98.3. Heads-up 85/65: BTN 65.0 / 55.8, BB 65.0 / 16.9.

Calling-line widths (%, n = 100). Each cell is **A (= B) / C / D**. `*` = the C cap (2 × d) binds; `^` = the
100 cap binds:

| Size | Seat line (d) | typical | 22/18 | 40/30 | 60/45 | 12/9 | 55/6 |
|---|---|---|---|---|---|---|---|
| heads-up | BTN limp (19.31) | 77.5 / 19.3 / 19.3 | 22.0 / 5.5 / 5.5 | 40.0 / 10.0 / 10.0 | 60.0 / 14.9 / 14.9 | 12.0 / 3.0 / 3.0 | 55.0 / 13.7 / 13.7 |
| heads-up | BTN call-raise (11.76) | 77.5 / 11.8 / 11.8 | 22.0 / 3.3 / 3.3 | 40.0 / 6.1 / 6.1 | 60.0 / 9.1 / 9.1 | 12.0 / 1.8 / 1.8 | 55.0 / 8.3 / 8.3 |
| heads-up | BB call-raise (44.95) | 77.5 / 44.9 / 44.9 | 22.0 / 12.8 / 12.8 | 40.0 / 23.2 / 23.2 | 60.0 / 34.8 / 34.8 | 12.0 / 7.0 / 7.0 | 55.0 / 31.9 / 31.9 |
| heads-up | BTN call-3-bet (20.36) | 77.5 / 20.4 / 20.4 | 22.0 / 5.8 / 5.8 | 40.0 / 10.5 / 10.5 | 60.0 / 15.8 / 15.8 | 12.0 / 3.2 / 3.2 | 55.0 / 14.5 / 14.5 |
| heads-up | BB call-3-bet (12.22) | 77.5 / 12.2 / 12.2 | 22.0 / 3.5 / 3.5 | 40.0 / 6.3 / 6.3 | 60.0 / 9.5 / 9.5 | 12.0 / 1.9 / 1.9 | 55.0 / 8.7 / 8.7 |
| 6-max | BTN limp (13.88) | 24.0 / 13.9 / 13.9 | 22.0 / 12.7 / 12.7 | 40.0 / 23.1 / 23.1 | 60.0 / 27.8* / 34.7 | 12.0 / 6.9 / 6.9 | 55.0 / 27.8* / 31.8 |
| 6-max | SB limp (44.65) | 24.0 / 44.6 / 44.6 | 22.0 / 40.9 / 40.9 | 40.0 / 74.4 / 74.4 | 60.0 / 89.3* / 100^ | 12.0 / 22.3 / 22.3 | 55.0 / 89.3* / 100^ |
| 6-max | UTG call-raise (11.76) | 24.0 / 11.8 / 11.8 | 22.0 / 10.8 / 10.8 | 40.0 / 19.6 / 19.6 | 60.0 / 23.5* / 29.4 | 12.0 / 5.9 / 5.9 | 55.0 / 23.5* / 27.0 |
| 6-max | CO call-raise (16.74) | 24.0 / 16.7 / 16.7 | 22.0 / 15.3 / 15.3 | 40.0 / 27.9 / 27.9 | 60.0 / 33.5* / 41.9 | 12.0 / 8.4 / 8.4 | 55.0 / 33.5* / 38.4 |
| 6-max | BTN call-raise (23.23) | 24.0 / 23.2 / 23.2 | 22.0 / 21.3 / 21.3 | 40.0 / 38.7 / 38.7 | 60.0 / 46.5* / 58.1 | 12.0 / 11.6 / 11.6 | 55.0 / 46.5* / 53.2 |
| 6-max | SB call-raise (17.80) | 24.0 / 17.8 / 17.8 | 22.0 / 16.3 / 16.3 | 40.0 / 29.7 / 29.7 | 60.0 / 35.6* / 44.5 | 12.0 / 8.9 / 8.9 | 55.0 / 35.6* / 40.8 |
| 6-max | BB call-raise (41.48) | 24.0 / 41.5 / 41.5 | 22.0 / 38.0 / 38.0 | 40.0 / 69.1 / 69.1 | 60.0 / 83.0* / 100^ | 12.0 / 20.7 / 20.7 | 55.0 / 83.0* / 95.1 |
| 6-max | UTG call-3-bet (9.65) | 24.0 / 9.7 / 9.7 | 22.0 / 8.8 / 8.8 | 40.0 / 16.1 / 16.1 | 60.0 / 19.3* / 24.1 | 12.0 / 4.8 / 4.8 | 55.0 / 19.3* / 22.1 |
| 6-max | BTN call-3-bet (20.81) | 24.0 / 20.8 / 20.8 | 22.0 / 19.1 / 19.1 | 40.0 / 34.7 / 34.7 | 60.0 / 41.6* / 52.0 | 12.0 / 10.4 / 10.4 | 55.0 / 41.6* / 47.7 |
| 6-max | BB call-3-bet (20.06) | 24.0 / 20.1 / 20.1 | 22.0 / 18.4 / 18.4 | 40.0 / 33.4 / 33.4 | 60.0 / 40.1* / 50.2 | 12.0 / 10.0 / 10.0 | 55.0 / 40.1* / 46.0 |
| full ring | SB limp (36.95) | 16.5 / 37.0 / 37.0 | 22.0 / 49.3 / 49.3 | 40.0 / 73.9* / 89.6 | 60.0 / 73.9* / 100^ | 12.0 / 26.9 / 26.9 | 55.0 / 73.9* / 100^ |
| full ring | UTG call-raise (7.99) | 16.5 / 8.0 / 8.0 | 22.0 / 10.7 / 10.7 | 40.0 / 16.0* / 19.4 | 60.0 / 16.0* / 29.1 | 12.0 / 5.8 / 5.8 | 55.0 / 16.0* / 26.6 |
| full ring | CO call-raise (16.29) | 16.5 / 16.3 / 16.3 | 22.0 / 21.7 / 21.7 | 40.0 / 32.6* / 39.5 | 60.0 / 32.6* / 59.2 | 12.0 / 11.8 / 11.8 | 55.0 / 32.6* / 54.3 |
| full ring | BTN call-raise (20.81) | 16.5 / 20.8 / 20.8 | 22.0 / 27.8 / 27.8 | 40.0 / 41.6* / 50.5 | 60.0 / 41.6* / 75.7 | 12.0 / 15.1 / 15.1 | 55.0 / 41.6* / 69.4 |
| full ring | BB call-raise (27.60) | 16.5 / 27.6 / 27.6 | 22.0 / 36.8 / 36.8 | 40.0 / 55.2* / 66.9 | 60.0 / 55.2* / 100^ | 12.0 / 20.1 / 20.1 | 55.0 / 55.2* / 92.0 |
| full ring | UTG call-3-bet (3.62) | 16.5 / 3.6 / 3.6 | 22.0 / 4.8 / 4.8 | 40.0 / 7.2* / 8.8 | 60.0 / 7.2* / 13.2 | 12.0 / 2.6 / 2.6 | 55.0 / 7.2* / 12.1 |
| full ring | BTN call-3-bet (12.52) | 16.5 / 12.5 / 12.5 | 22.0 / 16.7 / 16.7 | 40.0 / 25.0* / 30.3 | 60.0 / 25.0* / 45.5 | 12.0 / 9.1 / 9.1 | 55.0 / 25.0* / 41.7 |
| full ring | BB call-3-bet (9.35) | 16.5 / 9.4 / 9.4 | 22.0 / 12.5 / 12.5 | 40.0 / 18.7* / 22.7 | 60.0 / 18.7* / 34.0 | 12.0 / 6.8 / 6.8 | 55.0 / 18.7* / 31.2 |

Where the caps bind:
- **C's 2 × d cap** binds whenever VPIP is more than twice the typical VPIP: at 6-max from VPIP 48 (60/45 and
  55/6 on every calling line), at full ring from VPIP 33 (40/30 already), and never at heads-up for any
  profile up to 85 (max ratio 85 ÷ 77.5 = 1.10). Under C every loose full-ring player looks the same on calling
  lines (40/30, 60/45 and 55/6 all get 2 × d).
- **D's 100 cap** binds only on the two widest blind lines: 6-max SB limp (VPIP ≥ 53.8) and BB call-raise
  (VPIP ≥ 57.9), full-ring SB limp (VPIP ≥ 44.7) and BB call-raise (VPIP ≥ 59.8). Everywhere else D stays
  below 100 for every profile measured. This is the "BB call-raise at 60/45 → 100%" case the task names:
  41.48 × 60 ÷ 24 = 103.7, capped at 100.
- At fewer hands the blend softens both: a 60/45 player seen for 50 hands gets 6-max BB call-raise
  41.48 + (100 − 41.48) × 0.5 = 70.7 under D.

Other facts:
- **Golden spots.** The 4 observed spots in `tests/golden/postflop-spots.json` (lines 277, 799, 828, 1181) are
  all on lines this decision touches. Width now → under the ratio rules:

  | Spot | Size, seat, line | n | VPIP/PFR | d | now (A) | B | C / D |
  |---|---|---|---|---|---|---|---|
  | `6max-flop-btn-raise-a8s` | 6-max BB call-raise | 45 | 41/12 | 41.48 | 41.26 | 41.26 | 54.70 |
  | `6max-turn-bb-call-a6s` | 6-max BTN open-raise | 100 | 22/18 | 34.54 | 18.00 | 34.54 | 34.54 |
  | `6max-turn-btn-fold-55` | 6-max CO open-raise | 80 | 19/15 | 23.53 | 16.71 | 20.39 | 20.39 |
  | `6max-river-bb-bet-aks` | 6-max UTG call-three-bet | 60 | 34/27 | 9.65 | 24.26 | 24.26 | 12.07 |

  (C's cap does not bind for any spot: 41 ÷ 24 and 34 ÷ 24 are below 2.) Whether each still agrees and is
  clear-cut must be re-verified in the follow-up (`tests/golden/postflop.acceptance.test.ts`).
- **Locked tests pinning the raw rule** (owner task), and what B / C / D do to them:
  - `tests/advice/observed-ranges.acceptance.test.ts` AC#2 (`:117-155`, TASK-7.13) asserts o = raw `pfr` for an
    open-raiser and raw `vpip` for a caller: breaks the open half under B, both halves under C/D. AC#5
    (formula numbers, `:191-196`) and AC#6 (width 0 → AA, `:198-212`) survive every option (d × 0 = 0).
  - `tests/advice/observed-reraise.acceptance.test.ts` AC#4 (`:186-213`, TASK-7.44) "open-raise keeps raw PFR
    and calling lines raw VPIP" and AC#5 (`:216-240`, golden spots on untouched lines): break under B, C, D
    (B only the open-raise cases and spots).
  - `tests/advice/observed-resize.acceptance.test.ts` (TASK-7.43): AC#1 (`:107-128`) sets `pfr` and `vpip` to
    the default widths to hit width = d, breaks for the raiser under B and for both under C/D. AC#2
    (`:130-159`, CO caller at VPIP 60 and 100 → all 169 classes) breaks under C/D (VPIP 100 gives 69.75 under
    D, 33.48 under C). AC#3 (`:161-195`): the PFR 5 narrow case breaks under B/C/D; the PFR 0 and VPIP 0
    floor cases survive.
  - `tests/advice/observed-range-tidy.acceptance.test.ts` AC#1 (`:82-98`, TASK-7.30, PFR 0 → width 0) survives
    every option.
  - Relational locked tests (determinism, hinted, hint-worker, hint, decision-record, observed-resume;
    TASK-7.29 §3) compare with `recommend(...)` for the same snapshot and survive.
  - Unlocked: `tests/advice/observed-ranges.test.ts` "scales each line by its stat" and the new `TYPICAL_VPIP`
    drift test next to the `TYPICAL_PFR` one (`:311-321`).
  - Docs: `docs/advice/range-model.md` stat table (`:322-327`), the typical-PFR paragraph (`:329-334`) and
    "Known limits" (`:355-358`).
- **Who is affected.** Only the user's hint, decision record and review pass a snapshot; stored hand records
  keep the grade computed at decision time (TASK-7.29 §3), so a change affects new decisions only and rewrites
  no stored data.
- Existing code to reuse (for the follow-up, not this task):
  - `src/advice/ranges.ts` `relativePfrPct` (`:365-367`) → already the generic `min(100, d × stat ÷ typical)`;
    reuse (or rename) it for open-raise and VPIP lines. Add the 2 × d cap only under C.
  - `TYPICAL_PFR` / `typicalPfr` (`:354-362`) → pattern for `TYPICAL_VPIP` / `typicalVpip` (A-4).
  - `OBSERVED_LINE_STAT` (`:622-630`) → the only map to change.
  - `tests/advice/observed-ranges.test.ts:311-321` → copy for the VPIP drift test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Open-raise uses o = min(100, d × observed PFR ÷ typical PFR); `limp`, `call-raise` and `call-three-bet` use o = min(100, d × observed VPIP ÷ typical VPIP). Three-bet/four-bet (TASK-7.44), the blend, the 30-hand threshold and the resize rule are unchanged. | (A) keep raw; (B) ratio for open-raise only; (C) ratio for both with calling capped at 2 × d; PFR ratio on calling lines (reads a 55/6 station as tight); a new cold-call stat (persisted-format change) | A typical player keeps every authored range at every size; position survives (BTN stays wider than UTG); one rule for all six scaled lines with one cap; the 100 cap binds only on the widest blind lines (6-max SB limp from VPIP 53.8, BB call-raise from 57.9; full-ring SB limp from 44.7, BB call-raise from 59.8). | yes | user (Q-1) |
| D-2 | This task records the decision and the REQ change; code, constants, docs and test re-pins go to one follow-up story. | Implement in this spike | Spike scope (task labels); TASK-7.29 D-5 pattern | no | n/a (task text) |
| D-3 | Typical VPIP is the healthy VPIP midpoint per size (A-4): 77.5 / 24 / 16.5. | Fixed number; default width | Same source as typical PFR | no | n/a (A-4) |

## 5. Design

### Files to create / modify
- `dreams/limit-holdem-trainer/requirements.md` — replace the REQ-035.6 line (line 646) and append changelog
  row 1.18 after line 1377, with the exact text below (SPEC-02).

### Components, interfaces and data
None changed in this task (D-2).

### Requirement text (SPEC-02, exact)
- REQ-035.6, line 646, becomes:
  `  - REQ-035.6: Observed-statistics scaling uses width = d + (o − d) × min(n, 100) ÷ 100, where d is the default range width and n is the number of observed hands; o is d × observed PFR ÷ typical PFR for raising ranges (open-raise, three-bet and four-bet) and d × observed VPIP ÷ typical VPIP for calling ranges (limp, call-raise and call-three-bet), each at most 100, where typical PFR and typical VPIP are the midpoints of the healthy PFR and VPIP ranges for the table size (REQ-046.1).`
- New last line of the changelog table, after line 1377 (date = build day, A-3):
  `| 1.18 | 2026-11-27 | TASK-7.45: REQ-035.6 scales observed open-raise ranges by PFR relative to the typical PFR and calling ranges by VPIP relative to the typical VPIP for the table size, instead of by raw PFR and VPIP | User (TASK-7.45 Q-1) |`

### Follow-up story (created by the orchestrator at finish; SPEC-04)
Command: `backlog task create "<title>" -p TASK-7 -l dream-limit-holdem-trainer,follow-up -m m-1 --priority
Medium --type enhancement --ref doit/TASK-7.45/spec.md --ref dreams/limit-holdem-trainer/requirements.md --doc
doc-104 -d "<description>" --ac "<AC>" ... --dep TASK-7.45 --plain`, each AC its own `--ac`.

- Title: `Scale observed open-raise and calling ranges by PFR and VPIP relative to a typical player`
- Description: "Follow-up from TASK-7.45 (decision-8: Q-1 D). Today open-raise scales toward raw PFR and limp,
  call-raise and call-three-bet toward raw VPIP, so even a typical 6-max 24/18 player's BTN open goes 34.54% to
  18% and SB limp 44.65% to 24%, and a typical heads-up caller's BTN call-raise goes 11.76% to 77.5%. Apply
  REQ-035.6 as reworded by TASK-7.45: open-raise o = min(100, d x PFR / typical PFR); calling lines o =
  min(100, d x VPIP / typical VPIP); typical VPIP = healthy VPIP midpoint (heads-up 77.5, 6-max 24, full ring
  16.5) as a TYPICAL_VPIP constant in src/advice/ranges.ts with a drift test like TYPICAL_PFR (advice may not
  import src/stats). Change OBSERVED_LINE_STAT; reuse relativePfrPct (generic min(100, d x stat / typical)).
  Blend formula, 30-hand threshold, resize rule and re-raise rule unchanged. Locked re-pins, each unlocked and
  re-pinned under its owner with the edit listed in the task notes: tests/advice/observed-ranges.acceptance.test.ts
  AC#2 (owner TASK-7.13; asserts raw pfr/vpip); tests/advice/observed-resize.acceptance.test.ts AC#1 (stats set
  to the default widths), AC#2 (CO caller at VPIP 60 and VPIP 100 = all 169 classes; under the new rule VPIP 100
  gives 69.75) and the PFR-5 narrow case of AC#3 (owner TASK-7.43); tests/advice/observed-reraise.acceptance.test.ts
  AC#4 (open-raise raw PFR, calling raw VPIP) and AC#5 (golden spots on untouched lines) (owner TASK-7.44). Must
  pass unchanged: observed-ranges AC#5 and AC#6, observed-range-tidy AC#1 (TASK-7.30), the PFR 0 / VPIP 0 floor
  cases of observed-resize AC#3. Re-verify (and re-tune with sign-off if needed) the 4 observed golden postflop
  spots in tests/golden/postflop-spots.json (lines 277, 799, 828, 1181), whose opponent widths change:
  6max-flop-btn-raise-a8s BB call-raise 41.26 to 54.70; 6max-turn-bb-call-a6s BTN open-raise 18.00 to 34.54;
  6max-turn-btn-fold-55 CO open-raise 16.71 to 20.39; 6max-river-bb-bet-aks UTG call-three-bet 24.26 to 12.07.
  Expected values: doit/TASK-7.45/spec.md section 3."
- ACs:
  1. `Given a 6-max BTN open-raiser seen for 100 hands, When the range is estimated, Then the width is 34.54% at PFR 18 (the default), 86.35% at PFR 45 and 17.27% at PFR 9, each within 0.01`
  2. `Given a 6-max BB call-raise opponent seen for 100 hands, When the range is estimated, Then the width is 41.48% at VPIP 24 (the default), 69.13% at VPIP 40, 20.74% at VPIP 12 and 100% at VPIP 60 (capped), each within 0.01`
  3. `Given heads-up and full-ring tables, When an open-raise or calling range is scaled, Then typical PFR is 57.5 and 12.5 and typical VPIP is 77.5 and 16.5, so a heads-up BTN call-raise at VPIP 77.5 keeps 11.76% and a full-ring BB call-raise at VPIP 33 gives 55.20%, each within 0.01`
  4. `Given TYPICAL_VPIP in src/advice/ranges.ts, When the unit tests run, Then it equals the midpoint of each healthy VPIP range in src/stats/healthy-ranges.json (77.5, 24, 16.5)`
  5. `Given the locked observed-ranges AC#2 (TASK-7.13), observed-resize AC#1, AC#2 and AC#3 (TASK-7.43) and observed-reraise AC#4 and AC#5 (TASK-7.44), When the rule changes, Then each is unlocked and re-pinned under its owner to the relative rule with the edits listed in the task notes, and observed-ranges AC#5, AC#6 and observed-range-tidy AC#1 pass unchanged`
  6. `Given the 4 observed golden postflop spots (6max-flop-btn-raise-a8s, 6max-turn-bb-call-a6s, 6max-turn-btn-fold-55, 6max-river-bb-bet-aks), When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-tuned and re-justified with the user's sign-off`
  7. `Given docs/advice/range-model.md, When the story is done, Then its line-to-stat table, typical-player paragraph and Known limits state the relative rule for open-raise and calling lines`

### Rules and algorithms
- Calling, worked: 6-max BB call-raise, d = 41.478, VPIP 40, n = 100: o = min(100, 41.478 × 40 ÷ 24) = 69.13,
  width 69.13. VPIP 60: 41.478 × 60 ÷ 24 = 103.70 → o = 100. At n = 50 and VPIP 60: 41.48 + (100 − 41.48) × 0.5
  = 70.74.
- Open-raise, worked: 6-max BTN, d = 34.540, PFR 45, n = 100: o = 34.540 × 45 ÷ 18 = 86.35; at n = 50: 60.44.

### Error handling and configuration
N/A. No code changes in this task.

## 6. Behaviour specification

### SPEC-01: The user's choice is a Backlog decision
- Verifies: AC#1
- Behaviour: Given Q-1 D, When the orchestrator runs
  `backlog decision create "Observed-opponent ranges: scale open-raise by PFR relative to typical PFR and calling lines by VPIP relative to typical VPIP, capped at 100 (TASK-7.45 Q-1)" -s accepted --plain`
  (A-1), Then `backlog decision list --plain` shows that decision (expected decision-8) with status accepted.
- Verification: command `backlog decision list --plain`

### SPEC-02: REQ-035.6 carries the chosen rule
- Verifies: AC#1
- Behaviour: Given Q-1 D, When the build edits `requirements.md`, Then the REQ-035.6 line reads exactly as in
  §5 "Requirement text", row 1.18 with that exact text is the changelog's last row, and no other line changes
  (diff: 1 line changed, 1 added; REQ-035.2 untouched).
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: No product code changes and the evidence is on the task
- Verifies: AC#1
- Behaviour: Given the decision, When the task is done, Then no file under `src`, `tests`, `tools`, `e2e` or
  `docs` has changed (D-2), and TASK-7.45's implementation notes (`backlog task edit TASK-7.45
  --append-notes`) state the Q-1 D answer and the key numbers: typical 6-max BTN open 34.54 → 18.0 and SB limp
  44.65 → 24.0 under today's rule; heads-up BTN call-raise 11.76 → 77.5; under D the typical player keeps the
  defaults, and the 100 cap binds only on SB limp and BB call-raise for VPIP ≥ about 45–60. They point to this
  spec's §3.
- Verification: command `git diff --stat main -- src tests tools e2e docs`

### SPEC-04: The change becomes one follow-up story with re-pinned expectations
- Verifies: AC#1
- Behaviour: Given Q-1 D, When the orchestrator creates the story exactly as in §5 "Follow-up story" (title,
  description, ACs, labels, milestone, references, dependency), Then `backlog task list --parent TASK-7 --plain`
  lists it, it depends on TASK-7.45, its ACs pin the exact widths from §5, and its description names every
  locked re-pin with its owner (TASK-7.13, TASK-7.43, TASK-7.44) and the 4 golden spots with their new widths.
- Verification: command `backlog task list --parent TASK-7 --plain`

### SPEC-05: AC#1 is ticked with pointers
- Verifies: AC#1
- Behaviour: Given SPEC-01 to SPEC-04, When the task finishes, Then the orchestrator checks AC#1 (`backlog task
  edit TASK-7.45 --check-ac 1`), and the final summary cites the decision id, the follow-up story id and the
  REQ-035.6 change (changelog 1.18).
- Verification: command `backlog task view TASK-7.45 --plain`

## 7. Edge cases
- Cap at 100: measured and listed in §3 "Where the caps bind" for the follow-up's tests.
- PFR 0 / VPIP 0: the ratio gives o = 0, so the AA / strongest-class floor tests (observed-ranges AC#6,
  observed-range-tidy AC#1, observed-resize AC#3 floors) survive.
- Fewer than 100 hands: the unchanged blend applies (worked example in §5).
- 3 to 7 seats use 6-max and 8 to 10 full ring via `rangesFor` (`src/advice/ranges.ts:241-244`), so the typical
  values follow the reference size.
- Other cases (input, concurrency, permissions): N/A. No code runs.

## 8. Security considerations
N/A. No code, input, dependency, persisted-format or randomness change, here or in the follow-up (typical VPIP
is a copy of existing authored data).

## 9. Non-functional
N/A for this task. The follow-up adds one multiply and one lookup per scaled opponent; no measurable cost.

## 10. Test plan
- Test command: `npm test` (unchanged by this task; nothing under src/tests changes)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing behaviour changes in this spike; the evidence is reproduced with the
  functions cited in §3.
- New tests: none. SPEC-01, SPEC-04 and SPEC-05 are orchestrator CLI steps; SPEC-02 and SPEC-03 are diffs. For
  the Judge: confirm from `src/advice/ranges/six-max.json` via `rangeWidthPct(defaultRange(SIX_MAX_RANGES, …))`
  that BTN open-raise is 34.54 and BB call-raise 41.48; that 34.54 × 45 ÷ 18 = 86.35 and 41.48 × 60 ÷ 24 =
  103.7 (→ 100); and the healthy VPIP midpoints 77.5 / 24 / 16.5 from `src/stats/healthy-ranges.json`. Then
  check SPEC-01 to SPEC-05.

## 11. Open questions
None. Q-1 was answered on 2026-11-27 (`doit/TASK-7.45/qa.md`: D) and is folded into D-1, §5 and SPEC-01 to
SPEC-05.

## 12. Clarifications log
See `doit/TASK-7.45/qa.md`.
