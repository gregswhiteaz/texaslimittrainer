import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import {
  categoryCounts,
  decisionCategory,
  LEAK_CATEGORIES,
  parseLeakCategories,
  sessionLeaks,
  type CategoryCount,
  type CategoryDecision,
  type LeakStreet,
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

// TASK-10.5: postflop leaks with evidence and a one-sentence fix (REQ-047.1, .2, .4, .5, .8).

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

const act = (seat: SeatNumber, type: ActionRecord['type']): ActionRecord => ({
  street: 'preflop',
  seat,
  type,
  amount: 0,
  added: 0,
});

const decision = (
  street: 'preflop' | LeakStreet,
  type: ActionType,
  grade: Grade,
  hinted = false,
): CategoryDecision => ({ street, action: { type }, grade: { grade }, hinted });

/** `n` copies of the decision. */
const times = (n: number, d: CategoryDecision): CategoryDecision[] =>
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
function report(decisions: readonly ReportDecision[]): SessionReport {
  return sessionReport(
    session(decisions.length),
    ENDED,
    decisions.map((d) => hand([d])),
  );
}

const counts = (r: SessionReport): readonly CategoryCount[] => r.leakCounts ?? [];
const countOf = (r: SessionReport, category: string): CategoryCount | undefined =>
  counts(r).find((c) => c.category === category);
const leakIds = (r: SessionReport): string[] => sessionLeaks(counts(r)).map((l) => l.category);

describe('postflop leaks acceptance', () => {
  it('AC#1 classifies turn call, capped river call, river fold and flop bet', () => {
    // A call on a river capped at four bets is recorded as type 'call', like any other call.
    const decisions = [
      decision('turn', 'call', 'correct'),
      decision('river', 'call', 'correct'),
      decision('river', 'fold', 'correct'),
      decision('flop', 'bet', 'correct'),
    ];
    expect(decisions.map((d) => decisionCategory(d.street, d.action.type))).toEqual([
      'turn-facing-a-bet-call',
      'river-facing-a-bet-call',
      'river-facing-a-bet-fold',
      'flop-not-facing-a-bet-bet',
    ]);
    const four = [
      { category: 'flop-not-facing-a-bet-bet', decisions: 1, errors: 0, major: 0 },
      { category: 'turn-facing-a-bet-call', decisions: 1, errors: 0, major: 0 },
      { category: 'river-facing-a-bet-fold', decisions: 1, errors: 0, major: 0 },
      { category: 'river-facing-a-bet-call', decisions: 1, errors: 0, major: 0 },
    ];
    expect(categoryCounts(decisions)).toEqual(four);
    expect(report(decisions).leakCounts).toEqual(four);
  });

  it('AC#2 all 15 postflop categories have a title, evidence name and a one-sentence fix', () => {
    expect(() => parseLeakCategories(data)).not.toThrow();
    expect(parseLeakCategories(data)).toEqual(LEAK_CATEGORIES);
    const expected = ['flop', 'turn', 'river'].flatMap((street) => [
      ...['fold', 'call', 'raise'].map((a) => `${street}-facing-a-bet-${a}`),
      ...['check', 'bet'].map((a) => `${street}-not-facing-a-bet-${a}`),
    ]);
    expect(LEAK_CATEGORIES.map((c) => c.id)).toEqual(expected);
    expect(new Set(LEAK_CATEGORIES.map((c) => c.id)).size).toBe(15);
    for (const c of LEAK_CATEGORIES) {
      expect(c.id).toBe(
        `${c.street}-${c.facingBet ? 'facing-a-bet' : 'not-facing-a-bet'}-${c.action}`,
      );
      expect(c.title.trim(), c.id).not.toBe('');
      expect(c.title.endsWith('.'), c.id).toBe(false);
      expect(c.evidenceName.trim(), c.id).not.toBe('');
      expect(c.evidenceName, c.id).toBe(c.evidenceName.toLowerCase());
      expect(c.fix, c.id).toMatch(/^[A-Z][^.!?]*\.$/);
      expect(c.justification.trim(), c.id).not.toBe('');
    }
  });

  it('AC#3 4 of 10 turn calls graded as errors is a leak', () => {
    const r = report([
      ...times(2, decision('turn', 'call', 'minor')),
      ...times(2, decision('turn', 'call', 'major')),
      ...times(6, decision('turn', 'call', 'correct')),
    ]);
    expect(r.leakCounts).toContainEqual({
      category: 'turn-facing-a-bet-call',
      decisions: 10,
      errors: 4,
      major: 2,
    });
    const turnCalls = LEAK_CATEGORIES.find((c) => c.id === 'turn-facing-a-bet-call');
    expect(sessionLeaks(counts(r))).toContainEqual({
      category: 'turn-facing-a-bet-call',
      title: turnCalls?.title,
      evidence: '4 of 10 turn calls graded as errors',
      fix: turnCalls?.fix,
    });
  });

  it('AC#4 7 river raises all Major is not a leak', () => {
    const r = report(times(7, decision('river', 'raise', 'major')));
    expect(countOf(r, 'river-facing-a-bet-raise')).toEqual({
      category: 'river-facing-a-bet-raise',
      decisions: 7,
      errors: 7,
      major: 7,
    });
    expect(leakIds(r)).not.toContain('river-facing-a-bet-raise');
  });

  it('AC#5 3 of 10 flop bets is not a leak', () => {
    const r = report([
      ...times(3, decision('flop', 'bet', 'minor')),
      ...times(7, decision('flop', 'bet', 'correct')),
    ]);
    expect(countOf(r, 'flop-not-facing-a-bet-bet')).toMatchObject({ decisions: 10, errors: 3 });
    expect(leakIds(r)).not.toContain('flop-not-facing-a-bet-bet');
  });

  it('AC#6 hinted decisions count toward neither threshold', () => {
    const minimum = report([
      ...times(5, decision('river', 'call', 'major', true)),
      ...times(7, decision('river', 'call', 'major')),
    ]);
    expect(countOf(minimum, 'river-facing-a-bet-call')).toEqual({
      category: 'river-facing-a-bet-call',
      decisions: 7,
      errors: 7,
      major: 7,
    });
    expect(leakIds(minimum)).toEqual([]);

    const rate = report([
      ...times(3, decision('river', 'call', 'correct', true)),
      ...times(4, decision('river', 'call', 'minor')),
      ...times(4, decision('river', 'call', 'correct')),
    ]);
    expect(countOf(rate, 'river-facing-a-bet-call')).toMatchObject({ decisions: 8, errors: 4 });
    expect(sessionLeaks(counts(rate)).map((l) => [l.category, l.evidence])).toEqual([
      ['river-facing-a-bet-call', '4 of 8 river calls graded as errors'],
    ]);
  });
});
