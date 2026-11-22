# Fix brief — TASK-6.7 (code review R1 MINOR, in-story, strengthen-only)
1. `tests/bots/lineup.test.ts:102` error-order-not-pinned: add cases that break two rules at once so the §5 check order is
   pinned, e.g. no user seat + a null style → user-seat message; 11 seats + a null style → the message §5 puts first;
   `[]` with preset 'Custom' → numbering message; bad button with `[]` → numbering message. Use the exact §5 order — read it.
Keep every existing assertion. Optional: reuse the user seat from checkedUserSeat instead of `find` + cast (no behaviour change).
`npm run format`; gate; never push.
