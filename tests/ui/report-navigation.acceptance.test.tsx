import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SessionReport } from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

// TASK-11.6: the Session Report's View statistics and Back to Home controls (REQ-044.6).

const text = (html: string): string => html.replace(/<!-- -->/g, '');

const BASE = {
  sessionId: '0123456789abcdef0123456789abcdef',
  startedAt: '2026-11-23T10:00:00.000Z',
  endedAt: '2026-11-23T14:30:00.000Z',
  gameType: 'cash',
  players: 6,
  stake: { smallBet: 4, bigBet: 8 },
} as const;

const CASH: SessionReport = {
  ...BASE,
  handsPlayed: 40,
  cash: { buyIn: 160, rebuys: 0, finalStack: 200, result: 40, bbPer100: 12.5 },
  style: {
    handsDealt: 40,
    voluntary: 10,
    preflopRaised: 7,
    postflopAggressive: 12,
    postflopCalls: 6,
    sawFlop: 9,
    showdowns: 3,
    showdownsWon: 2,
  },
  leakCounts: [],
};

const SNG: SessionReport = {
  ...BASE,
  gameType: 'sit-and-go',
  stake: { smallBet: 20, bigBet: 40 },
  handsPlayed: 12,
  cash: null,
};

const STATISTICS = '<button type="button" class="button-outline">View statistics</button>';
const HOME = '<button type="button" class="report-home">Back to Home</button>';
const BUTTONS = /<button[^>]*>.*?<\/button>/gs;

const noop = (): void => undefined;

describe('Report navigation acceptance', () => {
  it('AC#1 the report lists View statistics then Back to Home at the bottom', () => {
    for (const report of [CASH, SNG]) {
      const html = text(
        renderToString(<ReportScreen report={report} onHome={noop} onStatistics={noop} />),
      );
      expect(html.match(BUTTONS)).toEqual([STATISTICS, HOME]);
      expect(html.match(/<div class="report-actions">/g)).toHaveLength(1);
      expect(html.endsWith(`<div class="report-actions">${STATISTICS}${HOME}</div></main>`)).toBe(
        true,
      );
      const content = Math.max(
        html.lastIndexOf('</section>'),
        html.lastIndexOf('</dl>'),
        html.lastIndexOf('</header>'),
      );
      expect(html.indexOf('<div class="report-actions">')).toBeGreaterThan(content);
    }
    const cash = text(
      renderToString(<ReportScreen report={CASH} onHome={noop} onStatistics={noop} />),
    );
    expect(cash.indexOf('<div class="report-actions">')).toBeGreaterThan(
      cash.lastIndexOf('</section>'),
    );
    expect(cash.lastIndexOf('</section>')).toBeGreaterThan(cash.lastIndexOf('</dl>'));
  });

  it('without onStatistics only Back to Home renders', () => {
    for (const report of [CASH, SNG]) {
      const html = text(renderToString(<ReportScreen report={report} onHome={noop} />));
      expect(html.match(BUTTONS)).toEqual([HOME]);
      expect(html).not.toContain('View statistics');
      expect(html.endsWith(`<div class="report-actions">${HOME}</div></main>`)).toBe(true);
    }
  });
});
