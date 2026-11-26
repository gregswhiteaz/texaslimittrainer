# Spec: TASK-7.21 — Decide whether to split preflop spots by raiser position and re-raise type

Status: READY (approved 2026-11-26)
Task: TASK-7.21 · Parent/epic: TASK-7 · Requirements: REQ-032.2, REQ-032.6 · Dream: limit-holdem-trainer

## 1. Summary
A decision spike. Today every chart reads one spot per (position, situation). "Facing a raise" and
"blind defence" ignore who raised, so the big blind defends the same 46.3% of hands against an early-seat
(UTG) open as against a button steal. "Facing a re-raise" mixes "my own raise was re-raised" with
"two raises came in before I had raised". As a result the cutoff (CO) continues with 22.5% of hands against an
open plus a 3-bet, but with only 8.4% against a single open. This task gives the user the facts and the cost of
each option, and records the user's choice as a Backlog decision. The user chose (qa.md, 2026-11-26): split
"facing a re-raise" into "own raise re-raised" and "re-raise when I had not raised" (Q-1), split only blind
defence by an early or a late raiser (Q-2), and do the authoring in three follow-up stories (Q-3). This task
rewords REQ-032.2/REQ-032.6, records the decision and creates those stories; it authors no chart content.

## 2. Scope
- In scope:
  - Present the options and their costs (§3, §5) and record the user's choice (Q-1, Q-2, Q-3) as one Backlog
    decision (SPEC-01).
  - Builder: reword REQ-032.2 and REQ-032.6 and add changelog row 1.13 in
    `dreams/limit-holdem-trainer/requirements.md`, using the exact text in §5 (SPEC-02). Nothing else.
  - Orchestrator (at finish, CLI only): create the decision (SPEC-01), the three follow-up stories in §5 under
    TASK-7 (SPEC-04), the TASK-7.21 notes (SPEC-03), and tick AC#2 with a pointer (SPEC-05).
  - Record on TASK-7.21 that chart format version 1 needs no change for any option (SPEC-03).
- Not doing:
  - Authoring or editing any chart grid, justification, Rock starting range, golden spot or label text.
  - Changing `Situation`, `APPLICABLE_SPOTS`, `situationOf`, or any test, locked or not. That work belongs to
    the follow-ups.
  - Splitting "facing a raise and calls" or the limpers spots by who acted. Nobody asked for it, and it is listed
    only as a possible later extension.
  - Changing opponent default ranges (`src/advice/ranges/*.json`). They are keyed by position and line, not by
    chart spot (§3).
  - Any speed or scale check. The standing user rule keeps those in the opt-in `npm run test:slow` group.
- Scope budget: files=1, lines=6   (only `requirements.md`: two reworded clause lines and one new changelog row.
  Backlog task, decision and doc files are written by the CLI and not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice> (TASK-7.21 Q-1/Q-2)" -s accepted`. The reasons and the cost table go in TASK-7.21's implementation notes and final summary. | yes | The CLI has no body option. TASK-6.24, TASK-6.20 and TASK-6.27 used the same path (decision-1..3 in `backlog decision list`). CLAUDE.md forbids editing decision files by hand. | Edit the decision file by hand (forbidden). |
| A-2 | The re-raise bucket rule (Q-1 approved the split with this rule) is: "own raise re-raised" means the viewer made a preflop raise and a later raise now faces them. Every other spot with two or more raises is "re-raise, not my raise". That covers cold spots, calling an open and then facing a 3-bet, and limping and then facing two raises. | yes | This is the only rule that keeps REQ-032.6 single-valued: a fourth bet after your own 3-bet is "own raise re-raised". It also sends the locked TASK-9.1 route (CO cold-calls, BB squeezes) to the cold bucket, where folding A9o is natural (§3). The follow-up spec can still refine it. | Put "called then 3-bet" in its own third bucket (more spots); key the split on chips invested. |
| A-3 | The raiser-position cost figures in §5 count only cold "facing a raise" spots and the two blind-defence seats. The limp-then-raised routes (UTG raise, for example) stay one spot. | yes | The task names "blind defence and facing-a-raise". Limp-raise routes are rare and have no clear raiser grouping. | Split every route. |

## 3. Current system
Facts the decision rests on (all opened and checked):

- **Spot model.** `Situation` has 6 values (`src/advice/preflop-chart.ts:5-6`). `APPLICABLE_SPOTS`
  (`src/advice/preflop-chart.ts:51-75`) gives heads-up 6 spots (`:52-58`), 6-max 26 (`:59-66`: unopened 5,
  limpers 5, raise 4, raise-and-calls 4, re-raise 6, blind-defence 2) and full ring 41 (`:67-74`: 8+8+7+7+9+2).
  The REQ-032.2 text (`dreams/limit-holdem-trainer/requirements.md:590`) names the six situations, and its fit
  criterion (`:595`) demands all 169 classes for every (size, position, situation).
- **How a situation is chosen.** In `situationOf` (`src/advice/preflop.ts:105-118`), blinds are ignored. No raise
  gives `limpers`/`unopened` (`:110-112`). **Any two or more raises give `re-raise`**, whoever made them and
  whatever the viewer did (`:113`). With one raise, SB/BB give **`blind-defence`, whoever raised** (`:114-115`).
  Any other seat gets `raise` or `raise-and-calls` depending only on whether someone called after the raise
  (`:116-117`). Raiser position is never read. `chartSpotOf` (`src/advice/preflop.ts:90-102`) only adds the
  earliest-seat limpers fallback. `chartCell` (`src/advice/preflop-chart.ts:239-251`) looks up by
  (position, situation, hand class) only.
- **Same answer today?** Yes, for every hand. The 6-max BB faces a UTG open (16.0% range) and a BTN steal
  (40.6%) through the same `BB blind-defence` spot. It continues 46.3% and raises 5.7% in both cases
  (`npm run chart:print`). Examples (probed with `chartCell`): K8o, Q9o and J8o are `call`, A2o is `call*` (fold
  is the alternative), T7o is `fold*` (call is the alternative), against either raiser. The SB blind-defence spot
  (continue 10.7%) is also shared by every raiser.
- **Re-raise inversion.** CO continues 22.5% in `CO re-raise`, which TASK-7.19 widened to 80–90% of the CO open
  range, but only 8.4% in `CO raise`. So KTo and QJo (`call*`), and K9s and A7s (`call`), continue against an
  open plus a 3-bet, yet fold against one open (probed with `chartCell`). TASK-7.19 Q-3 accepted this and
  deferred it to this task (`doit/TASK-7.19/qa.md:26-27`).
- **AC#2 background.** The locked TASK-9.1 test `tests/table/review.acceptance.test.ts:86-92` runs `CALL_THEN_FOLD`
  (`tests/support/table-scenarios.ts:328-331`, button 6). In it, UTG opens, the user in the CO with Ah 9s calls
  (graded a Major error against `CO raise` fold), the BB 3-bets and UTG calls. The user then folds, graded
  Correct, which pins `CO re-raise` A9o = fold. TASK-7.19 therefore folded A9o, and then A8o by its consistency
  rule, in a spot that also serves "my CO open was 3-bet" (`doit/TASK-7.19/story-doc.md:52-53`). Under A-2 that
  locked route lands in the cold bucket, so A9o can continue in "own raise re-raised" without touching the locked
  test.
- **Chart file format.** Spots are entries `{position, situation, justification, grid}`. `parseChart` matches them
  against `APPLICABLE_SPOTS` by the string key "position situation" (`src/advice/preflop-chart.ts:185-232`).
  New situation names or position-suffixed spots fit `tlh-preflop-chart` version 1 unchanged. Only
  `APPLICABLE_SPOTS`/`Situation` change. No persisted data holds a situation: `src/storage` never stores advice,
  and reviews recompute grades from the stored view (`tests/table/review.acceptance.test.ts:52-55`).
- **Opponent default ranges** are keyed by (position, line), with lines check/limp/open-raise/call-raise/
  three-bet/call-three-bet/four-bet (`src/advice/ranges.ts:21-58`). They do not read chart spots, so no option
  touches them.
- **Other consumers of the situation list:**
  - User-visible text: `PREFLOP_CONTEXT` (`src/advice/explanations.ts:145-158`) and `SITUATION_LABELS`
    (`src/advice/explanations.ts:215-222`, the TASK-8.5 hint/review labels). Each new situation needs both texts.
  - Bots: `SPOT_TYPES` (`src/bots/style.ts:22-29`, the TAG mixed spots in `src/bots/styles/tag.json:28`). The Rock
    style must list a starting range for **every** 6-max spot (`src/bots/style.ts:374-379`). Each range must be a
    strict subset of the TAG chart's plays in that spot (`:356-367`), and `src/bots/rock.ts:34` reads it by
    `chartSpotOf`. So every new 6-max spot also needs an authored Rock range.
  - Golden spots: each preflop golden spot's `situation` must equal `situationOf` (`src/advice/golden.ts:422-430`).
    `tests/golden/preflop-spots.json` holds re-raise 7 (6-max), 8 (full ring), 4 (heads-up) and blind-defence 8/8/4.
- **Locked tests that pin spot counts, situation names or chart output (owner task):**
  - Counts:
    - `tests/advice/chart-print.acceptance.test.ts:48-49` = 26 (TASK-7.19)
    - `tests/advice/chart-print-sizes.acceptance.test.ts:102,108` = 41/26 (TASK-7.27)
    - `tests/advice/preflop-chart-edges.acceptance.test.ts:94` = 26 (TASK-7.20)
    - `tests/advice/six-max-chart.acceptance.test.ts:119` = 26 (TASK-7.19)
    - `tests/advice/table-sizes.acceptance.test.ts:136-137` = 6/41 (TASK-7.6)
    - `tests/bots/rock.acceptance.test.ts:150` = 26 (TASK-6.5)
  - Situation sets:
    - `tests/advice/labels.acceptance.test.ts:42-46` (TASK-8.5)
    - `tests/bots/tag.acceptance.test.ts:155` (TASK-6.1)
    - `tests/advice/table-sizes.acceptance.test.ts:41-42` (TASK-7.6)
  - Re-raise behaviour:
    - `tests/advice/six-max-chart.acceptance.test.ts:64-110`, the 80–90% rule (TASK-7.19)
    - `tests/advice/preflop.acceptance.test.ts:75-98,358-369` (TASK-7.2)
    - `tests/advice/table-sizes.acceptance.test.ts:232-262` (TASK-7.6)
    - `tests/golden/graded-lines.acceptance.test.ts:143`, text "6-max CO re-raise K6s: fold" (TASK-7.36)
    - `tests/table/review.acceptance.test.ts:86-92` (TASK-9.1)
  - Blind defence:
    - `tests/advice/six-max-chart.acceptance.test.ts:101-111` (TASK-7.19)
    - `tests/advice/preflop.acceptance.test.ts:99-100` (TASK-7.2)
    - `tests/bots/rock.acceptance.test.ts:159` = BB 41 classes (TASK-6.5)
    - `tests/bots/tag-mixing.acceptance.test.ts` (TASK-6.2)
  - Golden: `tests/golden/preflop-spots.json` plus `tests/golden/preflop.acceptance.test.ts` (TASK-7.11).
  - Opt-in slow group only: `tests/advice/explanations.acceptance.test.ts` (TASK-7.10) and
    `tests/playtest/check-styles.acceptance.test.ts` (TASK-6.25/6.11).

  Which of these a follow-up edits depends on naming. If one half keeps today's name (for example `re-raise` stays
  "own raise re-raised" and a new `cold-re-raise` is added), the situation-specific pins mostly survive, and only
  the counts and situation sets change.
- Existing code to reuse (for the follow-ups, not this task):
  - `npm run chart:print` (`tools/chart-print/main.ts`) → the review printout, as in TASK-7.19/7.27.
  - `parseChart` and `APPLICABLE_SPOTS` → the validator already handles any spot list, so no new validator is
    needed.
  - The TASK-7.19 rule set (`doit/TASK-7.19/spec.md:176-225`) → the 80–90% re-raise rule transfers unchanged
    to "own raise re-raised".

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Split "facing a re-raise" into "own raise re-raised" and "re-raise, not my raise" (rule A-2). | Keep one re-raise spot | Fixes the CO 22.5%-vs-8.4% inversion and AC#2 at the smallest cost (§5) | yes | user (Q-1) |
| D-2 | Raiser position: split blind defence only, into "vs an early raiser" and "vs a late raiser". The exact seat groups are confirmed with the user in the follow-up. | No split; per-raiser split of blind defence and facing a raise | Shows the biggest gap (BB 46.3% against UTG's 16% range) for +2 spots per chart. A per-raiser split costs +10 (6-max) / +28 (full ring) | yes | user (Q-2) |
| D-3 | This task only records the decision and the REQ change. Authoring goes into follow-up stories, and AC#2 moves verbatim to the 6-max re-raise story. AC#2 is ticked here with a pointer to that story. | Author the new spots in this task | Each split is a TASK-7.19-sized authoring and sign-off job, too big for a spike | yes | user (Q-3) |
| D-4 | The chart file format stays `tlh-preflop-chart` version 1 for every option. | Add a `versus` field (version 2) | New spots are just new (position, situation) keys (`src/advice/preflop-chart.ts:185-232`). No persisted data changes | no | n/a (codebase) |

## 5. Design

### Files to create / modify
- `dreams/limit-holdem-trainer/requirements.md` — replace the REQ-032.2 line (line 590) and the REQ-032.6 line
  (line 594) with the exact text in "Requirement text", and append changelog row 1.13 after line 1372 (SPEC-02).

### Components, interfaces and data
None changed in this task (D-4, "Not doing").

### Option costs (the factual basis for Q-1/Q-2)
New spots per chart (heads-up / 6-max / full ring), from the routes in `doit/TASK-7.19/spec.md:205-225`:

| Option | Heads-up | 6-max | Full ring | New 169-cell grids to author |
|---|---|---|---|---|
| Keep today | 6 | 26 | 41 | 0 |
| (2) Re-raise split (A-2) | 6 (+0: every heads-up re-raise is "own raise") | 32 (+6: every seat has both kinds) | 50 (+9) | 15, and all 15 existing re-raise grids re-justified |
| (1a) Raiser position, blind defence only, early/late groups | 6 (+0: only one possible raiser) | 28 (+2) | 43 (+2) | 4, and 4 existing re-justified |
| (1b) Raiser position, per raiser: blind defence and cold "facing a raise" (A-3) | 6 (+0) | 36 (+10: SB 4 + BB 5 raisers = 9 instead of 2; HJ 1 + CO 2 + BTN 3 = 6 instead of 3) | 69 (+28: SB 7 + BB 8 = 15 instead of 2; raise 22 instead of 7) | 38 |
| (2) + (1a) | 6 | 34 | 52 | 19 |

Early/late groups in (1a): 6-max early = UTG, HJ and late = CO, BTN, SB. Full ring early = UTG to LJ and late =
HJ, CO, BTN, SB. The follow-up spec confirms the exact groups with the user.

Work every split needs (all of it in follow-ups):
- Code: `Situation` and `APPLICABLE_SPOTS` (`preflop-chart.ts`). `situationOf` must read whether the viewer raised
  (re-raise) or which seat raised (raiser position) (`preflop.ts:105-118`).
- Chart data: new grids and plain-English justifications in `src/advice/charts/*.json`, at least 15 words each
  (REQ-032.4). They need the user's sign-off through `chart:print`, as in TASK-7.19 Q-2/Q-4.
- Rock: a hand-authored starting range for each new 6-max spot (`src/bots/style.ts:374-379`).
- User-visible text: a `PREFLOP_CONTEXT` sentence and a `SITUATION_LABELS` label for each new situation. These
  are user-visible, so the user approves them in the follow-up.
- Golden spots: rename the affected entries' situations and add at least one spot per new situation.
- Locked tests: the counts, situation sets and spot pins listed in §3, with their owners. Each edit is a
  locked-test edit under the doit rules.
- Not affected: opponent ranges (`ranges.ts`), the chart file format (D-4), stored hands.

Authoring size compared with TASK-7.19 (which revised 23 of the 26 6-max spots with one user sign-off):
- (2): 6-max needs 6 new grids plus 6 re-justified, and full ring needs 9 + 9. About half of TASK-7.19 per chart
  size.
- (1a): about a fifth of that.
- (1b) at full ring: larger than TASK-7.19.

### Follow-up stories (created by the orchestrator at finish; SPEC-04)
All three: `backlog task create "<title>" -p TASK-7 -l dream-limit-holdem-trainer,follow-up -m m-1
--priority Medium --type enhancement --ref doit/TASK-7.21/spec.md --ref dreams/limit-holdem-trainer/requirements.md
--doc doc-28 -d "<description>" --ac "<AC>" ... --dep <deps> --plain`. Create them in the order below so that
FU-1's id is known for FU-2 and FU-3. Every AC is passed as its own `--ac`.

**FU-1** — title: `Split the 6-max re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised`
- Depends on: TASK-7.21.
- Description: "Follow-up from TASK-7.21 (decision: Q-1 split re-raise). Today `situationOf` sends every
  preflop spot with two or more raises to one `re-raise` spot, so the CO continues 22.5% against an open plus a
  3-bet but only 8.4% against one open. Split it with the TASK-7.21 A-2 rule: 'own raise re-raised' when the
  viewer made a preflop raise and a later raise now faces them; every other spot with two or more raises is
  're-raised when I had not raised' (cold 3-bets, called then 3-bet, limped then two raises). 6-max grows from 26
  to 32 spots (+6), with 6 new grids and the 6 existing re-raise grids re-justified. Facts, routes, cost table
  and the full list of affected code and locked tests: doit/TASK-7.21/spec.md §3 and §5. Under A-2 the locked
  TASK-9.1 route (UTG opens, CO calls, BB 3-bets) lands in the not-my-raise spot. The spec must ask the user for
  the wording of the new hint/review label (SITUATION_LABELS) and context sentence (PREFLOP_CONTEXT), and the user
  signs off the new and changed spots from npm run chart:print, as in TASK-7.19."
- ACs:
  1. `Given a 6-max hand where the viewer made a preflop raise and a later raise now faces them, When preflop advice is computed, Then it reads that seat's own-raise-re-raised spot; and given two or more raises when the viewer has not raised, Then it reads that seat's re-raised-when-I-had-not-raised spot (TASK-7.21 rule A-2)`
  2. `Given the 6-max chart, When the split is authored, Then it has 32 spots, each with all 169 hand classes and a plain-English justification that agrees with its grid, and each own-raise-re-raised spot continues with 80-90% of that seat's opening range (TASK-7.19 rule)`
  3. (TASK-7.21 AC#2, verbatim) `Given re-raise spots are split into 'my open was 3-bet' and 'cold 3-bet', When the CO cold-3-bet spot is authored, Then CO A9o/A8o are reconsidered (TASK-7.19 folds them only because TASK-9.1's locked review test pins CO A9o as Fold) and that test is updated if the advice changes`
  4. `Given each new situation, When it appears in a hint, a review or the preflop explanation, Then it shows a label and a context sentence whose wording the user approved in this story's Q&A`
  5. `Given the Rock style and the golden spots, When npm test runs, Then every new 6-max spot has a Rock starting range that is a strict subset of the TAG chart's plays, and each new situation has at least one golden spot`
  6. `Given a heads-up or full-ring hand, When the split is in place, Then the advice is unchanged from today (heads-up has only own-raise re-raises; full ring keeps today's re-raise grids until the full-ring story)`
  7. `Given the revised chart, When npm test runs, Then all checks pass and the user has signed off the new and changed 6-max spots from npm run chart:print in the task notes`

**FU-2** — title: `Split the full-ring re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised`
- Depends on: FU-1.
- Description: "Follow-up from TASK-7.21 (decision: Q-1 split re-raise), after the 6-max split. Apply the same
  A-2 rule and the situation names, labels and context sentences from the 6-max story to the full-ring chart:
  41 to 50 spots (+9), with 9 new grids and the 9 existing re-raise grids re-justified. Cost table and
  affected code/locked tests: doit/TASK-7.21/spec.md §3 and §5. Heads-up is unchanged (every heads-up re-raise is
  an own-raise re-raise). The spec must ask the user for wording of any new label or context text the 6-max
  story did not already settle, and the user signs off the new and changed spots from
  npm run chart:print full-ring, as in TASK-7.19. Related: TASK-7.38 (full-ring chart review)."
- ACs:
  1. `Given a full-ring hand with two or more preflop raises, When preflop advice is computed, Then it reads the own-raise-re-raised spot if the viewer made a preflop raise that a later raise now faces, and the re-raised-when-I-had-not-raised spot otherwise (TASK-7.21 rule A-2)`
  2. `Given the full-ring chart, When the split is authored, Then it has 50 spots, each with all 169 hand classes and a plain-English justification that agrees with its grid, and each own-raise-re-raised spot continues with a share of that seat's opening range that the user approves`
  3. `Given any new user-visible label or context text, When shown, Then its wording was approved by the user in this story's Q&A`
  4. `Given the golden spots, When npm test runs, Then at least one full-ring golden spot covers each re-raise situation`
  5. `Given the revised chart, When npm test runs, Then all checks pass and the user has signed off the new and changed full-ring spots from npm run chart:print full-ring in the task notes`

**FU-3** — title: `Split blind defence by an early or a late raiser at 6-max and full ring`
- Depends on: FU-1 (both change `situationOf`).
- Description: "Follow-up from TASK-7.21 (decision: Q-2 split blind defence early/late). Today the 6-max BB
  defends the same 46.3% of hands against a UTG open (16.0% range) as against a button steal (40.6%), and the SB
  spot (10.7%) is shared by every raiser. Split blind defence into 'vs an early raiser' and 'vs a late raiser':
  +2 spots per chart size (heads-up unchanged, as there is only one possible raiser), 4 new grids and the 4
  existing blind-defence grids re-justified. Proposed groups, to confirm with the user in the spec: 6-max early =
  UTG, HJ and late = CO, BTN, SB; full ring early = UTG to LJ and late = HJ, CO, BTN, SB. Facts, cost table and
  affected code/locked tests (including Rock's BB range pin): doit/TASK-7.21/spec.md §3 and §5. The spec must
  ask the user for the wording of the new labels and context sentences, and the user signs off the new and
  changed spots from npm run chart:print (6-max and full-ring), as in TASK-7.19."
- ACs:
  1. `Given a hand where the SB or BB faces exactly one raise, When preflop advice is computed, Then it reads the vs-early-raiser or vs-late-raiser blind-defence spot according to the raiser's seat, using the seat groups the user confirmed`
  2. `Given the 6-max and full-ring charts, When the split is authored, Then each new spot has all 169 hand classes and a plain-English justification that agrees with its grid, and each blind's range against an early raiser is no wider than against a late raiser`
  3. `Given each new situation, When it appears in a hint, a review or the preflop explanation, Then it shows a label and a context sentence whose wording the user approved in this story's Q&A`
  4. `Given the Rock style and the golden spots, When npm test runs, Then every new 6-max spot has a Rock starting range that is a strict subset of the TAG chart's plays, and each new situation has at least one golden spot`
  5. `Given the revised charts, When npm test runs, Then all checks pass and the user has signed off the new and changed spots from npm run chart:print in the task notes`

### Requirement text (SPEC-02, exact)
- REQ-032.2 line 590 becomes:
  `  - REQ-032.2: Situations covered per position: unopened pot, facing one or more limpers, facing a raise, facing a raise and calls, facing a re-raise of your own raise, facing a re-raise when you have not raised, and blind defence; blind defence is split by whether the raiser sits in an early or a late position.`
- REQ-032.6 line 594 becomes:
  `  - REQ-032.6: When facing a fourth bet preflop (a re-raise of a re-raise), the advice uses the facing-a-re-raise-of-your-own-raise chart if you made a preflop raise, otherwise the facing-a-re-raise-when-you-have-not-raised chart; if the street is capped, a raise recommendation becomes call.`
- New last line of the changelog table (after line 1372):
  `| 1.13 | 2026-11-26 | TASK-7.21: REQ-032.2 splits facing a re-raise into own raise re-raised and re-raised when you have not raised, and splits blind defence by an early or a late raiser; REQ-032.6 picks the matching re-raise chart for a fourth bet | User (TASK-7.21 Q-1/Q-2) |`

### Rules and algorithms
A-2 bucket rule, worked examples at 6-max:
- UTG opens and HJ 3-bets → UTG is in "own raise re-raised".
- UTG opens and HJ 3-bets, with the CO not yet acting → CO is in "not my raise" (cold).
- UTG opens, CO calls, BB 3-bets → CO is in "not my raise". This is the locked TASK-9.1 route, where A9o stays a
  fold.
- UTG opens, CO 3-bets, UTG 4-bets → CO is in "own raise re-raised" (REQ-032.6, capped → call).

### Error handling and configuration
N/A. No code changes in this task.

## 6. Behaviour specification

### SPEC-01: The user's choice is a Backlog decision
- Verifies: AC#1
- Behaviour: Given the Q-1, Q-2 and Q-3 answers, When the orchestrator runs
  `backlog decision create "Preflop spots: split facing a re-raise into own raise re-raised and re-raised when I had not raised, and blind defence by early or late raiser; authoring in follow-ups (TASK-7.21 Q-1/Q-2/Q-3)" -s accepted --plain`
  (A-1), Then `backlog decision list --plain` shows that decision (expected decision-4) with status accepted.
- Verification: command `backlog decision list --plain`

### SPEC-02: REQ-032.2 and REQ-032.6 carry the chosen split
- Verifies: AC#1
- Behaviour: Given Q-1 = split and Q-2 = blind defence early/late, When the build edits `requirements.md`, Then
  the REQ-032.2 and REQ-032.6 lines read exactly as in §5 "Requirement text", changelog row 1.13 is the table's
  last row with that exact text, and no other line of the file changes (diff: 2 lines changed, 1 added).
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: The chart format needs no change
- Verifies: AC#1
- Behaviour: Given the chosen splits, When the task is done, Then no source, test, chart or tool file has changed
  (D-4), and TASK-7.21's implementation notes (orchestrator, `backlog task edit TASK-7.21 --append-notes`) state:
  the Q-1/Q-2/Q-3 answers; that the cost table and facts are in `doit/TASK-7.21/spec.md` §3 and §5 (6-max 26 ->
  34, full ring 41 -> 52, heads-up 6 unchanged once all three follow-ups land); and that `tlh-preflop-chart`
  version 1 holds every new spot unchanged, citing `src/advice/preflop-chart.ts:185-232`.
- Verification: command `git diff --stat main -- src tests tools e2e`

### SPEC-04: Authoring is in three follow-up stories
- Verifies: AC#1, AC#2
- Behaviour: Given Q-3 = follow-ups, When the orchestrator creates FU-1, FU-2 and FU-3 exactly as in §5
  "Follow-up stories" (titles, descriptions, ACs, labels, milestone, references, dependencies), Then
  `backlog task list --parent TASK-7 --plain` lists all three; FU-1 depends on TASK-7.21, FU-2 on FU-1, FU-3 on
  FU-1; and FU-1's AC#3 is TASK-7.21 AC#2 verbatim.
- Verification: command `backlog task list --parent TASK-7 --plain`

### SPEC-05: AC#2 is ticked here with a pointer to FU-1
- Verifies: AC#2
- Behaviour: Given FU-1 exists, When this task finishes, Then the orchestrator checks AC#2
  (`backlog task edit TASK-7.21 --check-ac 2`) and the final summary contains: "AC#2 moved verbatim to <FU-1 id>
  (6-max re-raise split) as its AC#3; CO A9o/A8o are reconsidered there. Under rule A-2 the locked TASK-9.1
  route (UTG opens, CO calls, BB 3-bets) lands in the re-raised-when-I-had-not-raised spot, so A9o can continue in
  the own-raise-re-raised spot without that test changing." The summary also cites the decision id (SPEC-01) and
  the three follow-up ids.
- Verification: command `backlog task view TASK-7.21 --plain`

## 7. Edge cases
- Heads-up: no option adds a heads-up spot (§5 table), so nothing changes there.
- Fourth bet (REQ-032.6) under the re-raise split is covered by the A-2 rule and the REQ-032.6 text (§5).
- "Called, then 3-bet" and "limped, then two raises" are routes on the boundary between the two re-raise
  buckets. A-2 sends both to "not my raise".
- Other cases (input, concurrency, permissions): N/A. No code runs.

## 8. Security considerations
N/A. No code, input, dependency or randomness changes. Backlog writes go through its CLI.

## 9. Non-functional
N/A for this task. For the follow-ups: chart parsing grows linearly with the number of spots (≤ 69 × 169 cells),
which is negligible. No speed checks are added outside the opt-in `npm run test:slow` group (standing user rule).

## 10. Test plan
- Test command: `npm test` (unchanged by this task; nothing under src/tests changes)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print` (shows today's 26 6-max spot widths quoted in §3)
- New tests: none. SPEC-01, SPEC-04 and SPEC-05 are orchestrator CLI steps. SPEC-02 and SPEC-03 are diffs.
  For the Judge: run `npm run chart:print` and confirm "BB blind-defence: raise 5.7%, continue 46.3%" and
  "CO re-raise … continue 22.5%" against "CO raise … continue 8.4%". Then check SPEC-01 to SPEC-05.

## 11. Open questions
None. Q-1, Q-2 and Q-3 were answered on 2026-11-26 (`doit/TASK-7.21/qa.md`) and are folded into D-1 to D-3,
§5 and SPEC-01 to SPEC-05. The open points left for the follow-ups (label and context wording, the exact
early/late seat groups, chart content) are listed in their descriptions and ACs.

## 12. Clarifications log
See `doit/TASK-7.21/qa.md`.
