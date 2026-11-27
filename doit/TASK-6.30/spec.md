# Spec: TASK-6.30 — Decide whether the style check's one-action rule needs a minimum sample for rare mixed spots

Status: READY (approved 2026-11-27)
Task: TASK-6.30 · Parent/epic: TASK-6 · Requirements: REQ-027.5, REQ-028.3 (fit criterion), REQ-062.1 · Dream: limit-holdem-trainer

## 1. Summary
A decision spike, follow-up from TASK-7.46 Q-2 (doc-185). `--check-styles` exits 1 when any mixed spot used only
one action. Over 100,000 all-TAG hands at 3 seats the TAG `preflop-limpers` spot comes up once (recommended 1,
alternative 0), so the run fails although every band holds. This spec measured how often each mixed spot comes up
per table size over 100,000 hands, and the chance that an honest 75/25 mixing bot shows only one action at a
given count. The user chose Q-1 B with N = 10 (qa.md, 2026-11-27): a mixed spot is judged by the one-action
rule only when it came up at least 10 times in the run; rarer spots are listed on a separate
`Not judged (fewer than 10 decisions): <style> <spot>` line and do not fail the check. This task records that as
decision-9, rewords the REQ-028 fit criterion (changelog row 1.19) and creates one follow-up build story. No
product code changes.

## 2. Scope
- In scope:
  - Record the user's Q-1 answer as one Backlog decision (SPEC-01).
  - Builder: reword the REQ-028 fit criterion and add changelog row 1.19 in `dreams/limit-holdem-trainer/requirements.md` with the exact text in §5 (SPEC-02).
  - Orchestrator (at finish, CLI only): the decision (SPEC-01), the follow-up story (SPEC-04), TASK-6.30
    implementation notes with the evidence (SPEC-03), and tick AC#1 (SPEC-05).
- Not doing:
  - Any change under `src`, `tests`, `e2e`, `tools`, `docs` or `.github`. The rule change, CLI text, test
    re-pins (including `tests/playtest/check-styles-three-seats.acceptance.test.ts`) and docs belong to the
    follow-up.
  - Changing any style band (REQ-027.1 to 027.4), the 75/25 mixing probabilities in `src/bots/styles/tag.json`,
    the bots, or which spots a style marks mixed.
  - Making the 3-seat `preflop-limpers` spot come up more often (bot retune).
  - Changing REQ-027.5 (bands only) or REQ-028.3's statement; only the fit criterion line changes (D-3).
  - Regenerating `dreams/limit-holdem-trainer/rtm.md` (A-2).
  - Any new speed or scale check (standing rule: opt-in `npm run test:slow` only).
- Scope budget: files=1, lines=2   (`requirements.md` only: 1 changed fit-criterion line and 1 new changelog
  row. Backlog files are written by the CLI and not counted.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice> (TASK-6.30 Q-1)" -s accepted --plain`; the evidence tables go in TASK-6.30's implementation notes and final summary, pointing to this spec. | yes | The CLI has no body option; decision-1 to decision-8 used the same path; CLAUDE.md forbids hand-editing decision files. | Edit the decision file by hand (forbidden). |
| A-2 | `rtm.md` is not edited. | yes | TASK-7.29, TASK-3.24 and TASK-7.45 reworded REQs without touching `rtm.md`. | Edit the rtm row here. |
| A-3 | The next changelog row is 1.19, dated the build day. | yes | The last row is 1.18 (`requirements.md:1378`). | n/a |
| A-4 | Figures in §3 come from `npm run playtest` on this branch (base `199dc635`), seed 42, one run per cell; all-TAG runs (no `--lineup`) at 100,000 hands for sizes 2, 3, 4, 6 and 9, Mixed at 100,000 hands for size 6 (the REQ-027 fit criterion), and Mixed at 20,000 hands for sizes 2, 3, 4 and 9 (counts scale about linearly; Mixed at those sizes fails the bands anyway). Probe output lived in the session scratchpad and is not committed. | yes | Task asked to keep 100k runs to a few; only TAG has mixed spots (`src/bots/styles/*.json`), so "per style" is TAG in each line-up. | More seeds or 100k Mixed at every size. |
| A-5 | The false-fail chance of an honest bot at a spot seen n times is 0.75^n + 0.25^n (TAG mixes every mixed spot 75/25, `src/bots/styles/tag.json`). | yes | Binomial; independent draws per decision (REQ-028.1 seeded per hand and seat). | Simulate. |

## 3. Current system
Facts the decision rests on (all opened and checked, or measured per A-4):

- **Where the rule lives.** `formatStyleReport` (`src/playtest/style-check.ts:159-207`) adds
  `One action only: <style> <spot>, recommended <r>, alternative <a>` when exactly one of the two counts is above
  0 (`:195-197`) and then prints `Style check: failed`; the CLI exits 1 (`src/playtest/cli.ts:423`). A spot with
  0/0 passes (TASK-6.11 A-6, `doit/TASK-6.11/spec.md:42`). Counts come from `StyleCheck.add`
  (`src/playtest/style-check.ts:72-131`): preflop decisions in chart cells with an alternative, in spots the style
  marks mixed.
- **Which requirement it implements.** REQ-027.5 (`dreams/limit-holdem-trainer/requirements.md:511`) only says
  the CLI fails when a value is outside its band. The one-action rule comes from REQ-028.3 (`:527`) and its fit
  criterion "harness shows each mixed spot type uses more than one action" (`:528`), wired into `--check-styles` by
  TASK-6.11 AC#4. So a change rewords the REQ-028 fit criterion, not REQ-027.5 (codebase).
- **Who mixes.** Only TAG has mixed spots: `preflop-unopened`, `preflop-limpers`, `preflop-raise`,
  `preflop-raise-and-calls`, `preflop-blind-defence`, each 75% recommended / 25% alternative
  (`src/bots/styles/tag.json`); Calling station, Maniac and Rock list none.
- **Decision-2** judges `--check-styles` over 100,000 hands; REQ-027's fit criterion is
  `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` (`requirements.md:513`), run on seeds
  42, 7 and 1234 by `.github/workflows/style-bands.yml:22-26` and by the slow test
  `tests/playtest/check-styles.acceptance.test.ts:380-430`.

### Measured: mixed-spot counts (recommended / alternative), seed 42
All-TAG (no `--lineup`), 100,000 hands:

| Size | unopened | limpers | raise | raise-and-calls | blind-defence | exit |
|---|---|---|---|---|---|---|
| 2 | 2066 / 692 | 204 / 63 | 0 / 0 | 0 / 0 | 1265 / 454 | 1 (VPIP, PFR, aggression outside: bands are 6-max targets) |
| 3 | 5193 / 1747 | **1 / 0** | 0 / 0 | 0 / 0 | 3950 / 1360 | **1 (only `One action only: TAG preflop-limpers`)** |
| 4 | 7000 / 2298 | 0 / 0 | 649 / 210 | 0 / 0 | 5347 / 1792 | 0 |
| 6 | 8986 / 2941 | 59 / 19 | 1948 / 662 | 28 / 5 | 6835 / 2353 | 0 |
| 9 | 6743 / 2217 | 8 / 2 | 1708 / 591 | 35 / 12 | 2012 / 711 | 1 (VPIP, PFR outside: bands are 6-max targets) |

Mixed line-up:

| Size, hands | unopened | limpers | raise | raise-and-calls | blind-defence | exit (why) |
|---|---|---|---|---|---|---|
| 6, 100,000 (fit criterion) | 2699 / 894 | 333 / 99 | 695 / 248 | **10 / 3** | 1948 / 700 | 0 (passed) |
| 2, 20,000 | 227 / 59 | 24 / 2 | 0 / 0 | 0 / 0 | 122 / 44 | 1 (TAG VPIP, PFR, aggression outside) |
| 3, 20,000 | 337 / 97 | 89 / 29 | 0 / 0 | 0 / 0 | 186 / 56 | 1 (TAG and Calling station aggression outside) |
| 4, 20,000 | 310 / 110 | 30 / 14 | 37 / 11 | 0 / 0 | 318 / 102 | 1 (Maniac aggression 85.3 outside) |
| 9, 20,000 | 209 / 59 | 25 / 16 | 79 / 38 | 14 / 3 | 71 / 19 | 1 (TAG and Rock VPIP, PFR outside) |

Reading: in the all-TAG runs a spot is either common (hundreds to thousands) or almost absent (0 or 1); the only
100,000-hand one-action failure is the 3-seat `preflop-limpers` 1/0. Mixed at sizes other than 6 already fails
the bands (the bands are 6-max targets), so the one-action rule is not what blocks those runs.

### Measured: chance an honest 75/25 bot shows one action at a spot seen n times (A-5)
| n | 1 | 2 | 5 | 8 | 10 | 16 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|---|---|
| P(one action) | 100% | 62.5% | 23.8% | 10.0% | 5.6% | 1.0% | 0.32% | 0.08% | 0.02% |

A bot that never mixes fails at any n ≥ 1, so a minimum sample N only stops judging spots seen fewer than N times.

### Short runs (6-max Mixed, seed 42)
- 300 hands: unopened 6/2, limpers 0/0, raise 4/1, raise-and-calls 0/0, blind-defence 6/3 (passes the one-action
  rule by luck; fails a band).
- 1,000 hands: unopened 25/8, limpers 2/0, raise 10/4, raise-and-calls 1/0, blind-defence 21/11: two
  `One action only` lines.

### The chosen rule, measured (Q-1 B, N = 10)
A spot is judged only when recommended + alternative ≥ 10; below 10 it is listed but not judged. N came from the
data:
- The smallest spot in the REQ-027 fit-criterion run (6-max Mixed 100k, seed 42) is `preflop-raise-and-calls`
  with 13 decisions, so N = 10 keeps every fit-criterion spot judged and, at 100,000 hands, excludes only
  all-TAG 3-seat `preflop-limpers` (1). The honest false-fail chance for a spot seen 10 to 13 times is 2.4% to
  5.6%, the same as today for those spots; nothing gets noisier than today.
- N = 20 (measured for comparison, not chosen) would also exclude all-TAG 9-seat `preflop-limpers` (10) and the
  fit-criterion run's `preflop-raise-and-calls` (13), so the CI workflow would stop checking that spot.
- A never-mixing bot is still caught at every common spot (hundreds to thousands of decisions at every size).

Excluded at 100,000 hands, seed 42 (0/0 spots are not counted: they pass today and still pass):

| N | all-TAG 2 | all-TAG 3 | all-TAG 4 | all-TAG 6 | all-TAG 9 | Mixed 6 |
|---|---|---|---|---|---|---|
| 10 (chosen) | none | limpers (1) | none | none | none | none |
| 20 | none | limpers (1) | none | none | limpers (10) | raise-and-calls (13) |

### What the change touches (for the follow-up)
- `src/playtest/style-check.ts:193-197` (the rule) and the `MixedCounts` report; `src/playtest/cli.ts:60` usage
  text "every mixed spot used both actions" (asserted by `tests/playtest/cli.test.ts:115` and `:632`, unlocked).
- Locked `tests/playtest/check-styles.acceptance.test.ts` (TASK-6.11): the `mixedSpots(300)` case (`:241-272`,
  `:358-361`) runs a never-mixing TAG over 300 6-max Mixed hands and expects
  `One action only: TAG preflop-unopened, recommended \d+, alternative 0`. Unopened comes up about 8 times in 300
  hands, so with N = 10 that case no longer fails and must be re-pinned (e.g. 1,000 hands, about
  33 unopened decisions; the slow twin `mixedSpots(1000)` at `:363-366` survives). Its regex on `Mixed spot:` lines
  (`:252-254`) requires the line to end with `alternative \d+`, so the "Not judged" note is a separate line, not a
  suffix (as the user approved).
- Unlocked `tests/playtest/style-check.test.ts:262-272` asserts 5/0 and 0/5 fail: re-pin to 10/0 and 0/10 (and add 9/0 passes).
- Locked `tests/playtest/check-styles-three-seats.acceptance.test.ts` (TASK-7.46): restore
  `expect(code).toBe(0)` and `Style check: passed`, so its name ("passes --check-styles") is accurate again.
- Docs: `docs/stats/style-stats.md:78-85` and `docs/advice/range-model.md:293-297`.

- Existing code to reuse (for the follow-up, not this task):
  - `src/playtest/style-check.ts` `MixedCounts` and the `oneAction` list → add the N test there; no new counter.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The one-action rule judges a mixed spot only when it came up at least 10 times (recommended + alternative ≥ 10); spots with 1 to 9 decisions are listed on a separate `Not judged (fewer than 10 decisions): <style> <spot>` line and do not fail the check. | Keep the rule; N = 20; rule only at 6 seats; share-of-decisions threshold | Fixes the 3-seat 1/0 failure, keeps every spot of the REQ-027 fit-criterion run judged (smallest 13), adds no noise over today | yes | user (Q-1) |
| D-2 | This task records the decision and any REQ change; code, CLI text, docs and test re-pins go to one follow-up story. | Implement in this spike | Spike scope (task labels); TASK-7.45 D-2 pattern | no | n/a (task text) |
| D-3 | The change rewords the REQ-028 fit criterion (the rule's source); REQ-027.5 is unchanged. | Reword REQ-027.5 | §3 "Which requirement it implements" | no | n/a (codebase) |

## 5. Design

### Files to create / modify
- `dreams/limit-holdem-trainer/requirements.md` — replace the REQ-028 fit criterion
  (line 528) and append changelog row 1.19 after line 1378, with the exact text below (SPEC-02).

### Components, interfaces and data
None changed in this task (D-2).

### Requirement text (SPEC-02, exact)
- REQ-028 fit criterion, line 528, becomes:
  `- Fit criterion: Replay test over 1,000 recorded hands reproduces identical action sequences; harness shows each mixed spot type that came up at least 10 times in the run uses more than one action.`
- New last line of the changelog table, after line 1378 (date = build day, A-3):
  `| 1.19 | 2026-11-27 | TASK-6.30: REQ-028 fit criterion judges a mixed spot's one-action rule only when the spot came up at least 10 times in the run; rarer spots are listed as not judged | User (TASK-6.30 Q-1) |`

### Follow-up story (created by the orchestrator at finish; SPEC-04)
Command: `backlog task create "<title>" -p TASK-6 -l dream-limit-holdem-trainer,follow-up -m m-1 --priority Low
--ref doit/TASK-6.30/spec.md --ref dreams/limit-holdem-trainer/requirements.md -d "<description>" --ac "<AC>" ...
--dep TASK-6.30 --plain`, each AC its own `--ac`.

- Title: `Judge the one-action style check only on mixed spots seen at least 10 times`
- Description: "Follow-up from TASK-6.30 (decision-9: Q-1 B, N = 10). Over 100,000 all-TAG hands at 3 seats
  (seed 42) TAG preflop-limpers comes up once (recommended 1, alternative 0), so --check-styles exits 1 although
  every band holds. Apply the REQ-028 fit criterion as reworded by TASK-6.30: a mixed spot is judged only when
  recommended + alternative >= 10; spots with 1 to 9 decisions keep their Mixed spot line unchanged and get a
  separate line 'Not judged (fewer than 10 decisions): <style> <spot>'; 0/0 spots pass as today. Change the rule
  in src/playtest/style-check.ts (formatStyleReport, the oneAction list); no new counter. Locked re-pins, each
  unlocked under its owner: tests/playtest/check-styles.acceptance.test.ts never-mixing case mixedSpots(300)
  (owner TASK-6.11; unopened is about 8 decisions at 300 hands, so it stops failing; re-pin to enough hands, e.g.
  1,000, about 33); tests/playtest/check-styles-three-seats.acceptance.test.ts (owner TASK-7.46; restore exit 0
  and Style check: passed). Unlocked: tests/playtest/style-check.test.ts 5/0 and 0/5 cases, usage text in
  src/playtest/cli.ts:60 and tests/playtest/cli.test.ts:115 and :632. Keep the never-mixing fast test fast.
  Evidence: doit/TASK-6.30/spec.md section 3."
- ACs:
  1. `Given a --check-styles run where a mixed spot came up 1 to 9 times, When it reports, Then that spot's Mixed spot line is printed unchanged, a separate line "Not judged (fewer than 10 decisions): <style> <spot>" follows the Mixed spot lines, and the spot does not fail the check`
  2. `Given a mixed spot that came up 10 or more times with one count 0, When it reports, Then "One action only: ..." is printed and the run exits 1 (9/0 passes, 10/0 fails, 0/0 passes)`
  3. `Given npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles, When it completes, Then it prints "Not judged (fewer than 10 decisions): TAG preflop-limpers" and "Style check: passed" and exits 0, and tests/playtest/check-styles-three-seats.acceptance.test.ts asserts exit 0 again so its name is accurate (owner TASK-7.46)`
  4. `Given the locked never-mixing case of tests/playtest/check-styles.acceptance.test.ts (owner TASK-6.11), When it is re-pinned to enough hands that preflop-unopened comes up at least 10 times, Then it still exits 1 with One action only: TAG preflop-unopened, and the 100,000-hand Mixed 6-max slow test still passes on seeds 42, 7 and 1234`
  5. `Given the --check-styles usage text and tests/playtest/cli.test.ts, When --help is shown, Then it states that a mixed spot is judged only when it came up at least 10 times`
  6. `Given docs/stats/style-stats.md and docs/advice/range-model.md, When the story is done, Then they state the 10-decision minimum and that 3-seat --check-styles now exits 0 over 100,000 hands`

### Rules and algorithms
- Worked: 3-seat all-TAG 100k: limpers 1 + 0 = 1 < 10 → not judged; unopened 5193 + 1747 ≥ 10 → judged, both
  above 0 → passes; exit 0. 6-max Mixed 100k: raise-and-calls 10 + 3 = 13 ≥ 10 → judged, passes. 6-max Mixed
  1,000 hands: limpers 2/0 and raise-and-calls 1/0 are not judged, so today's two short-run `One action only`
  lines go away. Never-mixing TAG over 1,000 6-max Mixed hands: unopened about 33/0 ≥ 10 → fails.

### Error handling and configuration
N/A. No code changes in this task.

## 6. Behaviour specification

### SPEC-01: The user's choice is a Backlog decision
- Verifies: AC#1
- Behaviour: Given Q-1 B, When the orchestrator runs
  `backlog decision create "Style check: judge the one-action rule only on mixed spots seen at least 10 times; rarer spots listed as not judged (TASK-6.30 Q-1)" -s accepted --plain`
  (A-1), Then `backlog decision list --plain` shows it (expected
  decision-9) with status accepted.
- Verification: command `backlog decision list --plain`

### SPEC-02: The requirement carries the chosen rule
- Verifies: AC#1
- Behaviour: Given Q-1 B, When the build edits `requirements.md`, Then the REQ-028 fit criterion line reads
  exactly as in §5 "Requirement text", row 1.19 with that exact text is the changelog's last row, and no other
  line changes (diff: 1 changed, 1 added; REQ-027.5 and REQ-028.3 untouched).
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: No product code changes and the evidence is on the task
- Verifies: AC#1
- Behaviour: Given the decision, When the task is done, Then no file under `src`, `tests`, `tools`, `e2e`, `docs`
  or `.github` has changed (D-2), and TASK-6.30's implementation notes (`backlog task edit TASK-6.30
  --append-notes`) state the Q-1 B answer and the key numbers: 3-seat all-TAG 100k limpers 1/0; P(one action) 5.6% at n = 10;
  fit-criterion minimum spot 13 decisions; at 100,000 hands N = 10 excludes only 3-seat limpers; pointing to this spec's §3.
- Verification: command `git diff --stat main -- src tests tools e2e docs .github`

### SPEC-04: The change becomes one follow-up story
- Verifies: AC#1
- Behaviour: Given Q-1 B, When the orchestrator creates the story exactly as in §5 "Follow-up story" (title,
  description, ACs, labels, milestone, references, dependency), Then `backlog task list --parent TASK-6 --plain`
  lists it, it depends on TASK-6.30, its ACs restore the exit-0 check in
  `tests/playtest/check-styles-three-seats.acceptance.test.ts` (owner TASK-7.46) and re-pin the never-mixing case
  (owner TASK-6.11), and they cover the report line, the usage text and the docs.
- Verification: command `backlog task list --parent TASK-6 --plain`

### SPEC-05: AC#1 is ticked with pointers
- Verifies: AC#1
- Behaviour: Given SPEC-01 to SPEC-04, When the task finishes, Then the orchestrator checks AC#1 (`backlog task
  edit TASK-6.30 --check-ac 1`), and the final summary cites the decision id, the follow-up story id and the
  REQ-028 fit-criterion change (changelog 1.19).
- Verification: command `backlog task view TASK-6.30 --plain`

## 7. Edge cases
- A spot with 0 decisions: passes today and still passes (TASK-6.11 A-6).
- A spot just at N: 9/0 passes, 10/0 fails (follow-up AC#2).
- A never-mixing bot: caught at every spot seen ≥ N times; the locked TASK-6.11 never-mixing case needs
  more hands (§3).
- Other cases (input, concurrency, permissions): N/A. No code runs.

## 8. Security considerations
N/A. No code, input, dependency, persisted-format or randomness change here; the follow-up changes only CLI report
logic and text.

## 9. Non-functional
N/A for this task. The follow-up adds one comparison per mixed spot. If the locked never-mixing case moves from
300 to 1,000 hands it adds a few seconds to `npm test` (fast tests must stay fast; standing CI-speed rule).

## 10. Test plan
- Test command: `npm test` (unchanged by this task)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles` (reproduces the 1/0
  limpers line and exit 1; about 70 s)
- New tests: none. SPEC-01, SPEC-04, SPEC-05 are orchestrator CLI steps; SPEC-02 and SPEC-03 are diffs. For the
  Judge: run the command above and confirm `Mixed spot: TAG preflop-limpers, recommended 1, alternative 0` and
  exit 1; confirm 0.75^10 + 0.25^10 = 0.056 and 0.75^20 + 0.25^20 = 0.0032; then check SPEC-01 to SPEC-05.

## 11. Open questions
None. Q-1 was answered on 2026-11-27 (`doit/TASK-6.30/qa.md`: B, N = 10, with the report line); Q-2 is moot. Both
are folded into D-1, §5 and SPEC-01 to SPEC-05.

## 12. Clarifications log
See `doit/TASK-6.30/qa.md`.
