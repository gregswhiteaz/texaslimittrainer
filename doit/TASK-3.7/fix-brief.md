# Fix brief — TASK-3.7 (code review R1 NIT, strengthen-only)

In `tests/ui/action-bar-limits.acceptance.test.tsx` SPEC-11 (unlocked for this, add-only): add a case with a disabled
bar model whose buttons carry real (non-null) actions; firing each button's onClick must not call onAct. Prove it fails
if the click guard's `model.enabled` check is removed (exact text replacement in src/ui/table/ActionBar.tsx, then restore).
Don't change existing assertions. `npm run format` before the gate. Never push.
