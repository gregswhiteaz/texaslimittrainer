import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import { DEFAULT_SESSION_CONFIG, dealHand, seatSession } from '../../src/table/session';

describe('session config acceptance', () => {
  it('first-use session config carries game type, players, stake, line-up, speed, seat and button', () => {
    const config = DEFAULT_SESSION_CONFIG;
    expect(config).toMatchObject({
      gameType: 'cash',
      players: 6,
      stake: { smallBet: 4, bigBet: 8 },
      lineUp: 'Custom',
      speed: 'rapid',
      userSeat: 5,
      button: 6,
    });
    expect(config.seats).toEqual([
      { seat: 1, name: 'Ava', kind: 'bot', style: 'TAG' },
      { seat: 2, name: 'Ben', kind: 'bot', style: 'TAG' },
      { seat: 3, name: 'Cal', kind: 'bot', style: 'TAG' },
      { seat: 4, name: 'Dee', kind: 'bot', style: 'TAG' },
      { seat: 5, name: 'You', kind: 'user', style: null },
      { seat: 6, name: 'Eli', kind: 'bot', style: 'TAG' },
    ]);
    expect(config.players).toBe(config.seats.length);

    const table = seatSession(config);
    expect(table.config).toStrictEqual(config);
    expect(table.seats).toBe(config.seats);
    expect(table.stakes).toEqual({ smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 });
    expect(table.stacks).toEqual([1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })));

    const dealt = dealHand(table, replayCodeFromWords([0x9e3779b9, 1, 2, 3]));
    expect(dealt.hand?.button).toBe(6);
    expect(dealt.hand?.actions.slice(0, 2).map((a) => [a.seat, a.type, a.amount])).toEqual([
      [1, 'small-blind', 2],
      [2, 'big-blind', 4],
    ]);
  });
});
