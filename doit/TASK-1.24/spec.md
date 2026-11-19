# Spec: TASK-1.24 — Protect main and keep CI action pins current

Status: READY (approved 2026-11-18)
Task: TASK-1.24 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-1.7, doc-6) · Dream: limit-holdem-trainer

## 1. Summary
Three repository-hygiene items left over from TASK-1.7. A `.github/dependabot.yml` makes Dependabot open
weekly update pull requests for the SHA-pinned GitHub Actions and for npm (AC#1). A new
dry-run-by-default script, `tools/git/prune-merged-branches.js`, lists and (with `--apply`) deletes the
`doit/*` branches already merged into `main`, locally and on `origin`, and the README tells the user how to
run it (AC#2). The README documents, but this task does not apply, the branch protection for `main` that
makes GitHub block merging a pull request whose CI check has not passed: the exact `gh api -X PUT` command
(required check = the CI job name, `strict: false`, no required reviews, `enforce_admins: false` so direct
pushes keep working), the verify command, and the note that GitHub answers HTTP 403 on this private
free-plan repo until it is public or on GitHub Pro (AC#3, Q-1 option (a)). A test pins the documented
required-check name to the job name in `ci.yml`.

## 2. Scope
- In scope:
  - `.github/dependabot.yml` (new): weekly `github-actions` and `npm` updates.
  - `tools/git/prune-merged-branches.js` (new): dry-run-by-default cleanup of merged `doit/*` branches.
  - Tests: `tests/ci/dependabot.acceptance.test.ts`, `tests/ci/branch-protection.acceptance.test.ts`,
    `tests/git/prune-merged-branches.acceptance.test.ts`, `tests/git/prune-merged-branches.test.ts`.
  - `README.md`: "Dependency updates", "Branch protection" and "Branch cleanup" subsections under
    "Continuous integration".
- Not doing:
  - Changing `.github/workflows/ci.yml` or its locked test `tests/ci/workflow.test.ts` (no `branches-ignore`
    for Dependabot push branches, no new triggers).
  - Applying branch protection or rulesets (from Claude or as part of this task), changing repository
    visibility or plan. Per Q-1 the setting is applied later, once the repo is public or on GitHub Pro; that
    is a follow-up task (see scope concerns), not this task's work.
  - Running `--apply` against the real `origin` from Claude or from any test. Tests only ever use a temporary
    bare repository as `origin`.
  - Cleaning branches other than `doit/*` (e.g. `ci-proof/*`, none exist on `origin` today), or detecting
    squash-merged branches (the project merges by fast-forward or merge commit, `git log --merges main` shows
    `58738dd Merge branch 'doit/TASK-1.7'`).
  - Auto-merge of Dependabot pull requests, Dependabot security-update settings, any new npm dependency, any
    npm script.
- Scope budget: files=7, lines=470   (dependabot.yml ~25, prune script ~130, prune acceptance test ~160,
  prune unit test ~45, dependabot test ~35, branch-protection test ~35, README ~40)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Dependabot schedule: `interval: weekly`, `day: monday`, `time: "06:00"`, `timezone: Etc/UTC`, for both ecosystems, `directory: "/"` | yes | AC#1 says weekly; a fixed slot makes the first run predictable for verification | Default day (Monday) without time |
| A-2 | Grouping: one group `actions` with all GitHub Actions updates; one group `npm-minor-patch` for npm `minor` and `patch` updates; npm major updates open one PR each. `open-pull-requests-limit` left at the default (5) | yes | ~25 pinned npm packages would otherwise open up to 5 separate PRs a week; majors stay separate because they are the ones that break | No groups; one group for everything |
| A-3 | No `ignore` rules and no `versioning-strategy` override (Dependabot keeps exact pins exact, matching `package.json`) | yes | Smallest config; the repo already pins exact versions (`package.json:21-48`) | Ignore majors for `@types/node` to stay on Node 22 types |
| A-4 | Cleanup script lives at `tools/git/prune-merged-branches.js` (plain ESM JS with JSDoc, `checkJs`), run as `node tools/git/prune-merged-branches.js [--apply]`; no npm script | yes | Matches the `tools/ci/*.js` style run with `node` (`README.md:39-44`, `tools/ci/retry.js:1-9`); it is not a CI step, so not under `tools/ci` | `npm run branches:prune`; put it in `tools/ci` |
| A-5 | The script first runs `git fetch --prune origin` (in both modes) so its remote list reflects `origin` now | yes | Stale remote-tracking refs would otherwise list branches already deleted, or miss new ones | Use whatever remote-tracking refs exist |
| A-6 | "Merged" means: local `refs/heads/doit/*` reachable from local `main`; remote `refs/remotes/origin/doit/*` reachable from `origin/main` (`git for-each-ref --merged=<base>`). The currently checked-out branch is never deleted locally and is reported as skipped | yes | A branch merged locally but not yet pushed to `origin/main` keeps its remote copy, so nothing on `origin` is lost before `main` is pushed | Use `main` for both |
| A-7 | Local deletion uses `git branch -D <name>` for names already proven merged into `main`; remote deletion is one `git push origin --delete <names...>` | yes | `git branch -d` checks against HEAD or the upstream, not `main`, so it refuses merged branches when run from another branch | `git branch -d` and require running on `main` |
| A-8 | The README's `gh api` commands use gh's `repos/{owner}/{repo}` placeholders (resolved from the current clone) rather than the hard-coded repo slug, and pass the body as a heredoc to `--input -` in a `sh` fenced block | yes | Works unchanged if the repo is renamed or transferred; a `sh` block is not reformatted by Prettier, so the JSON text the test pins stays stable | Hard-code `gregswhiteaz/texaslimittrainer`; use `-f`/`-F` flags |

## 3. Current system
- Repo: strict TypeScript + Vite + React; Node 22.18.0 (`.nvmrc`). Tests are Vitest 5.1, including
  `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`), 30 s timeout (`vite.config.ts:10`); coverage only measures
  `src/**` (`vite.config.ts:13`), so a `tools/` script does not affect thresholds. `tsc` type-checks JS in
  `tools` and `tests` (`tsconfig.json:18-21`). Lint = ESLint + `prettier --check .` (`package.json:17`); YAML
  and Markdown outside `.prettierignore` are format-checked, so `.github/dependabot.yml` and `README.md` must be
  Prettier-clean.
- CI: `.github/workflows/ci.yml` runs on every push and pull request (`ci.yml:3-5`), job name
  `Lint, typecheck, build, test and e2e` (`ci.yml:15-16`, job id `checks`, the only job), actions pinned to SHAs with a `# vX.Y.Z` comment
  (`ci.yml:22,24,48,61`) — the format Dependabot updates in place. No `.github/dependabot.yml` exists
  (orchestrator-verified).
- `tests/ci/workflow.test.ts` asserts on YAML text without a YAML parser (doc-6 A-10; `workflow.test.ts:6`);
  the Dependabot test follows the same rule.
- `tools/ci/retry.js` and `tools/ci/apt-lock.js` show the house style for node scripts: header comment with
  usage, `parseArgs` from `node:util`, a `UsageError` class, exported pure helpers, and
  `pathToFileURL(process.argv[1])` main guard (`tools/ci/retry.js:1-17`). Tests spawn the script with
  `process.execPath` and import its exported helpers (`tests/ci/retry.test.ts:9-10,36-38`,
  `tests/ci/apt-lock.test.ts:7-12`).
- Branches: 26 local `doit/*` branches, all merged into `main` except the current one (`git branch --no-merged main` is empty apart from uncommitted work); 25 `origin/doit/*`,
  all merged into `origin/main` (`git branch -r --merged origin/main`). Workflow: the user merges locally and
  runs `git push origin main`; Claude cannot push (orchestrator-verified).
- GitHub: `gregswhiteaz/texaslimittrainer` is private on the free plan; `gh api
  repos/{owner}/{repo}/branches/main/protection` returns HTTP 403 "Upgrade to GitHub Pro or make this
  repository public to enable this feature." (orchestrator-verified). The viewer is ADMIN. For a GitHub
  Actions job, the status-check context GitHub reports (and that branch protection must require) is the
  job's `name:`, here `Lint, typecheck, build, test and e2e`.
- README: "Continuous integration" section at `README.md:29`, before "Speed targets" (`README.md:52`); the
  three new subsections go at its end.
- Existing code to reuse:
  - `tests/support/sandbox.ts:15` → `REPO_ROOT` for locating the script and config files.
  - `tools/ci/retry.js:1-17` → structure (usage header, `parseArgs`, `UsageError`, exported helpers, main guard).
  - `tests/ci/retry.test.ts:36-45` → pattern for spawning a node script and collecting stdout/stderr.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | AC#2 is delivered as a dry-run-by-default script plus a README step, not README prose alone | README-only `git` one-liners | Deleting ~50 branches by hand-pasted pipelines is error-prone; a script can be tested against a throwaway repo and defaults to deleting nothing | no | n/a |
| D-2 | AC#3 is met by documenting the branch-protection command, verify command and the 403 limitation in the README now; the user applies it once the repo is public or on GitHub Pro (follow-up task). The documented rule requires check `Lint, typecheck, build, test and e2e`, `strict: false`, no required reviews, `enforce_admins: false` | (b) make the repo public; (c) GitHub Pro; (d) local pre-push hook | GitHub refuses the setting on a private free-plan repo (403); `enforce_admins: false` keeps the user's direct `git push origin main` workflow | yes | Q-1 |

## 5. Design

### Files to create / modify
- `.github/dependabot.yml` — new; Dependabot version-update config.
- `tools/git/prune-merged-branches.js` — new; cleanup script.
- `tests/ci/dependabot.acceptance.test.ts` — new; static checks of `dependabot.yml` and README (SPEC-01, SPEC-02).
- `tests/ci/branch-protection.acceptance.test.ts` — new; static checks of the README "Branch protection"
  subsection against `ci.yml` (SPEC-03).
- `tests/git/prune-merged-branches.acceptance.test.ts` — new; runs the script in temporary repositories
  (SPEC-04..SPEC-08, SPEC-09).
- `tests/git/prune-merged-branches.test.ts` — new; unit tests of argument parsing and output formatting (SPEC-08).
- `README.md` — modified; three subsections (SPEC-02, SPEC-03, SPEC-09).

### Components, interfaces and data
`.github/dependabot.yml` (exact content up to Prettier formatting):
```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: '06:00'
      timezone: Etc/UTC
    groups:
      actions:
        patterns: ['*']
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: '06:00'
      timezone: Etc/UTC
    groups:
      npm-minor-patch:
        update-types: [minor, patch]
```

`tools/git/prune-merged-branches.js`:
- CLI: `node tools/git/prune-merged-branches.js [--apply]`. Constants: remote `origin`, base `main`,
  prefix `doit/`. Runs git in `process.cwd()`.
- Exports (pure, unit-tested):
  - `parseOptions(argv: string[]): { apply: boolean }` — throws `UsageError` for any argument other than
    `--apply` (including positionals).
  - `formatPlan(plan: { apply: boolean, local: string[], remote: string[], skipped: string[] }): string` —
    the report text below.
- Git calls (all via `spawnSync('git', args)` with an argument array, never a shell):
  1. `git rev-parse --git-dir` — not a repo → exit 2.
  2. `git fetch --prune origin` — failure → exit 1.
  3. `git rev-parse --verify --quiet refs/heads/main` and `refs/remotes/origin/main` — missing → exit 1.
  4. `git symbolic-ref --quiet --short HEAD` — current branch (empty when detached).
  5. Local list: `git for-each-ref --merged=refs/heads/main --format=%(refname:short) refs/heads/doit/`,
     minus the current branch (moved to `skipped`).
  6. Remote list: `git for-each-ref --merged=refs/remotes/origin/main --format=%(refname:lstrip=3) refs/remotes/origin/doit/`.
  7. With `--apply` only: `git branch -D <name>` for each local name; then, if the remote list is not empty,
     one `git push origin --delete <names...>`.
- Lists are sorted with the default `for-each-ref` order (refname ascending).

### Rules and algorithms
Report format (stdout), dry run:
```
Dry run: nothing deleted. Re-run with --apply to delete these branches.
Local doit/* branches merged into main (2):
  doit/TASK-1.1
  doit/TASK-1.2
Remote doit/* branches on origin merged into origin/main (1):
  doit/TASK-1.1
Skipped (checked out): doit/TASK-1.24
```
- An empty list prints `  (none)` under its heading with count `(0)`.
- The `Skipped` line appears only when a merged branch was skipped.
- With `--apply` the first line is `Deleting these branches.`; after deletion the script prints
  `Deleted <n> local and <m> remote branches.`
- Worked example: `main` contains `doit/a`; `doit/b` has a commit not on `main`; `doit/c` is checked out and
  merged. Dry run lists local `doit/a` only, skips `doit/c`, and never mentions `doit/b`.

### Error handling and configuration
| Condition | stderr | Exit |
|---|---|---|
| Unknown argument | `prune-merged-branches: unknown argument <arg>. Usage: node tools/git/prune-merged-branches.js [--apply]` | 2 |
| Not inside a git repository | `prune-merged-branches: not inside a git repository` | 2 |
| `git fetch --prune origin` fails | `prune-merged-branches: could not fetch origin` + git's stderr | 1 |
| `main` or `origin/main` missing | `prune-merged-branches: missing ref <main or origin/main>` | 1 |
| A `git branch -D` or the `git push --delete` fails | `prune-merged-branches: <command> failed` + git's stderr; remaining local deletions still run, push still attempted | 1 |
Default is a dry run; nothing is deleted without `--apply`.

README additions (under "Continuous integration"):
- **Dependency updates**: Dependabot opens update PRs every Monday for the GitHub Actions pins (one grouped
  PR) and npm (one grouped minor/patch PR, majors separately); CI runs on each; the user merges them on GitHub
  and runs `git pull` before the next local merge.
- **Branch protection** (heading `### Branch protection`): one sentence saying the rule makes GitHub block
  merging a PR into `main` until the `Lint, typecheck, build, test and e2e` check has passed, while the admin
  can still push to `main` directly; then this `sh` block, verbatim:
  ```sh
  gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'JSON'
  {
    "required_status_checks": { "strict": false, "contexts": ["Lint, typecheck, build, test and e2e"] },
    "enforce_admins": false,
    "required_pull_request_reviews": null,
    "restrictions": null
  }
  JSON
  ```
  then the verify command in its own `sh` block:
  ```sh
  gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'
  ```
  with the expected output `["Lint, typecheck, build, test and e2e"]`; then a note that while the repository
  is private on the free plan both commands fail with HTTP 403 "Upgrade to GitHub Pro or make this repository
  public to enable this feature.", so the setting is not applied yet and is to be run once the repository is
  public or on GitHub Pro; and that if the CI job's `name:` in `.github/workflows/ci.yml` changes, the
  `contexts` entry must change with it.
- **Branch cleanup**: after pushing `main`, run `node tools/git/prune-merged-branches.js` to review, then
  `node tools/git/prune-merged-branches.js --apply` to delete the listed branches locally and on `origin`.

## 6. Behaviour specification

### SPEC-01: Dependabot config requests weekly updates for both ecosystems
- Verifies: AC#1
- Behaviour: Given `.github/dependabot.yml`, When it is read, Then it declares `version: 2` and exactly two
  `updates` entries, `package-ecosystem: github-actions` and `package-ecosystem: npm`, each with
  `directory: /` and `interval: weekly`, and the groups of A-2.
- Verification: acceptance `tests/ci/dependabot.acceptance.test.ts::declares weekly github-actions and npm updates`

### SPEC-02: Dependabot runs on GitHub after the push
- Verifies: AC#1
- Behaviour: Given the config is on `origin/main`, When GitHub parses it, Then the repository's Dependabot
  page (Insights > Dependency graph > Dependabot) lists both `github-actions` and `npm` with no config error,
  and after the first scheduled or manually triggered "Check for updates" any available update appears as a PR
  authored by `app/dependabot`. The README "Dependency updates" subsection exists and names both ecosystems
  and the weekly schedule.
- Verification: manual After the user's push: open `https://github.com/gregswhiteaz/texaslimittrainer/network/updates`, click "Check for updates" on each ecosystem, then `gh pr list --author app/dependabot --state all`; README part checked by acceptance `tests/ci/dependabot.acceptance.test.ts::README documents the Dependabot schedule`

### SPEC-03: README documents branch protection pinned to the CI job name
- Verifies: AC#3
- Behaviour: Given `README.md` and `.github/workflows/ci.yml`, When the test reads them, Then the README has a
  `### Branch protection` subsection under `## Continuous integration`, and that subsection (text up to the
  next `#` heading) contains: `gh api -X PUT repos/{owner}/{repo}/branches/main/protection`;
  `"contexts": ["<J>"]` where `<J>` is the job name extracted from `ci.yml` (the `name:` line directly under
  `  checks:`, which must exist and equal `Lint, typecheck, build, test and e2e`); `"strict": false`;
  `"enforce_admins": false`; `"required_pull_request_reviews": null`; the verify command
  `gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'`; and the
  strings `403`, `GitHub Pro` and `public`. The test also asserts `ci.yml` defines exactly one job, so the one
  required check covers every CI step. Renaming the CI job without updating the README fails the test.
- Verification: acceptance `tests/ci/branch-protection.acceptance.test.ts::README documents branch protection requiring the CI job`; manual Judge runs the read-only verify command `gh api repos/{owner}/{repo}/branches/main/protection` in the project root and confirms it fails with HTTP 403 and the "Upgrade to GitHub Pro or make this repository public" message, matching the README note. Applying the rule and confirming GitHub blocks a PR with failing CI is deferred to the follow-up task (it cannot be done on the private free plan)

### SPEC-04: Dry run lists merged doit branches and deletes nothing
- Verifies: AC#2
- Behaviour: Given a temporary clone whose temporary bare `origin` has `main`, `doit/a` (merged), `doit/b`
  (one commit not on `main`) and `doit/c` (merged), with all four present locally and on `origin`, and HEAD on
  `main`, When `node tools/git/prune-merged-branches.js` runs with no arguments, Then it exits 0, stdout lists
  local `doit/a`, `doit/c` and remote `doit/a`, `doit/c` in the format of §5, never mentions `doit/b`, and
  `git for-each-ref` in the clone and in the bare `origin` shows the same refs as before.
- Verification: acceptance `tests/git/prune-merged-branches.acceptance.test.ts::dry run lists merged doit branches and deletes nothing`

### SPEC-05: --apply deletes merged doit branches locally and on origin
- Verifies: AC#2
- Behaviour: Given the SPEC-04 fixture, When the script runs with `--apply`, Then it exits 0, prints
  `Deleted 2 local and 2 remote branches.`, local and `origin` refs for `doit/a` and `doit/c` are gone, and
  `main` and `doit/b` remain in both.
- Verification: acceptance `tests/git/prune-merged-branches.acceptance.test.ts::apply deletes merged doit branches locally and on origin`

### SPEC-06: The checked-out branch and not-yet-pushed merges are kept
- Verifies: AC#2
- Behaviour: Given the fixture with HEAD on merged `doit/c`, and a local-only fast-forward of `main` that
  includes `doit/b` but is not pushed, When `--apply` runs, Then local `doit/c` remains and stdout contains
  `Skipped (checked out): doit/c`; local `doit/b` is deleted (merged into local `main`) but `origin`'s
  `doit/b` remains (not merged into `origin/main`).
- Verification: acceptance `tests/git/prune-merged-branches.acceptance.test.ts::keeps the checked-out branch and branches not merged on origin`

### SPEC-07: Nothing to clean
- Verifies: AC#2
- Behaviour: Given a clone with only `main`, When the script runs (dry run or `--apply`), Then it exits 0 and
  both headings show `(0)` followed by `  (none)`; no `git push` is attempted.
- Verification: acceptance `tests/git/prune-merged-branches.acceptance.test.ts::reports none when nothing is merged`

### SPEC-08: Usage and environment errors
- Verifies: AC#2
- Behaviour: Given `parseOptions(['--force'])` or `parseOptions(['x'])`, Then it throws `UsageError`;
  `parseOptions([])` returns `{ apply: false }` and `parseOptions(['--apply'])` returns `{ apply: true }`.
  `formatPlan` produces exactly the §5 dry-run example for that input. Running the script in a non-repo temp
  directory exits 2 with `not inside a git repository`; running it where `origin` points at a missing path
  exits 1 with `could not fetch origin`; running it with unknown argument exits 2 and deletes nothing.
- Verification: unit `tests/git/prune-merged-branches.test.ts::parseOptions and formatPlan`; acceptance `tests/git/prune-merged-branches.acceptance.test.ts::fails clearly outside a repo or without origin`

### SPEC-09: README cleanup step and real-repo dry run
- Verifies: AC#2
- Behaviour: Given `README.md`, Then a "Branch cleanup" subsection contains
  `node tools/git/prune-merged-branches.js` and `node tools/git/prune-merged-branches.js --apply`. When the
  dry run is executed in this repository, Then it exits 0 and lists the merged `doit/*` branches (about 25 on
  `origin`), deleting nothing. The user then runs `--apply` and pushes nothing else.
- Verification: acceptance `tests/git/prune-merged-branches.acceptance.test.ts::README documents the cleanup step`; manual Judge runs `node tools/git/prune-merged-branches.js` in the project root (dry run only) and compares with `git branch -r --merged origin/main`; the user runs `--apply` after pushing `main`, then `git branch -r --list 'origin/doit/*'` lists only unmerged branches

## 7. Edge cases
- Empty: no merged branches → SPEC-07.
- Checked-out branch merged → SPEC-06. Detached HEAD → no branch skipped (covered by the HEAD lookup, same
  test path as SPEC-04 when HEAD is on `main`).
- Merged locally, `main` not yet pushed → SPEC-06.
- Unmerged branch → SPEC-04 (`doit/b`).
- Invalid input → SPEC-08. Not a repo / no `origin` / fetch failure → SPEC-08.
- Partial failure during `--apply` (e.g. a remote branch already deleted by someone else between fetch and
  push) → reported per §5 with exit 1; covered by the error table, not separately tested (narrow race on a
  single-user repo).
- Concurrency: N/A — single user, single process.
- Branch protection command on the private free repo → 403 documented in the README and observed by the
  Judge's read-only check (SPEC-03).
- CI job renamed later → the README's required-check name goes stale; SPEC-03's test fails until both match.

## 8. Security considerations
- Trust boundary: branch names come from git refs. They are passed to `git` as argument-array elements via
  `spawnSync` (no shell), so names cannot inject commands. All names are under `refs/heads/doit/` or
  `refs/remotes/origin/doit/`, so `main` can never be selected.
- Destructive action: deletion only with `--apply`; dry run is the default. Tests run only in `mkdtemp`
  directories with a temporary bare `origin`, set `cwd` explicitly, and scrub `GIT_DIR`, `GIT_WORK_TREE` and
  set `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1` so the user's config or hooks cannot redirect them
  to the real repo.
- Dependabot: PRs from Dependabot run CI with a read-only token (`ci.yml:7-8` `contents: read`); the workflow
  uses no secrets. Grouped updates still go through the audit gates in CI.
- Branch protection: `enforce_admins: false` (Q-1) leaves the admin able to bypass; that is the point of
  keeping the direct-push workflow. Until applied, `main` stays unprotected; the README says so. No command
  in this task writes repository settings; the Judge's check is a read-only GET.
- No new dependencies. Secrets, randomness, sensitive logs: N/A.

## 9. Non-functional
- The script's dry run on this repo (about 50 branches) finishes in under 10 s including `git fetch`
  (network-bound); measured by the Judge's manual run.
- Acceptance tests finish within the 30 s Vitest timeout each (`vite.config.ts:10`); each builds a repo with
  a handful of commits.
- Dependabot minutes: each Dependabot PR triggers two CI runs (push to its `dependabot/*` branch and
  `pull_request`), about 4 min each (doc-6 run 44220396247: 4m13s). With 2–4 PRs a week that is under 35 min
  a week of the private plan's 2,000 free minutes a month.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/git/prune-merged-branches.js` (dry run; `--apply` is run only by the user)
- New tests:
  - `tests/ci/dependabot.acceptance.test.ts` → SPEC-01, SPEC-02 (README part)
  - `tests/ci/branch-protection.acceptance.test.ts` → SPEC-03
  - `tests/git/prune-merged-branches.acceptance.test.ts` → SPEC-04, SPEC-05, SPEC-06, SPEC-07, SPEC-08, SPEC-09
  - `tests/git/prune-merged-branches.test.ts` → SPEC-08
- End-to-end scenario for the Judge: run `npm test`, `npm run lint`, `npm run typecheck`; in the project root
  run `node tools/git/prune-merged-branches.js` and confirm it lists the merged `doit/*` branches and that
  `git branch -a --list '*doit/*' | wc -l` is unchanged afterwards. Do not run `--apply`. After the user's
  push: check the Dependabot page (SPEC-02). Run the read-only `gh api repos/{owner}/{repo}/branches/main/protection`
  and confirm the 403 the README describes (SPEC-03); do not run the `-X PUT` command.

## 11. Open questions
None. Q-1 answered 2026-11-18: option (a), document now, apply later (D-2).

## 12. Clarifications log
See `doit/TASK-1.24/qa.md`.
