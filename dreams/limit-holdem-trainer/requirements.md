# Requirements: TLH Trainer (Texas Limit Hold 'Em Trainer)

Baseline: v1.9 APPROVED by user on 2026-11-17
Dream slug: limit-holdem-trainer   ·   Vision: dreams/limit-holdem-trainer/vision.md   ·   Storyboards: https://claude.ai/artifact/KjdG7AZdq291WAko7bmZXT (source: dreams/limit-holdem-trainer/storyboards/)

## Goals
- G-1: Trustworthy advice — the same game situation always produces the same recommendation, and 100% of the golden-spot test suite passes.
- G-2: Fewer mistakes — the user's major-error rate per 100 hands in hands 4,001–5,000 is at most half the rate in their first 1,000 hands.
- G-3: Better results — BB/100 against the same line-up trends upward across sessions and is positive against the Mixed line-up after 5,000 hands.
- G-4: Healthier play style — at least 4 of the 5 tracked style stats are inside the healthy range for the table size.
- G-5: Practice volume — at Rapid speed, at least 200 hands per hour are playable.

## Glossary
| Term | Definition |
|---|---|
| TLH Trainer | This application (name and logo per Q-27) |
| Session | A continuous run of hands at one table configuration, from Start game until the user leaves the table (cash) or the sit-and-go ends |
| Paused session | A session that was interrupted (app closed or user went Home) and has not been ended |
| Cash game | Game type with fixed limits; players may rebuy after busting |
| Sit-and-go (SNG) | Single-table tournament: everyone starts with the same chips, limits rise on a schedule, play ends when one player holds all chips |
| Small bet / big bet | Fixed bet size on preflop and flop (small bet) and on turn and river (big bet = 2 × small bet) |
| Stake | A small bet / big bet pair, written $small/$big, e.g. $4/$8 |
| Big bet (BB) | Unit for amounts and win rate; BB/100 = big bets won per 100 hands |
| Cap | Maximum of one bet plus three raises per betting round |
| Street | Betting round: preflop, flop, turn, river |
| Line-up | The set of bots at the table and their styles |
| Line-up preset | A named, predefined line-up: Mixed, Tough or Soft; a session with edited seat styles is recorded as Custom |
| Bot style | Tight-aggressive (TAG), Calling station (loose-passive), Maniac (loose-aggressive), Rock (very tight, passive) |
| Reference size | A table size with its own tuned charts and ranges: heads-up (2), 6-max (6), full ring (9–10) |
| Approximate advice | Advice for a table size that is not a reference size, computed with the mapped reference size and labelled "approximate" |
| Advice engine | The component that produces recommendations, hints and grades |
| Golden spot | A curated game situation with an agreed recommended action, used as a regression test for the advice engine |
| Grade | Per-decision review result: Correct, Minor error or Major error (Q-19, Q-42) |
| Rapid / Realistic speed | Bot pacing: Rapid = bots act without artificial delay; Realistic = bots pause as live players would |

## User classes and permissions
| User class | Can | Cannot |
|---|---|---|
| Learner (single local user) | Everything in the app: configure and play sessions, use hints, view reviews, reports and statistics, change settings, reset all data | Play for real money; play against other humans; access data from another browser or device |

## Area 1 — Set up a session (Splash, Home, Game Config)

### REQ-001: Splash screen on launch
- Type: Functional
- Area: Set up a session
- Priority: Should
- Status: Confirmed
- Statement: When the app launches, TLH Trainer shall show the splash screen with the TLH logo until the rules engine and strategy data have loaded, then open the Home screen without user input.
- Clauses:
  - REQ-001.1: The splash screen shows the TLH logo image and a loading indicator.
  - REQ-001.2: When loading completes, the Home screen opens without any click or key press.
  - REQ-001.3: If loading fails, then the splash screen shows an error message and a Retry button that restarts loading.
- Fit criterion: Launch the installed app → splash with logo visible → Home opens automatically; with strategy data made unloadable in a test build → error message and Retry shown.
- Rationale: Branding (Q-27) and a defined state while the engine initialises; supports G-5 by not blocking with a click.
- Source: vision §4a; Q-24, Q-27; proposed-by-Claude (auto-continue, error state); confirmed Q-43
- Depends on: none

### REQ-002: Home screen menu
- Type: Functional
- Area: Set up a session
- Priority: Must
- Status: Confirmed
- Statement: The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- Clauses:
  - REQ-002.1: Home shows the TLH logo and the name "TLH Trainer".
  - REQ-002.2: New game opens the Game Config screen.
  - REQ-002.3: Statistics opens the Statistics screen; Settings opens the Settings screen.
  - REQ-002.4: While a paused session exists, Home shows Resume session with its game type, table size, stake and hands played.
  - REQ-002.5: While no paused session exists, Resume session is not shown.
  - REQ-002.6: For a paused sit-and-go, Resume session shows the current level instead of the stake.
- Fit criterion: With and without a paused session in storage, Home shows exactly the expected entries and each opens the named screen.
- Rationale: Entry point to every user activity (vision §4).
- Source: vision §4a; storyboard Home; confirmed Q-43
- Depends on: REQ-004

### REQ-003: Last-session snapshot and first-use state on Home
- Type: Functional
- Area: Set up a session
- Priority: Could
- Status: Confirmed
- Statement: While at least one session has ended, the Home screen shall show a snapshot of the most recent ended session; while none has ended, it shall show a first-use message instead.
- Clauses:
  - REQ-003.1: The snapshot shows game type, table size, stake, hands played, BB/100, major errors per 100 hands and the top leak.
  - REQ-003.2: The snapshot has a link that opens that session's report.
  - REQ-003.3: With no ended sessions, Home shows the text "No sessions yet — start a new game to begin training." and no snapshot.
  - REQ-003.4: When the snapshot's session had no leaks, the snapshot shows "Top leak: none".
  - REQ-003.5: When the snapshot's session was a sit-and-go, it shows the finishing position (e.g. 3rd of 6) instead of stake and BB/100.
- Fit criterion: Fresh install → first-use message; after ending one session → snapshot values equal that session's report values.
- Rationale: Keeps progress visible at a glance (G-2, G-3).
- Source: storyboard Home; proposed-by-Claude; confirmed Q-43
- Depends on: REQ-004

### REQ-004: Pause, resume and end a session
- Type: Functional
- Area: Set up a session
- Priority: Must
- Status: Confirmed
- Statement: When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.
- Clauses:
  - REQ-004.1: At most one paused session exists at any time.
  - REQ-004.2: Closing the app mid-hand loses only the unfinished hand: the paused session resumes at the start of the next hand with stacks as they were before that hand began.
  - REQ-004.3: Resume session restores game type, table size, stake, line-up, seats, stacks, dealer button position, hand count and SNG level.
  - REQ-004.4: Starting a New game while a paused session exists first asks the user to confirm ending the paused session; on confirm the paused session ends and its report is saved; on cancel nothing changes.
  - REQ-004.5: Leave table ends the session and opens its Session Report.
  - REQ-004.6: An unfinished hand abandoned by closing the app is not counted in any statistic.
  - REQ-004.7: When the user chooses Leave table during a hand, a dialog asks "Leave now? Your hand will be folded."; on confirm the user's hand is folded, the hand plays to completion and is recorded, and then the session ends; on cancel play continues unchanged.
  - REQ-004.8: After the user confirms Leave table mid-hand, the user's hand is folded immediately even when another player is to act; this forced fold is not graded and is not counted in error rates or leaks. The forced fold forfeits the user's chips already in the pot; if the user held the top bet, the others need only match the highest bet still live (preflop at least the big blind).
  - REQ-004.9: The Table header has a Home control that pauses the session and opens Home; used mid-hand, the unfinished hand is abandoned exactly as when the app is closed (REQ-004.2, REQ-004.6).
- Fit criterion: Play 10 hands, close app mid-hand, relaunch → Resume shows 10 hands; resuming deals hand 11 with stacks equal to the end of hand 10.
- Rationale: Practice happens in short sittings; avoids corrupting stats with half hands.
- Source: storyboard Home/Table; proposed-by-Claude; confirmed Q-43
- Depends on: none

### REQ-005: Choose game type and table size
- Type: Functional
- Area: Set up a session
- Priority: Must
- Status: Confirmed
- Statement: The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- Clauses:
  - REQ-005.1: Game type options are exactly Cash game and Sit-and-go; default is the last used value (REQ-012).
  - REQ-005.2: Players options are the integers 2 to 10.
  - REQ-005.3: When the chosen size is not a reference size, the screen states that advice will be approximate and names the reference size used.
  - REQ-005.4: Table sizes map to reference sizes as: 2 → heads-up; 3, 4, 5, 6, 7 → 6-max; 8, 9, 10 → full ring. Sizes 2, 6, 9 and 10 are exact; 3, 4, 5, 7 and 8 are approximate.
- Fit criterion: Each size 2–10 can be selected; the approximate notice appears for exactly 3, 4, 5, 7, 8 with the mapped reference size named.
- Rationale: Q-6 (configurable 2–10), Q-10 (three tuned sizes + nearest).
- Source: Q-6, Q-10, Q-11; mapping proposed-by-Claude; confirmed Q-43
- Depends on: none

### REQ-006: Stakes and blinds
- Type: Business rule
- Area: Set up a session
- Priority: Must
- Status: Confirmed
- Statement: For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- Clauses:
  - REQ-006.1: The stake list is exactly $2/$4, $3/$6, $4/$8, $6/$12, $10/$20, $20/$40, default $4/$8 on first use.
  - REQ-006.2: Blinds per stake: $2/$4 → $1/$2; $3/$6 → $1/$3; $4/$8 → $2/$4; $6/$12 → $3/$6; $10/$20 → $5/$10; $20/$40 → $10/$20.
  - REQ-006.3: All money is play money; no screen offers deposits, payments or real-money conversion.
  - REQ-006.4: The stake selector is hidden when Sit-and-go is chosen.
- Fit criterion: Unit test of the blind table for all six stakes; UI test that the list contains exactly six entries.
- Rationale: Real casino conventions (vision principle 4).
- Source: Q-34, Q-39; confirmed Q-43
- Depends on: REQ-005

### REQ-007: Cash game buy-in and rebuy
- Type: Business rule
- Area: Set up a session
- Priority: Must
- Status: Confirmed
- Statement: In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.
- Clauses:
  - REQ-007.1: The buy-in is 20 × the big bet of the chosen stake (e.g. $160 at $4/$8); the user cannot change it.
  - REQ-007.2: When the user's stack is $0 at the end of a hand, a dialog offers Rebuy and Leave table; no further hand is dealt until the user chooses.
  - REQ-007.3: Rebuy sets the user's stack to the buy-in and the session continues; total rebuys are counted in the session result.
  - REQ-007.4: The user cannot add chips while their stack is above $0.
  - REQ-007.5: When a bot's stack is $0 at the end of a hand, it leaves and a new bot of the same style takes the seat with a fresh buy-in before the next hand.
  - REQ-007.6: When the user busts while the Hand Review panel is open, the panel's Deal next hand control reads Continue, and Continue opens the Rebuy / Leave table dialog.
  - REQ-007.7: Retired (TASK-6.25 Q-1): a replacement bot keeps the busted bot's style (REQ-007.5), in a Custom session too. Was: in a session recorded as Custom, a replacement bot's style is drawn at random from all four styles.
  - REQ-007.8: Retired (TASK-6.25 Q-1): a replacement bot keeps the busted bot's style (REQ-007.5). Was: a replacement bot's style is drawn from the styles the session's preset assigns at the current table size; at heads-up with the Tough preset the replacement is TAG.
- Fit criterion: Scripted session where the user busts → dialog shown, Rebuy → stack = 20 big bets; bot bust → new bot name in the seat with a full buy-in.
- Rationale: Q-35, Q-38, Q-40.
- Source: Q-35, Q-38, Q-40; confirmed Q-43
- Depends on: REQ-006

### REQ-008: Sit-and-go structure
- Type: Business rule
- Area: Set up a session
- Priority: Should
- Status: Confirmed
- Statement: In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.
- Clauses:
  - REQ-008.1: Starting chips are 1,500 for every player.
  - REQ-008.2: Limit schedule (small bet/big bet, blinds = half small bet / small bet): L1 20/40, L2 30/60, L3 40/80, L4 60/120, L5 100/200, L6 150/300, L7 200/400, L8 300/600, L9 400/800, L10 600/1,200; from L10 onward the limits stay at L10.
  - REQ-008.3: The level advances after every 10 hands dealt.
  - REQ-008.4: Busted bots are not replaced; their seats stay empty.
  - REQ-008.5: When the user busts, the sit-and-go ends for the user and the remaining hands are not played out; the user's finishing position is the number of players left including the user.
  - REQ-008.6: The result recorded is the user's finishing position out of the starting number of players (e.g. 2nd of 6); no prize money is shown.
  - REQ-008.7: Chips in a sit-and-go are shown as plain numbers without a $ sign.
  - REQ-008.8: The table header shows the current level, its limits and the hands remaining until the next level.
  - REQ-008.9: When the user busts while the Hand Review panel is open, the panel's Deal next hand control reads See results, which ends the session and opens the Session Report.
  - REQ-008.10: If the user chooses Leave table in a sit-and-go while holding chips, the finishing position recorded is the number of players left including the user, and the remaining hands are not played.
  - REQ-008.11: When the user wins all the chips while the Hand Review panel is open, the panel's Deal next hand control reads See results, which ends the session and opens the Session Report.
  - REQ-008.12: From level 10 onward the header shows "Level 10 (final)" with no countdown to the next level.
  - REQ-008.13: When the sit-and-go ends while the Hand Review panel is closed, the Session Report opens 1.5 seconds after the final hand's result is shown.
- Fit criterion: Scripted SNG: level changes at hands 11, 21, …; user bust with 3 players left → result "3rd of 6".
- Rationale: Q-11, Q-14, Q-36, Q-41.
- Source: Q-36, Q-41; numbers proposed-by-Claude; confirmed Q-43
- Depends on: REQ-005

### REQ-009: Line-up presets and per-seat styles
- Type: Functional
- Area: Set up a session
- Priority: Must
- Status: Confirmed
- Statement: The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.
- Clauses:
  - REQ-009.1: Presets assign styles to seats as: Mixed — styles cycle TAG, Calling station, Maniac, Rock in seat order; Tough — all TAG except one Maniac; Soft — Calling stations and Rocks alternating.
  - REQ-009.2: Each bot seat offers the styles TAG, Calling station, Maniac, Rock.
  - REQ-009.3: Changing a seat's style does not change other seats.
  - REQ-009.4: Each bot has a display name unique within the table.
  - REQ-009.5: Randomise line-up assigns a style chosen at random to every bot seat.
  - REQ-009.6: A session whose seat styles differ from the chosen preset's assignment is recorded with the line-up name Custom.
  - REQ-009.7: At heads-up, the Tough preset seats one TAG bot.
  - REQ-009.8: Preset style cycles run over bot seats only, starting with the first bot seat clockwise from the user; the Tough preset's Maniac takes that first bot seat.
- Fit criterion: For each preset and table size 2–10, the seat styles equal the rule in REQ-009.1; a per-seat change persists into the started session.
- Rationale: Q-12 (mix of player types), Q-37.
- Source: Q-12, Q-37; preset compositions proposed-by-Claude; confirmed Q-43
- Depends on: REQ-005

### REQ-010: User seat and starting dealer button
- Type: Business rule
- Area: Set up a session
- Priority: Should
- Status: Confirmed
- Statement: When a session starts, TLH Trainer shall seat the user at a seat chosen at random and place the dealer button at a seat chosen at random.
- Clauses:
  - REQ-010.1: The user's seat is drawn uniformly from all seats.
  - REQ-010.2: The starting dealer button seat is drawn uniformly from all seats.
  - REQ-010.3: The user's seat is always drawn at the bottom centre of the Table screen regardless of seat number.
- Fit criterion: Over 1,000 seeded session starts, each seat receives the user and the button 1/n of the time ±3 percentage points.
- Rationale: Practise from every position.
- Source: storyboard Config; proposed-by-Claude; confirmed Q-43
- Depends on: REQ-005

### REQ-011: Speed choice
- Type: Functional
- Area: Set up a session
- Priority: Should
- Status: Confirmed
- Statement: The Game Config screen shall let the user choose Rapid or Realistic speed, defaulting to the speed set in Settings.
- Clauses:
  - REQ-011.1: Rapid: each bot action is displayed within 300 ms of the previous action.
  - REQ-011.2: Realistic: each bot waits a random delay between 0.8 s and 3.0 s before acting.
  - REQ-011.3: The speed can be changed during a session from the Table screen and takes effect from the next bot action.
- Fit criterion: Timed playtest: at Rapid, median gap between consecutive bot actions ≤ 300 ms; at Realistic, all gaps within 0.8–3.0 s.
- Rationale: G-5 (200+ hands/hour), Q-15.
- Source: Q-15; timings proposed-by-Claude; confirmed Q-43
- Depends on: none

### REQ-012: Remember last configuration
- Type: Functional
- Area: Set up a session
- Priority: Could
- Status: Confirmed
- Statement: When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.
- Clauses:
  - REQ-012.1: Game type, table size, stake, line-up preset and per-seat styles are pre-filled from the last started session.
  - REQ-012.2: On first use the defaults are Cash game, 6 players, $4/$8, Mixed preset, Rapid.
  - REQ-012.3: The speed field is pre-filled from the Settings default speed (REQ-050.1), not from the last started session.
- Fit criterion: Start a session with non-default values, return to Game Config → same values shown; fresh install → defaults shown.
- Rationale: Fewer clicks between practice sessions (G-5).
- Source: storyboard sticky (Config); proposed-by-Claude; confirmed Q-43
- Depends on: none

## Area 2 — Play hands (rules engine and Table screen)

### REQ-013: Deck, shuffle and replay code
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: For every hand, the engine shall shuffle a standard 52-card deck with a Fisher–Yates shuffle driven by a pseudo-random generator seeded from a cryptographically secure random source, and shall record that seed as the hand's replay code.
- Clauses:
  - REQ-013.1: The deck contains each of the 52 cards exactly once.
  - REQ-013.2: The per-hand seed comes from crypto.getRandomValues (browser) or the Node crypto module (headless).
  - REQ-013.3: Replaying a hand with the same replay code, seats, stacks, button and actions reproduces the same cards in the same order.
  - REQ-013.4: The replay code is not shown anywhere before the hand ends.
  - REQ-013.5: The Hand Review panel shows the hand number and the replay code in small text.
- Fit criterion: Property test over 10,000 seeds: decks are permutations of 52 cards; same seed → identical deck; chi-square test of first-card position over 100,000 shuffles passes at p > 0.01.
- Rationale: Fair, realistic dealing (vision principle 4); reproducible hands for testing and bug reports (Q-47, G-1).
- Source: Q-3, Q-47; proposed-by-Claude; confirmed Q-48
- Depends on: none

### REQ-014: Hand sequence
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: The engine shall play each hand in the sequence: post blinds, deal two hole cards to each player, preflop betting, flop (3 board cards) and betting, turn (1 card) and betting, river (1 card) and betting, then showdown, ending the hand early when all but one player have folded.
- Clauses:
  - REQ-014.1: With 3 or more players, the player left of the button posts the small blind and the next player posts the big blind.
  - REQ-014.2: Hole cards are dealt one at a time clockwise starting left of the button, two rounds.
  - REQ-014.3: Preflop action starts with the player left of the big blind; on later streets it starts with the first active player left of the button.
  - REQ-014.4: A betting round ends when every active player not all-in has acted and all have put in the same amount, or all but one have folded.
  - REQ-014.5: When all but one player have folded, that player wins the pot without showing cards and no further cards are dealt.
  - REQ-014.6: When all remaining players but at most one are all-in, the remaining board cards are dealt without further betting.
- Fit criterion: Unit tests per clause with scripted decks; property test over 100,000 random hands that every hand terminates in a legal end state.
- Rationale: Real casino rules (vision principle 4).
- Source: vision §5; proposed-by-Claude; confirmed Q-48
- Depends on: REQ-013

### REQ-015: Heads-up blinds and order
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: While exactly two players are dealt in, the engine shall make the button post the small blind and act first preflop and last on the flop, turn and river.
- Clauses:
  - REQ-015.1: Heads-up, the button posts the small blind and the other player posts the big blind.
  - REQ-015.2: Heads-up, the button acts first preflop.
  - REQ-015.3: Heads-up, the non-button player acts first on flop, turn and river.
- Fit criterion: Scripted heads-up hands confirm posting and action order on every street.
- Rationale: Standard heads-up rule; needed for 2-player tables and SNG endgames.
- Source: proposed-by-Claude; confirmed Q-48
- Depends on: REQ-014

### REQ-016: Fixed-limit betting and cap
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: The engine shall restrict every bet and raise to exactly one small bet on preflop and flop and exactly one big bet on turn and river, and shall cap each street at one bet plus three raises, including when heads-up.
- Clauses:
  - REQ-016.1: Preflop and flop bets and raises are exactly one small bet; turn and river bets and raises are exactly one big bet.
  - REQ-016.2: Preflop, the big blind counts as the first bet, so at most three raises follow it.
  - REQ-016.3: After the fourth bet on a street, the only legal actions are call and fold.
  - REQ-016.4: The cap applies with any number of players, including heads-up.
  - REQ-016.5: An all-in raise of less than half a full bet does not reopen betting for players who have already acted; an all-in raise of half a full bet or more counts as a full raise.
- Fit criterion: Unit tests at every street with 2–10 players; property test that no generated hand has more than 4 bets on any street.
- Rationale: Q-20 (bet + 3 raises always).
- Source: Q-20; REQ-016.5 proposed-by-Claude (common casino rule); confirmed Q-48
- Depends on: REQ-014

### REQ-017: Legal actions only
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.
- Clauses:
  - REQ-017.1: When no bet is facing the user, the action bar offers Check and Bet (with amount); Fold is not offered.
  - REQ-017.2: When a bet is facing the user, the action bar offers Fold, Call (with amount) and Raise (with "Raise to" amount) unless the street is capped.
  - REQ-017.3: When the user's stack is smaller than the call amount, Call is labelled "Call all-in" with the stack amount and Raise is not offered.
  - REQ-017.4: An illegal action submitted to the engine is rejected with an error and leaves the game state unchanged.
  - REQ-017.5: The action bar is disabled while it is not the user's turn.
  - REQ-017.6: Preflop in an unraised pot, the big blind's action bar offers Check and Raise; Fold is not offered.
  - REQ-017.7: A player whose stack exceeds the call amount but is smaller than a full bet or raise is offered a bet or raise all-in; the buttons read "Bet all-in $X" or "Raise all-in to $X", and REQ-016.5 decides whether betting reopens.
- Fit criterion: Property test: for 100,000 random states, the offered set equals the engine's legal set; injecting an illegal action leaves state byte-identical.
- Rationale: Q-45 (no folding when check is free); realistic rules.
- Source: Q-45; proposed-by-Claude; confirmed Q-48
- Depends on: REQ-016

### REQ-018: All-in and side pots
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: When a player cannot match a bet, the engine shall let that player call all-in for the chips they have and shall create side pots so that each player can win only the amounts they matched.
- Clauses:
  - REQ-018.1: An all-in player stays in the hand to showdown and makes no further actions.
  - REQ-018.2: Each pot records the set of players eligible to win it.
  - REQ-018.3: Each pot is awarded only among its eligible players.
  - REQ-018.4: Any bet that no other player called is returned to the bettor before showdown, unless the bettor has been folded by Leave table (REQ-004.8).
  - REQ-018.5: Total chips at the table are identical before and after every hand (chip conservation).
- Fit criterion: Unit tests with three-way and four-way all-ins at different stack sizes; property test of chip conservation over 100,000 random hands.
- Rationale: Correct pots are a precondition for trust (G-1).
- Source: vision §5; proposed-by-Claude; confirmed Q-48
- Depends on: REQ-014

### REQ-019: Showdown and pot award
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.
- Clauses:
  - REQ-019.1: Hand categories rank, high to low: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card; A-2-3-4-5 is the lowest straight.
  - REQ-019.2: Within a category, ties are broken by kickers; suits never break ties.
  - REQ-019.3: A split pot that does not divide evenly gives the odd whole dollar (or chip) to the first tied player left of the button.
  - REQ-019.4: The last player to bet or raise on the river shows first; if nobody bet on the river, the first active player left of the button shows first.
  - REQ-019.5: Each later bot shows only if its hand beats or ties the highest-ranking hand shown so far; otherwise it mucks and its cards stay hidden (Q-33).
  - REQ-019.6: The user's own hole cards are always visible to the user.
  - REQ-019.7: The winning hand's name (e.g. "Pair of kings") is displayed with the amount won.
  - REQ-019.8: Showdown is resolved pot by pot, starting with the last side pot created and ending with the main pot; for each pot a bot shows if its hand can win that pot, and mucking in one pot never forfeits another pot the bot can win.
  - REQ-019.9: When a split leaves more than one odd whole dollar (or chip), the odd units go one each to the tied players in clockwise order starting left of the button.
- Fit criterion: Hand evaluator agrees with a reference table of all 7,462 distinct five-card hand ranks; scripted showdowns verify order, mucking and odd-chip award.
- Rationale: Real rules; realistic information (Q-33).
- Source: Q-33; proposed-by-Claude; confirmed Q-48
- Depends on: REQ-018

### REQ-020: Button and blind movement
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: After each hand, the engine shall move the button to the next seated player who has chips, and the next two such players shall post the small and big blinds.
- Clauses:
  - REQ-020.1: Seats whose player has no chips (busted in a sit-and-go) are skipped for the button and blinds.
  - REQ-020.2: No player ever posts a missed or dead blind.
  - REQ-020.3: When play becomes heads-up, the heads-up rules of REQ-015 apply from the next hand.
  - REQ-020.4: A player who cannot cover a blind posts all their chips and is all-in.
- Fit criterion: Scripted SNG with busts at different positions confirms button and blind seats each hand.
- Rationale: Q-44 (simplified moving button).
- Source: Q-44; confirmed Q-48
- Depends on: REQ-015

### REQ-021: Table display
- Type: Interface
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: The Table screen shall show, for every seat, the player name, style label (unless hidden in Settings), stack, chips put in on the current street, last action and whether the player still holds cards, together with the board, the pot total, the dealer button and which player is to act.
- Clauses:
  - REQ-021.1: Each bot seat shows name, style label, stack, current-street amount, last action and a card-back marker while it holds cards.
  - REQ-021.2: When the Settings toggle "Show opponent styles" is off, style labels are not shown at the table.
  - REQ-021.3: The user's seat is drawn at the bottom centre with both hole cards face up, stack and position name (e.g. Cutoff).
  - REQ-021.4: The board shows dealt cards and empty placeholders for undealt ones.
  - REQ-021.5: The pot total is shown; when side pots exist each pot amount is shown separately.
  - REQ-021.6: The dealer button marker is shown at the button seat.
  - REQ-021.7: The seat to act is highlighted.
  - REQ-021.8: The header shows game type, players, stake (or SNG level) and hand number, plus a Leave table control.
- Fit criterion: Playwright snapshot of a scripted 6-max hand at each street matches the expected text for every seat.
- Rationale: Q-31 (style labels on by default), storyboard Table.
- Source: Q-31; storyboard Table; confirmed Q-48
- Depends on: REQ-014

### REQ-022: Action bar
- Type: Interface
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: When it is the user's turn, the Table screen shall show an action bar of buttons labelled with the action and its exact amount, plus a Hint button, operated by mouse or touch.
- Clauses:
  - REQ-022.1: Amount labels read "Call $4", "Bet $4", "Raise to $8", "Call all-in $3" (chip numbers without $ in a sit-and-go).
  - REQ-022.2: The Hint button is present whenever the action bar is enabled.
  - REQ-022.3: No single-key keyboard shortcuts trigger actions.
  - REQ-022.4: Each action button is at least 44 × 44 CSS px.
- Fit criterion: UI test of labels for check, bet, call, raise, capped and all-in states; key presses F, C, R, H, Space trigger nothing.
- Rationale: Q-46 (mouse only); avoids misclicks; clear amounts teach limit structure.
- Source: Q-46; storyboard Table; confirmed Q-48
- Depends on: REQ-017

### REQ-023: Action log
- Type: Interface
- Area: Play hands
- Priority: Should
- Status: Confirmed
- Statement: The Table screen shall show an action log listing every action of the current hand in order, which the user can collapse and expand.
- Clauses:
  - REQ-023.1: Each entry names the player, the action and the amount (e.g. "Ben bets $4").
  - REQ-023.2: Street changes appear as entries with the new board cards and pot (e.g. "Flop: K♠ 9♦ 4♣ (pot $26)").
  - REQ-023.3: The log is cleared when a new hand starts.
  - REQ-023.4: The collapsed or expanded state is kept across hands and sessions.
- Fit criterion: Scripted hand → log entries equal the expected list in order.
- Rationale: Lets a beginner follow the action at Rapid speed.
- Source: storyboard Table; proposed-by-Claude; confirmed Q-48
- Depends on: REQ-021

### REQ-024: Between hands
- Type: Functional
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.
- Clauses:
  - REQ-024.1: The result shows each winner, the pot amount won and the winning hand name when there was a showdown.
  - REQ-024.2: While the Hand Review panel is open, the next hand waits for Deal next hand.
  - REQ-024.3: While the panel is not open (user folded preflop, or auto-open is off), the next hand is dealt 1.5 s after the result is shown.
  - REQ-024.4: Bots never act during the user's turn and the user never waits for a bot when no bot is to act.
  - REQ-024.5: The user has no time limit for a decision.
  - REQ-024.6: An automated run at Rapid speed with a scripted user completes 200 hands in under 60 minutes (verifies G-5).
- Fit criterion: Timed UI test of both paths; at Rapid with auto-open off and the user folding every hand, 200 hands complete in under 60 minutes.
- Rationale: G-5 (200+ hands/hour), Q-32 (review after hands played).
- Source: Q-32, Q-15; timings proposed-by-Claude; confirmed Q-48
- Depends on: REQ-011

### REQ-025: No hidden-information leakage
- Type: Business rule
- Area: Play hands
- Priority: Must
- Status: Confirmed
- Statement: The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- Clauses:
  - REQ-025.1: Bot decision code receives a view of the game state that excludes other players' hole cards and undealt cards.
  - REQ-025.2: Hints and grades for a decision use only the user's view at that decision point.
  - REQ-025.3: A decision is graded by the information available when it was made, not by the cards that came later or by the outcome.
- Fit criterion: Type-level separation (bot and advice APIs accept only the PlayerView type) plus a test that altering hidden cards never changes a bot action, hint or grade for a fixed view.
- Rationale: Fair bots (A-2) and honest grading (G-1, Q-33).
- Source: Q-33; proposed-by-Claude; confirmed Q-48
- Depends on: REQ-014

## Area 3 — Opponents (bots)

### REQ-026: Bots built on the advice engine
- Type: Business rule
- Area: Opponents
- Priority: Must
- Status: Confirmed
- Statement: Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.
- Clauses:
  - REQ-026.1: A TAG bot chooses the advice engine's recommended action except where its mixing rule (REQ-028) selects an alternative.
  - REQ-026.2: Calling station, Maniac and Rock bots apply documented deviations: Calling station calls where the advice is fold or raise more often than TAG; Maniac bets or raises where the advice is check or call more often than TAG; Rock folds every preflop hand outside its narrower starting range.
  - REQ-026.3: Each style's parameters are stored in one data file per style and documented with a description of the style.
- Fit criterion: Code review confirms bots call the advice engine with a PlayerView; harness stats meet REQ-027 bands.
- Rationale: One strategy source keeps bots and advice consistent (G-1, A-2).
- Source: Q-12, Q-49; proposed-by-Claude; confirmed Q-52
- Depends on: REQ-025

### REQ-027: Measurable style profiles
- Type: Business rule
- Area: Opponents
- Priority: Must
- Status: Confirmed
- Statement: In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.
- Clauses:
  - REQ-027.1: TAG — VPIP 18–26%, PFR 14–22%, aggression (bets + raises as % of bets, raises and calls) 45–65%.
  - REQ-027.2: Calling station — VPIP 45–65%, PFR 3–10%, aggression 10–25%.
  - REQ-027.3: Maniac — VPIP 50–75%, PFR 35–60%, aggression 65–85%.
  - REQ-027.4: Rock — VPIP 8–15%, PFR 6–12%, aggression 35–55%.
  - REQ-027.5: The playtest CLI reports each style's measured values and exits with failure when any value is outside its band.
  - REQ-027.6: Aggression in these bands uses the REQ-045.3 definition (flop, turn and river actions only).
- Fit criterion: `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` exits 0.
- Rationale: Recognisable styles teach adjustment (Q-12); measurable so tests can hold them.
- Source: Q-12, Q-51; bands proposed-by-Claude; confirmed Q-52
- Depends on: REQ-026

### REQ-028: Reproducible mixed decisions
- Type: Business rule
- Area: Opponents
- Priority: Must
- Status: Confirmed
- Statement: Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.
- Clauses:
  - REQ-028.1: Bot randomness comes only from a generator seeded from the hand's replay code and the bot's seat.
  - REQ-028.2: Replaying a hand with the same replay code and the same user actions reproduces every bot action.
  - REQ-028.3: No bot plays a fully deterministic strategy in spots its style marks as mixed.
- Fit criterion: Replay test over 1,000 recorded hands reproduces identical action sequences; harness shows each mixed spot type uses more than one action.
- Rationale: Bots not exploitable by one trick (A-2, R-5); replayable hands (Q-47).
- Source: Q-47; proposed-by-Claude; confirmed Q-52
- Depends on: REQ-013

### REQ-029: Fixed styles (no adaptation)
- Type: Business rule
- Area: Opponents
- Priority: Should
- Status: Confirmed
- Statement: A bot shall keep the same style parameters for the whole session regardless of how the user plays.
- Clauses:
  - REQ-029.1: Bot parameters do not change in response to the user's actions or statistics.
  - REQ-029.2: Bots request advice with the typical-player basis only; observed opponent statistics (REQ-035.2) are never used in bot decisions.
  - REQ-029.3: A bot's decision depends only on the current hand: its view of this hand, the replay code and its seat. Earlier showdowns and anything else carried between hands never change a bot action.
- Fit criterion: Two playtests with different user strategies and the same seeds give each bot identical parameters.
- Rationale: Predictable opponents are what a learner practises exploiting (Q-49).
- Source: Q-49; confirmed Q-52
- Depends on: REQ-026

### REQ-030: TAG bot strength
- Type: Business rule
- Area: Opponents
- Priority: Should
- Status: Confirmed
- Statement: In headless playtests of 100,000 hands, a TAG bot seated with five bots of any single weaker style shall win at a positive rate.
- Clauses:
  - REQ-030.1: TAG vs five Calling stations: TAG BB/100 > 0 with 95% confidence.
  - REQ-030.2: TAG vs five Maniacs: TAG BB/100 > 0 with 95% confidence.
  - REQ-030.3: TAG vs five Rocks: TAG BB/100 > 0 with 95% confidence.
  - REQ-030.4: The playtest CLI reports each bot's BB/100 with its 95% confidence interval.
- Fit criterion: Three harness runs (one per weak style) each report TAG's lower 95% bound above 0.
- Rationale: Q-51; beating the bots must mean something (G-3, R-5).
- Source: Q-51; confirmed Q-52
- Depends on: REQ-027

### REQ-031: Opponent stats on hover or tap
- Type: Interface
- Area: Opponents
- Priority: Should
- Status: Confirmed
- Statement: When the user hovers over or taps a bot's seat, the Table screen shall show that bot's VPIP, PFR and aggression as observed this session and the number of hands they are based on.
- Clauses:
  - REQ-031.1: The panel shows VPIP %, PFR %, aggression % and "over N hands" for the current session.
  - REQ-031.2: Below 10 observed hands, each value shows "—" with the hand count.
  - REQ-031.3: When a seat gets a new bot (REQ-007.5), its observed stats start from zero.
  - REQ-031.4: The panel closes when the pointer leaves the seat or the user taps elsewhere.
- Fit criterion: Scripted 20-hand session → hover values equal values recomputed from the hand records.
- Rationale: Teaches reading opponents from numbers (Q-50).
- Source: Q-50; confirmed Q-52
- Depends on: REQ-021

## Area 4 — Advice engine

### REQ-032: Preflop charts
- Type: Data
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: The advice engine shall take every preflop recommendation from authored charts that give, for each reference size, position and preflop situation, the action for each of the 169 starting-hand classes.
- Clauses:
  - REQ-032.1: Charts exist for heads-up, 6-max and full ring.
  - REQ-032.2: Situations covered per position: unopened pot, facing one or more limpers, facing a raise, facing a raise and calls, facing a re-raise of your own raise, facing a re-raise when you have not raised, and blind defence; blind defence is split by whether the raiser sits in an early or a late position.
  - REQ-032.3: Each chart cell holds one action (fold, call, raise) and a borderline flag, plus zero or one acceptable alternative action.
  - REQ-032.4: Every chart file carries a written justification of its ranges in plain English.
  - REQ-032.5: Charts are data files loaded by the engine, not hard-coded logic.
  - REQ-032.6: When facing a fourth bet preflop (a re-raise of a re-raise), the advice uses the facing-a-re-raise-of-your-own-raise chart if you made a preflop raise, otherwise the facing-a-re-raise-when-you-have-not-raised chart; if the street is capped, a raise recommendation becomes call.
- Fit criterion: Validation test: every (size, position, situation) has all 169 hand classes assigned; justification present for each chart.
- Rationale: Explainable, testable preflop advice (Q-7, G-1).
- Source: Q-7, Q-10, Q-53; confirmed Q-57
- Depends on: none

### REQ-033: Postflop recommendation method
- Type: Business rule
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: For each postflop decision, the advice engine shall compute the hero's equity against each opponent's estimated range and the pot odds, and recommend fold, check, call, bet or raise by documented rules comparing those numbers.
- Clauses:
  - REQ-033.1: Call is recommended over fold when equity is at least the required equity (call amount ÷ pot after calling). On the turn the required equity also counts the big bet the player will likely face on the river: (call + R) ÷ (pot after calling + 2R), where R is one big bet, capped by the player's chips left after the call, and 0 when no opponent can still bet.
  - REQ-033.2: Bet for value is recommended when equity against the range that would call exceeds 50%; raise for value, when facing a bet, when it exceeds 65%.
  - REQ-033.3: Drawing hands count implied odds by a documented rule that names the outs used.
  - REQ-033.4: The rules are written in one design document and every rule has a unit test.
  - REQ-033.5: Each recommendation returns the action, equity %, required equity % and the rule that fired.
  - REQ-033.6: "The range that would call" is every hand in the opponent's estimated range that continues against the bet, including hands that would raise.
  - REQ-033.7: The implied-odds allowance is one big bet per opponent still in the hand: required equity = call ÷ (pot after calling + one big bet × opponents still in), applied only to drawing hands with cards to come.
- Fit criterion: Unit test per rule; golden postflop spots (REQ-039) pass.
- Rationale: Rules + equity math (Q-7), explainable numbers (vision principle 1).
- Source: Q-7; proposed-by-Claude; confirmed Q-57
- Depends on: REQ-034, REQ-035

### REQ-034: Equity calculation accuracy
- Type: Business rule
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: The equity calculator shall return each hand's equity against one or more ranges within 1.5 percentage points of the exact value.
- Clauses:
  - REQ-034.1: For heads-up preflop matchups, results are within 1.5 percentage points of exhaustive enumeration (e.g. AA vs KK 81.9%, AKs vs QQ 46.2%).
  - REQ-034.2: For multiway and range-versus-range cases, results are within 1.5 percentage points of an exhaustive or high-sample reference computed offline.
  - REQ-034.3: For a given input, the calculator returns the same number every time (sampling, if used, is seeded from the input).
- Fit criterion: Test suite of 200 matchups against stored exact values; repeated calls return identical results.
- Rationale: Trust requires correct numbers (G-1).
- Source: Q-53; proposed-by-Claude; confirmed Q-57
- Depends on: REQ-019

### REQ-035: Opponent range model
- Type: Business rule
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.
- Clauses:
  - REQ-035.1: Default ranges per (reference size, position, action sequence) are authored data with justification.
  - REQ-035.2: From 30 observed hands, an opponent's preflop range width is scaled toward their observed VPIP and PFR by a documented formula.
  - REQ-035.3: The range model never reads a bot's style label or internal parameters.
  - REQ-035.4: The hint and review show which basis was used: "typical player" or "based on N hands of this opponent".
  - REQ-035.5: Range narrowing sorts each hand into Strong (two pair or better), Pair, Draw (flush draw or open-ended straight draw without a pair) or Air; a bet keeps Strong, Pair and Draw; a check keeps Pair, Draw and Air; a call keeps Pair and Draw; a raise keeps Strong and Draw; the rule is re-applied on every street.
  - REQ-035.6: Observed-statistics scaling uses width = d + (o − d) × min(n, 100) ÷ 100, where d is the default range width and n is the number of observed hands; o is the observed PFR for open-raise ranges, the observed VPIP for calling ranges, and d × observed PFR ÷ typical PFR (at most 100) for three-bet and four-bet ranges, where typical PFR is the midpoint of the healthy PFR range for the table size (REQ-046.1).
- Fit criterion: Test: two opponents with identical actions but different observed stats (≥ 30 hands) produce different ranges; a bot's internal parameters are not reachable from the advice engine's inputs (type check).
- Rationale: Q-55; realistic reading skills; addresses R-2.
- Source: Q-55; threshold and formula proposed-by-Claude; confirmed Q-57
- Depends on: REQ-025, REQ-031

### REQ-036: Deterministic advice
- Type: Business rule
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- Clauses:
  - REQ-036.1: Repeated calls with identical inputs return identical outputs.
  - REQ-036.2: The hint shown during a hand and the review entry for that same decision state the same recommendation and numbers.
- Fit criterion: Harness check over 10,000 recorded decisions: recomputing advice gives identical output; hint vs review equality test.
- Rationale: G-1 (same situation, same advice).
- Source: G-1; proposed-by-Claude; confirmed Q-57
- Depends on: REQ-034

### REQ-037: Plain-English explanations
- Type: Business rule
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: Every recommendation shall include an explanation of at most three sentences in plain English that names and briefly explains the poker concept behind it.
- Clauses:
  - REQ-037.1: The explanation is at most three sentences.
  - REQ-037.2: It names at least one concept from the concept list: pot odds, equity, position, hand strength, outs and draws, implied odds, value bet, bluff, opponent type, initiative.
  - REQ-037.3: A concept is explained in the sentence where it is first named, since there is no glossary screen.
  - REQ-037.4: It quotes the numbers used (equity %, required equity %) when the decision rests on them.
- Fit criterion: Automated check over all golden spots: sentence count ≤ 3, at least one listed concept present, numbers present for postflop spots.
- Rationale: Teach, don't just grade (vision principle 2; Q-9, Q-24).
- Source: Q-9, Q-24; proposed-by-Claude; confirmed Q-57
- Depends on: REQ-033

### REQ-038: Grading rules
- Type: Business rule
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: The grader shall grade each user decision Correct when it matches the recommendation or a listed acceptable alternative, Major error when the margin rules below mark it clearly wrong, and Minor error otherwise.
- Clauses:
  - REQ-038.1: Correct: the action equals the recommended action or the listed acceptable alternative.
  - REQ-038.2: Preflop: a deviation on a chart cell flagged borderline is a Minor error; on any other cell it is a Major error.
  - REQ-038.3: Postflop call/fold: folding when equity exceeds required equity by 10 or more points, or calling when equity is 10 or more points below required equity, is a Major error; smaller margins are Minor errors.
  - REQ-038.4: Postflop bet/raise versus check/call: a deviation is a Major error only when equity against the calling range is 15 or more points away from 50%; otherwise Minor.
  - REQ-038.5: A decision whose margin is within the close-call band (REQ-038.3 under 10 points, REQ-038.4 under 15 points) is never graded Major.
  - REQ-038.6: When the user raises where the advice is fold, or folds where the advice is raise, the call/fold margin of REQ-038.3 decides Minor versus Major.
- Fit criterion: Unit tests at margins of 0, 9.9, 10, 14.9, 15 points for each rule; golden spots include graded examples of each level.
- Rationale: Q-19 (severity levels), Q-54 (close calls never Major).
- Source: Q-19, Q-54; thresholds proposed-by-Claude; confirmed Q-57
- Depends on: REQ-032, REQ-033

### REQ-039: Golden spot suite
- Type: Data
- Area: Advice engine
- Priority: Must
- Status: Confirmed
- Statement: The project shall keep a golden-spot suite of at least 200 clear-cut decisions with justified recommended actions, and the automated test run shall fail if the advice engine disagrees with any of them.
- Clauses:
  - REQ-039.1: At least 100 preflop spots spread over heads-up, 6-max and full ring, and at least 100 postflop spots.
  - REQ-039.2: Each spot records the player view, the recommended action, any acceptable alternative and a written justification.
  - REQ-039.3: Only spots whose answer follows from established limit theory without close judgement are included.
  - REQ-039.4: The suite runs in the standard test command and 100% must pass.
- Fit criterion: `npm test` includes the suite; spot count ≥ 200; pass rate 100%.
- Rationale: G-1; Q-53.
- Source: G-1, Q-53; confirmed Q-57
- Depends on: REQ-033

### REQ-040: Hinted decisions
- Type: Business rule
- Area: Advice engine
- Priority: Should
- Status: Confirmed
- Statement: When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- Clauses:
  - REQ-040.1: A decision is hinted when the Hint was opened at that decision point before the action.
  - REQ-040.2: Hinted decisions show a "hinted" tag in the Hand Review panel.
  - REQ-040.3: The G-2 major-error rate counts only decisions that were not hinted.
  - REQ-040.4: The Session Report shows the number and percentage of decisions that were hinted.
- Fit criterion: Scripted session with 5 hinted Major errors and 5 unhinted → G-2 rate counts 5.
- Rationale: Q-56; keeps the goal measure honest.
- Source: Q-56; confirmed Q-57
- Depends on: REQ-038

### REQ-041: Approximate and short-stack labels
- Type: Business rule
- Area: Advice engine
- Priority: Should
- Status: Confirmed
- Statement: Where the table size is not a reference size, every hint and review entry shall carry the label "approximate"; where the user's stack in a sit-and-go is below 10 big bets, advice shall add a one-sentence short-stack note.
- Clauses:
  - REQ-041.1: At table sizes 3, 4, 5, 7 and 8, hints and review entries show "approximate (based on <reference size>)".
  - REQ-041.2: In a sit-and-go with the user's stack under 10 big bets of the current level, hints and review entries add one short-stack sentence.
  - REQ-041.3: Tournament-specific strategy (ICM, bubble play) is not applied.
- Fit criterion: UI tests at sizes 2–10 for the label; SNG test at 9 and 10 big bets for the note.
- Rationale: Q-10 (nearest size flagged), Q-14 (cash-style SNG advice + short-stack note).
- Source: Q-10, Q-14; confirmed Q-57
- Depends on: REQ-005

## Area 5 — Hint and Hand Review

### REQ-042: Hint on request
- Type: Functional
- Area: Hint and Hand Review
- Priority: Must
- Status: Confirmed
- Statement: When the user clicks Hint during their turn, the Table screen shall show a hint card with the recommended action, the equity and required equity, the explanation, the opponent-model basis and any approximate or short-stack label.
- Clauses:
  - REQ-042.1: The hint card shows recommended action, equity %, required equity %, explanation (REQ-037) and basis (REQ-035.4).
  - REQ-042.2: The hint card does not cover the action bar.
  - REQ-042.3: Clicking Hint again hides the card; taking an action hides it.
  - REQ-042.4: Hints are unlimited.
  - REQ-042.5: Opening the hint marks the decision as hinted (REQ-040).
  - REQ-042.6: For preflop decisions the hint card shows the chart basis (e.g. "From the 6-max chart: raise A9o from the cutoff") instead of equity and required-equity numbers; the numbers are shown for flop, turn and river decisions.
- Fit criterion: UI test: Hint shows all fields for a scripted spot; values equal the advice engine output for that view.
- Rationale: Q-8, Q-30 (answer + reason immediately).
- Source: Q-8, Q-30; confirmed Q-62
- Depends on: REQ-033, REQ-036

### REQ-043: Hand Review panel
- Type: Functional
- Area: Hint and Hand Review
- Priority: Must
- Status: Confirmed
- Statement: When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.
- Clauses:
  - REQ-043.1: The panel lists each of the user's decisions in order with street, board at that point, the user's action, the recommended action, the grade, equity %, required equity % and the explanation.
  - REQ-043.2: Only the user's decisions are graded; bot decisions are not graded.
  - REQ-043.3: The panel header shows hand number, the user's hole cards and position, and the amount won or lost.
  - REQ-043.4: The panel shows the replay code (REQ-013.5).
  - REQ-043.5: Hinted decisions carry a "hinted" tag (REQ-040.2).
  - REQ-043.6: Opponent hole cards appear only if they were shown at showdown (Q-33).
  - REQ-043.7: The panel has Close and Deal next hand controls.
  - REQ-043.8: While auto-open is off, a grade summary badge (e.g. "1 Major, 1 Minor") appears after each played hand, and clicking it opens the panel.
  - REQ-043.9: For preflop decisions, review entries show the chart basis instead of equity and required-equity numbers.
  - REQ-043.10: After the user closes the panel, the next hand waits for the Deal next hand control, which stays visible on the table.
  - REQ-043.11: The grade summary badge reads "All correct" when the hand has no errors, disappears when the next hand is dealt, and is not shown after a hand where the user folded preflop.
  - REQ-043.12: The panel is skipped only when the user's single action in the hand was folding preflop; a hand where the user called or raised preflop and then folded preflop opens the panel.
  - REQ-043.13: With auto-open off, the grade summary badge also appears after a hand where the user called or raised preflop and then folded preflop.
- Fit criterion: Scripted hand with 4 user decisions → 4 entries with expected grades; preflop-fold hand → no panel.
- Rationale: The magic moment (Q-21); Q-19, Q-23, Q-32, Q-33.
- Source: Q-19, Q-21, Q-23, Q-32, Q-33; confirmed Q-62
- Depends on: REQ-038, REQ-024

## Area 6 — Session Report

### REQ-044: Session Report content
- Type: Functional
- Area: Session Report
- Priority: Must
- Status: Confirmed
- Statement: When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- Clauses:
  - REQ-044.1: Cash: result in $, BB/100 and number of rebuys. Sit-and-go: finishing position out of starting players.
  - REQ-044.2: Hands played, Major errors per 100 hands and Minor errors per 100 hands (unhinted decisions).
  - REQ-044.3: Number and % of decisions that were hinted.
  - REQ-044.4: VPIP, PFR, Aggression, WTSD and W$SD, each with its healthy range for the session's reference size and a label in range / too high / too low.
  - REQ-044.5: Up to 3 leaks (REQ-047) with title, evidence and a one-sentence fix.
  - REQ-044.6: Controls to open Statistics and return Home.
  - REQ-044.7: The report is saved and can be reopened from the Home snapshot (REQ-003.2).
  - REQ-044.8: A session with 0 completed hands ends without a report and is not stored.
  - REQ-044.9: When the session has no leaks, the leaks section reads "No leaks found this session (a leak needs 8+ spots with 40%+ errors)."
  - REQ-044.10: A style stat shown as "—" (REQ-045.6) carries the label "not enough data" instead of a range label.
  - REQ-044.11: Healthy-range limits are inclusive: a value equal to either limit is in range.
- Fit criterion: Scripted 200-hand session → every report value equals a value recomputed from the stored hand records.
- Rationale: Q-8 (session/play-style report), G-2, G-4.
- Source: Q-8, Q-58; REQ-044.8 proposed-by-Claude; confirmed Q-62
- Depends on: REQ-045, REQ-046, REQ-047

### REQ-045: Style stat definitions
- Type: Business rule
- Area: Session Report
- Priority: Must
- Status: Confirmed
- Statement: The app shall compute the five tracked style stats with these formulas over the hands in scope.
- Clauses:
  - REQ-045.1: VPIP = hands where the user voluntarily put chips in preflop (call or raise, not counting blinds) ÷ hands dealt.
  - REQ-045.2: PFR = hands where the user raised preflop ÷ hands dealt.
  - REQ-045.3: Aggression = bets + raises ÷ (bets + raises + calls), over flop, turn and river actions.
  - REQ-045.4: WTSD = hands reaching showdown ÷ hands where the user saw the flop.
  - REQ-045.5: W$SD = showdowns where the user won chips ÷ showdowns reached.
  - REQ-045.6: A stat with a zero denominator shows "—".
- Fit criterion: Unit tests with hand-built hand records give the expected percentages for each formula.
- Rationale: Q-58; one definition used everywhere (glossary consistency).
- Source: Q-58; formulas proposed-by-Claude; confirmed Q-62
- Depends on: none

### REQ-046: Healthy ranges
- Type: Data
- Area: Session Report
- Priority: Must
- Status: Confirmed
- Statement: The app shall load authored healthy ranges for each of the five style stats for each reference size, each with a written justification.
- Clauses:
  - REQ-046.1: Healthy ranges exist for VPIP, PFR, Aggression, WTSD and W$SD at heads-up, 6-max and full ring.
  - REQ-046.2: Each range has a justification sentence stored with it.
  - REQ-046.3: For non-reference sizes, the mapped reference size's ranges are used and marked approximate.
- Fit criterion: Validation test: 15 ranges present with justification; the TAG bot's harness stats fall inside the 6-max ranges.
- Rationale: G-4; Q-53 (Claude authors with reasoning).
- Source: Q-53, Q-58; confirmed Q-62
- Depends on: REQ-045

### REQ-047: Leak detection
- Type: Business rule
- Area: Session Report
- Priority: Should
- Status: Confirmed
- Statement: The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.
- Clauses:
  - REQ-047.1: Decision categories: preflop by position group (early, middle, late, blinds) × action (open, call, raise); postflop by street (flop, turn, river) × facing a bet (fold, call, raise) or not (check, bet).
  - REQ-047.2: A category becomes a leak at ≥ 8 decisions and ≥ 40% errors among unhinted decisions.
  - REQ-047.3: Leaks are ranked by Major error count, then by error rate; at most 3 are shown.
  - REQ-047.4: Evidence reads "<errors> of <decisions> <category> graded as errors".
  - REQ-047.5: Each category has an authored one-sentence fix.
  - REQ-047.6: Position groups count back from the button: button and cutoff are late, the next two seats are middle, all remaining non-blind seats are early, and the small and big blinds are blinds; heads-up, the button is late and the other player is blinds.
  - REQ-047.7: Preflop folds form a category for each position group in addition to open, call and raise.
  - REQ-047.8: The 8-decision threshold counts unhinted decisions only.
  - REQ-047.9: A preflop limp or small-blind complete counts as a call; a big-blind check belongs to no leak category but counts in error rates.
- Fit criterion: Scripted session data with known category counts produce the expected leaks in the expected order.
- Rationale: Q-59; "my leak report" value.
- Source: Q-59; categories proposed-by-Claude; confirmed Q-62
- Depends on: REQ-038

## Area 7 — Statistics and progress

### REQ-048: Statistics screen trends
- Type: Functional
- Area: Statistics and progress
- Priority: Must
- Status: Confirmed
- Statement: The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.
- Clauses:
  - REQ-048.1: Grouping options: per 500 hands (default), per session, per day.
  - REQ-048.2: Filters: table size (All, Heads-up, 6-max, Full ring — by reference size) and game type (All, Cash, Sit-and-go).
  - REQ-048.3: The Major-error chart shows a dashed target line at half the user's first-1,000-hand rate (G-2) once 1,000 hands of any kind exist.
  - REQ-048.4: The BB/100 chart uses cash-game hands only and shows a dashed break-even line (G-3).
  - REQ-048.5: Sit-and-go results show the average finishing position and the count of sit-and-gos per group.
  - REQ-048.6: Total hands and sessions in the current filter are shown.
  - REQ-048.7: At per-500 grouping with 1 to 499 hands in the filter, the screen shows "Play <n> more hands to see your first trend point." instead of a chart.
  - REQ-048.8: A line-up filter offers All, Mixed, Tough, Soft and Custom.
  - REQ-048.9: The G-2 baseline rate is the Major errors per 100 hands, counting only unhinted decisions, over the user's first 1,000 hands of any game type and table size, independent of the current filter; the target line appears once 1,000 hands exist.
  - REQ-048.10: Per-session and per-day groupings plot every session or day that has hands; with zero hands in the filter the screen shows "Play your first hand to see trends."
  - REQ-048.11: At per-500 grouping only complete 500-hand groups are plotted.
  - REQ-048.12: When the filter contains no cash-game hands, the BB/100 chart shows "No cash-game hands yet."
  - REQ-048.13: When the filter has 1 to 499 cash-game hands, the BB/100 chart shows "Play <n> more cash hands to see your first trend point."
  - REQ-048.14: Count messages use the singular form for 1 (e.g. "Play 1 more hand to see your first trend point.").
- Fit criterion: Seeded data set of 3,000 hands → plotted values equal values recomputed from records for each grouping and filter.
- Rationale: Q-60; goals G-2, G-3.
- Source: Q-60; target lines proposed-by-Claude; confirmed Q-62
- Depends on: REQ-044

### REQ-049: Style stats and goal status
- Type: Functional
- Area: Statistics and progress
- Priority: Should
- Status: Confirmed
- Statement: The Statistics screen shall show the user's five tracked style stats over their most recent 1,000 hands in the current filter against the healthy ranges, and state how many of the five are in range.
- Clauses:
  - REQ-049.1: Each stat shows value, healthy range and in range / too high / too low.
  - REQ-049.2: The screen shows "<k> of 5 in range (goal: 4)".
  - REQ-049.3: With the filter set to All table sizes, the stats show separately per reference size played.
  - REQ-049.4: After 5,000 hands of any kind, independent of the current filter, the screen states whether the G-2 target has been met.
- Fit criterion: Seeded data → displayed values and counts equal recomputed values.
- Rationale: G-2, G-4.
- Source: Q-58; proposed-by-Claude; confirmed Q-62
- Depends on: REQ-045, REQ-046

## Area 8 — Settings

### REQ-050: Settings options
- Type: Functional
- Area: Settings
- Priority: Should
- Status: Confirmed
- Statement: The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.
- Clauses:
  - REQ-050.1: Default speed: Rapid or Realistic (default Rapid).
  - REQ-050.2: Open the Hand Review panel after every hand: on or off (default on).
  - REQ-050.3: Show opponent styles at the table: on or off (default on).
  - REQ-050.4: Four-colour deck (clubs green, diamonds blue): on or off (default off).
  - REQ-050.5: Settings is reachable from Home and from the Table header; changes made mid-session apply from the next screen update.
  - REQ-050.6: The app version is shown.
  - REQ-050.7: Opening Settings from the Table header shows Settings as an overlay above the table; the session is neither paused nor ended, and closing the overlay returns to the same table state.
  - REQ-050.8: While the Settings overlay is open at the table, play is frozen: bots do not act, the auto-deal timer and the session clock pause, and closing the overlay resumes from the same point.
- Fit criterion: Change each setting, relaunch → values kept and visible effect present.
- Rationale: Q-31, Q-32, Q-61.
- Source: Q-31, Q-32, Q-61; confirmed Q-62
- Depends on: none

### REQ-051: Reset all data
- Type: Functional
- Area: Settings
- Priority: Should
- Status: Confirmed
- Statement: When the user chooses Reset all data and confirms in a dialog, TLH Trainer shall delete every stored session, hand, report, statistic, paused session and setting.
- Clauses:
  - REQ-051.1: The dialog states that all history will be permanently deleted and there is no backup.
  - REQ-051.2: The dialog has Cancel (default focus) and "Delete everything" buttons.
  - REQ-051.3: After deletion the app shows the first-use Home state and default settings.
  - REQ-051.4: Cancel deletes nothing.
- Fit criterion: Seed data, reset → storage empty and Home shows the first-use message; cancel → data unchanged.
- Rationale: Lets the user start fresh; no backup exists (Q-17).
- Source: storyboard Settings; Q-17; proposed-by-Claude; confirmed Q-62
- Depends on: REQ-003

## Area 9 — Data

Entity × lifecycle (every cell is a clause below or N/A):

| Entity | Create | Read | Update | Delete | States |
|---|---|---|---|---|---|
| Settings | first launch (defaults) | every screen | Settings screen (REQ-050) | Reset all data (REQ-051) | — |
| Last configuration | Start game (REQ-012) | Game Config | each Start game | Reset all data | — |
| Session | Start game | Home, Table, Report, Statistics | engine only (stacks, hand count, level, status) | Reset all data; 0-hand sessions are discarded (REQ-044.8) | active → paused → active; active → ended; paused → ended |
| Hand record | end of each completed hand | Review, Report, Statistics, HUD | N/A — immutable | Reset all data | — |
| Session report | session end | Report, Home snapshot | N/A — immutable | Reset all data | — |
| Strategy data (charts, ranges, golden spots) | shipped with the app | advice engine | new app version only | N/A | — |

### REQ-052: Local persistence
- Type: Data
- Area: Data
- Priority: Must
- Status: Confirmed
- Statement: TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.
- Clauses:
  - REQ-052.1: A completed hand is written to storage before the next hand is dealt.
  - REQ-052.2: Each hand record holds: session id, hand number, replay code, game type, stake or level, seats with names, styles and starting stacks, button seat, every action with amount, board, cards shown at showdown, the user's hole cards, pot awards, and for each user decision the recommendation, numbers, explanation, grade and hinted flag.
  - REQ-052.3: Session state is saved after every completed hand so a paused session can resume (REQ-004).
  - REQ-052.4: On first launch the app requests persistent storage (navigator.storage.persist) and records whether it was granted.
  - REQ-052.5: Hand records and reports are never modified after they are written.
  - REQ-052.6: Data is retained until Reset all data; there is no automatic deletion.
  - REQ-052.7: Each hand record stores the date and time the hand completed.
- Fit criterion: Kill the browser process after hand N → relaunch shows hand N stored and the session resumable at hand N+1.
- Rationale: Statistics and goals depend on durable history (G-2..G-4); Q-17 (browser storage only).
- Source: Q-2, Q-17; proposed-by-Claude; confirmed Q-66
- Depends on: none

### REQ-053: Storage capacity and failure
- Type: Data
- Area: Data
- Priority: Should
- Status: Confirmed
- Statement: TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.
- Clauses:
  - REQ-053.1: With 100,000 stored hands, all screens still open and meet the performance limits of REQ-055.
  - REQ-053.2: If a write fails, no new hand is dealt and a message states that the last hand could not be saved, with Retry and Leave table.
  - REQ-053.3: When persistent storage was not granted, Settings shows a one-line warning that the browser can clear history under storage pressure.
- Fit criterion: Seed 100,000 hands → screens meet REQ-055; simulated quota error → message shown and no hand dealt.
- Rationale: No silent data loss (R-4).
- Source: proposed-by-Claude; confirmed Q-66
- Depends on: REQ-052

### REQ-054: Data versioning and migration
- Type: Data
- Area: Data
- Priority: Should
- Status: Confirmed
- Statement: The stored data shall carry a schema version, and when a new app version changes the schema it shall migrate existing data without loss before showing Home.
- Clauses:
  - REQ-054.1: Every store records its schema version.
  - REQ-054.2: Migrations run at launch, in order, for each version step.
  - REQ-054.3: If a migration fails, the old data is left unchanged and the app shows an error with the failing version step instead of Home.
- Fit criterion: Test fixture of version N data migrates to N+1 with record counts and recomputed stats unchanged.
- Rationale: Updates arrive automatically (Q-64) and must not wipe history.
- Source: Q-64; proposed-by-Claude; confirmed Q-66
- Depends on: REQ-052

## Non-functional requirements

### REQ-055: Response times
- Type: NFR:Performance efficiency
- Area: Non-functional
- Priority: Should
- Status: Confirmed
- Statement: On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.
- Clauses:
  - REQ-055.1: Hint card shown ≤ 1.0 s after clicking Hint.
  - REQ-055.2: Hand Review panel shown ≤ 1.0 s after the hand ends.
  - REQ-055.3: Bot decision computed ≤ 100 ms.
  - REQ-055.4: Launch to Home ≤ 3 s on a repeat launch.
  - REQ-055.5: Statistics screen rendered ≤ 2 s with 100,000 stored hands.
  - REQ-055.6: Equity and advice computation runs off the main thread so the table stays responsive (no frame longer than 100 ms during computation).
- Fit criterion: Automated timing test reporting p95 per item over 200 samples.
- Rationale: G-5; A-3.
- Source: Q-15; numbers proposed-by-Claude; confirmed Q-66
- Depends on: REQ-033

### REQ-056: Reliability and invariants
- Type: NFR:Reliability
- Area: Non-functional
- Priority: Must
- Status: Confirmed
- Statement: The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- Clauses:
  - REQ-056.1: Invariants checked after every action: chip conservation, legal action, cap respected, pot eligibility, no card dealt twice.
  - REQ-056.2: A 1,000,000-hand playtest run reports zero violations.
  - REQ-056.3: On an unexpected error the app shows an error screen with Return Home; the session resumes from the last completed hand.
- Fit criterion: Nightly or on-demand 1,000,000-hand run exits 0; injected error test shows recovery.
- Rationale: Trust (G-1); R-1.
- Source: Q-3; proposed-by-Claude; confirmed Q-66
- Depends on: REQ-062

### REQ-057: Accessibility and usability
- Type: NFR:Usability
- Area: Non-functional
- Priority: Should
- Status: Confirmed
- Statement: Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- Clauses:
  - REQ-057.1: Automated axe checks report zero serious or critical violations on every screen.
  - REQ-057.2: All controls are native buttons, links or form fields reachable with Tab and activated with Enter or Space while focused.
  - REQ-057.3: Grades always show their text label (Correct, Minor error, Major error).
  - REQ-057.4: Interactive targets are at least 44 × 44 CSS px.
- Fit criterion: Playwright + axe run over all 8 screens: 0 serious/critical.
- Rationale: Readable, misclick-resistant UI for long sessions.
- Source: proposed-by-Claude; confirmed Q-66
- Depends on: none

### REQ-058: Privacy and security
- Type: NFR:Security
- Area: Non-functional
- Priority: Should
- Status: Confirmed
- Statement: TLH Trainer shall keep all user data on the device and make no network requests other than loading and updating the app's own files from its host.
- Clauses:
  - REQ-058.1: No analytics, telemetry, tracking or third-party requests.
  - REQ-058.2: The app collects no personal information.
  - REQ-058.3: A Content-Security-Policy restricts scripts, styles and connections to the app's own origin.
- Fit criterion: Playwright network log over a full session shows only same-origin requests for app files.
- Rationale: Vision principle 6 (private and self-contained).
- Source: vision §0; Q-5; confirmed Q-66
- Depends on: none

### REQ-059: Maintainability and testability
- Type: NFR:Maintainability
- Area: Non-functional
- Priority: Must
- Status: Confirmed
- Statement: The codebase shall be strict TypeScript with the rules engine, bots, advice engine and statistics in modules that import no UI or browser-only code, and shall meet the coverage thresholds below.
- Clauses:
  - REQ-059.1: TypeScript strict mode with zero type errors.
  - REQ-059.2: Engine, bots, advice and statistics modules import nothing from React, the DOM or IndexedDB (enforced by a lint rule).
  - REQ-059.3: Line coverage ≥ 90% for engine, bots, advice and statistics modules and ≥ 70% overall.
  - REQ-059.4: ESLint and Prettier report zero errors.
- Fit criterion: CI reports typecheck, lint and coverage thresholds met.
- Rationale: Headless testability (Q-3); vision principle 7.
- Source: Q-1, Q-3; confirmed Q-66
- Depends on: none

### REQ-060: Compatibility and look
- Type: NFR:Compatibility
- Area: Non-functional
- Priority: Should
- Status: Confirmed
- Statement: TLH Trainer shall run and install as a PWA in the latest two major versions of Chrome and Safari on macOS at window sizes of 1280 × 720 and larger, using the branded dark theme.
- Clauses:
  - REQ-060.1: All screens work without horizontal scrolling at 1280 × 720.
  - REQ-060.2: The app installs from Chrome and from Safari (Add to Dock) and opens in its own window.
  - REQ-060.3: Theme: charcoal backgrounds, red primary accent, navy and silver secondary colours, green felt, TLH logo on Splash and Home and as the app icon.
  - REQ-060.4: Text is English; money is shown as US dollars with thousands separators (e.g. $1,240).
- Fit criterion: Playwright runs in Chromium and WebKit at 1280 × 720; manual install check in both browsers.
- Rationale: Q-28, Q-29, Q-63.
- Source: Q-27, Q-28, Q-29, Q-63; confirmed Q-66
- Depends on: none

### REQ-061: Legal and content
- Type: Constraint
- Area: Non-functional
- Priority: Should
- Status: Confirmed
- Statement: TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.
- Clauses:
  - REQ-061.1: No real-money, deposit, purchase or wagering feature exists.
  - REQ-061.2: Charts, ranges, explanations and golden spots are original text; no passages are copied from books or commercial tools.
  - REQ-061.3: The logo is the user-supplied asset in brand/tlh-logo.jpg.
- Fit criterion: Review checklist item in the Definition of Done for content stories.
- Rationale: Vision §7 constraints.
- Source: vision §7; Q-27; confirmed Q-66
- Depends on: none

## Area 10 — Operations and tooling

### REQ-062: Headless playtest CLI
- Type: Interface
- Area: Operations and tooling
- Priority: Must
- Status: Confirmed
- Statement: The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.
- Clauses:
  - REQ-062.1: Options: number of hands, seed, table size, game type, line-up preset, style checks (REQ-027.5), advice determinism check (REQ-036).
  - REQ-062.2: On an invariant violation it prints the replay code and action history and exits non-zero.
  - REQ-062.3: It reports each bot's BB/100 with 95% confidence interval and each style's VPIP, PFR and aggression.
  - REQ-062.4: The same seed and options produce identical output.
  - REQ-062.5: It plays 100,000 6-max hands in ≤ 60 minutes on the reference machine.
- Fit criterion: `npm run playtest -- --hands 10000 --seed 42` exits 0 and prints the report; run twice → identical output.
- Rationale: Q-3; enables REQ-027, REQ-030, REQ-056.
- Source: Q-3; confirmed Q-66
- Depends on: REQ-014

### REQ-063: Test commands
- Type: Constraint
- Area: Operations and tooling
- Priority: Should
- Status: Confirmed
- Statement: The project shall provide npm scripts that run each check with one command.
- Clauses:
  - REQ-063.1: `npm test` runs Vitest unit, fast-check property and golden-spot tests.
  - REQ-063.2: `npm run e2e` runs Playwright tests in Chromium and WebKit.
  - REQ-063.3: `npm run lint` and `npm run typecheck` run ESLint/Prettier and tsc.
  - REQ-063.4: `npm run build` produces the deployable PWA.
- Fit criterion: Each script exits 0 on a clean checkout.
- Rationale: Q-3 toolchain.
- Source: Q-3, Q-4; confirmed Q-66
- Depends on: none

### REQ-064: Continuous integration and deployment
- Type: Constraint
- Area: Operations and tooling
- Priority: Should
- Status: Confirmed
- Statement: On every push to GitHub, a GitHub Actions workflow shall run lint, typecheck, tests, a 10,000-hand playtest and the build, and on the main branch shall deploy the build to GitHub Pages when all pass.
- Clauses:
  - REQ-064.1: The workflow runs on every push and pull request.
  - REQ-064.2: Any failing check fails the workflow.
  - REQ-064.3: Deployment to GitHub Pages happens only from main and only when all checks pass.
  - REQ-064.4: The workflow also runs the Playwright and accessibility tests (npm run e2e) in Chromium and WebKit.
- Fit criterion: A push with a failing test shows a failed workflow and no deployment.
- Rationale: Q-64, Q-65.
- Source: Q-64, Q-65; confirmed Q-66
- Depends on: REQ-063

### REQ-065: Install, offline and updates
- Type: Functional
- Area: Operations and tooling
- Priority: Should
- Status: Confirmed
- Statement: After the first visit, TLH Trainer shall run fully offline, and when a newer version is deployed it shall apply the update at the next launch and tell the user which version they are on.
- Clauses:
  - REQ-065.1: With the network disabled after first install, every screen and feature works.
  - REQ-065.2: A newer version is downloaded in the background and applied on the next launch, never during a session.
  - REQ-065.3: After an update, Home shows "Updated to version <x>" once.
- Fit criterion: Playwright offline test; deploy test build N+1 → next launch shows the update notice.
- Rationale: Q-2, Q-64.
- Source: Q-2, Q-64; proposed-by-Claude; confirmed Q-66
- Depends on: REQ-054

## Area 11 — Presentation (art and animation)

### REQ-066: Card rendering
- Type: Interface
- Area: Presentation
- Priority: Must
- Status: Confirmed
- Statement: TLH Trainer shall draw all playing cards in code as SVG in a big-index style showing a large rank and suit, with a card back that shows the TLH logo.
- Clauses:
  - REQ-066.1: Card faces show the rank and a large suit symbol; no face-card illustrations are used.
  - REQ-066.2: Rank characters are at least 24 CSS px tall at a window size of 1280 × 720.
  - REQ-066.3: Two-colour deck: hearts and diamonds red, spades and clubs black; four-colour deck (REQ-050.4): clubs green, diamonds blue.
  - REQ-066.4: Card backs show the TLH logo.
- Fit criterion: Playwright snapshot of all 52 faces in both deck modes; measured rank height ≥ 24 px.
- Rationale: Readability at Rapid speed; original art with no licensing (Q-68).
- Source: Q-68; confirmed Q-75
- Depends on: none

### REQ-067: Table, chips and dealer button art
- Type: Interface
- Area: Presentation
- Priority: Should
- Status: Confirmed
- Statement: TLH Trainer shall draw the table felt, rail, chips and dealer button in code, using the TLH logo as the only image asset.
- Clauses:
  - REQ-067.1: The felt is green with a subtle texture and the rail is dark.
  - REQ-067.2: Chips use the logo colours red, navy and silver.
  - REQ-067.3: The app ships no image files other than the TLH logo and icons generated from it.
  - REQ-067.4: Palette: felt #2F6B4F, rail #24543E, chips red #D7262E, navy #1F3A6E and silver #C9CED6; on a 200 × 100 px felt sample each colour channel's standard deviation is between 1 and 8 and no pixel differs from #2F6B4F by more than 24 on any channel.
- Fit criterion: Build output contains no image assets beyond the logo-derived files; visual snapshot of the table.
- Rationale: Q-29, Q-69; original, on-brand, licence-free.
- Source: Q-29, Q-69; confirmed Q-75
- Depends on: REQ-060

### REQ-068: Bet chips in front of players
- Type: Interface
- Area: Presentation
- Priority: Should
- Status: Confirmed
- Statement: While a betting round is in progress, the Table screen shall show each player's chips put in on that street as a chip stack with its amount in front of their seat, and shall move those chips into the pot when the street ends and the pot to the winner when the hand ends.
- Clauses:
  - REQ-068.1: Each seat with chips put in on the current street shows a chip stack and the amount.
  - REQ-068.2: When the street ends, the stacks move into the pot and the pot amount updates.
  - REQ-068.3: When the hand ends, the pot moves to each winner's seat with the amount won.
- Fit criterion: Scripted hand: amounts shown in front of seats equal current-street contributions at every action.
- Rationale: Q-74; helps a beginner follow the money.
- Source: Q-74; confirmed Q-75
- Depends on: REQ-021

### REQ-069: Speed-aware animation
- Type: Interface
- Area: Presentation
- Priority: Should
- Status: Confirmed
- Statement: TLH Trainer shall animate dealing, chips to the pot and the pot to the winner for at most 250 ms per animation at Rapid speed and at most 600 ms at Realistic speed, and shall show no motion when the operating system's reduce-motion setting is on.
- Clauses:
  - REQ-069.1: Animated events: dealing cards, bet chips to the pot, pot to the winner.
  - REQ-069.2: Each animation lasts ≤ 250 ms at Rapid and ≤ 600 ms at Realistic.
  - REQ-069.3: With reduce-motion on, changes appear without animation.
  - REQ-069.4: Animations never delay the user's action bar becoming enabled by more than the animation's own duration.
- Fit criterion: Playwright timing test of each animation at both speeds; reduce-motion emulation shows no transitions.
- Rationale: Q-71; protects G-5.
- Source: Q-71; confirmed Q-75
- Depends on: REQ-011

### REQ-070: Bot avatars
- Type: Interface
- Area: Presentation
- Priority: Could
- Status: Confirmed
- Statement: Each bot seat shall show an avatar badge drawn in code containing the bot's initials on a colour assigned to its seat.
- Clauses:
  - REQ-070.1: The badge shows the first two letters of the bot's name.
  - REQ-070.2: Badge text meets 4.5:1 contrast against the badge colour.
  - REQ-070.3: A replacement bot (REQ-007.5) shows its own initials.
- Fit criterion: UI test of initials per seat; axe contrast check passes.
- Rationale: Q-72; seats recognisable at a glance.
- Source: Q-72; confirmed Q-75
- Depends on: REQ-021

### REQ-071: Bot banter
- Type: Functional
- Area: Presentation
- Priority: Could
- Status: Confirmed
- Statement: Where banter is turned on in Settings, a bot shall occasionally show a short, original speech-bubble line matching its style after table events, at most once per 10 hands per bot.
- Clauses:
  - REQ-071.1: Trigger events: winning a pot of 10 big bets or more, losing at showdown, being raised, a new player sitting down.
  - REQ-071.2: Each style has its own authored set of at least 10 lines; lines are original and never insult the user.
  - REQ-071.3: A bubble shows for 3 seconds (1.5 seconds at Rapid) and never covers the action bar or the user's cards.
  - REQ-071.4: Each bot speaks at most once per 10 hands.
  - REQ-071.5: Settings has a "Bot banter" toggle, default on.
  - REQ-071.6: Banter never reveals hidden cards or the bot's strategy.
  - REQ-071.7: When a new bot sits down, the new bot is the one that speaks.
- Fit criterion: Playtest of 1,000 hands: per-bot line count ≤ 1 per 10 hands; toggle off → zero bubbles.
- Rationale: Q-74; flavour that makes the table feel live.
- Source: Q-74; triggers, limits and toggle proposed-by-Claude; confirmed Q-75
- Depends on: REQ-050

### REQ-072: Session clock and pace
- Type: Interface
- Area: Presentation
- Priority: Could
- Status: Confirmed
- Statement: The Table header shall show the session's elapsed playing time and its hands-per-hour pace.
- Clauses:
  - REQ-072.1: Elapsed time counts only time spent at the table, excluding time while the session was paused.
  - REQ-072.2: Hands per hour = hands completed ÷ elapsed hours, shown once 10 hands are complete.
  - REQ-072.3: The Session Report shows the session's total playing time and hands per hour.
- Fit criterion: Scripted session with a pause: displayed time excludes the paused interval; pace equals hands ÷ hours.
- Rationale: Q-74; visible progress toward G-5.
- Source: Q-74; confirmed Q-75
- Depends on: REQ-004

## Definition of Done (applies to every story)
- Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1] [REQ-059.4]
- The golden-spot suite passes 100% [REQ-039.4]
- Coverage thresholds hold: ≥ 90% engine/bots/advice/statistics, ≥ 70% overall [REQ-059.3]
- Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations [REQ-056.1]
- Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations [REQ-057.1]
- No new network requests beyond the app's own files [REQ-058.1]
- Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- CI workflow is green on the story's branch [REQ-064.2]
- Story documentation is written and published to Backlog.md

## Out of scope
- Real-money play, online multiplayer, accounts/login, backend server (vision §5)
- Solver-grade (GTO) strategy (Q-7)
- Interrupting live warnings during play (Q-8)
- Measuring subjective confidence (Q-16)
- No-limit, pot-limit and other poker variants
- Tournament strategy (ICM, bubble play) in advice — later release (Q-14)
- Drills / quiz mode — later release (Q-18)
- Sound effects and audio settings — phase 2 (Q-70)
- First-run tour or help page (Q-73: not wanted)

## Waiting room (deferred)
- Hand-history export (standard text format) and JSON backup/restore (Q-17)
- Replay a hand with a different decision
- Estimated cost in bets per mistake (Q-19)
- Uncapped raising when heads-up as a table option (Q-20)
- Hand History browser (Q-24)
- Learn / Glossary screens (Q-24)
- Adaptive bots that adjust to the user's play (Q-49)
- Show amounts in big bets instead of $ (Q-61, not selected)

## Assumptions
| ID | Assumption | Impact if wrong | Owner |
|---|---|---|---|
| A-1 | Chart + equity rules give advice good enough to improve a beginner | Advice misleads; core value lost | Claude |
| A-2 | Style-parameterised bots feel realistic and are not trivially exploitable | Winning vs bots means little (G-3) | Claude |
| A-3 | Equity simulation in a Web Worker returns a hint within the NFR limit | Hints feel sluggish | Claude |
| A-4 | Browser storage keeps months of history | Progress lost (accepted, Q-17) | User |
| A-5 | Nearest-size mapping is acceptable for 3–5, 7–8 players | Weaker advice at those sizes | User |

## TBD register
| ID | Question | Owner | Blocking? |
|---|---|---|---|
| — | None open | — | — |

## Change log
| Version | Date | Change | Approved by |
|---|---|---|---|
| 1.0 | 2026-11-17 | Initial baseline: 72 requirements, 315 clauses across 11 areas + NFR | User (G2) |
| 1.1 | 2026-11-17 | Weaver questions: added REQ-032.6 (facing 4th bet), REQ-038.6 (raise-vs-fold grading), REQ-027.6 (postflop-only aggression) | User (Q-77..Q-79) |
| 1.2 | 2026-11-17 | Weaver questions: added REQ-007.7 (Custom refill styles), REQ-009.7 (heads-up Tough = TAG), REQ-029.2 (bots use typical-player basis) | User (Q-80..Q-82) |
| 1.3 | 2026-11-17 | Weaver question: added REQ-004.7 (Leave table mid-hand: confirm, auto-fold, record) | User (Q-83) |
| 1.4 | 2026-11-17 | Weaver questions (E02, E08, E09, E10): added REQ-003.4, 004.8, 004.9, 012.3, 042.6, 043.9–043.11, 044.9, 044.10, 047.6–047.8; REQ-012.1 no longer pre-fills speed | User (Q-84..Q-91) |
| 1.5 | 2026-11-17 | Weaver questions (E05, E11, E12): added REQ-002.6, 003.5, 008.10–008.12, 048.9, 048.10, 050.8, 052.7 | User (Q-92..Q-96) |
| 1.5 | 2026-11-17 | Editorial: REQ-048.9 unit corrected to per 100 hands, matching approved G-2 and REQ-044.2 | Claude (wording error; matches user-approved G-2) |
| 1.6 | 2026-11-17 | Judge round 1 user questions: added REQ-009.8, 017.6, 017.7, 043.12, 044.11, 048.11, 048.12, 071.7; reworded REQ-048.3, 048.7, 049.4 for consistency | User (Q-97..Q-104) |
| 1.7 | 2026-11-17 | Revision-round user questions: added REQ-008.13, 019.8, 019.9, 024.6, 033.6, 035.5, 035.6, 043.13, 047.9, 048.13, 048.14, 064.4, 067.4 | User (Q-105..Q-112) |
| 1.8 | 2026-11-17 | Judge round 2: added REQ-007.8 (replacement style from preset styles at current size) | User (Q-113) |
| 1.9 | 2026-11-17 | Judge round 2 revision: added REQ-033.7 (implied-odds allowance) | User (Q-114) |
| 1.10 | 2026-11-24 | TASK-7.32 (WTSD fix): REQ-033.1 turn required equity counts one river big bet; REQ-033.2 value raise facing a bet needs more than 65% (value bet stays above 50%) | User (TASK-7.32 Q-1) |
| 1.11 | 2026-11-24 | TASK-6.25 (Mixed style bands): REQ-007.5 a replacement bot keeps the busted bot's style; REQ-007.7 and REQ-007.8 retired (reverses Q-113) | User (TASK-6.25 Q-1, auto-accepted) |
| 1.12 | 2026-11-26 | TASK-6.20: added REQ-029.3 (bot decisions use only the current hand) | User (TASK-6.20 Q-1) |
| 1.13 | 2026-11-26 | TASK-7.21: REQ-032.2 splits facing a re-raise into own raise re-raised and re-raised when you have not raised, and splits blind defence by an early or a late raiser; REQ-032.6 picks the matching re-raise chart for a fourth bet | User (TASK-7.21 Q-1/Q-2) |
| 1.14 | 2026-11-26 | TASK-7.29: REQ-035.6 scales observed three-bet and four-bet ranges by PFR relative to the typical PFR for the table size instead of by raw PFR | User (TASK-7.29 Q-3) |
| 1.15 | 2026-11-26 | TASK-10.13: REQ-004.8 forced fold forfeits chips; REQ-018.4 exception | User (TASK-10.13 Q-3) |
