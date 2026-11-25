---
id: doc-142
title: 'TASK-12.2: Hide opponent style labels at the table'
type: other
created_date: '2026-11-25T16:54:00Z'
updated_date: '2026-11-25T16:54:00Z'
---
# TASK-12.2: Hide opponent style labels at the table

Status: Done · Completed: 2026-11-25 · Epic: TASK-12 — Tune the trainer · Milestone: m-1 · Requirements: REQ-050.3, REQ-021.2 · Branch: doit/TASK-12.2

## What was asked
Settings gets a "Show opponent styles at the table" toggle, on by default. Off hides each bot's style label (and its " · " separator) at the table, while name and stack stay. The choice is saved at once and survives relaunch (AC#1-5). Spec: doit/TASK-12.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | App reads settings once at launch. Until the read settles the Table uses defaults (labels shown) and the checkbox is disabled. | yes | The read takes milliseconds. Disabling avoids writing a record built from defaults over stored values. | Hide labels until loaded, or block the Table until loaded. |
| A-2 | If the read rejects, App logs `Settings could not be read` and uses defaults. The checkbox is enabled and the next change overwrites the bad record. | yes | Same log-and-continue as Home's paused-session read. | Keep it disabled or show an error. |
| A-3 | If a write rejects, log `Settings could not be saved` and keep the new value in memory. No revert, no message. | yes | Matches table writes. User-facing error UX belongs to TASK-12.9 / E13. | Revert the checkbox or show an alert. |
| A-4 | `writeSettings(settings): Promise<void>` replaces the whole record with a validated copy, strict durability. | yes | One small record, and App always holds the full value. | `updateSettings(patch)`. |
| A-5 | One App handler `changeSettings(next)`. The screen builds `next` by spreading the current settings. | yes | Reused by TASK-12.5 to 12.8 and TASK-2.11. | A handler per field. |
| A-6 | No write queue for rapid toggling. Transactions are created in call order, so the last change wins. | yes | `database()` memoises one open promise. | An explicit queue. |
| A-7 | Hidden seat markup is `<span class="seat-line"><span data-part="stack">$N</span></span>`. | yes | Keeps the wrapper so CSS and layout are unchanged. | Drop the wrapper. |
| A-8 | The e2e finds the toggle by role `checkbox` and reads the record with the existing `readStore('settings')` helper. | yes | Reuses the v4 helper. | A new helper. |

## Clarifications and decisions
- Q-1: native checkbox in the Display section (recommended option taken).
- Q-2: the locked TASK-12.1 test `e2e/settings.spec.ts` asserts every control is at least 44x44. The orchestrator took the alternative: the checkbox input itself renders 44x44 (D-4, CSS). The recommended "measure on the label" would have loosened a locked assertion.
- Q-3: whole-record write on every change. A failed save is only logged (D-2, A-3).
- Block 1 (SPEC-09): the locked Tab-order assertion walked from the heading, and the checkbox follows the heading in DOM order. The result was rotated to [checkbox, Home] against an expected [Home, checkbox]. The orchestrator unlocked the test and rotated the comparison to start from the heading. Other assertions are unchanged.
- D-1 to D-4 are in spec.md section 4.

## What was built
Data flow: App reads settings at launch into state. It passes `settings` and `onSettingsChange` to Settings, and `showOpponentStyles` to the Table. A change updates state first, then calls `writeSettings`. This is the first settings write API, and TASK-12.5 and TASK-2.11 reuse it.
- `src/table/settings.ts` — `SettingsWriter` interface.
- `src/storage/hand-store.ts` — `writeSettings` (validated whole-record put, strict durability).
- `src/ui/App.tsx` — settings state, launch read, `changeSettings`.
- `src/ui/settings/SettingsScreen.tsx` — Display checkbox, disabled until loaded. `withOpponentStyles(settings, checked)` returns undefined while loading (added in review r1).
- `src/ui/table/TableScreen.tsx`, `src/ui/table/Table.tsx` — `showOpponentStyles` (default true). The bot seat omits the style span and separator when off.
- `src/ui/styles.css` — `.settings-toggle`, 44x44 input.
- `docs/storage/settings.md`, `docs/ui/navigation.md` — updated.
- Tests: `tests/storage/settings-write.test.ts`, `tests/ui/opponent-styles.acceptance.test.tsx`, `e2e/opponent-styles.spec.ts`. `e2e/settings.spec.ts` was edited (D-4 and Block 1).
No engine, bot or advice changes. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 03, 04 | AC#1, 2, 3, 5 | UI acceptance tests (toggle state, labels hidden or shown, disabled until loaded) | pass | opponent-styles.acceptance.test.tsx |
| SPEC-02, 05, 06, 08 | AC#1-5 | Playwright: fresh install, off and reload, paused-then-resume, invalid record repaired | pass | e2e/opponent-styles.spec.ts |
| SPEC-07 | AC#4 | Unit: write replaces the record and rejects invalid ones | pass | settings-write.test.ts |
| SPEC-09 | DoD#7 | Locked settings Tab, native, 44x44 test | pass | e2e/settings.spec.ts |
| SPEC-10 to 12 | DoD | lint, typecheck, test, e2e; docs; engine, bots and advice diff empty | pass | gates, judge |
- Judge round 1 PASS 12/12, no findings. `npm test` 1402 passed, 0 failed, coverage thresholds met. Full e2e (Chromium and WebKit) 340 passed, 18 skipped, 0 failed. CI run 45656465611 succeeded.
- Judge end-to-end check on a built preview, both browsers: 16/16 holdout checks pass, axe clean.

## Review
- Round 1 MAJOR: the "disabled until loaded" guard was untested (removing it still passed). Fixed in r2 with a pure `withOpponentStyles` helper, an App-shaped loading render test (settings undefined, handler set) and a unit test. The reviewer re-ran both mutations and each now fails the tests. The acceptance test was unlocked for this and re-locked.
- Security: no findings in either round.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code, r2): no test observes `onChange` calling `withOpponentStyles`, because `renderToString` cannot fire events. The helper and the disabled state are tested. Playwright covers real clicks.
- NIT: `.settings-toggle` `margin-top` is not in the spec.
- Scope: 619 changed lines against the 600-line scope guide.

## How to try it
`npm run build && npm run preview`, then open Settings, untick "Show opponent styles at the table", start a game and look at the bot seats. Checks: `npm test`, `npm run e2e`.

## Run metrics
Questions 3 · assumptions 8 · review rounds 2 · judge rounds 1 · gate runs 3 · escalations 0 · blocks 1 · about 638 insertions and 42 deletions across 15 files, including tests and docs.

## Known limitations and follow-ups
- [trainer] Add a component-level test that the checkbox `onChange` calls `withOpponentStyles` with the click value (needs an event-capable renderer). Owner: TASK-12.5, the next story touching the Settings screen.
- No user-visible message if a settings save fails (logged only). Owned by TASK-12.9.

## Lessons for the factory (proposals — not applied)
- When a spec adds a control to a screen with a locked test, the spec writer should simulate the locked test's Tab walk and size checks against the real DOM order. That would have found Block 1 and avoided the unlock round trip.
- Spec test plans should require a mutation check on each guard condition (such as the disabled-until-loaded guard). That would have caught the review r1 MAJOR at build time.
