---
id: doc-40
title: 'TASK-1.30: Harden the CI apt install wrapper and mirror stalls'
type: other
created_date: '2026-11-20T04:45:00Z'
updated_date: '2026-11-20T04:45:00Z'
---
# TASK-1.30: Harden the CI apt install wrapper and mirror stalls

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up from TASK-1.29 / doc-27) · Branch: doit/TASK-1.30

## Spec deviation (read first)
The spec (A-3, SPEC-06, section 5) says the new CI step installs the apt config with `sudo install -m 0644 tools/ci/apt-network.conf /etc/apt/apt.conf.d/99-ci-network`. **That is not what shipped.** Branch CI run 44674060169 failed SPEC-07 on the real runner: both `Timeout` lines were in effect, but `Acquire::Retries "3"` was not, because the GitHub ubuntu-24.04 runner overrides `Acquire::Retries` after the `apt.conf.d` fragments. The orchestrator decided (fix-brief.md, commit a9117d4) that the step appends to `/etc/apt/apt.conf`, which apt reads after every fragment:

`sudo tee -a /etc/apt/apt.conf < tools/ci/apt-network.conf > /dev/null`

Same step name ("Bound apt network timeouts"), same position (before `npm ci`), one `run:` line, no `if:`. `tools/ci/apt-network.conf` is still the single source of the values. Proven by branch CI run 44675074553 (green, SPEC-07 running). `spec.md` was not rewritten and still shows the old run line and the `99-ci-network` path (review round 2 MINOR, recorded here). The code, tests and README follow the new form.

## What was asked
Four follow-ups from the TASK-1.29 reviews and judge: (AC1) apt-lock must not print raw control characters from a lock holder's process name; (AC2) tests for a signal-killed command, an argument before `--`, and the final-sleep clamp; (AC3) `devParts` must decode majors of 4096 or more, or document the limit; (AC4) bound apt's network timeouts and retries in CI so a stalled mirror fails or recovers inside the step timeout. Spec: doit/TASK-1.30/spec.md.

## Assumptions made without asking — please review
No questions were asked (autopilot, no ask items). Assumptions from spec.md:
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Each `[\x00-\x1f\x7f]` character in the holder name becomes `?`, done in `holderText`, which feeds both the waiting line and the `::error::` line | yes | One choke point; `?` is plain ASCII and shows something was replaced | Change the replacement in `holderText` |
| A-2 | `Acquire::http::Timeout "15"`, `Acquire::https::Timeout "15"`, `Acquire::Retries "3"` | yes | Timeout bounds a stall, not total speed. Worst case about 70 s per stalled file, inside the 240 s attempt | Edit `tools/ci/apt-network.conf` (the budget test re-checks it) |
| A-3 | Config is a tracked file applied by an unconditional CI step. **Revised in this run**: appended to `/etc/apt/apt.conf`, not installed as a fragment (see deviation) | yes (ephemeral runner) | `sudo` drops `APT_CONFIG`; a system config file reaches Playwright's `sudo apt-get`. No `if:` keeps the locked workflow test unchanged | Delete the step |
| A-4 | `devParts` uses glibc's `gnu_dev_major`/`gnu_dev_minor` masks, with a comment that Linux's kernel `dev_t` is 12:20 bits | yes | Two masks; removes the J-1-01 mis-decode | Revert the masks |

## Clarifications and decisions
- D-1: AC4 met with a separate unconditional step and a tracked conf file, leaving the pinned install run lines alone (no locked-test edit). Option (c), caching `.deb` archives, is left to TASK-1.39.
- D-2: new tests in new files, so the locked `tests/ci/apt-lock.test.ts` is untouched.
- D-3 (orchestrator, mid-build): the `tee -a /etc/apt/apt.conf` deviation above.

## What was built
- `tools/ci/apt-lock.js`: `holderText` is exported and replaces control characters with `?`; `devParts` uses glibc's 32-bit masks (comment on Linux's 12:20 `dev_t`).
- `tools/ci/apt-network.conf` (new): a `//` comment plus the three Acquire settings.
- `.github/workflows/ci.yml`: new "Bound apt network timeouts" step before `npm ci`.
- `tests/ci/apt-lock.hardening.test.ts` (new): SPEC-01..05.
- `tests/ci/apt-network.test.ts` (new): static step/config/budget check (SPEC-06) and a GitHub-Actions-Linux-only `apt-config dump` check (SPEC-07). Its failure message lists every dump line matching `/Acquire::(Retries|https?::Timeout)/` so a future competing value is visible.
- `README.md`: one sentence in the CI install paragraph (says "appends ... to /etc/apt/apt.conf").
- Budget rule in the static test: `(Retries+1) x Timeout + Retries x 30 <= 240 - 60`; with 15/3 that is 150 <= 180.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC1 | acceptance, `apt-lock.hardening.test.ts` (every C0 char plus 0x7f) | pass | judge round 1 PASS |
| SPEC-02 | AC2 | acceptance, signal-killed child exits 1 | pass | same |
| SPEC-03 | AC2 | acceptance, stray argument gives exit 2, exact stderr, no marker file | pass | same |
| SPEC-04 | AC2 | acceptance, exact sleep arrays and final clock at the limit | pass | same |
| SPEC-05 | AC3 | acceptance, `devParts` round trip for major 4097 | pass | same |
| SPEC-06 | AC4 | acceptance, static step/config/budget check | pass | same |
| SPEC-07 | AC4 | integration on the real runner | pass | branch CI 44675074553 (failed first in 44674060169, which led to the deviation) |
- Gate fix-3 passes: 258/260 changed lines, 6/6 files (build gate 256 lines). `npm test`, lint and typecheck pass; `npx vitest run tests/ci` gave 11 files, 57 passed, 6 skipped (Linux-only).
- Judge round 1: PASS, no failures, AC1-4 proven.

## Review
Round 1 (code and security): no findings. Round 2 (fix commit a9117d4 only): no BLOCKER or MAJOR; the MAJOR from the fix brief (Retries not in effect on the runner) is resolved. Security: no new privilege; the step reads a repo-tracked file, no expressions interpolated.

### Non-blocking review notes (deliberately not fixed)
- MINOR: spec.md still shows the old `sudo install ... 99-ci-network` run line; recorded in the deviation section above.
- NIT: `tee -a` appends after whatever the file's last byte is. Safe because the conf starts with a `//` comment line; no guard added.

## How to try it
- `npx vitest run tests/ci` (SPEC-07 skips locally; it runs only on GitHub Actions Linux).
- On a runner, `apt-config dump | grep -E 'Acquire::(Retries|https?::Timeout)'` shows the three values.

## Run metrics
Questions 0 · assumptions logged 4 (spec) · review rounds 2 · judge rounds 1 · gate runs 3 · escalations 0 · changed lines 258 (budget 260).

## Known limitations and follow-ups
- Boundary: TASK-1.39 still owns retry/step timeout re-tuning and `.deb` caching. A steadily slow mirror that keeps sending is not cut off by apt's Timeout; it is bounded only by retry.js's 240 s attempt.
- Follow-up: re-tune `retry.js` attempt/step timeouts for a steadily slow mirror and cache `.deb` archives between runs (owner: TASK-1.39 AC#3).
- Follow-up: if the runner image changes how it sets apt options, SPEC-07 will fail and print the competing lines; adjust the conf then (owner: none, no task needed).

## Lessons for the factory (proposals — not applied)
- The spec assumed apt.conf.d ordering without checking the real runner image, which cost a CI round and a fix. Proposal: when a spec's design depends on a runner's live configuration, the spec stage should require the CI-only integration test to be run on a branch before review.
- When the orchestrator approves a mid-build deviation, the judge reads a stale spec. Proposal: add a "Deviations" section to spec.md that the orchestrator updates, so reviewers do not raise it as a MINOR.
