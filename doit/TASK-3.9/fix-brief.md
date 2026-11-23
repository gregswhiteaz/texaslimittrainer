# TASK-3.9 fix brief (review round 1 MINOR/NIT, done in-story)

1. Code MINOR — tests/storage/hand-store.test.ts: record the options passed to `transaction` (wrap the fake IDB) and assert `{ durability: 'strict' }` for the write, so removing it fails a test.
2. Security MINOR 1 — wording: spec-facing docs (`docs/storage/hand-records.md`) currently say unshown bot cards are never stored. Correct it: the record stores the replay code (required by REQ-052.2), from which the full deck can be rebuilt; screens that read records must show only the user's cards and cards shown at showdown and must never deal cards from a stored replay code for display. (Do not edit spec.md.)
3. NIT — move the hook's description comment in src/ui/table/useTableSession.ts to sit directly above `export function useTableSession`.
Then npm run format and the gate. Paths in backticks only in changes.md lines.
