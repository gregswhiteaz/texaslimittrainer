# TASK-3.11: Rebuy or leave when my stack runs out

Status: Done · Completed: 2026-11-23 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-007 (007.1-007.4) · Branch: doit/TASK-3.11

## What was asked
In a cash game, when a hand ends with the user's stack at $0, the Table must show a modal dialog offering Rebuy or Leave table, and deal nothing more until the user picks. Rebuy sets the stack to the buy-in ($160 at $4/$8), deals the next hand and adds 1 to the session's rebuy count. The stored session record must show that count after the next completed hand. Leave table closes the dialog and deals nothing. While the user has $1 or more, no rebuy or add-chips control exists. Spec: doit/TASK-3.11/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A rebuy is stored only with the next completed hand's write. Clicking Rebuy writes nothing. If the user goes Home after Rebuy but before that hand completes, the record still says $0 with the old count. Resume shows the dialog again and a second Rebuy counts once. | yes | Keeps TASK-3.10's single-transaction rule (hand and session together). A rebuy is never counted without a hand played on it. | Write the session record at Rebuy (second write path and failure handling). |
| A-2 | Rebuy deals the next hand at once, through the Deal next hand path, with a new replay code and no 1.5 s pause. If the bust hand's write failed, Rebuy does nothing. | yes | The 1.5 s pause is for automatic deals, and this deal is a user choice. | Rebuy, then the 1.5 s auto-deal timer. |
| A-3 | When the Hand Review panel is held on a bust, the dialog is not shown. Deal next hand clears the review and does not deal, so the dialog then appears. The label stays "Deal next hand" until TASK-9.2. | yes | A modal over the review would block reading it (REQ-007.6). | Show the dialog over the review. |
| A-4 | The dialog is a native `<dialog>` opened with `showModal()`. Rebuy gets initial focus. The page behind is inert. Escape is ignored. The only ways out are Rebuy, Leave table and browser Back. Buttons are native, at least 44 px high. | yes | First dialog in the app. A native modal gives focus handling and inertness for free. | `<div role="dialog">` with hand-written focus handling. |
| A-5 | `parseSessionRecord` caps `rebuys` at `MAX_SESSION_COUNT`, like the other counters. | yes | Keeps `rebuys + 1` a safe integer. | No cap, or `rebuys <= handsPlayed`. |
| A-6 | The e2e spec seeds a stored cash session where the user has $4 in the big blind and pins the replay words so the user busts. | yes | With the temporary top-up in place, live play can bust the user only from exactly $96. | An opt-in slow spec that plays until a bust. |

## Clarifications and decisions
Both questions were auto-accepted (autopilot, user's unattended rule). Please review them.
- **Q-1 (persisted format, auto-accepted):** a cash session record may store the user's seat at stack $0, meaning "busted, waiting at Rebuy / Leave table". It is the only exception (user seat, cash only, value 0). Resume reopens the dialog without dealing. This is a change to the persisted format (D-1).
- **Q-2 (user-visible copy, auto-accepted):** heading `Out of chips`. Body `Your stack is $0. Rebuy for $160 to keep playing, or leave the table.` (the amount comes from `buyIn(config.stake)`). Buttons `Rebuy` and `Leave table`.
- **Edit to prior-story tests (auto-accepted):**
  - `tests/table/session.acceptance.test.ts` had its `steps` type annotation widened to include `'rebuy'`. No assertion changed. The file was not hook-locked.
  - `tests/table/next-hand.test.ts:100-107` was re-pinned. The user on $0 now stays at $0, and $95 still tops up to $160. The number of checks is the same.
- Spec Detective accepted A-1..A-6 as written.

## What was built
- `src/table/session.ts`: `TableState.rebuys`. `userBusted(table)` and `rebuy(table)`. A `'rebuy'` NextStep. `dealHand` refuses that step. `nextHandDelay` is null on a bust. `nextHand` carries a cash user's $0 instead of topping it up. The temporary top-up for $1-$95 and for sit-and-go is unchanged (TASK-3.21 removes it).
- `src/table/session-record.ts`: `rebuys` is written and restored, capped at `MAX_SESSION_COUNT`. A cash user seat on 0 skips the chip check. The button check now reads `config.seats`.
- `src/ui/table/useTableSession.ts`: a `rebuy()` action. Pure updaters `dealAfterDone` (a no-op on a bust) and `rebuyAndDeal`.
- `src/ui/table/BustDialog.tsx` (new) and `Table.tsx`: the modal, shown on a bust with no held review. `src/ui/styles.css`: dialog styles.
- Docs: `docs/storage/sessions.md` (the `rebuys` field, the stored bust state) and `docs/ui/navigation.md` (Leave table in the dialog pauses to Home).
- No change to the engine, bots or advice. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 07, 08 | AC#1 | `tests/table/rebuy.acceptance.test.ts`, `rebuy.test.ts` | Pass | Bust stops dealing, no delay, dealHand throws, Deal next hand deals nothing |
| SPEC-02 | AC#2 | acceptance | Pass | Stack $160, rebuys 0 to 1, other seats unchanged |
| SPEC-03, 09 | AC#3 | acceptance (fake-indexeddb), unit | Pass | Stored rebuys 2 after two rebuys, capped on read |
| SPEC-04 | AC#1, AC#4 | acceptance | Pass | The $0 record round-trips and Resume gives step 'rebuy' |
| SPEC-05, 10 | AC#5 | acceptance, render test | Pass | No rebuy with chips, none mid-hand, no control in markup |
| SPEC-06 | AC#1 | `tests/ui/bust-dialog.acceptance.test.tsx` | Pass | Dialog markup |
| SPEC-11..14 | AC#1-5 | `e2e/rebuy.spec.ts` (Chromium, WebKit, axe) | Pass | Nothing dealt after 1.5 s, Rebuy to $160, Leave table then Resume reopens the dialog |
| SPEC-15, 16, 17 | DoD | lint, typecheck, test, build, e2e, docs | Pass | See below |

- Gate: build run passed and fix run passed (894 changed lines). Suite: 229 files and 1007 tests passed (3 files and 41 tests skipped as opt-in slow suites). `npm run e2e` gave 212 passed. Coverage thresholds were met (session.ts 99.5% lines).
- Judge round 1: PASS 17/17. Holdout flows passed 12/12 in Chromium and WebKit. One expected-fail control documents a pre-existing Back-after-reload quirk (J-1-01). The integrity check passed.
- Locked acceptance tests: `e2e/rebuy.spec.ts`, `tests/table/rebuy.acceptance.test.ts`, `tests/ui/bust-dialog.acceptance.test.tsx`.

## Review
No BLOCKER or MAJOR findings in round 1 (code and security).

### Non-blocking review notes (deliberately not fixed)
- Security MINOR `rebuy-count-unbounded-increment`: `rebuy()` has no upper bound while the parser caps `rebuys`. A hand-edited record at the cap would become unresumable after one more rebuy. It fails closed and gives no gain. Optional fix: saturate or throw in `rebuy()`.
- Code MINOR `nextHand-doc-awkward-reflow`: the `nextHand` docstring (`src/table/session.ts:508`) reads as cut off. Reflow it.
- Code NIT `escape-keydown-unexplained`: the `onKeyDown` Escape block in `BustDialog.tsx:23` has no comment saying it covers Chromium's second-Escape close. Add a one-line comment.

## How to try it
- `npm run lint && npm run typecheck && npm test`
- `npm run build && npx playwright test e2e/rebuy.spec.ts`
- In real play the bust can only happen from exactly $96 (see limitations), so use the seeded e2e spec.

## Run metrics
Questions 2 (auto-accepted) · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · sendbacks 0 · escalations 0 · changed lines 894 (15 files in the gate).

## Known limitations and follow-ups
- Until TASK-3.21 removes the temporary top-up, the bust is reachable in real play only from exactly $96. The ACs were proven with seeded short stacks.
- [trainer] Cap `rebuy()` at `MAX_SESSION_COUNT` (saturate or throw) so a stored count never exceeds the parser's range; add a unit test. (security MINOR; owner: none, suggest an AC on TASK-3.21 or a new small task.)
- [trainer] Reflow the `nextHand` docstring in `src/table/session.ts` (~line 508) so it reads cleanly (code MINOR).
- [trainer] Add a comment above `onKeyDown` in `src/ui/table/BustDialog.tsx` explaining it covers repeated Escape in Chromium (code NIT).
- [trainer] J-1-01 (judge LOW): Back after reload, followed by Resume, stays on the Table. This comes from TASK-2.14's history handling. Fix the behaviour and pin it with an e2e test (owner: TASK-2.14's area, no open task known).
- [trainer] TASK-9.2 relabels Deal next hand to Continue on a bust with the review held (A-3). TASK-10.1 shows the rebuy count in the result and makes Leave table end the session.
- Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The spec's scope and affected-tests list missed `tests/table/session.acceptance.test.ts`, which broke on the widened `NextStep` type. The Spec Detective could list prior tests whose type annotations a widened union breaks, so a build deviation is not needed.
- No other run problems were recorded (0 sendbacks, 1 review round, 1 judge round).
