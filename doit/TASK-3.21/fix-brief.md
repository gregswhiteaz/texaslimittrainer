# TASK-3.21 — recorded build deviations (orchestrator-approved, autopilot)

Judge these on substance; spec.md is locked and still shows the prototype values.

1. A-4 seed values: seed [40,1,2,3] kept. The live app moves bots through the advice worker's seeded style policy, not plain tagPolicy, so hand-14 values differ from the headless prototype: the user has three full-size turns before the all-ins, and pot winners read `Main pot $54 · Dee wins $54` / `Side pot $124 · Dee wins $124` (spec said $62). SPEC-03 now moves bots via handleAdviceRequest like the app; SPEC-03 and SPEC-07 pin the browser-checked values. AC needs (hand 13 ends on $18, hand 14 starts on $18, all three all-in labels in order, live 2-line Pots list) all still hold.
2. 14th file (budget 13): tests/table/session.acceptance.test.ts `steps` type annotation widened with 'stopped' (type-only, not hook-locked; same as TASK-3.11's 'rebuy').
3. SPEC-07 deals hand 14 by clicking "Deal next hand" (same dealAfterDone → nextHand path) because user decisions in hand 13 hold the review.
4. Axe on the Pots list runs once bot moves stop arriving (action count stable across two reads).
5. tests/table/game-type.test.ts gained one expect (seat-on-0 case SPEC-10 asks for).
