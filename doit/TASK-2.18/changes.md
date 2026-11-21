# TASK-2.18 changes

- `e2e/home-first-load.spec.ts` (new): SPEC-01, first load of Home leaves focus on the body, not the h1.
- `tests/ui/user-seat-cards.acceptance.test.tsx` (new): SPEC-02, the user's face-up cards are the configured user seat's engine hole cards.
- `tests/table/session-stacks.acceptance.test.ts` (new): SPEC-03, `seatSession` stacks follow `config.seats` (seats 1,3,5,7,9).

No production code changes. No new dependencies.
