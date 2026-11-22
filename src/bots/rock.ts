import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { handClassOf } from '../advice/hand-class';
import { positionOf, situationOf } from '../advice/preflop';
import { adviceOptions, recommend, type RecommendOptions } from '../advice/recommend';
import { parseStyle, startingRangeFor, type BotStyleData } from './style';
import { FREE_CHECK_EQUITY } from './tag';
// The JSON import stays last: the bots import-boundary test's regex can't read past its `with` clause.
import rock from './styles/rock.json' with { type: 'json' };

/** The Rock's style file, validated at import (its range checked against the TAG chart). */
export const ROCK_STYLE: BotStyleData = parseStyle(rock, 'rock.json');

/** `style` defaults to ROCK_STYLE and needs a starting range. The Rock draws nothing. */
export type RockOptions = RecommendOptions & { readonly style?: BotStyleData };

/**
 * The Rock decision. Preflop, a hand class outside the style's starting range for the viewer's spot folds when a
 * bet is owed and checks when nothing is; inside the range, and on every later street, it plays the advice
 * engine's move. Throws RangeError when the style has no starting range; errors from the advice propagate.
 */
export function decideRock(view: PlayerView, options: RockOptions = {}): Action {
  const hero = view.players.find((p) => p.seat === view.seat);
  const owed = hero === undefined ? 0 : view.currentBet - hero.streetContribution;
  if (view.street !== 'preflop') {
    return owed === 0
      ? // Skips the equity run the free check never reads (the move is identical).
        recommend(view, { ...adviceOptions(options), equity: FREE_CHECK_EQUITY }).move
      : recommend(view, adviceOptions(options)).move;
  }
  const style = options.style ?? ROCK_STYLE;
  const position = positionOf(view);
  const situation = situationOf(view);
  if (style.startingRange === null) {
    throw new RangeError(`Style ${style.style} has no starting range`);
  }
  const spot = startingRangeFor(style, position, situation);
  if (spot === undefined) {
    throw new RangeError(`Style ${style.style} has no starting range for ${position} ${situation}`);
  }
  if (spot.hands.has(handClassOf(view.holeCards)))
    return recommend(view, adviceOptions(options)).move;
  // Preflop the engine always offers fold when a bet is owed and check when none is.
  const type = owed > 0 ? 'fold' : 'check';
  return view.legalActions.find((a) => a.type === type) as Action;
}
