import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { createHand, type HandState, type Stakes } from '../../src/engine/hand';
import { checkDeal } from '../../src/engine/invariants';

const CASH: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const SNG: Stakes = { smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 };
const DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);

const deal = (stacks: Record<number, number>, button: number, stakes = CASH): HandState =>
  createHand({
    stakes,
    seats: Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack })),
    button,
    deck: DECK,
  });
const prev = (stacks: Record<number, number>) =>
  Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack }));
const chips = (message: string) => [{ invariant: 'chips', message }];

describe('checkDeal', () => {
  it('checkDeal reports cross-hand chip mismatches and deal-time invariants', () => {
    const previous = prev({ 1: 160, 2: 158, 3: 162 });
    expect(checkDeal(deal({ 1: 160, 2: 158, 3: 162 }, 2), previous, 160)).toEqual([]);
    expect(checkDeal(deal({ 1: 160, 2: 159, 3: 162 }, 2), previous, 160)).toEqual(
      chips('seat 2 starts with $159 but should start with $158'),
    );

    const rebought = prev({ 1: 0, 2: 318, 3: 162 });
    expect(checkDeal(deal({ 1: 160, 2: 318, 3: 162 }, 2), rebought, 160)).toEqual([]);
    expect(checkDeal(deal({ 2: 318, 3: 162 }, 2), rebought, 160)).toEqual(
      chips('seat 1 starts with $0 but should start with $160'),
    );

    const busted = prev({ 1: 0, 2: 3000, 3: 1500 });
    expect(checkDeal(deal({ 2: 3000, 3: 1500 }, 2, SNG), busted)).toEqual([]);
    expect(checkDeal(deal({ 2: 3000, 3: 1500 }, 2, SNG), busted, null)).toEqual([]);
    expect(checkDeal(deal({ 1: 1500, 2: 3000, 3: 1500 }, 2, SNG), busted, null)).toEqual(
      chips('seat 1 starts with $1500 but should start with $0'),
    );

    expect(checkDeal(deal({ 1: 160, 2: 160, 4: 160 }, 1), prev({ 1: 160, 2: 160 }), 160)).toEqual(
      chips('seat 4 starts with $160 but should start with $0'),
    );

    // W7: complete at the deal, with no previous hand.
    const dealtOut = deal({ 1: 1, 2: 160 }, 1);
    expect(dealtOut.result).not.toBeNull();
    expect(checkDeal(dealtOut)).toEqual([]);
    const wrongReturn: HandState = {
      ...dealtOut,
      result: { ...(dealtOut.result as NonNullable<HandState['result']>), returned: undefined },
      players: dealtOut.players.map((p) => (p.seat === 2 ? { ...p, stack: p.stack - 3 } : p)),
    };
    expect(checkDeal(wrongReturn).map((v) => v.invariant)).toEqual(['chips']);

    const clean = deal({ 1: 160, 2: 160, 3: 160 }, 1);
    const duplicate: HandState = {
      ...clean,
      players: clean.players.map((p) =>
        p.seat === 2
          ? { ...p, holeCards: [clean.players[0]?.holeCards[0] as Card, p.holeCards[1]] }
          : p,
      ),
    };
    const cards = checkDeal(duplicate);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.invariant).toBe('cards');

    const both = checkDeal(duplicate, prev({ 1: 160, 2: 161, 3: 160 }), 160);
    expect(both.map((v) => v.invariant)).toEqual(['chips', 'cards']);
    expect(both[0]?.message).toBe('seat 2 starts with $160 but should start with $161');
  });
});
