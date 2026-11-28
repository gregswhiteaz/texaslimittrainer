# TASK-7.42 sign-off package: blind defence split by an early or a late raiser

## 1. Commits and chart-level texts

- Base commit: `a28ea6df8ffbc1310738a5732a5575ceda74aac5`.
- Final: uncommitted build on branch `doit/TASK-7.42` on top of `0ad5da47` (the orchestrator commits it).

### 6-max chart text

Before:

> A tight-aggressive baseline for six-handed fixed-limit hold'em. When nobody has put money in yet we raise or fold; only the small blind sometimes completes, because it is already half in and only the big blind is left. Raising beats limping in limit: a raise sometimes wins the blinds at once, thins the field, and puts more money in while our hand is most likely ahead, and the raiser keeps the lead into the flop. Ranges widen as position improves, because fewer players behind us means fewer chances that someone holds a better hand, and acting last on every later street is worth extra hands. Facing one raise and no callers we mostly re-raise or fold; we call more often when callers or our own blind improve the price, and most of all in the big blind. Once two raises are in, the pot is large: when our own raise is re-raised we usually call with most of the hands we raised with; when none of the raises is ours we continue only with hands that are strong against one raise, and fewer of them; in both cases only premium hands raise again. Played over many hands, the chart aims to put money in voluntarily with about 18 to 26 percent of hands and to raise first with about 14 to 22 percent.

After:

> A tight-aggressive baseline for six-handed fixed-limit hold'em. When nobody has put money in yet we raise or fold; only the small blind sometimes completes, because it is already half in and only the big blind is left. Raising beats limping in limit: a raise sometimes wins the blinds at once, thins the field, and puts more money in while our hand is most likely ahead, and the raiser keeps the lead into the flop. Ranges widen as position improves, because fewer players behind us means fewer chances that someone holds a better hand, and acting last on every later street is worth extra hands. Facing one raise and no callers we mostly re-raise or fold; we call more often when callers or our own blind improve the price, and most of all in the big blind, and the blinds defend fewer hands against a raise from under the gun or the hijack than against a later seat. Once two raises are in, the pot is large: when our own raise is re-raised we usually call with most of the hands we raised with; when none of the raises is ours we continue only with hands that are strong against one raise, and fewer of them; in both cases only premium hands raise again. Played over many hands, the chart aims to put money in voluntarily with about 18 to 26 percent of hands and to raise first with about 14 to 22 percent.

### full-ring chart text

Before:

> A tight-aggressive plan for full-ring fixed-limit hold'em, with eight or nine opponents. With so many players still to act, someone often holds a strong hand, so we enter far fewer pots than at six-handed and the first positions are the tightest of all. The under-the-gun range is built to stay sound at both nine and ten seats, since a ten-handed table's two earliest seats both use it. First in, we raise or fold; only the small blind sometimes completes. Behind limpers we raise hands that beat a limping range and call with hands that win big pots when they hit, such as small pairs and suited aces. Facing a single raise we mostly re-raise or fold; callers in between give a better price for speculative hands. Once our own raise is re-raised we call with most of our range and raise again only with the very best hands; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them. Overall the chart aims to play roughly 12 to 16 percent of hands voluntarily.

After:

> A tight-aggressive plan for full-ring fixed-limit hold'em, with eight or nine opponents. With so many players still to act, someone often holds a strong hand, so we enter far fewer pots than at six-handed and the first positions are the tightest of all. The under-the-gun range is built to stay sound at both nine and ten seats, since a ten-handed table's two earliest seats both use it. First in, we raise or fold; only the small blind sometimes completes. Behind limpers we raise hands that beat a limping range and call with hands that win big pots when they hit, such as small pairs and suited aces. Facing a single raise we mostly re-raise or fold; callers in between give a better price for speculative hands, and the blinds defend fewer hands against a raiser in the four earliest seats than against a later one. Once our own raise is re-raised we call with most of our range and raise again only with the very best hands; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them. Overall the chart aims to play roughly 12 to 16 percent of hands voluntarily.

## 2. chart:print blocks for the 8 spots

These are verbatim from `npm run chart:print 6-max` and `npm run chart:print full-ring`. That is the review form: the same grids as `npm run chart:print`, plus the "Why:" text. Early spots come first, then the late spots, each late one with its "before" block. Cells: R raise, C call, F fold; `*` marks a borderline cell and `/X` its alternative.

### 6-max

#### SB blind-defence-early (new)

```
SB blind-defence-early: raise 6.8%, continue 6.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    R*/F F    F    F    F    F    F    F    F
K    R    R    R    R*/F F    F    F    F    F    F    F    F    F
Q    R*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    R    F    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    R    F    F    F    F    F    F    F
8    F    F    F    F    F    F    R*/F F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from under the gun or the hijack, the two earliest seats, so the raiser holds a strong range and the big blind is still behind us. Calling would leave us out of position against that range and invite the big blind in, so we re-raise or fold, and with fewer hands than against a late raiser. Nines or better, ace-king, ace-queen and ace-jack suited, king-queen suited and ace-king offsuit re-raise; eights, ace-ten suited, king-jack suited and ace-queen offsuit re-raise but are close to a fold. Sevens, queen-jack suited, king-queen offsuit and everything weaker fold.
```

#### BB blind-defence-early (new)

```
BB blind-defence-early: raise 3.3%, continue 30.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    F*/C F*/C F*/C F
Q    C    C    R    C    C    C    C    C    F    F    F    F    F
J    C    C    C    R    C    C    C    C    F    F    F    F    F
T    C    C    C    C    C    C    C    F    F    F    F    F    F
9    C    C    C    F*/C F    C    C    C    F    F    F    F    F
8    C*/F F*/C F*/C F*/C F    F    C    C    F    F    F    F    F
7    C*/F F    F    F    F    F    F    C    C    F    F    F    F
6    F*/C F    F    F    F    F    F    F    C    C    F    F    F
5    F*/C F    F    F    F    F    F    F    F    C    C    F*/C F
4    F*/C F    F    F    F    F    F    F    F    F    C    F    F
3    F*/C F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: One player has raised from under the gun or the hijack, the two earliest seats, so the raiser holds a strong range. Our full bet is already in and we close the action, so the price is still good, but we defend with fewer hands than against a late raiser. Jacks or better, ace-king and ace-queen suited re-raise. Every other pair and every suited ace call, as do suited kings down to king-six, suited queens down to queen-seven, suited jacks down to jack-seven, ten-nine, ten-eight, nine-eight and nine-seven suited, the suited connectors from eight-seven down to five-four, offsuit aces down to ace-nine, offsuit kings down to king-nine, and queen-jack, queen-ten, queen-nine and jack-ten offsuit. Ace-eight and ace-seven offsuit call but are close to a fold. Ace-six down to ace-three offsuit, king-eight, queen-eight, jack-nine and jack-eight offsuit, king-five down to king-three suited and five-three suited fold but are close to a call; the other offsuit hands and the remaining suited hands fold.
```

#### SB blind-defence (vs a late raiser), after

```
SB blind-defence: raise 9.5%, continue 10.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    R    R*/F F    F    F    F    F    F    F
K    R    R    R    R    R*/F F    F    F    F    F    F    F    F
Q    R    R*/F R    R    F    F    F    F    F    F    F    F    F
J    R    F    F    R    C    F    F    F    F    F    F    F    F
T    F*/R F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    R    F    F    F    F    F    F    F
8    F    F    F    F    F    F    R*/C F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    F*/C F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from the cutoff or the button, or the big blind raised after we completed. A late raiser opens a wide range, so we defend more hands than against an early seat. When the big blind is still behind us, calling invites it in and leaves us out of position against two players, so we mostly re-raise to play heads-up against the raiser, with big and middle pairs, strong aces and the best suited broadways. Sevens, sixes and jack-ten suited call, and everything else folds. If we completed and the big blind raised, nobody is left to act behind us, but we are still out of position, so the same hands re-raise, call or fold.
```

#### SB blind-defence, before

```
SB blind-defence: raise 9.5%, continue 10.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    R    R*/F F    F    F    F    F    F    F
K    R    R    R    R    R*/F F    F    F    F    F    F    F    F
Q    R    R*/F R    R    F    F    F    F    F    F    F    F    F
J    R    F    F    R    C    F    F    F    F    F    F    F    F
T    F*/R F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    R    F    F    F    F    F    F    F
8    F    F    F    F    F    F    R*/C F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    F*/C F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised. Usually the big blind is still behind us, so calling invites the big blind in and leaves us out of position against at least two players; we mostly re-raise to play heads-up against the raiser, with big and middle pairs, strong aces and the best suited broadways. Sevens, sixes and jack-ten suited call, and everything else folds. If we completed and the big blind raised, nobody is left to act behind us, but we are still out of position, so the same hands re-raise, call or fold.
```

#### BB blind-defence (vs a late raiser), after

```
BB blind-defence: raise 5.7%, continue 46.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    C    C    C    C    C    C    C    C    C
K    R    R    R*/C C    C    C    C    C    C    C    C    C    C
Q    R*/C C    R    C    C    C    C    C    C    C    F    F    F
J    C*/R C    C    R    C    C    C    C    F*/C F    F    F    F
T    C    C    C    C    R    C    C    C    F    F    F    F    F
9    C    C    C    C    C    R*/C C    C    C    F    F    F    F
8    C    C    C    C    C    C    C*/R C    C    C    F    F    F
7    C    C*/F F*/C F*/C F*/C F*/C F*/C C    C    C    F    F    F
6    C    F    F    F    F    F    F    F    C    C    C    F    F
5    C    F    F    F    F    F    F    F    F    C    C    C    F
4    C    F    F    F    F    F    F    F    F    F    C    C*/F F
3    C    F    F    F    F    F    F    F    F    F    F    C    F
2    C*/F F    F    F    F    F    F    F    F    F    F    F    C
Why: One player has raised from the cutoff, the button or the small blind, a late seat with a wide range, and our full bet is already in, so we need to call only one more bet into a pot that offers at least three to one: three and a half to one against a lone open, more with callers, and three to one when the small blind raises. That price makes it right to defend wide: any ace, most suited hands, every pair, and offsuit kings, queens, jacks, tens and nines down to about the eight. We re-raise our strongest hands for value and fold weaker offsuit hands, including offsuit connectors below nine-eight, which win too rarely to call even at this price.

```

#### BB blind-defence, before

```
BB blind-defence: raise 5.7%, continue 46.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    C    C    C    C    C    C    C    C    C
K    R    R    R*/C C    C    C    C    C    C    C    C    C    C
Q    R*/C C    R    C    C    C    C    C    C    C    F    F    F
J    C*/R C    C    R    C    C    C    C    F*/C F    F    F    F
T    C    C    C    C    R    C    C    C    F    F    F    F    F
9    C    C    C    C    C    R*/C C    C    C    F    F    F    F
8    C    C    C    C    C    C    C*/R C    C    C    F    F    F
7    C    C*/F F*/C F*/C F*/C F*/C F*/C C    C    C    F    F    F
6    C    F    F    F    F    F    F    F    C    C    C    F    F
5    C    F    F    F    F    F    F    F    F    C    C    C    F
4    C    F    F    F    F    F    F    F    F    F    C    C*/F F
3    C    F    F    F    F    F    F    F    F    F    F    C    F
2    C*/F F    F    F    F    F    F    F    F    F    F    F    C
Why: One player has raised and our full bet is already in, so we need to call only one more bet into a pot that offers at least three to one: three and a half to one against a lone open, more with callers, and three to one when the small blind raises. That price makes it right to defend wide: any ace, most suited hands, every pair, and offsuit kings, queens, jacks, tens and nines down to about the eight. We re-raise our strongest hands for value and fold weaker offsuit hands, including offsuit connectors below nine-eight, which win too rarely to call even at this price.

```

### full-ring

#### SB blind-defence-early (new)

```
SB blind-defence-early: raise 5.3%, continue 5.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R*/F F    F    F    F    F    F    F    F    F
K    R    R    R*/F F    F    F    F    F    F    F    F    F    F
Q    R*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    R    F    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C*/F F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from under the gun, under the gun plus one, the middle position or the lojack, the four earliest seats at a full table, so the raiser holds a strong range and the big blind is still behind us. We would play out of position, so we defend with fewer hands than against a late raiser and mostly re-raise or fold. Tens or better, ace-king, ace-queen suited and ace-king offsuit re-raise; ace-jack suited, king-queen suited and ace-queen offsuit re-raise but are close to a fold, and nines call but are close to a fold. Eights, ace-ten suited, king-jack suited, ace-jack offsuit and everything weaker fold.
```

#### BB blind-defence-early (new)

```
BB blind-defence-early: raise 3.3%, continue 24.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    F    F    F    F    F    F    F
Q    C    C    R    C    C    C    F    F    F    F    F    F    F
J    C    C    C    R    C    C    F    F    F    F    F    F    F
T    C    C    C    C    C    C    F    F    F    F    F    F    F
9    C    F    F    F    F    C    C    F    F    F    F    F    F
8    F*/C F    F    F    F    F    C    C    F    F    F    F    F
7    F*/C F    F    F    F    F    F    C    C    F    F    F    F
6    F*/C F    F    F    F    F    F    F    C    C    F    F    F
5    F    F    F    F    F    F    F    F    F    C    C    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F*/C F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: An opener in one of the four earliest seats, from under the gun to the lojack, holds a strong range at a full table. Our full bet is in and we close the action, so the pot odds still let us defend, but with fewer hands than against a late raiser. Jacks or better, ace-king and ace-queen suited re-raise. Every other pair and every suited ace call, as do king-queen down to king-nine suited, queen-jack down to queen-nine suited, jack-ten and jack-nine suited, ten-nine suited, the suited connectors from nine-eight down to five-four, offsuit aces down to ace-nine, and king-queen, king-jack, king-ten, queen-jack, queen-ten and jack-ten offsuit. Ace-eight down to ace-six offsuit and four-three suited fold but are close to a call; everything else folds, including the smaller suited kings and the weaker offsuit hands.
```

#### SB blind-defence (vs a late raiser), after

```
SB blind-defence: raise 6.2%, continue 9.2%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    C    F    F    F    F    F    F    F    F
K    R    R    R    C    F    F    F    F    F    F    F    F    F
Q    R    F    R    C    F    F    F    F    F    F    F    F    F
J    R*/F F    F    R    C    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from the hijack, the cutoff or the button, or the big blind raised after we completed. Those late seats open wider ranges than the early ones, but we are out of position and, unless the big blind is the raiser, it can still squeeze behind us, so calling is unattractive. We mostly re-raise or fold, calling only with a few pairs and suited broadway hands.
```

#### SB blind-defence, before

```
SB blind-defence: raise 6.2%, continue 9.2%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    C    F    F    F    F    F    F    F    F
K    R    R    R    C    F    F    F    F    F    F    F    F    F
Q    R    F    R    C    F    F    F    F    F    F    F    F    F
J    R*/F F    F    R    C    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C    F    F    F    F    F    F    F
8    F    F    F    F    F    F    C    F    F    F    F    F    F
7    F    F    F    F    F    F    F    C    F    F    F    F    F
6    F    F    F    F    F    F    F    F    C*/F F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: In the small blind, facing a raise with the big blind still to act, calling is unattractive: we would be out of position and could be squeezed. We mostly re-raise or fold, calling only with a few pairs and suited broadway hands.
```

#### BB blind-defence (vs a late raiser), after

```
BB blind-defence: raise 4.2%, continue 36.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    C    F    F    F
Q    R*/C C    R    C    C    C    C    C    F    F    F    F    F
J    C    C    C    R    C    C    C    C    F    F    F    F    F
T    C    C    C    C    C    C    C    C    F    F    F    F    F
9    C    C    C    C    C    C    C    C    C    F    F    F    F
8    C    F    F    F    F    C    C    C    C    F    F    F    F
7    C    F    F    F    F    F    F*/C C    C    C    F    F    F
6    C*/F F    F    F    F    F    F    F    C    C    C    F    F
5    F    F    F    F    F    F    F    F    F    C    C    C    F
4    F    F    F    F    F    F    F    F    F    F    C    C    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: One player has raised from the hijack, the cutoff, the button or the small blind, so the raiser's range is wider than an early seat's. In the big blind we already have a full bet in and close the action, so a call needs only a small extra share of the pot. Full-ring late raises are still stronger than six-handed ones, so we defend somewhat tighter than at six-max, re-raising only the strongest hands.

```

#### BB blind-defence, before

```
BB blind-defence: raise 4.2%, continue 36.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    C    F    F    F
Q    R*/C C    R    C    C    C    C    C    F    F    F    F    F
J    C    C    C    R    C    C    C    C    F    F    F    F    F
T    C    C    C    C    C    C    C    C    F    F    F    F    F
9    C    C    C    C    C    C    C    C    C    F    F    F    F
8    C    F    F    F    F    C    C    C    C    F    F    F    F
7    C    F    F    F    F    F    F*/C C    C    C    F    F    F
6    C*/F F    F    F    F    F    F    F    C    C    C    F    F
5    F    F    F    F    F    F    F    F    F    C    C    C    F
4    F    F    F    F    F    F    F    F    F    F    C    C    F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: In the big blind we already have a full bet in and close the action, so a call needs only a small extra share of the pot. Full-ring raises are stronger than six-handed ones, so we defend somewhat tighter, re-raising only the strongest hands.

```

## 3. Changed cells in the 4 late spots

| spot | hand | before | after |
|---|---|---|---|
| None | | | |

Under D-5 the 4 `blind-defence` grids are cell-for-cell identical to the base commit. I checked this by comparing every grid row in `six-max.json` and `full-ring.json` with the base commit. Only their justifications changed.

## 4. Widths: early vs late, with the Q-4 band

| size | seat | early continue (raise) | late continue (raise) | Q-4 band (early) |
|---|---|---|---|---|
| 6-max | SB | 6.8% (6.8%) | 10.7% (9.5%) | 5–9% |
| 6-max | BB | 30.3% (3.3%) | 46.3% (5.7%) | 28–40% |
| full-ring | SB | 5.7% (5.3%) | 9.2% (6.2%) | 4–7.5% |
| full-ring | BB | 24.0% (3.3%) | 36.3% (4.2%) | 20–30% |

Each early spot meets §5 rule 5:

- every class that continues also continues in the late spot;
- no class is played more firmly than in the late spot;
- it has strictly fewer combos than the late spot.

The 4 early grids have no A-4 dominance inversion (checked by `tests/advice/blind-defence-split.acceptance.test.ts` and the six-max dominance test).

Some early cells are borderline folds whose alternative is a call (`F*/C`):

- 6-max BB: A6o–A3o, K8o, Q8o, J9o, J8o, K5s–K3s, 53s;
- full-ring BB: A8o–A6o, 43s.

They are borderline because the locked postflop golden spots (`tests/golden/postflop-spots.json`: `6max-flop-bb-call-j8o`, `6max-turn-bb-check-a3o`, `6max-turn-bb-fold-k3s`, `6max-river-bb-check-53s`, `fr-turn-bb-check-a6o`, `fr-river-bb-fold-43s`) have the hero call a UTG raise from the BB with these hands. A firm fold would make that call a Major error, and the golden validator rejects it. A borderline fold grades the call as Minor, which is allowed. Their dominating neighbours (K8o, Q8o, J9o, A6o–A4o, A8o–A7o) are borderline for the same reason, so the grids stay free of dominance inversions.

## 5. Rock ranges (Q-5)

| spot | Rock range | Rock classes | TAG 6-max plays (non-fold classes) |
|---|---|---|---|
| SB blind-defence-early | AA KK QQ JJ TT AKs AQs AKo | 8 | 15 |
| BB blind-defence-early | AA KK QQ JJ TT 99 88 77 66 55 44 33 22 AKs AQs AJs ATs KQs KJs QJs JTs AKo AQo KQo | 24 | 64 |

Each range is a strict subset of the TAG plays in its spot and is contained in the Rock `blind-defence` range for the same seat (17 and 41 classes, unchanged).

## 6. Test and bot shifts

### Re-pins

The locked re-pins are the spec §5 list. Each file was unlocked for every owner, only expected values changed, and the check count is the same.

| file | owner(s) | before → after |
|---|---|---|
| `tests/advice/chart-print.acceptance.test.ts` | TASK-7.19 | 32 → 34 blocks and spots |
| `tests/advice/chart-print-sizes.acceptance.test.ts` | TASK-7.27 | `checkReview('full-ring', 50)` → 52; `('6-max', 32)` → 34 |
| `tests/advice/preflop-chart-edges.acceptance.test.ts` | TASK-7.20 | 32 → 34 |
| `tests/advice/six-max-chart.acceptance.test.ts` | TASK-7.19, TASK-7.40 | 32 → 34; dominance now covers the new grids |
| `tests/advice/table-sizes.acceptance.test.ts` | TASK-7.6 | `SITUATIONS` + `blind-defence-early`; full ring 50 → 52; heads-up reachable set also drops it |
| `tests/advice/re-raise-split.acceptance.test.ts` | TASK-7.40 | 6-max order + 2 D-2 entries, 32 → 34, header "32 spots" → "34 spots"; full ring 50 → 52 |
| `tests/advice/full-ring-re-raise-split.acceptance.test.ts` | TASK-7.41 | full-ring order + 2 D-2 entries, 50 → 52, header "50 spots" → "52 spots"; `situations` + `blind-defence-early` |
| `tests/advice/labels.acceptance.test.ts` | TASK-8.5 | `expected` and key list + `blind-defence-early` (Q-2 label) |
| `tests/advice/preflop-voided-raise.acceptance.test.ts` | TASK-10.17, TASK-7.40 | `:66` (UTG raise) and `:75` (HJ raise): `blind-defence` → `blind-defence-early`; `:70` unchanged |
| `tests/advice/preflop.acceptance.test.ts` | TASK-7.2 | `SCRIPTS` = the 34 spots: UTG-raise BB script → `BB blind-defence-early`; + `SB blind-defence-early`, + `BB blind-defence` (CO raise) |
| `tests/bots/rock.acceptance.test.ts` | TASK-6.5, TASK-7.40 | 32 → 34; `COUNTS` + `[8, 24]`; 31 → 33 |
| `tests/bots/tag.acceptance.test.ts` | TASK-6.1 | reached situations + `blind-defence-early` |
| `tests/golden/preflop-spots.json` | TASK-7.11 | A-2 (3 `situation` fields), A-3 (2 appended); see §7 |

Seeded re-pins (D-7, TASK-7.40 A-8 method). TAG now folds some BB hands against an early raiser, so the seeded decision lists shifted:

| file | owner | before → after |
|---|---|---|
| `tests/bots/calling-station.acceptance.test.ts` | TASK-6.3 | Example B: point 216 (flop 5c 3c, code `...00d9`, seed 2984596433, u 236911064) → point 108 = fold[108] (flop 6d 8h facing 4, decision index 1, code `...006d`, seed 4144976625, u 1627951385). The 5c 3c flop no longer happens because TAG folds 53s preflop against the UTG raise. |
| `tests/bots/maniac.acceptance.test.ts` | TASK-6.4, TASK-6.25 | Example C: call[22] → call[21] (same Kd Ad turn), code `...0017` → `...0016`, seed 4068892361 → 3023335121, u 3434323010 → 4218716683. Example H: point 98 = call[28] → point 441 = call[27] (same 8s 8d river; first point with u < 0.2), code `...0063` → `...01ba`, seed 2215881066 → 2360546989, u 538411937 → 768080274. |
| `tests/playtest/games.acceptance.test.ts` | TASK-1.16 | side-pot `> 0`: seed 43 → 45. Seeds 42–44 have 0 side pots in 1,000 hands; 45 has 1 (6 in 10,000). |
| `tests/bots/calling-station-draws.acceptance.test.ts` | unlocked | `exampleB` fold[33] → fold[90] (the first flop fold) |

Unlocked unit updates:

- `tests/advice/preflop.test.ts`: situation cases for early and late raisers, an SB raiser and isolation raises.
- `tests/advice/preflop-chart.test.ts`: the missing-spot messages, and 32 → 34.
- `tests/advice/six-max-chart.test.ts`: Q-4 bands for the 2 new keys.
- `tests/advice/reference-charts.test.ts`: Q-4 bands for the 2 new keys.

These locked tests were expected to be unchanged, and they pass unchanged: `tests/golden/preflop.acceptance.test.ts`, `tests/bots/tag-mixing.acceptance.test.ts`, `tests/golden/graded-lines.acceptance.test.ts`, `tests/table/review.acceptance.test.ts`, the `tests/playtest` suites and the slow group.

### TAG before/after (A-4)

9-max, from the `TAG full-ring <stat>` log of `tests/advice/size-ranges-playtest.acceptance.test.ts` (100,000 hands, seed 42; before = base worktree, after = `npm run test:slow`):

| stat | before (base) | after (final) | healthy (`HEALTHY_RANGES['full-ring']`) |
|---|---|---|---|
| VPIP | 14.7 | 14.2 | 13–20 |
| PFR | 11.2 | 11.2 | 9–16 |
| aggression | 65.2 | 65.0 | 50–66 |
| WTSD | 37.6 | 38.1 | 28–40 |
| W$SD | 52.1 | 52.3 | 47–57 |

6-max, from the 10,000-hand seed-42 playtest that `tests/bots/tag-playtest.acceptance.test.ts` runs. This is the "Style: TAG" line of `npm run playtest -- --hands 10000 --seed 42`, which does not print WTSD or W$SD:

| stat | before (base) | after (final) | healthy (`HEALTHY_RANGES['6-max']`) |
|---|---|---|---|
| VPIP | 22.0 | 21.2 | 20–28 |
| PFR | 16.3 | 16.1 | 14–22 |
| aggression | 65.2 | 65.2 | 50–66 |

## 7. Golden spots changed or added

| id | hand | route | action | change |
|---|---|---|---|---|
| `6max-sb-blind-defence-qq` | QQ | 6 seats, UTG raises, folds to SB | raise | `situation` → `blind-defence-early` (A-2) |
| `fr-sb-blind-defence-ako` | AKo | 9 seats, LJ raises, folds to SB | raise | `situation` → `blind-defence-early` (A-2) |
| `fr-sb-blind-defence-k9s` | K9s | 9 seats, UTG raises, folds to SB | fold | `situation` → `blind-defence-early` (A-2) |
| `6max-bb-blind-defence-early-q6s` | Q6s | 6 seats, UTG raises, folds to BB | fold | added (A-3); `BB blind-defence` calls Q6s |
| `fr-bb-blind-defence-early-k6s` | K6s | 9 seats, MP raises, folds to BB | fold | added (A-3); `BB blind-defence` calls K6s (see `fr-bb-blind-defence-k6s`) |

All 5 cells are firm (not borderline) in the new grids. The 13 late golden blind-defence spots pass unchanged.

## 8. TASK-7.38

The 4 full-ring blind-defence spots, the 2 new early ones and the 2 late ones, are reviewed here. The full-ring BB `blind-defence` dominance inversions stay with TASK-7.38. That grid is unchanged under D-5. The new full-ring BB `blind-defence-early` grid has no inversion.

## Addendum (review r1 text fixes, after sign-off; grids unchanged)

# TASK-7.42 sign-off section 2: text changes from review round 1

Text only; every grid is unchanged (chart:print grid rows diffed before/after).

## 6-max (6-max chart: 34 spots)

### SB blind-defence-early

Before:

```
SB blind-defence-early: raise 6.8%, continue 6.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    R*/F F    F    F    F    F    F    F    F
K    R    R    R    R*/F F    F    F    F    F    F    F    F    F
Q    R*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    R    F    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    R    F    F    F    F    F    F    F
8    F    F    F    F    F    F    R*/F F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from under the gun or the hijack, the two earliest seats, so the raiser holds a strong range and the big blind is still behind us. Calling would leave us out of position against that range and invite the big blind in, so we re-raise or fold, and with fewer hands than against a late raiser. Nines or better, ace-king, ace-queen and ace-jack suited, king-queen suited and ace-king offsuit re-raise; eights, ace-ten suited, king-jack suited and ace-queen offsuit re-raise but are close to a fold. Sevens, queen-jack suited, king-queen offsuit and everything weaker fold.
```

After:

```
SB blind-defence-early: raise 6.8%, continue 6.8%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R    R*/F F    F    F    F    F    F    F    F
K    R    R    R    R*/F F    F    F    F    F    F    F    F    F
Q    R*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    R    F    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    R    F    F    F    F    F    F    F
8    F    F    F    F    F    F    R*/F F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from under the gun or the hijack, so the raiser holds a strong range and the big blind is still behind us. Calling would leave us out of position against that range and invite the big blind in, so we re-raise or fold, and with fewer hands than against a late raiser. Nines or better, ace-king, ace-queen and ace-jack suited, king-queen suited and ace-king offsuit re-raise; eights, ace-ten suited, king-jack suited and ace-queen offsuit re-raise but are close to a fold. Sevens, queen-jack suited, king-queen offsuit and everything weaker fold.
```

### BB blind-defence-early

Before:

```
BB blind-defence-early: raise 3.3%, continue 30.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    F*/C F*/C F*/C F
Q    C    C    R    C    C    C    C    C    F    F    F    F    F
J    C    C    C    R    C    C    C    C    F    F    F    F    F
T    C    C    C    C    C    C    C    F    F    F    F    F    F
9    C    C    C    F*/C F    C    C    C    F    F    F    F    F
8    C*/F F*/C F*/C F*/C F    F    C    C    F    F    F    F    F
7    C*/F F    F    F    F    F    F    C    C    F    F    F    F
6    F*/C F    F    F    F    F    F    F    C    C    F    F    F
5    F*/C F    F    F    F    F    F    F    F    C    C    F*/C F
4    F*/C F    F    F    F    F    F    F    F    F    C    F    F
3    F*/C F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: One player has raised from under the gun or the hijack, the two earliest seats, so the raiser holds a strong range. Our full bet is already in and we close the action, so the price is still good, but we defend with fewer hands than against a late raiser. Jacks or better, ace-king and ace-queen suited re-raise. Every other pair and every suited ace call, as do suited kings down to king-six, suited queens down to queen-seven, suited jacks down to jack-seven, ten-nine, ten-eight, nine-eight and nine-seven suited, the suited connectors from eight-seven down to five-four, offsuit aces down to ace-nine, offsuit kings down to king-nine, and queen-jack, queen-ten, queen-nine and jack-ten offsuit. Ace-eight and ace-seven offsuit call but are close to a fold. Ace-six down to ace-three offsuit, king-eight, queen-eight, jack-nine and jack-eight offsuit, king-five down to king-three suited and five-three suited fold but are close to a call; the other offsuit hands and the remaining suited hands fold.
```

After:

```
BB blind-defence-early: raise 3.3%, continue 30.3%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    C    C    C    F*/C F*/C F*/C F
Q    C    C    R    C    C    C    C    C    F    F    F    F    F
J    C    C    C    R    C    C    C    C    F    F    F    F    F
T    C    C    C    C    C    C    C    F    F    F    F    F    F
9    C    C    C    F*/C F    C    C    C    F    F    F    F    F
8    C*/F F*/C F*/C F*/C F    F    C    C    F    F    F    F    F
7    C*/F F    F    F    F    F    F    C    C    F    F    F    F
6    F*/C F    F    F    F    F    F    F    C    C    F    F    F
5    F*/C F    F    F    F    F    F    F    F    C    C    F*/C F
4    F*/C F    F    F    F    F    F    F    F    F    C    F    F
3    F*/C F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: One player has raised from under the gun or the hijack, so the raiser holds a strong range. Our full bet is already in and we close the action, so the price is still good, but we defend with fewer hands than against a late raiser. Jacks or better, ace-king, ace-queen suited and ace-king offsuit re-raise. Every other pair and every suited ace call, as do suited kings down to king-six, suited queens down to queen-seven, suited jacks down to jack-seven, ten-nine, ten-eight, nine-eight and nine-seven suited, the suited connectors from eight-seven down to five-four, offsuit aces from ace-queen down to ace-nine, offsuit kings down to king-nine, and queen-jack, queen-ten, queen-nine and jack-ten offsuit. Ace-eight and ace-seven offsuit call but are close to a fold. Ace-six down to ace-three offsuit, king-eight, queen-eight, jack-nine and jack-eight offsuit, king-five down to king-three suited and five-three suited fold but are close to a call; the other offsuit hands and the remaining suited hands fold.
```

## full-ring (full-ring chart: 52 spots)

### chart-level

Before:

```
A tight-aggressive plan for full-ring fixed-limit hold'em, with eight or nine opponents. With so many players still to act, someone often holds a strong hand, so we enter far fewer pots than at six-handed and the first positions are the tightest of all. The under-the-gun range is built to stay sound at both nine and ten seats, since a ten-handed table's two earliest seats both use it. First in, we raise or fold; only the small blind sometimes completes. Behind limpers we raise hands that beat a limping range and call with hands that win big pots when they hit, such as small pairs and suited aces. Facing a single raise we mostly re-raise or fold; callers in between give a better price for speculative hands, and the blinds defend fewer hands against a raiser in the four earliest seats than against a later one. Once our own raise is re-raised we call with most of our range and raise again only with the very best hands; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them. Overall the chart aims to play roughly 12 to 16 percent of hands voluntarily.
```

After:

```
A tight-aggressive plan for full-ring fixed-limit hold'em, with eight or nine opponents. With so many players still to act, someone often holds a strong hand, so we enter far fewer pots than at six-handed and the first positions are the tightest of all. The under-the-gun range is built to stay sound at both nine and ten seats, since a ten-handed table's two earliest seats both use it. First in, we raise or fold; only the small blind sometimes completes. Behind limpers we raise hands that beat a limping range and call with hands that win big pots when they hit, such as small pairs and suited aces. Facing a single raise we mostly re-raise or fold; callers in between give a better price for speculative hands, and the blinds defend fewer hands against a raiser from under the gun to the lojack than against a later one. Once our own raise is re-raised we call with most of our range and raise again only with the very best hands; when two raises are in and none is ours, we continue only with hands that are strong against one raise, and fewer of them. Overall the chart aims to play roughly 12 to 16 percent of hands voluntarily.
```

### SB blind-defence-early

Before:

```
SB blind-defence-early: raise 5.3%, continue 5.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R*/F F    F    F    F    F    F    F    F    F
K    R    R    R*/F F    F    F    F    F    F    F    F    F    F
Q    R*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    R    F    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C*/F F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from under the gun, under the gun plus one, the middle position or the lojack, the four earliest seats at a full table, so the raiser holds a strong range and the big blind is still behind us. We would play out of position, so we defend with fewer hands than against a late raiser and mostly re-raise or fold. Tens or better, ace-king, ace-queen suited and ace-king offsuit re-raise; ace-jack suited, king-queen suited and ace-queen offsuit re-raise but are close to a fold, and nines call but are close to a fold. Eights, ace-ten suited, king-jack suited, ace-jack offsuit and everything weaker fold.
```

After:

```
SB blind-defence-early: raise 5.3%, continue 5.7%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    R*/F F    F    F    F    F    F    F    F    F
K    R    R    R*/F F    F    F    F    F    F    F    F    F    F
Q    R*/F F    R    F    F    F    F    F    F    F    F    F    F
J    F    F    F    R    F    F    F    F    F    F    F    F    F
T    F    F    F    F    R    F    F    F    F    F    F    F    F
9    F    F    F    F    F    C*/F F    F    F    F    F    F    F
8    F    F    F    F    F    F    F    F    F    F    F    F    F
7    F    F    F    F    F    F    F    F    F    F    F    F    F
6    F    F    F    F    F    F    F    F    F    F    F    F    F
5    F    F    F    F    F    F    F    F    F    F    F    F    F
4    F    F    F    F    F    F    F    F    F    F    F    F    F
3    F    F    F    F    F    F    F    F    F    F    F    F    F
2    F    F    F    F    F    F    F    F    F    F    F    F    F
Why: One player has raised from under the gun, under the gun plus one, the middle position or the lojack, so the raiser holds a strong range and the big blind is still behind us. We would play out of position, so we defend with fewer hands than against a late raiser and mostly re-raise or fold. Tens or better, ace-king, ace-queen suited and ace-king offsuit re-raise; ace-jack suited, king-queen suited and ace-queen offsuit re-raise but are close to a fold, and nines call but are close to a fold. Eights, ace-ten suited, king-jack suited, ace-jack offsuit and everything weaker fold.
```

### BB blind-defence-early

Before:

```
BB blind-defence-early: raise 3.3%, continue 24.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    F    F    F    F    F    F    F
Q    C    C    R    C    C    C    F    F    F    F    F    F    F
J    C    C    C    R    C    C    F    F    F    F    F    F    F
T    C    C    C    C    C    C    F    F    F    F    F    F    F
9    C    F    F    F    F    C    C    F    F    F    F    F    F
8    F*/C F    F    F    F    F    C    C    F    F    F    F    F
7    F*/C F    F    F    F    F    F    C    C    F    F    F    F
6    F*/C F    F    F    F    F    F    F    C    C    F    F    F
5    F    F    F    F    F    F    F    F    F    C    C    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F*/C F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: An opener in one of the four earliest seats, from under the gun to the lojack, holds a strong range at a full table. Our full bet is in and we close the action, so the pot odds still let us defend, but with fewer hands than against a late raiser. Jacks or better, ace-king and ace-queen suited re-raise. Every other pair and every suited ace call, as do king-queen down to king-nine suited, queen-jack down to queen-nine suited, jack-ten and jack-nine suited, ten-nine suited, the suited connectors from nine-eight down to five-four, offsuit aces down to ace-nine, and king-queen, king-jack, king-ten, queen-jack, queen-ten and jack-ten offsuit. Ace-eight down to ace-six offsuit and four-three suited fold but are close to a call; everything else folds, including the smaller suited kings and the weaker offsuit hands.
```

After:

```
BB blind-defence-early: raise 3.3%, continue 24.0%
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A    R    R    R    C    C    C    C    C    C    C    C    C    C
K    R    R    C    C    C    C    F    F    F    F    F    F    F
Q    C    C    R    C    C    C    F    F    F    F    F    F    F
J    C    C    C    R    C    C    F    F    F    F    F    F    F
T    C    C    C    C    C    C    F    F    F    F    F    F    F
9    C    F    F    F    F    C    C    F    F    F    F    F    F
8    F*/C F    F    F    F    F    C    C    F    F    F    F    F
7    F*/C F    F    F    F    F    F    C    C    F    F    F    F
6    F*/C F    F    F    F    F    F    F    C    C    F    F    F
5    F    F    F    F    F    F    F    F    F    C    C    F    F
4    F    F    F    F    F    F    F    F    F    F    C    F*/C F
3    F    F    F    F    F    F    F    F    F    F    F    C    F
2    F    F    F    F    F    F    F    F    F    F    F    F    C
Why: An opener from under the gun to the lojack holds a strong range at a full table. Our full bet is in and we close the action, so the pot odds still let us defend, but with fewer hands than against a late raiser. Jacks or better, ace-king, ace-queen suited and ace-king offsuit re-raise. Every other pair and every suited ace call, as do king-queen down to king-nine suited, queen-jack down to queen-nine suited, jack-ten and jack-nine suited, ten-nine suited, the suited connectors from nine-eight down to five-four, offsuit aces from ace-queen down to ace-nine, and king-queen, king-jack, king-ten, queen-jack, queen-ten and jack-ten offsuit. Ace-eight down to ace-six offsuit and four-three suited fold but are close to a call; everything else folds, including the smaller suited kings and the weaker offsuit hands.
```
