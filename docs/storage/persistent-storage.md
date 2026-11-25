# Persistent-storage record (REQ-052.4)

On the first launch the app asks the browser to keep its storage (`navigator.storage.persist()`), so training
history is not cleared silently under storage pressure. The answer is stored once and read by TASK-12.9's
Settings warning. Nothing on screen changes in TASK-13.2.

- `src/storage/persistent-storage.ts`: the `PersistentStorageReader` / `PersistentStorageWriter` interfaces,
  `parsePersistentStorage(…)`, `browserPersist(navigator)` and `requestPersistenceOnce(store, persist)`.
- `src/storage/hand-store.ts`: `META_STORE`, `PERSISTENT_STORAGE_KEY`, the version 5 upgrade step and
  `readPersistentStorage()` / `writePersistentStorage(…)` on `openHandStore` / `sharedHandStore`.
- `src/main.tsx`: starts `requestPersistenceOnce(sharedHandStore(), browserPersist(navigator))` after the first
  render. It is not awaited, so it never delays Home.

## Database

| Item         | Value                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `5` (version 5 adds `meta`)                            |
| Object store | `meta` (next to `hands`, `sessions`, `reports` and `settings`)                |
| Key          | out-of-line keys (no `keyPath`); the record has the key `'persistentStorage'` |
| Value        | `{ granted: true }` or `{ granted: false }`                                   |

The `if (oldVersion < 5)` step creates the empty store. It runs on a first launch and when an existing version
1-4 database is upgraded; every other store and record is untouched. No record means "not asked yet".

## The launch rule

`requestPersistenceOnce` runs once per page load:

1. It reads the record. If a valid record exists, it returns it and does not call `persist` again, whatever the
   stored answer is.
2. Otherwise it calls `persist` once. `granted` is `true` only when the call resolves to exactly `true`. A
   missing API (`navigator.storage` or `navigator.storage.persist` undefined), a rejection, a synchronous throw
   or any other resolved value gives `false`.
3. It writes `{ granted }` in a `readwrite` transaction with `durability: 'strict'`.

`browserPersist` calls `persist` as a method of `navigator.storage` (a detached call throws in browsers).

## Failure handling

The function never rejects, so no failure reaches the error screen and Home always opens.

- Read fails (database cannot be opened, read error): `persist` is not called and the app logs
  `Persistent storage could not be checked`.
- Write fails: the app logs `Persistent storage result could not be saved`. No record is stored, so the next
  launch asks again.
- An invalid record (anything but `{ granted: boolean }`) reads as no record; the next launch asks again and
  overwrites it.
- A `persist` call that never settles (Firefox's prompt left open) records nothing; the next launch asks again.

## Reading the result (TASK-12.9)

`readPersistentStorage()` resolves `true` or `false` for a stored answer and `null` when nothing valid is
stored (not asked yet, the write failed, or the record is invalid). The recommended Settings handling is to show
the warning for `false` and for `null`. Tests can set the record directly by putting `{ granted: false }` under
`'persistentStorage'` in `meta`.

## Reset all data

Reset all data (E12) must clear the `meta` store too. With no record, the next launch asks again.

## Tests

- `tests/storage/persistent-storage.test.ts` (Vitest with `fake-indexeddb`): the launch rule for every answer,
  read and write failures, `browserPersist`, and the version 5 upgrade of a version 4 database with data.
- `e2e/persistent-storage.spec.ts` (Chromium and WebKit): the real answer in Chromium, a refused, missing or
  rejecting API, and a relaunch that does not ask again. `persist` is replaced from Playwright init scripts only;
  there is no test hook in `src/`.
