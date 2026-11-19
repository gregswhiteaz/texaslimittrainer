# TASK-1.24 — Questions and answers

## Q-1 — How should AC#2 (branch protection on main) be met?
Context: GitHub returns HTTP 403 "Upgrade to GitHub Pro or make this repository public to enable this feature" for branch protection on this private free-plan repo; the user merges locally and pushes directly to main.
Options: (a) document now, apply later [Recommended]; (b) make the repo public; (c) upgrade to GitHub Pro; (d) local pre-push hook instead.
**Answer (user, 2026-11-18): (a) Document now, apply later.**
Consequences: README documents the exact `gh api -X PUT .../branches/main/protection` command (required check = the CI job name, strict false, no required reviews, enforce_admins false so direct pushes keep working) and the verify command, noting the 403 until public/Pro. AC#2 is reworded to "steps documented; applied once available". Applying the setting becomes a follow-up task in Step 6a.
