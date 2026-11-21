import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type HandState } from '../../src/engine/hand';
import { handResultView } from '../../src/table/hand-result';
import { AVA_UNCONTESTED, BB_WALK } from '../support/table-scenarios';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);

/** S-B: seat 3 calls all-in for $5 against seat 2's $8 turn bet and the board runs out. */
function allInShowdown(): HandState {
  const start = createHand({
    stakes: STAKES,
    seats: [
      { seat: 1, stack: 160 },
      { seat: 2, stack: 160 },
      { seat: 3, stack: 9 },
    ],
    button: 1,
    deck: DECK,
  });
  const actions: Action[] = [
    { seat: 1, type: 'fold' },
    { seat: 2, type: 'call', amount: 2 },
    { seat: 3, type: 'check' },
    { seat: 2, type: 'check' },
    { seat: 3, type: 'check' },
    { seat: 2, type: 'bet', amount: 8 },
    { seat: 3, type: 'call', amount: 5 },
  ];
  return actions.reduce((state, action) => {
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    return result.state;
  }, start);
}

describe('hand result with uncalled bets', () => {
  it('wins amounts exclude returned uncalled bets', () => {
    expect(handResultView(AVA_UNCONTESTED)?.winners).toMatchObject([
      { seat: 1, amount: 12, text: 'Ava wins $12', handName: null, holeCards: null },
    ]);
    expect(AVA_UNCONTESTED.hand?.result?.returned).toEqual({ seat: 1, amount: 4 });
    expect(AVA_UNCONTESTED.hand?.players.find((p) => p.seat === 1)?.stack).toBe(168);

    expect(handResultView(BB_WALK)?.winners.map((w) => w.text)).toEqual(['You win $4']);
    expect(BB_WALK.hand?.result?.returned).toEqual({ seat: 5, amount: 2 });

    const showdown = handResultView({ ...AVA_UNCONTESTED, hand: allInShowdown() });
    expect(showdown?.endedBy).toBe('showdown');
    expect(showdown?.winners).toHaveLength(1);
    expect(showdown?.winners[0]).toMatchObject({
      seat: 3,
      amount: 18,
      text: 'Cal wins $18',
      handName: 'Full house, fours over threes',
    });
  });
});
