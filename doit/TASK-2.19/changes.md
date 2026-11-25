# TASK-2.19 changes

- `src/ui/styles.css` — `.config-seats li` gets `flex-wrap: wrap` and `.config-style` gets `margin-left: auto`, so on phone widths each bot row's Style control wraps to its own line, right-aligned (D-1). Desktop rows unchanged.
- `e2e/config-phone-width.spec.ts` — new acceptance spec (SPEC-01, SPEC-02): no sideways scroll and 16 px panel gutters at 320/375 px with 10 players; every bot row's seat, name and Style select visible inside the viewport, select ≥ 44×44, and choosing Maniac for Ivy works.

No new dependencies.
