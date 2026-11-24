import { basisText, chartBasisText, formatPct } from '../advice/explain';
import type { ObservedOpponent } from '../advice/ranges';
import type { Recommendation } from '../advice/recommend';
import type { HandState, SeatNumber } from '../engine/hand';
import { playerView, type PlayerView } from '../engine/player-view';
import { actionLabel, isShortAllIn } from './action-bar';
import { nextStep, userObservedSnapshot, type ObservedCounts, type TableState } from './session';
import { tableView } from './table-view';

// The hint on the user's turn (TASK-8.1): the request input, the open/hide state machine and the card model.

/** The user's view and observed-stats snapshot at their decision; null unless it is the user's turn. */
export function hintInput(
  table: TableState,
  counts: ObservedCounts,
): { view: PlayerView; observed: ObservedOpponent[] } | null {
  if (nextStep(table) !== 'user' || table.hand === null) return null;
  return {
    view: playerView(table.hand, table.config.userSeat),
    observed: userObservedSnapshot(table, counts),
  };
}

export interface HintAdvisor {
  recommend(view: PlayerView, observed?: readonly ObservedOpponent[]): Promise<Recommendation>;
}

/** Asks `advisor` for the user's recommendation; rejects with RangeError("Not the user's turn") otherwise. */
export function requestHint(
  advisor: HintAdvisor,
  table: TableState,
  counts: ObservedCounts,
): Promise<Recommendation> {
  const input = hintInput(table, counts);
  if (input === null) return Promise.reject(new RangeError("Not the user's turn"));
  return advisor.recommend(input.view, input.observed);
}

export interface HintCardView {
  readonly action: string;
  /** Preflop only: the chart the advice comes from. */
  readonly chartBasis: string | null;
  /** Postflop only, one decimal with %. */
  readonly equity: string | null;
  readonly requiredEquity: string | null;
  readonly explanation: string;
  readonly opponents: readonly {
    readonly seat: number;
    readonly name: string;
    readonly basis: string;
  }[];
}

/**
 * A hint belongs to one decision, whose token is the HandState at the user's turn (D-3): every action replaces
 * it, so a hint for an older decision is never shown and its late reply is dropped.
 */
export interface HintState {
  readonly open: boolean;
  readonly decision: HandState | null;
  readonly card: HintCardView | null;
  readonly failed: boolean;
}

export const NO_HINT: HintState = { open: false, decision: null, card: null, failed: false };

/** Hint / Hide hint: closes an open hint, reopens a computed one without a request (A-4), else opens a new
 *  request for `decision`. */
export function toggleHint(
  state: HintState,
  decision: HandState,
): { state: HintState; request: boolean } {
  if (state.decision === decision && state.open) {
    return { state: { ...state, open: false }, request: false };
  }
  if (state.decision === decision && state.card !== null) {
    return { state: { ...state, open: true }, request: false };
  }
  return { state: { open: true, decision, card: null, failed: false }, request: true };
}

/** The reply for `decision`; ignored if the hint now belongs to another decision. */
export function hintArrived(state: HintState, decision: HandState, card: HintCardView): HintState {
  return state.decision === decision ? { ...state, card } : state;
}

/** The request for `decision` failed; ignored if the hint now belongs to another decision. */
export function hintFailed(state: HintState, decision: HandState): HintState {
  return state.decision === decision ? { ...state, failed: true } : state;
}

/** Whether the hint was opened at `decision` (the current table.hand), whether or not its card arrived (A-1). */
export function hintedAt(state: HintState, decision: HandState | null): boolean {
  return decision !== null && state.decision === decision;
}

/** What the table shows for `decision` (the current table.hand) while the action bar is (not) enabled. */
export function shownHint(
  state: HintState,
  decision: HandState | null,
  barEnabled: boolean,
): 'none' | 'loading' | 'ready' | 'error' {
  if (!state.open || state.decision !== decision || !barEnabled) return 'none';
  if (state.failed) return 'error';
  return state.card === null ? 'loading' : 'ready';
}

/** The opponent lines of a hint or review entry: `basis` in order, or for a chart decision (`null`) every live
 *  non-user seat of `view` with the typical-player basis. */
export function opponentLines(
  view: PlayerView,
  basis: readonly { readonly seat: SeatNumber; readonly text: string }[] | null,
  names: ReadonlyMap<number, string>,
): HintCardView['opponents'] {
  return (
    basis ??
    view.players
      .filter((p) => p.seat !== view.seat && !p.folded)
      .map(({ seat }) => ({ seat, text: basisText(null) }))
  ).map(({ seat, text }) => ({ seat, name: names.get(seat) as string, basis: text }));
}

/** The card for `rec`, the advice for the user's `view` at `table`. */
export function hintCard(rec: Recommendation, view: PlayerView, table: TableState): HintCardView {
  const unit = table.config.gameType === 'sit-and-go' ? 'chips' : 'dollars';
  const names = new Map(tableView(table).seats.map((s) => [s.seat, s.name]));
  const action = actionLabel(rec.move, { allIn: isShortAllIn(view, rec.move), unit });
  const opponents = opponentLines(view, rec.basis === 'chart' ? null : rec.opponentBasis, names);
  return rec.basis === 'chart'
    ? {
        action,
        chartBasis: chartBasisText(rec),
        equity: null,
        requiredEquity: null,
        explanation: rec.explanation,
        opponents,
      }
    : {
        action,
        chartBasis: null,
        equity: formatPct(rec.equityPct),
        requiredEquity: formatPct(rec.requiredEquityPct),
        explanation: rec.explanation,
        opponents,
      };
}
