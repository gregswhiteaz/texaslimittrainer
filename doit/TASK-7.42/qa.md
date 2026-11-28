# TASK-7.42 Q&A (user, 2026-11-28)

Asked in one batch of 4 (Q-2+Q-3 combined; Q-5+Q-6 combined).

## Q-1 Seat groups
**Answer: Recommended** — 6-max early = UTG, HJ; late = CO, BTN, SB, BB. Full ring early = UTG, UTG+1, MP, LJ; late = HJ, CO, BTN, SB, BB. Edge cases as in the spec (both UTG seats at 7/10 early; no early seat at 3–4; iso-raise grouped by raiser's seat).

## Q-2 Label
**Answer: Recommended** — new label "defending the blind against an early raiser"; `blind-defence` keeps "defending the blind against a raise".

## Q-3 Context sentence
**Answer: Recommended** — "Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, but a raiser in an early seat holds a strong range, so you defend with fewer hands than against a late raiser." Existing sentence unchanged.

## Q-4 Width rule
**Answer: Recommended** — late grids keep today's cells (text only changes); early grids: subset of late continues, never firmer, strictly fewer combos; bands 6-max SB 5–9%, BB 28–40%; full ring SB 4–7.5%, BB 20–30%.

## Q-5 Rock ranges
**Answer: Recommended** — SB early "AA KK QQ JJ TT AKs AQs AKo"; BB early "AA KK QQ JJ TT 99 88 77 66 55 44 33 22 AKs AQs AJs ATs KQs KJs QJs JTs AKo AQo KQo". Late ranges unchanged.

## Q-6 Sign-off and re-pins
**Answer: Recommended** — one review from signoff.md before code review; §5 locked re-pins and seeded re-pins pre-approved (TASK-7.40 A-8 method: replace expected values, keep check count).
