# TASK-3.9 changes

- `package.json` — fake-indexeddb 6.2.8 exact-pinned dev dependency (D-3/Q-3); `e2e/hand-records-kill.spec.ts` appended to `e2e:slow` (A-5).
- `package-lock.json` — lockfile entry for fake-indexeddb 6.2.8.
- `src/table/session.ts` — TableState.botIds / nextBotId, initialBotIds, a replacement bot gets the next id, botId on CompletedHand.seats (A-1, SPEC-17).
- `src/table/hand-record.ts` — new, headless: HandRecord / HandRecordSeat / HandRecordMeta / HandStore types, handRecord builder, parseHandRecord validator (SPEC-05..08, SPEC-16).
- `src/storage/hand-store.ts` — new, browser: IndexedDB add-only HandStore (tlh-trainer v1, hands store, compound key, strict durability, validate on read), openHandStore, sharedHandStore (D-1, A-3).
- `src/ui/table/useTableSession.ts` — session id per mount, record written at hand end, auto-deal and dealNext wait for the write, failed write deals nothing (D-2), onHandComplete through a ref (D-5), handStore option (A-4).
- `tests/support/table-scenarios.ts` — tableAt literal gains botIds / nextBotId (A-2).
- `tests/table/session.acceptance.test.ts` — re-pin (Block 1, option 1; unlocked under TASK-3.1): expected CompletedHand seats gain botId 1, 2, 3, 4, null, 5.
- `tests/stats/style-stats.test.ts` — re-pin (Block 1, option 1): CompletedHand literal seats gain botId null / 1.
- `tests/storage/hand-records.acceptance.test.ts` — new acceptance: SPEC-05 (unit half), SPEC-06, SPEC-07, SPEC-08, SPEC-10.
- `tests/storage/hand-store.test.ts` — new unit: SPEC-12 (1,000 old records kept, get of a missing key, open failure rejects).
- `tests/table/hand-record.test.ts` — new unit: SPEC-16 (parser rejections, corrupt stored value, handRecord argument errors), sit-and-go mapping, SPEC-17 (bot ids).
- `e2e/support/records-harness.tsx` — new test-only harness: Table with an injectable real / delayed / failing store and a parent that re-renders with a new onHandComplete every 100 ms.
- `e2e/support/table-harness-bundle.ts` — buildRecordsHarness, openRecordsHarness.
- `e2e/support/hand-records.ts` — new: raw IndexedDB read/seed helpers run in the page; playToResult / advanceToHand helpers.
- `e2e/hand-records.spec.ts` — new acceptance (every push, Chromium + WebKit): SPEC-01, 03, 04, 05, 09, 11, 13, 14, 15.
- `e2e/hand-records-kill.spec.ts` — new acceptance, opt-in slow, Chromium only: SPEC-02.
- `docs/storage/hand-records.md` — new: database, record fields, write-before-deal ordering, immutability, failure, validation, test seam, kill test (SPEC-19).

New dependency: fake-indexeddb 6.2.8 (dev only, Apache-2.0, no runtime dependencies) for fast IndexedDB tests in Node (D-3).
