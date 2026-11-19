import { describe, expect, it } from 'vitest';
import { formatCard } from '../../src/engine/cards';
import { opensReview, reviewEntries, STREET_LABELS } from '../../src/table/review';
import {
  completedHand,
  type CompletedHand,
  type TableState,
  type UserDecision,
} from '../../src/table/session';
import { CALL_THEN_FOLD, REVIEW_FOUR } from '../support/table-scenarios';

function record(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

function decision(hand: CompletedHand, index: number): UserDecision {
  const found = hand.userDecisions[index];
  if (found === undefined) throw new Error(`No decision ${index}`);
  return found;
}

const withDecisions = (hand: CompletedHand, userDecisions: UserDecision[]): CompletedHand => ({
  ...hand,
  userDecisions,
});

describe('TASK-9.1 review model', () => {
  it('review model edges', () => {
    const four = record(REVIEW_FOUR);
    const callFold = record(CALL_THEN_FOLD);
    const call = decision(callFold, 0);
    const fold = decision(callFold, 1);
    const flopBet = decision(four, 1);
    expect(flopBet.view.street).toBe('flop');
    const flopFold: UserDecision = {
      view: flopBet.view,
      action: { seat: 5, type: 'fold' },
    };

    expect(opensReview(withDecisions(callFold, [fold]))).toBe(false);
    for (const lone of [call, flopBet, flopFold]) {
      expect(opensReview(withDecisions(four, [lone]))).toBe(true);
    }

    expect(STREET_LABELS).toEqual({
      preflop: 'Preflop',
      flop: 'Flop',
      turn: 'Turn',
      river: 'River',
    });

    const [entry] = reviewEntries(withDecisions(four, [flopBet]));
    expect(entry?.board).not.toBe(flopBet.view.board);
    (entry?.board as number[]).length = 0;
    expect(flopBet.view.board.map(formatCard)).toEqual(['Ks', '9d', '4c']);

    expect(reviewEntries(withDecisions(four, []))).toEqual([]);
    expect(() => reviewEntries(withDecisions(four, [flopFold]))).toThrow(RangeError);
  });
});
