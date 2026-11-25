import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  BB100_GOAL,
  BB100_NOTE,
  bb100ChartLabel,
  bb100PointLabel,
  bb100Value,
  moreCashHandsMessage,
  chartLabel,
  countText,
  moreHandsMessage,
  orderHands,
  pointLabel,
  statisticsView,
  totalsLine,
  trendHand,
  type StatisticsView,
  type TrendHand,
} from '../../src/stats/trends';
import { netResult } from '../../src/table/review';
import { CASH_STAKES } from '../../src/table/session';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { cashPool, sitAndGoPool } from '../support/stat-records';

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const C = 'c'.repeat(32);

const hand = (
  sessionId: string,
  handNumber: number,
  completedAt: string,
  majors = 0,
): TrendHand => ({
  sessionId,
  handNumber,
  completedAt,
  unhintedMajors: majors,
});

/** `n` hands in session A, one Major each in hands listed in `majorHands`. */
const handsOf = (n: number, majorHands: readonly number[] = []): TrendHand[] =>
  Array.from({ length: n }, (_, i) =>
    hand(A, i + 1, '2026-11-01T00:00:00.000Z', majorHands.includes(i + 1) ? 1 : 0),
  );

describe('trends', () => {
  it('orders, groups, counts and words the trend view', () => {
    // B started first by its record; A's record is missing, so its earliest completedAt (later) counts; C ties
    // with B on start and sorts after it by sessionId.
    const hands = [
      hand(A, 2, '2026-11-02T00:00:05.000Z'),
      hand(C, 1, '2026-11-01T00:00:09.000Z'),
      hand(A, 1, '2026-11-02T00:00:09.000Z'),
      hand(B, 2, '2026-11-01T00:00:02.000Z'),
      hand(B, 1, '2026-11-01T00:00:01.000Z'),
    ];
    const sessionStarts = new Map([
      [B, '2026-11-01T00:00:00.000Z'],
      [C, '2026-11-01T00:00:00.000Z'],
    ]);
    expect(orderHands({ hands, sessionStarts }).map((h) => [h.sessionId, h.handNumber])).toEqual([
      [B, 1],
      [B, 2],
      [C, 1],
      [A, 1],
      [A, 2],
    ]);

    const decisions = [
      { grade: { grade: 'major' as const }, hinted: false },
      { grade: { grade: 'major' as const }, hinted: true },
      { grade: { grade: 'minor' as const }, hinted: false },
      { grade: { grade: 'major' as const }, hinted: false },
      { grade: { grade: 'correct' as const }, hinted: false },
    ];
    expect(
      trendHand({
        sessionId: A,
        handNumber: 3,
        completedAt: '2026-11-01T00:00:00.000Z',
        decisions,
      }),
    ).toEqual({
      sessionId: A,
      handNumber: 3,
      completedAt: '2026-11-01T00:00:00.000Z',
      unhintedMajors: 2,
    });

    const view = statisticsView({
      hands,
      sessionStarts: new Map([[B, '2026-11-01T00:00:00.000Z']]),
    });
    expect(view.sessions).toBe(3);
    expect(view.totals).toBe('5 hands over 3 sessions');

    expect(countText(0)).toBe('0');
    expect(countText(999)).toBe('999');
    expect(countText(1000)).toBe('1,000');
    expect(countText(1840)).toBe('1,840');
    expect(countText(100000)).toBe('100,000');
    expect(countText(1234567)).toBe('1,234,567');
    expect(totalsLine(1, 1)).toBe('1 hand over 1 session');
    expect(totalsLine(0, 0)).toBe('0 hands over 0 sessions');
    expect(totalsLine(1840, 9)).toBe('1,840 hands over 9 sessions');
    expect(moreHandsMessage(1)).toBe('Play 1 more hand to see your first trend point.');
    expect(moreHandsMessage(499)).toBe('Play 499 more hands to see your first trend point.');

    const empty = statisticsView({
      hands: [],
      sessionStarts: new Map([[A, '2026-11-01T00:00:00.000Z']]),
    });
    expect(empty).toEqual({
      hands: 0,
      sessions: 0,
      totals: '0 hands over 0 sessions',
      chart: { kind: 'no-hands' },
      bb100: { kind: 'no-cash' },
    });
    expect(statisticsView({ hands: handsOf(1), sessionStarts: new Map() }).chart).toEqual({
      kind: 'more-hands',
      needed: 499,
    });
    expect(statisticsView({ hands: handsOf(499), sessionStarts: new Map() }).chart).toEqual({
      kind: 'more-hands',
      needed: 1,
    });
    expect(
      statisticsView({ hands: handsOf(500, [1, 250, 500]), sessionStarts: new Map() }).chart,
    ).toEqual({
      kind: 'points',
      points: [{ firstHand: 1, lastHand: 500, majorPer100: 0.6 }],
    });
  });

  it('words each point and the chart label', () => {
    const points = [
      { firstHand: 1, lastHand: 500, majorPer100: 2 },
      { firstHand: 501, lastHand: 1000, majorPer100: 1.8 },
    ];
    expect(pointLabel(points[1] as (typeof points)[number])).toBe('Hands 501–1,000: 1.8');
    expect(chartLabel(points)).toBe(
      'Major errors per 100 hands, one point per 500 hands: 2.0, 1.8',
    );
  });

  it('rounds a point like the report tiles', () => {
    // 3 Majors in 500 hands = 0.6; 1 Major = 0.2.
    const ordered = handsOf(1000, [7, 8, 9, 900]);
    const view = statisticsView({ hands: ordered, sessionStarts: new Map() });
    expect(view.chart).toEqual({
      kind: 'points',
      points: [
        { firstHand: 1, lastHand: 500, majorPer100: 0.6 },
        { firstHand: 501, lastHand: 1000, majorPer100: 0.2 },
      ],
    });
  });

  it('computes cash net, BB/100 groups, messages and break-even geometry', () => {
    const [cashRecord] = cashPool(CASH_STAKES[2] as (typeof CASH_STAKES)[number], 1);
    const [sngRecord] = sitAndGoPool(1);
    const cashHand = trendHand(cashRecord as NonNullable<typeof cashRecord>);
    expect(cashHand.cash).toEqual({
      net: netResult(cashRecord as NonNullable<typeof cashRecord>),
      bigBet: 8,
    });
    expect('cash' in trendHand(sngRecord as NonNullable<typeof sngRecord>)).toBe(false);
    expect('cash' in trendHand({ ...hand(A, 1, '2026-11-01T00:00:00.000Z'), decisions: [] })).toBe(
      false,
    );

    const cashOf = (net: number, bigBet: number, n = 1): TrendHand => ({
      ...hand(A, n, '2026-11-01T00:00:00.000Z'),
      cash: { net, bigBet },
    });
    // +12 at $4/$8 and −20 at $10/$20: (1.5 − 1) / 2 × 100 = 25.
    expect(bb100Value([cashOf(12, 8), cashOf(-20, 20)])).toBe(25);
    // 500 hands at $4/$8 with Σ net = −52: −52 / 8 / 500 × 100 = −1.3.
    expect(
      bb100Value(Array.from({ length: 500 }, (_, i) => cashOf(i === 0 ? -52 : 0, 8, i + 1))),
    ).toBe(-1.3);
    expect(() => bb100Value([])).toThrow(new RangeError('bb100Value needs cash hands'));
    expect(() => bb100Value([cashOf(8, 8), hand(A, 2, '2026-11-01T00:00:00.000Z')])).toThrow(
      RangeError,
    );

    const cashHands = (n: number): TrendHand[] =>
      Array.from({ length: n }, (_, i) => cashOf(i % 2 === 0 ? 8 : -4, 8, i + 1));
    expect(statisticsView({ hands: cashHands(500), sessionStarts: new Map() }).bb100).toEqual({
      kind: 'points',
      points: [{ firstHand: 1, lastHand: 500, bb100: 25 }],
    });
    expect(statisticsView({ hands: cashHands(499), sessionStarts: new Map() }).bb100).toEqual({
      kind: 'more-cash',
      needed: 1,
    });
    expect(moreCashHandsMessage(200)).toBe(
      'Play 200 more cash hands to see your first trend point.',
    );
    expect(moreCashHandsMessage(1)).toBe('Play 1 more cash hand to see your first trend point.');
    expect(moreCashHandsMessage(1500)).toBe(
      'Play 1,500 more cash hands to see your first trend point.',
    );

    expect(bb100PointLabel({ firstHand: 501, lastHand: 1000, bb100: 2.7 })).toBe(
      'Cash hands 501–1,000: +2.7',
    );
    expect(
      bb100ChartLabel([
        { firstHand: 1, lastHand: 500, bb100: 2.7 },
        { firstHand: 501, lastHand: 1000, bb100: -1.3 },
      ]),
    ).toBe('Big bets won per 100 hands, one point per 500 cash hands: +2.7, -1.3');
    expect(BB100_GOAL).toBe('Dashed line: break-even');
    expect(BB100_NOTE).toBe(
      'Each point is 500 cash hands. Above the dashed line means you are winning.',
    );

    const bbSvg = (values: readonly number[]): string => {
      const view: StatisticsView = {
        hands: 0,
        sessions: 0,
        totals: '',
        chart: { kind: 'no-hands' },
        bb100: {
          kind: 'points',
          points: values.map((bb100, i) => ({
            firstHand: 500 * i + 1,
            lastHand: 500 * i + 500,
            bb100,
          })),
        },
      };
      return renderToString(createElement(StatisticsScreen, { view, onHome: () => undefined }));
    };
    const twoPoints = bbSvg([2, -1]);
    expect(twoPoints).toContain('y1="103.3"');
    expect(twoPoints).toMatch(/<circle data-bb100-point="" cx="10" cy="10"/);
    expect(twoPoints).toMatch(/<circle data-bb100-point="" cx="390" cy="150"/);
    expect(twoPoints).toContain('points="10,10 390,150"');
    const zero = bbSvg([0]);
    expect(zero).toContain('y1="80"');
    expect(zero).toMatch(/<circle data-bb100-point="" cx="200" cy="80"/);
    expect(zero).toContain('<title>Cash hands 1–500: 0.0</title>');
  });
});
