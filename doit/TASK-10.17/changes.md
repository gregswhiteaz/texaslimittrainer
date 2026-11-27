# TASK-10.17 changes

- `src/engine/hand.ts` — new exported `voidedBets(state: BetContext)` (indices of bet/raise records a fold voided, same rule as `liveLevels`); `forceFold` ring start tidied to `clockwiseAfter(open, toAct - 1)` with a comment.
- `src/engine/invariants.ts` — `sole` computed once before the awards loop.
- `src/advice/preflop.ts` — `situationOf` ignores raise records reported by `voidedBets`; doc comment updated.
- `tools/lint/headless-boundary.js` — `'voidedBets'` added to the advice `engine/hand` `allowImportNames`; adjacent comment updated.
- `tests/advice/preflop-voided-raise.acceptance.test.ts` — new: SPEC-01, SPEC-02, SPEC-03.
- `tests/engine/voided-bets.test.ts` — new: SPEC-04 plus a street-scoping unit test.
- `tests/toolchain/advice-voided-bets-import.acceptance.test.ts` — new: SPEC-06 lint probe.

No new dependencies.
