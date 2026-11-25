---
id: doc-145
title: 'TASK-2.19: Fit Game Config opponent rows on a phone screen'
type: other
created_date: '2026-11-25T19:21:00Z'
updated_date: '2026-11-25T19:21:00Z'
---
# TASK-2.19: Fit Game Config's opponent rows on a phone screen

Status: Done · Completed: 2026-11-25 · Epic: TASK-2 · Requirements: n/a (follow-up from TASK-2.9 judge J-1-02) · Branch: doit/TASK-2.19

## What was asked
Since TASK-2.8 added a Style select to every bot row, Game Config's Opponents panel was 372 px wide at 320 and 375 px screens and the page scrolled sideways (scrollWidth 388). Make the rows fit on a phone. Spec: doit/TASK-2.19/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The "16px gutter" is the existing 16 px between the viewport edge and the panels. It is kept unchanged | yes | Measured, unchanged by the fix | Reduce the gutter in styles.css |
| A-2 | "Fully visible" means seat label, name and select lie inside [0, clientWidth] and the select is at least 44 px tall. "Usable" means choosing an option updates it | yes | Objective and cheap to check | Use a pixel snapshot |
| A-3 | The new spec runs on both Playwright projects (chromium, webkit) | yes | Matches the other e2e specs | Limit to chromium |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): on phones the Style control wraps to its own line, right-aligned. Phone rows go from 61 to 91 px. No single-line layout fits (a row needs 322 px, and 238/293 px are available). Alternatives rejected: wrap left-aligned, or clip the select text.
- D-1: CSS only, with no markup change, so the locked TASK-2.8 test is untouched.
- D-2: one new e2e spec, not added to the slow list.

## What was built
- `src/ui/styles.css`: `.config-seats li { flex-wrap: wrap }` and `.config-style { margin-left: auto }`, plus a comment (+3 lines). On desktop the name absorbs the free space, so rows are unchanged.
- `e2e/config-phone-width.spec.ts` (new): at 320 and 375 px with 10 players, checks there is no sideways scroll and the panels keep their 16 px gutters. It also checks the 9 bot rows (Ava to Ivy) are inside the viewport, each select is at least 44x44, and choosing Maniac for Ivy works.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | No sideways scroll, 16 px gutters | e2e spec, chromium + webkit | PASS | The spec fails on the base CSS |
| SPEC-02 | Rows visible and usable | e2e spec, chromium + webkit | PASS | Holdout at 320/360/375/414 px with 2/6/10 players passed (30/30), including keyboard use and axe |
| SPEC-03 | Desktop unchanged, checks green | lint, typecheck, `npm test`, 6 Game Config e2e specs | PASS | 1410 tests passed; at 1280 px element boxes and screenshot are identical to the base |

Judge round 1: PASS, no findings. Integrity check passed (only styles.css and the new spec changed).

## Review
No blocking findings. Security review had none.

### Non-blocking review notes (deliberately not fixed)
- NIT: in `e2e/config-phone-width.spec.ts` (line 52), a null `boundingBox` falls back to placeholder values, so a failure would show a misleading position. The path is practically unreachable because `toBeVisible()` is asserted first.
- Scope gate warned: 71 lines against a budget of 70.

## Lessons for the factory
None. The run was clean, with no send-backs.

## Follow-ups
None.
