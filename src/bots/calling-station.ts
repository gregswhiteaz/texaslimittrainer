import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { recommend, type RecommendOptions } from '../advice/recommend';
import { drawDeviation, findDeviation, parseStyle, type BotStyleData } from './style';
import { FREE_CHECK_EQUITY, type BotRandom } from './tag';
// The JSON import stays last: the bots import-boundary test's regex can't read past its `with` clause.
import callingStation from './styles/calling-station.json' with { type: 'json' };

/** The Calling station's style file, validated at import. */
export const CALLING_STATION_STYLE: BotStyleData = parseStyle(
  callingStation,
  'calling-station.json',
);

/** `random` is the bot's seeded generator (REQ-028.1); without it the station never deviates.
 *  `style` defaults to CALLING_STATION_STYLE. */
export type CallingStationOptions = RecommendOptions & {
  readonly random?: BotRandom;
  readonly style?: BotStyleData;
};

/**
 * The Calling station decision: the advice engine's recommended move for `view`, except where the style has a
 * deviation for the advised action, where one draw from `random` decides whether to play passively instead: call
 * when a bet is owed, else check. Errors from recommend propagate.
 */
export function decideCallingStation(
  view: PlayerView,
  options: CallingStationOptions = {},
): Action {
  const hero = view.players.find((p) => p.seat === view.seat);
  const owed = hero === undefined ? 0 : view.currentBet - hero.streetContribution;
  const street = view.street === 'preflop' ? 'preflop' : 'postflop';
  if (street === 'postflop' && owed === 0) {
    // Skips the equity run the free check never reads (the move is identical).
    return recommend(view, { ...options, equity: FREE_CHECK_EQUITY }).move;
  }
  const advice = recommend(view, options);
  if (options.random === undefined) return advice.move;
  const deviation = findDeviation(options.style ?? CALLING_STATION_STYLE, street, advice.action);
  if (deviation === undefined || !drawDeviation(deviation.probability, options.random)) {
    return advice.move;
  }
  const type = owed > 0 ? 'call' : 'check';
  const move = view.legalActions.find((a) => a.type === type);
  if (move === undefined) throw new Error(`No legal ${type} for seat ${view.seat}`);
  return move;
}
