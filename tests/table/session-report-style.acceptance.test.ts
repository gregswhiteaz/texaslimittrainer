import { describe, expect, it } from 'vitest';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import type { StyleCounts } from '../../src/stats/style-stats';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import { parseSessionReport, sessionReport, type ReportHand } from '../../src/table/session-report';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const ENDED = new Date('2026-11-23T14:30:00Z');
const ME: SeatNumber = 1;
const OTHER: SeatNumber = 4;

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

/** A 6-seat hand with the user on seat 1; `winner` takes the only pot. */
function hand(
  actions: readonly ActionRecord[],
  board: number,
  endedBy: 'fold' | 'showdown',
  winner: SeatNumber = OTHER,
): ReportHand {
  return {
    userSeat: ME,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat })),
    actions: [act('preflop', 2, 'small-blind'), act('preflop', 3, 'big-blind'), ...actions],
    board: [1, 2, 3, 4, 5].slice(0, board),
    result: {
      endedBy,
      showdown: [],
      awards: [{ pot: 12, amount: 12, winners: [{ seat: winner, amount: 12 }] }],
    },
  };
}

/** Spec §5 AC#3 hand set: hands H1..H100. */
function ac3Hands(): ReportHand[] {
  const hands: ReportHand[] = [];
  for (let h = 1; h <= 100; h++) {
    if (h >= 26) {
      hands.push(hand([act('preflop', ME, 'fold')], 0, 'fold'));
      continue;
    }
    const opener = act('preflop', ME, h <= 18 ? 'raise' : 'call');
    if ((h >= 16 && h <= 18) || h >= 24) {
      hands.push(
        hand([opener, act('preflop', OTHER, 'raise'), act('preflop', ME, 'fold')], 0, 'fold'),
      );
      continue;
    }
    const flop = act('flop', ME, h <= 11 ? 'bet' : 'call');
    if (h <= 6) {
      hands.push(hand([opener, flop], 5, 'showdown', h <= 3 ? ME : OTHER));
    } else {
      hands.push(hand([opener, flop, act('turn', ME, 'fold')], 4, 'fold'));
    }
  }
  return hands;
}

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

describe('session report style acceptance', () => {
  it("AC#3 the report stores the user's style counts from the session's hands", () => {
    const report = sessionReport(session(100), ENDED, ac3Hands());
    expect(report.style).toEqual(AC3_STYLE);
    expect(parseSessionReport(JSON.parse(JSON.stringify(report)))).toEqual(report);
    expect({ ...report, style: undefined }).toEqual(sessionReport(session(100), ENDED));
  });

  it("a forced fold counts as the user's fold", () => {
    const forced = {
      ...hand([act('preflop', ME, 'call'), act('preflop', ME, 'fold')], 3, 'fold'),
      forcedFold: true as const,
    };
    expect(sessionReport(session(1), ENDED, [forced]).style).toEqual({
      handsDealt: 1,
      voluntary: 1,
      preflopRaised: 0,
      postflopAggressive: 0,
      postflopCalls: 0,
      sawFlop: 0,
      showdowns: 0,
      showdownsWon: 0,
    });
  });

  it('parseSessionReport validates style and accepts reports without it', () => {
    const report = sessionReport(session(100), ENDED, ac3Hands());
    const cases: [string, unknown][] = [
      ['style', null],
      ['style', [1]],
      ['style.handsDealt', { ...AC3_STYLE, handsDealt: 0 }],
      ['style.handsDealt', { ...AC3_STYLE, handsDealt: 101 }],
      ['style.voluntary', { ...AC3_STYLE, voluntary: 101 }],
      ['style.voluntary', { ...AC3_STYLE, voluntary: undefined }],
      ['style.preflopRaised', { ...AC3_STYLE, preflopRaised: 26 }],
      ['style.postflopAggressive', { ...AC3_STYLE, postflopAggressive: '11' }],
      ['style.postflopCalls', { ...AC3_STYLE, postflopCalls: -1 }],
      ['style.sawFlop', { ...AC3_STYLE, sawFlop: 1.5 }],
      ['style.sawFlop', { ...AC3_STYLE, sawFlop: 101 }],
      ['style.showdowns', { ...AC3_STYLE, showdowns: 21 }],
      ['style.showdownsWon', { ...AC3_STYLE, showdownsWon: 7 }],
    ];
    for (const [field, style] of cases) {
      expect(() => parseSessionReport({ ...report, style }), JSON.stringify(style)).toThrow(
        new RangeError(`Invalid session report: ${field}`),
      );
    }
    // handsDealt below handsPlayed is allowed (a skipped record, A-7).
    const fewer = { ...report, style: { ...AC3_STYLE, handsDealt: 99, voluntary: 24 } };
    expect(parseSessionReport(fewer)).toBe(fewer);

    const legacy = sessionReport(session(100), ENDED);
    expect('style' in legacy).toBe(false);
    expect('style' in sessionReport(session(100), ENDED, [])).toBe(false);
    expect(parseSessionReport(legacy)).toBe(legacy);
  });
});
