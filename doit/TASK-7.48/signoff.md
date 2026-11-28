# TASK-7.48 sign-off confirmation (SPEC-09)

Measured after the build (relative rule in `src/advice/ranges.ts`, re-tuned `tests/golden/postflop-spots.json`)
with `goldenPostflopAdvice` + `gradeDecision` via the probe
`/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t748/probe.ts`
(`ROOT=<repo> node --import ./tools/playtest/resolve-ts.js <probe>`).

## 6max-turn-bb-call-a6s (button stats hands 100, VPIP 12, PFR 9)

| Value | Expected (Q-1) | Measured | Match |
|---|---|---|---|
| BTN open-raise width | 17.27 | 17.27 | yes |
| Hero equity | 45.3 | 45.3 | yes |
| Raise: aggression margin (grade) | 19.7 (Major) | 19.7 (major) | yes |
| Fold: call/fold margin (grade) | 21.1 (Major) | 21.1 (major) | yes |
| Recommended action | call | call (grade correct) | yes |

Required equity 24.2, value threshold 65; the spot loads (clear-cut).

## Other observed spots (unchanged files, new rule)

- `6max-flop-btn-raise-a8s`: BB call-raise 54.70; recommends raise (agrees); call Major 17.9, fold Major 67.5. Clear-cut.
- `6max-turn-btn-fold-55`: CO open-raise 20.39; recommends fold (agrees); call Major 22.0, raise Major 22.0. Clear-cut.
- `6max-river-bb-bet-aks`: UTG call-three-bet 12.07; recommends bet (agrees); check Major 36.8. Clear-cut.

Result: MATCH
