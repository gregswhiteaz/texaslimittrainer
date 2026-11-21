# Spec: TASK-1.41 — Clarify naming and comments in the invariant checker

Status: READY (approved 2026-11-20)
Task: TASK-1.41 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.27 / TASK-1.8, doc-33; the comment cites REQ-016.1) · Dream: limit-holdem-trainer

## 1. Summary
A readability-only change to `src/engine/invariants.ts`. In `checkStep`, the arrays `rest` and `others` are
renamed to `stateChecks` and `afterChips` (TASK-1.27 code-review MINOR). The L4 raise clause in
`legalActionMessage` gets a comment explaining why it is there even though L3 already makes it unreachable
(TASK-1.8 review MINOR). Behaviour, tests and playtest output stay byte-identical.

## 2. Scope
- In scope:
  - `src/engine/invariants.ts:326-329`: rename `rest` → `stateChecks` and `others` → `afterChips` (all 4 uses).
  - `src/engine/invariants.ts:75-78`: add a comment of 2–5 lines directly above the L4 `if`, explaining the raise
    clause (content in §5).
- Not doing:
  - Any change to logic, messages, exports, signatures or the order of checks in `invariants.ts`.
  - Removing or rewriting the raise clause or the bet clause. Commenting the bet clause is also out of scope.
  - Any test file changes or new tests. Existing tests already cover the behaviour, and the change has no
    runtime effect.
  - Changes to `src/engine/hand.ts`, the playtest CLI, or docs.
  - Relaxing L4 for short all-in raises. TASK-1.14 owns that (REQ-016.5).
- Scope budget: files=1, lines=12

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The comment names REQ-016.1 as the rule it enforces, says it re-checks the size independently of `legalActions` (TASK-1.8 A-4), notes it cannot fail today once L3 passes, and points to TASK-1.14 as the task that must revisit it for short all-in raises. | yes | Matches the TASK-1.8 review's stated reason ("keep as a guard, add a comment", `doit/TASK-1.8/story-doc.md:77,101`) and REQ-016.1's text (`dreams/limit-holdem-trainer/requirements.md:315`). Mentioning TASK-1.14 stops a future builder from treating the guard as dead code. | Cite only REQ-016.1. Rejected because it leaves out why the clause is redundant but kept. |
| A-2 | The byte-identical baseline is the current `HEAD` version of `invariants.ts`, compared by running the playtest with the edited file stashed. | yes | The output is deterministic: two runs on 2026-11-20 gave identical files (`Invariant violations: 0`, about 0.7 s). | Keep a stored baseline file in the work folder. Rejected as an extra artefact. |

## 3. Current system
- `src/engine/invariants.ts:322-330` `checkStep`: `rest` = checkState results without `legal-action`. `[chips,
  ...others] = rest` splits off a leading `chips` violation, so the step's legal-action violation goes in
  INVARIANTS order (`:14-20`). These names occur only on lines 326, 327 and 329 (checked with `grep -nwE`).
- `src/engine/invariants.ts:71-80`: the L4 check. Its raise clause `action.type === 'raise' && amount !==
  before.currentBet + unit` is at `:77`. L3 (`:68`) already requires the action to be in `legalActions(before)`,
  and `legalActions` offers a raise only at `raiseTo = state.currentBet + unit` (`src/engine/hand.ts:262,268,271`).
  So the clause cannot fail after L3 passes, and the mutant that removes it survives (`doit/TASK-1.8/story-doc.md:77`).
- L4 rule origin: `doit/TASK-1.8/spec.md:207-210` (L4) and A-4 at `:51` (size is checked independently against
  the street unit, REQ-016.1).
- Tests: Vitest (`npm test` = `vitest run --coverage`, `package.json`). Tests that exercise `checkStep`:
  `tests/engine/invariants.test.ts`, `tests/engine/invariant-messages.acceptance.test.ts`,
  `tests/playtest/invariants.acceptance.test.ts`, `tests/engine/invariants.perf.test.ts`,
  `tests/bots/tag-playtest.acceptance.test.ts`. None of them refers to `rest` or `others`.
- Existing code to reuse: n/a (rename and comment only).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Names are `stateChecks` and `afterChips`, exactly as AC#1 states. | `withoutHistory` (review alternative) | AC#1 fixes the names. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/invariants.ts` — rename two locals in `checkStep` and add the L4 raise-clause comment.

### Components, interfaces and data
- No interface changes. `checkStep` after the change (only the identifiers change):
  ```ts
  const stateChecks = state.filter((v) => v.invariant !== 'legal-action');
  const [chips, ...afterChips] = stateChecks;
  const violation = { invariant: 'legal-action', message: legal };
  return chips?.invariant === 'chips' ? [chips, violation, ...afterChips] : [violation, ...stateChecks];
  ```
  If Prettier wraps the return line, that is acceptable.

### Rules and algorithms
- L4 comment (`//` lines placed directly above the `if (` at `:75`). It must say all of the following, in any
  wording:
  1. The rule: REQ-016.1. A bet is exactly one unit, and a raise goes to exactly `currentBet + unit`, where the
     unit is the small bet preflop/flop and the big bet turn/river.
  2. Why it is written this way: the size is checked independently of `legalActions` (TASK-1.8 A-4). Today
     `legalActions` only offers `currentBet + unit`, so after L3 the raise clause cannot fail. It is kept as a
     guard in case `legalActions` changes.
  3. TASK-1.14 (short all-in raises, REQ-016.5) must revisit this clause.
- The comment must not contain the whole words `rest` or `others`, so the SPEC-01 grep stays exact.

### Error handling and configuration
- None. No runtime change.

## 6. Behaviour specification

### SPEC-01: checkStep arrays are named stateChecks and afterChips
- Verifies: AC#1
- Behaviour: Given `src/engine/invariants.ts`, When searched for whole words, Then `rest` and `others` occur 0
  times, `stateChecks` occurs on exactly 3 lines (the declaration, the destructure and the return), and
  `afterChips` occurs on exactly 2 lines (the destructure and the return), counting the return as a single line.
  If Prettier splits the return, the counts apply to `checkStep`'s body taken as a whole.
- Verification: command `! grep -nwE 'rest|others' src/engine/invariants.ts && grep -nwE 'stateChecks|afterChips' src/engine/invariants.ts`
  (exit 0. The second grep lists only lines inside `checkStep`.)

### SPEC-02: L4 raise clause carries an explanatory comment
- Verifies: AC#2
- Behaviour: Given `legalActionMessage`, When read, Then directly above the L4 `if` there is a comment that
  contains `REQ-016.1`, mentions `legalActions` and `TASK-1.14`, and explains that the raise clause is an
  independent guard that cannot fail once L3 passes.
- Verification: command `grep -n -B6 "action.type === 'bet' && (before.currentBet" src/engine/invariants.ts | grep -E 'REQ-016\.1|legalActions|TASK-1\.14'`
  (prints at least 3 matching lines, one for each of the three terms). The Judge then reads the comment manually
  against the three points in §5.

### SPEC-03: No behaviour change; output byte-identical
- Verifies: AC#3
- Behaviour: Given the edited file, When `npm test` runs, Then every test passes. When `npm run -s playtest --
  --hands 10000 --seed 42` runs before and after the change, Then the two stdout captures are byte-identical
  (ending `Invariant violations: 0`), and both runs exit 0.
- Verification: command `npm test && npm run -s playtest -- --hands 10000 --seed 42 > /tmp/tlh141-after.txt && git stash push -- src/engine/invariants.ts && npm run -s playtest -- --hands 10000 --seed 42 > /tmp/tlh141-before.txt; git stash pop && cmp /tmp/tlh141-before.txt /tmp/tlh141-after.txt`

## 7. Edge cases
- Prettier reflowing the renamed return line: allowed. SPEC-01 counts on `checkStep` as a whole.
- Comment words colliding with the SPEC-01 grep: excluded by the rule in §5.
- Everything else (input, concurrency, permissions): N/A, because nothing changes at runtime.

## 8. Security considerations
N/A. No runtime change, no new input, no new dependency.

## 9. Non-functional
- Performance is unchanged. `tests/engine/invariants.perf.test.ts` must still pass under `npm test`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests: none (readability change; SPEC-01..03 are command checks). End to end for the Judge: run the SPEC-03
  command (expect `cmp` silent and exit 0), then the SPEC-01 and SPEC-02 greps, and read the L4 comment.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.41/qa.md`.
