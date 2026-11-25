## BUILD (2026-11-25)
- Added `botSeatPolicyConfig` (`@typescript-eslint/no-restricted-imports` patterns + side-effect import selector) in `tools/lint/headless-boundary.js`, registered after `botDeterminismConfig`; extracted `BOT_DETERMINISM_RESTRICTED_SYNTAX` (unchanged entries).
- New `tests/toolchain/bot-boundary.acceptance.test.ts` (SPEC-01..03); removed SPEC-09 source scan from `tests/bots/tag.test.ts` (SPEC-04).
- Probed every row of spec §5 behaviour table in-process: all F/P outcomes as specified (incl. nested `../../engine/hand` side-effect and mixed `type Action, applyAction`).
- Negative check: with `botSeatPolicyConfig` unregistered, SPEC-01 and SPEC-02 tests fail (2 failed, 1 passed); restored.
- `npx vitest run` on bot-boundary, tag, bot-determinism: 8/8 passed.
- `npm run lint`: pass. `npm run typecheck`: pass. `npm test`: pass (coverage 92.7% statements).
- `git diff --stat main -- src`: empty. Playtest `--hands 300 --seed 42 --size 6 --lineup tough`: byte-identical to `main` (cmp on output of a `git archive main` copy).
