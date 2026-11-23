# TASK-2.5 — Questions and answers (2026-11-22)

## Q-1 — Preset control wording: radio group "Line-up" (Mixed / Tough / Soft) in the Opponents panel above the bot rows; Mixed on first use
**Answer: auto-accepted (recommended)**

## Q-2 — Routine locked-test edits (names/style labels/row order the story changes)
tests/ui/home.acceptance.test.tsx (TASK-2.1), tests/ui/game-config-players.acceptance.test.tsx (TASK-2.2),
e2e/players-choice.spec.ts (TASK-2.2), e2e/home.spec.ts (TASK-2.1), e2e/table.spec.ts (TASK-3.1),
e2e/next-hand.spec.ts:250,265 (TASK-3.4; "Ava wins $8" → "Ben wins $8", same seat and amount).
**Answer: auto-approved (routine locked-test edit)** — any edit that turns out to change a seat, amount or action moves to Q-3.

## Q-3 — Locked e2e tests whose expected results change with Mixed bots
e2e/action-bar.spec.ts:130,207 (TASK-3.2): re-pin replay words to a code that recreates the Check / Bet $4 flop with Mixed bots.
e2e/next-hand.spec.ts:221 (TASK-3.4) and e2e/review.spec.ts:332+ (TASK-9.1): keep the pinned code; update only expected
values (winner text, review entries/grades, badge colours, stacks) to the Mixed table's results; same number of assertions.
**Answer: user — approve (recommended).**

## Q-4 — New-control count/selector edits (builder block 1, option A)
tests/ui/game-config-game-type.acceptance.test.tsx (TASK-2.4): find the game-type group by aria-labelledby="config-game-type" and only
radios named game-type; tests/ui/game-config-stake.acceptance.test.tsx:71 (TASK-2.3) and tests/ui/home.acceptance.test.tsx:79-84
(TASK-2.1): expect the three extra radio inputs. Keep every assertion.
**Answer: auto-approved (routine locked-test edit — counts/selectors for a control the story adds)**

## Q-5 — Locked e2e/rapid-pace.spec.ts 200-hand test hangs with Mixed bots (no Fold button when checked to)
Option A: fix the scripted-user helper `foldElseCheck` to click Fold only when a Fold button exists and is enabled, else
Check (what its own comment says); no assertion change. Then rerun the slow suite.
**Answer: auto-accepted (recommended)** — user's unattended-approvals rule (2026-11-22).
Also: e2e/next-hand.spec.ts:275 "Ben wins $8" → "Cal wins $8" (same seat 2, same amount) accepted as a Q-2 routine edit.
