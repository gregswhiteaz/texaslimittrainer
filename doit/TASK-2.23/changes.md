# Changes — TASK-2.23

- `tests/storage/end-recheck.acceptance.test.ts` — `an already-ended session is not ended again`: one `endSession` call per case; its promise is asserted with both `toBeInstanceOf(DOMException)` and `toMatchObject({ name: 'ConstraintError' })` (SPEC-01, SPEC-02, D-1).
- `e2e/end-session-hardening.spec.ts` — replaced the `started?.sessionId as string` cast with a `typeof id !== 'string'` guard that throws `no new session id` (SPEC-03, D-2).

No new dependencies.
