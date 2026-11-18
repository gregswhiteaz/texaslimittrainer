# Backlog.md (CLI `backlog`, npm `backlog.md`): command-level reference for building a structured backlog

Source conventions used below:
- **[LOCAL-HELP]** = output of `backlog <cmd> --help` / `backlog instructions <guide>` from the locally installed CLI, **v1.55.3** (`/opt/homebrew/bin/backlog`, latest GitHub release tag is also v1.55.3 per https://api.github.com/repos/MrLesk/Backlog.md/releases). Upstream repo: https://github.com/MrLesk/Backlog.md
- **[LOCAL-TEST]** = behaviour observed by running commands in a throwaway project at `/private/tmp/claude-501/bltest` (git init + `backlog init "Test" --defaults --agent-instructions none`). Nothing was created in the limitholdem project.
- **[README]** = https://github.com/MrLesk/Backlog.md/blob/main/README.md ; **[CLI-DOC]** = https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md ; **[ADV-CONFIG]** = https://github.com/MrLesk/Backlog.md/blob/main/ADVANCED-CONFIG.md

## 1. Exact `backlog task create` / `backlog task edit` flags and multi-line input

### Takeaway
`task create` supports everything needed for a professional story in one command: title, `-d` description, repeatable `--ac`, repeatable `--dod`, `-l` labels, `--priority`, `--type`, `-m` milestone, `-p` parent, `--dep`, `--ordinal`, `--ref`, `--doc`, `-s` status, `-a` assignee, `--due-date`, `--draft`. `task edit` adds granular add/remove/check/replace variants. Multi-line text needs REAL newlines (`$'a\nb'`, a literal newline inside quotes, or repeated `--append-*`); a literal `\n` is stored as text.

### Cited Findings
**`backlog task create [options] [title]` (v1.55.3)** — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
| Flag | Meaning |
|---|---|
| `-d, --description <text>` / `--desc` | Description (Markdown) |
| `-a, --assignee <assignees>` | One or more @names, comma-separated or repeatable; omitted -> `defaultAssignee`; `-a ""` -> unassigned |
| `-s, --status <status>` | Must be a configured status (case-insensitive) |
| `-l, --labels <labels>` | Labels, comma-separated or repeatable |
| `--priority <priority>` | Configured priorities (default High, Medium, Low) |
| `--type <type>` | Configured task types (default: bug, feature, enhancement, task, chore, docs, spike) |
| `--project <project>` | Only if `projects:` list configured |
| `--due-date <YYYY-MM-DD>` | Due date |
| `--ac <criteria>` / `--acceptance-criteria` | Acceptance criterion; repeat per item |
| `--dod <item>` | Extra Definition-of-Done item; repeatable |
| `--no-dod-defaults` | Don't add project DoD defaults |
| `--plan <text>` | Help says "only for already-started work created directly in an active status" |
| `--notes <text>` | Implementation notes (same restriction as plan per schema) |
| `--final-summary <text>` | Only for finished work created in terminal status |
| `--ordinal <number>` | Non-negative integer manual order |
| `-m, --milestone <milestone>` | Milestone by ID (e.g. `m-0`) or title |
| `--draft` | Create as draft (DRAFT-n) instead of task |
| `-p, --parent <taskId>` | Existing parent task ID (NOT a milestone ID) |
| `--depends-on <ids>` / `--dep <ids>` | Dependencies, comma-separated or repeatable |
| `--ref <reference>` | Reference URL/file path; repeatable |
| `--modified-file <path>` | Project-root-relative modified file; repeatable |
| `--doc <documentation>` | Documentation URL/file path; repeatable |
| `--plain` | Plain-text output of created task |

**`backlog task edit [options] [taskIds...]`** (several IDs apply the same change to all) — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Scalars: `-t/--title`, `-d/--description`, `-s/--status`, `--priority`, `--type` (empty clears), `--project`, `--due-date`, `--clear-due-date`, `--ordinal`, `-m/--milestone`, `--clear-milestone`, `-a` (REPLACES all assignees; `""` clears).
- Labels: `-l/--label` (REPLACE all; note singular `--label` on edit vs `--labels` on create), `--add-label`, `--remove-label`, `--clear-labels`.
- Acceptance criteria: `--ac` (append), `--remove-ac <i>`, `--check-ac <i>`, `--uncheck-ac <i>` (1-based, repeatable), `--acceptance-criteria <c>` (REPLACE whole list; repeat per item; matching trimmed text keeps its checked state), `--clear-ac`.
- DoD: `--dod` (append), `--remove-dod <i>`, `--check-dod <i>`, `--uncheck-dod <i>`.
- Plan/notes/summary: `--plan` (replace), `--append-plan` (repeatable, applied after `--plan`), `--notes` (replace), `--append-notes`, `--final-summary`, `--append-final-summary`, `--clear-final-summary`, `--comment <text>` + `--comment-author <author>` (append-only comments; standalone `---` lines reserved).
- Dependencies: `--dep`/`--depends-on` (SETS/REPLACES the list; `""` clears), `--clear-deps`. There is NO `--add-dep` (tested: `error: unknown option '--add-dep'`) — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md). To add one dependency you must pass the full desired list.
- References/docs: `--ref` (replace), `--add-ref`, `--remove-ref`, `--clear-refs`; `--doc` (replace), `--add-doc`, `--remove-doc`, `--clear-docs`; `--modified-file`.

**Multi-line input**
- Help text: "Multi-line values need real newlines; a literal \n is stored as text. Example (bash/zsh): --description $'First line\nSecond line'" — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Upstream recommends, in order: (1) repeated `--append-notes`/`--append-plan` lines (works in all agent sandboxes), (2) real newlines inside double quotes, (3) `$'...'` ANSI-C quoting, which is "rejected by tree-sitter-based agent sandboxes, see #595" — [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)
- Use single quotes for text containing literal backticks; unescaped backticks in double quotes trigger command substitution — [LOCAL-HELP `instructions task-creation`](https://github.com/MrLesk/Backlog.md)
- Verified: `-d $'Why this exists.\n\nSecond paragraph.'` stored a two-paragraph description between `<!-- SECTION:DESCRIPTION:BEGIN/END -->` markers — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)

**Validation behaviour observed** — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Invalid status -> rejected: `Invalid status: Blocked. Valid statuses are: To Do, In Progress, Done`.
- Invalid priority -> rejected: `Invalid priority: urgent. Valid values are: High, Medium, Low`.
- Unconfigured label (`-l notconfigured`) -> ACCEPTED silently (labels are not validated against config).
- Unknown milestone title (`-m "Nope"`) -> ACCEPTED; task stores `milestone: Nope` and `milestone list` then shows a phantom `Nope: Nope (0/1 done)` with no milestone file. Always create the milestone first and pass its ID (`m-N`).
- `--plan` on a task created in `To Do` was ACCEPTED and stored (help/guide says not to do this; it is guidance, not enforced).

**Example (full story)**
```bash
backlog task create "Deal cards" -p task-1 \
  -d 'Players need a fair deck so that ...' \
  --ac "Deck has 52 unique cards" --ac "Shuffle is uniform" \
  --dod "Perf benchmark run" \
  --priority High -l backend --type feature -m m-0 \
  --dep task-3 --ordinal 1000 --ref docs/spec.md --doc doc-1 --plain
```
Produced file `backlog/tasks/task-1.1 - Deal-cards.md` with frontmatter `id, title, status, assignee, created_date, labels, milestone, dependencies, parent_task_id, priority, ordinal, references, documentation` and sections `## Description`, `## Acceptance Criteria` (`- [ ] #1 ...` inside `<!-- AC:BEGIN/END -->`), `## Definition of Done` (inside `<!-- DOD:BEGIN/END -->`) — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)

### Inferences
- An agent should create the parent/epic and all milestones first, capture the returned IDs from `--plain` output (first lines: `File: ...` / `Task TASK-N - Title`), then create children referencing those IDs.
- Because `--dep` on edit replaces, the safest approach is to set the complete dependency list at creation or re-specify the full list on edit.
- Because labels and milestone titles are not validated, a wrapper/agent should validate against `backlog config get labels` and `backlog milestone list --plain` itself.

### Gaps
- Whether `--notes` at create in `To Do` is enforced was not tested (only `--plan` was).

## 2. Parent tasks / subtasks, "epics", and milestones

### Takeaway
There is no "epic" entity. Hierarchy = parent/subtask via `-p` (IDs become `TASK-1.1`, nesting allowed to `TASK-1.1.1`). Grouping by release/phase = first-class **milestones** (`backlog milestone add|list|rename|remove|archive`, IDs `m-0`, `m-1`...). Epics are best modelled as a parent task (optionally labelled `epic`, type `feature`) whose stories are subtasks, with milestones for phases.

### Cited Findings
- Upstream guidance: "Use subtasks when the work shares one goal and one subsystem" (`backlog task create -p TASK-10 "Set up shell"`); "Use separate tasks with dependencies when work spans independent components"; "Do not pass milestone IDs such as `m-0` to `--parent`; assign a task to a milestone with `--milestone`/`-m`" — [LOCAL-HELP `instructions task-creation`](https://github.com/MrLesk/Backlog.md)
- Subtask IDs: `-p task-1` produced `TASK-1.1`, `TASK-1.2`; `-p task-1.1` produced `TASK-1.1.1` (multi-level nesting works). File frontmatter stores `parent_task_id: TASK-1`. Parent's `task view --plain` shows `Subtasks (2): - TASK-1.1 ... - TASK-1.2 ...` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Passing a milestone as parent fails: `Parent task M-0 not found ... Use an existing task ID with --parent; use --milestone to assign a task to a milestone.` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Parent/subtask is NOT a dependency: the parent `TASK-1` appeared in `task list --ready` even though its subtasks were unfinished — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Subtask workflow: "complete subtasks one at a time... finish the parent only when all are complete" — [LOCAL-HELP `instructions task-finalization`](https://github.com/MrLesk/Backlog.md)
- A task whose subtasks still exist cannot be deleted — [LOCAL-HELP `instructions overview`](https://github.com/MrLesk/Backlog.md)
- Filter children: `backlog task list -p TASK-1 --plain` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Board export renders hierarchy (`└─ **TASK-1.1** - Deal cards`) — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- No `epic` command, flag, or field exists in v1.55.3 help (`backlog --help` top-level commands: init, task, search, draft, milestone, board, doc, decision, agents, config, doctor, cleanup, browser, overview, completion, instructions, mcp) — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)

**Milestones (first-class)** — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md), [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)
```bash
backlog milestone add "M1 Foundation" -d "First slice" --due-date 2026-12-31   # -> Created milestone "M1 Foundation" (m-0).
backlog milestone list --plain [--show-completed]                               # m-0: M1 Foundation (0/2 done, due 2026-12-31)
backlog milestone rename "Release 1.0" "Release 2.0" [--no-update-tasks] [--due-date D|--clear-due-date]
backlog milestone remove "Release 1.0" [--task-handling clear|keep|reassign --reassign-to "Release 2.0"]
backlog milestone archive m-1
backlog task create "X" -m m-0          # or -m "M1 Foundation"; stored as milestone: m-0
backlog task edit task-3 -m m-1 | --clear-milestone
backlog task list -m "M1" --plain       # closest case-insensitive match
backlog board -m                        # board grouped by milestone (TUI)
```
- Milestone files are `backlog/milestones/m-0 - m1-foundation.md` with frontmatter `id, title, due_date` and a `## Description` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `milestone list` reports completion counts per milestone (`0/2 done`) — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- README: "Milestones & dependencies -- structure bigger efforts and make execution order reviewable" — [README](https://github.com/MrLesk/Backlog.md/blob/main/README.md)

### Inferences
- Recommended mapping: Epic = parent task (`--type feature -l epic`, description holds epic goal, ACs = epic-level outcomes); Story = subtask `-p`; Phase/release = milestone; cross-epic sequencing = `--dep`.
- Subtask IDs are allocated sequentially per parent, so creating subtasks in intended order yields readable IDs.

### Gaps
- Whether milestones themselves can be ordered (other than by file/ID) was not determined; `milestone list` order follows "their files and then the tasks that name them" per CLI-DOC.

## 3. Ordering: ordinal, board ordering, dependency-derived execution order, cycle validation

### Takeaway
Ordering is via the integer `ordinal` field (auto-assigned in steps of 1000 when omitted) plus dependencies. `task list` sorts by ordinal, then priority, then ID. There is **no `backlog sequence` command in v1.55.3**; execution order is derived from `--dep`, inspected with `task view` (Dependency Graph), `task list --ready`, and `--json` `isReady`. Dependency cycles, self-dependencies and missing IDs are rejected at write time and reportable via `backlog doctor`.

### Cited Findings
- Auto-ordinal: created without `--ordinal`, tasks received 1000, 3000, 4000, 5000, ... i.e. (current max) + 1000; explicit `--ordinal 1000/2000` honoured. `task edit task-5 --ordinal 500` moved it to the top of `task list` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- "Without `--sort`, `task list` orders tasks by ordinal, then priority, then ID: tasks that have an ordinal come first, lowest ordinal first... `--sort priority`, `--sort id`, and `--sort ordinal`... Plain output groups the ordered tasks by status... `--sort priority` prints one flat list; `--json` returns ... one flat array... MCP `task_list`, which has no sort option, uses the order without `--sort`." — [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)
- Ordinal is a flat global ordering: subtask `TASK-1.1.1` (ordinal 4000) listed after `TASK-2` (3000), not under its parent — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `backlog sequence --help` just prints top-level help (no such command) in v1.55.3 — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Cycle rejected: `backlog task edit task-1.1 --dep task-2` -> `These dependencies would create a cycle: TASK-1.1 -> TASK-2 -> TASK-1.1. No changes were applied.` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Self dep rejected: `Task TASK-1.1 cannot depend on itself`; missing dep rejected: `The following dependencies do not exist: task-99. Please create these tasks first...` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `backlog doctor` "report[s] self-referential and cyclic dependencies" and duplicate IDs; output on clean project: `No duplicate IDs, self-referential dependencies, or dependency cycles found.` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md), [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `task list --ready`: "only show unblocked tasks with all dependencies completed" — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md). Verified: TASK-1.2 and TASK-2 (with unmet deps) excluded — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `task view --plain` shows a transitive `Dependency Graph` ("Depends on (2 direct, 2 total)" and "Dependents") above the description; `--json` exposes `dependencies`, `dependencyGraph.nodes[]` with `dependencyDepth`/`dependentDepth`, and `isReady` — [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md), [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `isReady` is derived at read time; unknown/ambiguous dependencies block ("fail closed"); a dependency on an archived task is satisfied only if that task is in the final status — [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)
- Dependency IDs accept `task-1`, `1`, or comma lists — [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)
- Board: `backlog board [--vertical] [-m]` (TUI); `backlog board export [file]` writes a Markdown table (note: an absolute path argument was written relative to the project root, e.g. `bltest/private/tmp/...`) — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)

### Inferences
- To make "correctly ordered" visible: assign explicit ordinals consistent with a topological order of `--dep` (e.g. epic 1 stories 1000-1900, epic 2 2000-2900, leaving gaps for insertion), and encode hard ordering constraints with `--dep`. Ordinal is presentation; dependencies are the enforced constraint.
- Agents can verify order by `backlog task list --json` (flat, ordinal-sorted) and checking each task's dependencies appear earlier.

### Gaps
- Online sources did not confirm whether any earlier version had a `sequence` command; none exists in the installed v1.55.3. (GitHub code search needs auth; CHANGELOG.md was not found at repo root.)

## 4. Documents and decisions

### Takeaway
`backlog doc create` creates a document (title, `-t` type, `-p` subfolder) but has NO content flag; content is set with `backlog doc update doc-N --content ...` (also `--tags`, `--title`, `-t`, `-p`). `backlog decision create` takes only a title and `-s` status; its Context/Decision/Consequences body CANNOT be filled via CLI (or MCP) in v1.55.3.

### Cited Findings
- `doc create [options] <title>`: `-p, --path <path>` (subdirectory under backlog/docs), `-t, --type <readme|guide|specification|other>`, `--plain` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- `doc update <docId>`: `--title`, `--content <markdown>` (replace body; real newlines required), `-p`, `-t`, `--tags <tags>` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Also `doc list|view|search|archive|restore|delete` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Test: `backlog doc create "Product Vision" -t specification -p vision` -> `Created document doc-1 / Path: backlog/docs/vision/doc-1 - Product-Vision.md`; then `doc update doc-1 --content $'# Vision\n\n...' --tags "vision,reqs"` produced frontmatter `id, title, type, created_date, updated_date, tags` + body — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `decision create [options] <title>`: only `-s, --status` (free-form, default `proposed`) and `--plain`; `decision edit <id> -s <status>` "Replaces the status line in the decision's frontmatter; the rest of the file stays as it is" — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Created decision file contained empty `## Context`, `## Decision`, `## Consequences` sections — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- MCP server exposes `document_create(title, content, type, path, tags)` and `document_update`, but no decision tools — [LOCAL-TEST MCP tools/list](https://github.com/MrLesk/Backlog.md)
- Link tasks to docs: `task create --doc doc-1` / `--doc docs/spec.md`; `task edit --add-doc ...` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- `backlog search` covers tasks, documents, and decisions (`--type task|document|decision`) — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)

### Inferences
- Vision/requirements docs are well supported: `doc create` then `doc update --content`. Decision records are only usable as title+status stubs via CLI; put rationale in a doc (e.g. `-t other -p decisions`) or use decision titles as one-line summaries.

### Gaps
- No CLI/MCP way found to write decision body content; only direct file editing (forbidden by project rule) or possibly the web UI (`backlog browser`), which was not tested.

## 5. Definition of Done, AC management, instructions, MCP, --plain/--json, search

### Takeaway
Project DoD defaults live in config `definition_of_done:` and are auto-appended to every new task (opt out per task with `--no-dod-defaults`; add with `--dod`). They cannot be set by `backlog config set`; use interactive `backlog config`, the web UI, the MCP tool `definition_of_done_defaults_upsert`, or editing the config file. AC/DoD items are 1-based indexed and managed with `--check-ac/--uncheck-ac/--remove-ac` and DoD equivalents.

### Cited Findings
- `backlog config set definitionOfDone ...` -> `definitionOfDone cannot be set directly. Use backlog config for interactive editing, update the project config file ..., or use Web UI Settings.` — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Config YAML: `definition_of_done:` list; "These items are added to every new task by default. You can add more on create with `--dod`, or disable defaults per task with `--no-dod-defaults`." — [README](https://github.com/MrLesk/Backlog.md/blob/main/README.md)
- Verified: with `definition_of_done: ["Tests pass", "Docs updated"]`, TASK-1.1 created with `--dod "Perf benchmark run"` had DoD #1 Tests pass, #2 Docs updated, #3 Perf benchmark run; TASK-1.2 with `--no-dod-defaults` had none — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Guide: "Project-level Definition of Done defaults apply automatically. Add task-specific DoD items only when this task needs extra completion hygiene" — [LOCAL-HELP `instructions task-creation`](https://github.com/MrLesk/Backlog.md)
- AC editing verified: `--check-ac 1 --check-dod 3 --ac "New third AC"` in one edit; `--acceptance-criteria "Shuffle is uniform" --acceptance-criteria "Deck has 52 cards"` reordered and kept the check on "Deck has 52 cards" — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- AC guidance: criteria "define the expected behavior, not implementation steps"; testable, include edge cases; description should capture *why*, not restate ACs; do not add an implementation plan at creation — [LOCAL-HELP `instructions task-creation`](https://github.com/MrLesk/Backlog.md)
- `backlog instructions` guides: `overview`, `task-creation`, `task-execution`, `task-finalization`, `init-required` (`--list` to list) — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- Overview rule: "Never edit task, draft, document, decision, or milestone markdown files directly" — [LOCAL-HELP `instructions overview`](https://github.com/MrLesk/Backlog.md)
- MCP: `backlog mcp start [--cwd <path>] [-d]` (stdio). v1.55.3 tools: `get_backlog_instructions, task_create, task_list, task_search, task_edit, task_view, task_archive, task_delete, task_restore, milestone_list, milestone_add, milestone_rename, milestone_remove, milestone_archive, definition_of_done_defaults_get, definition_of_done_defaults_upsert, document_list, document_view, document_create, document_update, document_archive, document_restore, document_delete, document_search`. `task_create` params include `parentTaskId, dependencies, ordinal, milestone, acceptanceCriteria, definitionOfDoneAdd, disableDefinitionOfDoneDefaults`; `task_list` has no sort or parent filter — [LOCAL-TEST MCP tools/list](https://github.com/MrLesk/Backlog.md)
- `backlog init --integration-mode cli|mcp|none` (cli recommended) — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- `--plain` vs `--json`: `task list`, `task view`, `task <id>`, `draft list`, `decision list`, `search` accept versioned `--json` (schemaVersion 1); mutually exclusive with `--plain`; `task list --json --watch` streams replacements — [CLI-DOC](https://github.com/MrLesk/Backlog.md/blob/main/CLI-INSTRUCTIONS.md)
- `task list` filters: `-s`, `--exclude-status`, `-a`, `--unassigned`, `-m`, `-p`, `--priority`, `--type`, `--project`, `-l` (ALL labels required), `--search`, `--ready`, `--limit`, `--sort priority|id|ordinal`, `--max-count`, `--skip`, `--count` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)
- `backlog search [query]` options: `--type`, `--task-type`, `--status`, `--exclude-status`, `--priority`, `--project`, `--modified-file`, `--limit`, `--max-count`, `--skip`, `--count`, `--plain`, `--json`; fuzzy, scored output (e.g. `TASK-1.1 - Deal cards (To Do) [HIGH] [score 0.774]`) — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md), [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Drafts: `backlog task create "X" --draft` -> `DRAFT-1` in `backlog/drafts/`; `backlog draft promote draft-1` -> became `task-6`; `backlog task demote <id>` moves back — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `backlog overview` prints status/priority statistics — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)

### Inferences
- If the project rule forbids only task-file edits, adding `definition_of_done:` to `backlog/config.yml` (or using `backlog config` interactively / MCP upsert) is the sanctioned route for DoD defaults.
- Drafts are a good staging area for unapproved stories: create with `--draft`, promote after review (note promote assigns a new TASK id, so dependencies should be set after promotion).

### Gaps
- Did not verify whether `draft promote` preserves subtask/parent IDs or dependencies.

## 6. Config options (config.yml) relevant to backlog structure

### Takeaway
List-type settings (`statuses`, `labels`, `priorities`? , `projects`, `definition_of_done`, `milestones`) cannot be set with `backlog config set`; they must be changed in `backlog/config.yml` (or interactive `backlog config`/web UI). Scalar settings can be set with `backlog config set <key> <value>`.

### Cited Findings
- `backlog config list` defaults in v1.55.3: projectName, defaultEditor, defaultAssignee [], defaultStatus To Do, statuses [To Do, In Progress, Done], labels [], priorities [High, Medium, Low], types [bug, feature, enhancement, task, chore, docs, spike], projects [], milestones [], definitionOfDone [], dateFormat yyyy-mm-dd, maxColumnWidth 20, autoOpenBrowser true, hideEmptyColumns, defaultPort 6420, remoteOperations true, autoCommit false, filesystemOnly false, bypassGitHooks false, zeroPaddedIds disabled, taskPrefix task (read-only), checkActiveBranches true, activeBranchDays 30 — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- `backlog config set labels|projects|statuses ...` -> "cannot be set directly ... Edit the list in the project config file (`backlog/config.yml`, `.backlog/config.yml`, or `backlog.config.yml`) directly." `backlog config set remoteOperations false` works — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- YAML keys are snake_case in the file (`project_name, default_status, statuses, labels, definition_of_done, remote_operations, auto_commit, task_prefix ...`); config precedence: CLI flags, then `backlog.config.yml` (root) or `backlog/config.yml` / `.backlog/config.yml`, then defaults — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md), [README](https://github.com/MrLesk/Backlog.md/blob/main/README.md)
- Additional documented options: `includeDatetimeInDates`, `onStatusChange` (shell command on status change), `backlog_directory` — [ADV-CONFIG](https://github.com/MrLesk/Backlog.md/blob/main/ADVANCED-CONFIG.md)
- `remoteOperations: true` with no git remote prints a warning on every command until disabled — [LOCAL-TEST](https://github.com/MrLesk/Backlog.md)
- Init options of note: `--task-prefix` (letters only), `--zero-padded-ids <n>`, `--no-git`, `--backlog-dir`, `--config-location folder|root` — [LOCAL-HELP](https://github.com/MrLesk/Backlog.md)

### Inferences
- A "Review"/"Blocked" status, project-standard labels (e.g. `epic`), and DoD defaults require a one-time config-file edit (or interactive `backlog config`) before story creation; this is a config file, not a task file.

### Gaps
- Whether `priorities` and `types` lists can be customised via `config set` was not tested (assumed same restriction as other lists).
