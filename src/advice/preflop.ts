import { STREET_BET_CAP, type Action } from '../engine/hand';
import type { PlayerView, PublicPlayer } from '../engine/player-view';
import sixMax from './charts/six-max.json' with { type: 'json' };
import { handClassOf, type HandClass } from './hand-class';
import {
  chartCell,
  parseChart,
  type ChartAction,
  type ChartCell,
  type Position,
  type PreflopChart,
  type ReferenceSize,
  type Situation,
} from './preflop-chart';

/** The shipped 6-max chart, validated at import. */
export const SIX_MAX_CHART: PreflopChart = parseChart(sixMax);

export type PreflopAdvice = 'fold' | 'check' | 'call' | 'raise';

export interface PreflopRecommendation {
  readonly basis: 'chart';
  readonly referenceSize: ReferenceSize;
  readonly position: Position;
  readonly situation: Situation;
  readonly handClass: HandClass;
  /** The cell exactly as authored. */
  readonly cell: ChartCell;
  /** Legal for the view. */
  readonly action: PreflopAdvice;
  /** = cell.borderline. */
  readonly borderline: boolean;
  /** cell.alternative made legal; null if none or if it equals `action`. */
  readonly alternative: PreflopAdvice | null;
  /** The element of view.legalActions whose type is `action`. */
  readonly move: Action;
}

export interface PreflopOptions {
  /** Default SIX_MAX_CHART. */
  readonly chart?: PreflopChart;
}

/** Seats after the button in clockwise order: SB, BB, UTG, HJ, CO, then the button. */
const SIX_MAX_ORDER: readonly Position[] = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

/** The viewer's 6-max position. Throws RangeError unless exactly 6 seats are dealt in. */
export function positionOf(view: PlayerView): Position {
  const seats = view.players.map((p) => p.seat);
  if (seats.length !== 6) {
    throw new RangeError(`The 6-max chart needs 6 dealt-in seats, got ${seats.length}`);
  }
  const start = seats.findIndex((seat) => seat > view.button);
  const order = start <= 0 ? seats : [...seats.slice(start), ...seats.slice(0, start)];
  return SIX_MAX_ORDER[order.indexOf(view.seat)] as Position;
}

/** The preflop action now facing the viewer. Blinds are not actions; limps before a raise are not callers. */
export function situationOf(view: PlayerView): Situation {
  const records = view.actions.filter(
    (a) => a.street === 'preflop' && a.type !== 'small-blind' && a.type !== 'big-blind',
  );
  const raises = records.filter((a) => a.type === 'raise').length;
  if (raises === 0) {
    return records.some((a) => a.type === 'call' && a.seat !== view.seat) ? 'limpers' : 'unopened';
  }
  if (raises > 1) return 're-raise';
  const position = positionOf(view);
  if (position === 'SB' || position === 'BB') return 'blind-defence';
  const raiseAt = records.findIndex((a) => a.type === 'raise');
  return records.slice(raiseAt + 1).some((a) => a.type === 'call') ? 'raise-and-calls' : 'raise';
}

/** The chart's preflop action for the viewer, made legal (capped raise → call, nothing owed → check). */
export function recommendPreflop(
  view: PlayerView,
  options: PreflopOptions = {},
): PreflopRecommendation {
  if (view.street !== 'preflop') {
    throw new RangeError(`Preflop advice needs a preflop view, got ${view.street}`);
  }
  if (view.toAct !== view.seat) throw new RangeError(`Seat ${view.seat} is not to act`);
  const position = positionOf(view);
  const situation = situationOf(view);
  const chart = options.chart ?? SIX_MAX_CHART;
  const handClass = handClassOf(view.holeCards);
  const cell = chartCell(chart, position, situation, handClass);

  const hero = view.players.find((p) => p.seat === view.seat) as PublicPlayer;
  const owed = view.currentBet - hero.streetContribution;
  const canRaise =
    view.betCount < STREET_BET_CAP && view.legalActions.some((a) => a.type === 'raise');
  const legal = (chartAction: ChartAction): PreflopAdvice => {
    const advice = chartAction === 'raise' && !canRaise ? 'call' : chartAction;
    return advice !== 'raise' && owed === 0 ? 'check' : advice;
  };

  const action = legal(cell.action);
  const alternative = cell.alternative === null ? null : legal(cell.alternative);
  const move = view.legalActions.find((a) => a.type === action);
  if (move === undefined) throw new Error(`No legal ${action} for seat ${view.seat}`);
  return {
    basis: 'chart',
    referenceSize: chart.referenceSize,
    position,
    situation,
    handClass,
    cell,
    action,
    borderline: cell.borderline,
    alternative: alternative === action ? null : alternative,
    move,
  };
}
