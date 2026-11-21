# Fix brief — TASK-2.3 (code review round 1 MINORs, applied in-story)

No blocking findings. Two small CSS fixes on the stake select (`src/ui/styles.css`):
1. ~line 138: add `font-family: inherit;` so the select uses the app font (as `.screen button` already does).
2. ~line 146: lighten the select border from #4a515c to #6b7380 so it meets the 3:1 non-text contrast guide on #1a1d22
   (record the measured ratio in build-log.md).
Re-run `e2e/stake-choice.spec.ts` (both browsers). Run `npm run format` before the gate. Never push.
