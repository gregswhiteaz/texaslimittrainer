# Spec: TASK-8.5 — Label positions and situations in plain English for hints

Status: READY (approved 2026-11-25)
Task: TASK-8.5 · Parent/epic: TASK-8 · Requirements: REQ-042.6, REQ-032.2, REQ-061.2 (via doc-14 follow-up 3) · Dream: limit-holdem-trainer

## 1. Summary
The preflop advice works with ids: a `Position` (`CO`) and a `Situation` (`raise-and-calls`). TASK-7.2 asked for
readable labels for the REQ-042.6 hint text (doc-14, follow-up 3). TASK-8.1 already delivered the position half.
`CHART_POSITIONS` in `src/advice/explanations.ts:190-200` holds user-approved position labels ("the cutoff"; TASK-8.1
Q-1), and the hint's chart basis line uses them. No short situation label exists yet. This story adds the authored
situation labels, plus two lookup functions `positionLabel(id)` and `situationLabel(id)`, so every id maps to one
approved English label. The functions are tested for every id.

## 2. Scope
- In scope:
  - `SITUATION_LABELS` (authored copy) in `src/advice/explanations.ts`, one label for each `Situation` id.
  - `positionLabel(position)` and `situationLabel(situation)` in `src/advice/explain.ts`. `chartBasisText` is
    changed to get its position text through `positionLabel`, so there is one source.
  - An acceptance test that pins every position and situation label.
  - A short paragraph in `docs/advice/explanations.md` listing the situation labels.
- Not doing:
  - Changing any position label. They were approved in TASK-8.1 Q-1, including UTG = "an early seat (UTG)" rather
    than "under the gun".
  - Showing the situation label anywhere in the UI (hint card, chart basis line, review panel) (D-2, Q-2). The preflop explanation's first sentence already describes the situation in prose
    (`PREFLOP_CONTEXT`, `src/advice/explanations.ts:133-146`).
  - Changing `SEAT_NAMES` ("in the cutoff (CO)"), `PREFLOP_CONTEXT` or any explanation sentence.
  - Splitting chart spots by raiser position (separate spike, doc-14 follow-up 1).
  - Labels for the seat names shown at the table (`positionName` in `src/table/table-view.ts:107`).
- Scope budget: files=4, lines=90

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The position label is the existing `CHART_POSITIONS` entry. `positionLabel` returns it, and the table is not duplicated. | yes | The AC's own example ("the cutoff") is exactly the TASK-8.1-approved `CHART_POSITIONS.CO`. One source keeps the hint and labels in step. | A second position table |
| A-2 | Labels cover all 9 `Position` ids and all 6 `Situation` ids, not only the six 6-max positions the AC lists. | yes | `Position` is one union for all table sizes (`src/advice/preflop-chart.ts:4`). A partial `Record` would not typecheck. | Restrict to 6-max ids |
| A-3 | Labels are lower-case phrases with no final punctuation, written to follow a position ("from the cutoff, facing a raise"). This matches `CHART_POSITIONS` and the AC example. | yes | Lets later copy join them without recasing. | Sentence-case labels |
| A-4 | No runtime guard for unknown ids. The parameters are typed `Position` and `Situation`, and every caller passes ids from the typed advice (`PreflopRecommendation`). | yes | An unknown id can't reach these functions under strict TypeScript. | Throw `RangeError` on unknown id |
| A-5 | The functions live in `explain.ts` next to `chartBasisText`, and the copy lives in `explanations.ts`. | yes | Follows TASK-8.1 D-6: all advice copy in one authored file (REQ-061.2), logic in `explain.ts`. | New `labels.ts` module |

## 3. Current system
- TypeScript strict, Vite + React. Tests use Vitest (`npm test` = `vitest run --coverage`). Files named
  `*.acceptance.test.ts` are acceptance tests (`package.json` scripts `test:unit` / `test:sweeps`).
- `src/advice/preflop-chart.ts:4-6` defines `Position` (`UTG | UTG+1 | MP | LJ | HJ | CO | BTN | SB | BB`) and
  `Situation` (`unopened | limpers | raise | raise-and-calls | re-raise | blind-defence`).
- `src/advice/preflop.ts:104-118` `situationOf` gives the meaning of each situation:
  - `unopened`: no voluntary action yet.
  - `limpers`: one or more calls, no raise.
  - `raise`: exactly one raise and no call after it.
  - `raise-and-calls`: one raise followed by at least one call.
  - `re-raise`: two or more raises.
  - `blind-defence`: SB or BB facing exactly one raise.
- `src/advice/explanations.ts:190-200` `CHART_POSITIONS`: BTN "the button", SB "the small blind", BB "the big
  blind", CO "the cutoff", HJ "the hijack", LJ "the lojack", MP "a middle seat (MP)", UTG "an early seat (UTG)",
  UTG+1 "an early seat (UTG+1)". User-approved in TASK-8.1 Q-1 (`doit/TASK-8.1/qa.md:3`,
  `doit/TASK-8.1/spec.md:195-196`).
- `src/advice/explain.ts:75-85` `chartBasisText` fills `CHART_BASIS` with `CHART_POSITIONS[rec.position]`. It is used
  by `src/table/hint.ts:132` (hint card) and the review panel.
- `src/advice/explanations.ts:133-146` `PREFLOP_CONTEXT`: one prose sentence for each situation, used as sentence 1
  of the preflop explanation (`src/advice/explain.ts:55-58`).
- No short situation label exists anywhere in `src/`. Searching for `facing a raise`, `situationLabel` and
  `SITUATION` found no source hits.
- Existing code to reuse:
  - `src/advice/explanations.ts` `CHART_POSITIONS` → the position labels (A-1).
  - `src/advice/preflop-chart.ts` `Position`, `Situation` types → keys of the label records.
  - `tests/advice/explain.test.ts:397-436` → pattern for pinning label strings for each id.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Situation label wording is the §5 table: unopened "in an unopened pot"; limpers "facing one or more limpers"; raise "facing a raise"; raise-and-calls "facing a raise and calls"; re-raise "facing a re-raise"; blind-defence "defending the blind against a raise" | REQ-032.2 noun forms; own wording | User-visible authored copy (REQ-061.2) | yes | Q-1 |
| D-2 | No display change: the labels are exposed through `positionLabel` / `situationLabel` only; hint card, chart basis line and review panel text are unchanged | Append the situation to the chart basis line; close the task as covered by TASK-8.1 | Avoids changing TASK-8.1 approved copy and locked tests; the explanation's first sentence already describes the situation. `situationLabel` has no app consumer yet | yes | Q-2 |
| D-3 | `chartBasisText` uses `positionLabel` internally. Its output does not change. | Leave it reading `CHART_POSITIONS` directly | One lookup path for position text | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/explanations.ts` — add `SITUATION_LABELS: Readonly<Record<Situation, string>>` after `CHART_POSITIONS`.
- `src/advice/explain.ts` — add `positionLabel` and `situationLabel`. `chartBasisText` calls `positionLabel`.
- `tests/advice/labels.acceptance.test.ts` — new. Pins every label (SPEC-01, SPEC-02, SPEC-03).
- `docs/advice/explanations.md` — one paragraph under "Preflop" listing the situation labels and naming both functions.

### Components, interfaces and data
- `export const SITUATION_LABELS: Readonly<Record<Situation, string>>` in `explanations.ts`. Its keys are exactly the
  six `Situation` ids. Its values are the Q-1 approved strings.
- `export function positionLabel(position: Position): string` returns `CHART_POSITIONS[position]`.
- `export function situationLabel(situation: Situation): string` returns `SITUATION_LABELS[situation]`.
- Both functions are pure, total over their typed input, and never throw.

### Rules and algorithms
- Situation labels (approved by Q-1, D-1):

  | Situation id | Label |
  |---|---|
  | `unopened` | in an unopened pot |
  | `limpers` | facing one or more limpers |
  | `raise` | facing a raise |
  | `raise-and-calls` | facing a raise and calls |
  | `re-raise` | facing a re-raise |
  | `blind-defence` | defending the blind against a raise |

- Position labels are the `CHART_POSITIONS` values listed in §3. Examples:
  - `positionLabel('CO')` = "the cutoff"
  - `positionLabel('UTG')` = "an early seat (UTG)"
  - `situationLabel('raise-and-calls')` = "facing a raise and calls"

### Error handling and configuration
- None. Inputs are typed unions (A-4). No configuration.

## 6. Behaviour specification

### SPEC-01: Every 6-max position id has its approved label
- Verifies: AC#1
- Behaviour: Given each position id UTG, HJ, CO, BTN, SB, BB, When `positionLabel(id)` is called, Then it returns
  exactly, in order: "an early seat (UTG)", "the hijack", "the cutoff", "the button", "the small blind", "the big blind".
- Verification: acceptance `tests/advice/labels.acceptance.test.ts::position labels > labels each 6-max position`

### SPEC-02: Every situation id has its approved label
- Verifies: AC#1
- Behaviour: Given each `Situation` id, When `situationLabel(id)` is called, Then it returns the approved label from
  the §5 table: for example, `raise-and-calls` returns "facing a raise and calls" and `unopened` returns "in an
  unopened pot". The labels' keys are exactly the six ids in `Situation`.
- Verification: acceptance `tests/advice/labels.acceptance.test.ts::situation labels > labels each situation`

### SPEC-03: Remaining positions and the chart basis share one source
- Verifies: AC#1
- Behaviour: Given the other position ids LJ, MP, UTG+1, When `positionLabel(id)` is called, Then it returns "the
  lojack", "a middle seat (MP)" and "an early seat (UTG+1)". For every `Position` p,
  `chartBasisText({ referenceSize: '6-max', action: 'raise', handClass: 'A9o', position: p })` equals
  `From the 6-max chart: raise A9o from ${positionLabel(p)}`.
- Verification: acceptance `tests/advice/labels.acceptance.test.ts::position labels > labels the other positions and matches the chart basis`

## 7. Edge cases
- Unknown or misspelled id: N/A. The parameter types are closed unions under strict TypeScript (A-4).
- Heads-up and full-ring positions: covered by SPEC-03 (all 9 ids).
- Situations that don't apply at a table size (for example, heads-up has no `raise-and-calls` spot): the label
  still exists, because labels don't depend on size. Covered by SPEC-02.
- Empty, duplicate, concurrency, interruption, permissions: N/A (static lookup tables).

## 8. Security considerations
- No untrusted input, no I/O, no new dependency, no randomness. N/A.
- Originality: all label text is authored for this project (REQ-061.2).

## 9. Non-functional
- None beyond the existing suite. No speed or scale checks are added (a constant-time lookup).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/advice/labels.acceptance.test.ts tests/advice/explain.test.ts`
- New tests:
  - `tests/advice/labels.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03.
  - `tests/advice/explain.test.ts` stays green unchanged. It already pins `chartBasisText` output, which D-3 must not alter.
- End-to-end for the Judge:
  1. Run the run command above.
  2. In a scratch copy, change `CHART_POSITIONS.CO` and confirm that SPEC-01 and the existing chart-basis test both fail.
  3. Read `SITUATION_LABELS` and compare it word for word with the approved Q-1 set.

## 11. Open questions
- None. Q-1 and Q-2 resolved (see D-1, D-2 and `doit/TASK-8.5/qa.md`).

## 12. Clarifications log
See `doit/TASK-8.5/qa.md`.
