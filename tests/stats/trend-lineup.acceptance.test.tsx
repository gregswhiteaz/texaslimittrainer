import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ALL_TRENDS,
  G2_CAPTION,
  LINE_UP_OPTIONS,
  NO_HANDS_MESSAGE,
  bb100Value,
  filterTrendData,
  g2Target,
  orderHands,
  statisticsView,
  trendHand,
  type StatisticsView,
  type TrendData,
  type TrendFilter,
  type TrendGrouping,
} from '../../src/stats/trends';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, type LineUpName, type Stake } from '../../src/table/session';
import { bbPer100 } from '../../src/table/session-report';
import type { SessionRecord } from '../../src/table/session-record';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import {
  cashPool,
  cloneRecords,
  mixedGrades,
  sitAndGoPool,
  statRecords,
  withGrades,
} from '../support/stat-records';

// TASK-11.7: the line-up filter (AC#1–AC#5) at module and renderToString level.

const STAKE = CASH_STAKES.find((s) => s.bigBet === 8) as Stake;
// A few really played hands, cloned to the counts each test needs (A-5).
const POOL = {
  mixed6: cashPool(STAKE, 3, 6, 'Mixed'),
  tough6: cashPool(STAKE, 3, 6, 'Tough'),
  mixed2: cashPool(STAKE, 3, 2, 'Mixed'),
  sng6: sitAndGoPool(3, 6),
};

interface Part {
  readonly id: string;
  readonly pool: readonly HandRecord[];
  readonly hands: number;
  readonly lineUp: LineUpName;
}

interface Stored {
  readonly records: readonly HandRecord[];
  readonly sessions: readonly SessionRecord[];
  /** sessionId → start position (0-based). */
  readonly startIndex: ReadonlyMap<string, number>;
}

/** Sessions of pool clones started an hour apart in the order given, graded by mixedGrades, with `lineUp` set. */
function store(layout: readonly Part[]): Stored {
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  const startIndex = new Map<string, number>();
  layout.forEach(({ id, pool, hands, lineUp }, s) => {
    const sessionId = id.repeat(32);
    startIndex.set(sessionId, s);
    const cloned = cloneRecords(pool, {
      sessionId,
      startedAt: new Date(Date.UTC(2026, 10, 1, s)),
      hands,
      ended: true,
    });
    for (const r of cloned.records) {
      records.push({ ...withGrades(r, (d) => mixedGrades(s, r.handNumber, d)), lineUp });
    }
    sessions.push(cloned.session);
  });
  return { records, sessions, startIndex };
}

/** The records as trendData() returns them, in reverse so a computation relying on input order would differ. */
const dataOf = (records: readonly HandRecord[], sessions: readonly SessionRecord[]): TrendData => ({
  hands: [...records].reverse().map((r) => trendHand(parseHandRecord(r))),
  sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
});

/** `records` kept by `keep`, in session start then handNumber order. */
const ordered = ({ records, startIndex }: Stored, keep: (r: HandRecord) => boolean): HandRecord[] =>
  records
    .filter(keep)
    .sort(
      (a, b) =>
        (startIndex.get(a.sessionId) as number) - (startIndex.get(b.sessionId) as number) ||
        a.handNumber - b.handNumber,
    );

const majorsOf = (records: readonly HandRecord[]): number =>
  records.reduce(
    (n, r) => n + r.decisions.filter((d) => !d.hinted && d.grade.grade === 'major').length,
    0,
  );

/** Expected Major points: one per full 500 records. */
const majorPer100s = (records: readonly HandRecord[]): number[] =>
  Array.from({ length: Math.floor(records.length / 500) }, (_, i) =>
    bbPer100(majorsOf(records.slice(i * 500, (i + 1) * 500)), 1, 500),
  );

const view = (
  data: TrendData,
  filter: TrendFilter,
  grouping: TrendGrouping = 'hands',
): StatisticsView => statisticsView(filterTrendData(data, filter), data, grouping);

/** Markup with React's text separators removed. */
const render = (
  v: StatisticsView | undefined | null,
  filter?: TrendFilter,
  grouping?: TrendGrouping,
): string =>
  renderToString(
    <StatisticsScreen view={v} onHome={() => undefined} filter={filter} grouping={grouping} />,
  ).replace(/<!-- -->/g, '');

const majorCard = (html: string): string =>
  html.slice(
    html.indexOf('aria-labelledby="stats-major-title"'),
    html.indexOf('stats-bb100-title'),
  );
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

/** SPEC-02: start order 7, 2, 9, 4 differs from id order. */
const SPEC02 = store([
  { id: '7', pool: POOL.mixed6, hands: 300, lineUp: 'Mixed' },
  { id: '2', pool: POOL.tough6, hands: 400, lineUp: 'Tough' },
  { id: '9', pool: POOL.mixed6, hands: 300, lineUp: 'Custom' },
  { id: '4', pool: POOL.mixed6, hands: 250, lineUp: 'Custom' },
]);
const SPEC02_DATA = dataOf(SPEC02.records, SPEC02.sessions);

describe('trend line-up filter acceptance', () => {
  it('AC#1 lists All, Mixed, Tough, Soft and Custom with All selected', () => {
    const v = statisticsView(SPEC02_DATA);
    const html = render(v);
    expect(html).toContain('<label>Line-up<select id="stats-line-up"');
    expect(options(html, 'Line-up')).toEqual([
      ['all', 'All', true],
      ['Mixed', 'Mixed', false],
      ['Tough', 'Tough', false],
      ['Soft', 'Soft', false],
      ['Custom', 'Custom', false],
    ]);
    const gameType = html.indexOf('<label>Game type');
    const lineUp = html.indexOf('<label>Line-up');
    const groupBy = html.indexOf('<label>Group by');
    expect(gameType).toBeGreaterThan(-1);
    expect(lineUp).toBeGreaterThan(gameType);
    expect(groupBy).toBeGreaterThan(lineUp);

    const chosen = render(v, { tableSize: 'all', gameType: 'all', lineUp: 'Custom' });
    expect(options(chosen, 'Line-up')?.filter(([, , on]) => on)).toEqual([
      ['Custom', 'Custom', true],
    ]);

    expect(render(undefined)).not.toContain('Line-up');
    expect(render(null)).not.toContain('Line-up');
    expect(LINE_UP_OPTIONS.map(([, l]) => l)).toEqual(['All', 'Mixed', 'Tough', 'Soft', 'Custom']);
    expect(ALL_TRENDS.lineUp).toBe('all');
  });

  it('AC#2 Custom counts only the Custom sessions in charts and totals', () => {
    const custom = view(SPEC02_DATA, { ...ALL_TRENDS, lineUp: 'Custom' });
    expect(custom.hands).toBe(550);
    expect(custom.sessions).toBe(2);
    expect(totals(render(custom))).toBe('550 hands over 2 sessions');

    const records = ordered(SPEC02, (r) => r.lineUp === 'Custom').slice(0, 500);
    expect(new Set(records.map((r) => r.sessionId[0]))).toEqual(new Set(['9', '4']));
    if (custom.chart.kind !== 'points') throw new Error('expected points');
    expect(custom.chart.points).toHaveLength(1);
    expect(custom.chart.points[0]?.majorPer100).toBe(bbPer100(majorsOf(records), 1, 500));
    if (custom.bb100.kind !== 'points') throw new Error('expected bb100 points');
    expect(custom.bb100.points).toHaveLength(1);
    expect(custom.bb100.points[0]?.bb100).toBe(
      bb100Value(records.map((r) => trendHand(parseHandRecord(r)))),
    );

    const all = statisticsView(SPEC02_DATA);
    if (all.chart.kind !== 'points') throw new Error('expected points');
    expect(custom.chart.points[0]?.majorPer100).not.toBe(all.chart.points[0]?.majorPer100);
  });

  it('AC#3 Mixed and 6-max together recompute from hands that are both', () => {
    // Start order: heads-up Mixed, Tough 6-max, Mixed 6-max cash, Mixed 6-max sit-and-go.
    const stored = store([
      { id: '9', pool: POOL.mixed2, hands: 300, lineUp: 'Mixed' },
      { id: '2', pool: POOL.tough6, hands: 400, lineUp: 'Tough' },
      { id: '7', pool: POOL.mixed6, hands: 600, lineUp: 'Mixed' },
      { id: '4', pool: POOL.sng6, hands: 500, lineUp: 'Mixed' },
    ]);
    const data = dataOf(stored.records, stored.sessions);
    const both = (r: HandRecord): boolean =>
      r.lineUp === 'Mixed' && r.seats.length >= 3 && r.seats.length <= 7;
    const matching = ordered(stored, both);
    const filter: TrendFilter = { tableSize: '6-max', gameType: 'all', lineUp: 'Mixed' };

    const v = view(data, filter);
    expect(v.hands).toBe(1100);
    expect(v.sessions).toBe(2);
    if (v.chart.kind !== 'points') throw new Error('expected points');
    expect(v.chart.points.map((p) => p.majorPer100)).toEqual(majorPer100s(matching));
    expect(v.chart.points).toHaveLength(2);
    const cash = matching.filter((r) => r.gameType === 'cash').slice(0, 500);
    expect(cash).toHaveLength(500);
    if (v.bb100.kind !== 'points') throw new Error('expected bb100 points');
    expect(v.bb100.points.map((p) => p.bb100)).toEqual([
      bb100Value(cash.map((r) => trendHand(parseHandRecord(r)))),
    ]);

    const mixedOnly = view(data, { tableSize: 'all', gameType: 'all', lineUp: 'Mixed' });
    const sizeOnly = view(data, { tableSize: '6-max', gameType: 'all', lineUp: 'all' });
    expect(mixedOnly.hands).toBe(1400);
    expect(sizeOnly.hands).toBe(1500);
    for (const other of [mixedOnly, sizeOnly]) {
      expect(other.chart).not.toEqual(v.chart);
      expect(other.bb100).not.toEqual(v.bb100);
    }

    const bySession = view(data, filter, 'session');
    if (bySession.chart.kind !== 'points') throw new Error('expected points');
    const sessionIds = [...new Set(matching.map((r) => r.sessionId))];
    expect(sessionIds.map((id) => id[0])).toEqual(['7', '4']);
    expect(bySession.chart.points.map((p) => p.majorPer100)).toEqual(
      sessionIds.map((id) => {
        const hands = matching.filter((r) => r.sessionId === id);
        return bbPer100(majorsOf(hands), 1, hands.length);
      }),
    );
  });

  it('AC#4 Soft with no Soft sessions shows the first-hand message and 0 totals', () => {
    const soft: TrendFilter = { ...ALL_TRENDS, lineUp: 'Soft' };
    for (const grouping of ['hands', 'session', 'day'] as const) {
      const v = view(SPEC02_DATA, soft, grouping);
      expect(v.chart, grouping).toEqual({ kind: 'no-hands' });
      expect(v.bb100, grouping).toEqual({ kind: 'no-cash' });
      expect(v.totals, grouping).toBe('0 hands over 0 sessions');
      const html = render(v, soft, grouping);
      expect(majorCard(html), grouping).toContain(NO_HANDS_MESSAGE);
      expect(totals(html), grouping).toBe('0 hands over 0 sessions');
      expect(options(html, 'Line-up')?.filter(([, , on]) => on)).toEqual([['Soft', 'Soft', true]]);
    }
  });

  it('AC#5 the G-2 target comes from all stored hands under every line-up filter', () => {
    const layout: readonly { lineUp: LineUpName; hands: number }[] = [
      { lineUp: 'Tough', hands: 1000 },
      { lineUp: 'Custom', hands: 1000 },
      { lineUp: 'Mixed', hands: 200 },
    ];
    const ids = ['8', '3', '6'];
    const { records, sessions } = statRecords(
      layout.map(({ hands }, i) => ({
        sessionId: (ids[i] as string).repeat(32),
        startedAt: new Date(Date.UTC(2026, 10, 1, i)),
        hands,
        ended: true,
      })),
      (s, n, d) => {
        if (d === 0 && n <= (s === 0 ? 62 : s === 1 ? 150 : 0))
          return { grade: 'major', hinted: false };
        if (d === 1 && n <= 40) return { grade: 'major', hinted: true };
        return { grade: 'correct', hinted: false };
      },
    );
    const lineUpOf = new Map(
      layout.map(({ lineUp }, i) => [(ids[i] as string).repeat(32), lineUp]),
    );
    const tagged = records.map((r) => ({ ...r, lineUp: lineUpOf.get(r.sessionId) as LineUpName }));
    // A deterministic, non-chronological shuffle (7919 is prime, so i → 7919·i mod n is a permutation).
    const shuffled = tagged
      .map((r, i) => [(i * 7919) % tagged.length, r] as const)
      .sort(([a], [b]) => a - b)
      .map(([, r]) => r);
    const data: TrendData = {
      hands: shuffled.map((r) => trendHand(parseHandRecord(r))),
      sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
    };
    expect(g2Target(orderHands(data))).toBe(3.1);

    for (const grouping of ['hands', 'session'] as const) {
      for (const [lineUp] of LINE_UP_OPTIONS) {
        expect(view(data, { ...ALL_TRENDS, lineUp }, grouping).g2Target, lineUp).toBe(3.1);
      }
      const customOnly = filterTrendData(data, { ...ALL_TRENDS, lineUp: 'Custom' });
      expect(statisticsView(customOnly, customOnly, grouping).g2Target).toBe(7.5);

      const custom: TrendFilter = { ...ALL_TRENDS, lineUp: 'Custom' };
      const card = majorCard(render(view(data, custom, grouping), custom, grouping));
      expect(/<svg[^>]*role="img"[^>]*aria-label="([^"]*)"/.exec(card)?.[1]).toMatch(
        /Dashed target line at 3\.1$/,
      );
      expect(card).toContain(`<p class="stats-goal">${G2_CAPTION}</p>`);
    }
  });
});
