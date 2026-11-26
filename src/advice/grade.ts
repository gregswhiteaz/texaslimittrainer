import type { PlayerView } from '../engine/player-view';
import { VALUE_THRESHOLD_PCT } from './postflop';
import {
  recommend,
  type ExactOptions,
  type Recommendation,
  type RecommendOptions,
} from './recommend';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise';
export type Grade = 'correct' | 'minor' | 'major';

/** User-approved display labels (REQ-038). */
export const GRADE_LABELS: Readonly<Record<Grade, string>> = {
  correct: 'Correct',
  minor: 'Minor error',
  major: 'Major error',
};

export const GRADE_RULE_IDS = [
  'match', // REQ-038.1 user action = recommended action
  'alternative', // REQ-038.1 user action = acceptable alternative
  'preflop-borderline', // REQ-038.2 → minor
  'preflop-chart', // REQ-038.2 → major
  'call-fold-margin', // REQ-038.3 / REQ-038.6
  'aggression-margin', // REQ-038.4
  'aggression-no-range', // D-2 (Q-2, qa.md)
] as const;
export type GradeRuleId = (typeof GRADE_RULE_IDS)[number];

/** What the grader reads from a preflop recommendation. PreflopRecommendation is assignable. */
export interface ChartGradeInput {
  readonly basis: 'chart';
  readonly action: ActionType;
  readonly alternative: ActionType | null;
  readonly borderline: boolean;
}

/** What the grader reads from a postflop recommendation. PostflopRecommendation is assignable. */
export interface EquityGradeInput {
  readonly basis: 'equity';
  readonly action: ActionType;
  readonly alternative: ActionType | null;
  readonly equityPct: number;
  readonly requiredEquityPct: number;
  /** Equity against the range that would call, percent one decimal; always set by recommendPostflop (TASK-7.8),
   *  absent/null only in hand-built inputs (graded aggression-no-range). */
  readonly equityVsCallingRangePct?: number | null;
  /** The value threshold that applied (recommendPostflop sets 50 or 65); absent/null in hand-built inputs → 50. */
  readonly valueThresholdPct?: number | null;
}

export type GradeInput = ChartGradeInput | EquityGradeInput;

/** Plain, JSON-serialisable data (no functions, Maps or class instances). */
export interface GradeResult<R extends GradeInput = Recommendation> {
  readonly grade: Grade;
  readonly ruleId: GradeRuleId;
  readonly userAction: ActionType;
  /** Signed margin (points, one decimal) the deciding rule measured; null for correct and preflop. */
  readonly marginPts: number | null;
  /** The recommendation the grade was based on, unchanged (same reference). */
  readonly recommendation: R;
}

const CALL_FOLD_MAJOR_TENTHS = 100;
const AGGRESSION_MAJOR_TENTHS = 150;

/** Pairs legalActions never offers together at one decision point (A-5). */
const IMPOSSIBLE_PAIRS: readonly (readonly [ActionType, ActionType])[] = [
  ['check', 'fold'],
  ['check', 'call'],
  ['bet', 'fold'],
  ['bet', 'call'],
  ['bet', 'raise'],
];

/** Percent → integer tenths of a point, so margins compare the one-decimal numbers the player sees. */
const tenths = (pct: number): number => Math.round(pct * 10);

function finitePct(
  field: 'equityPct' | 'requiredEquityPct' | 'equityVsCallingRangePct' | 'valueThresholdPct',
  value: number | undefined,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    throw new RangeError(`${field} must be a finite number, got ${String(value)}`);
  }
  return value;
}

/**
 * Pure: same inputs → deep-equal result. Throws RangeError for impossible pairings (A-5) and when a
 * number the deciding margin rule reads is NaN, ±Infinity or missing.
 */
export function gradeDecision<R extends GradeInput>(
  recommendation: R,
  userAction: ActionType,
): GradeResult<R> {
  const result = (grade: Grade, ruleId: GradeRuleId, marginPts: number | null): GradeResult<R> => ({
    grade,
    ruleId,
    userAction,
    marginPts,
    recommendation,
  });
  const recommended = recommendation.action;
  if (userAction === recommended) return result('correct', 'match', null);
  if (userAction === recommendation.alternative) return result('correct', 'alternative', null);
  if (
    IMPOSSIBLE_PAIRS.some(
      ([x, y]) =>
        (x === userAction && y === recommended) || (x === recommended && y === userAction),
    )
  ) {
    throw new RangeError(`${userAction} and ${recommended} cannot both be legal`);
  }

  if (recommendation.basis === 'chart') {
    return recommendation.borderline
      ? result('minor', 'preflop-borderline', null)
      : result('major', 'preflop-chart', null);
  }

  if (userAction === 'fold' || recommended === 'fold') {
    const equity = tenths(finitePct('equityPct', recommendation.equityPct));
    const required = tenths(finitePct('requiredEquityPct', recommendation.requiredEquityPct));
    const margin = userAction === 'fold' ? equity - required : required - equity;
    return result(
      margin >= CALL_FOLD_MAJOR_TENTHS ? 'major' : 'minor',
      'call-fold-margin',
      margin / 10,
    );
  }

  const vsCallingRange = recommendation.equityVsCallingRangePct;
  if (vsCallingRange === undefined || vsCallingRange === null) {
    return result('minor', 'aggression-no-range', null);
  }
  const calling = tenths(finitePct('equityVsCallingRangePct', vsCallingRange));
  const t = recommendation.valueThresholdPct;
  const threshold = tenths(
    t === undefined || t === null ? VALUE_THRESHOLD_PCT : finitePct('valueThresholdPct', t),
  );
  const distance = Math.abs(calling - threshold);
  return result(
    distance >= AGGRESSION_MAJOR_TENTHS ? 'major' : 'minor',
    'aggression-margin',
    distance / 10,
  );
}

/** One recommend(view, options) call, then gradeDecision. Throws RangeError if userAction is not legal in view. */
export function gradeView<O extends object = RecommendOptions>(
  view: PlayerView,
  userAction: ActionType,
  options?: ExactOptions<O, RecommendOptions>,
): GradeResult<Recommendation> {
  if (!view.legalActions.some((a) => a.type === userAction)) {
    throw new RangeError(`${userAction} is not legal for seat ${view.seat}`);
  }
  const advice: RecommendOptions | undefined = options;
  return gradeDecision(recommend(view, advice), userAction);
}
