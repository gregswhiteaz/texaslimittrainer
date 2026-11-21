File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.25 - Make-the-card-back-logo-check-wait-for-the-image-before-judging-it.md

Task TASK-3.25 - Make the card-back logo check wait for the image before judging it
==================================================

Status: ○ To Do
Priority: High
Ordinal: 211000
Created: 2026-11-21 14:36 (UTC)
Labels: follow-up, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 17 total):
└─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [completed]
   ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │     └─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │        │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │        │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │        │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │        │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │        │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │        │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   ├─ TASK-1.13 - Reject illegal actions without changing the game [completed]
   │  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed]
   │     └─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
   │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed]
   │  ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
   │  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed] (shown above)
   ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
   └─ TASK-1.16 - Move the button and blinds past busted seats [completed]
      ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
      ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
      ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed] (shown above)
      ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed] (shown above)
      └─ TASK-1.15 - Show and muck cards at showdown in casino order [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.17 (judge J-2-01). The locked e2e test e2e/cards.spec.ts:215 'logo check fails when the logo is hidden or does not load' is flaky on WebKit in CI: 2 of 3 attempts on doit/TASK-1.17 (runs 44892551075, 44893582074 attempt 1) reported ['missing'] instead of ['not decoded'] for the broken-image mutant; it passed 20/20 locally and on main CI #125. 'missing' means logoProblems found no image[data-part="logo"] element at all, so the mutation/check likely races the gallery render (openCardGallery waits for any card-back image, then page.evaluate's setAttribute uses ?. and silently no-ops). The user asked for it to be fixed (2026-11-21). Owners of the locked file: TASK-3.5, TASK-3.20, TASK-3.23 — strengthen-only edits.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the card gallery is opened for each logo mutant, When the mutant is applied, Then the test first waits for the logo element and fails loudly if it is missing (no silent ?. no-op), and the broken-image case is judged only after the image has finished decoding or failed
- [ ] #2 Given the fixed test, When it runs 50 times in a row in WebKit and Chromium locally and in one CI run, Then it passes every time, and each of the three mutants still produces exactly its expected problem list

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

