# TASK-10.14: Tighten three postflop leak texts (turn fold vs call, flop call price, flop bet free card)

Status: In review (not set Done) · Completed: 2026-11-27 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-047.5, REQ-061.2 · Branch: doit/TASK-10.14

## What was asked
The TASK-10.5 code review (doc-128) found postflop leak wording that does not match the advice rules. AC#1: fix three entries in `src/stats/leak-categories.json` (turn fold vs call, flop call price, flop bet free card). AC#2 (added by the user in Q-4): the two value-raise justifications said "better than even equity" where the rule needs more than 65%. Data, docs and one new test only; no code change. Spec: doit/TASK-10.14/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Only the seven listed fields change; turn-call fix, flop-call justification, flop-bet justification and the two raise fixes stay as they are | yes | Smallest change that removes the flagged inaccuracies | Also rewrite the turn-call fix to mention one card to come |
| A-2 | New texts contain no apostrophe, quote, `&`, `<`, `>` | yes | Locked test `tests/ui/report-leaks.acceptance.test.tsx` compares rendered HTML with raw `turnCalls.fix`; React would escape `'` | Allow them in non-turn-call texts only |
| A-3 | Fix texts keep the plain register ("chance to win", "price of the call", no "equity"); justifications may name equity and rule ids | yes | Matches neighbouring entries; leak text gets no glossary markers | Add glossary support to leak text (new feature) |
| A-4 | The pinning test is a new file `tests/stats/leak-copy.acceptance.test.ts`, not an edit to a locked test | yes | Locked tests read from `LEAK_CATEGORIES` and need no edit | Put the assertions in `tests/stats/leaks.test.ts` |
| A-5 | Raise justification wording (Q-4). Changed after review r1: the flop text now also names the implied-odds rule (see Review) | yes | States the 65% bar exactly as `VALUE_RAISE_THRESHOLD_PCT = 65` with strict `>` (`src/advice/postflop.ts:38, 231-233`) | "well over half" (vaguer); "at least 65%" (wrong: 65.0% is not a raise) |

Items for you to review (approved wording with a known small gap, see Review): the flop-call fix and the turn-fold fix say to call when your chance is "at least the price" and omit the small implied-odds allowance for draws (a draw may call slightly below the price). Kept as you approved it.

## Clarifications and decisions
- Q-1 turn texts: Option A (user). Q-2 flop-call fix: Option A (user). Q-3 flop-bet fix: Option A (user). Q-4 raise justifications: add to this task (user); wording proposed by the spec writer as A-5.
- D-1 turn-fold fix, turn-fold justification, turn-call justification use Option A (Q-1). D-3 flop-call fix Option A (Q-2). D-4 flop-bet fix Option A (Q-3). D-5 raise justifications in scope (Q-4). D-2 no existing test needs a re-pin.

## What was built
Seven text fields replaced; nothing else changed.
- `src/stats/leak-categories.json` — the seven fields below.
- `docs/stats/leaks.md` — the same seven cells in the Postflop content table (Prettier realigned the table).
- `tests/stats/leak-copy.acceptance.test.ts` — new test: exact texts in data and docs, one-sentence and no-escape-character checks, old phrases absent, 65% threshold pinned, unchanged fields unchanged.

Final texts (verbatim):

1. `turn-facing-a-bet-fold` fix: "Before you fold to a turn bet, compare your chance to win with the price of the call plus the river bet that usually follows, and call whenever your chance is at least that price."
2. `turn-facing-a-bet-fold` justification: "A turn call is priced with the river big bet the hero will likely face, and the call is right when equity is at least that price, or a little less for a draw that wins more bets when it hits (pot-odds-call, implied-odds-call)."
3. `turn-facing-a-bet-call` justification: "A draw has only one card to come on the turn instead of two, so its equity drops while the price now counts the likely river big bet too, and calls that were fine on the flop can lose on the turn (pot-odds-call, pot-odds-fold)."
4. `flop-facing-a-bet-call` fix: "Call a flop bet only when your chance to win, counting your outs, is at least the price of the call, and raise instead when you are well ahead of the hands that would call a raise."
5. `flop-not-facing-a-bet-bet` fix: "Bet the flop only when most of the hands that would call are worse than yours, and check the rest, because a check costs nothing now and you see the turn for free if no one bets after you."
6. `flop-facing-a-bet-raise` justification: "The value-raise rule asks for more than 65% equity against the hands that would call a raise, so a hand below that bar should just call or fold by the pot-odds and implied-odds rules (value-raise, pot-odds-call, implied-odds-call)."
7. `turn-facing-a-bet-raise` justification: "The value-raise rule needs more than 65% equity against the hands that would call a raise, and the cost of being wrong doubles on the turn (value-raise)."

No interface, format or version change.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Revised texts exact; other fields unchanged | New acceptance test; judge field-by-field diff vs base | PASS | Exactly 7 fields changed |
| SPEC-02 | One sentence, no escape characters, fixes 40 words or fewer | Acceptance test; judge holdout | PASS | Fixes are 34-38 words |
| SPEC-03 | Old inaccurate phrases gone | Test scan; built bundle inspected | PASS | Bundle lacks old phrases |
| SPEC-04 | Docs match data | Docs test; judge row-by-row check of 15 rows | PASS | |
| SPEC-05 | Lint, typecheck, suite, no locked test edited | `npm test`, lint, typecheck | PASS | 1572 passed, 0 failed |
| SPEC-06 | Report screen shows new text | e2e `report-leaks.spec.ts` on production build; Session Report rendered with real report data | PASS | All three fixes render verbatim |
| SPEC-07 | Raise justifications accurate (65%) | AC#2 test; checked against `postflop.ts:230-255` | PASS | Threshold pinned to 65 |

- Gates: 4 runs (build, fix 2-4), all PASS; scope-line budget warn at 149 vs 140 (Prettier table realignment). Test integrity clean.
- Judge round 1: PASS, 7/7, no blocking findings. One LOW note (J-1-01) listed below. The judge did not play a live session to 8+ turn folds; the report path was exercised with real report construction.

## Review
No blocking findings in round 1 (code and security). Security: no findings (static strings, escaped React text).
- MINOR 2 (fixed): flop raise justification said "pot-odds rules" only; implied-odds-call can also decide below the 65% bar. The orchestrator issued a fix brief (recorded deviation from A-5); text now names the implied-odds rule, with docs and test constant updated.

### Non-blocking review notes (deliberately not fixed)
- MINOR 1: flop-call fix omits the implied-odds allowance for draws (`postflop.ts:197-199, 249`). User-approved in Q-2. Optional wording if reopened: "..., is at least the price of the call (or a little less for a draw), and raise instead ...".
- J-1-01 (LOW): the turn-fold fix says call whenever your chance is at least the price; it leaves out the draw allowance (the justification covers it) and the raise case. User-approved in Q-1.
- NIT: 149 changed lines vs 140 budget, caused by Prettier realigning the docs table.

## How to try it
- `npm test -- tests/stats/leak-copy.acceptance.test.ts`
- `npm run lint && npm run typecheck && npm test`
- Play a session and Leave table; the Session Report "Biggest leaks" shows the fix sentences once a category has enough graded errors.

## Run metrics
Questions asked: 4 (Q-1..Q-4; state.json counter shows 0) · assumptions logged: 5 (state counter shows 0) · review rounds 1 · judge rounds 1 · gate runs 4 · escalations 0 · changed lines 149 across 3 files (src/docs/tests).

## Known limitations and follow-ups
- Optional copy polish only if you reopen Q-1/Q-2: add the small implied-odds allowance for draws to the flop-call fix and the turn-fold fix (owner: this task, if you choose to change the approved wording). No other follow-ups.
- Not tracked (infra, below the value bar): the 140-line scope budget warning when Prettier realigns a docs table; it caused no failure.

## Lessons for the factory (proposals — not applied)
- The spec's A-5 raise wording missed the implied-odds rule that the review then caught. When a text claims what a rule does, the spec writer should read the full rule chain (`postflop.ts:246-255`), not only the named rule. Cheap fix: add "list every rule that can decide the case" to the spec checklist for copy-accuracy tasks.
- state.json `questions` and `assumptions` counters stayed 0 although 4 questions and 5 assumptions were logged; the counters are not updated by the spec step.
