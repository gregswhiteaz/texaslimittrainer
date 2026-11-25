import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { handClassOf } from '../advice/hand-class';
import { chartSpotOf } from '../advice/preflop';
import { adviceOptions, recommend, type RecommendOptions } from '../advice/recommend';
import { parseStyle, postflopValueMove, startingRangeFor, type BotStyleData } from './style';
import { BOT_ADVICE, BOT_EQUITY } from './tag';
// The JSON import stays last: the bots import-boundary test's regex can't read past its `with` clause.
import rock from './styles/rock.json' with { type: 'json' };

/** The Rock's style file, validated at import (its range checked against the TAG chart). */
export const ROCK_STYLE: BotStyleData = parseStyle(rock, 'rock.json');

/** `style` defaults to ROCK_STYLE and needs a starting range. The Rock draws nothing. */
export type RockOptions = RecommendOptions & { readonly style?: BotStyleData };

/**
 * The Rock decision. Preflop, a hand class outside the style's starting range for the viewer's spot folds when a
 * bet is owed and checks when nothing is; inside the range it plays the advice engine's move. After the flop it
 * plays the advice, except that with a style `postflopValue` an advised bet or raise stands only when the equity
 * against the calling range is above its threshold; otherwise it calls a bet or checks. Throws RangeError when the
 * style has no starting range; errors from the advice propagate.
 */
export function decideRock(view: PlayerView, options: RockOptions = {}): Action {
  const hero = view.players.find((p) => p.seat === view.seat);
  const owed = hero === undefined ? 0 : view.currentBet - hero.streetContribution;
  const advice = { ...BOT_ADVICE, ...adviceOptions(options), equity: options.equity ?? BOT_EQUITY };
  const style = options.style ?? ROCK_STYLE;
  if (view.street !== 'preflop') {
    const rec = recommend(view, advice);
    return postflopValueMove(style, view, rec) ?? rec.move;
  }
  // The style's range is written for 6-max; other sizes map onto its positions (TASK-7.6 A-4).
  const { position, situation } = chartSpotOf(view, '6-max');
  if (style.startingRange === null) {
    throw new RangeError(`Style ${style.style} has no starting range`);
  }
  const spot = startingRangeFor(style, position, situation);
  if (spot === undefined) {
    throw new RangeError(`Style ${style.style} has no starting range for ${position} ${situation}`);
  }
  if (spot.hands.has(handClassOf(view.holeCards))) return recommend(view, advice).move;
  // Preflop the engine always offers fold when a bet is owed and check when none is.
  const type = owed > 0 ? 'fold' : 'check';
  return view.legalActions.find((a) => a.type === type) as Action;
}
