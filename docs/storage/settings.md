# Settings record (REQ-050)

The trainer's settings are one record in IndexedDB. TASK-12.1 creates the store and its default record.
TASK-12.2 adds the writer and the app's reader (App state) with the first control, `showOpponentStyles`; the
other Settings controls come with later stories (TASK-12.4-12.9, TASK-2.11).

- `src/table/settings.ts` (headless): the `Settings` type, `DEFAULT_SETTINGS`, the `parseSettings(…)` validator
  and the `SettingsReader` / `SettingsWriter` interfaces.
- `src/storage/hand-store.ts` (browser): `SETTINGS_STORE`, `SETTINGS_KEY`, the version 4 upgrade step and
  `readSettings()` / `writeSettings(…)` on `openHandStore` / `sharedHandStore`.

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

## Writing

`writeSettings(settings)` replaces the whole record:

- It first validates and copies `settings` with `parseSettings`, so an invalid value rejects with
  `RangeError('Invalid settings: <field>')` before any transaction and the stored record is unchanged. Extra
  fields are not stored.
- It puts the copy under `'settings'` in a `readwrite` transaction with `durability: 'strict'` and resolves when
  the transaction completes. A database or transaction error rejects with that error.
- Writes started back to back need no queue: each one waits for the same opened database, so their transactions
  are created in call order and the last one wins.

## The App reader

`src/ui/App.tsx` holds the settings as state (`Settings | undefined`):

- At launch a mount effect calls `readSettings()` once. Until it settles the state is `undefined`: the Settings
  controls are disabled and the Table uses `DEFAULT_SETTINGS`. If the read rejects (database error or an
  invalid record), App logs `Settings could not be read` and uses `DEFAULT_SETTINGS`; the next change then
  overwrites the bad record with a valid one.
- A Settings control calls `changeSettings(next)` with the whole new record. App updates the state first (the
  change shows on the next render of any mounted screen) and then calls `writeSettings(next)`. A failed save is
  only logged (`Settings could not be saved`); the new value stays in memory for this launch.
- Consumers get values from this state: `SettingsScreen` receives `settings` and `onSettingsChange`, and the
  Table receives `showOpponentStyles` (REQ-050.3: bot seats show no style label when it is `false`).

## Tests

- `tests/table/settings.test.ts`: `parseSettings` and the defaults.
- `tests/storage/settings-store.test.ts` (Vitest with `fake-indexeddb`): a new database stores the defaults, a
  missing or invalid record, and an upgrade from a version 3 database with data.
- `tests/storage/settings-write.test.ts`: `writeSettings` replaces, validates, strips extra fields and keeps the
  last of two back-to-back writes.
- `e2e/opponent-styles.spec.ts`: the toggle's save, its reload, and the defaults shown for an invalid record.
- `e2e/support/hand-records.ts` opens the database at version 4 and mirrors the version 4 step.
