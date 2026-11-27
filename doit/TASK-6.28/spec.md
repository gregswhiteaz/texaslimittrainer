# Spec: TASK-6.28 — Show that --check-styles bands are judged over 100,000 hands

Status: READY (approved 2026-11-26, autopilot)
Task: TASK-6.28 · Parent/epic: TASK-6 · Requirements: REQ-027, REQ-027.5 · Dream: limit-holdem-trainer

## 1. Summary
REQ-027 (`dreams/limit-holdem-trainer/requirements.md:505,513`) judges each bot style's VPIP, PFR and aggression
over a 100,000-hand Mixed 6-max run, but neither `npm run playtest -- --help` nor `docs/stats/style-stats.md` says
so. As a result, 2,000-hand `--check-styles` runs fail from sample noise and look like tuning problems (TASK-6.24
Q-1, decision-2, option B). This task adds that information to the `--check-styles` help line and the "In the
playtest CLI" docs section, and updates the two USAGE assertions in `tests/playtest/cli.test.ts`. It changes
documentation and help text only. CLI behaviour stays the same and no runtime note is printed (Q-2, recommended).

## 2. Scope
- In scope:
  - `src/playtest/cli.ts` `USAGE`: replace the `--check-styles` line (line 60) with the wording in §5.
  - `docs/stats/style-stats.md` "In the playtest CLI" (lines 74–80): add the paragraph in §5.
  - `tests/playtest/cli.test.ts`: update the full-`USAGE` `toBe` (line 115) and the `usage[4]` `toBe`
    (lines 631–633) to the new wording.
- Not doing:
  - Any change to bands (`STYLE_BANDS`), bots, style data files, the advice engine or `requirements.md`.
  - Changing the `--check-styles` pass/fail logic, exit codes, or any printed run output. In particular, no
    runtime note for runs under 100,000 hands (Q-2, D-2).
  - Fixing the short-run failure causes (rare mixed spots used one way, Rock/TAG floors). These are documented only.
  - Any 100,000-hand or speed check in `npm test` or CI. No new entries in `npm run test:slow` either, because this
    task needs no scale check.
  - Changing `package.json`, `.github/`, or any locked acceptance test (for example
    `tests/playtest/check-styles.acceptance.test.ts`).
- Scope budget: files=3, lines=16   (1 USAGE line, 2 test assertions spanning about 4 lines, about 8 doc lines)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The docs paragraph quotes the TASK-6.24 2,000-hand measurements as examples (Rock VPIP 7.7–7.9% vs 8%, TAG PFR 13.7–13.9% vs 14%, Rock aggression 56.1–56.2% vs 55%). | yes | They make "near a band edge" concrete and come from the task description. | State the causes without numbers. |
| A-2 | AC#2 (docs) is verified with a `command` grep plus manual reading, not a new test that reads the markdown file. | yes | No test reads `docs/stats/*.md` today (grep of tests/src/tools finds none), and a docs-text test would be brittle. | Add a unit test that reads the doc. |
| A-3 | The help line stays a single line (still `USAGE.split('\n')[4]`), so the existing index-based assertion at `tests/playtest/cli.test.ts:631` keeps its shape. | yes | Every option note in USAGE is one line (`src/playtest/cli.ts:58-61`). | Split into two lines and shift the indexes. |

## 3. Current system
- `src/playtest/cli.ts:55-61` — `USAGE` string. Line 60 is the `--check-styles` note:
  `--check-styles: exit 1 unless every seated bot style's VPIP, PFR and aggression is inside its target band and
  every mixed spot used both actions`. `main` prints `USAGE` for `--help` (exit 0, `cli.ts:371-373`) and after
  every usage error on stderr (exit 2, `cli.ts:367-369`).
- `tests/playtest/cli.test.ts:110-117` — full-string `expect(USAGE).toBe(...)` inside
  `it('rejects every invalid argument with its fixed message')`. `tests/playtest/cli.test.ts:627-633` — the
  `usage[4]` line assertion inside `it('--check-styles is a value-less run flag echoed in the Options line')`. All
  error-case assertions compare against the `USAGE` constant, so they follow the change automatically.
  `cli.test.ts` is not locked by any earlier task (no `doit/*/state.json` `locked_tests` entry names it).
- `docs/stats/style-stats.md:74-80` — "### In the playtest CLI": a single paragraph describing the `Style:` lines and
  `--check-styles`. No test reads this file.
- `dreams/limit-holdem-trainer/requirements.md:505` — REQ-027 statement ("headless 6-max playtests of 100,000
  hands with the Mixed line-up"), `:513` — the fit-criterion command
  `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles`.
- `tests/playtest/check-styles.acceptance.test.ts` (locked by earlier tasks, run only in `npm run test:slow`,
  `package.json:17`) asserts that the line after `Style check: passed` is `Bot results:`. Any runtime note printed
  after the verdict would break it, which is one reason for D-2.
- Tests: `npm test` = `vitest run --coverage` (`package.json:13`); slow opt-in group `npm run test:slow`
  (`package.json:17`).
- Existing code to reuse:
  - `src/playtest/cli.ts` `USAGE` → edit in place. No new constant or helper.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Exact `--check-styles` help wording and docs paragraph as in §5. | Shorter help line that only says "use --hands 100000". | User-visible text. | yes | user (Q-1, autopilot recommended) |
| D-2 | Do not print a runtime note when `--check-styles` runs with fewer than 100,000 hands. Help and docs only. | Print `Note: REQ-027 judges these bands over 100,000 hands; this run is shorter, so a failure can be sample noise` before the `Style check:` line when `--hands` < 100000. | Decision-2 / TASK-6.24 Q-1 chose "document". A note changes the printed run output that locked tests pin. Its 100,000 boundary could only be tested with a 100,000-hand run, which the standing rule keeps out of `npm test`/CI. The help line already reaches users at the point of use. | yes | user (Q-2, autopilot recommended) |

## 5. Design

### Files to create / modify
- `src/playtest/cli.ts` — replace the `--check-styles` line in `USAGE`.
- `tests/playtest/cli.test.ts` — update the two assertions that spell out that line.
- `docs/stats/style-stats.md` — add the run-length / sample-noise paragraph to "In the playtest CLI".

### Components, interfaces and data
- `USAGE` stays an exported `string` with the same 6 lines plus the trailing `\n`. Only line index 4 changes, to
  exactly:

  ```
  --check-styles: exit 1 unless every seated bot style's VPIP, PFR and aggression is inside its target band and every mixed spot used both actions; the bands are judged over 100,000 hands (REQ-027), so shorter runs can fail from sample noise
  ```

- `docs/stats/style-stats.md` gets a new paragraph directly after the existing "In the playtest CLI" paragraph
  (before "## Display"), exactly:

  ```
  REQ-027 judges these bands over 100,000 hands:
  `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles`. Shorter runs can fail from sample
  noise rather than tuning: a rare mixed spot may be used only one way, and a stat that sits near a band edge can
  land just outside it. For example, 2,000-hand runs in TASK-6.24 showed Rock VPIP 7.7–7.9% against its 8% floor,
  TAG PFR 13.7–13.9% against its 14% floor and Rock aggression 56.1–56.2% against its 55% ceiling. Read a short-run
  failure as a hint and confirm it with a 100,000-hand run.
  ```

### Rules and algorithms
- N/A. No logic changes.

### Error handling and configuration
- Unchanged. Usage errors still print `<message>\n<USAGE>` to stderr with exit 2, so they show the new line
  automatically.

## 6. Behaviour specification

### SPEC-01: --help shows the 100,000-hand judging and the sample-noise warning
- Verifies: AC#1
- Behaviour: Given the CLI, When a user runs `npm run playtest -- --help`, Then it exits 0 and stdout is `USAGE`,
  whose 5th line (index 4) is exactly the §5 `--check-styles` line, containing "the bands are judged over 100,000
  hands (REQ-027)" and "shorter runs can fail from sample noise". The other USAGE lines are byte-identical to
  today.
- Verification: unit `tests/playtest/cli.test.ts::rejects every invalid argument with its fixed message`

### SPEC-02: line-level USAGE assertion matches the new wording
- Verifies: AC#1, AC#3
- Behaviour: Given `USAGE.split('\n')`, When the `--check-styles` test reads index 4, Then it `toBe`s the exact §5
  line, and index 0 still ends with `[--lineup <mixed|tough|soft>] [--check-styles] [--check-advice]`.
- Verification: unit `tests/playtest/cli.test.ts::--check-styles is a value-less run flag echoed in the Options line`

### SPEC-03: end-to-end help output
- Verifies: AC#1
- Behaviour: Given a built checkout, When the Judge runs `npm run playtest -- --help`, Then the `--check-styles:`
  line printed contains `judged over 100,000 hands` and `sample noise`.
- Verification: command `npm run playtest -- --help | grep -- '--check-styles: .*judged over 100,000 hands (REQ-027), so shorter runs can fail from sample noise$'`

### SPEC-04: docs state the run length and the sample-noise failure modes
- Verifies: AC#2
- Behaviour: Given `docs/stats/style-stats.md`, When a reader reads "### In the playtest CLI", Then it contains the
  §5 paragraph: the 100,000-hand REQ-027 run (with the fit-criterion command), and both sample-noise causes ("a rare
  mixed spot may be used only one way", "a stat that sits near a band edge can land just outside it").
- Verification: command `grep -c -e 'REQ-027 judges these bands over 100,000 hands' -e 'used only one way' -e 'near a band edge' docs/stats/style-stats.md` (prints 3) plus manual reading that all three phrases sit in the "In the playtest CLI" section

### SPEC-05: no scale check in npm test or CI
- Verifies: AC#3
- Behaviour: Given the finished change, When `npm test` runs, Then it passes, and the diff touches no
  `package.json`, `.github/` or `tests/**/*.acceptance.test.*` / `*.perf.test.*` file and adds no `--hands` value
  of 100000 or more to `tests/playtest/cli.test.ts`.
- Verification: command `npm test && test -z "$(git diff --name-only main -- package.json .github 'tests/**/*.acceptance.test.*' 'tests/**/*.perf.test.*')" && ! git diff main -- tests/playtest/cli.test.ts | grep -E "^\+.*'--hands', '[0-9]{6,}'"`

## 7. Edge cases
- Usage-error output: errors reprint `USAGE`. The assertions already compare against the constant, so this is
  covered by SPEC-01 with no extra item.
- Very long help line: one line by A-3. Terminals wrap it and there is no width limit on USAGE lines today (line 57
  is longer).
- Runs under or over 100,000 hands: no behaviour change (D-2), so nothing new to test.
- Invalid input / concurrency / interruption / permissions: N/A, text-only change.

## 8. Security considerations
N/A. No new input, dependency, secret or randomness. The change is static text.

## 9. Non-functional
- `npm test` duration unchanged (no new runs; only string assertions change).
- No 100,000-hand or speed check is added anywhere (standing rule; SPEC-05).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --help`
- New tests: none. The existing tests in `tests/playtest/cli.test.ts` are updated (SPEC-01, SPEC-02).
  End-to-end for the Judge: run `npm run playtest -- --help` and read the `--check-styles:` line (SPEC-03). Open
  `docs/stats/style-stats.md` and read "In the playtest CLI" (SPEC-04). Optionally run
  `npm run playtest -- --hands 2000 --lineup mixed --check-styles` to see that the run output is unchanged (no note,
  D-2).

## 11. Open questions
None. Q-1 (wording approved as written) and Q-2 (no runtime note) answered in `doit/TASK-6.28/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.28/qa.md`.
