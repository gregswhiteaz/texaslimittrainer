# Changes — TASK-6.1

- `src/bots/tag.ts` — new: `FREE_CHECK_EQUITY` stand-in, `decideTag(view, options?)` (returns `recommend(view).move`; free postflop checks skip the equity run, D-2) and `tagPolicy`.
- `src/playtest/runner.ts` — modified: exported `defaultPolicyFactory(size)` (TAG at 6 players, seeded random-move elsewhere, D-3); `playHand` uses it when `seams.makePolicy` is absent; doc comments updated (A-7).
- `src/advice/equity.ts` — modified: `Table` parameter property replaced by a declared `readonly c` field assigned in the constructor so Node type stripping can load it (A-4, no behaviour change).
- `src/advice/preflop.ts` — modified: chart JSON import gets `with { type: 'json' }` so Node ESM can load it (A-4, no behaviour change).
- `tests/bots/tag.acceptance.test.ts` — new: SPEC-01..SPEC-04 acceptance tests.
- `tests/bots/tag-playtest.acceptance.test.ts` — new: SPEC-05, SPEC-06 acceptance tests (spawned CLI run; `vi.mock` spy on recommend).
- `tests/bots/tag.test.ts` — new: SPEC-07, SPEC-08, SPEC-09 unit tests.
- `tests/playtest/runner.test.ts` — modified: SPEC-10 unit test (default seat policy by table size).

No new dependencies.
