# TASK-1.35 changes

- `tools/git/prune-merged-branches.js` — remote listing now carries each branch's SHA; the remote delete is one `git push --porcelain origin --force-with-lease=refs/heads/<b>:<sha> … --delete <b> …` (new export `remoteDeleteArgs`); refused branches are parsed from the porcelain `!` lines (new export `refusedBranches`) and each reported as `prune-merged-branches: refused to delete <b> on origin: <summary>`, exit 1; other push failures keep the `git <args> failed` + stderr path. Helpers renamed `lines` → `outputLines`, `fail` → `reportError`.
- `tests/git/prune-merged-branches-hardening.acceptance.test.ts` — new acceptance tests SPEC-01 (lease refuses a branch moved after listing, via a `git` shim on PATH that moves the temporary origin's `doit/a` before the push) and SPEC-02 (missing `main` / `origin/main` exits 1 and deletes nothing). Temporary repos only.
- `tests/git/prune-merged-branches-lease.test.ts` — new unit test SPEC-03 for `remoteDeleteArgs` and `refusedBranches`, plus the real git 2.54 `(delete):refs/heads/<b>` porcelain form.

No new dependencies.
