# Spec: TASK-8.7 — Decide whether hints and reviews show the situation label

Status: READY (approved 2026-11-27)
Task: TASK-8.7 · Parent/epic: TASK-8 · Requirements: REQ-042.6, REQ-043.9, REQ-042.2, REQ-032.2, REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
A decision spike. TASK-8.5 added `situationLabel()` with approved labels (doc-155, TASK-8.5 Q-1), but its Q-2
was auto-accepted in autopilot as "no display change", so no screen shows them. This spec gave the user the
evidence for showing or not showing the label. The user chose Q-1 A (qa.md, 2026-11-27): the hint card's chart
line and preflop review entries keep today's text, with no situation label and no follow-up story. This task
records that as a Backlog decision and rewords TASK-7.40 AC#4 and TASK-7.42 AC#3, which assumed the label is
shown. No product code and no requirements change.

## 2. Scope
- In scope (orchestrator, backlog CLI only):
  - Record the Q-1 answer as one Backlog decision (SPEC-01).
  - Reword TASK-7.40 AC#4 and TASK-7.42 AC#3 to the exact text in §5 (SPEC-04).
  - TASK-8.7 implementation notes (SPEC-03) and tick AC#1 (SPEC-05).
- Not doing:
  - Any change under `src`, `tests`, `e2e`, `tools` or `docs` (D-2).
  - Any change to `dreams/limit-holdem-trainer/requirements.md`: REQ-042.6 and REQ-043.9 already match Q-1 A, so
    no wording change and no changelog row (SPEC-02).
  - A follow-up build story to show the label (Q-1 A).
  - Changing any approved label or context sentence (`src/advice/explanations.ts:145-158,215-222`).
  - Authoring the re-raise or blind-defence split labels (owned by TASK-7.40, TASK-7.41, TASK-7.42).
  - The approximate and short-stack labels (TASK-8.4, TASK-9.9).
- Scope budget: files=4, lines=40   (only the four Backlog files in §5, all written by the CLI; no source,
  test or requirements change.)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create "<title stating the choice> (TASK-8.7 Q-1)" -s accepted --plain`; the evidence goes in TASK-8.7's implementation notes and final summary. | yes | Same path as decision-1 to decision-6 (TASK-3.24 A-1); the CLI has no body option; CLAUDE.md forbids hand-editing decision files. | Edit the decision file by hand (forbidden). |

## 3. Current system
Facts the decision rests on (all opened and checked):

- **The labels.** `situationLabel(situation)` returns `SITUATION_LABELS[situation]` (`src/advice/explain.ts:66-69`).
  Approved values (`src/advice/explanations.ts:215-222`, TASK-8.5 Q-1): unopened "in an unopened pot";
  limpers "facing one or more limpers"; raise "facing a raise"; raise-and-calls "facing a raise and calls";
  re-raise "facing a re-raise"; blind-defence "defending the blind against a raise". They are lower-case
  phrases written to follow a position (`explanations.ts:214`, TASK-8.5 A-3). The only consumer is the locked
  test `tests/advice/labels.acceptance.test.ts:49`.
- **Hint card chart line.** `hintCard` sets `chartBasis: chartBasisText(rec)` for basis `'chart'`
  (`src/table/hint.ts:129-137`). `chartBasisText` fills `CHART_BASIS = 'From the {chart} chart: {action} {hand}
  from {position}'` (`explain.ts:71-81`, `explanations.ts:193`). It is rendered as
  `<p data-part="hint-chart">` (`src/ui/table/HintCard.tsx:29`). Example today (storyboard preflop decision,
  CO A9o in an unopened pot, `tests/support/table-scenarios.ts:157-158`): "From the 6-max chart: raise A9o from
  the cutoff".
- **Review entry chart line.** `chartLine(view, recommended)` recomputes the same text from the stored decision's
  view: `chartBasisText({ referenceSize, position: chartSpotOf(view, referenceSize).position, handClass,
  action })` (`src/table/review.ts:131-139,167`), rendered as `<p data-part="chart">`
  (`src/ui/table/ReviewPanel.tsx:99`). `chartSpotOf` already returns `{ position, situation }`
  (`src/advice/preflop.ts:90-102`), so a review could show the situation with no hand-record format change, and
  older saved hands would show it too.
- **The situation is already said once.** The explanation's first sentence is `PREFLOP_CONTEXT[situation]`
  (`explain.ts:43-45`; `explanations.ts:145-158`), e.g. unopened: "No one has entered the pot yet and you sit in
  the cutoff (CO), so position, … decides how many hands are worth playing." The hint card and review entry both
  show this explanation (`HintCard.tsx:35`; REQ-042.1, REQ-043.1). A label would repeat that fact in shorter form
  on the line above.
- **Requirements.** REQ-042.6 (`requirements.md:761`) pins the hint example "From the 6-max chart: raise A9o
  from the cutoff"; REQ-043.9 (`:782`) says preflop review entries show the chart basis. Neither mentions the
  situation. REQ-032.2 (`:590`) lists the situations, already split per decision-4. REQ-061.2 (`:1121`):
  original text (labels already approved).
- **Tests that pin the chart line text** (would need re-pinning under B; owner = task that locked it, from
  `doit/*/state.json` `locked_tests`):
  - `tests/ui/hint.acceptance.test.tsx:229` — locked by TASK-8.1 — exact "From the 6-max chart: raise A9o from the cutoff".
  - `tests/ui/review-numbers.acceptance.test.tsx:180,205` — locked by TASK-9.3 and TASK-7.43 — same exact string.
  - `tests/ui/review-numbers.acceptance.test.tsx:216` and `e2e/review-numbers.spec.ts:190` (locked by TASK-9.3)
    compare with `chartBasisText(rec)`; they follow automatically if `chartBasisText` itself gains the label
    (both pass a full recommendation that has `situation`).
  - `tests/advice/labels.acceptance.test.ts:29-30` — locked by TASK-8.5 — calls `chartBasisText` without a
    situation and expects "… from <position>"; it breaks if `situation` becomes a required input of
    `chartBasisText` (keep it optional or add a new function to avoid this).
  - Unlocked unit tests: `tests/table/hint.test.ts:214`, `tests/table/decision-grades.test.ts:203`,
    `tests/advice/explain.test.ts:448-486`.
  - `e2e/hint.spec.ts` (locked by TASK-8.1) does not pin the chart text (no match for "From the").
  - Under C (separate line), the exact-string pins above stay valid; only new assertions are added.
- **Length and layout.** The supported window is 1280 × 720 and larger (REQ-060, `requirements.md:1102-1104`); no
  phone layout. The hint card is at most 640 px wide with 18 px side padding (`src/ui/styles.css:752-763`).
  Longest B strings: "From the full-ring chart: raise A9o from the small blind, defending the blind against a
  raise" (93 characters) and "From the full-ring chart: fold 72o from an early seat (UTG+1), facing one or more
  limpers" (89); today's longest is about 60. At about 75 characters per line these wrap to two lines, adding
  one text line to the card in the worst case. REQ-042.2 / TASK-8.1 AC#5 (card never covers the action bar at
  10 seats, 1280 × 720) must stay green; C adds one line in every preflop hint.
- **Accessibility.** The card is `aria-live="polite"` (`HintCard.tsx:17`), so every added word is read out by a
  screen reader each time the hint opens. The text is plain and React-escaped; no new control.
- **Redundancy in one label.** Blind defence under B reads "from the big blind, defending the blind against a
  raise" ("blind" twice). TASK-7.42 will replace this label with early/late raiser labels anyway.
- **Re-raise split (decision-4).** TASK-7.40 (6-max), TASK-7.41 (full ring) and TASK-7.42 (blind defence) add new
  `Situation` ids and must ask for their label and context wording. TASK-7.40 AC#4 and TASK-7.42 AC#3 already
  say "When it appears in a hint, a review or the preflop explanation, Then it shows a label and a context
  sentence". Today the label never appears, so under Q-1 A those two ACs are reworded (SPEC-04). TASK-7.41 AC#3 ("any new user-visible label or context text") is fine either way.
- **No other task owns this.** `backlog search "situation label"` finds only TASK-8.5, TASK-8.7 and the split
  stories; TASK-8.4 and TASK-9.9 cover only approximate and short-stack labels (doc-155 follow-ups).

Existing code to reuse (none needed by this task; listed for any future change):
- `src/advice/explain.ts::situationLabel` → the label text.
- `src/advice/preflop.ts::chartSpotOf` → the situation for a review entry, from the stored view.
- `src/advice/explain.ts::chartBasisText` → would take an optional situation (keeps the TASK-8.5 locked test).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The hint card chart line and preflop review entries do not show the situation label; the explanation's first sentence stays the place the situation is stated; no requirements change; no follow-up story; TASK-7.40 AC#4 and TASK-7.42 AC#3 reworded to match | B label appended to the chart line; C separate "Situation:" line | The situation is already stated in the explanation; avoids re-pinning locked tests (TASK-8.1, TASK-9.3, TASK-7.43) before the re-raise split changes the situations again | yes | user (Q-1) |
| D-2 | No product code in this task, whatever Q-1's answer | Build the display here | The task is a spike; AC#1 says a build task is created for "yes". | no | n/a |
| D-3 | Q-2 (blind-defence wording in the chart line) is moot under Q-1 A; the approved label is kept | Shorter chart-line wording | Nothing shows the label | no | user (Q-2) |

## 5. Design

### Files to create / modify
No source, test or requirements file changes. The only files that change are Backlog files, written by the
orchestrator through the backlog CLI (never by hand):
- `backlog/decisions/decision-7 - <title from §5>.md` — new decision (SPEC-01)
- `backlog/tasks/task-7.40 - Split-the-6-max-re-raise-spots-into-own-raise-re-raised-and-re-raised-when-I-had-not-raised.md` — AC#4 reworded (SPEC-04)
- `backlog/tasks/task-7.42 - Split-blind-defence-by-an-early-or-a-late-raiser-at-6-max-and-full-ring.md` — AC#3 reworded (SPEC-04)
- `backlog/tasks/task-8.7 - Decide-whether-hints-and-reviews-show-the-situation-label.md` — notes, AC#1, summary (SPEC-03, SPEC-05)

### Exact Backlog text
- Decision title: `Hints and reviews do not show the situation label; the explanation states the situation; no follow-up story (TASK-8.7 Q-1)`
- TASK-7.40 AC#4 and TASK-7.42 AC#3 become: `Given each new situation, When the chart is authored, Then it has a label in SITUATION_LABELS and a context sentence shown in the preflop explanation, both with wording the user approved in this story's Q&A`
  (via `backlog task edit <id> --remove-ac <n> --ac "<text>"` or the CLI's AC replace option; the AC keeps its
  meaning except that the label is defined, not shown).

### Rules and algorithms
N/A — no code.

### Error handling and configuration
N/A.

## 6. Behaviour specification

### SPEC-01: The user's choice is a Backlog decision
- Verifies: AC#1
- Behaviour: Given Q-1 A, When the orchestrator runs `backlog decision create` (A-1) with the title in §5 and `-s accepted --plain`, Then `backlog decision list --plain` shows it (expected decision-7) with status accepted.
- Verification: command `backlog decision list --plain`

### SPEC-02: Requirements are unchanged
- Verifies: AC#1
- Behaviour: Given Q-1 A, When the task finishes, Then `dreams/limit-holdem-trainer/requirements.md` has no diff against main (REQ-042.6 and REQ-043.9 keep their text; no changelog row).
- Verification: command `git diff --exit-code main -- dreams/limit-holdem-trainer/requirements.md`

### SPEC-03: No product code changes and the evidence is on the task
- Verifies: AC#1
- Behaviour: Given the decision, When the task is done, Then no file under `src`, `tests`, `e2e`, `tools` or `docs` has changed, no follow-up story is created, and TASK-8.7's implementation notes (`backlog task edit TASK-8.7 --append-notes`) state the Q-1 answer and the key facts from §3: the explanation's first sentence already states the situation, the review could recompute it from the stored view, the locked tests and their owners, the worst-case length (93 characters), and the TASK-7.40/7.42 AC rewording. They point to this spec's §3.
- Verification: command `git diff --stat main -- src tests e2e tools docs`

### SPEC-04: The split stories no longer promise a shown label
- Verifies: AC#1
- Behaviour: Given Q-1 A, When the orchestrator edits them with the backlog CLI, Then TASK-7.40 AC#4 and TASK-7.42 AC#3 read exactly the text in §5, their other ACs are unchanged, and TASK-7.41 is untouched.
- Verification: command `backlog task view TASK-7.40 --plain && backlog task view TASK-7.42 --plain`

### SPEC-05: AC#1 is ticked with pointers
- Verifies: AC#1
- Behaviour: Given SPEC-01 to SPEC-04, When the task finishes, Then AC#1 is checked (`backlog task edit TASK-8.7 --check-ac 1`) and the final summary cites the decision id, "no requirements change", "no follow-up story (Q-1 A)" and the TASK-7.40/7.42 AC rewording.
- Verification: command `backlog task view TASK-8.7 --plain`

## 7. Edge cases
- TASK-7.40 or TASK-7.42 already in progress when the AC is reworded: neither has started (both To Do), so the
  edit lands before their specs are written.
- Other cases (input, concurrency, permissions): N/A, no code runs.

## 8. Security considerations
N/A: no code, input, dependency, persisted-format or randomness change.

## 9. Non-functional
N/A: no code changes; the hint card layout (REQ-042.2) is unchanged.

## 10. Test plan
- Test command: `npm test` (unchanged by this task)
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — no user-facing behaviour changes in this spike.
- New tests: none. SPEC-01, SPEC-04, SPEC-05 are orchestrator CLI steps; SPEC-02 and SPEC-03 are empty diffs.
  Judge: confirm the §3 citations (`explain.ts:66-81`, `explanations.ts:193,215-222`, `review.ts:131-139`,
  `hint.ts:129-137`, `requirements.md:761,782`), then check SPEC-01 to SPEC-05.

## 11. Open questions
None. Q-1 was answered A and Q-2 (moot) keep-label on 2026-11-27 (`doit/TASK-8.7/qa.md`); folded into D-1, D-3,
§5 and SPEC-01 to SPEC-05.

## 12. Clarifications log
See `doit/TASK-8.7/qa.md`.
