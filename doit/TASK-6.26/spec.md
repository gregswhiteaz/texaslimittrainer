# Spec: TASK-6.26 — Tidy after same-style bot replacement (dead Replay option, stale comments, style justifications)

Status: READY (approved 2026-11-26)
Task: TASK-6.26 · Parent/epic: TASK-6 · Requirements: REQ-007.5 (context only; follow-up of TASK-6.25 review/judge, doc-130) · Dream: limit-holdem-trainer

## 1. Summary
TASK-6.25 made a busted bot's replacement keep its seat's style (REQ-007.5). That left five loose ends: a
Replay-line helper in the playtest CLI that can no longer print anything, a stale runner comment, a Rock
justification that omits the added AJo, a Maniac justification with an unclear trailing clause, and an
acceptance test that still loops 10,000 replay codes although style no longer depends on the code. This task
removes the dead code, fixes the three texts, and shrinks the test to a small fixed code set with the same
checks. No behaviour changes.

## 2. Scope
- In scope:
  - `src/playtest/cli.ts`: delete `replacedStylesOption` (`cli.ts:274-281`) and its use in the Replay line
    (`cli.ts:310`). Keep `stylesOption` (still used for the replay `Options:` echo, `cli.ts:452`).
  - `tests/playtest/cli.test.ts`: update the `--styles` test (`cli.test.ts:688-758`) so it no longer expects
    `--styles` on a run's Replay line; keep every check of live behaviour and the file's assertion count.
  - `src/playtest/runner.ts:71-73`: `PlaytestOptions.lineUp` comment says a busted bot is replaced by a new
    bot of the same style.
  - `src/bots/styles/rock.json:89` (CO / raise) and `src/bots/styles/maniac.json:48` (postflop fold → call)
    justification texts (exact wording in §5).
  - `tests/bots/replacement.acceptance.test.ts`: 10,000 codes → 8 fixed codes, same tests, same assertions.
- Not doing:
  - No change to the `--styles` replay option itself (parsing, `Options:` echo, usage text, errors) — it is
    live: a user can still replay a hand with chosen styles (`cli.ts:194-204`, `cli.ts:452`).
  - No change to any hand list, probability, threshold or description in any style file; only the two
    justification strings.
  - No change to `tests/playtest/replacement.acceptance.test.ts` or any other locked test, and no change to
    runner/session replacement logic.
  - No new tests or slow-group changes (the shrunk test only gets faster; nothing moves into `test:slow`).
- Scope budget: files=6, lines=80

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Rock CO/raise justification becomes exactly: "From the cutoff against one raise the Rock adds medium pairs, suited broadway hands and ace-jack offsuit, and still folds every weaker hand." | yes | Names every addition over the older range (99 88; KQs KJs QJs; AJo) and spells the hand out the way the file does elsewhere ("ace-king or ace-queen suited", `rock.json:77`; "king-queen suited", `rock.json:17`). | Literal "AJo" or "ace-jack offsuit (AJo)" — the file never uses hand shorthand in prose. |
| A-2 | Maniac postflop fold→call justification becomes exactly: "Calling most bets the pot odds say to fold makes the Maniac pay off value bets with weak hands, giving back the chips it wins with steals, and the extra calls help keep its postflop aggression inside its 65 to 85 percent band." | yes | One sentence; replaces the unclear "keeps its aggression from reaching every street" with what calls actually do (lower the aggression share) in the same band wording the file already uses (`maniac.json:34`, `maniac.json:41`). | Drop the aggression clause entirely (loses the band rationale the sibling entries give). |
| A-3 | The cli test keeps the impossible "swapped styles" hand but now asserts its Replay line equals the unswapped one (ends ` --lineup mixed`, no `--styles`), instead of deleting those expects. | yes | AC#1 forbids dropping live checks; converting the dead-behaviour expect into a "Replay line carries only the line-up name" guard keeps the file's assertion count (102) so the integrity gate shows no drop. | Delete the swapped block (−1 assertion, gate WARN). |
| A-4 | The small fixed code set is 8 codes: `replayCodeFromWords([i + 1, 6, 8, 3])` for i = 0..7 (the first 8 of today's set). | yes | Style no longer depends on the code; 8 still exercises several distinct codes per tally while keeping every per-code check. | 1 code; 16 codes. |
| A-5 | Editing locked `tests/bots/replacement.acceptance.test.ts` (owner TASK-6.8) is done via `doit.py unlock TASK-6.26 tests/bots/replacement.acceptance.test.ts --reason "AC#3: 10,000 codes → 8 fixed codes; same 18 assertions"` before the build edits it. | yes | AC#3 names the file and requires the change; standing autopilot rule allows locked-test edits under their owner when no assertion is dropped. | n/a — the AC requires editing it. |

## 3. Current system
- Playtest CLI (`src/playtest/cli.ts`): a run's violation block ends with a `Replay:` line built at
  `cli.ts:308-311` = replay code/size/button + `gameSuffix` + `lineUpOption(lineUp)` +
  `replacedStylesOption(hand, lineUp)`. `replacedStylesOption` (`cli.ts:274-281`) emits ` --styles …` only when
  some seat in `hand.lineUp` has a style different from `seatLineUp(preset, size, 1)`.
- Why it is dead (codebase): `runPlaytest` starts from `preset = seatLineUp(lineUp, size, 1)`
  (`runner.ts:356`), resets to it after a violation (`runner.ts:381`), and replaces a busted bot with
  `{ seat, kind: 'bot', style, name }` keeping the old `style` (`runner.ts:388-393`). The CLI never passes
  `--styles` to a run (`cli.ts:206` rejects it), so `hand.lineUp` styles always equal the preset's. Only a
  hand-crafted `PlayedHand` (the test at `cli.test.ts:736-753`) can reach the `--styles` branch.
- `stylesOption` (`cli.ts:268-272`) is also used for the replay header echo (`cli.ts:452`) — keep it.
  `LINE_UPS` (`cli.ts:162`) and `seatLineUp` (`cli.ts:390`) stay used after the removal; no import changes.
- Runner comment to fix: `runner.ts:71-73`. The function comment at `runner.ts:339-343` was already updated by
  TASK-6.25 ("replaced by a new bot of the same style") — reuse that phrasing.
- Style files are validated by `src/bots/style.ts` (`JUSTIFICATION_WORDS = 10`, `style.ts:101`, checks at
  `style.ts:192`/`235`); both new texts exceed 10 words. No test or doc copies the two current strings (grep of
  `src tests docs e2e`: only the JSON files).
- `tests/bots/replacement.acceptance.test.ts:27-28` defines `DRAWS = 10_000` and `CODES`; `tally()`
  (`:38-52`) loops every code; the first test (`:68`) is titled "10,000 replacements…" and asserts the total
  `DRAWS * 5` (`:78`). Static assertion count today: 18; whole file runs in ~0.4 s.
- Locked tests touched (from `doit/*/state.json` `locked_tests`):
  - `tests/bots/replacement.acceptance.test.ts` — locked by **TASK-6.8** (last edited by TASK-6.25 under unlock).
  - `tests/playtest/cli.test.ts` — **not locked** by any task (unit file; snapshot assertion count 102).
  - Not touched: `tests/playtest/replacement.acceptance.test.ts` (TASK-6.8, TASK-6.17).
- Tests run with Vitest (`npm test`); acceptance files run in `test:sweeps`; neither touched file is in
  `test:slow` (`package.json` scripts).
- Existing code to reuse:
  - `runner.ts:340` comment wording → "replaced by a new bot of the same style" for the `lineUp` comment.
  - `replayCodeFromWords` and the existing `CODES` construction → just change the length.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Remove `replacedStylesOption` outright rather than keep it "just in case". | Keep with a comment. | Unreachable in every real run (§3); dead code invites drift. `--styles` replay stays, so a user can still replay any custom-styled hand by hand. | no | n/a |
| D-2 | Keep the shrunk test in the normal acceptance sweep (not `test:slow`). | Move to slow group. | It is a correctness check, not a speed/scale check, and gets faster. | no | n/a |

## 5. Design

### Files to create / modify
- `src/playtest/cli.ts` — delete `replacedStylesOption`; Replay line ends at `lineUpOption(lineUp)`.
- `src/playtest/runner.ts` — `PlaytestOptions.lineUp` doc comment.
- `src/bots/styles/rock.json` — CO / `raise` justification.
- `src/bots/styles/maniac.json` — postflop `fold` → `call` justification.
- `tests/playtest/cli.test.ts` — update the `--styles` test.
- `tests/bots/replacement.acceptance.test.ts` — 8 fixed codes (unlock first, A-5).

### Components, interfaces and data
- `src/playtest/cli.ts` violation block Replay line becomes:
  `` `Replay: npm run playtest -- --replay-code ${record.replayCode} --size ${record.size} --button ${record.button}` + gameSuffix(record.game, recordStacks(record)) + lineUpOption(lineUp) ``.
  `violationBlock`'s `hand` and `lineUp` parameters remain used. No exported signature changes.
- `runner.ts:71-73` comment, exact text:
  ```
  /** Seat 1 plays the user (TAG), seats 2..size the preset's styles (seatStylesPolicyFactory); in cash a bot
   *  that busts is replaced by a new bot of the same style (REQ-007.5). An explicit seams.makePolicy wins.
   *  Default: defaultPolicyFactory. */
  ```
- `rock.json:89` `"justification"` exact value (A-1):
  `From the cutoff against one raise the Rock adds medium pairs, suited broadway hands and ace-jack offsuit, and still folds every weaker hand.`
- `maniac.json:48` `"justification"` exact value (A-2):
  `Calling most bets the pot odds say to fold makes the Maniac pay off value bets with weak hands, giving back the chips it wins with steals, and the extra calls help keep its postflop aggression inside its 65 to 85 percent band.`

### Rules and algorithms
- `tests/playtest/cli.test.ts` `--styles` test (`:688`):
  - Rename to `'--styles replays a hand with the given styles and echoes them in the Options line'`.
  - Keep unchanged: the `parseArgs` expect, `styled.code`, the `styled.out` Options/Line-up expect, the
    "differs from the unstyled replay" expect, and the `faulty` Replay line `endsWith(' --lineup mixed')` expect.
  - Replace the expect at `:744-753` (ends with ` --lineup mixed --styles tag,rock,maniac,rock,tag`) with: the
    Replay line of the swapped-styles hand reported with `'run', 'mixed'` **equals** the Replay line of
    `formatReport('', faulty, 'run', 'mixed')` (so it ends ` --lineup mixed` and carries no `--styles`).
  - Keep the last expect (no line-up name ⇒ no `--styles`).
  - Net static assertion count of the file stays 102.
- `tests/bots/replacement.acceptance.test.ts`:
  - `DRAWS = 8` (name may stay `DRAWS` or become `CODE_COUNT`; `CODES` stays
    `Array.from({ length: DRAWS }, (_, i) => replayCodeFromWords([i + 1, 6, 8, 3]))`).
  - `tally()` doc comment: "…over the fixed CODES as the finished hand's replay code."
  - First test title: `"replacements at 6 players keep each preset's styles"` (drop "10,000").
  - Every `expect` stays (including the per-code `toEqual` inside `tally()` and `toBe(DRAWS * 5)`); static
    assertion count stays 18; test count stays 4.

### Error handling and configuration
- N/A — no new errors or options. Style files still pass `parseStyle` validation (≥10-word justifications).

## 6. Behaviour specification

### SPEC-01: Run Replay line carries only the line-up name
- Verifies: AC#1
- Behaviour: Given a `--lineup mixed` run whose first violating hand is reported, When its Replay line is built,
  Then it ends ` --lineup mixed` with no `--styles`, even for a hand whose `lineUp` styles differ from the
  preset; and `src/playtest/cli.ts` contains no `replacedStylesOption`.
- Verification: unit `tests/playtest/cli.test.ts::--styles replays a hand with the given styles and echoes them in the Options line`

### SPEC-02: Dead branch gone, live --styles replay intact
- Verifies: AC#1
- Behaviour: Given the repository after the build, When searched, Then `grep -c replacedStylesOption src/playtest/cli.ts`
  prints `0`, and `npm run playtest -- --replay-code 0123456789abcdef0123456789abcdef --lineup mixed --styles rock,calling-station,maniac,tag,tag`
  still prints an `Options:` line ending ` --lineup mixed --styles rock,calling-station,maniac,tag,tag` and a
  `Line-up:` line with seat 2 Rock and seat 3 Calling station.
- Verification: command `grep -c replacedStylesOption src/playtest/cli.ts; npm run playtest -- --replay-code 0123456789abcdef0123456789abcdef --lineup mixed --styles rock,calling-station,maniac,tag,tag | head -4`

### SPEC-03: cli test keeps all live checks
- Verifies: AC#1
- Behaviour: Given `tests/playtest/cli.test.ts` before and after, When assertions are counted by the gate, Then
  the count is unchanged (102) and the gate reports no "fewer assertions" warning for the file.
- Verification: command `python3 /Users/gregwhite/.claude/skills/doit/scripts/doit.py test-integrity TASK-6.26` (no `fewer assertions in tests/playtest/cli.test.ts` line)

### SPEC-04: Runner comment and style justifications updated
- Verifies: AC#2
- Behaviour: Given `runner.ts`, `rock.json` and `maniac.json`, When read, Then the `PlaytestOptions.lineUp`
  comment contains "replaced by a new bot of the same style" and not "drawn from the preset"; the Rock CO
  `raise` justification is exactly the A-1 text (contains "ace-jack offsuit"); the Maniac postflop
  `fold`→`call` justification is exactly the A-2 text, a single sentence (one `.`, at the end); both style
  files still load (style tests green).
- Verification: command `grep -n "same style (REQ-007.5)" src/playtest/runner.ts && ! grep -n "drawn from the preset" src/playtest/runner.ts && node -e "const r=require('./src/bots/styles/rock.json'),m=require('./src/bots/styles/maniac.json');console.log(JSON.stringify(r).includes('adds medium pairs, suited broadway hands and ace-jack offsuit, and still folds every weaker hand.'));const j=m.deviations.find(d=>d.street==='postflop'&&d.advice==='fold'&&d.instead==='call').justification;console.log(j.split('.').length===2&&j.endsWith('.'))" && npx vitest run tests/bots/style.test.ts tests/bots/rock.acceptance.test.ts tests/bots/maniac.acceptance.test.ts` (both `true`, tests green)

### SPEC-05: Same-style replacement checks over a small fixed code set
- Verifies: AC#3
- Behaviour: Given `tests/bots/replacement.acceptance.test.ts`, When it runs, Then `CODES` has 8 entries, every
  preset/Custom/small-table case still asserts each replacement keeps the seat's style for every code, the
  6-player total equals `8 * 5`, the file still has 4 tests and 18 static assertions, and all pass.
- Verification: acceptance `tests/bots/replacement.acceptance.test.ts::replacements at 6 players keep each preset's styles`

### SPEC-06: Other same-style checks in the shrunk file still pass
- Verifies: AC#3
- Behaviour: Given the shrunk file, When it runs, Then "a session recorded as Custom keeps each bot style, all
  four included", "Mixed at 3 players keeps TAG and Calling station and heads-up Tough keeps TAG" and the
  replacement-names test pass unchanged in body apart from the code count.
- Verification: acceptance `tests/bots/replacement.acceptance.test.ts::a session recorded as Custom keeps each bot style, all four included`

## 7. Edge cases
- Violating hand with a line-up whose styles differ from the preset: cannot arise in a real run (§3); the
  crafted case is pinned by SPEC-01.
- Replay mode (`mode === 'replay'`) never printed a Replay line (`cli.ts:304`) — unchanged.
- Run without `--lineup`: Replay line has no line-up or styles — unchanged, pinned by the last expect (SPEC-01).
- Style file validation: new justifications ≥10 words — SPEC-04.
- Empty / concurrency / permissions / dependency failure: N/A — text and test-only edits.

## 8. Security considerations
N/A — no new input, trust boundary, dependency, secret or randomness; bot randomness is untouched.

## 9. Non-functional
- `tests/bots/replacement.acceptance.test.ts` runtime drops from ~0.4 s to well under 0.1 s of test time
  (Vitest per-test timings); no target enforced. No speed/scale checks added (standing rule: those go in the
  opt-in slow group).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --replay-code 0123456789abcdef0123456789abcdef --lineup mixed --styles rock,calling-station,maniac,tag,tag`
- New tests: none; updated `tests/playtest/cli.test.ts` → SPEC-01, SPEC-03; updated
  `tests/bots/replacement.acceptance.test.ts` → SPEC-05, SPEC-06.
- End-to-end scenario for the Judge: run `npm run playtest -- --hands 2000 --lineup mixed --seed 42` and confirm
  it ends with `Invariant violations: 0` and `Bots replaced: N`; run the `--styles` replay above and confirm the
  `Options:` and `Line-up:` lines echo the chosen styles; open the two JSON files and read the two new
  justifications.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-6.26/qa.md`.
