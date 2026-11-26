import { IDBFactory } from 'fake-indexeddb';
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { LOAD_FAILED_MESSAGE, statisticsView, type StatisticsView } from '../../src/stats/trends';
import { openHandStore } from '../../src/storage/hand-store';
import type { HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../../src/table/session';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { cashPool, cloneRecords } from '../support/stat-records';

vi.setConfig({ testTimeout: 30_000 });

// TASK-11.14: a store whose cash big bets push the exact LCM past every float still shows a finite BB/100.

/** The first `n` primes. */
function primes(n: number): number[] {
  const found: number[] = [];
  for (let k = 2; found.length < n; k++) {
    if (found.every((p) => p * p > k || k % p !== 0)) found.push(k);
  }
  return found;
}

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

/** Σ(net / bigBet) / n × 100 rounded half away from zero to tenths, as display text. */
function expectedText(records: readonly HandRecord[]): string {
  const sum = records.reduce((s, r) => s + netOf(r) / r.stake.bigBet, 0);
  const v = (sum / records.length) * 100;
  const tenths = Math.sign(v) * Math.floor(Math.abs(v) * 10 + 0.5);
  if (tenths === 0) return '0.0';
  return `${tenths > 0 ? '+' : '-'}${(Math.abs(tenths) / 10).toFixed(1)}`;
}

/** Markup with React's text separators removed. */
const render = (view: StatisticsView): string =>
  renderToString(<StatisticsScreen view={view} onHome={() => undefined} />).replace(
    /<!-- -->/g,
    '',
  );

/** The BB/100 card's markup (the second section). */
const bbCard = (html: string): string =>
  html.slice(html.indexOf('aria-labelledby="stats-bb100-title"'));

const bbTitles = (html: string): string[] =>
  [...html.matchAll(/<circle[^>]*data-bb100-point[^>]*><title>([^<]*)<\/title>/g)].map(
    (m) => m[1] as string,
  );

it('AC#1 tampered big bets show a finite BB/100 point instead of failing', async () => {
  const bigBets = primes(500);
  expect(bigBets[499]).toBe(3571);
  const cloned = cloneRecords(cashPool(CASH_STAKES[2] as Stake, 8), {
    sessionId: 'e'.repeat(32),
    startedAt: new Date(Date.UTC(2026, 10, 1)),
    hands: 500,
    ended: true,
  });
  const records = cloned.records.map((record, i): HandRecord => ({
    ...record,
    stake: { ...record.stake, bigBet: bigBets[i] as number },
  }));
  const store = openHandStore(new IDBFactory(), 'bb100-tampered');
  await store.putSession(cloned.session);
  for (const record of records) await store.add(record);

  const data = await store.trendData();
  expect(data.hands).toHaveLength(500);

  const view = statisticsView(data);
  const html = render(view);
  const titles = bbTitles(bbCard(html));
  expect(titles).toHaveLength(1);
  expect(titles[0]).toMatch(/^Cash hands 1–500: (\+|-)?\d+\.\d$/);
  expect(titles[0]).toBe(`Cash hands 1–500: ${expectedText(records)}`);
  expect(html).not.toContain('aria-busy="true"');
  expect(html).not.toContain(LOAD_FAILED_MESSAGE);

  const bySession = statisticsView(data, data, 'session');
  expect(bySession.bb100.kind).toBe('points');
  const points = bySession.bb100.kind === 'points' ? bySession.bb100.points : [];
  expect(points).toHaveLength(1);
  expect(Number.isFinite(points[0]?.bb100)).toBe(true);
});
