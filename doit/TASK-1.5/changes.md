# Changes — TASK-1.5

- `src/engine/player-view.ts` — new: `PlayerView`, `PublicPlayer`, `ShownHand`, `EarlierShowdown`, `SeatPolicy` types; `playerView` (field-by-field copy of what one seat may see), `actWith` (builds the acting seat's view, calls the policy, applies its action), `showdownOf` (earlier-showdown entry from a completed hand).
- `tests/engine/player-view.acceptance.test.ts` — new: AC#1 exact view passed by `actWith` (SPEC-01) and AC#3 sandboxed typecheck probe (SPEC-03).
- `tests/engine/player-view.property.test.ts` — new: AC#2 hidden-card rotation over 300 seeded hands with the A-7 view-hashing policy (SPEC-02).
- `tests/engine/player-view.test.ts` — new: copies/no mutation, non-acting/folded/completed views, `actWith` errors, `showdownOf` (SPEC-04–07).

No new dependencies. `src/engine/hand.ts` unchanged.
