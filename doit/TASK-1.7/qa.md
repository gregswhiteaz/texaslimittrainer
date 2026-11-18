# Q&A — TASK-1.7

## Q-1 — Proof of real workflow runs (D-1)
- Answer: **(a) One push of 7 branches.** Builder prepares doit/TASK-1.7 plus throwaway local branches ci-proof/TASK-1.7/{lint,typecheck,build,test,e2e-chromium,e2e-webkit} (plus audit, see Q-3), each breaking exactly one check and rehearsed locally. The user runs one `git push` command; later one `git push origin --delete ...` removes the proof branches. No injection switch in the workflow.

## Q-2 — Who opens the PR proving the pull_request trigger
- Answer: **Claude opens a draft PR** with `gh pr create --draft` from doit/TASK-1.7 to main after the user's push.

## Q-3 — Audit rule (TASK-1.1 Q-3) in CI (D-2)
- Answer: **Add it to this story.** New AC #5 added via CLI: CI runs `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical`; either reporting at that level fails the workflow. Prove the failure path with an extra proof branch (e.g. ci-proof/TASK-1.7/audit that adds a known-vulnerable *shipped* dependency at a pinned old version) so the single user push covers it too.

## Assumption A-15 (orchestrator, judge round 1)
- Judge FAIL on SPEC-09 only: PR run 44220403675 was cancelled at the 20-min job timeout because apt downloads stalled in "Install Playwright system dependencies" (19 min; same step 34 s on the push run of the same commit). Environmental, not a workflow defect. Action: `gh run rerun 44220403675` (no code change, no builder send-back), then judge round 2. If the stall recurs, harden the step (timeout + retry) via a FIX round.
- SPEC-09 failure counter corrected 4→1 (repeated verdict invocations for round 1 double-counted; one real failure). Flag for doit improvement: verdict should be idempotent per round.
