import { describe, expect, it } from 'vitest';
import type { StyleName } from '../../src/bots/style';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 600_000;
const HANDS = 100_000;

type Band = readonly [number, number];
interface Bands {
  readonly vpip: Band;
  readonly pfr: Band;
  readonly aggression: Band;
}
/** REQ-027.1 (TAG) and REQ-027.4 (Rock), percent, bounds inclusive. */
const BANDS: Readonly<Partial<Record<StyleName, Bands>>> = {
  TAG: { vpip: [18, 26], pfr: [14, 22], aggression: [45, 65] },
  Rock: { vpip: [8, 15], pfr: [6, 12], aggression: [35, 55] },
};

interface Counts {
  dealt: number;
  vpip: number;
  pfr: number;
  aggressive: number;
  passive: number;
}

const pct = (part: number, whole: number): number => Math.round((part / whole) * 1000) / 10;

/** REQ-045 stats per bot style (A-1, A-4): bot seats only, by their style at each hand; blinds never voluntary;
 *  aggression = postflop (bet + raise) / (bet + raise + call). */
function styleStats(
  seed: number,
): Map<StyleName, { vpip: number; pfr: number; aggression: number }> {
  const counts = new Map<StyleName, Counts>();
  const onHand = (hand: PlayedHand): void => {
    const styleOf = new Map<number, StyleName>();
    for (const seat of hand.lineUp ?? []) {
      if (seat.kind === 'bot' && seat.style !== null) styleOf.set(seat.seat, seat.style);
    }
    for (const { seat } of hand.record.seats) {
      const style = styleOf.get(seat);
      if (style === undefined) continue;
      let c = counts.get(style);
      if (c === undefined) {
        c = { dealt: 0, vpip: 0, pfr: 0, aggressive: 0, passive: 0 };
        counts.set(style, c);
      }
      c.dealt++;
      const mine = hand.final.actions.filter((a) => a.seat === seat);
      const preflop = mine.filter((a) => a.street === 'preflop');
      if (preflop.some((a) => a.type === 'call' || a.type === 'raise')) c.vpip++;
      if (preflop.some((a) => a.type === 'raise')) c.pfr++;
      for (const a of mine) {
        if (a.street === 'preflop') continue;
        if (a.type === 'bet' || a.type === 'raise') c.aggressive++;
        else if (a.type === 'call') c.passive++;
      }
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
    stats.set(style, {
      vpip: pct(c.vpip, c.dealt),
      pfr: pct(c.pfr, c.dealt),
      aggression: pct(c.aggressive, c.aggressive + c.passive),
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
  'TAG and Rock are inside their style bands over 100,000 Mixed 6-max hands (seed 42)',
  () => expectInBands(42),
  TEST_TIMEOUT_MS,
);

describe('TAG and Rock are inside their style bands over 100,000 Mixed 6-max hands (seeds 7 and 1234)', () => {
  for (const seed of [7, 1234]) {
    it.runIf(SLOW)(`seed ${seed}`, () => expectInBands(seed), TEST_TIMEOUT_MS);
  }
});
