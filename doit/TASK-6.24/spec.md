# Spec: TASK-6.24 — Decide TAG aggression headroom against its 65% band ceiling

Status: READY (approved 2026-11-26)
Task: TASK-6.24 · Parent/epic: TASK-6 · Requirements: REQ-027.1, REQ-027.5, REQ-026.1, REQ-062.1 · Dream: limit-holdem-trainer

## 1. Summary
REQ-027.1 sets TAG's aggression band at 45–65%. The task text said TAG measured 63.5–64.2% over 100,000 hands and
that 2,000-hand `--check-styles` runs read 67.2% and failed. Several advice and bot changes have landed since then
(TASK-7.32, 7.26/7.35, 7.28, 6.25), so this spec measured TAG again on today's code (§3, "Measurements"). The user
chose option B (Q-1): keep the 45–65% band and document that `--check-styles` is judged over 100,000 hands. This
task records that decision and creates the follow-up story that does the documentation work. It changes no project
files, so **no builder run is needed**: every SPEC item is an orchestrator step done with the Backlog CLI.

## 2. Scope
- In scope (builder): nothing. No builder run is needed (D-1, Q-1 = B).
- In scope (orchestrator, Backlog CLI at finish, because builders don't edit Backlog):
  - Record the decision on TASK-6.24: implementation notes with the measurement table from §3, and a final summary
    citing Q-1 (SPEC-01).
  - One Backlog decision, `backlog decision create "<title>" -s accepted` (SPEC-02).
  - The follow-up story, with the exact title, description and ACs given in §5 "Follow-up story" (SPEC-04).
- Not doing:
  - Changing `src/playtest/style-check.ts` `STYLE_BANDS`, the CLI help text, docs, TAG's style file, the advice
    engine, `requirements.md` or any test. The help text, docs and test changes belong to the follow-up story.
  - Changing any other style's band, or the 6-max healthy ranges (`docs/stats/healthy-ranges.md:25`, aggression
    50–66).
  - Fixing the short-run failures caused by mixed spots used only one way, or by the Rock/TAG PFR floors (see
    scope concerns). The decision only notes them.
  - Any new speed or scale check. If the follow-up adds one, it goes in the opt-in slow group (`npm run test:slow`)
    and never in `npm test` or CI.
- Scope budget: files=0, lines=0   (option B changes no project file in this task. Backlog steps are orchestrator
  CLI actions and do not count.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice>" -s accepted`. The rationale and measurements go in TASK-6.24's implementation notes and final summary, because the CLI has no body option (`backlog decision create --help`: only `--status`, `--plain`). | yes | Same path TASK-6.20 used (`backlog/decisions/decision-1 - ….md`). CLAUDE.md forbids editing decision files by hand. | Edit the decision file by hand (forbidden). |
| A-2 | "All-TAG" means a playtest with no `--lineup`. In that mode every seat plays TAG (`src/playtest/cli.ts:59`). | yes | That is the only all-TAG mode the CLI offers. | none |
| A-3 | Short-run spread is measured with 20 seeds (1–20) at 2,000 hands for each line-up, run one at a time. | yes | Enough to show the typical range. Each run takes about 2–3 s. | More seeds or other lengths. |
| A-4 | The near-floor readings (Mixed 100k TAG PFR 14.6% vs floor 14%; Rock VPIP 8.7% vs floor 8%) are recorded as a note in the decision summary and in the follow-up story's description, not as a separate task. | yes | Both pass at 100k, where REQ-027 is judged; they fail only in 2k runs, which is exactly the sample-noise case option B documents. A tuning task would be warranted only if a 100k run misses a band. | Open a separate spike to add headroom to those floors. |

## 3. Current system

### Measurements (today's code, branch `doit/TASK-6.24` = main `a08251c`, run 2026-11-26, nothing else running)
Bands are from REQ-027.1 (`dreams/limit-holdem-trainer/requirements.md:507`): TAG VPIP 18–26%, PFR 14–22%,
aggression 45–65%.

**100,000 hands, seed 42, 6-max cash, `--check-styles`:**

| Run | TAG VPIP | TAG PFR | TAG aggression | Room below 65% | Style check | Time |
|---|---|---|---|---|---|---|
| All-TAG (`--hands 100000 --check-styles`) | 22.2% | 16.2% | **64.3%** | 0.7 pts | passed (exit 0) | 1 min 49 s |
| Mixed (`--lineup mixed`), the REQ-027 setting | 20.4% | **14.6%** | **59.5%** | 5.5 pts | passed (exit 0) | 3 min 13 s |

In the Mixed 100k run the other styles were: Calling station 60.5/7.2/18.7, Maniac 56.1/53.2/82.3, Rock
**8.7**/7.2/50.0 (VPIP/PFR/aggression %), all inside their bands.

**2,000 hands, seeds 1–20, `--check-styles`:**

| Line-up | TAG aggression range (mean) | Runs with TAG aggression > 65% | Runs failing the style check | Why they failed |
|---|---|---|---|---|
| All-TAG | 63.2–64.9% (64.3) | **0 / 20** | 20 / 20 | Every one: "One action only" on a rare mixed spot (`preflop-limpers` or `preflop-raise-and-calls`, 0–3 hands each). No band was missed. |
| Mixed | 54.3–63.6% (59.2) | **0 / 20** | 12 / 20 | 7 from "One action only". Band misses: Rock VPIP 7.7–7.9% (5 seeds, floor 8%), TAG PFR 13.7/13.9% (seeds 20 and 5, floor 14%), Rock aggression 56.1/56.2% (seeds 9 and 10, ceiling 55%). |

What the numbers show:
- TAG aggression does not fail any short run today. The task's 67.2% reading came from older code.
- Where REQ-027 applies (Mixed line-up, `requirements.md:505,513`), TAG aggression has 5.5 points of room.
- In all-TAG runs it sits 0.1–1.8 points under the ceiling. Those runs are outside REQ-027's statement, but
  `--check-styles` still applies the same bands to them (`src/playtest/cli.ts:60`).
- Short runs fail for other sample-size reasons. Rare mixed spots get used only one way
  (`src/playtest/style-check.ts:169-196`), and other stats sit close to their floors (Rock VPIP, TAG PFR).
- Raw output is in the scratchpad (`tag100k.txt`, `mixed100k.txt`, `short.txt` (all-TAG part), `shortmixed.txt`).
  The orchestrator copies the tables above into the task notes.

### Code facts
- Bands live in `src/playtest/style-check.ts:29-34` (`STYLE_BANDS`, inclusive, compared after rounding to 0.1,
  `docs/stats/style-stats.md:78-81`).
  - The slow test keeps its own copy (`tests/bots/style-bands.acceptance.test.ts:25-30`). It runs 100k Mixed hands
    for seeds 42, 7 and 1234, only with `TLH_SLOW_TESTS=1` (`:13,99-110`).
- `--check-styles` fails on any band miss *or* any mixed spot used only one way (`src/playtest/style-check.ts:195-200`).
  - Help text: `src/playtest/cli.ts:60`. Docs: `docs/stats/style-stats.md:76-81`.
  - Help text is asserted in `tests/playtest/cli.test.ts` and other tests that import `USAGE`.
- TAG plays the advice engine's recommended action, mixing only preflop (`src/bots/tag.ts:39-52`, REQ-026.1 at
  `requirements.md:492`).
  - So option D (tune TAG postflop) needs one of two things. One is a REQ-026.1 change plus a TAG `postflopValue`
    block like the Rock's (`src/bots/rock.ts:20-31`, `src/bots/style.ts:76-77,252`).
  - The other is a change to the advice engine itself, which would also change the user's advice.
- A second ceiling applies to all-TAG play: the 6-max healthy range for aggression is 50–66%
  (`docs/stats/healthy-ranges.md:25`), checked over 100k all-TAG hands by
  `tests/stats/healthy-ranges-tag.acceptance.test.ts:18-37` (slow). Widening REQ-027.1 alone does not move it.
- The last change-log row is 1.12 (`requirements.md`, TASK-6.20).
- Existing code to reuse:
  - `npm run playtest -- … --check-styles` → the measurements above; no new tooling.
  - Backlog CLI (`backlog decision create`, `backlog task edit --notes/--final-summary`, `backlog task create`) →
    every orchestrator step.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Option B: keep TAG's aggression band at 45–65% (no requirements change) and document that `--check-styles` bands are judged over 100,000 hands, with shorter runs able to fail from sample noise. The documentation work is a follow-up story (§5). | A no change; C widen the band; D tune TAG postflop (§5) | Where REQ-027 applies (Mixed, 100k) TAG aggression is 59.5%, 5.5 points of room; 0 of 40 short runs exceeded 65%. The short-run failures come from other sample-size effects, so documenting the run length fixes the real confusion at almost no cost and with no bot change. | yes | Approved by Q-1 (user, 2026-11-26) |

## 5. Design

### Files to create / modify
- No source, test, docs or requirements file changes (option B, D-1). The only files touched are Backlog records,
  written by the orchestrator through the Backlog CLI, never by hand or by a builder:
  - `backlog/tasks/task-6.24 - Decide-TAG-aggression-headroom-against-its-65-band-ceiling.md` — notes and final
    summary (SPEC-01).
  - `backlog/decisions/decision-<n> - <title>.md` — new, via `backlog decision create` (SPEC-02).
  - `backlog/tasks/task-6.<n> - Show-that---check-styles-bands-are-judged-over-100000-hands.md` — new, via
    `backlog task create` (SPEC-04).

### Options and what each one costs
- **A — No change needed.**
  - Evidence: the Mixed value the requirement governs has 5.5 points of room, and 0 of 40 short runs exceeded 65%.
  - This task: decision only. No follow-up story.
  - Downside: `--check-styles` on short runs keeps failing (20/20 all-TAG, 12/20 Mixed) for reasons a user can't
    easily tell apart from real tuning problems.
- **B — Document a minimum run length (recommended; chosen, Q-1).**
  - This task: decision only.
  - Follow-up story (small): say in the `--check-styles` help line (`src/playtest/cli.ts:60`) and in
    `docs/stats/style-stats.md:76-81` that the bands are judged over 100,000 hands (REQ-027's fit criterion), and
    that shorter runs can fail from sample noise. The follow-up story's own spec settles whether to also print a
    note when `--check-styles` runs with fewer than 100,000 hands.
  - Estimate: 2–3 files, about 20 lines, plus the help-text assertions in `tests/playtest/cli.test.ts`.
  - No bot behaviour or result changes.
- **C — Widen TAG's aggression band** (for example 45–68% or 45–70%).
  - This task: REQ-027.1 edit and change-log row 1.13.
  - Follow-up story: update `STYLE_BANDS` (`src/playtest/style-check.ts:30`) and the locked copy in
    `tests/bots/style-bands.acceptance.test.ts:26`. Estimate: 2 files, about 4 lines.
  - It does not move the 66% healthy-range ceiling for all-TAG play, and it does not fix the short-run failures,
    which are not caused by TAG aggression.
- **D — Tune TAG postflop** (for example a value bar like the Rock's).
  - This task: decision only.
  - Follow-up story (medium): needs REQ-026.1 changed (TAG currently plays the advice exactly), plus a TAG
    `postflopValue` block in its style file, tests, and the slow 100k band checks re-run.
  - It changes every TAG result, BB/100 and the all-TAG healthy-range numbers.
  - Estimate: 4–6 files, about 80–150 lines.

### Components, interfaces and data
- No code interfaces change in this task.

### Orchestrator text to paste

**Decision title** (SPEC-02):
`TAG aggression band stays 45–65%; --check-styles is judged over 100,000 hands (TASK-6.24 Q-1)`

**Implementation notes** (SPEC-01): the two measurement tables from §3 verbatim, plus the line
"Raw runs: 100k all-TAG and 100k Mixed at seed 42; 2k runs at seeds 1–20 for each line-up; code at main a08251c."

**Final summary** (SPEC-01), with `<DEC>` and `<FU>` replaced by the created ids:
"Decision (Q-1, user 2026-11-26): option B. TAG's REQ-027.1 aggression band stays 45–65%. On today's code TAG
aggression is 59.5% over 100,000 Mixed hands (5.5 points under the ceiling) and 64.3% over 100,000 all-TAG hands;
in 40 runs of 2,000 hands (seeds 1–20, all-TAG and Mixed) it never exceeded 65%. The short-run failures the task
described now come from other small-sample effects: rare mixed spots used only one way, and stats near their
floors. Note: two Mixed 100k values pass with little room, TAG PFR 14.6% (floor 14%) and Rock VPIP 8.7% (floor 8%);
they dip below their floors only in 2k runs. No tuning task is opened for them; revisit if a 100k run misses.
Decision <DEC> recorded. Follow-up <FU> documents that --check-styles is judged over 100,000 hands. No project
files changed in this task."

### Follow-up story (SPEC-04)
Command shape: `backlog task create "<title>" -p TASK-6 -d "<description>" --ac "<AC1>" --ac "<AC2>" --ac "<AC3>"
-l dream-limit-holdem-trainer,follow-up --dep TASK-6.24 --priority medium` (check `backlog task create --help` for
exact flag names).

- **Title:** `Show that --check-styles bands are judged over 100,000 hands`
- **Description:**
  "From TASK-6.24 (decision: option B, Q-1). REQ-027's fit criterion judges each bot style's VPIP, PFR and
  aggression over 100,000 hands, but `--check-styles` gives no hint of that, so 2,000-hand runs fail for
  sample-noise reasons that look like tuning problems (TASK-6.24 measured 20/20 all-TAG and 12/20 Mixed 2k runs
  failing, none from TAG aggression: rare mixed spots used only one way, Rock VPIP 7.7–7.9% vs floor 8%, TAG PFR
  13.7–13.9% vs floor 14%, Rock aggression 56.1–56.2% vs ceiling 55%). Update the `--check-styles` help line
  (`src/playtest/cli.ts` USAGE), `docs/stats/style-stats.md` ("In the playtest CLI") and the USAGE assertions in
  `tests/playtest/cli.test.ts`. This story's spec decides whether to also print a note when `--check-styles` runs
  with fewer than 100,000 hands. No band, bot or advice changes. Any speed or scale check goes in
  `npm run test:slow`, never in `npm test` or CI."
- **AC1:** "Given a user reads `npm run playtest -- --help`, When they read the --check-styles line, Then it says
  the bands are judged over 100,000 hands and that shorter runs can fail from sample noise"
- **AC2:** "Given a reader opens docs/stats/style-stats.md, When they read the playtest CLI section, Then it states
  the 100,000-hand run length REQ-027 uses and the sample-noise failures shorter runs can show (mixed spots used
  one way, stats near a band edge)"
- **AC3:** "Given `npm test` runs, When the USAGE assertions in tests/playtest/cli.test.ts check the help text,
  Then they pass with the new --check-styles wording and no check of 100,000-hand scale is added to npm test or CI"


### Rules and algorithms
- N/A. This is a decision record.

### Error handling and configuration
- N/A.

## 6. Behaviour specification

### SPEC-01: The decision and the measurements are recorded on TASK-6.24
- Verifies: AC#1
- Behaviour: Given the user answered Q-1, When the orchestrator at finish runs `backlog task edit TASK-6.24 --notes …` and `--final-summary …`, Then `backlog task view TASK-6.24 --plain` shows the two measurement tables from §3 (100k all-TAG 64.3%, 100k Mixed 59.5%, 2k ranges, 0/20 and 0/20 above 65%), option B, Q-1, the near-floor note (TAG PFR 14.6%, Rock VPIP 8.7%), the decision id and the follow-up story id, using the §5 "Orchestrator text to paste". The builder does not run this.
- Verification: command `backlog task view TASK-6.24 --plain`

### SPEC-02: A Backlog decision states the choice
- Verifies: AC#1
- Behaviour: Given option B (D-1), When the orchestrator runs `backlog decision create "TAG aggression band stays 45–65%; --check-styles is judged over 100,000 hands (TASK-6.24 Q-1)" -s accepted --plain` (A-1), Then `backlog decision list --plain` shows that decision with status accepted, and TASK-6.24's final summary cites its id.
- Verification: command `backlog decision list --plain`

### SPEC-03: requirements.md is unchanged
- Verifies: AC#1
- Behaviour: Given option B (no band change), When `git diff main -- dreams/limit-holdem-trainer/requirements.md` is run, Then it prints nothing.
- Verification: command `git diff main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-04: Any resulting change is a follow-up story
- Verifies: AC#1
- Behaviour: Given option B, When the orchestrator creates the follow-up with `backlog task create` under TASK-6 using the exact title, description and three ACs from §5 "Follow-up story" (labels `dream-limit-holdem-trainer, follow-up`, depending on TASK-6.24), Then `backlog task list --parent TASK-6 --plain` lists "Show that --check-styles bands are judged over 100,000 hands" and `backlog task view <id> --plain` shows the three ACs.
- Verification: command `backlog task list --parent TASK-6 --plain`

### SPEC-05: No source, test or tooling change in this task
- Verifies: AC#1
- Behaviour: Given option B, When `git diff --stat main -- src tests tools docs e2e` is run, Then it prints nothing.
- Verification: command `git diff --stat main -- src tests tools docs e2e`

## 7. Edge cases
- A similar follow-up already exists under TASK-6: check `backlog task list --parent TASK-6 --plain` first; if one
  covers the same help/docs change, add the §5 ACs to it instead of creating a duplicate, and cite its id.
- Measurements drift because a later advice change lands before the build: re-run the two 100k commands from §3 and
  update the tables in the task notes.
- Invalid input, concurrency, permissions: N/A. No code path changes.

## 8. Security considerations
- N/A. No new input, dependency, secret or randomness.

## 9. Non-functional
- This task adds no checks.
- Measurement cost for anyone repeating it: 100k all-TAG takes about 1 min 49 s and 100k Mixed about 3 min 13 s
  here, well inside REQ-062.5's 60 minutes.
- Any check a follow-up adds at that scale goes in `npm run test:slow` (standing user rule).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` (REQ-027 fit criterion; expected exit 0, TAG aggression 59.5%)
- New tests: none. No builder run is needed. SPEC-01, SPEC-02 and SPEC-04 are orchestrator CLI steps. SPEC-03 and
  SPEC-05 are diffs.
- End-to-end for the Judge:
  - Run the Mixed 100k command above and one 2k run (`npm run playtest -- --hands 2000 --seed 7 --check-styles`).
    Confirm they match §3: 100k exits 0 with TAG at 59.5%. The 2k run fails only on "One action only", with TAG
    aggression under 65%.
  - Then check SPEC-01 to SPEC-05.

## 11. Open questions
- None. Q-1 answered B (2026-11-26), folded into D-1.

## 12. Clarifications log
See `doit/TASK-6.24/qa.md`.
