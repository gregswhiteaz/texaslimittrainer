import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  G2_CAPTION,
  statisticsView,
  trendHand,
  type StatisticsView,
  type TrendData,
} from '../../src/stats/trends';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import { CASH_STAKES, type Stake } from '../../src/table/session';
import type { SessionRecord } from '../../src/table/session-record';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import {
  cashPool,
  cloneRecords,
  forcedFoldRecord,
  nineSessions,
  sitAndGoPool,
  statRecords,
  withGrades,
  type DecisionGrade,
  type StatSession,
} from '../support/stat-records';

// TASK-11.3: the G-2 target line on the Major-error trend (AC#1–AC#5) at module and renderToString level.

const STAKE = CASH_STAKES.find((s) => s.bigBet === 8) as Stake;
// 24 really played hands in total (A-6), cloned to the counts each test needs.
const POOL = {
  cash6: cashPool(STAKE, 8),
  cash9: cashPool(STAKE, 8, 9),
  sng2: sitAndGoPool(8, 2),
};

const CORRECT: DecisionGrade = { grade: 'correct', hinted: false };
const UNHINTED_MAJOR: DecisionGrade = { grade: 'major', hinted: false };
const HINTED_MAJOR: DecisionGrade = { grade: 'major', hinted: true };

interface Stored {
  readonly records: readonly HandRecord[];
  readonly sessions: readonly SessionRecord[];
}

/** The records as trendData() returns them: parsed, then reduced to trend hands. */
const dataOf = ({ records, sessions }: Stored): TrendData => ({
  hands: records.map((r) => trendHand(parseHandRecord(r))),
  sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
});

/** Markup with React's text separators removed. */
const render = (view: StatisticsView): string =>
  renderToString(<StatisticsScreen view={view} onHome={() => undefined} />).replace(
    /<!-- -->/g,
    '',
  );

/** The Major-error card's markup (the first section). */
const majorCard = (html: string): string =>
  html.slice(0, html.indexOf('aria-labelledby="stats-bb100-title"'));
const majorPoints = (html: string): number =>
  (majorCard(html).match(/<circle[^>]*data-point=/g) ?? []).length;
const targetLines = (html: string): string[] =>
  majorCard(html).match(/<line[^>]*class="stats-target"[^>]*>/g) ?? [];
const ariaLabel = (html: string): string | undefined =>
  /<svg[^>]*role="img"[^>]*aria-label="([^"]*)"/.exec(majorCard(html))?.[1];
const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
const captions = (html: string): number =>
  majorCard(html).split(`<p class="stats-goal">${G2_CAPTION}</p>`).length - 1;

const sessionAt = (id: string, hour: number, hands: number): StatSession => ({
  sessionId: id.repeat(32),
  startedAt: new Date(Date.UTC(2026, 10, 1, hour)),
  hands,
  ended: true,
});

/** Sessions of pool clones started an hour apart in the order given; record i (0-based, chronological) gets
 *  `gradeFor(i, record)`'s grades. */
function seeded(
  layout: readonly { id: string; pool: readonly HandRecord[]; hands: number }[],
  gradeFor: (index: number, record: HandRecord) => (decision: number) => DecisionGrade,
): Stored {
  const records: HandRecord[] = [];
  const sessions: SessionRecord[] = [];
  layout.forEach(({ id, pool, hands }, i) => {
    const cloned = cloneRecords(pool, sessionAt(id, i, hands));
    for (const record of cloned.records) {
      records.push(withGrades(record, gradeFor(records.length, record)));
    }
    sessions.push(cloned.session);
  });
  return { records, sessions };
}

/** The test's own count: by session start, then hand number; unhinted Majors of the first 1,000, ÷ 1,000 × 100
 *  ÷ 2, rounded to tenths. */
function expectedTarget({ records, sessions }: Stored): number {
  const start = new Map(sessions.map((s) => [s.sessionId, Date.parse(s.startedAt)]));
  const first = [...records]
    .sort(
      (a, b) =>
        (start.get(a.sessionId) as number) - (start.get(b.sessionId) as number) ||
        a.handNumber - b.handNumber,
    )
    .slice(0, 1000);
  let majors = 0;
  for (const record of first) {
    for (const d of record.decisions) if (d.grade.grade === 'major' && !d.hinted) majors++;
  }
  // majors ÷ 1,000 × 100 ÷ 2 = majors ÷ 20, i.e. majors ÷ 2 tenths.
  return Math.round(majors / 2) / 10;
}

describe('G-2 target line acceptance', () => {
  it('AC#1 999 stored hands draw no target line', () => {
    const sessions = [sessionAt('1', 0, 500), sessionAt('2', 1, 499)];
    const stored = statRecords(sessions, (_s, n, d) =>
      n % 25 === 0 && d === 0 ? UNHINTED_MAJOR : CORRECT,
    );
    expect(stored.records).toHaveLength(999);
    const view = statisticsView(dataOf(stored));
    expect(view.g2Target).toBeNull();

    const html = render(view);
    expect(majorPoints(html)).toBe(1);
    expect(majorCard(html)).not.toContain('stats-target');
    expect(html).not.toContain(G2_CAPTION);
    expect(ariaLabel(html)).toMatch(/^Major errors per 100 hands, one point/);
    expect(ariaLabel(html)).not.toContain('Dashed target line');
  });

  it('AC#2 1,000 hands with 62 unhinted Majors draw a dashed target line at 3.1', () => {
    const sessions = [sessionAt('1', 0, 500), sessionAt('2', 1, 500)];
    // 31 unhinted Majors in each 500-hand session; Minors elsewhere.
    const stored = statRecords(sessions, (_s, n, d) => {
      if (d === 0 && n <= 31) return UNHINTED_MAJOR;
      return { grade: d === 1 && n % 3 === 0 ? 'minor' : 'correct', hinted: false };
    });
    expect(stored.records).toHaveLength(1000);
    const view = statisticsView(dataOf(stored));
    expect(view.g2Target).toBe(3.1);
    expect(view.chart).toEqual({
      kind: 'points',
      points: [
        { firstHand: 1, lastHand: 500, majorPer100: 6.2 },
        { firstHand: 501, lastHand: 1000, majorPer100: 6.2 },
      ],
    });

    const html = render(view);
    const lines = targetLines(html);
    expect(lines).toHaveLength(1);
    const line = lines[0] as string;
    expect(attr(line, 'stroke-dasharray')).toBe('6 5');
    expect(attr(line, 'x1')).toBe('0');
    expect(attr(line, 'x2')).toBe('400');
    expect(attr(line, 'y1')).toBe('80');
    expect(attr(line, 'y2')).toBe('80');
    expect(captions(html)).toBe(1);
    expect(html.split(G2_CAPTION)).toHaveLength(2);
    expect(ariaLabel(html)).toBe(
      'Major errors per 100 hands, one point per 500 hands: 6.2, 6.2. Dashed target line at 3.1',
    );
  });

  it('AC#3 the target counts only unhinted Majors in the first 1,000 chronological hands', () => {
    const layout = nineSessions(1500);
    const ids = layout.map((s) => s.sessionId);
    expect([...ids].sort()).not.toEqual(ids);
    const offsets = layout.map((_, s) =>
      layout.slice(0, s).reduce((sum, session) => sum + session.hands, 0),
    );
    // Chronological position c (1-based): unhinted Majors at 20–81, hinted Majors at 100–119, and 40 more
    // unhinted Majors at 1,001–1,040.
    const built = statRecords(layout, (s, n, d) => {
      const c = (offsets[s] as number) + n;
      if (d === 0 && ((c >= 20 && c <= 81) || (c >= 1001 && c <= 1040))) return UNHINTED_MAJOR;
      if (d === 1 && c >= 100 && c <= 119) return HINTED_MAJOR;
      return CORRECT;
    });
    // Chronological hand 11 is a real forced fold.
    const first = built.records[10] as HandRecord;
    const forced = forcedFoldRecord(first.sessionId, first.handNumber, new Date(first.completedAt));
    const records = built.records.map((r, i) => (i === 10 ? forced : r));
    const stored = { records, sessions: built.sessions };
    expect(records).toHaveLength(1500);

    const count = (from: number, to: number, hinted: boolean): number =>
      records
        .slice(from, to)
        .flatMap((r) => r.decisions)
        .filter((d) => d.grade.grade === 'major' && d.hinted === hinted).length;
    expect(count(0, 1000, false)).toBe(62);
    expect(count(0, 1000, true)).toBe(20);
    expect(count(1000, 1500, false)).toBe(40);

    const target = statisticsView(dataOf(stored)).g2Target;
    expect(target).toBe(3.1);
    expect(target).toBe(expectedTarget(stored));
  });

  it('AC#4 with a Cash filter of 600 hands the line still shows once 1,000 hands are stored', () => {
    let hinted = 0;
    const stored = seeded(
      [
        { id: '4', pool: POOL.cash6, hands: 600 },
        { id: '8', pool: POOL.sng2, hands: 400 },
      ],
      (_i, record) => {
        const hint = record.decisions.length > 0 && hinted < 60;
        if (hint) hinted++;
        return (d) => (hint && d === 0 ? HINTED_MAJOR : CORRECT);
      },
    );
    expect(hinted).toBe(60);
    expect(stored.records).toHaveLength(1000);

    const all = dataOf(stored);
    const cashOnly = (s: Stored): TrendData =>
      dataOf({ ...s, records: s.records.filter((r) => r.gameType === 'cash') });
    const view = statisticsView(cashOnly(stored), all);
    expect(view.hands).toBe(600);
    expect(view.g2Target).not.toBeNull();
    const html = render(view);
    expect(majorPoints(html)).toBe(1);
    expect(targetLines(html)).toHaveLength(1);
    expect(captions(html)).toBe(1);

    const fewer = { ...stored, records: stored.records.slice(0, 999) };
    const fewerView = statisticsView(cashOnly(fewer), dataOf(fewer));
    expect(fewerView.hands).toBe(600);
    expect(fewerView.g2Target).toBeNull();
    const fewerHtml = render(fewerView);
    expect(majorPoints(fewerHtml)).toBe(1);
    expect(targetLines(fewerHtml)).toHaveLength(0);
    expect(fewerHtml).not.toContain(G2_CAPTION);
  });

  it('AC#5 the target stays at 3.1 under every table size, game type and line-up filter', () => {
    let early = 0;
    const stored = seeded(
      [
        { id: '6', pool: POOL.cash6, hands: 600 },
        { id: '2', pool: POOL.sng2, hands: 400 },
        { id: 'c', pool: POOL.sng2, hands: 200 },
        { id: '1', pool: POOL.cash9, hands: 500 },
      ],
      (i, record) => {
        if (record.decisions.length === 0) return () => CORRECT;
        // The first 1,000: 62 unhinted Majors. After them: every decision is an unhinted Major.
        if (i >= 1000) return () => UNHINTED_MAJOR;
        const major = early < 62;
        if (major) early++;
        return (d) => (major && d === 0 ? UNHINTED_MAJOR : CORRECT);
      },
    );
    expect(early).toBe(62);
    expect(stored.records).toHaveLength(1700);
    expect(expectedTarget(stored)).toBe(3.1);

    const all = dataOf(stored);
    const lineUps = [...new Set(stored.records.map((r) => r.lineUp))];
    const filters: [string, (r: HandRecord) => boolean][] = [
      ['All', () => true],
      ['Cash', (r) => r.gameType === 'cash'],
      ['Sit-and-go', (r) => r.gameType === 'sit-and-go'],
      ['Heads-up', (r) => r.seats.length === 2],
      ['6-max', (r) => r.seats.length >= 3 && r.seats.length <= 7],
      ['Full ring', (r) => r.seats.length >= 8 && r.seats.length <= 10],
      ...lineUps.map((lineUp): [string, (r: HandRecord) => boolean] => [
        lineUp,
        (r) => r.lineUp === lineUp,
      ]),
    ];
    const sizes: Record<string, number> = {};
    for (const [name, keep] of filters) {
      const filtered = stored.records.filter(keep);
      sizes[name] = filtered.length;
      const view = statisticsView(dataOf({ ...stored, records: filtered }), all);
      expect(view.g2Target, name).toBe(3.1);
      if (view.chart.kind !== 'points') continue;
      const yMax = Math.max(1, 3.1, ...view.chart.points.map((p) => p.majorPer100));
      const y = String(Math.round((150 - (3.1 / yMax) * 140) * 10) / 10);
      const lines = targetLines(render(view));
      expect(lines, name).toHaveLength(1);
      expect(attr(lines[0] as string, 'y1'), name).toBe(y);
      expect(attr(lines[0] as string, 'y2'), name).toBe(y);
    }
    expect(sizes).toMatchObject({
      All: 1700,
      Cash: 1100,
      'Sit-and-go': 600,
      'Heads-up': 600,
      '6-max': 600,
      'Full ring': 500,
    });
  });
});
