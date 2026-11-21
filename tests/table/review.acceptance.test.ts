import { describe, expect, it } from 'vitest';
import { GRADE_LABELS, gradeView } from '../../src/advice/grade';
import { formatCard } from '../../src/engine/cards';
import { opensReview, reviewEntries, type ReviewEntry } from '../../src/table/review';
import {
  completedHand,
  nextHandDelay,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import {
  BB_WALK,
  CALL_THEN_FOLD,
  PREFLOP_FOLD_ONLY,
  RAISE_TAKES_BLINDS,
  REVIEW_FOUR,
} from '../support/table-scenarios';

function record(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

const summary = (entries: readonly ReviewEntry[]): (string | string[])[][] =>
  entries.map((e) => [e.streetLabel, e.board.map(formatCard), e.userActionText, e.adviceText]);

describe('TASK-9.1 review model', () => {
  it('a hand with 4 user and 9 bot decisions gives 4 entries in order and none for bots', () => {
    const hand = record(REVIEW_FOUR);
    const botActions = hand.actions.filter(
      (a) => a.seat !== 5 && a.type !== 'small-blind' && a.type !== 'big-blind',
    );
    expect(botActions).toHaveLength(9);
    expect(hand.userDecisions).toHaveLength(4);
    expect(opensReview(hand)).toBe(true);
    const entries = reviewEntries(hand);
    expect(summary(entries)).toEqual([
      ['Preflop', [], 'Raise to $8', 'Raise to $8'],
      ['Flop', ['Ks', '9d', '4c'], 'Bet $4', 'Check'],
      ['Turn', ['Ks', '9d', '4c', '2h'], 'Check', 'Check'],
      ['River', ['Ks', '9d', '4c', '2h', '6s'], 'Call $8', 'Call $8'],
    ]);
    for (const entry of entries) expect(entry.userAction.seat).toBe(5);
  });

  it("each entry's grade is the grader output for that decision's view", () => {
    const hand = record(REVIEW_FOUR);
    const entries = reviewEntries(hand);
    expect(entries).toHaveLength(hand.userDecisions.length);
    hand.userDecisions.forEach((decision, i) => {
      const entry = entries[i];
      const expected = gradeView(decision.view, decision.action.type);
      expect(entry?.result).toEqual(expected);
      expect(entry?.grade).toBe(expected.grade);
      expect(entry?.gradeLabel).toBe(GRADE_LABELS[expected.grade]);
    });
    expect(entries.map((e) => e.gradeLabel)).toEqual([
      'Correct',
      'Minor error',
      'Correct',
      'Correct',
    ]);
  });

  it('a lone preflop fold or a big-blind walk opens no review', () => {
    const fold = record(PREFLOP_FOLD_ONLY);
    expect(fold.userDecisions).toHaveLength(1);
    expect(fold.userDecisions[0]?.action.type).toBe('fold');
    expect(fold.userDecisions[0]?.view.street).toBe('preflop');
    const walk = record(BB_WALK);
    expect(walk.userDecisions).toEqual([]);
    expect(walk.result.awards[0]?.winners).toEqual([{ seat: 5, amount: 4 }]);
    for (const [table, hand] of [
      [PREFLOP_FOLD_ONLY, fold],
      [BB_WALK, walk],
    ] as const) {
      expect(opensReview(hand)).toBe(false);
      expect(nextHandDelay(table, false)).toBe(1500);
    }
  });

  it('calling then folding preflop opens a review with the call and the fold', () => {
    const hand = record(CALL_THEN_FOLD);
    expect(opensReview(hand)).toBe(true);
    const entries = reviewEntries(hand);
    expect(entries.map((e) => [...(summary([e])[0] ?? []), e.gradeLabel])).toEqual([
      ['Preflop', [], 'Call $8', 'Fold', 'Major error'],
      ['Preflop', [], 'Fold', 'Fold', 'Correct'],
    ]);
    const raise = record(RAISE_TAKES_BLINDS);
    expect(opensReview(raise)).toBe(true);
    expect(summary(reviewEntries(raise))).toEqual([['Preflop', [], 'Raise to $8', 'Raise to $8']]);
  });
});
