# Q&A — TASK-1.3

## Q-1 — Replay code format and public API (D-1)
- Answer: **Recommended.** 128-bit seed from crypto.getRandomValues(new Uint32Array(4)); code = 32 lowercase hex chars, word 0 first, no separators/checksum; strict /^[0-9a-f]{32}$/, all-zero invalid; API in src/engine/deck.ts: ReplayCode, newReplayCode(), replayCodeFromWords(words), isReplayCode(text), shuffledDeck(code) (index 0 dealt first).

## Q-2 — Seed→generator mapping and shuffle (D-2)
- Answer: **Mix the code first, exactly unbiased** (orchestrator's recommendation, differs from the Spec Writer's direct-state recommendation). Expand/mix the 128-bit code through SplitMix32 (e.g. seed a SplitMix32 stream from the four words and draw the four xoshiro128** state words, guaranteeing a non-zero state) before seeding the generator; Durstenfeld Fisher–Yates with a new exactly-unbiased Lemire-with-rejection `nextIntUnbiased`. Reason: TASK-1.6 playtests will derive codes from small --seed values; mixing prevents poorly scrambled early shuffles from low-entropy codes. Golden vectors must be recomputed for this design.
