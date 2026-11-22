# Resolution of blocked.json (orchestrator, recorded deviation from A-3)

**Decision: option 1.** `runUntilMyTurn` default `maxFakeMs` = 600,000 (10 min fake); the 10 s real-time bound is what
normally stops the loop. Rationale: A-3's 60 s fake cap is consumed in ~3 s real (each 50 ms slice ≈ 2.6 ms real), which
contradicts SPEC-04 (2 s × 2 replies) and would re-create the race on a slow runner. A-4 already shows extra fake time is
harmless. Keep the fake cap (still bounded), keep the 10 s real cap, keep SPEC-07's throw test.
Reviewers and judge: this is a recorded deviation from A-3 — judge it on substance.

Also: the unit `lineUpPolicyFactory` version at ~2.9 s locally is too close to its 3 s target; if A-2 allows (the
Tough-vs-all-TAG difference still shows), use fewer hands so it is comfortably under (aim ≤ 2 s locally). Keep every expect.

Then finish the build: edit the six locked e2e files (clock advance + imports only), full `npm test`, `npm run e2e`
twice, the delayed-reply spec, `npm run format`, gate.
