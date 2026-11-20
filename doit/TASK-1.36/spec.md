# Spec: TASK-1.36 — Tune Dependabot so its PRs match the runtime and peer pins

Status: READY (approved 2026-11-19)
Task: TASK-1.36 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
Dependabot's first npm run (2026-11-19, run 44461332976) proposed `@types/node` 22 → 26 although the app runs on
Node 22, and its attempt to move `typescript` 6.0.3 → 7.0.2 failed with "Error while updating peer dependency"
because `typescript-eslint` (every published version, incl. latest 8.73.0) declares the peer
`typescript: ">=4.8.4 <6.1.0"`. This task adds two `ignore` rules (semver-major for `@types/node` and for
`typescript`) and a `typescript` group so TypeScript and typescript-eslint move together in one PR, and pins
that config in the Dependabot acceptance test. It revisits TASK-1.24 assumption A-3 (no ignore rules).

## 2. Scope
- In scope:
  - `.github/dependabot.yml` npm entry: a `typescript` group, an `exclude-patterns` on `npm-minor-patch`, and an
    `ignore` list (exact text in §5).
  - New assertions for that config in `tests/ci/dependabot.acceptance.test.ts`: one appended `it(...)`, every
    existing line unchanged (D-2, Approved by Q-1).
  - One sentence in README `### Dependency updates` describing the new group and ignore rules.
- Not doing:
  - No `cooldown` key. The ETARGET in the log came from Dependabot's built-in 3-day npm cooldown
    (`npm install … --min-release-age=3`, with no `cooldown` in the job definition): the pinned
    `typescript-eslint@8.73.0` was published 2026-11-16T17:07Z, after the cutoff "before 11/16/2026, 4:54:28 AM".
    That is transient (clears 2026-11-19T17:07Z, before the next Monday run). The `cooldown` key only accepts
    `default-days` ≥ 1, so it cannot switch this off anyway.
  - No ignore rule for `typescript` minor updates (A-2); no `versioning-strategy`, `open-pull-requests-limit`,
    `allow` or label changes; the github-actions entry is untouched.
  - No dependency version changes in `package.json` / `package-lock.json`; PR #2 (the `@types/node` 26 bump) is
    not touched by the builder. Once the config is on `main`, Dependabot closes PRs that an ignore rule now
    covers; if it doesn't, the user closes PR #2 on GitHub (this is checked in TASK-1.34).
  - No change to `.nvmrc`, `engines` or CI workflows.
- Scope budget: files=3, lines=45

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `typescript` semver-major updates are ignored as well as grouped (the "typescript waits" branch of AC#2 for majors) | yes | No typescript-eslint release supports TS 7 (peer `<6.1.0`), so a TS major PR can only fail or break lint; grouping alone doesn't fix that | Group only, let major PRs fail; ignore all TS updates |
| A-2 | `typescript` minor/patch updates are not ignored; they arrive in the `typescript` group PR together with the newest typescript-eslint, and CI decides whether it is mergeable | yes | Keeps patch fixes flowing; Dependabot installs with `--force`, so a peer mismatch shows up as a red/yellow PR, not a failed job | Also ignore `version-update:semver-minor` for typescript (manual minors) |
| A-3 | The group lists only the direct dependencies `typescript` and `typescript-eslint`; `@typescript-eslint/*` are transitive and Dependabot only updates direct ones (`"allowed-updates":[{"dependency-type":"direct"…}]` in the job log) | yes | Smallest correct pattern list | Add `'@typescript-eslint/*'` |
| A-4 | Both TS packages are removed from `npm-minor-patch` with `exclude-patterns` rather than relying on group order | yes | Dependabot's multi-group assignment ("Checking specificity…" in the log) is not something we can pin by test; an explicit exclusion makes membership unambiguous and keeps the existing locked assertion text intact | Put the `typescript` group first and rely on first-match |
| A-5 | README gets one added sentence; no other doc changes | yes | README already documents the Dependabot schedule (`README.md:54-59`) and must stay accurate | Leave README for the docs stage |

## 3. Current system
- `.github/dependabot.yml:1-21` — two entries (github-actions, npm), weekly Monday 06:00 UTC; npm has one group
  `npm-minor-patch` with `update-types: [minor, patch]`, no `ignore`.
- `tests/ci/dependabot.acceptance.test.ts:1-44` — asserts on YAML text without a parser; splits entries with
  `/^ {2}- /m` (so 6-space `      - dependency-name` list items are not treated as entries) and checks
  `entries[1]` contains `'    groups:\n      npm-minor-patch:\n        update-types: [minor, patch]\n'`
  (line 33-35). Appending lines after that block keeps this assertion true. Locked by TASK-1.24.
- `package.json:6-8` engines `node >=22.18.0`; `.nvmrc` `22.18.0`; CI uses `node-version-file: .nvmrc`
  (`.github/workflows/ci.yml:22-25`). `package.json:37` `@types/node` 22.20.5, `:45-46` `typescript` 6.0.3,
  `typescript-eslint` 8.73.0.
- `node_modules/typescript-eslint/package.json` peerDependencies `typescript: ">=4.8.4 <6.1.0"` (same in
  `@typescript-eslint/eslint-plugin`); `npm view typescript-eslint@latest peerDependencies` gives the same range.
- Prettier: `.prettierrc` `singleQuote: true`, `printWidth: 100`; `npm run lint` runs `prettier --check .`, so
  the YAML must be Prettier-clean (strings starting with `@` must stay quoted).
- Tests: Vitest via `npm test`; `REPO_ROOT` from `tests/support/sandbox.ts:15`.
- Existing code to reuse:
  - `tests/ci/dependabot.acceptance.test.ts` → its `config` string and the `entries` split; the new `it` reuses
    both instead of re-reading the file.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Revisit TASK-1.24 A-3: add `ignore` for `@types/node` and `typescript` semver-major | Keep no ignores | Story AC#1/AC#2; first run proved the problem | no | n/a (task AC) |
| D-2 | AC#3 assertions go in TASK-1.24's locked `tests/ci/dependabot.acceptance.test.ts` as one appended `it(...)`; every existing line stays unchanged (cross-story locked-test edit already recorded via `doit.py unlock TASK-1.24`) | New file `tests/ci/dependabot-tuning.acceptance.test.ts` | AC#3 names that file; append-only keeps TASK-1.24's assertions intact | yes | Approved by Q-1 |

Dependabot schema facts relied on (docs-level; config keys only): `ignore[].dependency-name` +
`ignore[].update-types` with values `version-update:semver-major|minor|patch`; `groups.<name>.patterns`,
`groups.<name>.exclude-patterns`, `groups.<name>.update-types` (`major|minor|patch`); a group without
`update-types` covers all update types; ignore conditions apply to grouped and single updates alike. Whether
the live job then completes cleanly can only be seen on the next scheduled run (SPEC-04).

## 5. Design

### Files to create / modify
- `.github/dependabot.yml` — npm entry gains the `exclude-patterns` line, the `typescript` group and `ignore`
- `tests/ci/dependabot.acceptance.test.ts` — new `it` block (append-only; existing lines unchanged) — Approved by Q-1
- `README.md` — one sentence in `### Dependency updates`

### Components, interfaces and data
The npm entry's text from `    groups:` to end of file becomes exactly:

```yaml
    groups:
      npm-minor-patch:
        update-types: [minor, patch]
        exclude-patterns: [typescript, typescript-eslint]
      typescript:
        patterns: [typescript, typescript-eslint]
    ignore:
      - dependency-name: '@types/node'
        update-types: ['version-update:semver-major']
      - dependency-name: typescript
        update-types: ['version-update:semver-major']
```

The github-actions entry and both `schedule`/`directory` blocks are unchanged.

### Rules and algorithms
- `@types/node` 22.20.5 → 22.x.y: minor/patch, lands in `npm-minor-patch`. → 26.6.6: ignored.
- `typescript` 6.0.3 → 6.0.4 or 6.1.0: in the `typescript` PR with whatever typescript-eslint update exists.
  → 7.0.2: ignored.
- `typescript-eslint` 8.73.0 → 8.74.0 or 9.0.0: in the `typescript` PR (never in `npm-minor-patch`).
- Every other npm package: unchanged behaviour (minor/patch grouped, majors one PR each).

### Error handling and configuration
- README sentence (user-visible docs; exact wording is the builder's, must mention `@types/node`, `typescript`
  and `typescript-eslint`): e.g. "TypeScript and typescript-eslint are updated together in their own grouped
  pull request, and major updates of `@types/node` and `typescript` are ignored so the types stay on Node 22
  and TypeScript stays within typescript-eslint's supported range."

## 6. Behaviour specification

### SPEC-01: @types/node majors are ignored
- Verifies: AC#1, AC#3
- Behaviour: Given `.github/dependabot.yml`, When the npm entry is read, Then it contains
  `    ignore:\n      - dependency-name: '@types/node'\n        update-types: ['version-update:semver-major']\n`
  and the github-actions entry contains no `ignore:`.
- Verification: acceptance `tests/ci/dependabot.acceptance.test.ts::Dependabot > keeps @types/node and typescript on supported majors and groups typescript with typescript-eslint`

### SPEC-02: typescript and typescript-eslint share one group
- Verifies: AC#2, AC#3
- Behaviour: Given the npm entry, When it is read, Then it contains
  `      typescript:\n        patterns: [typescript, typescript-eslint]\n` and the `npm-minor-patch` group is
  followed directly by `        exclude-patterns: [typescript, typescript-eslint]\n`, so neither package can be
  updated outside the `typescript` group.
- Verification: acceptance `tests/ci/dependabot.acceptance.test.ts::Dependabot > keeps @types/node and typescript on supported majors and groups typescript with typescript-eslint`

### SPEC-03: typescript majors wait for typescript-eslint
- Verifies: AC#2, AC#3
- Behaviour: Given the npm entry, When it is read, Then the `ignore` list also contains
  `      - dependency-name: typescript\n        update-types: ['version-update:semver-major']\n`, and the existing
  TASK-1.24 test `declares weekly github-actions and npm updates` still passes unchanged.
- Verification: acceptance `tests/ci/dependabot.acceptance.test.ts::Dependabot > keeps @types/node and typescript on supported majors and groups typescript with typescript-eslint`

### SPEC-04: next live npm run completes
- Verifies: AC#1, AC#2
- Behaviour: Given the config is on `main`, When the next scheduled npm Dependabot job runs (Monday 06:00 UTC
  or a manual "Check for updates"), Then its log has no "Error while updating peer dependency" / ETARGET, no
  PR proposes `@types/node` 23+ or `typescript` 7, and the run concludes `success`.
- Verification: manual `gh run list --workflow "Dependabot Updates" --limit 4` then `gh run view <npm run id> --log | grep -E "ETARGET|peer dependency|Handled error"` (expect no match) and `gh pr list --author app/dependabot` — only possible after the user pushes; tracked by TASK-1.34

### SPEC-05: README states the new rules
- Verifies: AC#1, AC#2
- Behaviour: Given README `### Dependency updates`, When read, Then it mentions `@types/node`, `typescript-eslint`
  and that majors are ignored; the existing README test still passes.
- Verification: command `grep -n -A8 "### Dependency updates" README.md`

## 7. Edge cases
- Pinned dependency younger than the 3-day cooldown (the ETARGET seen): transient, out of scope (§2 Not doing);
  SPEC-04 confirms it is gone on the next run.
- typescript-eslint not yet supporting a new TS minor: PR still opens (A-2); CI is the gate. N/A to config.
- Duplicate group membership: prevented by `exclude-patterns` (SPEC-02).
- Prettier rewriting the YAML: covered by `npm run lint` (`prettier --check .`).

## 8. Security considerations
No code, secrets, inputs or new dependencies. The ignore rules cover only semver-major of two dev-only
packages (`@types/node` types, the `typescript` compiler); minor/patch fixes still flow. N/A otherwise.

## 9. Non-functional
N/A — config-only change; test runtime impact negligible.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — Dependabot runs on GitHub; see SPEC-04 for the live check
- New tests:
  - `tests/ci/dependabot.acceptance.test.ts` (new `it`) → SPEC-01, SPEC-02, SPEC-03
- End-to-end scenario for the Judge: `npm test`, `npm run lint`, `npm run typecheck`; read
  `.github/dependabot.yml` and confirm it matches §5 exactly; `git diff <base> -- tests/ci/dependabot.acceptance.test.ts`
  shows only added lines. SPEC-04 is checked after the user's push (TASK-1.34).

## 11. Open questions
None. Q-1 answered (a) — see D-2.

## 12. Clarifications log
See `doit/TASK-1.36/qa.md`.
