# AI/LLM Spec-Driven Development and Requirements-to-Stories Workflows: Patterns for Redesigning "dreamit"

Scope: the stage designs, artifacts, prompts and personas, verification loops, and pitfalls of current spec-driven AI workflows (BMAD, GitHub Spec Kit, Kiro, Taskmaster), research on LLM elicitation and story quality, and the Claude Code mechanics for building such a workflow. Research date: 2026-11-16.

## 1. BMAD Method: agents, artifacts, elicitation, sharding, checklists

### Takeaway
BMAD splits the work across named personas (Analyst, PM "John", PO "Sofia", and others) that pass file artifacts from one to the next. Its two strongest reusable ideas are an elicitation menu offered after each document section, and quality checklists or gates in which **fresh agents** independently check requirement coverage before stories are approved. The current docs (late 2026) have moved from v4's "Scrum Master drafts story.md" model to a PO-owned ticket tree, `tickets.toml`. Each story carries `covers` (requirement IDs), `verify`, `after` (dependencies) and `risk` fields.

### Cited Findings
- The current BMad docs describe a loop of Clarify -> Plan -> Build and verify -> Learn and adjust. A vague idea starts at Clarify, a big but clear idea starts at Plan, and a small change goes straight to Build. Named agents include Sofia the Product Owner (`bmad-agent-po`), who sizes the idea and writes the initiative or epic, and John the Product Manager (`bmad-agent-pm`), who writes the PRD. — [BMad docs home](https://docs.bmad-method.org/)
- **Epic and story planning (current):** epic Requirements cite their parent initiative line, e.g. `R1 (parent R3)`, and the epic is marked `refined: true`. Stories are entries in `epic-<slug>/tickets/tickets.toml` in build order, with fields `id, type, title, description, verify, covers, after, hitl, risk`. No story file is written at planning time; full acceptance criteria are written only "when a build starts" or for entries marked `refine = true`. — [BMad: Plan an epic's stories](https://docs.bmad-method.org/plan/plan-an-epics-stories/)
- **Slicing rules (current BMad):** each story is "one step toward the epic's Done when, sized for one build session". Merge a story whose setup outweighs its work. Split, rather than shrink, a story that would leave a placeholder. Stories touching the same code form "one ordered lane". A shared interface gets a stub as its own early story. Tests go in every story, and the only test-only story is a closing E2E suite. The first story is a **tracer bullet** (the thinnest path through every layer), followed by the riskiest story. An epic of more than 3 stories ends with a refactor sweep. 8 to 12 stories is "a typical epic, not a limit". — [same page](https://docs.bmad-method.org/plan/plan-an-epics-stories/)
- **Validation gate (current BMad):** "Before approval, fresh agents check requirement coverage, dependency loops, and missing prerequisites (collisions, shared setup, handoffs)", and the check reruns whenever stories are added, removed or reordered. — [same page](https://docs.bmad-method.org/plan/plan-an-epics-stories/)
- **Implementation readiness gate (v6):** this is a separate workflow that runs after create-epics-and-stories and before sprint planning. It checks that the PRD, UX, Architecture, Epics and Stories are "complete and aligned". Its steps are Epic Coverage Validation, UX Alignment, Epic Quality Review, and a Final Assessment with an overall readiness score. Output is `implementation-readiness.md` with a PASS/CONCERNS/FAIL executive summary. Reported failure triggers are contradictions between documents or an overall score under 80%. Several sources recommend running validation with a *different model* to reduce self-confirmation bias, but this is advice, not enforced. — [Tessl registry: bmad-check-implementation-readiness](https://tessl.io/registry/skills/github/bmad-code-org/BMAD-METHOD/bmad-check-implementation-readiness); [How to Run Implementation Readiness](https://alexeyv.github.io/BMAD-METHOD/how-to/workflows/run-implementation-readiness) (secondary sources whose details partly disagree)
- **Advanced elicitation (v4.44):** a library of 20 methods, each a one-line description:
  - Core reflective: Expand/Contract for Audience, Explain Reasoning (CoT), Critique and Refine
  - Structural: Analyze Logical Flow and Dependencies, Assess Alignment with Goals
  - Risk: Identify Potential Risks and Unforeseen Issues, Challenge from Critical Perspective (devil's advocate, YAGNI)
  - Creative: Tree of Thoughts, Hindsight "If only..."
  - Multi-persona: Agile Team Perspective Shift (PO/SM/Dev/QA), Stakeholder Round Table, Meta-Prompting Analysis
  - Advanced: Self-Consistency Validation, ReWOO, Persona-Pattern Hybrid, Emergent Collaboration Discovery
  - Game-based: Red Team vs Blue Team, Innovation Tournament, Escape Room Challenge
  - Process control: "Proceed / No Further Actions"

  — [BMAD elicitation-methods.md v4.44.3](https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v4.44.3/bmad-core/data/elicitation-methods.md)
- The v4 PRD template ran in interactive mode with `elicitation: advanced-elicitation`. The v4 user guide describes a menu of 10 structured actions grouped into analysis, refinement and review. In the PRD task, the PM checks each pm-checklist item against the draft, marking it met or N/A. — [prd-tmpl.yaml (mirror)](https://git.biohazardvfx.com/Nicholai/BMAD-METHOD/src/branch/main/bmad-core/templates/prd-tmpl.yaml); [create-prd task (mirror)](https://git.biohazardvfx.com/Nicholai/BMAD-METHOD/src/commit/0f4c4d5692bc426323bc0a3d02227e94808988cf/bmad-agent/tasks/create-prd.md)
- **Story Draft Checklist (v4.44):**
  - Core question: "Could YOU implement this story as written?"
  - Five principles: Clarity, Context, Guidance, Testability, Self-Contained.
  - Five categories (23 items):
    - Goal & Context Clarity: goal stated, relationship to the epic, dependencies on earlier stories, business value
    - Technical Implementation Guidance: key files, non-obvious tech, APIs, data models, env vars, exceptions to standard patterns
    - Reference Effectiveness: references point to specific sections; critical earlier-story info is *summarized, not just referenced*
    - Self-Containment: implicit assumptions made explicit, domain terms explained, edge and error cases addressed
    - Testing Guidance
  - Scoring: per-category PASS/PARTIAL/FAIL, a clarity score from 1 to 10, and a final verdict of READY / NEEDS REVISION / BLOCKED (BLOCKED must name the missing external info).

  — [story-draft-checklist.md v4.44.3](https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v4.44.3/bmad-core/checklists/story-draft-checklist.md)
- The v6 quick-start tells users to load the PM agent "in a fresh chat" to run the PRD workflow. It has three tracks: Quick Flow (tech-spec only), BMad Method, and Enterprise (PRD plus architecture). — [v6 quick-start (mirror)](https://git.biohazardvfx.com/Nicholai/united-tattoo/raw/branch/UI-Overhaul/.bmad/bmm/docs/quick-start.md)

### Inferences
- For dreamit's Weaver: adopt BMAD's `covers: [REQ-IDs]` field on every story, the tracer-bullet-first and riskiest-second ordering, and the split-don't-shrink and merge-setup-heavy rules. Use a typical batch of 8 to 12 stories per epic as a prompt to split large ideas into several epics.
- For dreamit's Judge: BMAD runs its coverage check with *fresh agents* and reruns it on every change to the story set. Dreamit's Judge should likewise be a fresh-context subagent, rerun after every Weaver revision.
- A "Proceed / No further actions" option in every elicitation menu matters. It is how the user ends exploration, so the workflow never forces extra rounds.
- The Story Draft Checklist's "summarize, don't just reference" rule matters for Backlog.md. Stories should copy the relevant requirement text, not just cite REQ IDs, so an implementing agent can work from the story alone.

### Gaps
- I could not retrieve the v6 PM checklist (pm-checklist.md) or the full v6 `create-epics-and-stories` instructions. The v4 PM checklist content is not summarized here.
- The BMad docs restructured during 2026 (old URLs redirect). Descriptions of "v6" from third-party mirrors may not match the current release.

## 2. GitHub Spec Kit: constitution, specify, clarify, plan, tasks, analyze, checklist

### Takeaway
Spec Kit is the most mechanically specified workflow. It has four core mechanisms worth copying almost verbatim:
- **`[NEEDS CLARIFICATION: question]` markers** instead of guessing.
- **`/clarify`**: a 10-category coverage taxonomy scored Clear/Partial/Missing, at most 5 questions asked one at a time, each with a recommended answer, and answers written back into the spec immediately.
- **`/analyze`**: a read-only consistency and coverage pass with fixed severity levels and a requirement-to-task coverage table.
- **`/checklist`**: "unit tests for English" that test the quality of the *requirements*, not the implementation.

### Cited Findings
- **Spec template rules:**
  - "Mark all ambiguities: Use [NEEDS CLARIFICATION: specific question]".
  - "Don't guess: If the prompt doesn't specify something, mark it".
  - Example: `[NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]`.
  - Focus on "WHAT users need and WHY", avoid HOW (no tech stack), and "No speculative or 'might need' features".
  - Spec checklist items include "No [NEEDS CLARIFICATION] markers remain", "Requirements are testable and unambiguous" and "Success criteria are measurable". Checklists "act as 'unit tests' for the specification".

  — [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- **Constitution and gates:** the constitution lives at `memory/constitution.md`. "Phase -1" gates (Simplicity, Anti-Abstraction, Integration-First) are yes/no questions, and a failed gate must be justified in a "Complexity Tracking" section. — [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- **/clarify procedure:**
  - Scan the spec against 10 categories, each marked Clear/Partial/Missing: Functional Scope & Behavior; Domain & Data Model; Interaction & UX Flow; Non-Functional Quality Attributes; Integration & External Dependencies; Edge Cases & Failure Handling; Constraints & Tradeoffs; Terminology & Consistency; Completion Signals; Misc/Placeholders.
  - Skip questions whose answer wouldn't change implementation or validation.
  - "Maximum of 5 total questions across the whole session", prioritized by Impact × Uncertainty. "Never reveal queued questions in advance."
  - Ask one question at a time, followed by a "Why it matters" sentence.
  - Multiple-choice questions offer 2 to 5 options plus `**Recommended:** Option X - <reasoning>`. Short-answer questions offer `**Suggested:**` and ask for answers of 5 words or fewer. "yes" or "recommended" accepts the proposed answer.
  - After each answer, append `- Q: … → A: …` under `## Clarifications / ### Session YYYY-MM-DD`, update the relevant spec section, "Replace contradictory text rather than duplicating it", and **save after each integration**.
  - Stop when critical ambiguities are resolved, when the user says "done", or after 5 questions.
  - Final report: a coverage table with statuses Resolved / Deferred / Clear / Outstanding.

  — [clarify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md)
- **/analyze procedure:**
  - Strictly **read-only**; remediation is only offered, with user approval.
  - It runs after tasks.md exists.
  - It builds an internal requirements inventory keyed by FR-### / SC-###, plus a story inventory and a task-to-requirement map.
  - Six detection passes, capped at 50 findings:
    - Duplication
    - Ambiguity: vague adjectives "fast/scalable/secure", placeholders "TODO, TKTK, ???"
    - Underspecification: verbs without an object or measurable outcome; stories without acceptance criteria
    - Constitution alignment
    - Coverage gaps: requirements with no tasks, tasks with no requirement, buildable NFR success criteria absent from tasks
    - Inconsistency: terminology drift, entities missing across artifacts
  - Severity: CRITICAL (constitution MUST violation, or zero coverage blocking baseline functionality), HIGH, MEDIUM, LOW.
  - Output: a findings table (ID, Category, Severity, Location, Summary, Recommendation), a coverage table (Requirement Key | Has Task? | Task IDs | Notes), a list of unmapped tasks, and metrics (coverage % and counts).
  - "Make results deterministic, so reruns on unchanged files give the same IDs and counts." "Never … invent missing sections."

  — [analyze.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/analyze.md)
- **/checklist ("unit tests for English"):** "If your spec is code written in English, the checklist is its unit test suite."
  - Wrong: "Verify landing page displays 3 episode cards". Items starting with Verify/Test/Confirm/Check are prohibited.
  - Right: "Are the exact number and layout of featured episodes specified?" Patterns: "Are [requirement type] defined for [scenario]?" and "Is [vague term] quantified?"
  - Categories: Completeness, Clarity, Consistency, Acceptance Criteria Quality, Scenario Coverage, Edge Case Coverage, NFRs, Dependencies & Assumptions, Ambiguities & Conflicts.
  - At least 80% of items must carry a traceability reference: `[Spec §X.Y]` or `[Gap]/[Ambiguity]/[Conflict]/[Assumption]`.
  - IDs run CHK001 and up, with a soft cap of 40 items. Clarifying questions are capped at 3 initial plus 2 follow-ups, with options A to E.

  — [checklist.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/checklist.md)
- `/tasks` marks parallelizable tasks `[P]`. `/plan` checks constitutional compliance before producing data-model, contracts and quickstart files. — [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)

### Inferences
- Dreamit's Solidifier can copy /clarify directly:
  - Keep a coverage table across the 10 categories, persisted in a file.
  - Rank questions by impact × uncertainty.
  - Always give a recommended option. This maps well to AskUserQuestion's 2 to 4 options.
  - Write each answer into requirements.md immediately and log a Q→A record.
  - Raise dreamit's question budget above Spec Kit's 5, since dreamit gathers requirements from scratch rather than refining a spec, but keep an explicit budget and stop rule per round.
- Dreamit's Judge can copy /analyze: stay read-only, use the fixed six passes and four severities, require a coverage table with a row for every REQ ID, report deterministic IDs, and record "unmapped stories" (scope creep or hallucinated stories). A rule like "Any CRITICAL or HIGH → FAIL" makes the PASS/FAIL ruling mechanical rather than vibes-based.
- Dreamit should keep `[NEEDS CLARIFICATION]` markers. The Solidifier's exit gate can be a grep showing zero markers, a scripted check.

### Gaps
- I did not fetch the current `spec-template.md` and `tasks-template.md` verbatim. Their section headings (User Scenarios & Testing, Functional Requirements FR-###, Key Entities, Success Criteria SC-###) are inferred from the analyze command's references to FR/SC IDs, not confirmed.

## 3. AWS Kiro specs and Taskmaster AI

### Takeaway
Kiro runs three phases (requirements.md, design.md, tasks.md) with a review step between phases, writes requirements in EARS notation, offers "Analyze Requirements" before design, and links "Correctness" to property-based testing. Taskmaster is task-centric: it parses a PRD into tasks, analyzes complexity, expands tasks into subtasks, and tracks dependencies and the "next" task. Both treat the PRD as the source and the task list as derived.

### Cited Findings
- Kiro feature specs have three files:
  - `requirements.md` (or `bugfix.md`): "user stories, acceptance criteria, or bug analysis in structured notation"
  - `design.md`: architecture, sequence diagrams, data flow, error handling, testing strategy
  - `tasks.md`: discrete, trackable tasks

  A "Quick Spec" mode auto-generates all three "without approval gates", which implies the normal flow has gates. Between phases a Review button opens Markdown Review, where the user comments on passages and sends them back to Kiro. Bugfix specs record current, expected and **unchanged** behavior. When all tasks run, Kiro builds a dependency graph and executes in concurrent "waves". — [Kiro specs docs](https://kiro.dev/docs/specs/)
- EARS format in Kiro: "WHEN [condition/event] THE SYSTEM SHALL [expected behavior]". Example: "WHEN a user submits a form with invalid data THE SYSTEM SHALL display validation errors next to the relevant fields". The stated goals are requirements that are clear, testable, traceable and complete. "Analyze Requirements" can run after requirements are generated and before design. Kiro offers two variants: Requirements-First (behavior, then design) and Design-First (design, then derived requirements; for technically constrained work). — [Kiro feature specs](https://kiro.dev/docs/specs/feature-specs/)
- Kiro lists "Correctness (property-based testing)" as an IDE-only capability. — [Kiro specs docs](https://kiro.dev/docs/specs/)
- Taskmaster commands: `task-master parse-prd <prd>` ("Parse a PRD and generate tasks", with the PRD at `.taskmaster/docs/prd.txt`), the MCP tools `analyze_project_complexity`, `complexity_report`, `expand_task`, `expand_all` and `add_subtask`, and `task-master next`. The docs say "The more detailed your PRD, the better the generated tasks will be." — [claude-task-master README](https://github.com/eyaltoledano/claude-task-master)

### Inferences
- Use EARS for the acceptance criteria in dreamit's requirements.md, and Given/When/Then or EARS acceptance criteria in Backlog.md stories. Both are mechanically checkable: a script can verify that every AC line matches a pattern.
- Kiro's "unchanged behavior" field for bugfixes generalizes to dreamit as an explicit "Out of scope / must not change" section.
- Taskmaster's complexity analysis suggests a Weaver step that sizes stories and splits any judged too large, before the Judge runs.

### Gaps
- Kiro's pages did not list the full set of EARS patterns. From background knowledge (Mavin et al., EARS), not verified this session, the canonical patterns are:
  - Ubiquitous: "The <system> shall …"
  - Event-driven: "WHEN …"
  - State-driven: "WHILE …"
  - Unwanted behavior: "IF … THEN …"
  - Optional feature: "WHERE …"
  - Complex: combinations of the above
- I did not retrieve Kiro's tasks.md format (it reportedly references requirement numbers per task) or Taskmaster's task JSON schema (id, dependencies, priority, details, testStrategy) and complexity scale.
- I found no dedicated Claude Code PRD plugin worth citing. Several community "BMAD skills for Claude Code" exist, e.g. aj-geddes/claude-code-bmad-skills listed on [claudeskills.info](https://claudeskills.info/skills/aj-geddes/claude-code-bmad-skills/bmad-readiness-check/), but I did not evaluate them.

## 4. Research findings on LLM elicitation and user-story generation and assessment; known failure modes

### Takeaway
LLM interviewers can elicit a majority of requirements but make about as many interviewing mistakes as humans. Using an explicit taxonomy of interviewer mistakes measurably improves follow-up questions. LLM-generated stories reach high *coverage* but low *diversity*, and they often fail on vague rationale and conjunction-stuffed, non-atomic stories. LLM judges agree well with humans **only when given a detailed rubric (codebook)**. Rule-based checkers (AQUSA) give higher precision and LLMs higher recall, so a hybrid is recommended. LLM judges show self-preference and leniency bias.

### Cited Findings
- **LLMREI (arXiv 2507.02564, 2025):** an LLM chatbot conducted elicitation interviews with 33 simulated stakeholders. It "makes a similar number of common mistakes during interviews as a human interviewer" while eliciting "up to 73.7% of all requirements". Mistakes were scored against the Bano et al. taxonomy of interviewer mistakes. — [LLMREI](https://arxiv.org/html/2507.02564v1)
- **Follow-up questions (arXiv 2507.02858, 2025):** GPT-4o follow-up questions guided by the mistake-type framework outperformed human-authored questions. — [arXiv 2507.02858](https://arxiv.org/pdf/2507.02858v1)
- An LLM playing the client in interview-training studies "occasionally provided imprecise or contradictory information" (n=120 study). This is a risk if dreamit ever simulates stakeholders. — [arXiv 2503.07800](https://arxiv.org/abs/2503.07800v1)
- **"Can LLMs Generate User Stories and Assess Their Quality?" (arXiv 2507.15157):**
  - Setup: analyst LLMs interviewed a customer LLM grounded in 53 ground-truth stories, producing 13,958 stories across 10 models.
  - Coverage at cosine 0.8: Claude 3 Sonnet and Opus 96.23%, GPT-3.5 73.58%, students 52.83%.
  - **Diversity**: students 98.58%, while LLMs ranged from 44.23% (Claude 3 Sonnet) to 74.74%. The authors describe a "conservative generation strategy that favors familiarity over exploration".
  - Defects: "excessive conjunctions and low feature specificity and clarity of the rationale". GPT-3.5 stories were rejected 77.34% of the time, against 9.43% for ground truth.
  - As judges: Claude 3 Opus *with the full codebook* reached Cohen's κ = 0.87 against human-human 0.74 to 0.78. Judge agreement was weaker on Rationale Clarity and Problem-Oriented.

  — [arXiv 2507.15157](https://arxiv.org/html/2507.15157v1)
- **AQUSA vs LLMs on 182 stories (ICSE JAWs 2026):** GPT-5-mini had the best recall (0.81) and F1 (0.62), and AQUSA the best precision (0.61). GPT-5 "showed high hallucination rates and instability", and GPT-4 was "overly conservative". The authors conclude "neither rule-based nor LLM-based approaches suffice in isolation". — [JAWs 2026 paper listing](https://conf.researchr.org/details/icse-2026/jaws-2026-papers/29/Towards-Automated-User-Story-Quality-Assessment-with-LLMs-An-Empirical-Study-on-Synt) (via search summary; not fetched in full)
- **ChatGPT as a story-quality evaluator (arXiv 2306.12132):** human evaluators and AQUSA agreed on only 55% of {criterion, story} pairs. AQUSA itself evaluates only the atomic, well-formed and minimal criteria of the 13-criterion QUS framework. — [arXiv 2306.12132](https://arxiv.org/pdf/2306.12132)
- **Judge bias:**
  - GPT-4 shows significant self-preference, attributed to lower perplexity on familiar text (Wataoka et al.). — [arXiv 2410.21819](https://arxiv.org/html/2410.21819v1)
  - Leniency bias (marking wrong answers correct) varies across judge models. — [Judging the Judges, arXiv 2406.12624](https://arxiv.org/pdf/2406.12624)
  - A 2026 rubric-based study notes that high overestimation alone may reflect general leniency rather than self-preference. — [arXiv 2604.06996](https://arxiv.org/pdf/2604.06996.pdf)
- **Anthropic's multi-agent research system:**
  - The most human-aligned approach was a single LLM-judge call with a rubric outputting 0.0 to 1.0 scores plus pass/fail.
  - For state-changing agents, evaluate the end state.
  - Human testers caught failures automation missed.
  - Subagents should write outputs to the filesystem and "pass lightweight references back to the coordinator" to avoid a "game of telephone".
  - The lead agent saves its plan to memory to survive context truncation.
  - Each subagent brief needs "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries". Vague briefs caused duplicated work.
  - Effort-scaling rules must be explicit.

  — [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

### Inferences (failure modes, mapped to mitigations for dreamit)
- **Hallucinated or invented requirements:** Spec Kit's "Don't guess, mark it" rule; every requirement carries a `Source:` field (a user answer ID or a quote from vision.md); the Judge flags requirements and stories with no source as "unmapped" (Spec Kit /analyze pass E).
- **Premature convergence / low diversity:** the 2507.15157 diversity data supports forcing breadth before depth. The Interrogator walks a fixed category checklist (personas, goals, flows, data, NFRs, integrations, edge cases, constraints, out-of-scope) and uses BMAD-style divergent methods (stakeholder round table, red team, "if only…" retrospective) before the Solidifier converges.
- **Leading questions and other interviewer mistakes:** the Bano et al. taxonomy measurably improves LLM follow-ups (2507.02858). Embed a short "interviewer mistakes to avoid" list in the Interrogator prompt: leading questions, multiple questions at once, jargon, not probing implicit needs, skipping NFRs, not summarizing back. Offering a *recommended* option (Spec Kit) risks leading the user. Mitigate by always including "Other / none of these" and stating the rationale.
- **Missed NFRs:** Spec Kit has a dedicated NFR coverage category, and /analyze flags buildable NFR success criteria with no task. Make the NFR category mandatory, ending either Clear or explicitly "N/A, confirmed by user".
- **Non-atomic, conjunction-heavy stories with vague rationale:** these are the top LLM story defects. Add scripted lint checks (no " and " in the "I want" clause, "so that" present and non-empty, AC count ≥ 1, EARS or GWT pattern match) before the LLM Judge runs.
- **Judge leniency and self-agreement:**
  - Run the Judge in a fresh context, ideally on a different model from the Weaver (as BMAD readiness sources recommend).
  - Give it a detailed rubric/codebook (κ 0.87 required one).
  - Make PASS mechanical: zero uncovered REQs from the script plus zero CRITICAL/HIGH findings.
  - Require evidence for each covered REQ: a story ID plus the AC line that satisfies it.
- **Context loss between agents:** persist every artifact to files and pass file paths, not summaries. Keep a single state/journal file for resumability.

### Gaps
- I did not retrieve the primary Bano et al. interviewer-mistake taxonomy, so the mistake list in the inference above is generic, not quoted.
- I found no study specifically measuring LLM *requirements-coverage* judges (as opposed to story-quality judges) against human verdicts.

## 5. Workflow design techniques and Claude Code mechanics (skills, subagents, AskUserQuestion, hooks)

### Takeaway
In Claude Code, the main conversation, i.e. the skill, must own every user-facing interview stage, because **subagents cannot use AskUserQuestion**. Subagents fit isolated, file-in/file-out work such as weaving, judging and reporting. Keep SKILL.md under 500 lines with templates and checklists in supporting files, run bundled scripts via `${CLAUDE_SKILL_DIR}` for mechanical coverage checks, give the read-only judge restricted tools, and persist state to files so stages can resume.

### Cited Findings
- **Skills: body and supporting files**
  - "Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files." Link supporting files so Claude knows when to load them.
  - Loaded skill content "stays in context across turns, so every line is a recurring token cost".
  - "State what to do rather than narrating how or why."
  - Claude does not re-read the file on later turns, so write standing instructions.

  — [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- **Skills: frontmatter**
  - Put the key use case first in `description`; it is truncated at 1,536 characters together with `when_to_use`.
  - `disable-model-invocation: true` suits side-effecting workflows.
  - `allowed-tools` grants permission only during the invoking turn; `disallowed-tools` removes tools.
  - `hooks` in frontmatter register on invocation and persist for the session.
  - `context: fork` + `agent:` runs the skill in a subagent that "doesn't see your conversation history". Such skills must be self-contained and are background by default (`background: false` waits).
  - Unknown frontmatter keys are silently ignored.

  — [skills docs](https://code.claude.com/docs/en/skills)
- **Skills: scripts and dynamic context**
  - `${CLAUDE_SKILL_DIR}` resolves to the skill folder, e.g. `allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/render.sh *)` lets a bundled script run without prompts.
  - `` !`cmd` `` injects live output before Claude sees the skill. A failing command aborts the invocation, so append `|| true`.
  - `$ARGUMENTS` and named `arguments:` are available.

  — [skills docs](https://code.claude.com/docs/en/skills)
- **Evaluating skills:** compare runs with and without the skill in fresh sessions. Seeing a skill trigger doesn't prove it works. — [skills docs](https://code.claude.com/docs/en/skills)
- **Subagents: definition and tools**
  - Markdown file with frontmatter whose body is the system prompt.
  - Fields: `name`, `description` (required); `tools` allowlist / `disallowedTools` denylist; `model` (`sonnet|opus|haiku|fable|inherit`|ID); `permissionMode`; `skills` (preloads full skill content); `hooks`; `memory` (user/project/local); `maxTurns` (partial output, resumable); `color`; `effort`; `isolation`; `initialPrompt`.
  - **`AskUserQuestion` is removed from every subagent**, even when listed in `tools`.
  - Subagents can spawn sub-subagents up to 3 levels deep (configurable).

  — [Claude Code subagents docs](https://code.claude.com/docs/en/sub-agents)
- **Subagents: context and orchestration**
  - Each subagent "starts with a fresh, isolated context window" and doesn't see conversation history, invoked skills, or files already read. It gets its system prompt, the task message, CLAUDE.md and git status.
  - "Only the relevant summary returns."
  - Chain subagents by having the main conversation pass context forward. Use the main conversation instead "when the task needs frequent back-and-forth".
  - Resume a subagent with SendMessage, which keeps its full history.
  - Keep descriptions short (a warning appears above 15k tokens combined).
  - Restrict tools, and use Haiku for simple work.

  — [subagents docs](https://code.claude.com/docs/en/sub-agents)
- **Anthropic delegation guidance:** briefs must include objective, output format, tools and sources, and boundaries. Use the filesystem for artifacts and persist the plan. — [Anthropic engineering](https://www.anthropic.com/engineering/multi-agent-research-system)

### Inferences (concrete design recommendations for dreamit)
- **Topology:** run the Interrogator and Solidifier *inline in the main skill*, since they need AskUserQuestion. Make the Weaver, Judge and Diarist subagents:
  - Weaver: Read, Write, Edit, Bash, Glob, Grep, plus the `backlog` CLI
  - Judge: Read, Glob, Grep, Bash, with `disallowedTools: Edit`, and Write only for its judgment file
  - Diarist: Read, Write

  Pass file paths in each brief, not prose summaries. A forked-skill Interrogator would lose AskUserQuestion, so avoid `context: fork` for the interview stages.
- **Folder layout:** SKILL.md as the orchestrator, under 500 lines, holding stage order, gates and the state machine. Put the rest in supporting files:
  - `templates/vision.md`, `templates/requirements.md` (REQ-### with EARS ACs, Source, Priority, category, NFR-###, Out of Scope, Clarifications log, Open Questions), `templates/story.md`
  - `checklists/interview-coverage.md` (category × Clear/Partial/Missing), `checklists/requirements-quality.md` (Spec Kit-style "unit tests for English"), `checklists/story-quality.md` (QUS/INVEST plus BMAD Story Draft items), `checklists/judge-rubric.md`
  - `scripts/coverage.sh` or `.py`: parses requirements.md REQ IDs and Backlog.md task files, emits a traceability matrix, uncovered REQs and orphan stories, and exits non-zero on gaps. Run it via `${CLAUDE_SKILL_DIR}`.
- **State and resumability:**
  - Keep a `dreamit-state.json` (or journal.md) recording current stage, iteration count, gate approvals with timestamps, and artifact paths.
  - On invocation, inject it with `` !`cat …/state.json || true` `` so the skill resumes at the right stage.
  - Write each Q→A to file right after it's answered (Spec Kit's "save after each integration").
- **Gates:**
  - The user explicitly approves vision.md before the Solidifier starts, and requirements.md (AskUserQuestion: Approve / Revise / Add more) before weaving.
  - Scripted pre-gates: zero `[NEEDS CLARIFICATION]` markers, every REQ has ≥1 AC and a Source, and the NFR category is resolved.
- **Judge loop:**
  1. Run the mechanical coverage script first.
  2. The LLM Judge (fresh context, rubric, preferably a different model from the Weaver) checks semantic sufficiency per REQ, citing the story ID and AC line.
  3. PASS requires script exit 0 plus zero CRITICAL/HIGH findings.
  4. On FAIL, the Weaver revises from the judgment file.
  5. Cap iterations, e.g. 3, then escalate the remaining gaps to the user rather than looping. Record each iteration in a numbered file (judgment-1.md, judgment-2.md).
- **Stable IDs:** REQ-001…, NFR-001…; never renumber, only deprecate. Stories carry `covers: [REQ-…]` (BMAD) in Backlog.md labels or description, plus ACs written in EARS or GWT.
- **Diarist:** builds the final report from files only: the traceability matrix, the Q→A log, the judge iteration history, deferred items and out-of-scope items.

### Gaps
- I did not fetch the hooks reference. Plausible uses (a `PostToolUse` hook on Write to backlog/ that runs the coverage script, or a `Stop` hook blocking completion until the judge passes) are inferences, not documented recipes.
- The AskUserQuestion parameter limits (number of questions per call, options per question) were not verified in this session's sources.
