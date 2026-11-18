# Spec: TASK-1.7 — Run every check in GitHub Actions on each push and pull request

Status: READY (approved 2026-11-17)
Task: TASK-1.7 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-064.1, REQ-064.2, REQ-064.4, TASK-1.1 Q-3 audit rule · Dream: limit-holdem-trainer

## 1. Summary
Add one GitHub Actions workflow, `.github/workflows/ci.yml`. It runs on every push to any branch and on every pull
request. It runs the existing npm scripts from TASK-1.1 (`lint`, `typecheck`, `build`, `test`, `e2e` with
Playwright and axe in Chromium and WebKit) on a pinned Node version. It also runs the two `npm audit` gates from TASK-1.1 Q-3.
Any failing check fails the run. A
static Vitest test locks the workflow's shape. Real runs on GitHub prove that a green change passes and that a
broken lint, typecheck, test, build, Chromium/WebKit e2e or audit check fails. The proof runs are designed so the
user pushes once.

## 2. Scope
- In scope:
  - `.github/workflows/ci.yml`: triggers, permissions, concurrency, Node setup from `.nvmrc` with the npm cache,
    `npm ci`, the two audit gates (`npm audit --omit=dev --audit-level=high`, `npm audit --audit-level=critical`), the five checks, Playwright browser install with a browser cache, and a Playwright report artifact
    when e2e fails.
  - `.nvmrc` pinning the Node LTS version used locally.
  - `tests/ci/workflow.test.ts`: a static test of the workflow text (triggers, commands, order, no ignored
    failures, pinned actions, Node pin).
  - `README.md`: a short "Continuous integration" section and the pinned Node version.
  - Throw-away proof branches `ci-proof/TASK-1.7/*` (local only, never merged) and their real GitHub runs as
    evidence for AC#2, AC#4 and AC#5 (see §5 "Proof procedure"). Claude also opens a draft PR to prove the
    `pull_request` trigger (Q-2).
- Not doing:
  - 10,000-hand playtest step (TASK-1.8 / E01-S08), nightly 1,000,000-hand run (E01-S17), GitHub Pages deploy
    (TASK-1.18 / E01-S18).
  - Branch protection or required status checks on `main` (a repo setting, not code).
  - Dependabot or Renovate for action/dependency updates.
  - Any change to product code, existing tests, `package.json` scripts, or the Playwright/Vite/Vitest config. If a
    check fails only on Linux, the builder stops and reports it. The fix is a follow-up decision, not silent scope
    growth.
  - Test-only failure-injection switches in the workflow (see D-1).
- Scope budget: files=4, lines=300   (ci.yml ~85, workflow.test.ts ~150, README +22, .nvmrc 1; the proof branches are not merged and are not counted)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `.nvmrc` = `22.18.0` (exact). `engines.node` stays `>=22.12.0` | yes | Story note: "pin the Node LTS version used locally". Local is `v22.18.0`. Node 22 is an LTS line | `22` (floating minor); Node 24 LTS |
| A-2 | One job and one runner. Steps run in sequence, and the first failing step stops the job (GitHub's default) | yes | Private repo with metered minutes. Billing rounds each job up to a whole minute, and parallel jobs would each repeat `npm ci` | One job per check (parallel and clearer, but about 5× the setup minutes); `if: !cancelled()` so every check runs after a failure |
| A-3 | Step order: install, Lint, Typecheck, **Build**, **Test**, Playwright setup, E2E. Build runs before Test | yes | `tests/toolchain/build.test.ts` runs `npm run build` itself, so a broken build would otherwise show up first as a Test failure. Running Build first gives each failure its own step, and the cheap checks run first | AC#1's listed order (test before build) |
| A-4 | Runner `ubuntu-24.04` (pinned, not `ubuntu-latest`) | yes | Reproducible. Playwright 1.65 supports WebKit on 24.04 | `ubuntu-latest` |
| A-5 | Actions are pinned to full commit SHAs with a version comment: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`, `actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0`, `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2` (latest releases on 2026-11-17, looked up with `gh api`) | yes | Supply-chain hardening: tags can be moved, SHAs cannot | Major tags (`@v7`) |
| A-6 | `concurrency: { group: ci-${{ github.event_name }}-${{ github.ref }}, cancel-in-progress: true }`, on every ref including `main` | yes | Saves minutes when a branch is pushed again. Including the event name keeps the push run and the pull_request run of one branch from cancelling each other. Deploy (TASK-1.18) can revisit `main` | Don't cancel on `main`; no concurrency |
| A-7 | Playwright browsers are cached in `~/.cache/ms-playwright`, keyed `playwright-${{ runner.os }}-<@playwright/test version from package-lock.json>`. Cache miss: `npx playwright install --with-deps chromium webkit`. Cache hit: `npx playwright install-deps chromium webkit` (system packages only) | yes | Skips downloading about 250 MB of browsers on most runs (cost note from the caller). System packages are not cacheable, so they are always installed | No browser cache (Playwright's own docs advise this; simpler); Playwright Docker image as job container |
| A-8 | When the E2E step fails, `playwright-report/` is uploaded as artifact `playwright-report` with `retention-days: 7` | yes | Failures can be diagnosed without re-running. The short retention limits the metered artifact storage | No artifact |
| A-9 | `timeout-minutes: 20` on the job. `permissions: contents: read` | yes | Caps runaway minutes (a local full run takes under 1 minute; CI setup adds about 2–3). Least privilege | 30 min; default token permissions |
| A-10 | The workflow test checks the YAML **text** (line and regex assertions). It adds no YAML-parser dependency | yes | No new third-party dependency, which would need approval (TASK-1.1 Q-1 precedent). The workflow is small and owned by this repo | Add `yaml` as an exact-pinned devDependency and assert on the parsed object |
| A-11 | No `paths-ignore`. Doc-only pushes (e.g. `backlog/`, `doit/`) also run the full workflow | yes | AC#1 says "a push to any branch". Skipped runs would also leave DoD#10 ("CI green on the branch") unverifiable | `paths-ignore: [backlog/**, doit/**, dreams/**]` to save minutes |
| A-12 | Workflow name `CI`, job id `checks`. Step names are exactly `Audit shipped dependencies`, `Audit all dependencies`, `Lint`, `Typecheck`, `Build`, `Test`, `E2E` | yes | The proof commands select steps by these names | — |
| A-13 | The audit gates are two **separate** steps placed right after `npm ci` and before Lint: `Audit shipped dependencies` (`npm audit --omit=dev --audit-level=high`), then `Audit all dependencies` (`npm audit --audit-level=critical`) | yes | Each step's name says which rule failed (AC#5 attribution). Each takes a few seconds, so a dependency problem fails fast and cheaply. Downside: while an advisory is open, the later checks don't report | Put the audits last, after E2E (other checks still report, but an audit failure costs a full run); one combined audit step |
| A-14 | AC#5 is proven with **two** audit proof branches. `audit-shipped` adds runtime dependency `lodash@4.17.20` (high, GHSA-35jh-r3h4-6jhm and others; probed locally: `npm audit --omit=dev --audit-level=high` exits 1). `audit-all` adds devDependency `minimist@1.2.5` (critical, GHSA-xvch-5gv4-984h; probed: the `--omit=dev` audit exits 0 and `--audit-level=critical` exits 1) | yes | With sequential steps, one branch can only show the first audit failing. The second branch proves the all-dependencies critical gate on its own. It costs about 1 extra billed minute because the run stops at the audit step | One `audit` branch (proves only the shipped gate) |

## 3. Current system
- TASK-1.1 is merged on `main` (`ffaf227`). `package.json:9-18` defines `build`, `test` (`vitest run --coverage`),
  `e2e` (`playwright test`), `lint` (`eslint . --max-warnings 0 && prettier --check .`), `typecheck`
  (`tsc -p tsconfig.json`). `engines.node` is `>=22.12.0` (`package.json:6-8`). `package-lock.json` is committed, so
  `npm ci` works.
- `playwright.config.ts`: projects `chromium` and `webkit`, `forbidOnly: !!process.env.CI` (GitHub sets `CI=true`,
  so a stray `test.only` fails in CI), `retries: 0`, reporters `list` + `html` (`open: 'never'`, written to
  `playwright-report/`). `webServer` runs `npm run build && npm run preview -- --port 4173 --strictPort`.
- `e2e/smoke.spec.ts` already has the switch `E2E_INJECT_A11Y_VIOLATION=1` (TASK-1.1 SPEC-20). It injects a
  critical axe violation in **both** browsers at once, so it cannot prove a single-browser failure (AC#4). This
  spec does not use it in the workflow.
- `tests/toolchain/build.test.ts` runs the real `npm run build`, so a build break also fails `npm test` (reason for A-3).
- The Vitest `include` is `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`), so `tests/ci/workflow.test.ts` is picked
  up without config changes. Coverage only measures `src/**`, so the new test does not change the thresholds.
  `tsconfig.json` includes `tests`, so the new test is type-checked and linted.
- Prettier (`npm run lint`) also checks `*.yml`, so `ci.yml` must be Prettier-formatted (run `npm run format`).
  `.nvmrc` has no Prettier parser and is skipped.
- No `.github/` folder exists. The remote is `origin` = `https://github.com/gregswhiteaz/texaslimittrainer`
  (private, default branch `main`, Actions enabled, all actions allowed, SHA pinning not required). It has no
  workflow runs yet.
- Local toolchain: Node `v22.18.0`, npm `10.9.3`, `gh 2.104.0` (authenticated). `act`, `actionlint` and Docker are
  **not** installed, so a workflow cannot be executed locally. Local timings: `npm test` 4.6 s, `npm run e2e`
  3.0 s, `npm run lint` 0.8 s.
- `.claude/settings.json` denies `git push`. Only the user can push.
- Existing code to reuse:
  - npm scripts in `package.json` → the workflow calls them unchanged.
  - `e2e/support/axe.ts::expectNoSeriousAxeViolations` → used by the e2e proof spec.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Prove AC#2, AC#4 and AC#5 with real runs from **proof branches pushed in a single `git push`**. The builder creates eight local branches `ci-proof/TASK-1.7/{lint,typecheck,build,test,e2e-chromium,e2e-webkit,audit-shipped,audit-all}`, each one commit on top of the final task commit that breaks exactly one check. Each branch is first rehearsed locally (the first failing step must be the expected one). The user then pushes `doit/TASK-1.7` plus the eight proof branches in one command (9 refs → 9 runs, about 30 billed minutes in total), and later deletes the remote proof branches with one command. The workflow has no injection switch. After the push, Claude opens a draft PR with `gh pr create --draft` (Q-2) to prove the `pull_request` trigger. | (b) `workflow_dispatch` input that injects failures: puts a test-only switch into production CI, and it **cannot run before merge** because GitHub only offers `workflow_dispatch` for workflows already on the default branch; (c) six or seven separate user pushes, one per case: more user effort for the same runs; (d) local `act`/`actionlint` only: not installed, needs Docker, and a local run does not prove GitHub's behaviour; (e) static workflow test only: proves nothing about real failure reporting | Real evidence on GitHub, one user action, no test hooks in CI, and the proof code never reaches `main` | yes | user (Q-1, Q-2) |
| D-2 | CI enforces the TASK-1.1 Q-3 audit rule: `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical` both must exit 0 (AC#5, added to the task) | Leave audits out of CI | Keeps the project's dependency policy enforced on every push. Accepted downside: a newly published advisory turns unrelated pushes red until the dependencies are updated | yes | user (Q-3) |
| D-3 | Workflow file `.github/workflows/ci.yml`, triggers `push` and `pull_request` with **no filters** (all branches and tags) | branch filters | AC#1: "a push to any branch or a pull request" | no | n/a |

## 5. Design

### Files to create / modify
- `.github/workflows/ci.yml` — the CI workflow (create)
- `.nvmrc` — Node version pin, single line `22.18.0` (create)
- `tests/ci/workflow.test.ts` — static checks of the workflow and the Node pin (create)
- `README.md` — "Continuous integration" section; setup line names the pinned Node version (modify)

(4 paths on `doit/TASK-1.7`. The proof branches add files only on their own unmerged branches.)

### Components, interfaces and data

**`.github/workflows/ci.yml`** (exact content, formatted by Prettier; comments allowed)
```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.event_name }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    name: Lint, typecheck, build, test and e2e
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - name: Check out
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - name: Set up Node from .nvmrc
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .nvmrc
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Audit shipped dependencies
        run: npm audit --omit=dev --audit-level=high
      - name: Audit all dependencies
        run: npm audit --audit-level=critical
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npm run typecheck
      - name: Build
        run: npm run build
      - name: Test
        run: npm test
      - name: Read Playwright version
        id: playwright-version
        run: echo "version=$(node -p "require('./package-lock.json').packages['node_modules/@playwright/test'].version")" >> "$GITHUB_OUTPUT"
      - name: Cache Playwright browsers
        id: playwright-cache
        uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium webkit
      - name: Install Playwright system dependencies
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps chromium webkit
      - name: E2E
        id: e2e
        run: npm run e2e
      - name: Upload Playwright report
        if: failure() && steps.e2e.outcome == 'failure'
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```
If Prettier reflows a line (e.g. wraps the long `run:` of "Read Playwright version" into a folded scalar), keep
Prettier's output. The static test then has to match the formatted file, and the builder should choose
formatting that keeps each `run: npm …` on one line. Invariants:
- Every `run:` step uses the default `bash -e` shell. There is no `continue-on-error`, no `|| true` and no `set +e`
  anywhere, so a non-zero exit from any check fails its step, then the job, then the run (REQ-064.2).
- The only `if:` conditions are the three shown above. None of them is on a check step.

**`.nvmrc`**: `22.18.0` followed by a newline.

**`tests/ci/workflow.test.ts`** (Vitest; `node:fs` + `node:path` with `REPO_ROOT` from `tests/support/sandbox.ts`).
It reads `.github/workflows/ci.yml`, `.nvmrc` and `package.json` as text/JSON. `describe('CI workflow', …)`
contains these tests (names exact):
1. `triggers on every push and every pull request without branch or path filters`: the text contains the block
   `on:\n  push:\n  pull_request:\n`, and no line matches
   `/^\s*(branches|branches-ignore|paths|paths-ignore|tags|tags-ignore|types):/m`.
2. `runs install, audits, lint, typecheck, build, test and e2e in that order`: the `run:` values that start with
   `npm `, collected in file order with `/^\s+run: (npm .+)$/gm`, equal exactly
   `['npm ci', 'npm audit --omit=dev --audit-level=high', 'npm audit --audit-level=critical', 'npm run lint', 'npm run typecheck', 'npm run build', 'npm test', 'npm run e2e']`.
3. `never ignores a failing check`: the text contains none of `continue-on-error`, `|| true`, `set +e`. The
   trimmed `if:` lines, in order, equal exactly
   `["if: steps.playwright-cache.outputs.cache-hit != 'true'", "if: steps.playwright-cache.outputs.cache-hit == 'true'", "if: failure() && steps.e2e.outcome == 'failure'"]`.
4. `installs Chromium and WebKit for the Playwright and axe tests`: the text contains
   `run: npx playwright install --with-deps chromium webkit` and `run: npx playwright install-deps chromium webkit`.
5. `uses the Node version pinned in .nvmrc with the npm cache`: the text contains `node-version-file: .nvmrc` and
   `cache: npm`. `.nvmrc` trimmed matches `/^(\d+)\.(\d+)\.(\d+)$/` with an even major (an LTS line), and is
   `>=` `22.12.0` (the `engines.node` lower bound in `package.json`, parsed from `>=X.Y.Z`), compared numerically
   per component.
6. `pins every action to a full commit SHA`: every line matching `/^\s*(-\s+)?uses: /` matches
   `/^\s*(-\s+)?uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/`, and there is at least one such line.
7. `has read-only token permissions, a job timeout and the named check steps`: the text contains
   `permissions:\n  contents: read`, `timeout-minutes: 20`, `runs-on: ubuntu-24.04`, and the lines
   `- name: Lint`, `- name: Typecheck`, `- name: Build`, `- name: Test`, `- name: E2E`.
8. `runs each audit gate as its own named step`: the text contains
   `- name: Audit shipped dependencies\n        run: npm audit --omit=dev --audit-level=high\n` and
   `- name: Audit all dependencies\n        run: npm audit --audit-level=critical\n` (step name directly followed by its
   command).

**`README.md`**: the Setup line becomes "Requires Node.js 22.18.0 (pinned in `.nvmrc`; `nvm use` picks it up).
Any 22.12+ works." Add a section `## Continuous integration`. It says that `.github/workflows/ci.yml` runs on every
push and pull request: `npm ci`, then the two audit gates (shipped dependencies: no high or critical advisory;
all dependencies: no critical advisory), then lint, typecheck, build, test and e2e (Chromium and WebKit, with axe), on
Ubuntu with the Node version from `.nvmrc`. Any failing check fails the run, and on an e2e failure the Playwright
report is attached as the `playwright-report` artifact (7 days). It also gives the local equivalent:
`npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e`.

### Rules and algorithms

**Proof procedure (D-1)**. The builder runs it after the build gate is green on `doit/TASK-1.7`; it is never
committed to `doit/TASK-1.7`.
1. Let `BASE` = `git rev-parse doit/TASK-1.7` (the final task commit). For each case below, create a branch
   `ci-proof/TASK-1.7/<case>` at `BASE` in a worktree under the scratchpad
   (`git worktree add <scratch>/<case> -b ci-proof/TASK-1.7/<case> BASE`), symlink `node_modules` from the project
   root, write the change, run `npx prettier --write <changed files>`, and commit with message
   `ci-proof(TASK-1.7): <case> — deliberately failing, do not merge`.
2. Cases (only the listed change; the expected first failing workflow step is in brackets):
   - `lint` [Lint]: add `src/ui/ci-proof-lint.ts` =
     `export function ciProofLint(): void {\n  debugger;\n}\n` (ESLint `no-debugger`).
   - `typecheck` [Typecheck]: add `src/ui/ci-proof-typecheck.ts` = `export const ciProofTypecheck: number = 'x';\n`.
     (It must pass lint: rerun `npm run lint` in the worktree. If a lint rule fires, use
     `export function ciProofTypecheck(): number {\n  return 'x';\n}\n` instead.)
   - `build` [Build]: in `vite.config.ts`, change `plugins: [react()]` to
     `plugins: [react(), { name: 'ci-proof-break-build', apply: 'build', buildStart() { throw new Error('ci-proof: deliberate build failure'); } }]`
     (Prettier-formatted). `apply: 'build'` keeps Vitest (serve mode) unaffected, so lint and typecheck pass and
     only `vite build` fails.
   - `test` [Test]: add `tests/unit/ci-proof.test.ts` =
     `import { expect, test } from 'vitest';\n\ntest('ci proof: a deliberately failing unit test', () => {\n  expect(1 + 1).toBe(3);\n});\n`.
   - `e2e-chromium` [E2E] and `e2e-webkit` [E2E]: add `e2e/ci-proof.spec.ts` with `TARGET` = `'chromium'` or
     `'webkit'`:
     ```ts
     import { expect, test } from '@playwright/test';
     import { expectNoSeriousAxeViolations } from './support/axe';

     const TARGET = 'chromium';
     const PIXEL_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

     test.beforeEach(({ browserName }) => {
       test.skip(browserName !== TARGET, `ci proof targets ${TARGET} only`);
     });

     test('ci proof: a failing Playwright assertion', async ({ page }) => {
       await page.goto('/');
       await expect(page).toHaveTitle('ci proof: not the real title', { timeout: 2_000 });
     });

     test('ci proof: a failing axe scan', async ({ page }) => {
       await page.setContent(
         `<html lang="en"><head><title>Axe probe</title></head><body><main><h1>Probe</h1><img src="${PIXEL_GIF}"></main></body></html>`,
       );
       await expectNoSeriousAxeViolations(page);
     });
     ```
     Expected Playwright summary: `2 failed` (both `[<TARGET>] › e2e/ci-proof.spec.ts`), `2 skipped`, `10 passed`.
   - `audit-shipped` [Audit shipped dependencies]: `npm install --save-exact lodash@4.17.20` (changes `package.json`
     `dependencies` and `package-lock.json`). Nothing imports it.
   - `audit-all` [Audit all dependencies]: `npm install --save-exact --save-dev minimist@1.2.5` (changes
     `package.json` `devDependencies` and `package-lock.json`). Nothing imports it.
   For both audit cases, run the install in the worktree **without** the `node_modules` symlink (or with
   `--package-lock-only`) so the project's real `node_modules` is not modified.
3. Local rehearsal: in each worktree run
   `npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e`. Record which command exits
   non-zero first. It must be the bracketed one, and every earlier command must exit 0. Then remove the worktree
   (`git worktree remove`) and keep the branch.
4. Hand-off: the builder writes this exact command for the user into `doit/TASK-1.7/changes.md`:
   `git push origin doit/TASK-1.7 ci-proof/TASK-1.7/lint ci-proof/TASK-1.7/typecheck ci-proof/TASK-1.7/build ci-proof/TASK-1.7/test ci-proof/TASK-1.7/e2e-chromium ci-proof/TASK-1.7/e2e-webkit ci-proof/TASK-1.7/audit-shipped ci-proof/TASK-1.7/audit-all`
   One push creates one `push` event per branch, so 9 runs start.
4a. Right after the user's push, Claude opens the draft PR (Q-2):
   `gh pr create -R gregswhiteaz/texaslimittrainer --draft --base main --head doit/TASK-1.7 --title "TASK-1.7: Run every check in GitHub Actions on each push and pull request" --body "<summary; ends with the attribution line>"`.
   This starts the `pull_request` run (SPEC-09).
5. After the Judge has recorded the run URLs, the user removes the remote proof branches with
   `git push origin --delete ci-proof/TASK-1.7/lint ci-proof/TASK-1.7/typecheck ci-proof/TASK-1.7/build ci-proof/TASK-1.7/test ci-proof/TASK-1.7/e2e-chromium ci-proof/TASK-1.7/e2e-webkit ci-proof/TASK-1.7/audit-shipped ci-proof/TASK-1.7/audit-all`
   (deleting a branch triggers no `push` run), and the builder deletes the local ones with `git branch -D`. The
   run history stays on GitHub as evidence.

**Run lookup used by the verifications** (`R=gregswhiteaz/texaslimittrainer`, `B` = branch, `EV` = `push` unless stated):
```sh
id=$(gh run list -R "$R" -w ci.yml -b "$B" -e "${EV:-push}" -c "$(git rev-parse "$B")" -L 1 --json databaseId -q '.[0].databaseId')
gh run watch "$id" -R "$R" --exit-status >/dev/null || true     # wait until completed
gh run view "$id" -R "$R" --json conclusion,jobs -q '[.conclusion] + [.jobs[].steps[] | select(.conclusion == "failure") | .name] | join(",")'
```
Output is `<run conclusion>[,<failed step names>]`. Example: a lint proof prints `failure,Lint`, and a green run
prints `success`.

### Error handling and configuration
- A non-zero exit from any `run:` step fails it. Later steps are skipped, except `Upload Playwright report`, which
  runs only when `E2E` failed. The job and the run conclude `failure`.
- `npm ci` fails if `package-lock.json` is out of sync. That counts as a failed run, as intended.
- Cache miss or cache service outage: `actions/cache` warns and continues. The miss branch then installs browsers
  with system dependencies, so e2e still runs.
- Timeout (20 min) → the run concludes `failure` (job `cancelled`/timed out). Concurrency cancellation → `cancelled`
  (not success).

## 6. Behaviour specification

### SPEC-01: The workflow triggers on every push and pull request, with no filters
- Verifies: AC#1, DoD#1
- Behaviour: Given `.github/workflows/ci.yml`, When it is read, Then its `on:` block is exactly `push:` and `pull_request:` with no branch, tag, path or type filters
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > triggers on every push and every pull request without branch or path filters`

### SPEC-02: The workflow runs every check, in order
- Verifies: AC#1, AC#5, DoD#1
- Behaviour: Given the workflow, When its `npm` commands are listed in file order, Then they are exactly `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm audit --audit-level=critical`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run e2e`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > runs install, audits, lint, typecheck, build, test and e2e in that order`

### SPEC-03: E2E runs in Chromium and WebKit
- Verifies: AC#1, AC#4, DoD#1
- Behaviour: Given the workflow, When Playwright is prepared, Then it installs exactly `chromium webkit` (with system dependencies on a cache miss, system dependencies only on a hit) before `npm run e2e`, which runs both Playwright projects
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > installs Chromium and WebKit for the Playwright and axe tests`

### SPEC-04: No failing check is ignored
- Verifies: AC#2, AC#4, AC#5, DoD#1
- Behaviour: Given the workflow, When it is read, Then it has no `continue-on-error`, `|| true` or `set +e`, and its only `if:` conditions are the two Playwright-cache conditions and the report upload condition `failure() && steps.e2e.outcome == 'failure'`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > never ignores a failing check`

### SPEC-05: Node is pinned to the local LTS version, and npm is cached
- Verifies: AC#1, DoD#1
- Behaviour: Given `.nvmrc` = `22.18.0`, When the workflow sets up Node, Then it uses `node-version-file: .nvmrc` with `cache: npm`, and `.nvmrc` is an exact even-major version `>= 22.12.0`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > uses the Node version pinned in .nvmrc with the npm cache`

### SPEC-06: Actions are pinned to commit SHAs
- Verifies: AC#1
- Behaviour: Given the workflow, When its `uses:` lines are read, Then each is `owner/repo@<40-hex SHA> # vX.Y.Z`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > pins every action to a full commit SHA`

### SPEC-07: Least-privilege token, bounded runtime, named check steps
- Verifies: AC#1
- Behaviour: Given the workflow, When it is read, Then it has `permissions: contents: read`, `timeout-minutes: 20`, `runs-on: ubuntu-24.04` and steps named `Lint`, `Typecheck`, `Build`, `Test`, `E2E`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > has read-only token permissions, a job timeout and the named check steps`

### SPEC-08: A green push is reported as successful, and every check ran
- Verifies: AC#1, AC#3, DoD#10
- Behaviour: Given the user has pushed `doit/TASK-1.7` (with no proof changes), When its push run completes, Then the run conclusion is `success`, and the steps `Audit shipped dependencies`, `Audit all dependencies`, `Lint`, `Typecheck`, `Build`, `Test`, `E2E` each concluded `success`
- Verification: command `B=doit/TASK-1.7` + run lookup (§5), then `gh run view "$id" -R "$R" --json conclusion,jobs -q '[.conclusion] + [.jobs[].steps[] | select(.name | test("^(Audit shipped dependencies|Audit all dependencies|Lint|Typecheck|Build|Test|E2E)$")) | "\(.name)=\(.conclusion)"] | join(",")'` → exactly `success,Audit shipped dependencies=success,Audit all dependencies=success,Lint=success,Typecheck=success,Build=success,Test=success,E2E=success`

### SPEC-09: A pull request triggers the workflow and passes
- Verifies: AC#1, AC#3, AC#5
- Behaviour: Given the draft pull request Claude opened from `doit/TASK-1.7` to `main` (§5 step 4a), When its `pull_request` run completes, Then a run with event `pull_request` exists for that head commit, and its conclusion is `success`
- Verification: command `B=doit/TASK-1.7 EV=pull_request` + run lookup (§5) → `success`; and `gh pr view doit/TASK-1.7 -R "$R" --json isDraft,baseRefName -q '"\(.isDraft),\(.baseRefName)"'` → `true,main`

### SPEC-10: A lint failure fails the run at the Lint step
- Verifies: AC#2
- Behaviour: Given branch `ci-proof/TASK-1.7/lint` (adds a `debugger;` statement), When its push run completes, Then the run conclusion is `failure` and the only failed step is `Lint`
- Verification: command `B=ci-proof/TASK-1.7/lint` + run lookup (§5) → `failure,Lint`

### SPEC-11: A type error fails the run at the Typecheck step
- Verifies: AC#2
- Behaviour: Given branch `ci-proof/TASK-1.7/typecheck` (assigns a string to a `number`), When its push run completes, Then the conclusion is `failure` and the only failed step is `Typecheck`
- Verification: command `B=ci-proof/TASK-1.7/typecheck` + run lookup (§5) → `failure,Typecheck`

### SPEC-12: A build failure fails the run at the Build step
- Verifies: AC#2
- Behaviour: Given branch `ci-proof/TASK-1.7/build` (a build-only Vite plugin throws `ci-proof: deliberate build failure`), When its push run completes, Then the conclusion is `failure` and the only failed step is `Build`
- Verification: command `B=ci-proof/TASK-1.7/build` + run lookup (§5) → `failure,Build`; and `gh run view "$id" -R "$R" --log-failed` contains `ci-proof: deliberate build failure`

### SPEC-13: A failing unit test fails the run at the Test step
- Verifies: AC#2
- Behaviour: Given branch `ci-proof/TASK-1.7/test` (one test expects `1 + 1` to be `3`), When its push run completes, Then the conclusion is `failure` and the only failed step is `Test`
- Verification: command `B=ci-proof/TASK-1.7/test` + run lookup (§5) → `failure,Test`; and `--log-failed` output contains `ci proof: a deliberately failing unit test`

### SPEC-14: A Playwright or axe failure only in Chromium fails the run
- Verifies: AC#4
- Behaviour: Given branch `ci-proof/TASK-1.7/e2e-chromium` (a failing assertion test and a failing axe test, both skipped in WebKit), When its push run completes, Then the conclusion is `failure`, the only failed step is `E2E`, Playwright reports `2 failed`, `2 skipped`, `10 passed`, and both failures are `[chromium] › e2e/ci-proof.spec.ts`, with one of them containing `image-alt (critical)`
- Verification: command `B=ci-proof/TASK-1.7/e2e-chromium` + run lookup (§5) → `failure,E2E`; and `gh run view "$id" -R "$R" --log-failed` contains `2 failed`, `2 skipped`, `10 passed`, `[chromium] › e2e/ci-proof.spec.ts` and `image-alt (critical)`

### SPEC-15: A Playwright or axe failure only in WebKit fails the run
- Verifies: AC#4
- Behaviour: Same as SPEC-14 with `TARGET = 'webkit'`: Then the conclusion is `failure`, the only failed step is `E2E`, `2 failed`, `2 skipped`, `10 passed`, and both failures are `[webkit] › e2e/ci-proof.spec.ts`
- Verification: command `B=ci-proof/TASK-1.7/e2e-webkit` + run lookup (§5) → `failure,E2E`; and `--log-failed` contains `2 failed`, `2 skipped`, `10 passed`, `[webkit] › e2e/ci-proof.spec.ts` and `image-alt (critical)`

### SPEC-16: Each proof branch fails first at its intended check locally (rehearsal)
- Verifies: AC#2, AC#4, AC#5
- Behaviour: Given each proof worktree, When the §5 step 3 command sequence (audits first, then lint, typecheck, build, test, e2e) runs, Then the first non-zero command is the one bracketed in §5 step 2, and every command before it exits 0. Each proof branch differs from `doit/TASK-1.7` only by the files listed for its case
- Verification: command for each case `git diff --name-only doit/TASK-1.7 ci-proof/TASK-1.7/<case>` → exactly the listed file(s); rehearsal results (case → first failing command) recorded in `doit/TASK-1.7/changes.md`

### SPEC-17: A failed e2e run attaches the Playwright report
- Verifies: AC#4
- Behaviour: Given the `e2e-chromium` proof run, When it completes, Then it has an artifact named `playwright-report`; the green run (SPEC-08) has none
- Verification: command `gh api "repos/$R/actions/runs/$id/artifacts" -q '[.artifacts[].name] | join(",")'` → `playwright-report` for the e2e-chromium run, and empty for the SPEC-08 run

### SPEC-21: The audit gates run as their own named steps
- Verifies: AC#5, DoD#1
- Behaviour: Given the workflow, When it is read, Then step `Audit shipped dependencies` runs exactly `npm audit --omit=dev --audit-level=high` and step `Audit all dependencies` runs exactly `npm audit --audit-level=critical`
- Verification: acceptance `tests/ci/workflow.test.ts::CI workflow > runs each audit gate as its own named step`

### SPEC-22: A shipped dependency with a high advisory fails the run at the shipped audit
- Verifies: AC#5
- Behaviour: Given branch `ci-proof/TASK-1.7/audit-shipped` (adds runtime dependency `lodash@4.17.20`), When its push run completes, Then the conclusion is `failure`, the only failed step is `Audit shipped dependencies`, and its log names `lodash` with `Severity: high`
- Verification: command `B=ci-proof/TASK-1.7/audit-shipped` + run lookup (§5) → `failure,Audit shipped dependencies`; and `gh run view "$id" -R "$R" --log-failed` contains `lodash` and `Severity: high`

### SPEC-23: A dev dependency with a critical advisory fails the run at the all-dependencies audit
- Verifies: AC#5
- Behaviour: Given branch `ci-proof/TASK-1.7/audit-all` (adds devDependency `minimist@1.2.5`), When its push run completes, Then the conclusion is `failure`, `Audit shipped dependencies` concluded `success`, the only failed step is `Audit all dependencies`, and its log names `minimist` with `Severity: critical`
- Verification: command `B=ci-proof/TASK-1.7/audit-all` + run lookup (§5) → `failure,Audit all dependencies`; and `--log-failed` contains `minimist` and `Severity: critical`

### SPEC-24: The task branch's dependencies pass both audit gates
- Verifies: AC#5, AC#3
- Behaviour: Given `doit/TASK-1.7` (no dependency changes), When both audit commands run locally, Then each exits 0
- Verification: command `npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical` → exit 0

### SPEC-18: Local checks pass on the task branch
- Verifies: DoD#2, DoD#4, DoD#5, DoD#1
- Behaviour: Given `doit/TASK-1.7`, When `npm run lint`, `npm run typecheck`, `npm test` and `npm run e2e` run, Then each exits 0 (coverage thresholds and the headless boundary are unchanged and still enforced), and `npm test` lists the 8 `CI workflow` tests as passed
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e` → exit 0; `npm test` output contains `tests/ci/workflow.test.ts` with 8 passed tests

### SPEC-19: Proof code never reaches the task branch
- Verifies: AC#3, DoD#10
- Behaviour: Given the finished task, When `doit/TASK-1.7` is compared with `main`, Then the changed product/config paths are exactly `.github/workflows/ci.yml`, `.nvmrc`, `tests/ci/workflow.test.ts`, `README.md` (plus `doit/` and `backlog/` workflow files), and no path contains `ci-proof`
- Verification: command `git diff --name-only main...doit/TASK-1.7 -- . ':!doit' ':!backlog'` → exactly those 4 paths

### SPEC-20: Definition-of-Done items that do not apply to this story
- Verifies: DoD#3, DoD#6, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: DoD#3 (golden-spot suite) is N/A until E07-S14. DoD#6 (10,000-hand playtest) is N/A: no engine, bot or advice code is touched, and the runner does not exist yet. DoD#7 (screen flow in Playwright and axe) is N/A: no screen is added; the existing smoke and axe tests still run in CI (SPEC-08). DoD#8 (no new network requests from the app) is N/A for app behaviour: no app code changes, and the existing same-origin e2e test keeps running in CI. DoD#9 (strategy content) is N/A. DoD#11 (story documentation) is done by the doit Documentor step. DoD#12 (offline) is N/A until E13-S07
- Verification: manual Judge confirms `git diff --name-only main...doit/TASK-1.7 -- src e2e` is empty and that the Documentor published the story document

## 7. Edge cases
- Push and PR for the same branch: two runs (event `push` and `pull_request`). The concurrency group includes the
  event name, so they do not cancel each other (A-6). The duplicate minutes are accepted because AC#1 requires both.
- Rapid re-push to a branch: the older in-progress run is `cancelled` (A-6), and the newest run decides. No SPEC is
  needed; this is GitHub's concurrency behaviour.
- Tag pushes: they also run CI (no filters, D-3). Harmless.
- Branch deletion (proof cleanup): GitHub emits no `push` workflow run for deletions, so no runs and no cost.
- Pull requests from forks: N/A. The repo is private and single-owner, and `contents: read` keeps a fork's run
  harmless anyway.
- Cache miss or outage for npm or Playwright: handled by the miss branch (§5 Error handling). The first proof
  push starts 9 runs at once, so they will all miss the cache, which is expected.
- Linux-only differences (case-sensitive paths, `/tmp`, symlinks in `tests/support/sandbox.ts`): if the green run
  fails for an environment reason, the builder reports it and does not patch product code (Scope, "Not doing").
- New advisory published against an existing dependency: every later push fails at an audit step until the
  dependency is updated. Accepted by Q-3 (D-2). The step name shows which rule fired.
- npm registry audit endpoint unavailable: `npm audit` exits non-zero and the run fails at an audit step. Re-run
  the job. This is accepted because a gate that can't check should not pass silently.
- Workflow YAML syntax error: GitHub reports a failed run with no jobs. The static test runs locally first, and
  the builder also checks `gh workflow view ci.yml -R "$R"` after the push.

## 8. Security considerations
- Trust boundary: the workflow runs repository code on GitHub-hosted runners. The `GITHUB_TOKEN` is limited to
  `contents: read` (SPEC-07). No secrets are used or added.
- Supply chain: third-party actions are pinned to commit SHAs (SPEC-06). Dependencies are installed with `npm ci`
  from the committed lockfile. No new npm dependencies.
- Injection: no `${{ github.event.* }}` user-controlled values (branch names, PR titles) are interpolated into
  `run:` scripts. Only `steps.*.outputs` and `runner.os` are used in expressions.
- Artifacts: the Playwright report contains only test output for the public start page. No secrets, and kept 7 days.
- Fork PRs: N/A (private repo). `pull_request` (not `pull_request_target`) is used, so a fork could never get
  write tokens.
- Dependency advisories: both Q-3 audit gates run on every push and PR (SPEC-21 to SPEC-24). The proof
  branches add known-vulnerable packages only on unmerged throwaway branches, never imported, and the branches
  are deleted afterwards (§5 step 5). Their lockfiles are never installed into the project's real `node_modules`.

## 9. Non-functional
- Cost: a green run should bill ≤ 6 minutes on `ubuntu-24.04` (setup ~1–2 min, browser install ~1–1.5 min on a
  miss, checks ~1–2 min). Measured as the run duration in `gh run view "$id" --json startedAt,updatedAt` for
  SPEC-08, and recorded in `changes.md`. The whole proof (9 push runs + 1 PR run) should bill about 35 minutes. The audit and early-failure runs stop within about 1–2 minutes.
- Runtime ceiling: 20-minute job timeout.
- Reproducibility: exact Node version, pinned runner image label, lockfile install, SHA-pinned actions.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e` (local mirror of the workflow). On GitHub the workflow runs on push or PR; Claude cannot push, so the user runs the push command from §5 step 4
- Pre-requisite (once per machine): `npm ci && npx playwright install chromium webkit`
- New tests (path → SPEC ids):
  - `tests/ci/workflow.test.ts` → SPEC-01 to SPEC-07, SPEC-21
  - Proof branches (not merged) → SPEC-10 to SPEC-17, SPEC-22, SPEC-23
- End-to-end scenario for the Judge (as the project owner would):
  1. `npm test` passes, including the 8 `CI workflow` tests (SPEC-18), and both audits exit 0 (SPEC-24).
  2. Confirm the user has run the §5 step 4 push. For each of the 9 branches, run the §5 run lookup and compare
     with SPEC-08, SPEC-10 to SPEC-15, SPEC-22 and SPEC-23 (`success…` for `doit/TASK-1.7`; `failure,<Step>` for each proof branch).
  3. Open the green run in the browser (`gh run view "$id" -R "$R" --web`) and check that the five check steps ran.
  4. Check the draft PR and its `pull_request` run (SPEC-09), and the artifact (SPEC-17).
  5. Record all 10 run URLs in the verdict.

## 11. Open questions
None. Q-1 (proof approach), Q-2 (Claude opens the draft PR) and Q-3 (audit gates in CI, AC#5) are resolved; see D-1, D-2 and `qa.md`.

## 12. Clarifications log
See `doit/TASK-1.7/qa.md`.
