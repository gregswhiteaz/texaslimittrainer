# TASK-11.15 Q&A

## Q-1 Prove the "without Full Keyboard Access" case by toggling macOS Keyboard navigation?
**Answer: No — prove it with the setting ON on this Mac + Linux CI (Recommended).** Do not touch system settings. The off case is covered by the helper's Tab-then-Alt+Tab fallback and its own helper test.

## Q-2 Include e2e/back-focus.spec.ts, e2e/settings.spec.ts and e2e/error-recovery.spec.ts?
**Answer: Include them here (Recommended).** Added to scope as AC#2 (new). Locked-file edits under their owners; no assertion changed.
