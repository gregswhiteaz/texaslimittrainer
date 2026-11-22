import { GRADE_LABELS, gradeView, type Grade, type GradeResult } from '../advice/grade';
import { ACTION_RANGE_ADVICE, type RecommendOptions } from '../advice/recommend';
import type { Card } from '../engine/cards';
import type { Action } from '../engine/hand';
import { actionLabel } from './action-bar';
import type { CompletedHand } from './session';

export type ReviewStreet = 'preflop' | 'flop' | 'turn' | 'river';

export const STREET_LABELS: Readonly<Record<ReviewStreet, string>> = {
  preflop: 'Preflop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
};

export interface ReviewEntry {
  readonly street: ReviewStreet;
  readonly streetLabel: string;
  /** The board in that decision's view (a copy). */
  readonly board: readonly Card[];
  readonly userAction: Action;
  readonly userActionText: string;
  readonly adviceText: string;
  readonly grade: Grade;
  readonly gradeLabel: string;
  readonly result: GradeResult;
}

/** False iff the user made no decision, or exactly one decision that was a preflop fold (REQ-043.12). */
export function opensReview(hand: CompletedHand): boolean {
  const [first, ...rest] = hand.userDecisions;
  if (first === undefined) return false;
  return rest.length > 0 || first.action.type !== 'fold' || first.view.street !== 'preflop';
}

/** One entry per user decision, same order. Errors from gradeView propagate (A-5). */
export function reviewEntries(
  hand: CompletedHand,
  options?: RecommendOptions,
): readonly ReviewEntry[] {
  return hand.userDecisions.map(({ view, action }) => {
    // A decision is only ever captured on a betting street.
    const street = view.street as ReviewStreet;
    const result = gradeView(view, action.type, options);
    return {
      street,
      streetLabel: STREET_LABELS[street],
      board: [...view.board],
      userAction: action,
      userActionText: actionLabel(action),
      adviceText: actionLabel(result.recommendation.move),
      grade: result.grade,
      gradeLabel: GRADE_LABELS[result.grade],
      result,
    };
  });
}

/** The review the user sees: postflop grades against action-based opponent ranges (TASK-7.5). */
export function userReviewEntries(hand: CompletedHand): readonly ReviewEntry[] {
  return reviewEntries(hand, ACTION_RANGE_ADVICE);
}
