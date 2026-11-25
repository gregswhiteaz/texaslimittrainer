# Spec: TASK-13.2 — Ask the browser to keep my history on first launch

Status: READY (approved 2026-11-25)
Task: TASK-13.2 · Parent/epic: TASK-13 · Requirements: REQ-052 (REQ-052.4) · Dream: limit-holdem-trainer

## 1. Summary
On the first launch, meaning no persistent-storage record is stored yet, the app calls `navigator.storage.persist()`
once and stores the result in IndexedDB as one record, `{ granted: boolean }`. The result is not granted when the
API is missing, when the call rejects or when it resolves to anything other than `true`. Later launches find the
record and don't call the API again. The record is read through one store accessor, `readPersistentStorage()`,
which TASK-12.9 (E12-S09) uses for its Settings warning. Nothing on screen changes in this story.

## 2. Scope
- In scope:
  - A `meta` object store (DB version 5) that holds the persistent-storage record. The location was approved by Q-1.
  - Store accessors `readPersistentStorage()` and `writePersistentStorage(granted)` on the app store.
  - `requestPersistenceOnce(store, persist)`: read, then call persist once, then write. Started from `src/main.tsx`
    after the first render, without blocking it.
  - Version 4 to 5 changes in existing tests and e2e helpers that pin the database version or store list (§5).
  - Unit tests, one e2e spec (Chromium and WebKit) and the storage docs.
- Not doing:
  - The Settings warning. That is TASK-12.9.
  - Reset all data. That is E12. It must clear `meta` too, and §5 documents this.
  - Calling `navigator.storage.persisted()`, or asking again on later launches when the result was not granted.
  - Any user-visible text, prompt or screen change.
  - Service-worker or offline work (E13-S07).
  - Any test hook in `src/` or `dist/`. Tests stub the API from Playwright init scripts only.
- Scope budget: files=13, lines=520

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The request starts from `src/main.tsx` after `createRoot(...).render(...)`, as a fire-and-forget promise with a final `.catch`. | yes | `main.tsx` runs once per page load. A `useEffect` in App would run twice under StrictMode and again on every Return Home remount (`src/ui/AppRoot.tsx:84`). `src/main.tsx:14` already starts the advice worker there. | useEffect in App with a module-level once-guard |
| A-2 | If reading the record fails (DB won't open, read error), persist is NOT called. The app logs `console.error('Persistent storage could not be checked', error)`. | yes | Without a readable store the result can't be recorded, and asking without recording would repeat on every launch. | Call persist anyway |
| A-3 | If the write fails after persist resolved, the app logs `console.error('Persistent storage result could not be saved', error)`. With no record stored, the next launch asks again. | yes | Matches the task Note (no record means ask). Calling persist again is harmless. | Retry within the session |
| A-4 | An invalid stored record (not `{ granted: boolean }`) reads as `null`, meaning no record. The next launch asks again and overwrites it. | yes | Self-repairing. This follows the TASK-12.2 pattern where the next write repairs an invalid record. | Reject the read and never ask |
| A-5 | `granted` is `result === true`. A non-boolean resolution counts as not granted. | yes | The task says "not granted" for every failure path. | Treat truthy values as granted |
| A-6 | Every failure is caught inside `requestPersistenceOnce` and `main.tsx`, so no rejection reaches `AppRoot`'s `unhandledrejection` listener (`src/ui/AppRoot.tsx:39-41`). That listener would show the error screen. | yes | AC#3 requires Home to open. | — |
| A-7 | `persist` is called as a method of `navigator.storage` (`storage.persist()`), not detached. | yes | A detached call throws "Illegal invocation" in browsers. | bind |

## 3. Current system
- Storage: `src/storage/hand-store.ts` holds one database, `tlh-trainer`, with `DB_VERSION = 4`
  (`hand-store.ts:23-26`). Upgrade steps are appended as `oldVersion < N` blocks and never touch existing stores
  (`hand-store.ts:35-51`). Settings is one record under an out-of-line key, `SETTINGS_KEY = 'settings'`, in
  `SETTINGS_STORE` (`hand-store.ts:31-33,48-50`). `readSettings`/`writeSettings` are at `hand-store.ts:257-271`.
  The store type is an intersection of reader/writer interfaces (`hand-store.ts:182-185,275-284`).
  `sharedHandStore()` is the app-wide instance and is lazy (`hand-store.ts:278`).
- The settings record shape is pinned by `parseSettings` (`src/table/settings.ts:45-64`) and by many tests. This
  design does not change it.
- App start: `src/main.tsx:14-21` calls `sharedAdviceClient()` and then renders `<AppRoot>` in StrictMode. `main.tsx` is
  excluded from coverage (`vite.config.ts:17`). App reads settings in a mount effect (`src/ui/App.tsx:84-102`).
- `AppRoot` turns any unhandled rejection into the error screen (`src/ui/AppRoot.tsx:34-41`).
- The Home first-load focus behaviour is pinned by `e2e/home-first-load.spec.ts`, locked by TASK-2.18. It is
  unaffected because nothing here renders.
- Tests: `npm test` runs vitest with coverage, using `fake-indexeddb` for storage tests (`tests/storage/settings-store.test.ts:1`).
  `npm run e2e` runs Playwright against `npm run build && npm run preview` in the `chromium` and `webkit` projects
  (`playwright.config.ts:13-18`). The test-only browser-API stub pattern is `page.addInitScript` with no hook in
  `src/` (`e2e/support/fault-injection.ts:3-4`; `e2e/session-end-retry.spec.ts:30-47`).
- TASK-12.9 expects a recorded result where "not granted (including when the API is unavailable)" shows the warning.
  Its tests "set the recorded flag directly". The Notes say "read it through one settings/meta accessor"
  (`backlog task view TASK-12.9`). It can do both with `readPersistentStorage()` and the raw `meta` record defined here.
- Browser behaviour: Chromium resolves `persist()` without a prompt. The grant follows site-engagement and install
  heuristics, so headless Playwright resolves a boolean with no UI. WebKit/Safari also resolves without a prompt.
  It grants for Home Screen web apps and heuristically otherwise. Firefox shows a permission prompt and may leave
  the promise pending until the user answers. Firefox is not a test target. Because the request never blocks
  rendering, a pending promise is harmless. `navigator.storage` is undefined in insecure contexts, so the missing-API
  path is real.
- Existing code to reuse:
  - `src/storage/hand-store.ts` → `opened()` upgrade chain, `requested()`, `completed()`, `readOnly()`, the
    `durability: 'strict'` write pattern used by `writeSettings`.
  - `e2e/support/hand-records.ts::readStore` → raw page-side reads (after the v5 update).
  - `tests/storage/settings-store.test.ts::withDb/request` pattern → raw fake-indexeddb reads in the unit test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Store the result in a new `meta` object store, created by a version-5 upgrade step of `tlh-trainer` with out-of-line keys. The record is `{ granted: boolean }` under key `'persistentStorage'`. | (b) a second key in the `settings` store, which breaks the locked `e2e/opponent-styles.spec.ts` `[DEFAULTS]` getAll checks; (c) a field in the settings record, which changes `parseSettings` and every settings test; (d) a separate IndexedDB database `tlh-trainer-meta`, which needs no test edits but leaves two databases for Reset and REQ-054 | Matches the story ("local app-meta store … next to the stores created by E03-S09") and TASK-12.9's "settings/meta accessor". It follows the established upgrade-step pattern. | yes (persisted format) | user (Q-1) |
| D-2 | `readPersistentStorage(): Promise<boolean \| null>` (null means no valid record). `writePersistentStorage(granted: boolean): Promise<void>` | Expose the raw record | One accessor that TASK-12.9 can use. Null lets 12.9 tell "never recorded" apart from "not granted". | no | n/a |
| D-3 | The locked tests that pin version 4 or the store list are edited mechanically (4 → 5, add `'meta'`). The list and owners are in §5. | Avoid edits via option (d) | Their intent (upgrade keeps records, store list known) is unchanged. | yes (locked-test edits) | user (Q-1): unlocked with reason "TASK-13.2 Q-1"; re-pin version and store names only, keep every check |

## 5. Design

### Files to create / modify
- `src/storage/persistent-storage.ts` (new) — `PersistentStorageReader`/`Writer` interfaces,
  `parsePersistentStorage`, `browserPersist`, `requestPersistenceOnce`.
- `src/storage/hand-store.ts` — `DB_VERSION = 5`, `META_STORE = 'meta'`, `PERSISTENT_STORAGE_KEY = 'persistentStorage'`,
  the `oldVersion < 5` step, the two accessors, and the extended store type on `openHandStore`/`sharedHandStore`.
- `src/main.tsx` — start `requestPersistenceOnce(sharedHandStore(), browserPersist(navigator))` after render.
- `tests/storage/persistent-storage.test.ts` (new) — unit tests (SPEC-05..SPEC-08).
- `e2e/persistent-storage.spec.ts` (new) — acceptance tests (SPEC-01..SPEC-04).
- `e2e/support/hand-records.ts` — the three `indexedDB.open('tlh-trainer', 4)` calls (lines 10, 46, 84) become 5,
  each upgrade adds `if (event.oldVersion < 5) createObjectStore('meta')`, and the comment at lines 6-7 is updated.
  This file is not locked.
- `tests/storage/settings-store.test.ts` — `version` 4 → 5 (lines 73, 128), `names` adds `'meta'` (line 129).
  Not locked.
- `tests/storage/hand-store.test.ts` — the pinned `DB_VERSION` 4 → 5 (line 47). Not locked.
- `tests/storage/session-end.acceptance.test.ts` — LOCKED by TASK-10.1: line 167 `toBe(4)` → `toBe(5)` with the
  comment updated, and line 177 the names list becomes `['hands', 'meta', 'reports', 'sessions', 'settings']`.
- `e2e/home-control.spec.ts` — LOCKED by TASK-2.14: line 113 the names list becomes
  `['hands', 'meta', 'reports', 'sessions', 'settings']`.
- `e2e/opponent-styles.spec.ts` — LOCKED by TASK-12.2: line 143 `indexedDB.open('tlh-trainer', 4)` → `5`. Opening
  at a lower version than the existing one throws `VersionError`.
- `docs/storage/settings.md` — the version line (line 16) and the upgrade-step paragraph mention version 5 / `meta`.
- `docs/storage/persistent-storage.md` (new) — the record, the launch rule, failure handling, how TASK-12.9 reads it,
  and that Reset all data must clear `meta`.

Locked tests checked and NOT changed: `e2e/home-first-load.spec.ts` (TASK-2.18) does no storage reads. `e2e/settings.spec.ts`
(TASK-12.1/12.2), `tests/ui/settings.acceptance.test.tsx` and `tests/ui/home-settings.acceptance.test.tsx` don't pin
the version or store list. `e2e/opponent-styles.spec.ts` `storedSettings` (getAll of `settings`) is unaffected
because the `settings` store gains no record.

### Components, interfaces and data
```ts
// src/storage/persistent-storage.ts
export interface PersistentStorageReader {
  /** true/false = recorded result; null = no valid record (never asked, write failed, invalid record). */
  readPersistentStorage(): Promise<boolean | null>;
}
export interface PersistentStorageWriter {
  /** Puts { granted } under PERSISTENT_STORAGE_KEY in META_STORE (strict durability). */
  writePersistentStorage(granted: boolean): Promise<void>;
}
/** The stored record → its granted flag, or null if `value` is not { granted: boolean }. */
export function parsePersistentStorage(value: unknown): boolean | null;
/** A caller for nav.storage.persist(), or undefined when nav.storage or nav.storage.persist is missing. */
export function browserPersist(nav: Pick<Navigator, 'storage'>): (() => Promise<unknown>) | undefined;
/** Reads the record. If none exists, calls `persist` once and writes `granted`. Resolves to the stored or
 *  recorded flag, or null if it could not read or write. It never rejects. */
export function requestPersistenceOnce(
  store: PersistentStorageReader & PersistentStorageWriter,
  persist: (() => Promise<unknown>) | undefined,
): Promise<boolean | null>;
```
- Stored record (D-1): database `tlh-trainer` v5, store `meta` (out-of-line keys), key `'persistentStorage'`,
  value `{ granted: true }` or `{ granted: false }`. Only this field is written.
- `hand-store.ts` upgrade: `if (event.oldVersion < 5) request.result.createObjectStore(META_STORE);` No record is
  created there. Absence means "not yet asked".

### Rules and algorithms
`requestPersistenceOnce(store, persist)`:
1. `recorded = await store.readPersistentStorage()`. On rejection: `console.error('Persistent storage could not be checked', e)`
   and return null. persist is not called (A-2).
2. If `recorded !== null`, return `recorded` without calling persist (AC#4).
3. `granted = persist === undefined ? false : await persist().then((r) => r === true, () => false)`. A synchronous
   throw from `persist()` also gives false.
4. `await store.writePersistentStorage(granted)`. On rejection: `console.error('Persistent storage result could not be saved', e)`
   and return null (A-3). Otherwise return `granted`.

Worked examples:
| Stored before | navigator.storage.persist | Calls | Stored after |
|---|---|---|---|
| none | resolves true | 1 | `{ granted: true }` |
| none | resolves false | 1 | `{ granted: false }` |
| none | undefined (or `navigator.storage` undefined) | 0 | `{ granted: false }` |
| none | rejects | 1 | `{ granted: false }` |
| `{ granted: false }` | resolves true | 0 | `{ granted: false }` |
| `{ granted: 'yes' }` (invalid) | resolves true | 1 | `{ granted: true }` |

`main.tsx`: after `createRoot(root).render(...)`, `void requestPersistenceOnce(sharedHandStore(), browserPersist(navigator));`.
The function never rejects (A-6).

### Error handling and configuration
- Console messages (not user-visible): `'Persistent storage could not be checked'` and `'Persistent storage result could not be saved'`.
- No configuration and no user-visible text.

## 6. Behaviour specification

### SPEC-01: First launch in Chromium calls persist once and stores its real result
- Verifies: AC#1, DoD#1, DoD#8
- Behaviour: Given a fresh Chromium profile and an init script that wraps the real `navigator.storage.persist`,
  counting calls in `localStorage['tlhPersistCalls']` and recording the resolved value. When `/` is opened, Then
  Home's `TLH Trainer` heading shows, the count is exactly 1, the `meta` record `'persistentStorage'` becomes
  `{ granted: <recorded value> === true }`, and every request URL has the app's origin. The test is skipped outside
  Chromium, because AC#1 names Chromium.
- Verification: acceptance `e2e/persistent-storage.spec.ts::a first launch in Chromium asks once and stores the browser's answer`

### SPEC-02: persist resolving false stores not granted
- Verifies: AC#2, DoD#1
- Behaviour: Given an init script where `persist` resolves `false` and counts calls, When `/` is opened the first time,
  Then the count is 1 and the stored record is `{ granted: false }`. The test runs in Chromium and WebKit.
- Verification: acceptance `e2e/persistent-storage.spec.ts::a refused request is stored as not granted`

### SPEC-03: Missing or rejecting persist stores not granted and Home opens
- Verifies: AC#3, DoD#1
- Behaviour: Given an init script that sets `StorageManager.prototype.persist` to `undefined`, When `/` is opened,
  Then Home's heading is visible, the stored record is `{ granted: false }`, and no `pageerror` occurs. Given instead
  an init script where `persist` rejects with `new DOMException('Injected', 'UnknownError')`, the count is 1, the
  stored record is `{ granted: false }`, the heading is visible, there is no `pageerror`, and no `Something went wrong`
  error screen shows. The test runs in Chromium and WebKit.
- Verification: acceptance `e2e/persistent-storage.spec.ts::a missing or failing persistent-storage API is stored as not granted and Home opens`

### SPEC-04: A relaunch does not ask again
- Verifies: AC#4, DoD#1
- Behaviour: Given a first launch with `persist` resolving `false`, which stores `{ granted: false }` with count 1,
  When the page is closed and a new page in the same context opens `/` with `persist` now resolving `true`, and Home's
  heading is visible plus 500 ms, Then the count is still 1 and the stored record is still `{ granted: false }`.
  The test runs in Chromium and WebKit.
- Verification: acceptance `e2e/persistent-storage.spec.ts::a relaunch does not ask again and keeps the stored result`

### SPEC-05: requestPersistenceOnce rules
- Verifies: AC#1, AC#2, AC#3, AC#4
- Behaviour: With `openHandStore(new IDBFactory())` and a counting fake `persist`, each row of the §5 worked-example
  table gives the stated calls, return value and stored raw record. A non-boolean resolution (`'granted'`) stores
  `{ granted: false }`. A synchronous throw stores `{ granted: false }`.
- Verification: unit `tests/storage/persistent-storage.test.ts::asks only when no valid record exists and stores granted only for true`

### SPEC-06: Read and write failures are logged, never thrown
- Verifies: AC#3
- Behaviour: Given a store whose `readPersistentStorage` rejects, Then persist is not called, the call resolves `null`,
  and `console.error` gets `'Persistent storage could not be checked'`. Given a store whose `writePersistentStorage`
  rejects, Then persist is called once, the call resolves `null`, and `console.error` gets
  `'Persistent storage result could not be saved'`.
- Verification: unit `tests/storage/persistent-storage.test.ts::read and write failures resolve null and are logged`

### SPEC-07: browserPersist finds the API or reports it missing
- Verifies: AC#3
- Behaviour: `browserPersist({ storage: undefined })` and `browserPersist({ storage: {} })` return `undefined`.
  Given a `storage` object whose `persist` checks `this === storage`, the returned function calls it with that
  receiver and returns its promise.
- Verification: unit `tests/storage/persistent-storage.test.ts::browserPersist calls storage.persist as a method or is undefined`

### SPEC-08: Version 5 adds an empty meta store and keeps older data
- Verifies: AC#4, DoD#4
- Behaviour: A new database has version 5, stores `['hands', 'meta', 'reports', 'sessions', 'settings']`, an empty
  `meta` store, and `readPersistentStorage()` resolves `null`. After `writePersistentStorage(true)`, the raw record is
  `{ granted: true }` and a new `openHandStore` on the same factory reads `true`. A v4 database with a settings record
  and a session upgrades with both unchanged. An invalid raw record reads `null`.
- Verification: unit `tests/storage/persistent-storage.test.ts::version 5 adds an empty meta store and keeps v4 records`

### SPEC-09: Project checks
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#10
- Behaviour: Lint (including the import-boundary rule), typecheck, the full vitest suite with coverage thresholds and
  the golden suite, and the e2e suite all pass. CI is green on `doit/TASK-13.2`.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-10: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/persistent-storage.md` describes the record, the launch rule, the failure handling, the
  TASK-12.9 accessor and the Reset note. `docs/storage/settings.md` states version 5. The story doc is published to Backlog.
- Verification: manual `docs/storage/persistent-storage.md` and the `backlog doc list --plain` entry for TASK-13.2

### SPEC-11: Not-applicable DoD items
- Verifies: DoD#6, DoD#7, DoD#9, DoD#12
- Behaviour: No engine, bots, advice, statistics or UI screen code changes, and no strategy content. The playtest,
  screen/axe, strategy-text and offline-screen items don't apply.
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice src/stats src/ui` is empty

## 7. Edge cases
- API missing (`navigator.storage` or `persist` undefined): SPEC-03, SPEC-07.
- persist rejects or throws synchronously: SPEC-03, SPEC-05.
- persist never settles (Firefox prompt left open): nothing is recorded. Nothing blocks, because rendering does not
  wait. The next launch asks again. N/A to test, since Firefox is not a target.
- Non-boolean resolution: SPEC-05.
- DB unavailable or read error: SPEC-06 (A-2). Write error: SPEC-06 (A-3).
- Invalid stored record: SPEC-05, SPEC-08 (A-4).
- Upgrade from v4 with existing data: SPEC-08.
- Two tabs on a fresh install at the same moment: both may call persist and both write. Last write wins, and calling
  persist is idempotent. Accepted, no SPEC.
- Reset all data: belongs to E12, documented in SPEC-10.

## 8. Security considerations
- Trust boundary: the stored `meta` record is read back through `parsePersistentStorage`, and anything that is not
  `{ granted: boolean }` is null.
- No authn/authz, secrets, injection or new dependencies. No randomness. No network: SPEC-01 asserts same-origin requests.
- Logs contain only fixed messages and the error object.

## 9. Non-functional
- No delay to first paint: the request starts after `render()` and is not awaited. This adds one IndexedDB read
  (and on first launch, one write) per launch.
- The normal suite stays fast. The unit tests use fake-indexeddb with no timers. The e2e spec has 4 tests,
  each one or two page loads, and only SPEC-04 adds a 500 ms wait. Nothing is added to the slow suites.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173/` in a fresh profile → devtools → IndexedDB → tlh-trainer → meta
- New tests (path → SPEC ids):
  - `e2e/persistent-storage.spec.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04. Stubs are init scripts defined in the spec
    file. Each overrides `StorageManager.prototype.persist` with `Object.defineProperty(..., { configurable: true })`,
    and calls are counted in `localStorage['tlhPersistCalls']` so the count survives a new page. The raw `meta` read
    opens `tlh-trainer` without a version.
  - `tests/storage/persistent-storage.test.ts` → SPEC-05, SPEC-06, SPEC-07, SPEC-08
  - Version 4 → 5 edits: `tests/storage/session-end.acceptance.test.ts` (locked, TASK-10.1), `e2e/home-control.spec.ts`
    (locked, TASK-2.14), `e2e/opponent-styles.spec.ts` (locked, TASK-12.2), `tests/storage/settings-store.test.ts`,
    `tests/storage/hand-store.test.ts`, `e2e/support/hand-records.ts`
- Judge end-to-end: `npm run build && npm run preview`. In a fresh Chromium profile, open the app. Home shows.
  In devtools → Application → IndexedDB → tlh-trainer, the database is version 5, and `meta` holds `persistentStorage:
  { granted: true|false }` matching `await navigator.storage.persisted()` in the console. Reload: the record is unchanged.
  Delete only the `meta` record and reload: it is recreated. Run `npx playwright test e2e/persistent-storage.spec.ts`
  for both projects.

## 11. Open questions
- None. Q-1 is answered in `doit/TASK-13.2/qa.md`: option (a), a `meta` store at DB v5 (D-1, D-3).
- Scope note for TASK-12.9, recorded by the coordinator: read the flag through `readPersistentStorage()`. `null` means nothing is recorded (not asked yet, the write failed, or the record is invalid). The recommended handling is to show the warning for `null` too. Reset all data (E12) must also clear `meta`.

## 12. Clarifications log
See `doit/TASK-13.2/qa.md`.
