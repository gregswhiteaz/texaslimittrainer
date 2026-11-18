# Changes — TASK-7.4

- `src/advice/grade.ts` — new: grade types, `GRADE_LABELS`, `GRADE_RULE_IDS`, grader input types, `gradeDecision` (REQ-038 rules in tenths of a point), `gradeView` (legality check + one `recommend` call).
- `tests/advice/grade.acceptance.test.ts` — new: acceptance tests AC#1–AC#8 and the exact-boundary rounding cases (SPEC-01–08, SPEC-17).
- `tests/advice/grade.test.ts` — new: unit tests for margin boundary tables, missing calling-range equity, errors, determinism/plain data/type compatibility (SPEC-09–12).

No new dependencies.
