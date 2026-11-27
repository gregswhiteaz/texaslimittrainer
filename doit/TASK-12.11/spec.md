# Spec: TASK-12.11 — Tell me when a Settings change could not be saved

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-12.11 · Parent/epic: TASK-12 · Requirements: n/a (follow-up from doc-142, TASK-12.2 A-3) · Dream: limit-holdem-trainer

## 1. Summary
Today a failed settings save is only logged (`console.error('Settings could not be saved')`,
`src/ui/App.tsx:327`) and the screen keeps the new value, so the user can believe a change was saved when it
was not. After this task a failed save shows a short message on Settings, and the control goes back to the
value that is actually stored. The stored record stays unchanged (the failed write never commits).

## 2. Scope
- In scope:
  - A small pure save tracker (`src/ui/settings/settings-save.ts`) that decides, for each settled write,
    whether it is the latest one and what value to go back to on failure.
  - `src/ui/App.tsx`: `changeSettings` uses the tracker; a `settingsSaveFailed` flag; revert on failure; the
    log line stays.
  - `src/ui/settings/SettingsScreen.tsx`: a `saveFailed` prop that renders the message.
  - `src/ui/styles.css`: one `.settings-error` rule.
  - Docs: `docs/storage/settings.md`, `docs/ui/navigation.md`.
  - Tests: one unit file, one UI acceptance file, one Playwright file.
- Not doing:
  - No retry button, no automatic retry, no write queue (TASK-12.2 A-6 stays).
  - No message for a failed settings **read** at launch (TASK-12.2 A-2 stays: log and use defaults).
  - No change to `writeSettings`, `parseSettings` or the stored record format.
  - No message on screens other than Settings (Table, Home). No toast/banner component for the whole app
    (TASK-12.9 / E13 territory).
  - No change to the persistent-storage warning (TASK-12.9).
- Scope budget: files=9, lines=360

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Only the latest change's outcome drives the screen. An earlier write that succeeds updates the "last saved" value; an earlier write that fails while a newer change is pending is ignored (the newer write decides). | yes | Transactions on one store commit in call order (`docs/storage/settings.md:60-61`), so the last settled write is what is stored. | Show the message for any failed write, even superseded ones. |
| A-2 | "Last saved" starts as the launch-read value; if the launch read failed it is `DEFAULT_SETTINGS` (what App already shows, `src/ui/App.tsx:105-106`). | yes | The screen already treats defaults as the current value after a failed read. | Leave the control on the failed value when nothing valid is known. |
| A-3 | The message clears when the user makes the next change (and shows again if that save also fails) and when Settings is opened again. It is not cleared by a timer. | yes | Re-inserting the alert on a repeat failure makes screen readers announce it again; a timer could hide it before it is read. | Clear only on a successful save; auto-hide after N seconds. |
| A-4 | If a save fails after the user has already left Settings, App still reverts the value but no message is shown anywhere (it is cleared on the next open of Settings). | yes | Writes settle in milliseconds; leaving Settings that fast is rare, and the Table must not show a stale value. | Show the message on the next Settings open. |
| A-5 | The e2e makes saves fail with a test-only init script that throws from `IDBObjectStore.prototype.put` for the `settings` store while a window flag is set. | yes | Same pattern as `e2e/support/hold-writes.ts:22-46` (prototype patch, nothing imported from `src/`). | Abort the transaction; delete the database mid-test. |
| A-6 | The `console.error('Settings could not be saved', error)` log stays for every failed write. | yes | Keeps diagnostics already documented in `docs/storage/settings.md:73`. | Drop the log. |

## 3. Current system
- `src/ui/App.tsx:87` holds `settings: Settings | undefined`; the launch read is at `App.tsx:95-111`.
- `src/ui/App.tsx:322-328` `changeSettings(next)`: `setSettings(next)` then `writeSettings(next)`, catch logs.
- `src/ui/App.tsx:342-345` opens Settings (`onSettings`); `App.tsx:413-419` renders `SettingsScreen` with
  `settings` and `onSettingsChange`.
- `src/ui/settings/SettingsScreen.tsx:31-66`: `<main>` → `<header>` (h1, then `← Home`, TASK-12.10) → Play,
  Display (the one checkbox), Your data sections → version line.
- `src/storage/hand-store.ts:344-353` `writeSettings`: validates then puts in a strict transaction;
  `completed()` (`hand-store.ts:110-117`) rejects on request error, transaction error or abort, so a failed
  write leaves the previous record in place.
- Visible-error voice in the UI: `src/ui/table/HintCard.tsx:24` "The hint could not be worked out. Select Hint
  to try again." Live-region precedent: `role="status"` at `src/ui/table/Table.tsx:167`, `aria-live="polite"`
  at `src/ui/table/HintCard.tsx:17`; no `role="alert"` yet.
- UI tests render with `renderToString` (`tests/ui/opponent-styles.acceptance.test.tsx:1`); Playwright reads the
  store with `readStore` from `e2e/support/hand-records.ts` (`e2e/opponent-styles.spec.ts:3,24`).
- Tests: `npm test` (Vitest with coverage), `npm run e2e` (Playwright, Chromium and WebKit) — `package.json`.
- Existing code to reuse (path → what to reuse instead of writing new):
  - `e2e/opponent-styles.spec.ts` → its `openSettings`, `toggle`, `DEFAULTS` patterns (copy, the file is locked).
  - `e2e/support/hand-records.ts` → `readStore('settings')` to read the raw record.
  - `e2e/support/axe.ts` → `expectNoSeriousAxeViolations` with the message shown.
  - `src/table/settings.ts` → `Settings`, `DEFAULT_SETTINGS`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Message wording: `Your change could not be saved, so the setting is unchanged.` | Q-1 alternatives (a) keep value + "lost when you close the app", (b) under the control with role="status", (c) add "Try again." | Short, plain, true after the revert; matches the "could not be …" voice of HintCard. | yes | user (Q-1, autopilot) |
| D-2 | On failure the control reverts to the last saved value. | Q-1 alternatives (a) keep value + "lost when you close the app", (b) under the control with role="status", (c) add "Try again." | Screen, Table and storage then agree; fixes the task's actual problem. | yes | user (Q-1, autopilot) |
| D-3 | One `<p role="alert" class="settings-error">` directly after the Settings header, before Play. Not focusable; focus stays on the control. | Q-1 alternatives (a) keep value + "lost when you close the app", (b) under the control with role="status", (c) add "Try again." | One place for every current and future control; visible without scrolling on the short screen; `role="alert"` is announced on insertion. | yes | user (Q-1, autopilot) |
| D-4 | Outcome logic is a pure tracker (`createSettingsSaver`) unit-tested with fake writes, so the "latest only" guard is mutation-checked (doc-142 lesson). | Inline in App with a ref counter | App cannot be event-tested under `renderToString`. | no | n/a |

## 5. Design

### Files to create / modify
- `src/ui/settings/settings-save.ts` — new: `createSettingsSaver`.
- `src/ui/App.tsx` — use the saver; `settingsSaveFailed` state; revert; clear on open of Settings.
- `src/ui/settings/SettingsScreen.tsx` — `saveFailed?: boolean` prop; render the message.
- `src/ui/styles.css` — `.settings-error`.
- `docs/storage/settings.md` — replace "A failed save is only logged…" with the new behaviour.
- `docs/ui/navigation.md` — one sentence under the Display paragraph about the message.
- `tests/ui/settings-save.test.ts` — new unit tests for the saver.
- `tests/ui/settings-save-failed.acceptance.test.tsx` — new markup tests for the message.
- `e2e/settings-save-failed.spec.ts` — new Playwright tests (with its inline init script).

### Components, interfaces and data
```ts
// src/ui/settings/settings-save.ts
export type SaveOutcome =
  | { readonly kind: 'saved' }                              // latest write committed
  | { readonly kind: 'failed'; readonly revertTo: Settings; readonly error: unknown } // latest write failed
  | { readonly kind: 'superseded' };                        // a newer save was started before this settled
export interface SettingsSaver {
  /** Records the value known to be stored (launch read result, or DEFAULT_SETTINGS if it failed). */
  setSaved(settings: Settings): void;
  /** Starts write(next); resolves (never rejects) with the outcome once it settles. */
  save(next: Settings): Promise<SaveOutcome>;
}
export function createSettingsSaver(
  write: (settings: Settings) => Promise<void>,
  initial: Settings,
): SettingsSaver;
```
- Invariants: `saved` is updated by every successful write (latest or not), in settle order. Each `save` takes a
  sequence number; only the highest number's outcome is `saved`/`failed`, older ones are `superseded`.
  `revertTo` is the `saved` value at the moment the failing latest write settles.
- `SettingsScreenProps.saveFailed?: boolean` (default `false`). When `true`, render, as the first child of
  `<main>` after `</header>`:
  `<p role="alert" class="settings-error">Your change could not be saved, so the setting is unchanged.</p>`.
  When `false`, render nothing in its place (no empty alert element).
- App: `const saver = useRef(createSettingsSaver((s) => sharedHandStore().writeSettings(s), DEFAULT_SETTINGS))`;
  the launch read calls `saver.current.setSaved(stored)` (or `DEFAULT_SETTINGS` on failure) alongside
  `setSettings`. State `settingsSaveFailed: boolean` (initially `false`).

### Rules and algorithms
- `changeSettings(next)`: `setSettings(next)`; `setSettingsSaveFailed(false)`; `saver.save(next).then(o => …)`:
  - `saved` → nothing more (flag already false).
  - `failed` → `console.error('Settings could not be saved', o.error)`; `setSettings(o.revertTo)`;
    `setSettingsSaveFailed(true)`.
  - `superseded` → if it was a failure, still log it (A-6); no state change.
- `onSettings` (Home → Settings) also sets `settingsSaveFailed` to `false`.
- Worked example (stored `showOpponentStyles: true`): user unticks → shown unticked, write fails → shown
  ticked again, message shown, record still `true`. User unticks again with saves working → message
  disappears at once, write succeeds → shown unticked, record `false`.
- Race example: untick (write #1), tick (write #2) before #1 settles. #1 fails → `superseded`, logged only.
  #2 succeeds → `saved`; record and screen show `true`, no message.

### Error handling and configuration
- User-visible text: exactly `Your change could not be saved, so the setting is unchanged.` (approved by Q-1).
- Log text unchanged: `Settings could not be saved`.
- `.settings-error`: same font size as `.settings-section p`, a visible error colour from the existing palette
  with contrast >= 4.5:1 (axe must pass), no layout shift elsewhere beyond the inserted line.

## 6. Behaviour specification

### SPEC-01: A failed save shows the message, reverts the control and leaves the record unchanged
- Verifies: AC#1
- Behaviour: Given a fresh install (record equals the defaults, `showOpponentStyles: true`) and settings writes
  that fail, When the user opens Settings and unticks "Show opponent styles at the table", Then an element
  with role `alert` and text `Your change could not be saved, so the setting is unchanged.` is visible, the
  checkbox is checked again, focus stays on the checkbox, the raw `settings` record still equals the defaults,
  and axe reports no serious violations.
- Verification: acceptance `e2e/settings-save-failed.spec.ts::a failed save shows the message, keeps the toggle and the stored record unchanged`

### SPEC-02: The next change clears the message, and a working save stores it
- Verifies: AC#1
- Behaviour: Given SPEC-01's end state, When writes work again and the user unticks the checkbox, Then the alert
  is gone, the checkbox is unchecked, and the raw record has `showOpponentStyles: false`. Given the message is
  shown, When the user goes `← Home` and opens Settings again, Then no alert is shown.
- Verification: acceptance `e2e/settings-save-failed.spec.ts::the next change or reopening Settings clears the message`

### SPEC-03: The message markup
- Verifies: AC#1
- Behaviour: Given `SettingsScreen` with `saveFailed` true, Then the markup contains exactly one
  `<p role="alert" class="settings-error">Your change could not be saved, so the setting is unchanged.</p>`,
  placed after `</header>` and before the Play section. Given `saveFailed` false or absent, Then the markup has
  no `role="alert"` and no `settings-error`.
- Verification: acceptance `tests/ui/settings-save-failed.acceptance.test.tsx::the save-failed message renders after the header only when saveFailed is set`

### SPEC-04: The saver reports the latest outcome and the value to revert to
- Verifies: AC#1
- Behaviour: Given a saver with initial `A`, When `save(B)` rejects, Then the outcome is `failed` with
  `revertTo` = `A`. When `save(B)` resolves, Then `saved`, and a later failing `save(C)` gives `revertTo` = `B`.
  Given `setSaved(S)` was called, a failing save reverts to `S`.
- Verification: unit `tests/ui/settings-save.test.ts::a failed latest save reverts to the last saved value`

### SPEC-05: Superseded writes do not drive the screen
- Verifies: AC#1
- Behaviour: Given initial `A`, When `save(B)` then `save(C)` start and B fails, Then B's outcome is
  `superseded`; C resolving gives `saved`. When B succeeds and C fails, Then B is `superseded` and C is
  `failed` with `revertTo` = `B`. The `save` promise never rejects.
- Verification: unit `tests/ui/settings-save.test.ts::only the latest save decides the outcome`

## 7. Edge cases
- Rapid toggling / concurrency: SPEC-05 (A-1).
- Repeat failures: message cleared at the next change and inserted again on failure (A-3), SPEC-02 covers clear.
- Launch read failed then save fails: reverts to `DEFAULT_SETTINGS` (A-2), covered by SPEC-04 `setSaved`.
- Save fails after leaving Settings: A-4; no visible surface, value reverts; no separate SPEC (rare timing).
- Controls disabled while loading: unchanged from TASK-12.2; no save can start before the read settles.
- Empty / invalid input: N/A — `next` is built from valid settings by the screen; `writeSettings` validation is
  unchanged.

## 8. Security considerations
- Trust boundaries: none new; the message is a fixed string, no error text is shown to the user.
- Sensitive data in logs: unchanged (error object logged to console as today).
- New dependencies: none. Randomness: N/A. Injection: N/A (static text). Test-only hook lives in the e2e file
  and is not imported from `src/`.

## 9. Non-functional
- Accessibility: `role="alert"` message, axe clean with the message shown (SPEC-01); no new focusable element,
  so the locked Tab-order test `e2e/settings.spec.ts` is unaffected.
- No bundle or performance targets apply.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, open Settings; to see the failure, in devtools run
  `IDBObjectStore.prototype.put = () => { throw new Error('x') }` then untick the toggle.
- New tests:
  - `tests/ui/settings-save.test.ts` → SPEC-04, SPEC-05 (mutation check: removing the sequence-number guard or
    the `saved` update must fail a test).
  - `tests/ui/settings-save-failed.acceptance.test.tsx` → SPEC-03.
  - `e2e/settings-save-failed.spec.ts` → SPEC-01, SPEC-02 (Chromium and WebKit).
- Judge end-to-end: on a built preview, make settings puts throw, untick the toggle, see the message and the
  toggle ticked again, confirm the IndexedDB `settings` record is unchanged; restore puts, untick again, see the
  message gone and the record saved; start a game and confirm style labels match the stored value.

## 11. Open questions
- None. Q-1 resolved (recommended option, autopilot): see D-1, D-2, D-3 and `doit/TASK-12.11/qa.md`.

## 12. Clarifications log
See `doit/TASK-12.11/qa.md`.
