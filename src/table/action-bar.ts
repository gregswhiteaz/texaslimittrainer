import { fullBetTarget, type Action } from '../engine/hand';
import { playerView, type PlayerView } from '../engine/player-view';
import type { TableState } from './session';

export interface ActionButton {
  readonly label: string;
  /** The engine action this button submits; null on a disabled (idle) bar. */
  readonly action: Action | null;
}
export interface ActionBarModel {
  readonly enabled: boolean;
  readonly buttons: readonly ActionButton[];
}

/** Cash games print `$4`; a sit-and-go prints plain chips `40`. Neither uses a thousands separator. */
export type AmountUnit = 'dollars' | 'chips';
export interface LabelOptions {
  /** The amount is below the full call, bet or raise (REQ-017.3, REQ-017.7). */
  readonly allIn?: boolean;
  readonly unit?: AmountUnit;
}

/** Disabled bar content whenever it is not the user's turn (D-3, approved by Q-1). */
export const IDLE_BUTTONS: readonly ActionButton[] = Object.freeze(
  ['Fold', 'Call', 'Raise'].map((label) => Object.freeze({ label, action: null })),
);

const IDLE_BAR: ActionBarModel = Object.freeze({ enabled: false, buttons: IDLE_BUTTONS });

/** The button text for an engine action; the amount is the engine's, unchanged (D-5). */
export function actionLabel(action: Action, options: LabelOptions = {}): string {
  const allIn = options.allIn === true ? 'all-in ' : '';
  const money = (amount: number): string =>
    options.unit === 'chips' ? String(amount) : `$${amount}`;
  switch (action.type) {
    case 'fold':
      return 'Fold';
    case 'check':
      return 'Check';
    case 'call':
      return `Call ${allIn}${money(action.amount)}`;
    case 'bet':
      return `Bet ${allIn}${money(action.amount)}`;
    case 'raise':
      return `Raise ${allIn}to ${money(action.amount)}`;
  }
}

/** A call for less than the amount owed, or a bet/raise below the engine's full bet target. */
export function isShortAllIn(view: PlayerView, action: Action): boolean {
  switch (action.type) {
    case 'fold':
    case 'check':
      return false;
    case 'call': {
      const own = view.players.find((p) => p.seat === view.seat)?.streetContribution ?? 0;
      return action.amount < view.currentBet - own;
    }
    case 'bet':
    case 'raise':
      return action.amount < fullBetTarget(view);
  }
}

/** Enabled iff it is the viewer's turn and the engine offers at least one action. */
export function actionBar(view: PlayerView | null, unit: AmountUnit = 'dollars'): ActionBarModel {
  if (view === null || view.toAct !== view.seat || view.legalActions.length === 0) return IDLE_BAR;
  return {
    enabled: true,
    buttons: view.legalActions.map((action) => ({
      label: actionLabel(action, { allIn: isShortAllIn(view, action), unit }),
      action,
    })),
  };
}

/** Null before the first deal (A-1); else the bar for the user's view, in dollars. TASK-2.4 passes 'chips'
 *  here once the sit-and-go game type exists. */
export function userActionBar(table: TableState): ActionBarModel | null {
  return table.hand === null ? null : actionBar(playerView(table.hand, table.config.userSeat));
}
