---
id: doc-66
title: 'TASK-2.3: Choose the stake for a cash game'
type: other
created_date: '2026-11-21T17:02:00Z'
updated_date: '2026-11-21T17:02:00Z'
---
# TASK-2.3: Choose the stake for a cash game

Status: Done · Completed: 2026-11-21 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-006, REQ-007 · Branch: doit/TASK-2.3

## What was asked
Game Config showed the stake as a read-only "$4 / $8" row. This story makes it a selector offering exactly the six REQ-006.1 cash stakes ($2/$4, $3/$6, $4/$8, $6/$12, $10/$20, $20/$40), $4/$8 preselected. The read-only Buy-in row follows the stake (20 big bets) and Start game hands the chosen stake to the table. The engine, session, table header and TEMPORARY top-up already derived everything from `SessionConfig.stake`, so the product change is a stake list constant plus the selector. Spec: doit/TASK-2.3/spec.md.

## Decisions made without asking — please review
Both questions were auto-accepted in autopilot, taking the recommended option (doit/TASK-2.3/qa.md).

| ID | Decision / assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| **Q-1** | Stake control is a native `<select id="config-stake">` in the Stakes row, labelled "Stakes (small bet / big bet)". Options read `$2 / $4` … `$20 / $40` (with spaces). Buy-in stays plain read-only text, e.g. `$120 (20 big bets)` at $3/$6. | yes | Matches storyboard Config.dc.html:41-45 and TASK-2.1 Q-4 row text. | Use `$2/$4` wording or a radio group |
| **Q-2** | Amended the **locked TASK-2.1 test** `tests/ui/home.acceptance.test.tsx::game config shows the first-use cash session with five TAG bots`, extraction only: strip tags from `<dt>`, read the selected option's text for a select `<dd>`, and replace "no input/select/textarea" with "exactly one select, still no input or textarea". Expected values are byte-identical. | yes | The AC requires a stake control, which the old test forbade. | Revert the test edit and drop the selector |
| A-1 | Nothing is stored. Every opening of Game Config shows $4/$8, including after Cancel or Home, until TASK-2.10. | yes | TASK-2.1 A-2 and the locked home e2e say the app stores nothing. | Keep last stake in App memory |
| A-2 | Changing the stake updates the Buy-in text with no `aria-live` announcement. | yes | The buy-in is a static summary read in document order. | `aria-live="polite"` or `aria-describedby` |
| A-3 | Option `value` is `"<smallBet>/<bigBet>"` (e.g. `"4/8"`). | yes | Unique, readable, no index arithmetic. | Index into `CASH_STAKES` |
| A-4 | `CASH_STAKES` lives in `src/table/session.ts`. | yes | Next to `Stake`, `stakesFor`, `buyIn`; under the 90% coverage group. | New `src/table/stakes.ts` |
| A-5 | The 10,000-hand playtest keeps fixed $4/$8; all six stakes are exercised by new session/engine tests. | yes | Engine is stake-generic; a CLI flag is out of scope. | Add `--stake` to the playtest CLI |
| A-6 | The selector does not guard against a `config.stake` outside `CASH_STAKES`. | yes | The only producer is `DEFAULT_SESSION_CONFIG`; TASK-2.10's loader must validate stored config. | Fall back to $4/$8 |

Recorded deviation: the select uses `appearance: none` plus an inline SVG chevron (data URI), because WebKit ignored `min-height` (the 44 px target). It is still a native `<select>` (role combobox, keyboard and native picker unchanged). The reviewer judged this acceptable.

## What was built
- `src/table/session.ts`: exports frozen `CASH_STAKES`, the six stakes ascending. `DEFAULT_SESSION_CONFIG.stake` stays `{ smallBet: 4, bigBet: 8 }`.
- `src/ui/config/GameConfigScreen.tsx`: stake held in local state seeded from `config.stake`. The Stakes row is a label plus select. The onChange handler maps the value back to a `CASH_STAKES` entry, and unknown values are ignored. Buy-in is computed from the chosen stake. Start game calls `onStart({ ...config, stake })`.
- `src/ui/styles.css`: select styling (44 px, dark theme, `appearance: none` chevron, inherited font, #6b7380 border at 3.53:1) and vertically centred field rows.
- `tests/ui/home.acceptance.test.tsx`: locked, amended per Q-2.
- New tests: `tests/table/stakes.acceptance.test.ts` (SPEC-01..03), `tests/ui/game-config-stake.acceptance.test.tsx` (SPEC-04..06), `e2e/stake-choice.spec.ts` (SPEC-07..09, Chromium + WebKit).
- No change to App, engine, bots, advice or the table. No new dependencies. No stored data.

Blinds and buy-ins per stake (blinds = floor(smallBet/2) / smallBet; buy-in = 20 × bigBet): $2/$4 → $1/$2, $80; $3/$6 → $1/$3, $120; $4/$8 → $2/$4, $160; $6/$12 → $3/$6, $240; $10/$20 → $5/$10, $400; $20/$40 → $10/$20, $800.

## How it was verified
| SPEC item | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01 | stake list and default | `stakes.acceptance.test.ts` | pass |
| SPEC-02 | blinds and buy-in, all six stakes | `stakes.acceptance.test.ts` | pass |
| SPEC-03 | $10/$20 header, $5/$10 blinds, $400 stacks | `stakes.acceptance.test.ts` | pass |
| SPEC-04..06 | six options, $4 / $8 selected; read-only buy-in; no real-money wording or controls | `game-config-stake.acceptance.test.tsx` | pass |
| SPEC-07..09 | browser list/default/buy-in/reset; start at $10/$20; axe clean, 44 px, no overflow, same-origin | `e2e/stake-choice.spec.ts` (Chromium + WebKit) | pass |
| SPEC-10..12 | earlier suites, lint/typecheck/coverage, playtest | `npm test`, `npm run lint`, `npm run typecheck` | gates pass |
| SPEC-13 | CI green, doc published | branch CI | CI in progress at the time of writing; doc published |
| SPEC-14 | N/A items | Judge | Judge: see doit/TASK-2.3/judge/ |

- Gates (doit/TASK-2.3/gates/): build-1, fix-2, fix-3 all PASS. Final unit run from the build gate: 135 files passed, 1 skipped; 479 tests passed, 7 skipped; coverage 97.1% statements overall. Lint (eslint + prettier), typecheck, scope budget (331 of 340 lines, 7 of 7 files) and the tests-locked check passed.
- The 10,000-hand playtest result is in the gate and judge artifacts, not restated here.
- Judge: see doit/TASK-2.3/judge/.

## Review
Round 1: 0 blocking findings, 2 MINOR, 1 NIT. Security review: no findings. The handler allowlists values against `CASH_STAKES`, so a tampered DOM option cannot reach the session. The data-URI chevron is static. No network, storage or money flows.

### Non-blocking review notes
- MINOR (fixed in-story): the select did not inherit the app font. Added `font-family: inherit`.
- MINOR (fixed in-story): the border #4a515c was about 2.0:1 against the panel. Changed to #6b7380 (3.53:1).
- NIT (left as is): `CASH_STAKES` is derived from `[2,3,4,6,10,20].map(...)` rather than six literals. Values are asserted by SPEC-01. Not tracked.

## How to try it
`npm run build && npm run preview`, open http://localhost:4173 at 1280×720. New game → Stakes lists `$2 / $4` … `$20 / $40` with `$4 / $8` selected and Buy-in `$160 (20 big bets)`. Pick `$3 / $6` → `$120 (20 big bets)`. Cancel → New game → back to `$4 / $8`. Pick `$10 / $20` → Start game → header `Cash · 6 players · $10/$20 · Hand #1`, stacks $400, seat 1 `Small blind $5`, seat 2 `Big blind $10`. Tests: `npm test`, `npm run e2e`.

## Run metrics
Questions 2 (auto-accepted) · assumptions logged 6 (A-1..A-6, in the spec; state.json counter reads 0) · review rounds 1 · judge rounds: see doit/TASK-2.3/judge/ · gate runs 3 · escalations 0 · changed lines 332 (7 files).

## Known limitations and follow-ups
- [trainer] Hide the stake selector for Sit-and-go (REQ-006.4): owned by TASK-2.4 (planned).
- [trainer] Persist and pre-fill the last stake, and validate stored stake against `CASH_STAKES` (A-1, A-6): owned by TASK-2.10 (planned).
- The playtest CLI stays at $4/$8 (A-5). The TEMPORARY top-up already scales to the chosen stake and is removed by TASK-1.16 / TASK-3.11 / TASK-3.21.

## Lessons for the factory (proposals — not applied)
- WebKit ignored `min-height` on a native select, costing a CSS deviation after build. Proposal: add a note to the spec template's UI section that 44 px targets on native selects need cross-browser checking (`appearance: none`).
- state.json `assumptions` counter stayed 0 although the spec logged six. Proposal: have the spec stage update the counter.
