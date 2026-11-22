# Changes — TASK-6.7

- `src/bots/lineup.ts` — added `resolveLineUpName` (REQ-009.6 Preset vs Custom against the chosen preset only), `lineUpSessionConfig` (Start game `SessionConfig` with the resolved name and actual seat styles/names), and a private seat-shape check; type-only imports from `../table/session`.
- `src/table/session.ts` — reworded the `LineUpName` doc comment to the chosen-preset rule (D-1).
- `tests/bots/lineup-name.acceptance.test.ts` — new acceptance tests for AC#1–AC#4 (SPEC-01..04).
- `tests/bots/lineup.test.ts` — unit tests for SPEC-05 (default user seat, chosen-preset rule, names ignored, sit-and-go base, no mutation) and SPEC-06 (every RangeError path, plus two-rule cases pinning the §5 check order).

No new dependencies.
