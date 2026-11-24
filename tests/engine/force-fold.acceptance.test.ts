import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  forceFold,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';
import { checkOrCall } from '../support/session-play';
import {
  REVIEW_DECK,
  SIDE_POT_RIVER,
  SIDE_POT_SHOWDOWN,
  userTableAfter,
} from '../support/table-scenarios';

// TASK-10.2 (REQ-004.8): the forced fold of a seat that leaves mid-hand, in turn or out of turn.

const handAfter = (moves: string): HandState =>
  userTableAfter(REVIEW_DECK, moves).hand as HandState;
const seatOf = (hand: HandState, seat: SeatNumber) => hand.players.find((p) => p.seat === seat);

describe('forceFold', () => {
  it('forceFold folds a seat that is not to act and keeps the turn', () => {
    const hand = handAfter('3:fold 4:fold 5:call');
    expect(hand.toAct).toBe(6);
    const before = structuredClone(hand);

    const result = forceFold(hand, 5);

    expect(result.toAct).toBe(6);
    expect(result.actions).toHaveLength(6);
    expect(result.actions.at(-1)).toEqual({
      street: 'preflop',
      seat: 5,
      type: 'fold',
      amount: 0,
      added: 0,
    });
    expect(seatOf(result, 5)).toMatchObject({
      folded: true,
      stack: 156,
      streetContribution: 4,
      hasActed: true,
    });
    expect(result.result).toBeNull();
    expect(checkState(result)).toEqual([]);
    expect(hand).toEqual(before);
  });

  it('forceFold settles the hand like a fold through applyAction', () => {
    // (a) The user's fold leaves only the big blind: a fold-out.
    const folded = forceFold(handAfter('3:fold 4:fold 5:call 6:fold 1:fold'), 5);
    expect(folded.result?.endedBy).toBe('fold');
    expect(folded.result?.awards).toEqual([
      { pot: 0, amount: 10, winners: [{ seat: 2, amount: 10 }] },
    ]);
    expect(seatOf(folded, 2)?.stack).toBe(166);
    expect(folded.toAct).toBeNull();
    expect(checkState(folded)).toEqual([]);

    // (b) Ben folds out of turn on the river: only Ava can bet, so the hand goes to showdown.
    const river = forceFold(SIDE_POT_RIVER.hand as HandState, 2);
    expect(river.result?.endedBy).toBe('showdown');
    expect(river.result?.awards[0]).toMatchObject({
      amount: 60,
      winners: [{ seat: 5, amount: 60 }],
    });
    expect(river.result?.awards[1]).toMatchObject({
      amount: 80,
      winners: [{ seat: 1, amount: 80 }],
    });
    expect(checkState(river)).toEqual([]);

    // (c) The big blind folds where it could check: the preflop round closes.
    const option = handAfter('3:fold 4:fold 5:call 6:fold 1:call');
    expect(option.toAct).toBe(2);
    const closed = forceFold(option, 2);
    expect(seatOf(closed, 2)?.folded).toBe(true);
    expect(closed.street).toBe('flop');
    expect(closed.board).toHaveLength(3);
    expect(closed.toAct).toBe(1);
    expect(closed.pots).toEqual([{ amount: 12, eligible: [1, 5] }]);
    expect(checkState(closed)).toEqual([]);

    // (d) Seeded sweep: a forced fold at a random point never breaks the hand.
    let forced = 0;
    for (let i = 0; i < 500; i++) {
      let hand = createHand({
        stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
        seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
        button: 6,
        deck: shuffledDeck(replayCodeFromWords([i, 1, 2, 3])),
      });
      const step = (): void => {
        const applied = applyAction(hand, checkOrCall(hand));
        if (!applied.ok) throw new Error(applied.error.message);
        hand = applied.state;
        expect(checkState(hand)).toEqual([]);
      };
      for (let n = 0; n < i % 8 && hand.result === null; n++) step();
      let done = false;
      while (hand.result === null) {
        const target = done
          ? undefined
          : hand.players.find((p) => p.seat !== hand.toAct && !p.folded && !p.allIn);
        if (target !== undefined) {
          hand = forceFold(hand, target.seat);
          expect(checkState(hand)).toEqual([]);
          done = true;
          forced += 1;
        } else step();
      }
      expect(hand.result).not.toBeNull();
      expect(hand.players.reduce((sum, p) => sum + p.stack, 0)).toBe(960);
    }
    expect(forced).toBeGreaterThan(400);
  });

  it('forceFold rejects seats that cannot fold', () => {
    const river = SIDE_POT_RIVER.hand as HandState;
    const showdown = SIDE_POT_SHOWDOWN.hand as HandState;
    for (const run of [
      () => forceFold(river, 5),
      () => forceFold(river, 3),
      () => forceFold(river, 7),
      () => forceFold(showdown, 1),
    ]) {
      expect(run).toThrow(RangeError);
      expect(run).toThrow(/^Cannot force a fold/);
    }
  });
});
