# Vision: Limit Hold'em Trainer

Status: APPROVED by user on 2026-11-17
Dream slug: limit-holdem-trainer

## 0. Vision statement (proposed by Claude at the user's request; approved with the vision)

**Purpose.** Limit Hold'em Trainer is a private practice table for one player who knows the rules but not yet the strategy. You play realistic fixed-limit Texas Hold'em against a table of distinct opponents. After every hand you see, plainly and with the numbers, which of your decisions were good, which cost you, and what to do instead. Over weeks it shows whether your mistakes are shrinking, your results are improving and your style is moving toward sound play, so you're ready for a real casino limit game.

**What it looks like (roughly).** It's an app in its own window from your Mac's Dock, with a short branded splash and then a simple Home screen: *New game*, *Resume*, *Statistics*, *Settings*. Game Config is one compact form: table size, cash or sit-and-go, stakes, who's at the table, speed. The Table is the heart of it: an oval felt table seen from above, with seats around the rail showing each opponent's name, style and stack. Your hole cards and stack sit at the bottom centre, the board and pot in the middle, a clear action bar (Fold / Check-Call / Bet-Raise, with the exact amount on the button) along the bottom, and a *Hint* button beside it. When a hand ends, a review panel slides in from the side, listing each of your decisions with a coloured grade (Correct / Minor error / Major error), the recommended action, equity vs pot odds and a two-sentence reason. Dismiss it, or just deal the next hand. The Session Report and Statistics screens are clean dashboards: your style stats against healthy ranges, your biggest leaks, and trend lines over time. The look is calm and modern rather than casino-flashy: readable cards, restrained colour, and motion only where it helps you follow the action.

**Key principles.**
1. **Trust before cleverness.** Advice is consistent, explainable and always shows its numbers. If the trainer can't justify a recommendation, it doesn't make one. Uncertain or approximate advice is labelled as such.
2. **Teach, don't just grade.** Every judgement explains the concept behind it in plain language, at the level of someone new to strategy.
3. **Reps matter.** Play is fast by default (200+ hands an hour). Feedback is there when you want it and never blocks the next hand.
4. **Real game, real rules.** Fixed-limit conventions as played in casinos (blinds, bet + 3 raises cap, side pots, showdown order), and opponents whose styles you'd recognise at a real table.
5. **Honest measurement.** Progress is judged by objective numbers (mistakes per 100 hands, big bets won per 100, style stats), not by feel.
6. **Private and self-contained.** One user, no account, no server, works offline; your data never leaves your machine.
7. **Simple to build and prove.** One language, a pure rules engine, and everything except the visuals testable headlessly with seeded, replayable games.

## 1. Problem and purpose
- The problem, in the user's words: "I want to build a Texas Limit Hold Em training application so I can practice playing real Texas Limit Hold Em and get advice on my play style."
- Why it matters / why now: The user knows the rules but has little strategy (Q-9). Learning from live play is slow, expensive and gives no feedback on *why* a hand was lost.
- What happens today without this product: Playing without structured feedback; no way to see which decisions cost money or which tendencies are leaks.

## 2. Goals (measurable business/user outcomes)
G-2..G-4 targets were proposed by Claude and approved by the user with the vision (G1, 2026-11-17).
- G-1: **Trustworthy advice** — measured by: the same game situation always produces the same recommendation, and 100% of a curated set of "golden spots" (situations with agreed correct answers) pass in the automated test suite.
- G-2: **Fewer mistakes** — measured by major errors per 100 hands; the rate in hands 4,001–5,000 is at most half the rate in the first 1,000 hands played.
- G-3: **Better results** — measured by big bets won per 100 hands (BB/100) against the same bot line-up; trending upward across sessions and positive against the standard mixed line-up after 5,000 hands.
- G-4: **Healthier play style** — measured by the user's style stats (VPIP, PFR, aggression, went-to-showdown, …) for the table size; at least 4 of 5 tracked stats inside the healthy range shown by the app.
- G-5: **Fast practice** — measured by hands per hour; at Rapid speed, at least 200 hands/hour is achievable (Q-15).

## 3. Stakeholders and user classes
| User class | Description | Goals | Skill level | Frequency of use | Priority |
|---|---|---|---|---|---|
| Learner (the user) | Single user on their own Mac, no account (Q-5) | Practise realistic LHE, understand mistakes, fix leaks | Knows rules, little strategy (Q-9) | Regular practice sessions | Primary |
| Builder agents | Claude Code agents implementing stories via /doit | Pure, seeded, testable engine; clear specs | — | Throughout development | Secondary |

## 4. Core experience
- The "magic moment" (Q-21): right after losing a hand, the user sees a clear breakdown of the decision that cost them, what they should have done, and why — with the numbers.
- Top user activities in journey order (story-map backbone):
  1. **Launch & set up a session** — open the installed app; choose table size (2–10), cash game or sit-and-go, stakes, bot line-up and speed.
  2. **Play hands** — deal, act (fold/check/call/bet/raise) under fixed-limit rules, bots act, showdown and pot award.
  3. **Ask for a hint** — during a hand, request "what should I do?" and get the recommendation with reasoning.
  4. **Review the hand just played** — each of the user's decisions graded Correct / Minor error / Major error with recommended action, equity vs pot odds and a plain-English reason (Q-19).
  5. **Review the session play-style report** — style stats vs healthy ranges, biggest leaks with evidence.
  6. **Track progress over time** — mistake rate, BB/100 and style stats trended across sessions.

### 4a. Screen inventory and flow (Q-22..Q-25)
Detailed storyboards for each screen are produced in Stage 2 as a visual low-fidelity mockups page plus text specs in requirements.md.

```
 Launch ──► Splash ──► Home ──┬─► Game Config ──► Table ◄──► Hand Review panel (after each hand)
                              │                     │  └──► Hint (on request)
                              │                     └──► Session Report (on leave / SNG finish)
                              ├─► Resume session ─────► Table
                              ├─► Statistics / Progress
                              └─► Settings
```

| # | Screen | Purpose |
|---|---|---|
| 1 | Splash | App name/branding while the engine and charts load |
| 2 | Home (Game Start) | New session, resume session, statistics, settings |
| 3 | Game Config | Table size (2–10), cash or SNG, stakes, bot line-up, speed, user's seat |
| 4 | Table | Seats, cards, pot, action buttons, hint button, action log |
| 5 | Hand Review panel | Slides in beside the table after each hand (dismissable): decisions graded with numbers and reasons |
| 6 | Session Report | Style stats vs healthy ranges, top leaks, results; SNG finishing position |
| 7 | Statistics / Progress | Trends across sessions: mistakes/100, BB/100, style stats |
| 8 | Settings | Speed, display options, reset all data |

## 5. Scope
- In scope (first release):
  - Fixed-limit Texas Hold'em engine: 2–10 seats, blinds, small bet/big bet, cap = bet + 3 raises on every street including heads-up (Q-20), side pots, split pots, showdown.
  - Cash games and basic sit-and-go tournaments (rising limits, elimination) (Q-11, Q-14).
  - Bot opponents with distinct styles (e.g. tight-aggressive, loose-passive "calling station", maniac, rock) (Q-12).
  - Advice engine based on preflop charts by position + postflop equity/pot-odds math, with plain-English, concept-teaching explanations (Q-7, Q-9). Tuned for heads-up, 6-max and full ring; other sizes use the nearest and are flagged "approximate" (Q-10). Tournament advice is cash-style plus a short-stack note.
  - Hint on request, post-hand review with severity grading, session play-style report, progress over time (Q-8).
  - Speed setting: fast by default, optional realistic bot delays (Q-15).
  - Installable offline PWA; all data stored locally in the browser (Q-2).
  - Headless playtest harness (bot-vs-bot, seeded, invariant-checking, win-rate and advice-consistency reporting) (Q-3).
- Later releases:
  - Tournament strategy in advice (ICM, bubble play) (Q-14).
  - Drills / quiz mode, including drills built from the user's own mistakes (Q-18).
- Explicitly NOT in scope:
  - Real-money play, online multiplayer, accounts/login, backend server.
  - Solver-grade (GTO) strategy (Q-7).
  - Interrupting live warnings during play (Q-8).
  - Measuring subjective confidence (Q-16).
  - No-limit / pot-limit or other poker variants.
- Waiting room (good ideas parked):
  - Hand-history export in a standard text format; JSON backup/restore (Q-17).
  - "Replay this hand with a different decision".
  - Estimated cost-in-bets per mistake (Q-19 alternative).
  - Uncapped raising heads-up as a table option (Q-20 alternative).
  - Hand History browser — browse and re-open past hands for review (Q-24).
  - Learn / Glossary screens — concept pages the advice links to (Q-24); in v1 advice explanations are self-contained.

## 6. Platform and form
- Browser-based Progressive Web App installable from Chrome or Safari on macOS, opening in its own window; works offline; single user; no accounts; no server — engine, bots, advice and UI all run in the browser (Q-2, Q-5).

## 7. Constraints
- Technology: TypeScript only — no second language (Q-1). Strict TS, Vite + vite-plugin-pwa, React, Vitest, fast-check, headless playtest CLI on Node via tsx, Playwright once the UI exists, ESLint + Prettier (Q-3, Q-4). Engine and advice code have no UI dependencies so they run headlessly.
- Persistence: browser storage only (IndexedDB); no export/backup in v1 (Q-17).
- Legal/licensing: no real money. Preflop charts and strategy content must be authored for this project, not copied from copyrighted books or commercial tools.
- Budget/timeline: none stated.

## 8. Glossary seeds
| Term | Meaning |
|---|---|
| Fixed limit | Betting in fixed increments: small bet on preflop/flop, big bet (2×) on turn/river |
| Cap | Maximum bets per street: one bet + three raises |
| Street | Betting round: preflop, flop, turn, river |
| BB/100 | Big bets won per 100 hands (limit win-rate unit) |
| VPIP | % of hands where the player voluntarily put money in preflop |
| PFR | % of hands where the player raised preflop |
| Aggression | Ratio of bets/raises to calls |
| Equity | Share of the pot a hand wins on average against the opponents' likely hands |
| Pot odds | Price of a call relative to the pot after calling |
| Golden spot | A curated game situation with an agreed correct action, used to test the advice engine |
| Approximate advice | Advice for a table size without its own tuned charts, mapped from the nearest tuned size |
| SNG | Sit-and-go: single-table tournament with rising limits, ends when one player has all chips |
| Bot style | TAG (tight-aggressive), calling station (loose-passive), maniac (loose-aggressive), rock (very tight) |

## 9. Assumptions (falsifiable)
| ID | Assumption | Impact if wrong | Owner |
|---|---|---|---|
| A-1 | Chart + equity rules give advice good enough to improve a beginner | Advice misleads; core value lost | Claude (validate via golden spots + playtests) |
| A-2 | Style-parameterised bots built on the same rules feel realistic and aren't trivially exploitable | Winning vs bots means little (G-3) | Claude |
| A-3 | Equity simulation in the browser (in a Web Worker) is fast enough for a hint in under ~1 s and doesn't slow play | Hints/review feel sluggish | Claude |
| A-4 | Browser storage is durable enough for months of history | Progress lost (accepted risk, Q-17) | User |
| A-5 | Nearest-size mapping is acceptable for 3–5 and 7–8 players | Poor advice at those sizes | User |

## 10. Risks and open questions
| ID | Risk / question | Mitigation / next step |
|---|---|---|
| R-1 | Advice inconsistent or wrong → user stops trusting it | Golden-spot test suite; harness checks advice determinism; every recommendation shows its numbers |
| R-2 | Postflop equity must be computed against the opponents' *likely* hands (ranges inferred from their actions), not random hands; range modelling is the hardest part | Define a simple, documented range model per bot style/action; test it explicitly |
| R-3 | Scope (2–10 seats, cash + SNG, 3 advice modes) overruns | Walking skeleton first (heads-up/6-max cash, play + review), then widen |
| R-4 | Browser data clear wipes history (no backup in v1) | Accepted by user; request persistent storage; backup in waiting room |
| R-5 | Bots exploitable in one obvious way | Headless bot-vs-bot tournaments; style randomisation |

## 11. Needs vs. proposed solutions
| The user proposed… | The underlying need is… |
|---|---|
| "Decide on a programming language first" | A stack that is one language, testable headlessly and suited to a visual table |
| "Headless playtest harness" | Confidence that rules, bots and advice are correct without clicking through hands |
| "Advice on my play style" | Learn *why* decisions are wrong and which tendencies cost money |
| "Practice real Texas Limit Hold'em" | Realistic rules and conventions, realistic opponents |

## Divergent explorations performed
- **Pre-mortem** → advice trust/consistency (G-1, R-1), exploitable bots (R-5), tedious pace (G-5, Q-15), data loss (R-4), scope overrun (R-3).
- **Stakeholder round table** → future casino player wants real conventions (cap rule Q-20); a coach/study partner wants standard hand-history export (parked, Q-17); building agents need a pure, seeded, UI-free engine (Q-3).
- **Needs vs. solutions laddering** → range modelling surfaced as the real difficulty behind "advice" (R-2).

> Editorial note (2026-11-17): grade and speed labels updated to Correct / Minor error / Major error and Rapid / Realistic per Q-42.
