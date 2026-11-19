# Chart changes — TASK-7.19

Every spot whose grid or justification changed, compared with the chart before this task. Percentages are shares of 1,326 combos (raise = `R`; continue = `R` + `C`). "Continue added/removed" lists hands whose action moved between fold and call/raise; "Other token changes" lists cells that still continue (or still fold) but whose call/raise action, `*` flag or `/X` alternative changed.

## Re-raise shares (SPEC-02, SPEC-03)

| Spot | Continue / own raise-first range (combos) before | after |
|---|---|---|
| UTG re-raise | 128/212 (0.60) | 188/212 (0.887) |
| HJ re-raise | 138/254 (0.54) | 218/254 (0.858) |
| CO re-raise | 156/358 (0.44) | 298/358 (0.832) |
| BTN re-raise | 210/538 (0.39) | 454/538 (0.844) |
| SB re-raise | 92/406 (0.23) | 358/406 (0.882) |
| BB re-raise | 124/124 of hands BB raises with (1.00) | unchanged |

Only AA, KK, QQ, AKs and AKo are firm raises in every re-raise spot; BTN keeps JJ and AQs as `R*/C`, the others keep JJ as `C*/R` (CO also AQs).

Note: CO re-raise folds A9o and A8o. The locked `tests/table/review.acceptance.test.ts` (TASK-9.1, "calling then folding preflop…") expects Fold advice for A9o at CO after cold-calling an open and facing a re-raise, so A9o stays a fold there (and A8o with it, so it is not firmer than A9o).

## Chart-level justification

- Text changed (the "Facing a raise…" sentence now describes single raises and re-raises separately).

## HJ unopened

- Raise: 19.2% → 19.2%; continue: 19.2% → 19.2%
- Grid changed: no; text changed: yes

## BTN unopened

- Raise: 40.6% → 40.6%; continue: 40.6% → 40.6%
- Grid changed: yes; text changed: yes
- Continue added: none
- Continue removed: none
- Other token changes: 98o F*/R→F

## SB unopened

- Raise: 30.6% → 30.6%; continue: 37.3% → 37.3%
- Grid changed: yes; text changed: yes
- Continue added: none
- Continue removed: none
- Other token changes: K9o R*/F→R, 98o F*/C→F

## HJ limpers

- Raise: 9.4% → 9.4%; continue: 15.5% → 15.5%
- Grid changed: no; text changed: yes

## CO limpers

- Raise: 10.9% → 10.9%; continue: 17.6% → 17.6%
- Grid changed: no; text changed: yes

## BTN limpers

- Raise: 12.8% → 12.8%; continue: 19.2% → 19.2%
- Grid changed: no; text changed: yes

## SB limpers

- Raise: 6.2% → 6.2%; continue: 17.0% → 17.0%
- Grid changed: no; text changed: yes

## BB limpers

- Raise: 9.4% → 9.4%; continue: 100.0% → 100.0%
- Grid changed: no; text changed: yes

## UTG raise

- Raise: 3.3% → 3.3%; continue: 6.6% → 6.6%
- Grid changed: no; text changed: yes

## HJ raise

- Raise: 5.3% → 5.3%; continue: 6.6% → 6.6%
- Grid changed: no; text changed: yes

## CO raise

- Raise: 6.6% → 6.6%; continue: 8.4% → 8.4%
- Grid changed: no; text changed: yes

## BTN raise

- Raise: 8.9% → 8.9%; continue: 11.0% → 11.0%
- Grid changed: no; text changed: yes

## HJ raise-and-calls

- Raise: 3.3% → 3.3%; continue: 14.3% → 14.3%
- Grid changed: no; text changed: yes

## CO raise-and-calls

- Raise: 3.3% → 3.3%; continue: 13.4% → 13.4%
- Grid changed: no; text changed: yes

## BTN raise-and-calls

- Raise: 4.5% → 4.5%; continue: 16.1% → 16.1%
- Grid changed: no; text changed: yes

## UTG re-raise

- Raise: 2.6% → 2.6%; continue: 9.7% → 14.2%
- Grid changed: yes; text changed: yes
- Continue added: 55 (F→C*/F), 66 (F*/C→C*/F), A9s (F→C), A8s (F→C), A7s (F→C), A6s (F→C), A5s (F→C), A4s (F→C), A3s (F→C), A2s (F→C), KTs (F→C), K9s (F→C*/F), QTs (F→C), T9s (F→C)
- Continue removed: none
- Other token changes: 77 C*/F→C, KJo F→F*/C, ATo F→F*/C

## HJ re-raise

- Raise: 2.6% → 2.6%; continue: 10.4% → 16.4%
- Grid changed: yes; text changed: yes
- Continue added: 44 (F→C*/F), 55 (F→C*/F), A9s (F→C), A8s (F→C), A7s (F→C), A6s (F→C), A5s (F→C), A4s (F→C), A3s (F→C), A2s (F→C), KTs (F→C), K9s (F→C*/F), QTs (F→C), Q9s (F→C*/F), J9s (F→C*/F), ATo (F*/C→C*/F), 98s (F→C*/F)
- Continue removed: none
- Other token changes: 66 C*/F→C, KQo C*/F→C, KJo F→F*/C, T9s C*/F→C

## CO re-raise

- Raise: 2.6% → 2.6%; continue: 11.8% → 22.5%
- Grid changed: yes; text changed: yes
- Continue added: 22 (F→C*/F), 33 (F→C*/F), 44 (F→C*/F), A8s (F→C), A7s (F→C), A6s (F→C), A5s (F→C), A4s (F→C), A3s (F→C), A2s (F→C), K9s (F→C), K8s (F→C*/F), K7s (F→C*/F), Q9s (F→C), Q8s (F→C*/F), KJo (F*/C→C), QJo (F→C*/F), J9s (F→C), J8s (F→C*/F), ATo (F*/C→C), KTo (F→C*/F), T8s (F→C*/F), 98s (F→C), 97s (F→C*/F), 87s (F→C), 76s (F→C*/F)
- Continue removed: none
- Other token changes: 55 C*/F→C, A9s C*/F→C, QTo F→F*/C

## BTN re-raise

- Raise: 3.3% → 3.3%; continue: 15.8% → 34.2%
- Grid changed: yes; text changed: yes
- Continue added: A7s (F→C), A6s (F→C), A4s (F→C), A3s (F→C), A2s (F→C), K9s (F→C), K8s (F→C), K7s (F→C), K6s (F→C), K5s (F→C*/F), K4s (F→C*/F), K3s (F→C*/F), K2s (F→C*/F), Q9s (F→C), Q8s (F→C), Q7s (F→C), Q6s (F→C*/F), Q5s (F→C*/F), QJo (F→C), J9s (F→C), J8s (F→C), J7s (F→C*/F), KTo (F→C), QTo (F→C), JTo (F→C), T8s (F→C), T7s (F→C*/F), A9o (F→C), K9o (F→C*/F), 97s (F→C), 96s (F→C*/F), A8o (F→C), 87s (F*/C→C), 86s (F→C), A7o (F→C), 76s (F→C), 75s (F→C*/F), A6o (F→C), 65s (F→C), A5o (F→C*/F), 54s (F→C*/F)
- Continue removed: none
- Other token changes: A5s C*/F→C, KJo C*/F→C, ATo C*/F→C, K8o F→F*/C, A4o F→F*/C

## SB re-raise

- Raise: 2.6% → 2.6%; continue: 6.9% → 27.0%
- Grid changed: yes; text changed: yes
- Continue added: 22 (F→C*/F), 33 (F→C*/F), 44 (F→C*/F), 55 (F→C), 66 (F→C), A9s (F→C), A8s (F→C), A7s (F→C), A6s (F→C), A5s (F→C), A4s (F→C), A3s (F→C), A2s (F→C), KJs (F*/C→C), KTs (F→C), K9s (F→C), K8s (F→C), K7s (F→C*/F), K6s (F→C*/F), K5s (F→C*/F), K4s (F→C*/F), K3s (F→C*/F), K2s (F→C*/F), KQo (F→C), QJs (F→C), QTs (F→C), Q9s (F→C), Q8s (F→C*/F), AJo (F*/C→C), KJo (F→C), QJo (F→C*/F), JTs (F→C), J9s (F→C), J8s (F→C*/F), ATo (F→C), KTo (F→C), QTo (F→C*/F), JTo (F→C*/F), T9s (F→C), T8s (F→C*/F), A9o (F→C), 98s (F→C*/F), A8o (F→C*/F), 87s (F→C*/F)
- Continue removed: none
- Other token changes: 77 C*/F→C, ATs C*/F→C, K9o F→F*/C, A7o F→F*/C

## BB re-raise

- Raise: 2.6% → 2.6%; continue: 10.4% → 10.4%
- Grid changed: no; text changed: yes
- Sign-off tweak: "Our blind and our raise are already in" now reads "When we raised, our blind and our raise are already in", so it holds on the cold route (open and re-raise before BB acts).

## SB blind-defence

- Raise: 9.5% → 9.5%; continue: 10.7% → 10.7%
- Grid changed: no; text changed: yes
- Sign-off tweak: "out of position against two players" now reads "out of position against at least two players", which stays true when callers are already in.

## BB blind-defence

- Raise: 5.7% → 5.7%; continue: 43.6% → 46.3%
- Grid changed: yes; text changed: yes
- Continue added: K8o (F*/C→C), Q8o (F*/C→C), J8o (F→C), K7o (F→C*/F)
- Continue removed: 87o (C*/F→F*/C)
- Other token changes: K9o C*/F→C, Q7o F→F*/C, J7o F→F*/C, T7o F→F*/C, 97o F→F*/C, 76o F*/C→F

## Unchanged spots

- UTG unopened
- CO unopened
- UTG raise-and-calls
