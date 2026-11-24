import { describe, expect, it } from 'vitest';
import type { Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  parseSessionReport,
  rateTiles,
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

const decision = (grade: Grade, hinted = false): ReportDecision => ({ grade: { grade }, hinted });

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

const rates = (handsPlayed: number, major: number): string[] =>
  rateTiles(
    sessionReport(session(handsPlayed), ENDED, [
      hand(Array.from({ length: major }, () => decision('major'))),
    ]),
  ).map((t) => t.value);

describe('session report errors', () => {
  it('counts only unhinted decisions and rounds half up', () => {
    const report = sessionReport(session(3), ENDED, [
      hand([], true),
      hand([decision('minor', true), decision('major')]),
      hand([decision('correct'), decision('correct', true), decision('correct')]),
    ]);
    expect(report.errors).toEqual({ major: 1, minor: 0 });
    expect(rateTiles(report)).toEqual([
      { key: 'hands', label: 'Hands played', value: '3' },
      { key: 'major', label: 'Major errors /100', value: '33.3' },
      { key: 'minor', label: 'Minor errors /100', value: '0.0' },
    ]);
    expect(rates(8, 1)).toEqual(['8', '12.5', '0.0']);
    expect(rates(1500, 1)).toEqual(['1500', '0.1', '0.0']);
    expect(Object.keys(report).slice(-2)).toEqual(['style', 'errors']);
  });

  it('errors is present only when every hand carries decisions', () => {
    expect('errors' in sessionReport(session(2), ENDED)).toBe(false);
    expect('errors' in sessionReport(session(2), ENDED, [])).toBe(false);
    const mixed = sessionReport(session(2), ENDED, [hand([decision('major')]), hand()]);
    expect('errors' in mixed).toBe(false);
    expect(mixed.style).toBeDefined();
    expect(sessionReport(session(2), ENDED, [hand([]), hand([])]).errors).toEqual({
      major: 0,
      minor: 0,
    });
  });

  it('parseSessionReport validates errors and accepts reports without it', () => {
    const report = sessionReport(session(3), ENDED, [hand([decision('major'), decision('minor')])]);
    expect(report.errors).toEqual({ major: 1, minor: 1 });
    expect(parseSessionReport(JSON.parse(JSON.stringify(report)))).toEqual(report);

    const cases: [string, unknown][] = [
      ['errors', null],
      ['errors', [1]],
      ['errors.major', { major: -1, minor: 0 }],
      ['errors.major', { major: 1.5, minor: 0 }],
      ['errors.major', { major: '2', minor: 0 }],
      ['errors.major', { minor: 0 }],
      ['errors.minor', { major: 0, minor: -1 }],
      ['errors.minor', { major: 0, minor: 1.5 }],
      ['errors.minor', { major: 0, minor: '2' }],
      ['errors.minor', { major: 0 }],
    ];
    for (const [field, errors] of cases) {
      expect(() => parseSessionReport({ ...report, errors }), JSON.stringify(errors)).toThrow(
        new RangeError(`Invalid session report: ${field}`),
      );
    }

    const legacy = sessionReport(session(3), ENDED);
    expect(parseSessionReport(legacy)).toBe(legacy);
    expect(rateTiles(legacy)).toEqual([]);
  });
});
