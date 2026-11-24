---
id: doc-110
title: >-
  TASK-3.21: Remove the temporary short-stack top-up once all-ins and rebuy
  exist
type: other
created_date: '2026-11-24T04:55:00Z'
updated_date: '2026-11-24T04:55:00Z'
---
# TASK-3.21: Remove the temporary short-stack top-up once all-ins and rebuy exist

Status: Done (judge round 1 passed 11/11) · Completed: 2026-11-23 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-007.4, REQ-007.2, REQ-007.5, REQ-008.4, REQ-008.5 · Branch: doit/TASK-3.21

## What was asked
`nextHand` used to top any seat below the engine's old $96 minimum back up to a full buy-in ($160 for a cash user, 800 in a sit-and-go). That was a stopgap from TASK-3.4 Q-4, and it bent REQ-007.4 (no chips added above $0). All-ins, side pots, the button skipping busted seats, bot replacement and Rebuy/Leave now exist, so the top-up goes. Acceptance criteria:
- A short seat plays its own chips, for example $95 stays $95, and the `TEMPORARY (TASK-3.4 Q-4)` code is gone with its tests re-pinned (AC#1-3).
- The live app shows the all-in labels, the Pots list and the Pot winners lines for a short user (AC#4-5).
- A sit-and-go seat is never refilled (AC#6).
- `rebuy()` stops at `MAX_SESSION_COUNT` (AC#7).
- Two review follow-ups: reflow the `nextHand` docstring and comment BustDialog's Escape handler.

Spec: doit/TASK-3.21/spec.md.

## Assumptions made without asking — please review
Q-1, Q-2 and the build deviations were auto-accepted under the unattended-approvals rule. They are listed in the next section for your review.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `rebuy()` at the cap throws `RangeError('No rebuy: the rebuy limit is reached')`, after the existing "during a hand" and "has chips" checks. | yes | Matches the other `No rebuy:` refusals; AC#7 allows a RangeError. | Return the table unchanged instead. |
| A-2 | At the cap `rebuyAndDeal` returns the table unchanged: Rebuy does nothing, the dialog stays, and no message is shown. | yes | The cap is 10^9 bust hands, and a throw inside a `setTable` updater would crash the table. | Show a message (new copy). |
| A-3 | `MAX_SESSION_COUNT` is defined in `session.ts` and re-exported from `session-record.ts`. | yes | `session-record.ts` already imports `./session`, so the reverse import would be a cycle. | Pass the cap into `rebuy`. |
| A-4 | The e2e seeds a stored cash session (12 hands played, user on $50, button 3, replay words `[40,1,2,3]`). Hand 13 leaves the user on $18, and the real `nextHand` deals hand 14 with all-in labels and live side pots. The spec's pot values were from a headless prototype; the browser values differ (see deviation 1 below). | yes | A seeded short stack is the only quick, deterministic way to a live all-in, and the test fails if the top-up returns. | Opt-in slow spec. |
| A-5 | `tests/support/session-play.ts` `playSession` rebuys a busted user before dealing. | yes | Without the top-up the locked TASK-2.6 resume test busts and throws. This keeps that locked test passing unchanged. | Re-pin TASK-2.6's test to a shorter session. |
| A-6 | `sitAndGoStopped` reads the same stacks as `userBusted`: final stacks of a finished hand, else `table.stacks`. It is false mid-hand and always false in cash. | yes | Mirrors TASK-3.11 D-3, so the result and the next deal agree. | Check only `table.stacks` after `nextHand`. |

## Clarifications and decisions
Review these auto-accepted items.

- **Q-1 (auto-accepted, recommended A): sit-and-go at its first bust.** Without the top-up a $0 sit-and-go seat cannot be dealt around yet. `createHand` rejects a $0 stack, and `tableView`, `completedHand` and the record validator all assume every seat is dealt in. Those are TASK-5.2's job. So the sit-and-go stops at the first bust.
  - `nextStep` is `'stopped'`, `nextHandDelay` is null, `dealAfterDone` deals nothing, and `dealHand` throws.
  - No new text is shown. The last result stays on screen and Leave table works.
  - The stopped record keeps its $0 seat and is rejected on read, so it is never offered for Resume.
  - Alternatives not taken: keep refilling only a $0 seat (B), or pull TASK-5.2's empty seats in now (C).
- **Q-2 (auto-accepted): two cross-story locked re-pins**, done one-for-one with the same `expect` counts via `doit.py unlock` with reason "TASK-3.21 Q-2".
  - `tests/table/next-hand.acceptance.test.ts` (owner TASK-3.4, 45 expects): user $95 now stays $95, the test that pinned the TEMPORARY marker now pins its absence, and SPEC-11 allows a changed stack only for a replaced bot.
  - `tests/table/rebuy.acceptance.test.ts` (owner TASK-3.11, 82 expects): a sit-and-go user on 0 now gives a null delay, stack 0 and `'stopped'`, and a cash user on $95 stays at 95 and cannot rebuy.
- **Build deviations (fix-brief.md, orchestrator-approved, judged on substance):**
  1. The hand-14 Pot winners read `Main pot $54 · Dee wins $54` / `Side pot $124 · Dee wins $124`, not the spec's $62. The live app decides bot moves through the advice worker's seeded style policy, not plain `tagPolicy`. SPEC-03 now drives bots via `handleAdviceRequest` like the app. The AC needs all still hold (hand 13 ends on $18, hand 14 starts on $18, three all-in label sets in order, a 2-line Pots list).
  2. A 14th file was touched (budget 13): `tests/table/session.acceptance.test.ts`, a type-only widening of the `steps` annotation with `'stopped'` (not hook-locked).
  3. The e2e clicks "Deal next hand" for hand 14, because user decisions in hand 13 hold the review panel's auto-deal. It uses the same `dealAfterDone` → `nextHand` path.
  4. Axe on the Pots list runs once bot moves stop arriving (action count stable across two reads).
  5. `game-type.test.ts` gained one `expect` (the seat-on-0 case SPEC-10 asks for).
- **D-3:** the step is named `'stopped'`, not `'over'`, so it does not collide with TASK-5.7's real ending.
- **D-4:** `rebuy` refuses at `rebuys >= MAX_SESSION_COUNT`, and the UI path is a no-op there.

## What was built
- `src/table/session.ts`
  - Deleted the TEMPORARY branch, the `minimum` local and the `minimumStack` import. Every seat except a cash bot on $0 is carried at its final stack. A cash user on $0 still goes to Rebuy, and a cash bot on $0 is still replaced.
  - Added `sitAndGoStopped(table)`, the `'stopped'` `NextStep`, the `dealHand` guard (throws a RangeError) and the null `nextHandDelay`.
  - `rebuy` is capped. `MAX_SESSION_COUNT` now lives here.
  - Reflowed the `nextHand` docstring.
- `src/table/session-record.ts`: re-exports `MAX_SESSION_COUNT`. The record format and validation are unchanged.
- `src/ui/table/useTableSession.ts`: `dealAfterDone` deals nothing once a sit-and-go has stopped. `rebuyAndDeal` is a no-op at the cap.
- `src/ui/table/BustDialog.tsx`: comment on the Escape `onKeyDown` (Chromium closes a modal on a second Escape without a cancelable cancel event).
- `src/engine/hand.ts`: `minimumStack` docstring only. `docs/storage/sessions.md`: top-up wording dropped, and a note that a stopped sit-and-go's record is not resumable until TASK-5.2.
- Tests:
  - New `tests/table/short-stack.acceptance.test.ts` (SPEC-01..06) and `e2e/short-stack.spec.ts` (SPEC-07, every push, Chromium and WebKit).
  - Re-pinned or rewritten `next-hand.acceptance`, `rebuy.acceptance`, `next-hand.test`, `game-type.test` and `session.acceptance`.
  - `tests/support/session-play.ts` helper change (A-5).
- Net change: 15 files, about 2,900 lines added including tests and the doit folder. The gate counted 533 changed lines in the 14 touched source, doc and test files. No new dependencies. The playtest runner never calls `nextHand`, so playtest output is unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1, #2: short cash user keeps chips | Headless acceptance, and the test fails on the base commit | PASS | Judge holdout: stacks 1, 2, 4, 5, 95, 96 and 159 carried exactly from every button position. A 300-hand session changed chips only by rebuy or bot replacement. |
| SPEC-02 | AC#1, #3: top-up code gone | Source check | PASS | TEMPORARY branch, `minimum` and the import are removed in the diff. |
| SPEC-03 | AC#4, #5 headless | Seeded hand 13/14 via the advice worker | PASS | $18 carried, three all-in label sets, 2+ pot lines, Main pot $54 / Side pot $124. |
| SPEC-04 | AC#6: sit-and-go never refilled | Headless acceptance | PASS | Holdout: stacks equal final stacks every hand, chips conserved, two simultaneous busts carried at 0, stacks of 1 dealt. |
| SPEC-05 | Interim stop | Headless acceptance | PASS | `sitAndGoStopped` true, delay null, `dealHand` throws, stopped record rejected. Live app: nothing dealt over 10 s, no dialog, no errors, no Resume after reload. |
| SPEC-06 | AC#7: rebuy cap | Headless acceptance | PASS | Throws at the cap. Live: Rebuy at cap is a no-op, and at cap-1 it still deals. |
| SPEC-07 | AC#4, #5 live | `e2e/short-stack.spec.ts`, Chromium and WebKit | PASS | Hand #14, $18, all-in labels, Pots list (axe clean), Pot winners lines. |
| SPEC-08 | AC#3: TASK-3.4 re-pin | `next-hand.acceptance` 4/4 | PASS | Fails on the base commit. |
| SPEC-09 | TASK-3.11 re-pin | `rebuy.acceptance` | PASS | |
| SPEC-10 | Unit tests name the new rule | Unit tests | PASS | `game-type.test.ts` now says "never refills a short or busted seat". |
| SPEC-11 | Docstring, comment, hand.ts doc | lint and typecheck | PASS | |

- `npm test`: 230 files passed and 3 skipped; 1013 tests passed and 41 skipped (opt-in slow). Lint and typecheck are clean. CI on 6349fd0 and b865507 (including Visual) succeeded.
- Judge e2e: the named specs pass 24/24 in both browsers. The judge also ran its own flows against `npm run preview`.
- `npm run playtest -- --hands 10000 --seed 42` is byte-identical to base with 0 invariant violations.
- Judge integrity: test-integrity TASK-3.21 and TASK-3.11 are clean. Of 16 new or re-pinned checks, 10 were run against the base commit and all 10 fail there.
- Rounds: 1 build, 1 gate fix run, 1 review round, 1 judge round (PASS, no findings). No sendbacks.

## Review
No blocking findings. The security review found no reachable vulnerability: records are still validated on read, the `'stopped'` step cannot reach `createHand` with a $0 stack, and the rebuy cap closes the TASK-3.11 MINOR (rebuy-count-unbounded-increment).

### Non-blocking review notes (deliberately not fixed)
- MINOR `e2e/short-stack.spec.ts:unbounded-settled-loop` (line 41): `settled()` polls with `for(;;)` and `waitForTimeout(250)`, with no bound. If bot moves never stabilise, the test ends only at the Playwright timeout with an unhelpful message. Fix: bound it (about 40 iterations) and throw "bot moves did not settle".
- NIT `docs/storage/sessions.md:reflow-overlong-lines` (lines 53-54): a 189-column and a 119-column line, where the rest wraps at about 110. Fix: rewrap lines 51-55.

## How to try it
- `npx vitest run tests/table/short-stack.acceptance.test.ts`
- `npm run build && npx playwright test e2e/short-stack.spec.ts e2e/rebuy.spec.ts e2e/next-hand.spec.ts`
- By hand: start a sit-and-go from Game Config and play until a seat reaches $0. Nothing more is dealt, and Leave table works.

## Run metrics
Questions 2 (both auto-accepted) · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 533 in the gate's changed-file count.

## Known limitations and follow-ups
- Interim sit-and-go stop. There are no empty seats until TASK-5.2, and no finish until TASK-5.7.
  - A stopped sit-and-go's record is rejected on read, so each Home load logs "Session record could not be read" and the session is not resumable.
  - "Deal next hand" stays visible but does nothing while the review is held.
  - `[trainer]` TASK-5.2 should replace `'stopped'`: deal around $0 seats and accept $0 sit-and-go records. TASK-5.7 should add the real finish. Both should remove `sitAndGoStopped`, the stopped-record rejection and the console log. Also hide or disable "Deal next hand" when stopped.
- Judge note: `test-integrity TASK-3.4` prints 6 WARNs about files from later tasks (`session.test.ts`, `card-art.test.ts`, skip markers in 4 later e2e files). This is older drift, not from this branch.
- `[infra]` MINOR `e2e/short-stack.spec.ts:unbounded-settled-loop` (above). It would only hang on a bot-move regression and still fails at the Playwright timeout, so it has not caused a real failure. It is in "Not tracked (infra, below the value bar)".
- `[trainer]` NIT `docs/storage/sessions.md` rewrap lines 51-55 (above). It is cosmetic. Attach it to whichever task next edits that file, for example TASK-5.2.

### Not tracked (infra, below the value bar)
- The unbounded `settled()` loop in `e2e/short-stack.spec.ts`.
- The TASK-3.4 `test-integrity` WARNs (older drift, no failure).

## Lessons for the factory (proposals — not applied)
- The spec's A-4 pot values came from a headless prototype that used `stepBot` (plain `tagPolicy`). The live app uses the advice worker's seeded style policy, so the values were wrong ($62 vs $54), and the fix needed a recorded deviation. Proposal: when a spec pins values for an e2e on the real session, the prototype must drive bots the way the app does (`handleAdviceRequest`).
- The file budget was missed by one, because a type annotation enumerating `NextStep` needed widening. Proposal: when a spec widens a union type, grep for exhaustive annotations and count them in the budget.
