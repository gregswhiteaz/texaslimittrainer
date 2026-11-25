## BUILD (2026-11-25)
- Added `botSeatPolicyConfig` (`@typescript-eslint/no-restricted-imports` patterns + side-effect import selector) in `tools/lint/headless-boundary.js`, registered after `botDeterminismConfig`; extracted `BOT_DETERMINISM_RESTRICTED_SYNTAX` (unchanged entries).
- New `tests/toolchain/bot-boundary.acceptance.test.ts` (SPEC-01..03); removed SPEC-09 source scan from `tests/bots/tag.test.ts` (SPEC-04).
- Probed every row of spec §5 behaviour table in-process: all F/P outcomes as specified (incl. nested `../../engine/hand` side-effect and mixed `type Action, applyAction`).
- Negative check: with `botSeatPolicyConfig` unregistered, SPEC-01 and SPEC-02 tests fail (2 failed, 1 passed); restored.
- `npx vitest run` on bot-boundary, tag, bot-determinism: 8/8 passed.
- `npm run lint`: pass. `npm run typecheck`: pass. `npm test`: pass (coverage 92.7% statements).
- `git diff --stat main -- src`: empty. Playtest `--hands 300 --seed 42 --size 6 --lineup tough`: byte-identical to `main` (cmp on output of a `git archive main` copy).

## FIX round 1
- Item 1 (MAJOR non-normalized-engine-path-bypass): fixed — added first `BOT_BOUNDARY_PATTERNS` entry `/\./|//|(^|/)[^./][^/]*/\.\.(/|$)` (rejects `/./`, `//`, `name/..`; leaves `./x`, `../engine/hand`, `../../engine/hand` unaffected). Added SPEC-01 probes `dot-segment`, `double-slash`, `parent-segment` and REACH probe `side-effect-dot`.
- Negative check: with the new pattern removed, the SPEC-01 test fails (1 failed, 2 passed: no lint error for `dot-segment.ts`); `side-effect-dot` was already caught by the side-effect selector. Restored: 3/3 passed.
- `npm run lint`: pass. `npm run typecheck`: pass. `npm test`: pass (coverage 92.7% statements). `npx vitest run`: 314 files passed / 5 skipped; 1418 tests passed / 46 skipped.
