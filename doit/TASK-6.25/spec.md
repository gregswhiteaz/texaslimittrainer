# Spec: TASK-6.25 — Keep every bot style inside its band in the Mixed line-up now that bots read opponents' actions

Status: READY (approved 2026-11-24)
Task: TASK-6.25 · Parent/epic: TASK-6 · Requirements: REQ-027 (027.1–027.6), REQ-007.5, REQ-007.7, REQ-007.8, REQ-026.2/026.3, REQ-029.2 · Dream: limit-holdem-trainer

## 1. Summary
Since TASK-7.32 the bots fold to bets, and that turned the Maniac into a big winner. At the preset Mixed table it
wins about +17 big bets per 100 hands and busts 0 times in 20,000 hands. Today a busted bot is replaced by a bot of a
random preset style (REQ-007.5), so the seats fill up with Maniacs: seed 42 has its second Maniac by hand 199, and
74% of bot seat-hands are Maniac by 10,000 hands. Every style's stats depend on how many Maniacs sit at the table,
so TAG and the Rock drift out of their bands.
The fix has two parts: a replacement bot keeps the style of the bot it replaces (approved via Q-1),
and the Maniac and Rock style files are retuned for a table that really has a Maniac in it (approved via Q-2). A prototype of
exactly this passes `--check-styles` at 100,000 hands on seeds 42, 7 and 1234 without changing any REQ-027 band.

## 1a. Investigation (measured, scratch scripts deleted)
The scripts ran the real `runPlaytest` (6-max cash, `lineUp: 'Mixed'`) and counted bot seats by their style at each
hand with `src/stats/style-stats.ts`, the same way `tests/bots/style-bands.acceptance.test.ts:41-80` does.

**Today, seed 42, 10,000 hands** (this reproduces the numbers in the task):

| Style | Seat-hands | Busts | VPIP | PFR | AGG |
|---|---|---|---|---|---|
| TAG | 6,121 | 16 | 19.0 | 12.0 | 34.8 |
| Calling station | 802 | 12 | 57.4 | 4.5 | 11.1 |
| Maniac | 36,969 | 16 | 55.3 | 49.6 | 75.9 |
| Rock | 6,108 | 20 | 7.6 | 6.6 | 31.8 |

Split by the number of *other* Maniacs at the table, TAG's stats are AGG 53.6 / PFR 14.4 with one other Maniac,
35.1 / 14.8 with two, and 30.8 / 10.2 with three or more. The Rock's AGG goes 43.8 → 42.9 → 26.9. So the drift comes
from **seat replacement**, not from a change in how TAG or the Rock decide. It also is not a measurement problem: the
check counts each bot seat under its style at that hand, which is correct.

**Cause.** The Maniac wins because the other bots fold to its bets (REQ-029.2: typical-player ranges). It makes
about +9 big bets per 100 hands from steals in pots that end preflop and about +8 after the flop. The Calling station
(−14), the Rock (−6) and TAG (+1) do not win like that. Replacement draws uniformly from the preset's styles
(`src/table/session.ts:547-556`, `src/bots/lineup.ts:133-143`), so seats move toward the style that never busts.
Before TASK-7.32 the Maniac busted fastest: it had 1,449 seat-hands at 10,000 hands
(`doit/TASK-7.32/spec.md` §1a). That means the bands were in practice tuned on a table with almost no Maniac in it.

**Keeping the composition fixed is not enough on its own.** Prototype: a busted bot rebuys with the same style. At
20,000 hands on seeds 42, 7 and 1234:

| Style | VPIP | PFR | AGG | Problem |
|---|---|---|---|---|
| TAG | 20.4–20.6 | 14.7–14.8 | 56.6–57.1 | in band |
| Calling station | 59.6–60.5 | 6.6–7.3 | 17.3–18.4 | in band |
| Maniac | 55.9–56.4 | 53.0–53.6 | **94.2–94.6** | AGG above 85: opponents fold to it or check to it, so it almost never calls |
| Rock | **7.8–7.9** | 6.4–6.7 | 51.5–**56.7** | VPIP below 8: it sits directly left of the Maniac (REQ-009.1 cycle) and mostly faces a raise. AGG reaches 56.7 on seed 1234 |

**Making the Maniac a loser instead does not work.** It stays dominant under every tested setting: postflop
`call→raise` cut to 0.2–0.3, `check→bet` cut to 0.4, or a postflop `fold→call` deviation added at 0.5–0.9. It wins
about +9 big bets per 100 hands preflop alone, and its PFR band (35–60) needs those raises. Cutting `check→bet`
lowers the Maniac's AGG but pushes TAG's AGG to 63.7–66.9, because TAG then bets into the pots the Maniac checks.

**Chosen prototype (P1):** replacement keeps the style. The Maniac gets `postflop call→raise` 0.6 → 0.2 and a new
`postflop fold→call` deviation at 0.8 (`check→bet` stays 0.6). The Rock gets `postflopValue.thresholdPct` 75 → 80
and the starting-range additions in §5. Results from the real CLI, `npm run playtest -- --hands 100000 --lineup
mixed --size 6 --check-styles`, which exits 0 on every seed:

| Seed | TAG V/P/A | Station V/P/A | Maniac V/P/A | Rock V/P/A |
|---|---|---|---|---|
| 42 | 20.4/14.6/59.5 | 60.5/7.2/18.7 | 56.1/53.2/82.3 | 8.7/7.2/50.1 |
| 7 | 20.6/14.8/59.3 | 60.2/6.8/18.4 | 56.1/53.2/82.2 | 8.8/7.3/49.5 |
| 1234 | 20.6/14.8/59.3 | 60.3/7.1/18.2 | 55.8/52.9/82.2 | 8.8/7.3/50.6 |

The smallest margins are TAG PFR (+0.6), Rock VPIP (+0.7) and Maniac AGG (−2.7). At 100,000 hands the standard error
is about 0.1, so each margin is at least 6 SE. With the Rock threshold left at 75, the Rock's AGG is 55.0–56.3, so
the threshold change is needed.

## 2. Scope
- In scope:
  - Replacement keeps the busted bot's style, in both the app (`nextHand`) and the playtest runner. It still gets a
    new name, a fresh buy-in and a new bot id (approved via Q-1).
  - Remove the now-unused random replacement-style code: `drawReplacementStyle`, `replacementStyles` and
    `replacementGenerator`.
  - Retune `maniac.json` and `rock.json` as in P1 (approved via Q-2). Rewrite the justifications and the Maniac description so
    they stay true.
  - Amend REQ-007.5 and retire REQ-007.7/007.8 in `dreams/limit-holdem-trainer/requirements.md`, with a changelog
    row. Approved by Q-1.
  - Update the TASK-6.25 sentence in `docs/advice/postflop-rules.md:209-210`.
  - Re-pin the locked tests that this moves (§5). Add one new fast acceptance file.
- Not doing:
  - Changing any REQ-027 band, `STYLE_BANDS`, the healthy ranges, the advice engine, the 6-max chart, `tag.json` or
    `calling-station.json`.
  - Changing the Mixed seat order (REQ-009.1), or letting bots read observed stats (REQ-029.2).
  - Making the Maniac a losing player, or TASK-6.12 (TAG beating weaker tables).
  - Editing `tests/bots/style-bands.acceptance.test.ts`, the style-bands part of
    `tests/playtest/check-styles.acceptance.test.ts`, or `.github/workflows/style-bands.yml`. They must pass as they
    are.
  - Moving any 100k-hand check into the normal suite.
- Scope budget: files=22, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Under Q-1 (a), `nextHand` no longer throws `RangeError('No replay code to draw a new bot from')`, because a replacement needs no draw. | yes | The throw only guarded the draw (`src/table/session.ts:574`). | Keep the throw as an invariant |
| A-2 | A Custom session also keeps the busted bot's style, the same rule as the presets. | yes | One rule. A Custom line-up is the user's explicit choice of styles. | Keep the uniform four-style draw for Custom |
| A-3 | `replacementGenerator`, `replacementStyles` and `drawReplacementStyle` are deleted, not left unused. Their unit tests in `tests/bots/lineup.test.ts` go too. | yes | They would be dead code. Stored sessions keep each seat's style, so the storage format does not change. | Keep them exported |
| A-4 | The Maniac description and justifications are rewritten in the style of the existing text. The new sentence about after-flop play reads roughly: "after the flop it calls most bets the pot odds say to fold, so it pays off your value bets". Descriptions are not shown in the UI (no reader under `src/ui`). | yes | REQ-026.3 needs a true description. | — |
| A-5 | The builder may move P1's numbers by small amounts (Rock range classes, Maniac probabilities within ±0.1) if a seed falls inside 0.3 of a band edge, and records the final values in the build notes. | yes | The prototype ran a scratch copy, and rounding of the JSON edits may differ. | Freeze P1 exactly |
| A-6 | `dreams/limit-holdem-trainer/rtm.md` is not edited by hand. It is the dream tooling's output, and TASK-7.32 did not edit it either. | yes | Same as the earlier requirement amendment. | Edit the RTM rows too |
| A-7 | The playtest `--styles` replay option stays. A replay line now prints `--styles` only for a custom `--styles` run, because a Mixed run never changes a seat's style. The replay test is re-pinned to a seeded `--styles` run. | yes | It is still used for replaying a given line-up. | Remove `--styles` |

## 3. Current system
- Replacement: in the playtest, `src/playtest/runner.ts:384-393` calls
  `drawReplacementStyle(lineUp, size, replayCode, seat)`. In the app, `src/table/session.ts:563-585` (`nextHand`)
  does the same at `:575`. The draw itself is `src/table/session.ts:545-556` → `replacementStyles`
  (`src/bots/lineup.ts:131-143`) → `replacementGenerator` (`src/engine/bot-random.ts:20-24`).
- Styles: `decideManiac` (`src/bots/maniac.ts:25-42`) plays a deviation's `instead` action. With `fold→call` it plays
  `call`, which is always legal when fold is offered postflop. `DEVIATION_PAIRS` already allows `postflop/fold/call`
  (`src/bots/style.ts:42-51`), so no code change is needed. The Rock's range must be a strict subset of the TAG
  chart's non-fold cells for each spot (`src/bots/style.ts` `parseStartingRange`; chart: HJ raise 14 classes, CO
  raise 18, BTN raise 24, SB blind-defence 23).
- Bands: `STYLE_BANDS` is at `src/playtest/style-check.ts:28-33`, and the same bands are in
  `tests/bots/style-bands.acceptance.test.ts:25-30`.
- Commands (`package.json`): `npm test` = `vitest run --coverage`; `npm run test:slow` = `TLH_SLOW_TESTS=1 vitest run
  <list>` (already lists `style-bands` and `check-styles`). Also `npm run lint`, `npm run typecheck`,
  `npm run format` and `npm run playtest`.
- Baseline: the default all-TAG playtest output (`npm run playtest --silent -- --hands 2000 --seed 42`) has SHA-256
  `d9800984fb821e281de45532b56823c2d60ff08afcc30a23171ee335de1bb8a3` at base `49bafa5`. Without a line-up there are
  no style bots and no replacements, so it must not change.
- Existing code to reuse:
  - `src/stats/style-stats.ts` (`handStyleCounts`, `addStyleCounts`, `styleStats`) and `runPlaytest` → the new fast
    test, built like `tests/bots/style-bands.acceptance.test.ts:41-80`.
  - `nextReplacementName` (`src/bots/lineup.ts:157`) → unchanged naming.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Stop the composition drift by having a replacement keep the busted bot's style, for presets and Custom alike. | (b) draw from the preset styles the table is short of; (c) playtest only: the app keeps random styles; (d) make the Maniac lose (measured: not achievable inside its bands) | §1a: the drift is the cause, and it reaches app sessions within 150–800 hands | yes | User via Q-1 (2026-11-24, auto-accepted; reverses Q-113, flagged for user review) |
| D-2 | Retune the Maniac (postflop call→raise 0.2, new fold→call 0.8) and the Rock (value bar 80, wider ranges after a raise). | Maniac: drop call→raise entirely (AGG 80.9); cut check→bet (TAG AGG goes over 65) | P1 is the only tested set that puts every style in band on all three seeds | yes | User via Q-2 (2026-11-24, auto-accepted) |
| D-3 | Keep the bands and the band tests exactly as they are. | Loosen the bands (ruled out by the user) | AC wording | no | n/a |

## 5. Design

### Files to create / modify
- `src/playtest/runner.ts` — replacement style = the busted seat's current style. Drop the `drawReplacementStyle`
  import. Update the doc comment at `:341-345`.
- `src/table/session.ts` — `nextHand`: `style = current.style`. Delete `drawReplacementStyle` and the replay-code
  throw (A-1). Update the doc comment at `:558-562`.
- `src/bots/lineup.ts` — delete `replacementStyles` (A-3).
- `src/engine/bot-random.ts` — delete `replacementGenerator` (A-3).
- `src/bots/styles/maniac.json` — `postflop/call/raise` 0.2; add `{postflop, fold, call, 0.8}` with a justification;
  new description sentence (A-4).
- `src/bots/styles/rock.json` — `postflopValue.thresholdPct` 80 plus its justification. Range additions: HJ raise
  `+AJs KQs AQo 99 88`; CO raise `+KQs KJs 99 88 AJo QJs`; BTN raise `+KJs KTs QJs AJo 88 77 KQo ATs QTs`; CO
  raise-and-calls `+KQs AQo`; BTN raise-and-calls `+KJs AJo`; SB blind-defence `+ATs KJs KQo 88 77`. The
  justifications are updated to match.
- `dreams/limit-holdem-trainer/requirements.md` — REQ-007.5 reworded; REQ-007.7/007.8 marked retired; changelog row
  1.11.
- `docs/advice/postflop-rules.md` — replace the "handled by TASK-6.25" sentence with the cause and fix in two
  sentences.
- `tests/playtest/mixed-composition.acceptance.test.ts` — new, fast: SPEC-04, SPEC-05.
- Locked re-pins, unlocked under their owners with reason "TASK-6.25 Q-1/Q-2" (`doit/TASK-6.25/qa.md`) (the prototype's normal-suite run had 13 failures in 9 files, plus the deletions in A-3). Each edit
  replaces values one for one and keeps the number of checks:
  - `tests/bots/maniac.acceptance.test.ts` (TASK-6.4): the deviation list; the "raises at more points than TAG" example.
  - `tests/bots/calling-station-postflop.acceptance.test.ts` (TASK-6.17): the pinned Maniac postflop probabilities.
  - `tests/bots/rock.acceptance.test.ts` (TASK-6.5): `COUNTS` and the spot sizes.
  - `tests/bots/rock-postflop.acceptance.test.ts` (TASK-6.16/6.17): 75 → 80 (title and values).
  - `tests/bots/replacement.acceptance.test.ts` (TASK-6.8): the style-draw tallies become same-style checks; the
    names test is unchanged.
  - `tests/playtest/replacement.acceptance.test.ts` (TASK-6.8/6.17): the style equals the previous style at the seat;
    the replay-line test changes per A-7.
  - `tests/table/replace-bot.acceptance.test.ts` (TASK-6.8) and `tests/storage/session-records.acceptance.test.ts` (not hook-locked):
    the expected style is the busted bot's style.
- Unlocked: `tests/bots/maniac.test.ts`, `tests/bots/style.test.ts`, `tests/table/next-hand.test.ts`,
  `tests/bots/lineup.test.ts`.

### Components, interfaces and data
- There is no new API. `nextHand(table)` keeps its signature. A replaced seat is
  `{ seat, kind: 'bot', name: <next replacement name>, style: <previous style> }` with stack `buyIn(stake)` and the
  next bot id. The playtest's `PlayedHand.replaced` still lists the replaced seats.
- Invariant: in a cash line-up run, the multiset of bot styles at every hand equals that of the starting line-up.

### Rules and algorithms
- Example: Mixed 6-max, seat 3 (Calling station "Ben") ends a hand on $0. The next hand seats "Jay", a Calling station
  with $160. Seats 2, 4, 5 and 6 are unchanged.

### Error handling and configuration
- `nextHand` keeps `RangeError('Not a next-hand step')`. The replay-code `RangeError` is removed (A-1).

## 6. Behaviour specification

### SPEC-01: Every style is inside its REQ-027 band in the opt-in style-bands check
- Verifies: AC#1
- Behaviour: Given the Mixed 6-max line-up with bots on action ranges, When `TLH_SLOW_TESTS=1` runs
  `tests/bots/style-bands.acceptance.test.ts` (100,000 hands each on seeds 42, 7 and 1234), Then each style's VPIP,
  PFR and Aggression, rounded to 0.1, lie inside the REQ-027 bands (TAG 18–26/14–22/45–65; Calling station
  45–65/3–10/10–25; Maniac 50–75/35–60/65–85; Rock 8–15/6–12/35–55). The test file is not edited.
- Verification: acceptance `tests/bots/style-bands.acceptance.test.ts::every bot style is inside its style band over 100,000 Mixed 6-max hands (seed 42)`

### SPEC-02: The style-bands workflow commands exit 0
- Verifies: AC#2
- Behaviour: Given the fix, When each step of `.github/workflows/style-bands.yml` runs
  (`npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed <s>` for s = 42, 7, 1234), Then
  each exits 0 and prints `Style check: passed`. The workflow file is unchanged.
- Verification: command `for s in 42 7 1234; do npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed $s | grep -x 'Style check: passed' || exit 1; done` (then manual: `gh workflow run style-bands.yml --ref doit/TASK-6.25` once the branch is pushed, and the run succeeds)

### SPEC-03: The slow 100,000-hand check-styles test passes
- Verifies: AC#3
- Behaviour: Given the fix, When `TLH_SLOW_TESTS=1` runs the check-styles 100k test, Then it passes for seeds 42, 7
  and 1234 with `Invariant violations: 0`, no `Outside band:` or `One action only:` lines, and `Style check: passed`.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::playtest style stats (--check-styles) 100,000 Mixed 6-max hands pass --check-styles on seeds 42, 7 and 1234`

### SPEC-04: A busted bot is replaced by a bot of the same style (fast, every push)
- Verifies: AC#1, AC#3
- Behaviour: Given a 2,000-hand Mixed 6-max cash playtest on seed 42, When any bot busts, Then the next hand seats a
  bot with a new name, $160 and the same style at that seat. At every hand the bot styles are the starting multiset
  {TAG ×2, Calling station, Maniac, Rock}, and at least one replacement happens. Given the app `nextHand` with a
  Custom or preset table where a bot ends on $0, Then the new seat has the busted bot's style.
- Verification: acceptance `tests/playtest/mixed-composition.acceptance.test.ts::a busted bot is replaced by a new bot of the same style and the Mixed line-up keeps its styles`

### SPEC-05: The style files hold the retuned parameters
- Verifies: AC#1, AC#3
- Behaviour: Given the shipped style files, Then: `MANIAC_STYLE` has postflop `call→raise` 0.2, `check→bet` 0.6 and
  `fold→call` 0.8, each justification at least 10 words, and a description that no longer says it folds after the
  flop when the price is wrong; `ROCK_STYLE.postflopValue.thresholdPct` is 80 and every starting-range spot is
  still a strict subset of the TAG chart (`parseStyle` accepts it). Given a postflop view where the advice is fold,
  When the Maniac's draw falls under 0.8, Then it calls.
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::the Maniac style file holds its deviation parameters and a description`

### SPEC-06: All-TAG play is unchanged
- Verifies: AC#1
- Behaviour: Given no line-up (all TAG), When `npm run playtest --silent -- --hands 2000 --seed 42` runs, Then its
  SHA-256 is `d9800984fb821e281de45532b56823c2d60ff08afcc30a23171ee335de1bb8a3` (base value). The slow all-TAG
  healthy-range checks (`tests/advice/postflop-folding.acceptance.test.ts`,
  `tests/stats/healthy-ranges-tag.acceptance.test.ts`) still pass.
- Verification: command `test "$(npm run playtest --silent -- --hands 2000 --seed 42 | shasum -a 256 | cut -d' ' -f1)" = d9800984fb821e281de45532b56823c2d60ff08afcc30a23171ee335de1bb8a3`

### SPEC-07: Requirements and docs record the change
- Verifies: AC#1
- Behaviour: REQ-007.5 reads "…a new bot of the same style takes the seat with a fresh buy-in…". REQ-007.7 and
  REQ-007.8 are marked retired (TASK-6.25 Q-1). The changelog has a row 1.11. `docs/advice/postflop-rules.md` no
  longer says "handled by TASK-6.25" and states the cause and fix.
- Verification: manual `grep -n "REQ-007.5\|REQ-007.7\|REQ-007.8\|1.11" dreams/limit-holdem-trainer/requirements.md; grep -n "TASK-6.25" docs/advice/postflop-rules.md`

## 7. Edge cases
- Two bots bust in one hand: each keeps its own style and gets a unique name (SPEC-04; the re-pinned
  `replace-bot.acceptance` two-busts test).
- Sit-and-go: no replacement (REQ-008.4), unchanged.
- A hand with a violation resets to the preset (`runner.ts:376-381`), unchanged.
- Heads-up and other sizes: the same rule; there is no size-dependent draw left.
- Resumed old sessions: seats store their style, so the format is unchanged.

## 8. Security considerations
N/A: no new input, dependency, storage format or randomness. Removing a random draw makes replacements fully
reproducible.

## 9. Non-functional
- The new fast test plays 2,000 hands (about 4 s). The 100k checks stay in the opt-in slow group
  (about 4 min per seed).

## 10. Test plan
- Test command: `npm test` (plus `npm run test:slow` for SPEC-01/03/06)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`
- New tests: `tests/playtest/mixed-composition.acceptance.test.ts` → SPEC-04 (SPEC-05 is covered by the re-pinned
  locked files).
- Judge end to end: run SPEC-02's loop and check `Style check: passed` ×3. Run `npm run test:slow`. Play an app cash
  session with Mixed until a bot busts, and check that the new bot has the old bot's style.

## 11. Open questions
None. Q-1 → (a), a replacement keeps the busted bot's style (D-1). Q-2 → the recommended Maniac retune with the Rock changes (D-2). See `doit/TASK-6.25/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.25/qa.md`.
