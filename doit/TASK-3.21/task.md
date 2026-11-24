File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.21 - Remove-the-temporary-short-stack-top-up-once-all-ins-and-rebuy-exist.md

Task TASK-3.21 - Remove the temporary short-stack top-up once all-ins and rebuy exist
==================================================

Status: ○ To Do
Priority: High
Type: chore
Ordinal: 186000
Created: 2026-11-19 01:10 (UTC)
Updated: 2026-11-24 04:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: doc-25, src/table/session.ts

Dependency Graph:
--------------------------------------------------
Depends on (4 direct, 35 total):
├─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│  └─ TASK-1.8 - Check game invariants after every playtest action [completed]
│     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│     │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│     │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
├─ TASK-1.16 - Move the button and blinds past busted seats [completed]
│  ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
│  ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  │  └─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
│  ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
│  │  └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed]
│  │  ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
│  │  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed]
│  │     └─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed] (shown above)
│  └─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│     ├─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│     └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
└─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
      └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
         ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed] (shown above)
         ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
         ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
         │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
         │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
         │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
         │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
         │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
         │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
         │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
         │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
         │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
         ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
         │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
         └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
            └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Description:
--------------------------------------------------
Promised to the user in TASK-3.4 Q-4. Until all-ins exist the engine refuses stacks below 8 small bets + 8 big bets ($96 at $4/$8), so TASK-3.4's nextHand tops up any seat below that minimum to the $160 buy-in. The code carries the comment 'TEMPORARY (TASK-3.4 Q-4)'. This temporarily bends REQ-007.4 (no chips added above $0). This task depends on TASK-1.9 (all-in calls), TASK-1.16 (button past busted seats) and TASK-3.11 (Rebuy/Leave), so it becomes ready only when short stacks can really be played.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a seat below the old $96 minimum, When the next hand is dealt, Then its stack is not topped up — it plays its chips (or goes to Rebuy / bot replacement at $0) — and the interim top-up in nextHand is removed
- [ ] #2 Given a seat that ends a hand with $95 at $4/$8, When the next hand is dealt, Then that seat starts the hand with $95, and a test proves it
- [ ] #3 Given src/table/session.ts, When it is searched, Then the comment 'TEMPORARY (TASK-3.4 Q-4)' and the top-up code are gone, and TASK-3.4's SPEC-10/SPEC-11 tests are updated to the new rule
- [ ] #4 Given the top-up is removed and the user is short, When the action bar is shown in the live app, Then the all-in labels from TASK-3.7 ('Call all-in $X', 'Bet all-in $X', 'Raise all-in to $X') appear, proven by an e2e test on the real session
- [ ] #5 Given the top-up is removed, When a real all-in with unequal stacks happens in live play, Then the table shows the TASK-3.8 'Pots' list and the result shows 'Pot winners' lines, proven by an e2e test on the real session
- [ ] #6 Given a sit-and-go seat busts or runs short, When the next hand is dealt, Then it is never refilled (no top-up of any amount), per REQ-008 — TASK-2.4 left the interim top-up refilling sng short stacks to 20 big bets (800 at 20/40)
- [ ] #7 Given a stored busted cash session whose rebuys equals MAX_SESSION_COUNT, When the user chooses Rebuy, Then rebuy() refuses with a RangeError (or does not increment past the cap) and no record above the cap is ever written

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-3.7 follow-up (all-in labels live)

AC added from TASK-3.8 follow-up (live side pots)

AC added from TASK-2.4 (interim sng top-up)

From TASK-2.4 review: tests/table/game-type.test.ts SPEC-08 test is named '...tops up to its 1500 starting stack' but asserts the interim 800 top-up (name tied to TASK-2.4's locked spec). When removing the top-up, rename/rewrite that test to assert sng never refills.

From TASK-6.8: cash bots on $0 are now replaced (not topped up) and a bot on $1–$95 keeps its stack (proven by tests/table/replace-bot.acceptance.test.ts). Remaining here: the user seat and sit-and-go TEMPORARY top-up. TASK-3.4's next-hand acceptance test was already rewritten under TASK-6.8 Q-4 — start from that version.

AC added from TASK-3.11 follow-up (security MINOR rebuy-count-unbounded-increment, doc-109). Also while in session.ts / BustDialog.tsx: reflow the nextHand docstring (code MINOR nextHand-doc-awkward-reflow) and add a one-line comment on BustDialog's Escape onKeyDown (Chromium closes a modal on a second Escape without a cancelable cancel event; NIT escape-keydown-unexplained).

