# Q&A — TASK-7.4

## Q-1 — Grade result shape and entry points (D-1; public interface, persisted format)
Asked 2026-11-18. Options: approve GradeResult with stable codes + GRADE_LABELS (Recommended) / labels as values / omit recommendation / export only gradeView.
**Answer (user):** Approve (Recommended) — `GradeResult<R> { grade: 'correct'|'minor'|'major', ruleId, userAction, marginPts: number|null, recommendation: R }`; ruleIds match | alternative | preflop-borderline | preflop-chart | call-fold-margin | aggression-margin | aggression-no-range; display labels in GRADE_LABELS; plain JSON; export gradeDecision and gradeView.

## Q-2 — Bet/raise vs check/call before equityVsCallingRangePct exists (D-2)
Asked 2026-11-18. Options: Minor with aggression-no-range, marginPts null (Recommended) / grade by equity vs any hand / Correct / throw.
**Answer (user):** Minor error for now (Recommended) — rule `aggression-no-range`, marginPts null, until TASK-7.8 adds the calling-range number.
