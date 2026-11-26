import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import {
  categoryCounts,
  handCategoryDecisions,
  type CategoryDecision,
  type CategoryHand,
} from '../../src/stats/leaks';

const act = (
  seat: SeatNumber,
  type: ActionRecord['type'],
  street: ActionRecord['street'] = 'preflop',
): ActionRecord => ({ street, seat, type, amount: 0, added: 0 });

const decision = (
  street: CategoryDecision['street'],
  type: ActionType,
  grade: Grade = 'correct',
  hinted = false,
): CategoryDecision => ({ street, action: { type }, grade: { grade }, hinted });

/** A hand (button 6) with the user on `userSeat`, dealt in on `dealt`; `reads.count` counts reads of `seats`. */
const hand = (
  userSeat: SeatNumber,
  actions: readonly ActionRecord[],
  decisions: CategoryHand['decisions'],
  dealt: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6],
): { hand: CategoryHand; reads: { count: number } } => {
  const reads = { count: 0 };
  const seats = dealt.map((seat) => ({ seat }));
  return {
    reads,
    hand: {
      get seats() {
        reads.count++;
        return seats;
      },
      button: 6,
      userSeat,
      actions: [act(1, 'small-blind'), act(2, 'big-blind'), ...actions],
      decisions,
    },
  };
};

const spots = (h: CategoryHand) => handCategoryDecisions(h).map((d) => d.preflop);

describe('preflop pairing', () => {
  it('handCategoryDecisions computes the seat list and group once per hand', () => {
    const { hand: h, reads } = hand(
      3,
      [
        act(3, 'call'),
        act(4, 'raise'),
        act(5, 'fold'),
        act(6, 'fold'),
        act(1, 'fold'),
        act(2, 'fold'),
        act(3, 'raise'),
        act(3, 'call'),
      ],
      [decision('preflop', 'call'), decision('preflop', 'raise'), decision('preflop', 'call')],
    );
    expect(spots(h)).toEqual([
      { group: 'middle', raisedBefore: false },
      { group: 'middle', raisedBefore: true },
      { group: 'middle', raisedBefore: true },
    ]);
    expect(reads.count).toBe(1);
    expect(categoryCounts(handCategoryDecisions(h)).map((c) => [c.category, c.decisions])).toEqual([
      ['middle-call', 2],
      ['middle-raise', 1],
    ]);
  });

  it('handCategoryDecisions only computes the group when a preflop decision pairs', () => {
    const unpaired = hand(3, [act(3, 'fold')], [decision('preflop', 'raise')]);
    expect(spots(unpaired.hand)).toEqual([undefined]);
    expect(unpaired.reads.count).toBe(0);

    const flopBet = decision('flop', 'bet');
    const notDealt = hand(7, [act(7, 'bet', 'flop')], [flopBet]);
    expect(handCategoryDecisions(notDealt.hand)).toEqual([flopBet]);

    const paired = hand(7, [act(7, 'call')], [decision('preflop', 'call')]);
    expect(() => handCategoryDecisions(paired.hand)).toThrow(
      new RangeError('Seat 7 is not dealt in'),
    );
  });

  it("handCategoryDecisions skips the user's blind and pairs the next action", () => {
    const { hand: h } = hand(
      1,
      [act(3, 'fold'), act(4, 'fold'), act(5, 'fold'), act(6, 'raise'), act(1, 'call')],
      [decision('preflop', 'call')],
    );
    expect(spots(h)).toEqual([{ group: 'blinds', raisedBefore: true }]);
  });
});
