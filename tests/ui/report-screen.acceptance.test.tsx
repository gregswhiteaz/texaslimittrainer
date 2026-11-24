import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SessionReport } from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

const BASE = {
  sessionId: '0123456789abcdef0123456789abcdef',
  startedAt: '2026-11-23T10:00:00.000Z',
  endedAt: '2026-11-23T14:30:00.000Z',
  gameType: 'cash',
  players: 6,
  stake: { smallBet: 4, bigBet: 8 },
} as const;

const WON: SessionReport = {
  ...BASE,
  handsPlayed: 214,
  cash: { buyIn: 160, rebuys: 1, finalStack: 366, result: 46, bbPer100: 2.7 },
};
const LOST: SessionReport = {
  ...BASE,
  handsPlayed: 100,
  cash: { buyIn: 160, rebuys: 0, finalStack: 120, result: -40, bbPer100: -5 },
};

const render = (report: SessionReport): string =>
  text(renderToString(<ReportScreen report={report} onHome={() => undefined} />));

function tiles(html: string): [string, string, string][] {
  return [
    ...html.matchAll(
      /<div class="report-kpi" data-kpi="(\w+)"><dt>(.*?)<\/dt><dd>(.*?)<\/dd><\/div>/g,
    ),
  ].map((m) => [m[1] as string, m[2] as string, m[3] as string]);
}

describe('Report screen acceptance', () => {
  it('Session report screen shows the header line and cash tiles', () => {
    const won = render(WON);
    expect(won.match(/<h1[^>]*>.*?<\/h1>/gs)).toEqual(['<h1>Session report</h1>']);
    expect(won).toContain('<p class="report-header-line">Cash · 6 players · $4/$8 · 214 hands</p>');
    expect(tiles(won)).toEqual([
      ['result', 'Result', '+$46'],
      ['bb100', 'BB/100', '+2.7'],
      ['rebuys', 'Rebuys', '1'],
    ]);
    expect(won.match(/<button[^>]*>.*?<\/button>/gs)).toEqual([
      '<button type="button" class="report-home">Back to Home</button>',
    ]);
    expect(won.indexOf('<button')).toBeGreaterThan(won.indexOf('</dl>'));

    const lost = render(LOST);
    expect(lost).toContain('Cash · 6 players · $4/$8 · 100 hands</p>');
    expect(tiles(lost)).toEqual([
      ['result', 'Result', '-$40'],
      ['bb100', 'BB/100', '-5.0'],
      ['rebuys', 'Rebuys', '0'],
    ]);

    const twelve = render({
      ...LOST,
      handsPlayed: 12,
      cash: { buyIn: 160, rebuys: 0, finalStack: 120, result: -40, bbPer100: -41.7 },
    });
    expect(twelve).toMatch(/<p class="report-header-line">[^<]* · 12 hands<\/p>/);

    const sng = render({
      ...BASE,
      gameType: 'sit-and-go',
      stake: { smallBet: 20, bigBet: 40 },
      handsPlayed: 12,
      cash: null,
    });
    expect(sng).toContain(
      '<p class="report-header-line">Sit-and-go · 6 players · 20/40 · 12 hands</p>',
    );
    expect(sng).not.toContain('<dl');
    expect(sng.match(/<button[^>]*>.*?<\/button>/gs)).toHaveLength(1);
  });
});
