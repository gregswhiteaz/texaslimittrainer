# Requirements traceability matrix

Clauses covered: 367/367

| Clause | Requirement text | Covered by |
|---|---|---|
| REQ-001.1 | The splash screen shows the TLH logo image and a loading indicator. | TASK-2.12#AC1 |
| REQ-001.2 | When loading completes, the Home screen opens without any click or key press. | TASK-2.12#AC2 |
| REQ-001.3 | If loading fails, then the splash screen shows an error message and a Retry button that restarts loading. | TASK-2.12#AC3, TASK-2.12#AC4, TASK-2.12#AC5 |
| REQ-002.1 | Home shows the TLH logo and the name "TLH Trainer". | TASK-2.1#AC1 |
| REQ-002.2 | New game opens the Game Config screen. | TASK-2.1#AC4 |
| REQ-002.3 | Statistics opens the Statistics screen; Settings opens the Settings screen. | TASK-12.1#AC1, TASK-11.1#AC1 |
| REQ-002.4 | While a paused session exists, Home shows Resume session with its game type, table size, stake and hands played. | TASK-2.6#AC1 |
| REQ-002.5 | While no paused session exists, Resume session is not shown. | TASK-2.6#AC2 |
| REQ-002.6 | For a paused sit-and-go, Resume session shows the current level instead of the stake. | TASK-5.6#AC1, TASK-5.6#AC2 |
| REQ-003.1 | The snapshot shows game type, table size, stake, hands played, BB/100, major errors per 100 hands and the top leak. | TASK-2.16#AC1, TASK-2.16#AC2, TASK-2.16#AC3 |
| REQ-003.2 | The snapshot has a link that opens that session's report. | TASK-2.16#AC4 |
| REQ-003.3 | With no ended sessions, Home shows the text "No sessions yet — start a new game to begin training." and no snapshot. | TASK-2.17#AC1, TASK-2.17#AC2, TASK-2.17#AC3 |
| REQ-003.4 | When the snapshot's session had no leaks, the snapshot shows "Top leak: none". | TASK-2.16#AC6 |
| REQ-003.5 | When the snapshot's session was a sit-and-go, it shows the finishing position (e.g. 3rd of 6) instead of stake and BB/100. | TASK-5.9#AC1, TASK-5.9#AC2, TASK-5.9#AC3 |
| REQ-004.1 | At most one paused session exists at any time. | TASK-2.7#AC4 |
| REQ-004.2 | Closing the app mid-hand loses only the unfinished hand: the paused session resumes at the start of the next hand with stacks as they were before that hand began. | TASK-2.6#AC3, TASK-2.6#AC6, TASK-2.14#AC2, TASK-2.14#AC4 |
| REQ-004.3 | Resume session restores game type, table size, stake, line-up, seats, stacks, dealer button position, hand count and SNG level. | TASK-2.6#AC4, TASK-5.5#AC4 |
| REQ-004.4 | Starting a New game while a paused session exists first asks the user to confirm ending the paused session; on confirm the paused session ends and its report is saved; on cancel nothing changes. | TASK-2.7#AC1, TASK-2.7#AC2, TASK-2.7#AC3, TASK-2.7#AC5 |
| REQ-004.5 | Leave table ends the session and opens its Session Report. | TASK-10.1#AC1, TASK-10.1#AC2, TASK-10.1#AC8, TASK-10.2#AC4 |
| REQ-004.6 | An unfinished hand abandoned by closing the app is not counted in any statistic. | TASK-2.6#AC5, TASK-2.14#AC5 |
| REQ-004.7 | When the user chooses Leave table during a hand, a dialog asks "Leave now? Your hand will be folded."; on confirm the user's hand is folded, the hand plays to completion and is recorded, and then the session ends; on cancel play continues unchanged. | TASK-10.2#AC1, TASK-10.2#AC2, TASK-10.2#AC3, TASK-10.2#AC4, TASK-10.2#AC5, TASK-10.2#AC6 |
| REQ-004.8 | After the user confirms Leave table mid-hand, the user's hand is folded immediately even when another player is to act; this forced fold is not graded and is not counted in error rates or leaks. | TASK-10.2#AC7, TASK-10.2#AC8, TASK-11.1#AC4 |
| REQ-004.9 | The Table header has a Home control that pauses the session and opens Home; used mid-hand, the unfinished hand is abandoned exactly as when the app is closed (REQ-004.2, REQ-004.6). | TASK-2.14#AC1, TASK-2.14#AC2, TASK-2.14#AC3, TASK-2.14#AC4, TASK-2.14#AC5 |
| REQ-005.1 | Game type options are exactly Cash game and Sit-and-go; default is the last used value (REQ-012). | TASK-2.4#AC1, TASK-2.4#AC5, TASK-2.10#AC5 |
| REQ-005.2 | Players options are the integers 2 to 10. | TASK-2.2#AC1, TASK-2.2#AC5 |
| REQ-005.3 | When the chosen size is not a reference size, the screen states that advice will be approximate and names the reference size used. | TASK-2.2#AC2, TASK-2.2#AC3, TASK-2.2#AC4 |
| REQ-005.4 | Table sizes map to reference sizes as: 2 → heads-up; 3, 4, 5, 6, 7 → 6-max; 8, 9, 10 → full ring. Sizes 2, 6, 9 and 10 are exact; 3, 4, 5, 7 and 8 are approximate. | TASK-7.6#AC4, TASK-7.6#AC8, TASK-2.2#AC2, TASK-2.2#AC3, TASK-2.2#AC4 |
| REQ-006.1 | The stake list is exactly $2/$4, $3/$6, $4/$8, $6/$12, $10/$20, $20/$40, default $4/$8 on first use. | TASK-2.1#AC5, TASK-2.3#AC1, TASK-2.3#AC3 |
| REQ-006.2 | Blinds per stake: $2/$4 → $1/$2; $3/$6 → $1/$3; $4/$8 → $2/$4; $6/$12 → $3/$6; $10/$20 → $5/$10; $20/$40 → $10/$20. | TASK-2.3#AC2, TASK-2.3#AC3 |
| REQ-006.3 | All money is play money; no screen offers deposits, payments or real-money conversion. | TASK-2.3#AC5, TASK-2.15#AC1, TASK-2.15#AC2, TASK-2.15#AC4 |
| REQ-006.4 | The stake selector is hidden when Sit-and-go is chosen. | TASK-2.4#AC3, TASK-2.4#AC4, TASK-2.4#AC5 |
| REQ-007.1 | The buy-in is 20 × the big bet of the chosen stake (e.g. $160 at $4/$8); the user cannot change it. | TASK-3.1#AC1, TASK-3.1#AC2, TASK-2.3#AC4 |
| REQ-007.2 | When the user's stack is $0 at the end of a hand, a dialog offers Rebuy and Leave table; no further hand is dealt until the user chooses. | TASK-3.11#AC1, TASK-3.11#AC4, TASK-9.2#AC2 |
| REQ-007.3 | Rebuy sets the user's stack to the buy-in and the session continues; total rebuys are counted in the session result. | TASK-3.11#AC2, TASK-3.11#AC3, TASK-10.1#AC3 |
| REQ-007.4 | The user cannot add chips while their stack is above $0. | TASK-3.11#AC5 |
| REQ-007.5 | When a bot's stack is $0 at the end of a hand, it leaves and a new bot of a style drawn at random from the session's line-up preset takes the seat with a fresh buy-in before the next hand. | TASK-6.8#AC1, TASK-6.8#AC2, TASK-6.8#AC3, TASK-6.8#AC4, TASK-6.8#AC5, TASK-6.8#AC6 |
| REQ-007.6 | When the user busts while the Hand Review panel is open, the panel's Deal next hand control reads Continue, and Continue opens the Rebuy / Leave table dialog. | TASK-9.2#AC1, TASK-9.2#AC2, TASK-9.2#AC3, TASK-9.2#AC4, TASK-9.2#AC5 |
| REQ-007.7 | In a session recorded as Custom, a replacement bot's style is drawn at random from all four styles. | TASK-6.8#AC7 |
| REQ-007.8 | A replacement bot's style is drawn from the styles the session's preset assigns at the current table size; at heads-up with the Tough preset the replacement is TAG. | TASK-6.8#AC3, TASK-6.8#AC8 |
| REQ-008.1 | Starting chips are 1,500 for every player. | TASK-5.1#AC1, TASK-5.1#AC2, TASK-5.1#AC3, TASK-5.1#AC4, TASK-5.1#AC5, TASK-5.10#AC2 |
| REQ-008.2 | Limit schedule (small bet/big bet, blinds = half small bet / small bet): L1 20/40, L2 30/60, L3 40/80, L4 60/120, L5 100/200, L6 150/300, L7 200/400, L8 300/600, L9 400/800, L10 600/1,200; from L10 onward the limits stay at L10. | TASK-5.1#AC1, TASK-5.4#AC1, TASK-5.4#AC3, TASK-5.4#AC4, TASK-5.4#AC6 |
| REQ-008.3 | The level advances after every 10 hands dealt. | TASK-5.4#AC1, TASK-5.4#AC2, TASK-5.4#AC6, TASK-5.10#AC2, TASK-5.5#AC2, TASK-5.5#AC4, TASK-5.5#AC5 |
| REQ-008.4 | Busted bots are not replaced; their seats stay empty. | TASK-5.2#AC1, TASK-5.2#AC2, TASK-5.2#AC3, TASK-5.2#AC4, TASK-5.2#AC5, TASK-5.2#AC6, TASK-5.10#AC2 |
| REQ-008.5 | When the user busts, the sit-and-go ends for the user and the remaining hands are not played out; the user's finishing position is the number of players left including the user. | TASK-5.7#AC1, TASK-5.7#AC2, TASK-5.7#AC3, TASK-5.7#AC5, TASK-5.8#AC2 |
| REQ-008.6 | The result recorded is the user's finishing position out of the starting number of players (e.g. 2nd of 6); no prize money is shown. | TASK-5.1#AC3, TASK-5.7#AC1, TASK-5.7#AC3, TASK-5.7#AC4, TASK-5.7#AC6, TASK-5.11#AC3 |
| REQ-008.7 | Chips in a sit-and-go are shown as plain numbers without a $ sign. | TASK-5.3#AC1, TASK-5.3#AC2, TASK-5.3#AC3, TASK-5.3#AC4, TASK-5.3#AC5, TASK-5.3#AC6 |
| REQ-008.8 | The table header shows the current level, its limits and the hands remaining until the next level. | TASK-5.5#AC1, TASK-5.5#AC2, TASK-5.5#AC3 |
| REQ-008.9 | When the user busts while the Hand Review panel is open, the panel's Deal next hand control reads See results, which ends the session and opens the Session Report. | TASK-5.8#AC1, TASK-5.8#AC2, TASK-5.8#AC3, TASK-5.8#AC4, TASK-5.8#AC5 |
| REQ-008.10 | If the user chooses Leave table in a sit-and-go while holding chips, the finishing position recorded is the number of players left including the user, and the remaining hands are not played. | TASK-5.11#AC1, TASK-5.11#AC2, TASK-5.11#AC3 |
| REQ-008.11 | When the user wins all the chips while the Hand Review panel is open, the panel's Deal next hand control reads See results, which ends the session and opens the Session Report. | TASK-5.8#AC6 |
| REQ-008.12 | From level 10 onward the header shows "Level 10 (final)" with no countdown to the next level. | TASK-5.5#AC3 |
| REQ-008.13 | When the sit-and-go ends while the Hand Review panel is closed, the Session Report opens 1.5 seconds after the final hand's result is shown. | TASK-5.7#AC7 |
| REQ-009.1 | Presets assign styles to seats as: Mixed — styles cycle TAG, Calling station, Maniac, Rock in seat order; Tough — all TAG except one Maniac; Soft — Calling stations and Rocks alternating. | TASK-6.6#AC1, TASK-6.6#AC2, TASK-6.6#AC3, TASK-6.6#AC6, TASK-2.5#AC1, TASK-2.5#AC2, TASK-2.5#AC3, TASK-2.5#AC6 |
| REQ-009.2 | Each bot seat offers the styles TAG, Calling station, Maniac, Rock. | TASK-2.8#AC1 |
| REQ-009.3 | Changing a seat's style does not change other seats. | TASK-2.8#AC2, TASK-2.8#AC3 |
| REQ-009.4 | Each bot has a display name unique within the table. | TASK-6.6#AC5, TASK-2.5#AC5, TASK-6.8#AC4 |
| REQ-009.5 | Randomise line-up assigns a style chosen at random to every bot seat. | TASK-2.9#AC1, TASK-2.9#AC2, TASK-2.9#AC3 |
| REQ-009.6 | A session whose seat styles differ from the chosen preset's assignment is recorded with the line-up name Custom. | TASK-6.7#AC1, TASK-6.7#AC2, TASK-6.7#AC3, TASK-6.7#AC4, TASK-2.5#AC6, TASK-2.8#AC3, TASK-2.8#AC4, TASK-2.9#AC3 |
| REQ-009.7 | At heads-up, the Tough preset seats one TAG bot. | TASK-6.6#AC4, TASK-2.5#AC4 |
| REQ-009.8 | Preset style cycles run over bot seats only, starting with the first bot seat clockwise from the user; the Tough preset's Maniac takes that first bot seat. | TASK-6.6#AC1, TASK-6.6#AC2, TASK-6.6#AC3, TASK-2.5#AC2 |
| REQ-010.1 | The user's seat is drawn uniformly from all seats. | TASK-2.13#AC1, TASK-2.13#AC3 |
| REQ-010.2 | The starting dealer button seat is drawn uniformly from all seats. | TASK-2.13#AC2, TASK-2.13#AC3 |
| REQ-010.3 | The user's seat is always drawn at the bottom centre of the Table screen regardless of seat number. | TASK-3.3#AC3, TASK-2.13#AC3 |
| REQ-011.1 | Rapid: each bot action is displayed within 300 ms of the previous action. | TASK-3.13#AC1, TASK-3.13#AC2, TASK-2.11#AC5, TASK-4.6#DoD1 |
| REQ-011.2 | Realistic: each bot waits a random delay between 0.8 s and 3.0 s before acting. | TASK-3.18#AC1, TASK-3.18#AC2, TASK-2.11#AC4 |
| REQ-011.3 | The speed can be changed during a session from the Table screen and takes effect from the next bot action. | TASK-3.15#AC1, TASK-3.15#AC2, TASK-3.15#AC3 |
| REQ-012.1 | Game type, table size, stake, line-up preset and per-seat styles are pre-filled from the last started session. | TASK-2.10#AC1, TASK-2.10#AC3, TASK-2.10#AC4, TASK-2.10#AC5 |
| REQ-012.2 | On first use the defaults are Cash game, 6 players, $4/$8, Mixed preset, Rapid. | TASK-2.4#AC2, TASK-2.5#AC1, TASK-2.10#AC2, TASK-2.11#AC1 |
| REQ-012.3 | The speed field is pre-filled from the Settings default speed (REQ-050.1), not from the last started session. | TASK-2.11#AC2, TASK-2.11#AC3, TASK-12.5#AC2, TASK-12.5#AC5 |
| REQ-013.1 | The deck contains each of the 52 cards exactly once. | TASK-1.3#AC1, TASK-1.3#AC2 |
| REQ-013.2 | The per-hand seed comes from crypto.getRandomValues (browser) or the Node crypto module (headless). | TASK-1.3#AC3 |
| REQ-013.3 | Replaying a hand with the same replay code, seats, stacks, button and actions reproduces the same cards in the same order. | TASK-1.3#AC4, TASK-1.6#AC5 |
| REQ-013.4 | The replay code is not shown anywhere before the hand ends. | TASK-3.3#AC8 |
| REQ-013.5 | The Hand Review panel shows the hand number and the replay code in small text. | TASK-9.4#AC3 |
| REQ-014.1 | With 3 or more players, the player left of the button posts the small blind and the next player posts the big blind. | TASK-1.4#AC1 |
| REQ-014.2 | Hole cards are dealt one at a time clockwise starting left of the button, two rounds. | TASK-1.4#AC2 |
| REQ-014.3 | Preflop action starts with the player left of the big blind; on later streets it starts with the first active player left of the button. | TASK-1.4#AC3 |
| REQ-014.4 | A betting round ends when every active player not all-in has acted and all have put in the same amount, or all but one have folded. | TASK-1.4#AC5, TASK-1.4#AC8 |
| REQ-014.5 | When all but one player have folded, that player wins the pot without showing cards and no further cards are dealt. | TASK-1.4#AC6, TASK-1.4#AC8 |
| REQ-014.6 | When all remaining players but at most one are all-in, the remaining board cards are dealt without further betting. | TASK-1.9#AC3 |
| REQ-015.1 | Heads-up, the button posts the small blind and the other player posts the big blind. | TASK-1.11#AC1, TASK-1.11#AC4, TASK-2.2#AC6 |
| REQ-015.2 | Heads-up, the button acts first preflop. | TASK-1.11#AC2 |
| REQ-015.3 | Heads-up, the non-button player acts first on flop, turn and river. | TASK-1.11#AC3 |
| REQ-016.1 | Preflop and flop bets and raises are exactly one small bet; turn and river bets and raises are exactly one big bet. | TASK-1.4#AC4 |
| REQ-016.2 | Preflop, the big blind counts as the first bet, so at most three raises follow it. | TASK-1.12#AC1 |
| REQ-016.3 | After the fourth bet on a street, the only legal actions are call and fold. | TASK-1.12#AC1, TASK-1.12#AC2 |
| REQ-016.4 | The cap applies with any number of players, including heads-up. | TASK-1.12#AC3, TASK-1.12#AC4 |
| REQ-016.5 | An all-in raise of less than half a full bet does not reopen betting for players who have already acted; an all-in raise of half a full bet or more counts as a full raise. | TASK-1.14#AC1, TASK-1.14#AC2, TASK-1.14#AC3, TASK-1.14#AC4 |
| REQ-017.1 | When no bet is facing the user, the action bar offers Check and Bet (with amount); Fold is not offered. | TASK-3.2#AC1, TASK-3.2#AC5 |
| REQ-017.2 | When a bet is facing the user, the action bar offers Fold, Call (with amount) and Raise (with "Raise to" amount) unless the street is capped. | TASK-3.2#AC2, TASK-3.2#AC3, TASK-3.2#AC5, TASK-3.7#AC1, TASK-3.7#AC5 |
| REQ-017.3 | When the user's stack is smaller than the call amount, Call is labelled "Call all-in" with the stack amount and Raise is not offered. | TASK-3.7#AC2, TASK-3.7#AC3, TASK-3.7#AC5 |
| REQ-017.4 | An illegal action submitted to the engine is rejected with an error and leaves the game state unchanged. | TASK-1.13#AC1, TASK-1.13#AC2, TASK-1.13#AC3, TASK-1.13#AC4, TASK-1.13#AC5 |
| REQ-017.5 | The action bar is disabled while it is not the user's turn. | TASK-3.2#AC6 |
| REQ-017.6 | Preflop in an unraised pot, the big blind's action bar offers Check and Raise; Fold is not offered. | TASK-3.2#AC4, TASK-3.2#AC5 |
| REQ-017.7 | A player whose stack exceeds the call amount but is smaller than a full bet or raise is offered a bet or raise all-in; the buttons read "Bet all-in $X" or "Raise all-in to $X", and REQ-016.5 decides whether betting reopens. | TASK-1.14#AC5, TASK-1.14#AC6, TASK-1.14#AC7, TASK-3.7#AC5, TASK-3.7#AC6, TASK-3.7#AC7, TASK-3.7#AC8 |
| REQ-018.1 | An all-in player stays in the hand to showdown and makes no further actions. | TASK-1.9#AC1, TASK-1.9#AC2 |
| REQ-018.2 | Each pot records the set of players eligible to win it. | TASK-1.10#AC1, TASK-1.10#AC2 |
| REQ-018.3 | Each pot is awarded only among its eligible players. | TASK-1.10#AC3, TASK-1.10#AC4, TASK-1.10#AC6 |
| REQ-018.4 | Any bet that no other player called is returned to the bettor before showdown. | TASK-1.9#AC4, TASK-1.9#AC5 |
| REQ-018.5 | Total chips at the table are identical before and after every hand (chip conservation). | TASK-1.10#AC5, TASK-1.16#AC7 |
| REQ-019.1 | Hand categories rank, high to low: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card; A-2-3-4-5 is the lowest straight. | TASK-1.2#AC1, TASK-1.2#AC2, TASK-1.2#AC3 |
| REQ-019.2 | Within a category, ties are broken by kickers; suits never break ties. | TASK-1.2#AC4, TASK-1.2#AC5 |
| REQ-019.3 | A split pot that does not divide evenly gives the odd whole dollar (or chip) to the first tied player left of the button. | TASK-1.4#AC7, TASK-1.10#AC6 |
| REQ-019.4 | The last player to bet or raise on the river shows first; if nobody bet on the river, the first active player left of the button shows first. | TASK-1.15#AC1, TASK-1.15#AC2 |
| REQ-019.5 | Each later bot shows only if its hand beats or ties the highest-ranking hand shown so far; otherwise it mucks and its cards stay hidden (Q-33). | TASK-1.15#AC3, TASK-1.15#AC4, TASK-1.15#AC6 |
| REQ-019.6 | The user's own hole cards are always visible to the user. | TASK-3.1#AC3, TASK-3.1#AC4 |
| REQ-019.7 | The winning hand's name (e.g. "Pair of kings") is displayed with the amount won. | TASK-3.4#AC1, TASK-3.4#AC3 |
| REQ-019.8 | Showdown is resolved pot by pot, starting with the last side pot created and ending with the main pot; for each pot a bot shows if its hand can win that pot, and mucking in one pot never forfeits another pot the bot can win. | TASK-1.15#AC5, TASK-1.15#AC6 |
| REQ-019.9 | When a split leaves more than one odd whole dollar (or chip), the odd units go one each to the tied players in clockwise order starting left of the button. | TASK-1.10#AC7 |
| REQ-020.1 | Seats whose player has no chips (busted in a sit-and-go) are skipped for the button and blinds. | TASK-1.16#AC1, TASK-1.16#AC2, TASK-1.16#AC6 |
| REQ-020.2 | No player ever posts a missed or dead blind. | TASK-1.16#AC3 |
| REQ-020.3 | When play becomes heads-up, the heads-up rules of REQ-015 apply from the next hand. | TASK-1.16#AC4 |
| REQ-020.4 | A player who cannot cover a blind posts all their chips and is all-in. | TASK-1.16#AC5 |
| REQ-021.1 | Each bot seat shows name, style label, stack, current-street amount, last action and a card-back marker while it holds cards. | TASK-3.3#AC1, TASK-3.3#AC2 |
| REQ-021.2 | When the Settings toggle "Show opponent styles" is off, style labels are not shown at the table. | TASK-12.2#AC2, TASK-12.2#AC4 |
| REQ-021.3 | The user's seat is drawn at the bottom centre with both hole cards face up, stack and position name (e.g. Cutoff). | TASK-3.3#AC3 |
| REQ-021.4 | The board shows dealt cards and empty placeholders for undealt ones. | TASK-3.3#AC4 |
| REQ-021.5 | The pot total is shown; when side pots exist each pot amount is shown separately. | TASK-3.3#AC5, TASK-3.8#AC1, TASK-3.8#AC2, TASK-3.8#AC3 |
| REQ-021.6 | The dealer button marker is shown at the button seat. | TASK-3.3#AC5 |
| REQ-021.7 | The seat to act is highlighted. | TASK-3.3#AC6 |
| REQ-021.8 | The header shows game type, players, stake (or SNG level) and hand number, plus a Leave table control. | TASK-3.3#AC7 |
| REQ-022.1 | Amount labels read "Call $4", "Bet $4", "Raise to $8", "Call all-in $3" (chip numbers without $ in a sit-and-go). | TASK-3.2#AC1, TASK-3.2#AC2, TASK-3.2#AC3, TASK-3.2#AC4, TASK-3.7#AC1, TASK-3.7#AC2, TASK-3.7#AC4, TASK-3.7#AC6, TASK-3.7#AC7 |
| REQ-022.2 | The Hint button is present whenever the action bar is enabled. | TASK-8.1#AC1 |
| REQ-022.3 | No single-key keyboard shortcuts trigger actions. | TASK-3.2#AC7 |
| REQ-022.4 | Each action button is at least 44 × 44 CSS px. | TASK-3.2#AC8 |
| REQ-023.1 | Each entry names the player, the action and the amount (e.g. "Ben bets $4"). | TASK-4.1#AC1, TASK-4.1#AC2, TASK-4.1#AC4 |
| REQ-023.2 | Street changes appear as entries with the new board cards and pot (e.g. "Flop: K♠ 9♦ 4♣ (pot $26)"). | TASK-4.1#AC1, TASK-4.1#AC3, TASK-4.1#AC4 |
| REQ-023.3 | The log is cleared when a new hand starts. | TASK-4.1#AC5 |
| REQ-023.4 | The collapsed or expanded state is kept across hands and sessions. | TASK-4.3#AC1, TASK-4.3#AC2, TASK-4.3#AC3, TASK-4.3#AC4 |
| REQ-024.1 | The result shows each winner, the pot amount won and the winning hand name when there was a showdown. | TASK-3.4#AC1, TASK-3.4#AC2, TASK-3.4#AC3, TASK-3.8#AC2 |
| REQ-024.2 | While the Hand Review panel is open, the next hand waits for Deal next hand. | TASK-9.1#AC5, TASK-9.1#AC6, TASK-9.7#AC2 |
| REQ-024.3 | While the panel is not open (user folded preflop, or auto-open is off), the next hand is dealt 1.5 s after the result is shown. | TASK-3.4#AC4, TASK-9.1#AC3, TASK-9.1#AC4, TASK-9.7#AC1 |
| REQ-024.4 | Bots never act during the user's turn and the user never waits for a bot when no bot is to act. | TASK-3.1#AC4, TASK-3.1#AC5, TASK-3.1#AC6, TASK-3.1#AC7, TASK-3.18#AC3, TASK-3.18#AC4 |
| REQ-024.5 | The user has no time limit for a decision. | TASK-3.1#AC5 |
| REQ-024.6 | An automated run at Rapid speed with a scripted user completes 200 hands in under 60 minutes (verifies G-5). | TASK-3.13#AC3 |
| REQ-025.1 | Bot decision code receives a view of the game state that excludes other players' hole cards and undealt cards. | TASK-1.5#AC1, TASK-1.5#AC2, TASK-1.5#AC3, TASK-6.1#AC4, TASK-1.15#AC4 |
| REQ-025.2 | Hints and grades for a decision use only the user's view at that decision point. | TASK-7.2#AC5, TASK-7.2#AC6, TASK-7.3#AC6, TASK-7.15#AC4 |
| REQ-025.3 | A decision is graded by the information available when it was made, not by the cards that came later or by the outcome. | TASK-7.4#AC7, TASK-7.15#AC4 |
| REQ-026.1 | A TAG bot chooses the advice engine's recommended action except where its mixing rule (REQ-028) selects an alternative. | TASK-6.1#AC1, TASK-6.1#AC2, TASK-6.1#AC3, TASK-6.1#AC5, TASK-6.2#AC3, TASK-6.2#AC4 |
| REQ-026.2 | Calling station, Maniac and Rock bots apply documented deviations: Calling station calls where the advice is fold or raise more often than TAG; Maniac bets or raises where the advice is check or call more often than TAG; Rock folds every preflop hand outside its narrower starting range. | TASK-6.3#AC2, TASK-6.3#AC3, TASK-6.3#AC5, TASK-6.4#AC2, TASK-6.4#AC3, TASK-6.4#AC5, TASK-6.5#AC2, TASK-6.5#AC3, TASK-6.5#AC4 |
| REQ-026.3 | Each style's parameters are stored in one data file per style and documented with a description of the style. | TASK-6.2#AC1, TASK-6.3#AC1, TASK-6.3#AC4, TASK-6.4#AC1, TASK-6.4#AC4, TASK-6.5#AC1, TASK-6.5#AC5 |
| REQ-027.1 | TAG — VPIP 18–26%, PFR 14–22%, aggression (bets + raises as % of bets, raises and calls) 45–65%. | TASK-6.16#AC1, TASK-6.16#AC3, TASK-6.17#AC4 |
| REQ-027.2 | Calling station — VPIP 45–65%, PFR 3–10%, aggression 10–25%. | TASK-6.17#AC1, TASK-6.17#AC3 |
| REQ-027.3 | Maniac — VPIP 50–75%, PFR 35–60%, aggression 65–85%. | TASK-6.17#AC2, TASK-6.17#AC3 |
| REQ-027.4 | Rock — VPIP 8–15%, PFR 6–12%, aggression 35–55%. | TASK-6.16#AC2, TASK-6.16#AC3, TASK-6.17#AC4 |
| REQ-027.5 | The playtest CLI reports each style's measured values and exits with failure when any value is outside its band. | TASK-6.11#AC1, TASK-6.11#AC2, TASK-6.11#AC5, TASK-6.16#AC3, TASK-6.17#AC3, TASK-6.17#AC4, TASK-6.17#DoD1 |
| REQ-027.6 | Aggression in these bands uses the REQ-045.3 definition (flop, turn and river actions only). | TASK-6.11#AC3 |
| REQ-028.1 | Bot randomness comes only from a generator seeded from the hand's replay code and the bot's seat. | TASK-6.18#AC1, TASK-6.18#AC2, TASK-6.15#AC3 |
| REQ-028.2 | Replaying a hand with the same replay code and the same user actions reproduces every bot action. | TASK-6.15#AC1, TASK-6.15#AC2, TASK-6.15#AC3 |
| REQ-028.3 | No bot plays a fully deterministic strategy in spots its style marks as mixed. | TASK-6.2#AC2, TASK-6.2#AC3, TASK-6.11#AC4 |
| REQ-029.1 | Bot parameters do not change in response to the user's actions or statistics. | TASK-6.14#AC1, TASK-6.14#AC2 |
| REQ-029.2 | Bots request advice with the typical-player basis only; observed opponent statistics (REQ-035.2) are never used in bot decisions. | TASK-6.18#AC3 |
| REQ-030.1 | TAG vs five Calling stations: TAG BB/100 > 0 with 95% confidence. | TASK-6.12#AC1, TASK-6.12#DoD1 |
| REQ-030.2 | TAG vs five Maniacs: TAG BB/100 > 0 with 95% confidence. | TASK-6.12#AC2, TASK-6.12#DoD1 |
| REQ-030.3 | TAG vs five Rocks: TAG BB/100 > 0 with 95% confidence. | TASK-6.12#AC3, TASK-6.12#DoD1 |
| REQ-030.4 | The playtest CLI reports each bot's BB/100 with its 95% confidence interval. | TASK-6.10#AC1, TASK-6.10#AC3 |
| REQ-031.1 | The panel shows VPIP %, PFR %, aggression % and "over N hands" for the current session. | TASK-3.14#AC1 |
| REQ-031.2 | Below 10 observed hands, each value shows "—" with the hand count. | TASK-3.14#AC2, TASK-3.14#AC3 |
| REQ-031.3 | When a seat gets a new bot (REQ-007.5), its observed stats start from zero. | TASK-3.14#AC4 |
| REQ-031.4 | The panel closes when the pointer leaves the seat or the user taps elsewhere. | TASK-3.14#AC5, TASK-3.14#AC6 |
| REQ-032.1 | Charts exist for heads-up, 6-max and full ring. | TASK-7.6#AC1, TASK-7.6#AC4, TASK-7.6#AC5 |
| REQ-032.2 | Situations covered per position: unopened pot, facing one or more limpers, facing a raise, facing a raise and calls, facing a re-raise, and blind defence. | TASK-7.2#AC1, TASK-7.6#AC2 |
| REQ-032.3 | Each chart cell holds one action (fold, call, raise) and a borderline flag, plus zero or one acceptable alternative action. | TASK-7.2#AC2, TASK-7.2#AC4, TASK-7.2#AC8 |
| REQ-032.4 | Every chart file carries a written justification of its ranges in plain English. | TASK-7.2#AC2, TASK-7.6#AC3 |
| REQ-032.5 | Charts are data files loaded by the engine, not hard-coded logic. | TASK-7.2#AC3 |
| REQ-032.6 | When facing a fourth bet preflop (a re-raise of a re-raise), the advice uses the facing-a-re-raise chart; if the street is capped, a raise recommendation becomes call. | TASK-7.2#AC7, TASK-7.6#AC6, TASK-7.6#AC7 |
| REQ-033.1 | Call is recommended over fold when equity is at least the required equity (call amount ÷ pot after calling). | TASK-7.3#AC1, TASK-7.3#AC2, TASK-7.8#AC7 |
| REQ-033.2 | Bet or raise for value is recommended when equity against the range that would call exceeds 50%. | TASK-7.8#AC1, TASK-7.8#AC2, TASK-7.8#AC3, TASK-7.8#AC4, TASK-7.8#AC5, TASK-7.8#AC6 |
| REQ-033.3 | Drawing hands count implied odds by a documented rule that names the outs used. | TASK-7.9#AC1, TASK-7.9#AC2, TASK-7.9#AC3, TASK-7.9#AC4, TASK-7.9#AC5 |
| REQ-033.4 | The rules are written in one design document and every rule has a unit test. | TASK-7.3#AC5, TASK-7.8#DoD1, TASK-7.9#DoD1 |
| REQ-033.5 | Each recommendation returns the action, equity %, required equity % and the rule that fired. | TASK-7.3#AC3, TASK-7.3#AC4, TASK-7.8#AC8, TASK-7.9#AC6 |
| REQ-033.6 | "The range that would call" is every hand in the opponent's estimated range that continues against the bet, including hands that would raise. | TASK-7.8#AC1 |
| REQ-033.7 | The implied-odds allowance is one big bet per opponent still in the hand: required equity = call ÷ (pot after calling + one big bet × opponents still in), applied only to drawing hands with cards to come. | TASK-7.9#AC1, TASK-7.9#AC2, TASK-7.9#AC3, TASK-7.9#AC4, TASK-7.9#AC5 |
| REQ-034.1 | For heads-up preflop matchups, results are within 1.5 percentage points of exhaustive enumeration (e.g. AA vs KK 81.9%, AKs vs QQ 46.2%). | TASK-7.1#AC1, TASK-7.1#AC2, TASK-7.7#AC2 |
| REQ-034.2 | For multiway and range-versus-range cases, results are within 1.5 percentage points of an exhaustive or high-sample reference computed offline. | TASK-7.1#AC3, TASK-7.7#AC1, TASK-7.7#AC2 |
| REQ-034.3 | For a given input, the calculator returns the same number every time (sampling, if used, is seeded from the input). | TASK-7.1#AC4, TASK-7.1#AC5, TASK-7.7#AC3 |
| REQ-035.1 | Default ranges per (reference size, position, action sequence) are authored data with justification. | TASK-7.5#AC1, TASK-7.5#AC2, TASK-7.5#AC3, TASK-7.5#AC4, TASK-7.5#AC5, TASK-7.5#AC6 |
| REQ-035.2 | From 30 observed hands, an opponent's preflop range width is scaled toward their observed VPIP and PFR by a documented formula. | TASK-7.13#AC1, TASK-7.13#AC2, TASK-7.13#AC5 |
| REQ-035.3 | The range model never reads a bot's style label or internal parameters. | TASK-7.5#AC7, TASK-7.5#AC8 |
| REQ-035.4 | The hint and review show which basis was used: "typical player" or "based on N hands of this opponent". | TASK-7.13#AC1, TASK-7.13#AC3, TASK-7.13#AC4, TASK-8.1#AC2, TASK-8.1#AC3, TASK-8.1#AC4, TASK-9.3#AC3 |
| REQ-035.5 | Range narrowing sorts each hand into Strong (two pair or better), Pair, Draw (flush draw or open-ended straight draw without a pair) or Air; a bet keeps Strong, Pair and Draw; a check keeps Pair, Draw and Air; a call keeps Pair and Draw; a raise keeps Strong and Draw; the rule is re-applied on every street. | TASK-7.5#AC3, TASK-7.5#AC4, TASK-7.5#AC5, TASK-7.5#AC6 |
| REQ-035.6 | Observed-statistics scaling uses width = d + (o − d) × min(n, 100) ÷ 100, where d is the default range width, o is the observed PFR for raising ranges or VPIP for calling ranges, and n is the number of observed hands. | TASK-7.13#AC2, TASK-7.13#AC5, TASK-7.13#AC6 |
| REQ-036.1 | Repeated calls with identical inputs return identical outputs. | TASK-7.10#AC5, TASK-7.15#AC1, TASK-7.15#AC2 |
| REQ-036.2 | The hint shown during a hand and the review entry for that same decision state the same recommendation and numbers. | TASK-7.15#AC3, TASK-9.3#AC4, TASK-8.2#AC6 |
| REQ-037.1 | The explanation is at most three sentences. | TASK-7.10#AC1, TASK-7.11#AC6 |
| REQ-037.2 | It names at least one concept from the concept list: pot odds, equity, position, hand strength, outs and draws, implied odds, value bet, bluff, opponent type, initiative. | TASK-7.10#AC2, TASK-7.11#AC6 |
| REQ-037.3 | A concept is explained in the sentence where it is first named, since there is no glossary screen. | TASK-7.10#AC3 |
| REQ-037.4 | It quotes the numbers used (equity %, required equity %) when the decision rests on them. | TASK-7.10#AC4, TASK-7.14#AC4 |
| REQ-038.1 | Correct: the action equals the recommended action or the listed acceptable alternative. | TASK-7.4#AC1, TASK-7.14#AC3 |
| REQ-038.2 | Preflop: a deviation on a chart cell flagged borderline is a Minor error; on any other cell it is a Major error. | TASK-7.4#AC2, TASK-7.14#AC3 |
| REQ-038.3 | Postflop call/fold: folding when equity exceeds required equity by 10 or more points, or calling when equity is 10 or more points below required equity, is a Major error; smaller margins are Minor errors. | TASK-7.4#AC3, TASK-7.4#AC4, TASK-7.14#AC3 |
| REQ-038.4 | Postflop bet/raise versus check/call: a deviation is a Major error only when equity against the calling range is 15 or more points away from 50%; otherwise Minor. | TASK-7.4#AC5, TASK-7.4#AC6, TASK-7.14#AC3 |
| REQ-038.5 | A decision whose margin is within the close-call band (REQ-038.3 under 10 points, REQ-038.4 under 15 points) is never graded Major. | TASK-7.4#AC3, TASK-7.4#AC4, TASK-7.4#AC5, TASK-7.4#AC6 |
| REQ-038.6 | When the user raises where the advice is fold, or folds where the advice is raise, the call/fold margin of REQ-038.3 decides Minor versus Major. | TASK-7.4#AC8 |
| REQ-039.1 | At least 100 preflop spots spread over heads-up, 6-max and full ring, and at least 100 postflop spots. | TASK-7.11#AC4, TASK-7.14#AC1 |
| REQ-039.2 | Each spot records the player view, the recommended action, any acceptable alternative and a written justification. | TASK-7.11#AC1 |
| REQ-039.3 | Only spots whose answer follows from established limit theory without close judgement are included. | TASK-7.11#AC5, TASK-7.14#AC2 |
| REQ-039.4 | The suite runs in the standard test command and 100% must pass. | DoD-global#3, TASK-7.11#AC2, TASK-7.11#AC3, TASK-7.14#AC5 |
| REQ-040.1 | A decision is hinted when the Hint was opened at that decision point before the action. | TASK-8.2#AC1, TASK-8.2#AC2, TASK-8.2#AC3, TASK-8.2#AC4, TASK-8.2#AC5 |
| REQ-040.2 | Hinted decisions show a "hinted" tag in the Hand Review panel. | TASK-9.6#AC1, TASK-9.6#AC2 |
| REQ-040.3 | The G-2 major-error rate counts only decisions that were not hinted. | TASK-11.1#AC3, TASK-11.3#AC3, TASK-11.11#AC4 |
| REQ-040.4 | The Session Report shows the number and percentage of decisions that were hinted. | TASK-10.7#AC1, TASK-10.7#AC2, TASK-10.7#AC3 |
| REQ-041.1 | At table sizes 3, 4, 5, 7 and 8, hints and review entries show "approximate (based on <reference size>)". | TASK-7.16#AC1, TASK-7.16#AC2, TASK-7.16#AC3, TASK-7.16#AC4, TASK-8.4#AC1, TASK-8.4#AC2, TASK-8.4#AC3, TASK-9.9#AC1, TASK-9.9#AC2 |
| REQ-041.2 | In a sit-and-go with the user's stack under 10 big bets of the current level, hints and review entries add one short-stack sentence. | TASK-7.17#AC1, TASK-7.17#AC2, TASK-7.17#AC3, TASK-7.17#AC5, TASK-7.17#AC6, TASK-5.4#AC5, TASK-8.4#AC4, TASK-9.9#AC3 |
| REQ-041.3 | Tournament-specific strategy (ICM, bubble play) is not applied. | TASK-7.17#AC4 |
| REQ-042.1 | The hint card shows recommended action, equity %, required equity %, explanation (REQ-037) and basis (REQ-035.4). | TASK-8.1#AC2, TASK-8.1#AC3 |
| REQ-042.2 | The hint card does not cover the action bar. | TASK-8.1#AC5 |
| REQ-042.3 | Clicking Hint again hides the card; taking an action hides it. | TASK-8.1#AC6, TASK-8.1#AC7 |
| REQ-042.4 | Hints are unlimited. | TASK-8.1#AC8 |
| REQ-042.5 | Opening the hint marks the decision as hinted (REQ-040). | TASK-8.2#AC1, TASK-8.2#AC2 |
| REQ-042.6 | For preflop decisions the hint card shows the chart basis (e.g. "From the 6-max chart: raise A9o from the cutoff") instead of equity and required-equity numbers; the numbers are shown for flop, turn and river decisions. | TASK-8.1#AC2, TASK-8.1#AC3 |
| REQ-043.1 | The panel lists each of the user's decisions in order with street, board at that point, the user's action, the recommended action, the grade, equity %, required equity % and the explanation. | TASK-9.3#AC1, TASK-9.3#AC4, TASK-9.3#AC5 |
| REQ-043.2 | Only the user's decisions are graded; bot decisions are not graded. | TASK-9.1#AC1, TASK-9.1#AC2 |
| REQ-043.3 | The panel header shows hand number, the user's hole cards and position, and the amount won or lost. | TASK-9.4#AC1, TASK-9.4#AC2 |
| REQ-043.4 | The panel shows the replay code (REQ-013.5). | TASK-9.4#AC3 |
| REQ-043.5 | Hinted decisions carry a "hinted" tag (REQ-040.2). | TASK-9.6#AC1, TASK-9.6#AC3 |
| REQ-043.6 | Opponent hole cards appear only if they were shown at showdown (Q-33). | TASK-9.5#AC1, TASK-9.5#AC2, TASK-9.5#AC3 |
| REQ-043.7 | The panel has Close and Deal next hand controls. | TASK-9.1#AC6, TASK-9.1#AC7 |
| REQ-043.8 | While auto-open is off, a grade summary badge (e.g. "1 Major, 1 Minor") appears after each played hand, and clicking it opens the panel. | TASK-9.7#AC1, TASK-9.7#AC2, TASK-9.7#AC3 |
| REQ-043.9 | For preflop decisions, review entries show the chart basis instead of equity and required-equity numbers. | TASK-9.3#AC2 |
| REQ-043.10 | After the user closes the panel, the next hand waits for the Deal next hand control, which stays visible on the table. | TASK-9.1#AC7 |
| REQ-043.11 | The grade summary badge reads "All correct" when the hand has no errors, disappears when the next hand is dealt, and is not shown after a hand where the user folded preflop. | TASK-9.7#AC4, TASK-9.7#AC5, TASK-9.7#AC6 |
| REQ-043.12 | The panel is skipped only when the user's single action in the hand was folding preflop; a hand where the user called or raised preflop and then folded preflop opens the panel. | TASK-9.1#AC3, TASK-9.1#AC8 |
| REQ-043.13 | With auto-open off, the grade summary badge also appears after a hand where the user called or raised preflop and then folded preflop. | TASK-9.7#AC6 |
| REQ-044.1 | Cash: result in $, BB/100 and number of rebuys. Sit-and-go: finishing position out of starting players. | TASK-10.1#AC3, TASK-10.1#AC4, TASK-10.12#AC1, TASK-10.12#AC2 |
| REQ-044.2 | Hands played, Major errors per 100 hands and Minor errors per 100 hands (unhinted decisions). | TASK-10.4#AC1, TASK-10.4#AC2, TASK-10.4#AC3, TASK-10.4#AC4 |
| REQ-044.3 | Number and % of decisions that were hinted. | TASK-10.7#AC1, TASK-10.7#AC2, TASK-10.7#AC3, TASK-10.7#AC4 |
| REQ-044.4 | VPIP, PFR, Aggression, WTSD and W$SD, each with its healthy range for the session's reference size and a label in range / too high / too low. | TASK-10.3#AC3, TASK-10.3#AC4, TASK-10.3#AC5 |
| REQ-044.5 | Up to 3 leaks (REQ-047) with title, evidence and a one-sentence fix. | TASK-10.5#AC7, TASK-10.5#AC8, TASK-10.6#AC8, TASK-10.8#AC3 |
| REQ-044.6 | Controls to open Statistics and return Home. | TASK-11.6#AC1, TASK-11.6#AC2, TASK-11.6#AC3 |
| REQ-044.7 | The report is saved and can be reopened from the Home snapshot (REQ-003.2). | TASK-10.1#AC5, TASK-10.1#AC6, TASK-2.16#AC4, TASK-2.16#AC5 |
| REQ-044.8 | A session with 0 completed hands ends without a report and is not stored. | TASK-10.1#AC7 |
| REQ-044.9 | When the session has no leaks, the leaks section reads "No leaks found this session (a leak needs 8+ spots with 40%+ errors)." | TASK-10.5#AC8 |
| REQ-044.10 | A style stat shown as "—" (REQ-045.6) carries the label "not enough data" instead of a range label. | TASK-10.3#AC7 |
| REQ-044.11 | Healthy-range limits are inclusive: a value equal to either limit is in range. | TASK-10.3#AC4 |
| REQ-045.1 | VPIP = hands where the user voluntarily put chips in preflop (call or raise, not counting blinds) ÷ hands dealt. | TASK-7.12#AC1, TASK-7.12#AC6 |
| REQ-045.2 | PFR = hands where the user raised preflop ÷ hands dealt. | TASK-7.12#AC1 |
| REQ-045.3 | Aggression = bets + raises ÷ (bets + raises + calls), over flop, turn and river actions. | TASK-7.12#AC2 |
| REQ-045.4 | WTSD = hands reaching showdown ÷ hands where the user saw the flop. | TASK-7.12#AC3 |
| REQ-045.5 | W$SD = showdowns where the user won chips ÷ showdowns reached. | TASK-7.12#AC4 |
| REQ-045.6 | A stat with a zero denominator shows "—". | TASK-7.12#AC5, TASK-10.3#AC7 |
| REQ-046.1 | Healthy ranges exist for VPIP, PFR, Aggression, WTSD and W$SD at heads-up, 6-max and full ring. | TASK-10.3#AC1, TASK-10.3#AC2, TASK-10.3#AC5 |
| REQ-046.2 | Each range has a justification sentence stored with it. | TASK-10.3#AC1, TASK-10.3#DoD1 |
| REQ-046.3 | For non-reference sizes, the mapped reference size's ranges are used and marked approximate. | TASK-10.3#AC6 |
| REQ-047.1 | Decision categories: preflop by position group (early, middle, late, blinds) × action (open, call, raise); postflop by street (flop, turn, river) × facing a bet (fold, call, raise) or not (check, bet). | TASK-10.5#AC1, TASK-10.5#AC2, TASK-10.6#AC4, TASK-10.6#AC5, TASK-10.6#AC6, TASK-10.6#AC7 |
| REQ-047.2 | A category becomes a leak at ≥ 8 decisions and ≥ 40% errors among unhinted decisions. | TASK-10.5#AC3, TASK-10.5#AC4, TASK-10.5#AC5, TASK-10.5#AC6, TASK-10.6#AC8 |
| REQ-047.3 | Leaks are ranked by Major error count, then by error rate; at most 3 are shown. | TASK-10.8#AC1, TASK-10.8#AC2, TASK-10.8#AC3 |
| REQ-047.4 | Evidence reads "<errors> of <decisions> <category> graded as errors". | TASK-10.5#AC3, TASK-10.5#AC7 |
| REQ-047.5 | Each category has an authored one-sentence fix. | TASK-10.5#AC2, TASK-10.5#AC7, TASK-10.5#DoD1, TASK-10.6#AC7, TASK-10.6#DoD1 |
| REQ-047.6 | Position groups count back from the button: button and cutoff are late, the next two seats are middle, all remaining non-blind seats are early, and the small and big blinds are blinds; heads-up, the button is late and the other player is blinds. | TASK-10.6#AC1, TASK-10.6#AC2, TASK-10.6#AC3, TASK-5.2#AC6 |
| REQ-047.7 | Preflop folds form a category for each position group in addition to open, call and raise. | TASK-10.6#AC4, TASK-10.6#AC7, TASK-10.6#AC8 |
| REQ-047.8 | The 8-decision threshold counts unhinted decisions only. | TASK-10.5#AC6 |
| REQ-047.9 | A preflop limp or small-blind complete counts as a call; a big-blind check belongs to no leak category but counts in error rates. | TASK-10.6#AC5, TASK-10.6#AC6 |
| REQ-048.1 | Grouping options: per 500 hands (default), per session, per day. | TASK-11.1#AC2, TASK-11.1#AC3, TASK-11.1#AC4, TASK-11.1#AC5, TASK-11.2#AC4, TASK-11.5#AC1, TASK-11.5#AC2, TASK-11.5#AC3, TASK-11.5#AC4 |
| REQ-048.2 | Filters: table size (All, Heads-up, 6-max, Full ring — by reference size) and game type (All, Cash, Sit-and-go). | TASK-11.4#AC1, TASK-11.4#AC2, TASK-11.4#AC3, TASK-11.4#AC4, TASK-11.4#AC5, TASK-11.5#AC4, TASK-11.7#AC3, TASK-11.9#AC3 |
| REQ-048.3 | The Major-error chart shows a dashed target line at half the user's first-1,000-hand rate (G-2) once 1,000 hands of any kind exist. | TASK-11.3#AC1, TASK-11.3#AC2, TASK-11.3#AC4 |
| REQ-048.4 | The BB/100 chart uses cash-game hands only and shows a dashed break-even line (G-3). | TASK-11.2#AC1, TASK-11.2#AC2, TASK-11.2#AC3, TASK-11.2#AC4, TASK-11.2#AC5, TASK-11.2#AC6 |
| REQ-048.5 | Sit-and-go results show the average finishing position and the count of sit-and-gos per group. | TASK-11.9#AC1, TASK-11.9#AC2, TASK-11.9#AC3, TASK-11.9#AC4 |
| REQ-048.6 | Total hands and sessions in the current filter are shown. | TASK-11.1#AC7, TASK-11.1#AC8, TASK-11.4#AC4, TASK-11.7#AC2 |
| REQ-048.7 | At per-500 grouping with 1 to 499 hands in the filter, the screen shows "Play <n> more hands to see your first trend point." instead of a chart. | TASK-11.1#AC6, TASK-11.1#AC7, TASK-11.4#AC5 |
| REQ-048.8 | A line-up filter offers All, Mixed, Tough, Soft and Custom. | TASK-11.7#AC1, TASK-11.7#AC2, TASK-11.7#AC3, TASK-11.7#AC4 |
| REQ-048.9 | The G-2 baseline rate is the Major errors per 100 hands, counting only unhinted decisions, over the user's first 1,000 hands of any game type and table size, independent of the current filter; the target line appears once 1,000 hands exist. | TASK-11.3#AC1, TASK-11.3#AC2, TASK-11.3#AC3, TASK-11.3#AC4, TASK-11.3#AC5 |
| REQ-048.10 | Per-session and per-day groupings plot every session or day that has hands; with zero hands in the filter the screen shows "Play your first hand to see trends." | TASK-11.1#AC7, TASK-11.5#AC5, TASK-11.5#AC6, TASK-11.7#AC4 |
| REQ-048.11 | At per-500 grouping only complete 500-hand groups are plotted. | TASK-11.1#AC5, TASK-11.2#AC6 |
| REQ-048.12 | When the filter contains no cash-game hands, the BB/100 chart shows "No cash-game hands yet." | TASK-11.2#AC5 |
| REQ-048.13 | When the filter has 1 to 499 cash-game hands, the BB/100 chart shows "Play <n> more cash hands to see your first trend point." | TASK-11.2#AC6, TASK-11.2#AC7 |
| REQ-048.14 | Count messages use the singular form for 1 (e.g. "Play 1 more hand to see your first trend point."). | TASK-11.1#AC6, TASK-11.2#AC7 |
| REQ-049.1 | Each stat shows value, healthy range and in range / too high / too low. | TASK-11.8#AC1, TASK-11.8#AC2, TASK-11.8#AC4, TASK-11.8#AC6, TASK-11.8#AC7, TASK-11.10#AC2 |
| REQ-049.2 | The screen shows "<k> of 5 in range (goal: 4)". | TASK-11.8#AC3, TASK-11.8#AC5, TASK-11.8#AC6, TASK-11.8#AC7 |
| REQ-049.3 | With the filter set to All table sizes, the stats show separately per reference size played. | TASK-11.10#AC1, TASK-11.10#AC2, TASK-11.10#AC3 |
| REQ-049.4 | After 5,000 hands of any kind, independent of the current filter, the screen states whether the G-2 target has been met. | TASK-11.11#AC1, TASK-11.11#AC2, TASK-11.11#AC3, TASK-11.11#AC4, TASK-11.11#AC5 |
| REQ-050.1 | Default speed: Rapid or Realistic (default Rapid). | TASK-12.5#AC1, TASK-12.5#AC2, TASK-12.5#AC3, TASK-12.5#AC4, TASK-12.5#AC5 |
| REQ-050.2 | Open the Hand Review panel after every hand: on or off (default on). | TASK-12.6#AC1, TASK-12.6#AC2, TASK-12.6#AC3, TASK-12.6#AC4 |
| REQ-050.3 | Show opponent styles at the table: on or off (default on). | TASK-12.2#AC1, TASK-12.2#AC2, TASK-12.2#AC3, TASK-12.2#AC4 |
| REQ-050.4 | Four-colour deck (clubs green, diamonds blue): on or off (default off). | TASK-12.7#AC1, TASK-12.7#AC2, TASK-12.7#AC3, TASK-12.7#AC4 |
| REQ-050.5 | Settings is reachable from Home and from the Table header; changes made mid-session apply from the next screen update. | TASK-12.1#AC1, TASK-12.1#AC3, TASK-12.3#AC1, TASK-12.3#AC4, TASK-12.5#AC4, TASK-12.6#AC4, TASK-12.7#AC4 |
| REQ-050.6 | The app version is shown. | TASK-12.1#AC2 |
| REQ-050.7 | Opening Settings from the Table header shows Settings as an overlay above the table; the session is neither paused nor ended, and closing the overlay returns to the same table state. | TASK-12.3#AC1, TASK-12.3#AC2, TASK-12.3#AC3, TASK-12.3#AC5 |
| REQ-050.8 | While the Settings overlay is open at the table, play is frozen: bots do not act, the auto-deal timer and the session clock pause, and closing the overlay resumes from the same point. | TASK-12.3#AC6, TASK-12.3#AC7, TASK-12.3#AC8 |
| REQ-051.1 | The dialog states that all history will be permanently deleted and there is no backup. | TASK-12.4#AC1 |
| REQ-051.2 | The dialog has Cancel (default focus) and "Delete everything" buttons. | TASK-12.4#AC2, TASK-12.4#AC3 |
| REQ-051.3 | After deletion the app shows the first-use Home state and default settings. | TASK-12.4#AC4, TASK-12.4#AC5, TASK-12.4#AC6, TASK-12.4#AC7, TASK-12.4#AC8 |
| REQ-051.4 | Cancel deletes nothing. | TASK-12.4#AC3 |
| REQ-052.1 | A completed hand is written to storage before the next hand is dealt. | TASK-3.9#AC1, TASK-3.9#AC2 |
| REQ-052.2 | Each hand record holds: session id, hand number, replay code, game type, stake or level, seats with names, styles and starting stacks, button seat, every action with amount, board, cards shown at showdown, the user's hole cards, pot awards, and for each user decision the recommendation, numbers, explanation, grade and hinted flag. | TASK-3.9#AC4, TASK-3.9#AC5, TASK-3.9#AC6, TASK-3.12#AC1, TASK-3.12#AC2, TASK-3.12#AC3, TASK-3.12#AC4 |
| REQ-052.3 | Session state is saved after every completed hand so a paused session can resume (REQ-004). | TASK-3.10#AC1, TASK-3.10#AC2, TASK-3.10#AC3, TASK-3.10#AC4 |
| REQ-052.4 | On first launch the app requests persistent storage (navigator.storage.persist) and records whether it was granted. | TASK-13.2#AC1, TASK-13.2#AC2, TASK-13.2#AC3, TASK-13.2#AC4 |
| REQ-052.5 | Hand records and reports are never modified after they are written. | TASK-3.9#AC7, TASK-10.1#AC6 |
| REQ-052.6 | Data is retained until Reset all data; there is no automatic deletion. | TASK-3.9#AC8 |
| REQ-052.7 | Each hand record stores the date and time the hand completed. | TASK-3.9#AC3 |
| REQ-053.1 | With 100,000 stored hands, all screens still open and meet the performance limits of REQ-055. | TASK-13.9#AC2, TASK-13.10#AC1, TASK-13.10#AC2, TASK-13.10#AC3, TASK-13.10#AC4, TASK-11.12#AC1, TASK-12.4#AC8 |
| REQ-053.2 | If a write fails, no new hand is dealt and a message states that the last hand could not be saved, with Retry and Leave table. | TASK-13.3#AC1, TASK-13.3#AC2, TASK-13.3#AC3, TASK-13.3#AC4, TASK-13.3#AC5, TASK-13.3#AC6 |
| REQ-053.3 | When persistent storage was not granted, Settings shows a one-line warning that the browser can clear history under storage pressure. | TASK-12.9#AC1, TASK-12.9#AC2, TASK-12.9#AC3, TASK-12.9#AC4 |
| REQ-054.1 | Every store records its schema version. | TASK-13.6#AC1, TASK-13.6#AC2 |
| REQ-054.2 | Migrations run at launch, in order, for each version step. | TASK-13.6#AC2, TASK-13.6#AC3, TASK-13.6#AC4, TASK-13.6#AC5 |
| REQ-054.3 | If a migration fails, the old data is left unchanged and the app shows an error with the failing version step instead of Home. | TASK-13.7#AC1, TASK-13.7#AC2, TASK-13.7#AC3, TASK-13.7#AC4 |
| REQ-055.1 | Hint card shown ≤ 1.0 s after clicking Hint. | TASK-8.3#AC1, TASK-8.3#DoD1, TASK-13.10#AC2 |
| REQ-055.2 | Hand Review panel shown ≤ 1.0 s after the hand ends. | TASK-9.8#AC1, TASK-9.8#DoD1, TASK-13.10#AC2 |
| REQ-055.3 | Bot decision computed ≤ 100 ms. | TASK-6.13#AC1, TASK-6.13#AC2, TASK-6.13#DoD1, TASK-13.10#AC3 |
| REQ-055.4 | Launch to Home ≤ 3 s on a repeat launch. | TASK-13.9#AC1, TASK-13.9#AC2, TASK-13.9#DoD1 |
| REQ-055.5 | Statistics screen rendered ≤ 2 s with 100,000 stored hands. | TASK-11.12#AC1, TASK-11.12#AC2, TASK-11.12#DoD1 |
| REQ-055.6 | Equity and advice computation runs off the main thread so the table stays responsive (no frame longer than 100 ms during computation). | TASK-3.6#AC1, TASK-3.6#AC2, TASK-3.6#AC3, TASK-3.6#DoD1, TASK-8.3#AC2, TASK-13.10#AC3 |
| REQ-056.1 | Invariants checked after every action: chip conservation, legal action, cap respected, pot eligibility, no card dealt twice. | DoD-global#6, TASK-1.6#AC6, TASK-1.8#AC1, TASK-1.8#AC2, TASK-1.8#AC4, TASK-6.1#AC5, TASK-1.16#AC7 |
| REQ-056.2 | A 1,000,000-hand playtest run reports zero violations. | TASK-1.17#AC1, TASK-1.17#AC2, TASK-6.9#AC1, TASK-6.9#AC3, TASK-5.10#AC1, TASK-5.10#AC2, TASK-5.10#AC3 |
| REQ-056.3 | On an unexpected error the app shows an error screen with Return Home; the session resumes from the last completed hand. | TASK-13.1#AC1, TASK-13.1#AC2, TASK-13.1#AC3, TASK-13.1#AC4, TASK-13.1#AC5 |
| REQ-057.1 | Automated axe checks report zero serious or critical violations on every screen. | DoD-global#7, TASK-1.1#AC8, TASK-12.1#DoD1, TASK-11.1#DoD1, TASK-13.11#AC1, TASK-13.11#AC2, TASK-13.11#AC3, TASK-13.11#AC4, TASK-13.11#AC5, TASK-12.3#DoD1, TASK-12.4#DoD1, TASK-12.9#DoD1 |
| REQ-057.2 | All controls are native buttons, links or form fields reachable with Tab and activated with Enter or Space while focused. | TASK-12.1#AC4, TASK-13.1#AC5, TASK-3.17#AC1, TASK-3.17#AC2, TASK-3.17#AC3, TASK-3.17#AC4, TASK-4.3#AC5, TASK-12.3#AC5 |
| REQ-057.3 | Grades always show their text label (Correct, Minor error, Major error). | TASK-9.1#AC2, TASK-9.7#AC4 |
| REQ-057.4 | Interactive targets are at least 44 × 44 CSS px. | TASK-12.1#AC4, TASK-3.17#AC5, TASK-4.3#AC5 |
| REQ-058.1 | No analytics, telemetry, tracking or third-party requests. | DoD-global#8, TASK-13.5#AC1, TASK-13.5#AC2 |
| REQ-058.2 | The app collects no personal information. | TASK-13.5#AC3 |
| REQ-058.3 | A Content-Security-Policy restricts scripts, styles and connections to the app's own origin. | TASK-13.5#AC4, TASK-13.5#AC5, TASK-13.5#AC6 |
| REQ-059.1 | TypeScript strict mode with zero type errors. | DoD-global#2, TASK-1.1#AC2, TASK-1.1#AC3 |
| REQ-059.2 | Engine, bots, advice and statistics modules import nothing from React, the DOM or IndexedDB (enforced by a lint rule). | DoD-global#5, TASK-1.1#AC4 |
| REQ-059.3 | Line coverage ≥ 90% for engine, bots, advice and statistics modules and ≥ 70% overall. | DoD-global#4, TASK-1.1#AC5 |
| REQ-059.4 | ESLint and Prettier report zero errors. | DoD-global#2, TASK-1.1#AC2, TASK-1.1#AC3 |
| REQ-060.1 | All screens work without horizontal scrolling at 1280 × 720. | TASK-3.16#AC1 |
| REQ-060.2 | The app installs from Chrome and from Safari (Add to Dock) and opens in its own window. | TASK-13.12#AC1, TASK-13.12#AC2, TASK-13.12#AC3, TASK-13.12#AC4, TASK-13.12#AC5, TASK-13.12#DoD1 |
| REQ-060.3 | Theme: charcoal backgrounds, red primary accent, navy and silver secondary colours, green felt, TLH logo on Splash and Home and as the app icon. | TASK-2.1#AC3, TASK-2.12#AC1, TASK-3.16#AC2, TASK-13.12#AC3, TASK-13.12#AC4, TASK-13.12#AC5, TASK-13.12#AC6 |
| REQ-060.4 | Text is English; money is shown as US dollars with thousands separators (e.g. $1,240). | TASK-3.19#AC1, TASK-3.19#AC2, TASK-3.19#AC3 |
| REQ-061.1 | No real-money, deposit, purchase or wagering feature exists. | TASK-12.1#DoD2, TASK-11.1#DoD2, TASK-2.15#AC1, TASK-2.15#AC2, TASK-2.15#AC3, TASK-13.11#AC6 |
| REQ-061.2 | Charts, ranges, explanations and golden spots are original text; no passages are copied from books or commercial tools. | DoD-global#9, TASK-7.2#DoD1, TASK-7.5#DoD1, TASK-6.5#DoD1, TASK-7.6#DoD1, TASK-7.10#DoD1, TASK-7.11#DoD1, TASK-10.3#DoD1, TASK-7.14#DoD1, TASK-10.5#DoD1, TASK-10.6#DoD1 |
| REQ-061.3 | The logo is the user-supplied asset in brand/tlh-logo.jpg. | TASK-2.1#AC2, TASK-2.12#AC1, TASK-13.12#AC6 |
| REQ-062.1 | Options: number of hands, seed, table size, game type, line-up preset, style checks (REQ-027.5), advice determinism check (REQ-036). | TASK-1.6#AC1, TASK-1.6#AC2, TASK-1.11#AC4, TASK-1.16#AC6, TASK-6.6#AC6, TASK-6.6#AC7, TASK-6.11#AC2, TASK-7.15#AC1, TASK-6.12#AC4 |
| REQ-062.2 | On an invariant violation it prints the replay code and action history and exits non-zero. | TASK-1.8#AC3, TASK-1.17#AC2 |
| REQ-062.3 | It reports each bot's BB/100 with 95% confidence interval and each style's VPIP, PFR and aggression. | TASK-6.10#AC1, TASK-6.10#AC2, TASK-6.10#AC4, TASK-6.11#AC1 |
| REQ-062.4 | The same seed and options produce identical output. | TASK-1.6#AC3, TASK-1.6#AC4, TASK-1.17#AC3, TASK-6.8#AC5, TASK-6.9#AC3, TASK-7.15#AC5 |
| REQ-062.5 | It plays 100,000 6-max hands in ≤ 60 minutes on the reference machine. | TASK-1.17#AC4, TASK-1.17#DoD1, TASK-6.9#AC2, TASK-6.9#DoD1 |
| REQ-063.1 | `npm test` runs Vitest unit, fast-check property and golden-spot tests. | TASK-1.1#AC1, TASK-7.11#AC2 |
| REQ-063.2 | `npm run e2e` runs Playwright tests in Chromium and WebKit. | TASK-1.1#AC7 |
| REQ-063.3 | `npm run lint` and `npm run typecheck` run ESLint/Prettier and tsc. | TASK-1.1#AC2 |
| REQ-063.4 | `npm run build` produces the deployable PWA. | TASK-1.1#AC6, TASK-13.4#AC1, TASK-13.4#AC4, TASK-13.12#AC1, TASK-13.12#AC3 |
| REQ-064.1 | The workflow runs on every push and pull request. | TASK-1.7#AC1 |
| REQ-064.2 | Any failing check fails the workflow. | DoD-global#10, TASK-1.7#AC2, TASK-1.7#AC3, TASK-1.7#AC4, TASK-1.8#AC4 |
| REQ-064.3 | Deployment to GitHub Pages happens only from main and only when all checks pass. | TASK-1.18#AC1, TASK-1.18#AC2, TASK-1.18#AC3 |
| REQ-064.4 | The workflow also runs the Playwright and accessibility tests (npm run e2e) in Chromium and WebKit. | TASK-1.7#AC1, TASK-1.7#AC4 |
| REQ-065.1 | With the network disabled after first install, every screen and feature works. | TASK-13.4#AC1, TASK-13.4#AC2, TASK-13.4#AC3, TASK-13.4#AC4 |
| REQ-065.2 | A newer version is downloaded in the background and applied on the next launch, never during a session. | TASK-13.8#AC1, TASK-13.8#AC2, TASK-13.8#AC3 |
| REQ-065.3 | After an update, Home shows "Updated to version <x>" once. | TASK-13.8#AC4, TASK-13.8#AC5, TASK-13.8#AC6 |
| REQ-066.1 | Card faces show the rank and a large suit symbol; no face-card illustrations are used. | TASK-3.5#AC1, TASK-3.5#DoD1 |
| REQ-066.2 | Rank characters are at least 24 CSS px tall at a window size of 1280 × 720. | TASK-3.5#AC2 |
| REQ-066.3 | Two-colour deck: hearts and diamonds red, spades and clubs black; four-colour deck (REQ-050.4): clubs green, diamonds blue. | TASK-3.5#AC3, TASK-3.5#AC4, TASK-3.5#DoD1 |
| REQ-066.4 | Card backs show the TLH logo. | TASK-3.5#AC5, TASK-3.5#DoD1 |
| REQ-067.1 | The felt is green with a subtle texture and the rail is dark. | TASK-4.4#AC1, TASK-4.4#AC2, TASK-4.4#AC3, TASK-4.4#DoD1 |
| REQ-067.2 | Chips use the logo colours red, navy and silver. | TASK-4.4#AC4, TASK-4.4#DoD1 |
| REQ-067.3 | The app ships no image files other than the TLH logo and icons generated from it. | TASK-4.4#AC5, TASK-4.4#AC6, TASK-4.4#AC7, TASK-13.12#AC7 |
| REQ-067.4 | Palette: felt #2F6B4F, rail #24543E, chips red #D7262E, navy #1F3A6E and silver #C9CED6; on a 200 × 100 px felt sample each colour channel's standard deviation is between 1 and 8 and no pixel differs from #2F6B4F by more than 24 on any channel. | TASK-4.4#AC1, TASK-4.4#AC2, TASK-4.4#AC3, TASK-4.4#AC4, TASK-4.4#DoD1 |
| REQ-068.1 | Each seat with chips put in on the current street shows a chip stack and the amount. | TASK-4.5#AC1, TASK-4.5#AC2 |
| REQ-068.2 | When the street ends, the stacks move into the pot and the pot amount updates. | TASK-4.5#AC3, TASK-4.5#AC4 |
| REQ-068.3 | When the hand ends, the pot moves to each winner's seat with the amount won. | TASK-4.5#AC4, TASK-4.5#AC5, TASK-4.5#AC6, TASK-4.5#AC7 |
| REQ-069.1 | Animated events: dealing cards, bet chips to the pot, pot to the winner. | TASK-4.6#AC1 |
| REQ-069.2 | Each animation lasts ≤ 250 ms at Rapid and ≤ 600 ms at Realistic. | TASK-4.6#AC2, TASK-4.6#AC3, TASK-4.6#AC4 |
| REQ-069.3 | With reduce-motion on, changes appear without animation. | TASK-4.6#AC5 |
| REQ-069.4 | Animations never delay the user's action bar becoming enabled by more than the animation's own duration. | TASK-4.6#AC6, TASK-4.6#AC7 |
| REQ-070.1 | The badge shows the first two letters of the bot's name. | TASK-4.7#AC1, TASK-4.7#AC2 |
| REQ-070.2 | Badge text meets 4.5:1 contrast against the badge colour. | TASK-4.7#AC3 |
| REQ-070.3 | A replacement bot (REQ-007.5) shows its own initials. | TASK-4.7#AC4 |
| REQ-071.1 | Trigger events: winning a pot of 10 big bets or more, losing at showdown, being raised, a new player sitting down. | TASK-4.2#AC1, TASK-4.2#AC2, TASK-4.2#AC3 |
| REQ-071.2 | Each style has its own authored set of at least 10 lines; lines are original and never insult the user. | TASK-4.2#AC4, TASK-4.2#AC5, TASK-4.2#DoD1 |
| REQ-071.3 | A bubble shows for 3 seconds (1.5 seconds at Rapid) and never covers the action bar or the user's cards. | TASK-4.2#AC6, TASK-4.2#AC7 |
| REQ-071.4 | Each bot speaks at most once per 10 hands. | TASK-4.8#AC1, TASK-4.8#AC2 |
| REQ-071.5 | Settings has a "Bot banter" toggle, default on. | TASK-12.8#AC1, TASK-12.8#AC2, TASK-12.8#AC3, TASK-12.8#AC4 |
| REQ-071.6 | Banter never reveals hidden cards or the bot's strategy. | TASK-4.8#AC3, TASK-4.8#AC4 |
| REQ-071.7 | When a new bot sits down, the new bot is the one that speaks. | TASK-4.2#AC1, TASK-4.2#AC8 |
| REQ-072.1 | Elapsed time counts only time spent at the table, excluding time while the session was paused. | TASK-4.9#AC1, TASK-4.9#AC2, TASK-4.9#AC3, TASK-4.9#AC6 |
| REQ-072.2 | Hands per hour = hands completed ÷ elapsed hours, shown once 10 hands are complete. | TASK-4.9#AC4, TASK-4.9#AC5, TASK-4.9#AC6 |
| REQ-072.3 | The Session Report shows the session's total playing time and hands per hour. | TASK-10.11#AC1, TASK-10.11#AC2, TASK-10.11#AC3 |
