import type { Action } from '../engine/hand';
import { playerView, type PlayerView } from '../engine/player-view';
import { USER_SEAT, type TableState } from './session';

export interface ActionButton {
  readonly label: string;
  /** The engine action this button submits; null on a disabled (idle) bar. */
  readonly action: Action | null;
}
export interface ActionBarModel {
  readonly enabled: boolean;
  readonly buttons: readonly ActionButton[];
}

/** Disabled bar content whenever it is not the user's turn (D-3, approved by Q-1). */
export const IDLE_BUTTONS: readonly ActionButton[] = Object.freeze(
  ['Fold', 'Call', 'Raise'].map((label) => Object.freeze({ label, action: null })),
);

const IDLE_BAR: ActionBarModel = Object.freeze({ enabled: false, buttons: IDLE_BUTTONS });

/** The button text for an engine action; the amount is the engine's, unchanged (D-5). */
export function actionLabel(action: Action): string {
  switch (action.type) {
    case 'fold':
      return 'Fold';
    case 'check':
      return 'Check';
    case 'call':
      return `Call $${action.amount}`;
    case 'bet':
      return `Bet $${action.amount}`;
    case 'raise':
      return `Raise to $${action.amount}`;
  }
}

/** Enabled iff it is the viewer's turn and the engine offers at least one action. */
export function actionBar(view: PlayerView | null): ActionBarModel {
  if (view === null || view.toAct !== view.seat || view.legalActions.length === 0) return IDLE_BAR;
  return {
    enabled: true,
    buttons: view.legalActions.map((action) => ({ label: actionLabel(action), action })),
  };
}

/** Null before the first deal (A-1); else the bar for the user's view. */
export function userActionBar(table: TableState): ActionBarModel | null {
  return table.hand === null ? null : actionBar(playerView(table.hand, USER_SEAT));
}
