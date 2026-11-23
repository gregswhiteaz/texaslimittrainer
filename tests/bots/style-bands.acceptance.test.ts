import { describe, expect, it } from 'vitest';
import type { StyleName } from '../../src/bots/style';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats as sharedStyleStats,
  type StatHand,
  type StyleCounts,
} from '../../src/stats/style-stats';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 600_000;
const HANDS = 100_000;

type Band = readonly [number, number];
interface Bands {
  readonly vpip: Band;
  readonly pfr: Band;
  readonly aggression: Band;
}
/** REQ-027.1 (TAG), REQ-027.2 (Calling station), REQ-027.3 (Maniac) and REQ-027.4 (Rock), percent, bounds
 *  inclusive. */
const BANDS: Readonly<Partial<Record<StyleName, Bands>>> = {
  TAG: { vpip: [18, 26], pfr: [14, 22], aggression: [45, 65] },
  Rock: { vpip: [8, 15], pfr: [6, 12], aggression: [35, 55] },
  'Calling station': { vpip: [45, 65], pfr: [3, 10], aggression: [10, 25] },
  Maniac: { vpip: [50, 75], pfr: [35, 60], aggression: [65, 85] },
};

/** 0.1-percent rounding; a null (zero-denominator) stat fails the test. */
const round = (value: number | null, label: string): number => {
  expect(value, label).not.toBeNull();
  return Math.round((value as number) * 10) / 10;
};

/** REQ-045 stats per bot style (A-1, A-4), from the shared src/stats/style-stats functions: bot seats only, by
 *  their style at each hand. */
function styleStats(
  seed: number,
): Map<StyleName, { vpip: number; pfr: number; aggression: number }> {
  const counts = new Map<StyleName, StyleCounts>();
  const onHand = (hand: PlayedHand): void => {
    const { result } = hand.final;
    if (result === null) return;
    const statHand: StatHand = {
      seats: hand.record.seats,
      actions: hand.final.actions,
      board: hand.final.board,
      result,
    };
    const styleOf = new Map<number, StyleName>();
    for (const seat of hand.lineUp ?? []) {
      if (seat.kind === 'bot' && seat.style !== null) styleOf.set(seat.seat, seat.style);
    }
    for (const { seat } of hand.record.seats) {
      const style = styleOf.get(seat);
      if (style === undefined) continue;
      const total = counts.get(style) ?? EMPTY_STYLE_COUNTS;
      counts.set(style, addStyleCounts(total, handStyleCounts(statHand, seat)));
    }
  };
  const summary = runPlaytest(
    { hands: HANDS, seed, size: 6, game: 'cash', lineUp: 'Mixed' },
    onHand,
  );
  expect(summary.handsPlayed).toBe(HANDS);
  expect(summary.violations).toBe(0);
  const stats = new Map<StyleName, { vpip: number; pfr: number; aggression: number }>();
  for (const [style, c] of counts) {
    const shared = sharedStyleStats(c);
    stats.set(style, {
      vpip: round(shared.vpip, `${style} vpip seed ${seed}`),
      pfr: round(shared.pfr, `${style} pfr seed ${seed}`),
      aggression: round(shared.aggression, `${style} aggression seed ${seed}`),
    });
  }
  return stats;
}

function expectInBands(seed: number): void {
  const stats = styleStats(seed);
  for (const [style, bands] of Object.entries(BANDS) as [StyleName, Bands][]) {
    const measured = stats.get(style);
    expect(measured, `${style} seed ${seed}`).toBeDefined();
    console.log(
      `seed ${seed} ${style}: VPIP ${measured?.vpip} PFR ${measured?.pfr} AGG ${measured?.aggression}`,
    );
    for (const stat of ['vpip', 'pfr', 'aggression'] as const) {
      const value = measured?.[stat] as number;
      const [low, high] = bands[stat];
      expect(value, `${style} ${stat} seed ${seed}`).toBeGreaterThanOrEqual(low);
      expect(value, `${style} ${stat} seed ${seed}`).toBeLessThanOrEqual(high);
    }
  }
}

// Opt-in slow (TLH_SLOW_TESTS=1): about 2-3 minutes per seed.
it.runIf(SLOW)(
  'every bot style is inside its style band over 100,000 Mixed 6-max hands (seed 42)',
  () => expectInBands(42),
  TEST_TIMEOUT_MS,
);

describe('every bot style is inside its style band over 100,000 Mixed 6-max hands (seeds 7 and 1234)', () => {
  for (const seed of [7, 1234]) {
    it.runIf(SLOW)(`seed ${seed}`, () => expectInBands(seed), TEST_TIMEOUT_MS);
  }
});
