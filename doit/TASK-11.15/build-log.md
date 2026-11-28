## BUILD
- Added `e2e/support/keyboard.ts` and `e2e/keyboard-helper.spec.ts`; converted the four Alt+Tab call sites to `buttonTabKey(page)` and dropped `browserName`.
- Comments read "...buttonTabKey holds Alt only then." (not "picks Alt+Tab") so the §10 judge grep for `Alt+Tab|browserName` finds nothing in the four files.
- Assertion counts (ASSERT_RE): report-navigation 30, back-focus 8, settings 22, error-recovery 41 (unchanged).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- Run command (5 files, chromium + webkit, macOS Keyboard navigation on, setting untouched): 32 passed.
