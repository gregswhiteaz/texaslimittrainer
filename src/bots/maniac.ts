import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { adviceOptions, recommend, type RecommendOptions } from '../advice/recommend';
import { drawDeviation, findDeviation, parseStyle, type BotStyleData } from './style';
import { BOT_ADVICE, BOT_EQUITY, type BotRandom } from './tag';
// The JSON import stays last: the bots import-boundary test's regex can't read past its `with` clause.
import maniac from './styles/maniac.json' with { type: 'json' };

/** The Maniac's style file, validated at import. */
export const MANIAC_STYLE: BotStyleData = parseStyle(maniac, 'maniac.json');

/** `random` is the bot's seeded generator (REQ-028.1); without it the Maniac never deviates.
 *  `style` defaults to MANIAC_STYLE. */
export type ManiacOptions = RecommendOptions & {
  readonly random?: BotRandom;
  readonly style?: BotStyleData;
};

/**
 * The Maniac decision: the advice engine's recommended move for `view`, except where the style has a deviation
 * for the advised action, where one draw from `random` decides whether to play the deviation's aggressive action
 * instead. When that action isn't legal (capped street, no re-raise, short stack) it calls if a bet is owed, else
 * keeps the advice's move. Errors from recommend propagate.
 */
export function decideManiac(view: PlayerView, options: ManiacOptions = {}): Action {
  const street = view.street === 'preflop' ? 'preflop' : 'postflop';
  const advice = recommend(view, {
    ...BOT_ADVICE,
    ...adviceOptions(options),
    equity: options.equity ?? BOT_EQUITY,
  });
  if (options.random === undefined) return advice.move;
  const deviation = findDeviation(options.style ?? MANIAC_STYLE, street, advice.action);
  if (deviation === undefined || !drawDeviation(deviation.probability, options.random)) {
    return advice.move;
  }
  return (
    view.legalActions.find((a) => a.type === deviation.instead) ??
    view.legalActions.find((a) => a.type === 'call') ??
    advice.move
  );
}
