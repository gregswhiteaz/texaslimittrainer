import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import {
  orderHands,
  statisticsView,
  trendHand,
  type TrendData,
  type TrendHand,
} from '../../src/stats/trends';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { mixedGrades, nineSessions, shuffled, statRecords } from '../support/stat-records';

// TASK-11.13 AC#1, AC#2: the trend view does not depend on input order, and a session with no record orders by
// its earliest completedAt.

it('AC#1 shuffled hands across sessions give the sorted-order points and totals', () => {
  const { records, sessions } = statRecords(nineSessions(3000), mixedGrades);
  const byStart = [...sessions].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  const byId = [...sessions].sort((a, b) => (a.sessionId < b.sessionId ? -1 : 1));
  expect(byStart.map((s) => s.sessionId)).not.toEqual(byId.map((s) => s.sessionId));

  // The test's own rule: session startedAt rank, then hand number.
  const rank = new Map(byStart.map((s, i) => [s.sessionId, i]));
  const key = (r: { sessionId: string; handNumber: number }): string =>
    `${r.sessionId}#${r.handNumber}`;
  const sorted = [...records].sort(
    (a, b) =>
      (rank.get(a.sessionId) as number) - (rank.get(b.sessionId) as number) ||
      a.handNumber - b.handNumber,
  );
  const input = shuffled(records);
  expect(input.map(key)).not.toEqual(sorted.map(key));

  const sessionStarts = new Map(sessions.map((s) => [s.sessionId, s.startedAt]));
  const shuffledData: TrendData = { hands: input.map(trendHand), sessionStarts };
  const sortedData: TrendData = { hands: sorted.map(trendHand), sessionStarts };
  for (const grouping of ['hands', 'session', 'day'] as const) {
    expect(statisticsView(shuffledData, shuffledData, grouping)).toEqual(
      statisticsView(sortedData, sortedData, grouping),
    );
  }

  const expected: string[] = [];
  let spanning = 0;
  for (let i = 0; i < 6; i++) {
    const slice = sorted.slice(i * 500, i * 500 + 500);
    const majors = slice
      .flatMap((r) => r.decisions)
      .filter((d) => !d.hinted && d.grade.grade === 'major').length;
    if (new Set(slice.map((r) => r.sessionId)).size > 1) spanning++;
    const first = (i * 500 + 1).toLocaleString('en-US');
    const last = (i * 500 + 500).toLocaleString('en-US');
    expected.push(`Hands ${first}–${last}: ${((majors * 100) / 500).toFixed(1)}`);
  }
  expect(spanning).toBeGreaterThan(0);
  expect(new Set(expected.map((t) => t.split(': ')[1])).size).toBeGreaterThan(1);

  const view = statisticsView(shuffledData);
  const html = renderToString(<StatisticsScreen view={view} onHome={() => undefined} />);
  const titles = [...html.matchAll(/<circle[^>]*data-point[^>]*><title>([^<]*)<\/title>/g)].map(
    (m) => m[1],
  );
  expect(titles).toEqual(expected);
  expect(view.totals).toBe('3,000 hands over 9 sessions');
  expect(html).toContain('3,000 hands over 9 sessions');
});

it('AC#2 a session without a record orders by its earliest completedAt', () => {
  const A = 'a'.repeat(32);
  const B = 'b'.repeat(32);
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
  // A (no record): 10:00 and 12:00, straddling B's record start of 11:00.
  const a1 = hand(A, 1, '2026-11-01T10:00:00.000Z', 1);
  const a2 = hand(A, 2, '2026-11-01T12:00:00.000Z');
  const b1 = hand(B, 1, '2026-11-01T11:00:01.000Z');
  const b2 = hand(B, 2, '2026-11-01T11:00:02.000Z');
  const data: TrendData = {
    hands: [a2, b2, a1, b1],
    sessionStarts: new Map([[B, '2026-11-01T11:00:00.000Z']]),
  };

  expect(orderHands(data).map((h) => [h.sessionId, h.handNumber])).toEqual([
    [A, 1],
    [A, 2],
    [B, 1],
    [B, 2],
  ]);

  const { chart } = statisticsView(data, data, 'session');
  expect(chart.kind).toBe('points');
  if (chart.kind !== 'points') return;
  expect(chart.points).toHaveLength(2);
  expect(chart.points[0]).toMatchObject({
    firstHand: 1,
    lastHand: 2,
    majorPer100: 50,
    group: { kind: 'session', number: 1 },
  });
  expect(chart.points[1]).toMatchObject({ majorPer100: 0, group: { kind: 'session', number: 2 } });
});
