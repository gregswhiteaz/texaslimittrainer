import { chartBasisText, formatPct } from '../advice/explain';
import { GRADE_LABELS, gradeView, type Grade, type GradeResult } from '../advice/grade';
import { handClassOf } from '../advice/hand-class';
import { chartSpotOf, referenceSizeOf, type PreflopAdvice } from '../advice/preflop';
import { ACTION_RANGE_ADVICE, type RecommendOptions } from '../advice/recommend';
import type { Card } from '../engine/cards';
import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { actionLabel } from './action-bar';
import type { HandRecordDecision } from './hand-record';
import { opponentLines, type HintCardView } from './hint';
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
  return hand.userDecisions.map(({ view, action, observed }) => {
    // A decision is only ever captured on a betting street.
    const street = view.street as ReviewStreet;
    // The decision-time snapshot, so the review repeats the hint after later hands change the stats (A-5).
    const result = gradeView(
      view,
      action.type,
      observed === undefined ? options : { ...options, observedOpponents: observed },
    );
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

/** A review entry read from the decision's stored entry (TASK-9.3): nothing is graded again. */
export interface StoredReviewEntry {
  readonly street: ReviewStreet;
  readonly streetLabel: string;
  /** The board in that decision's view (a copy). */
  readonly board: readonly Card[];
  readonly userActionText: string;
  readonly adviceText: string;
  readonly grade: Grade;
  readonly gradeLabel: string;
  /** Preflop (basis 'chart') only: the hint's chart line. */
  readonly chartBasis: string | null;
  /** Postflop only, one decimal with %. */
  readonly equity: string | null;
  readonly requiredEquity: string | null;
  readonly explanation: string;
  readonly opponents: HintCardView['opponents'];
  /** The stored entry it was built from. */
  readonly decision: HandRecordDecision;
}

/** The chart line of a preflop decision, from the inputs recommendPreflop uses (A-4). */
function chartLine(view: PlayerView, recommended: Action): string {
  const referenceSize = referenceSizeOf(view.players.length);
  return chartBasisText({
    referenceSize,
    position: chartSpotOf(view, referenceSize).position,
    handClass: handClassOf(view.holeCards),
    action: recommended.type as PreflopAdvice,
  });
}

/** One entry per stored decision, same order. RangeError('Review needs one stored decision per user decision')
 *  if the counts differ or a stored street differs from its decision's view. No grading. */
export function storedReviewEntries(
  hand: CompletedHand,
  decisions: readonly HandRecordDecision[],
): readonly StoredReviewEntry[] {
  if (
    decisions.length !== hand.userDecisions.length ||
    decisions.some((d, i) => d.street !== hand.userDecisions[i]?.view.street)
  ) {
    throw new RangeError('Review needs one stored decision per user decision');
  }
  const names = new Map(hand.seats.map((s) => [s.seat, s.name]));
  return decisions.map((decision, i) => {
    const { view } = hand.userDecisions[i] as { view: PlayerView };
    const { street } = decision;
    const chart = decision.basis === 'chart';
    return {
      street,
      streetLabel: STREET_LABELS[street],
      board: [...view.board],
      userActionText: actionLabel(decision.action),
      adviceText: actionLabel(decision.recommended),
      grade: decision.grade.grade,
      gradeLabel: GRADE_LABELS[decision.grade.grade],
      chartBasis: chart ? chartLine(view, decision.recommended) : null,
      equity: decision.equityPct === null ? null : formatPct(decision.equityPct),
      requiredEquity:
        decision.requiredEquityPct === null ? null : formatPct(decision.requiredEquityPct),
      explanation: decision.explanation,
      opponents: opponentLines(view, chart ? null : decision.opponentBasis, names),
      decision,
    };
  });
}
