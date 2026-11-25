import type { Action } from '../engine/hand';
import type { PlayerView, SeatPolicy } from '../engine/player-view';
import {
  equityWithBudget,
  type EquityBudget,
  type EquityInput,
  type EquityResult,
} from '../advice/equity';
import type { PostflopOptions } from '../advice/postflop';
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

/** The bots' equity budget (TASK-7.8 Q-1): bots are opponents, not shown advice, so they sample less. */
export const BOT_EQUITY_BUDGET: EquityBudget = { exactLimit: 2_500, trials: 500 };

/** Bot equity: computeEquity's seeded engine at BOT_EQUITY_BUDGET. Deterministic. */
export function BOT_EQUITY(input: EquityInput): EquityResult {
  return equityWithBudget(input, BOT_EQUITY_BUDGET);
}

/** The bots' range model (TASK-7.32): opponents' action ranges with the typical-player basis, never observed stats
 *  (REQ-029.2). Spread before adviceOptions so an explicit `opponentRanges` still wins. */
export const BOT_ADVICE: PostflopOptions = { opponentRanges: 'actions' };

/**
 * The TAG decision: the advice engine's recommended move for `view`, except in a preflop cell with an acceptable
 * alternative in a spot type TAG_STYLE marks as mixed, where one draw from `random` picks between the two.
 * Errors from recommend propagate.
 */
export function decideTag(view: PlayerView, options: TagOptions = {}): Action {
  const advice = recommend(view, {
    ...BOT_ADVICE,
    ...adviceOptions(options),
    equity: options.equity ?? BOT_EQUITY,
  });
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
