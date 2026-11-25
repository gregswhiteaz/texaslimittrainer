import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  parseSessionReport,
  sessionReport,
  type ReportDecision,
  type ReportHand,
} from '../../src/table/session-report';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');
const ME: SeatNumber = 1;

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

/** A fold-out hand with the user on seat 1; `decisions` omitted when undefined. */
function hand(decisions?: readonly ReportDecision[], forcedFold = false): ReportHand {
  return {
    userSeat: ME,
    seats: [1, 2, 3].map((seat) => ({ seat })),
    actions: [act(2, 'small-blind'), act(3, 'big-blind'), act(ME, 'fold')],
    board: [],
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 6, amount: 6, winners: [{ seat: 3, amount: 6 }] }],
    },
    ...(forcedFold ? { forcedFold: true as const } : {}),
    ...(decisions === undefined ? {} : { decisions }),
  };
}

describe('session report leak counts', () => {
  it('leakCounts is present exactly when errors is', () => {
    expect('leakCounts' in sessionReport(session(2), ENDED)).toBe(false);
    expect('leakCounts' in sessionReport(session(2), ENDED, [])).toBe(false);
    const mixed = sessionReport(session(2), ENDED, [
      hand([decision('turn', 'call', 'major')]),
      hand(),
    ]);
    expect('leakCounts' in mixed).toBe(false);
    expect('errors' in mixed).toBe(false);

    const unclassified = sessionReport(session(4), ENDED, [
      hand([{ grade: { grade: 'major' }, hinted: false }]),
      hand([decision('preflop', 'raise', 'major')]),
      hand([decision('river', 'call', 'major', true)]),
      hand([], true),
    ]);
    expect(unclassified.errors).toEqual({ major: 2, minor: 0 });
    expect(unclassified.leakCounts).toEqual([]);

    const report = sessionReport(session(3), ENDED, [
      hand([decision('flop', 'bet', 'minor'), decision('turn', 'call', 'correct')]),
      hand([], true),
      hand([decision('flop', 'bet', 'major', true), decision('flop', 'bet', 'correct')]),
    ]);
    expect(report.leakCounts).toEqual([
      { category: 'flop-not-facing-a-bet-bet', decisions: 2, errors: 1, major: 0 },
      { category: 'turn-facing-a-bet-call', decisions: 1, errors: 0, major: 0 },
    ]);
    expect(Object.keys(report).slice(-3)).toEqual(['style', 'errors', 'leakCounts']);
  });

  it('parseSessionReport validates leakCounts', () => {
    const report = sessionReport(session(3), ENDED, [
      hand([
        decision('flop', 'fold', 'minor'),
        decision('turn', 'call', 'major'),
        decision('river', 'bet', 'correct'),
      ]),
    ]);
    expect(report.leakCounts).toHaveLength(3);
    expect(parseSessionReport(JSON.parse(JSON.stringify(report)))).toEqual(report);

    const flop = { category: 'flop-facing-a-bet-fold', decisions: 3, errors: 2, major: 1 };
    const river = { category: 'river-facing-a-bet-call', decisions: 1, errors: 0, major: 0 };
    const cases: [string, unknown][] = [
      ['leakCounts', null],
      ['leakCounts', {}],
      ['leakCounts[0]', [null]],
      ['leakCounts[1]', [flop, [river]]],
      ['leakCounts[0].category', [{ ...flop, category: 'preflop-raise' }]],
      ['leakCounts[0].category', [{ ...flop, category: 3 }]],
      ['leakCounts[1].category', [flop, flop]],
      ['leakCounts[1].category', [river, flop]],
      ['leakCounts[0].decisions', [{ ...flop, decisions: 0 }]],
      ['leakCounts[0].decisions', [{ ...flop, decisions: 1.5 }]],
      ['leakCounts[0].decisions', [{ ...flop, decisions: '3' }]],
      ['leakCounts[1].errors', [flop, { ...river, errors: 2 }]],
      ['leakCounts[0].errors', [{ ...flop, errors: -1 }]],
      ['leakCounts[0].major', [{ ...flop, major: 3 }]],
      ['leakCounts[0].major', [{ ...flop, major: undefined }]],
    ];
    for (const [field, leakCounts] of cases) {
      expect(
        () => parseSessionReport({ ...report, leakCounts }),
        JSON.stringify(leakCounts),
      ).toThrow(new RangeError(`Invalid session report: ${field}`));
    }
    expect(parseSessionReport({ ...report, leakCounts: [flop, river] })).toBeDefined();

    const legacy = sessionReport(session(3), ENDED);
    expect(parseSessionReport(legacy)).toBe(legacy);
  });
});
