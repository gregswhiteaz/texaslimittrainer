import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  sessionReport,
  type ReportDecision,
  type ReportHand,
  type SessionReport,
} from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

// TASK-10.8: the report lists at most 3 leaks, most costly first (REQ-044.5, REQ-047.3).

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-25T10:00:00Z');
const ENDED = new Date('2026-11-25T14:30:00Z');
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

const act = (seat: SeatNumber, type: ActionRecord['type']): ActionRecord => ({
  street: 'preflop',
  seat,
  type,
  amount: 0,
  added: 0,
});

const decision = (
  street: ReportDecision['street'],
  type: ActionType,
  grade: Grade,
  hinted = false,
): ReportDecision => ({ street, action: { type }, grade: { grade }, hinted });

const times = (n: number, d: ReportDecision): ReportDecision[] =>
  Array.from({ length: n }, () => d);

/** `decisions` unhinted decisions on `street`/`type`: `major` Major, `minor` Minor, the rest Correct. */
const spots = (
  street: ReportDecision['street'],
  type: ActionType,
  decisions: number,
  major: number,
  minor: number,
): ReportDecision[] => [
  ...times(major, decision(street, type, 'major')),
  ...times(minor, decision(street, type, 'minor')),
  ...times(decisions - major - minor, decision(street, type, 'correct')),
];

/** A 6-seat fold-out hand with the user on seat 1 holding `decisions`. */
function hand(decisions: readonly ReportDecision[]): ReportHand {
  return {
    userSeat: ME,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat })),
    actions: [act(2, 'small-blind'), act(3, 'big-blind'), act(ME, 'fold')],
    board: [],
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 12, amount: 12, winners: [{ seat: 3, amount: 12 }] }],
    },
    decisions,
  };
}

/** The report of a session with one hand per decision. */
const report = (decisions: readonly ReportDecision[]): SessionReport =>
  sessionReport(
    session(decisions.length),
    ENDED,
    decisions.map((d) => hand([d])),
  );

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

const render = (r: SessionReport): string =>
  text(renderToString(<ReportScreen report={r} onHome={() => undefined} />));

/** The leaks section's markup, or '' when absent. */
function leaksSection(html: string): string {
  const start = html.indexOf('<section class="report-leaks"');
  return start === -1 ? '' : html.slice(start, html.indexOf('</section>', start) + 10);
}

/** The `data-category` values of the section's items, in order. */
const shown = (section: string): string[] =>
  [...section.matchAll(/<li class="report-leak" data-category="([^"]+)"/g)].map((m) => m[1] ?? '');

describe('report leak ranking acceptance', () => {
  it('AC#1 a leak with more Major errors is listed first', () => {
    const r = report([
      ...spots('river', 'call', 10, 5, 1),
      ...spots('flop', 'call', 10, 3, 5),
      ...times(4, decision('flop', 'call', 'major', true)),
    ]);
    expect(r.leakCounts).toContainEqual({
      category: 'flop-facing-a-bet-call',
      decisions: 10,
      errors: 8,
      major: 3,
    });
    const section = leaksSection(render(r));
    expect(shown(section)).toEqual(['river-facing-a-bet-call', 'flop-facing-a-bet-call']);
    expect(section).toContain('6 of 10 river calls graded as errors');
    expect(section).toContain('8 of 10 flop calls graded as errors');
  });

  it('AC#2 equal Major errors list the higher error rate first', () => {
    const r = report([...spots('flop', 'call', 8, 4, 0), ...spots('turn', 'call', 8, 4, 1)]);
    const section = leaksSection(render(r));
    expect(shown(section)).toEqual(['turn-facing-a-bet-call', 'flop-facing-a-bet-call']);
    expect(section).toContain(
      '<span class="report-leak-evidence">5 of 8 turn calls graded as errors</span>',
    );
  });

  it('AC#3 five leaks show exactly the three highest-ranked', () => {
    const r = report([
      ...spots('flop', 'fold', 10, 1, 4),
      ...spots('flop', 'call', 10, 2, 3),
      ...spots('turn', 'call', 10, 3, 2),
      ...spots('river', 'call', 10, 4, 1),
      ...spots('river', 'bet', 10, 5, 0),
    ]);
    const section = leaksSection(render(r));
    expect(section).toContain('<h2 id="report-leaks-title">Biggest leaks this session</h2>');
    expect(section.match(/<li class="report-leak"/g)).toHaveLength(3);
    expect(shown(section)).toEqual([
      'river-not-facing-a-bet-bet',
      'river-facing-a-bet-call',
      'turn-facing-a-bet-call',
    ]);
    expect(section).not.toContain('flop-facing-a-bet-fold');
    expect(section).not.toContain('flop-facing-a-bet-call');
  });
});
