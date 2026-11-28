import type { Action } from '../engine/hand';
import type { PlayerView, SeatPolicy } from '../engine/player-view';
import {
  equityWithBudget,
  type EquityBudget,
  type EquityInput,
  type EquityResult,
} from '../advice/equity';
import type { PostflopOptions } from '../advice/postflop';
import { SIX_MAX_CHART } from '../advice/preflop';
import type { ChartSpot, PreflopChart } from '../advice/preflop-chart';
import { adviceOptions, recommend, type RecommendOptions } from '../advice/recommend';
import { drawMixed, parseStyle, type BotStyleData, type SpotType } from './style';
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

/** Dealt-in seat counts at which TAG plays TAG_SHORT_HANDED_CHART. */
export const TAG_SHORT_HANDED_SEATS: readonly number[] = [3, 4];

const coUnopened = SIX_MAX_CHART.spots.find(
  (s) => s.position === 'CO' && s.situation === 'unopened',
) as ChartSpot;

/** SIX_MAX_CHART with the BTN unopened and SB unopened cells replaced by the CO unopened cells (TASK-7.37 A-1).
 *  Every other spot is the same object as in SIX_MAX_CHART. referenceSize '6-max'. */
export const TAG_SHORT_HANDED_CHART: PreflopChart = {
  ...SIX_MAX_CHART,
  spots: SIX_MAX_CHART.spots.map((spot) =>
    spot.situation === 'unopened' && (spot.position === 'BTN' || spot.position === 'SB')
      ? { ...spot, cells: coUnopened.cells }
      : spot,
  ),
};

/** TAG_SHORT_HANDED_CHART when dealtIn is in TAG_SHORT_HANDED_SEATS, else undefined (the shared chart applies). */
export function tagChartFor(dealtIn: number): PreflopChart | undefined {
  return TAG_SHORT_HANDED_SEATS.includes(dealtIn) ? TAG_SHORT_HANDED_CHART : undefined;
}

/**
 * The TAG decision: the advice engine's recommended move for `view`, except in a preflop cell with an acceptable
 * alternative in a spot type TAG_STYLE marks as mixed, where one draw from `random` picks between the two.
 * Preflop at 3 or 4 dealt-in seats it reads TAG_SHORT_HANDED_CHART unless `options.chart` is given.
 * Errors from recommend propagate.
 */
export function decideTag(view: PlayerView, options: TagOptions = {}): Action {
  const chart =
    options.chart ?? (view.street === 'preflop' ? tagChartFor(view.players.length) : undefined);
  const advice = recommend(view, {
    ...BOT_ADVICE,
    ...adviceOptions(options),
    ...(chart === undefined ? {} : { chart }),
    equity: options.equity ?? BOT_EQUITY,
  });
  if (options.random === undefined || advice.basis !== 'chart' || advice.alternative === null) {
    return advice.move;
  }
  // Situations with no SPOT_TYPES entry (re-raise-not-mine, TASK-7.40 A-4) are never mixed;
  // blind-defence-early mixes as preflop-blind-defence (TASK-7.42 A-1).
  const situation = advice.situation === 'blind-defence-early' ? 'blind-defence' : advice.situation;
  const spot = TAG_STYLE.mixedSpots.get(`preflop-${situation}` as SpotType);
  if (spot === undefined || drawMixed(spot, options.random) === 'recommended') return advice.move;
  const type = advice.alternative;
  const move = view.legalActions.find((a) => a.type === type);
  if (move === undefined) throw new Error(`No legal ${type} for seat ${view.seat}`);
  return move;
}

/** decideTag as a seat policy (no options). */
export const tagPolicy: SeatPolicy = (view) => decideTag(view);
