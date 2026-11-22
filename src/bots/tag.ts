import type { Action } from '../engine/hand';
import type { PlayerView, PublicPlayer, SeatPolicy } from '../engine/player-view';
import type { EquityInput, EquityResult } from '../advice/equity';
import { adviceOptions, recommend, type RecommendOptions } from '../advice/recommend';
import { drawMixed, parseStyle, type BotStyleData } from './style';
// The JSON import stays last: the bots import-boundary test's regex can't read past its `with` clause.
import tagStyle from './styles/tag.json' with { type: 'json' };

/** TAG's style file, validated at import. */
export const TAG_STYLE: BotStyleData = parseStyle(tagStyle, 'tag.json');

/** The bot's seeded generator (botRandom in src/engine/bot-random.ts), typed by shape: bot code sees only PlayerView types from the engine. */
export interface BotRandom {
  nextUint32(): number;
}

/** `random` is the bot's seeded generator (REQ-028.1); without it TAG never mixes. */
export type TagOptions = RecommendOptions & { readonly random?: BotRandom };

/** Equity stand-in for postflop decisions with nothing owed: rule check-free fires before equity is read. */
export function FREE_CHECK_EQUITY(input: EquityInput): EquityResult {
  const zero = { win: 0, tie: 0, equity: 0 };
  return { hero: zero, opponents: input.opponents.map(() => zero), method: 'exact', trials: 0 };
}

/**
 * The TAG decision: the advice engine's recommended move for `view`, except in a preflop cell with an acceptable
 * alternative in a spot type TAG_STYLE marks as mixed, where one draw from `random` picks between the two.
 * Errors from recommend propagate.
 */
export function decideTag(view: PlayerView, options: TagOptions = {}): Action {
  const hero: PublicPlayer | undefined = view.players.find((p) => p.seat === view.seat);
  const postflop = view.street === 'flop' || view.street === 'turn' || view.street === 'river';
  if (postflop && hero !== undefined && view.currentBet - hero.streetContribution === 0) {
    // Skips the equity run the free check never reads (the move is identical).
    return recommend(view, { ...adviceOptions(options), equity: FREE_CHECK_EQUITY }).move;
  }
  const advice = recommend(view, adviceOptions(options));
  if (options.random === undefined || advice.basis !== 'chart' || advice.alternative === null) {
    return advice.move;
  }
  const spot = TAG_STYLE.mixedSpots.get(`preflop-${advice.situation}`);
  if (spot === undefined || drawMixed(spot, options.random) === 'recommended') return advice.move;
  const type = advice.alternative;
  const move = view.legalActions.find((a) => a.type === type);
  if (move === undefined) throw new Error(`No legal ${type} for seat ${view.seat}`);
  return move;
}

/** decideTag as a seat policy (no options). */
export const tagPolicy: SeatPolicy = (view) => decideTag(view);
