# Q&A log — Limit Hold'em Trainer

## Q-1 — Platform/stack — Implementation language
- Asked: Which language? Options discussed: TypeScript (recommended for browser UI), Python, Rust, Java 21 (user raised; installed with Maven + Gradle).
- Answer (user, verbatim): "I'd rather not have the complexity of two languages. If TypeScript is the best solution, let's go with that."
- Decision: TypeScript, single language for engine, bots, advice, UI and headless harness. Constraint: no second language.

## Q-2 — Platform — Launch mode
- Options: Installable app/PWA (Recommended) | Localhost URL only | Desktop wrapper (Electron/Tauri).
- Answer: Installable app (PWA) — runs entirely in the browser, own window from the Dock, works offline; no backend server.

## Q-3 — Platform/stack — Toolchain
- Proposed: TypeScript strict, Vite + vite-plugin-pwa, Vitest, fast-check, headless playtest CLI on Node via tsx (seeded, invariant-checking, bot win-rate reporting), Playwright once UI exists, ESLint + Prettier. Engine/advice code has no UI imports.
- Answer: Approve stack (Recommended).

## Q-4 — Platform/stack — UI framework
- Options: React (Recommended) | Svelte | No framework.
- Answer: React.

## Q-5 — User classes — Who uses it
- Options: Just me (Recommended) | Me + a few friends | Public product eventually.
- Answer: Just me — single user, no accounts/login.

## Q-6 — Core experience — Table format
- Options: 6-max (Recommended) | Full ring | Heads-up | Configurable 2–10.
- Answer: Configurable 2–10. (Follow-up Q-10 on how much advice coverage per size in v1.)

## Q-7 — Trainer — Advice source of truth
- Options: Rules + equity math (Recommended) | Solver-grade strategy | Stats/leak tracking only | Rules + equity plus stats.
- Answer: Rules + equity math — published-style preflop charts by position + pot-odds/equity simulation postflop, with plain-English reasons. Solver-grade is out of v1.

## Q-8 — Trainer — Advice timing (multi-select)
- Answer: After each hand (hand review) + Live hint on request + Session/play-style report. NOT chosen: live interrupting warnings.

## Q-9 — User classes — Skill level
- Answer: "Know the rules, little strategy" — advice must teach concepts (pot odds, position, etc.) in plain language.

## Q-10 — Trainer — Advice coverage across table sizes
- Context: Claude pushed back that tuned advice per size ~triples strategy work.
- Options: 3 tuned sizes + nearest (Recommended) | 6-max only tuned first | Every size tuned.
- Answer: 3 tuned sizes (heads-up, 6-max, full ring); other sizes use nearest chart, flagged approximate.

## Q-11 — Core experience — Game type
- Options: Cash (Recommended) | Tournament (sit-and-go) | Both.
- Answer: Both. (Follow-up Q-14 on tournament depth.)

## Q-12 — Opponents — Bot line-up
- Answer: Mix of player types (TAG, calling station, maniac, rock...) so the user learns to adjust.

## Q-13 — Goals — Success measures (multi-select)
- Answer: all four — fewer flagged mistakes per 100 hands; win rate (BB/100) vs same line-up improves; style stats move into healthy ranges; subjective real-game confidence. (Follow-up: ladder down to numbers.)

## Q-14 — Scope — Tournament depth
- Answer: Basic sit-and-go (rising limits, elimination) with cash-style advice + short-stack note. ICM/bubble strategy → later release.

## Q-15 — Core experience — Pace
- Answer: Fast by default (target 200+ hands/hour) with an optional "realistic" bot-delay setting.

## Q-16 — Goals — Measuring real-game confidence
- Answer: Don't measure it. Confidence stays an informal goal; only objective stats are tracked.

## Q-17 — Data — Export / backup
- Options: Standard hand-history export + JSON backup (Recommended) | Backup only | Neither for now.
- Answer: Neither for now. Data lives in browser storage only. Risk (browser data clear = history loss) recorded as accepted; export/backup parked in waiting room.

## Q-18 — Scope — Drills/quiz mode
- Answer: Later release (reuses advice engine). Not in v1.

## Q-19 — Trainer — Post-hand grading
- Answer: Severity levels — Good / Minor error / Major error, each with recommended action, numbers (equity vs pot odds) and a short reason.

## Q-20 — Rules — Betting cap
- Answer: Bet + 3 raises (4 bets) per street, always, including heads-up.

## Q-21 — Core experience — Magic moment
- Answer: "Seeing why I lost a hand" — immediately after a hand, a clear breakdown of the costly decision and what to do instead.

## Q-22 — Interfaces — Storyboarding (raised by user)
- User (verbatim): "Before I give the go ahead to move forward, we have a lot of other work, don't we?  I think we need to storyboard: Splash Page, Game Start Page, Game Config Page, Table, statistics page, etc."
- Claude proposed a 10-screen inventory + navigation flow for the vision; detailed storyboards per screen in Stage 2.

## Q-23 — Interfaces — Post-hand review placement
- Answer: Panel beside the table (slides in after each hand, dismissable).

## Q-24 — Scope — Optional screens in v1 (multi-select: Hand History, Learn/Glossary, Settings, Splash)
- Answer: Settings and Splash in v1. Hand History browser and Learn/Glossary NOT selected → waiting room. Advice explanations must be self-contained (no glossary pages to link to); past hands are not browsable in v1.

## Q-25 — Interfaces — Storyboard format and timing
- Format: Visual low-fidelity mockups page (shareable web page) + text specs in requirements.
- Timing: Screen inventory + flow in the vision now; detailed storyboard per screen during Stage 2.

## Q-26 — G1 — Vision approval
- User asked for a vision statement (purpose, rough look, key principles); Claude added §0 to vision.md.
- Answer (verbatim): "Vision Approved" — includes §0 statement, §4a screen inventory, and G-2/G-3/G-4 targets.

## Q-27 — Branding — App name and logo (user-supplied)
- User provided logo image (saved as dreams/limit-holdem-trainer/brand/tlh-logo.jpg, from ~/Downloads/IMG_1001.JPG).
- Decision: app name is "TLH Trainer" (logo wordmark: "TLH TRAINER — TEXAS LIMIT HOLD 'EM"). Logo palette: black, red, navy blue, silver/white; Texas flag silhouette, A♠ K♥, poker chips.

## Q-28 — Look & feel — App theme
- Context: logo is bold casino-sport style; vision §0 said "calm and modern rather than casino-flashy".
- Options: Branded dark theme (Recommended) | Logo only, calm light UI | Full casino style.
- Answer: Branded dark theme — charcoal/black screens, red primary accent, navy/silver secondary, logo on Splash and Home; table stays readable and uncluttered.

## Q-29 — Look & feel — Felt colour
- Answer: Classic green felt.

## Q-30 — Table — Hint content
- Answer: Answer + reason — recommended action, the numbers (equity, pot odds) and a short plain-English reason, shown immediately.

## Q-31 — Table — Opponent style labels
- Answer: Shown by default; a Settings toggle hides them.

## Q-32 — Hand Review — When the panel opens
- Answer: Automatically after every hand in which the user made a decision beyond folding preflop; dismissable; a Settings toggle turns auto-open off.

## Q-33 — Hand Review — Mucked opponent cards
- Answer: No — realistic. Only cards shown at showdown are revealed in the review.

## Q-34 — Game Config — Stakes
- Options: Fixed list $2/$4, $4/$8, $10/$20, $20/$40 (Recommended) | Custom | One level.
- Answer (verbatim): "Fixed List, add $3/$6 and $6/$12" → $2/$4, $3/$6, $4/$8, $6/$12, $10/$20, $20/$40. Play money only.

## Q-35 — Game Config — Cash buy-in / rebuy
- Answer: Fixed buy-in, manual rebuy (when busted, choose to rebuy or leave). (Follow-up Q-38: buy-in size; bot rebuys.)

## Q-36 — Game Config — Sit-and-go structure
- Answer: One standard structure (fixed starting chips, limits rise on a published schedule).

## Q-37 — Game Config — Opponent set-up
- Answer: Preset line-ups (e.g. Mixed, Tough, Soft) with optional per-seat style edit.

## Q-38 — Game Config — Cash buy-in size
- Answer: 20 big bets (e.g. $160 at $4/$8).

## Q-39 — Rules — Blinds per stake
- Answer: SB = half the small bet (rounded down), BB = the small bet: $2/$4→$1/$2, $3/$6→$1/$3, $4/$8→$2/$4, $6/$12→$3/$6, $10/$20→$5/$10, $20/$40→$10/$20.

## Q-40 — Opponents — Bot busts in cash game
- Answer: Replaced by a new bot of a random style drawn from the line-up preset.

## Q-41 — SNG — Payout
- Answer: Finishing place only (no prize money); finishing position tracked over time.

## Q-42 — Naming — Grade and speed labels (lint conflict with banned words)
- Grades: "Correct / Minor error / Major error" (replaces Good / Minor / Major).
- Speeds: "Rapid / Realistic" (replaces Fast / Realistic).

## Q-43 — Area 1 confirmation (Set up a session)
- User asked whether they would have to write the stories; Claude clarified: Claude writes requirements, agents write stories automatically after G2; user only confirms.
- Answer: "Confirm all" — REQ-001..REQ-012 Confirmed, including Claude-proposed details (size mapping, SNG structure, presets, speed timings, pause/resume rules).

## Q-44 — Rules — Button movement when players bust
- Answer: Simplified moving button — button moves to the next player still holding chips; next two such players post blinds.

## Q-45 — Table — Folding when check is free
- Answer: Fold is not offered when Check is free.

## Q-46 — Table — Keyboard shortcuts
- Answer: No — mouse only (no shortcut keys). Standard Tab/Enter focus behaviour of real buttons remains.

## Q-47 — Table/Review — Hand number and replay code
- Answer: Yes — the review shows the hand number and a replay code (the hand's random seed) in small text, revealed only after the hand ends.

## Q-48 — Area 2 confirmation (Play hands)
- Answer: "Confirm all" — REQ-013..REQ-025 Confirmed, including Claude-proposed details (half-bet all-in reopen rule, odd chip, action log, 1.5 s auto-deal, no-hidden-information rule).

## Q-49 — Opponents — Adaptive bots
- Answer: Fixed styles in v1; adaptive bots → waiting room.

## Q-50 — Opponents — Observed opponent stats (HUD)
- Answer: Shown on hover/tap of a seat (VPIP/PFR/aggression with hands observed).

## Q-51 — Opponents — TAG strength
- Answer: Solid winner vs weak styles — over 100,000 harness hands TAG wins against stations, maniacs and rocks.

## Q-52 — Area 3 confirmation (Opponents)
- Answer: "Confirm all" — REQ-026..REQ-031 Confirmed incl. style bands and TAG strength targets.

## Q-53 — Advice — Strategy content source and validation
- Answer: Claude authors charts, healthy ranges and golden spots from established limit theory, each with written justification; only clear-cut spots become golden tests; equity math checked against known exact values.

## Q-54 — Advice — Minor vs Major
- Answer: By margin; close calls are never Major; spots with two reasonable actions grade either as Correct.

## Q-55 — Advice — Opponent model inputs
- Answer: Opponent's actions + observed session stats (after ~30 hands); never the bot's hidden parameters or style label.

## Q-56 — Advice — Hinted decisions
- Answer: Graded and marked 'hinted'; excluded from the G-2 mistake-rate measure; report shows hint usage.

## Q-57 — Area 4 confirmation (Advice engine)
- Answer: "Confirm all" — REQ-032..REQ-041 Confirmed (charts, postflop rules, ±1.5 pp equity, 30-hand opponent model, ≤3-sentence explanations, grading thresholds 10/15 pp, ≥200 golden spots, hinted tagging, approximate/short-stack labels).

## Q-58 — Report — G-4 tracked stats
- Answer: VPIP, PFR, Aggression, WTSD (went to showdown), W$SD (won money at showdown).

## Q-59 — Report — Leak rule
- Answer: A decision category is a leak when faced ≥ 8 times in the session and ≥ 40% graded errors; top 3 shown, Major errors first.

## Q-60 — Statistics — Trend grouping
- Answer: Per 500 hands by default, switchable to per session / per day; filters by table size and game type.

## Q-61 — Settings — Display options (multi-select)
- Answer: Four-colour deck option. NOT selected: amounts in big bets (amounts always $ in cash games). Show/hide opponent styles (Q-31) and auto-open review (Q-32) included regardless.

## Q-62 — Areas 5–8 confirmation (Hint & Review, Session Report, Statistics, Settings)
- Answer: "Confirm all" — REQ-042..REQ-051 Confirmed.

## Q-63 — Compatibility — Devices
- Answer: Mac desktop browsers — latest Chrome and Safari on macOS, windows 1280×720 and larger. iPad/phone out of scope.

## Q-64 — Operations — Hosting
- Answer: Free static HTTPS host, e.g. GitHub Pages; updates arrive automatically at next launch. (Note: free GitHub Pages implies a public repository; user data never leaves the device.)

## Q-65 — Operations — Version control and CI
- Answer: Git + GitHub + GitHub Actions CI on every push (lint, typecheck, tests, golden spots, short playtest).

## Q-66 — Cross-cutting confirmation (Data, NFR, Operations, DoD, priorities)
- Answer: "Confirm all" — REQ-052..REQ-065 Confirmed; Definition of Done accepted; REQ-011 and REQ-065 moved Must → Should (Must ratio 60%).

## Q-67 — Self-review fixes (tester / developer / user pass)
- Answer: accept all three — REQ-007.6 & REQ-008.9 (bust while review open → Continue / See results), REQ-050.7 (Settings overlay from Table, no pause), REQ-048.8 + REQ-009.6 (line-up filter incl. Custom).

## Q-68 — Look & feel — Card faces (raised by user: 'Do you need artwork for the cards? The tabletop? Have you considered sound?')
- Answer: Clean big-index SVG cards drawn in code (large rank + suit, no face-card illustrations); card back shows the TLH logo.

## Q-69 — Look & feel — Table art
- Answer: Drawn in code (SVG/CSS): green felt with subtle texture, dark rail, chip stacks in logo colours (red/navy/silver), dealer button.

## Q-70 — Sound
- Answer (verbatim): "We'll do this in phase 2" → sound is a later release (not v1).

## Q-71 — Animation
- Answer: Short, speed-aware animations (deal, chips to pot, pot to winner) ≤ 250 ms each at Rapid, longer at Realistic; honour reduce-motion.

## Q-72 — Look & feel — Bot avatars
- Answer: Initials badge coloured by seat, drawn in code.

## Q-73 — Onboarding
- Answer: Nothing — no tour or help page; first-use message on Home only.

## Q-74 — Additional features (closer: 'Anything else?')
- Answer: (1) chip stacks in front of each player for their current bet, moving to the pot; (2) table chat / bot banter (flavour); (3) session elapsed time and hands/hour in the Table header.

## Q-75 — Area 11 confirmation (Presentation)
- Answer: "Confirm all" — REQ-066..REQ-072 Confirmed (banter default on).

## Q-76 — G2 — Baseline approval
- Answer: "Approve baseline v1.0" (72 requirements, 315 clauses).

## Q-77..Q-79 — Weaver (E07) requirement questions
- Q-77 Facing a 4th bet preflop: use the facing-re-raise chart; capped raise → call (REQ-032.6).
- Q-78 Raise-vs-fold deviations: graded by the call/fold margin of REQ-038.3 (REQ-038.6).
- Q-79 Bot aggression bands: postflop-only, same as REQ-045.3 (REQ-027.6).
- Baseline bumped to v1.1.

## Q-80..Q-82 — Weaver (E06) requirement questions
- Q-80 Heads-up Tough preset: one TAG bot (REQ-009.7).
- Q-81 Custom line-up bot replacement: any of the four styles (REQ-007.7) — user chose this over the recommended 'styles at the table'.
- Q-82 Bots never use observed stats; typical-player basis only (REQ-029.2).
- Baseline bumped to v1.2.

## Q-83 — Weaver (E03) — Leave table mid-hand
- Answer: confirm dialog, then auto-fold, the hand completes and is recorded, then the session ends (REQ-004.7). Baseline v1.3.

## Q-84..Q-91 — Weaver (wave 5: E02, E08, E09, E10) requirement questions
- Q-84 Position groups: button+cutoff late; next two middle; rest early; SB/BB blinds; heads-up button late, other blinds. Add preflop 'fold' categories (REQ-047.6, 047.7).
- Q-85 Leak threshold counts unhinted decisions only (REQ-047.8).
- Q-86 Leave mid-hand forced fold: immediate, not graded/counted (REQ-004.8).
- Q-87 Empty-state wording accepted: no-leak text, "Top leak: none", "not enough data" (REQ-003.4, 044.9, 044.10).
- Q-88 Preflop hints/review show chart basis, not equity numbers (REQ-042.6, 043.9).
- Q-89 Table header Home control pauses the session (REQ-004.9).
- Q-90 Game Config speed always from Settings default (REQ-012.3; REQ-012.1 edited to drop speed).
- Q-91 Review panel: after Close wait for Deal next hand; badge "All correct", disappears on next deal, none after preflop fold (REQ-043.10, 043.11).
- Baseline v1.4.

## Q-92..Q-96 — Weaver (wave 6: E05, E11, E12) requirement questions
- Q-92 Settings overlay at the table freezes play (REQ-050.8).
- Q-93 SNG on Home: Resume shows level; snapshot shows finishing position (REQ-002.6, 003.5).
- Q-94 Leave table in SNG with chips → finishing position as if busted now (REQ-008.10).
- Q-95 Winning the SNG with review open → See results (REQ-008.11).
- Q-96 Defaults accepted: "Level 10 (final)"; G-2 baseline over first 1,000 hands, filter-independent; per-session/day empty state; hand completion timestamp (REQ-008.12, 048.9, 048.10, 052.7).
- Baseline v1.5.

## Q-97..Q-104 — Judge round 1 user-owned findings
- Q-97 BB option preflop unraised: Check or Raise, no Fold (REQ-017.6).
- Q-98 Short all-in: "Bet all-in $X" / "Raise all-in to $X"; REQ-016.5 governs reopening (REQ-017.7).
- Q-99 Milestones: accept SNG-specific parts of Must requirements in Release 1 with sit-and-go; move Rapid pace (REQ-011.1) into the MVP so G-5 is testable early.
- Q-100 G-3 measured by the Statistics chart (break-even line + line-up filter); no extra verdict.
- Q-101 Call-then-fold preflop opens the review (REQ-043.12).
- Q-102 Healthy-range limits inclusive (REQ-044.11).
- Q-103 Preset cycles over bot seats from first bot clockwise of user; Tough's Maniac there; new bot speaks on sitting down (REQ-009.8, 071.7).
- Q-104 Statistics wording reconciled (REQ-048.3, 048.7, 049.4 reworded; REQ-048.11, 048.12 added).
- Vision editorial: grade/speed labels updated per Q-42. Baseline v1.6.

## Q-105..Q-112 — Revision-round (round 1 → 2) user questions
- Q-105 Showdown pot by pot, side pots first (REQ-019.8).
- Q-106 Multiple odd chips one each clockwise from the button (REQ-019.9).
- Q-107 Limp/SB complete = call; BB check no leak category (REQ-047.9).
- Q-108 Advice range model accepted: Strong/Pair/Draw/Air narrowing; calling range includes raising hands; scaling formula full at 100 hands (REQ-033.6, 035.5, 035.6).
- Q-109 Badge after call-then-fold preflop; SNG report 1.5 s after result when panel closed (REQ-043.13, 008.13).
- Q-110 Table palette approved incl. navy #1F3A6E and texture thresholds (REQ-067.4).
- Q-111 CI runs npm run e2e (REQ-064.4).
- Q-112 G-5 automated 200-hands-in-60-min run; cash-hands message; singular wording (REQ-024.6, 048.13, 048.14).
- Baseline v1.7.

## Q-113 — Judge round 2 — Heads-up Tough replacement
- Answer: TAG again; replacements drawn from the preset's styles at the current table size (REQ-007.8). Baseline v1.8.

## Q-114 — Implied-odds allowance
- Answer: one big bet per opponent still in the hand (REQ-033.7). Baseline v1.9.
