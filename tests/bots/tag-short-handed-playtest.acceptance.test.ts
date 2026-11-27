import { describe, expect, it } from 'vitest';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import { HEALTHY_RANGES } from '../../src/stats/healthy-ranges';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats,
  type StyleCounts,
} from '../../src/stats/style-stats';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const SLOW_TIMEOUT_MS = 600_000;
const HANDS = 100_000;

/** The five style stats summed over every seat of an all-TAG cash playtest at `size` seats. */
function tagStats(size: number) {
  let counts: StyleCounts = EMPTY_STYLE_COUNTS;
  const onHand = (hand: PlayedHand): void => {
    const { result } = hand.final;
    if (result === null) return;
    const statHand = {
      seats: hand.record.seats,
      actions: hand.final.actions,
      board: hand.final.board,
      result,
    };
    for (const { seat } of hand.record.seats) {
      counts = addStyleCounts(counts, handStyleCounts(statHand, seat));
    }
  };
  const summary = runPlaytest({ hands: HANDS, seed: 42, size, game: 'cash' }, onHand);
  expect(summary.handsPlayed).toBe(HANDS);
  expect(summary.violations).toBe(0);
  return styleStats(counts);
}

describe('all-TAG stats at 3 and 4 seats are inside the 6-max healthy ranges', () => {
  // Opt-in slow (TLH_SLOW_TESTS=1, in `npm run test:slow`): 100,000 hands, seed 42, per size (TASK-7.37 D-3).
  for (const size of [3, 4]) {
    it.runIf(SLOW)(
      `${size} seats`,
      () => {
        const stats = tagStats(size);
        for (const stat of ['vpip', 'pfr', 'aggression', 'wtsd', 'wsd'] as const) {
          const value = stats[stat];
          expect(value, `${size} seats ${stat}`).not.toBeNull();
          const { low, high } = HEALTHY_RANGES['6-max'][stat];
          console.log(
            `TAG ${size} seats ${stat}: ${(value as number).toFixed(1)} (healthy ${low}–${high})`,
          );
          expect(value, `${size} seats ${stat}`).toBeGreaterThanOrEqual(low);
          expect(value, `${size} seats ${stat}`).toBeLessThanOrEqual(high);
        }
      },
      SLOW_TIMEOUT_MS,
    );
  }
});
