import { describe, expect, it } from 'vitest';
import {
  chartLabel,
  countText,
  moreHandsMessage,
  orderHands,
  pointLabel,
  statisticsView,
  totalsLine,
  trendHand,
  type TrendHand,
} from '../../src/stats/trends';

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
});
