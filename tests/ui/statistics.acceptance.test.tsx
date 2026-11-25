import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { statisticsView, trendHand, type StatisticsView } from '../../src/stats/trends';
import { StatisticsScreen } from '../../src/ui/stats/StatisticsScreen';
import { mixedGrades, nineSessions, statRecords } from '../support/stat-records';

// TASK-11.1: the Statistics screen's markup for each state (AC#6–AC#8, A-10, D-7).

const SESSION = '6'.repeat(32);

/** Markup with React's text separators removed. */
const render = (view: StatisticsView | undefined | null): string =>
  renderToString(<StatisticsScreen view={view} onHome={() => undefined} />).replace(
    /<!-- -->/g,
    '',
  );

const viewOf = (hands: number): StatisticsView =>
  statisticsView({
    hands: Array.from({ length: hands }, (_, i) => ({
      sessionId: SESSION,
      handNumber: i + 1,
      completedAt: '2026-11-20T10:00:00.000Z',
      unhintedMajors: 0,
    })),
    sessionStarts: new Map(),
  });

const message = (html: string): string | undefined =>
  /<p class="stats-message">([^<]*)<\/p>/.exec(html)?.[1];
const totals = (html: string): string | undefined =>
  /<p class="stats-totals">([^<]*)<\/p>/.exec(html)?.[1];

describe('Statistics screen acceptance', () => {
  it('AC#6 320 and 499 hands show the play-more message instead of a chart', () => {
    const html320 = render(viewOf(320));
    expect(message(html320)).toBe('Play 180 more hands to see your first trend point.');
    expect(html320).not.toContain('<svg');
    expect(totals(html320)).toBe('320 hands over 1 session');

    const html499 = render(viewOf(499));
    expect(message(html499)).toBe('Play 1 more hand to see your first trend point.');
    expect(html499).not.toContain('<svg');
  });

  it('AC#7 no hands shows the first-hand message and 0 totals', () => {
    const html = render(viewOf(0));
    expect(message(html)).toBe('Play your first hand to see trends.');
    expect(totals(html)).toBe('0 hands over 0 sessions');
    expect(html).not.toContain('more hand');
    expect(html).not.toContain('<svg');
  });

  it('AC#8 1,840 hands over 9 sessions are totalled', () => {
    const { records, sessions } = statRecords(nineSessions(1840), mixedGrades);
    const view = statisticsView({
      hands: records.map(trendHand),
      sessionStarts: new Map(sessions.map((s) => [s.sessionId, s.startedAt])),
    });
    const html = render(view);
    expect(totals(html)).toBe('1,840 hands over 9 sessions');
    expect(html.match(/<circle[^>]*data-point/g)).toHaveLength(3);
    expect(html).toMatch(
      /<svg[^>]*role="img"[^>]*aria-label="Major errors per 100 hands, one point/,
    );
    expect(html).toContain('<p class="stats-note">Each point is 500 hands. Lower is better.</p>');
    expect(html).toContain('<h2 id="stats-major-title">Major errors per 100 hands</h2>');
    expect(message(html)).toBeUndefined();
  });

  it('loading and read-failure states', () => {
    const loading = render(undefined);
    expect(loading).toContain('<h1>Statistics</h1>');
    expect(loading).toContain('← Home</button>');
    expect(loading).toMatch(/<section[^>]*class="panel stats-chart"[^>]*aria-busy="true"/);
    expect(message(loading)).toBeUndefined();
    expect(totals(loading)).toBeUndefined();
    expect(loading).not.toContain('<svg');

    const failed = render(null);
    expect(message(failed)).toBe('Your statistics could not be loaded.');
    expect(totals(failed)).toBeUndefined();
    expect(failed).not.toContain('<svg');
    expect(failed).not.toContain('aria-busy');
  });
});
