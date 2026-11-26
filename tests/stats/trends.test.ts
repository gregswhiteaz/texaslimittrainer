import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  ALL_TRENDS,
  BB100_GOAL,
  BB100_NOTE,
  CHART_NOTE,
  G2_CAPTION,
  bb100ChartLabel,
  bb100Note,
  bb100PointLabel,
  bb100Value,
  chartNote,
  dayText,
  localDay,
  moreCashHandsMessage,
  chartLabel,
  countText,
  filterTrendData,
  g2Target,
  moreHandsMessage,
  orderHands,
  pointLabel,
  statisticsView,
  totalsLine,
  trendHand,
  type GameTypeFilter,
  type StatisticsView,
  type TableSizeFilter,
  type TrendData,
  type TrendHand,
} from '../../src/stats/trends';
import { netResult } from '../../src/table/review';
import { bbPer100 } from '../../src/table/session-report';
import { CASH_STAKES } from '../../src/table/session';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { cashPool, sitAndGoPool } from '../support/stat-records';

vi.setConfig({ testTimeout: 30_000 });

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
      g2Target: null,
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
        g2Target: null,
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

describe('G-2 target', () => {
  /** `n` hands in session A with `majors` unhinted Majors spread one per hand from hand `from` (1-based). */
  const withMajors = (n: number, majors: number, from = 1): TrendHand[] =>
    handsOf(
      n,
      Array.from({ length: majors }, (_, i) => from + i),
    );

  const majorSvg = (values: readonly number[], target: number | null): string => {
    const view: StatisticsView = {
      hands: 0,
      sessions: 0,
      totals: '',
      chart: {
        kind: 'points',
        points: values.map((majorPer100, i) => ({
          firstHand: 500 * i + 1,
          lastHand: 500 * i + 500,
          majorPer100,
        })),
      },
      bb100: { kind: 'no-cash' },
      g2Target: target,
    };
    const html = renderToString(createElement(StatisticsScreen, { view, onHome: () => undefined }));
    return html.slice(0, html.indexOf('aria-labelledby="stats-bb100-title"'));
  };

  it('computes the G-2 target, its label and line geometry', () => {
    expect(g2Target(withMajors(999, 62))).toBeNull();
    expect(g2Target(withMajors(1000, 62))).toBe(3.1);
    expect(g2Target(withMajors(1000, 63))).toBe(3.2);
    expect(g2Target(withMajors(1000, 0))).toBe(0);
    const later = withMajors(1200, 62).map((h, i) => (i >= 1000 ? { ...h, unhintedMajors: 3 } : h));
    expect(g2Target(later)).toBe(3.1);

    const data = { hands: withMajors(1000, 62), sessionStarts: new Map<string, string>() };
    expect(statisticsView(data)).toEqual(statisticsView(data, data));
    expect(statisticsView(data).g2Target).toBe(3.1);
    const few = { hands: data.hands.slice(0, 500), sessionStarts: new Map<string, string>() };
    expect(statisticsView(few).g2Target).toBeNull();
    expect(statisticsView(few, data).g2Target).toBe(3.1);
    expect(statisticsView(data, few).g2Target).toBeNull();

    expect(G2_CAPTION).toBe('Dashed line: half your first-1,000 rate (G-2)');
    const points = [
      { firstHand: 1, lastHand: 500, majorPer100: 6.2 },
      { firstHand: 501, lastHand: 1000, majorPer100: 6.2 },
    ];
    expect(chartLabel(points)).toBe(
      'Major errors per 100 hands, one point per 500 hands: 6.2, 6.2',
    );
    expect(chartLabel(points, null)).toBe(chartLabel(points));
    expect(chartLabel(points, 3.1)).toBe(
      'Major errors per 100 hands, one point per 500 hands: 6.2, 6.2. Dashed target line at 3.1',
    );
    expect(chartLabel(points, 0)).toMatch(/\. Dashed target line at 0\.0$/);

    const line = (ty: number): string =>
      `<line x1="0" y1="${ty}" x2="400" y2="${ty}" stroke-dasharray="6 5" class="stats-target"></line>`;
    const both = majorSvg([6.2, 6.2], 3.1);
    expect(both).toContain(line(80));
    expect(both).toMatch(/<circle data-point="" cx="10" cy="10"/);
    expect(both).toContain(`<p class="stats-goal">${G2_CAPTION}</p><svg`);
    const above = majorSvg([1], 3.1);
    expect(above).toContain(line(10));
    expect(above).toMatch(/<circle data-point="" cx="200" cy="104.8"/);
    expect(majorSvg([6.2, 6.2], 0)).toContain(line(150));

    // Without a target the markup is exactly what it was before TASK-11.3.
    const none = majorSvg([2, 1], null);
    expect(none).toContain(
      '<svg class="stats-trend" viewBox="0 0 400 160" role="img" aria-label="Major errors per 100 hands, one point per 500 hands: 2.0, 1.0">' +
        '<line x1="0" y1="150" x2="400" y2="150" class="stats-baseline"></line>' +
        '<polyline points="10,10 390,80" class="stats-line"></polyline>' +
        '<circle data-point="" cx="10" cy="10" r="5" class="stats-dot"><title>Hands 1–500: 2.0</title></circle>' +
        '<circle data-point="" cx="390" cy="80" r="5" class="stats-dot"><title>Hands 501–1,000: 1.0</title></circle>' +
        '</svg><p class="stats-note">Each point is 500 hands. Lower is better.</p>',
    );
    expect(none).not.toContain('stats-target');
    expect(none).not.toContain('stats-goal');
  });
});

describe('trend filters', () => {
  it('filters trend data by table size and game type', () => {
    const [cashRecord] = cashPool(CASH_STAKES[2] as (typeof CASH_STAKES)[number], 1, 9);
    const [sngRecord] = sitAndGoPool(1, 2);
    const cashHand = trendHand(cashRecord as NonNullable<typeof cashRecord>);
    expect(cashHand.dealtIn).toBe(9);
    expect(trendHand(sngRecord as NonNullable<typeof sngRecord>).dealtIn).toBe(2);

    const at = '2026-11-01T00:00:00.000Z';
    const dealt = (sessionId: string, handNumber: number, dealtIn: number, cash = false) => ({
      ...hand(sessionId, handNumber, at),
      dealtIn,
      ...(cash && { cash: cashHand.cash }),
    });
    // A: a sit-and-go dealing 6 then 2 seats (6-max). B: heads-up, cash and sit-and-go hands. C: no dealtIn.
    // D: full-ring cash. E: an impossible size of 11 that matches no size.
    const hands: TrendHand[] = [
      dealt(B, 2, 2, true),
      dealt(A, 2, 2),
      hand(C, 1, at),
      dealt(A, 1, 6),
      dealt('d'.repeat(32), 1, 9, true),
      dealt(B, 1, 2),
      dealt('e'.repeat(32), 1, 11),
    ];
    const sessionStarts = new Map([[A, at]]);
    const data: TrendData = { hands, sessionStarts };
    const keep = (tableSize: TableSizeFilter, gameType: GameTypeFilter): string[] => {
      const filtered = filterTrendData(data, { tableSize, gameType });
      expect(filtered.sessionStarts).toBe(sessionStarts);
      return filtered.hands.map((h) => `${h.sessionId[0]}${h.handNumber}`);
    };

    expect(filterTrendData(data, ALL_TRENDS)).toBe(data);
    expect(keep('6-max', 'all')).toEqual(['a2', 'a1']);
    expect(keep('heads-up', 'all')).toEqual(['b2', 'b1']);
    expect(keep('full-ring', 'all')).toEqual(['d1']);
    expect(keep('heads-up', 'cash')).toEqual(['b2']);
    expect(keep('heads-up', 'sit-and-go')).toEqual(['b1']);
    expect(keep('all', 'cash')).toEqual(['b2', 'd1']);
    expect(keep('all', 'sit-and-go')).toEqual(['a2', 'c1', 'a1', 'b1', 'e1']);
  });
});

describe('trend grouping', () => {
  it('default grouping matches the per-500 view and texts', () => {
    const [cashRecord] = cashPool(CASH_STAKES[2] as (typeof CASH_STAKES)[number], 1);
    const cash = trendHand(cashRecord as NonNullable<typeof cashRecord>).cash;
    const hands = Array.from({ length: 1200 }, (_, i) => ({
      ...hand(
        i < 700 ? A : B,
        (i % 700) + 1,
        `2026-11-0${i < 700 ? 1 : 2}T10:00:00.000Z`,
        i % 9 ? 0 : 1,
      ),
      ...(i % 2 === 0 && { cash }),
    }));
    const all: TrendData = { hands, sessionStarts: new Map([[A, '2026-11-01T09:00:00.000Z']]) };
    const data: TrendData = { ...all, hands: hands.slice(0, 1100) };
    const view = statisticsView(data);
    expect(statisticsView(data, data)).toEqual(view);
    expect(statisticsView(data, data, 'hands')).toEqual(view);
    expect(statisticsView(data, all, 'hands')).toEqual(statisticsView(data, all));
    expect(view.chart.kind).toBe('points');
    expect(view.bb100.kind).toBe('points');
    const points = view.chart.kind === 'points' ? view.chart.points : [];
    const bb100 = view.bb100.kind === 'points' ? view.bb100.points : [];
    for (const p of points)
      expect(Object.keys(p)).toEqual(['firstHand', 'lastHand', 'majorPer100']);
    for (const p of bb100) expect(Object.keys(p)).toEqual(['firstHand', 'lastHand', 'bb100']);

    expect(chartNote('hands')).toBe(CHART_NOTE);
    expect(bb100Note('hands')).toBe(BB100_NOTE);
    const p = { firstHand: 501, lastHand: 1000, majorPer100: 1.8 };
    expect(pointLabel(p)).toBe('Hands 501–1,000: 1.8');
    expect(chartLabel([p], 0.9)).toBe(
      'Major errors per 100 hands, one point per 500 hands: 1.8. Dashed target line at 0.9',
    );
    const b = { firstHand: 1, lastHand: 500, bb100: -0.8 };
    expect(bb100PointLabel(b)).toBe('Cash hands 1–500: -0.8');
    expect(bb100ChartLabel([b])).toBe(
      'Big bets won per 100 hands, one point per 500 cash hands: -0.8',
    );
  });

  it('session and day grouping helpers and texts', () => {
    expect(localDay(new Date(2026, 10, 5, 0, 0, 0).toISOString())).toBe('2026-11-05');
    expect(localDay(new Date(2026, 10, 4, 23, 59, 59, 999).toISOString())).toBe('2026-11-04');
    expect(localDay(new Date(2027, 0, 31, 12).getTime())).toBe('2027-01-31');
    expect(dayText('2026-11-05')).toBe('5 Nov 2026');
    expect(dayText('2027-01-31')).toBe('31 Jan 2027');

    const at = (day: number, hour: number): string => new Date(2026, 10, day, hour).toISOString();
    // A has no session record: its earliest completedAt (10 Nov) places it first. B and C share a start on
    // 11 Nov and order by sessionId. B's second hand completes on 12 Nov.
    const hands = [
      hand(C, 1, at(11, 20), 1),
      hand(B, 2, at(12, 1)),
      hand(A, 2, at(10, 9), 1),
      hand(B, 1, at(11, 18)),
      hand(A, 1, at(10, 8)),
    ];
    const data: TrendData = {
      hands,
      sessionStarts: new Map([
        [C, at(11, 17)],
        [B, at(11, 17)],
      ]),
    };
    const bySession = statisticsView(data, data, 'session');
    expect(bySession.chart).toEqual({
      kind: 'points',
      points: [
        {
          firstHand: 1,
          lastHand: 2,
          majorPer100: 50,
          group: { kind: 'session', number: 1, day: '2026-11-10' },
        },
        {
          firstHand: 3,
          lastHand: 4,
          majorPer100: 0,
          group: { kind: 'session', number: 2, day: '2026-11-11' },
        },
        {
          firstHand: 5,
          lastHand: 5,
          majorPer100: 100,
          group: { kind: 'session', number: 3, day: '2026-11-11' },
        },
      ],
    });
    expect(bySession.bb100).toEqual({ kind: 'no-cash' });
    const byDay = statisticsView(data, data, 'day');
    expect(byDay.chart).toEqual({
      kind: 'points',
      points: [
        { firstHand: 1, lastHand: 2, majorPer100: 50, group: { kind: 'day', day: '2026-11-10' } },
        { firstHand: 3, lastHand: 4, majorPer100: 50, group: { kind: 'day', day: '2026-11-11' } },
        { firstHand: 5, lastHand: 5, majorPer100: 0, group: { kind: 'day', day: '2026-11-12' } },
      ],
    });

    const session = { kind: 'session', number: 3, day: '2026-11-10' } as const;
    const day = { kind: 'day', day: '2026-11-10' } as const;
    expect(pointLabel({ firstHand: 1, lastHand: 9, majorPer100: 4.2, group: session })).toBe(
      'Session 3, 10 Nov 2026: 4.2',
    );
    expect(pointLabel({ firstHand: 1, lastHand: 9, majorPer100: 4.2, group: day })).toBe(
      '10 Nov 2026: 4.2',
    );
    expect(bb100PointLabel({ firstHand: 1, lastHand: 9, bb100: 1.5, group: session })).toBe(
      'Session 3, 10 Nov 2026: +1.5',
    );
    expect(bb100PointLabel({ firstHand: 1, lastHand: 9, bb100: -0.8, group: day })).toBe(
      '10 Nov 2026: -0.8',
    );
    const majors = [{ firstHand: 1, lastHand: 9, majorPer100: 4.2, group: day }];
    expect(chartLabel(majors, null, 'session')).toBe(
      'Major errors per 100 hands, one point per session: 4.2',
    );
    expect(chartLabel(majors, 3.1, 'day')).toBe(
      'Major errors per 100 hands, one point per day: 4.2. Dashed target line at 3.1',
    );
    const bbs = [{ firstHand: 1, lastHand: 9, bb100: 1.5, group: day }];
    expect(bb100ChartLabel(bbs, 'session')).toBe(
      'Big bets won per 100 hands, one point per session: +1.5',
    );
    expect(bb100ChartLabel(bbs, 'day')).toBe('Big bets won per 100 hands, one point per day: +1.5');
    expect(chartNote('session')).toBe('Each point is one session. Lower is better.');
    expect(chartNote('day')).toBe('Each point is one day. Lower is better.');
    expect(bb100Note('session')).toBe(
      "Each point is one session's cash hands. Above the dashed line means you are winning.",
    );
    expect(bb100Note('day')).toBe(
      "Each point is one day's cash hands. Above the dashed line means you are winning.",
    );

    const html = renderToString(
      createElement(StatisticsScreen, { view: byDay, onHome: () => undefined, grouping: 'day' }),
    ).replace(/<!-- -->/g, '');
    expect(html).toContain('<p class="stats-note">Each point is one day. Lower is better.</p>');
    expect(html).toContain(
      'aria-label="Major errors per 100 hands, one point per day: 50.0, 50.0, 0.0"',
    );
  });

  it('line-up filter keeps matching hands and carries lineUp from records', () => {
    const source = {
      sessionId: A,
      handNumber: 1,
      completedAt: '2026-11-01T00:00:00.000Z',
      decisions: [],
    };
    expect(trendHand({ ...source, lineUp: 'Tough' }).lineUp).toBe('Tough');
    expect('lineUp' in trendHand(source)).toBe(false);

    const cash = { net: 4, bigBet: 8 };
    const tough1: TrendHand = { ...hand(A, 1, '2026-11-01T00:00:01.000Z'), cash, lineUp: 'Tough' };
    const custom: TrendHand = { ...hand(B, 1, '2026-11-01T00:00:02.000Z'), cash, lineUp: 'Custom' };
    const bare: TrendHand = hand(C, 1, '2026-11-01T00:00:03.000Z');
    const toughSng: TrendHand = { ...hand(B, 2, '2026-11-01T00:00:04.000Z'), lineUp: 'Tough' };
    const tough2: TrendHand = { ...hand(A, 2, '2026-11-01T00:00:05.000Z'), cash, lineUp: 'Tough' };
    const data: TrendData = {
      hands: [tough2, custom, bare, toughSng, tough1],
      sessionStarts: new Map([[A, '2026-11-01T00:00:00.000Z']]),
    };

    expect(filterTrendData(data, ALL_TRENDS)).toBe(data);
    expect(filterTrendData(data, { tableSize: 'all', gameType: 'all' })).toBe(data);

    const tough = filterTrendData(data, { tableSize: 'all', gameType: 'all', lineUp: 'Tough' });
    expect(tough.hands).toEqual([tough2, toughSng, tough1]);
    expect(tough.sessionStarts).toBe(data.sessionStarts);
    for (const lineUp of ['Mixed', 'Tough', 'Soft', 'Custom'] as const) {
      const kept = filterTrendData(data, { ...ALL_TRENDS, lineUp }).hands;
      expect(kept).not.toContain(bare);
      expect(kept.every((h) => h.lineUp === lineUp)).toBe(true);
    }
    expect(filterTrendData(data, { ...ALL_TRENDS, gameType: 'sit-and-go' }).hands).toContain(bare);
    expect(
      filterTrendData(data, { tableSize: 'all', gameType: 'cash', lineUp: 'Tough' }).hands,
    ).toEqual([tough2, tough1]);
  });
});

describe('BB/100 hardening (TASK-11.14)', () => {
  /** The first `n` primes. */
  const primes = (n: number): number[] => {
    const found: number[] = [];
    for (let k = 2; found.length < n; k++) {
      if (found.every((p) => p * p > k || k % p !== 0)) found.push(k);
    }
    return found;
  };
  const cashOf = (net: number, bigBet: number, n = 1): TrendHand => ({
    ...hand(A, n, '2026-11-01T00:00:00.000Z'),
    cash: { net, bigBet },
  });

  it('bb100Value keeps exact rounding for real stakes and stays finite for tampered ones', () => {
    expect(bb100Value([cashOf(12, 8), cashOf(-20, 20)])).toBe(25);
    expect(
      bb100Value(Array.from({ length: 500 }, (_, i) => cashOf(i === 0 ? -52 : 0, 8, i + 1))),
    ).toBe(-1.3);
    // −46 / 4 + 57 / 40 = −10.075 → −503.75 exactly; the float sum would round to −503.7.
    expect(bb100Value([cashOf(-46, 4), cashOf(57, 40)])).toBe(-503.8);

    const sixteen = primes(16);
    const primeHands = (netOfFirst: number): TrendHand[] =>
      sixteen.map((bigBet, i) => cashOf(i === 0 ? netOfFirst : 0, bigBet, i + 1));
    expect(bb100Value(primeHands(1))).toBe(3.1);
    expect(bb100Value(primeHands(-1))).toBe(-3.1);
    expect(Object.is(bb100Value(primeHands(0)), 0)).toBe(true);
    // −2 / 2 / 16 × 100 = −6.25 exactly: half away from zero gives −6.3, Math.round would give −6.2.
    expect(bb100Value(primeHands(-2))).toBe(-6.3);
    expect(bb100Value(primes(500).map((bigBet, i) => cashOf(bigBet, bigBet, i + 1)))).toBe(100);
    // −1 / 3571 / 500 × 100 ≈ −5.6e-5 rounds to 0, never −0.
    const tinyLoss = primes(500).map((bigBet, i) =>
      cashOf(bigBet === 3571 ? -1 : 0, bigBet, i + 1),
    );
    expect(Object.is(bb100Value(tinyLoss), 0)).toBe(true);

    // Switch point: big bets 4, 40 and eight primes; LCM just below vs just above MAX_SAFE_INTEGER.
    const tieHands = (a: number, b: number, odd: readonly number[]): TrendHand[] => [
      cashOf(a, 4, 1),
      cashOf(b, 40, 2),
      ...odd.map((bigBet, i) => cashOf(0, bigBet, i + 3)),
    ];
    // LCM 5 354 760 272 292 280: exact −138.25 → −138.3; the float sum would give −138.2.
    expect(bb100Value(tieHands(-60, 47, [43, 47, 53, 59, 61, 67, 71, 73]))).toBe(-138.3);
    // LCM 9 837 815 383 978 840: the float sum gives −146.3; the unsafe "exact" path would give −146.2.
    expect(bb100Value(tieHands(-60, 15, [47, 53, 59, 61, 67, 71, 73, 79]))).toBe(-146.3);

    const nets = [7, -13, 3, 0, -25];
    for (const a of CASH_STAKES) {
      for (const b of CASH_STAKES) {
        const bigBets = [a.bigBet, b.bigBet, a.bigBet, b.bigBet, b.bigBet];
        const scaled = nets.reduce((s, net, i) => s + net * (120 / (bigBets[i] as number)), 0);
        expect(bb100Value(nets.map((net, i) => cashOf(net, bigBets[i] as number, i + 1)))).toBe(
          bbPer100(scaled, 120, nets.length),
        );
      }
    }
  });

  it('statisticsView gives finite BB/100 points for tampered stakes in every grouping', () => {
    const hands = primes(500).map((bigBet, i): TrendHand => ({
      ...hand(
        i < 250 ? A : B,
        i + 1,
        i < 250 ? '2026-11-01T12:00:00.000Z' : '2026-11-03T12:00:00.000Z',
      ),
      cash: { net: bigBet, bigBet },
    }));
    const data: TrendData = { hands, sessionStarts: new Map() };
    for (const grouping of ['hands', 'session', 'day'] as const) {
      const { bb100 } = statisticsView(data, data, grouping);
      expect(bb100.kind).toBe('points');
      const points = bb100.kind === 'points' ? bb100.points : [];
      expect(points.length).toBeGreaterThan(0);
      for (const point of points) expect(point.bb100).toBe(100);
    }
  });

  it('TrendSource rejects a cash source without its cash fields', () => {
    const source = { sessionId: A, handNumber: 1, completedAt: '2026-11-01T00:00:00.000Z' };
    // Type-checked only; never called.
    const typeChecks = (): void => {
      // @ts-expect-error a cash source needs stake, userSeat, actions and result.
      trendHand({ ...source, decisions: [], gameType: 'cash' });
      const noResult = {
        ...source,
        decisions: [],
        gameType: 'cash' as const,
        stake: { bigBet: 8 },
        userSeat: 1,
        actions: [],
      };
      // @ts-expect-error a cash source needs its result.
      trendHand(noResult);
    };
    expect(typeof typeChecks).toBe('function');

    const [record] = cashPool(CASH_STAKES[2] as (typeof CASH_STAKES)[number], 1);
    const cashRecord = record as NonNullable<typeof record>;
    expect(trendHand(cashRecord).cash).toEqual({
      net: netResult(cashRecord),
      bigBet: cashRecord.stake.bigBet,
    });
    expect('cash' in trendHand({ ...source, decisions: [] })).toBe(false);
  });

  it('all-negative BB/100 geometry puts break-even above every point', () => {
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
        g2Target: null,
      };
      return renderToString(createElement(StatisticsScreen, { view, onHome: () => undefined }));
    };
    const breakEven = (svg: string): RegExpExecArray | null =>
      /<line[^>]*stats-break-even[^>]*>/.exec(svg);
    const cys = (svg: string): number[] =>
      [...svg.matchAll(/<circle data-bb100-point="" cx="[^"]*" cy="([^"]*)"/g)].map((m) =>
        Number(m[1]),
      );

    const twoNegative = bbSvg([-2, -4]);
    const line = breakEven(twoNegative)?.[0] ?? '';
    expect(line).toContain('y1="38"');
    expect(line).toContain('y2="38"');
    expect(twoNegative).toMatch(/<circle data-bb100-point="" cx="10" cy="94"/);
    expect(twoNegative).toMatch(/<circle data-bb100-point="" cx="390" cy="150"/);
    expect(twoNegative).toContain('points="10,94 390,150"');
    expect(cys(twoNegative)).toHaveLength(2);
    for (const cy of cys(twoNegative)) expect(38).toBeLessThan(cy);

    const oneNegative = bbSvg([-3]);
    expect(breakEven(oneNegative)?.[0]).toContain('y1="45"');
    expect(oneNegative).toMatch(/<circle data-bb100-point="" cx="200" cy="150"/);
  });
});
