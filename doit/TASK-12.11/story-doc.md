# TASK-12.11: Tell me when a Settings change could not be saved

Status: Done (pending orchestrator) · Completed: 2026-11-27 · Epic: TASK-12 — Tune the trainer · Milestone: m-1 · Requirements: n/a (follow-up from doc-142, TASK-12.2 A-3) · Branch: doit/TASK-12.11

## What was asked
Before this task a failed settings save was only logged to the console. The screen kept the new value, so the user could believe a change was saved when it was not. Now a failed save shows a short message on Settings and the control goes back to the value that is really stored. The stored record is never changed by a failed write. Spec: doit/TASK-12.11/spec.md.

## Assumptions made without asking — please review
Wording review requested: the message text was auto-accepted in Q-1 (see below).

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Only the latest change's outcome drives the screen. An earlier failed write is ignored if a newer change is pending. | yes | Transactions on one store commit in call order, so the last settled write is what is stored. | Show the message for any failed write (change the saver's `superseded` handling). |
| A-2 | "Last saved" starts as the launch-read value, or `DEFAULT_SETTINGS` if the launch read failed. | yes | The screen already treats defaults as current after a failed read. | Leave the control on the failed value. |
| A-3 | The message clears on the next change (and on reopening Settings), not on a timer. It reappears if that save also fails. | yes | Re-inserting the alert makes screen readers announce it again. A timer could hide it before it is read. | Clear only on a successful save, or auto-hide. |
| A-4 | If a save fails after the user has left Settings, the value reverts but no message is shown. | yes | Writes settle in milliseconds. The Table must not show a stale value. | Show the message on the next Settings open. |
| A-5 | The e2e makes saves fail with a test-only init script that throws from `IDBObjectStore.prototype.put` for the `settings` store. | yes | Same pattern as `e2e/support/hold-writes.ts`. Nothing in `src/` references it. | Abort the transaction or delete the database mid-test. |
| A-6 | `console.error('Settings could not be saved', error)` stays for every failed write, including superseded ones. | yes | Keeps documented diagnostics. | Drop the log. |

## Clarifications and decisions
- Q-1 (auto-accepted, autopilot, recommended option): the control reverts to the stored value. The message reads exactly "Your change could not be saved, so the setting is unchanged." It is a `<p role="alert" class="settings-error">` after the Settings header, not focusable. **User-visible wording, please review.** Alternatives not taken: (a) keep the new value with "It will be lost when you close the app", (b) message under the control with `role="status"`, (c) add "Try again."
- D-1..D-3 are those Q-1 choices (wording, revert, placement). D-4: outcome logic is a pure tracker, unit-tested with fake writes, because App cannot be event-tested under `renderToString`.

## What was built
- `src/ui/settings/settings-save.ts` (new): `createSettingsSaver(write, initial)` returns `{ setSaved, save }`. `save(next)` resolves, and never rejects, with `saved`, `failed` (with `revertTo` and `error`) or `superseded`. Each save gets a sequence number and only the newest one reports saved or failed. Every successful write updates the last-saved value. A superseded outcome carries an optional `error` so App can still log it (small addition to the spec's interface).
- `src/ui/App.tsx`: `changeSettings` sets the new value, clears `settingsSaveFailed`, then saves through the saver. On `failed` it logs, reverts and sets the flag. The launch read seeds the saver. Opening Settings clears the flag.
- `src/ui/settings/SettingsScreen.tsx`: optional `saveFailed` prop. When true it renders the alert after the header, and nothing when false.
- `src/ui/styles.css`: `.settings-error` (#ff6b70, 14px).
- Docs: `docs/storage/settings.md`, `docs/ui/navigation.md`.
- Tests: `tests/ui/settings-save.test.ts`, `tests/ui/settings-save-failed.acceptance.test.tsx`, `e2e/settings-save-failed.spec.ts`.
- No new dependencies. The `writeSettings`, `parseSettings` and the record format are unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Failed save shows message, reverts control, record unchanged | Playwright, Chromium and WebKit | PASS | Alert text visible, checkbox checked and focused, raw record equals defaults, log present, axe clean. Judge holdout covered the mouse path. |
| SPEC-02 | Next change or reopening clears the message | Playwright, Chromium and WebKit | PASS | Alert gone, record `false` after a working change, no alert after Home then Settings. Holdout: a repeat failure re-shows it. |
| SPEC-03 | Message markup | Vitest acceptance (`renderToString`) | PASS | Test file locked. |
| SPEC-04, SPEC-05 | Saver: latest-only and revert value | Vitest unit tests with fake writes | PASS | `tests/ui/settings-save.test.ts` |

- `npm test`: 1543 passed, 0 failed. 60 tests are skipped (older opt-in slow tests). Lint and typecheck passed.
- End to end: build and preview driven through Playwright on both browsers. The judge saw 5 style labels at the table after a failed untick, and 0 after a working one.
- Gates: build-1, fix-2 and fix-3 all PASS. 323 changed lines against a budget of 360, and 9 files against 9. Locked tests and integrity checks passed.
- Judge round 1: PASS (5/5). No failures and no escalation.

## Review
Round 1 (code and security): no blocking findings. Security found nothing: the message is a fixed string, error objects only go to `console.error`, and there is no test hook in `src/`.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code) and LOW (judge J-1-01): no test tells "the message clears on the next change" apart from "clears when that save succeeds". The e2e only sees the alert gone after a save that succeeds in milliseconds. A held write (`e2e/support/hold-writes.ts` pattern) would close it. The orchestrator is adding this as an AC to TASK-12.12.
- NIT: `useRef(createSettingsSaver(...))` builds a new saver on each App render and discards it after the first. It is harmless and follows the spec's form.
- NIT: `backlog/tasks/task-1.58` (a CI timeout follow-up) was committed on this branch. It is an orchestrator follow-up, not part of this task's scope.

## How to try it
- `npm test`
- `npx playwright test e2e/settings-save-failed.spec.ts` (Chromium and WebKit)
- Manual: `npm run build && npm run preview`. In the browser, make `IDBObjectStore.prototype.put` throw for the `settings` store, then untick "Show opponent styles at the table".

## Run metrics
Questions 1 (auto-accepted) · assumptions logged 6 (in spec; the state counter shows 0) · review rounds 1 · judge rounds 1 · gate runs 3 · escalations 0 · changed lines 323 (9 files).

## Known limitations and follow-ups
- [trainer] Add a held-write e2e that pins "message clears on the next change, before that save settles". Owner: TASK-12.12 (the orchestrator is adding the AC).
- Out of scope by design: no retry, no write queue, no message for a failed read at launch, and no message on other screens (TASK-12.9 and E13 area).
- If the user changes the wording, edit the string in `src/ui/settings/SettingsScreen.tsx` and the three tests that assert it.

## Lessons for the factory (proposals — not applied)
- The gate ran 3 times (build, fix-2, fix-3), all PASS, and the state shows 0 sendbacks. The build log does not say why fix runs were needed, so we can't propose a change from it. Recording the reason for each fix run would help.
- `state.json` shows `assumptions: 0` although the spec lists six, so the counter seems not to include spec-table assumptions.
