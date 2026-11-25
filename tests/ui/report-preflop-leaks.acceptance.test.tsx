import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { LEAK_CATEGORIES, type LeakCategory } from '../../src/stats/leaks';
import { seatSession } from '../../src/table/session';
import { sessionRecord } from '../../src/table/session-record';
import { sessionReport, type ReportHand, type SessionReport } from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

// TASK-10.6: a preflop leak in the "Biggest leaks this session" section (REQ-047.7, REQ-047.2, REQ-044.5).

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');
const UTG: SeatNumber = 3;

const act = (seat: SeatNumber, type: ActionRecord['type']): ActionRecord => ({
  street: 'preflop',
  seat,
  type,
  amount: 0,
  added: 0,
});

/** A 9-player hand, button 9, where the user folds under the gun graded `grade`. */
const utgFold = (grade: Grade): ReportHand => ({
  userSeat: UTG,
  button: 9,
  seats: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((seat) => ({ seat })),
  actions: [act(1, 'small-blind'), act(2, 'big-blind'), act(UTG, 'fold')],
  board: [],
  result: {
    endedBy: 'fold',
    showdown: [],
    awards: [{ pot: 12, amount: 12, winners: [{ seat: 2, amount: 12 }] }],
  },
  decisions: [{ street: 'preflop', action: { type: 'fold' }, grade: { grade }, hinted: false }],
});

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

function leaksSection(html: string): string {
  const start = html.indexOf('<section class="report-leaks"');
  return start === -1 ? '' : html.slice(start, html.indexOf('</section>', start) + 10);
}

describe('report preflop leaks acceptance', () => {
  it('AC#8 the report lists the early-position folds leak with evidence and fix', () => {
    const grades: Grade[] = [
      'minor',
      'major',
      'minor',
      'major',
      ...Array<Grade>(6).fill('correct'),
    ];
    const record = sessionRecord(seatSession({ players: 9 }), {
      sessionId: SESSION,
      startedAt: STARTED,
      updatedAt: STARTED,
    });
    const report: SessionReport = sessionReport(
      { ...record, handsPlayed: grades.length },
      ENDED,
      grades.map(utgFold),
    );
    expect(report.leakCounts).toEqual([
      { category: 'early-fold', decisions: 10, errors: 4, major: 2 },
    ]);
    const section = leaksSection(
      text(renderToString(<ReportScreen report={report} onHome={() => undefined} />)),
    );
    const earlyFold = LEAK_CATEGORIES.find((c) => c.id === 'early-fold') as LeakCategory;
    expect(section.match(/<li class="report-leak"/g)).toHaveLength(1);
    expect(section).toContain(
      '<li class="report-leak" data-category="early-fold">' +
        `<strong class="report-leak-title">${earlyFold.title}</strong>` +
        '<span class="report-leak-evidence">4 of 10 early-position folds graded as errors</span>' +
        `<span class="report-leak-fix">${earlyFold.fix}</span></li>`,
    );
  });
});
