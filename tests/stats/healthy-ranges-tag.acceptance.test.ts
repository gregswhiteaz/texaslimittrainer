import { expect, it } from 'vitest';
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
const TEST_TIMEOUT_MS = 600_000;
const HANDS = 100_000;

// Opt-in slow (TLH_SLOW_TESTS=1, A-9): about 2 minutes. WTSD is checked against the bots by TASK-7.32 (Q-2).
it.runIf(SLOW)(
  'AC#2 TAG 6-max VPIP, PFR, Aggression and W$SD are inside the 6-max healthy ranges (100,000 hands, seed 42)',
  () => {
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
    const summary = runPlaytest({ hands: HANDS, seed: 42, size: 6, game: 'cash' }, onHand);
    expect(summary.handsPlayed).toBe(HANDS);
    const stats = styleStats(counts);
    for (const stat of ['vpip', 'pfr', 'aggression', 'wsd'] as const) {
      const value = stats[stat];
      expect(value, stat).not.toBeNull();
      const tenths = Math.round((value as number) * 10);
      const { low, high } = HEALTHY_RANGES['6-max'][stat];
      console.log(`TAG 6-max ${stat}: ${tenths / 10} (healthy ${low}–${high})`);
      expect(tenths, stat).toBeGreaterThanOrEqual(low * 10);
      expect(tenths, stat).toBeLessThanOrEqual(high * 10);
    }
  },
  TEST_TIMEOUT_MS,
);
