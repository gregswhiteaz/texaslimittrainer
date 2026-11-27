import { describe, expect, it } from 'vitest';
import { chartSpotOf, situationOf } from '../../src/advice/preflop';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  forceFold,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';

// TASK-10.17: a raise voided by a forced fold (TASK-10.13 R2) no longer counts when classifying preflop.

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
const U = '3:raise:8 4:fold 5:fold 6:fold';
const P = '3:raise:8 4:raise:12 5:fold 6:fold 1:fold';

const situation = (state: HandState, seat: SeatNumber) => situationOf(playerView(state, seat));

describe('preflop situation after a forced fold voids a raise (TASK-10.17)', () => {
  it('a raise voided by a forced fold is ignored', () => {
    const e2 = forceFold(play(deal(), E2), 4);
    expect(e2.toAct).toBe(1);
    const view = playerView(e2, 1);
    expect(situationOf(view)).toBe('limpers');
    expect(chartSpotOf(view, '6-max')).toEqual({ position: 'SB', situation: 'limpers' });

    const u = forceFold(play(deal(), U), 3);
    expect(u.toAct).toBe(1);
    expect(situation(u, 1)).toBe('unopened');
  });

  it('raises that survive or follow a void still count', () => {
    const p = forceFold(play(deal(), P), 4);
    expect(p.toAct).toBe(2);
    expect(situation(p, 2)).toBe('blind-defence');

    const later = play(forceFold(play(deal(), E2), 4), '1:raise:8');
    expect(later.toAct).toBe(2);
    expect(situation(later, 2)).toBe('blind-defence');
  });

  it('without a forced fold the situation is unchanged', () => {
    expect(situation(play(deal(), P), 2)).toBe('re-raise-not-mine');
    expect(situation(play(deal(), E2), 1)).toBe('blind-defence');
  });
});
