# Professional Requirements Elicitation & Specification Practices (for an AI-driven "dreamit" interview)

Scope note: about 15 tool calls. The primary standards (ISO/IEC/IEEE 29148, ISO/IEC 25010, the BABOK Guide, and the IREB handbooks) are paywalled or only partly public, so several findings rest on secondary summaries, and I flag those. Items under "Inferences" are my own synthesis for encoding into an LLM workflow; they are not sourced claims.

---

## 1. What do standards and bodies of knowledge prescribe?

### Takeaway
29148 gives the quality bar: per-requirement characteristics (necessary, singular, unambiguous, verifiable, complete, correct, feasible…) plus set-level characteristics (complete, consistent, feasible, comprehensible, validatable). Volere gives the most complete section checklist and the "fit criterion" concept. Wiegers gives the practical levels (business, user, functional, plus NFR) and the trap list. BABOK gives the elicitation lifecycle: prepare, conduct, confirm, communicate, manage collaboration.

### Cited Findings
**ISO/IEC/IEEE 29148 (2011; 2nd ed. 2018)**
- Individual-requirement characteristics are in §5.2.5 and requirement-set characteristics in §5.2.6. Secondary sources say there are nine individual characteristics but differ on exact wording between editions. — [ANSI preview 29148-2011](https://webstore.ansi.org/preview-pages/ISO/preview_ISO+IEC+IEEE+29148-2011.pdf); [IEC preview ed2](https://www.vde-verlag.de/iec-normen/preview-pdf/info_isoiecieee29148{ed2.0}en.pdf)
- Individual characteristics and their definitions:
  - **Necessary:** removing it would leave a capability gap.
  - **Complete:** all thresholds and conditions a reader needs are stated.
  - **Singular:** one action or capability per statement.
  - **Unambiguous:** only one interpretation. Example: "Increase website speed" is vague; "Increase website loading speed by 1 second" is proper.
  - **Correct:** reflects stakeholder need.
  - **Verifiable:** no subjective terms like "user-friendly".
  - **Appropriate/feasible:** achievable within technical, budget, and regulatory constraints.
  
  — [Modern Requirements summary of 29148](https://www.modernrequirements.com/?p=32595)
- Set characteristics:
  - **Complete:** the set covers everything the solution needs.
  - **Consistent:** no contradictions and uniform terminology.
  - **Feasible:** the set as a whole is achievable.
  - **Comprehensible.**
  - **Validatable:** can be checked against real stakeholder intent.
  
  A set can fail even when each requirement passes on its own. — [Modern Requirements](https://www.modernrequirements.com/?p=32595)
- 29148 permits both formal "shall" statements and user stories. The StRS (stakeholder requirements spec) captures acceptance criteria, and change and version control fall under Clause 6.6. — [Modern Requirements](https://www.modernrequirements.com/?p=32595)
- Note: the commonly cited ISO 29148:2018 / INCOSE list also includes "Conforming" and "Traceable" for individual requirements. I could not verify the exact 2018 list from a primary source (see Gaps).

**Volere (Robertson & Robertson, Atlantic Systems Guild)**
- Template sections: 1 Purpose/Goals · 2 Stakeholders (client, customer, other stakeholders, hands-on users, personas, user priorities, user participation, maintenance users) · 3 Mandated Constraints (solution, current implementation environment, partner apps, off-the-shelf software, workplace, schedule, budget, enterprise) · 4 Naming conventions/Glossary · 5 Relevant facts, Business rules, Assumptions · 6 Scope of the Work (current situation, context, work partitioning, business use cases) · 7 Business data model & data dictionary · 8 Scope of the Product (product boundary, product use case table, individual PUCs) · 9 Functional reqs · 10 Look & feel · 11 Usability & humanity (ease of use, personalization/i18n, learning, understandability/politeness, accessibility, convenience) · 12 Performance (speed/latency, safety-critical, precision/accuracy, reliability/availability, robustness/fault tolerance, capacity, scalability/extensibility, longevity) · 13 Operational & environmental (physical env, wider env, adjacent systems, productization, release, backwards compatibility) · 14 Maintainability & support (maintenance, supportability, adaptability) · 15 Security (access, integrity, privacy, audit, immunity) · 16 Cultural · 17 Compliance (legal, standards) · 18 Open issues · 19 Off-the-shelf solutions · 20 New problems (effects on current env and installed systems, potential user problems, follow-up problems) · 21 Tasks · 22 Migration (data to be modified/translated) · 23 Risks · 24 Costs · 25 User docs & training · 26 **Waiting Room** (deferred reqs) · 27 Ideas for solutions. — [Volere template](https://www.volere.org/templates/volere-requirements-specification-template/)
- A **fit criterion** is "a measurement against which [the requirement] can be tested". Example: "The product shall help the user to avoid making mistakes" gets the fit criterion "One month's use of the product shall result in a total error rate of less than 1 percent." Each atomic requirement carries a set of attributes (the "snow card" shell), which "can and should be automated." — [Volere template](https://www.volere.org/templates/volere-requirements-specification-template/)

**Karl Wiegers (Software Requirements; "10 Requirements Traps")**
- Distinguish three levels: **business requirements** (vision & scope document), **user requirements** (use cases), and **functional requirements** derived from use cases. Nonfunctional requirements go alongside them in the SRS. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Customers often present solution ideas instead of needs, so the analyst must separate the need from the proposed solution. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Identify **user classes** and appoint a **product champion** per class. User reps evaluate prototypes and review the SRS. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Trace every requirement to a source (use case, business rule, standard, regulation) and identify who benefits. This avoids building features nobody uses and gold-plating. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Against analysis paralysis: requirements should be "good enough to proceed at acceptable risk", not perfect. Flag gaps with TBD and identify decision-makers early. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)

**IIBA BABOK v3**
- About 50 techniques. The Elicitation & Collaboration knowledge area has five tasks: Prepare for Elicitation, Conduct Elicitation, **Confirm Elicitation Results**, Communicate BA Information, and Manage Stakeholder Collaboration. — [open-exam-prep CCBA guide](https://open-exam-prep.com/study-guides/ccba/babok-techniques/elicitation-analysis-techniques); [watermarklearning](https://www.watermarklearning.com/blog/?p=11197)
- Core elicitation techniques:
  - **Interviews:** structured, semi-structured, or unstructured, using prepared and spontaneous questions.
  - **Workshops/JAD:** discover, define, negotiate, prioritize, reach consensus.
  - **Document analysis:** harvest business rules, data, and constraints from existing artifacts, building a baseline before stakeholder engagement.
  - **Focus groups:** 6–12 participants; they do not seek consensus.
  - **Observation:** surfaces workarounds and tacit knowledge.
  
  — [open-exam-prep](https://open-exam-prep.com/study-guides/ccba/babok-techniques/elicitation-analysis-techniques)

**IREB CPRE**
- The Foundation handbook covers the Kano model, gathering techniques, and design and idea-generating techniques. The Advanced Elicitation module adds ethnographic observation, prototyping, and structured workshops. (Secondary source; handbook text not verified.) — [IREB AL Elicitation handbook (gasq)](https://gasq.org/files/content/gasq/downloads/certification/IREB/advanced_level_elicitation_handbook_en_v2.1.pdf); [microTOOL](https://www.microtool.de/en/knowledge-base/requirements-elicitation/)
- Technique choice depends on the Kano category (basic, performance, excitement) and the project phase. Questioning techniques suit explicit knowledge; observation suits tacit knowledge. — [microTOOL](https://www.microtool.de/en/knowledge-base/requirements-elicitation/)

### Inferences
- For dreamit: **Vision stage = Wiegers' business requirements and Volere §1–8** (purpose, stakeholders, constraints, glossary, facts and assumptions, scope). **Requirements stage = Wiegers' user and functional requirements plus NFRs (Volere §9–17)**. Stories come only after the set passes 29148 set-level checks.
- An LLM cannot observe users, so tacit knowledge has to be reached by proxy. Ask the PO to walk through a concrete recent instance step by step ("tell me about the last time…"), and propose straw-man prototypes or example screens they can react to. Reacting to a concrete artifact surfaces tacit rules better than abstract questions.
- BABOK's "Confirm Elicitation Results" maps directly to a mandatory read-back step: after each topic batch, the AI restates the requirements in final syntax and asks for explicit confirm, edit, or reject.

### Gaps
- Exact ISO 29148:2018 list of nine individual characteristics. Secondary sources differ, and "Conforming", "Traceable", and "Appropriate" appear in some summaries. The primary text is paywalled.
- Full Volere snow-card attribute list. The page shows it only as an image. From memory, and not verified: Req #, Req Type (template section), Event/BUC #, Description, Rationale, Originator, Fit Criterion, Customer Satisfaction (1–5), Customer Dissatisfaction (1–5), Priority, Conflicts, Supporting Materials, History.
- Full BABOK 50-technique list (Chapter 10) was not retrieved.

---

## 2. Completeness checklists and taxonomies

### Takeaway
Completeness is achieved by sweeping several orthogonal checklists, not by open-ended asking. The sweeps:
- Volere's 27 sections as a topic coverage map.
- ISO 25010 quality characteristics for NFRs.
- Event × state (event-response tables) for behavior.
- Per-entity CRUD and lifecycle.
- Per-user-class analysis.
- Explicit error and exception handling.

### Cited Findings
- ISO/IEC 25010 product quality characteristics (the current edition has 9 per the source page; only 4 were visible): **Functional suitability** (completeness, correctness, appropriateness); **Performance efficiency** (time behaviour, resource utilization, capacity); **Compatibility** (co-existence, interoperability); **Interaction capability** (appropriateness recognizability, learnability, operability, user error protection, user engagement, inclusivity, user assistance, self-descriptiveness). — [iso25000.com](https://iso25000.com/en/iso-25000-standards/iso-25010)
- **Event-response tables** (Wiegers) list each event, the system state when it occurs, and the response, because the same event can yield different responses in different states. Treat the table as a decision table so every event × state combination is covered, and add exception conditions. — [Wiegers, When Use Cases Aren't Enough](https://modernanalyst.com/Resources/Articles/tabid/115/ID/2931/When-Use-Cases-Arent-Enough.aspx); [Modeling System Events](https://modernanalyst.com/Resources/Articles/tabid/115/ID/2932/Modeling-System-Events.aspx)
- Converting a state table into a state-transition diagram exposed **two missing requirements** where certain state-action combinations had no defined outcome. — [Wiegers, Modeling System States (Medium)](https://medium.com/swlh/modeling-system-states-state-transition-diagrams-and-state-tables-d37fe908ff23)
- Wiegers recommends analysis models (data flow, state-transition, dialog maps), prototypes, and early conceptual test cases to expose gaps. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Wiegers' SRS inspection checklist includes items such as these. — [Inspection checklist (cvut copy)](https://cw.fel.cvut.cz/b181/_media/courses/a4m33sep/materialy/requirements/requirements_review_checklist.doc); [uv.mx copy](https://www.uv.mx/rrojano/MIS/desarrollo1/material/reqts_checklist.pdf)
  - "Do requirements address system and user response to error conditions and exceptions?"
  - "Does the specification include all of the known customer or system needs?"
  - "Does the document contain all the information called out in the outline?"
- Volere sections serve as explicit completeness slots for often-forgotten areas: Business rules (5b), Assumptions (5c), Data dictionary (7b), Open issues (18), New problems / effects on the current environment (20), Migration (22), Risks (23), Documentation and training (25), Waiting room (26). — [Volere](https://www.volere.org/templates/volere-requirements-specification-template/)

### Inferences — Completeness sweep checklist for dreamit (encode as mandatory coverage gates)
For each gate the AI records answered, N/A (with reason), or TBD (with owner).
1. **Purpose & success:** problem, goals, measurable success metrics, and what happens if we don't build it.
2. **Stakeholders & user classes:** who uses it, who pays, who administers, who supports, and who is affected but doesn't use it. Record permissions per class.
3. **Scope:** in scope, explicitly **out of scope**, and the waiting room (later).
4. **Glossary:** every domain noun defined once and used consistently.
5. **Entities × CRUD + lifecycle:** for every noun, ask who can create, read, update, delete, archive, and restore it, what its states are, and what the valid transitions are. Build a state table and check every cell.
6. **Events × states:** an event-response table for user actions, time-triggered events, and external-system events.
7. **Edge cases per feature:**
   - empty state (no data yet)
   - first-run
   - maximum/limit values
   - zero/negative/boundary values
   - duplicate entries
   - concurrency (two users or two tabs)
   - interruption (crash or disconnect mid-operation)
   - undo
   - invalid input
   - permission denied
   - external dependency down
8. **Business rules & calculations:** formulas, validation rules, defaults, and rounding.
9. **Data:** fields, types, ranges, required/optional, retention, import/export, migration of existing data.
10. **Interfaces:** UI surfaces, APIs, files, and adjacent systems.
11. **NFR sweep (ISO 25010 + Volere 10–17):**
    - performance/capacity
    - reliability/availability/recovery
    - security (authN/Z, privacy, audit)
    - usability/accessibility/i18n
    - compatibility (platforms, browsers)
    - maintainability/observability
    - portability/install/deploy
    - compliance/legal
    - look and feel
12. **Constraints:** tech stack, budget, schedule, hosting, licenses.
13. **Assumptions & dependencies:** each one stated as falsifiable.
14. **Risks, open issues, and TBD register.**
15. **Operational:** release, backups, support, documentation, training.

### Gaps
- ISO 25010:2023 characteristics 5–9 were not retrieved. From memory, and to be verified: Reliability, Security, Maintainability, Flexibility (formerly Portability), and Safety (new in 2023).

---

## 3. Interview techniques

### Takeaway
Use structured or semi-structured interviews with prepared question banks. Ground abstract talk in concrete examples (example mapping, scenarios, "last time" stories), probe for tacit knowledge with walkthroughs and straw-man artifacts, and park unanswerable questions explicitly instead of stalling.

### Cited Findings
- BABOK interviews run on a spectrum from structured (prepared questions) to unstructured. Semi-structured interviews balance coverage against following leads. — [open-exam-prep](https://open-exam-prep.com/study-guides/ccba/babok-techniques/elicitation-analysis-techniques)
- Questioning techniques get at explicit knowledge and observation gets at tacit knowledge. "Carefully designed questions" are a key success factor. — [microTOOL](https://www.microtool.de/en/knowledge-base/requirements-elicitation/)
- **Example Mapping** (Matt Wynne, Cucumber) uses four card colors:
  - yellow = story
  - blue = rules (acceptance criteria)
  - green = examples illustrating each rule
  - red = questions nobody can answer now
  
  The session is timeboxed to about 25 minutes. Reading the shape of the map:
  - many red cards = poorly understood
  - many blue cards = too big, so slice it
  - one rule with many examples = the rule is too complex, so split it
  
  The session ends with a thumb-vote on readiness. Output: rules, examples, open questions, and split-off stories. — [Cucumber: Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/)
- Use cases capture user tasks, and functional requirements are derived from them. Event analysis complements use cases for non-user-initiated behavior (time triggers, external signals). — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html); [Wiegers, Event Analysis](https://modernanalyst.com/Resources/Articles/tabid/115/ID/6490/When-Use-Cases-Arent-Enough-Event-Analysis.aspx)
- Excitement (delighter) requirements are typically unstated, so creativity techniques are used to find them. — [microTOOL](https://www.microtool.de/en/knowledge-base/requirements-elicitation/); [Product School](https://productschool.com/blog/skills/requirements-elicitation-product-requirements-engineering)

### Inferences — Interview protocol and question bank for an LLM interviewer
**Batching rules (inferred best practice, not sourced):**
- Ask 3–5 related questions per turn, grouped under one topic heading.
- Offer a proposed default answer for each question ("If you don't care, I'll assume X"), so the PO can accept quickly.
- Prefer multiple choice or concrete options over blank-slate questions.
- Keep a visible running "red card" list of open questions rather than blocking on them.
- End every batch with a read-back of the requirements drafted from the answers.

**Question types:**
- **Context-free / process questions:**
  - Who is the client?
  - What is a successful outcome?
  - What problem does this solve?
  - What problems could it create?
  - What environment will it run in?
- **Laddering / 5 whys** (up to the goal): "Why is that important?" Repeat until you reach a business goal, which then becomes the rationale field. Ladder down with "How would you know it was done?", which produces the fit criterion.
- **Need-vs-solution separation:** when the PO states a solution ("add a dropdown"), ask "What are you trying to achieve with that?" (Wiegers' trap 1).
- **Concrete-instance / JTBD:** "Walk me through the last time you [did the job]." "When [situation], I want to [motivation], so I can [outcome]." "What do you use today, and what's annoying about it?"
- **Example mapping per feature:** "Give me an example where this works. Now one where it should be rejected. What's the rule that separates them?"
- **Event/state probes:**
  - What triggers this?
  - What if it happens while X is in state Y?
  - What happens on a schedule?
  - What do external systems send us?
- **Edge-case probes:** what if it's empty, huge, duplicated, simultaneous, interrupted, unauthorized, or offline?
- **Quantification probes for NFRs:** "How fast? Measured how? Under what load? Is that the target or the minimum acceptable?"
- **Negative scope:** "What should this explicitly NOT do?" "What might someone assume it does that it doesn't?"
- **Kano probes (functional/dysfunctional pair):** "How would you feel if the product had X?" and "…if it did not have X?"
- **Priority probe:** "If we could ship only half, which half?"

### Gaps
- No primary source was retrieved for laddering, 5 whys, JTBD, or Gause & Weinberg context-free questions. These are standard practitioner techniques, included here as inferences.
- No empirical source was found on optimal question batch size for an interviewer.

---

## 4. Requirement statement syntax and ambiguity word lists

### Takeaway
Use EARS for system requirements. It uses fixed clause order with the keywords While, When, Where, If/Then, and "shall". Use Given/When/Then for acceptance examples. Ban subjective words and replace them with measurable fit criteria.

### Cited Findings
- EARS generic syntax: "While <optional pre-condition>, when <optional trigger>, the <system name> shall <system response>". Clauses always appear in the same temporal order. The ruleset allows zero or many preconditions, zero or one trigger, exactly one system name, and one or many responses. — [Mavin, EARS](https://alistairmavin.com/ears/)
- EARS patterns:
  - **Ubiquitous:** "The <system> shall <response>"
  - **State-driven:** "While <precondition>, the <system> shall…"
  - **Event-driven:** "When <trigger>, the <system> shall…"
  - **Optional feature:** "Where <feature is included>, the <system> shall…"
  - **Unwanted behaviour:** "If <trigger>, then the <system> shall…" Example: "If an invalid credit card number is entered, then the website shall display 'please re-enter credit card details'."
  - **Complex:** combines keywords. Example: "While the aircraft is on ground, when reverse thrust is commanded, the engine control system shall enable reverse thrust."
  
  — [Mavin, EARS](https://alistairmavin.com/ears/)
- Wiegers: avoid subjective words such as minimize, maximize, rapid, user-friendly, easy, simple, robust, and efficient. Avoid "and/or" and "etc." "like the plague". Define what "support" means exactly. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Jama's adaptation of Wiegers: for "reasonable / when necessary / where appropriate", explain how to make the judgment. For "user-friendly", describe the characteristics that achieve the intended use. — [Jama: ambiguous language](https://www.jamasoftware.com/?p=9576)
- Open-ended phrases like "such as…" and "etc." leave lists unbounded. Define terms in a glossary. — [Argon Digital: weasel words](https://argondigital.com/blog/product-management/use-weasel-words)
- Planguage (Gilb, via Wiegers) is a keyword-based way to specify quality requirements quantitatively (scale, meter, goal levels). — [Wiegers, Planguage](https://modernanalyst.com/Resources/Articles/tabid/115/ID/2926/Specifying-Quality-Requirements-With-Planguage.aspx)

### Inferences — Lint rules for dreamit
- **Banned/flagged words** (auto-flag in a lint pass; each forces a quantification question):
  - fast, quick, rapid, efficient, performant
  - easy, simple, intuitive, user-friendly, seamless
  - robust, reliable, secure (unqualified), scalable, flexible
  - minimize, maximize, optimize, as much as possible
  - adequate, reasonable, appropriate, as needed, when necessary, if possible
  - etc., and/or, such as, including but not limited to
  - support, handle, manage, process (without a defined behavior)
  - some, several, many, most, usually, normally, generally
  - TBD (allowed only in the register)
- **Structure rules:**
  - Each requirement is one "shall" with one responsibility (singular).
  - Use active voice with the system as subject.
  - No pronouns with unclear referents.
  - Every NFR carries a number, a unit, and a measurement condition (fit criterion).
- **Pairing:** each functional requirement in EARS gets at least one Given/When/Then example covering the happy path, plus one per If/Then unwanted behavior.

### Gaps
- Wiegers' full "words to avoid" table (Caltech PDF) returned 404, so the full replacement table could not be reproduced.

---

## 5. Prioritization, IDs, traceability, sign-off, TBDs and assumptions

### Takeaway
Prioritize every requirement on a small, clearly defined scale (MoSCoW or 3-level), with value, cost, and risk in mind. Give stable IDs and trace each requirement upward to a goal or source and downward to stories and tests. Baseline through informed agreement. Allow TBDs only with an owner, and resolve them before construction.

### Cited Findings
- Symptom of failure: "over 90% is high priority." Fix: assign a priority to each requirement based on usage frequency, favored user classes, core business processes, and regulatory needs. Use a clearly defined three-level scale, or prioritize analytically by customer value vs. estimated cost and risk. Allocate requirements to releases. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Kano (Noriaki Kano, 1978) has three categories: **must-be/basic** (dissatisfying when absent, little gain when present), **one-dimensional/performance** (satisfaction tracks fulfillment), and **attractive/excitement** (not explicitly demanded, delights). — [Kano Model (Scribd)](https://www.scribd.com/doc/202063133/Kano-Model); [microTOOL](https://www.microtool.de/en/knowledge-base/requirements-elicitation/)
- Baselining requires real agreement: "all approvers must understand what they're approving and the cost of future changes". Rubber-stamp sign-off is a scope-creep symptom. Ask "Is this in scope?" against the documented vision for every new proposal. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Change control: a defined process with binding accept/reject decisions, impact analysis via traceability before committing, and versioning that separates drafts from baselines. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- TBDs are acceptable temporarily but must be resolved before design and construction. Unresolved TBDs mark high-risk areas. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Volere keeps Assumptions (5c), Open Issues (18), and a Waiting Room (26) for deferred requirements as first-class sections. — [Volere](https://www.volere.org/templates/volere-requirements-specification-template/)

### Inferences — Requirement record template for dreamit (snow-card-like)
```
ID: REQ-<AREA>-<NNN>        (stable; never reused or renumbered)
Type: Functional | NFR:<25010 char> | Constraint | Business rule | Data | Interface
Statement: <EARS sentence>
Rationale: <why — laddered to a goal G-n>
Source: <PO answer ref / doc / regulation>
Fit criterion / Acceptance: <measurable; Given/When/Then examples>
Priority: Must | Should | Could | Won't(this release)
Kano: Basic | Performance | Delighter   (optional)
Dependencies/Conflicts: <REQ ids>
Status: Draft | Confirmed | TBD(owner, question) | Deferred
Traces: Goal G-n → REQ → Story S-n → Test
```
- MoSCoW usage guidance: test a "Must" with "Would we cancel or delay the release without it?" A common DSDM heuristic keeps Musts at or below roughly 60% of effort. This could not be verified (the agilebusiness.org page returned 404).
- Sign-off ritual:
  1. Present the full set grouped by area, with counts per priority and the TBD list.
  2. The PO explicitly approves each section.
  3. Freeze it as baseline v1.0.
  4. After that, changes go through a change log with an impact note listing the affected REQ IDs and stories.
- The assumption register lists each assumption as a falsifiable statement, the impact if it proves false, and a validation owner.

### Gaps
- MoSCoW primary definitions and the DSDM ~60% Must guideline were not verified (source 404).
- No primary RTM standard format was retrieved.

---

## 6. Validation: reviews, inspections, and checklists

### Takeaway
Validate requirements with formal inspection by diverse perspectives (customer, developer, tester), working from a checklist that covers completeness, correctness, consistency, unambiguity, testability, traceability, and level of detail. Write conceptual tests early, since a requirement you cannot write a test for is defective.

### Cited Findings
- Hold formal inspections with diverse reviewers (analyst, customer, developer, tester), and write conceptual test cases early. Testers being unable to write tests is a symptom of ambiguous requirements. — [Wiegers, 10 Traps](https://www.cs.hmc.edu/~markk/SWE_copies/reqtraps.html)
- Wiegers' SRS inspection checklist items include:
  - all known needs included
  - all outline sections present
  - correct internal cross-references
  - consistent and appropriate level of detail
  - no conflicting or duplicate requirements
  - clear, concise, unambiguous language
  - error and exception responses specified
  - clear distinction between functions and data
  - no unnecessary implementation detail
  
  — [cvut copy](https://cw.fel.cvut.cz/b181/_media/courses/a4m33sep/materialy/requirements/requirements_review_checklist.doc); [uv.mx copy](https://www.uv.mx/rrojano/MIS/desarrollo1/material/reqts_checklist.pdf)
- The 29148 set-level checks are complete, consistent (no conflict, uniform terms), feasible, comprehensible, and validatable. — [Modern Requirements](https://www.modernrequirements.com/?p=32595)
- Example mapping readiness signals (red, blue, and green card counts) serve as a lightweight per-story validation gate. — [Cucumber](https://cucumber.io/blog/bdd/example-mapping-introduction/)
- LLMs are being studied for requirements QA against 29148 characteristics. — [arXiv 2408.10886](https://arxiv.org/pdf/2408.10886)

### Inferences — Self-review pass the AI runs before asking for sign-off
1. **Per requirement:**
   - singular?
   - EARS-conformant?
   - no banned words?
   - has a fit criterion or Given/When/Then?
   - has a rationale traced to a goal?
   - a solution disguised as a need?
   - feasible within the stated constraints?
2. **Per set:**
   - every completeness gate (§2) answered, N/A, or TBD?
   - every entity has full CRUD and lifecycle coverage?
   - every event × state cell defined?
   - every "If/Then" error path covered?
   - glossary terms used consistently?
   - no duplicates or conflicts?
   - every goal has at least one requirement, and every requirement maps to a goal (no orphans)?
   - priorities distributed (not 90% Must)?
3. **Reviewer perspectives:** the AI simulates three reviewers in sequence. The tester asks "can I write a test?" The developer asks "can I build this without asking?" The user asks "does this solve my problem?" Present the findings to the PO as questions, not silent fixes.
4. **Readiness gate:**
   - Proceed to stories only when there are zero blocking TBDs, every Must is Confirmed, and the PO has explicitly approved the baseline.
   - Non-blocking TBDs go to the register with an owner.

### Gaps
- The full verbatim Wiegers inspection checklist could not be extracted (the PDF is compressed and the .doc wasn't fetched). The items above come from search snippets of multiple course copies, which vary.
