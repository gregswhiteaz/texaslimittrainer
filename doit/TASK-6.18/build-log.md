## BUILD 1 (blocked)
- Worked example checked against the real code first: seat 3 → 1927253632 (k=0), 3219888363 (k=1); seat 1 → 1024787557; seat 2 → 2122845982. These match the spec, so there's no deviation.
- Implemented every spec item (see changes.md). Wrote the SPEC-01..08 tests.
- `npm run format`: clean. `npm run lint`: 0 errors. `npm run typecheck`: 0 errors.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → a15b837584e3b0630a6f29fd532df0f78327b3b4507d8c79ed988c60fb8c4dc7 (matches SPEC-09).
- Targeted vitest: new and modified files 14/14 pass. The locked tests/toolchain/boundary.property.test.ts passes.
- `npm test`: 151 files passed, 1 failed, 1 skipped; 526 tests passed, 1 failed, 7 skipped. Failure: tests/bots/tag.test.ts::bots import only PlayerView-boundary types from the engine (TASK-6.1 SPEC-09). src/bots/random.ts's runtime seeded-random import and its ReplayCode type import, both required by the spec, break it. Editing that test was denied by the permission system, so I wrote blocked.json. `npm run e2e` was not run because the build is blocked.

## FIX 1 (fix-brief.md, option b)
- Moved the seed derivation: fixed. `src/bots/random.ts` became `src/engine/bot-random.ts` (same content, with relative engine imports). Imports updated in policy.ts (the re-export is kept), session.ts, advice-service.ts and the 4 test files. Test paths are unchanged (SPEC-06 still lives in `tests/bots/random.test.ts`). This is a recorded deviation from spec §5 / SPEC-10, which says `src/bots/random.ts`.
- TAG generator typed by shape: fixed. `BotRandom { nextUint32(): number }` in src/bots/tag.ts, with no engine import beyond the allowed ones. `tests/bots/tag.test.ts` is untouched and passes.
- blocked.json deleted.
- `npm run format`: clean. Lint and typecheck: 0 errors. `npm test`: 152 files passed, 1 skipped; 527 tests passed, 7 skipped. Coverage thresholds met.
- Playtest SHA: a15b837584e3b0630a6f29fd532df0f78327b3b4507d8c79ed988c60fb8c4dc7 (matches SPEC-09).
- `npm run e2e`: 130 passed, 12 skipped.
