# TASK-3.20 changes

- `e2e/cards.spec.ts` — modified: colour check now reads the computed paint of every rank/suit `<path>` (`facePaint` + `colourMismatches`); logo test also asserts `logoProblems` is empty (visibility, box, decode); new geometry test `partsOutsideCard` (path bbox + half stroke via getScreenCTM, inside the card rect); in-suite mutation tests for each check (SPEC-01..03).
- `e2e/cards.visual.spec.ts` — modified: runs on macOS, or on Linux when `TLH_VISUAL_LINUX=1` (A-3).
- `.github/workflows/visual.yml` — new: `Visual` workflow running the card visual spec in `mcr.microsoft.com/playwright:v<lockfile version>-noble` as `--user 1001`; uploads `card-visual-baselines` and `card-visual-report` artifacts (SPEC-04).
- `tests/ci/visual-workflow.test.ts` — new: structural checks of `visual.yml` and presence of the 6 Linux baselines (SPEC-04).
- `tests/ui/card-art.test.ts` — modified: removed the `glyphs fit the card` test and its now-unused imports (AC#4, A-6).
- `README.md` — modified: "Card visual baselines" subsection under "Continuous integration".
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-chromium-linux.png` — new: Linux baseline from Visual run 44668550588 artifact `card-visual-baselines`, copied unchanged.
- `e2e/cards.visual.spec.ts-snapshots/faces-two-colour-webkit-linux.png` — new: Linux baseline from Visual run 44668550588 artifact `card-visual-baselines`, copied unchanged.
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-chromium-linux.png` — new: Linux baseline from Visual run 44668550588 artifact `card-visual-baselines`, copied unchanged.
- `e2e/cards.visual.spec.ts-snapshots/faces-four-colour-webkit-linux.png` — new: Linux baseline from Visual run 44668550588 artifact `card-visual-baselines`, copied unchanged.
- `e2e/cards.visual.spec.ts-snapshots/card-back-chromium-linux.png` — new: Linux baseline from Visual run 44668550588 artifact `card-visual-baselines`, copied unchanged.
- `e2e/cards.visual.spec.ts-snapshots/card-back-webkit-linux.png` — new: Linux baseline from Visual run 44668550588 artifact `card-visual-baselines`, copied unchanged.
- `.claude/settings.json` — modified (user-applied before this run, committed here): autopilot push/merge permissions; force-push, delete, rebase and hard reset denied.

No new dependencies.
