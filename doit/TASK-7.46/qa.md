# TASK-7.46 Q&A (autopilot)

## Q-1 How to bring 3-seat TAG aggression (65.2 over 100k) inside its style band (ceiling 65.0)
Options: (a) raise the TAG aggression band ceiling to 66 in REQ-027.1 (matches the healthy-range ceiling; no bot behaviour change; locked band copy in tests/bots/style-bands.acceptance.test.ts:26 updated); (b) 3-seat-only retune (margins 0.1–0.7 on seed 42; edits TASK-7.37 locked assertions); (c) keep the band and drop AC#1's 3-seat claim.
**Answer: auto-accepted (recommended)** — (a). Requirements-level change (REQ-027.1, changelog row) flagged prominently for the user's review; reversible.
