# Fix brief — TASK-2.2 (judge R1 J-1-01 MEDIUM, test-only, strengthen-only)
Mutant survived: the "You · Seat n" row on Game Config keeping the original config's seat after a different size is picked.
In e2e/players-choice.spec.ts (unlocked for this), after selecting each size, assert the You row reads `Seat ${Math.min(5, n)}`
(both browsers). Prove it: temporarily make the row use the original config's seat → the test fails; restore byte-for-byte.
Add no other changes. `npm run format`; run the spec in Chromium and WebKit; gate. Never push.
