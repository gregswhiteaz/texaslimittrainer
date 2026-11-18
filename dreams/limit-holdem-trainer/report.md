# Dream report: Limit Hold'em Trainer (app name: TLH Trainer)
2026-11-17 · Requirements baseline v1.9, approved 2026-11-17 (v1.0 approved at G2; v1.1 to v1.9 each approved by the user through Q-77 to Q-114) · Final judge verdict: **FAIL after 3 full rounds** (round 3: 0 CRITICAL, 2 HIGH). The user then chose to apply the 2 fixes and finish. A targeted round 4 re-judged E01 and E03 only. It has no verdict file, so the last formal verdict is still FAIL.

## The dream in one paragraph

The seed was: "I wnt to build a Texas Limit Hold Em training application so I can practice playing real Texas Limit Hold Em and get advice on my play style. First thing's first, we'll need to decide on a programming language, then the test harness and headless playtest harness." It became **TLH Trainer**, a private PWA for one player that runs offline on a Mac, built in TypeScript only (React, Vite, Vitest, fast-check, Playwright, tsx headless CLI). The user plays realistic fixed-limit Hold'em at 2 to 10 seats, in cash games or a basic sit-and-go, against bots with four distinct styles (TAG, Calling station, Maniac, Rock). A rules-based advice engine uses preflop charts plus equity and pot-odds math. It gives hints on request, grades every decision after each hand (Correct / Minor error / Major error, with numbers and a plain-English reason), produces a session play-style report with leaks, and shows progress trends over time. The "magic moment" is seeing, right after a hand, why it was lost (Q-21). The plan is 72 confirmed requirements (367 clauses), woven into 13 epics, 3 milestones and 165 stories with 827 acceptance criteria. All of it is live in Backlog.md, and every clause is traced to at least one acceptance criterion.

## At a glance

| Item | Count |
|---|---|
| Goals | 5 (G-1 Trustworthy advice, G-2 Fewer mistakes, G-3 Better results, G-4 Healthier play style, G-5 Practice volume) |
| Requirements | 72, all Confirmed: Must 40, Should 27, Could 5 |
| Active clauses | 367 (315 at v1.0, then +52 through v1.1 to v1.9) |
| Coverage gates | 15 of 15 Clear (backup and telemetry N/A, with reasons) |
| Q&A entries | Q-1 to Q-114 |
| Epics | 13 (TASK-1 to TASK-13) |
| Milestones | 3: M1 Walking skeleton (m-0, 20 stories), M2 MVP (m-1, 79), M3 Release 1 (m-2, 66) |
| Stories | 165 live (plus 2 retired stories, TASK-10.9 and TASK-10.10, archived) |
| Acceptance criteria | 827 |
| Story risk ratings | high 34, medium 70, low 61 |
| Story priorities (live) | M1: 20 High · M2: 79 High · M3: 9 High, 50 Medium, 7 Low |
| Build waves | 7 (MAP started with 6; re-sequenced after judge round 1) |
| Judge rounds | 3 full (all FAIL) + 1 targeted re-judge of E01 and E03 (no verdict file) |
| Mechanical coverage (final, coverage-4.json) | 367/367 clauses, 0 errors, 22 warnings (15 C5-AND, 7 C3-NOM1) |
| Backlog status | All 178 items (13 epics + 165 stories) are To Do; 1 story is ready |

Discrepancy noted: the journal's G2 entry records the v1.0 priorities as Must 40, Should 26, Could 6. requirements.md v1.9 (and `dreamit.py stats`) shows Must 40, Should 27, Could 5. The change log records no priority change after v1.0, so this report cannot say which requirement moved or when.

## The journey

### 1. Interrogation

**Seed to vision.** The user opened by asking for a language recommendation. Claude compared TypeScript, Python, Rust and Java 21. The Java option's downside was that it needs a second language for a browser UI (or uses the dated JavaFX). The user chose TypeScript: "I'd rather not have the complexity of two languages. If TypeScript is the best solution, let's go with that." (Q-1). Platform decisions followed quickly: installable PWA with no backend (Q-2), the proposed toolchain approved (Q-3), React (Q-4), and a single user with no accounts (Q-5).

**Product shape (Q-6 to Q-21).**
- **Seats and advice:** configurable 2 to 10 seats. Advice comes from rules plus equity math; solver-grade advice is out of scope.
- **When advice appears:** a post-hand review, a hint on request, and a session report. Interrupting live warnings were not chosen.
- **User level:** knows the rules, little strategy.
- **Game types:** cash games plus a basic sit-and-go, with ICM deferred.
- **Opponents and pace:** mixed bot styles; fast by default with an optional realistic pace.
- **Grading:** three severities.
- **Betting cap:** bet + 3 raises on every street, including heads-up.
- **Magic moment:** "Seeing why I lost a hand."

**Insights Claude offered:**
- **Table sizes:** Claude pushed back that tuning advice for every table size about triples the strategy work. The user accepted 3 tuned sizes (heads-up, 6-max, full ring), with other sizes using the nearest chart and flagged approximate (Q-10).
- **Range modelling:** laddering showed that range modelling is the real difficulty behind "advice" (R-2).
- **Hosting:** free GitHub Pages implies a public repository (Q-64).

**Divergent methods (vision.md):**
- **Pre-mortem.** Surfaced advice trust and consistency (G-1, R-1), exploitable bots (R-5), tedious pace (G-5), data loss (R-4) and scope overrun (R-3).
- **Stakeholder round table.** The future casino player wants real conventions (cap rule). A coach wants a standard hand-history export (parked). The building agents need a pure, seeded engine with no UI code.
- **Needs vs. solutions laddering.** Turned "decide on a language first" into "one language, headlessly testable, suited to a visual table", and "headless playtest harness" into "confidence without clicking through hands".

**Pivots:**
- **Storyboards.** The user raised storyboarding before approving the vision: "Before I give the go ahead to move forward, we have a lot of other work, don't we? I think we need to storyboard: Splash Page, Game Start Page, Game Config Page, Table, statistics page, etc." (Q-22). An 8-screen inventory and flow went into vision §4a, with detailed storyboards deferred to Stage 2 (Q-25).
- **Vision statement.** The user asked for a vision statement before approving. Claude wrote §0 (purpose, rough look, 7 principles).

**Ideas rejected or parked, and why:**
- **Language and platform:** Java and any second language (complexity); localhost-only and desktop wrappers (the PWA was preferred).
- **Advice scope:** solver-grade advice (out of v1); interrupting warnings (not chosen); measuring subjective confidence (Q-16: "Don't measure it").
- **Data:** export and backup (Q-17: "Neither for now", with the risk of losing browser data accepted).
- **Later releases:** drills (Q-18).
- **Not selected in Q-24:** the Hand History browser and the Learn/Glossary screens, which went to the waiting room.

**G1.** "Vision Approved" (Q-26), covering §0, the §4a screen inventory and the G-2 to G-4 targets.

### 2. Solidification

**Storyboards.** Low-fidelity, clickable storyboards for all 8 screens were built on a Design canvas: https://claude.ai/artifact/KjdG7AZdq291WAko7bmZXT. The source copy is in `storyboards/`. Each screen carried a sticky note of open questions, 25 in total, which were resolved area by area.

**Branding.** The user supplied a logo (Q-27). The app was named "TLH Trainer", and `brand/tlh-logo.jpg` was saved. This changed the look: the vision said "calm and modern rather than casino-flashy", and the user chose a **branded dark theme** (charcoal, red accent, navy/silver) with classic green felt (Q-28, Q-29). The journal records the reinterpretation as "branded dark, uncluttered".

**Area-by-area work.** Each area was drafted, questioned and confirmed with "Confirm all":

| Area | Requirements | Questions | Confirmation |
|---|---|---|---|
| Set up a session | REQ-001 to REQ-012 | Q-30 to Q-42 | Q-43 |
| Play hands | REQ-013 to REQ-025 | Q-44 to Q-47 | Q-48 |
| Opponents | REQ-026 to REQ-031 | Q-49 to Q-51 | Q-52 |
| Advice engine | REQ-032 to REQ-041 | Q-53 to Q-56 | Q-57 |
| Hint and Review, Report, Statistics, Settings | REQ-042 to REQ-051 | Q-58 to Q-61 | Q-62 |
| Data, NFR, Operations, Definition of Done | REQ-052 to REQ-065 | Q-63 to Q-65 | Q-66 |

In Q-66 the user also moved REQ-011 and REQ-065 from Must to Should, making the Must ratio 60%. During the Area 1 confirmation (Q-43) the user asked whether they would have to write the stories. Claude clarified that agents write the stories after G2 and the user only confirms.

**What the user confirmed, changed or rejected:**
- **Stakes.** The user extended the proposed list: "Fixed List, add $3/$6 and $6/$12" (Q-34).
- **Labels.** Grade and speed labels were renamed to Correct / Minor error / Major error and Rapid / Realistic because of a lint conflict with banned words (Q-42).
- **Rejected:** keyboard shortcuts (Q-46, mouse only), revealing mucked cards (Q-33, realistic play only), adaptive bots (Q-49, waiting room), and showing amounts in big bets (Q-61, not selected).
- **Self-review.** A three-reviewer self-review found 3 gaps; the user accepted all fixes (Q-67).

**Presentation gap.** The user asked: "Do you need artwork for the cards? The tabletop? Have you considered sound?" The plan did not cover these. Area 11 (REQ-066 to REQ-072) was added and confirmed (Q-75):
- **Cards:** big-index SVG cards drawn in code, with the logo on the card back (Q-68).
- **Table art:** felt, rail and chips drawn in code (Q-69).
- **Sound:** deferred. The user's words: "We'll do this in phase 2" (Q-70).
- **Animation:** speed-aware, at most 250 ms at Rapid, and respects reduce-motion (Q-71).
- **Avatars and onboarding:** initials avatars (Q-72); no onboarding beyond a first-use message (Q-73).
- **The user's own additions:** bet chips, bot banter and a session clock (Q-74).

**Gates.** All 15 gates are Clear (gates.md). Backup is N/A because the user accepted the risk (Q-17). Telemetry is N/A for privacy (REQ-058). The TBD register is empty.

**G2.** "Approve baseline v1.0" (Q-76): 72 requirements, 315 clauses.

**Later baseline changes (all user-answered).** Weaving and judging raised 38 further user questions (Q-77 to Q-114). These took the baseline from v1.1 to v1.9 (see the requirements.md change log). Notable ones:
- Leave table mid-hand: confirm, then auto-fold (Q-83, Q-86).
- The Table header Home control pauses the session (Q-89).
- Milestone scope: the user accepted that the sit-and-go-specific parts of Must requirements ship in Release 1 with sit-and-go, and moved Rapid pace into the MVP (Q-99).
- G-3 is measured by the Statistics chart (Q-100).
- The table palette was approved, including navy #1F3A6E (Q-110).
- Heads-up Tough replacement bots are TAG (Q-113).
- Implied-odds allowance is one big bet per opponent still in the hand (Q-114).

### 3. Weaving

**MAP.** 13 epics and 3 milestones, with all 315/315 clauses assigned at first and the map check clean. The epics run left to right along the user journey (story-map.md backbone):
- **Proving and setup:** E01 Prove the game headlessly · E02 Launch and set up a session
- **Playing:** E03 Play hands at the table · E04 Follow the action at a glance · E05 Play a sit-and-go · E06 Face distinct opponents
- **Advice:** E07 Get trustworthy advice · E08 Ask for a hint · E09 Review the hand just played
- **Reports and progress:** E10 Read the session report · E11 Track progress over time
- **Settings and the app itself:** E12 Tune the trainer · E13 Rely on a private offline app

**Epics × milestones (stories, M1/M2/M3).**
- **E01:** 8/9/1
- **E02:** 1/10/6
- **E03:** 5/8/6
- **E04:** 0/0/9
- **E05:** 0/0/11
- **E06:** 1/14/3
- **E07:** 4/11/2
- **E08:** 0/2/2
- **E09:** 1/6/2
- **E10:** 0/8/2
- **E11:** 0/7/5
- **E12:** 0/2/7
- **E13:** 0/2/10

**Walking skeleton (M1, 20 stories).** Toolchain and CI, then the seeded engine (shuffle, hand ranking, full hand, per-seat view), then the playtest runner and invariant checker. Next come the 6-max preflop chart, equity, postflop call/fold and grading. Then TAG bots built on the advice engine. The browser part is SVG cards, a tracer table hand against TAG bots, legal actions, Home to Game Config, the seat/board/pot display, the result with auto-deal, and finally a basic Hand Review. The live ordinal order is:

E01-S01 → E01-S02 → E01-S04 → E07-S02 → E01-S03 → E01-S05 → E01-S06 → E07-S01 → E01-S07 → E01-S08 → E07-S03 → E06-S01 → E07-S04 → E03-S05 → E03-S01 → E03-S02 → E02-S01 → E03-S03 → E03-S04 → E09-S01

Note: story-map.md's "Walking-skeleton path" lists the same 20 stories in a slightly different order (for example, E03-S05 ninth). The Backlog ordinals above are what `backlog` will hand out.

**Waves.**

| Wave | Epics | Why |
|---|---|---|
| 1 | E01 | Language, test harness and headless playtest harness first, at the user's explicit request |
| 2 | E07 | Advice needs only the engine |
| 3 | E06 | Bots are built on advice (REQ-026) |
| 4 | E03 | The table needs the engine, the bots and the hand records |
| 5 | E04, E08, E09, E10 | Each needs the table, not each other |
| 6 | E02 | Needs the table, the report and pace |
| 7 | E05, E11, E12, E13 | Need Config, Review, Report and every screen |

The MAP plan had 6 waves. After judge round 1 the orchestrator moved E02 to wave 6 and E05, E11, E12 and E13 to wave 7, because E02-S09 had a hidden dependency on E10-S01 within the same wave.

**Splitting and re-planning decisions recorded in the journal.**
- **Home snapshot moved to E02.** Home snapshot clauses (REQ-003.*) and REQ-044.7 moved from E10 to E02. E10-S08 and E10-S09 were retired (archived as TASK-10.9 and TASK-10.10) and replaced by E02 stories.
- **Revise round 1:** E02-S14 to S17, E03-S18 and S19, E05-S10 and S11, and E06-S15 to S17 were added, for 164 stories in total.
- **Revise round 2:** E06-S18 was added (bot randomness drawn only from the replay code and seat, M2). There are now 165 stories.
- **Round-3 fix:** the real-stack playtest switch moved from E01-S12 to E01-S16.

**Enablers and orchestrator decisions.**
- **E07-S08** "Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD" is the one explicit enabler. The range model (REQ-035.2), the bot style bands (REQ-027) and the hand-record checks all need these functions (story-map placement notes).
- **E01 toolchain and CI stories are High priority** despite covering Should clauses, "per user's explicit 'toolchain first'" (cross-epic-notes.md).
- **The global Definition of Done items are scoped** to when their tooling exists: the golden suite from E07-S14, the playtest from E01-S07, CI from E01-S02, and axe provisioned in E01-S01.

**Apply.** The first apply created 171 Backlog items. After the revise rounds the live Backlog holds 3 milestones, 13 epics and 165 stories, plus 2 archived stories.

### 4. Judgment

| Round | Mechanical | CRITICAL | HIGH | MEDIUM | LOW | Verdict |
|---|---|---|---|---|---|---|
| 1 | 344/344, 0 errors, 19 warnings | 1 | 14 | 43 | 40 | FAIL |
| 2 | 365/365, 0 errors, 22 warnings | 0 | 4 | 8 | 33 | FAIL |
| 3 | 367/367, 0 errors, 22 warnings | 0 | 2 | 4 | 14 | FAIL |
| 4 (targeted: E01 and E03 only) | coverage-4: 367/367, 0 errors, 22 warnings | 0 | 1 new (resolved by the orchestrator) | 5 (E01 ×2, E03 ×3) | 2 | no verdict file |

The PASS rule was 0 mechanical errors, 0 CRITICAL/HIGH findings, and every epic judged.

**Round 1.**
- **CRITICAL:** E03 REQ-024.4 was only partly covered ("the user never waits for a bot when no bot is to act" was not asserted).
- **HIGH:** 14 findings, mostly hidden dependencies and ordering problems:
  - the CI and playtest Definition of Done items applied before their tools existed;
  - E03 tracer stories needed card rendering;
  - E02-S09 needed E10 report saving;
  - E13 order dependencies.
- **Other HIGHs:** E03 REQ-011.2 randomness was untested; E13 Safari install was only partly covered.
- **User questions:** eight findings went back to the user (Q-97 to Q-104), giving baseline v1.6 (+10 clauses, 3 rewordings).
- **Fixes:** the vision's grade and speed labels were updated editorially, the global Definition of Done was scoped, the waves were re-sequenced, and all 13 epics were revised. The revise round also raised 8 more user questions (Q-105 to Q-112), giving v1.7.
- (The journal records round 1's HIGH count as "~13"; judgment-1.md lists 14.)

**Round 2.**
- **HIGH (4):**
  - The M1 playtest in E01-S07 and S08 needed the cap and all-in rules from M2.
  - E12-S01#AC4, E12-S08#AC6 and E13-S04#AC1 had hidden dependencies.
- **User questions:** the user answered Q-113 (heads-up Tough replacement: TAG; v1.8) and Q-114 (implied odds: one big bet per opponent still in the hand; v1.9).
- **Fixes:** all round-2 HIGH and MEDIUM findings were fixed (journal), story-map.md was regenerated, the global Definition of Done gained an offline item, and E06-S18 was added.

**Round 3.**
- **HIGH (2),** both hidden dependencies that the weaver owned:
  - **J-E01-E01-S12:** the real-stack playtest switch at S12 came before side pots and short all-ins (S13, S14, S16).
  - **J-E03-E03-S09:** AC5 needed the E07-S08 style-stat functions.
- **Clean epics:** E05, E10, E11, E12 and E13 had zero findings.
- **Next step:** the user chose "apply the 2 fixes, then finish" instead of a full fourth round.

**Round 4 (targeted, user-approved).**
- **Fixes applied:** E03-S09 (TASK-3.9) now depends on E07-S08 (TASK-7.12). The real-stack switch moved to E01-S16, which now depends on S09, S12, S13, S14 and S15.
- **Re-judge result:** both round-3 HIGHs were confirmed resolved, with no cycles across 178 tasks.
- **New HIGH:** **J-E01-REQ-063.4-partial**. REQ-063.4 ("`npm run build` produces the deployable PWA") was tagged only on E01-S01#AC6, which checks a static build. The orchestrator resolved it by tagging E13-S06 AC1/AC3 and E13-S07 AC1/AC4 with REQ-063.4. Those ACs already check the manifest, head links, service worker and precache. rtm.md and coverage-4.json show the new tags.
- **No verdict file:** no `judgment-4.md` was written, and no judge re-checked this last fix.

**Accepted residual gaps.** The MEDIUM and LOW findings in "Assumptions, risks and open concerns" below are known and were not fixed. They are non-blocking and handed to the builder.

## Backlog structure

Live Backlog.md data: 178 tasks, all To Do. Stories are listed per milestone, grouped by epic, in ordinal (build) order. Dependencies are Backlog task IDs, with the story key in brackets.

### M1 Walking skeleton (m-0, 20 stories)


**E01 Prove the game headlessly** (TASK-1, wave 1)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 1000 | E01-S01 | TASK-1.1 | High | Bootstrap the strict TypeScript project with one-command checks | — |
| 2000 | E01-S02 | TASK-1.7 | High | Run every check in GitHub Actions on each push and pull request | TASK-1.1 (E01-S01) |
| 3000 | E01-S04 | TASK-1.2 | High | Rank showdown hands by real poker hand rankings | TASK-1.7 (E01-S02) |
| 5000 | E01-S03 | TASK-1.3 | High | Deal every hand from a seeded shuffle with a replay code | TASK-1.7 (E01-S02) |
| 6000 | E01-S05 | TASK-1.4 | High | Play a complete fixed-limit hand from blinds to showdown | TASK-1.3 (E01-S03), TASK-1.2 (E01-S04) |
| 7000 | E01-S06 | TASK-1.5 | High | Give each deciding seat only its own view of the hand | TASK-1.4 (E01-S05) |
| 9000 | E01-S07 | TASK-1.6 | High | Run seeded bot-only hands from the command line | TASK-1.5 (E01-S06) |
| 10000 | E01-S08 | TASK-1.8 | High | Check game invariants after every playtest action | TASK-1.6 (E01-S07), TASK-1.7 (E01-S02) |

**E07 Get trustworthy advice** (TASK-7, wave 2)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 4000 | E07-S02 | TASK-7.1 | High | Compute a hand's equity against opponent hands | TASK-1.2 (E01-S04) |
| 8000 | E07-S01 | TASK-7.2 | High | Recommend a preflop action from the 6-max chart | TASK-1.5 (E01-S06) |
| 11000 | E07-S03 | TASK-7.3 | High | Recommend call or fold after the flop from equity and pot odds | TASK-7.1 (E07-S02), TASK-7.2 (E07-S01) |
| 13000 | E07-S04 | TASK-7.4 | High | Grade a decision as Correct, Minor error or Major error | TASK-7.3 (E07-S03) |

**E06 Face distinct opponents** (TASK-6, wave 3)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 12000 | E06-S01 | TASK-6.1 | High | Face TAG bots that act from the advice engine | TASK-7.2 (E07-S01), TASK-7.3 (E07-S03), TASK-1.6 (E01-S07) |

**E03 Play hands at the table** (TASK-3, wave 4)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 14000 | E03-S05 | TASK-3.5 | High | Read big-index cards drawn in code | TASK-1.1 (E01-S01) |
| 15000 | E03-S01 | TASK-3.1 | High | Play a complete hand against TAG bots at a default 6-max table in the browser | TASK-6.1 (E06-S01), TASK-1.5 (E01-S06), TASK-3.5 (E03-S05) |
| 16000 | E03-S02 | TASK-3.2 | High | Choose only legal actions with their exact amounts | TASK-3.1 (E03-S01) |
| 18000 | E03-S03 | TASK-3.3 | High | See every seat, the board, the pot and the button at a glance | TASK-3.1 (E03-S01), TASK-3.5 (E03-S05) |
| 19000 | E03-S04 | TASK-3.4 | High | See who won each hand and get the next hand dealt automatically | TASK-3.3 (E03-S03) |

**E02 Launch and set up a session** (TASK-2, wave 6)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 17000 | E02-S01 | TASK-2.1 | High | Start a game from Home through Game Config | TASK-3.1 (E03-S01) |

**E09 Review the hand just played** (TASK-9, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 20000 | E09-S01 | TASK-9.1 | High | Review each decision of the hand I just played | TASK-3.4 (E03-S04), TASK-7.4 (E07-S04) |

### M2 MVP (m-1, 79 stories)


**E01 Prove the game headlessly** (TASK-1, wave 1)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 21000 | E01-S12 | TASK-1.9 | High | Let a short-stacked player call all-in | TASK-1.8 (E01-S08) |
| 22000 | E01-S13 | TASK-1.10 | High | Split the pot into side pots for unequal all-ins | TASK-1.9 (E01-S12) |
| 25000 | E01-S09 | TASK-1.11 | High | Play heads-up hands with heads-up blinds and order | TASK-1.8 (E01-S08) |
| 26000 | E01-S10 | TASK-1.12 | High | Cap each street at one bet plus three raises | TASK-1.11 (E01-S09) |
| 27000 | E01-S11 | TASK-1.13 | High | Reject illegal actions without changing the game | TASK-1.12 (E01-S10) |
| 28000 | E01-S14 | TASK-1.14 | High | Allow short all-in bets and raises under the half-bet reopening rule | TASK-1.9 (E01-S12), TASK-1.12 (E01-S10) |
| 29000 | E01-S15 | TASK-1.15 | High | Show and muck cards at showdown in casino order | TASK-1.8 (E01-S08), TASK-1.10 (E01-S13) |
| 30000 | E01-S16 | TASK-1.16 | High | Move the button and blinds past busted seats | TASK-1.11 (E01-S09), TASK-1.9 (E01-S12), TASK-1.10 (E01-S13), TASK-1.14 (E01-S14), TASK-1.15 (E01-S15) |
| 31000 | E01-S17 | TASK-1.17 | High | Prove the engine with a 1,000,000-hand invariant run | TASK-1.13 (E01-S11), TASK-1.10 (E01-S13), TASK-1.14 (E01-S14), TASK-1.15 (E01-S15), TASK-1.16 (E01-S16) |

**E03 Play hands at the table** (TASK-3, wave 4)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 23000 | E03-S12 | TASK-3.6 | High | Keep the table responsive while bots and advice compute | TASK-3.1 (E03-S01) |
| 32000 | E03-S06 | TASK-3.7 | High | Act correctly on capped streets and when short of chips | TASK-3.2 (E03-S02), TASK-1.12 (E01-S10), TASK-1.9 (E01-S12), TASK-1.16 (E01-S16) |
| 33000 | E03-S07 | TASK-3.8 | High | See each side pot and who wins it | TASK-3.4 (E03-S04), TASK-1.10 (E01-S13) |
| 34000 | E03-S13 | TASK-3.13 | High | Play at Rapid bot pace | TASK-3.4 (E03-S04) |
| 60000 | E03-S09 | TASK-3.9 | High | Keep a permanent record of every completed hand | TASK-3.4 (E03-S04), TASK-1.15 (E01-S15), TASK-6.7 (E06-S07), TASK-6.8 (E06-S08), TASK-7.12 (E07-S08) |
| 64000 | E03-S11 | TASK-3.10 | High | Save the session after every hand so it can be resumed | TASK-3.9 (E03-S09) |
| 67000 | E03-S08 | TASK-3.11 | High | Rebuy or leave when my stack runs out | TASK-3.4 (E03-S04), TASK-3.10 (E03-S11) |
| 75000 | E03-S10 | TASK-3.12 | High | Record the advice and grade for each of my decisions with the hand | TASK-3.9 (E03-S09), TASK-7.10 (E07-S12), TASK-7.15 (E07-S13) |

**E07 Get trustworthy advice** (TASK-7, wave 2)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 24000 | E07-S07 | TASK-7.5 | High | Estimate each opponent's range from their actions in the hand | TASK-7.3 (E07-S03) |
| 40000 | E07-S05 | TASK-7.6 | High | Recommend preflop actions at heads-up and full-ring tables | TASK-7.2 (E07-S01) |
| 42000 | E07-S06 | TASK-7.7 | High | Compute multiway and range-versus-range equity within 1.5 points | TASK-7.1 (E07-S02) |
| 43000 | E07-S10 | TASK-7.8 | High | Recommend betting or raising for value | TASK-7.5 (E07-S07) |
| 44000 | E07-S11 | TASK-7.9 | High | Count implied odds for drawing hands | TASK-7.3 (E07-S03) |
| 45000 | E07-S12 | TASK-7.10 | High | Explain every recommendation in plain English with its numbers | TASK-7.6 (E07-S05), TASK-7.8 (E07-S10), TASK-7.9 (E07-S11) |
| 46000 | E07-S14 | TASK-7.11 | High | Check advice against preflop golden spots on every test run | TASK-7.6 (E07-S05), TASK-7.10 (E07-S12) |
| 59000 | E07-S08 | TASK-7.12 | High | Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD | TASK-1.4 (E01-S05) |
| 72000 | E07-S09 | TASK-7.13 | High | Adjust opponent ranges to their observed play after 30 hands | TASK-7.5 (E07-S07), TASK-7.12 (E07-S08) |
| 73000 | E07-S15 | TASK-7.14 | High | Check advice against postflop golden spots on every test run | TASK-7.11 (E07-S14), TASK-7.13 (E07-S09), TASK-7.8 (E07-S10), TASK-7.9 (E07-S11), TASK-7.4 (E07-S04) |
| 74000 | E07-S13 | TASK-7.15 | High | Prove advice is identical for identical decisions | TASK-7.10 (E07-S12), TASK-7.13 (E07-S09), TASK-1.6 (E01-S07), TASK-7.4 (E07-S04) |

**E06 Face distinct opponents** (TASK-6, wave 3)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 35000 | E06-S18 | TASK-6.18 | High | Draw bot randomness only from the replay code and seat | TASK-6.1 (E06-S01) |
| 36000 | E06-S02 | TASK-6.2 | High | Vary TAG's play in mixed spots from its style data file | TASK-6.18 (E06-S18) |
| 37000 | E06-S03 | TASK-6.3 | High | Face a Calling station that calls where TAG would fold or raise | TASK-6.2 (E06-S02) |
| 38000 | E06-S04 | TASK-6.4 | High | Face a Maniac that bets and raises where TAG would check or call | TASK-6.2 (E06-S02) |
| 39000 | E06-S05 | TASK-6.5 | High | Face a Rock that folds every hand outside a narrow starting range | TASK-6.2 (E06-S02) |
| 50000 | E06-S06 | TASK-6.6 | High | Seat bots by line-up preset with unique names | TASK-6.3 (E06-S03), TASK-6.4 (E06-S04), TASK-6.5 (E06-S05) |
| 51000 | E06-S15 | TASK-6.15 | High | Replay any hand with every bot acting exactly as before | TASK-6.6 (E06-S06) |
| 52000 | E06-S07 | TASK-6.7 | High | Record an edited line-up as Custom | TASK-6.6 (E06-S06) |
| 54000 | E06-S08 | TASK-6.8 | High | Replace a busted bot with a new bot from the line-up preset | TASK-6.7 (E06-S07) |
| 55000 | E06-S11 | TASK-6.9 | High | Prove the engine over 1,000,000 cash hands with every line-up preset | TASK-6.8 (E06-S08), TASK-1.17 (E01-S17) |
| 58000 | E06-S10 | TASK-6.10 | High | Report each bot's BB/100 with a 95% confidence interval | TASK-6.8 (E06-S08) |
| 61000 | E06-S09 | TASK-6.11 | High | Report each bot style's VPIP, PFR and aggression against its band | TASK-6.6 (E06-S06), TASK-7.12 (E07-S08) |
| 62000 | E06-S16 | TASK-6.16 | High | Keep TAG and Rock bots inside their style bands | TASK-6.11 (E06-S09) |
| 63000 | E06-S17 | TASK-6.17 | High | Keep Calling station and Maniac bots inside their style bands | TASK-6.16 (E06-S16) |

**E02 Launch and set up a session** (TASK-2, wave 6)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 41000 | E02-S02 | TASK-2.2 | High | Choose how many players sit at the table | TASK-2.1 (E02-S01), TASK-1.11 (E01-S09), TASK-7.6 (E07-S05) |
| 48000 | E02-S03 | TASK-2.3 | High | Choose the stake for a cash game | TASK-2.1 (E02-S01) |
| 49000 | E02-S04 | TASK-2.4 | High | Choose Cash game or Sit-and-go | TASK-2.3 (E02-S03) |
| 53000 | E02-S05 | TASK-2.5 | High | Choose a line-up preset for the bots | TASK-2.2 (E02-S02), TASK-6.7 (E06-S07) |
| 56000 | E02-S06 | TASK-2.8 | High | Change the style of one bot seat | TASK-2.5 (E02-S05) |
| 57000 | E02-S07 | TASK-2.9 | High | Randomise the bot line-up | TASK-2.5 (E02-S05) |
| 65000 | E02-S08 | TASK-2.6 | High | Resume a paused session from Home | TASK-2.1 (E02-S01), TASK-3.10 (E03-S11) |
| 66000 | E02-S15 | TASK-2.14 | High | Pause the session from the Table header Home control | TASK-2.6 (E02-S08), TASK-3.3 (E03-S03) |
| 71000 | E02-S09 | TASK-2.7 | High | Confirm ending a paused session before starting a new game | TASK-2.6 (E02-S08), TASK-10.1 (E10-S01) |
| 87000 | E02-S14 | TASK-2.15 | High | Practise with play money only | TASK-2.1 (E02-S01), TASK-10.1 (E10-S01) |

**E12 Tune the trainer** (TASK-12, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 47000 | E12-S01 | TASK-12.1 | High | Open Settings from Home and see the app version | TASK-2.1 (E02-S01) |
| 99000 | E12-S02 | TASK-12.2 | High | Hide opponent style labels at the table | TASK-12.1 (E12-S01), TASK-3.3 (E03-S03) |

**E10 Read the session report** (TASK-10, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 68000 | E10-S01 | TASK-10.1 | High | End the session with Leave table and see its saved report with my cash result | TASK-3.3 (E03-S03), TASK-3.11 (E03-S08), TASK-3.9 (E03-S09), TASK-3.10 (E03-S11) |
| 69000 | E10-S04 | TASK-10.3 | High | See my five style stats against healthy ranges for my table size | TASK-10.1 (E10-S01), TASK-7.12 (E07-S08), TASK-6.17 (E06-S17) |
| 79000 | E10-S02 | TASK-10.4 | High | See my hands played and error rates per 100 hands in the report | TASK-10.1 (E10-S01), TASK-3.12 (E03-S10) |
| 80000 | E10-S05 | TASK-10.2 | High | Leave the table in the middle of a hand | TASK-10.1 (E10-S01) |
| 82000 | E10-S06 | TASK-10.5 | High | See my postflop leaks with evidence and a one-sentence fix | TASK-10.1 (E10-S01), TASK-3.12 (E03-S10) |
| 83000 | E10-S12 | TASK-10.6 | High | See my preflop leaks by position group | TASK-10.5 (E10-S06) |
| 93000 | E10-S03 | TASK-10.7 | High | See how many of my decisions used a hint in the report | TASK-10.1 (E10-S01), TASK-3.12 (E03-S10) |
| 94000 | E10-S07 | TASK-10.8 | High | See my three most costly leaks first | TASK-10.5 (E10-S06) |

**E13 Rely on a private offline app** (TASK-13, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 70000 | E13-S02 | TASK-13.1 | High | Return Home from an unexpected error without losing completed hands | TASK-2.6 (E02-S08), TASK-3.10 (E03-S11), TASK-10.1 (E10-S01) |
| 86000 | E13-S01 | TASK-13.2 | High | Ask the browser to keep my history on first launch | TASK-3.9 (E03-S09) |

**E08 Ask for a hint** (TASK-8, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 76000 | E08-S01 | TASK-8.1 | High | Ask for a hint and see the recommended action with its numbers and reason | TASK-3.2 (E03-S02), TASK-3.6 (E03-S12), TASK-7.10 (E07-S12), TASK-7.13 (E07-S09) |
| 88000 | E08-S02 | TASK-8.2 | High | Mark a decision as hinted when I open the hint | TASK-8.1 (E08-S01), TASK-3.12 (E03-S10) |

**E09 Review the hand just played** (TASK-9, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 77000 | E09-S02 | TASK-9.3 | High | See the numbers and reason behind each reviewed decision | TASK-9.1 (E09-S01), TASK-3.12 (E03-S10), TASK-3.6 (E03-S12) |
| 78000 | E09-S06 | TASK-9.2 | High | Continue to rebuy or leave when I bust with the review open | TASK-9.1 (E09-S01), TASK-3.11 (E03-S08) |
| 89000 | E09-S03 | TASK-9.4 | High | See the hand number, my cards, position, result and replay code in the review | TASK-9.1 (E09-S01), TASK-3.9 (E03-S09) |
| 90000 | E09-S04 | TASK-9.5 | High | See opponents' cards in the review only when they were shown at showdown | TASK-9.1 (E09-S01), TASK-1.15 (E01-S15) |
| 91000 | E09-S05 | TASK-9.6 | High | See which reviewed decisions were hinted | TASK-9.3 (E09-S02) |
| 92000 | E09-S07 | TASK-9.7 | High | See a grade summary badge after each hand when auto-open is off | TASK-9.1 (E09-S01) |

**E11 Track progress over time** (TASK-11, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 81000 | E11-S01 | TASK-11.1 | High | See my Major errors per 100 hands trend on the Statistics screen | TASK-2.1 (E02-S01), TASK-3.12 (E03-S10), TASK-10.4 (E10-S02), TASK-10.2 (E10-S05) |
| 84000 | E11-S04 | TASK-11.2 | High | See my BB/100 trend from cash hands against a break-even line | TASK-11.1 (E11-S01), TASK-10.1 (E10-S01) |
| 85000 | E11-S06 | TASK-11.3 | High | See the G-2 target line on my Major-error trend | TASK-11.1 (E11-S01) |
| 95000 | E11-S03 | TASK-11.4 | High | Filter my trends by table size and game type | TASK-11.1 (E11-S01) |
| 96000 | E11-S02 | TASK-11.5 | High | Group my trends per session or per day | TASK-11.1 (E11-S01), TASK-11.4 (E11-S03), TASK-3.9 (E03-S09) |
| 97000 | E11-S07 | TASK-11.6 | High | Open Statistics or go Home from the Session Report | TASK-10.1 (E10-S01), TASK-11.1 (E11-S01) |
| 98000 | E11-S08 | TASK-11.7 | High | Filter my trends by line-up | TASK-11.4 (E11-S03), TASK-6.7 (E06-S07), TASK-3.9 (E03-S09) |

### M3 Release 1 (m-2, 66 stories)


**E06 Face distinct opponents** (TASK-6, wave 3)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 100000 | E06-S12 | TASK-6.12 | High | Prove TAG beats tables of each weaker style | TASK-6.10 (E06-S10), TASK-6.17 (E06-S17) |
| 105000 | E06-S14 | TASK-6.13 | Medium | Compute every bot decision within 100 ms | TASK-6.6 (E06-S06) |
| 140000 | E06-S13 | TASK-6.14 | Medium | Keep each bot's style fixed whatever the user does | TASK-6.6 (E06-S06) |

**E13 Rely on a private offline app** (TASK-13, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 101000 | E13-S03 | TASK-13.3 | Medium | Stop dealing when the last hand could not be saved | TASK-3.9 (E03-S09), TASK-3.10 (E03-S11), TASK-10.1 (E10-S01) |
| 110000 | E13-S07 | TASK-13.4 | Medium | Use every screen offline after the first visit | TASK-1.18 (E01-S18), TASK-8.1 (E08-S01), TASK-9.1 (E09-S01), TASK-10.1 (E10-S01) |
| 111000 | E13-S09 | TASK-13.5 | Medium | Keep all my data on this device with no third-party requests | TASK-1.18 (E01-S18), TASK-10.1 (E10-S01) |
| 114000 | E13-S10 | TASK-13.9 | Medium | Reach Home within 3 seconds on a repeat launch | TASK-13.4 (E13-S07), TASK-2.12 (E02-S12) |
| 115000 | E13-S11 | TASK-13.10 | Medium | Keep every screen within its time limits with 100,000 stored hands | TASK-13.9 (E13-S10), TASK-8.3 (E08-S04), TASK-9.8 (E09-S09), TASK-6.13 (E06-S14), TASK-3.6 (E03-S12), TASK-10.1 (E10-S01) |
| 127000 | E13-S04 | TASK-13.6 | Medium | Migrate my stored data in order when a new version changes the schema | TASK-3.9 (E03-S09), TASK-3.10 (E03-S11), TASK-10.1 (E10-S01), TASK-2.12 (E02-S12), TASK-2.10 (E02-S10), TASK-4.3 (E04-S02) |
| 128000 | E13-S05 | TASK-13.7 | Medium | Keep my old data intact when a migration fails | TASK-13.6 (E13-S04) |
| 129000 | E13-S08 | TASK-13.8 | Medium | Get new versions at the next launch, never mid-session | TASK-13.4 (E13-S07), TASK-13.6 (E13-S04) |
| 130000 | E13-S12 | TASK-13.11 | Medium | Prove every screen passes automated accessibility checks | TASK-2.12 (E02-S12), TASK-2.6 (E02-S08), TASK-2.4 (E02-S04), TASK-2.16 (E02-S16), TASK-2.17 (E02-S17), TASK-3.11 (E03-S08), TASK-10.2 (E10-S05), TASK-8.1 (E08-S01), TASK-9.1 (E09-S01), TASK-10.1 (E10-S01), TASK-13.1 (E13-S02), TASK-13.3 (E13-S03), TASK-13.7 (E13-S05), TASK-13.8 (E13-S08) |
| 134000 | E13-S06 | TASK-13.12 | Medium | Install TLH Trainer to the Dock from Chrome or Safari | TASK-1.18 (E01-S18), TASK-4.4 (E04-S03), TASK-2.12 (E02-S12) |

**E03 Play hands at the table** (TASK-3, wave 4)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 102000 | E03-S15 | TASK-3.14 | Medium | See an opponent's observed VPIP, PFR and aggression on hover or tap | TASK-3.3 (E03-S03), TASK-3.9 (E03-S09), TASK-7.12 (E07-S08) |
| 119000 | E03-S18 | TASK-3.18 | High | Play at Realistic bot pace | TASK-3.13 (E03-S13), TASK-1.9 (E01-S12) |
| 122000 | E03-S14 | TASK-3.15 | Medium | Change speed during a session from the table | TASK-3.18 (E03-S18), TASK-3.10 (E03-S11) |
| 123000 | E03-S16 | TASK-3.16 | Medium | Play on a branded table that fits a 1280 x 720 window | TASK-3.3 (E03-S03), TASK-3.5 (E03-S05) |
| 124000 | E03-S19 | TASK-3.19 | Medium | Read every amount as US dollars in English | TASK-3.3 (E03-S03) |
| 125000 | E03-S17 | TASK-3.17 | Medium | Operate every table control with native buttons and large targets | TASK-3.11 (E03-S08), TASK-3.15 (E03-S14), TASK-3.14 (E03-S15), TASK-3.2 (E03-S02), TASK-3.3 (E03-S03) |

**E04 Follow the action at a glance** (TASK-4, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 103000 | E04-S01 | TASK-4.1 | Medium | Follow every action of the hand in an action log | TASK-3.3 (E03-S03) |
| 120000 | E04-S07 | TASK-4.2 | Low | See a bot's in-style speech bubble after a table event | TASK-3.13 (E03-S13), TASK-6.8 (E06-S08), TASK-3.18 (E03-S18) |
| 126000 | E04-S02 | TASK-4.3 | Medium | Keep the action log collapsed or expanded as I left it | TASK-4.1 (E04-S01) |
| 131000 | E04-S03 | TASK-4.4 | Medium | Play on a table, rail, chips and dealer button drawn in code | TASK-3.16 (E03-S16) |
| 132000 | E04-S04 | TASK-4.5 | Medium | See each player's bet as chips in front of their seat | TASK-4.4 (E04-S03), TASK-3.4 (E03-S04), TASK-3.8 (E03-S07) |
| 133000 | E04-S05 | TASK-4.6 | Medium | Watch deals and chip moves animate without slowing my play | TASK-4.5 (E04-S04), TASK-3.13 (E03-S13), TASK-3.18 (E03-S18) |
| 135000 | E04-S06 | TASK-4.7 | Low | Recognise each bot by an initials avatar badge | TASK-3.3 (E03-S03), TASK-6.8 (E06-S08) |
| 136000 | E04-S08 | TASK-4.8 | Low | Keep bot banter rare and free of hidden information | TASK-4.2 (E04-S07) |
| 137000 | E04-S09 | TASK-4.9 | Low | See my session's playing time and hands-per-hour pace in the header | TASK-3.3 (E03-S03), TASK-3.10 (E03-S11) |

**E05 Play a sit-and-go** (TASK-5, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 104000 | E05-S01 | TASK-5.1 | Medium | Start a sit-and-go where every player has 1,500 chips | TASK-2.4 (E02-S04), TASK-3.10 (E03-S11), TASK-1.16 (E01-S16) |
| 139000 | E05-S04 | TASK-5.2 | Medium | Leave a busted bot's seat empty for the rest of the sit-and-go | TASK-5.1 (E05-S01), TASK-6.8 (E06-S08), TASK-10.6 (E10-S12) |
| 143000 | E05-S02 | TASK-5.4 | Medium | Raise the sit-and-go limits every 10 hands on the published schedule | TASK-5.1 (E05-S01), TASK-7.17 (E07-S17) |
| 144000 | E05-S11 | TASK-5.10 | High | Prove the sit-and-go structure over the 1,000,000-hand invariant run | TASK-5.4 (E05-S02), TASK-5.2 (E05-S04), TASK-6.9 (E06-S11), TASK-1.17 (E01-S17) |
| 145000 | E05-S03 | TASK-5.5 | High | See the current level, its limits and hands to the next level in the header | TASK-5.4 (E05-S02), TASK-3.3 (E03-S03), TASK-2.6 (E02-S08) |
| 146000 | E05-S09 | TASK-5.6 | High | See the level on Home's Resume entry for a paused sit-and-go | TASK-5.5 (E05-S03) |
| 151000 | E05-S05 | TASK-5.7 | Medium | >- | TASK-5.2 (E05-S04), TASK-10.12 (E10-S11), TASK-3.4 (E03-S04) |
| 152000 | E05-S06 | TASK-5.8 | Medium | See results when I bust in a sit-and-go with the review open | TASK-5.7 (E05-S05), TASK-9.2 (E09-S06) |
| 153000 | E05-S07 | TASK-5.3 | Medium | Read every sit-and-go chip amount without a $ sign | TASK-5.1 (E05-S01), TASK-4.1 (E04-S01), TASK-4.5 (E04-S04), TASK-8.1 (E08-S01), TASK-9.3 (E09-S02), TASK-5.7 (E05-S05), TASK-10.12 (E10-S11) |
| 154000 | E05-S08 | TASK-5.9 | Medium | See my last sit-and-go's finishing position in the Home snapshot | TASK-5.7 (E05-S05), TASK-2.16 (E02-S16) |
| 155000 | E05-S10 | TASK-5.11 | Medium | Leave a sit-and-go early and get my finishing position | TASK-5.7 (E05-S05), TASK-10.2 (E10-S05) |

**E08 Ask for a hint** (TASK-8, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 106000 | E08-S04 | TASK-8.3 | Medium | Get the hint card within one second | TASK-8.1 (E08-S01) |
| 147000 | E08-S03 | TASK-8.4 | Medium | See approximate and short-stack labels on the hint card | TASK-8.1 (E08-S01), TASK-7.16 (E07-S16), TASK-7.17 (E07-S17) |

**E09 Review the hand just played** (TASK-9, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 107000 | E09-S09 | TASK-9.8 | Medium | Get the review panel within one second of the hand ending | TASK-9.3 (E09-S02) |
| 148000 | E09-S08 | TASK-9.9 | Medium | See approximate and short-stack labels in review entries | TASK-9.3 (E09-S02), TASK-7.16 (E07-S16), TASK-7.17 (E07-S17) |

**E11 Track progress over time** (TASK-11, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 108000 | E11-S09 | TASK-11.8 | Medium | See my style stats over my last 1,000 hands against healthy ranges | TASK-11.7 (E11-S08), TASK-10.3 (E10-S04), TASK-7.12 (E07-S08) |
| 156000 | E11-S05 | TASK-11.9 | High | See my average sit-and-go finishing position per trend group | TASK-11.5 (E11-S02), TASK-11.4 (E11-S03) |
| 157000 | E11-S10 | TASK-11.10 | Medium | See my style stats separately for each table size I played | TASK-11.8 (E11-S09) |
| 158000 | E11-S11 | TASK-11.11 | Medium | See whether I met the G-2 goal after 5,000 hands | TASK-11.3 (E11-S06) |
| 159000 | E11-S12 | TASK-11.12 | Medium | Open Statistics within 2 seconds with 100,000 stored hands | TASK-11.2 (E11-S04), TASK-11.9 (E11-S05), TASK-11.10 (E11-S10), TASK-11.11 (E11-S11), TASK-11.5 (E11-S02) |

**E01 Prove the game headlessly** (TASK-1, wave 1)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 109000 | E01-S18 | TASK-1.18 | Medium | Deploy the app to GitHub Pages from main when all checks pass | TASK-1.8 (E01-S08) |

**E02 Launch and set up a session** (TASK-2, wave 6)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 112000 | E02-S10 | TASK-2.10 | High | Pre-fill Game Config from my last session | TASK-2.4 (E02-S04), TASK-2.8 (E02-S06) |
| 113000 | E02-S12 | TASK-2.12 | Medium | See a branded splash while the app loads | TASK-2.1 (E02-S01) |
| 116000 | E02-S13 | TASK-2.13 | Medium | Sit at a random seat with a random starting button | TASK-2.5 (E02-S05) |
| 117000 | E02-S16 | TASK-2.16 | High | See a snapshot of my last session on Home and reopen its report | TASK-2.1 (E02-S01), TASK-10.1 (E10-S01), TASK-10.4 (E10-S02), TASK-10.8 (E10-S07) |
| 118000 | E02-S17 | TASK-2.17 | Low | See a first-use message on Home before any session has ended | TASK-2.16 (E02-S16) |
| 121000 | E02-S11 | TASK-2.11 | Medium | Choose Rapid or Realistic speed for the session | TASK-2.1 (E02-S01), TASK-3.13 (E03-S13), TASK-3.18 (E03-S18) |

**E12 Tune the trainer** (TASK-12, wave 7)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 138000 | E12-S03 | TASK-12.3 | Medium | Open Settings over the table without pausing the session | TASK-12.2 (E12-S02), TASK-3.10 (E03-S11), TASK-3.4 (E03-S04), TASK-4.9 (E04-S09), TASK-3.18 (E03-S18) |
| 160000 | E12-S04 | TASK-12.5 | Medium | Choose the default speed for new sessions in Settings | TASK-12.1 (E12-S01), TASK-2.11 (E02-S11) |
| 161000 | E12-S05 | TASK-12.6 | Medium | Turn off automatic opening of the Hand Review panel | TASK-12.3 (E12-S03), TASK-9.7 (E09-S07) |
| 162000 | E12-S06 | TASK-12.7 | Medium | Switch to a four-colour deck | TASK-12.3 (E12-S03), TASK-3.5 (E03-S05) |
| 163000 | E12-S07 | TASK-12.8 | Low | Turn bot banter off | TASK-12.1 (E12-S01), TASK-4.2 (E04-S07) |
| 164000 | E12-S08 | TASK-12.4 | Medium | Delete all my data after confirming | TASK-12.3 (E12-S03), TASK-2.17 (E02-S17), TASK-2.10 (E02-S10), TASK-4.3 (E04-S02), TASK-12.5 (E12-S04), TASK-12.6 (E12-S05), TASK-12.7 (E12-S06), TASK-12.8 (E12-S07) |
| 165000 | E12-S09 | TASK-12.9 | Medium | Warn me in Settings when the browser can clear my history | TASK-12.3 (E12-S03) |

**E07 Get trustworthy advice** (TASK-7, wave 2)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 141000 | E07-S16 | TASK-7.16 | Medium | Label advice as approximate at non-reference table sizes | TASK-7.6 (E07-S05), TASK-7.4 (E07-S04) |
| 142000 | E07-S17 | TASK-7.17 | Medium | Add a short-stack note to sit-and-go advice | TASK-7.3 (E07-S03), TASK-7.2 (E07-S01), TASK-7.4 (E07-S04) |

**E10 Read the session report** (TASK-10, wave 5)

| Ord | Story | Task | Priority | Title | Depends on |
|---|---|---|---|---|---|
| 149000 | E10-S10 | TASK-10.11 | Low | See my playing time and hands per hour in the report | TASK-10.1 (E10-S01), TASK-4.9 (E04-S09) |
| 150000 | E10-S11 | TASK-10.12 | High | See my sit-and-go finishing position in the report | TASK-10.1 (E10-S01) |

## Traceability summary

All 367 active clauses are covered (rtm.md and coverage-4.json: 367/367). Every requirement maps to at least one story. Ten global Definition of Done items also carry tags, for REQ-039.4, 056.1, 057.1, 058.1, 059.1 to 059.4, 061.2 and 064.2. The full clause-level matrix is in `dreams/limit-holdem-trainer/rtm.md`.

The following clauses are mechanically covered but have known caveats:
- **REQ-005.1 (Must):** "default is the last used value" is confirmed only by E02-S10#AC5 (TASK-2.10, REQ-012 Could, **M3**). The M2 MVP therefore ships the game-type options without remembering the last used one. Round 3 flagged this as user-owned (J-E02-REQ-005.1-milestone). No Q&A entry records a user decision on it.
- **REQ-063.4 (Should):** the PWA build is covered only through the round-4 orchestrator tagging of E13-S06 and E13-S07. These are M3 stories, so M1 and M2 builds are static bundles without the PWA parts.
- **REQ-060.3 (Should):** says "charcoal backgrounds" without a hex value. The storyboards use **#0E0F12**, but no requirement states it (round-2 LOWs J-E02-E02-S01-AC3 and J-E03-E03-S16#AC2). REQ-067.4 gives exact hex values only for felt, rail and chips.
- **REQ-071.2 ("never insult the user"):** checked only by a manual review Definition of Done item on E04-S07 (LOW).

| Requirement | Priority | Clauses | Stories (story key = task) |
|---|---|---|---|
| REQ-001 Splash screen on launch | Should | 3 | E02-S12=TASK-2.12 |
| REQ-002 Home screen menu | Must | 6 | E02-S01=TASK-2.1, E02-S08=TASK-2.6, E05-S09=TASK-5.6, E11-S01=TASK-11.1, E12-S01=TASK-12.1 |
| REQ-003 Last-session snapshot and first-use state on Home | Could | 5 | E02-S16=TASK-2.16, E02-S17=TASK-2.17, E05-S08=TASK-5.9 |
| REQ-004 Pause, resume and end a session | Must | 9 | E02-S08=TASK-2.6, E02-S09=TASK-2.7, E02-S15=TASK-2.14, E05-S03=TASK-5.5, E10-S01=TASK-10.1, E10-S05=TASK-10.2, E11-S01=TASK-11.1 |
| REQ-005 Choose game type and table size | Must | 4 | E02-S02=TASK-2.2, E02-S04=TASK-2.4, E02-S10=TASK-2.10, E07-S05=TASK-7.6 |
| REQ-006 Stakes and blinds | Must | 4 | E02-S01=TASK-2.1, E02-S03=TASK-2.3, E02-S04=TASK-2.4, E02-S14=TASK-2.15 |
| REQ-007 Cash game buy-in and rebuy | Must | 8 | E02-S03=TASK-2.3, E03-S01=TASK-3.1, E03-S08=TASK-3.11, E06-S08=TASK-6.8, E09-S06=TASK-9.2, E10-S01=TASK-10.1 |
| REQ-008 Sit-and-go structure | Should | 13 | E05-S01=TASK-5.1, E05-S02=TASK-5.4, E05-S03=TASK-5.5, E05-S04=TASK-5.2, E05-S05=TASK-5.7, E05-S06=TASK-5.8, E05-S07=TASK-5.3, E05-S10=TASK-5.11, E05-S11=TASK-5.10 |
| REQ-009 Line-up presets and per-seat styles | Must | 8 | E02-S05=TASK-2.5, E02-S06=TASK-2.8, E02-S07=TASK-2.9, E06-S06=TASK-6.6, E06-S07=TASK-6.7, E06-S08=TASK-6.8 |
| REQ-010 User seat and starting dealer button | Should | 3 | E02-S13=TASK-2.13, E03-S03=TASK-3.3 |
| REQ-011 Speed choice | Should | 3 | E02-S11=TASK-2.11, E03-S13=TASK-3.13, E03-S14=TASK-3.15, E03-S18=TASK-3.18, E04-S05=TASK-4.6 |
| REQ-012 Remember last configuration | Could | 3 | E02-S04=TASK-2.4, E02-S05=TASK-2.5, E02-S10=TASK-2.10, E02-S11=TASK-2.11, E12-S04=TASK-12.5 |
| REQ-013 Deck, shuffle and replay code | Must | 5 | E01-S03=TASK-1.3, E01-S07=TASK-1.6, E03-S03=TASK-3.3, E09-S03=TASK-9.4 |
| REQ-014 Hand sequence | Must | 6 | E01-S05=TASK-1.4, E01-S12=TASK-1.9 |
| REQ-015 Heads-up blinds and order | Must | 3 | E01-S09=TASK-1.11, E02-S02=TASK-2.2 |
| REQ-016 Fixed-limit betting and cap | Must | 5 | E01-S05=TASK-1.4, E01-S10=TASK-1.12, E01-S14=TASK-1.14 |
| REQ-017 Legal actions only | Must | 7 | E01-S11=TASK-1.13, E01-S14=TASK-1.14, E03-S02=TASK-3.2, E03-S06=TASK-3.7 |
| REQ-018 All-in and side pots | Must | 5 | E01-S12=TASK-1.9, E01-S13=TASK-1.10, E01-S16=TASK-1.16 |
| REQ-019 Showdown and pot award | Must | 9 | E01-S04=TASK-1.2, E01-S05=TASK-1.4, E01-S13=TASK-1.10, E01-S15=TASK-1.15, E03-S01=TASK-3.1, E03-S04=TASK-3.4 |
| REQ-020 Button and blind movement | Must | 4 | E01-S16=TASK-1.16 |
| REQ-021 Table display | Must | 8 | E03-S03=TASK-3.3, E03-S07=TASK-3.8, E12-S02=TASK-12.2 |
| REQ-022 Action bar | Must | 4 | E03-S02=TASK-3.2, E03-S06=TASK-3.7, E08-S01=TASK-8.1 |
| REQ-023 Action log | Should | 4 | E04-S01=TASK-4.1, E04-S02=TASK-4.3 |
| REQ-024 Between hands | Must | 6 | E03-S01=TASK-3.1, E03-S04=TASK-3.4, E03-S07=TASK-3.8, E03-S13=TASK-3.13, E03-S18=TASK-3.18, E09-S01=TASK-9.1, E09-S07=TASK-9.7 |
| REQ-025 No hidden-information leakage | Must | 3 | E01-S06=TASK-1.5, E01-S15=TASK-1.15, E06-S01=TASK-6.1, E07-S01=TASK-7.2, E07-S03=TASK-7.3, E07-S04=TASK-7.4, E07-S13=TASK-7.15 |
| REQ-026 Bots built on the advice engine | Must | 3 | E06-S01=TASK-6.1, E06-S02=TASK-6.2, E06-S03=TASK-6.3, E06-S04=TASK-6.4, E06-S05=TASK-6.5 |
| REQ-027 Measurable style profiles | Must | 6 | E06-S09=TASK-6.11, E06-S16=TASK-6.16, E06-S17=TASK-6.17 |
| REQ-028 Reproducible mixed decisions | Must | 3 | E06-S02=TASK-6.2, E06-S09=TASK-6.11, E06-S15=TASK-6.15, E06-S18=TASK-6.18 |
| REQ-029 Fixed styles (no adaptation) | Should | 2 | E06-S13=TASK-6.14, E06-S18=TASK-6.18 |
| REQ-030 TAG bot strength | Should | 4 | E06-S10=TASK-6.10, E06-S12=TASK-6.12 |
| REQ-031 Opponent stats on hover or tap | Should | 4 | E03-S15=TASK-3.14 |
| REQ-032 Preflop charts | Must | 6 | E07-S01=TASK-7.2, E07-S05=TASK-7.6 |
| REQ-033 Postflop recommendation method | Must | 7 | E07-S03=TASK-7.3, E07-S10=TASK-7.8, E07-S11=TASK-7.9 |
| REQ-034 Equity calculation accuracy | Must | 3 | E07-S02=TASK-7.1, E07-S06=TASK-7.7 |
| REQ-035 Opponent range model | Must | 6 | E07-S07=TASK-7.5, E07-S09=TASK-7.13, E08-S01=TASK-8.1, E09-S02=TASK-9.3 |
| REQ-036 Deterministic advice | Must | 2 | E07-S12=TASK-7.10, E07-S13=TASK-7.15, E08-S02=TASK-8.2, E09-S02=TASK-9.3 |
| REQ-037 Plain-English explanations | Must | 4 | E07-S12=TASK-7.10, E07-S14=TASK-7.11, E07-S15=TASK-7.14 |
| REQ-038 Grading rules | Must | 6 | E07-S04=TASK-7.4, E07-S15=TASK-7.14 |
| REQ-039 Golden spot suite | Must | 4 | E07-S14=TASK-7.11, E07-S15=TASK-7.14; also DoD-global#3 |
| REQ-040 Hinted decisions | Should | 4 | E08-S02=TASK-8.2, E09-S05=TASK-9.6, E10-S03=TASK-10.7, E11-S01=TASK-11.1, E11-S06=TASK-11.3, E11-S11=TASK-11.11 |
| REQ-041 Approximate and short-stack labels | Should | 3 | E05-S02=TASK-5.4, E07-S16=TASK-7.16, E07-S17=TASK-7.17, E08-S03=TASK-8.4, E09-S08=TASK-9.9 |
| REQ-042 Hint on request | Must | 6 | E08-S01=TASK-8.1, E08-S02=TASK-8.2 |
| REQ-043 Hand Review panel | Must | 13 | E09-S01=TASK-9.1, E09-S02=TASK-9.3, E09-S03=TASK-9.4, E09-S04=TASK-9.5, E09-S05=TASK-9.6, E09-S07=TASK-9.7 |
| REQ-044 Session Report content | Must | 11 | E02-S16=TASK-2.16, E10-S01=TASK-10.1, E10-S02=TASK-10.4, E10-S03=TASK-10.7, E10-S04=TASK-10.3, E10-S06=TASK-10.5, E10-S07=TASK-10.8, E10-S11=TASK-10.12, E10-S12=TASK-10.6, E11-S07=TASK-11.6 |
| REQ-045 Style stat definitions | Must | 6 | E07-S08=TASK-7.12, E10-S04=TASK-10.3 |
| REQ-046 Healthy ranges | Must | 3 | E10-S04=TASK-10.3 |
| REQ-047 Leak detection | Should | 9 | E05-S04=TASK-5.2, E10-S06=TASK-10.5, E10-S07=TASK-10.8, E10-S12=TASK-10.6 |
| REQ-048 Statistics screen trends | Must | 14 | E11-S01=TASK-11.1, E11-S02=TASK-11.5, E11-S03=TASK-11.4, E11-S04=TASK-11.2, E11-S05=TASK-11.9, E11-S06=TASK-11.3, E11-S08=TASK-11.7 |
| REQ-049 Style stats and goal status | Should | 4 | E11-S09=TASK-11.8, E11-S10=TASK-11.10, E11-S11=TASK-11.11 |
| REQ-050 Settings options | Should | 8 | E12-S01=TASK-12.1, E12-S02=TASK-12.2, E12-S03=TASK-12.3, E12-S04=TASK-12.5, E12-S05=TASK-12.6, E12-S06=TASK-12.7 |
| REQ-051 Reset all data | Should | 4 | E12-S08=TASK-12.4 |
| REQ-052 Local persistence | Must | 7 | E03-S09=TASK-3.9, E03-S10=TASK-3.12, E03-S11=TASK-3.10, E10-S01=TASK-10.1, E13-S01=TASK-13.2 |
| REQ-053 Storage capacity and failure | Should | 3 | E11-S12=TASK-11.12, E12-S08=TASK-12.4, E12-S09=TASK-12.9, E13-S03=TASK-13.3, E13-S10=TASK-13.9, E13-S11=TASK-13.10 |
| REQ-054 Data versioning and migration | Should | 3 | E13-S04=TASK-13.6, E13-S05=TASK-13.7 |
| REQ-055 Response times | Should | 6 | E03-S12=TASK-3.6, E06-S14=TASK-6.13, E08-S04=TASK-8.3, E09-S09=TASK-9.8, E11-S12=TASK-11.12, E13-S10=TASK-13.9, E13-S11=TASK-13.10 |
| REQ-056 Reliability and invariants | Must | 3 | E01-S07=TASK-1.6, E01-S08=TASK-1.8, E01-S16=TASK-1.16, E01-S17=TASK-1.17, E05-S11=TASK-5.10, E06-S01=TASK-6.1, E06-S11=TASK-6.9, E13-S02=TASK-13.1; also DoD-global#6 |
| REQ-057 Accessibility and usability | Should | 4 | E01-S01=TASK-1.1, E03-S17=TASK-3.17, E04-S02=TASK-4.3, E09-S01=TASK-9.1, E09-S07=TASK-9.7, E11-S01=TASK-11.1, E12-S01=TASK-12.1, E12-S03=TASK-12.3, E12-S08=TASK-12.4, E12-S09=TASK-12.9, E13-S02=TASK-13.1, E13-S12=TASK-13.11; also DoD-global#7 |
| REQ-058 Privacy and security | Should | 3 | E13-S09=TASK-13.5; also DoD-global#8 |
| REQ-059 Maintainability and testability | Must | 4 | E01-S01=TASK-1.1; also DoD-global#2, DoD-global#4, DoD-global#5 |
| REQ-060 Compatibility and look | Should | 4 | E02-S01=TASK-2.1, E02-S12=TASK-2.12, E03-S16=TASK-3.16, E03-S19=TASK-3.19, E13-S06=TASK-13.12 |
| REQ-061 Legal and content | Should | 3 | E02-S01=TASK-2.1, E02-S12=TASK-2.12, E02-S14=TASK-2.15, E06-S05=TASK-6.5, E07-S01=TASK-7.2, E07-S05=TASK-7.6, E07-S07=TASK-7.5, E07-S12=TASK-7.10, E07-S14=TASK-7.11, E07-S15=TASK-7.14, E10-S04=TASK-10.3, E10-S06=TASK-10.5, E10-S12=TASK-10.6, E11-S01=TASK-11.1, E12-S01=TASK-12.1, E13-S06=TASK-13.12, E13-S12=TASK-13.11; also DoD-global#9 |
| REQ-062 Headless playtest CLI | Must | 5 | E01-S07=TASK-1.6, E01-S08=TASK-1.8, E01-S09=TASK-1.11, E01-S16=TASK-1.16, E01-S17=TASK-1.17, E06-S06=TASK-6.6, E06-S08=TASK-6.8, E06-S09=TASK-6.11, E06-S10=TASK-6.10, E06-S11=TASK-6.9, E06-S12=TASK-6.12, E07-S13=TASK-7.15 |
| REQ-063 Test commands | Should | 4 | E01-S01=TASK-1.1, E07-S14=TASK-7.11, E13-S06=TASK-13.12, E13-S07=TASK-13.4 |
| REQ-064 Continuous integration and deployment | Should | 4 | E01-S02=TASK-1.7, E01-S08=TASK-1.8, E01-S18=TASK-1.18; also DoD-global#10 |
| REQ-065 Install, offline and updates | Should | 3 | E13-S07=TASK-13.4, E13-S08=TASK-13.8 |
| REQ-066 Card rendering | Must | 4 | E03-S05=TASK-3.5 |
| REQ-067 Table, chips and dealer button art | Should | 4 | E04-S03=TASK-4.4, E13-S06=TASK-13.12 |
| REQ-068 Bet chips in front of players | Should | 3 | E04-S04=TASK-4.5 |
| REQ-069 Speed-aware animation | Should | 4 | E04-S05=TASK-4.6 |
| REQ-070 Bot avatars | Could | 3 | E04-S06=TASK-4.7 |
| REQ-071 Bot banter | Could | 7 | E04-S07=TASK-4.2, E04-S08=TASK-4.8, E12-S07=TASK-12.8 |
| REQ-072 Session clock and pace | Could | 3 | E04-S09=TASK-4.9, E10-S10=TASK-10.11 |

## Where to start

**Ready list** (`backlog task list --ready -l dream-limit-holdem-trainer`): exactly one story.
- `[HIGH] [chore] TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks (ac: 0/8)`

**First 5 stories in build order (ordinal):**
1. **TASK-1.1 (E01-S01)** Bootstrap the strict TypeScript project with one-command checks. The user asked for language, toolchain and test harness first. Every later story is built and checked with these scripts.
2. **TASK-1.7 (E01-S02)** Run every check in GitHub Actions on each push and pull request. CI must exist before the global Definition of Done item "CI green on the story's branch" can apply.
3. **TASK-1.2 (E01-S04)** Rank showdown hands by real poker hand rankings. The hand evaluator underpins both the engine's showdown and the equity calculator.
4. **TASK-7.1 (E07-S02)** Compute a hand's equity against opponent hands. This is the advice engine's numeric core, built directly on the evaluator.
5. **TASK-1.3 (E01-S03)** Deal every hand from a seeded shuffle with a replay code. Seeded, replayable deals make every engine, bot and advice test reproducible.

The milestone exit is M1 (20 stories), which ends with E09-S01 (TASK-9.1), the basic Hand Review panel. That is the first build where the "magic moment" can be seen.

## Deferred, out of scope and waiting room

**Out of scope (requirements.md):**
- Real-money play, online multiplayer, accounts and login, backend server.
- Solver-grade (GTO) strategy (Q-7).
- Interrupting live warnings during play (Q-8).
- Measuring subjective confidence (Q-16).
- No-limit, pot-limit and other poker variants.
- Tournament strategy (ICM, bubble play) in advice: later release (Q-14).
- Drills and quiz mode: later release (Q-18).
- Sound effects and audio settings: phase 2 (Q-70).
- A first-run tour or help page (Q-73: not wanted).

**Waiting room:**
- Hand-history export in a standard text format, and JSON backup/restore (Q-17).
- Replaying a hand with a different decision.
- Estimated cost in bets per mistake (Q-19).
- Uncapped raising heads-up as a table option (Q-20).
- Hand History browser (Q-24).
- Learn and Glossary screens (Q-24).
- Adaptive bots (Q-49).
- Showing amounts in big bets (Q-61).

**Deferred within Release 1 (M3), not in the MVP:**
- **Sit-and-go:** all of E05, plus the sit-and-go parts of Must requirements (REQ-002.6, the sit-and-go part of REQ-044.1, REQ-048.5), by user decision (Q-99).
- **Realistic pace and speed choice:** E03-S18 and E03-S14.
- **Remembered configuration:** REQ-012, including the REQ-005.1 last-used game type.
- **Other M3 items:** the splash, all of E04 presentation, the install/offline/update work in E13, and CI deploy to GitHub Pages (E01-S18).

## Assumptions, risks and open concerns

**Assumptions (requirements.md):**

| ID | Assumption | Owner |
|---|---|---|
| A-1 | Chart plus equity rules give advice good enough to improve a beginner | Claude |
| A-2 | Style-parameterised bots feel realistic and are not trivially exploitable | Claude |
| A-3 | Equity in a Web Worker returns a hint within the NFR limit | Claude |
| A-4 | Browser storage keeps months of history (accepted risk, Q-17) | User |
| A-5 | Nearest-size mapping is acceptable for 3 to 5 and 7 to 8 players | User |

**Risks (vision.md):**
- **R-1 Advice wrong or inconsistent.** Mitigated by golden spots and determinism (REQ-036, REQ-039).
- **R-2 Range modelling is the hardest part.** Mitigated by a documented range model (REQ-035).
- **R-3 Scope overrun.** Mitigated by the walking skeleton and milestones.
- **R-4 Browser data clear wipes history.** Accepted by the user; mitigated by a persistent-storage request (REQ-053.3) and a warning in Settings.
- **R-5 Exploitable bots.** Mitigated by bot-vs-bot playtests and style bands (REQ-028, REQ-030).

**Also from the plan:**
- 34 stories are rated high risk. Most are in the engine (E01), the advice and range model (E07), the bot bands (E06), and the storage and migration work (E13).
- The privacy note from Q-64: free GitHub Pages implies a **public repository**. User data never leaves the device.

**Known open items for the builder (non-blocking, not fixed):**

*From the round-4 re-judge of E01 and E03 (current):*
- MEDIUM J-E01-E01-S07#AC1-placeholder: S07 must print an "invariant-violation count" before the checker exists (E01-S08). Either print a stub 0 or move the count to S08.
- MEDIUM J-E01-E01-S16-multiple-capabilities: E01-S16 (TASK-1.16) bundles button and blind rotation, the `--game sng` playtest mode and the real-stack switch.
- MEDIUM J-E03-E03-S06-stale-engine-reference: TASK-3.7 refers to E01-S12 where it means E01-S14 and lacks an explicit TASK-1.14 dependency. The dependency is satisfied transitively through TASK-1.16.
- MEDIUM J-E03-E03-S19#AC3-undefined-copy-list: AC3 compares labels to "the English copy list for that screen", which does not exist anywhere.
- MEDIUM J-E03-E03-S04-m1-button-movement: M1 auto-deals the next hand, but button and blind rotation (REQ-020) is E01-S16 in M2. There is no interim M1 rule for button movement.
- LOW J-E01-E01-S07#AC6-weak-tag: AC6 is tagged REQ-056.1 but only tests the seat policy.
- LOW J-E03-E03-S01-stale-wave-reference: TASK-3.1 still says "Until Game Config exists (E02, wave 5)". It is still present in the live task.

*From round 3, outside E01 and E03 (not re-judged):*
- MEDIUM J-GLOBAL-milestone-text-stale: **the Backlog milestone descriptions m-1 and m-2 are stale.** m-1 says "every Must requirement" with no sit-and-go carve-out and no Rapid pace. m-2 says "Everything else in baseline v1.0". The backlog CLI cannot edit milestone descriptions. **story-map.md (doc-3) has the current wording and is the reference.**
- MEDIUM J-GLOBAL-M3-priority-drift: 9 of the 66 M3 stories are still High: TASK-2.10, 2.16, 3.18, 5.5, 5.6, 5.10, 6.12, 10.12 and 11.9. The live Backlog confirms this.
- The round-3 MEDIUM J-GLOBAL-story-map-stale-v1.9 appears fixed: story-map.md now states v1.9, 367 clauses and 165 stories. The round-3 MEDIUM on E01-S16 dependencies is resolved per the round-4 summary.
- LOW findings (round 3):
  - E02-S01 tags four requirements (justified as the skeleton).
  - E02-S04#AC4 requires the stake to be retained, which no clause asks for.
  - E02 REQ-005.1 milestone (see Traceability).
  - E04-S09#AC2 needs the E02 resume flow; reword it to a fixture.
  - E04 REQ-071.2 insult check is manual only.
  - E06-S06 is near the size limit.
  - E06-S13 note is stale (refers to E06-S02, should be E06-S18).
  - E06-S18#AC1 is compound.
  - E07-S10 has no multiway value-bet AC.
  - E07-S11 does not state which draws qualify for implied odds (only the flush draw and the open-ended straight draw are named).
  - E08-S01 has 8 ACs.

*Other known items:*
- **Charcoal background hex.** The storyboards use **#0E0F12**, but no requirement states it (REQ-060.3 says only "charcoal"). The builder should take the value from the storyboards or brand.
- **REQ-005.1 last-used game type** arrives in M3 (E02-S10), not in the M2 MVP. The user has not explicitly confirmed this.
- **No round-4 verdict file.** The formal record ends at the round-3 FAIL. The orchestrator's REQ-063.4 tagging was not re-judged.
- **Stale housekeeping in state.json.** `waves_done` lists 1 to 6 (the plan has 7 waves), and `notes` still reads "Stage 3 weave next".

## Artifact index

Dream folder: `/Users/gregwhite/Documents/claudeworkspaces/limitholdem/dreams/limit-holdem-trainer/`

| Path | Contents |
|---|---|
| `vision.md` | Approved vision (G1), with §0 statement, goals, screen inventory, scope, assumptions and risks · Backlog **doc-1** "TLH Trainer — Vision" |
| `requirements.md` | Baseline v1.9: 72 requirements, 367 clauses, Definition of Done, scope, waiting room, change log · Backlog **doc-2** "TLH Trainer — Requirements v1.9" |
| `story-map.md` | Backbone, release slices, grid, walking-skeleton path, waves · Backlog **doc-3** "TLH Trainer — Story map" |
| `journal.md` | Stage-by-stage journal |
| `qa-log.md` | Q-1 to Q-114 |
| `gates.md` | 15 coverage gates |
| `rtm.md` | Clause-level traceability matrix (367/367) |
| `state.json` | Run state (stage: report, baseline 1.9, judge_round 4) |
| `coverage-1.json` … `coverage-4.json` | Mechanical coverage per round |
| `judgment-1.md`, `judgment-2.md`, `judgment-3.md` | Round verdicts (all FAIL); there is no judgment-4.md |
| `judgments/round-1/` … `round-3/` | Per-epic and GLOBAL judge JSON (E01 to E13 + GLOBAL) |
| `judgments/round-4/E01.json`, `E03.json` | Targeted re-judge |
| `plan/map.json` | Epics, milestones, global Definition of Done |
| `plan/epics/E01.json` … `E13.json` | Stories, ACs, Definition of Done, dependencies, risk |
| `plan/id-map.json` | Story key → Backlog task, milestones, docs, archived |
| `plan/weave-plan.json`, `plan/check-plan.json`, `plan/cross-epic-notes.md` | Weave plan, plan check, orchestrator notes |
| `storyboards/*.dc.html`, `storyboards/canvas.json` | 8 screen storyboards (Config, Home, Main, Report, Review, Settings, Stats, Table); live canvas: https://claude.ai/artifact/KjdG7AZdq291WAko7bmZXT |
| `brand/tlh-logo.jpg` | User-supplied logo |
| `report.md` | This report |

Backlog.md (`/Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/`):
- **Label:** `dream-limit-holdem-trainer`
- **Milestones:** m-0 M1 Walking skeleton (0/20 done) · m-1 M2 MVP (0/79) · m-2 M3 Release 1 (0/66)
- **Epics:** TASK-1 to TASK-13
- **Stories:** TASK-n.m (165, in `backlog/tasks/`)
- **Archived:** TASK-10.9 and TASK-10.10 (former E10-S08 and E10-S09) in `backlog/archive/tasks/`
- **Docs:** doc-1, doc-2 and doc-3 under `backlog/docs/dreams/limit-holdem-trainer/`
