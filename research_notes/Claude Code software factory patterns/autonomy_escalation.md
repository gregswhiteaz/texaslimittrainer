# Autonomy, Escalation and Self-Verification for Autonomous Coding Agents (applied to the "doit" workflow)

Scope note: research done 2026-11-16. Items marked [primary, fetched] were read on the source page in this session. Items marked [secondary] come from search summaries or third-party write-ups and should be checked before quoting. Items marked [abstract, not re-fetched] are well-known paper abstracts cited from the arXiv listing without opening the full text in this session.

## 1. Decision policies for ambiguity: when to ask vs. assume-and-document

### Takeaway
The evidence says agents are bad at knowing *when* to ask. They under-escalate by default. When pushed with "always ask" they over-ask, and a forced up-front question costs little on clean tasks but helps a lot on underspecified ones. The best published design separates a dedicated "is this underspecified?" check from the builder (UA-MULTI). With Claude this recovered essentially full-spec performance. That maps directly onto doit's separate "spec detective" stage.

### Cited Findings
- **Ambig-SWE (ICLR 2026), underspecified SWE-bench Verified with a simulated user holding the full spec.** Interaction "can boost performance on underspecified inputs by up to 74% over the non-interactive settings". Compared with the full-spec setting, interaction recovered about 80% of performance for Claude Sonnet 3.5 and Haiku 3.5, 89% for Claude Sonnet 4, 59% for DeepSeek-v2 and 54% for Llama 3.1 70B — [Ambig-SWE, arXiv 2502.13069v3](https://arxiv.org/html/2502.13069v3) [primary, fetched]
- Ambig-SWE: "Models default to non-interactive behavior unless explicitly prompted." Detecting underspecification is hard: only Claude Sonnet 4 (89%) and Claude Sonnet 3.5 (84%) reached notable accuracy, and Qwen 3 Coder stayed at chance with a 100% false-negative rate — [Ambig-SWE](https://arxiv.org/html/2502.13069v3) [primary, fetched]
- Ambig-SWE on question quality: "The most effective questions are specific, actionable, and task-level." Vague questions, or questions the codebase can already answer, add little value. Interaction improved effectiveness but not efficiency — [Ambig-SWE](https://arxiv.org/html/2502.13069v3) [primary, fetched]
- **Ask or Assume? (Edwards & Schuster, Univ. of Vienna, arXiv 2603.26233, v3 Sep 2026).** Setup: underspecified SWE-bench Verified (500 issues), a GPT-5.1 simulated user limited to 3 interaction turns, OpenHands with a 100-iteration cap. Resolve rates for Claude Sonnet 4.5:

  | Setting | Resolve rate |
  |---|---|
  | FULL spec | 70.80% |
  | HIDDEN (underspecified, no asking) | 54.80% |
  | Forced-ask interactive baseline | 70.40% |
  | UA-SINGLE (one agent with per-turn ambiguity reminder) | 61.20% |
  | UA-MULTI (separate Intent Agent decides whether to ask) | 69.40% |

  UA-MULTI was not significantly different from FULL (p=0.458). For Kimi K2.6 the forced-ask baseline collapsed to 47.20% (instruction-following failures), and UA-MULTI reached 69.40% against 72.80% FULL — [Ask or Assume?](https://www.alphaxiv.org/abs/2603.26233.md) [primary summary page, fetched]
- Ask or Assume? on calibration:
  - The forced-ask baseline queried in 496 of 500 tasks, 97.6% of them early.
  - Claude UA-MULTI was selective. Its ask rate rose with task difficulty: 62% for tasks under 15 min, 72% for 15 min–1 h, 79% for 1–4 h and 100% above 4 h.
  - UA-SINGLE "often began modifying code before recognizing the information gap."
  - Kimi over-asked (83–100% ask rate, 8.71 queries/task).

  — [Ask or Assume?](https://www.alphaxiv.org/abs/2603.26233.md) [primary summary page, fetched]
- **Scale Labs HiL-Bench / HiL-Dynamics (May 27, 2026).**
  - With full information, agents reached 80–90% pass@3. With partial information and an `ask_human()` tool they topped out at about 30%.
  - Key failure: "selective escalation." "Asking well is not the problem. Knowing when to ask is." Agents have low "blocker recall".

  — [Scale Labs, HiL-Dynamics](https://labs.scale.com/blog/hil-dynamics) [primary, fetched]
- HiL-Dynamics, results by harness:
  - Removing Claude Code's codebase "escape hatch" (the rule that it could skip asking when the codebase answered the question) gave +22% pass@3.
  - Skill tuning raised Codex from 7% to 53% pass@3 and Claude Code from 3% to 15%.
  - A skill that helps one harness can hurt another. Claude Code and Codex have "nearly opposite asking priors."
  - Even tuned setups left a substantial gap against full information.

  — [Scale Labs](https://labs.scale.com/blog/hil-dynamics) [primary, fetched]
- **Anthropic field data (Feb 18, 2026).**
  - On complex tasks Claude Code "stops to ask for clarification more than twice as often as humans interrupt it."
  - Why Claude stops itself: to present a choice between approaches (35%), to gather diagnostic info or test results (21%), to clarify vague requests (13%), to request credentials or access (12%), and to get approval before acting (11%).
  - Why humans interrupt: to give missing technical context or corrections (32%), because Claude was slow, hanging or excessive (17%), and to change requirements mid-task (5%).

  — [Anthropic, Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]
- Anthropic recommends: "Model developers should consider training models to recognize their own uncertainty" and "Product developers should design for user oversight." — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]
- Reversibility framing (opinion, management literature): Bezos's "two-way door" (reversible) decisions "can and should be made quickly by high judgment individuals or small groups", while one-way doors need care — [Amazon 2015 shareholder letter](https://www.aboutamazon.com/news/company-news/2015-letter-to-shareholders) [not re-fetched; widely quoted]
- Practitioner heuristic (opinion): sort triggers into continue / ask / pause / hand off. Example triggers: wrong repo or branch, a diff wider than the prompt, a risky command — [Junction Panel, AI agent escalation policy](https://junctionpanel.dev/blog/ai-agent-escalation-policy/) [secondary, not fetched]

### Inferences
- The doit structure (spec writer, then a separate spec detective that asks) matches the UA-MULTI finding: a dedicated ambiguity judge beats asking the builder to "ask if unsure." Keep that separation. Do not push ask decisions back into the builder.
- To cut interruptions without losing quality, the detective should classify each open question rather than ask everything:
  - **(a) Answerable from the codebase or existing conventions:** resolve it and cite the file. Ambig-SWE says codebase-recoverable questions add little. Caveat: HiL-Dynamics found that letting Claude skip asking whenever "the codebase answers it" *hurt* (+22% when it was removed). So the agent should not self-certify this too loosely. Require a concrete citation (file:line) as evidence.
  - **(b) Reversible, low-blast-radius (two-way door):** assume, record it in an Assumptions log with rationale and alternatives, and surface it for async review at the end.
  - **(c) Irreversible, user-visible behaviour, or a spec contradiction (one-way door):** ask, batched, up front.
- Ask-rate should scale with task size and difficulty (Ask or Assume? data). Small stories may need zero questions. Large ones nearly always justify at least one.
- Claude-family models lean toward exploring before asking, and toward under-asking when given an escape hatch (HiL-Dynamics). The detective prompt should therefore list mandatory blocker categories rather than leave asking to discretion.

### Gaps
- No controlled study was found that directly compares "assume and log for later review" with "ask now" on final quality or user time. The reversible/irreversible split is a management heuristic applied by analogy, not tested in agents.
- No source gives numeric confidence thresholds (e.g. "ask if p<0.7") validated for coding agents. Ask or Assume? uses a binary judge, not a threshold.

## 2. Batching human interaction

### Takeaway
Front-loading questions works when ambiguity is detectable early. The forced-ask baseline asked 97.6% of its questions early and matched full-spec performance for Claude. Field data shows humans tire of approval prompts: 93% are accepted anyway. The best practice is therefore one batched question round, autonomous execution, gated approvals only for high-risk actions, and an end-of-run report of assumptions.

### Cited Findings
- Claude's forced-ask baseline asked 1.02 questions/task, 97.6% early, and reached 70.40% against 70.80% FULL. A single early round therefore recovered nearly all the lost performance for Claude — [Ask or Assume?](https://www.alphaxiv.org/abs/2603.26233.md) [fetched]
- Some information gaps only show up mid-task. UA-SINGLE's questions skewed late (43.9% in the late stage), and UA-MULTI averaged 3.06 queries/task across the run — [Ask or Assume?](https://www.alphaxiv.org/abs/2603.26233.md) [fetched]
- Approval fatigue: users "accept 93% of them anyway," which "leads to approval fatigue, where people stop paying close attention to what they're approving." — [Anthropic, Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode) [primary, fetched]
- Secondary reports of an Anthropic study: human reviewers caught 13.6% of dangerous commands, against 89% for auto mode — [The Decoder](https://the-decoder.com/anthropic-sets-claude-code-to-auto-mode-by-default-to-protect-developers-from-bad-approvals/), [Help Net Security](https://www.helpnetsecurity.com/2026/08/10/anthropic-claude-code-auto-mode/) [secondary; not confirmed on the primary page]
- Experienced Claude Code users move toward a "monitor and interrupt" pattern:
  - Full auto-approve rises from about 20% of sessions (under 50 sessions) to over 40% (by 750 sessions).
  - Interrupts rise from 5% to about 9% of turns.
  - On internal hard tasks, success doubled while interventions/session fell from 5.4 to 3.3 (Aug–Dec 2025).

  — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]
- GitHub Copilot cloud agent puts the human gate at the PR, not at each step:
  - It opens draft PRs that a human must review and merge. It cannot approve or merge its own PRs.
  - Actions workflows on its PRs wait for approval from a user with write access.

  — [GitHub Docs, Risks and mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations); [GitHub Docs, responsible use](https://docs.github.com/en/copilot/responsible-use/copilot-coding-agent) [secondary summary of official docs]
- Anthropic's long-running harness uses a persistent progress log (`claude-progress.txt`) so later sessions and humans can "quickly understand the state of work" — [Anthropic, Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) [primary, fetched]

### Inferences
- For doit, use exactly one synchronous interaction point (the spec detective's batched questions), plus an end-of-run "decisions & assumptions" section written by the documentor for async review. Mid-run interruptions should come only from the hard escalation triggers in section 5.
- Present questions with a recommended default for each, so the user can answer "accept defaults." This turns most questions into one-keystroke two-way-door confirmations.
- Approval prompts beyond what is necessary lower oversight quality (93% rubber-stamping). Fewer, higher-signal gates are both faster and safer.

### Gaps
- No empirical study was found on async post-hoc review of logged assumptions: how often reviewers reverse them, or what that costs.

## 3. Self-verification loops

### Takeaway
Verification grounded in execution (running tests, driving the real app in a browser or CLI) is the strongest lever. Self-critique without new external signal gives limited gains. Repair effectiveness decays fast: most of the value comes in the first 2–3 attempts, after which a fresh-context restart or escalation beats more looping. Independent selection across multiple candidates and generated tests recovers part of the gap to oracle selection.

### Cited Findings
- **Anthropic long-running harness:**
  - Failure mode: "Claude's tendency to mark a feature as complete without proper testing." Fix: "Self-verify all features."
  - Claude was "prompted to use browser automation tools and do all testing as a human user would," and "providing Claude with these kinds of testing tools dramatically improved performance."
  - Limitation: "Claude can't see browser-native alert modals through the Puppeteer MCP."

  — [Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) [primary, fetched]
- Same source, on the spec/feature list as a guarded artifact:
  - Agents may "edit this file only by changing the status of a passes field."
  - JSON was preferred over Markdown.
  - "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."

  — [Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) [primary, fetched]
- **OpenAI "Harness engineering" (Feb 2026):**
  - Codex was wired to the Chrome DevTools Protocol (DOM snapshots, screenshots, navigation) to reproduce bugs and validate fixes.
  - Agents self-review, then request reviews from other agents, and loop "until all agent reviewers were satisfied."
  - Human review is then optional.

  — [OpenAI, Harness engineering](https://openai.com/index/harness-engineering/) (403 on fetch); details via [ZenML summary](https://www.zenml.io/llmops-database/zero-human-written-code-harness-engineering-for-autonomous-ai-agents-at-scale) [secondary]
- **AlphaCodium (Jan 2024):**
  - A test-based iterative "flow" raised GPT-4 pass@5 on CodeContests validation from 19% to 44%.
  - Key elements: problem reflection, reasoning about public tests, generating extra AI tests, and "test anchors" to guard against wrong AI-generated tests.
  - Observation: "generating additional useful tests is easier than generating a correct code solution."
  - Evaluation used private (hidden) tests with more than 200 unseen tests per problem.

  — [AlphaCodium, arXiv 2401.08500](https://huggingface.co/papers/2401.08500) [secondary summary of primary]
- **Self-repair limits (Olausson et al., ICLR 2024):**
  - Self-repair is bottlenecked by the model's ability to give feedback on its own code.
  - Feedback from a stronger model improves repair, and human feedback raised GPT-4 repair success by about 1.58x.
  - Once repair cost is counted, gains are "often modest" and sometimes absent versus plain resampling.

  — [ICLR 2024 proceedings](https://proceedings.iclr.cc/paper_files/paper/2024/hash/9ddc141bdbf9d1db510cefff56c586ad-Abstract-Conference.html); [arXiv 2306.09896](https://arxiv.org/pdf/2306.09896.pdf) [secondary summary; the 1.58x figure needs checking]
- **Debugging Decay Index (Adnan & Kuhn, 2025; Scientific Reports Dec 2025):**
  - Debugging effectiveness follows exponential decay. "Most models lose 60-80% of their debugging capability within just 2-3 attempts."
  - A "fresh start" (clear context, re-prompt with the original problem) at the computed threshold improved, for example, Llama3.1 from 72.6% to 82.8% and DeepSeek-Coder-V2 from 84.1% to 92.1% on HumanEval.
  - Caveat: HumanEval only, not independently replicated.

  — [arXiv 2506.18403](https://arxiv.org/html/2506.18403v2) [secondary summary]
- **CodeMonkeys (Stanford, Jan 2025):**
  - Agents generate a test script alongside each edit and scale compute serially and in parallel.
  - Selection uses voting with model-generated tests plus a dedicated selection trajectory.
  - Results: 57.4% on SWE-bench Verified (Claude 3.5 Sonnet). Coverage (any candidate correct) was 69.8%, against 45.8% for random selection.
  - Selecting over an ensemble of other top submissions reached 66.2%, beating the best single member.
  - Full run cost about $2,300.

  — [CodeMonkeys, arXiv 2501.14723](https://arxiv.org/html/2501.14723v1) [secondary summary]
- **Reflexion (Shinn et al., 2023):** verbal self-reflection using test feedback reached 91% pass@1 on HumanEval, against 80% for GPT-4 — [arXiv 2303.11366](https://arxiv.org/abs/2303.11366) [abstract, not re-fetched]
- **Self-Debugging (Chen et al., 2023):** execution-guided "rubber duck" self-debugging improved baseline accuracy by up to 12% — [arXiv 2304.05128](https://arxiv.org/abs/2304.05128) [abstract, not re-fetched]
- **Weak validation is a real failure mode:** in HiL-Dynamics, "SWE-agent runs did far less validation" and "Codex often submitted despite visible errors." — [Scale Labs](https://labs.scale.com/blog/hil-dynamics) [primary, fetched]
- **Anthropic field data:** 21% of Claude's self-initiated stops were "to gather diagnostic information or test results." Giving the agent its own way to run and observe the app removes a large class of interruptions — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]

### Inferences
- **Judge-holds-acceptance-tests (holdout) design.** AlphaCodium and CodeMonkeys both separate generating tests from generating solutions, and AlphaCodium scores on hidden tests. For doit, the judge (or a test author spawned right after the spec is approved) should write acceptance checks from the SPEC before or independently of the builder, and keep at least some of them hidden from the builder. This prevents overfitting to visible tests and "marking done prematurely." No study was found that measures the exact holdout benefit in agent workflows; this is an inference.
- **Execution beats self-critique.** Reviewers (code and security) are useful, but Olausson shows feedback quality is the bottleneck. The judge should run the app end to end (Playwright/browser MCP for UIs, real CLI invocations for tools) and attach evidence: commands, outputs, screenshots.
- **Cap the build↔review loop at about 3 rounds per finding**, then do a fresh-context rebuild or escalate (DDI decay). Use auto mode's "3 consecutive / 20 total" denials as a precedent for numeric caps.
- **Guard the spec and tests.** Make SPEC items and acceptance tests append-only for the builder, as in Anthropic's "unacceptable to remove or edit tests" rule. The builder may only flip a status, and only the judge can mark a SPEC item passed.

### Gaps
- No 2024–2026 study was found that directly measures ATDD (spec-first acceptance tests) against tests written after the code for LLM agents.
- No quantitative evidence was found on LLM-judge-with-rubric reliability, specifically for judging coding output against a spec.
- Playwright MCP docs were not fetched. Its capabilities (accessibility-snapshot based browser control) are not cited here.

## 4. Autonomy-level frameworks and what they imply

### Takeaway
Frameworks define autonomy by the human's role (operator, collaborator, consultant, approver, observer) and treat it as a design choice separate from capability. Field data shows a "deployment overhang": models can do more autonomously than users grant. Task-length capability doubles roughly every 7 months (faster on SWE tasks). Safe autonomy comes from matching the human's role to risk, not from capability alone.

### Cited Findings
- **Feng, McDonald & Zhang (UW, arXiv 2506.12469, 2025):**
  - Five autonomy levels defined by the user's role: operator, collaborator, consultant, approver, observer.
  - Autonomy is "the extent to which it is designed to act without user involvement," and should be a deliberate design decision independent of capability.
  - Proposes "autonomy certificates" based on "autonomy cases," analogous to safety cases.

  — [arXiv 2506.12469](https://arxiv.org/abs/2506.12469) [secondary summary of primary]
- **METR:** the 50% time horizon of frontier AI grew exponentially over 2019–2025 with a doubling time of about seven months, possibly faster in 2024. A SWE-bench Verified analysis showed under 3 months. METR's TH1.1 update (larger task suite, models through Nov 2025) keeps the same method — [METR, Measuring AI ability to complete long tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/); [arXiv 2503.14499](https://arxiv.org/html/2503.14499v1) [secondary summary]
- **Anthropic** cites METR: Claude can complete tasks "with a 50% success rate that would take a human nearly 5 hours" — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]
- **Anthropic field data:**
  - Median turn length is about 45 s. The 99.9th-percentile turn went from under 25 to over 45 minutes.
  - "existing models are capable of more autonomy than they exercise in practice."
  - On the public API, "only 0.8% of actions appear to be irreversible," 73% of tool calls appear to have a human in the loop, and software engineering is about 50% of tool calls.

  — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]
- **Ask or Assume?** ask rates hit 100% on tasks taking a human over 4 hours. Longer tasks inherently carry more unresolved intent — [Ask or Assume?](https://www.alphaxiv.org/abs/2603.26233.md) [fetched]
- **Devin rule of thumb:** tasks a human can do in about 3 hours are usually within reach. Larger work needs smaller slices or more steering — [fast.io Devin guide](https://fast.io/resources/devin-ai-agent-guide/) [secondary, third-party]

### Inferences
- In Feng et al.'s terms, doit currently puts the user in "consultant" mode (asked during spec) and "approver" mode (escalations). The goal is to move toward "approver/observer," with the user reviewing a final report and an assumption log.
- Story size is a lever. 50% time horizons are hours, not days, so keeping each doit story well under that (e.g. under 1–2 human-hours) keeps both failure and question rates low.

### Gaps
- No autonomy-level framework was found that is specific to coding agents and has empirical validation. Cognition's and others' "levels" appear only in secondary blog posts.

## 5. Escalation design: triggers and presentation

### Takeaway
Concrete, enumerated triggers beat discretionary "ask if unsure." The best-documented production example (Claude Code auto mode) blocks four categories of dangerous action. On a block it feeds the denial back for the agent to find a safer path, and escalates to the human only after repeated denials (3 consecutive or 20 total).

### Cited Findings
- **Claude Code auto mode block categories** ("more than twenty block rules"):
  - **Destroy or exfiltrate** (force-push over history, mass deletion, sending internal data externally).
  - **Degrade security posture** (disabling logging, persistence such as SSH keys or cronjobs, modifying the agent's own permission config).
  - **Cross trust boundaries** (running code from external repos, scanning credential stores, sending data to unspecified services).
  - **Bypass review or affect others** (pushing directly to main, production deploys, modifying shared resources the agent didn't create).

  — [Anthropic, auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode) [primary, fetched]
- **What happens on a block:**
  - The denial goes back to the agent with an instruction to find a safer path, not to route around the block.
  - "If a session accumulates 3 consecutive denials or 20 total, we stop the model and escalate to the human."
  - In headless mode the process is terminated.
  - Threat model: "overeager" behaviour, where the agent "takes initiative beyond what the user would approve."

  — [Anthropic, auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode) [primary, fetched]
- **Auto mode classifier accuracy:**
  - Full pipeline: 0.4% FPR on real traffic and 17% FNR on real overeager actions ("the honest number").
  - Synthetic exfiltration: 5.7% FNR.
  - It is not a hard security boundary; Anthropic still recommends sandboxes.

  — [Anthropic](https://www.anthropic.com/engineering/claude-code-auto-mode) [primary, fetched]; [The Decoder](https://the-decoder.com/anthropic-sets-claude-code-to-auto-mode-by-default-to-protect-developers-from-bad-approvals/) [secondary]
- **Copilot cloud agent hard gates:**
  - Its firewall is on by default to limit exfiltration.
  - It cannot approve its own PRs, and its self-approval does not count toward required approvals.
  - A new commit dismisses an earlier Copilot approval.

  — [GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations); [GitHub changelog 2026-09-01](https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests) [secondary summary of official pages]
- **Legitimate stop reasons from field data:** missing credentials/access (12%) and approval before acting (11%). Humans also interrupt "to change requirements mid-task" (5%) and to "take the next step themselves (e.g., ... deployment, committing)" (7%) — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy) [primary, fetched]
- **Presenting escalations:** Claude's most common reason to stop (35%) is "to present the user with a choice between proposed approaches." Ambig-SWE finds the best questions are "specific, actionable, and task-level." — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy); [Ambig-SWE](https://arxiv.org/html/2502.13069v3) [primary, fetched]

### Inferences
Proposed escalation triggers for doit, each derived from the sources above:

1. Repeated failure: the same SPEC item fails the judge after N (about 3) build cycles, including one fresh-context restart (DDI; auto-mode caps).
2. The spec contradicts itself or the codebase, or the SPEC cannot be met as written.
3. Scope change: the diff touches areas outside the spec's declared scope, or new public interfaces or dependencies are needed (Junction Panel "diff wider than prompt").
4. Destructive or irreversible operations, or operations outside the trust boundary (the auto-mode categories): data migrations, deletions, force-push, deploys, secrets.
5. Security-reviewer findings rated high or critical that cannot be fixed within scope.
6. Missing credentials or access.

**Escalation format:** one screen.
- What is blocked (the SPEC item ID).
- Evidence: the failing command and output.
- What was tried: N attempts, one line each.
- 2–3 options, each with its consequence, and a recommended default.
- What happens if there is no answer, e.g. "proceed with A and log it."

Everything else (reversible design choices, naming, internal structure) should be assumed, logged and reported by the documentor.

### Gaps
- No empirical comparison of escalation formats (options with a default vs. open questions) on user response time or decision quality was found.
- No published false-escalation and missed-escalation rates were found for repeated-failure triggers in multi-agent coding pipelines.
