# Spec: TASK-3.23 — Tighten the card visual checks and keep the Linux baselines current

Status: READY (approved 2026-11-20)
Task: TASK-3.23 · Parent/epic: TASK-3 (Play hands at the table) · Requirements: n/a (follow-up from the TASK-3.20 review, doc-38) · Dream: limit-holdem-trainer

## 1. Summary
Two test gaps and one doc gap left by TASK-3.20. `partsOutsideCard` silently passes a rank or suit part that has
no `<path>` (an empty `paths.some(...)` is `false`), so a glyph that vanished from a card is never reported. And the README does not say what to do when a Dependabot `@playwright/test` bump changes rendering and turns
`Visual` red. This chore closes the containment gap (with a mutation test) and adds a README paragraph. The
duplicate inline logo decode stays (old AC#2 dropped by the user, Q-1).

## 2. Scope
- In scope:
  - `e2e/cards.spec.ts` (locked by TASK-3.20 and TASK-3.5): in `partsOutsideCard`, report a part that has no
    `<path>`; add one mutation test for that. Strengthen-only cross-story edit (D-1).
  - `README.md`: one paragraph in `### Card visual baselines` for Playwright bumps (D-2).
  - `tests/ci/visual-workflow.test.ts` (not locked): one `it(...)` that checks that paragraph.
- Not doing:
  - Removing the duplicate inline logo decode in `card back shows the decoded TLH logo` (old AC#2 and old
    SPEC-02). Dropped by the user in Q-1: the permission safeguard refused deleting assertions from the locked
    test, and the duplicate check is harmless. The SPEC-02 id is retired, not reused.
  - A workflow that regenerates or commits baselines automatically (AC#2 "or" branch not taken, D-2).
  - Asserting the artifact-upload steps, pinning the Playwright image by digest (removed from the task
    2026-11-20 under the user's value filter).
  - Any change to `src/`, `e2e/cards.visual.spec.ts`, `.github/workflows/visual.yml`, the baselines, or
    branch protection.
  - Changing any other assertion in `e2e/cards.spec.ts`.
  - New dependencies.
- Scope budget: files=3, lines=40

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A part is reported when its `[data-part]` group has zero `<path>` descendants, which also covers a part group that is missing entirely (the selector `[data-part="<part>"] path` then matches nothing). The report string stays `"<card> <part>"`. | yes | One `paths.length === 0 \|\|` guard covers both cases with the existing output format, so the existing tests' expected arrays are unchanged | Separate `"<card> <part> missing"` message (changes the output format for no gain) |
| A-2 | The AC#1 mutation test removes every `<path>` from `Qs` rank and removes the whole `3h` suit group in `faces-two-colour`, and expects exactly `['3h suit', 'Qs rank']` (sorted). | yes | Exercises both "no path" shapes, and the other 50 cards still prove there are no false positives. Mirrors the existing `containment check fails when a glyph leaves the card` test | Only one mutant |
| A-3 | The README check goes in `tests/ci/visual-workflow.test.ts` (unit kind, not locked), next to the other `visual.yml` checks. | yes | That file already owns the Visual workflow checks. The README checks for Dependabot and branch protection follow the same `section` regex pattern (`tests/ci/dependabot.acceptance.test.ts:36-42`) | New acceptance file for one assertion |

## 3. Current system
- `e2e/cards.spec.ts:100-133` `partsOutsideCard(page, section)`: for each `svg[data-card]` in the section, for
  `rank` and `suit`, collects `[data-part="<part>"] path` (`:106`) and reports the part if `paths.some(...)`
  finds a path whose stroke-padded, CTM-mapped bbox corner lies outside the card (`:107-127`). With zero paths
  `some` returns `false`, so the part is not reported. This is the AC#1 gap.
- `e2e/cards.spec.ts:233-254`: `rank and suit paths stay inside the card` and the mutation test
  `containment check fails when a glyph leaves the card` (expects `['Ac rank', 'Kh suit']`).
- `e2e/cards.spec.ts:79-98` `logoProblems(page)`: decodes the logo `href` via `new Image()` + `decode()` and
  pushes `'not decoded'` unless natural size is 512 x 512. It also checks visibility and a non-empty box.
- `e2e/cards.spec.ts:186-212` `card back shows the decoded TLH logo`: `:204-210` decode the same image inline
  and assert `{ width: 512, height: 512 }`, then `:211` asserts `logoProblems(page)` is `[]`. `:204-210` is a
  duplicate of `logoProblems`' 512 x 512 check (`:91-95`); it stays (Q-1).
- Locks: `doit/TASK-3.20/state.json` `locked_tests` has `e2e/cards.spec.ts` (sha `7b6580ce…`, matches the file
  today). `doit/TASK-3.5/state.json` also locks it. TASK-3.20 handled the same situation with
  `doit.py unlock TASK-3.5 … --reason` (`doit/TASK-3.20/qa.md:5-7`).
- `README.md:63-81` `### Card visual baselines`: documents the `Visual` workflow, the image tag following
  `package-lock.json`, and the regeneration steps (`gh workflow run visual.yml --ref <branch> -f update=true`,
  `gh run download <run-id> -n card-visual-baselines -D <dir>`, copy, commit). It does not mention Dependabot
  or Playwright bumps. `README.md:83-91` `### Dependency updates` says npm minor/patch bumps arrive as one grouped
  Dependabot PR every Monday (`.github/dependabot.yml`).
- `.github/workflows/visual.yml:3-10`: `workflow_dispatch` with boolean `update`. `:41`: the container image
  follows the lockfile Playwright version, so a bump changes the browsers.
- `tests/ci/visual-workflow.test.ts`: Vitest structural checks of `visual.yml`, `REPO_ROOT` from
  `tests/support/sandbox`. Not locked (only `e2e/cards.spec.ts` is in TASK-3.20 `locked_tests`).
- Tests: `npm test` (Vitest + coverage), `npm run e2e` (Playwright, Chromium and WebKit, `playwright.config.ts`).
- Existing code to reuse:
  - `e2e/cards.spec.ts:100` `partsOutsideCard` → add the guard in place; no new helper.
  - `e2e/cards.spec.ts:241-254` → shape of the new mutation test (`openCardGallery`, `page.evaluate` mutate,
    sorted compare).
  - `tests/ci/dependabot.acceptance.test.ts:36-42` → README section regex pattern.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Edit the locked `e2e/cards.spec.ts` (owners TASK-3.20 and TASK-3.5), strengthen-only: one guard added and one test added. No existing assertion is removed or loosened. The orchestrator records `doit.py unlock TASK-3.20 e2e/cards.spec.ts --reason "TASK-3.23 AC#1 strengthen-only"` (and the same for TASK-3.5). | Copy `partsOutsideCard` into a new file (duplicates the helper and leaves the gap in the locked one) | AC#1 names code that only exists in this file | yes | task AC#1 (autopilot, recommended); scope narrowed by Q-1 |
| D-2 | AC#2 is met by a README paragraph, not a new workflow | Workflow that regenerates and commits baselines on Dependabot PRs (needs `contents: write` and a bot commit, which goes beyond this chore) | Smallest change. The manual dispatch already exists and works on any branch | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/cards.spec.ts` — guard in `partsOutsideCard`, new mutation test (SPEC-01).
- `README.md` — Playwright-bump paragraph in `### Card visual baselines` (SPEC-03).
- `tests/ci/visual-workflow.test.ts` — README check (SPEC-03).

### Components, interfaces and data
- `partsOutsideCard(page, section): Promise<string[]>` — signature and output format unchanged. New rule: a part
  with `paths.length === 0` is reported as `"<card> <part>"`.
- New test `containment check reports a part with no path` in `e2e/cards.spec.ts`:
  1. `openCardGallery(page, bundle)`.
  2. In `[data-testid="faces-two-colour"]`: remove every `path` under `[data-card="Qs"] [data-part="rank"]`, and
     remove the element `[data-card="3h"] [data-part="suit"]`.
  3. `expect((await partsOutsideCard(page, 'faces-two-colour')).sort()).toEqual(['3h suit', 'Qs rank'])`.
- `card back shows the decoded TLH logo`: unchanged (Q-1).
- README paragraph (append after step 3 of `### Card visual baselines`, before `### Dependency updates`). Content
  (wording may be tuned for the house style, but these facts and the exact command must be present):
  > When a Dependabot pull request bumps `@playwright/test`, the `Visual` job uses the matching new Docker
  > image. If the new browsers render the cards differently, `Visual` goes red on that pull request. Regenerate
  > the baselines on the Dependabot branch with
  > `gh workflow run visual.yml --ref <branch> -f update=true`, then follow steps 2 and 3 and push the new
  > `*-linux.png` files to that branch before merging.
- New `it('README explains regenerating baselines after a Playwright bump')` in `tests/ci/visual-workflow.test.ts`:
  reads `README.md`, extracts `/^### Card visual baselines\n([\s\S]*?)(?=^#)/m`, and asserts the section
  contains `Dependabot`, `@playwright/test`, and `gh workflow run visual.yml --ref <branch> -f update=true`.

### Rules and algorithms
- Containment: `leaves = paths.length === 0 || paths.some(<existing corner check>)`. Examples: `Qs` rank with
  0 paths → `'Qs rank'`; `3h` with no suit group → `'3h suit'`; an unmodified card → nothing (existing test).

### Error handling and configuration
- N/A: test and docs only. No new config.

## 6. Behaviour specification

### SPEC-01: containment check reports a part with no path
- Verifies: AC#1
- Behaviour: Given the two-colour gallery with every `<path>` removed from `Qs` rank and the `3h` suit group
  removed, When `partsOutsideCard(page, 'faces-two-colour')` runs, Then it returns exactly
  `['3h suit', 'Qs rank']` (sorted). The unmodified gallery still returns `[]` for both sections, and the
  existing transform mutants still return `['Ac rank', 'Kh suit']`. The builder shows the new test failing on
  the pre-change `partsOutsideCard` (returns `[]`) and records that output in the build log.
- Verification: acceptance `e2e/cards.spec.ts::containment check reports a part with no path`, `e2e/cards.spec.ts::rank and suit paths stay inside the card`, `e2e/cards.spec.ts::containment check fails when a glyph leaves the card`

SPEC-02 (single logo decode) was withdrawn with old AC#2 (Q-1). The id is not reused so the build log and
changes.md references to SPEC-01 and SPEC-03 stay valid.

### SPEC-03: README explains regenerating baselines after a Playwright bump
- Verifies: AC#2
- Behaviour: Given `README.md`, When the `### Card visual baselines` section is read, Then it says that a
  Dependabot `@playwright/test` bump that changes rendering turns `Visual` red, and gives the command
  `gh workflow run visual.yml --ref <branch> -f update=true` to regenerate on that branch, followed by the
  existing download/copy/commit steps.
- Verification: unit `tests/ci/visual-workflow.test.ts::README explains regenerating baselines after a Playwright bump`

## 7. Edge cases
- Part with zero paths, or a missing part group: SPEC-01.
- Part with some paths inside and none outside: existing `rank and suit paths stay inside the card`.
- Logo missing, hidden, or not decodable: existing `logo check fails…` test (unchanged).
- Concurrency, permissions, input validation: N/A (test-only and docs).

## 8. Security considerations
- No new trust boundary, dependency, secret or permission. The README points to the existing `workflow_dispatch`
  (read-only token, `.github/workflows/visual.yml:12-13`). Randomness: N/A.

## 9. Non-functional
- `e2e/cards.spec.ts` gains one test (one gallery load, about 1 s per browser). No other target.

## 10. Test plan
- Test command: `npm test && npm run e2e`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e -- e2e/cards.spec.ts`
- New tests (path → SPEC ids):
  - `e2e/cards.spec.ts::containment check reports a part with no path` → SPEC-01
  - `tests/ci/visual-workflow.test.ts::README explains regenerating baselines after a Playwright bump` → SPEC-03
- Judge scenario: run `npm run e2e -- e2e/cards.spec.ts` (all pass in Chromium and WebKit). Temporarily revert
  the `paths.length === 0` guard and confirm the new test fails with `[]` received, then restore. Read the README section as a maintainer facing a red `Visual` on a Dependabot PR.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-3.23/qa.md`. D-1 (strengthen-only edit of the locked `e2e/cards.spec.ts`) is required by AC#1 and was
accepted under autopilot as the recommended option. Q-1 (2026-11-20, user): old AC#2 (remove the duplicate inline
logo decode) dropped because the permission safeguard refused deleting assertions from the locked test; the
duplicate check stays. Old AC#3 became AC#2. SPEC-02 withdrawn.
