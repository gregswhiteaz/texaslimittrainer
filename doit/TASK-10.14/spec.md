# Spec: TASK-10.14 — Tighten three postflop leak texts (turn fold vs call, flop call price, flop bet free card)

Status: READY (approved 2026-11-28)
Task: TASK-10.14 · Parent/epic: TASK-10 · Requirements: REQ-047.5, REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
Fix the wording of postflop leak entries in `src/stats/leak-categories.json` that the TASK-10.5 code review
(doc-128) found inaccurate against the advice rules: (1) the turn-fold fix and the turn-call justification
pull in opposite directions and miss the real reason turn calls differ (one card to come and a price that
counts the likely river bet); (2) the flop-call fix says the chance must "beat" the price, but the rule calls
when it is at least the price; (3) the flop-bet fix promises a free turn after a check, which only holds when
no one bets after you; and (Q-4, AC#2) the two value-raise justifications say "better than even equity" where
the rule needs more than 65%. Data, docs and one new test; no code change.

## 2. Scope
- In scope:
  - Rewrite these fields in `src/stats/leak-categories.json` to the approved wording (Q-1, Q-2, Q-3, Q-4/A-5):
    `turn-facing-a-bet-fold.fix`, `turn-facing-a-bet-fold.justification`,
    `turn-facing-a-bet-call.justification`, `flop-facing-a-bet-call.fix`, `flop-not-facing-a-bet-bet.fix`,
    `flop-facing-a-bet-raise.justification`, `turn-facing-a-bet-raise.justification`.
  - Update the same cells in the Postflop content table of `docs/stats/leaks.md` (re-run Prettier, which may
    realign the whole table).
  - One new acceptance test pinning the approved texts in the data file and the docs.
- Not doing:
  - No change to any other leak entry, title, evidence name, id, order, or to `src/stats/leaks.ts`, the report
    UI, or any advice rule in `src/advice`.
  - `turn-facing-a-bet-call.fix`, `flop-facing-a-bet-call.justification`,
    `flop-not-facing-a-bet-bet.justification` and the two raise fixes stay unchanged (A-1).
  - Not changing the golden-spot text in `tests/golden/postflop-spots.json:373` ("see the turn for free").
  - No `{def:...}` glossary markup (leak text is rendered as plain React text, A-3).
- Scope budget: files=3, lines=140

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Only the seven fields listed in Scope change; the turn-call fix ("The turn bet is twice the size of a flop bet, …") and the two raise fixes are kept because they are accurate enough and were not flagged | yes | Smallest change that removes the flagged inaccuracies | Also rewrite the turn-call fix to mention one card to come |
| A-2 | New texts contain no apostrophe, quote, `&`, `<` or `>` | yes | `tests/ui/report-leaks.acceptance.test.tsx:113-118` (locked, TASK-10.5) compares `renderToString` output with the raw `turnCalls.fix`; React escapes `'` as `&#x27;`, so such characters would break that locked test (applied to all new texts for safety) | Allow them in non-turn-call texts only |
| A-3 | Fix texts keep the existing plain-language register ("chance to win", "price of the call", no "equity"); justifications may name equity and rule ids in parentheses like their neighbours | yes | Matches `src/stats/leak-categories.json:12-83`; the `{def:...}` markers exist only in advice explanations (`src/advice/explanations.ts:126-139`) and the leak fix is rendered unprocessed (`src/ui/report/ReportScreen.tsx:62`) | Add glossary support to leak text (new feature, out of scope) |
| A-4 | The new pinning test is a separate file `tests/stats/leak-copy.acceptance.test.ts` rather than an edit to a locked test | yes | Locked tests read text from `LEAK_CATEGORIES` and need no edit; a new file avoids touching locked files | Add the assertions to `tests/stats/leaks.test.ts` (unlocked) |
| A-5 | Raise justification wording (Q-4, AC#2): flop — "The value-raise rule asks for more than 65% equity against the hands that would call a raise, so a hand below that bar should just call or fold by the pot-odds rules (value-raise, pot-odds-call)."; turn — "The value-raise rule needs more than 65% equity against the hands that would call a raise, and the cost of being wrong doubles on the turn (value-raise)." | yes | States the bar exactly as `VALUE_RAISE_THRESHOLD_PCT = 65` with a strict `>` against the calling-a-raise range (`src/advice/postflop.ts:38, 231-233`); below it the pot-odds and implied-odds rules decide (`postflop.ts:246-255`); keeps each original sentence's second half where it was accurate | "well over half" (vaguer); "at least 65%" (wrong: 65.0% is not a raise, `docs/advice/postflop-rules.md` value-raise example) |

## 3. Current system
- Leak data: `src/stats/leak-categories.json` (format `tlh-leak-categories`, version 1, 15 postflop + 16
  preflop entries). Fields in scope: flop-call fix at line 22, flop-raise justification at line 33, flop-bet
  fix at line 52, turn-fold fix/justification at lines 62-63, turn-call justification at line 73, turn-raise
  justification at line 83.
- Validation: `src/stats/leaks.ts:96-109` — `fix` must match `/^[A-Z][^.!?]*\.$/` (one sentence: upper-case
  start, single final `.`, no other `.`, `!`, `?`); `justification` trimmed, `/^[A-Z].*\.$/`. A bad file
  throws `RangeError('Invalid leak categories: categories[i].fix')` at load. No length limit is enforced.
- Rendering: the fix is shown as plain text in `src/ui/report/ReportScreen.tsx:62`; the justification is not
  shown in the app (only in `docs/stats/leaks.md`).
- Docs: `docs/stats/leaks.md:117-133` Postflop content table repeats every fix and justification verbatim
  (rows 120, 121, 123, 124, 125, 126). Prettier (`npm run lint` runs `prettier --check .`, `package.json:20`)
  keeps the table aligned.
- Advice rules the texts describe (`src/advice/postflop.ts`, documented in `docs/advice/postflop-rules.md`):
  - Turn price counts the river bet: `riverBet` = one big bet on the turn when an opponent can still bet
    (`postflop.ts:191-193`); `requiredEquityPct = (call + R) ÷ (pot + call + 2R)` (`postflop.ts:194-195`);
    on the flop and river R is 0 (`docs/advice/postflop-rules.md:26-30`, why at `:133-134`).
  - Equity is the share of the pot if played out to the river (`docs/advice/postflop-rules.md:21-22`), so a
    flop draw has two cards to come and a turn draw one.
  - `pot-odds-call`: call when rounded equity **is at least** rounded required equity — `equityPct >=
    requiredEquityPct` (`postflop.ts:246`); "an exact tie is treated as a call" (`postflop-rules.md:132`).
  - `implied-odds-call`: a draw calls when equity is at least `call ÷ (pot + call + bigBet × payers)`
    (`postflop.ts:197-199, 249`), i.e. a little below the pot-odds price.
  - `value-raise`: raise when equity against the range that would call a raise is above 65%
    (`postflop.ts:38, 231-233`); `value-bet` above 50% when nothing is owed (`postflop.ts:36, 237`).
  - `check-free`: when nothing is owed and the bet is not a value bet, check (`postflop.ts:240-242`).
    Checking costs nothing now; the turn is free only if no opponent bets after the check
    (`postflop-rules.md:99-100`: "win when everyone else checks behind").
- Tests that read these texts (all read them from `LEAK_CATEGORIES`, none pins a literal string — confirmed
  by grep of `tests/` and `e2e/` for the current phrases):
  - Locked (TASK-10.5 `doit/TASK-10.5/state.json`): `tests/stats/leaks.acceptance.test.ts` (shape regex at
    `:138`, `turnCalls.fix` equality at `:155-161`), `tests/ui/report-leaks.acceptance.test.tsx` (rendered
    HTML contains raw `turnCalls.fix`, `:99-118`), `e2e/report-leaks.spec.ts` (no fix text).
  - Locked (TASK-10.6): `tests/stats/preflop-leaks.acceptance.test.ts`, `tests/ui/report-preflop-leaks.acceptance.test.tsx`
    (preflop only). Locked (TASK-10.8): `tests/ui/report-leak-ranking.acceptance.test.tsx` (ids only).
  - Unlocked: `tests/stats/leaks.test.ts`, `tests/stats/preflop-leaks.test.ts` (mutate cloned data; unaffected).
  - Result: no re-pin of any existing test is needed (D-2).
- Tests run with Vitest (`npm test` = `vitest run --coverage`, `package.json:13`).
- Existing code to reuse:
  - `src/stats/leaks.ts` → `LEAK_CATEGORIES` and `parseLeakCategories` for reading entries in the new test.
  - `tests/stats/leaks.acceptance.test.ts:14` → the `import data from '../../src/stats/leak-categories.json'
    with { type: 'json' }` pattern.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Turn-fold fix, turn-fold justification and turn-call justification use Option A (§5 items 1, 1b) | Option B (§5) | Accurate to the turn price with the river bet and one card to come | yes | user (Q-1) |
| D-2 | No existing test needs a re-pin; the texts are pinned by one new acceptance test | Edit locked TASK-10.5 tests to pin literals | Locked tests compare with `LEAK_CATEGORIES`, so they stay green with any text that passes the shape check and A-2 | no | n/a |
| D-3 | Flop-call fix uses Option A ("is at least" + "well ahead of the hands that would call a raise") | Option B ("matches or beats") | Matches `pot-odds-call` and `value-raise` | yes | user (Q-2) |
| D-4 | Flop-bet fix uses Option A ("a check costs nothing now and you see the turn for free if no one bets after you") | Option B | Accurate to `check-free` | yes | user (Q-3) |
| D-5 | The two value-raise justifications are in scope (AC#2); wording per A-5 | Separate follow-up task | User chose to add to this task | yes | user (Q-4) |

## 5. Design

### Files to create / modify
- `src/stats/leak-categories.json` — replace the seven text fields listed in Scope with the approved wording.
- `docs/stats/leaks.md` — replace the same cells in the Postflop content table; run `npm run format`.
- `tests/stats/leak-copy.acceptance.test.ts` — new: pins the approved texts in data and docs (SPEC-01..04, SPEC-07).

### Components, interfaces and data
- No interface or format change. `version` stays 1. Each changed `fix` still passes `isOneSentence`
  (`src/stats/leaks.ts:91-92`); each changed `justification` still passes `/^[A-Z].*\.$/`.

### Rules and algorithms
Current texts (verbatim) and the approved new texts. Every new text is one original sentence, ends with its
only `.`, contains no `!`, `?`, apostrophe, quote, `&`, `<` or `>` (A-2). The builder copies the "New" texts
exactly.

**1. `turn-facing-a-bet-fold` (Q-1: A)** — rules: `pot-odds-call` with the river bet counted
(`postflop.ts:191-195, 246`), `implied-odds-call` (`postflop.ts:197-199, 249`).
- Current fix: "Before you fold to a turn bet, compare your chance to win, including your outs, with the price,
  since the pot has grown enough that many pairs and draws are worth a call."
- New fix: "Before you fold to a turn bet, compare your chance to win with the price of the call plus the river bet that usually follows, and call whenever your chance is at least that price."
- Current justification: "By the turn the pot holds several small and big bets, so a single big bet is often a
  fair price for a pair or a strong draw (pot-odds-call, implied-odds-call)."
- New justification: "A turn call is priced with the river big bet the hero will likely face, and the call is right when equity is at least that price, or a little less for a draw that wins more bets when it hits (pot-odds-call, implied-odds-call)."

**1b. `turn-facing-a-bet-call` justification (Q-1: A)** — equity is to the river (`postflop-rules.md:21-22`),
so a turn draw has one card to come instead of two.
- Fix (unchanged, A-1): "The turn bet is twice the size of a flop bet, so call it only with a made hand that is often best or a draw whose outs pay for the price."
- Current justification: "The doubled bet size raises the required equity; calls that were fine on the flop
  become losing calls on the turn without a real hand or draw."
- New justification: "A draw has only one card to come on the turn instead of two, so its equity drops while the price now counts the likely river big bet too, and calls that were fine on the flop can lose on the turn (pot-odds-call, pot-odds-fold)."

**2. `flop-facing-a-bet-call` fix (Q-2: A)** — rules: `pot-odds-call` "at least" (`postflop.ts:246`),
`value-raise` above 65% against the hands that would call a raise (`postflop.ts:38, 231-233`).
- Current fix: "Call a flop bet only when your chance to win, counting your outs, beats the price of the call,
  and raise instead when you are likely ahead."
- New fix: "Call a flop bet only when your chance to win, counting your outs, is at least the price of the call, and raise instead when you are well ahead of the hands that would call a raise."
- Justification (unchanged): "A call is graded against the pot-odds price and against the value-raise rule, so calls go wrong both when the hand is too weak and when it is strong enough to raise."

**3. `flop-not-facing-a-bet-bet` fix (Q-3: A)** — rules: `value-bet` above 50% against the calling range
(`postflop.ts:36, 237`), else `check-free` (`postflop.ts:240-242`).
- Current fix: "Bet the flop only when most of the hands that would call are worse than yours, and check the
  rest to see the turn for free."
- New fix: "Bet the flop only when most of the hands that would call are worse than yours, and check the rest, because a check costs nothing now and you see the turn for free if no one bets after you."
- Justification (unchanged): "A bet earns only from worse hands that pay it; when the hands that call are mostly better, the check-free rule is the better play."

**4. Raise justifications (Q-4, A-5)** — rule: `value-raise`, rounded equity against the hands that would call
a raise strictly above 65.0% (`postflop.ts:38, 231-233`).
- `flop-facing-a-bet-raise` current: "The value-raise rule asks for better than even equity against the hands
  that would continue; raising a weaker hand puts more chips in while behind."
- `flop-facing-a-bet-raise` new: "The value-raise rule asks for more than 65% equity against the hands that would call a raise, so a hand below that bar should just call or fold by the pot-odds rules (value-raise, pot-odds-call)."
- `turn-facing-a-bet-raise` current: "The value-raise rule needs better than even equity against the continuing
  range, and the cost of being wrong doubles on the turn."
- `turn-facing-a-bet-raise` new: "The value-raise rule needs more than 65% equity against the hands that would call a raise, and the cost of being wrong doubles on the turn (value-raise)."
- Raise fixes unchanged (A-1).

### Error handling and configuration
- A text that breaks the one-sentence rule makes the app fail at load (`src/stats/leaks.ts:154`); SPEC-02
  guards this. No configuration.

## 6. Behaviour specification

### SPEC-01: The approved texts are in the leak data
- Verifies: AC#1
- Behaviour: Given the app's leak categories, When `LEAK_CATEGORIES` is loaded, Then
  `turn-facing-a-bet-fold.fix`, `turn-facing-a-bet-fold.justification`, `turn-facing-a-bet-call.justification`,
  `flop-facing-a-bet-call.fix` and `flop-not-facing-a-bet-bet.fix` equal exactly the "New" texts in §5 items
  1-3, and `turn-facing-a-bet-call.fix`, `flop-facing-a-bet-call.justification` and
  `flop-not-facing-a-bet-bet.justification` equal their unchanged texts quoted in §5.
- Verification: acceptance `tests/stats/leak-copy.acceptance.test.ts::AC#1 the three revised leak entries carry the approved wording`

### SPEC-02: Each revised text is one sentence and safe to render
- Verifies: AC#1, AC#2
- Behaviour: Given each of the seven revised fields, When checked, Then each matches `/^[A-Z][^.!?]*\.$/`
  (one sentence) and none contains `'`, `"`, `&`, `<` or `>`.
- Verification: acceptance `tests/stats/leak-copy.acceptance.test.ts::AC#1 each revised text is one sentence with no characters React escapes`

### SPEC-03: The inaccurate phrases are gone
- Verifies: AC#1, AC#2
- Behaviour: Given every postflop fix and justification in the data, When searched, Then none contains
  "has grown enough", "raises the required equity", "beats the price of the call", "to see the turn for free"
  or "better than even equity".
- Verification: acceptance `tests/stats/leak-copy.acceptance.test.ts::AC#1 the inaccurate phrases no longer appear`

### SPEC-04: The docs match the data
- Verifies: AC#1, AC#2
- Behaviour: Given `docs/stats/leaks.md`, When read, Then it contains each of the seven revised texts verbatim
  and none of the five phrases from SPEC-03.
- Verification: acceptance `tests/stats/leak-copy.acceptance.test.ts::AC#1 docs/stats/leaks.md shows the revised wording`

### SPEC-05: Existing checks stay green with no locked-test edit
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the full suite, lint and typecheck run, Then all pass and `git diff main
  --stat` lists no file under `tests/` or `e2e/` other than the new `tests/stats/leak-copy.acceptance.test.ts`.
- Verification: command `npm run lint && npm run typecheck && npm test && git diff main --stat -- tests e2e`

### SPEC-06: The user sees the new fix on the report
- Verifies: AC#1
- Behaviour: Given a session whose turn folds, flop calls or flop bets form a leak, When the user opens the
  Session Report, Then "Biggest leaks this session" shows the approved fix sentence for that category.
- Verification: manual `npm run dev` → play hands folding turn bets / calling flop bets until 8+ with 40%+
  errors (or seed a report in IndexedDB) → Leave table → read the fix text

### SPEC-07: The raise justifications state the 65% bar
- Verifies: AC#2
- Behaviour: Given `LEAK_CATEGORIES`, When loaded, Then `flop-facing-a-bet-raise.justification` and
  `turn-facing-a-bet-raise.justification` equal exactly the "New" texts in §5 item 4, each contains
  "more than 65% equity against the hands that would call a raise", and the number 65 equals
  `VALUE_RAISE_THRESHOLD_PCT` from `src/advice/postflop.ts`; both raise fixes are unchanged.
- Verification: acceptance `tests/stats/leak-copy.acceptance.test.ts::AC#2 the raise justifications state the value-raise bar of more than 65%`

## 7. Edge cases
- Text breaking the one-sentence validator: SPEC-02 (and load-time validation).
- Characters React escapes, breaking the locked HTML comparison: SPEC-02, A-2.
- Docs drift from data: SPEC-04.
- Threshold drifting from the text: SPEC-07 ties "65" to `VALUE_RAISE_THRESHOLD_PCT`.
- Empty / concurrency / permissions / dependency failure: N/A — static data, no runtime input.

## 8. Security considerations
N/A — static authored text rendered as React text (no HTML injection); no new input, dependency, secret or
randomness.

## 9. Non-functional
- Readability: each fix stays one sentence of at most 40 words (the current longest postflop fix has 34);
  checked by reading in the approval step, not enforced by a test.
- Originality (REQ-061.2): all texts are written for this project.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then New game → Start game → play hands → Leave table → read "Biggest leaks
  this session"
- New tests (path → SPEC ids):
  - `tests/stats/leak-copy.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-07
- End-to-end scenario for the Judge: run the app, finish a session with a turn-fold, flop-call or flop-bet leak,
  and confirm the report shows the approved sentence; read all seven revised texts against
  `docs/advice/postflop-rules.md` (pot-odds-call, implied-odds-call, value-raise, check-free) for accuracy.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-10.14/qa.md`.
