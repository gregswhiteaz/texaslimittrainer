import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  hintTile,
  sessionReport,
  type ReportDecision,
  type ReportHand,
  type SessionReport,
} from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

// TASK-10.7: the Session Report shows how many of the user's decisions were hinted (REQ-044.3, REQ-040.4).

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');
const ME: SeatNumber = 1;
const GRADES: readonly Grade[] = ['correct', 'minor', 'major'];

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

/** `count` hands of `perHand` decisions each; decision n (0-based over the session) is hinted iff
 *  `hinted(n)`, with grades cycling Correct, Minor, Major. */
function hands(count: number, perHand: number, hinted: (n: number) => boolean): ReportHand[] {
  return Array.from({ length: count }, (_, i) =>
    hand(
      Array.from({ length: perHand }, (_, j) => {
        const n = i * perHand + j;
        return decision(GRADES[n % 3] as Grade, hinted(n));
      }),
    ),
  );
}

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

const render = (report: SessionReport): string =>
  text(renderToString(<ReportScreen report={report} onHome={() => undefined} />));

/** The "Volume and errors" list's markup. */
function rateList(html: string): string {
  const start = html.indexOf(
    '<dl class="report-kpis report-rates" aria-label="Volume and errors">',
  );
  expect(start).toBeGreaterThanOrEqual(0);
  return html.slice(start, html.indexOf('</dl>', start) + '</dl>'.length);
}

const tile = (value: string): string =>
  `<div class="report-hints" data-hints="hinted"><dt>Hints used</dt><dd>${value}</dd></div>`;

describe('report hint usage acceptance', () => {
  it('AC#1 shows 40 of 320 decisions hinted as 12.5%', () => {
    const report = sessionReport(
      session(160),
      ENDED,
      hands(160, 2, (n) => n % 8 === 0),
    );
    expect(report.hints).toEqual({ hinted: 40, decisions: 320 });
    expect(hintTile(report)).toEqual({ label: 'Hints used', value: '40 of 320 decisions (12.5%)' });
    const list = rateList(render(report));
    const rates = [...list.matchAll(/<div class="report-rate" data-rate="(\w+)">/g)].map(
      (m) => m[1],
    );
    expect(rates).toEqual(['hands', 'major', 'minor']);
    expect(list.endsWith(`${tile('40 of 320 decisions (12.5%)')}</dl>`)).toBe(true);
    expect(list.indexOf('report-hints')).toBeGreaterThan(list.lastIndexOf('report-rate'));
  });

  it('AC#2 shows 0 hinted decisions as 0.0%', () => {
    const report = sessionReport(
      session(160),
      ENDED,
      hands(160, 2, () => false),
    );
    expect(report.hints).toEqual({ hinted: 0, decisions: 320 });
    expect(rateList(render(report))).toContain(tile('0 of 320 decisions (0.0%)'));
  });

  it('AC#3 shows 25 of 25 decisions hinted as 100.0%', () => {
    const report = sessionReport(
      session(5),
      ENDED,
      hands(5, 5, () => true),
    );
    expect(report.hints).toEqual({ hinted: 25, decisions: 25 });
    expect(report.errors).toEqual({ major: 0, minor: 0 });
    expect(rateList(render(report))).toContain(tile('25 of 25 decisions (100.0%)'));
  });
});
