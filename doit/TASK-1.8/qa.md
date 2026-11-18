# Q&A — TASK-1.8

## Q-1 — Violation output and run behaviour (extends TASK-1.6 Q-1 report)
Asked 2026-11-18. Options: detail block after `Invariant violations: N` only when N > 0, violating hand stops and run continues (Recommended) / always print counts / stop whole run at first violation / block per violating hand (cap 10).
**Answer (user):** Detail block, keep going (Recommended) — clean-run output unchanged; when N > 0 append: per-invariant counts line, `First violation: hand k, player action i (<action>)`, one `Violation: <id>: <message>` per broken invariant, `Replay: npm run playtest -- --replay-code … --size … --button …`, then formatHand of that hand (replay mode: lines 1–3 only). Violating hand stops, run continues (A-3), exit 1.
