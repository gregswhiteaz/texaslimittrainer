import { describe, expect, it } from 'vitest';
import {
  HEALTHY_RANGES,
  parseHealthyRanges,
  styleSection,
  type HealthyRanges,
  type StyleSection,
} from '../../src/stats/healthy-ranges';
import type { StyleCounts } from '../../src/stats/style-stats';
import data from '../../src/stats/healthy-ranges.json' with { type: 'json' };

// Spec §5: the authored ranges, low–high.
const EXPECTED = {
  'heads-up': {
    vpip: [65, 90],
    pfr: [40, 75],
    aggression: [50, 70],
    wtsd: [40, 55],
    wsd: [46, 56],
  },
  '6-max': { vpip: [20, 28], pfr: [14, 22], aggression: [50, 66], wtsd: [30, 42], wsd: [47, 57] },
  'full-ring': {
    vpip: [13, 20],
    pfr: [9, 16],
    aggression: [50, 66],
    wtsd: [28, 40],
    wsd: [47, 57],
  },
} as const;

const SIX_MAX_VPIP_JUSTIFICATION =
  'At six players about one hand in four is strong enough to play, because the blinds come round often but several opponents still act after you.';

/** Every denominator > 0. */
const COUNTS: StyleCounts = {
  handsDealt: 100,
  voluntary: 25,
  preflopRaised: 18,
  postflopAggressive: 11,
  postflopCalls: 9,
  sawFlop: 20,
  showdowns: 6,
  showdownsWon: 3,
};

const rangesOf = (section: StyleSection): string[] => section.rows.map((r) => r.range);
const expectedRanges = (size: keyof HealthyRanges): string[] =>
  (['vpip', 'pfr', 'aggression', 'wtsd', 'wsd'] as const).map(
    (k) => `${HEALTHY_RANGES[size][k].low}–${HEALTHY_RANGES[size][k].high}%`,
  );

describe('healthy ranges acceptance', () => {
  it('AC#1 the data file holds 15 ranges, each low < high with a justification sentence', () => {
    const ranges = parseHealthyRanges(data);
    expect(Object.keys(ranges)).toEqual(['heads-up', '6-max', 'full-ring']);
    let count = 0;
    for (const size of Object.keys(EXPECTED) as (keyof typeof EXPECTED)[]) {
      expect(Object.keys(ranges[size])).toEqual(['vpip', 'pfr', 'aggression', 'wtsd', 'wsd']);
      for (const [stat, [low, high]] of Object.entries(EXPECTED[size])) {
        const range = ranges[size][stat as keyof (typeof ranges)[typeof size]];
        expect([range.low, range.high], `${size} ${stat}`).toEqual([low, high]);
        expect(Number.isInteger(range.low) && Number.isInteger(range.high)).toBe(true);
        expect(range.low).toBeGreaterThanOrEqual(0);
        expect(range.high).toBeLessThanOrEqual(100);
        expect(range.low).toBeLessThan(range.high);
        const j = range.justification;
        expect(j.trim(), `${size} ${stat}`).toBe(j);
        expect(j.length).toBeGreaterThan(20);
        expect(j.endsWith('.')).toBe(true);
        expect(j).not.toMatch(/[.!?]\s/);
        count++;
      }
    }
    expect(count).toBe(15);
    expect(ranges['6-max'].vpip.justification).toBe(SIX_MAX_VPIP_JUSTIFICATION);
    expect(HEALTHY_RANGES).toEqual(ranges);
  });

  it('AC#4 VPIP 28.0 and 20.0 are in range, 28.1 too high, 19.9 too low', () => {
    const fixture: HealthyRanges = {
      ...HEALTHY_RANGES,
      '6-max': {
        ...HEALTHY_RANGES['6-max'],
        vpip: { low: 20, high: 28, justification: 'Fixture.' },
      },
    };
    const vpip = (voluntary: number) =>
      styleSection(6, { ...COUNTS, handsDealt: 1000, voluntary, preflopRaised: 0 }, fixture)
        .rows[0];
    const cases = [
      [280, '28.0%', 'in range'],
      [200, '20.0%', 'in range'],
      [281, '28.1%', 'too high'],
      [199, '19.9%', 'too low'],
    ] as const;
    for (const [voluntary, value, label] of cases) {
      expect(vpip(voluntary)).toEqual({ key: 'vpip', name: 'VPIP', value, range: '20–28%', label });
    }
  });

  it('AC#5 2 and 10 players use heads-up and full-ring ranges, not approximate', () => {
    const two = styleSection(2, COUNTS);
    expect([two.reference, two.approximate, two.title]).toEqual([
      'heads-up',
      false,
      'Your style vs healthy range (heads-up)',
    ]);
    expect(rangesOf(two)).toEqual(expectedRanges('heads-up'));
    const ten = styleSection(10, COUNTS);
    expect([ten.reference, ten.approximate, ten.title]).toEqual([
      'full-ring',
      false,
      'Your style vs healthy range (full ring)',
    ]);
    expect(rangesOf(ten)).toEqual(expectedRanges('full-ring'));
    const six = styleSection(6, COUNTS);
    expect([six.reference, six.approximate, six.title]).toEqual([
      '6-max',
      false,
      'Your style vs healthy range (6-max)',
    ]);
    expect(rangesOf(six)).toEqual(expectedRanges('6-max'));
    const nine = styleSection(9, COUNTS);
    expect([nine.reference, nine.approximate, nine.title]).toEqual([
      'full-ring',
      false,
      'Your style vs healthy range (full ring)',
    ]);
    for (const section of [two, ten, six, nine]) {
      expect(section.rows.map((r) => r.label)).not.toContain('not enough data');
    }
  });

  it('AC#6 4 and 8 players use 6-max and full-ring ranges marked approximate', () => {
    const four = styleSection(4, COUNTS);
    expect([four.reference, four.approximate, four.title]).toEqual([
      '6-max',
      true,
      'Your style vs healthy range (6-max, approximate)',
    ]);
    expect(rangesOf(four)).toEqual(expectedRanges('6-max'));
    const eight = styleSection(8, COUNTS);
    expect([eight.reference, eight.approximate, eight.title]).toEqual([
      'full-ring',
      true,
      'Your style vs healthy range (full ring, approximate)',
    ]);
    expect(rangesOf(eight)).toEqual(expectedRanges('full-ring'));
    for (const players of [3, 5, 7]) {
      const section = styleSection(players, COUNTS);
      expect([section.reference, section.approximate, section.title]).toEqual([
        '6-max',
        true,
        'Your style vs healthy range (6-max, approximate)',
      ]);
    }
    expect(() => styleSection(1, COUNTS)).toThrow(RangeError);
    expect(() => styleSection(11, COUNTS)).toThrow(RangeError);
  });

  it('AC#7 a session without a flop shows WTSD and W$SD as — with not enough data', () => {
    const section = styleSection(6, {
      handsDealt: 10,
      voluntary: 2,
      preflopRaised: 1,
      postflopAggressive: 0,
      postflopCalls: 0,
      sawFlop: 0,
      showdowns: 0,
      showdownsWon: 0,
    });
    expect(section.rows.map((r) => [r.name, r.value, r.label])).toEqual([
      ['VPIP', '20.0%', 'in range'],
      ['PFR', '10.0%', 'too low'],
      ['Aggression', '—', 'not enough data'],
      ['WTSD', '—', 'not enough data'],
      ['W$SD', '—', 'not enough data'],
    ]);
  });
});
