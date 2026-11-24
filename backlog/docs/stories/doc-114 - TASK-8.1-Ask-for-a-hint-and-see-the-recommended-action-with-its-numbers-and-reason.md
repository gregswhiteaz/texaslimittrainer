---
id: doc-114
title: >-
  TASK-8.1: Ask for a hint and see the recommended action with its numbers and
  reason
type: other
created_date: '2026-11-24T10:51:00Z'
updated_date: '2026-11-24T10:51:00Z'
---
# TASK-8.1: Ask for a hint and see the recommended action with its numbers and reason

Status: Done · Completed: 2026-11-24 · Epic: TASK-8 — Ask for a hint · Milestone: m-1 · Requirements: REQ-022, REQ-035, REQ-042 (also REQ-055.6) · Branch: doit/TASK-8.1

## What was asked
A learner can select Hint on their turn and see a card between the board and the action bar. The card shows the recommended action, the numbers, the plain-English explanation and each opponent's range basis ("typical player" or "based on N hands of this opponent").
- After the flop the numbers are equity % and required equity %, to one decimal.
- Before the flop the card shows the chart basis instead, for example "From the 6-max chart: raise A9o from the cutoff".
- The button reads "Hide hint" while the card is open. Any action hides the card.
- Hints are unlimited and free, and advice runs in the worker so the table stays responsive.
- AC#12 also asks that the value-rule sentence name which equity it compares, not a bare "That".

Spec: doit/TASK-8.1/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The observed snapshot has one entry per bot seat whose current bot has at least 1 finished hand. Entries are in ascending seat order: `{seat, hands, vpip, pfr}`, unrounded. The user's seat is excluded. | yes | Same rule as the playtest snapshot (TASK-7.15) | Include 0-hand entries or round |
| A-2 | Counts are keyed by per-session bot id. A replacement bot in a seat starts at 0 hands. | yes | "This opponent" is the bot, not the chair | Key by seat |
| A-3 | Every finished hand counts toward each dealt-in bot, including hands the user folded early. | yes | Matches `handStyleCounts` and the playtest | Count only hands the user saw to the end |
| A-4 | Reopening the hint in the same decision reuses the computed card with no second worker request. A failed hint is re-requested on the next open. | yes | Advice is deterministic for (view, snapshot) | Re-request each time |
| A-5 | The card opens at once in a loading state, and the button reads "Hide hint" from that moment. | yes | AC#7 names a hint "still being computed" | Open the card on arrival |
| A-6 | A rejected advice request shows an error line and calls `console.error('Hint could not be worked out', error)`. The table keeps working. | yes | Fails loudly without breaking play | Throw into React |
| A-7 | The button has `aria-expanded` and `aria-controls="hint-card"`. The card is `<section id="hint-card" aria-label="Hint" aria-live="polite">`. | yes | Standard disclosure pattern | `aria-pressed` |
| A-8 | AC#1's 1,000 states come from seeded 2/6/10-player sessions with a cheap random-legal bot policy (250 per street), so no equity runs. | yes | Keeps the sweep fast in the normal suite | Use TAG bots |
| A-9 | AC#8's 50 decisions are proven on the state machine and rendering with real advice. The browser test does 3 decisions and 10 toggles. | yes | 50 live postflop worker runs would cost minutes per browser | Run 50 live in the slow group |
| A-10 | The card sits in normal document flow after the table ring and before the action row, so it cannot overlap the row. | yes | Simplest way to meet REQ-042.2 | Absolute overlay |

### Questions and blocks auto-accepted under the unattended-approvals rule (qa.md) — please review
| ID | What was accepted | Effect |
|---|---|---|
| Q-1 | Hint card copy: heading "Hint"; "Recommended: Raise to $8" (the action-button label); "Equity 58.0%" and "Required equity 12.5%"; an "Opponent ranges" list ("Ben: based on 45 hands of this opponent"); loading text "Working out the hint…"; error text "The hint could not be worked out. Select Hint to try again."; preflop "From the {heads-up\|6-max\|full-ring} chart: {action} {A9o} from {position}". | User-visible copy |
| Q-2 | AC#12 wording: "Your equity against the hands that would call is (not) above {threshold}" in the value-bet, check-free and value-raise templates. The pinned strings in tests/advice/explain.test.ts were re-pinned one for one. | Advice text. Explanations stored from now on use it. |
| Q-3 | After Resume, observed stats restart at 0. Nothing is persisted. | Interim behaviour. A follow-up will persist them. |
| Block 1 | The three locked restore tests (TASK-3.10, TASK-2.6, TASK-3.11) require a restored session to deep-equal `nextHand(...)`. So D-2 switched to its alternative: the observed counts live outside `TableState`, in a ref in `useTableSession`, and are passed to `userObservedSnapshot(table, counts)`. No locked test was loosened. | Design change from the approved spec |
| Block 2 | `e2e/table.spec.ts` is locked under TASK-3.1 and its button-name allow-list had no "Hint". The orchestrator added `Hint` to the allow-list. The no-buy-in-control check is unchanged. | Cross-story locked-test edit |

## Clarifications and decisions
- D-1: The Hint button is a sibling of the "Your actions" group, inside a new `div.action-row`. Locked action-bar tests and e2e helpers treat that group as action buttons only.
- D-2 (revised by Block 1): counts are held outside `TableState`.
- D-3: A hint belongs to one decision. The token is the `HandState` object at the user's turn. Any action replaces it, so the card hides and late replies are dropped.
- D-4: `AdviceClient.recommend(view, observed?)` sends `observed` only when given. The worker already handled it.
- D-5: The preflop per-opponent basis is built in the card model, with "typical player" for each live opponent. `PreflopRecommendation` is unchanged.
- D-6: The chart-basis sentence is authored text in `explanations.ts`, filled by `chartBasisText`.
- D-7: Q-1, Q-2 and Q-3 as above.

## What was built
Data flow. The session hook adds each completed hand to per-bot style counts (`countObserved`). `userObservedSnapshot(table, counts)` turns them into the observed-stats snapshot. That snapshot is stored with each user decision (`act`) and sent with the hint request, so hint, hand record and review agree. This also closes the TASK-7.13/3.12 follow-up: stored decisions are now graded with observed ranges after 30 hands.

The hint request goes to the shared advice worker. A small state machine (`toggleHint`, `hintArrived`, `hintFailed`, `shownHint`) tracks open, loading, ready and error. `hintCard` builds the card model from the recommendation.

Source:
- `src/table/hint.ts` (new) — `hintInput`, `requestHint`, the state machine and the card model.
- `src/table/session.ts` — `ObservedCounts`, `countObserved`, `userObservedSnapshot`. `TableState` and `nextHand` are unchanged.
- `src/advice/explanations.ts` — AC#12 template rewrite, plus `CHART_BASIS`, `CHART_NAMES`, `CHART_POSITIONS`.
- `src/advice/explain.ts` — `chartBasisText(rec)`.
- `src/ui/advice/advice-client.ts` — `recommend(view, observed?)`.
- `src/ui/table/HintCard.tsx` (new) — loading, ready and error card.
- `src/ui/table/Table.tsx` — `hint` and `onHint` props, the action row and the Hint / Hide hint toggle.
- `src/ui/table/useTableSession.ts` — counts ref, `act` stores the snapshot, `observedCounts()` for the hint.
- `src/ui/styles.css` — `.action-row`, `.hint-toggle`, `.hint-card`.

Docs: `docs/ui/hint.md` (new) and `docs/advice/explanations.md`.

Tests and harness:
- Unit: tests/table/observed-snapshot.test.ts, tests/table/hint.test.ts, tests/advice/value-copy.acceptance.test.ts, and tests/advice/explain.test.ts (re-pinned, plus `chartBasisText`).
- UI: tests/ui/hint.acceptance.test.tsx, hint-toggle.acceptance.test.tsx, hint-worker.acceptance.test.ts.
- e2e: e2e/hint.spec.ts and e2e/hint-observed.spec.ts, plus the `ten-seat-hint` scene.
- Support: tests/support/table-scenarios.ts and e2e/support/records-harness.tsx (now logs each stored decision's `observed`).

No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | Observed counts, replaced bot, stored decision equals hint snapshot | tests/table/observed-snapshot.test.ts; e2e/hint-observed.spec.ts for live wiring | Pass | judge round 1 |
| SPEC-04, 05 | AC#1, AC#10 Hint present when the bar is enabled, absent or disabled otherwise | 1,000 seeded states in tests/ui/hint.acceptance.test.tsx | Pass | judge round 1 |
| SPEC-06..08 | AC#2, 3, 4, 11: card equals engine output, chart basis, basis per opponent | tests/ui/hint.acceptance.test.tsx | Pass | judge round 1 |
| SPEC-09..11 | AC#6, 7, 8: hide, action hides, unlimited | tests/ui/hint-toggle.acceptance.test.tsx | Pass | judge round 1 |
| SPEC-12, 14 | State machine, card formatting | tests/table/hint.test.ts | Pass | judge round 1 |
| SPEC-13 | AC#9: advice runs in the worker with the snapshot | tests/ui/hint-worker.acceptance.test.ts | Pass | judge round 1 |
| SPEC-15, 16 | AC#12 wording, chart basis text | value-copy.acceptance and explain tests | Pass | judge round 1 |
| SPEC-17..20 | AC#5 no overlap at 1280x720 on 10 seats, live open/hide/act, responsiveness, repeated hints | e2e/hint.spec.ts, Chromium and WebKit | Pass | judge round 1 |
| SPEC-21..23 | Gates, playtest, no network, docs | npm test, playtest, CI | Pass | gates/fix-6.json |

- `npm test`: 245 files passed, 1197 tests passed, 43 skipped (pre-existing opt-in groups). Lines 95.99% overall, table 99.42%, advice 100%. Lint and typecheck are clean.
- Golden suite 282/282. Playtest of 10,000 hands (seed 42): 0 invariant violations.
- Full Playwright run after the review fix: 224 passed, 16 skipped, 0 failed.
- CI run 45376916865 on head c289b60: all jobs green, including E2E Chromium and WebKit.
- Judge round 1: PASS, 23/23 SPEC items, all 12 ACs and 12 DoD items proven. A live-app check in both browsers confirmed the card text, one worker request for hide/reopen, the card removed after folding, and the error state on a forced worker failure.
- Before the build finished it stopped twice on locked tests (Block 1 and Block 2 above). Both were resolved without loosening locked tests, apart from the one allow-list line.

## Review
Two review rounds (code and security).
- Round 1, MAJOR `hook-observed-wiring-untested`: after the Block 1 redesign, the counting in the hook, the snapshot hand-off in `act` and the `onHint` hand-off had no test. Fixed in round 2 with `e2e/hint-observed.spec.ts`. It records each recommend message's `observed` and checks the stored user decisions through the records harness. Mutation checks failed the test for each of the three wiring points (counting removed, `act` third argument dropped, `{}` passed to the hint).
- Security: no findings in either round. Only the user's own PlayerView and public-action counts are sent, and the user's seat is excluded.

### Non-blocking review notes (deliberately not fixed)
- NIT `src/ui/table/Table.tsx` (about line 637), `onhint-null-guard`: `if (decision === null) return;` exists only to narrow the type, since the Hint button is disabled without a hand. Reviewer said fine to leave (reviews/round-2/code.json).

## How to try it
- `npm run dev`, start a game, and on your turn select Hint, then Hide hint. Act with the card open and check it is gone.
- `npx vitest run tests/table tests/ui tests/advice`
- `npm run build && npx playwright test e2e/hint.spec.ts e2e/hint-observed.spec.ts`
- `npm test`

## Run metrics
Questions 3 · assumptions 10 · review rounds 2 · judge rounds 1 · gate runs 6 · escalations 0 · sendbacks 0 · blocks 2. Changed: 1800 lines in 25 files, over the scope budget of 1300 lines and 20 files. The extra came from the Block 1 redesign and the new e2e wiring test, which were not in the original spec. Item failures were 0 for every SPEC item.

## Known limitations and follow-ups
- Observed stats restart at 0 after Resume (Q-3). `[trainer]` Persist per-bot observed counts in the session record and rebuild them on Resume, then add an AC that a resumed session's hint uses them. A follow-up task will be created for this.
- Code NIT: `Table.onHint` null guard (reviews/round-2/code.json). `[trainer]` Optionally replace `if (decision === null) return;` with a type assertion, or keep it. Low value.
- Scope over budget: 1800 lines / 25 files against 1300 / 20. See Lessons.
- Out of scope and owned by other tasks: the `hinted` flag (TASK-8.2), the 1-second hint budget (TASK-8.3), the approximate and short-stack labels (TASK-8.4).
- `AdviceClient.grade` does not receive the snapshot, since no caller needs it yet. `[trainer]` Pass it when a caller for graded hints appears.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The spec checked hook-locked tests only in tests/ui and missed three restore tests in tests/table and one e2e allow-list. Both caused a stopped build (two blocked-N files) and a rework. Proposal: before approval, the spec step greps every locked test for deep-equality on any type or function it changes (`nextHand`, `TableState`) and for closed lists of button names, and lists the hits under "Hook-locked tests the build must edit".
- D-2 put state on `TableState` and was then reversed. Proposal: when a spec adds a field to a shared state type, the Spec Detective should run the locked restore and equality tests against that shape first.
- The Block 1 redesign moved wiring into the React hook, which no unit test reached, and the reviewer caught it as a MAJOR. Proposal: when a spec decision lands logic in a hook, it names the live-browser check that proves the wiring.
- The budget of 1300 lines was exceeded by 38% because of the redesign and the added e2e file. Proposal: the build agent re-estimates scope when a block changes a decision, instead of keeping the old budget.
