import type { PlayerView } from '../engine/player-view';
import { recommendPostflop, type PostflopOptions, type PostflopRecommendation } from './postflop';
import { recommendPreflop, type PreflopOptions, type PreflopRecommendation } from './preflop';

/** Discriminated by `basis`: 'chart' preflop, 'equity' postflop. */
export type Recommendation = PreflopRecommendation | PostflopRecommendation;
export type RecommendOptions = PreflopOptions & PostflopOptions;

/** Preflop views → recommendPreflop; flop/turn/river → recommendPostflop. Errors propagate. */
export function recommend(view: PlayerView, options: RecommendOptions = {}): Recommendation {
  return view.street === 'preflop'
    ? recommendPreflop(view, options)
    : recommendPostflop(view, options);
}
