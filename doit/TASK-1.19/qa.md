# Q&A — TASK-1.19

## Q-1 — Real-environment proof for the sudo/apt stall (raised after review round 1)
- Context: both reviewers (security NIT killgroup-eperm-uncaught; code MINOR sudo-use-pty-escapes-group-kill) doubt the helper's behaviour when the hung process is `sudo apt-get` on ubuntu-24.04 (sudo use_pty may start apt in a new session/process group; kill(-pgid) may hit EPERM on root-owned members).
- Answer (user): **Add a Linux-CI-only test.** Orchestrator implements it as a fix round (spec stays locked; deviation recorded here):
  1. New test in tests/ci (not locked), skipped unless `process.platform === 'linux' && process.env.CI === 'true'`: run tools/ci/retry.js with a 2 s per-attempt timeout, 2 attempts, 0 s delay, wrapping `sudo -n` + a command that hangs (e.g. `sudo -n sh -c 'exec sleep 120'` with a unique marker argument). Assert: both attempts time out (two timeout warnings), the helper exits 1 with the ::error:: line, total time < 20 s, and afterwards no process with the marker remains (pgrep -f).
  2. Make killGroup robust: treat EPERM (and ESRCH) from process.kill(-pgid, sig) as non-fatal, so the helper never crashes instead of retrying.
