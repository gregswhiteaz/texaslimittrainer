# TASK-7.40 sign-off package

Base for "before": commit e8005a62 (`npm run chart:print 6-max` on the base, 26 spots). "After": the final chart (32 spots).

## 1. chart:print blocks of the 12 spots

```
UTG re-raise-not-mine: raise 2.6%, continue 4.2%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C*/R F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C*/F F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We limped, then a raise and a re-raise came behind us, so two players have shown strong hands and none of the raises is ours. We keep only the top of the range that continues against a single raise over our limp. Aces, kings, queens and ace-king raise; jacks call but are close to a raise; tens, nines and ace-queen suited call, with nines close to a fold. Everything else folds, including ace-jack suited and king-queen suited, which call a single raise. If a fourth bet has already capped the betting, a raise becomes a call.
```

```
HJ re-raise-not-mine: raise 2.6%, continue 4.5%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C*/F F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C*/R F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C*/F F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: either we limped and a raise and a re-raise followed, or we called the under-the-gun open and a re-raise followed. Both raisers have shown strong hands, so we keep only the top of the range that continues against one raise. Aces, kings, queens and ace-king raise; jacks call but are close to a raise; tens, nines, ace-queen suited and ace-jack suited call, with nines and ace-jack suited close to a fold. Everything else folds, including the smaller pairs and king-queen suited. If a fourth bet has already capped the betting, a raise becomes a call.
```

```
CO re-raise-not-mine: raise 2.6%, continue 5.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C*/F F    F    F    F    F    F    F    F    F
K    R    R    C*/F F    F    F    F    F    F    F    F    F    F
Q    C*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C*/R F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F*/C F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: an earlier player opened and another re-raised before us, or we limped or called an open and a re-raise followed. Both raisers have shown strong hands, so we keep only the top of the range that continues against one raise. Aces, kings, queens and ace-king raise; jacks call but are close to a raise; tens, nines and ace-queen suited call, and ace-jack suited, king-queen suited and ace-queen offsuit call but are close to a fold. Eights are close to a call; everything else folds, including ace-jack offsuit and every weaker offsuit ace. If a fourth bet has already capped the betting, a raise becomes a call.
```

```
BTN re-raise-not-mine: raise 2.6%, continue 7.1%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C*/F F    F    F    F    F    F    F    F
K    R    R    C    C*/F F    F    F    F    F    F    F    F    F
Q    C    F    R    C*/F F    F    F    F    F    F    F    F    F
J    F*/C F    F    C*/R F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F*/C F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: an earlier player opened and another re-raised before us, or we limped or called an open and a re-raise followed. We will act last on every later street, which lets us keep a few more hands than earlier seats, but both raisers have shown strong hands. Aces, kings, queens and ace-king raise; jacks call but are close to a raise; tens down to eights, ace-queen and ace-jack suited, king-queen suited and ace-queen offsuit call, and ace-ten, king-jack and queen-jack suited call but are close to a fold. Sevens and ace-jack offsuit are close to a call; everything else folds. If a fourth bet has already capped the betting, a raise becomes a call.
```

```
SB re-raise-not-mine: raise 2.6%, continue 5.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C*/F F    F    F    F    F    F    F    F    F
K    R    R    F*/C F    F    F    F    F    F    F    F    F    F
Q    C*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C*/R F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    F*/C F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: an open and a re-raise came before us, or we completed or called and two raises followed. We will be out of position for the rest of the hand, and when both raises came before us the big blind can still act behind us. Aces, kings, queens and ace-king raise; jacks call but are close to a raise; tens and ace-queen suited call, and ace-jack suited and ace-queen offsuit call but are close to a fold. Nines and king-queen suited are close to a call; everything else folds. If a fourth bet has already capped the betting, a raise becomes a call.
```

```
BB re-raise-not-mine: raise 2.6%, continue 8.4%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    F    F    F    F    F    F    F    F
K    R    R    C    C    F    F    F    F    F    F    F    F    F
Q    C    F*/C R    C    F    F    F    F    F    F    F    F    F
J    C*/F F    F    C*/R F*/C F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F*/C F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: usually one player opened and another re-raised before the action reached us, or we called a raise and a player who had limped then re-raised. Our blind is already in, so the price is better than in other seats, but both raisers have shown strong hands and we will act first or second on every later street. We continue only with hands that defend against a single raise, and far fewer of them. Aces, kings, queens and ace-king raise; jacks call but are close to a raise; tens down to sevens, ace-queen, ace-jack and ace-ten suited, king-queen, king-jack and queen-jack suited and ace-queen offsuit call, and ace-jack offsuit calls but is close to a fold. Sixes, jack-ten suited and king-queen offsuit are close to a call; everything else folds. If a fourth bet has already capped the betting, a raise becomes a call.
```

```
UTG re-raise: raise 2.6%, continue 14.2%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C*/F F    F    F    F    F    F    F
Q    C    C*/F R    C    C    F    F    F    F    F    F    F    F
J    C*/F F*/C F    C*/R C    F    F    F    F    F    F    F    F
T    F*/C F    F    F    C    C    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    C*/F F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Our open has been re-raised, so the pot is already large and we need to call only one more bet. We therefore keep most of the hands we opened: every pair down to fives, every suited ace, the suited kings and queens we opened, jack-ten and ten-nine suited, ace-king to ace-jack offsuit and king-queen offsuit. Only premium hands raise again: aces, kings, queens and ace-king, with jacks close to a raise. Ace-ten and king-jack offsuit fold because a re-raiser often dominates them. The same advice applies when a fourth bet comes after our own raise or re-raise; the betting is then capped, so a raise becomes a call.
```

```
HJ re-raise: raise 2.6%, continue 16.4%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C*/F F    F    F    F    F    F    F
Q    C    C    R    C    C    C*/F F    F    F    F    F    F    F
J    C    F*/C F    C*/R C    C*/F F    F    F    F    F    F    F
T    C*/F F    F    F    C    C    F    F    F    F    F    F    F
9    F    F    F    F    F    C    C*/F F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C*/F F    F    F
4    F    F    F    F    F    F    F    F    F    F    C*/F F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Our open, or our raise over a limper, has been re-raised, so the pot is already large and we need to call only one more bet. We therefore keep most of the hands we opened: every pair down to fours, every suited hand we opened, ace-king to ace-ten offsuit and king-queen offsuit. Only premium hands raise again: aces, kings, queens and ace-king, with jacks close to a raise. King-jack, queen-jack and ace-nine offsuit fold because a re-raiser often dominates them. The same advice applies when a fourth bet comes after our own raise or re-raise; the betting is then capped, so a raise becomes a call.
```

```
CO re-raise: raise 2.6%, continue 23.4%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C*/R C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C*/F C*/F F    F    F    F    F
Q    C    C    R    C    C    C    C*/F F    F    F    F    F    F
J    C    C    C*/F C*/R C    C    C*/F F    F    F    F    F    F
T    C    C*/F F*/C F    C    C    C*/F F    F    F    F    F    F
9    C*/F F    F    F    F    C    C    C*/F F    F    F    F    F
8    F    F    F    F    F    F    C    C    F    F    F    F    F
7    F    F    F    F    F    F    F    C    C*/F F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    C*/F F    F
3    F    F    F    F    F    F    F    F    F    F    F    C*/F F
2    F    F    F    F    F    F    F    F    F    F    F    F    C*/F
Why: Our open, or our raise over a limper, has been re-raised, so the pot is already large and we need to call only one more bet, and a re-raise against a cut-off open is often aimed at a steal. We therefore keep most of the hands we opened: every pair, every suited hand we opened, ace-king to ace-ten offsuit and king-queen, king-jack, king-ten and queen-jack offsuit. Only premium hands raise again: aces, kings, queens and ace-king, with jacks and ace-queen suited close to a raise. Ace-nine offsuit calls but is close to a fold; queen-ten, jack-ten and ace-eight or worse offsuit fold. The same advice applies when a fourth bet comes after our own raise or re-raise; the betting is then capped, so a raise becomes a call.
```

```
BTN re-raise: raise 3.3%, continue 34.2%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R*/C C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    C*/F C*/F C*/F C*/F
Q    C    C    R    C    C    C    C    C    C*/F C*/F F    F    F
J    C    C    C    R*/C C    C    C    C*/F F    F    F    F    F
T    C    C    C    C    C    C    C    C*/F F    F    F    F    F
9    C    C*/F F    F    F    C    C    C    C*/F F    F    F    F
8    C    F*/C F    F    F    F    C    C    C    F    F    F    F
7    C    F    F    F    F    F    F    C    C    C*/F F    F    F
6    C    F    F    F    F    F    F    F    C    C    F    F    F
5    C*/F F    F    F    F    F    F    F    F    C    C*/F F    F
4    F*/C F    F    F    F    F    F    F    F    F    C    F    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C*/F
Why: Our open, or our raise over a limper, has been re-raised, usually by a blind fighting our steal, so the pot is already large, we need to call only one more bet and we will have position for the rest of the hand. We therefore keep most of the hands we opened: every pair, every suited hand we opened, every offsuit broadway, ace-five offsuit or better and king-nine offsuit. Only premium hands raise again: aces, kings, queens and ace-king, plus jacks and ace-queen suited, which may also just call. The weakest offsuit steals fold: ace-four or worse, king-eight, queen-nine, jack-nine and ten-nine. The same advice applies when a fourth bet comes after our own raise or re-raise; the betting is then capped, so a raise becomes a call.
```

```
SB re-raise: raise 2.6%, continue 27.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C*/F C*/F C*/F C*/F C*/F C*/F
Q    C    C    R    C    C    C    C*/F F    F    F    F    F    F
J    C    C    C*/F C*/R C    C    C*/F F    F    F    F    F    F
T    C    C    C*/F C*/F C    C    C*/F F    F    F    F    F    F
9    C    F*/C F    F    F    C    C*/F F    F    F    F    F    F
8    C*/F F    F    F    F    F    C    C*/F F    F    F    F    F
7    F*/C F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    C*/F F    F
3    F    F    F    F    F    F    F    F    F    F    F    C*/F F
2    F    F    F    F    F    F    F    F    F    F    F    F    C*/F
Why: Usually we raised, first in or over limpers, and the big blind or a limper re-raised, so the pot is large and we need only one more bet, though we will be out of position for the rest of the hand. We still keep most of the hands we raised with: every pair, every suited hand we raised with, ace-king down to ace-eight offsuit and the offsuit broadways. Only premium hands raise again: aces, kings, queens and ace-king, with jacks close to a raise. Ace-seven to ace-five and king-nine offsuit fold, as does any hand we would only complete with. The same advice applies when a fourth bet comes after our own raise or re-raise; the betting is then capped, so a raise becomes a call.
```

```
BB re-raise: raise 2.6%, continue 10.4%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    F    F    F    F    F    F    F    F
K    R    R    C    C    F    F    F    F    F    F    F    F    F
Q    C    C*/F R    C    F    F    F    F    F    F    F    F    F
J    C*/F F    F    C*/R C    F    F    F    F    F    F    F    F
T    F    F    F    F    C    C*/F F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    F*/C F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Usually we raised the limpers or a completed small blind, or re-raised a single raiser, and someone raised again. Our blind and our raise are already in, so the price for one more bet is good, but we will act first or second on every later street. We keep every hand we raised with and add a few that play well in a big pot: sixes, jack-ten suited and ten-nine suited. Only premium hands raise again: aces, kings, queens and ace-king, with jacks close to a raise. Everything else folds, mainly offsuit hands that are dominated and hard to play out of position. The same advice applies when a fourth bet comes after our own raise or re-raise; the betting is then capped, so a raise becomes a call.
```

## 2. Changed `re-raise` cells

| spot | hand | before | after |
|---|---|---|---|
| CO re-raise | A9o | F | C*/F |

The six `re-raise` "Why:" texts were rewritten so they cover only own-raise routes (spec SPEC-05).

## 3. Own-raise shares (as printed by `tests/advice/six-max-chart.acceptance.test.ts`)

```
UTG: C/O = 188/212 (0.887)
HJ: C/O = 218/254 (0.858)
CO: C/O = 310/358 (0.866)
BTN: C/O = 454/538 (0.844)
SB: C/O = 358/406 (0.882)
BB: kept/raised = 124/124 (1.000)
```

BB: all 124 raised combos (BB limpers and BB blind-defence raises) still continue in `BB re-raise` (rule: at least 80%).

## 4. D-8 choice: CO A9o and A8o

- `CO re-raise` (own raise re-raised): A9o `C*/F` (was `F`). Our own open of A9o, re-raised, gets one more small bet at a good price, and the TASK-9.1 route no longer reads this spot.
- `CO re-raise` A8o `F` (unchanged): it is dominated more often, so it stays a fold.
- `CO re-raise-not-mine`: A9o `F`, A8o `F` (the Q-3 subset rule: `CO raise` folds both).

## 5. Not-my-raise widths beside the Q-3 bands

- `UTG re-raise-not-mine`: continue 4.2% (band 2–8%)
- `HJ re-raise-not-mine`: continue 4.5% (band 2–8%)
- `CO re-raise-not-mine`: continue 5.7% (band 2–8%)
- `BTN re-raise-not-mine`: continue 7.1% (band 2–8%)
- `SB re-raise-not-mine`: continue 5.0% (band 2–8%)
- `BB re-raise-not-mine`: continue 8.4% (band 4–16%)
