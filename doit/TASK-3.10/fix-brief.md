# TASK-3.10 fix brief (judge J-1-01, done in-story; strengthen only)

Add a test (in tests/table/session-restore.acceptance.test.ts — unlocked under TASK-3.10 — or a unit file if cleaner) that
takes a valid stored session record, swaps the `kind` of the user seat and one bot seat in the record's `seats` (so the
record's user is now on a bot seat while the config is unchanged), and expects parseSessionRecord/restoreSession to throw a
RangeError (REQ-025: a crafted record must not move the user's view onto a bot). Confirm the test fails if the
record-seat-kind vs config-seat-kind check in src/table/session-record.ts is removed (temp edit, then restore).
No other changes. npm run format, then the gate. Note it in build-log.md and changes.md (path in backticks only).
