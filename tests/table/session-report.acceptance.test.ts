import { describe, expect, it } from 'vitest';
import { seatSession, type SessionConfig } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  bbPer100,
  parseSessionReport,
  reportView,
  sessionReport,
  signedDollars,
  signedTenths,
  type SessionReport,
} from '../../src/table/session-report';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const ENDED = new Date('2026-11-23T14:30:00Z');

/** A stored session at `config` adjusted to `handsPlayed`, `rebuys` and the user's stack. */
function session(
  handsPlayed: number,
  rebuys: number,
  stack: number,
  config: Partial<SessionConfig> = {},
): SessionRecord {
  const record = sessionRecord(seatSession(config), {
    sessionId: SESSION,
    startedAt: STARTED,
    updatedAt: STARTED,
  });
  return {
    ...record,
    handsPlayed,
    rebuys,
    seats: record.seats.map((s) => (s.kind === 'user' ? { ...s, stack } : s)),
  };
}

const tileText = (report: SessionReport): string =>
  reportView(report)
    .tiles.map((t) => `${t.label} ${t.value}`)
    .join(' · ');

const stake = (smallBet: number): Partial<SessionConfig> => ({
  stake: { smallBet, bigBet: 2 * smallBet },
});

// The worked-example table (spec §5): hands, rebuys, final stack, stake → result, Result, BB/100, Rebuys.
const WORKED: readonly [number, number, number, number, number, string, string, string][] = [
  [214, 1, 366, 4, 46, '+$46', '+2.7', '1'],
  [100, 0, 120, 4, -40, '-$40', '-5.0', '0'],
  [13, 0, 0, 4, -160, '-$160', '-153.8', '0'],
  [1, 0, 160, 4, 0, '$0', '0.0', '0'],
  [100, 0, 81, 2, 1, '+$1', '+0.3', '0'],
  [100, 0, 79, 2, -1, '-$1', '-0.3', '0'],
  [10000, 0, 401, 10, 1, '+$1', '0.0', '0'],
];

describe('session report acceptance', () => {
  it('AC#3/AC#4 cash result, BB/100 and rebuys from the stored session', () => {
    const won = sessionReport(session(214, 1, 366), ENDED);
    expect(won.cash).toEqual({ buyIn: 160, rebuys: 1, finalStack: 366, result: 46, bbPer100: 2.7 });
    expect(tileText(won)).toBe('Result +$46 · BB/100 +2.7 · Rebuys 1');
    expect(reportView(won).header).toBe('Cash · 6 players · $4/$8 · 214 hands');
    expect(won).toEqual({
      sessionId: SESSION,
      startedAt: STARTED.toISOString(),
      endedAt: ENDED.toISOString(),
      gameType: 'cash',
      players: 6,
      stake: { smallBet: 4, bigBet: 8 },
      handsPlayed: 214,
      cash: won.cash,
    });

    const lost = sessionReport(session(100, 0, 120), ENDED);
    expect(lost.cash).toEqual({
      buyIn: 160,
      rebuys: 0,
      finalStack: 120,
      result: -40,
      bbPer100: -5,
    });
    expect(tileText(lost)).toBe('Result -$40 · BB/100 -5.0 · Rebuys 0');
    expect(reportView(lost).header).toBe('Cash · 6 players · $4/$8 · 100 hands');

    for (const [hands, rebuys, stack, small, result, dollars, tenths, bought] of WORKED) {
      const report = sessionReport(session(hands, rebuys, stack, stake(small)), ENDED);
      expect(report.cash?.result).toBe(result);
      expect(report.cash?.buyIn).toBe(40 * small);
      expect(reportView(report).tiles.map((t) => t.value)).toEqual([dollars, tenths, bought]);
      expect(parseSessionReport(report)).toBe(report);
    }
  });

  it('rounding, zero, sit-and-go and 0-hand edges', () => {
    expect(bbPer100(1, 4, 100)).toBe(0.3);
    expect(bbPer100(-1, 4, 100)).toBe(-0.3);
    expect(Object.is(bbPer100(1, 20, 10000), 0)).toBe(true);
    expect(Object.is(bbPer100(-1, 20, 10000), 0)).toBe(true);
    expect(Object.is(bbPer100(0, 8, 1), 0)).toBe(true);
    expect(signedDollars(0)).toBe('$0');
    expect(signedTenths(0)).toBe('0.0');

    const sng = sessionReport(session(1, 0, 1500, { gameType: 'sit-and-go' }), ENDED);
    expect(sng.cash).toBeNull();
    expect(sng.stake).toEqual({ smallBet: 20, bigBet: 40 });
    expect(reportView(sng)).toEqual({
      header: 'Sit-and-go · 6 players · 20/40 · 1 hand',
      tiles: [],
    });
    expect(parseSessionReport(sng)).toBe(sng);

    expect(() => sessionReport(session(0, 0, 160), ENDED)).toThrow(
      new RangeError('Invalid session report: handsPlayed'),
    );
    expect(() => sessionReport(session(1, 0, 160), new Date(Number.NaN))).toThrow(
      new RangeError('Invalid session report: endedAt'),
    );
  });

  it('parseSessionReport rejects invalid stored reports', () => {
    const valid = sessionReport(session(214, 1, 366), ENDED);
    expect(parseSessionReport(valid)).toBe(valid);
    const cash = valid.cash as NonNullable<SessionReport['cash']>;
    const bad: readonly [string, unknown][] = [
      ['report', null],
      ['report', []],
      ['sessionId', { ...valid, sessionId: 'XYZ' }],
      ['startedAt', { ...valid, startedAt: 'today' }],
      ['endedAt', { ...valid, endedAt: 'yesterday' }],
      ['gameType', { ...valid, gameType: 'tournament' }],
      ['players', { ...valid, players: 11 }],
      ['stake', { ...valid, stake: null }],
      ['stake.smallBet', { ...valid, stake: { smallBet: 0, bigBet: 8 } }],
      ['stake.bigBet', { ...valid, stake: { smallBet: 4, bigBet: 4.5 } }],
      ['stake.bigBet', { ...valid, stake: { smallBet: 4, bigBet: 12 } }],
      ['handsPlayed', { ...valid, handsPlayed: 0 }],
      ['cash', { ...valid, cash: null }],
      ['cash', { ...valid, gameType: 'sit-and-go' }],
      ['cash.buyIn', { ...valid, cash: { ...cash, buyIn: -1 } }],
      ['cash.rebuys', { ...valid, cash: { ...cash, rebuys: 1.5 } }],
      ['cash.finalStack', { ...valid, cash: { ...cash, finalStack: '366' } }],
      ['cash.result', { ...valid, cash: { ...cash, result: 47 } }],
      ['cash.bbPer100', { ...valid, cash: { ...cash, bbPer100: 2.8 } }],
    ];
    for (const [field, value] of bad) {
      expect(() => parseSessionReport(value)).toThrow(
        new RangeError(`Invalid session report: ${field}`),
      );
    }
  });
});
