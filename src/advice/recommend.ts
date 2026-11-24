import type { PlayerView } from '../engine/player-view';
import { recommendPostflop, type PostflopOptions, type PostflopRecommendation } from './postflop';
import { recommendPreflop, type PreflopOptions, type PreflopRecommendation } from './preflop';
import type { ObservedOpponent } from './ranges';

/** Discriminated by `basis`: 'chart' preflop, 'equity' postflop. */
export type Recommendation = PreflopRecommendation | PostflopRecommendation;
export type RecommendOptions = PreflopOptions & PostflopOptions;

/**
 * `O` checked against `Allowed`, with every key outside `Allowed` typed `never`: passing a bot's style or
 * parameters (or any other extra key) into the advice engine is a type error, for literals and variables alike
 * (REQ-035.3). Not caught structurally: an explicit type argument (`recommend<RecommendOptions>(view, x)`) or a
 * variable already widened to `Allowed`.
 */
export type ExactOptions<O, Allowed> = O &
  Allowed &
  Readonly<Record<Exclude<keyof O, keyof Allowed>, never>>;

/** User-facing advice: opponent ranges estimated from their actions (TASK-7.5). */
// Typed as PostflopOptions (a RecommendOptions subset) so it also passes recommendPostflop's exact-keys guard.
export const ACTION_RANGE_ADVICE: PostflopOptions = { opponentRanges: 'actions' };

/** The user's advice options (hints, grades and stored records): ACTION_RANGE_ADVICE itself without a snapshot,
 *  else ACTION_RANGE_ADVICE with `observed` as the observed-stats snapshot. */
export function userAdviceOptions(observed?: readonly ObservedOpponent[]): RecommendOptions {
  return observed === undefined
    ? ACTION_RANGE_ADVICE
    : { ...ACTION_RANGE_ADVICE, observedOpponents: observed };
}

/** Only the advice keys of `options` (equity, chart, opponentRanges); bots pass their options through this. */
export function adviceOptions(options: RecommendOptions): RecommendOptions {
  const picked: { -readonly [K in keyof RecommendOptions]: RecommendOptions[K] } = {};
  if (options.equity !== undefined) picked.equity = options.equity;
  if (options.chart !== undefined) picked.chart = options.chart;
  if (options.opponentRanges !== undefined) picked.opponentRanges = options.opponentRanges;
  return picked;
}

/** Preflop views → recommendPreflop; flop/turn/river → recommendPostflop. Errors propagate. */
export function recommend<O extends object = RecommendOptions>(
  view: PlayerView,
  options?: ExactOptions<O, RecommendOptions>,
): Recommendation {
  const advice: RecommendOptions = options ?? {};
  return view.street === 'preflop'
    ? recommendPreflop(view, advice)
    : recommendPostflop<PostflopOptions>(view, advice);
}
