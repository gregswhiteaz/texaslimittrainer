# Fix brief — TASK-7.42 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] src/advice/charts/six-max.json:bb-early-text-ako-listed-as-call (code review)
- Where: src/advice/charts/six-max.json:630
- Problem: The BB blind-defence-early justification says the hand re-raises with 'Jacks or better, ace-king and ace-queen suited', and then says 'offsuit aces down to ace-nine' call. In the grid AKo is R (row K, column A; raise 3.3% = AA KK QQ JJ AKs AQs AKo = 44 combos). So the text puts AKo in a call group although it raises. That breaks SPEC-04 'every hand or group named under an action has that action'.
- Evidence: chart:print 6-max: 'K    R    R    C ...' (AKo R, KK R, KQs C). Why: '... Jacks or better, ace-king and ace-queen suited re-raise. ... offsuit aces down to ace-nine ... call'.
- Expected fix: Text only, grid unchanged: 'Jacks or better, ace-king, ace-queen suited and ace-king offsuit re-raise.' and '... offsuit aces from ace-queen down to ace-nine ...'.

## 2. [MAJOR] src/advice/charts/full-ring.json:bb-early-text-ako-listed-as-call (code review)
- Where: src/advice/charts/full-ring.json:990
- Problem: This is the same text and grid mismatch as in six-max. The full-ring BB blind-defence-early grid raises AKo (row K, column A = R; raise 3.3%), but the text names only 'ace-king and ace-queen suited' as re-raises, and it puts AKo in the call group 'offsuit aces down to ace-nine'.
- Evidence: chart:print full-ring: 'K    R    R    C    C ...'. Why: 'Jacks or better, ace-king and ace-queen suited re-raise. ... offsuit aces down to ace-nine ...'.
- Expected fix: Text only: say AKo re-raises, and start the offsuit-ace call group at ace-queen.


## Also fix (orchestrator, from MINOR four-earliest-seats-false-at-ten)
Texts that count seats ("the four earliest seats", "the two earliest seats") are wrong at 7, 8 and 10 seats. In the full-ring chart-level text, the full-ring SB/BB early texts and the 6-max chart-level/early texts, name the positions instead (e.g. "under the gun to the lojack", "under the gun or the hijack") without counting seats. Text only; no grid changes. Keep signoff.md section 2 in step: write the refreshed chart:print blocks for the changed spots to /private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t742/signoff-text-changes.md (before/after for each changed text).
