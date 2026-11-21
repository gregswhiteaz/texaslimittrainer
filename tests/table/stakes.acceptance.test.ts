import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import {
  CASH_STAKES,
  DEFAULT_SESSION_CONFIG,
  dealHand,
  seatSession,
  stakesFor,
} from '../../src/table/session';
import { headerText } from '../../src/table/table-view';

const CODE = replayCodeFromWords([0x9e3779b9, 1, 2, 3]);

describe('cash stakes acceptance', () => {
  it('cash stakes are exactly the six REQ-006 stakes with $4/$8 the default', () => {
    expect(CASH_STAKES).toEqual([
      { smallBet: 2, bigBet: 4 },
      { smallBet: 3, bigBet: 6 },
      { smallBet: 4, bigBet: 8 },
      { smallBet: 6, bigBet: 12 },
      { smallBet: 10, bigBet: 20 },
      { smallBet: 20, bigBet: 40 },
    ]);
    expect(CASH_STAKES).toHaveLength(6);
    expect(Object.isFrozen(CASH_STAKES)).toBe(true);
    for (const stake of CASH_STAKES) expect(Object.isFrozen(stake)).toBe(true);
    expect(DEFAULT_SESSION_CONFIG.stake).toEqual({ smallBet: 4, bigBet: 8 });
  });

  it('every stake posts its REQ-006 blinds and seats a 20 big bet buy-in', () => {
    const blinds = [
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 6],
      [5, 10],
      [10, 20],
    ];
    const buyIns = [80, 120, 160, 240, 400, 800];
    CASH_STAKES.forEach((stake, i) => {
      const table = seatSession({ stake });
      const hand = dealHand(table, CODE).hand;
      expect(hand?.actions.slice(0, 2).map((a) => [a.type, a.amount])).toEqual([
        ['small-blind', blinds[i]?.[0]],
        ['big-blind', blinds[i]?.[1]],
      ]);
      const { smallBlind, bigBlind } = stakesFor(stake);
      expect([smallBlind, bigBlind]).toEqual(blinds[i]);
      expect(table.stacks.map((s) => s.stack)).toEqual(Array(6).fill(buyIns[i]));
      expect(hand?.players.map((p) => p.startingStack)).toEqual(Array(6).fill(buyIns[i]));
    });
  });

  it('a $10/$20 session shows $10/$20, posts $5 and $10 and seats $400 stacks', () => {
    const table = seatSession({ ...DEFAULT_SESSION_CONFIG, stake: { smallBet: 10, bigBet: 20 } });
    const hand = dealHand(table, CODE).hand;

    expect(headerText(table.config, 1)).toBe('Cash · 6 players · $10/$20 · Hand #1');
    expect(hand?.players.map((p) => p.startingStack)).toEqual(Array(6).fill(400));
    expect(hand?.stakes).toEqual({ smallBlind: 5, bigBlind: 10, smallBet: 10, bigBet: 20 });
    expect(hand?.actions.slice(0, 2).map((a) => [a.seat, a.type, a.amount])).toEqual([
      [1, 'small-blind', 5],
      [2, 'big-blind', 10],
    ]);
  });
});
