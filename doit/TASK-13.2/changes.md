# TASK-13.2 changes

- `src/storage/persistent-storage.ts` (new): `PersistentStorageReader`/`Writer`, `parsePersistentStorage`, `browserPersist`, `requestPersistenceOnce`.
- `src/storage/hand-store.ts`: `DB_VERSION = 5`, `META_STORE`, `PERSISTENT_STORAGE_KEY`, the `oldVersion < 5` step, `readPersistentStorage`/`writePersistentStorage`, `AppStore` type on `openHandStore`/`sharedHandStore`.
- `src/main.tsx`: starts `requestPersistenceOnce(sharedHandStore(), browserPersist(navigator))` after render, not awaited.
- `tests/storage/persistent-storage.test.ts` (new): unit tests SPEC-05..SPEC-08 (incl. a v4 database with hands, sessions, reports and settings upgraded to v5).
- `e2e/persistent-storage.spec.ts` (new): acceptance tests SPEC-01..SPEC-04 (Chromium and WebKit); persist stubbed from init scripts only.
- `e2e/support/hand-records.ts`: opens `tlh-trainer` at 5 and mirrors the v5 `meta` step (3 helpers); comments updated.
- `tests/storage/settings-store.test.ts`: version 4 -> 5, store list adds `meta`.
- `tests/storage/hand-store.test.ts`: pinned `DB_VERSION` 4 -> 5.
- `tests/storage/session-end.acceptance.test.ts` (TASK-10.1, unlocked by Q-1): `DB_VERSION` 4 -> 5 (and its comment), store list adds `meta`.
- `e2e/home-control.spec.ts` (TASK-2.14, unlocked by Q-1): store list adds `meta` (and its doc comment).
- `e2e/opponent-styles.spec.ts` (TASK-12.2, unlocked by Q-1): `indexedDB.open('tlh-trainer', 4)` -> `5`.
- `docs/storage/persistent-storage.md` (new): record, launch rule, failure handling, TASK-12.9 accessor, Reset note.
- `docs/storage/settings.md`: version 5 / `meta` step.

No new dependencies.
