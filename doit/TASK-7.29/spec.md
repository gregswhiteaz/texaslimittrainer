# Spec: TASK-7.29 — Decide the hand order and re-raise scaling for observed-opponent ranges

Status: READY (approved 2026-11-26)
Task: TASK-7.29 · Parent/epic: TASK-7 · Requirements: REQ-035 (035.2, 035.6), REQ-061.2, REQ-029.2 · Dream: limit-holdem-trainer

## 1. Summary
A decision spike. Once an opponent has been watched for 30 hands, TASK-7.13 rebuilds their preflop range as
the strongest `width` % of a hand order that ranks hands by equity against one random hand. Every raising line
is scaled toward PFR and every calling line toward VPIP. The review found two problems. The order puts
K2o/Q2o/J2o above 87s/76s/65s. PFR scaling turns a 22/18 player's UTG four-bet range from 2.56% into 18% at
100 hands. This spec gave the user measured facts and the costed options. The user chose (qa.md, 2026-11-26):
- Q-1 B: resize the authored default range instead of replacing it.
- Q-2 B: rank hands by equity against three random hands.
- Q-3 C: scale three-bet and four-bet lines by PFR relative to a typical PFR.
- Q-4 a: a follow-up spike for open-raise and calling lines.

This task records that choice as a Backlog decision, rewords REQ-035.6 and adds changelog row 1.14. It creates
follow-ups FU-A, FU-B and FU-C, which list the expectations to re-pin. It changes no product code.

## 2. Scope
- In scope:
  - Record the user's choice (Q-1 B, Q-2 B, Q-3 C, Q-4 a) as one Backlog decision (SPEC-01).
  - Builder: reword REQ-035.6 and add changelog row 1.14 in `dreams/limit-holdem-trainer/requirements.md`,
    using the exact text in §5 (SPEC-02). Nothing else. REQ-035.2 is unchanged, because Q-3 C still scales
    toward VPIP and PFR.
  - Orchestrator (at finish, CLI only): create the decision (SPEC-01), FU-A, FU-B and FU-C (SPEC-04), the
    TASK-7.29 notes (SPEC-03), and tick AC#1 with pointers (SPEC-05).
- Not doing:
  - Changing `src/advice/ranges.ts`, `src/advice/ranges/hand-order.json`, `src/stats/style-stats.ts`, the session
    record, any doc under `docs/`, or any test. That work belongs to the follow-ups.
  - Changing the default ranges (`src/advice/ranges/*.json`), the narrowing rule (REQ-035.5), the 30-hand
    threshold or the `d + (o − d) × min(n,100) ÷ 100` blend.
  - Bots. They never receive observed stats (REQ-029.2, `src/advice/recommend.ts:26-29` gives the snapshot only to
    the user's advice), so no option changes bot play or the playtest output.
  - Deciding open-raise and calling-line scaling. Per Q-4 a, that goes to the FU-C spike.
  - Any speed or scale check. The standing rule keeps those in the opt-in `npm run test:slow` group.
- Scope budget: files=1, lines=2   (`requirements.md` only: 1 changed clause line (REQ-035.6) and 1 new
  changelog row. Backlog task, decision and doc files are written by the CLI and are not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice> (TASK-7.29 Q-1..Q-4)" -s accepted --plain`. The evidence tables go in TASK-7.29's implementation notes and final summary. | yes | The CLI has no body option. decision-1 to decision-4 used the same path. CLAUDE.md forbids editing decision files by hand. | Edit the decision file by hand (forbidden). |
| A-2 | Each changed topic gets its own follow-up story under TASK-7: FU-A for range construction and hand order (Q-1/Q-2), FU-B for re-raise scaling (Q-3), and the FU-C spike (Q-4 a). FU-A depends on TASK-7.29. FU-B depends on FU-A, because both edit `estimateOpponentRanges` (`src/advice/ranges.ts:622-662`). FU-C depends on FU-B, so the spike measures the rules as they will be. | yes | Different code, tests and docs per topic. Small, reviewable stories, as TASK-7.21 did. | One combined story. |
| A-3 | The figures in §3 come from the project's own code on this branch: `rangeWidthPct`, `scaledWidthPct`, `strongestClasses` and `computeEquity` (seeded, REQ-034.3). Probe scripts lived in the session scratchpad and are not committed. | yes | Reproducible from the cited functions. Committing probe tools is outside scope. | Commit a `tools/` probe. |
| A-4 | The "typical PFR" in Q-3 C is the midpoint of the healthy PFR band for the table's reference size in `src/stats/healthy-ranges.json`: heads-up 57.5, 6-max 18, full ring 12.5. The user approved Q-3 C as worded with these midpoints. | yes | It is already authored, justified data per size. At 6-max an ordinary 22/18 player keeps every default re-raise width. | A fixed 18 for all sizes; the seat's default open-raise width. |
| A-5 | FU-A's narrowing rule: take the default classes in hand order, strongest first, and keep the shortest run whose combos reach the width. The floor is the default range's strongest class. That is AA for every open-raise line, so the locked width-0 → AA tests survive. Widening adds hand-order classes not in the default, strongest first, until the combos reach the width. Width ≥ 100 gives all 169 classes. | yes | Deterministic. Matches Q-1 B exactly at the default width. Consistent with TASK-7.13 A-1 (never narrower than asked). | Floor always AA, even for calling lines that exclude AA. |

## 3. Current system
Facts the decision rests on (all opened and checked, or measured with the project's code per A-3):

- **Where the rule lives.**
  - `estimateOpponentRanges(view, observed)` is at `src/advice/ranges.ts:622-662`.
  - For a live opponent with at least `OBSERVED_MIN_HANDS` (30) hands on a scaled line, it computes
    `widthPct = scaledWidthPct(d, obs[stat], hands)` and replaces the default classes with
    `strongestClasses(widthPct)` (`:643-647`).
  - The line → stat map is `OBSERVED_LINE_STAT` (`:580-588`): `open-raise`, `three-bet` and `four-bet` → `pfr`;
    `limp`, `call-raise` and `call-three-bet` → `vpip`; `check` → none.
  - `scaledWidthPct` is at `:347-350`. `strongestClasses` (shortest prefix of `HAND_ORDER`, at least AA) is at
    `:353-364`. `HAND_ORDER` comes from `src/advice/ranges/hand-order.json`, validated by `parseHandOrder`
    (`:261-311`), which requires equities in non-increasing order and AA first.
  - Scaling now runs at every table size, through `rangesFor(view.players.length)` (`:631`).
  - The rule is TASK-7.13 D-1 and A-8 (`doit/TASK-7.13/spec.md`, §2 and §4): the order is equity against one
    random hand, and the scaled range is wholly the prefix, even when `o = d`. REQ-035.6
    (`dreams/limit-holdem-trainer/requirements.md:646`) fixes "o is the observed PFR for raising ranges or VPIP
    for calling ranges". REQ-035.2 (`:642`) says "scaled toward their observed VPIP and PFR by a documented
    formula". No REQ names the hand order.
- **Hand order evidence** (`hand-order.json`, rank and equity):
  - K2o #87 (50.5) is above 87s #99 (48.1). Q2o #108 (47.1) is above 76s #116 (45.2). J2o #123 (44.1) is above
    65s #128 (43.1). T2o #135 is above 54s #136.
  - Measured by cumulative width, 87s first enters a scaled range at 55.4%, 76s at 65.3% and 65s at 72.5%. K2o
    enters at 48.1% and Q2o at 60.5%. So a 60%-VPIP caller's range holds Q2o and K2o but not 76s or 65s.
- **The prefix also throws away the authored shape (A-8).** At the default width itself, the prefix differs from
  the authored 6-max range:
  - BB `call-raise` (41.48%): the prefix drops 22, 54s, 65s, 76s, 87s, 98s and other suited connectors, and adds
    AA, KK, QQ, JJ, AKs, AQs, AKo and AQo. Those are hands that would have 3-bet, not called.
  - BTN `call-raise` (23.23%): it drops 22, 33, 44, JTs, T9s, 98s, 87s, 76s and 65s, and adds AA, KK, QQ, AKs and
    AKo.
  - So an observed player whose stats exactly match the default gets a different, less realistic range than an
    unobserved one.
- **Alternative computed orders** (measured with seeded `computeEquity`, ranks out of 169; about 1.3 s each):

  | Hand | vs 1 random (today) | vs 2 random | vs 3 random | vs 6-max BTN open range (34.5%) |
  |---|---|---|---|---|
  | K2o | 87 | 99 | 112 | 88 |
  | Q2o | 108 | 127 | 131 | 122 |
  | J2o | 123 | 141 | 144 | 147 |
  | 87s | 99 | 83 | 68 | 76 |
  | 76s | 116 | 94 | 81 | 83 |
  | 65s | 128 | 109 | 93 | 91 |
  | 54s | 136 | 121 | 109 | 98 |
  | 22 | 85 | 104 | 116 | 51 |
  | T9s | 63 | 44 | 35 | 63 |

  "vs 3 random" fixes all three named inversions by the widest margin, but drops small pairs (22 to #116). "vs
  BTN open" keeps pairs high (22 #51), but K2o (#88) stays close to 76s (#83). All three alternatives keep AA
  #1, so `parseHandOrder`'s AA-first rule holds.
- **Re-raise scaling evidence** (6-max default widths; values at 100 hands, where the width equals `o`):

  | Line | Default | 22/18 now | 60/45 now | 12/9 (Rock-like) now |
  |---|---|---|---|---|
  | UTG open-raise | 12.22 | 18.00 | 45.00 | 9.00 |
  | UTG three-bet | 3.77 | 18.00 | 45.00 | 9.00 |
  | UTG four-bet | 2.56 | 18.00 | 45.00 | 9.00 |
  | BTN three-bet | 8.90 | 18.00 | 45.00 | 9.00 |
  | BB three-bet | 5.73 | 18.00 | 45.00 | 9.00 |

  Every re-raise line converges on PFR, whatever the seat. Even a tight 12/9 player's UTG four-bet range
  becomes wider than the default (9% against 2.56%). At 30 hands the UTG four-bet is already 7.19% (16 classes)
  for a 22/18 player.
- **Is a 3-bet stat available?** No.
  - `StyleCounts` (`src/stats/style-stats.ts:15-32`) counts only `voluntary` and `preflopRaised` preflop. Any
    preflop raise counts, so PFR does not tell an open from a 3-bet.
  - The figure is cheap to compute: `handStyleCounts` (`:46-74`) already reads every preflop action, so "faced
    exactly one raise and could act" and "re-raised" are a few lines each.
  - Carrying it to the advice is not cheap. It needs two new `StyleCounts` fields (also in
    `EMPTY_STYLE_COUNTS` and `addStyleCounts`).
  - It also changes the persisted session record: `SessionRecordObserved` stores only
    `hands/vpipHands/pfrHands` (`src/table/session-record.ts:35-45`), and the parser and restorer are at
    `:258-290`. Older stored sessions lack the new fields, so they must stay optional to keep the locked
    `tests/table/observed-record.acceptance.test.ts` (TASK-8.6) green.
  - Further changes: `ObservedOpponent` and its validation (`src/advice/ranges.ts:321-329`, `:597-615`),
    `userObservedSnapshot` (`src/table/session.ts:606-627`), the worker message type
    (`src/ui/advice/advice-client.ts:24-30`), the golden `opponentStats` parser, which accepts only
    `{hands, vpip, pfr}` (`src/advice/golden.ts:290-300`), and REQ-035.2/.6.
  - The sample is thin: 3-bet chances come up in a fraction of hands, so 30 hands give only a handful.
- **Who supplies the snapshot today.** The user's hint, decision record and review pass it
  (`src/table/advice-service.ts:76-82`, `src/table/hand-record.ts:209-210`, `src/table/review.ts:82-90`). Stored
  hand records keep the grade computed at decision time (`src/table/hand-record.ts:180-203`). A model change
  affects new decisions only and rewrites no stored data.
- **Tests that pin today's behaviour.** Locked tests (owner task), and what each option does to them:
  - `tests/advice/observed-ranges.acceptance.test.ts` (TASK-7.13):
    - AC#2 (`:116-155`) asserts `start == expandRange(strongestClasses(width), dead)` for an `open-raise` (PFR)
      and a `call-raise` (VPIP) opponent. It breaks under Q-1 (B), resize. It breaks under Q-4 (b) only for the
      open-raise half. It survives any order change, because it calls `strongestClasses` itself.
    - AC#6 (`:198-212`): width 0 gives AA only. It survives if AA stays #1 and resize keeps the AA floor for
      open-raise.
    - AC#5 (the formula numbers) survives every option.
  - `tests/advice/observed-range-tidy.acceptance.test.ts` (TASK-7.30) AC#1 (`:82-98`): a CO open-raiser seen for
    100 hands with PFR 0 has width 0, which gives the 6 AA combos. It survives every option if the AA floor stays.
  - `tests/advice/preflop.acceptance.test.ts:317` (TASK-7.2) lists `src/advice/ranges/hand-order.json` in its
    sandbox list. It survives as long as the file keeps its path.
  - `tests/table/observed-record.acceptance.test.ts` (TASK-8.6) pins the stored `observed` entry shape. It is
    affected only by Q-3 (D).
  - Golden data `tests/golden/postflop-spots.json` (TASK-7.14) has 4 spots that use `opponentStats`, at lines 277,
    799, 828 and 1181 (`6max-flop-btn-raise-a8s`, `6max-turn-bb-call-a6s`, `6max-turn-btn-fold-55`,
    `6max-river-bb-bet-aks`). `tests/golden/postflop.acceptance.test.ts` AC#2/AC#5 require them to stay
    clear-cut and in agreement. Every change option must re-verify these 4.
  - Relational locked tests compare the advice with `recommend(...)` for the same snapshot and survive:
    `tests/advice/determinism.acceptance.test.ts`, `tests/table/hinted.acceptance.test.ts`,
    `tests/ui/hint-worker.acceptance.test.ts`, `tests/ui/hint.acceptance.test.tsx`,
    `tests/table/decision-record.acceptance.test.ts` and `tests/table/observed-resume.acceptance.test.ts`.
    `tests/ui/review-numbers.acceptance.test.tsx:181-189` pins equities, but only with typical-player bases.
  - Unlocked tests that will change: `tests/advice/observed-ranges.test.ts` "hand order" (`:139-207`), which
    recomputes equity against one random hand, and "scales each line by its stat" (`:248-271`).
  - Docs: `docs/advice/range-model.md:270-293` (the stat table, the hand order and "Known limits") and the
    `hand-order.json` justification.
- Existing code to reuse (for the follow-ups, not this task):
  - `computeEquity` with `unseenCombos` or `expandRange(defaultRange(...))` → generates any computed order,
    reproducibly (the TASK-7.13 rule 7 procedure).
  - `parseHandOrder` → validates any new order unchanged (format `tlh-hand-order` v1 holds a re-ranked list).
  - `rangeWidthPct`, `scaledWidthPct`, `defaultRange` and `comboCount` → resize-the-default construction.
  - `src/stats/healthy-ranges.json` → the typical PFR for Q-3 (C) (A-4).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | An observed range is the authored default range resized by the hand order (rule A-5), not a prefix of the order. This reverses TASK-7.13 A-8. | (A) keep the prefix | At the default width an observed player keeps the authored range. Today the prefix swaps 22, 76s and 65s for AA, KK, QQ and AKs in BB call-raise. Re-pins only observed-ranges AC#2. | yes | user (Q-1) |
| D-2 | The hand order ranks classes by equity against three random hands, generated with seeded `computeEquity` and stored in `hand-order.json` (format v1, D-6). | (A) vs 1 random; (C) vs 6-max BTN open range; (D) hand-authored | Gives 87s #68, 76s #81 and 65s #93 above K2o #112, Q2o #131 and J2o #144. Reproducible. Under D-1 it decides only the margins. | yes | user (Q-2) |
| D-3 | `three-bet` and `four-bet` use o = min(100, d × observed PFR ÷ typical PFR), with typical PFR per A-4. The blend formula and the 30-hand threshold are unchanged. `open-raise` keeps raw PFR and calling lines keep raw VPIP. | (A) keep raw PFR; (B) unscaled; (D) new 3-bet stat | A 22/18 player keeps 2.56% (not 18%). Maniacs and rocks are still read. No new stat, persisted-format change or locked re-pin. | yes | user (Q-3) |
| D-4 | Open-raise and calling-line scaling is decided in the FU-C spike, not here. | (b) ratio on open-raise in FU-B; (c) known limit only | Outside this task's question. The ratio rule would push loose callers to 100%, so it needs its own design. | yes | user (Q-4) |
| D-5 | This task records the decision and any REQ change. All code, data, docs and test re-pins go to follow-ups. | Implement in this spike | Spike scope (task labels); TASK-7.21 D-3 pattern | no | n/a (task text) |
| D-6 | `hand-order.json` keeps format `tlh-hand-order` version 1 and its path under every order option. | New format | `parseHandOrder` accepts any equity-descending, AA-first list (`src/advice/ranges.ts:261-311`); keeps `tests/advice/preflop.acceptance.test.ts:317` green | no | n/a (codebase) |

## 5. Design

### Files to create / modify
- `dreams/limit-holdem-trainer/requirements.md` — replace the REQ-035.6 line (line 646) and append changelog
  row 1.14 after line 1373, both with the exact text in "Requirement text" (SPEC-02).

### Components, interfaces and data
None changed in this task (D-5).

### Option costs (the factual basis for Q-1 to Q-3)
| Option | Code touched (follow-up) | Locked re-pins | REQ change |
|---|---|---|---|
| Q-1 (A) prefix, today | none | none | none |
| Q-1 (B) resize the authored default | `estimateOpponentRanges`, `strongestClasses` (or a new helper) | observed-ranges AC#2 | none (REQ-035.2 already says "documented formula") |
| Q-2 any new computed order | `hand-order.json` regenerated, justification rewritten | none (D-6) | none |
| Q-2 (D) authored order | the same, plus 169 hand placements for the user to sign off | none | none |
| Q-3 (B) re-raise lines unscaled | `OBSERVED_LINE_STAT` | none | REQ-035.6 |
| Q-3 (C) ratio to typical PFR | one function + healthy-range lookup | none | REQ-035.6 |
| Q-3 (D) new 3-bet stat | style-stats, session record (persisted), snapshot, worker message, golden parser, ranges | observed-record (if fields are not optional) | REQ-035.2, REQ-035.6 |

Q-3 (C) values at 100 hands, 6-max, with `o = min(100, d × PFR ÷ 18)`:

| Line | Default | 22/18 | 60/45 | 12/9 | 55/6 |
|---|---|---|---|---|---|
| UTG three-bet | 3.77 | 3.77 | 9.43 | 1.89 | 1.26 |
| UTG four-bet | 2.56 | 2.56 | 6.41 | 1.28 | 0.85 |
| BTN three-bet | 8.90 | 8.90 | 22.25 | 4.45 | 2.97 |
| BB three-bet | 5.73 | 5.73 | 14.33 | 2.87 | 1.91 |

### Requirement text (SPEC-02, exact)
- REQ-035.6, line 646, becomes:
  `  - REQ-035.6: Observed-statistics scaling uses width = d + (o − d) × min(n, 100) ÷ 100, where d is the default range width and n is the number of observed hands; o is the observed PFR for open-raise ranges, the observed VPIP for calling ranges, and d × observed PFR ÷ typical PFR (at most 100) for three-bet and four-bet ranges, where typical PFR is the midpoint of the healthy PFR range for the table size (REQ-046.1).`
- New last line of the changelog table, after line 1373:
  `| 1.14 | 2026-11-26 | TASK-7.29: REQ-035.6 scales observed three-bet and four-bet ranges by PFR relative to the typical PFR for the table size instead of by raw PFR | User (TASK-7.29 Q-3) |`

### Follow-up stories (created by the orchestrator at finish; SPEC-04)
All three use the command pattern `backlog task create "<title>" -p TASK-7 -l dream-limit-holdem-trainer,follow-up -m m-1
--priority Medium --type enhancement --ref doit/TASK-7.29/spec.md --ref dreams/limit-holdem-trainer/requirements.md
--doc doc-104 -d "<description>" --ac "<AC>" ... --dep <deps> --plain`, with each AC passed as its own `--ac`.
FU-C uses `-l dream-limit-holdem-trainer,follow-up,spike`. Create them in order FU-A, FU-B, FU-C, so each id is
known for the next one's `--dep`.

**FU-A** — title: `Resize the authored opponent range and rank hands by three-way equity when scaling observed opponents`
- Depends on: TASK-7.29.
- Description: "Follow-up from TASK-7.29 (decision: Q-1 B resize the authored default range, Q-2 B hand order by
  equity against three random hands). Today estimateOpponentRanges replaces an observed opponent's range with the
  strongest width % of the hand order (TASK-7.13 A-8), so at the default width the 6-max BB call-raise range
  swaps 22, 54s-98s for AA, KK, QQ, JJ, AKs, AQs, AKo, AQo. The order (equity against one random hand) ranks
  K2o #87, Q2o #108 and J2o #123 above 87s #99, 76s #116 and 65s #128. Build the observed range by resizing the
  authored default with TASK-7.29 rule A-5, and regenerate src/advice/ranges/hand-order.json (format v1, same
  path) by seeded computeEquity against three random hands. Facts and locked-test map: doit/TASK-7.29/spec.md
  §3. Locked re-pin: tests/advice/observed-ranges.acceptance.test.ts AC#2 (owner TASK-7.13) asserts the prefix
  rule and must be unlocked and re-pinned under its owner to the resize rule; AC#5 and AC#6 and
  tests/advice/observed-range-tidy.acceptance.test.ts AC#1 (TASK-7.30) must pass unchanged. Re-verify the 4
  observed golden postflop spots (tests/golden/postflop-spots.json lines 277, 799, 828, 1181). Any full
  169-class recomputation check goes only in the opt-in npm run test:slow group."
- ACs:
  1. `Given an observed opponent whose scaled width equals the default width, When the range is estimated, Then the start classes equal the authored default range`
  2. `Given a scaled width above the default, When the range is estimated, Then it is the default plus hand-order classes not in the default, strongest first, up to the first count of combos that reaches the width (all 169 classes at 100 or more)`
  3. `Given a scaled width below the default, When the range is estimated, Then it is the shortest strongest-first run of the default classes, in hand order, whose combos reach the width, and never less than the default's strongest class`
  4. `Given the regenerated hand-order.json, When it loads, Then AA is first, 87s, 76s and 65s rank above K2o, Q2o and J2o, and spot-checked stored equities match seeded computeEquity against three random hands`
  5. `Given the locked observed-ranges AC#2 (TASK-7.13), When the rule changes, Then it is unlocked and re-pinned under its owner to the resize rule with the edit listed in the task notes, and observed-ranges AC#5, AC#6 and observed-range-tidy AC#1 pass unchanged`
  6. `Given the 4 observed golden postflop spots, When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-justified with the user's sign-off`
  7. `Given docs/advice/range-model.md and the hand-order justification, When the story is done, Then they describe the resize rule and the three-random-hands order and drop the matching Known limits sentence`

**FU-B** — title: `Scale observed three-bet and four-bet ranges by PFR relative to a typical player`
- Depends on: FU-A.
- Description: "Follow-up from TASK-7.29 (decision: Q-3 C). Today every three-bet and four-bet line scales toward
  raw PFR, so a 22/18 player's 6-max UTG four-bet range goes 2.56% to 18% at 100 hands and even a 12/9 player's
  goes to 9%. Apply REQ-035.6 as reworded by TASK-7.29: for three-bet and four-bet lines o = min(100, d x
  observed PFR / typical PFR), typical PFR = midpoint of the healthy PFR band in src/stats/healthy-ranges.json
  (heads-up 57.5, 6-max 18, full ring 12.5); open-raise keeps raw PFR and calling lines raw VPIP; blend formula
  and 30-hand threshold unchanged. No new stat, no persisted-format change; no locked test should need a re-pin
  (observed-ranges AC#2 covers only open-raise and call-raise). Expected values: doit/TASK-7.29/spec.md §5.
  Re-verify the 4 observed golden postflop spots."
- ACs:
  1. `Given a 6-max UTG four-bettor seen for 100 hands with PFR 18, When the range is estimated, Then its scaled width is 2.56% (the default), within 0.01`
  2. `Given the same seat with PFR 45 or PFR 9 at 100 hands, When the range is estimated, Then the width is 6.41% or 1.28% respectively, within 0.01`
  3. `Given heads-up and full-ring tables, When a three-bet or four-bet range is scaled, Then the typical PFR is 57.5 and 12.5 respectively, and o is capped at 100`
  4. `Given open-raise and calling lines, When ranges are scaled, Then they are unchanged from FU-A (raw PFR and raw VPIP)`
  5. `Given the 4 observed golden postflop spots, When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-justified with the user's sign-off`
  6. `Given docs/advice/range-model.md, When the story is done, Then its line-to-stat table and Known limits state the relative re-raise rule`

**FU-C** — title: `Decide position-aware scaling for observed open-raise and calling ranges`
- Depends on: FU-B.
- Description: "Follow-up spike from TASK-7.29 (decision: Q-4 a). Open-raise lines scale toward raw PFR and
  calling lines toward raw VPIP, which ignores position. For an ordinary 22/18 player at 100 hands the 6-max BTN
  open goes 34.54% to 18%, BB call-raise 41.48% to 22% and SB limp 44.65% to 22%. Reusing the TASK-7.29 ratio rule
  for calling lines would push loose players to 100% (BB call-raise at 60/45). Lay out options with measured
  numbers (e.g. ratio with a cap, ratio for open-raise only, keep) and record the user's decision. Evidence:
  doit/TASK-7.29/spec.md §3 and the Q-4 options."
- ACs:
  1. `Given the options with measured widths for typical, loose and tight players at each table size, When the user decides, Then the decision is recorded and any change becomes a follow-up story with re-pinned expectations`

### Rules and algorithms
- D-1 / A-5, resize the authored default (worked example). BB `call-raise` default 41.48% (A-2 of TASK-7.13: combos
  ÷ 1326):
  - At width 41.48% the range is the default unchanged.
  - At 45% it adds hand-order classes not in the default, strongest first, until the combos reach 45% of 1326.
  - At 30% it drops the default classes that rank lowest in the order until the combos fall to the shortest set
    still reaching 30%.
- D-3 rule: `o = min(100, d × observedPFR ÷ typicalPFR)` on `three-bet` and `four-bet`, and the blend
  formula is unchanged. Example: UTG four-bet, d = 2.56, PFR 45, n = 100 → o = 2.56 × 45 ÷ 18 = 6.4, so the
  width is 6.41.

### Error handling and configuration
N/A. No code changes in this task.

## 6. Behaviour specification

### SPEC-01: The user's choice is a Backlog decision
- Verifies: AC#1
- Behaviour: Given the Q-1 to Q-4 answers, When the orchestrator runs
  `backlog decision create "Observed-opponent ranges: resize the authored default range, rank hands by equity vs three random hands, scale three-bet/four-bet by PFR relative to typical PFR; open-raise and calling lines go to a spike (TASK-7.29 Q-1..Q-4)" -s accepted --plain`
  (A-1), Then `backlog decision list --plain` shows that decision (expected decision-5) with status accepted.
- Verification: command `backlog decision list --plain`

### SPEC-02: REQ-035 carries the chosen re-raise scaling
- Verifies: AC#1
- Behaviour: Given Q-3 C, When the build edits `requirements.md`, Then the REQ-035.6 line reads exactly as in §5
  "Requirement text", row 1.14 with that exact text is the changelog's last row, and no other line changes
  (diff: 1 line changed, 1 added; REQ-035.2 untouched).
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: No product code changes and the evidence is on the task
- Verifies: AC#1
- Behaviour: Given the decision, When the task is done, Then no file under `src`, `tests`, `tools`, `e2e` or
  `docs` has changed (D-5). TASK-7.29's implementation notes (orchestrator, `backlog task edit TASK-7.29
  --append-notes`) state the Q-1 to Q-4 answers and the key numbers: K2o #87 above 87s #99, Q2o #108 above 76s
  #116, J2o #123 above 65s #128, and the UTG four-bet going 2.56% → 18% for a 22/18 player at 100 hands. They
  point to this spec's §3 and §5 for the full evidence.
- Verification: command `git diff --stat main -- src tests tools e2e docs`

### SPEC-04: Every change becomes a follow-up story with its re-pins
- Verifies: AC#1
- Behaviour: Given the answers, When the orchestrator creates FU-A, FU-B and FU-C exactly as in §5 "Follow-up
  stories" (titles, descriptions, ACs, labels, milestone, references, dependencies), Then
  `backlog task list --parent TASK-7 --plain` lists all three. FU-A depends on TASK-7.29, FU-B on FU-A and FU-C
  on FU-B. FU-A's AC#5 names the locked observed-ranges AC#2 re-pin under its owner, TASK-7.13. FU-A and FU-B
  each name the 4 observed golden spots to re-verify.
- Verification: command `backlog task list --parent TASK-7 --plain`

### SPEC-05: AC#1 is ticked with pointers
- Verifies: AC#1
- Behaviour: Given SPEC-01 to SPEC-04, When the task finishes, Then the orchestrator checks AC#1 (`backlog task
  edit TASK-7.29 --check-ac 1`), and the final summary cites the decision id, the FU-A, FU-B and FU-C ids, and
  the REQ-035.6 change (changelog 1.14).
- Verification: command `backlog task view TASK-7.29 --plain`

## 7. Edge cases
- Calling lines whose default range lacks AA: the A-5 floor is the default's strongest class, not AA. No locked
  test covers it, and FU-A AC#3 states it.
- Full ring and heads-up: D-1 to D-3 apply to every size, because scaling runs through `rangesFor`
  (`src/advice/ranges.ts:631`). D-3 uses each size's typical PFR (A-4, FU-B AC#3).
- Other cases (input, concurrency, permissions): N/A. No code runs.

## 8. Security considerations
N/A. No code, input, dependency, persisted-format or randomness changes, here or in FU-B (D-3 uses existing
data).

## 9. Non-functional
N/A for this task. For FU-A: a computed order is generated offline once. Its unit spot-check against more
opponents costs more per class: "vs 3 random" took about 1.3 s for all 169 classes, so 7 spot classes take well
under 0.1 s, which fits the normal suite. A full 169-class recomputation check would go only in the opt-in slow
group (standing rule).

## 10. Test plan
- Test command: `npm test` (unchanged by this task; nothing under src/tests changes)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing behaviour changes in this spike. The evidence is reproduced with the
  functions cited in §3.
- New tests: none. SPEC-01, SPEC-04 and SPEC-05 are orchestrator CLI steps. SPEC-02 and SPEC-03 are diffs. For
  the Judge: confirm the §3 ranks from `src/advice/ranges/hand-order.json` (K2o #87, 87s #99, Q2o #108, 76s #116,
  J2o #123, 65s #128). Confirm 2.56% as the 6-max UTG `four-bet` width and 18 as `scaledWidthPct(2.56, 18, 100)`.
  Then check SPEC-01 to SPEC-05.

## 11. Open questions
None. Q-1 to Q-4 were answered on 2026-11-26 (`doit/TASK-7.29/qa.md`) and are folded into D-1 to D-4, A-4, A-5,
§5 and SPEC-01 to SPEC-05. Open-raise and calling-line scaling is deferred to the FU-C spike (D-4).

## 12. Clarifications log
See `doit/TASK-7.29/qa.md`.
