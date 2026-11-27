# Build log — TASK-8.7

## BUILD
- `backlog decision create "<§5 title>" -s accepted --plain` → decision-7; `backlog decision list --plain` shows it accepted.
- TASK-7.40 AC#4 and TASK-7.42 AC#3: `--remove-ac` + `--ac` would append at the end and renumber, so used `backlog task edit <id> --acceptance-criteria ...` with the full list in order and only that AC's text replaced (all ACs were unchecked; asserted before editing). AC numbers kept; `git diff` shows only that AC line plus `updated_date` per file.
- `backlog task edit TASK-8.7 --append-notes "$(cat <scratchpad file>)"`: Q-1 answer and §3 evidence. AC#1 left unticked, status unchanged.
- `git diff --exit-code main -- dreams/limit-holdem-trainer/requirements.md`: no diff. `git diff --stat main -- src tests e2e tools docs`: empty.
- No code changed, so no new tests; the gate runs `npm test`.
