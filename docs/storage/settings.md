# Settings record (REQ-050)

The trainer's settings are one record in IndexedDB. TASK-12.1 creates the store and its default record; the
Settings controls that change it come with later stories (TASK-12.2, 12.4-12.9), which also add the write API.
Nothing in the app reads the record yet.

- `src/table/settings.ts` (headless): the `Settings` type, `DEFAULT_SETTINGS`, the `parseSettings(…)` validator
  and the `SettingsReader` interface.
- `src/storage/hand-store.ts` (browser): `SETTINGS_STORE`, `SETTINGS_KEY`, the version 4 upgrade step and
  `readSettings()` on `openHandStore` / `sharedHandStore`.

## Database

| Item         | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Database     | `tlh-trainer`, version `4` (version 4 adds `settings`)                   |
| Object store | `settings` (next to `hands`, `sessions` and `reports`)                   |
| Key          | out-of-line keys (no `keyPath`); the one record has the key `'settings'` |
| Indexes      | none                                                                     |

The `if (oldVersion < 4)` step of `onupgradeneeded` creates the store and puts a copy of `DEFAULT_SETTINGS`
under `'settings'`. It runs on a first launch and when an existing version 1-3 database is upgraded; the
`hands`, `sessions` and `reports` stores and their records are untouched. Out-of-line keys leave room for other
records later (for example TASK-12.9's storage-warning flag).

## Fields

| Field                | Type                       | Default   | Requirement |
| -------------------- | -------------------------- | --------- | ----------- |
| `defaultSpeed`       | `'rapid'` \| `'realistic'` | `'rapid'` | REQ-050.1   |
| `autoOpenReview`     | boolean                    | `true`    | REQ-050.2   |
| `showOpponentStyles` | boolean                    | `true`    | REQ-050.3   |
| `fourColourDeck`     | boolean                    | `false`   | REQ-050.4   |
| `botBanter`          | boolean                    | `true`    | E12-S07     |

`DEFAULT_SETTINGS` is frozen.

## Reading

`readSettings()` reads the key `'settings'` in a read-only transaction:

- No record: resolves `DEFAULT_SETTINGS`.
- A record: resolves `parseSettings(record)`. The record must be a non-null, non-array object with all five
  fields of the right type. Extra fields are ignored and left out of the result. Otherwise it rejects with
  `RangeError('Invalid settings: <field>')`, naming the first bad or missing field in the table's order
  (`settings` when the record is not an object). There is no silent fallback; callers decide.
- If the database cannot be opened (for example `VersionError`), it rejects with that error, like every other
  store call.

## Tests

- `tests/table/settings.test.ts`: `parseSettings` and the defaults.
- `tests/storage/settings-store.test.ts` (Vitest with `fake-indexeddb`): a new database stores the defaults, a
  missing or invalid record, and an upgrade from a version 3 database with data.
- `e2e/support/hand-records.ts` opens the database at version 4 and mirrors the version 4 step.
