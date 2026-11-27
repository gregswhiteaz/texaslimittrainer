---
id: TASK-7.48
title: >-
  Scale observed open-raise and calling ranges by PFR and VPIP relative to a
  typical player
status: To Do
assignee: []
created_date: '2026-11-27T20:52:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.45
references:
  - doit/TASK-7.45/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-104
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 277000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.45 (decision-8: Q-1 D). Today open-raise scales toward raw PFR and limp, call-raise and call-three-bet toward raw VPIP, so even a typical 6-max 24/18 player's BTN open goes 34.54% to 18% and SB limp 44.65% to 24%, and a typical heads-up caller's BTN call-raise goes 11.76% to 77.5%. Apply REQ-035.6 as reworded by TASK-7.45: open-raise o = min(100, d x PFR / typical PFR); calling lines o = min(100, d x VPIP / typical VPIP); typical VPIP = healthy VPIP midpoint (heads-up 77.5, 6-max 24, full ring 16.5) as a TYPICAL_VPIP constant in src/advice/ranges.ts with a drift test like TYPICAL_PFR (advice may not import src/stats). Change OBSERVED_LINE_STAT; reuse relativePfrPct (generic min(100, d x stat / typical)). Blend formula, 30-hand threshold, resize rule and re-raise rule unchanged. Locked re-pins, each unlocked and re-pinned under its owner with the edit listed in the task notes: tests/advice/observed-ranges.acceptance.test.ts AC#2 (owner TASK-7.13; asserts raw pfr/vpip); tests/advice/observed-resize.acceptance.test.ts AC#1 (stats set to the default widths), AC#2 (CO caller at VPIP 60 and VPIP 100 = all 169 classes; under the new rule VPIP 100 gives 69.75) and the PFR-5 narrow case of AC#3 (owner TASK-7.43); tests/advice/observed-reraise.acceptance.test.ts AC#4 (open-raise raw PFR, calling raw VPIP) and AC#5 (golden spots on untouched lines) (owner TASK-7.44). Must pass unchanged: observed-ranges AC#5 and AC#6, observed-range-tidy AC#1 (TASK-7.30), the PFR 0 / VPIP 0 floor cases of observed-resize AC#3. Re-verify (and re-tune with sign-off if needed) the 4 observed golden postflop spots in tests/golden/postflop-spots.json (lines 277, 799, 828, 1181), whose opponent widths change: 6max-flop-btn-raise-a8s BB call-raise 41.26 to 54.70; 6max-turn-bb-call-a6s BTN open-raise 18.00 to 34.54; 6max-turn-btn-fold-55 CO open-raise 16.71 to 20.39; 6max-river-bb-bet-aks UTG call-three-bet 24.26 to 12.07. Expected values: doit/TASK-7.45/spec.md section 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-max BTN open-raiser seen for 100 hands, When the range is estimated, Then the width is 34.54% at PFR 18 (the default), 86.35% at PFR 45 and 17.27% at PFR 9, each within 0.01
- [ ] #2 Given a 6-max BB call-raise opponent seen for 100 hands, When the range is estimated, Then the width is 41.48% at VPIP 24 (the default), 69.13% at VPIP 40, 20.74% at VPIP 12 and 100% at VPIP 60 (capped), each within 0.01
- [ ] #3 Given heads-up and full-ring tables, When an open-raise or calling range is scaled, Then typical PFR is 57.5 and 12.5 and typical VPIP is 77.5 and 16.5, so a heads-up BTN call-raise at VPIP 77.5 keeps 11.76% and a full-ring BB call-raise at VPIP 33 gives 55.20%, each within 0.01
- [ ] #4 Given TYPICAL_VPIP in src/advice/ranges.ts, When the unit tests run, Then it equals the midpoint of each healthy VPIP range in src/stats/healthy-ranges.json (77.5, 24, 16.5)
- [ ] #5 Given the locked observed-ranges AC#2 (TASK-7.13), observed-resize AC#1, AC#2 and AC#3 (TASK-7.43) and observed-reraise AC#4 and AC#5 (TASK-7.44), When the rule changes, Then each is unlocked and re-pinned under its owner to the relative rule with the edits listed in the task notes, and observed-ranges AC#5, AC#6 and observed-range-tidy AC#1 pass unchanged
- [ ] #6 Given the 4 observed golden postflop spots (6max-flop-btn-raise-a8s, 6max-turn-bb-call-a6s, 6max-turn-btn-fold-55, 6max-river-bb-bet-aks), When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-tuned and re-justified with the user's sign-off
- [ ] #7 Given docs/advice/range-model.md, When the story is done, Then its line-to-stat table, typical-player paragraph and Known limits state the relative rule for open-raise and calling lines
<!-- AC:END -->
