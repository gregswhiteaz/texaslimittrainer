import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  forceFold,
  voidedBets,
  type Action,
  type HandState,
} from '../../src/engine/hand';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

function deal(): HandState {
  return createHand({
    stakes: STAKES,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button: 6,
    deck: shuffledDeck(replayCodeFromWords([1, 2, 3, 4])),
  });
}

/** Applies "seat:type[:amount]" moves, e.g. "3:raise:8 4:fold". */
function play(hand: HandState, moves: string): HandState {
  let state = hand;
  for (const move of moves.split(' ').filter(Boolean)) {
    const [seat, type, amount] = move.split(':');
    const action = (
      amount === undefined
        ? { seat: Number(seat), type }
        : { seat: Number(seat), type, amount: Number(amount) }
    ) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${move}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const E2 = '3:call:4 4:raise:8 5:fold 6:fold';

describe('voidedBets', () => {
  it('voidedBets matches the forced-fold voiding rule', () => {
    expect([...voidedBets(forceFold(play(deal(), E2), 4))]).toEqual([3]);
    expect([
      ...voidedBets(forceFold(play(deal(), '3:raise:8 4:raise:12 5:fold 6:fold 1:fold'), 4)),
    ]).toEqual([3]);
    expect([...voidedBets(forceFold(play(deal(), '3:raise:8 4:fold 5:fold 6:fold'), 3))]).toEqual([
      2,
    ]);
    expect(voidedBets(play(deal(), E2)).size).toBe(0);
    expect(voidedBets(forceFold(play(deal(), '3:raise:8 4:call:8'), 4)).size).toBe(0);

    const state = forceFold(play(deal(), E2), 4);
    const before = structuredClone(state);
    voidedBets(state);
    expect(state).toEqual(before);
  });

  it('reads only the given street', () => {
    const state = forceFold(play(deal(), E2), 4);
    expect(voidedBets({ ...state, street: 'flop' }).size).toBe(0);
  });
});
