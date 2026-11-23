# Fix brief — TASK-2.8 (code review R1 MINORs, in-story, strengthen-only)
1. e2e/seat-style.spec.ts:137,146,168,172,182 — `rowTexts()` read once with `toEqual` doesn't retry: use `expect.poll(() => rowTexts(page)).toEqual(...)`
   (or wait on the select's `toHaveValue` first) so a late re-render can't flake CI.
2. GameConfigScreen.tsx:126 — no test covers edits cleared on players-count change (A-2). Add an e2e step: edit Cal's style,
   change players to 4 and back to 6, expect the unedited Mixed rows. Prove it fails with `setEdits({})` removed from that
   handler (temp edit, restore byte-for-byte).
Keep every assertion. `npm run format`; run the spec in Chromium and WebKit; gate. Never push.
