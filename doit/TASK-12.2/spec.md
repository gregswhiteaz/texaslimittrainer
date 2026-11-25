# Spec: TASK-12.2 — Hide opponent style labels at the table

Status: READY (approved 2026-11-25)
Task: TASK-12.2 · Parent/epic: TASK-12 · Requirements: REQ-021.2, REQ-050.3, REQ-050.5 · Dream: limit-holdem-trainer

## 1. Summary
The Settings screen's Display section gains a native checkbox "Show opponent styles at the table", on by
default. Turning it off hides the style label (and its ` · ` separator) on every bot seat at the table. Name,
stack and every other seat field stay. The choice is saved to the IndexedDB settings store as soon as it changes
and is read back at launch. This story adds the first settings writer (`writeSettings`) and the first reader
(App holds the settings in memory and passes them down). TASK-12.5, 12.6, 12.7, 12.8 and TASK-2.11 reuse both.

## 2. Scope
- In scope:
  - `writeSettings(settings)` on the hand store (`SettingsWriter` interface in the headless model).
  - App-level settings state: read once at launch, updated and saved on every change (D-2, D-3).
  - Settings screen: the checkbox in the Display section (D-1), disabled until the settings are loaded.
  - Table: `showOpponentStyles` prop through `TableScreen` → `Table` → `TableView` → bot `Seat`. Default `true`,
    so every existing caller and test renders as before.
  - The locked-test edit to `e2e/settings.spec.ts` (D-4).
  - Docs: `docs/storage/settings.md` (writing, the App reader), `docs/ui/navigation.md` (Settings paragraph).
- Not doing:
  - Settings overlay from the Table header (TASK-12.3). In this story the Table is never on screen while
    Settings is open. The design makes an overlay change apply on the next render (D-3).
  - Other Settings controls: default speed (12.5, 2.11), auto-open Hand Review (12.6), four-colour deck (12.7),
    bot banter (12.8), Reset all data (12.4). The storyboard's "Show amounts as" row is not a requirement.
  - Style labels outside the table: Game Config line-up, Session Report, Statistics (task description).
  - The opponent-stats hover panel (TASK-3.14, To Do, not built). That story makes its label follow the toggle.
  - Any change to `tableView` / `SeatView` (headless): hiding happens only in the seat markup.
  - Revert-on-failure or a user-facing error for a failed save (A-3).
- Scope budget: files=14, lines=600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | App reads the settings once in a mount effect (`sharedHandStore().readSettings()`). Until the read settles, the Table uses `DEFAULT_SETTINGS` (labels shown) and the Settings checkbox is `disabled`. | yes | The read takes milliseconds and has finished long before a user can reach a table (New game → Start game, or Resume after Home's own read). A disabled checkbox before load stops a write built from defaults from overwriting stored values that later stories add. | Hide labels until loaded; block opening the Table until loaded. |
| A-2 | If `readSettings()` rejects (DB open failure or invalid record, `RangeError`), App logs `console.error('Settings could not be read', error)` and uses `DEFAULT_SETTINGS`. The checkbox is enabled, and the next change overwrites the bad record with a valid one. | yes | Same log-and-continue pattern as Home's paused-session read (`src/ui/App.tsx:90-94`). TASK-12.1 A-6 left the fallback to callers. | Keep the toggle disabled; show an error. |
| A-3 | If `writeSettings` rejects, App logs `console.error('Settings could not be saved', error)` and keeps the new value in memory for this launch. There is no revert and no message. | yes | Matches how table writes fail (logged, play continues). A failed write is rare (quota, closed DB). A user-visible message is new UX that belongs to TASK-12.9 / E13. | Revert the checkbox; show an alert. |
| A-4 | The writer is `writeSettings(settings: Settings): Promise<void>`. It replaces the whole record with `parseSettings(settings)` (validated copy) in a `readwrite` transaction with `durability: 'strict'`, and resolves when the transaction completes. | yes | The record is one small object. App always holds the full current value, so a whole-record put is simplest and keeps the stored format unchanged. Same `completed()` / strict durability as `putSession` (`src/storage/hand-store.ts:200-205`). | `updateSettings(patch)` with read-modify-write. |
| A-5 | The App handler is `changeSettings(next: Settings)`. `SettingsScreen` builds `next` as `{ ...settings, showOpponentStyles: checked }`. Later toggles add their own spread. | yes | One handler for every later toggle (12.5-12.8). TASK-2.11 reads `settings.defaultSpeed` from the same App state. | A handler per field. |
| A-6 | Rapid toggling needs no queue. Each write awaits the same opened DB promise, so the transactions are created in call order. IndexedDB runs overlapping `readwrite` transactions in creation order, so the last change wins. | yes | `database()` memoises one promise (`src/storage/hand-store.ts:185-186`). | An explicit write queue. |
| A-7 | The new seat markup when hidden is `<span class="seat-line"><span data-part="stack">$N</span></span>`. The `.seat-line` wrapper stays so the CSS (`src/ui/styles.css:603-605`) and layout are unchanged. | yes | Smallest markup change. AC#5 only requires the style span and its separator to be absent. | Drop the wrapper. |
| A-8 | The new e2e reaches the toggle by role `checkbox` with name `Show opponent styles at the table`. It reads the stored record with the existing `readStore('settings')` helper (`e2e/support/hand-records.ts:8`). | yes | Reuses the v4 helper. | A new helper. |

## 3. Current system
- Style label markup: the bot `Seat` in `src/ui/table/Table.tsx:139-151` renders
  `<span class="seat-line"><span data-part="style">{seat.style}</span>{' · '}<span data-part="stack">$N</span></span>`
  (`:141-146`). The user seat (`:121-137`) has no style. Its aria-hidden ` · ` sits between name and position and
  is not a style separator. `seat.style` comes from `tableView` (`src/table/table-view.ts:18,213`). No other
  table component renders a style label. `ReviewPanel` ` · ` separators (`src/ui/table/ReviewPanel.tsx:34,40,96`)
  are not style-related. There is no hover panel yet (TASK-3.14 To Do).
- Prop chain: `App` `case 'table'` → `<TableScreen …/>` (`src/ui/App.tsx:306-313`) → `<Table config resume onLeave
  onHome/>` (`src/ui/table/TableScreen.tsx:22`) → `<TableView …/>` (`src/ui/table/Table.tsx:494-511`) →
  `model.seats.map((seat) => <Seat …/>)` (`:300-302`). `Table` already takes a settings-like prop
  `autoOpenReview?: boolean` (default true, `:166`). This story follows that pattern.
- Settings model: `src/table/settings.ts` (`Settings`, `DEFAULT_SETTINGS` with `showOpponentStyles: true` `:19-25`,
  `SettingsReader` `:27-30`, `parseSettings` `:40-59`). Store: `src/storage/hand-store.ts` (`SETTINGS_STORE`/
  `SETTINGS_KEY` `:24-26`, v4 step `:42-44`, `readSettings` `:253-256`, return types `:183,260,263`). Docs say
  "Nothing in the app reads the record yet" and "later stories add the write API" (`docs/storage/settings.md:3-5`).
- Settings screen: `src/ui/settings/SettingsScreen.tsx`. The Display section is empty (`:28-30`). Props are
  `onHome` and `version?` (`:6-10`). App renders it at `src/ui/App.tsx:351-352`. Styles: `.settings-section`
  (`src/ui/styles.css:1308-1325`).
- Storyboard: `dreams/limit-holdem-trainer/storyboards/Settings.dc.html` has no opponent-styles row. Its only
  on/off setting is a native checkbox in a label: `<label style="display:flex; align-items:center; gap:12px;
  min-height:44px; font-size:15px"><input type="checkbox" checked style="width:20px; height:20px"> Open the hand
  review panel after every hand</label>` (`:33`). The label text comes from the task description and REQ-050.3:
  "Show opponent styles at the table".
- Mid-session pickup (codebase/requirements): REQ-050.5 says "changes made mid-session apply from the next screen
  update" (`dreams/limit-holdem-trainer/requirements.md:927`), and the task description says the same. In this
  story Settings is reachable only from Home, so a change applies the next time a Table is shown (new game or
  Resume). With App-held state (D-3), the TASK-12.3 overlay will apply it on the next render with no extra work.
- Default line-up (Game Config "Mixed"): Ava TAG, Ben Calling station, Cal Maniac, Dee Rock, Eli TAG
  (`tests/ui/game-config-lineup.acceptance.test.tsx:37,52`). UI fixtures `FLOP_BET` and the others in
  `tests/support/table-scenarios.ts:36-40` use the storyboard line-up (Ben Calling station, Cal Maniac, Dee Rock,
  Ava and Eli TAG).
- A start record makes a session resumable: `findPausedSession` takes any non-ended record
  (`src/table/session-record.ts:255-269`). The table writes one when it starts.
- Tests: `npm test` = `vitest run --coverage` (node env, `renderToString`). `npm run e2e` = Playwright in Chromium
  and WebKit against `vite build && vite preview` at `http://localhost:4173`. `fake-indexeddb` is used for store
  tests (`tests/storage/settings-store.test.ts:1`).
- Tests that pin the touched markup or store shape (grep of `tests/` and `e2e/` for `data-part="style"`,
  `SettingsScreen`, `settings-section`, `readSettings`, `SETTINGS_STORE`, `showOpponentStyles`, `TableView`):
  - `e2e/settings.spec.ts:69` `expect(expected).toEqual(['← Home'])` and the ≥ 44x44 loop on every focusable
    control in `main` (`:74-81`) [locked, owner TASK-12.1] → **must change** (D-4).
  - `tests/ui/settings.acceptance.test.tsx` [locked, TASK-12.1]: renders `<SettingsScreen onHome version/>`
    without settings and checks `toContain('<section …settings-display"><h2 id="settings-display">Display</h2>')`.
    Unchanged: the new props are optional and the checkbox comes after the h2.
  - `e2e/settings.spec.ts:96-100` h2 list Play, Display, Your data: unchanged (no new heading).
  - `e2e/play-money.spec.ts` / `tests/ui/screen-list.acceptance.test.ts` [locked, TASK-12.1/2.15]: no new screen or
    dialog. Unchanged.
  - Style-label checks with the default (on): `tests/ui/table-display.acceptance.test.tsx:97` [TASK-3.3],
    `e2e/seat-style.spec.ts` [TASK-2.8], `e2e/lineup-choice.spec.ts` [TASK-2.5], `e2e/resume.spec.ts:110`
    [TASK-2.6], `e2e/randomise-lineup.spec.ts` [TASK-2.9], `e2e/table-display.spec.ts` [TASK-10.2]. Unchanged:
    `TableView`'s `showOpponentStyles` defaults to `true`, and App uses `DEFAULT_SETTINGS` until loaded (A-1).
  - All other `TableView` renders in `tests/ui/*` omit the new prop. Unchanged.
  - `tests/storage/settings-store.test.ts`, `tests/table/settings.test.ts` (TASK-12.1, not locked): unchanged.
  - `tests/unit/app.test.tsx` renders `<App/>` with `renderToString` (effects do not run). Unchanged.
- Existing code to reuse:
  - `completed()` and the `putSession` transaction shape (`src/storage/hand-store.ts:62-70,200-205`) → `writeSettings`.
  - `parseSettings` → validate and copy before writing.
  - The `autoOpenReview` prop pattern on `Table` (`src/ui/table/Table.tsx:166,179`) → `showOpponentStyles`.
  - Home's read effect error handling (`src/ui/App.tsx:79-99`) → the settings read effect.
  - `readStore` (`e2e/support/hand-records.ts:8`), `storedSessions` (`:122`), `expectNoSeriousAxeViolations`
    (`e2e/support/axe.ts`) → new e2e.
  - `seatItem` / `part` helpers pattern in `tests/ui/table-display.acceptance.test.tsx` (copy, not exported).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Control: a native checkbox in the Display section, after the h2: `<label class="settings-toggle"><input type="checkbox"/>Show opponent styles at the table</label>`. Checked = labels shown. The input element itself renders at least 44x44 (D-4, Q-2). The label is ≥ 44px high. | A switch (`role="switch"` button); a two-option radio group | Storyboard checkbox style (`Settings.dc.html:33`), wording from the task and REQ-050.3. | yes (user-visible text/UX) | user (Q-1) |
| D-2 | Persisting: every change is saved at once with `writeSettings` (whole record, A-4). The UI updates first, and a failed save is only logged (A-3). The stored format is unchanged (TASK-12.1 D-1). | Save on leaving Settings; patch API; revert on failure | Simplest write that keeps the stored format. Same failure handling as table writes. | yes (persisted write) | user (Q-3) |
| D-3 | The reader is App state `settings: Settings \| undefined`, read at launch (A-1, A-2). It is passed to `SettingsScreen` (`settings`, `onSettingsChange`) and to `TableScreen` (`showOpponentStyles={(settings ?? DEFAULT_SETTINGS).showOpponentStyles}`). A change applies on the next render of any mounted screen, which meets REQ-050.5 for the coming overlay. | Each screen reads the store itself; a React context | One read per launch. The pattern is shared by later setting stories. A context is unnecessary with two consumers. | no | n/a |
| D-4 | Locked-test edit `e2e/settings.spec.ts` [owner TASK-12.1], test "every Settings control is reachable by Tab, native, keyboard-operable and at least 44x44": (1) after `openSettings`, `await expect(page.getByRole('checkbox', { name: 'Show opponent styles at the table' })).toBeEnabled()`. (2) A control's name is `el.textContent \|\| (el as HTMLInputElement).labels?.[0]?.textContent?.trim() \|\| ''`, used both in the `expected` map and in `tabOrder`'s `page.evaluate`. (3) `expected` is `['← Home', 'Show opponent styles at the table']`. Nothing else changes. The 44x44 assertion on each control, the tag check and the Enter/Space checks stay as they are, so the checkbox input element must itself render at least 44x44 (CSS below). | Measure the size on the label (rejected: it would loosen a locked assertion) | Keeps every locked assertion as strict as before. | yes (locked edit) | user (Q-2; unlocked under TASK-12.1) |

## 5. Design

### Files to create / modify
- `src/table/settings.ts` — add `SettingsWriter` interface.
- `src/storage/hand-store.ts` — `writeSettings`, and `& SettingsWriter` on the `openHandStore` / `sharedHandStore` return types.
- `src/ui/settings/SettingsScreen.tsx` — optional `settings` / `onSettingsChange` props and the checkbox (D-1).
- `src/ui/App.tsx` — `settings` state, mount read effect, `changeSettings`, props to Settings and Table (D-3).
  No `;` in any comment inside `type Screen` (the union is not changed).
- `src/ui/table/TableScreen.tsx` — `showOpponentStyles?: boolean` passed to `Table`.
- `src/ui/table/Table.tsx` — `showOpponentStyles?: boolean` on `TableProps` and `TableViewProps` (default `true`),
  passed to the bot `Seat`, which omits the style span and separator when false (A-7).
- `src/ui/styles.css` — `.settings-toggle` (flex, gap 12px, min-height 44px, font-size 15px, cursor pointer) and
  `.settings-toggle input` (`width: 44px; height: 44px; margin: 0; flex: none; accent-color: #d7262e`). The input
  element's bounding box must be at least 44x44 in Chromium and WebKit (D-4). WebKit may paint a smaller glyph
  centred in that box, which is acceptable.
- `tests/storage/settings-write.test.ts` — new (SPEC-07).
- `tests/ui/opponent-styles.acceptance.test.tsx` — new (SPEC-01, SPEC-03, SPEC-04).
- `e2e/opponent-styles.spec.ts` — new (SPEC-02, SPEC-05, SPEC-06, SPEC-08).
- `e2e/settings.spec.ts` — locked edit (D-4).
- `docs/storage/settings.md` — "Writing" section and "Readers" (App state); remove "Nothing in the app reads
  the record yet".
- `docs/ui/navigation.md` — Settings paragraph: the Display toggle and when it applies.

### Components, interfaces and data
- `src/table/settings.ts`:
  ```ts
  export interface SettingsWriter {
    /** Replaces the stored settings with a validated copy of `settings`; rejects with parseSettings' RangeError or the DB error. */
    writeSettings(settings: Settings): Promise<void>;
  }
  ```
- `src/storage/hand-store.ts` in `openHandStore`:
  ```ts
  async writeSettings(settings) {
    const record = parseSettings(settings);
    const transaction = (await database()).transaction(SETTINGS_STORE, 'readwrite', { durability: 'strict' });
    return completed(transaction, transaction.objectStore(SETTINGS_STORE).put(record, SETTINGS_KEY));
  }
  ```
  Return types become `HandStore & SessionEnder & TrendReader & SettingsReader & SettingsWriter` (`:183,260,263`).
- `SettingsScreen` props add:
  ```ts
  /** The current settings; undefined while they are being read (controls disabled). */
  readonly settings?: Settings;
  /** Called with the whole new settings record when a control changes. */
  readonly onSettingsChange?: (settings: Settings) => void;
  ```
  Display section markup (after the h2):
  ```tsx
  <label className="settings-toggle">
    <input
      type="checkbox"
      checked={(settings ?? DEFAULT_SETTINGS).showOpponentStyles}
      disabled={settings === undefined || onSettingsChange === undefined}
      onChange={(e) => settings && onSettingsChange?.({ ...settings, showOpponentStyles: e.currentTarget.checked })}
    />
    Show opponent styles at the table
  </label>
  ```
- `App.tsx`:
  - `const [settings, setSettings] = useState<Settings | undefined>(undefined)`.
  - Mount effect (`[]`): `sharedHandStore().readSettings().then((s) => { if (!cancelled) setSettings(s) }, (error) => { if (cancelled) return; console.error('Settings could not be read', error); setSettings(DEFAULT_SETTINGS) })`, with cleanup `cancelled = true`.
  - `const changeSettings = (next: Settings): void => { setSettings(next); sharedHandStore().writeSettings(next).catch((error: unknown) => console.error('Settings could not be saved', error)) }`.
  - `case 'settings'`: `<SettingsScreen onHome={…} settings={settings} onSettingsChange={changeSettings} />`.
  - `case 'table'`: `<TableScreen … showOpponentStyles={(settings ?? DEFAULT_SETTINGS).showOpponentStyles} />`.
- `TableScreen` → `<Table … showOpponentStyles={showOpponentStyles} />`. `Table` destructures it (default `true`)
  and passes it to `TableView`. `TableView` passes `showStyle={showOpponentStyles}` to each `Seat`.
- Bot `Seat` when `showStyle` is false:
  `<span className="seat-line"><span data-part="stack">{`$${seat.stack}`}</span></span>`. When true, it is unchanged.

### Rules and algorithms
- Table: label shown on a bot seat ⇔ `showOpponentStyles`. Example: off with `FLOP_BET` → seat 2 (Ben) contains
  `data-part="name">Ben` and `data-part="stack">$146`, and no `data-part="style"` or ` · `.
- Effective value: `(settings ?? DEFAULT_SETTINGS).showOpponentStyles`. Fresh install → `true`.
- Change → in-memory first, then save. Reload → the stored value is read at mount.

### Error handling and configuration
- `writeSettings`: an invalid argument rejects with `RangeError('Invalid settings: <field>')` before any
  transaction. A DB or transaction error rejects with that error. App logs failures (A-3).
- Read failure → defaults plus a log (A-2).
- No new dependency or configuration.

## 6. Behaviour specification

### SPEC-01: Fresh settings show the toggle on
- Verifies: AC#1
- Behaviour: Given `SettingsScreen` rendered with `settings={DEFAULT_SETTINGS}` and an `onSettingsChange`, When
  rendered, Then the Display section (after `<h2 id="settings-display">Display</h2>`) contains exactly one
  `<label class="settings-toggle"><input type="checkbox" checked=""/>Show opponent styles at the table</label>`.
  With `{ ...DEFAULT_SETTINGS, showOpponentStyles: false }` the input has no `checked`. With `settings` omitted, the
  input is `disabled=""` and `checked=""`.
- Verification: acceptance `tests/ui/opponent-styles.acceptance.test.tsx::the Settings toggle is on for default settings and off when saved off`

### SPEC-02: Fresh install in the browser shows the toggle on and labels shown
- Verifies: AC#1, AC#3, DoD#7
- Behaviour: Given a new browser context at `/`, When the user opens Settings, Then the checkbox "Show opponent
  styles at the table" is checked and enabled, axe reports zero serious/critical violations, and
  `readStore('settings')` holds one record with `showOpponentStyles: true`. When the user then goes `← Home` →
  New game → Start game, Then the 5 bot seats show style labels Ava `TAG`, Ben `Calling station`, Cal `Maniac`,
  Dee `Rock`, Eli `TAG`. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/opponent-styles.spec.ts::a fresh install shows the toggle on and every bot's style at the table`

### SPEC-03: Off hides every style label, name and stack stay
- Verifies: AC#2, AC#5
- Behaviour: Given `TableView` rendered with `FLOP_BET` and `showOpponentStyles={false}`, When rendered, Then the
  markup has no `data-part="style"`. Ben's seat (`data-seat="2"`) shows `data-part="name"` `Ben` and
  `data-part="stack"` `$146`, and its `seat-line` is exactly `<span class="seat-line"><span data-part="stack">$146</span></span>`.
  No bot seat (`li[data-seat]` without `data-user`) contains ` · `. Street amount, action and card back are as with
  the toggle on (`This street $4`, `Bet $4`, one card back). The user seat is unchanged.
- Verification: acceptance `tests/ui/opponent-styles.acceptance.test.tsx::off hides every style label and its separator and keeps name and stack`

### SPEC-04: On (and default) shows every bot's style
- Verifies: AC#3
- Behaviour: Given `TableView` with `FLOP_BET`, When rendered with `showOpponentStyles={true}` and also without
  the prop, Then both markups are identical, and each of the five bot seats has one `data-part="style"` equal to
  its seat's style (Ben `Calling station`, Cal `Maniac`, Dee `Rock`, Ava `TAG`, Eli `TAG`) followed by ` · ` and
  the stack.
- Verification: acceptance `tests/ui/opponent-styles.acceptance.test.tsx::on and by default every bot seat shows its style label`

### SPEC-05: Turning it off saves at once, survives reload, hides labels
- Verifies: AC#2, AC#4, AC#5, DoD#7, DoD#8
- Behaviour: Given a new browser context, When the user opens Settings, focuses the checkbox and presses Space, Then the checkbox is unchecked and
  `readStore('settings')` polls to a record with `showOpponentStyles: false` and the other four fields at their
  defaults. When the page is reloaded and Settings opened again, Then the checkbox is unchecked. When the user goes
  `← Home` → New game → Start game, Then the Table region has 0 `[data-part="style"]`, Ben's seat shows `Ben` and a
  `$` stack, and no bot seat's `.seat-line` text contains `·`. Every request's origin is `http://localhost:4173`.
  Runs in Chromium and WebKit.
- Verification: acceptance `e2e/opponent-styles.spec.ts::turning styles off is saved, kept after reload and hides every label at the table`

### SPEC-06: A change made while a session is paused applies when it resumes
- Verifies: AC#3, AC#4
- Behaviour: Given styles off and a started table (stored session polled to 1 record), When the user presses the
  table's `Home`, opens Settings, checks the toggle, returns `← Home` and presses `Resume session`, Then every bot
  seat shows its style label again (5 `[data-part="style"]`).
- Verification: acceptance `e2e/opponent-styles.spec.ts::a change made while paused applies when the table resumes`

### SPEC-07: writeSettings replaces the record and validates
- Verifies: AC#4, DoD#4
- Behaviour: Given `openHandStore(new IDBFactory())`, When `writeSettings({ ...DEFAULT_SETTINGS, showOpponentStyles: false })`
  resolves, Then `readSettings()` resolves that value, and a second `openHandStore` on the same factory reads it
  too. Two writes started back to back without awaiting (false then true) leave `true`. A value with an extra
  field is stored without it. `writeSettings({ ...DEFAULT_SETTINGS, showOpponentStyles: 'no' } as never)` rejects
  with `RangeError('Invalid settings: showOpponentStyles')` and the stored record is unchanged.
- Verification: unit `tests/storage/settings-write.test.ts::writeSettings replaces the stored settings and rejects invalid ones`

### SPEC-08: An unreadable stored record falls back to defaults
- Verifies: AC#1
- Behaviour: Given the stored settings record replaced (in the page, at v4) with
  `{ ...defaults, showOpponentStyles: 'no' }`, When the page is reloaded and Settings opened, Then the checkbox is
  checked and enabled. Unchecking it stores a valid record with `showOpponentStyles: false`.
- Verification: acceptance `e2e/opponent-styles.spec.ts::an invalid stored record shows the defaults and the next change repairs it`

### SPEC-09: Settings keyboard and size checks include the toggle
- Verifies: DoD#7
- Behaviour: Given the D-4 edit, When `e2e/settings.spec.ts` runs, Then Tab (Alt+Tab in WebKit) reaches `← Home`
  then the checkbox, both are native, and `← Home` and the checkbox input element itself are ≥ 44x44 (the
  unchanged locked size assertion).
  Space on the focused checkbox is covered by SPEC-05.
- Verification: acceptance `e2e/settings.spec.ts::every Settings control is reachable by Tab, native, keyboard-operable and at least 44x44`

### SPEC-10: Project checks
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Lint (incl. the headless boundary on `src/table/settings.ts`), typecheck, the full Vitest suite with
  coverage (`src/table/**` ≥ 90%, overall ≥ 70%) and the e2e suite pass with zero errors. CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

### SPEC-11: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/settings.md` documents `writeSettings` (whole-record replace, validation, strict
  durability, App's log-only failure) and App as the reader (read at launch, defaults on failure). The sentence
  "Nothing in the app reads the record yet" is gone. `docs/ui/navigation.md` describes the Display toggle and that a
  change applies the next time the Table is shown. The story doc is published to Backlog.
- Verification: manual the two doc files and the `backlog doc list --plain` entry for TASK-12.2

### SPEC-12: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: No engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
  playtest are unaffected. No strategy content. No new screen or dialog, and no service worker exists yet (E13-S07).
- Verification: manual `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Settings not yet loaded: checkbox disabled, table uses defaults (A-1). SPEC-01 covers the disabled render.
- Invalid or unreadable stored record: SPEC-08 (A-2).
- Rapid toggling / back-to-back writes: last wins (SPEC-07, A-6).
- Save failure (quota, DB closed): logged, value kept for this launch (A-3). Not tested: it cannot be provoked in
  the browser without faking IndexedDB. The rejection path of `writeSettings` is covered by SPEC-07's invalid case.
- Paused session resumed after a change: SPEC-06.
- Heads-up or fewer bots: the rule is per bot seat, so it applies to any count (SPEC-03 checks every bot seat).
- User seat: never has a style. Its name · position separator stays (SPEC-03).
- Concurrency across tabs: N/A. Each tab reads at launch, and the last save wins in storage. Cross-tab sync is not
  a requirement.
- Empty/max input, permissions: N/A (boolean control).

## 8. Security considerations
- Trust boundary: the stored record (editable in devtools) is validated by `parseSettings` on read (SPEC-08). The
  writer also validates before writing, so the app never stores an invalid record.
- No authn/authz, secrets, network calls (SPEC-05 checks origins) or new dependencies. Label text is static React
  text. Randomness: N/A.

## 9. Non-functional
- Accessibility: native checkbox with its text inside the `<label>` (accessible name), checkbox input ≥ 44x44 (SPEC-09), axe zero
  serious/critical (SPEC-02). Label text colour inherits `#f2f3f5` on the panel (≥ 4.5:1).
- Responsiveness: the change shows on the next render (state set before the save).
- Normal suite speed: new Vitest tests are in-memory (`renderToString`, `fake-indexeddb`), well under 1 s. The new
  e2e has 4 short tests with no hand played (the table is checked as soon as it is dealt). Nothing is added to
  the opt-in slow lists.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → Home → Settings → uncheck "Show opponent styles at the table" → ← Home → New game → Start game (no style labels) → reload → Settings shows it unchecked
- New tests (path → SPEC ids):
  - `tests/ui/opponent-styles.acceptance.test.tsx` → SPEC-01, SPEC-03, SPEC-04
  - `tests/storage/settings-write.test.ts` → SPEC-07
  - `e2e/opponent-styles.spec.ts` → SPEC-02, SPEC-05, SPEC-06, SPEC-08
  - Locked edit (D-4): `e2e/settings.spec.ts` → SPEC-09
- Judge end-to-end: `npm run build && npm run preview`. On a fresh profile, open Settings: the Display section shows
  "Show opponent styles at the table", checked. Start a 6-max game: each bot seat reads e.g. "Ben / Calling station ·
  $150". Go Home, open Settings, uncheck it (with the keyboard: Tab to it, Space). In devtools > IndexedDB >
  tlh-trainer > settings, `showOpponentStyles` is `false`. Reload, open Settings: still unchecked. Resume: seats
  show name and stack only, with no "·". Check it again, Resume: labels are back. Game Config's line-up still shows
  styles throughout.

## 11. Open questions
None. Q-1 (recommended), Q-2 (alternative: the input itself is ≥ 44x44, locked edits 1-3 only) and Q-3
(recommended) are answered in `doit/TASK-12.2/qa.md`.

## 12. Clarifications log
See `doit/TASK-12.2/qa.md`.
