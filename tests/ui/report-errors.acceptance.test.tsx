import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import type { StyleCounts } from '../../src/stats/style-stats';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  rateTiles,
  sessionReport,
  type ReportDecision,
  type ReportHand,
  type SessionReport,
} from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');
const ME: SeatNumber = 1;

/** A stored 6-player cash session record of `handsPlayed` hands. */
function session(handsPlayed: number): SessionRecord {
  const record = sessionRecord(seatSession({ players: 6 }), {
    sessionId: SESSION,
    startedAt: STARTED,
    updatedAt: STARTED,
  });
  return { ...record, handsPlayed };
}

const act = (
  street: ActionRecord['street'],
  seat: SeatNumber,
  type: ActionRecord['type'],
): ActionRecord => ({ street, seat, type, amount: 0, added: 0 });

const decision = (grade: Grade, hinted = false): ReportDecision => ({ grade: { grade }, hinted });

/** A 6-seat fold-out hand with the user on seat 1 holding `decisions`. */
function hand(decisions: readonly ReportDecision[]): ReportHand {
  return {
    userSeat: ME,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat })),
    actions: [
      act('preflop', 2, 'small-blind'),
      act('preflop', 3, 'big-blind'),
      act('preflop', ME, 'fold'),
    ],
    board: [],
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 12, amount: 12, winners: [{ seat: 3, amount: 12 }] }],
    },
    decisions,
  };
}

/** `count` hands; hand i gets the decisions `extra(i)` returns plus one Correct decision. */
function hands(count: number, extra: (i: number) => readonly ReportDecision[]): ReportHand[] {
  return Array.from({ length: count }, (_, i) => hand([...extra(i), decision('correct')]));
}

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

const render = (report: SessionReport): string =>
  text(renderToString(<ReportScreen report={report} onHome={() => undefined} />));

/** Each rate tile as [data-rate, label, value]. */
function rates(html: string): [string, string, string][] {
  return [
    ...html.matchAll(
      /<div class="report-rate" data-rate="(\w+)"><dt>([^<]*)<\/dt><dd>([^<]*)<\/dd><\/div>/g,
    ),
  ].map((m) => [m[1] as string, m[2] as string, m[3] as string]);
}

const STYLE: StyleCounts = {
  handsDealt: 100,
  voluntary: 25,
  preflopRaised: 18,
  postflopAggressive: 11,
  postflopCalls: 9,
  sawFlop: 20,
  showdowns: 6,
  showdownsWon: 3,
};

const CASH: SessionReport = {
  sessionId: SESSION,
  startedAt: '2026-11-24T10:00:00.000Z',
  endedAt: '2026-11-24T14:30:00.000Z',
  gameType: 'cash',
  players: 6,
  stake: { smallBet: 4, bigBet: 8 },
  handsPlayed: 100,
  cash: { buyIn: 160, rebuys: 0, finalStack: 120, result: -40, bbPer100: -5 },
};

describe('report error rates acceptance', () => {
  it('AC#1 shows hands played 200 and error rates 6.0 and 14.0', () => {
    const report = sessionReport(
      session(200),
      ENDED,
      hands(200, (i) => [
        ...(i < 12 ? [decision('major')] : []),
        ...(i >= 100 && i < 128 ? [decision('minor')] : []),
      ]),
    );
    expect(report.errors).toEqual({ major: 12, minor: 28 });
    expect(rates(render(report))).toEqual([
      ['hands', 'Hands played', '200'],
      ['major', 'Major errors /100', '6.0'],
      ['minor', 'Minor errors /100', '14.0'],
    ]);
  });

  it('AC#2 hinted Major errors are not counted', () => {
    const report = sessionReport(
      session(200),
      ENDED,
      hands(200, (i) => [
        ...(i < 12 ? [decision('major')] : []),
        ...(i >= 50 && i < 55 ? [decision('major', true)] : []),
        ...(i >= 60 && i < 63 ? [decision('minor', true)] : []),
      ]),
    );
    expect(report.errors).toEqual({ major: 12, minor: 0 });
    expect(rates(render(report))).toEqual([
      ['hands', 'Hands played', '200'],
      ['major', 'Major errors /100', '6.0'],
      ['minor', 'Minor errors /100', '0.0'],
    ]);
  });

  it('AC#3 an all-correct session shows 0.0 for both rates', () => {
    const report = sessionReport(
      session(50),
      ENDED,
      hands(50, (i) => (i % 4 === 0 ? [decision('correct', true)] : [])),
    );
    expect(report.errors).toEqual({ major: 0, minor: 0 });
    expect(rates(render(report))).toEqual([
      ['hands', 'Hands played', '50'],
      ['major', 'Major errors /100', '0.0'],
      ['minor', 'Minor errors /100', '0.0'],
    ]);
  });

  it('the tiles are absent without errors and sit between the cash tiles and the style section', () => {
    const legacy = render(CASH);
    expect(legacy).not.toContain('report-rate');
    expect(rateTiles(CASH)).toEqual([]);

    const html = render({ ...CASH, style: STYLE, errors: { major: 3, minor: 7 } });
    const rateList = html.indexOf(
      '<dl class="report-kpis report-rates" aria-label="Volume and errors">',
    );
    expect(rateList).toBeGreaterThan(html.indexOf('</dl>'));
    expect(html.indexOf('<section class="report-style"')).toBeGreaterThan(
      html.indexOf('</dl>', rateList),
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(rates(html)).toEqual([
      ['hands', 'Hands played', '100'],
      ['major', 'Major errors /100', '3.0'],
      ['minor', 'Minor errors /100', '7.0'],
    ]);

    const sng = render({
      ...CASH,
      gameType: 'sit-and-go',
      stake: { smallBet: 20, bigBet: 40 },
      cash: null,
      errors: { major: 1, minor: 0 },
    });
    expect(sng.indexOf('<dl class="report-kpis report-rates"')).toBeGreaterThan(
      sng.indexOf('</header>'),
    );
    expect(sng.match(/<dl/g)).toHaveLength(1);
    expect(rates(sng)).toEqual([
      ['hands', 'Hands played', '100'],
      ['major', 'Major errors /100', '1.0'],
      ['minor', 'Minor errors /100', '0.0'],
    ]);
  });
});
