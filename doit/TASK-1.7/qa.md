# Q&A — TASK-1.7

## Q-1 — Proof of real workflow runs (D-1)
- Answer: **(a) One push of 7 branches.** Builder prepares doit/TASK-1.7 plus throwaway local branches ci-proof/TASK-1.7/{lint,typecheck,build,test,e2e-chromium,e2e-webkit} (plus audit, see Q-3), each breaking exactly one check and rehearsed locally. The user runs one `git push` command; later one `git push origin --delete ...` removes the proof branches. No injection switch in the workflow.

## Q-2 — Who opens the PR proving the pull_request trigger
- Answer: **Claude opens a draft PR** with `gh pr create --draft` from doit/TASK-1.7 to main after the user's push.

## Q-3 — Audit rule (TASK-1.1 Q-3) in CI (D-2)
- Answer: **Add it to this story.** New AC #5 added via CLI: CI runs `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical`; either reporting at that level fails the workflow. Prove the failure path with an extra proof branch (e.g. ci-proof/TASK-1.7/audit that adds a known-vulnerable *shipped* dependency at a pinned old version) so the single user push covers it too.
