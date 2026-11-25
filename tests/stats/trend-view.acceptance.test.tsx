import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { statisticsView, trendHand } from '../../src/stats/trends';
import type { HandRecord } from '../../src/table/hand-record';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { mixedGrades, nineSessions, statRecords } from '../support/stat-records';

// TASK-11.1 AC#2 (D-8): 3,000 in-memory records over 9 sessions, no IndexedDB and no custom timeout.

it('AC#2 3,000 hands over 9 sessions plot 6 points recomputed from the hand records', () => {
  const layout = nineSessions(3000);
  const { records, sessions } = statRecords(layout, mixedGrades);
  expect(records).toHaveLength(3000);
  expect(new Set(layout.map((s) => s.hands)).size).toBeGreaterThan(1);
  const byStart = [...sessions].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  const byId = [...sessions].sort((a, b) => (a.sessionId < b.sessionId ? -1 : 1));
  expect(byStart.map((s) => s.sessionId)).not.toEqual(byId.map((s) => s.sessionId));
  const decisions = records.flatMap((r) => r.decisions);
  for (const grade of ['major', 'minor', 'correct'] as const) {
    for (const hinted of [true, false]) {
      expect(decisions.some((d) => d.grade.grade === grade && d.hinted === hinted)).toBe(true);
    }
  }

  // The test's own recomputation: session start, then hand number; 500-hand slices.
  const rank = new Map(byStart.map((s, i) => [s.sessionId, i]));
  const ordered = [...records].sort(
    (a, b) =>
      (rank.get(a.sessionId) as number) - (rank.get(b.sessionId) as number) ||
      a.handNumber - b.handNumber,
  );
  const expected: string[] = [];
  let spanning = 0;
  for (let i = 0; i < 6; i++) {
    const slice: HandRecord[] = ordered.slice(i * 500, i * 500 + 500);
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

  const view = statisticsView({
    hands: records.map(trendHand),
    sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
  });
  const html = renderToString(<StatisticsScreen view={view} onHome={() => undefined} />);
  const titles = [...html.matchAll(/<circle[^>]*data-point[^>]*><title>([^<]*)<\/title>/g)].map(
    (m) => m[1],
  );
  expect(titles).toEqual(expected);
  expect(html).toContain('3,000 hands over 9 sessions');
});
