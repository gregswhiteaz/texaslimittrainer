File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-8.6 - Keep-observed-opponent-stats-across-Resume.md

Task TASK-8.6 - Keep observed opponent stats across Resume
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 233000
Created: 2026-11-24 10:52 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-8 - Ask for a hint
References: doc-114

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 41 total):
├─ TASK-2.6 - Resume a paused session from Home [completed]
│  ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │     │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │     │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │     │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │     │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │     │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │     │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
│     └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│        ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│        │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│        │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│        │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│        │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│        │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│        │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│        │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│        │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
│        │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
│        ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
│        │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
│        │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
│        │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
│        │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
│        │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
│        │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
│        │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│        │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
│        │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│        ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
│        │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
│        └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
│           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
└─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [completed]
   ├─ TASK-3.2 - Choose only legal actions with their exact amounts [completed]
   │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   ├─ TASK-3.6 - Keep the table responsive while bots and advice compute [completed]
   │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
   │  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
   │  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  ├─ TASK-7.8 - Recommend betting or raising for value [completed]
   │  │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
   │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
   │  └─ TASK-7.9 - Count implied odds for drawing hands [completed]
   │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
   └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
      ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
      └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-8.1 (doc-114, Q-3). Per-bot observed counts live in a useTableSession ref and restart at 0 after Resume, so a bot watched for 45 hands shows 'typical player' again after the user pauses and resumes. Persist the counts in the session record (or rebuild them from stored hand records on resume) so hints and stored decisions keep using them. This is a persisted-format change.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a session where a bot has been observed for 45 hands, When the user pauses, resumes and opens Hint on a postflop decision, Then that bot's basis reads 'based on 45 hands of this opponent' (counts carried across Resume)
- [ ] #2 Given a stored session record with observed counts that are malformed (non-integer hands, vpip/pfr outside 0-100, unknown bot id), When it is read, Then it is rejected with a RangeError naming the field and Home stays usable

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

