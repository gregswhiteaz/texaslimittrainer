import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import {
  DEFAULT_GROUPING,
  GROUPING_OPTIONS,
  NO_HANDS_MESSAGE,
  bb100Value,
  filterTrendData,
  statisticsView,
  trendHand,
  type StatisticsView,
  type TrendData,
  type TrendFilter,
  type TrendGrouping,
  type TrendHand,
} from '../../src/stats/trends';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, seatSession, type Stake } from '../../src/table/session';
import { handWrite, type SessionRecord } from '../../src/table/session-record';
import { bbPer100, sessionReport, signedTenths } from '../../src/table/session-report';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { playSession } from '../support/session-play';
import {
  cashPool,
  mixedGrades,
  nineSessions,
  sitAndGoPool,
  statRecords,
  type StatSession,
} from '../support/stat-records';

vi.setConfig({ testTimeout: 30_000 });

// TASK-11.5: grouping the trends per session or per local day (AC#1–AC#8) at module and renderToString level.

const stake = (bigBet: number): Stake => CASH_STAKES.find((s) => s.bigBet === bigBet) as Stake;

const unhintedMajors = (r: HandRecord): number =>
  r.decisions.filter((d) => !d.hinted && d.grade.grade === 'major').length;

const dataOf = (records: readonly HandRecord[], sessions: readonly SessionRecord[]): TrendData => ({
  hands: records.map(trendHand),
  sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
});

/** Markup with React's text separators removed. */
const render = (
  view: StatisticsView | undefined | null,
  grouping?: TrendGrouping,
  filter?: TrendFilter,
): string =>
  renderToString(
    <StatisticsScreen view={view} onHome={() => undefined} filter={filter} grouping={grouping} />,
  ).replace(/<!-- -->/g, '');

const majorCard = (html: string): string =>
  html.slice(
    html.indexOf('aria-labelledby="stats-major-title"'),
    html.indexOf('stats-bb100-title'),
  );
const bb100Card = (html: string): string => html.slice(html.indexOf('stats-bb100-title'));
const titles = (card: string, attr: string): string[] =>
  [...card.matchAll(new RegExp(`<circle[^>]*${attr}=[^>]*><title>([^<]*)</title>`, 'g'))].map(
    (m) => m[1] as string,
  );

/** The options of the select wrapped by the label `label`: [value, text, selected]. */
function options(html: string, label: string): [string, string, boolean][] | undefined {
  const select = new RegExp(`<label>${label}<select[^>]*>(.*?)</select></label>`).exec(html)?.[1];
  if (select === undefined) return undefined;
  return [...select.matchAll(/<option value="([^"]*)"( selected="")?>([^<]*)<\/option>/g)].map(
    (m) => [m[1] as string, m[3] as string, m[2] !== undefined],
  );
}

const enGb = (at: Date): string =>
  at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** A deterministic shuffle (fixed LCG), so no computation can rely on input order. */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  let seed = 12345;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

interface Part {
  readonly id: string;
  readonly pool: readonly TrendHand[];
  readonly start: Date;
  readonly hands: number;
  readonly majors?: (handNumber: number) => number;
}

/** Sessions of pool clones, hand n completed n seconds after the session's start; hands returned reversed. */
function trendData(layout: readonly Part[]): TrendData {
  const hands: TrendHand[] = [];
  const sessionStarts = new Map<string, string>();
  for (const { id, pool, start, hands: count, majors } of layout) {
    const sessionId = id.repeat(32);
    sessionStarts.set(sessionId, start.toISOString());
    for (let n = 1; n <= count; n++) {
      hands.push({
        ...(pool[(n - 1) % pool.length] as TrendHand),
        sessionId,
        handNumber: n,
        completedAt: new Date(start.getTime() + n * 1000).toISOString(),
        unhintedMajors: majors?.(n) ?? 0,
      });
    }
  }
  return { hands: hands.reverse(), sessionStarts };
}

const poolOf = (records: readonly HandRecord[]): readonly TrendHand[] =>
  records.map((r) => trendHand(parseHandRecord(r)));
const POOL = {
  cash6: poolOf(cashPool(stake(8), 3, 6)),
  sng2: poolOf(sitAndGoPool(3, 2)),
};

const localDate = (at: string): string => new Date(at).toLocaleDateString('en-CA');

describe('trend grouping acceptance', () => {
  it('AC#1 lists Every 500 hands, Session and Day with Every 500 hands selected', () => {
    const view = statisticsView(
      trendData([{ id: '1', pool: POOL.cash6, start: new Date(2026, 10, 10, 9), hands: 10 }]),
    );
    expect(DEFAULT_GROUPING).toBe('hands');
    expect(GROUPING_OPTIONS).toEqual([
      ['hands', 'Every 500 hands'],
      ['session', 'Session'],
      ['day', 'Day'],
    ]);
    const html = render(view);
    expect(html).toContain('<label>Group by<select id="stats-group-by"');
    expect(options(html, 'Group by')).toEqual([
      ['hands', 'Every 500 hands', true],
      ['session', 'Session', false],
      ['day', 'Day', false],
    ]);
    expect(options(render(view, 'day'), 'Group by')?.filter(([, , on]) => on)).toEqual([
      ['day', 'Day', true],
    ]);
    expect(render(undefined)).not.toContain('Group by');
    expect(render(null)).not.toContain('Group by');
  });

  it("AC#2 per session plots 9 points recomputed from each session's records", () => {
    const layout = nineSessions(3000);
    const { records, sessions } = statRecords(layout, mixedGrades);
    expect(records).toHaveLength(3000);
    const view = statisticsView(dataOf([...records].reverse(), sessions), undefined, 'session');
    expect(view.chart.kind).toBe('points');
    const points = view.chart.kind === 'points' ? view.chart.points : [];
    expect(points).toHaveLength(9);

    const byStart = [...layout].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    const expected = byStart.map((session) => {
      const own = records.filter((r) => r.sessionId === session.sessionId);
      const majors = own.reduce((sum, r) => sum + unhintedMajors(r), 0);
      return bbPer100(majors, 1, own.length);
    });
    expect(points.map((p) => p.majorPer100)).toEqual(expected);
    expect(points.map((p) => p.group?.kind === 'session' && p.group.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(new Set(expected).size).toBeGreaterThan(1);

    expect(titles(majorCard(render(view, 'session')), 'data-point')).toEqual(
      byStart.map(
        (s, i) => `Session ${i + 1}, ${enGb(s.startedAt)}: ${(expected[i] as number).toFixed(1)}`,
      ),
    );
  });

  it('AC#3 per day plots 4 points and counts each hand on its completion date', () => {
    const layout: StatSession[] = [
      { sessionId: '5'.repeat(32), startedAt: new Date(2026, 10, 10, 23, 58, 0), hands: 300 },
      { sessionId: '1'.repeat(32), startedAt: new Date(2026, 10, 11, 14, 0), hands: 100 },
      { sessionId: '9'.repeat(32), startedAt: new Date(2026, 10, 12, 9, 0), hands: 50 },
      { sessionId: '3'.repeat(32), startedAt: new Date(2026, 10, 14, 20, 0), hands: 40 },
    ].map((s) => ({ ...s, ended: true }));
    const { records, sessions } = statRecords(layout, mixedGrades);
    const view = statisticsView(dataOf(shuffled(records), sessions), undefined, 'day');
    const points = view.chart.kind === 'points' ? view.chart.points : [];
    const days = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-14'];
    expect(points.map((p) => p.group?.day)).toEqual(days);
    expect(points.map((p) => p.lastHand - p.firstHand + 1)).toEqual([119, 281, 50, 40]);
    expect(points.map((p) => p.majorPer100)).toEqual(
      days.map((day) => {
        const own = records.filter((r) => localDate(r.completedAt) === day);
        const majors = own.reduce((sum, r) => sum + unhintedMajors(r), 0);
        return bbPer100(majors, 1, own.length);
      }),
    );

    const shown = titles(majorCard(render(view, 'day')), 'data-point');
    expect(shown).toHaveLength(4);
    ['10 Nov 2026: ', '11 Nov 2026: ', '12 Nov 2026: ', '14 Nov 2026: '].forEach((start, i) =>
      expect(shown[i]?.startsWith(start), shown[i]).toBe(true),
    );
  });

  it('AC#4 per day under 6-max uses only 6-max hands and keeps the filter', () => {
    const data = trendData([
      {
        id: '6',
        pool: POOL.cash6,
        start: new Date(2026, 10, 10, 20),
        hands: 200,
        majors: (n) => (n % 10 === 0 ? 1 : 0),
      },
      {
        id: '2',
        pool: POOL.sng2,
        start: new Date(2026, 10, 10, 21),
        hands: 150,
        majors: (n) => (n % 3 === 0 ? 1 : 0),
      },
      {
        id: '4',
        pool: POOL.cash6,
        start: new Date(2026, 10, 11, 9),
        hands: 100,
        majors: (n) => (n % 20 === 0 ? 1 : 0),
      },
    ]);
    const sixMax: TrendFilter = { tableSize: '6-max', gameType: 'all' };
    const view = statisticsView(filterTrendData(data, sixMax), data, 'day');
    const points = view.chart.kind === 'points' ? view.chart.points : [];

    const kept = data.hands.filter((h) => h.sessionId[0] !== '2');
    const days = [...new Set(kept.map((h) => localDate(h.completedAt)))].sort();
    expect(days).toEqual(['2026-11-10', '2026-11-11']);
    expect(points.map((p) => [p.group?.day, p.majorPer100])).toEqual(
      days.map((day) => {
        const own = kept.filter((h) => localDate(h.completedAt) === day);
        const majors = own.reduce((sum, h) => sum + h.unhintedMajors, 0);
        return [day, bbPer100(majors, 1, own.length)];
      }),
    );
    expect(statisticsView(data, data, 'day').chart).not.toEqual(view.chart);

    const html = render(view, 'day', sixMax);
    expect(options(html, 'Table size')?.filter(([, , on]) => on)).toEqual([
      ['6-max', '6-max', true],
    ]);
    expect(options(html, 'Group by')?.filter(([, , on]) => on)).toEqual([['day', 'Day', true]]);
  });

  it('AC#5 one 12-hand session plots one point with no play-more message', () => {
    const { records, sessions } = statRecords(
      [
        {
          sessionId: '8'.repeat(32),
          startedAt: new Date(2026, 10, 10, 12, 0),
          hands: 12,
          ended: true,
        },
      ],
      (_s, n, d) => ({ grade: n === 5 && d === 0 ? 'major' : 'correct', hinted: false }),
    );
    const data = dataOf(records, sessions);
    for (const grouping of ['session', 'day'] as const) {
      const view = statisticsView(data, data, grouping);
      expect(view.chart, grouping).toMatchObject({
        kind: 'points',
        points: [{ firstHand: 1, lastHand: 12, majorPer100: 8.3 }],
      });
      expect(view.chart.kind === 'points' && view.chart.points).toHaveLength(1);
      const html = render(view, grouping);
      expect(majorCard(html).match(/data-point=""/g), grouping).toHaveLength(1);
      expect(html, grouping).not.toContain('more hand');
    }
    expect(majorCard(render(statisticsView(data)))).toContain(
      'Play 488 more hands to see your first trend point.',
    );
  });

  it('AC#6 zero hands show the first-hand message under Session and Day', () => {
    const empty: TrendData = { hands: [], sessionStarts: new Map() };
    const sixMax = trendData([
      { id: '6', pool: POOL.cash6, start: new Date(2026, 10, 10, 9), hands: 40 },
    ]);
    const fullRing = filterTrendData(sixMax, { tableSize: 'full-ring', gameType: 'all' });
    for (const [data, all] of [
      [empty, empty],
      [fullRing, sixMax],
    ] as const) {
      for (const grouping of ['session', 'day'] as const) {
        const view = statisticsView(data, all, grouping);
        expect(view.chart).toEqual({ kind: 'no-hands' });
        expect(view.bb100).toEqual({ kind: 'no-cash' });
        const card = majorCard(render(view, grouping));
        expect(card).toContain(`<p class="stats-message">${NO_HANDS_MESSAGE}</p>`);
        expect(card).not.toContain('<svg');
      }
    }
  });

  it("AC#7 the storyboard's Group by default is Every 500 hands", () => {
    const html = readFileSync('dreams/limit-holdem-trainer/storyboards/Stats.dc.html', 'utf8');
    const select = /Group by\s*<select[^>]*>(.*?)<\/select>/s.exec(html)?.[1] ?? '';
    const parsed = [...select.matchAll(/<option( selected)?>([^<]*)<\/option>/g)].map((m) => [
      m[2],
      m[1] !== undefined,
    ]);
    expect(parsed).toEqual(GROUPING_OPTIONS.map(([, label], i) => [label, i === 0]));
    expect(html).not.toContain('Every 100 hands');
  });

  it("AC#8 per-session BB/100 equals each cash session's report BB/100", () => {
    const at = (hour: number): Date => new Date(Date.UTC(2026, 10, 10, hour));
    const play = (
      id: string,
      table: ReturnType<typeof seatSession>,
      hands: number,
      seed: number,
      started: Date,
    ) => {
      const writes = playSession(table, hands, (n) => replayCodeFromWords([seed, n, 2, 3])).map(
        (done) =>
          handWrite(done, {
            sessionId: id.repeat(32),
            startedAt: started,
            completedAt: new Date(started.getTime() + done.handNumber * 60_000),
          }),
      );
      const records = writes.map((w) => parseHandRecord(structuredClone(w.record)));
      const session = (writes.at(-1) as (typeof writes)[number]).session;
      return { records, session, ended: new Date(started.getTime() + 3_600_000) };
    };
    const small = play('e', seatSession({ gameType: 'cash', stake: stake(4) }), 15, 7, at(10));
    const sng = play('1', seatSession({ gameType: 'sit-and-go', players: 6 }), 10, 5, at(12));
    const big = play('4', seatSession({ gameType: 'cash', stake: stake(20) }), 20, 3, at(14));
    expect(big.session.rebuys).toBeGreaterThanOrEqual(1);

    const records = [...big.records, ...small.records, ...sng.records];
    const view = statisticsView(
      dataOf(records, [big.session, sng.session, small.session]),
      undefined,
      'session',
    );
    const majors = view.chart.kind === 'points' ? view.chart.points : [];
    const points = view.bb100.kind === 'points' ? view.bb100.points : [];
    expect(majors).toHaveLength(3);
    expect(points).toHaveLength(2);

    const reports = [small, big].map((s) => {
      const report = sessionReport(s.session, s.ended, s.records);
      expect(report.cash).not.toBeNull();
      return report.cash?.bbPer100 as number;
    });
    expect(points.map((p) => p.bb100)).toEqual(reports);
    expect(points.map((p) => p.bb100)).toEqual(
      [small, big].map((s) => bb100Value(s.records.map(trendHand))),
    );
    expect(points.map((p) => p.group?.kind === 'session' && p.group.number)).toEqual([1, 3]);
    expect(points.map((p) => p.group)).toEqual([majors[0]?.group, majors[2]?.group]);

    const shown = titles(bb100Card(render(view, 'session')), 'data-bb100-point');
    expect(shown).toHaveLength(2);
    reports.forEach((value, i) =>
      expect(shown[i]?.endsWith(`: ${signedTenths(value)}`)).toBe(true),
    );
  });

  it('Session and Day BB/100 plot from the first cash hand', () => {
    const data = trendData([
      { id: 'a', pool: POOL.cash6, start: new Date(2026, 10, 10, 10), hands: 20 },
      { id: 'b', pool: POOL.sng2, start: new Date(2026, 10, 10, 14), hands: 20 },
      { id: 'c', pool: POOL.cash6, start: new Date(2026, 10, 12, 10), hands: 10 },
    ]);
    const view = statisticsView(data, data, 'day');
    const cash = data.hands.filter((h) => h.cash !== undefined);
    expect(cash).toHaveLength(30);
    const days = ['2026-11-10', '2026-11-12'];
    expect(view.bb100.kind).toBe('points');
    const points = view.bb100.kind === 'points' ? view.bb100.points : [];
    expect(points.map((p) => [p.group?.day, p.bb100])).toEqual(
      days.map((day) => [day, bb100Value(cash.filter((h) => localDate(h.completedAt) === day))]),
    );
    expect(render(view, 'day')).not.toContain('more cash hand');
    expect(statisticsView(data).bb100).toEqual({ kind: 'more-cash', needed: 470 });
  });
});
