import { describe, expect, it } from 'vitest';
import type { Grade } from '../../src/advice/grade';
import { decisionRecord } from '../../src/table/hand-record';
import { afterHandReview, opensReview, reviewBadge } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import {
  BB_WALK,
  CALL_THEN_FOLD,
  PREFLOP_FOLD_ONLY,
  RAISE_TAKES_BLINDS,
  REVIEW_DECK,
  REVIEW_FOUR,
  REVIEW_WON_56,
  userTableAfter,
} from '../support/table-scenarios';

/** REVIEW_FOUR's moves with the river call replaced by a fold. */
const FOUR_MOVES =
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call';
const RIVER_FOLD = userTableAfter(REVIEW_DECK, FOUR_MOVES.replace(/5:call$/, '5:fold'));

function record(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

/** The stored grades of the hand's decisions, in order. */
const storedGrades = (table: TableState): Grade[] =>
  record(table)
    .userDecisions.map(decisionRecord)
    .map((d) => d.grade.grade);

describe('TASK-9.7 review badge model', () => {
  it('the badge counts Major and Minor errors and reads All correct without errors', () => {
    const cases: [string, TableState, Grade[], string, Grade][] = [
      [
        'RIVER_FOLD',
        RIVER_FOLD,
        ['correct', 'correct', 'minor', 'major'],
        '1 Major, 1 Minor',
        'major',
      ],
      ['RAISE_TAKES_BLINDS', RAISE_TAKES_BLINDS, ['correct'], 'All correct', 'correct'],
      ['CALL_THEN_FOLD', CALL_THEN_FOLD, ['major', 'correct'], '1 Major', 'major'],
      ['REVIEW_FOUR', REVIEW_FOUR, ['correct', 'correct', 'minor', 'correct'], '1 Minor', 'minor'],
      [
        'REVIEW_WON_56',
        REVIEW_WON_56,
        ['correct', 'correct', 'major', 'major', 'major'],
        '3 Major',
        'major',
      ],
    ];
    for (const [name, table, grades, text, worst] of cases) {
      const stored = storedGrades(table);
      expect(stored, `${name} grades`).toEqual(grades);
      expect(afterHandReview(record(table), false), name).toBe('badge');
      expect(reviewBadge(stored), name).toEqual({
        text,
        worst,
        label: `Open hand review: ${text}`,
      });
    }
    const reversed = [...storedGrades(RIVER_FOLD)].reverse();
    expect(reviewBadge(reversed)).toEqual(reviewBadge(storedGrades(RIVER_FOLD)));
    expect(() => reviewBadge([])).toThrow(
      new RangeError('A review badge needs at least one grade'),
    );
    expect(() => reviewBadge([])).toThrow(RangeError);
  });

  it('the panel opens only with auto-open on, otherwise a badge, never after a lone preflop fold', () => {
    for (const table of [RIVER_FOLD, RAISE_TAKES_BLINDS, CALL_THEN_FOLD, REVIEW_FOUR]) {
      const hand = record(table);
      expect(afterHandReview(hand, true)).toBe('panel');
      expect(afterHandReview(hand, false)).toBe('badge');
    }
    for (const table of [PREFLOP_FOLD_ONLY, BB_WALK]) {
      const hand = record(table);
      expect(afterHandReview(hand, true)).toBe('none');
      expect(afterHandReview(hand, false)).toBe('none');
    }
    for (const table of [
      RIVER_FOLD,
      RAISE_TAKES_BLINDS,
      CALL_THEN_FOLD,
      REVIEW_FOUR,
      REVIEW_WON_56,
      PREFLOP_FOLD_ONLY,
      BB_WALK,
    ]) {
      const hand = record(table);
      expect(afterHandReview(hand, true) === 'panel').toBe(opensReview(hand));
    }
  });

  it('calling then folding preflop shows a badge, a lone preflop fold does not', () => {
    const callThenFold = record(CALL_THEN_FOLD);
    expect(callThenFold.userDecisions.map((d) => [d.view.street, d.action.type])).toEqual([
      ['preflop', 'call'],
      ['preflop', 'fold'],
    ]);
    expect(callThenFold.userDecisions[0]?.action).toMatchObject({ type: 'call', amount: 8 });
    expect(afterHandReview(callThenFold, false)).toBe('badge');
    expect(reviewBadge(storedGrades(CALL_THEN_FOLD)).text).toBe('1 Major');

    const foldOnly = record(PREFLOP_FOLD_ONLY);
    expect(foldOnly.userDecisions.map((d) => [d.view.street, d.action.type])).toEqual([
      ['preflop', 'fold'],
    ]);
    expect(storedGrades(PREFLOP_FOLD_ONLY)).toEqual(['major']);
    expect(afterHandReview(foldOnly, false)).toBe('none');
  });
});
