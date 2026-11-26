
## Build (BUILD mode, 2026-11-26)
- Applied all six edits per spec §5; Rock text uses "ace-jack offsuit (AJo)" per qa.md orchestrator note. Did not run the unlock (done by orchestrator under TASK-6.8).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npx vitest run` on replacement.acceptance, cli, style, rock.acceptance, maniac.acceptance: 5 files, 31 tests passed.
- `npm test`: 326 files passed, 7 skipped; 1456 tests passed, 52 skipped (coverage 92.71% statements).
- SPEC-02: `grep -c replacedStylesOption src/playtest/cli.ts` → 0; `--styles` replay prints the expected Options/Line-up lines.
- SPEC-04 node check: true, true.
- `doit.py test-integrity TASK-6.26`: exit 0, no warnings.
- `npm run playtest -- --hands 2000 --lineup mixed --seed 42`: Invariant violations: 0, Bots replaced: 29.
