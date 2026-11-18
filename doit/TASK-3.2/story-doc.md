# TASK-3.2: Choose only legal actions with their exact amounts

Status: Done (Judge and CI pending at time of writing) · Completed: 2026-11-18 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: REQ-017.1, REQ-017.2, REQ-017.5, REQ-017.6, REQ-022.1, REQ-022.3, REQ-022.4 · Branch: doit/TASK-3.2

## What was asked
Turn the plain verb buttons of TASK-3.1 into the action bar. On the user's turn it offers exactly the engine's legal actions, each with its exact amount ("Check", "Bet $4", "Fold", "Call $4", "Raise to $8"), as native buttons at least 44 x 44 CSS px in the storyboard's dark style. Off-turn and after the hand it stays on screen but disabled, so nothing can be submitted. Labels come from a pure headless function of the user's `PlayerView`, compared with `legalActions` over 10,000 seeded states. No keyboard shortcuts. Spec: doit/TASK-3.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The bar is not rendered before the first hand is dealt; from the deal on it is always rendered (enabled or disabled). | yes | Nobody can act before a deal; keeps TASK-3.1's locked "no button on the seated table" checks valid. | Disabled bar on the seated table too (unlock those two tests) |
| A-2 | Buttons use the storyboard's neutral style: 52 px min height, 120 px min width, 16 px/600 text `#F2F3F5` on `#1A1D22`, `1px solid #4A515C`, radius 10 px; disabled = opacity 0.45, `not-allowed` cursor. | yes | Approved look; exceeds 44 x 44. | Keep TASK-3.1's white buttons or another disabled look |
| A-3 | No button carries the red accent (the storyboard's red "Raise to $8" is not copied). | yes | TASK-3.16 owns the primary accent; colouring one action could nudge learners. | Red Raise now |
| A-4 | The bar stays inside the felt section, after the board and before "Hand over". | yes | Moving it below the oval is TASK-3.16's layout; TASK-3.1 e2e hooks read that section. | Move it now |
| A-5 | The group keeps the accessible name "Your actions". | yes | Existing e2e locators use it. | Rename (touches the locked e2e) |
| A-6 | Amounts are written `$<integer>` with no separator, from `Action.amount`. | yes | Same as stacks today; formatting is E03-S19. | Locale formatting |
| A-7 (orchestrator) | Axe scans at a bot's turn use worker-backed real timers during the scan, then assert the paused state is unchanged. | yes | axe-core uses `setTimeout` and hangs under the paused fake clock; the scan must still run at a bot's turn. | Scan only at turns where the clock is running |

## Clarifications and decisions
- **Q-1 (user): what the disabled bar shows off-turn and after the hand.** Answer: greyed "Fold", "Call", "Raise" with no amounts (recommended option). Recorded as D-3. This supersedes TASK-3.1 D-3 ("buttons disappear when the hand ends"): the bar stays shown and disabled after the hand, and "Hand over" still appears.
- **Not asked (settled or reversible):** no Hint button here (D-2; TASK-8.1 owns REQ-022.2); no red accent on Raise (A-3; TASK-3.16 owns it).
- **D-1** The bar model is a pure function of the user's `PlayerView` (headless `src/table/action-bar.ts`); React only renders it.
- **D-4** TASK-3.1's locked `e2e/table.spec.ts` is edited, only as planned, because its assertions encoded plain verbs (TASK-3.1 A-4) and buttons removed at hand end (D-3), which this story replaces. Approved with Q-1.
- **D-5** Labels: `Fold`, `Check`, `Call $n`, `Bet $n`, `Raise to $n`, with `n` taken unchanged from the engine action; buttons in engine order.

## What was built
- `src/table/action-bar.ts` (new): `ActionButton`, `ActionBarModel`, `IDLE_BUTTONS`, `actionLabel`, `actionBar(view)`, `userActionBar(table)`. No React or DOM imports.
- `src/ui/table/ActionBar.tsx` (new): renders the model as a `role="group"` "Your actions" of native `<button>`s, disabled when the model is; idle buttons carry no action; no key handlers.
- `src/ui/table/Table.tsx`: inline verb buttons and `ACTION_LABELS` replaced by `<ActionBar model={userActionBar(table)} />`, shown from the deal on.
- `src/ui/styles.css`: `.table-actions` rules replaced by `.action-bar` styles (A-2, A-3).
- Tests: `tests/table/action-bar.test.ts`, `tests/table/action-bar.acceptance.test.ts` (10,000 states), `tests/ui/action-bar.acceptance.test.tsx`, `e2e/action-bar.spec.ts` (Chromium and WebKit, with axe).
- `e2e/table.spec.ts` (cross-story, TASK-3.1's test): exactly the three D-4 edits — `VERBS` became a `BUTTON_NAME` regex in `expectNoBuyInControl`; `checkOrCall` clicks `Call $<n>`; both `toHaveCount(0)` checks replaced by `expectDisabledBar` (visible, at least one button, all disabled). The code reviewer verified there are no other changes.
- No engine, bots, advice or session changes; no new dependencies.
- Screenshots for you to look at: `doit/TASK-3.2/bar-turn.png` (user's preflop turn, enabled bar with amounts) and `doit/TASK-3.2/bar-waiting.png` (same hand after "Call $4", Eli to act, greyed bar). Not shipped.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04, 06 | Labels, legal-only buttons, disabled off-turn and after the hand | Vitest on rendered bar from crafted engine states | Pass | `tests/ui/action-bar.acceptance.test.tsx` |
| SPEC-05 | Labels equal `legalActions` over 10,000 seeded states | Vitest property | Pass (~0.3-0.6 s) | `tests/table/action-bar.acceptance.test.ts` |
| SPEC-07, 08 | Label unit, headless imports | Vitest | Pass | `tests/table/action-bar.test.ts` |
| SPEC-09..13 | Mouse click, no key shortcuts, double click, 44 px targets, axe | Playwright, Chromium and WebKit | Pass | `e2e/action-bar.spec.ts` |
| SPEC-14 | TASK-3.1 flows still pass after D-4 | Playwright | Pass | `e2e/table.spec.ts` |
| SPEC-15, 16 | Full suite, 10,000-hand playtest | `npm test`, `npm run playtest -- --hands 10000 --seed 42` | 222 passed, 1 skipped (pre-existing); 0 invariant violations | build-log.md |

- `npm run e2e`: 46 passed; action-bar and table specs with `--repeat-each 3`: 66 passed. Coverage 98.55% lines.
- Gates: build-1 and fix-2 (fix-2 PASS on test, lint, typecheck, spec unchanged, scope budgets, files outside spec, changes listed, test integrity). 693 changed lines, 9 files (budget 700 lines, 9 files).
- Judge: pending. CI: pending.

## Review
Round 1: code and security reviewers found no BLOCKER or MAJOR findings; all 14+ SPEC rubric items passed.
- Code review: 9 of 10 Vitest mutants killed, the survivor is equivalent. Playwright mutants for the key handler, never-disabled buttons, under-44 px buttons and an amount-less Call label were all caught. The axe workaround (A-7) was shown sound: blank idle button names do fail the scan. The D-4 edits to `e2e/table.spec.ts` were verified to be exactly the three planned.
- Security review: enabled buttons submit only the bound engine `legalActions`; idle clicks are blocked by null actions, the `model.enabled` check and `act`'s turn check; no free-amount input.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `e2e/action-bar.spec.ts` duplicates helpers copied from `e2e/table.spec.ts`.
- NIT: unreachable `?? ""` fallback in `checkOrCall`.
- NIT (security): no test that removes `disabled` from an idle button in the DOM, clicks it, and asserts nothing happens (it is guarded in code three ways).

## How to try it
`npm run build && npm run preview`, open `http://localhost:4173`. While bots act the bar shows greyed Fold, Call, Raise. On your turn only legal actions with amounts appear (e.g. "Fold", "Call $4", "Raise to $8"). Click with the mouse; the bar greys out. Press F, C, R, H, K, B, Space: nothing happens. After the hand the bar stays greyed. Tests: `npm test`, `npm run e2e`, `npm run playtest -- --hands 10000 --seed 42`.

## Run metrics
Questions asked: 1 · assumptions logged: 6 in the spec plus A-7 from the orchestrator · review rounds: 1 (0 blocking findings) · judge rounds: pending · gate runs: 2 · escalations: 0 · changed lines: 693 in 9 files.

## Known limitations and follow-ups
- TASK-3.16: decide which action button, if any, carries the red primary accent (storyboard's red Raise could nudge learners).
- TASK-3.16: when the bar moves below the felt, keep the accessible name "Your actions" or update `e2e/table.spec.ts` and `e2e/action-bar.spec.ts` together.
- TASK-3.16: when `e2e/table.spec.ts` is next edited, move the duplicated e2e helpers into `e2e/support/` and use them from both specs.
- TASK-3.7: add "Call all-in $X", "Bet all-in $X", "Raise all-in to $X" and chip labels without "$" to `actionLabel`, and widen the AC#5 property to capped and short-stack states.
- TASK-8.1: add the Hint button to `ActionBar` only when `model.enabled` is true.
- Owner to be chosen by orchestrator (suggest TASK-3.17): add a test that removes `disabled` from an idle button, clicks it, and asserts the table state is unchanged.
- Owner to be chosen by orchestrator (any touching `e2e/table.spec.ts`): remove the unreachable `?? ""` fallback in `checkOrCall`.

## Lessons for the factory (proposals — not applied)
- axe-core hangs under Playwright's paused fake clock (found at build). Add a note to the e2e guidance or a shared helper in `e2e/support/` for scanning with worker-backed timers, so each story does not rediscover it.
- Locked tests that a later story must change (here `e2e/table.spec.ts`) cost a planned D-4 edit. Specs could mark such expected supersessions in the earlier story's doc so the unlock is routine.
