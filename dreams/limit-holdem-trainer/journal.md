# Journal — Limit Hold'em Trainer

## Setup — 2026-11-17
- Seed idea (verbatim): "I wnt to build a Texas Limit Hold Em training application so I can practice playing real Texas Limit Hold Em and get advice on my play style.  First thing's first, we'll need to decide on a programming language, then the test harness and headless playtest harness.  What language do you think we should use?"
- Environment: backlog CLI present, backlog/ initialised and empty. Toolchains available: Python 3.14.7, Node 22.18.0, Rust (cargo). No Go.
- Slug: limit-holdem-trainer

## Interrogate — language decision — 2026-11-17
- Compared TypeScript, Python, Rust, Java 21. Java's downside was needing a second language for a browser UI (or dated JavaFX).
- Decision (user): TypeScript, one language only — "I'd rather not have the complexity of two languages."
- Open: launch mode (localhost URL vs installable app window), test stack confirmation, headless harness shape.
- Q-2: installable PWA, no backend. Q-3: toolchain approved (Vite, Vitest, fast-check, tsx headless CLI, Playwright later, ESLint/Prettier). Q-4: React. Q-5: single user, no accounts.
- Next: vision core — game format, advice source of truth, advice timing, user's skill level.

## Interrogate — product shape — 2026-11-17
- Q-6..Q-17: configurable 2–10 seats; advice = preflop charts + equity math (rules-based, explainable); advice timing = post-hand review + hint on request + session play-style report (no interrupting warnings); user knows rules, little strategy; 3 tuned sizes (HU, 6-max, full ring), others nearest+flagged (Claude pushback accepted); cash + basic SNG (cash-style advice, ICM later); mixed bot styles; success = mistakes/100 down, BB/100 vs same line-up up, style stats in healthy range; confidence not measured; fast pace w/ realistic option; no export/backup in v1 (risk accepted).
- Divergent methods performed: Pre-mortem (surfaced: advice trust/consistency, exploitable bots, tedium, data loss, scope overrun) and Stakeholder round table (future casino player → real conventions; coach → standard HH export (declined for v1); building agents → pure seeded engine).

## Interrogate — screens — 2026-11-17
- User raised storyboarding before G1 (Q-22). Agreed: screen inventory + flow added to vision §4a now; detailed storyboards per screen in Stage 2, produced as a visual low-fi mockups page + text specs (Q-25).
- v1 screens: Splash, Home, Game Config, Table, Hand Review side panel (Q-23), Session Report, Statistics/Progress, Settings.
- Hand History browser and Learn/Glossary → waiting room (Q-24, not selected by user).
- Also Q-18..Q-21: drills later; severity grading; cap bet+3 raises always; magic moment = seeing why I lost a hand.

## G1 — 2026-11-17
- User requested a vision statement before approving; Claude wrote §0 (purpose, rough look, 7 key principles).
- Vision APPROVED by user ("Vision Approved"), including proposed G-2..G-4 targets and 8-screen inventory.
- Artifacts: vision.md. Q&A: Q-1..Q-26.

## Solidify — storyboards v1 — 2026-11-17
- Stage 2 started. gates.md created (initial scores).
- Built low-fidelity clickable storyboards for all 8 screens on a Design canvas: https://claude.ai/artifact/KjdG7AZdq291WAko7bmZXT (source copy in dreams/limit-holdem-trainer/storyboards/).
- Each screen has a sticky of open questions (25 total) to resolve during the area-by-area requirements work.
- Sample data only; healthy stat ranges are placeholders pending strategy content.
- Q-27: logo supplied; app named TLH Trainer; logo placed on Splash (black background, red loading bar) and Home header.
- Q-28/Q-29: branded dark theme (charcoal, red accent, navy/silver), classic green felt. All 8 storyboards restyled. Grade colours: Good blue, Minor amber, Major dark red (always with text labels). Note: vision §0 "calm … rather than casino-flashy" is now read as "branded dark, uncluttered" — reflect in requirements look-and-feel NFR.

## Solidify — Area 1 drafted — 2026-11-17
- Q-30..Q-42 answered (hint style, style labels, review auto-open, no mucked-card reveal, stakes, buy-in, SNG, presets, blinds, bot bust, SNG payout, label renames).
- requirements.md created; Area 1 'Set up a session' drafted as REQ-001..REQ-012 (Proposed). lint: 0 errors.
- Storyboards updated: Rapid speed label, Correct grade label.

## Solidify — Area 2 — 2026-11-17
- Q-44..Q-47: simplified moving button; no Fold when check free; no keyboard shortcuts; replay code in review.
- REQ-013..REQ-025 drafted and Confirmed (Q-48). Must ratio 76% so far — rebalance after later areas.

## Solidify — Area 3 — 2026-11-17
- Q-49..Q-51: fixed styles, HUD on hover/tap, TAG solid winner. REQ-026..REQ-031 Confirmed (Q-52). Adaptive bots → waiting room.

## Solidify — Area 4 — 2026-11-17
- Q-53..Q-56 answered; REQ-032..REQ-041 Confirmed (Q-57).

## Solidify — Areas 5–8 — 2026-11-17
- Q-58..Q-61 answered; REQ-042..REQ-051 Confirmed (Q-62). Big-bets display option → waiting room.

## Solidify — cross-cutting — 2026-11-17
- Q-63..Q-65: Mac desktop Chrome/Safari ≥1280×720; GitHub Pages hosting (public repo); Git + GitHub Actions CI.
- REQ-052..REQ-065 (Data, NFR, Operations) + DoD Confirmed (Q-66). REQ-011, REQ-065 demoted to Should → Must 39/65 (60%).

## Solidify — self-review and pre-baseline — 2026-11-17
- Three-reviewer self-review found 3 gaps; user accepted all fixes (Q-67): REQ-007.6, REQ-008.9, REQ-009.6, REQ-048.8, REQ-050.7.
- gates.md: all 15 gates Clear (backup and telemetry N/A with reasons). TBD register empty.
- lint-req --final: 65 requirements, 289 clauses, 0 errors, 0 warnings. Priorities: Must 39, Should 24, Could 2.

## Solidify — presentation gap — 2026-11-17
- User asked whether artwork (cards, tabletop) and sound were covered — they were not. Added Area 11 (REQ-066..REQ-072): big-index SVG cards, code-drawn table/chips, bet chips, speed-aware animation, initials avatars, bot banter, session clock. Sound → phase 2. No onboarding (user choice). Confirmed (Q-75).

## G2 — 2026-11-17
- Requirements baseline v1.0 APPROVED by user. 72 requirements (Must 40, Should 26, Could 6), 315 clauses, 11 areas + NFR. Q&A Q-1..Q-76. Stages 3–5 now run automatically.

## Weave — MAP — 2026-11-17
- MAP weaver: 13 epics, 3 milestones (M1 skeleton, M2 MVP, M3 Release 1), 6 waves (E01 → E07 → E06 → E03 → {E02,E04,E08,E09,E10} → {E05,E11,E12,E13}); 315/315 clauses assigned; check-map clean (verified). No requirement questions.

## Weave — wave 1 — 2026-11-17
- E01 written: 18 stories (M1 8, M2 9, M3 1); all 50 E01 clauses covered. Weaver questions resolved by orchestrator (not user-owned): REQ-056.2 line-up coverage → E06 extends 1M run; toolchain/CI High priority per user's explicit 'toolchain first'. Cross-epic notes in plan/cross-epic-notes.md.

## Weave — wave 2 — 2026-11-17
- E07 written: 17 stories (M1 4, M2 11, M3 2); 44 clauses covered. Three user-owned requirement questions answered (Q-77..Q-79) → baseline v1.1 (+3 clauses: REQ-032.6, 038.6 → E07; 027.6 → E06). Requirements doc re-published.

## Weave — wave 3 — 2026-11-17
- E06 written: 14 stories (M1 1, M2 10, M3 3). User answered 3 questions (Q-80..Q-82) → baseline v1.2 (+REQ-007.7, 009.7, 029.2 → E06).

## Weave — wave 4 — 2026-11-17
- E03 written: 17 stories (M1 5, M2 7, M3 5). Q-83 → REQ-004.7 (→ E10), baseline v1.3.
- Wave 5: E04 written — 9 stories, all M3 (no Must clauses).

## Weave — wave 5 — 2026-11-17
- E02 13 stories, E04 9, E08 4, E09 9, E10 11. 8 user-owned questions answered (Q-84..Q-91) → baseline v1.4 (+14 clauses, REQ-012.1 edited).

## Weave — wave 6 — 2026-11-17
- E05 7 stories, E11 12, E12 9, E13 12. Total 153 stories; merge 0 errors before v1.5. Q-92..Q-96 → baseline v1.5 (+9 clauses, 344 total).
- Editorial correction: REQ-048.9 unit 'per 100 unhinted decisions' → 'per 100 hands, counting only unhinted decisions' (Claude wording error; matches approved G-2).

## Weave — apply — 2026-11-17
- merge: 13 epics, 155 stories, 344/344 clauses, 0 errors, 19 warnings (C5-AND false positives on 'sit-and-go'; C3-NOM1 intended).
- apply: 171 Backlog items created (3 milestones + 13 epics + 155 stories). Story map published.

## Judge — round 1 — 2026-11-17
- Mechanical: 344/344, 0 errors. Verdict FAIL: CRITICAL 1 (E03 REQ-024.4 partial), HIGH ~13 (mostly hidden dependencies/ordering; E03 REQ-011.2 randomness; E13 Safari install), no missing clauses.
- 8 user-owned questions answered (Q-97..Q-104) → baseline v1.6 (+10 clauses, 3 rewordings). Vision labels updated editorially.
- Global DoD items scoped to when their tooling exists (golden suite, playtest, axe in E01-S01, CI).
- Orchestrator re-sequencing (fix for E02-S09 → E10-S01 same-wave hidden dependency): E10 stays wave 5; E02 → wave 6; E05, E11, E12, E13 → wave 7. Home snapshot clauses (REQ-003.*) and REQ-044.7 moved from E10 to E02 (E10-S08/S09 to be retired, replaced by E02 stories).

## Weave — REVISE round 1 — 2026-11-17
- All 13 epics revised: 164 stories, 352/352, merge 0 errors. Orchestrator wired E05-S08→E02-S16, E10-S04→E06-S17. E10-S08/S09 retired (to be archived on apply); E02-S14..S17, E03-S18/S19, E05-S10/S11, E06-S15..S17 added.
- 8 more user questions (Q-105..Q-112) → baseline v1.7 (+13 clauses, 365 total).

## Judge — round 2 — 2026-11-17
- 365/365, 0 mechanical errors. Verdict FAIL: CRITICAL 0, HIGH 4 (E01-S07/S08 M1 playtest needs cap/all-in; E12-S01#AC4, E12-S08#AC6, E13-S04#AC1 hidden deps). Q-113 → v1.8 (+REQ-007.8). Round 3 = last automatic round.

## Weave — REVISE round 2 — 2026-11-17
- All round-2 HIGH/MEDIUM fixed; story-map.md regenerated; global DoD gained offline item; E06-S18 added; Q-114 → v1.9 (+REQ-033.7).

## Judge — round 3 — 2026-11-17
- 367/367, 0 mechanical errors. CRITICAL 0, HIGH 2 (both weaver-owned hidden dependencies: E03-S09#AC5 needs E07-S08; E01-S12 real-stack switch needs S13/S14/S16). All other epics 0 HIGH; E05, E10, E11, E12, E13 zero findings.

## Judge — round 4 (targeted, user-approved) — 2026-11-17
- User chose "apply the 2 fixes, then finish" after round 3 (no full 4th round).
- Fixes: E03-S09 → depends on E07-S08; E01 real-stack switch moved to E01-S16 (depends on S13/S14/S15).
- Targeted re-judge of E01 + E03: all three round-3 HIGH resolved, no cycles. New HIGH: REQ-063.4 partial (PWA build) — resolved by orchestrator by tagging E13-S06 AC1/AC3 and E13-S07 AC1/AC4 (manifest, head links, service worker, precache), which already verify the PWA build output.
- Remaining non-blocking: E01 MEDIUM×2 (S07#AC1 placeholder count before checker; S16 bundles 3 capabilities), E03 MEDIUM×3 (S06 stale engine reference; S19 "English copy list" undefined; M1 button movement interim rule), LOWs. Milestone descriptions in Backlog are stale (CLI cannot edit milestone descriptions); story-map doc is current.
- Final: 165 stories, 367/367 clauses, 0 mechanical errors. Stage → report.

## Report — 2026-11-17
- Diarist wrote report.md; published to Backlog. Stage done.
