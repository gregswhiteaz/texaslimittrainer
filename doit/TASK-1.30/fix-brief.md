# Fix brief — TASK-1.30 (from branch CI run 44674060169, orchestrator)

## 1. [MAJOR] SPEC-07 fails on the real runner: Acquire::Retries "3" is not in effect
Evidence: `tests/ci/apt-network.test.ts:77` — `expected [ 'APT "";', …(330) ] to include 'Acquire::Retries "3";'`.
Both Timeout lines passed, so the fragment is read, but something read later (most likely `/etc/apt/apt.conf`,
which apt parses after every apt.conf.d fragment, or a fragment sorting after `99-ci-network`) sets
`Acquire::Retries` to another value on the GitHub ubuntu-24.04 image.

Required change (orchestrator decision, logged as a spec deviation):
- Make the CI step append the three settings to `/etc/apt/apt.conf` so they are read last and win, e.g.
  `run: sudo tee -a /etc/apt/apt.conf < tools/ci/apt-network.conf > /dev/null` (keep it one `run:` line, no `if:`,
  same position, same step name). Keep `tools/ci/apt-network.conf` as the single source of the values.
- Then print the effective values in the same step or a following line of the same `run:` is NOT allowed (one-line
  run); instead make SPEC-07's failure message include every `apt-config dump` line matching
  `/Acquire::(Retries|https?::Timeout)/` so a future failure shows the competing value.
- Update SPEC-06's static check (tests/ci/apt-network.test.ts, unlocked for this fix) to the new run line.
- The locked tests/ci/workflow.test.ts must still pass (no `if:`, no `run: npm`, install run lines unchanged).
- Update README's sentence if it names the fragment path.
