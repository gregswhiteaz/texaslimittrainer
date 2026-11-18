# Rebuild dreamit around evidence, not trust

The best way to rewrite dreamit is to keep its five-stage shape but give each stage something it can be checked against. **The Interrogator and Solidifier stay inline in the main conversation**, because subagents cannot use AskUserQuestion. They work through fixed coverage checklists, and every requirement is recorded with a stable ID, numbered clauses, a source and a fit criterion. **The Weaver works in two passes.** First it drafts a story map (epics by user activity, release slices as milestones, a walking skeleton first), and the user approves that map before anything touches Backlog.md. Then a bundled script applies the approved plan through the `backlog` CLI. **The Judge also works in two layers.** A deterministic coverage script checks clause-level traceability, dependency direction, ordinal order and lint, and then a fresh-context LLM judge with a rubric rules on whether each clause is covered in substance. PASS requires script exit 0 plus zero CRITICAL or HIGH findings. This answers the main weaknesses in today's files. The current Solidifier has no completeness sweep. The current Weaver writes one flat list of tasks, with no epics or milestones, and keeps a direct-file fallback that breaks this project's CLAUDE.md. The current Judge trusts its own reading of raw task files, which is the setup in which LLM judges are lenient. Backlog.md v1.55.3 has every primitive this design needs: parent tasks, milestones, cycle-checked dependencies, ordinals, DoD defaults and docs. It also has sharp edges, such as unvalidated milestone titles, `--dep` replacing the whole list, and a parent task that shows as "ready" while its subtasks are unfinished. The blueprint has to work around each of these on purpose.

## Today's dreamit trusts the very agents it should be auditing

The current `/dreamit` SKILL.md already has the right skeleton. It runs the interactive stages inline, forbids weaving before explicit approval, caps judge loops at three rounds, and journals every stage. Its weaknesses are in the details of each stage. The Solidifier says to "include requirements the user didn't mention" and to cover NFRs, but gives no checklist. Completeness is therefore left to the model's memory. That is risky: LLM analysts reach high coverage but low diversity. **Claude 3 Sonnet stories hit 96% coverage of ground truth but only 44% diversity versus 98.6% for students**, a "conservative generation strategy that favors familiarity over exploration" ([arXiv 2507.15157](https://arxiv.org/html/2507.15157v1)). The requirement format has one "Statement" plus loose acceptance criteria. It has no rationale, no source and no clause IDs, so nothing downstream can check coverage below the level of a whole requirement.

The `dream-weaver` agent has three structural problems. First, its direct-file fallback ("write the files directly in Backlog.md's on-disk format") contradicts the project CLAUDE.md, which states "Do not edit Backlog task, draft, document, decision, or milestone markdown files directly." Second, it encodes traceability as one `req-NNN` label per requirement. Labels are not validated against config ([Backlog.md](https://github.com/MrLesk/Backlog.md)), so this quietly fills the label list with dozens of one-off labels. Third, it treats epics, milestones and ordinals as optional, so the default output is a flat list. Patton calls that "a bag of context-free mulch" that hides gaps ([Jeff Patton](https://jpattonassociates.com/the-new-backlog/)). The `dream-judge` builds its own coverage matrix from `backlog/tasks/` files, with no mechanical check and no severity scale. That matters because **LLM judges matched humans (Cohen's κ = 0.87) only when given the full codebook** ([arXiv 2507.15157](https://arxiv.org/html/2507.15157v1)). They also show self-preference and leniency bias ([arXiv 2410.21819](https://arxiv.org/html/2410.21819v1); [arXiv 2406.12624](https://arxiv.org/pdf/2406.12624)).

## Complete requirements come from checklists, not open-ended questions

Professional elicitation gets to completeness by sweeping several independent checklists one after another. The quality bar comes from ISO/IEC/IEEE 29148. Each requirement must be necessary, singular, unambiguous, verifiable, complete, correct and feasible. The set as a whole must be complete, consistent, feasible, comprehensible and validatable, and **"a set can fail even when each requirement passes on its own"** ([Modern Requirements summary of 29148](https://www.modernrequirements.com/?p=32595)). Volere's 27-section template is the topic map. Its often-forgotten sections include business rules, assumptions, data dictionary, migration, risks, documentation and training, and an explicit "Waiting Room" for deferred requirements ([Volere](https://www.volere.org/templates/volere-requirements-specification-template/)). Two analysis models find missing behaviour more reliably than questions do. One is an **event-response table, read as a decision table so that every event × state combination gets a defined outcome** ([Wiegers, Modeling System Events](https://modernanalyst.com/Resources/Articles/tabid/115/ID/2932/Modeling-System-Events.aspx)). The other is a state-transition model; converting a state table into one exposed two missing requirements in Wiegers' example ([Wiegers, Modeling System States](https://medium.com/swlh/modeling-system-states-state-transition-diagrams-and-state-tables-d37fe908ff23)).

The Interrogator should own business-level material: Volere sections 1 to 8, meaning purpose, stakeholders, constraints, glossary, assumptions and scope. It should deliberately go broad before going deep. Wiegers' first trap is accepting a proposed solution as if it were the need, so the Interrogator separates the two ([Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)). BMAD's elicitation menu is a good source of divergent moves, such as stakeholder round table, red team vs blue team and "if only…" hindsight. It ends with an explicit "Proceed / No further actions" exit ([BMAD elicitation-methods](https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v4.44.3/bmad-core/data/elicitation-methods.md)). Interviewer discipline matters too. An LLM interviewer **"makes a similar number of common mistakes during interviews as a human interviewer" while eliciting up to 73.7% of requirements** ([LLMREI](https://arxiv.org/html/2507.02564v1)), and follow-up questions guided by a mistake taxonomy outperformed human-written ones ([arXiv 2507.02858](https://arxiv.org/pdf/2507.02858v1)).

The Solidifier should copy GitHub Spec Kit's `/clarify` mechanics almost directly:

- Keep a coverage table that scores each category Clear, Partial or Missing.
- Rank questions by impact × uncertainty, and skip any question whose answer would not change implementation or validation.
- Give every question a **Recommended** option with its reasoning.
- **Write each answer into the spec immediately**, replacing contradictory text rather than adding a second version ([Spec Kit clarify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md)).

Spec Kit's other rule, "Don't guess: … mark it" with `[NEEDS CLARIFICATION: …]`, turns the exit gate into a grep ([spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)). Spec Kit caps a session at five questions. Dreamit builds requirements from scratch, so it needs a larger, explicit budget per area instead.

Statements should use EARS ("While <precondition>, when <trigger>, the <system> shall <response>"). EARS has a fixed clause order and an unwanted-behaviour pattern ("If <trigger>, then …") that forces error handling into the open ([Mavin, EARS](https://alistairmavin.com/ears/)). Subjective words such as fast, easy, robust, "etc." and "and/or" are banned ([Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)). Each NFR carries a Volere-style fit criterion: "a measurement against which [the requirement] can be tested" ([Volere](https://www.volere.org/templates/volere-requirements-specification-template/)).

Sign-off is a real baseline, not a rubber stamp: "all approvers must understand what they're approving and the cost of future changes." The analyst's job is to be "good enough to proceed at acceptable risk", with TBDs carrying an owner and resolved before construction ([Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)). There is a tension here worth naming. Recommended answers speed the user up but risk leading them. Exhaustive sweeps catch gaps but risk fatigue and analysis paralysis. The blueprint handles both by always offering an "Other / none of these" option, letting the user mark whole categories N/A in one answer, and enforcing a per-area question budget.

## Stories earn trust through vertical slices, clause-level traces and a mapped order

A professional backlog is organised by user activity, not by architectural layer. Patton's story map runs activities left to right in narrative order, with stories hanging beneath them in order of necessity. **"The highest-placed stories form the walking skeleton — the smallest end-to-end system. Build this first."** Releases are horizontal swim lanes, read left to right and top to bottom, "so we never release a car without brakes" ([Jeff Patton](https://jpattonassociates.com/the-new-backlog/)). Thoughtworks warns that epics named 'Infrastructure', 'Front-end/Back-end' or 'Security' **"encourage horizontal slicing"**. Such epics produce stories that are "done" but cannot be released ([Thoughtworks](https://www.thoughtworks.com/insights/blog/user-stories-tale-epic-confusion)). Each story must pass INVEST, and **"Valuable is the most common failure"**: a story that is really a task or a component must be merged with other pieces until it delivers value ([Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/); [Bill Wake](https://xp123.com/invest-in-good-stories-and-smart-tasks/)).

Large stories are split by behaviour, using these patterns:

- workflow steps, simplest end-to-end case first
- CRUD operations, since "manage" signals several
- business-rule variations
- data variations
- defer-NFR, with a warning about hidden debt
- spike, as a last resort

([Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/); [Mountain Goat SPIDR](https://www.mountaingoatsoftware.com/blog/five-simple-but-powerful-ways-to-split-user-stories)).

Current BMad practice adds rules that suit an AI writer well:

- The first story is a **tracer bullet**: the thinnest path through every layer.
- The riskiest story comes second.
- Split a story rather than shrink it, if shrinking would leave a placeholder.
- Merge any story whose setup outweighs its work.
- Every story carries `covers` (requirement IDs) and `after` (dependencies) fields.
- **"Before approval, fresh agents check requirement coverage, dependency loops, and missing prerequisites"**, and they rerun on every reorder ([BMad: Plan an epic's stories](https://docs.bmad-method.org/plan/plan-an-epics-stories/)).

Acceptance criteria are the "Confirmation" that makes a story real ([Ron Jeffries](https://ronjeffries.com/xprog/articles/expcardconversationconfirmation/)). Write them as declarative Given/When/Then that would not change if the implementation changed ([Cucumber, Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)). NFRs can go in three places:

- a measurable AC on the one story they constrain,
- a project DoD item when they apply everywhere, since SAFe notes NFRs are "typically revisited as part of the definition of done" ([SAFe NFRs](https://framework.scaledagile.com/nonfunctional-requirements)),
- a dedicated, explicitly sequenced story when they need their own work.

Traceability has to run in both directions and be checked at clause level: forward, every requirement clause reaches a story AC; backward, every story AC has a requirement behind it ([TestRail](https://www.testrail.com/blog/requirements-traceability-matrix/)). A link proves only intent. "A link describes the planned relationship; it does not prove the implementation exists" ([yrkan.com](https://yrkan.com/blog/requirements-traceability-matrix/)). That is why the Judge needs a semantic layer on top of the mechanical one. The current Weaver links whole requirements to whole stories. The redesign tags every story AC with the requirement clause it confirms, for example `[REQ-012.2]`, so coverage becomes something a script can count. BMad's Story Draft Checklist adds one more rule: **"summarize, don't just reference."** A story should carry the requirement text it needs, so an implementing agent can work from the story alone ([BMAD story-draft-checklist](https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v4.44.3/bmad-core/checklists/story-draft-checklist.md)).

## Backlog.md can enforce order, if the Weaver works around six sharp edges

Backlog.md v1.55.3 has **no epic entity and no `sequence` command**. It does have every building block needed ([Backlog.md](https://github.com/MrLesk/Backlog.md)):

- **Parent tasks.** `-p TASK-N` creates `TASK-N.1`, `TASK-N.2`, numbered in creation order.
- **First-class milestones.** `backlog milestone add` returns IDs `m-0`, `m-1`, and `milestone list` reports completion counts.
- **Dependencies validated when written.** Cycles, self-dependencies and missing IDs are rejected ("No changes were applied"), and `backlog doctor` reports cycles across the project.
- **Ordinals.** `task list` sorts by ordinal, then priority, then ID.
- **Readiness.** `task list --ready` and the `--json` field `isReady` derive readiness from dependencies.
- **DoD defaults.** Items in config `definition_of_done:` are added to every new task.
- **Docs.** `doc create` followed by `doc update --content` creates and fills a document.

Upstream gives the mapping directly: subtasks "when the work shares one goal", milestones assigned with `-m`, and "do not pass milestone IDs such as `m-0` to `--parent`" ([Backlog.md CLI-INSTRUCTIONS](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)).

The sharp edges are what the design must account for:

1. **An unknown milestone title is accepted silently.** It creates a phantom `Nope: Nope (0/1 done)` milestone, so always create milestones first and pass `m-N` IDs.
2. **Labels are never validated.** A typo in the dream label just creates a new label.
3. **`--dep` on edit replaces the whole list, and there is no `--add-dep`.** Every edit must re-send the complete dependency list.
4. **A parent is not a dependency.** The test parent `TASK-1` appeared in `--ready` while its subtasks were unfinished.
5. **The ordinal is one flat global order**, not an order within each parent.
6. **Decision bodies cannot be written via the CLI**, and DoD defaults cannot be set with `config set`.

([Backlog.md](https://github.com/MrLesk/Backlog.md)). Multi-line text also needs care. `$'…'` quoting "is rejected by tree-sitter-based agent sandboxes", and backticks inside double quotes trigger command substitution ([CLI-INSTRUCTIONS](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)).

Together these point to one design: **the Weaver writes a plan as data, and a bundled script applies it.** The script calls `backlog` with an argument array, never through a shell string, so quoting is no longer a problem. It creates milestones, then epics, then stories in topological order, reads each new ID from the `--plain` output, and sets every dependency list in full. This still satisfies the CLAUDE.md rule, because every write goes through the CLI.

The "parent shows as ready" problem has a neat fix. **After an epic's stories exist, set the epic's dependencies to all of its child stories.** The epic then becomes "ready" only when its stories are done, which matches the upstream rule to "finish the parent only when all are complete." There is no cycle, because the parent-to-child link is not a dependency edge. This is my inference and was not tested, so the first live run should confirm it with `backlog doctor` and `task list --ready`.

## A two-layer Judge turns PASS into evidence

The research converges on a hybrid judge. On 182 stories, the rule-based AQUSA tool had the best precision (0.61) and an LLM had the best recall (0.81). The authors conclude **"neither rule-based nor LLM-based approaches suffice in isolation"** ([ICSE JAWs 2026](https://conf.researchr.org/details/icse-2026/jaws-2026-papers/29/Towards-Automated-User-Story-Quality-Assessment-with-LLMs-An-Empirical-Study-on-Synt)). Spec Kit's `/analyze` supplies the LLM layer's protocol:

- strictly read-only;
- six detection passes: duplication, ambiguity, underspecification, constitution alignment, coverage gaps and inconsistency;
- four severities;
- a coverage table with one row per requirement key;
- a list of tasks that map to no requirement;
- **deterministic IDs**, so a rerun on unchanged files gives the same findings.

([Spec Kit analyze.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/analyze.md)). Anthropic found that the most human-aligned evaluator was a single LLM call with a rubric, producing scores plus pass/fail. It also found that state-changing agents should be judged on the end state they leave behind ([Anthropic engineering](https://www.anthropic.com/engineering/multi-agent-research-system)). For dreamit, that end state is what `backlog task list --json` reports, not the Weaver's log.

Judge independence takes three things:

- **A fresh context.** Claude Code subagents already start "with a fresh, isolated context window" ([subagents docs](https://code.claude.com/docs/en/sub-agents)).
- **A different model where practical.** BMAD readiness sources recommend this, though as advice rather than an enforced rule ([Tessl registry](https://tessl.io/registry/skills/github/bmad-code-org/BMAD-METHOD/bmad-check-implementation-readiness)).
- **Mandatory evidence.** Every "covered" verdict must cite a story ID and AC number.

Even with all three, a judge cannot catch a requirement the user never stated. That is why the story-map approval gate and the Diarist's "unresolved assumptions" section matter: the human stays in the loop where automation is blind. Anthropic also observed that human testers caught failures automation missed ([Anthropic engineering](https://www.anthropic.com/engineering/multi-agent-research-system)).

## Redesign blueprint

### Topology and files

Claude Code facts that shape the layout ([skills docs](https://code.claude.com/docs/en/skills); [subagents docs](https://code.claude.com/docs/en/sub-agents)):

- Keep SKILL.md under 500 lines and move reference material into supporting files.
- `${CLAUDE_SKILL_DIR}` lets bundled scripts run, and `` !`cmd || true` `` injects live state at invocation time.
- **AskUserQuestion is removed from every subagent.**

```
~/.claude/skills/dreamit/
  SKILL.md                         orchestrator: state machine, gates, stage briefs (<300 lines)
  templates/vision.md              Volere §1–8 skeleton
  templates/requirements.md        record template (below)
  templates/story-map.md           epics × milestones grid + ordering rationale
  templates/weave-plan.schema.json plan-as-data contract
  checklists/coverage-gates.md     15 gates, each Clear | Partial | Missing | N/A(reason) | TBD(owner)
  checklists/interviewer-mistakes.md
  checklists/requirements-quality.md   "unit tests for English" (Spec Kit /checklist style)
  checklists/judge-rubric.md           codebook + severities (below)
  scripts/lint_requirements.py     banned words, EARS shape, clause IDs, Source/Fit present, zero NEEDS CLARIFICATION
  scripts/apply_plan.py            weave-plan.json -> backlog CLI (argv arrays, ID capture, full dep lists)
  scripts/coverage.py              mechanical judge (below); exit 0 = clean
~/.claude/agents/dream-weaver.md   two modes: MAP and APPLY/REVISE; tools Read, Write, Edit, Bash, Glob, Grep
~/.claude/agents/dream-judge.md    tools Read, Glob, Grep, Bash, Write; disallowedTools: Edit; model differs from weaver
~/.claude/agents/dream-diarist.md  tools Read, Write, Glob, Grep, Bash
dreams/<slug>/  state.json, journal.md, qa-log.md, vision.md, requirements.md, story-map.md,
                weave-plan.json, id-map.json, coverage-<n>.json, judgment-<n>.md, report.md
```

At the top of SKILL.md, inject `` !`cat dreams/*/state.json 2>/dev/null || true` `` so that a new invocation resumes at the recorded stage.

### Stage-by-stage design and gates

| Stage | Runs where | Does | Exit gate (all must hold) |
|---|---|---|---|
| 0 Setup | inline | Pick the slug. Create the `dreams/<slug>/` folder, `state.json` and the journal. Run `backlog instructions overview` and `task-creation`. Confirm `backlog/` exists, and run `backlog config set remoteOperations false` if there is no git remote (the project dir is not a git repo). | The CLI is present. **No fallback to writing files directly.** |
| 1 Interrogator | inline | Cover Volere §1–8: problem, user classes, goals, success metrics, scope in/out/waiting room, constraints, glossary seeds. Use 1–2 divergent methods (red team, round table, hindsight). Separate needs from proposed solutions. Ask 3–5 questions per batch, multiple choice with Recommended + Other where possible. Read back a summary every batch. | **G1:** vision.md is complete against its template. The user picks "Approve vision" in AskUserQuestion. |
| 2 Solidifier | inline | Walk the 15 coverage gates area by area: purpose, user classes and permissions, scope, glossary, entity × CRUD × lifecycle tables, event × state tables, edge-case sweep, business rules, data, interfaces, NFR sweep (25010 + Volere 10–17), constraints, assumptions, risks/TBD, operations. Draft requirements in EARS with numbered clauses. Write each answer immediately and log it in `qa-log.md`. Lint after each area. Present each area for Confirm / Edit / Reject / Defer. Then run a self-review as three simulated reviewers (tester: "can I write a test?"; developer: "can I build without asking?"; user: "does this solve my problem?") and put their findings to the user as questions. | **G2:** `lint_requirements.py` exits 0 (no banned words, every REQ has Source, Rationale, a Fit criterion and ≥1 clause, zero `[NEEDS CLARIFICATION]`). Every coverage gate is resolved. Musts are under ~60% of the total (warn only). No blocking TBDs. The user approves each area, then the whole baseline. Requirements are frozen as v1.0 and published as a Backlog doc. |
| 3a Weaver, MAP | subagent | Read requirements.md. Produce `story-map.md` and `weave-plan.json`: epics as user activities in journey order, milestone slices (M1 walking skeleton, M2 MVP, M3+), stories with role / want / so-that, ACs tagged `[REQ-x.y]`, deps, ordinals, NFR placement. Writes nothing to Backlog. | `coverage.py --plan weave-plan.json` exits 0, so it is checked before anything is written. |
| 3b Map review | inline | Show the epic × milestone grid, the walking skeleton path, the first 5 stories in order and any enablers with their justification. | **G3:** the user approves the map, or gives edits that go back to 3a. |
| 3c Weaver, APPLY | subagent | Run `apply_plan.py`, which writes `id-map.json` (plan key → TASK ID). Then run `backlog doctor`. | doctor is clean, and the readback matches the plan. |
| 4 Judge | subagent (fresh, different model) | Run `coverage.py --live` (mechanical layer), then the rubric review (semantic layer). Write `judgment-<n>.md`. | **PASS = script exit 0 AND zero CRITICAL/HIGH.** |
| 4→3 Revise | subagent | The Weaver edits `weave-plan.json` for the listed finding IDs only. `apply_plan.py --update` applies the diffs, re-sending full dependency lists. | At most 3 rounds. Findings classed as requirement-level go to the user (back to Stage 2 for those REQs only, with a change-log entry). |
| 5 Diarist | subagent | Read the files only. Produce the report: RTM, milestone burn-up table, `task list --ready` start list, a judge history, the waiting room and the assumptions register. | report.md is written. Offer an Artifact page. |

Keep the existing rules: "never fabricate user decisions", "go back" and "skip → deferred with reason".

### Requirement record template

```markdown
### REQ-012: Fold out of turn is rejected        <!-- ID stable; never renumber, only deprecate -->
- Type: Functional | NFR:<25010 characteristic> | Constraint | Business rule | Data | Interface
- Area: Play a hand            Priority: Must | Should | Could | Won't(v1)
- Statement (EARS): If a player submits an action when it is not their turn, then the game engine shall reject the action and leave game state unchanged.
- Clauses:
  - REQ-012.1 Action rejected with error code OUT_OF_TURN
  - REQ-012.2 Game state (pot, stacks, turn pointer) byte-identical before/after
- Fit criterion / examples: Given P2 to act, When P3 folds, Then error OUT_OF_TURN and state unchanged
- Rationale: fairness → G-2        Source: Q17 in qa-log.md (user)   Status: Confirmed
- Depends on / conflicts: REQ-009
```

Requirements.md also carries these sections: Goals (G-n), Glossary, Out of scope, Waiting room, Assumptions (each falsifiable, with impact and owner), TBD register, Clarifications log and Change log (v1.0 onward).

### Backlog.md conventions and command mapping

| Concept | Backlog.md encoding | Command (the apply script calls it with argv arrays) |
|---|---|---|
| Dream membership | label `dream-<slug>` on every task. Add it to config `labels:` once. | `-l dream-<slug>` |
| Requirements baseline | Backlog doc, type specification, path `dreams` | `backlog doc create "<Title> requirements v1.0" -t specification -p dreams --plain` → `backlog doc update doc-N --content "<file text>" --tags dream-<slug>` |
| Vision, story map, RTM | one doc each, same pattern | as above. Refresh the RTM doc after each judge round. |
| Decisions with rationale | doc under `-p decisions` (decision bodies cannot be filled via CLI) | `backlog doc create "ADR: <title>" -t other -p decisions` |
| Release slice | milestone, created first, referenced by ID | `backlog milestone add "M1 Walking skeleton" -d "<slice goal>" --plain` → capture `m-N` |
| Epic | parent task: type feature, labels `epic,dream-<slug>`. Description holds the goal and "Done when". ACs are epic outcomes, tagged with goal IDs. | `backlog task create "<Activity>" --type feature -l epic,dream-<slug> -d "<goal>" --ac "<outcome> [G-1]" --ordinal <band> --doc doc-N --plain` |
| Story | subtask of its epic. Milestone, deps, ordinal, refs. | `backlog task create "<verb-phrase outcome>" -p TASK-E --type feature -l dream-<slug> -m m-N --priority High --dep TASK-a,TASK-b --ordinal 1000 -d "<As a … I want … so that …\n\nCovers: REQ-012, REQ-013\n\nRequirement text (summarised)…>" --ac "Given … When … Then … [REQ-012.1]" --dod "<story-specific NFR check>" --ref dreams/<slug>/requirements.md --doc doc-N --plain` |
| Enabler / spike | story under a "Platform enablers" epic. A spike gets `--type spike` and question-ACs. It must be listed as a dependency of ≥1 user story. | as above |
| Epic completion gate | the epic depends on all of its child stories (keeps it out of `--ready`) | after children exist: `backlog task edit TASK-E --dep TASK-E.1,TASK-E.2,…` (always the full list) |
| Global DoD | config `definition_of_done:`, set **before** any story is created | ask the user, then `backlog config` (interactive) or edit `backlog/config.yml` (a config file, not a task file). `config set` cannot do it. |
| Readback | JSON for scripts, plain for humans | `backlog task list -l dream-<slug> --json`, `backlog task view TASK-x --json`, `backlog milestone list --plain`, `backlog doctor` |

**Ordinal convention.** Epics get 100–900 in journey order. Stories get 1000, 2000, … in one global topological order, ranked by milestone, then walking-skeleton status, then risk (riskiest early), then epic journey order, then value/size. Gaps of 1000 leave room to insert later. Ordinal is how the order is shown; `--dep` is the constraint that is actually enforced. **Dependency rules:** a story may depend only on stories with a lower ordinal, in the same or an earlier milestone, and only when it truly needs them. Prefer "given X exists" fixtures over dependency edges. A cycle means the slicing is wrong; fix the split instead of forcing an order. **Hierarchy depth:** epic → story only. Implementation tasks belong to later execution, not to dreamit.

### Mechanical coverage check (`coverage.py`)

The script runs on `weave-plan.json` (`--plan`) or on live Backlog JSON plus `task view --plain` AC lines (`--live`). Field names in `--json` should be confirmed on the first run, because only `dependencies`, `dependencyGraph` and `isReady` are documented ([CLI-INSTRUCTIONS](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)). It exits non-zero on any of the following:

| Check | Rule |
|---|---|
| C1 Forward coverage | Every active clause REQ-x.y appears in ≥1 story AC tag. |
| C2 Backward coverage | Every story AC has ≥1 tag. Every story has a `Covers:` line. No tag points to a deferred, rejected or nonexistent clause. |
| C3 Structure | Every story has a parent epic labelled `epic`, a milestone that exists in `milestone list`, and an ordinal. Every epic has ≥1 story in M1. |
| C4 Order | Every dependency has a lower ordinal and the same or an earlier milestone. `backlog doctor` is clean. Each epic's dependency list equals its children. |
| C5 Lint | Story has "As a / I want / so that" with a non-empty benefit, and no " and " or "manage/handle/support" in the I-want clause. 1–8 ACs. ACs match the Given/When/Then shape. No banned adjectives. No layer-named epics (Frontend, Backend, API, Database, Infrastructure). |
| C6 Priority | Story priority ≥ the highest-priority clause it covers. |

It emits `coverage-<n>.json`, which holds the RTM (clause → story#AC), orphans and violations. Finding IDs are deterministic (check code + key).

### Judge rubric (semantic layer)

| Severity | Finding classes (cite story#AC or REQ clause as evidence) |
|---|---|
| CRITICAL | A clause is tagged but the AC would still pass if the clause were not implemented (a false coverage claim). An AC contradicts a requirement. A Must is only partially covered, for example with a narrowed role, a dropped limit or value, or a missing error path. |
| HIGH | A story is not vertical (layer or task only) or not Valuable. An NFR fit criterion appears in no AC or DoD. A user-observable error/edge case implied by an "If…then" clause is missing. The walking skeleton (story 1 of each epic in M1) does not form an end-to-end path. A story depends on later work. There is scope creep (behaviour no REQ asks for). |
| MEDIUM | An AC is imperative or names UI or implementation details. The rationale is vague. A story has more than one capability and should be split. Two stories duplicate or overlap. Terminology drifts from the glossary. The story text lacks the requirement summary needed to work from it alone. |
| LOW | Wording, title style, or a missing optional ref/doc link. |

The judge brief requires these steps in order:

1. Read requirements.md and `coverage-<n>.json`, plus live `--json`/`--plain` views. Do not read the Weaver's log until step 4.
2. For each clause, answer "would this AC fail if the clause were unimplemented?"
3. Score the per-story INVEST items and the BMad "could you implement this as written?" check.
4. Compare against the Weaver's claims.
5. Emit the findings table (ID, severity, location, evidence, fix, Weaver-or-User), the coverage table, and a verdict computed by the rule rather than by judgment.

### Known pitfalls and their guards

| Pitfall | Guard |
|---|---|
| The interview runs in a subagent and loses AskUserQuestion | Stages 1, 2 and 3b stay inline. Never use `context: fork` for them. |
| A phantom milestone appears from a title typo | Create milestones first. Pass only `m-N` IDs. C3 checks against `milestone list`. |
| Dependencies are wiped by `--dep` on edit; there is no `--add-dep` | `apply_plan.py` always sends the complete list from the plan. |
| An epic shows as ready while its stories are open | The epic depends on its children (C4). Verify on the first run. |
| `$'…'` is rejected by sandboxes; backticks run as commands | Pass argv arrays from Python. No shell strings. |
| DoD defaults are not applied to tasks that already exist | Settle global DoD at G2, before APPLY. Use per-story `--dod` for specific NFRs. |
| Drafts change ID on promote, breaking deps and parents | Don't use drafts. Stage the plan in `weave-plan.json` instead. |
| `req-NNN` label sprawl (current Weaver) | One `dream-<slug>` label. Traceability goes in `Covers:` lines and AC tags. |
| The direct-file fallback breaks CLAUDE.md (current Weaver) | Delete it. If the CLI is missing, stop and tell the user. |
| Low-diversity, familiar requirements | Mandatory coverage gates plus divergent methods in Stage 1. |
| A lenient or self-preferring judge | Script first, fresh context, different model, evidence per clause, rule-based verdict. |
| Question fatigue and analysis paralysis | A per-area question budget, Recommended + Other options, bulk N/A, and TBDs with owners instead of stalling. |
| Context loss between agents | Pass every artifact by path. `state.json` records stage, round, gate approvals and doc/milestone IDs. |
| Re-runs creating duplicates | `id-map.json` makes apply idempotent: update when the plan key is mapped, create when it is not. |

## Conclusion

The core change is in where trust sits. Today dreamit trusts the model to be thorough at each step. The redesign gives every step a file that can be checked: a resolved coverage-gate table, a linted EARS baseline, a story map the user has approved, a plan-as-data file, and a coverage script whose exit code the Judge cannot argue with. The LLM is left to do what only it can: interview well, slice by behaviour, and judge whether an AC really confirms a clause. Backlog.md turns out to be a better order-enforcement engine than its lack of epics suggests. Milestones carry release slices, parent tasks carry epics, and cycle-checked dependencies, with the epic-depends-on-children trick, make `task list --ready` a trustworthy "what's next" view.

Some parts are still unproven and need checking on the first live run: the epic-depends-on-children behaviour, the exact `--json` field names, and whether a different-model judge measurably reduces leniency for *coverage* judgments as opposed to *story quality*. No study yet measures LLM requirements-coverage judges against human verdicts. Run the redesigned skill on one small idea, compare its backlog with the old skill's on the same seed, and inspect the Judge's CRITICAL findings by hand before relying on the loop.
