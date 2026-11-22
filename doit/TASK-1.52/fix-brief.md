# Fix brief — TASK-1.52 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] e2e/action-bar.spec.ts:400-slice-loop-justification-contradicted-by-measurement (code review)
- Where: e2e/action-bar.spec.ts:177
- Problem: The AC#3 audit leaves the 400-slice conditional loops as 'justified: condition-bounded; 400 slices take several real seconds' (spec section 5 clock table, last row). This task's own measurement contradicts that: blocked-1.resolved.json records 1,200 slices of 50 ms in 3,105 ms real on WebKit (~2.6 ms/slice), so 400 slices are ~1 s real. These loops are still bounded by fake time (20,000 ms) while waiting on real-time worker replies, which is the same race class this task removes. The most exposed sites are the fold-to-end-of-hand loops (action-bar.spec.ts:177-179 on the second context, action-bar.spec.ts:243-246, table.spec.ts nextTurnPaused at :124, next-hand/review slicesUntil). They have to absorb every remaining bot reply of a hand. After the bot step timers use their fake time, only a few hundred slices (well under 1 s real) are left for all of those replies combined. With delayWorkerReplies(2000), these loops would fail just like the old 1,000 ms budget did.
- Evidence: doit/TASK-1.52/blocked-1.resolved.json evidence: 'not my turn after 60000 ms fake / 3105 ms real (WebKit)'. spec.md section 5 row: '400-slice conditional loops ... condition-bounded; 400 slices take several real seconds | justified'. e2e/action-bar.spec.ts:177 `for (let slice = 0; slice < 400 && (await handOver(real).count()) === 0; slice++) await real.clock.runFor(50);`
- Expected fix: Correct the audit: either (a) measure the real duration of each 400-slice loop (log Date.now() deltas on CI or locally) and replace the 'several real seconds' justification in the audit (task implementation notes) with the measured real budget and the margin over normal reply latency, escalating if the margin is under about 5x; or (b), as a follow-up task with the owners' unlock approval, give these loops a real-time bound too (for example a predicate variant of runUntilMyTurn). Do not leave a justification that the task's own data disproves.


## User decision Q-2 (qa.md): fix the 400-slice loops in this story
Files (unlocked under their owners): e2e/action-bar.spec.ts (:177-179, :243-246), e2e/table.spec.ts (`nextTurnPaused` :124),
e2e/table-display.spec.ts, e2e/next-hand.spec.ts and e2e/review.spec.ts (`slicesUntil`), plus any other "advance until
condition, capped by slice count" loop that waits on worker replies. Give each a real-time bound (shared helper in
e2e/support/paused-clock.ts, e.g. `runUntil(page, condition, opts)` that `runUntilMyTurn` can reuse; same 50 ms slices,
generous fake cap, 10 s real cap, throws with a clear message). Change only how the state is reached; no expect
added/removed/loosened. Prove it: extend e2e/worker-delay.spec.ts with a delayed-reply (2 s) case that plays a hand to the
end through the new helper (and a control showing the old 400-slice loop fails under the same delay).
Correct the spec §5 audit justification in the story notes: measured ~2.6 ms real per 50 ms slice.
Optional NIT: a test that trips the fake-time bound.
`npm run e2e` twice, `npm run format`, gate. Never push.
