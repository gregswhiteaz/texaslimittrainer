# TASK-1.22 changes

- `tests/engine/review-gaps.acceptance.test.ts` — new: acceptance tests pinning the third-kicker one-pair comparison (SPEC-01), fold eligibility and retained contributions incl. a folded small blind (SPEC-02), and SB == BB accepted with SB > BB rejected (SPEC-03).

No `src/` changes. No new dependencies.
- Review R1 MINOR applied by orchestrator: non-empty pots assertion added before the blind-fold every() check.
