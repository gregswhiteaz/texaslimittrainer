# Spec: TASK-7.36 — Give graded postflop examples chart-consistent preflop lines

Status: READY (approved 2026-11-26)
Task: TASK-7.36 · Parent/epic: TASK-7 · Requirements: REQ-037, REQ-038, REQ-039, REQ-061.2 (via TASK-7.14 / TASK-7.31, doc-154) · Dream: limit-holdem-trainer

## 1. Summary
TASK-7.31 added a validator rule so that no postflop golden spot reaches its decision through a hero preflop action
the chart grades as a Major error. It left `tests/golden/graded-examples.json` out of scope (TASK-7.31 A-1). This story
applies the same rule to postflop graded examples and re-authors the three examples that break it like-for-like. Each
keeps its id, table size, street, user action, grade, rule id and margin. The changes are logged in
`docs/advice/golden-spots.md`. The story also removes the unreachable `if (!result.ok) break;` in
`heroPreflopProblems`.

## 2. Scope
- In scope:
  - `src/advice/golden.ts`:
    - `parseExample` runs the existing `heroPreflopProblems` rule for postflop examples.
    - `heroPreflopProblems` drops the unreachable `if (!result.ok) break;`.
  - `tests/golden/graded-examples.json` (locked, owner TASK-7.14): re-author the three examples in §5 (hole cards,
    one line change, justifications). No other example changes.
  - `docs/advice/golden-spots.md`:
    - The Graded examples section states the rule and its failure text.
    - The TASK-7.31 sentence "Graded examples are not checked by this rule." is updated.
    - A new "Changes from TASK-7.36 (chart-consistent graded example lines)" log table is added.
  - A new acceptance file, `tests/golden/graded-lines.acceptance.test.ts`. It is locked after the first green build.
- Not doing:
  - No change to `tests/golden/postflop-spots.json`, `tests/golden/preflop-spots.json` or any locked acceptance test
    (`suite.acceptance.test.ts`, `postflop.acceptance.test.ts`, `postflop-lines.acceptance.test.ts`,
    `preflop.acceptance.test.ts`).
  - No change to the four preflop graded examples or to the two postflop examples that already pass
    (`graded-postflop-match-6max-turn-bb-set`, `graded-postflop-fold-major-6max-turn-second-pair`).
  - The rule is not applied to preflop graded examples (A-1).
  - No change to the grader, the advice engine, the chart or any problem text that already exists.
  - No new example ids, no clear-cut rule for graded examples, and no change to the 200-spot count.
- Scope budget: files=4, lines=220

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The hero-line rule applies only to postflop graded examples, where `view.street !== 'preflop'`. | yes | AC#1 says "every postflop graded example". The four preflop examples have no hero step in `before` today, because the graded decision is the user action itself. | Apply it to every example. Today that gives the same result. |
| A-2 | "Like-for-like" means the id, `seats`, `street`, `userAction`, `grade`, `ruleId` and `marginPts` all stay exactly as they are. The order of preference follows TASK-7.31 A-6: (b) swap only the hole cards, keeping the line and board, then (c) change the line. The prototype found exact-margin replacements for all three examples (§3), so no margin moves. | yes | AC#2 asks for grade, rule id and margin to be re-pinned like-for-like, and the prototype shows exact matches exist. Graded ids don't name the hand, so every id can be kept. | Accept a nearby margin. |
| A-3 | The gutshot example takes a line change rather than a hole-card swap. Its board stays 7s 3c 6h. The new line is: the button limps, the small blind folds, the big blind (hero) checks its option and checks the flop, and the button bets. The hero holds Kd 4h. | yes | No hole-card swap on the old line (the button calls the cutoff's raise) gives a gutshot hand the chart allows. The swaps the prototype found are all overcard hands (KTs, ATo, KQo), which would make the id's "gutshot" false. The limped line keeps a heads-up 6-max flop call/fold spot, and Kd 4h is a real gutshot (to the five) at exactly 4.6. | Keep the old line with Kd Td (KTs, 4.6, two overcards), and rename or mis-describe the id. |
| A-4 | Failure text: `Graded example <id>: hero preflop step <k> "<action>" is a Major error on the chart (<size> <position> <situation> <hand class>: <chart action>)`. This is the TASK-7.31 A-5 text with the graded-example prefix that `parseExample` already uses. | yes | It reuses the helper's output unchanged (`golden.ts:542-547`), and `where` is `Graded example ${name}` (`golden.ts:649`). | Other wording. |
| A-5 | Justifications: the gutshot example's text is rewritten. The other two keep their wording, but each must name its new kicker ("seven kicker", "ace kicker"). Every claim is checked against the evaluator output in the build log (§5). | yes | The caller requires accuracy. The old gutshot text ("gutshot to the four", from 52o) is false for K4o. The other two texts stay true but are vaguer than they need to be. | Rewrite all three from scratch. |

## 3. Current system
- Validator: `src/advice/golden.ts`.
  - `parseExample` (`:643-683`) builds the view with `viewOf(data, data.board !== undefined, where, problems)`. It
    checks the user action, grade, rule id, margin, justification and opponent stats. It does not check the hero's
    preflop line.
  - `parseGradedExamples` (`:686-692`) collects the problems per entry and throws a `GoldenSpotValidationError` (via
    `parseEntries`).
  - `checkGradedExample` (`:698-717`) grades `userAction` against `goldenPostflopAdvice` postflop and compares grade,
    rule id and margin exactly.
  - `heroPreflopProblems` (`:534-555`) is private. It deals `dealtHand(seats, view.seat, holeCards, view.board)`,
    walks `before` while the street is preflop, and grades each hero step with
    `gradeDecision(recommendPreflop(view), step)`. Its `if (!result.ok) break;` (`:550`) can't be reached:
    - The helper runs only after `viewOf` built the view (`:576`).
    - `buildView` (`:227-244`) already replayed every step legally on the same deal.
  - `ApplyResult` (`src/engine/hand.ts:114-119`) is a union on `ok`. So removing the guard needs a narrowing cast on
    the success branch to satisfy `tsc`. One way:
    `state = (applyAction(state, legalOf(state, step) as Action) as Extract<ApplyResult, { ok: true }>).state;`,
    which imports `type ApplyResult` from `../engine/hand`.
- Data: `tests/golden/graded-examples.json` has 9 examples: 4 preflop and 5 postflop. The prototype audit (below)
  found 3 with a Major hero preflop step:

  | Example id | Hole cards | Major step(s) (chart cell) | Engine grade today |
  |---|---|---|---|
  | `graded-postflop-fold-minor-6max-flop-gutshot` | 5d 2h | step 4 `call` (6-max BTN raise 52o: fold) | minor call-fold-margin 4.6 (equity 17.9 vs required 13.3) |
  | `graded-postflop-check-minor-6max-river-top-pair` | Kh 6h | step 3 `raise` (6-max CO unopened K6s: fold); step 7 `call` (6-max CO re-raise K6s: fold) | minor aggression-margin 6.9 (vs calling range 56.9, threshold 50) |
  | `graded-postflop-check-major-6max-turn-trips` | 3c Ts | step 4 `raise` (6-max BTN unopened T3o: fold) | major aggression-margin 29 (79 vs 50) |

  The other two postflop examples are clean: the 55 BB call is Correct, and the J7o BB call is Correct against a
  borderline fold/call cell.
- Prototype replacements. Each passes `parseGradedExamples`, has no Major hero step, has `equityMethod` `exact`, and
  gives exactly the same grade, rule id and margin:

  | Example id | New hole cards | New `before` | Hero preflop steps (all Correct) | Engine numbers |
  |---|---|---|---|---|
  | gutshot | `Kd 4h` | `["fold","fold","fold","call","fold","check","check","bet"]` | step 6 `check` (6-max BB limpers K4o: check) | call; equity 26.8, required 22.2 → minor call-fold-margin 4.6 |
  | top-pair | `Kh 7h` | unchanged | step 3 `raise` (CO unopened K7s: raise, borderline); step 7 `call` (CO re-raise K7s: call, borderline) | bet; vs calling range 56.9, threshold 50 → minor aggression-margin 6.9 |
  | trips | `Ah 3c` | unchanged | step 4 `raise` (BTN unopened A3o: raise) | bet; 79 vs 50 → major aggression-margin 29 |

  Evaluator (`src/engine/hand-evaluator.ts` `evaluate`/`handCategory`) facts for the justifications:
  - Kd 4h on 7s 3c 6h is high card. The next card gives a straight with any 5 (4 cards). It gives one pair with a K
    (3 cards, top pair), a 4 (3), a 3, a 6 or a 7.
  - Kh 7h on 9s Jh 5c Kc 8h is one pair: kings with a seven kicker. The hearts are Jh, 8h, Kh and 7h, only four, so
    there is no flush. There is no straight.
  - Ah 3c on Kd 3h 5c 3d is three of a kind: threes with an ace kicker.
- Locked tests touching this area (owner from `doit/*/state.json` `locked_tests`):
  - `tests/golden/graded-examples.json` (TASK-7.14). **Values change**: the three examples above. It must be unlocked
    under TASK-7.14 before the build. This is mandated by the task description and AC#2.
  - `tests/golden/suite.acceptance.test.ts` (TASK-7.14). Not edited. It reads every example and asserts
    `checkGradedExample` is null for each one. It also asserts a postflop example exists at each grade, every postflop
    non-correct example has a numeric margin with `equityMethod` `exact`, and the margin-shift message comes from the
    first numeric example (the gutshot, still 4.6). All of these still hold.
  - `tests/golden/postflop.acceptance.test.ts` (TASK-7.14, TASK-7.33). Not edited. Its DoD#1 test (`:166-176`) needs
    every id and justification across the three files to be distinct, so new justifications must be unique.
  - `tests/golden/postflop-lines.acceptance.test.ts` (TASK-7.31). Not edited. The helper's message text doesn't
    change, so its exact `toEqual` still holds.
  - `tests/golden/preflop-spots.json`, `tests/golden/preflop.acceptance.test.ts` (TASK-7.11). Not touched.
  - Only `src/advice/golden.ts` and the `tests/golden/` files read `graded-examples.json` (grep of
    `src tests tools e2e docs`).
- Unlocked tests: `tests/golden/postflop-golden.test.ts` builds inline graded-example probes:
  - `gradedPostflop` (`:332-343`): the 6-max BTN opens As Qd, which the chart raises.
  - The heads-up river probe (`:435-447`): the BTN raises Ad Ac.
  - Both are chart-consistent, so no edit is expected. The builder confirms by running the file.
- Tests run with Vitest. `npx vitest run tests/golden/` takes about 1.5 s. `*.acceptance.test.*` files run in
  `npm test` and in the CI `test:sweeps` job.
- Existing code to reuse:
  - `src/advice/golden.ts` `heroPreflopProblems` → call it from `parseExample` as it is. Don't write a second replay.
  - `tests/golden/postflop-lines.acceptance.test.ts:56-73,76-108` → copy the `preflopHand` builder and the
    independent audit loop into the new acceptance file. Don't import from the locked file.
  - Spec-writer prototype scripts (scratch, not part of the change). Run them from the project root with
    `node --import ./tools/playtest/resolve-ts.js <script> ...`. A reboot may clear them, so copy anything needed into
    the build log:
    - `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t736/steps.ts`
      — `<exampleId> [beforeJSON] audit`, with optional env `HC="<hole cards>"`. It prints each hero preflop step's
      grade and chart cell, the advice numbers, `equityMethod` and the grade of `userAction`.
    - `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t736/search.ts`
      — `<exampleId> [beforeJSON] search`. It is a brute-force hole-card swap that keeps the recorded grade and rule
      id.
    - `/private/tmp/claude-501/-Users-gregwhite-Documents-claudeworkspaces-limitholdem/4f7a755b-7d9f-4f95-8508-90fc0fabf0c8/scratchpad/t736/cat.ts`
      — `"<hole>" "<board>"`. It prints the evaluator's made-hand category and, before the river, the next-card
      categories with their cards (outs).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Re-author the three examples in `graded-examples.json` (locked, TASK-7.14) like-for-like, keeping their ids, and log them under "Changes from TASK-7.36 (chart-consistent graded example lines)". | Delete the examples; exempt graded examples from the rule | The task description and AC#2 require it, and this matches the TASK-7.31 D-1 convention. The file is unlocked under its owner, TASK-7.14. | yes | task AC#2 (story text); locked-file unlock per autopilot rule |
| D-2 | The rule runs inside `parseExample` after the existing field checks, for views whose street isn't preflop. Its problems are pushed with the example's `where` prefix. | A separate exported check that only the tests call | This matches TASK-7.31 A-4 / D-2. The parse itself rejects a future bad example, which "Adding a spot"-style authoring relies on. | no | n/a |
| D-3 | Remove the guard with a type-narrowing cast, not a runtime throw. | Replace it with `if (!result.ok) throw ...` | The branch can't be reached. A throw would be another uncovered branch. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/golden.ts` — `parseExample` calls `heroPreflopProblems` for postflop views; remove the unreachable guard.
- `tests/golden/graded-examples.json` — re-author the three examples (unlocked under TASK-7.14).
- `docs/advice/golden-spots.md` — the graded-example rule, its failure text, the TASK-7.31 sentence fix and the
  TASK-7.36 change log.
- `tests/golden/graded-lines.acceptance.test.ts` — new and locked (SPEC-01 to SPEC-04).

### Components, interfaces and data
- No exported signature changes. `parseGradedExamples(raw)` still returns `GradedExample[]` or throws
  `GoldenSpotValidationError`. It now also rejects a postflop example with a Major hero preflop step.
- In `parseExample`, just before `if (problems.length > before || view === null) return null;`:
  `if (view !== null && view.street !== 'preflop') for (const p of heroPreflopProblems(data, view)) problems.push(`${where}: ${p}`);`
  `heroPreflopProblems` reads `data.seats`, `data.holeCards`, `data.before` and `view.board`. It is valid here
  because the view was built, the same precondition as in `parsePostflopSpot`.
- The `heroPreflopProblems` doc comment stays accurate. If it mentions only "spots", widen it to "spot or graded
  example".
- `graded-examples.json` keeps format v1 and 9 examples in the same order. The new values:
  - `graded-postflop-fold-minor-6max-flop-gutshot`:
    - `holeCards` `"Kd 4h"`, `board` `"7s 3c 6h"` (unchanged), `street` `flop`.
    - `before` `["fold","fold","fold","call","fold","check","check","bet"]`.
    - `userAction` `fold`, `grade` `minor`, `ruleId` `call-fold-margin`, `marginPts` `4.6`.
    - New justification, A-5. Suggested draft, which the builder checks: "King-four has a gutshot to the five and
      three king outs for top pair after the big blind checked its option in a limped pot, so its equity is a few
      points above what the pot odds ask against the button's flop bet. Folding gives up that small edge, so it is a
      Minor error because the margin is under ten points."
  - `graded-postflop-check-minor-6max-river-top-pair`:
    - `holeCards` `"Kh 7h"`. Board, `before`, action, grade `minor`, rule `aggression-margin` and `marginPts` `6.9`
      are unchanged.
    - Justification: the existing text, with "a weak kicker" made specific ("a weak seven kicker" or similar).
  - `graded-postflop-check-major-6max-turn-trips`:
    - `holeCards` `"Ah 3c"`. Board, `before`, action, grade `major`, rule `aggression-margin` and `marginPts` `29`
      are unchanged.
    - Justification: the existing text, naming the ace kicker ("Trip threes with an ace kicker ...").
- Justification constraints (validator and locked tests):
  - At least 15 words and at most three sentences.
  - Names at least one listed concept, for example "equity", "pot odds" or "value bet".
  - Distinct from every id and justification in the three golden files.

### Rules and algorithms
- Worked example of the rule: the old top-pair example with id `probe`. It is 6-max, `holeCards` `Kh 6h`, with the
  old board, `before`, action, grade, rule and margin. `parseGradedExamples` throws, and its problems equal exactly:
  - `Graded example probe: hero preflop step 3 "raise" is a Major error on the chart (6-max CO unopened K6s: fold)`
  - `Graded example probe: hero preflop step 7 "call" is a Major error on the chart (6-max CO re-raise K6s: fold)`
  The same probe with `Kh 7h` parses to one example.
- Worked example for the old gutshot line (5d 2h, `before` `["fold","fold","raise","call","fold","fold","bet"]`): the
  single problem is `Graded example probe: hero preflop step 4 "call" is a Major error on the chart (6-max BTN raise 52o: fold)`.
- Re-authoring steps (the builder):
  1. Apply the §5 values.
  2. For each of the three, run the prototype `steps.ts ... audit` with the new cards and line, plus `cat.ts` on the
     hole cards and board.
  3. Record a table in `doit/TASK-7.36/build-log.md`. Columns: id, old and new hole cards, line change, each hero
     preflop step with its grade and chart cell, the engine's equity / required / calling-range / threshold numbers,
     the grade, rule and margin, and the evaluator's made-hand category and outs.
  4. Check every factual claim in each justification against that table: hand class, made hand, draw and outs,
     kicker, who limped, raised or bet, and the street. Fix any claim that doesn't match.
  5. Run `npx vitest run tests/golden/`.

### Error handling and configuration
- The new problem text is A-4. Existing texts are unchanged.
- Problem order within an example: the existing field problems first, then the hero-line problems in step order.
- No configuration.

### Docs (`docs/advice/golden-spots.md`)
- Graded examples section (`:157-174`):
  - Add that every preflop action the hero takes in a postflop example must not be a Major error on the chart, as for
    postflop spots. A Minor (borderline) step is allowed.
  - Give the A-4 failure text in a code block.
- TASK-7.31 section (`:262`): replace "Graded examples are not checked by this rule." with a sentence saying
  TASK-7.36 extends the rule to postflop graded examples.
- New section "## Changes from TASK-7.36 (chart-consistent graded example lines)", before "## Originality":
  - One intro sentence saying the ids, street, user action, grade, rule id and margin are unchanged.
  - A table with columns: Id | Old hand and Major step (chart cell) | Fix | Grade, rule, margin. It has one row per
    example. Each row names the old and new hole cards, any line change, and the unchanged grade, rule id and margin
    (`minor call-fold-margin 4.6`, `minor aggression-margin 6.9`, `major aggression-margin 29`).
- Prettier formats the table (`npm run lint` runs `prettier --check .`).

## 6. Behaviour specification

### SPEC-01: No postflop graded example has a Major hero preflop action
- Verifies: AC#1
- Behaviour: Given every example in `tests/golden/graded-examples.json` that has a `board`, When the test rebuilds each
  hero preflop decision on its own and grades the hero's step with `gradeDecision(recommend(view), step)`, Then no
  grade is `major`.
  - The test doesn't call the validator helper. It deals with `createHand` (`GOLDEN_STAKES`, `GOLDEN_STACK`, button
    1, the hero's hole cards at the dealing indexes) and applies each `before` step as the to-act seat's legal action,
    using `playerView`.
  - The hero seat comes from the parsed `view.seat`.
  - Every postflop example has at least one hero preflop decision, and there are exactly 5 postflop examples.
  - A failure names the example id, the step number, the action and the chart cell.
- Verification: acceptance `tests/golden/graded-lines.acceptance.test.ts::AC#1 no postflop graded example reaches its decision through a hero preflop action the chart grades as a Major error`

### SPEC-02: The validator rejects a graded example whose hero preflop line is a Major error
- Verifies: AC#1
- Behaviour: Given inline probes with id `probe` (§5 Rules), When `parseGradedExamples` runs, Then:
  - The old top-pair probe (Kh 6h) throws `GoldenSpotValidationError`. Its problems equal exactly the two A-4 lines
    for step 3 `raise` (6-max CO unopened K6s: fold) and step 7 `call` (6-max CO re-raise K6s: fold).
  - The old gutshot probe (5d 2h on its old line) throws, with problems equal to exactly the one step 4 `call` line
    (6-max BTN raise 52o: fold).
  - The top-pair probe with `Kh 7h` returns one example.
- Verification: acceptance `tests/golden/graded-lines.acceptance.test.ts::AC#1 a graded example whose hero preflop line is a Major error is rejected by the validator`

### SPEC-03: The three re-authored examples keep their grade, rule id and margin
- Verifies: AC#2
- Behaviour: Given the parsed file with real advice, When the three ids are looked up, Then:
  - The file has 9 examples.
  - Each of the three exists with `seats` 6 and these fields:

    | id | holeCards | street | userAction | grade | ruleId | marginPts |
    |---|---|---|---|---|---|---|
    | `graded-postflop-fold-minor-6max-flop-gutshot` | Kd 4h | flop | fold | minor | call-fold-margin | 4.6 |
    | `graded-postflop-check-minor-6max-river-top-pair` | Kh 7h | river | check | minor | aggression-margin | 6.9 |
    | `graded-postflop-check-major-6max-turn-trips` | Ah 3c | turn | check | major | aggression-margin | 29 |

  - `checkGradedExample(example)` is `null` for each, so the engine reproduces the grade, rule id and margin exactly.
  - `goldenPostflopAdvice(view, observed).equityMethod` is `exact` for each.
  - The test compares hole cards as card sets, so order doesn't matter.
- Verification: acceptance `tests/golden/graded-lines.acceptance.test.ts::AC#2 re-authored graded examples keep grade, rule id and margin like-for-like`

### SPEC-04: The change log lists each re-authored example
- Verifies: AC#2
- Behaviour: Given `docs/advice/golden-spots.md`, When the section starting at the heading
  `## Changes from TASK-7.36 (chart-consistent graded example lines)` and ending at the next `## ` heading is read,
  Then:
  - The section exists.
  - It contains each of the three ids in backticks.
  - It contains the margins `4.6`, `6.9` and `29`.
  - The text "Graded examples are not checked by this rule." no longer appears anywhere in the file.
- Verification: acceptance `tests/golden/graded-lines.acceptance.test.ts::AC#2 the golden-spots change log lists each re-authored graded example`

### SPEC-05: Justifications are factually accurate
- Verifies: AC#2
- Behaviour: Given the build-log table (§5 Rules, step 3), When a reviewer reads the three justifications, Then:
  - Each claim matches the evaluator output and `before`:
    - Gutshot: K4 high, gutshot to the five, king outs for top pair, a limped pot where the big blind checked its option
      and the button bet.
    - Top pair: kings with a seven kicker, flop and turn checked.
    - Trips: threes with an ace kicker; the big blind led the flop and checked the turn.
  - No text still describes the old hands ("gutshot to the four", 52, K6, T3).
- Verification: manual `reviewer and judge cross-check doit/TASK-7.36/build-log.md against the three justifications in tests/golden/graded-examples.json`

### SPEC-06: The unreachable guard is gone and every other check stays green
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the checks below run, Then:
  - `src/advice/golden.ts` no longer contains `if (!result.ok) break;`.
  - The full suite, lint and typecheck pass.
  - The only locked file modified is `tests/golden/graded-examples.json`.
- Verification: command `! grep -n "if (!result.ok) break;" src/advice/golden.ts && npm run lint && npm run typecheck && npm test && git diff --name-only 99a4ec6 -- tests/` (the diff lists only `tests/golden/graded-examples.json` and `tests/golden/graded-lines.acceptance.test.ts`)

## 7. Edge cases
- Hero acts more than once preflop (open, then call a re-raise). Every hero step is graded: the top-pair probe in
  SPEC-02 has two Major steps.
- Borderline cells: a Minor step is allowed. The new top-pair line is graded Correct on two borderline cells.
- BB checking its option: the chart's fold becomes check, so this is Correct with any hand. The new gutshot line uses
  it.
- Preflop graded examples: the rule is skipped (A-1). The current preflop examples have no hero step in `before`.
- A view that can't be built: the rule is skipped, and the existing "missing player view" problem stands, because of
  the `view !== null` guard.
- An id or justification collision: caught by the locked TASK-7.14 DoD#1 test in `npm test`.
- Concurrency, permissions, interruption and dependency failure: N/A, because this is pure test-data validation.

## 8. Security considerations
- Trust boundary: the example JSON is test data controlled by the repo. Untrusted values in messages already go
  through `echo` (`golden.ts:134-143`), including the step text.
- No authn/authz, secrets, network, new dependencies or randomness. Equity enumeration is exact for every postflop
  example.

## 9. Non-functional
- `npx vitest run tests/golden/` stays under 3 s locally (about 1.5 s today). The rule adds one preflop replay per
  postflop example, which takes microseconds.
- Nothing goes in the slow group, and no speed or scale test is added.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/golden/`
- New tests: `tests/golden/graded-lines.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04.
- End-to-end for the Judge:
  1. Run `npx vitest run tests/golden/`.
  2. In a scratch copy of `graded-examples.json`, restore the trips example's hole cards to `3c Ts`. Confirm
     `parseGradedExamples` fails with
     `Graded example graded-postflop-check-major-6max-turn-trips: hero preflop step 4 "raise" is a Major error on the chart (6-max BTN unopened T3o: fold)`.
  3. Read the three justifications against the build-log table.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-7.36/qa.md`. No questions were asked: the locked file change is mandated by the task (D-1).
