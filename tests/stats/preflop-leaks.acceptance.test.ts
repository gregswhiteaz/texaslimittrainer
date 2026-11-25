import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import {
  decisionCategory,
  LEAK_CATEGORIES,
  parseLeakCategories,
  positionGroup,
  sessionLeaks,
  type PositionGroup,
} from '../../src/stats/leaks';
import data from '../../src/stats/leak-categories.json' with { type: 'json' };
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  sessionReport,
  type ReportDecision,
  type ReportHand,
  type SessionReport,
} from '../../src/table/session-report';

// TASK-10.6: preflop leaks by position group (REQ-047.1, .6, .7, .9).

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');

/** A stored cash session record of `handsPlayed` hands at `players` seats. */
function session(handsPlayed: number, players = 6): SessionRecord {
  const record = sessionRecord(seatSession({ players }), {
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

const decision = (type: ActionType, grade: Grade = 'correct'): ReportDecision => ({
  street: 'preflop',
  action: { type },
  grade: { grade },
  hinted: false,
});

/** A preflop fold-out hand at seats 1..`players`: the blinds on seats 1 and 2 (button `players`), then
 *  `actions` as [seat, type] pairs; the user on `userSeat` holds `decisions`. */
function hand(
  players: number,
  userSeat: SeatNumber,
  actions: readonly (readonly [SeatNumber, ActionRecord['type']])[],
  decisions: readonly ReportDecision[],
): ReportHand {
  return {
    userSeat,
    button: players,
    seats: Array.from({ length: players }, (_, i) => ({ seat: i + 1 })),
    actions: [act(1, 'small-blind'), act(2, 'big-blind'), ...actions.map(([s, t]) => act(s, t))],
    board: [],
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 12, amount: 12, winners: [{ seat: 2, amount: 12 }] }],
    },
    decisions,
  };
}

const report = (hands: readonly ReportHand[], players = 6): SessionReport =>
  sessionReport(session(hands.length, players), ENDED, hands);

const groups = (seats: readonly number[], button: number): PositionGroup[] =>
  seats.map((seat) => positionGroup(seats, button, seat));

const one = (category: string) => ({ category, decisions: 1, errors: 0, major: 0 });

describe('preflop leaks acceptance', () => {
  it('AC#1 groups a 9-player hand into blinds, early, middle and late', () => {
    expect(groups([1, 2, 3, 4, 5, 6, 7, 8, 9], 9)).toEqual([
      'blinds',
      'blinds',
      'early',
      'early',
      'early',
      'middle',
      'middle',
      'late',
      'late',
    ]);
  });

  it('AC#2 groups a 6-player hand with no early seats', () => {
    const seats = [1, 2, 3, 4, 5, 6];
    expect(groups(seats, 6)).toEqual(['blinds', 'blinds', 'middle', 'middle', 'late', 'late']);
    expect(groups(seats, 3)).toEqual(['middle', 'late', 'late', 'blinds', 'blinds', 'middle']);
  });

  it('AC#3 groups 4-player, 3-player and heads-up hands', () => {
    expect(groups([1, 2, 3, 4], 4)).toEqual(['blinds', 'blinds', 'late', 'late']);
    expect(groups([1, 2, 3], 3)).toEqual(['blinds', 'blinds', 'late']);
    expect(groups([1, 2], 1)).toEqual(['late', 'blinds']);
  });

  it('AC#4 classifies button open, big blind call, hijack re-raise and UTG fold', () => {
    const hands = [
      hand(
        6,
        6,
        [
          [3, 'fold'],
          [4, 'fold'],
          [5, 'fold'],
          [6, 'raise'],
        ],
        [decision('raise')],
      ),
      hand(
        6,
        2,
        [
          [3, 'fold'],
          [4, 'fold'],
          [5, 'raise'],
          [6, 'fold'],
          [1, 'fold'],
          [2, 'call'],
        ],
        [decision('call')],
      ),
      hand(
        6,
        4,
        [
          [3, 'raise'],
          [4, 'raise'],
        ],
        [decision('raise')],
      ),
      hand(9, 3, [[3, 'fold']], [decision('fold')]),
    ];
    expect(report(hands).leakCounts).toEqual([
      one('early-fold'),
      one('middle-raise'),
      one('late-open'),
      one('blinds-call'),
    ]);
    expect([
      decisionCategory('preflop', 'raise', { group: 'late', raisedBefore: false }),
      decisionCategory('preflop', 'call', { group: 'blinds', raisedBefore: true }),
      decisionCategory('preflop', 'raise', { group: 'middle', raisedBefore: true }),
      decisionCategory('preflop', 'fold', { group: 'early', raisedBefore: false }),
    ]).toEqual(['late-open', 'blinds-call', 'middle-raise', 'early-fold']);
  });

  it('AC#5 a limp and a small-blind complete are calls and a raise over a limper is an open', () => {
    const limp = hand(
      6,
      5,
      [
        [3, 'fold'],
        [4, 'fold'],
        [5, 'call'],
      ],
      [decision('call')],
    );
    const complete = hand(
      6,
      1,
      [
        [3, 'fold'],
        [4, 'fold'],
        [5, 'fold'],
        [6, 'fold'],
        [1, 'call'],
      ],
      [decision('call')],
    );
    const overLimper = hand(
      6,
      6,
      [
        [3, 'call'],
        [4, 'fold'],
        [5, 'fold'],
        [6, 'raise'],
      ],
      [decision('raise')],
    );
    expect(report([limp]).leakCounts).toEqual([one('late-call')]);
    expect(report([complete]).leakCounts).toEqual([one('blinds-call')]);
    expect(report([overLimper]).leakCounts).toEqual([one('late-open')]);
    expect(report([limp, complete, overLimper]).leakCounts).toEqual([
      one('late-open'),
      one('late-call'),
      one('blinds-call'),
    ]);
    expect([
      decisionCategory('preflop', 'call', { group: 'late', raisedBefore: false }),
      decisionCategory('preflop', 'call', { group: 'blinds', raisedBefore: false }),
      decisionCategory('preflop', 'raise', { group: 'late', raisedBefore: false }),
    ]).toEqual(['late-call', 'blinds-call', 'late-open']);
  });

  it('AC#6 a big blind check falls in no preflop category', () => {
    expect(decisionCategory('preflop', 'check', { group: 'blinds', raisedBefore: false })).toBe(
      null,
    );
    const check = (): ReportHand =>
      hand(
        6,
        2,
        [
          [3, 'fold'],
          [4, 'fold'],
          [5, 'fold'],
          [6, 'fold'],
          [1, 'call'],
          [2, 'check'],
        ],
        [decision('check', 'major')],
      );
    expect(report([check()]).leakCounts).toEqual([]);
    const eight = report(Array.from({ length: 8 }, check));
    expect(eight.leakCounts).toEqual([]);
    expect(sessionLeaks(eight.leakCounts ?? [])).toEqual([]);
    expect(eight.errors).toEqual({ major: 8, minor: 0 });
  });

  it('AC#7 all 16 preflop categories have a title, evidence name and a one-sentence fix', () => {
    const parsed = parseLeakCategories(data);
    expect(parsed).toEqual(LEAK_CATEGORIES);
    expect(parsed).toHaveLength(31);
    expect(parsed.slice(0, 15).every((c) => c.street !== 'preflop')).toBe(true);
    const preflop = LEAK_CATEGORIES.filter((c) => c.street === 'preflop');
    const expected = ['early', 'middle', 'late', 'blinds'].flatMap((group) =>
      ['fold', 'open', 'call', 'raise'].map((a) => `${group}-${a}`),
    );
    expect(preflop.map((c) => c.id)).toEqual(expected);
    for (const c of preflop) {
      expect(c.id).toBe(`${c.group}-${c.action}`);
      expect(c.title, c.id).toBe(c.title.trim());
      expect(c.title, c.id).not.toBe('');
      expect(c.title.endsWith('.'), c.id).toBe(false);
      expect(c.evidenceName.trim(), c.id).not.toBe('');
      expect(c.evidenceName, c.id).toBe(c.evidenceName.toLowerCase());
      expect(c.fix, c.id).toMatch(/^[A-Z][^.!?]*\.$/);
      expect(c.justification.trim(), c.id).not.toBe('');
    }
  });
});
