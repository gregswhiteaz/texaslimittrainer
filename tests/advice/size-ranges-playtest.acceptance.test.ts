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

/** The five style stats summed over every seat of an all-TAG playtest at `size` seats. */
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

describe('heads-up and full-ring ranges in play (TASK-7.26)', () => {
  // Opt-in slow (TLH_SLOW_TESTS=1, in `npm run test:slow`). Stats are logged, not asserted inside the healthy
  // ranges (Q-3): a miss becomes a follow-up task.
  it.runIf(SLOW)(
    'heads-up and 9-max all-TAG stats with authored ranges (100,000 hands, seed 42)',
    () => {
      for (const [size, name] of [
        [2, 'heads-up'],
        [9, 'full-ring'],
      ] as const) {
        const stats = tagStats(size);
        for (const stat of ['vpip', 'pfr', 'aggression', 'wtsd', 'wsd'] as const) {
          const value = stats[stat];
          expect(value, `${name} ${stat}`).not.toBeNull();
          const { low, high } = HEALTHY_RANGES[name][stat];
          console.log(
            `TAG ${name} ${stat}: ${(value as number).toFixed(1)} (healthy ${low}–${high})`,
          );
        }
      }
    },
    2 * SLOW_TIMEOUT_MS,
  );
});
