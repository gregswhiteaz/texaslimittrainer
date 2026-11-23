# TASK-3.10 changes

- `src/table/session-record.ts` — new, headless: SessionRecord / SessionRecordSeat / SessionMeta types, sessionRecord, handWrite, parseSessionRecord (rejects `hand`/`actions`, D-4), restoreSession (SPEC-01, 05–12).
- `src/table/session.ts` — exported LINE_UPS / SPEEDS / isSeatName; assertSessionConfig (rules §5.1); resolveSessionConfig made self-consistent and validated (D-6, SPEC-07, SPEC-11).
- `src/table/hand-record.ts` — HandStore gains add(record, session?), putSession, getSession; isWhole exported; parseHandRecord: dense arrays, 1–40 char names, length bounds, level vs game type, seats named must be dealt in, one pair per seat, no repeated card (SPEC-13); LINE_UPS now from session.ts.
- `src/storage/hand-store.ts` — DB_VERSION 2, SESSIONS_STORE created when oldVersion < 2 (D-5); add with a session writes both stores in one strict transaction; putSession / getSession (validated on read) (SPEC-04, SPEC-14).
- `src/ui/table/useTableSession.ts` — start record put at mount (failure logged, A-3); at hand end handWrite + add(record, session) chained after the start write (D-2).
- `src/engine/hand.ts` — exported assertChips (stake + stack rules moved out of validate, unchanged messages; validate calls it after the deck check); createHand rejects sparse, non-object and array seat entries with 'Invalid hand config'; seat/button messages use echoValue (SPEC-08–10).
- `src/engine/deck.ts` — isReplayCode(text: unknown) rejects non-strings without coercion; shuffledDeck echoes with echoValue (SPEC-09).
- `src/engine/cards.ts` — echoValue(value: unknown): never calls a hostile toString (SPEC-09).
- `e2e/support/hand-records.ts` — opens tlh-trainer at v2 (creating hands and sessions as the app does); readStore(store) page reader; storedSessions helper.
- `e2e/support/records-harness.tsx` — wrapper store forwards the session to add and adds putSession / getSession.
- `package.json` — `e2e/session-kill.spec.ts` appended to `e2e:slow` (A-7).
- `tests/storage/session-records.acceptance.test.ts` — new acceptance: SPEC-01 (plus a sit-and-go round trip), SPEC-04, SPEC-05, SPEC-06.
- `tests/table/session-restore.acceptance.test.ts` — new acceptance: SPEC-07 to SPEC-12.
- `tests/table/hand-record-validation.acceptance.test.ts` — new acceptance: SPEC-13.
- `tests/storage/hand-store.test.ts` — DB_VERSION 2 / SESSIONS_STORE tuple, VersionError probe at version 3 (also getSession/putSession), new v1→v2 upgrade test with session round-trip and validated getSession (SPEC-14), putSession strict-durability assertion.
- `tests/table/hand-record.test.ts` — unit re-pin: the corrupt-value helper opens the test database at version 2 instead of 1 (opening at 1 after the store upgraded to 2 is a VersionError, so the test hung); no assertion changed.
- `e2e/session-records.spec.ts` — new acceptance, every push (Chromium + WebKit): SPEC-02.
- `e2e/session-kill.spec.ts` — new acceptance, opt-in slow, Chromium only: SPEC-03.
- `docs/storage/sessions.md` — new: store, key, every field, start and per-hand writes, single transaction, next-hand state, no in-progress hand, validation and restore, upgrade rule, kill spec (SPEC-17).
- `docs/storage/hand-records.md` — DB v2 note, sessions link, combined write, new parse rules, e2e readers at v2 (SPEC-17).

No new dependency.
