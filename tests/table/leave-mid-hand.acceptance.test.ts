import { describe, expect, it } from 'vitest';
import type { HandState } from '../../src/engine/hand';
import { parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import {
  foldUserToLeave,
  handInProgress,
  nextStep,
  seatSession,
  stepBot,
  type TableState,
} from '../../src/table/session';
import { handWrite } from '../../src/table/session-record';
import { sessionReport } from '../../src/table/session-report';
import {
  CALL_THEN_FOLD,
  KINGS_SHOWDOWN,
  REVIEW_DECK,
  REVIEW_FOUR,
  SEAT_1_DEALT,
  SIDE_POT_RIVER,
  play,
  userTableAfter,
} from '../support/table-scenarios';

// TASK-10.2 (REQ-004.5, REQ-004.8): leaving mid-hand folds the user's hand without a decision, and the hand is
// recorded like any completed hand.

const SESSION_ID = 'f'.repeat(32);
const STARTED = new Date('2026-11-24T10:00:00Z');
const COMPLETED = new Date('2026-11-24T10:30:00Z');
const META = { sessionId: SESSION_ID, startedAt: STARTED, completedAt: COMPLETED };

const BOT_TO_ACT = userTableAfter(REVIEW_DECK, '3:fold 4:fold 5:call');

const userMade = (record: HandRecord) =>
  record.actions.filter(
    (a) => a.seat === record.userSeat && a.type !== 'small-blind' && a.type !== 'big-blind',
  );

/** Bot steps (default policy) until the hand is done. */
function playOut(table: TableState): TableState {
  let t = table;
  while (nextStep(t) === 'bot') t = stepBot(t);
  expect(nextStep(t)).toBe('done');
  return t;
}

function leftHandWrite() {
  const t: TableState = { ...BOT_TO_ACT, handNumber: 25 };
  return handWrite(playOut(foldUserToLeave(t)), META);
}

describe('leaving mid-hand', () => {
  it('only a hand in progress asks and the forced fold is not a decision', () => {
    expect(handInProgress(seatSession())).toBe(false);
    expect(handInProgress(KINGS_SHOWDOWN)).toBe(false);
    expect(handInProgress(SEAT_1_DEALT)).toBe(true);
    expect(handInProgress(BOT_TO_ACT)).toBe(true);

    const left = foldUserToLeave(BOT_TO_ACT);
    const hand = left.hand as HandState;
    expect(hand.toAct).toBe(6);
    expect(hand.actions).toHaveLength(6);
    expect(hand.actions.at(-1)).toEqual({
      street: 'preflop',
      seat: 5,
      type: 'fold',
      amount: 0,
      added: 0,
    });
    expect(hand.players.find((p) => p.seat === 5)).toMatchObject({ folded: true, stack: 156 });
    expect(left.userDecisions).toBe(BOT_TO_ACT.userDecisions);
    expect(left.userDecisions).toHaveLength(1);
    expect(left.userDecisions[0]?.action.type).toBe('call');

    const before = seatSession();
    for (const table of [KINGS_SHOWDOWN, before, SIDE_POT_RIVER]) {
      expect(foldUserToLeave(table)).toBe(table);
    }
    expect(foldUserToLeave(left)).toBe(left);
  });

  it('the left hand is recorded with forcedFold and no graded fold', () => {
    const { record, session } = leftHandWrite();
    expect(record.handNumber).toBe(25);
    expect(record.forcedFold).toBe(true);
    expect(record.decisions).toHaveLength(1);
    expect(record.decisions[0]?.action.type).toBe('call');
    expect(userMade(record).at(-1)?.type).toBe('fold');
    expect(parseHandRecord(structuredClone(record))).toEqual(record);
    expect(session.handsPlayed).toBe(25);
    expect(sessionReport(session, new Date('2026-11-24T11:00:00Z')).handsPlayed).toBe(25);

    const { record: ordinary } = handWrite(REVIEW_FOUR, META);
    expect('forcedFold' in ordinary).toBe(false);
  });

  it('parseHandRecord accepts only a well-formed forcedFold', () => {
    const { record } = leftHandWrite();
    const fold = record.actions.findLastIndex((a) => a.seat === 5 && a.type === 'fold');
    const cases: [unknown, string][] = [
      [{ ...record, forcedFold: false }, 'Invalid hand record: forcedFold'],
      [
        Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'forcedFold')),
        'Invalid hand record: decisions',
      ],
      [
        {
          ...record,
          actions: record.actions.map((a, i) => (i === fold ? { ...a, type: 'check' } : a)),
        },
        'Invalid hand record: forcedFold',
      ],
      [
        { ...record, decisions: [...record.decisions, record.decisions[0]] },
        'Invalid hand record: decisions',
      ],
    ];
    for (const [value, message] of cases) {
      expect(() => parseHandRecord(structuredClone(value))).toThrow(RangeError);
      expect(() => parseHandRecord(structuredClone(value))).toThrow(message);
    }

    for (const table of [REVIEW_FOUR, CALL_THEN_FOLD, KINGS_SHOWDOWN]) {
      const { record: stored } = handWrite(table, META);
      expect('forcedFold' in stored).toBe(false);
      expect(parseHandRecord(structuredClone(stored))).toEqual(stored);
    }
  });

  it('leaving while all-in keeps the cards in and pays the win', () => {
    const t: TableState = { ...SIDE_POT_RIVER, handNumber: 25 };
    const left = foldUserToLeave(t);
    expect(left).toBe(t);
    const done: TableState = { ...left, hand: play(left.hand as HandState, '1:check 2:check') };
    const result = (done.hand as HandState).result;
    expect(result?.showdown.map((s) => s.seat)).toContain(5);
    expect(result?.awards[0]).toMatchObject({ amount: 60, winners: [{ seat: 5, amount: 60 }] });

    const { record, session } = handWrite(done, META);
    expect('forcedFold' in record).toBe(false);
    expect(session.seats.find((s) => s.kind === 'user')?.stack).toBe(60);
    const cash = sessionReport(session, new Date('2026-11-24T11:00:00Z')).cash;
    expect(cash).toMatchObject({ finalStack: 60, result: -100, bbPer100: -50 });
  });
});
