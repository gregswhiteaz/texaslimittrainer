# TASK-7.41 sign-off package: full-ring re-raise split

## 1. Commits and chart-level text

- Base commit: `0db9c0c5a9458a08ce4e0f6342d393860c782e82`
- Final: the build changes on branch `doit/TASK-7.41` on top of `4dbc4ac6` (spec commit); the orchestrator records the build commit hash.

Before:

> A tight-aggressive plan for full-ring fixed-limit hold'em, with eight or nine opponents. With so many players still to act, someone often holds a strong hand, so we enter far fewer pots than at six-handed and the first positions are the tightest of all. The under-the-gun range is built to stay sound at both nine and ten seats, since a ten-handed table's two earliest seats both use it. First in, we raise or fold; only the small blind sometimes completes. Behind limpers we raise hands that beat a limping range and call with hands that win big pots when they hit, such as small pairs and suited aces. Facing a single raise we mostly re-raise or fold; callers in between give a better price for speculative hands. Once our own raise is re-raised we call with most of our range and raise again only with the very best hands. Overall the chart aims to play roughly 12 to 16 percent of hands voluntarily.

After:

> A tight-aggressive plan for full-ring fixed-limit hold'em, with eight or nine opponents. With so many players still to act, someone often holds a strong hand, so we enter far fewer pots than at six-handed and the first positions are the tightest of all. The under-the-gun range is built to stay sound at both nine and ten seats, since a ten-handed table's two earliest seats both use it. First in, we raise or fold; only the small blind sometimes completes. Behind limpers we raise hands that beat a limping range and call with hands that win big pots when they hit, such as small pairs and suited aces. Facing a single raise we mostly re-raise or fold; callers in between give a better price for speculative hands. Once our own raise is re-raised we call with most of our range and raise again only with the very best hands; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them. Overall the chart aims to play roughly 12 to 16 percent of hands voluntarily.

Only the "Once our own raise is re-raised..." sentence changed; it now ends "...; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them."

## 2. `npm run chart:print full-ring` blocks (verbatim)

Grid: rows and columns A..2; above the diagonal suited, below offsuit; `*` = borderline, `/X` = acceptable alternative.

### The 9 `re-raise-not-mine` spots (new)

```
UTG re-raise-not-mine: raise 2.6%, continue 3.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C*/F F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    F    F    F    F    F    F    F    F    F
9    F    F    F    F    F    F    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We limped or called, and the pot now holds two raises, neither of them ours. Two players have shown strong hands, so we keep only the very top of what continues against one raise. Queens or better and ace-king raise; jacks call, and ace-queen suited calls but is close to a fold. Tens, ace-queen offsuit and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
UTG+1 re-raise-not-mine: raise 2.6%, continue 3.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    F    F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    F    F    F    F    F    F    F    F    F
9    F    F    F    F    F    F    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Neither raise is ours: we limped or called and the pot was raised twice, or at ten seats both under-the-gun seats raised before us. Facing two strong ranges, we keep only the best hands that continue against one raise. Queens or better and ace-king raise, and jacks call. Tens, nines, ace-queen suited and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
MP re-raise-not-mine: raise 2.6%, continue 3.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C*/F F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    F    F    F    F    F    F    F    F    F
9    F    F    F    F    F    F    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: No raise is ours: an early player opened and another re-raised before us, or we limped or called and the pot was raised again behind us. Both raisers have strong ranges, so from the middle position we keep only the best hands that continue against one raise. Queens or better and ace-king raise; jacks call, and ace-queen suited calls but is close to a fold. Tens, ace-queen offsuit and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
LJ re-raise-not-mine: raise 2.6%, continue 3.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    C*/F F    F    F    F    F    F    F    F
9    F    F    F    F    F    F    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and we made neither: both came before us, or we limped or called and the pot was raised again behind us. From the lojack we keep only the strongest hands that continue against one raise. Queens or better and ace-king raise; jacks and ace-queen suited call, and tens call but are close to a fold. Nines, ace-queen offsuit and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
HJ re-raise-not-mine: raise 2.6%, continue 3.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    F    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We have not raised, yet two raises are in: an open and a re-raise came before us, or we limped or called and someone raised again behind us. With strong ranges against us, the hijack keeps only the top of the hands that continue against one raise. Queens or better and ace-king raise; jacks, tens and ace-queen suited call. Nines, ace-jack suited, ace-queen offsuit and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
CO re-raise-not-mine: raise 2.6%, continue 4.2%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    F    F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C*/F F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Neither raise in the pot is ours: both came before the cutoff, or we limped or called and a re-raise followed behind us. Two strong ranges are against us, so we keep only the best hands that continue against one raise. Queens or better and ace-king raise; jacks, tens and ace-queen suited call, and nines call but are close to a fold. Ace-jack suited, ace-queen offsuit, eights and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
BTN re-raise-not-mine: raise 2.6%, continue 5.4%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C*/F F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    C*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: both came before us, or we limped or called and a re-raise followed. The button acts last after the flop, which lets us keep a few more hands than earlier seats, but both ranges are strong. Queens or better and ace-king raise; jacks down to nines and ace-queen suited call, and ace-jack suited and ace-queen offsuit call but are close to a fold. Eights, king-queen suited and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
SB re-raise-not-mine: raise 2.6%, continue 4.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    F    F    F    F    F    F    F    F    F    F
K    R    R    F    F    F    F    F    F    F    F    F    F    F
Q    C*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    F    F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Two raises are in and none is ours: both came before us, or we completed or called and the pot was raised again. We will be out of position for the rest of the hand and the big blind may still act behind us, so we keep only the best of our blind-defence hands. Queens or better and ace-king raise; jacks, tens and ace-queen suited call, and ace-queen offsuit calls but is close to a fold. Nines, ace-jack suited and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

```
BB re-raise-not-mine: raise 2.6%, continue 6.6%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    F    F    F    F    F    F    F    F    F
K    R    R    C    F    F    F    F    F    F    F    F    F    F
Q    C*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    C    F    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C*/F F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: None of the raises is ours: an open and a re-raise came before the action reached us, or we called a raise and someone re-raised behind us. Our blind gives a better price than other seats, but both raisers are strong and we act first or second after the flop. Queens or better and ace-king raise; jacks down to eights, ace-queen, ace-jack and king-queen suited call, and sevens and ace-queen offsuit call but are close to a fold. Sixes, ace-ten suited and everything else fold. If a fourth bet is already in, the betting is capped and a raise is played as a call.
```

### The 9 `re-raise` spots (revised)

```
UTG re-raise: raise 2.6%, continue 7.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    F    F    F    F    F    F    F    F
K    R    R    C    C    F    F    F    F    F    F    F    F    F
Q    C    F    R    C    F    F    F    F    F    F    F    F    F
J    F*/C F    F    C    C    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F*/C F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We opened under the gun, or raised over a limper, and a later player re-raised us. Our first-in range is already narrow and one more bet is cheap, so we call with jacks down to sevens, ace-queen offsuit and the other suited hands we opened. Queens or better and ace-king raise again. Ace-jack offsuit and sixes, the edge of our open, fold, with both close to a call. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
UTG+1 re-raise: raise 2.6%, continue 9.4%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    F    F    F    F    F    F    F
K    R    R    C    C    C    F    F    F    F    F    F    F    F
Q    C    F    R    C    F    F    F    F    F    F    F    F    F
J    C    F    F    C    C    F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F*/C F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We raised from the second seat, first in or over a limper, and were re-raised. One more bet is cheap, so we call with sevens through jacks, the other suited aces and kings we opened, queen-jack and jack-ten suited, and ace-queen and ace-jack offsuit. Queens or better and ace-king raise again. King-queen offsuit and sixes fold, with sixes close to a call. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
MP re-raise: raise 2.6%, continue 11.5%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    F    F    C    F    F    F
K    R    R    C    C    C    F    F    F    F    F    F    F    F
Q    C    F    R    C    C    F    F    F    F    F    F    F    F
J    C    F    F    C    C    F    F    F    F    F    F    F    F
T    F    F    F    F    C    C    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F*/C F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Our middle-position raise, first in or over a limper, has been re-raised. With one more bet to call we keep most of the range: every pair from fives to jacks, the other suited aces, kings and broadway hands we opened, ten-nine suited, and ace-queen and ace-jack offsuit. Queens or better and ace-king raise again. King-queen and ace-ten offsuit fold because a re-raiser often has them beaten. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
LJ re-raise: raise 2.6%, continue 13.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    F    F
K    R    R    C    C    C    F    F    F    F    F    F    F    F
Q    C    C    R    C    C    F    F    F    F    F    F    F    F
J    C    F    F    C    C    F    F    F    F    F    F    F    F
T    F    F    F    F    C    C    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We opened from the lojack, or raised a limper, and a later seat re-raised. Calling one more bet keeps most of the range: fives through jacks, ace-queen suited down to ace-four suited, the suited kings and broadway hands we opened, ten-nine suited, and ace-queen, ace-jack and king-queen offsuit. Queens or better and ace-king raise again. Fours, ace-ten and king-jack offsuit fold, along with any hand we would not have opened. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
HJ re-raise: raise 2.6%, continue 15.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    F    F    F    F    F    F    F
Q    C    C    R    C    C    F    F    F    F    F    F    F    F
J    C    F    F    C    C    C    F    F    F    F    F    F    F
T    F    F    F    F    C    C    F    F    F    F    F    F    F
9    F    F    F    F    F    C    C    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: Our hijack raise, first in or over a limper, has been re-raised. For one more bet we call with threes through jacks, every other suited hand we opened, and ace-queen, ace-jack and king-queen offsuit. Queens or better and ace-king raise again. Ace-ten, king-jack and queen-jack offsuit fold, as do twos and any other hand we would not open. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
CO re-raise: raise 3.0%, continue 21.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    F    F    F    F    F    F
Q    C    C    R    C    C    C    F    F    F    F    F    F    F
J    C    C    C    R*/C C    C    F    F    F    F    F    F    F
T    C    C    F    F    C    C    F    F    F    F    F    F    F
9    F    F    F    F    F    C    C    F    F    F    F    F    F
8    F    F    F    F    F    F    C    C    F    F    F    F    F
7    F    F    F    F    F    F    F    C    C    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: Our cutoff raise, first in or over a limper, has been re-raised, often by a blind or the button fighting a steal. One more bet keeps most of the range in: we call with twos through tens, every other suited hand we opened, ace-queen down to ace-ten offsuit, and king-queen, king-jack, king-ten and queen-jack offsuit. Queens or better and ace-king raise again, and jacks are a close raise. Queen-ten, jack-ten, ace-nine and ace-eight offsuit fold. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
BTN re-raise: raise 3.3%, continue 31.5%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R*/C C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    F    F    F    F
Q    C    C    R    C    C    C    C    F    F    F    F    F    F
J    C    C    C    R    C    C    C    F    F    F    F    F    F
T    C    C    C    C    C    C    C    F    F    F    F    F    F
9    C    C    C    F    F    C    C    C    F    F    F    F    F
8    C    F    F    F    F    F    C    C    F    F    F    F    F
7    C    F    F    F    F    F    F    C    C    F    F    F    F
6    C    F    F    F    F    F    F    F    C    C    F    F    F
5    C    F    F    F    F    F    F    F    F    C    C    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: Our button raise, first in or over limpers, has been re-raised, usually by a blind fighting our steal, and we will have position for the rest of the hand. For one more bet we keep most of the opens: every pair, the suited hands we opened except king-five suited or worse, every offsuit broadway, ace-five offsuit or better, and king-nine and queen-nine offsuit. Jacks or better and ace-king raise again, and ace-queen suited is a close raise. King-five suited or worse, ace-four or worse, and jack-nine and ten-nine offsuit fold. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
SB re-raise: raise 3.0%, continue 21.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    F    F    F    F    F    F
Q    C    C    R    C    C    C    F    F    F    F    F    F    F
J    C    C    C    R*/C C    C    F    F    F    F    F    F    F
T    C    C    F    F    C    C    F    F    F    F    F    F    F
9    C    F    F    F    F    C    C    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C    F    F    F    F
5    F    F    F    F    F    F    F    F    F    C    F    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: We raised from the small blind, first in or over limpers, and the big blind or a limper re-raised. We will be out of position, but one more bet is cheap, so we keep most of our raises: every pair, the suited hands we raised with, ace-king down to ace-nine offsuit, and king-queen, king-jack, king-ten and queen-jack offsuit. Queens or better and ace-king raise again, and jacks are a close raise. Queen-ten, jack-ten and ace-eight or worse offsuit fold, along with any hand we would only complete. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

```
BB re-raise: raise 3.0%, continue 9.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    C    C    C    F    F    F    F    F    F    F    F
K    R    R    C    C    F    F    F    F    F    F    F    F    F
Q    C    C    R    C    F    F    F    F    F    F    F    F    F
J    C    F    F    R*/C F*/C F    F    F    F    F    F    F    F
T    F    F    F    F    C    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: We raised in the big blind, over limpers or a completed small blind, and someone raised again. Our blind and our raise are in, so one more bet is a good price, but we act first or second after the flop. We keep every hand we raised with, which is tens down to eights, ace-queen down to ace-ten suited, king-queen, king-jack and queen-jack suited, and ace-queen, ace-jack and king-queen offsuit, and add sevens, with sixes close to a fold. Queens or better and ace-king raise again, and jacks are a close raise. Jack-ten suited is close to a call; everything else folds. If we re-raised an open and a fourth bet followed, the betting is capped, so a raise becomes a call.
```

## 3. Changed cells in the 9 `re-raise` spots

| spot | hand | before | after |
|---|---|---|---|
| UTG+1 re-raise | KQo | C*/F | F |
| UTG+1 re-raise | 66 | C | F*/C |
| UTG+1 re-raise | 55 | F*/C | F |
| MP re-raise | KQo | C | F |
| MP re-raise | ATo | C*/F | F |
| LJ re-raise | A3s | C | F |
| LJ re-raise | A2s | C | F |
| LJ re-raise | KJo | C | F |
| LJ re-raise | J9s | C | F |
| LJ re-raise | ATo | C | F |
| LJ re-raise | 98s | C*/F | F |
| LJ re-raise | 44 | C | F |
| LJ re-raise | 33 | C*/F | F |
| HJ re-raise | Q9s | C | F |
| HJ re-raise | KJo | C | F |
| HJ re-raise | QJo | C | F |
| HJ re-raise | ATo | C | F |
| HJ re-raise | KTo | F*/C | F |
| HJ re-raise | A9o | C*/F | F |
| HJ re-raise | 22 | C | F |
| CO re-raise | Q8s | C | F |
| CO re-raise | J8s | C | F |
| CO re-raise | QTo | C | F |
| CO re-raise | JTo | C | F |
| CO re-raise | T8s | C | F |
| CO re-raise | A9o | C | F |
| CO re-raise | 97s | C | F |
| CO re-raise | A8o | C*/F | F |
| CO re-raise | 65s | C*/F | F |
| BTN re-raise | K7s | F | C |
| BTN re-raise | K6s | F | C |
| BTN re-raise | K9o | F*/C | C |
| BTN re-raise | Q9o | F | C |
| BTN re-raise | A7o | C*/F | C |
| BTN re-raise | A6o | F | C |
| BTN re-raise | A5o | F | C |
| BTN re-raise | 54s | F | C |
| SB re-raise | 87s | C*/F | F |

Spots with no grid change (text only): UTG re-raise, BB re-raise.

## 4. Own-raise shares (Q-1: 80-90% of the opening range, nothing outside it)

- UTG: C/O 104/122 (0.852) → 104/122 (0.852); outside-open continues removed: none
- UTG+1: C/O 142/142 (1.000) → 124/142 (0.873); outside-open continues removed: none
- MP: C/O 176/176 (1.000) → 152/176 (0.864); outside-open continues removed: none
- LJ: C/O 206/206 (1.000) → 176/206 (0.854); outside-open continues removed: A3s, A2s, J9s, 98s, 33
- HJ: C/O 244/244 (1.000) → 208/244 (0.852); outside-open continues removed: Q9s, A9o, 22
- CO: C/O 326/326 (1.000) → 278/326 (0.853); outside-open continues removed: Q8s, J8s, T8s, 97s, 65s
- BTN: C/O 358/494 (0.725) → 418/494 (0.846); outside-open continues removed: none
- SB: C/O 282/342 (0.825) → 282/342 (0.825); outside-open continues removed: 87s
- BB before: kept 118/118 raised combos; continue ⊆ BB blind-defence: True
- BB after: kept 118/118 raised combos; continue ⊆ BB blind-defence: True

C counts continue combos inside the open range (as in spec §3). BTN rises from 0.725 to the band: it now also continues with K9o, Q9o, A7o, A6o, A5o, K7s, K6s and 54s.

## 5. Not-mine widths (Q-2)

| spot | continue | Q-2 band | one-raise parent | parent width |
|---|---|---|---|---|
| UTG re-raise-not-mine | 3.3% (44 combos) | 2-8% | UTG raise | 4.7% (62 combos) |
| UTG+1 re-raise-not-mine | 3.0% (40 combos) | 2-8% | UTG+1 raise | 4.2% (56 combos) |
| MP re-raise-not-mine | 3.3% (44 combos) | 2-8% | MP raise | 5.1% (68 combos) |
| LJ re-raise-not-mine | 3.8% (50 combos) | 2-8% | LJ raise | 5.1% (68 combos) |
| HJ re-raise-not-mine | 3.8% (50 combos) | 2-8% | HJ raise | 5.7% (76 combos) |
| CO re-raise-not-mine | 4.2% (56 combos) | 2-8% | CO raise | 6.2% (82 combos) |
| BTN re-raise-not-mine | 5.4% (72 combos) | 2-8% | BTN raise | 8.1% (108 combos) |
| SB re-raise-not-mine | 4.7% (62 combos) | 2-8% | SB blind-defence | 9.2% (122 combos) |
| BB re-raise-not-mine | 6.6% (88 combos) | 4-16% | BB blind-defence | 36.3% (482 combos) |

Every not-mine continue hand also continues in its parent, AA/KK/QQ/AK raise, nothing else raises, and no spot has an A-4 dominance inversion.

## 6. Bot and playtest shifts

### Test re-pins (expected values only; check counts kept)

| file | owner | before → after |
|---|---|---|
| `tests/advice/chart-print-sizes.acceptance.test.ts` (locked) | TASK-7.27 | `checkReview('full-ring', 41)` → `checkReview('full-ring', 50)` |
| `tests/advice/table-sizes.acceptance.test.ts` (locked) | TASK-7.6 | full-ring length 41 → 50; `SITUATIONS` gains `re-raise-not-mine`; heads-up reachable set also excludes `re-raise-not-mine` (full ring reaches all 7 situations) |
| `tests/advice/re-raise-split.acceptance.test.ts` (locked) | TASK-7.40 | AC#6: the two 9-seat routes expect `re-raise-not-mine` and its context sentence; sweep expects `seen.has('re-raise-not-mine')` true at 9 seats (still false at 2); full-ring length 41 → 50; `.some(re-raise-not-mine)` false for heads-up, true for full ring; title `AC#6 heads-up advice is unchanged and full ring reads the split (re-pinned by TASK-7.41)` |
| `tests/golden/preflop-spots.json` (locked) | TASK-7.11 | 3 spots appended (section 7); existing entries byte-identical |
| `tests/advice/reference-charts.test.ts` (unlocked) | — | 9 new `re-raise-not-mine` bands (UTG..SB 2-8%, BB 4-16%); `BTN re-raise` band 5-28% → 25-35% (the Q-1 share puts it at 31.5%) |

No seeded bot or playtest example shifted (D-7 standing rule not needed).


### 9-max all-TAG run (`tests/advice/size-ranges-playtest.acceptance.test.ts`, opt-in; A-4)

| stat | before | after | healthy (`HEALTHY_RANGES['full-ring']`) |
|---|---|---|---|
| VPIP | 15.1 | 14.7 | 13–20 |
| PFR | 11.3 | 11.2 | 9–16 |
| aggression | 63.8 | 65.2 | 50–66 |
| WTSD | 38.3 | 37.6 | 28–40 |
| W$SD | 50.9 | 52.1 | 47–57 |

### Rock at full ring (A-1)

Rock reads its 6-max ranges at every size (`src/bots/rock.ts:34`, `chartSpotOf(view, '6-max')`). At 8-10 seats, cold and called-then-re-raised spots now read its `re-raise-not-mine` range (AA KK QQ AKs AKo) instead of its `re-raise` range, so at CO, BTN and BB it no longer continues with JJ there, and at BTN it no longer continues with AQs. Own-raise re-raises are unchanged. No Rock test changed.

## 7. New golden spots

| id | hand | route (9 seats, before hero) | action |
|---|---|---|---|
| fr-co-re-raise-not-mine-ajs | Ad Jd (AJs) | F16: UTG raise, 4 folds, CO calls, BTN and SB fold, BB re-raises, UTG calls | fold |
| fr-bb-re-raise-not-mine-99 | 9s 9h (99) | F19: UTG raise, UTG+1 re-raise, 6 folds | call |
| fr-btn-re-raise-not-mine-aa | Ac Ad (AA) | F17: 4 folds, HJ raise, CO re-raise | raise |

The 8 existing full-ring `re-raise` golden spots are byte-identical and keep their firm actions.

## 8. TASK-7.38 coverage

Per Q-3, this sign-off covers the 18 full-ring re-raise spots (9 `re-raise`, 9 `re-raise-not-mine`). TASK-7.38 keeps the review of the other 32 full-ring spots and the 6 heads-up spots.
