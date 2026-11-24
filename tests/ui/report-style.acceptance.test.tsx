import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HEALTHY_RANGES } from '../../src/stats/healthy-ranges';
import type { StyleCounts } from '../../src/stats/style-stats';
import type { SessionReport } from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');
/** Markup with tags removed. */
const plain = (html: string): string => html.replace(/<[^>]*>/g, '');

const REPORT: SessionReport = {
  sessionId: '0123456789abcdef0123456789abcdef',
  startedAt: '2026-11-23T10:00:00.000Z',
  endedAt: '2026-11-23T14:30:00.000Z',
  gameType: 'cash',
  players: 6,
  stake: { smallBet: 4, bigBet: 8 },
  handsPlayed: 100,
  cash: { buyIn: 160, rebuys: 0, finalStack: 120, result: -40, bbPer100: -5 },
};

const AC3_STYLE: StyleCounts = {
  handsDealt: 100,
  voluntary: 25,
  preflopRaised: 18,
  postflopAggressive: 11,
  postflopCalls: 9,
  sawFlop: 20,
  showdowns: 6,
  showdownsWon: 3,
};

const render = (report: SessionReport): string =>
  text(renderToString(<ReportScreen report={report} onHome={() => undefined} />));

/** Each style row as [data-stat, data-label, row text]. */
function rows(html: string): [string, string, string][] {
  return [
    ...html.matchAll(
      /<li class="report-style-row" data-stat="(\w+)">(.*?<strong class="report-style-label" data-label="([\w-]+)">.*?<\/strong>)<\/li>/g,
    ),
  ].map((m) => [m[1] as string, m[3] as string, plain(m[2] as string)]);
}

const range = (stat: keyof (typeof HEALTHY_RANGES)['6-max']): string =>
  `${HEALTHY_RANGES['6-max'][stat].low}–${HEALTHY_RANGES['6-max'][stat].high}%`;

describe('report style section acceptance', () => {
  it('AC#3 rows show VPIP 25.0%, PFR 18.0%, Aggression 55.0%, WTSD 30.0%, W$SD 50.0% with the 6-max ranges', () => {
    const html = render({ ...REPORT, style: AC3_STYLE });
    expect(html).toContain(
      '<section class="report-style" aria-labelledby="report-style-title"><h2 id="report-style-title">Your style vs healthy range (6-max)</h2>',
    );
    expect(rows(html)).toEqual([
      ['vpip', 'in-range', `VPIP You 25.0% · healthy ${range('vpip')} · in range`],
      ['pfr', 'in-range', `PFR You 18.0% · healthy ${range('pfr')} · in range`],
      [
        'aggression',
        'in-range',
        `Aggression You 55.0% · healthy ${range('aggression')} · in range`,
      ],
      ['wtsd', 'in-range', `WTSD You 30.0% · healthy ${range('wtsd')} · in range`],
      ['wsd', 'in-range', `W$SD You 50.0% · healthy ${range('wsd')} · in range`],
    ]);
    expect(range('vpip')).toBe('20–28%');
  });

  it('AC#6 the approximate section heading names the reference size', () => {
    const four = render({ ...REPORT, players: 4, style: AC3_STYLE });
    expect(four.match(/<h2[^>]*>.*?<\/h2>/g)).toEqual([
      '<h2 id="report-style-title">Your style vs healthy range (6-max, approximate)</h2>',
    ]);
    const eight = render({ ...REPORT, players: 8, style: AC3_STYLE });
    expect(eight).toContain('Your style vs healthy range (full ring, approximate)</h2>');
  });

  it('AC#7 — rows render not enough data and no range label', () => {
    const html = render({
      ...REPORT,
      handsPlayed: 10,
      cash: { buyIn: 160, rebuys: 0, finalStack: 120, result: -40, bbPer100: -50 },
      style: {
        handsDealt: 10,
        voluntary: 2,
        preflopRaised: 1,
        postflopAggressive: 0,
        postflopCalls: 0,
        sawFlop: 0,
        showdowns: 0,
        showdownsWon: 0,
      },
    });
    const all = rows(html);
    expect(all.map(([stat, label]) => [stat, label])).toEqual([
      ['vpip', 'in-range'],
      ['pfr', 'too-low'],
      ['aggression', 'no-data'],
      ['wtsd', 'no-data'],
      ['wsd', 'no-data'],
    ]);
    expect(all[0]?.[2]).toBe(`VPIP You 20.0% · healthy ${range('vpip')} · in range`);
    expect(all[1]?.[2]).toBe(`PFR You 10.0% · healthy ${range('pfr')} · too low`);
    for (const [stat, , row] of all.slice(2)) {
      const name = { aggression: 'Aggression', wtsd: 'WTSD', wsd: 'W$SD' }[stat];
      expect(row).toBe(`${name} You — · healthy ${range(stat as 'wtsd')} · not enough data`);
      for (const word of ['in range', 'too high', 'too low']) expect(row).not.toContain(word);
    }
  });

  it('the section is absent without style and sits before the only button', () => {
    const without = render(REPORT);
    expect(without).not.toContain('report-style');
    expect(without).not.toContain('<h2');
    expect(without.match(/<button/g)).toHaveLength(1);

    const html = render({ ...REPORT, style: AC3_STYLE });
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html.indexOf('<section class="report-style"')).toBeGreaterThan(html.indexOf('</dl>'));
    expect(html.indexOf('<button')).toBeGreaterThan(html.indexOf('</section>'));

    const sng = render({
      ...REPORT,
      gameType: 'sit-and-go',
      stake: { smallBet: 20, bigBet: 40 },
      cash: null,
      style: AC3_STYLE,
    });
    expect(sng).not.toContain('<dl');
    expect(sng.indexOf('<section class="report-style"')).toBeGreaterThan(sng.indexOf('</header>'));
    expect(sng.indexOf('<button')).toBeGreaterThan(sng.indexOf('</section>'));
  });
});
