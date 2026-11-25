import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ALL_TRENDS,
  G2_CAPTION,
  NO_CASH_MESSAGE,
  NO_HANDS_MESSAGE,
  bb100Points,
  filterTrendData,
  majorErrorPoints,
  orderHands,
  pointLabel,
  statisticsView,
  totalsLine,
  trendHand,
  type StatisticsView,
  type TrendData,
  type TrendFilter,
  type TrendHand,
} from '../../src/stats/trends';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../../src/table/session';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { cashPool, sitAndGoPool } from '../support/stat-records';

// TASK-11.4: the table size and game type filters (AC#1–AC#8) at module and renderToString level.

const STAKE = CASH_STAKES.find((s) => s.bigBet === 8) as Stake;
const BIG_STAKE = CASH_STAKES.find((s) => s.bigBet === 20) as Stake;

/** A few really played hands, reduced to trend hands once and cloned to the counts each test needs. */
const poolOf = (records: readonly HandRecord[]): readonly TrendHand[] =>
  records.map((r) => trendHand(parseHandRecord(r)));
const POOL = {
  cash2: poolOf(cashPool(STAKE, 3, 2)),
  cash4: poolOf(cashPool(STAKE, 3, 4)),
  cash6: poolOf(cashPool(STAKE, 3, 6)),
  cash6big: poolOf(cashPool(BIG_STAKE, 3, 6)),
  cash8: poolOf(cashPool(STAKE, 3, 8)),
  cash10: poolOf(cashPool(STAKE, 3, 10)),
  sng2: poolOf(sitAndGoPool(3, 2)),
  sng6: poolOf(sitAndGoPool(3, 6)),
};

interface Part {
  readonly id: string;
  readonly pool: readonly TrendHand[];
  readonly hands: number;
  /** Unhinted Majors of hand n (1-based); 0 by default. */
  readonly majors?: (handNumber: number) => number;
}

/** Sessions of pool clones started an hour apart in the order given; the hands are returned in reverse, so a
 *  computation that relied on input order would differ. */
function trendData(layout: readonly Part[]): TrendData {
  const hands: TrendHand[] = [];
  const sessionStarts = new Map<string, string>();
  layout.forEach(({ id, pool, hands: count, majors }, hour) => {
    const sessionId = id.repeat(32);
    const start = Date.UTC(2026, 10, 1, hour);
    sessionStarts.set(sessionId, new Date(start).toISOString());
    for (let n = 1; n <= count; n++) {
      hands.push({
        ...(pool[(n - 1) % pool.length] as TrendHand),
        sessionId,
        handNumber: n,
        completedAt: new Date(start + n * 1000).toISOString(),
        unhintedMajors: majors?.(n) ?? 0,
      });
    }
  });
  return { hands: hands.reverse(), sessionStarts };
}

const filtered = (data: TrendData, filter: TrendFilter): StatisticsView =>
  statisticsView(filterTrendData(data, filter), data);

/** Markup with React's text separators removed. */
const render = (view: StatisticsView | undefined | null, filter?: TrendFilter): string =>
  renderToString(<StatisticsScreen view={view} onHome={() => undefined} filter={filter} />).replace(
    /<!-- -->/g,
    '',
  );

const majorCard = (html: string): string =>
  html.slice(
    html.indexOf('aria-labelledby="stats-major-title"'),
    html.indexOf('stats-bb100-title'),
  );
const bb100Card = (html: string): string => html.slice(html.indexOf('stats-bb100-title'));
const totals = (html: string): string | undefined =>
  /<p class="stats-totals">([^<]*)<\/p>/.exec(html)?.[1];

/** The options of the select wrapped by the label `label`: [value, text, selected]. */
function options(html: string, label: string): [string, string, boolean][] | undefined {
  const select = new RegExp(`<label>${label}<select[^>]*>(.*?)</select></label>`).exec(html)?.[1];
  if (select === undefined) return undefined;
  return [...select.matchAll(/<option value="([^"]*)"( selected="")?>([^<]*)<\/option>/g)].map(
    (m) => [m[1] as string, m[3] as string, m[2] !== undefined],
  );
}

const ids = (data: TrendData): string[] =>
  [...new Set(data.hands.map((h) => h.sessionId[0] as string))].sort();

describe('trend filters acceptance', () => {
  it('AC#1 lists the table size and game type options, each defaulting to All', () => {
    const view = statisticsView(trendData([{ id: '1', pool: POOL.cash6, hands: 10 }]));
    const html = render(view);
    expect(options(html, 'Table size')).toEqual([
      ['all', 'All', true],
      ['heads-up', 'Heads-up', false],
      ['6-max', '6-max', false],
      ['full-ring', 'Full ring', false],
    ]);
    expect(options(html, 'Game type')).toEqual([
      ['all', 'All', true],
      ['cash', 'Cash', false],
      ['sit-and-go', 'Sit-and-go', false],
    ]);

    const chosen = render(view, { tableSize: 'full-ring', gameType: 'cash' });
    expect(options(chosen, 'Table size')?.filter(([, , on]) => on)).toEqual([
      ['full-ring', 'Full ring', true],
    ]);
    expect(options(chosen, 'Game type')?.filter(([, , on]) => on)).toEqual([
      ['cash', 'Cash', true],
    ]);

    expect(render(undefined)).not.toContain('<select');
    expect(render(null)).not.toContain('<select');
  });

  it('AC#2 6-max counts 4- and 6-player sessions and Full ring 8- and 10-player sessions', () => {
    const data = trendData([
      { id: '6', pool: POOL.cash6, hands: 70 },
      { id: '2', pool: POOL.cash2, hands: 50 },
      { id: 'a', pool: POOL.cash10, hands: 90 },
      { id: '4', pool: POOL.cash4, hands: 60 },
      { id: '8', pool: POOL.cash8, hands: 80 },
    ]);
    const cases: [TrendFilter['tableSize'], number, number, string[]][] = [
      ['6-max', 130, 2, ['4', '6']],
      ['full-ring', 170, 2, ['8', 'a']],
      ['heads-up', 50, 1, ['2']],
      ['all', 350, 5, ['2', '4', '6', '8', 'a']],
    ];
    for (const [tableSize, hands, sessions, sessionIds] of cases) {
      const kept = filterTrendData(data, { tableSize, gameType: 'all' });
      expect(kept.hands, tableSize).toHaveLength(hands);
      expect(ids(kept), tableSize).toEqual(sessionIds);
      expect(filtered(data, { tableSize, gameType: 'all' }).totals, tableSize).toBe(
        totalsLine(hands, sessions),
      );
    }
  });

  it('AC#3 Sit-and-go points equal values recomputed from the sit-and-go hands', () => {
    const cashMajors = (n: number): number => (n % 10 === 0 ? 1 : 0);
    const sngMajors = (n: number): number => (n % 4 === 0 ? 1 : 0);
    const data = trendData([
      { id: '9', pool: POOL.cash6, hands: 1000, majors: cashMajors },
      { id: '3', pool: POOL.sng6, hands: 300, majors: sngMajors },
      { id: '5', pool: POOL.cash10, hands: 1000, majors: cashMajors },
      { id: '1', pool: POOL.sng2, hands: 300, majors: sngMajors },
    ]);
    expect(data.hands.filter((h) => h.cash !== undefined)).toHaveLength(2000);
    const sng = data.hands.filter((h) => h.cash === undefined);
    expect(sng).toHaveLength(600);

    const view = filtered(data, { tableSize: 'all', gameType: 'sit-and-go' });
    const points = majorErrorPoints(orderHands({ hands: sng, sessionStarts: data.sessionStarts }));
    expect(view.chart).toEqual({ kind: 'points', points });
    // The first 500 sit-and-go hands by session start: 75 + 50 unhinted Majors.
    expect(points).toEqual([{ firstHand: 1, lastHand: 500, majorPer100: 25 }]);
    const all = statisticsView(data);
    expect(all.chart.kind === 'points' && all.chart.points[0]?.majorPer100).toBe(10);

    const card = majorCard(render(view));
    const circles = card.match(/<circle[^>]*data-point=[^>]*><title>([^<]*)<\/title>/g) ?? [];
    expect(circles).toHaveLength(1);
    expect(circles[0]).toContain(
      `<title>${pointLabel(points[0] as (typeof points)[number])}</title>`,
    );
  });

  it('AC#4 Heads-up totals read 700 hands over 3 sessions', () => {
    const data = trendData([
      { id: '7', pool: POOL.cash6, hands: 300 },
      { id: '2', pool: POOL.cash2, hands: 200 },
      { id: '9', pool: POOL.cash10, hands: 190 },
      { id: '0', pool: POOL.sng2, hands: 250 },
      { id: '5', pool: POOL.sng6, hands: 200 },
      { id: 'b', pool: POOL.cash4, hands: 150 },
      { id: '3', pool: POOL.cash2, hands: 250 },
      { id: 'e', pool: POOL.cash8, hands: 150 },
      { id: '1', pool: POOL.cash6, hands: 150 },
    ]);
    expect(data.hands).toHaveLength(1840);
    expect(totals(render(filtered(data, { tableSize: 'heads-up', gameType: 'all' })))).toBe(
      '700 hands over 3 sessions',
    );
    expect(totals(render(filtered(data, ALL_TRENDS)))).toBe('1,840 hands over 9 sessions');
  });

  // 300 heads-up hands among 3,000, and no full-ring session: shared by AC#5 and AC#8.
  const mostlySixMax = trendData([
    { id: '4', pool: POOL.cash6, hands: 1200, majors: (n) => (n % 9 === 0 ? 1 : 0) },
    { id: 'd', pool: POOL.sng2, hands: 180 },
    { id: '2', pool: POOL.sng6, hands: 1500 },
    { id: '7', pool: POOL.cash2, hands: 120 },
  ]);

  it('AC#5 300 heads-up hands among 3,000 show Play 200 more hands', () => {
    expect(mostlySixMax.hands).toHaveLength(3000);
    const view = filtered(mostlySixMax, { tableSize: 'heads-up', gameType: 'all' });
    expect(view.chart).toEqual({ kind: 'more-hands', needed: 200 });
    const html = render(view);
    const card = majorCard(html);
    expect(card).toContain(
      '<p class="stats-message">Play 200 more hands to see your first trend point.</p>',
    );
    expect(card).not.toContain('<svg');
    expect(totals(html)).toBe('300 hands over 2 sessions');
  });

  it('AC#6 BB/100 shows no-cash for Sit-and-go and cash hands only for All', () => {
    const data = trendData([
      { id: '8', pool: POOL.cash6, hands: 400 },
      { id: '3', pool: POOL.sng6, hands: 300 },
      { id: 'c', pool: POOL.cash6big, hands: 600 },
      { id: '1', pool: POOL.sng2, hands: 300 },
    ]);
    const sngView = filtered(data, { tableSize: 'all', gameType: 'sit-and-go' });
    expect(sngView.bb100).toEqual({ kind: 'no-cash' });
    expect(bb100Card(render(sngView))).toContain(NO_CASH_MESSAGE);

    const allView = filtered(data, ALL_TRENDS);
    const points = bb100Points(orderHands(data));
    expect(points).toHaveLength(2);
    expect(allView.bb100).toEqual({ kind: 'points', points });
    const cashOnly = { ...data, hands: data.hands.filter((h) => h.cash !== undefined) };
    expect(cashOnly.hands).toHaveLength(1000);
    expect(bb100Points(orderHands(cashOnly))).toEqual(points);
    expect(filtered(data, { tableSize: 'all', gameType: 'cash' }).bb100).toEqual(allView.bb100);
  });

  it('AC#7 the G-2 target is computed from all stored hands under every filter', () => {
    const data = trendData([
      { id: 'f', pool: POOL.cash6, hands: 600, majors: (n) => (n % 20 === 0 ? 1 : 0) },
      { id: '0', pool: POOL.sng6, hands: 500, majors: (n) => (n % 5 === 0 ? 1 : 0) },
      { id: '8', pool: POOL.cash10, hands: 500, majors: (n) => (n % 50 === 0 ? 1 : 0) },
    ]);
    expect(data.hands).toHaveLength(1600);
    // The test's own count: the first 1,000 by session start are the 600 6-max cash hands (30 Majors) and 400
    // sit-and-go hands (80 Majors): 110 ÷ 1,000 × 100 ÷ 2 = 5.5.
    const T = 5.5;
    const cashTarget = statisticsView(
      filterTrendData(data, { tableSize: 'all', gameType: 'cash' }),
    ).g2Target;
    // The cash subset's first 1,000: 30 + 8 Majors → 1.9.
    expect(cashTarget).toBe(1.9);
    expect(T).not.toBe(cashTarget);

    const combos: TrendFilter[] = [];
    for (const tableSize of ['all', 'heads-up', '6-max', 'full-ring'] as const) {
      for (const gameType of ['all', 'cash', 'sit-and-go'] as const) {
        const filter = { tableSize, gameType };
        if (filter.tableSize === 'all' && filter.gameType === 'all') continue;
        if (filterTrendData(data, filter).hands.length >= 500) combos.push(filter);
      }
    }
    expect(combos).toHaveLength(7);
    for (const filter of combos) {
      const name = `${filter.tableSize}/${filter.gameType}`;
      const view = filtered(data, filter);
      expect(view.g2Target, name).toBe(T);
      if (view.chart.kind !== 'points') continue;
      const yMax = Math.max(1, T, ...view.chart.points.map((p) => p.majorPer100));
      const y = String(Math.round((150 - (T / yMax) * 140) * 10) / 10);
      const lines = majorCard(render(view)).match(/<line[^>]*class="stats-target"[^>]*>/g) ?? [];
      expect(lines, name).toHaveLength(1);
      expect(lines[0], name).toContain(`y1="${y}"`);
      expect(lines[0], name).toContain(`y2="${y}"`);
    }
  });

  it('AC#8 no G-2 caption, line or label suffix when the filtered chart has no points', () => {
    const noTarget = (html: string): void => {
      expect(html).not.toContain(G2_CAPTION);
      expect(html).not.toContain('class="stats-target"');
      expect(html).not.toContain('Dashed target line');
    };
    const headsUp = filtered(mostlySixMax, { tableSize: 'heads-up', gameType: 'all' });
    expect(headsUp.chart.kind).toBe('more-hands');
    expect(headsUp.g2Target).not.toBeNull();
    noTarget(render(headsUp));

    const fullRing = filtered(mostlySixMax, { tableSize: 'full-ring', gameType: 'all' });
    expect(fullRing.chart).toEqual({ kind: 'no-hands' });
    expect(fullRing.g2Target).not.toBeNull();
    const html = render(fullRing);
    noTarget(html);
    expect(majorCard(html)).toContain(`<p class="stats-message">${NO_HANDS_MESSAGE}</p>`);
    expect(totals(html)).toBe('0 hands over 0 sessions');
  });
});
