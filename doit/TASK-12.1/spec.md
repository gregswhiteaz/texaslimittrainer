# Spec: TASK-12.1 — Open Settings from Home and see the app version

Status: READY (approved 2026-11-25)
Task: TASK-12.1 · Parent/epic: TASK-12 · Requirements: REQ-002.3, REQ-050.5, REQ-050.6, REQ-057.1, REQ-057.2, REQ-057.4, REQ-061.1 · Dream: limit-holdem-trainer

## 1. Summary
Home gains a `Settings` entry that opens a new Settings screen: a `← Home` back control, the `Settings` heading,
the storyboard sections (Play, Display, Your data) and a version line `Version <x>`, where `<x>` is the
`package.json` version injected at build time. This first Settings slice also creates the local settings store
(IndexedDB) with the REQ-050 defaults. Later stories (TASK-12.2, 12.4-12.9) add the controls and write the store.
The screen is registered in the play-money screen list and walked. The dialog detector also learns to read
`role={'dialog'}`.

## 2. Scope
- In scope:
  - Home `Settings` entry (last in the Main menu) and the `settings` route in `src/ui/App.tsx`.
  - `SettingsScreen` (header with `← Home` and h1, three sections, version line), with focus handling as for
    Statistics.
  - Build-time app version: Vite `define` of `__APP_VERSION__` from `package.json`, read through `APP_VERSION`.
    `versionText(v)` returns `Version <v>` for E13 to reuse.
  - Settings store: DB version 4 adds object store `settings`. The upgrade step writes the default record.
    `readSettings()` reads it (Q-1, approved).
  - Play-money: a `SCREEN_LIST` entry, a walk step, and the dialog detector accepting a JSX-expression `role`.
  - Locked-test edits that only add the new entry (D-4, approved by Q-5). The e2e IndexedDB helpers move to v4.
  - Docs: `docs/ui/navigation.md`, `docs/ui/play-money.md`, `docs/storage/hand-records.md`, new
    `docs/storage/settings.md`.
- Not doing:
  - Any Settings control or toggle: default speed (TASK-12.5), auto-open Hand Review (12.6), opponent styles
    (12.2), four-colour deck (12.7), bot banter (12.8), Reset all data (12.4), storage warning (12.9), Settings
    overlay from the Table (12.3).
  - The storyboard row "Show amounts as Dollars / Big bets" (not a requirement, task Notes).
  - Any write API for settings (`writeSettings`); the first toggle story adds it.
  - Reading settings anywhere in the app (no reader exists yet; TASK-2.11 is To Do).
  - Per-store schema versions or migrations framework (REQ-054, E13); a browser-history entry for Settings;
    a Settings dialog.
  - Changing `package.json` `version` (Q-4: stays 0.0.0).
- Scope budget: files=25, lines=950

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The Home entry is an optional `onSettings` prop on `HomeScreen`, rendered as the last `menu-secondary` button (after Statistics). `App` always passes it. | yes | Same pattern as `onStatistics` (`src/ui/home/HomeScreen.tsx:11,42`, TASK-11.1 A-4). This keeps the locked `tests/ui/home.acceptance.test.tsx:27` (asserts no "Settings" without the prop) and `tests/ui/home-statistics.acceptance.test.tsx` unchanged. The storyboard order is New game, Resume, Statistics, Settings (`storyboards/Home.dc.html:38-45`). | Always render it, which means editing two more locked tests. |
| A-2 | Settings pushes no browser-history entry. Browser Back on Settings behaves as on Statistics. | yes | Only the Table pushes history (`src/ui/App.tsx:24-26`, TASK-11.1 A-5). | Push an entry. |
| A-3 | Focus: Settings' h1 takes focus on open (`useHeadingFocus(true)`). `← Home` returns to Home with `returned: true`, so Home's h1 is focused. | yes | Same as Statistics (`src/ui/stats/StatisticsScreen.tsx:157`, `src/ui/App.tsx:327`). | n/a |
| A-4 | The version reaches the code as a Vite `define` constant `__APP_VERSION__`. `src/ui/app-version.ts` exposes it as `APP_VERSION`. `SettingsScreen` takes an optional `version` prop defaulting to `APP_VERSION`, so tests can render version `1.2.0`. | yes | Importing `package.json` into `src` would bundle the whole file (dependency lists) into `dist`. `define` inlines one string. Vitest reads the same `vite.config.ts`, so tests see the same value. | `import.meta.env.VITE_APP_VERSION`; JSON import. |
| A-5 | The headless settings model (`Settings`, `DEFAULT_SETTINGS`, `parseSettings`, `SettingsReader`) lives in `src/table/settings.ts`. It is headless with ≥ 90% coverage, next to `session-record.ts`. The IndexedDB part lives in `src/storage/hand-store.ts`. | yes | Follows the `session-record.ts` / `hand-store.ts` split. One `opened()` keeps one DB version marker (`src/storage/hand-store.ts:16-19`). | New `src/settings/` folder. |
| A-6 | `readSettings()` resolves `DEFAULT_SETTINGS` when no record is stored. An invalid stored record rejects with `RangeError('Invalid settings: <field>')`. | yes | Same validate-on-read rule as `getSession` (`src/storage/hand-store.ts:197-200`). There are no callers yet, so callers decide on fallback. | Fall back to defaults silently. |
| A-7 | `e2e/support/hand-records.ts` opens `tlh-trainer` at version 4 and mirrors the v4 step (create `settings` and put the default record). | yes | The helpers open at 3 (`e2e/support/hand-records.ts:10,34,60`). After the app has opened v4, opening at 3 fails with `VersionError` in every e2e that seeds data. | Open without a version. |
| A-8 | The new e2e test uses `Alt+Tab` in WebKit to reach buttons. | yes | `e2e/report-navigation.spec.ts:112-113` (WebKit has no full keyboard access). | n/a |

## 3. Current system
- Screens are a `Screen` union in `src/ui/App.tsx:27-44`, rendered by `switch (screen.name)` (`:276-345`). There are
  no URL routes. Statistics is the model: `openStatistics` (`:268-271`), `case 'stats'` with
  `onHome={() => setScreen({ name: 'home', returned: true })}` (`:324-327`).
- Home: `src/ui/home/HomeScreen.tsx` renders `<nav aria-label="Main menu" class="home-menu">` with optional entries
  (`:35-48`). Buttons get min 44x44 from `.screen button` (`src/ui/styles.css:38-43`). The back control is
  `<button type="button" className="link-button">← Home</button>` (`src/ui/stats/StatisticsScreen.tsx:162-166`,
  styles `src/ui/styles.css:258-268`). Heading focus: `src/ui/useHeadingFocus.ts`.
- Storage: `src/storage/hand-store.ts:16-45`: `DB_NAME='tlh-trainer'`, `DB_VERSION=3`, append-only `oldVersion < N`
  steps. `openHandStore(factory, name)` returns `HandStore & SessionEnder & TrendReader` (`:170-246`).
  `sharedHandStore()` (`:248-253`) opens lazily. Home's mount effect reads the paused session (`App.tsx:79-99`), so
  the DB is opened (and upgraded) at launch. Tests use `fake-indexeddb` (`tests/storage/hand-store.test.ts:1`, upgrade
  test `:89-132`).
- Build: `vite.config.ts` (plugins + vitest config, no `define`). `package.json` `version` is `"0.0.0"`.
  `tsconfig.json` includes `*.config.ts`. JSON imports use `with { type: 'json' }` (`src/bots/tag.ts:13`).
- Play-money: `e2e/support/screen-list.ts:7-17`. Detector `DIALOG = /<dialog\b|role=["']?(alert)?dialog\b/`
  (`e2e/support/play-money.ts:52`). `role={'dialog'}` is not matched. The route parser reads `type Screen =` up to
  the first `;` outside braces (`e2e/support/play-money.ts:39-50`), so **no `;` may appear in comments inside the
  union**. The walk is `e2e/play-money.spec.ts:94-169`. Statistics is visited at `:107-111`.
- Tests: `npm test` = `vitest run --coverage` (node env, `renderToString` UI tests). `npm run e2e` = Playwright,
  Chromium and WebKit at 1280x720 against `vite build && vite preview` (`playwright.config.ts`). axe helper:
  `e2e/support/axe.ts::expectNoSeriousAxeViolations`.
- Tests that pin the Home menu, route list or play-money walk (grep of `e2e/` and `tests/` for `Main menu`
  button counts, `.last()`, `routes:`):
  - `e2e/home.spec.ts:90-92`: menu button count 2 [owner TASK-2.1, last edited TASK-11.1] → must change.
  - `e2e/resume.spec.ts:152-153` (`expectNoResume`: count 2, last is Statistics) and `:177-182` (count 3, last
    Statistics) [owner TASK-2.6, edited TASK-11.1] → must change.
  - `tests/ui/screen-list.acceptance.test.ts:20-23`: exact routes [owner TASK-2.15] → must change.
  - `e2e/play-money.spec.ts:94-169`: walk must visit `settings` [owner TASK-2.15, TASK-10.2] → must change.
  - Unchanged thanks to A-1: `tests/ui/home.acceptance.test.tsx:27`, `tests/ui/home-statistics.acceptance.test.tsx`,
    `tests/unit/app.test.tsx`. Unchanged: `tests/ui/play-money.test.ts`. Its fixture already uses a hypothetical
    `settings` route and passes against its own fixture `APP_SOURCE`.
  - No e2e uses Tab on Home. No other test mentions "Settings".
- Existing code to reuse:
  - `src/ui/useHeadingFocus.ts` → heading focus on open.
  - `.link-button`, `.screen button`, `.menu-secondary`, `.menu-title`, `.menu-subtitle` CSS → back control and Home entry.
  - `.stats-header` layout (`src/ui/styles.css:1211-1216`) → copy as `.settings-header`. The panel look of `.panel`
    (`:276-`) is reused for the sections.
  - `e2e/support/axe.ts::expectNoSeriousAxeViolations`, `e2e/support/play-money.ts::realMoneyOffers` → e2e checks.
  - `tabOrder` pattern from `e2e/report-navigation.spec.ts:67-80` (copy, it is not exported).
  - `opened()` upgrade steps and `requested()` in `src/storage/hand-store.ts` → settings store.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Settings store: DB `tlh-trainer` version 4 adds object store `settings` with out-of-line keys. The record key `'settings'` holds `DEFAULT_SETTINGS`, written in the `oldVersion < 4` upgrade step (first launch and upgrade alike). | Defer the store to TASK-12.2/12.5; keyPath record; localStorage. | The task description says this slice creates it. One store under the DB version that E13 versions (task Notes, REQ-054). Out-of-line keys leave room for TASK-12.9's flag. | yes (persisted format) | user (Q-1) |
| D-2 | Home entry text: title `Settings`, subtitle `Speed, display, reset data`. | `Trainer options and app version`; no subtitle | Storyboard `Home.dc.html:42-45`. Later stories make it true. | yes (user-visible text) | user (Q-2) |
| D-3 | Screen content: header (`← Home`, h1 `Settings`); `<section aria-labelledby>` with h2 `Play`, h2 `Display`, h2 `Your data` + paragraph "Hands, sessions and statistics are stored only in this browser. Clearing browser data deletes them, and there is no backup in this version."; then `<p class="settings-version">Version <x></p>`. | Omit Play/Display until their first control lands; omit the paragraph | Storyboard `Settings.dc.html:20-60`. The task lists the three sections. | yes (user-visible text/UX) | user (Q-3) |
| D-4 | Locked-test edits (each only adds the Settings entry; every existing check kept): (1) `e2e/home.spec.ts:90` count 2→3 + `Settings` visible [TASK-2.1]. (2) `e2e/resume.spec.ts:152-153` count 2→3, `.last()` → `/^Settings/`, `.nth(1)` → `/^Statistics/`; `:177-182` count 3→4, `.last()` → `/^Settings/`, `.nth(2)` → `/^Statistics/` [TASK-2.6]. (3) `tests/ui/screen-list.acceptance.test.ts:21` routes gain `'settings'` [TASK-2.15]. (4) `e2e/play-money.spec.ts`: after `statistics`, click Settings, `checkPlayMoney(page, 'settings')`, click `← Home` [TASK-2.15, TASK-10.2]. | Hide the entry (contradicts AC#1) | AC#1 and AC#5 require these. TASK-11.1 found resume.spec.ts late, so it is listed up front. | yes (locked edits) | user (Q-5; unlocked with reason "TASK-12.1 Q-5") |
| D-5 | Version line uses the `package.json` version as is, currently `Version 0.0.0`. | Bump to `0.1.0` in this story | Versioning and "Updated to version" are E13's. Changing the number is a release decision. | yes (user-visible) | user (Q-4) |
| D-6 | Dialog detector becomes `/<dialog\b\|role=\{?\s*["'\`]?(alert)?dialog\b/`. | AST parse | Smallest change that accepts `role="dialog"`, `role={'dialog'}`, `role={"alertdialog"}` and `` role={`dialog`} ``. | no | n/a |

## 5. Design

### Files to create / modify
- `vite.config.ts` — add `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`, with `pkg` from
  `import pkg from './package.json' with { type: 'json' }`.
- `src/ui/app-version.ts` — new: `declare const __APP_VERSION__: string`, `export const APP_VERSION: string = __APP_VERSION__`,
  `export function versionText(version: string): string` → `` `Version ${version}` ``.
- `src/ui/settings/SettingsScreen.tsx` — new screen (D-3).
- `src/ui/home/HomeScreen.tsx` — optional `onSettings` prop, last entry (A-1, D-2).
- `src/ui/App.tsx` — Screen member `| { readonly name: 'settings' }` (no `;` in any comment inside the union),
  `case 'settings'`, `onSettings` on Home.
- `src/ui/styles.css` — `.settings-screen`, `.settings-header`, `.settings-section`, `.settings-version` (≥ 4.5:1 contrast,
  e.g. `#a7aeb8` on `#0e0f12`).
- `src/table/settings.ts` — new headless model (A-5).
- `src/storage/hand-store.ts` — `DB_VERSION = 4`, `SETTINGS_STORE`, `SETTINGS_KEY`, v4 upgrade step, `readSettings()`.
- `e2e/support/screen-list.ts` — `{ id: 'settings', kind: 'screen', route: 'settings' }` after `statistics`.
- `e2e/support/play-money.ts` — `DIALOG` regex (D-6).
- `e2e/support/hand-records.ts` — open at version 4 and mirror the v4 step (A-7). Update the doc comments from v3 to v4.
- `tests/ui/home-settings.acceptance.test.tsx` — new (SPEC-01).
- `tests/ui/settings.acceptance.test.tsx` — new (SPEC-03, SPEC-04).
- `tests/ui/dialog-detector.acceptance.test.ts` — new (SPEC-09).
- `tests/table/settings.test.ts` — new (SPEC-13).
- `tests/storage/settings-store.test.ts` — new (SPEC-11, SPEC-12).
- `e2e/settings.spec.ts` — new (SPEC-02, 05, 06, 10).
- `e2e/home.spec.ts`, `e2e/resume.spec.ts`, `tests/ui/screen-list.acceptance.test.ts`, `e2e/play-money.spec.ts` — locked edits (D-4).
- `docs/ui/navigation.md` — Settings row, paragraph; "five screens" count fixed.
- `docs/ui/play-money.md` — `statistics` and `settings` rows, JSX-expression role sentence.
- `docs/storage/hand-records.md` — database version 4 and the `settings` store.
- `docs/storage/settings.md` — new: record format, defaults, key, upgrade step, `readSettings` rules.

### Components, interfaces and data
- `src/table/settings.ts` (headless, no DOM/IDB imports):
  ```ts
  export type DefaultSpeed = 'rapid' | 'realistic';
  export interface Settings {
    readonly defaultSpeed: DefaultSpeed;      // REQ-050.1, default 'rapid'
    readonly autoOpenReview: boolean;         // REQ-050.2, default true
    readonly showOpponentStyles: boolean;     // REQ-050.3, default true
    readonly fourColourDeck: boolean;         // REQ-050.4, default false
    readonly botBanter: boolean;              // E12-S07, default true
  }
  export const DEFAULT_SETTINGS: Settings;    // frozen, values above
  export function parseSettings(value: unknown): Settings; // throws RangeError('Invalid settings: <field>')
  export interface SettingsReader { readSettings(): Promise<Settings>; }
  ```
  `parseSettings` requires a non-null object with exactly these five fields of the right type. The first bad or
  missing field in the order above names the error. Extra fields are ignored. It returns a new object with only
  the five fields.
- `src/storage/hand-store.ts`: `export const SETTINGS_STORE = 'settings'`, `export const SETTINGS_KEY = 'settings'`.
  `DB_VERSION = 4` with the doc comment "v4 SETTINGS_STORE". In `opened()`:
  `if (event.oldVersion < 4) request.result.createObjectStore(SETTINGS_STORE).put({ ...DEFAULT_SETTINGS }, SETTINGS_KEY)`.
  `openHandStore` / `sharedHandStore` return type adds `& SettingsReader`. `readSettings()` = `get(SETTINGS_KEY)` in
  a readonly transaction: `undefined` → `DEFAULT_SETTINGS`, else `parseSettings(value)`.
- `HomeScreen` props: `readonly onSettings?: () => void` ("When given, the Settings entry is shown last"). Markup:
  `<button type="button" className="menu-secondary" onClick={onSettings}><span className="menu-title">Settings</span><span className="menu-subtitle">Speed, display, reset data</span></button>`.
- `SettingsScreen({ onHome, version = APP_VERSION }: { onHome: () => void; version?: string })`:
  ```
  <main className="screen settings-screen">
    <header className="settings-header">
      <button type="button" className="link-button" onClick={onHome}>← Home</button>
      <h1 ref={useHeadingFocus(true)}>Settings</h1>
    </header>
    <section className="settings-section" aria-labelledby="settings-play"><h2 id="settings-play">Play</h2></section>
    <section className="settings-section" aria-labelledby="settings-display"><h2 id="settings-display">Display</h2></section>
    <section className="settings-section" aria-labelledby="settings-data"><h2 id="settings-data">Your data</h2><p>…D-3 paragraph…</p></section>
    <p className="settings-version">{versionText(version)}</p>
  </main>
  ```
- `App.tsx`: `onSettings={() => { setPaused(undefined); setScreen({ name: 'settings' }) }}`. `case 'settings': return <SettingsScreen onHome={() => setScreen({ name: 'home', returned: true })} />`.

### Rules and algorithms
- Version: `versionText('1.2.0') === 'Version 1.2.0'`. In the built app with `package.json` version `0.0.0`, the line
  reads `Version 0.0.0`.
- Home menu order: New game, [Resume session], [Statistics], [Settings]. Example with a paused session and both
  optional props: 4 buttons, the last is `Settings`.

### Error handling and configuration
- `readSettings`: DB open failure → rejects with that error (as for every store call). Invalid record → `RangeError`
  (A-6). The Settings screen in this slice reads nothing, so it cannot fail.
- No new dependency and no runtime configuration.

## 6. Behaviour specification

### SPEC-01: Home offers Settings last
- Verifies: AC#1
- Behaviour: Given `HomeScreen` rendered with `onSettings` and `onStatistics` (with `paused={null}`), When rendered,
  Then the Main menu has 3 buttons and the last one is exactly the D-2 markup (`menu-secondary`, title `Settings`,
  subtitle `Speed, display, reset data`). With `paused={{ summary }}` and `onResume`, there are 4 buttons in the order
  New game, Resume session, Statistics, Settings. Without `onSettings`, no `Settings` text is rendered.
- Verification: acceptance `tests/ui/home-settings.acceptance.test.tsx::home offers Settings after Statistics`

### SPEC-02: Settings opens from Home
- Verifies: AC#1, DoD#9
- Behaviour: Given the app at `/` with Home loaded, When the user clicks the Main menu button `/^Settings/`, Then the
  h1 `Settings` is visible and focused, the `← Home` button is visible, and no `region "Table"` exists. Runs in
  Chromium and WebKit.
- Verification: acceptance `e2e/settings.spec.ts::Settings opens from Home and ← Home returns`

### SPEC-03: Version line shows the build's version
- Verifies: AC#2
- Behaviour: Given `SettingsScreen` rendered with `version="1.2.0"`, When rendered, Then the markup contains
  `<p class="settings-version">Version 1.2.0</p>` exactly once. `versionText('1.2.0')` returns `Version 1.2.0`.
- Verification: acceptance `tests/ui/settings.acceptance.test.tsx::shows Version 1.2.0 for a 1.2.0 build`

### SPEC-04: The injected version is package.json's
- Verifies: AC#2
- Behaviour: Given `package.json` `version` (read from disk in the test), When `APP_VERSION` is read and
  `SettingsScreen` is rendered without a `version` prop, Then `APP_VERSION === pkg.version` and the markup shows
  `Version ${pkg.version}`. The built app's Settings screen (e2e) shows `Version ${pkg.version}` in `.settings-version`.
- Verification: acceptance `tests/ui/settings.acceptance.test.tsx::the default version is the package.json version`

### SPEC-05: ← Home returns to Home
- Verifies: AC#3
- Behaviour: Given Settings opened from Home, When the user clicks `← Home`, Then the h1 `TLH Trainer` is focused and
  the Main menu shows `New game` and `Settings`.
- Verification: acceptance `e2e/settings.spec.ts::Settings opens from Home and ← Home returns`

### SPEC-06: Keyboard reach, native controls, Enter/Space, target size
- Verifies: AC#4
- Behaviour: Given Settings at 1280x720 with its h1 focused, When the user presses Tab (`Alt+Tab` in WebKit, A-8)
  repeatedly until focus leaves the page or repeats, Then the reached elements equal every focusable element in
  `main` (in this slice: `← Home`). Each is a `button`, `a[href]`, `input`, `select` or `textarea`. Each bounding box
  is ≥ 44 x 44. Pressing `Enter` on `← Home` opens Home. Reopening Settings, focusing `← Home` and pressing `Space`
  opens Home.
- Verification: acceptance `e2e/settings.spec.ts::every Settings control is reachable by Tab, native, keyboard-operable and at least 44x44`

### SPEC-07: Play-money walk visits Settings
- Verifies: AC#5, DoD#2
- Behaviour: Given `SCREEN_LIST` contains `{ id: 'settings', kind: 'screen', route: 'settings' }`, When the play-money
  walk runs, Then it opens Settings from Home, finds no real-money offer phrase in its texts, marks `settings` visited,
  returns with `← Home`, and ends with no unvisited entries.
- Verification: acceptance `e2e/play-money.spec.ts::every listed screen and dialog shows only play money`

### SPEC-08: Screen list names the settings route
- Verifies: AC#5
- Behaviour: Given `src/ui/App.tsx` with `| { readonly name: 'settings' }` in `type Screen`, When the screen-list test
  runs, Then found routes equal `['config', 'ending', 'home', 'report', 'settings', 'stats', 'table']`, dialogs are
  unchanged, and nothing is unlisted.
- Verification: acceptance `tests/ui/screen-list.acceptance.test.ts::the screen list names every App screen and every dialog component`

### SPEC-09: Dialog detector reads a JSX-expression role
- Verifies: AC#5
- Behaviour: Given fixture UI files `src/ui/x/ExprDialog.tsx` with `<div role={'dialog'} aria-modal="true">`,
  `src/ui/x/DqDialog.tsx` with `role={"alertdialog"}`, `src/ui/x/TplDialog.tsx` with ``role={`dialog`}``,
  `src/ui/x/Plain.tsx` with `role="region"`, and `src/ui/x/Other.tsx` with `role={'dialogue-panel'}`, When
  `appScreens(APP, files)` runs, Then `dialogs` equals `['DqDialog', 'ExprDialog', 'TplDialog']`. `<dialog>` and
  `role="dialog"` are still found.
- Verification: acceptance `tests/ui/dialog-detector.acceptance.test.ts::the dialog detector recognises role written as a JSX expression`

### SPEC-10: Settings passes axe and stays on the app's origin
- Verifies: DoD#1, DoD#9, DoD#10, DoD#2
- Behaviour: Given Settings opened from Home, When axe runs in Chromium and WebKit, Then there are zero serious or
  critical violations. Every request has origin `http://localhost:4173`. `realMoneyOffers` of the page text is
  empty. `.settings-version` shows `Version ${pkg.version}`.
- Verification: acceptance `e2e/settings.spec.ts::Settings shows the version with no axe violations and no outside requests`

### SPEC-11: Settings store created with defaults on first launch
- Verifies: DoD#4
- Behaviour: Given an empty `fake-indexeddb` factory, When `openHandStore(factory)` serves its first call (`count()`),
  Then DB `tlh-trainer` is at version 4, has object store `settings`, and the raw value at key `'settings'` equals
  `{ defaultSpeed: 'rapid', autoOpenReview: true, showOpponentStyles: true, fourColourDeck: false, botBanter: true }`.
  `readSettings()` resolves the same values. With the record deleted, `readSettings()` resolves `DEFAULT_SETTINGS`.
  With `{ ...defaults, fourColourDeck: 'no' }` stored, it rejects with `RangeError('Invalid settings: fourColourDeck')`.
- Verification: unit `tests/storage/settings-store.test.ts::a new database stores the default settings`

### SPEC-12: Upgrading v3 keeps data and adds default settings
- Verifies: DoD#4
- Behaviour: Given a v3 database with stores `hands`, `sessions` and `reports` and one record in each, When
  `openHandStore` opens it, Then all three records read back unchanged and `readSettings()` resolves the defaults.
- Verification: unit `tests/storage/settings-store.test.ts::upgrading a v3 database keeps its records and adds default settings`

### SPEC-13: parseSettings validation
- Verifies: DoD#4, DoD#6
- Behaviour: `parseSettings(DEFAULT_SETTINGS)` equals the defaults. `parseSettings({...d, extra: 1})` drops `extra`.
  Each of `null`, `[]`, `{...d, defaultSpeed: 'fast'}`, a missing `autoOpenReview`, `{...d, showOpponentStyles: 1}`,
  `{...d, fourColourDeck: 'no'}`, `{...d, botBanter: undefined}` throws `RangeError` naming the first bad field
  (`settings` for non-objects). `DEFAULT_SETTINGS` is frozen.
- Verification: unit `tests/table/settings.test.ts::parseSettings accepts valid settings and names the first bad field`

### SPEC-14: Existing Home menu checks include Settings
- Verifies: AC#1
- Behaviour: Given the D-4 edits, When `e2e/home.spec.ts` and `e2e/resume.spec.ts` run, Then Home has 3 entries without
  a paused session (last `Settings`) and 4 with one (New game, Resume session, Statistics, Settings).
- Verification: command `npx playwright test e2e/home.spec.ts e2e/resume.spec.ts`

### SPEC-15: Project checks
- Verifies: DoD#3, DoD#4, DoD#6, DoD#7, DoD#12
- Behaviour: Lint (incl. headless boundary on `src/table/settings.ts`), typecheck, the full test suite with coverage
  and the e2e suite pass with zero errors. `src/table/**` stays ≥ 90% lines. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-16: Documentation
- Verifies: DoD#13
- Behaviour: `docs/ui/navigation.md` adds the Settings row and paragraph. `docs/ui/play-money.md` lists `statistics`
  and `settings` and the JSX role rule. `docs/storage/hand-records.md` shows version 4. `docs/storage/settings.md`
  documents the record. The story doc is published to Backlog.
- Verification: manual the four doc files and the `backlog doc list --plain` entry for TASK-12.1

### SPEC-17: Not-applicable DoD items
- Verifies: DoD#5, DoD#8, DoD#11, DoD#14
- Behaviour: No engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
  playtest are unaffected. No strategy content is added. No service worker exists yet (E13-S07).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Paused session present: Settings is still last (SPEC-01, SPEC-14).
- Returning from Settings re-reads the paused session (`setPaused(undefined)` on open; Home effect runs on
  `onHome`): covered by existing Home behaviour and SPEC-05.
- Existing users' v3 database: upgrade keeps records (SPEC-12). Open connections close on `versionchange`
  (`hand-store.ts:40`).
- Missing or invalid settings record (SPEC-11, SPEC-13).
- e2e helpers opening the DB after the app upgraded it (A-7): covered by the existing seeded e2e (play-money,
  statistics, resume) passing.
- Empty/max input, concurrency, permissions: N/A (no input on this screen).

## 8. Security considerations
- Trust boundary: the stored settings record (could be edited in devtools) → validated by `parseSettings` on read.
- No authn/authz, secrets, network calls or new dependencies. The version string is a build constant, rendered as
  React text (no HTML injection). `define` inlines only `version`, not the rest of `package.json`.
- Randomness: N/A.

## 9. Non-functional
- Accessibility: axe zero serious/critical (SPEC-10). Targets ≥ 44x44 (SPEC-06). Text contrast ≥ 4.5:1.
- Normal suite speed: new Vitest tests are in-memory (`renderToString`, `fake-indexeddb` with ≤ 3 records) and
  well under 1 s. `e2e/settings.spec.ts` has 3 short tests with no hand play. There are no opt-in/slow tests.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Settings (see "Version 0.0.0") → Tab to "← Home" → Enter → Home
- New tests (path → SPEC ids):
  - `tests/ui/home-settings.acceptance.test.tsx` → SPEC-01
  - `tests/ui/settings.acceptance.test.tsx` → SPEC-03, SPEC-04
  - `tests/ui/dialog-detector.acceptance.test.ts` → SPEC-09
  - `tests/table/settings.test.ts` → SPEC-13
  - `tests/storage/settings-store.test.ts` → SPEC-11, SPEC-12
  - `e2e/settings.spec.ts` → SPEC-02, SPEC-05, SPEC-06, SPEC-10
  - Locked edits (D-4): `e2e/home.spec.ts`, `e2e/resume.spec.ts` (SPEC-14), `tests/ui/screen-list.acceptance.test.ts`
    (SPEC-08), `e2e/play-money.spec.ts` (SPEC-07)
- Judge end-to-end: `npm run build && npm run preview`. Open Home, choose Settings: the heading is focused and the
  three sections and `Version 0.0.0` are shown. Tab (Alt+Tab in Safari) to `← Home`, press Space: Home with its
  heading focused. Reload: Home still works (DB v4). In devtools > IndexedDB > tlh-trainer > settings, the default
  record is present.

## 11. Open questions
None. Q-1..Q-5 answered (all recommended options) in `doit/TASK-12.1/qa.md`.

## 12. Clarifications log
See `doit/TASK-12.1/qa.md`.
