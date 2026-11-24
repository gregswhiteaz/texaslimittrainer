import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import {
  SIT_AND_GO_LEVEL_1,
  dealHand,
  nextHand,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  userBusted,
  type TableState,
} from '../../src/table/session';
import {
  MAX_SESSION_COUNT,
  parseSessionRecord,
  restoreSession,
  sessionRecord,
} from '../../src/table/session-record';
import { KINGS_SHOWDOWN, PREFLOP, withFinalStacks } from '../support/table-scenarios';

const META = {
  sessionId: '0123456789abcdef0123456789abcdef',
  startedAt: new Date('2026-11-23T10:00:00Z'),
  updatedAt: new Date('2026-11-23T10:00:00Z'),
};
const BUST = [160, 222, 160, 160, 0, 165];

const userOn = (table: TableState, stack: number): TableState => ({
  ...table,
  stacks: table.stacks.map((s) => (s.seat === table.config.userSeat ? { ...s, stack } : s)),
});

describe('userBusted', () => {
  it('userBusted is true only for a cash user on $0 between hands', () => {
    expect(userBusted(withFinalStacks(BUST))).toBe(true);
    expect(userBusted(userOn(seatSession(), 0))).toBe(true);
    expect(userBusted(nextHand(withFinalStacks(BUST)))).toBe(true);

    expect(userBusted(seatSession())).toBe(false);
    expect(userBusted(PREFLOP)).toBe(false);
    expect(userBusted(KINGS_SHOWDOWN)).toBe(false);
    expect(userBusted(withFinalStacks([160, 222, 160, 160, 1, 165]))).toBe(false);

    // Mid-hand, an all-in user with $0 behind is not busted.
    const dealt = dealHand(seatSession(), replayCodeFromWords([1, 2, 3, 4]));
    const hand = dealt.hand as HandState;
    const allIn: TableState = {
      ...dealt,
      hand: { ...hand, players: hand.players.map((p) => (p.seat === 5 ? { ...p, stack: 0 } : p)) },
    };
    expect(allIn.hand?.result).toBeNull();
    expect(userBusted(allIn)).toBe(false);

    const sitAndGo: TableState = {
      ...KINGS_SHOWDOWN,
      config: resolveSessionConfig({ gameType: 'sit-and-go' }),
      stakes: stakesFor(SIT_AND_GO_LEVEL_1),
    };
    expect(userBusted(withFinalStacks(BUST, sitAndGo))).toBe(false);
    expect(userBusted(userOn(seatSession({ gameType: 'sit-and-go' }), 0))).toBe(false);
  });
});

describe('rebuys in the session record', () => {
  it('rebuys is written from the table and capped at MAX_SESSION_COUNT', () => {
    expect(MAX_SESSION_COUNT).toBe(1_000_000_000);
    const table = seatSession();
    expect(table.rebuys).toBe(0);
    expect(sessionRecord(table, META).rebuys).toBe(0);
    const record = sessionRecord({ ...table, rebuys: 3 }, META);
    expect(record.rebuys).toBe(3);
    expect(restoreSession(record).rebuys).toBe(3);

    for (const rebuys of [0, 1, MAX_SESSION_COUNT]) {
      expect(parseSessionRecord({ ...record, rebuys }).rebuys).toBe(rebuys);
    }
    for (const rebuys of [MAX_SESSION_COUNT + 1, -1, 1.5, '2', {}]) {
      expect(() => parseSessionRecord({ ...record, rebuys })).toThrow(
        new RangeError('Invalid session record: rebuys'),
      );
    }
  });
});
