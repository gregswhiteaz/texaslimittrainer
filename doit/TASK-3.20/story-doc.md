# TASK-3.20: Make card tests catch painted colour and logo regressions in CI

Status: Done · Completed: 2026-11-19 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: n/a (follow-up from TASK-3.5 review, doc-20) · Branch: doit/TASK-3.20

Run mode: doit AUTOPILOT. The one question (Q-1) was auto-accepted with its recommended answer.

## What was asked
TASK-3.5's review found that card e2e checks missed regressions that only macOS pixel snapshots caught. The four ACs:
1. A rank/suit path painted a different colour from its group fails the colour check on Linux CI.
2. A hidden (opacity 0, display none) or failed-to-load card-back logo fails the logo check.
3. Linux visual baselines are generated in the Playwright Docker image and the card visual tests run on Linux in CI.
4. A glyph whose real bounding box leaves the card fails a test, or the glyph-fit unit test is removed because e2e geometry covers it.

Spec: doit/TASK-3.20/spec.md.

## Assumptions made without asking — please review
The spec's Assumptions table is reproduced here. state.json counts 0 assumptions, because the spec's A-1..A-8 were written into the spec and not logged separately.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Linux visual tests live in a new `.github/workflows/visual.yml`, not in `ci.yml` | yes | Additive. Leaves the locked `ci.yml` tests alone (single job, exact npm command list, no `run: npx playwright`). `container:` would apply to the whole `checks` job | Move to a second job in `ci.yml` and edit two locked tests |
| A-2 | `Visual` is not a required status check; a red run is visible but does not block merges | yes | Needs admin branch-protection changes and edits to a locked README test | Add the context to branch protection (follow-up) |
| A-3 | Visual spec runs on darwin, or on linux when `TLH_VISUAL_LINUX=1`. Skips elsewhere, including the main e2e step | yes | Linux baselines are only valid inside the Docker image | Detect `PLAYWRIGHT_BROWSERS_PATH` instead |
| A-4 | Docker tag `v<version>-noble` read from `package-lock.json` at run time (validated as semver) | yes | A Playwright bump uses the matching image automatically | Hard-code the tag plus a test that it equals the lockfile |
| A-5 | "Leaves the card" = path bbox widened by half stroke-width, through getScreenCTM, outside the 60x84 svg rect by more than 0.01 px | yes | Engine-independent; round caps reach half a stroke | Use the inner 1 px border; pixel scan |
| A-6 | Glyph-fit unit test removed; `RANK_GLYPHS[].width` data stays | yes | AC#4 allows removal; the e2e check covers it in both engines | Keep it and add an SVG path parser |
| A-7 | "Logo visible" = `checkVisibility({opacityProperty, visibilityProperty})`, non-empty client rect, href decodes to 512x512 | yes | No new dependency, works in both engines | Screenshot and count non-black pixels |
| A-8 | Linux baselines bootstrapped by the workflow's first failing run on the branch, downloaded from its artifact and committed unchanged | yes | No local Docker; `workflow_dispatch` only works once the file is on `main` | Regenerate after merge via dispatch |

## Clarifications and decisions
- Q-1 (autopilot, auto-accepted): may the story change TASK-3.5's locked tests? Answer: yes, as the ACs require; only the glyph-fit unit test that AC#4 permits removing was removed. The unlock was recorded with `doit.py unlock TASK-3.5`.
- D-1: baselines generated and compared in the official Playwright image, run as `--user 1001`.
- D-2: each check is a pure error-list helper (`colourMismatches`, `logoProblems`, `partsOutsideCard`). Real tests assert `[]`. Mutation tests break the DOM and assert the exact list.
- D-3: on failure or `update: true`, the workflow uploads `card-visual-baselines` and `card-visual-report`, kept 7 days.

## What was built
- `e2e/cards.spec.ts`: colour check reads the computed paint of every rank/suit `<path>`. The logo test also asserts `logoProblems` is empty. New `partsOutsideCard` containment test. In-suite mutation tests prove each check fails on its named regression.
- `e2e/cards.visual.spec.ts`: runs on macOS, or on Linux when `TLH_VISUAL_LINUX=1`.
- `.github/workflows/visual.yml` (new): `Visual` workflow in `mcr.microsoft.com/playwright:v<lockfile version>-noble`, SHA-pinned actions, `contents: read`, triggers push, pull_request and workflow_dispatch (`update` input).
- `e2e/cards.visual.spec.ts-snapshots/*-linux.png` (6 files): Linux baselines from Visual run 44668550588 (the bootstrap failure), copied unchanged.
- `tests/ci/visual-workflow.test.ts` (new): structure of `visual.yml` and presence of the 6 baselines.
- `tests/ui/card-art.test.ts`: removed `glyphs fit the card` and its unused imports.
- `README.md`: "Card visual baselines" subsection.
- `.claude/settings.json`: the user's autopilot permissions change (push/merge allowed; force-push, delete, rebase, hard reset denied), made before this run and committed with this story. Not part of the feature.
- No source under `src/`, `ci.yml` or darwin baselines changed. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | two/four-colour e2e plus colour mutation test (expects exactly `2c rankStroke`, `2d suitFill`) | pass | judge round 1; scratch-worktree source mutants (rank stroke `#00ff00`, suit fill `#00ff00`) fail the tests |
| SPEC-02 | AC#2 | logo decode test plus logo mutation test | pass | source mutant `opacity={0}` fails both |
| SPEC-03 | AC#4 | containment test plus mutation test | pass | source mutant shifting the suit group +8px fails containment |
| SPEC-04 | AC#3 | `tests/ci/visual-workflow.test.ts` | pass | in `npm test` |
| SPEC-05 | AC#3 | latest Visual run on the branch succeeds with "2 passed", no skipped | pass | Visual run 44668758859 on f3f959e: success, "2 passed (7.9s)"; branch CI run 44668758850 green |
| SPEC-06 | AC#3 | `npm run e2e -- e2e/cards.spec.ts e2e/cards.visual.spec.ts` on macOS | pass | 20 passed, darwin baselines unchanged |

- `npm test`: 89 files, 330 passed, 5 skipped (pre-existing skips). Lint and typecheck clean.
- Bootstrap: Visual run 44668550588 failed as designed (6x "A snapshot doesn't exist ... writing actual"), and its artifact supplied the baselines. The judge confirmed they are byte-identical (sha1) and visually checked two.
- Build gate: 2 runs, final PASS, 388 changed lines. The first local `npm test` failed only on the missing Linux baselines test and wrote `blocked.json` (needs-linux-baselines), which cleared once the baselines were committed.
- Judge: round 1 PASS, no failed items, all ACs proven, test-integrity clean.

## Review
Round 1 gave 0 blocking findings. Security review had no findings: the version is validated before use, `update` only appears in `if:` expressions, there are no secrets, permissions are `contents: read`, and the triggers are push and pull_request only.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `partsOutsideCard` reports nothing for a part with no `<path>`. The colour check still flags that case (`<card> paths`).
- NIT: "card back shows the decoded TLH logo" decodes the logo inline, then `logoProblems` decodes it again.
- NIT: `visual-workflow.test.ts` does not assert the artifact names, paths or the `failure() || inputs.update` condition.

## How to try it
- `npm run e2e -- e2e/cards.spec.ts e2e/cards.visual.spec.ts` (macOS runs the visual snapshots against the darwin baselines)
- `npm test`
- Regenerate Linux baselines: `gh workflow run visual.yml --ref <branch> -f update=true`, download the `card-visual-baselines` artifact and commit the PNGs. This works once `visual.yml` is on `main` or the branch.

## Run metrics
Questions 1 (auto-accepted) · assumptions logged 0 (8 in spec) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 388.

## Known limitations and follow-ups
- Visual is not a required check. Making it required is blocked until branch protection can be changed (TASK-1.33), so a red Visual run does not stop a merge.
- A Playwright bump that changes rendering turns Visual red until baselines are regenerated with `gh workflow run visual.yml --ref <branch> -f update=true`.
- The container image tag is not pinned to a digest.
- Follow-ups, one line each:
  - e2e/cards.spec.ts: make `partsOutsideCard` report a part that has no `<path>` (`paths.length === 0 || paths.some(...)`).
  - e2e/cards.spec.ts: drop the inline logo decode in "card back shows the decoded TLH logo" in favour of `logoProblems`.
  - tests/ci/visual-workflow.test.ts: assert the artifact names `card-visual-baselines` and `card-visual-report`, their paths and the `failure() || inputs.update` condition.
  - Add `Visual` to the required status checks once branch protection can be changed (owner: TASK-1.33).
  - Document, or automate, the regenerate-baselines step for Playwright bump PRs (for example a note in the Dependabot PR checklist).
  - visual.yml: pin the Playwright image by digest, with a test or Dependabot rule to keep it current.

## Lessons for the factory (proposals — not applied)
- The bootstrap needed a deliberately failing CI run plus a manual artifact copy, and the local `npm test` failed in between. Proposal: when a spec has a baseline-from-CI assumption, let the build gate treat the missing-baseline test as an expected `blocked` state instead of a failure.
- The spec's assumptions (A-1..A-8) were not counted in state.json (`assumptions: 0`). Proposal: have the spec stage register each A-n with `doit.py` so run metrics match.
