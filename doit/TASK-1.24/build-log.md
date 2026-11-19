
## BUILD (2026-11-18)
- Added `.github/dependabot.yml`, `tools/git/prune-merged-branches.js`, four test files and three README subsections per spec §5.
- `npx vitest run tests/git tests/ci/dependabot.acceptance.test.ts tests/ci/branch-protection.acceptance.test.ts`: 4 files, 10 tests passed.
- `npm test`: 80 files passed; 292 tests passed, 2 skipped.
- `npm run lint`: clean. `npm run typecheck`: clean. Prettier run on all new/changed files.
- Dry run in the project root (`node tools/git/prune-merged-branches.js`, no `--apply`): exit 0, 25 local merged `doit/*` branches listed, nothing deleted.
- Changed lines ~512 vs budget 470 (acceptance test grew from Prettier wrapping and fixture isolation; README follows the prescribed text).
