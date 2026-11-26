import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import { bb100Value, statisticsView, trendHand, type StatisticsView } from '../../src/stats/trends';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, seatSession, type Stake } from '../../src/table/session';
import { handWrite, type SessionRecord } from '../../src/table/session-record';
import { sessionReport } from '../../src/table/session-report';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { playSession } from '../support/session-play';
import { cashPool, cloneRecords, sitAndGoPool, type StatSession } from '../support/stat-records';

vi.setConfig({ testTimeout: 30_000 });

// TASK-11.2: the cash-only BB/100 trend (AC#1–AC#7) at module and renderToString level.

const stake = (bigBet: number): Stake => CASH_STAKES.find((s) => s.bigBet === bigBet) as Stake;
const POOL = {
  4: cashPool(stake(4), 8),
  8: cashPool(stake(8), 8),
  20: cashPool(stake(20), 8),
  sng: sitAndGoPool(6),
};

interface Layout {
  readonly id: string;
  readonly pool: readonly HandRecord[];
  readonly hands: number;
}

/** Sessions started an hour apart in the order given, each `hands` clones of its pool. */
function seeded(layout: readonly Layout[]): { records: HandRecord[]; sessions: SessionRecord[] } {
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  layout.forEach(({ id, pool, hands }, i) => {
    const session: StatSession = {
      sessionId: id.repeat(32),
      startedAt: new Date(Date.UTC(2026, 10, 1, i)),
      hands,
      ended: true,
    };
    const cloned = cloneRecords(pool, session);
    records.push(...cloned.records);
    sessions.push(cloned.session);
  });
  return { records, sessions };
}

const viewOf = ({
  records,
  sessions,
}: {
  records: readonly HandRecord[];
  sessions: readonly SessionRecord[];
}): StatisticsView =>
  statisticsView({
    hands: records.map(trendHand),
    sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
  });

/** Markup with React's text separators removed. */
const render = (view: StatisticsView): string =>
  renderToString(<StatisticsScreen view={view} onHome={() => undefined} />).replace(
    /<!-- -->/g,
    '',
  );

/** The BB/100 card's markup (the second section). */
const bbCard = (html: string): string =>
  html.slice(html.indexOf('aria-labelledby="stats-bb100-title"'));
/** The Major-error card's markup (the first section). */
const majorCard = (html: string): string =>
  html.slice(0, html.indexOf('aria-labelledby="stats-bb100-title"'));

const bbTitles = (html: string): string[] =>
  [...html.matchAll(/<circle[^>]*data-bb100-point[^>]*><title>([^<]*)<\/title>/g)].map(
    (m) => m[1] as string,
  );
const majorPoints = (html: string): number => (html.match(/<circle[^>]*data-point=/g) ?? []).length;
const bbMessage = (html: string): string | undefined =>
  /<p class="stats-bb100-message">([^<]*)<\/p>/.exec(html)?.[1];

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** The user's net chips, recomputed from the record's awards, returned chips and actions. */
function netOf(record: HandRecord): number {
  const seat = record.userSeat;
  let net = 0;
  for (const award of record.result.awards) {
    for (const winner of award.winners) if (winner.seat === seat) net += winner.amount;
  }
  if (record.result.returned?.seat === seat) net += record.result.returned.amount;
  for (const action of record.actions) if (action.seat === seat) net -= action.added;
  return net;
}

/** Σ(net / bigBet) / n × 100 as an exact fraction, rounded half away from zero to tenths, as display text. */
function expectedText(group: readonly HandRecord[]): string {
  let num = 0;
  let den = 1;
  for (const record of group) {
    const big = record.stake.bigBet;
    num = num * big + netOf(record) * den;
    den *= big;
    const g = gcd(num, den);
    num /= g;
    den /= g;
  }
  // tenths = num / den / n × 1000 = (1000 num) / (n den)
  const p = 1000 * num;
  const q = group.length * den;
  const tenths = Math.sign(p) * Math.floor((2 * Math.abs(p) + q) / (2 * q));
  if (tenths === 0) return '0.0';
  return `${tenths > 0 ? '+' : '-'}${(Math.abs(tenths) / 10).toFixed(1)}`;
}

/** The test's own order: by session start, then hand number. */
function ordered(records: readonly HandRecord[], sessions: readonly SessionRecord[]): HandRecord[] {
  const start = new Map(sessions.map((s) => [s.sessionId, Date.parse(s.startedAt)]));
  return [...records].sort(
    (a, b) =>
      (start.get(a.sessionId) as number) - (start.get(b.sessionId) as number) ||
      a.handNumber - b.handNumber,
  );
}

const expectedTitles = (cash: readonly HandRecord[]): string[] =>
  Array.from({ length: Math.floor(cash.length / 500) }, (_, i) => {
    const first = 500 * i + 1;
    const last = first + 499;
    const fmt = (n: number) => n.toLocaleString('en-US');
    return `Cash hands ${fmt(first)}–${fmt(last)}: ${expectedText(cash.slice(first - 1, last))}`;
  });

describe('BB/100 trend acceptance', () => {
  it('AC#1 2,000 cash hands at mixed stakes plot 4 points recomputed from the records', () => {
    const data = seeded([
      { id: '7', pool: POOL[4], hands: 300 },
      { id: '2', pool: POOL[8], hands: 450 },
      { id: '9', pool: POOL[20], hands: 650 },
      { id: '0', pool: POOL[8], hands: 600 },
    ]);
    expect(data.records).toHaveLength(2000);
    const nets = data.records.slice(0, 500).map(netOf);
    expect(nets.some((n) => n > 0) && nets.some((n) => n < 0)).toBe(true);
    expect(new Set(data.records.slice(0, 500).map((r) => r.stake.bigBet)).size).toBe(2);

    const html = render(viewOf(data));
    const titles = bbTitles(html);
    expect(titles).toHaveLength(4);
    expect(titles).toEqual(expectedTitles(ordered(data.records, data.sessions)));
    expect(new Set(titles.map((t) => t.split(': ')[1])).size).toBeGreaterThan(1);
  });

  it('AC#2 1,000 cash and 500 sit-and-go hands plot 2 points from the cash hands only', () => {
    const data = seeded([
      { id: '3', pool: POOL[8], hands: 400 },
      { id: 'a', pool: POOL.sng, hands: 250 },
      { id: '5', pool: POOL[20], hands: 600 },
      { id: '1', pool: POOL.sng, hands: 250 },
    ]);
    const sng = data.records.filter((r) => r.gameType === 'sit-and-go');
    expect(sng).toHaveLength(500);
    expect(sng.every((r) => parseHandRecord(r).level === 1)).toBe(true);

    const view = viewOf(data);
    expect(view.bb100.kind === 'points' && view.bb100.points).toHaveLength(2);
    const html = render(view);
    const cash = ordered(data.records, data.sessions).filter((r) => r.gameType === 'cash');
    expect(cash).toHaveLength(1000);
    expect(bbTitles(html)).toEqual(expectedTitles(cash));
    expect(majorPoints(html)).toBe(3);
  });

  it('AC#3 the BB/100 chart draws a dashed break-even line at 0', () => {
    const base = viewOf(seeded([{ id: '4', pool: POOL[8], hands: 500 }]));
    const withValues = (values: readonly number[]): string =>
      render({
        ...base,
        bb100: {
          kind: 'points',
          points: values.map((bb100, i) => ({
            firstHand: 500 * i + 1,
            lastHand: 500 * i + 500,
            bb100,
          })),
        },
      });
    const lines = (html: string): string[] =>
      bbCard(html).match(/<line[^>]*class="stats-break-even"[^>]*>/g) ?? [];
    const attr = (tag: string, name: string): string | undefined =>
      new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];

    const mixed = withValues([2, -1]);
    const [line] = lines(mixed);
    expect(lines(mixed)).toHaveLength(1);
    expect(attr(line as string, 'stroke-dasharray')).toBe('6 5');
    expect(attr(line as string, 'x1')).toBe('0');
    expect(attr(line as string, 'x2')).toBe('400');
    expect(attr(line as string, 'y1')).toBe('103.3');
    expect(attr(line as string, 'y2')).toBe('103.3');

    const [positive] = lines(withValues([3, 5]));
    const y = Number(attr(positive as string, 'y1'));
    expect(y).toBeGreaterThan(10);
    expect(y).toBeLessThan(150);
    expect(majorCard(mixed)).toContain('<svg');
    expect(majorCard(mixed)).not.toContain('stats-break-even');
  });

  it("AC#4 a cash session's BB/100 value equals its report's BB/100", () => {
    const started = new Date('2026-11-24T10:00:00Z');
    const check = (hands: number, seed: number, minRebuys: number): void => {
      const played = playSession(seatSession({ gameType: 'cash', stake: stake(20) }), hands, (n) =>
        replayCodeFromWords([seed, n, 2, 3]),
      );
      const writes = played.map((done) =>
        handWrite(done, {
          sessionId: 'd'.repeat(32),
          startedAt: started,
          completedAt: new Date(started.getTime() + done.handNumber * 60_000),
        }),
      );
      const records = writes.map((w) => parseHandRecord(structuredClone(w.record)));
      const last = (writes.at(-1) as (typeof writes)[number]).session;
      expect(last.rebuys).toBeGreaterThanOrEqual(minRebuys);
      const report = sessionReport(last, new Date(started.getTime() + 3_600_000), records);
      expect(report.cash).not.toBeNull();
      expect(bb100Value(records.map(trendHand))).toBe(report.cash?.bbPer100);
    };
    check(20, 3, 1);
    check(1, 3, 0);
  });

  it('AC#5 sit-and-go-only hands show No cash-game hands yet', () => {
    const data = seeded([
      { id: '6', pool: POOL.sng, hands: 350 },
      { id: '8', pool: POOL.sng, hands: 250 },
    ]);
    const sitAndGo = {
      records: data.records.filter((r) => r.gameType === 'sit-and-go'),
      sessions: data.sessions,
    };
    expect(sitAndGo.records).toHaveLength(600);
    for (const html of [render(viewOf(data)), render(viewOf(sitAndGo))]) {
      expect(bbMessage(html)).toBe('No cash-game hands yet.');
      expect(html).not.toContain('data-bb100-point');
      expect(majorPoints(html)).toBe(1);
    }
    expect(bbMessage(render(viewOf({ records: [], sessions: [] })))).toBe(
      'No cash-game hands yet.',
    );
  });

  it('AC#6 300 cash hands of 800 show the play-more-cash message while the Major chart plots 1 point', () => {
    const html = render(
      viewOf(
        seeded([
          { id: 'b', pool: POOL[4], hands: 300 },
          { id: 'c', pool: POOL.sng, hands: 500 },
        ]),
      ),
    );
    expect(bbMessage(html)).toBe('Play 200 more cash hands to see your first trend point.');
    expect(bbCard(html)).not.toContain('<svg');
    expect(majorPoints(html)).toBe(1);
  });

  it('AC#7 499 cash hands show the singular play-more-cash message', () => {
    const html = render(viewOf(seeded([{ id: 'e', pool: POOL[20], hands: 499 }])));
    expect(bbMessage(html)).toBe('Play 1 more cash hand to see your first trend point.');
  });
});
