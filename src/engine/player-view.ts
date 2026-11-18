import type { Card } from './cards';
import {
  applyAction,
  legalActions,
  type Action,
  type ActionRecord,
  type ApplyResult,
  type HandState,
  type Pot,
  type SeatNumber,
  type Stakes,
  type Street,
} from './hand';

/** Hole cards a seat turned face up at a showdown. */
export interface ShownHand {
  readonly seat: SeatNumber;
  readonly holeCards: readonly [Card, Card];
}
/** One earlier hand that reached showdown: only the hands that were shown. */
export interface EarlierShowdown {
  readonly shown: readonly ShownHand[];
}
/** What everyone at the table sees about a player. No hole cards. */
export interface PublicPlayer {
  readonly seat: SeatNumber;
  readonly startingStack: number;
  readonly stack: number;
  readonly folded: boolean;
  readonly allIn: boolean;
  readonly streetContribution: number;
  readonly totalContribution: number;
  readonly hasActed: boolean;
}
/** Everything `seat` can see. Plain data: safe to store in hand records and golden-spot files. */
export interface PlayerView {
  /** The viewer. */
  readonly seat: SeatNumber;
  /** The viewer's own cards. */
  readonly holeCards: readonly [Card, Card];
  readonly stakes: Stakes;
  readonly button: SeatNumber;
  readonly street: Street;
  readonly board: readonly Card[];
  /** Every dealt-in seat, ascending. */
  readonly players: readonly PublicPlayer[];
  readonly pots: readonly Pot[];
  readonly currentBet: number;
  readonly betCount: number;
  readonly toAct: SeatNumber | null;
  /** Blinds first, every action so far. */
  readonly actions: readonly ActionRecord[];
  /** Exact amounts when seat === toAct, else []. */
  readonly legalActions: readonly Action[];
  /** Oldest first, as supplied (not copied). */
  readonly earlierShowdowns: readonly EarlierShowdown[];
}
/** Any deciding code: bots, playtest seat policies. Accepts only a PlayerView. */
export type SeatPolicy = (view: PlayerView) => Action;

/** The view of `seat`. Throws RangeError if `seat` is not dealt in. Never mutates `state`. */
export function playerView(
  state: HandState,
  seat: SeatNumber,
  earlierShowdowns: readonly EarlierShowdown[] = [],
): PlayerView {
  const self = state.players.find((p) => p.seat === seat);
  if (self === undefined) throw new RangeError(`Seat ${seat} is not dealt in`);
  // Every field is copied by name so hidden state fields can never reach the view.
  return {
    seat,
    holeCards: [self.holeCards[0], self.holeCards[1]],
    stakes: {
      smallBlind: state.stakes.smallBlind,
      bigBlind: state.stakes.bigBlind,
      smallBet: state.stakes.smallBet,
      bigBet: state.stakes.bigBet,
    },
    button: state.button,
    street: state.street,
    board: [...state.board],
    players: state.players.map((p) => ({
      seat: p.seat,
      startingStack: p.startingStack,
      stack: p.stack,
      folded: p.folded,
      allIn: p.allIn,
      streetContribution: p.streetContribution,
      totalContribution: p.totalContribution,
      hasActed: p.hasActed,
    })),
    pots: state.pots.map((pot) => ({ amount: pot.amount, eligible: [...pot.eligible] })),
    currentBet: state.currentBet,
    betCount: state.betCount,
    toAct: state.toAct,
    actions: state.actions.map((a) => ({
      street: a.street,
      seat: a.seat,
      type: a.type,
      amount: a.amount,
      added: a.added,
    })),
    legalActions: seat === state.toAct ? legalActions(state).map((a) => ({ ...a })) : [],
    earlierShowdowns,
  };
}

/** Asks state.toAct to act: builds its view, calls `policy` once, applies the returned action. */
export function actWith(
  state: HandState,
  policy: SeatPolicy,
  earlierShowdowns: readonly EarlierShowdown[] = [],
): ApplyResult {
  if (state.toAct === null) {
    return { ok: false, error: { code: 'hand-complete', message: 'The hand is complete' } };
  }
  return applyAction(state, policy(playerView(state, state.toAct, earlierShowdowns)));
}

/** The shown hands of a hand that ended at showdown; null for a fold-out or an unfinished hand. */
export function showdownOf(state: HandState): EarlierShowdown | null {
  if (state.result?.endedBy !== 'showdown') return null;
  return {
    shown: state.result.showdown.map((s) => ({
      seat: s.seat,
      holeCards: [s.holeCards[0], s.holeCards[1]],
    })),
  };
}
