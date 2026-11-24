import { describe, expect, it } from 'vitest';
import { seatSession } from '../../src/table/session';
import { sessionRecord } from '../../src/table/session-record';
import { bbPer100, parseSessionReport, sessionReport } from '../../src/table/session-report';

describe('parseSessionReport', () => {
  it('rejects a cash buy-in that is not 20 big bets of the stake, even with a consistent result', () => {
    const seated = seatSession({ stake: { smallBet: 2, bigBet: 4 } });
    const record = sessionRecord(seated, {
      sessionId: 'b'.repeat(32),
      startedAt: new Date('2026-11-23T10:00:00Z'),
      updatedAt: new Date('2026-11-23T10:00:00Z'),
    });
    const valid = sessionReport({ ...record, handsPlayed: 50 }, new Date('2026-11-23T11:00:00Z'));
    expect(valid.cash?.buyIn).toBe(80);
    expect(parseSessionReport(valid)).toBe(valid);

    const finalStack = valid.cash?.finalStack as number;
    for (const amount of [0, 79, 160]) {
      const result = finalStack - amount;
      const forged = {
        ...valid,
        cash: { buyIn: amount, rebuys: 0, finalStack, result, bbPer100: bbPer100(result, 4, 50) },
      };
      expect(() => parseSessionReport(forged)).toThrow(
        new RangeError('Invalid session report: cash.buyIn'),
      );
    }
  });
});
