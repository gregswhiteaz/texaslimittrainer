File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.31 - Judge-the-one-action-style-check-only-on-mixed-spots-seen-at-least-10-times.md

Task TASK-6.31 - Judge the one-action style check only on mixed spots seen at least 10 times
==================================================

Status: ◒ In Progress
Priority: Low
Ordinal: 278000
Assignee: @claude
Created: 2026-11-27 22:04 (UTC)
Updated: 2026-11-28 20:12 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doit/TASK-6.30/spec.md, dreams/limit-holdem-trainer/requirements.md

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 16 total):
└─ TASK-6.30 - Decide whether the style check's one-action rule needs a minimum sample for rare mixed spots [completed]
   └─ TASK-7.46 - Bring 3-seat TAG aggression inside its style band and make the short-handed postflop test able to fail [completed]
      └─ TASK-7.37 - Bring short-handed TAG VPIP inside its healthy range at 3 and 4 seats [completed]
         └─ TASK-7.35 - Use the 6-max opponent ranges at 3, 4, 5 and 7 seats [completed]
            └─ TASK-7.26 - Author heads-up and full-ring default opponent ranges [completed]
               ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
               │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
               │     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
               │     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
               │     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
               │     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
               │     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
               │        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
               │           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
               │              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
               │              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
               │                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
               └─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
                  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-6.30 (decision-9: Q-1 B, N = 10). Over 100,000 all-TAG hands at 3 seats (seed 42) TAG preflop-limpers comes up once (recommended 1, alternative 0), so --check-styles exits 1 although every band holds. Apply the REQ-028 fit criterion as reworded by TASK-6.30: a mixed spot is judged only when recommended + alternative >= 10; spots with 1 to 9 decisions keep their Mixed spot line unchanged and get a separate line 'Not judged (fewer than 10 decisions): <style> <spot>'; 0/0 spots pass as today. Change the rule in src/playtest/style-check.ts (formatStyleReport, the oneAction list); no new counter. Locked re-pins, each unlocked under its owner(s): tests/playtest/check-styles.acceptance.test.ts never-mixing case mixedSpots(300) (owners TASK-6.11 and TASK-6.25, unlock under both; unopened is about 8 decisions at 300 hands, so it stops failing; re-pin to enough hands, e.g. 1,000, about 33); tests/playtest/check-styles-three-seats.acceptance.test.ts (owner TASK-7.46; restore exit 0 and Style check: passed). Unlocked: tests/playtest/style-check.test.ts 5/0 and 0/5 cases, usage text in src/playtest/cli.ts:60 and tests/playtest/cli.test.ts:115 and :632. Keep the never-mixing fast test fast. Update the comments in tests/playtest/check-styles-three-seats.acceptance.test.ts:9 and docs/advice/range-model.md:294 to cite the REQ-028 fit criterion, not REQ-027.5. Evidence: doit/TASK-6.30/spec.md section 3.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a --check-styles run where a mixed spot came up 1 to 9 times, When it reports, Then that spot's Mixed spot line is printed unchanged, a separate line "Not judged (fewer than 10 decisions): <style> <spot>" follows the Mixed spot lines, and the spot does not fail the check
- [ ] #2 Given a mixed spot that came up 10 or more times with one count 0, When it reports, Then "One action only: ..." is printed and the run exits 1 (9/0 passes, 10/0 fails, 0/0 passes)
- [ ] #3 Given npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles, When it completes, Then it prints "Style check: passed" with no "One action only" line and exits 0, and tests/playtest/check-styles-three-seats.acceptance.test.ts asserts exit 0 and "Style check: passed" again so its name is accurate (owner TASK-7.46); the "Not judged (fewer than 10 decisions)" line is proven end to end by a fast run that fails today (TASK-6.31 Q-1)
- [ ] #4 Given the locked never-mixing case of tests/playtest/check-styles.acceptance.test.ts (owners TASK-6.11 and TASK-6.25, unlock under both), When it is re-pinned to enough hands that preflop-unopened comes up at least 10 times, Then it still exits 1 with One action only: TAG preflop-unopened, and the 100,000-hand Mixed 6-max slow test still passes on seeds 42, 7 and 1234
- [ ] #5 Given the --check-styles usage text and tests/playtest/cli.test.ts, When --help is shown, Then it states that a mixed spot is judged only when it came up at least 10 times
- [ ] #6 Given docs/stats/style-stats.md and docs/advice/range-model.md, When the story is done, Then they state the 10-decision minimum and that 3-seat --check-styles now exits 0 over 100,000 hands

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC#3 reworded per Q-1 (user 2026-11-28): the 3-seat run already passes on main (TAG preflop-limpers 0/0 since TASK-7.40-7.42), so the Not judged line is proven by a new fast 1,000-hand mixed 6-max test instead.

