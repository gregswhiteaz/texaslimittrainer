import { STREET_BET_CAP, type Action } from '../engine/hand';
import type { PlayerView, PublicPlayer } from '../engine/player-view';
import fullRing from './charts/full-ring.json' with { type: 'json' };
import headsUp from './charts/heads-up.json' with { type: 'json' };
import sixMax from './charts/six-max.json' with { type: 'json' };
import { explainPreflop } from './explain';
import { handClassOf, type HandClass } from './hand-class';
import {
  APPLICABLE_SPOTS,
  chartCell,
  parseChart,
  SEATS_BEFORE_BUTTON,
  type ChartAction,
  type ChartCell,
  type Position,
  type PreflopChart,
  type ReferenceSize,
  type Situation,
} from './preflop-chart';

/** The shipped charts, validated at import. */
export const HEADS_UP_CHART: PreflopChart = parseChart(headsUp);
export const SIX_MAX_CHART: PreflopChart = parseChart(sixMax);
export const FULL_RING_CHART: PreflopChart = parseChart(fullRing);

export const PREFLOP_CHARTS: Readonly<Record<ReferenceSize, PreflopChart>> = {
  'heads-up': HEADS_UP_CHART,
  '6-max': SIX_MAX_CHART,
  'full-ring': FULL_RING_CHART,
};

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
  /** Plain-English reason, ≤ 3 sentences (REQ-037). */
  readonly explanation: string;
}

export interface PreflopOptions {
  /** Default PREFLOP_CHARTS[referenceSizeOf(dealt-in seats)]; its referenceSize must match. */
  readonly chart?: PreflopChart;
}

/** 2 → 'heads-up'; 3–7 → '6-max'; 8–10 → 'full-ring'. Throws RangeError otherwise. */
export function referenceSizeOf(dealtIn: number): ReferenceSize {
  if (dealtIn === 2) return 'heads-up';
  if (dealtIn >= 3 && dealtIn <= 7) return '6-max';
  if (dealtIn >= 8 && dealtIn <= 10) return 'full-ring';
  throw new RangeError(`No reference size for ${dealtIn} dealt-in seats`);
}

/**
 * The viewer's position on `size`'s chart, counting dealt-in seats. Heads-up: the button is BTN, the other seat BB.
 * Otherwise the first two seats after the button are SB and BB, and a seat k seats before the button takes
 * SEATS_BEFORE_BUTTON[size][k], or the chart's earliest position when k is beyond it.
 */
export function positionOf(
  view: PlayerView,
  size: ReferenceSize = referenceSizeOf(view.players.length),
): Position {
  const seats = view.players.map((p) => p.seat);
  const start = seats.findIndex((seat) => seat > view.button);
  const order = start <= 0 ? seats : [...seats.slice(start), ...seats.slice(0, start)];
  const i = order.indexOf(view.seat);
  const n = order.length;
  if (n === 2) return i === 0 ? 'BB' : 'BTN';
  if (i === 0) return 'SB';
  if (i === 1) return 'BB';
  const named = SEATS_BEFORE_BUTTON[size];
  return named[Math.min(n - 1 - i, named.length - 1)] as Position;
}

/** The chart spot the viewer's decision reads. A position with no limpers spot (the earliest one) reads the
 *  limpers spot of the position one seat later. */
export function chartSpotOf(
  view: PlayerView,
  size: ReferenceSize = referenceSizeOf(view.players.length),
): { position: Position; situation: Situation } {
  const position = positionOf(view, size);
  const situation = situationOf(view);
  const hasSpot = APPLICABLE_SPOTS[size].some(
    (s) => s.position === position && s.situation === situation,
  );
  if (hasSpot || situation !== 'limpers') return { position, situation };
  const named = SEATS_BEFORE_BUTTON[size];
  return { position: named[named.length - 2] as Position, situation };
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
  const size = referenceSizeOf(view.players.length);
  const chart = options.chart ?? PREFLOP_CHARTS[size];
  if (chart.referenceSize !== size) {
    throw new RangeError(
      `The ${chart.referenceSize} chart does not fit ${view.players.length} dealt-in seats`,
    );
  }
  const { position, situation } = chartSpotOf(view, size);
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
  const rec = {
    basis: 'chart' as const,
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
  return { ...rec, explanation: explainPreflop(rec) };
}
