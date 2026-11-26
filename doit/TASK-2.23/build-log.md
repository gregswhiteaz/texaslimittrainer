## BUILD (2026-11-26)
- SPEC-01/02: `tests/storage/end-recheck.acceptance.test.ts` — one `endSession` call per case stored in `result`, both `.rejects` matchers on it (labelled); after-checks unchanged.
- SPEC-03: `e2e/end-session-hardening.spec.ts` — `as string` cast replaced by `typeof id !== 'string'` guard throwing `no new session id`.
- `npm run format` ok. Greps: endSession( 1, toBeInstanceOf(DOMException) 1, name: 'ConstraintError' 2, toBe(ENDED_AT) 2, " as string" in e2e 0.
- `npm test`: 325 files passed / 7 skipped; 1454 tests passed / 52 skipped. `npm run lint` ok. `npm run typecheck` ok.
- `npm run build` then `npx playwright test e2e/end-session-hardening.spec.ts`: 4 passed (chromium + webkit).
- Diff: 2 files, +5/-9.
