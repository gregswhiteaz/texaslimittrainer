# Professional Agile Story Writing, Epic Grouping, Splitting, Acceptance Criteria, Sequencing and Traceability

Scope: how professionals turn a requirements spec into a backlog (epics/groups, well-formed stories, complete ACs, build order, full traceability). Written as input for rewriting an AI story-writer ("Weaver") and an AI auditor ("Judge"). Items under "Inferences" are synthesis/LLM-rule proposals, not quotes from sources.

## Story quality: INVEST, 3 Cs, templates, DoR/DoD, anti-patterns

### Takeaway
A good story is a thin, vertical, user-valuable slice that is Independent, Negotiable, Valuable, Estimable, Small and Testable; the card is only a token, and the "Confirmation" (acceptance tests) is what makes it real. The most common failure is "Valuable" — stories that are really tasks or architectural layers.

### Cited Findings
- INVEST (Bill Wake): Independent — stories should not overlap in concept and ideally can be scheduled in any order; Negotiable — "A good story captures the essence, not the details"; Valuable — "it needs to be valuable to the customer," not just developers; Estimable — just enough to let the customer rank and schedule; Small — "at most a few person-weeks worth of work"; Testable — "Writing a story card carries an implicit promise" that you understand it well enough to write a test. — [Bill Wake, INVEST in Good Stories](https://xp123.com/invest-in-good-stories-and-smart-tasks/)
- Tasks (below stories) should be SMART: Specific, Measurable ("can we mark it as done?"), Achievable, Relevant (contributes to the story), Time-boxed. — [Bill Wake](https://xp123.com/invest-in-good-stories-and-smart-tasks/)
- 3 Cs (Ron Jeffries): Card = "a token representing the requirement"; Conversation = details exchanged over time, best supplemented by examples, "the best examples are executable"; Confirmation = acceptance tests defined by the customer that show the story is implemented correctly; "the confirmation, in terms of acceptance tests, is what keeps the Circle of Life turning." — [Ron Jeffries, Card/Conversation/Confirmation](https://ronjeffries.com/xprog/articles/expcardconversationconfirmation/)
- Template (Cohn): "As a [type of user], I [need/want/am required] to [do something], so that [reason or benefit]." It is a thinking aid; job stories or technical backlog items are acceptable when clearer. Acceptance criteria may be examples, rules, tests or brief notes — "format matters less than the shared understanding." Detail should be just enough for the next decision; top-of-backlog items need more clarity. — [Mountain Goat Software, User Stories](https://www.mountaingoatsoftware.com/agile/user-stories)
- Good-story examples (Cohn): conference attendee saves sessions to a personal agenda (ACs: mark saved sessions, remove them, warn about time conflicts); returning customer reorders from a previous purchase (ACs: add available items to cart, show unavailable items without adding them, adjust quantities before checkout). Bad→better: "I need a dashboard so that I can see metrics" → name the decision the user must make (improve, promote, or remove a feature). — [Mountain Goat Software](https://www.mountaingoatsoftware.com/agile/user-stories)
- Splitting prep: run the INVEST check (except Small) first; "Valuable is the most common failure. If an item is only a task or component, combine it with other pieces until together they deliver an increment of value." Rule of thumb: 6–10 stories should fit in a sprint by the time they reach the top of the backlog. — [Humanizing Work splitting guide](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)
- Horizontal (layer) slicing is an anti-pattern: vertical slicing "refers to cutting through each layer of the application to deliver value, as opposed to horizontal slicing, which focuses on one layer at a time"; grouped stories degrade into tasks such as "Change Password UI," "Change Password API," producing reports of progress with no working software; a story can be "done" but unreleasable because it depends on another unfinished story. — [Thoughtworks, User stories: a tale of epic confusion](https://www.thoughtworks.com/insights/blog/user-stories-tale-epic-confusion)
- "Many believe user stories = tasks. This is not true. User stories = value for the end-user." — [Zenhub community](https://community.zenhub.com/t/thoughts-on-vertical-slicing/486). Terminology caution: some writers (Visual Paradigm) use "horizontal slicing" to mean the good end-to-end approach — reversed vs. most sources. — [Visual Paradigm blog](https://blog.visual-paradigm.com/?p=25111)
- Definition of Ready (Scrum.org): item is understood well enough to plan into a Sprint; the "brutally simple" test is: can the team estimate it, and is it small enough to plan without further breakdown? More refinement than that is waste. Typical criteria map to INVEST, incl. "Testable: has clear acceptance criteria." — [Scrum.org, Walking Through a Definition of Ready](https://www.scrum.org/resources/blog/walking-through-definition-ready)
- Cohn's warning: a DoR can become "a huge step towards a sequential, stage-gate approach"; prefer guidelines over 100%-complete rules; he has no objection to size limits (e.g. story ≈ half team velocity). — [Mountain Goat, Dangers of a Definition of Ready](https://www.mountaingoatsoftware.com/blog/the-dangers-of-a-definition-of-ready)
- NFRs are "typically revisited as part of the definition of done (DoD)." — [SAFe, Nonfunctional Requirements](https://framework.scaledagile.com/nonfunctional-requirements)

### Inferences
- LLM story template (proposal): Title (verb phrase, user outcome) · "As a <specific role>, I want <capability>, so that <benefit tied to a requirement>" · Context/notes · Acceptance criteria (numbered, testable) · Requirement refs (REQ IDs + specific AC/clauses covered) · Dependencies (story IDs) · Out of scope / deferred-to story IDs.
- Good vs bad (synthesized from sources above):
  - BAD: "Create users database table" (layer task, no user value). GOOD: "As a new visitor, I can register with email and password so that I can save my progress" — includes the table, API, UI and validation needed for that slice.
  - BAD: "As a user, I want to manage my account" (vague "manage" = CRUD bundle, too large). GOOD: split into sign up / edit settings / cancel account.
  - BAD AC: "Login works correctly and is fast." GOOD AC: "Given a registered user, when they submit correct credentials, then they land on their dashboard"; "Given 5 consecutive failed attempts, then the account is locked for 15 minutes and the user sees a lock message"; "p95 login response ≤ 500 ms under 100 concurrent users."
- Anti-pattern checklist for the Judge: layer/component stories (UI-only, API-only, DB-only, "setup X"); "manage"/"handle"/"support" verbs hiding multiple operations; ACs using "correctly", "properly", "user-friendly", "fast", "etc."; ACs that restate the story; implementation-prescriptive ACs ("click the blue button", "use Redis"); missing "so that"; role "user" when the spec distinguishes roles; story depends on a later story; story with no REQ reference; stories that are pure tasks.
- Definition of Done (generic, suggested for an AI pipeline): all ACs pass as automated/verifiable tests; NFR constraints tagged on the story verified; no known debt left unrecorded (Humanizing Work warns against marking stories done "when they still carry debt" after deferring performance).

### Gaps
- No authoritative numeric "maximum ACs per story"; the Example Mapping signal (many rules → split) is the closest heuristic (see AC section).
- Atlassian's epics/stories/themes page could not be retrieved (navigation-only content returned).

## Epics/features/themes hierarchy and User Story Mapping

### Takeaway
Group by user activity/capability (the story-map backbone), never by architectural layer. Build the walking skeleton (the top, most necessary story under each backbone item, end to end) first, then widen by release slices.

### Cited Findings
- Cohn: an epic is a large story used to capture a capability before details are known; split as it nears development. — [Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories)
- Thoughtworks: Cohn described an epic as "just a label we apply to a large story"; "User stories are discovered to be epics through sizing"; using epics to group stories for reporting is a misuse — if grouping is needed, call it feature, theme or milestone. Grouping epics such as 'Infrastructure', 'Monitoring and Alerting', 'Front-end/Back-end', 'Integration', 'Security' "encourage horizontal slicing"; prefer story mapping over upfront epics. — [Thoughtworks](https://www.thoughtworks.com/insights/blog/user-stories-tale-epic-confusion)
- Patton: a flat backlog "doesn't help me explain to others what the system does", hides gaps, is "a bag of context-free mulch." Map structure: Activities (big things people do) across the top; user tasks beneath; left-to-right in narrative/time order — "the order you'd explain the behavior of the system in is the correct order." The backbone is not prioritized: "It just 'is.'" Stories hanging below are ribs; higher = more necessary. The highest-placed stories form the walking skeleton — "the smallest end-to-end system. Build this first." Releases = horizontal swim lanes; prioritize within each backbone item, not between them; read the map left-to-right, top-to-bottom so "we never release a car without brakes." — [Jeff Patton, The New User Story Backlog is a Map](https://jpattonassociates.com/the-new-backlog/)
- Walking skeleton (Cockburn): "a tiny implementation of the system that performs a small end-to-end function"; need not use final architecture but should link the main architectural components; can cover the full production pipeline (build/deploy). Similar: Pragmatic Programmer "tracer bullets"; GOOS (Freeman & Pryce): a thin slice that can be automatically built, deployed, and tested end-to-end. — [Henrico Dolfing summary](https://henricodolfing.com/2018/04/start-your-project-with-walking-skeleton.html); [Gojko Adzic, Forget the walking skeleton, put it on crutches](https://gojko.net/2014/06/09/forget-the-walking-skeleton-put-it-on-crutches/)
- SAFe enablers: Exploration (research/prototyping), Architecture (builds architectural runway), Infrastructure (dev/runtime environments), Compliance (verification, audits, approvals); enablers live in backlogs as epics/features/stories and "follow the same rules" as customer-facing items. — [SAFe, Enablers](https://framework.scaledagile.com/enablers)

### Inferences
- Epic rule for the Weaver: one epic per user activity / capability area from the spec (e.g. "Account & Identity", "Play a Hand", "View History"), ordered left-to-right as the user's journey. Forbid epics named after layers (Frontend, Backend, Database, API, Infrastructure, Security). Cross-cutting concerns (security, performance, accessibility) become ACs/constraints on functional stories, or a small "Platform/Enablers" group only for genuinely user-invisible work (CI, project scaffold), each enabler justified by the stories it unblocks.
- Within each epic, order stories top-down by necessity: first story = walking-skeleton slice (simplest happy path); subsequent stories = variations, rules, edge cases, polish.
- Judge check: does every epic contain at least one story in the first release slice? Does reading epic-1-story-1 → epic-N-story-1 yield a working end-to-end thin system?

### Gaps
- No primary source fetched defining SAFe's exact Epic→Capability→Feature→Story sizing boundaries (pages are login-walled).

## Story splitting patterns

### Takeaway
Split by behavior (workflow steps, paths, rules, data, interfaces, operations), not by layer; reduce variations to one complete slice first; use spikes only as a last resort; prefer splits that expose low-value parts and give equal-sized stories.

### Cited Findings
- Humanizing Work (Richard Lawrence) 9 patterns: (1) Workflow Steps — simple end-to-end case first, then middle steps/special cases (publish directly → editor review → legal review → staging); NOT one step at a time start-to-finish; (2) Operations (CRUD) — "manage" signals multiple ops; (3) Business Rule Variations (e.g. flexible dates: range, weekend, ±N days); (4) Variations in Data — simple data model first, add complexity just-in-time; (5) Data Entry Methods — simple UI then fancy widget; (6) Major Effort — "one of N" then "remaining N-1"; (7) Simple/Complex — pin the simplest version with ACs, move each "what about X?" into its own story; (8) Defer Performance / other NFRs — "make it work" then "make it fast/secure/scalable" — beware marking done while carrying debt; (9) Spike — time-boxed, ACs are the questions to answer, last resort. Meta-pattern: find the core complexity, identify variations, reduce all variations to one complete slice. Choosing: prefer the split that lets you deprioritize/throw away a story; prefer equal sizes (8 → four 2s beats 5+3); re-split if still too large. — [Humanizing Work Guide to Splitting User Stories](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)
- SPIDR (Mike Cohn): Spikes (research into own story; usually not the first technique), Paths (different ways to achieve the goal, e.g. share via social buttons / copied link / timestamped link), Interfaces (simple version first, or one browser/device at a time), Data (subset first: one file format; one manager per employee), Rules (relax a rule temporarily: allow uploads before copyright check). "Data and rules often shrink stories the most." Some split stories may not be releasable alone. — [Mountain Goat, SPIDR](https://www.mountaingoatsoftware.com/blog/five-simple-but-powerful-ways-to-split-user-stories)
- Splitting off email notification ("Change Password email notification") as its own story is cited as a good split. — [Thoughtworks](https://www.thoughtworks.com/insights/blog/user-stories-tale-epic-confusion)
- Example Mapping signal: many blue (rule) cards = story too big → slice. — [Cucumber, Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/)

### Inferences
- Weaver split triggers: >~6–8 ACs, >1 user role, >1 CRUD operation, "and/or" in the I-want clause, multiple business-rule variants, multiple input channels/devices, a happy path plus several error paths that each need distinct behavior.
- Every split must preserve requirement coverage: when a story is split, its REQ refs must be partitioned (not duplicated vaguely) across children, and the Judge must verify the union equals the original.
- Happy/unhappy path split: happy path story first; error/edge handling may be separate stories but must exist and be sequenced before release slice completion.

### Gaps
- No primary source quantifies how often each pattern applies.

## Acceptance criteria: Given/When/Then, rule checklists, example mapping, NFRs, negative paths

### Takeaway
ACs are the "Confirmation": concrete, observable, behavior-level (declarative, not UI-procedural) examples organized under business rules. NFRs belong as measurable constraints on stories and in the DoD; split them into dedicated stories only when deferring them deliberately.

### Cited Findings
- Given-When-Then: "a template intended to guide the writing of acceptance tests for a User Story" — Given = starting context, When = action, Then = observable results. Example: customer with positive balance, no recent withdrawals, withdraws under card limit → withdrawal completes without errors or warnings. — [Agile Alliance glossary](https://www.agilealliance.org/glossary/gwt/)
- Better Gherkin: describe "the intended behaviour of the system, not the implementation"; test: would the wording change if the implementation did? `When "Bob" logs in` (good) vs. visit URL / fill fields / press button (implementation procedure, bad). Prefer declarative ("Free Frieda has a free subscription… she sees a Free article") over imperative; avoid "click a button". — [Cucumber, Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)
- Example Mapping (Matt Wynne): yellow = story, blue = rules (ACs/constraints), green = examples under each rule, red = questions nobody can answer; new stories discovered are deferred. Signals: many red → too much unknown (research/spike); many blue → too big, slice; one rule with many examples → over-complex rule, separate it. ~25 minutes per well-sized story. Goal isn't writing formal tests in the session; Gherkin written later. — [Cucumber, Introducing Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/)
- ACs may be examples, rules, tests or brief notes. — [Mountain Goat](https://www.mountaingoatsoftware.com/agile/user-stories)
- NFRs as constraints: Cohn prefers "constraints" because each "narrows the design choices"; they "can be easily expressed as user stories" incl. who and why ("As the CTO, I want the system to use our existing orders database rather than create a new one"; "As a user, I want the site to be available 99.999 percent of the time"); stating the reason protects the constraint; drop the template if awkward. — [Mountain Goat, Non-functional requirements as user stories](https://www.mountaingoatsoftware.com/blog/non-functional-requirements-as-user-stories)
- SAFe: NFRs "often serve as constraints across the relevant backlogs" and are "typically revisited as part of the definition of done"; over-specifying makes solutions too costly, under-specifying leaves them inadequate. — [SAFe NFRs](https://framework.scaledagile.com/nonfunctional-requirements)
- Deferring NFRs into a separate "make it fast/secure" story is a recognized split, with the risk of hidden debt. — [Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)

### Inferences
- AC format rule for Weaver: group ACs under the rule they confirm (rule → 1+ examples). Each AC: Given <state> When <actor action/event> Then <observable outcome with concrete values>. Each AC independently verifiable, one behavior per AC, no implementation details unless the requirement itself is a technical constraint.
- Mandatory AC coverage per story: happy path; each business rule/variation from the requirement; validation/negative inputs; boundary values (min/max/empty/zero/limits); error/failure of dependencies; authorization (who may NOT do it); state-related cases (already exists, concurrent change, not found); and any NFR constraint that applies (measurable: number + unit + condition).
- NFR placement decision: (a) applies to one story → AC on that story; (b) applies system-wide → constraint listed in DoD/global constraints AND referenced by every affected story; (c) needs significant dedicated work (e.g., load testing infra, audit logging) → dedicated story/enabler with its own testable ACs, sequenced explicitly.
- Open questions (red cards) must be surfaced explicitly, not silently assumed; Judge fails a story whose ACs depend on unresolved assumptions not recorded.

### Gaps
- No source found giving a canonical edge-case taxonomy for ACs; the mandatory list above is synthesized.

## Sequencing and ordering

### Takeaway
Order: walking skeleton (thin end-to-end) first, then widen left-to-right/top-to-bottom by release slice; within that, pull risk/uncertainty forward (spikes, new integrations) and use value-per-size (WSJF) to rank; dependencies must point only to earlier stories.

### Cited Findings
- Patton: build the walking skeleton first, then read the map left-to-right, top-to-bottom, widening the whole system rather than finishing one feature at a time. — [Jeff Patton](https://jpattonassociates.com/the-new-backlog/)
- Walking skeleton validates architecture early and confirms the delivery pipeline. — [Henrico Dolfing](https://henricodolfing.com/2018/04/start-your-project-with-walking-skeleton.html)
- Meta-pattern: find the core complexity (most likely to surprise: human behavior, new integration, external dependency) and slice through it first. — [Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)
- WSJF = relative Cost of Delay / relative job size (duration); CoD = user-business value + time criticality + risk reduction/opportunity enablement. — [SAFe WSJF](https://framework.scaledagile.com/wsjf)
- INVEST Independent: ideally stories can be scheduled in any order; Scrum.org DoR lists "Independent: self-contained, with no dependency on other items." — [Bill Wake](https://xp123.com/invest-in-good-stories-and-smart-tasks/); [Scrum.org](https://www.scrum.org/resources/blog/walking-through-definition-ready)
- Major Effort pattern avoids stale dependency by "one of N" then "remaining N-1." Data Entry Methods splits are acknowledged as not independent but still useful. — [Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)

### Inferences
- Ordering algorithm for Weaver: (1) foundation/enabler minimal set needed for the skeleton (project scaffold, CI) — only if unavoidable; (2) skeleton: first story of each epic in journey order; (3) high-risk/uncertain slices and spikes; (4) remaining stories by release slice, within slice by value/size; (5) polish/deferred NFR stories last but before release completion.
- Dependency rules: express as explicit "depends on: <story IDs>"; every dependency must reference a story with a lower sequence number (topological order) → guarantees no cycles; minimize dependencies (rewrite to "given X exists" with test fixtures where possible); a cycle signals a bad split (merge or re-slice along behavior).
- Judge checks: build the dependency graph, detect cycles, detect forward references, detect dangling references; verify story #1 is runnable alone; verify no story depends on an unbuilt enabler.

### Gaps
- SAFe's full WSJF guidance (Fibonacci scale, job size details) is login-walled; not verified here.

## Traceability and coverage

### Takeaway
Maintain bidirectional traceability: forward (every requirement and every requirement-level acceptance clause maps to ≥1 story AC) and backward (every story/AC maps to ≥1 requirement — no orphans/scope creep). A link proves only intent, so coverage must be checked at AC granularity, not just story-level.

### Cited Findings
- Bidirectional: "trace forward from requirements to tests (are all requirements covered?) and backward from tests to requirements (is every test justified by a requirement?)." — [TestRail, RTM how-to](https://www.testrail.com/blog/requirements-traceability-matrix/)
- Agile chain: Business Objective → Epic → User Story → Acceptance Criteria → Test; "Requirements = User Stories + Acceptance Criteria." — [yrkan.com RTM course](https://yrkan.com/course/module-01-fundamentals/requirements-traceability-matrix/) (study-guide quality source)
- Caveats: "Having a test case mapped does not mean adequate coverage"; "A link describes the planned relationship; it does not prove the implementation exists or the test passed." — [yrkan.com](https://yrkan.com/blog/requirements-traceability-matrix/) (secondary source)
- Patton: flat backlogs make gaps hard to spot; story maps let you see missing pieces along the backbone. — [Jeff Patton](https://jpattonassociates.com/the-new-backlog/)

### Inferences
- Weaver must emit an RTM: rows = each REQ ID and each of its sub-clauses/ACs; columns = story IDs + specific story AC numbers covering it; status = full/partial. Plus reverse list: each story → REQ IDs.
- Judge coverage algorithm: (1) enumerate atomic requirement clauses (split compound "and" requirements; include each listed rule, value, limit, role, error case, NFR); (2) for each clause find a story AC that would fail if the clause were not implemented — semantic check, not keyword match; (3) flag partial coverage (e.g., requirement says "admins and moderators", story covers only admins; requirement gives limit 10, AC says "a limit"); (4) flag orphan stories/ACs with no REQ link and ACs that contradict or exceed requirements (scope creep); (5) flag conflicting duplicates (two stories implementing the same clause differently).

### Gaps
- Primary-source (e.g., IEEE/ISO 29148) definitions of traceability not fetched; sources used are secondary/vendor.

## Reviewer checklists for auditing a backlog

### Takeaway
Audit at three levels — per story (INVEST + AC quality), per backlog (structure, order, dependencies), and per requirement (bidirectional coverage) — and fail on any uncovered requirement clause, horizontal story, untestable AC, or dependency cycle.

### Cited Findings
- INVEST as the per-story quality test, with Valuable the most common failure. — [Bill Wake](https://xp123.com/invest-in-good-stories-and-smart-tasks/); [Humanizing Work](https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/)
- DoR readiness test: estimable, small enough to plan without further breakdown, testable ACs. — [Scrum.org](https://www.scrum.org/resources/blog/walking-through-definition-ready)
- Layer epics/stories are an anti-pattern; "done but not releasable" is a symptom. — [Thoughtworks](https://www.thoughtworks.com/insights/blog/user-stories-tale-epic-confusion)
- Example Mapping signals (too many rules → split; too many questions → unknowns; many examples per rule → split rule). — [Cucumber](https://cucumber.io/blog/bdd/example-mapping-introduction/)
- Declarative, implementation-free scenario wording. — [Cucumber Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)

### Inferences
Proposed Judge checklist (each item pass/fail with evidence):
- Per story: has role/want/benefit; benefit traceable to a REQ; vertical (user-observable outcome, not layer); single capability (no "and"/"manage"); small (≤ ~6–8 ACs); ACs testable, concrete values, observable outcomes, no vague adjectives; negative/edge/authorization ACs present where requirement implies them; NFR constraints present as measurable ACs or referenced global constraints; open questions recorded; REQ refs present; dependencies listed and backward-only.
- Per backlog: epics map to user activities, none named after layers; journey order left-to-right; walking skeleton identifiable and first; enablers minimal and justified; dependency graph acyclic with no forward/dangling refs; no duplicate/overlapping stories; spikes time-boxed with question-ACs.
- Per requirement (RTM): every REQ and every atomic clause covered by ≥1 story AC (fully, with same values/limits/roles); every story and AC traces back to a REQ (no orphans); no AC contradicts a requirement; deferred items explicitly listed with justification.
- Verdict rule: FAIL if any requirement clause uncovered/partial, any contradiction, any cycle, any horizontal-only story without justification; report each gap with REQ ID, missing clause, and suggested fix (which story to amend or add).

### Gaps
- No published industry-standard "backlog audit checklist" was found; the checklist above is synthesized from the cited principles.
