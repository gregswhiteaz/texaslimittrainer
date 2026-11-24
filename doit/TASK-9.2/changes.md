# TASK-9.2 changes

- `src/ui/table/Table.tsx` — held-review button reads `Continue` when `userBusted(table)`, else `Deal next hand`; two comments updated.
- `tests/ui/bust-dialog.acceptance.test.tsx` — locked TASK-3.11 test, A-6 edit: held bust review expects `>Continue</button>` and no `Deal next hand` (the `<dialog` check stays).
- `tests/ui/bust-continue.acceptance.test.tsx` — new: SPEC-01, SPEC-02 markup checks and SPEC-03 headless pin of the e2e seed.
- `e2e/bust-continue.spec.ts` — new: SPEC-04, SPEC-05 live flow (Continue → Out of chips dialog → Rebuy / Leave table) in Chromium and WebKit with axe.
- `docs/ui/navigation.md` — "Continue on a bust" paragraph after the bust-dialog paragraph.

No new dependencies.
