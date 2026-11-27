# Spec: TASK-3.24 — Decide whether the user gets a Show/Muck choice at showdown

Status: READY (approved 2026-11-27)
Task: TASK-3.24 · Parent/epic: TASK-3 · Requirements: REQ-019 (019.5, 019.6, 019.8), REQ-029.3, REQ-043.6, REQ-024 · Dream: limit-holdem-trainer

## 1. Summary
A decision spike. TASK-1.15 Q-1 was auto-accepted in autopilot: the user's hand follows the same automatic
show/muck rule as the bots, and there is no Show/Muck control (`doit/TASK-1.15/qa.md:3-7`, doc-62). This spec
gave the user the evidence of what a choice would and would not change. The user chose Q-1 A (qa.md,
2026-11-27): keep automatic show/muck for the user's hand, with no Show/Muck control and no follow-up story.
This task records that as a Backlog decision, rewords REQ-019.5 and REQ-019.8 and adds changelog row 1.17. No
product code changes.

## 2. Scope
- In scope:
  - Record the user's Q-1 answer as one Backlog decision (SPEC-01).
  - Builder: edit `dreams/limit-holdem-trainer/requirements.md` with the exact text in §5 (SPEC-02). Nothing
    else.
  - Orchestrator (at finish, CLI only): the decision (SPEC-01), TASK-3.24 implementation notes (SPEC-03), and
    tick AC#1 (SPEC-04).
- Not doing:
  - Any change under `src`, `tests`, `e2e`, `tools` or `docs`.
  - A Show/Muck prompt or any follow-up story for one (Q-1 A).
  - Changing the bot show/muck rule, the showdown order (REQ-019.4), the pot-by-pot settle order (REQ-019.8),
    or TDA all-in tabling (TASK-1.15 Q-2 stays).
  - Changing what the Hand Review shows (REQ-043.6) or how WTSD/W$SD are counted.
  - Regenerating `dreams/limit-holdem-trainer/rtm.md` (A-2).
- Scope budget: files=1, lines=6   (`requirements.md` only: 2 changed clause lines and 1 new changelog row.
  Backlog files are written by the CLI and not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice> (TASK-3.24 Q-1)" -s accepted --plain`; the evidence goes in TASK-3.24's implementation notes and final summary. | yes | The CLI has no body option; decision-1 to decision-5 used the same path; CLAUDE.md forbids hand-editing decision files. | Edit the decision file by hand (forbidden). |
| A-2 | `rtm.md` is not edited. Its REQ-019.5 row (`rtm.md:111`) keeps the old text. | yes | TASK-7.29 reworded REQ-035.6 without touching `rtm.md` (`rtm.md:188` still has the old text), so the matrix is refreshed separately. | Edit the rtm row in this task. |
| A-3 | The next changelog row is 1.17, dated the day the build runs. | yes | The last row is 1.16 (`requirements.md:1376`). | n/a |

## 3. Current system
Facts the decision rests on (all opened and checked):

- **The rule and where it lives.** `revealShown` (`src/engine/hand.ts:584-609`) settles pots from the last
  side pot to the main pot. Each undecided eligible seat, in showdown order (`showdownOrder`, `:576-582`),
  shows if no hand is face up yet or it ties or beats the best face-up hand, otherwise it mucks. A mucked hand
  stays mucked; a one-seat pot needs no show. There is no special case for the user's seat. `endRound`
  (`:614-660`) awards each pot only among shown hands, so `HandResult.showdown` holds only shown hands.
- **The requirement says "bot", not "hand".** REQ-019.5 (`requirements.md:372`): "Each later bot shows only
  if its hand beats or ties…". REQ-019.8 (`:375`): "for each pot a bot shows if its hand can win that pot".
  REQ-019.6 (`:373`): "The user's own hole cards are always visible to the user." So the user's case was
  decided only in TASK-1.15 Q-1 and is not written in the requirements. Option A closes that gap.
- **No backlog story covers a prompt.** `backlog search "show muck"` finds only TASK-3.24 and TASK-1.15. doc-62
  "Known limitations" says the same.
- **What mucking or showing the user's hand changes today:**
  - **Bots: nothing.** REQ-029.3 (`requirements.md:542`) and decision-1: a bot's decision depends only on the
    current hand; earlier showdowns never change a bot action. In the app, `earlierShowdowns` is passed only by
    the playtest runner (`src/playtest/runner.ts:214,243,415`); nothing in `src/table` or `src/ui` passes it.
  - **The user's own view: nothing.** REQ-019.6 keeps the user's cards face up at their seat; the Hand Review
    header always shows the user's hole cards (REQ-043.3); `CompletedHand.userHoleCards` is always stored
    (`src/table/session.ts:740-760`).
  - **Hand-over text:** a shown user hand that won no share appears in the "Shown hands" list as "You show ·
    <hand>" (`src/table/hand-result.ts:141-153`). A mucked one does not appear. This is the only user-visible
    difference.
  - **Hand record:** `CompletedHand.shown` is `showdownOf(hand)` (`session.ts:750`; `player-view.ts:126-135`),
    the shown hands only. The persisted record validates `result.showdown` (`src/table/hand-record.ts:354-356`).
  - **Grading and advice: nothing.** Show/muck happens after the user's last decision; REQ-025.3 grades each
    decision by the information at that point, not by the outcome.
  - **Stats: nothing.** WTSD/W$SD count a showdown when the hand ended by showdown and the seat did not fold,
    and W$SD needs an award share (`src/stats/style-stats.ts:59-62`). Mucking a losing hand does not change
    either.
- **Mucking a hand that can win forfeits the pot.** `endRound` awards only among shown hands. A "Muck" option
  for a hand that would show under the rule (it ties or beats everything face up) gives the pot away, which is
  never right in a trainer. So the only meaningful contested-showdown choice is "show a losing hand".
- **The uncalled winner.** A hand that ends because everyone else folded has `endedBy: 'fold'` and
  `showdown: []` (`src/engine/hand.ts:548-553`); `showdownOf` returns null (`player-view.ts:127`). The winner's
  cards are never shown and there is no field to record a voluntary show. Offering "Show" here would need a
  new result/record field and parser change (`hand-record.ts:354-356`, a persisted format), and the shown
  cards would affect nothing (bots forget, REQ-029.3).
- **Pace.** G-5 and REQ-024.6 (`requirements.md:11,462`): at Rapid, 200+ hands per hour. REQ-024.3: without the
  review panel the next hand is dealt 1.5 s after the result. A prompt is a click before the result can
  finish. REQ-024.5 gives the user no time limit, so a prompt blocks the table until answered.
- **Why casinos offer the choice.** Showing a loser or a bluff is table image: it changes how opponents play
  you later. Here no bot remembers anything between hands (REQ-029.3), so it has no training value.

Existing code to reuse (none needed by this task; listed for any future change):
- `src/engine/hand.ts::revealShown` → the single place a user override would plug in.
- `src/table/hand-result.ts` "Shown hands" list → already renders "You show · <hand>".

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The user's hand follows the automatic show/muck rule (show if it ties or beats the best face-up hand, else muck); no Show/Muck control; a hand that wins uncalled is never shown; REQ-019.5/019.8 say so; no follow-up story | B "Show" offer for a losing hand; C B plus "Show" after an uncalled win | Bots never remember shown cards (REQ-029.3), so a choice would change only the "You show" line and cost a click per showdown | yes | user (Q-1) |
| D-2 | No product code in this task, whatever Q-1's answer | Build the prompt here | The task is a spike; AC#1 says a story is created for a prompt. | no | n/a |

## 5. Design

### Files to create / modify
- `dreams/limit-holdem-trainer/requirements.md` — REQ-019 wording and changelog row 1.17 per the chosen option.

### Requirement text (exact)
- REQ-019.5 becomes: `  - REQ-019.5: Each later hand, the user's included, shows only if it beats or ties the highest-ranking hand shown so far; otherwise it mucks and its cards stay hidden from the other seats (Q-33). The user has no Show/Muck control, and a hand that wins because everyone else folded is never shown (TASK-3.24 Q-1).`
- REQ-019.8 becomes: `  - REQ-019.8: Showdown is resolved pot by pot, starting with the last side pot created and ending with the main pot; for each pot a hand shows if it can win that pot, and mucking in one pot never forfeits another pot that hand can win.`
- Changelog row: `| 1.17 | <date> | TASK-3.24: REQ-019.5 and REQ-019.8 apply automatic show/muck to the user's hand as well as the bots'; no Show/Muck control; an uncalled winner is never shown | User (TASK-3.24 Q-1) |`

### Rules and algorithms
N/A — no code.

### Error handling and configuration
N/A.

## 6. Behaviour specification

### SPEC-01: The user's choice is a Backlog decision
- Verifies: AC#1
- Behaviour: Given Q-1 A, When the orchestrator runs `backlog decision create` (A-1) with the title "User's hand follows the automatic show/muck rule; no Show/Muck
  control; uncalled winners never show (TASK-3.24 Q-1)" and `-s accepted --plain`, Then `backlog decision list --plain` shows it
  (expected decision-6) with status accepted.
- Verification: command `backlog decision list --plain`

### SPEC-02: REQ-019 states the chosen rule for the user's hand
- Verifies: AC#1
- Behaviour: Given Q-1 A, When the build edits `requirements.md`, Then REQ-019.5 and REQ-019.8 read
  exactly as in §5, row 1.17 is the changelog's last row, and no other line changes (diff: 2
  lines changed, 1 added).
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: No product code changes and the evidence is on the task
- Verifies: AC#1
- Behaviour: Given the decision, When the task is done, Then no file under `src`, `tests`, `e2e`, `tools` or
  `docs` has changed, no follow-up story is created, and TASK-3.24's implementation notes (`backlog task edit TASK-3.24 --append-notes`) state
  the Q-1 answer and the key facts: bots ignore shown cards (REQ-029.3), the user always sees their own cards
  (REQ-019.6), mucking a hand that can win forfeits the pot, the only visible difference is the "You show"
  line, and an uncalled show would need a persisted-format change. They point to this spec's §3.
- Verification: command `git diff --stat main -- src tests e2e tools docs`

### SPEC-04: AC#1 is ticked with pointers
- Verifies: AC#1
- Behaviour: Given SPEC-01 to SPEC-03, When the task finishes, Then AC#1 is checked (`backlog task edit
  TASK-3.24 --check-ac 1`) and the final summary cites the decision id, the changelog row 1.17 and
  "no follow-up story (Q-1 A)".
- Verification: command `backlog task view TASK-3.24 --plain`

## 7. Edge cases
- The user shows first (last river bettor, REQ-019.4): the first hand is always shown, so no choice exists
  under any option.
- Side pots: unchanged; the pot-by-pot rule already covers the user's hand (TASK-1.15 A-5).
- Other cases (input, concurrency, permissions): N/A, no code runs.

## 8. Security considerations
N/A: no code, input, dependency, persisted-format or randomness change.

## 9. Non-functional
N/A: no code changes; pace (REQ-024.6) is unaffected because no prompt is added.

## 10. Test plan
- Test command: `npm test` (unchanged by this task)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing behaviour changes in this spike.
- New tests: none. SPEC-01 and SPEC-04 are orchestrator CLI steps; SPEC-02 and SPEC-03 are diffs.
  Judge: confirm the §3 citations (`hand.ts:584-609`, `:548-553`, `hand-result.ts:141-153`,
  `requirements.md:372,375,542`), then check SPEC-01 to SPEC-04.

## 11. Open questions
None. Q-1 was answered A on 2026-11-27 (`doit/TASK-3.24/qa.md`) and is folded into D-1, §5 and SPEC-01 to
SPEC-04.

## 12. Clarifications log
See `doit/TASK-3.24/qa.md`.
