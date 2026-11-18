// Test-only engines that each break exactly one invariant (TASK-1.8 §5 rule 8). Never imported from src/.
import {
  applyAction,
  createHand,
  type Action,
  type ApplyResult,
  type HandState,
  type PlayerState,
} from '../../src/engine/hand';
import type { InvariantId } from '../../src/engine/invariants';
import type { SeatPolicy } from '../../src/engine/player-view';
import type { PlaytestSeams, PolicyFactory } from '../../src/playtest/runner';

export interface Fault {
  readonly invariant: InvariantId;
  readonly seams: PlaytestSeams;
}

/** Always checks, even when it owes chips. */
export const alwaysCheck: PolicyFactory = () => (view) => ({ seat: view.seat, type: 'check' });

/** Always raises when offered, ignoring the cap; otherwise bets, calls or checks. */
export const raiseWheneverOffered: PolicyFactory = () => (view) => {
  const legal = view.legalActions;
  return (legal.find((a) => a.type === 'raise') ??
    legal.find((a) => a.type === 'bet') ??
    legal.find((a) => a.type === 'call') ??
    legal[0]) as ReturnType<SeatPolicy>;
};

const withPlayers = (state: HandState, change: (p: PlayerState) => PlayerState): HandState => ({
  ...state,
  players: state.players.map(change),
});

/** chips (C2): every accepted action also gives the actor $1. */
function chipsCreated(state: HandState, action: Action): ApplyResult {
  const result = applyAction(state, action);
  if (!result.ok) return result;
  return {
    ok: true,
    state: withPlayers(result.state, (p) =>
      p.seat === action.seat ? { ...p, stack: p.stack + 1 } : p,
    ),
  };
}

/** legal-action (L3): a rejected action is recorded as if it were a free check-like action. */
function illegalAccepted(state: HandState, action: Action): ApplyResult {
  const result = applyAction(state, action);
  if (result.ok || state.toAct === null) return result;
  const street = state.street as Exclude<HandState['street'], 'showdown'>;
  const unfolded = state.players.filter((p) => !p.folded && p.seat !== action.seat);
  const next = unfolded.find((p) => p.seat > action.seat) ?? unfolded[0];
  return {
    ok: true,
    state: {
      ...withPlayers(state, (p) => (p.seat === action.seat ? { ...p, hasActed: true } : p)),
      toAct: next?.seat ?? null,
      actions: [
        ...state.actions,
        { street, seat: action.seat, type: action.type, amount: 0, added: 0 },
      ],
    },
  };
}

/** bet-cap (B1): a fifth bet goes through even once the engine enforces the cap (TASK-1.12). */
function fifthBet(state: HandState, action: Action): ApplyResult {
  const result = applyAction(state, action);
  if (result.ok || action.type !== 'raise' || state.betCount < 4) return result;
  const forced = applyAction({ ...state, betCount: 3 }, action);
  if (!forced.ok) return forced;
  return { ok: true, state: { ...forced.state, betCount: state.betCount + 1 } };
}

/** pot-eligibility (P5): a completed hand pays award 0's first winner share to the lowest folded seat. */
function ineligibleWinner(state: HandState, action: Action): ApplyResult {
  const result = applyAction(state, action);
  if (!result.ok || result.state.result === null) return result;
  const done = result.state;
  const folded = done.players.find((p) => p.folded);
  const award = done.result?.awards[0];
  const winner = award?.winners[0];
  if (folded === undefined || award === undefined || winner === undefined || done.result === null) {
    return result;
  }
  const moved = { seat: folded.seat, amount: winner.amount };
  const awards = [
    { ...award, winners: [moved, ...award.winners.slice(1)] },
    ...done.result.awards.slice(1),
  ];
  return {
    ok: true,
    state: {
      ...withPlayers(done, (p) =>
        p.seat === folded.seat
          ? { ...p, stack: p.stack + winner.amount }
          : p.seat === winner.seat
            ? { ...p, stack: p.stack - winner.amount }
            : p,
      ),
      result: { ...done.result, awards },
    },
  };
}

/** cards (K3): seat 2's first hole card is a copy of seat 1's. */
const duplicateCard: typeof createHand = (config) => {
  const state = createHand(config);
  const first = state.players[0]?.holeCards[0] as number;
  return withPlayers(state, (p) =>
    p.seat === 2 ? { ...p, holeCards: [first, p.holeCards[1]] } : p,
  );
};

export const FAULTS = {
  chipsCreated: {
    invariant: 'chips',
    seams: { engine: { createHand, applyAction: chipsCreated } },
  },
  illegalAccepted: {
    invariant: 'legal-action',
    seams: { engine: { createHand, applyAction: illegalAccepted }, makePolicy: alwaysCheck },
  },
  fifthBet: {
    invariant: 'bet-cap',
    seams: { engine: { createHand, applyAction: fifthBet }, makePolicy: raiseWheneverOffered },
  },
  ineligibleWinner: {
    invariant: 'pot-eligibility',
    seams: { engine: { createHand, applyAction: ineligibleWinner } },
  },
  duplicateCard: {
    invariant: 'cards',
    seams: { engine: { createHand: duplicateCard, applyAction } },
  },
} as const satisfies Record<string, Fault>;
