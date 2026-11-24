import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { LEAK_CATEGORIES, type LeakCategory } from '../../src/stats/leaks';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  sessionReport,
  type ReportDecision,
  type ReportHand,
  type SessionReport,
} from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

// TASK-10.5: the "Biggest leaks this session" section of the Session Report (REQ-044.5, REQ-047.4, .5).

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');
const ME: SeatNumber = 1;
const NO_LEAKS = 'No leaks found this session (a leak needs 8+ spots with 40%+ errors).';

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
): ReportDecision => ({ street, action: { type }, grade: { grade }, hinted: false });

const times = (n: number, d: ReportDecision): ReportDecision[] =>
  Array.from({ length: n }, () => d);

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

const HEADING = '<h2 id="report-leaks-title">Biggest leaks this session</h2>';

describe('report leaks acceptance', () => {
  it('AC#7 a session with one leak shows its title, evidence and fix', () => {
    const r = report([
      ...times(2, decision('turn', 'call', 'minor')),
      ...times(2, decision('turn', 'call', 'major')),
      ...times(6, decision('turn', 'call', 'correct')),
      ...times(5, decision('flop', 'check', 'correct')),
    ]);
    const html = render(r);
    const section = leaksSection(html);
    const turnCalls = LEAK_CATEGORIES.find(
      (c) => c.id === 'turn-facing-a-bet-call',
    ) as LeakCategory;
    expect(section).toContain('aria-labelledby="report-leaks-title"');
    expect(section).toContain(HEADING);
    expect(section.match(/<li class="report-leak"/g)).toHaveLength(1);
    expect(section).toContain(
      '<ul class="report-leak-list"><li class="report-leak" data-category="turn-facing-a-bet-call">' +
        `<strong class="report-leak-title">${turnCalls.title}</strong>` +
        '<span class="report-leak-evidence">4 of 10 turn calls graded as errors</span>' +
        `<span class="report-leak-fix">${turnCalls.fix}</span></li></ul>`,
    );
    expect(section).not.toContain('report-leaks-none');

    const leaks = html.indexOf('<section class="report-leaks"');
    expect(leaks).toBeGreaterThan(html.indexOf('</section>', html.indexOf('class="report-style"')));
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html.indexOf('<button')).toBeGreaterThan(html.indexOf('</section>', leaks));
  });

  it('AC#8 a session without leaks shows the no-leaks sentence', () => {
    const none = `<p class="report-leaks-none">${NO_LEAKS}</p>`;
    const r = report([
      ...times(7, decision('river', 'raise', 'major')),
      ...times(3, decision('flop', 'bet', 'minor')),
      ...times(7, decision('flop', 'bet', 'correct')),
    ]);
    expect(r.leakCounts).toHaveLength(2);
    const section = leaksSection(render(r));
    expect(section).toContain(HEADING);
    expect(section).toContain(none);
    expect(section).not.toContain('report-leak"');
    expect(section).not.toContain('report-leak-list');

    const empty = report(times(3, decision('preflop', 'raise', 'major')));
    expect(empty.leakCounts).toEqual([]);
    expect(leaksSection(render(empty))).toContain(none);

    const legacy = render({ ...empty, leakCounts: undefined });
    expect(legacy).toContain('class="report-style"');
    expect(legacy).not.toContain('report-leaks');
  });
});
