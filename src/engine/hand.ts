import type { Card } from './cards';
import { evaluate, type HandRank } from './hand-evaluator';

/** Seat number 1..10. Clockwise = increasing seat number, wrapping. */
export type SeatNumber = number;
/** All money is whole dollars or chips. */
export interface Stakes {
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly smallBet: number;
  readonly bigBet: number;
}
export interface SeatConfig {
  readonly seat: SeatNumber;
  readonly stack: number;
}
export interface HandConfig {
  readonly stakes: Stakes;
  /** 3..10 dealt-in seats, any order. */
  readonly seats: readonly SeatConfig[];
  /** One of seats. */
  readonly button: SeatNumber;
  /** 52 distinct cards, index 0 dealt first. */
  readonly deck: readonly Card[];
}
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export interface PlayerState {
  readonly seat: SeatNumber;
  readonly startingStack: number;
  /** Chips behind. */
  readonly stack: number;
  readonly holeCards: readonly [Card, Card];
  readonly folded: boolean;
  /** Always false until TASK-1.9. */
  readonly allIn: boolean;
  /** Put in on the current street (not yet in pots). */
  readonly streetContribution: number;
  /** Put in this hand. */
  readonly totalContribution: number;
  /** Acted since the last bet/raise on this street (blinds do not count). */
  readonly hasActed: boolean;
}
/** `eligible` is in ascending seat order. */
export interface Pot {
  readonly amount: number;
  readonly eligible: readonly SeatNumber[];
}
/** amount = the number on the action bar: call = chips added; bet = bet size; raise = "raise to" street total. */
export type Action =
  | { readonly seat: SeatNumber; readonly type: 'fold' | 'check' }
  | { readonly seat: SeatNumber; readonly type: 'call' | 'bet' | 'raise'; readonly amount: number };
export interface ActionRecord {
  readonly street: Exclude<Street, 'showdown'>;
  readonly seat: SeatNumber;
  readonly type: 'small-blind' | 'big-blind' | 'fold' | 'check' | 'call' | 'bet' | 'raise';
  /** As in Action; blind = blind size; fold/check = 0. */
  readonly amount: number;
  /** Chips moved from stack by this record. */
  readonly added: number;
}
export interface PotAward {
  readonly pot: number;
  readonly amount: number;
  readonly winners: readonly { readonly seat: SeatNumber; readonly amount: number }[];
}
export interface HandResult {
  readonly endedBy: 'fold' | 'showdown';
  readonly showdown: readonly {
    readonly seat: SeatNumber;
    readonly holeCards: readonly [Card, Card];
    readonly rank: HandRank;
  }[];
  /** One entry per pot (exactly one in this task). */
  readonly awards: readonly PotAward[];
}
export interface HandState {
  readonly stakes: Stakes;
  readonly button: SeatNumber;
  /** Ascending seat order. */
  readonly players: readonly PlayerState[];
  /** The full deal order (hidden from players by TASK-1.5). */
  readonly deck: readonly Card[];
  readonly board: readonly Card[];
  /** Burn cards in burn order (0..3); never revealed. */
  readonly burned: readonly Card[];
  /** 'showdown' once river betting closes; stays put on a fold-out. */
  readonly street: Street;
  /** Chips from completed streets; exactly one pot until TASK-1.10. */
  readonly pots: readonly Pot[];
  /** Highest streetContribution. */
  readonly currentBet: number;
  /** Bets + raises this street; the big blind counts as 1 preflop. */
  readonly betCount: number;
  /** Null once the hand is complete. */
  readonly toAct: SeatNumber | null;
  /** Blinds first, then every applied action in order. */
  readonly actions: readonly ActionRecord[];
  /** Non-null iff the hand is complete. */
  readonly result: HandResult | null;
}
export type ApplyErrorCode = 'hand-complete' | 'out-of-turn' | 'illegal-action';
export type ApplyResult =
  | { readonly ok: true; readonly state: HandState }
  | {
      readonly ok: false;
      readonly error: { readonly code: ApplyErrorCode; readonly message: string };
    };

/** Seats (ascending) clockwise, starting with the first seat after `from`. */
function clockwiseAfter(seats: readonly SeatNumber[], from: SeatNumber): SeatNumber[] {
  const start = seats.findIndex((seat) => seat > from);
  if (start <= 0) return [...seats];
  return [...seats.slice(start), ...seats.slice(0, start)];
}

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/** Least stack createHand accepts: the most one seat can put in under the 4-bet cap. $96 at $4/$8. */
export function minimumStack(stakes: Stakes): number {
  return 8 * stakes.smallBet + 8 * stakes.bigBet;
}

function validate(config: HandConfig): void {
  const { seats, stakes, deck, button } = config;
  if (seats.length < 3 || seats.length > 10) {
    throw new RangeError(`Hand needs 3 to 10 seats, got ${seats.length}`);
  }
  const seen = new Set<SeatNumber>();
  for (const { seat } of seats) {
    if (!Number.isInteger(seat) || seat < 1 || seat > 10) {
      throw new RangeError(`Invalid seat: ${seat}`);
    }
    if (seen.has(seat)) throw new RangeError(`Duplicate seat: ${seat}`);
    seen.add(seat);
  }
  if (!seen.has(button)) throw new RangeError(`Button must be a dealt-in seat: ${button}`);
  const amounts = [stakes.smallBlind, stakes.bigBlind, stakes.smallBet, stakes.bigBet];
  if (
    !amounts.every(isPositiveSafeInteger) ||
    stakes.smallBlind > stakes.bigBlind ||
    stakes.bigBlind > stakes.smallBet ||
    stakes.smallBet >= stakes.bigBet ||
    // Every pot and contribution total is at most 10 seats x minimumStack, so keep that a safe integer.
    10 * minimumStack(stakes) > Number.MAX_SAFE_INTEGER
  ) {
    throw new RangeError('Invalid stakes');
  }
  const cards = new Set(deck);
  if (
    deck.length !== 52 ||
    cards.size !== 52 ||
    !deck.every((card) => Number.isInteger(card) && card >= 0 && card <= 51)
  ) {
    throw new RangeError('Deck must hold each of the 52 cards exactly once');
  }
  const min = minimumStack(stakes);
  for (const { seat, stack } of seats) {
    if (!Number.isSafeInteger(stack) || stack < min) {
      throw new RangeError(`Stack at seat ${seat} must be an integer of at least ${min}`);
    }
  }
}

/**
 * Posts blinds and deals hole cards. Copies config first, so later changes to the caller's objects do
 * not affect the hand. Throws RangeError on invalid config.
 */
export function createHand(config: HandConfig): HandState {
  const { smallBlind, bigBlind, smallBet, bigBet } = config.stakes;
  const snapshot: HandConfig = {
    stakes: { smallBlind, bigBlind, smallBet, bigBet },
    seats: config.seats.map(({ seat, stack }) => ({ seat, stack })),
    button: config.button,
    deck: [...config.deck],
  };
  validate(snapshot);
  const { stakes, button, deck } = snapshot;
  const sorted = [...snapshot.seats].sort((a, b) => a.seat - b.seat);
  const seats = sorted.map((s) => s.seat);
  const n = seats.length;
  const dealOrder = clockwiseAfter(seats, button);
  const sb = dealOrder[0] as SeatNumber;
  const bb = dealOrder[1] as SeatNumber;
  const players = sorted.map(({ seat, stack }): PlayerState => {
    const position = dealOrder.indexOf(seat);
    const blind = seat === sb ? stakes.smallBlind : seat === bb ? stakes.bigBlind : 0;
    return {
      seat,
      startingStack: stack,
      stack: stack - blind,
      holeCards: [deck[position] as Card, deck[position + n] as Card],
      folded: false,
      allIn: false,
      streetContribution: blind,
      totalContribution: blind,
      hasActed: false,
    };
  });
  return {
    stakes,
    button,
    players,
    deck,
    board: [],
    burned: [],
    street: 'preflop',
    pots: [{ amount: 0, eligible: seats }],
    currentBet: stakes.bigBlind,
    betCount: 1,
    toAct: clockwiseAfter(seats, bb)[0] as SeatNumber,
    actions: [
      {
        street: 'preflop',
        seat: sb,
        type: 'small-blind',
        amount: stakes.smallBlind,
        added: stakes.smallBlind,
      },
      {
        street: 'preflop',
        seat: bb,
        type: 'big-blind',
        amount: stakes.bigBlind,
        added: stakes.bigBlind,
      },
    ],
    result: null,
  };
}

/** Exact legal actions for state.toAct, in the order fold, check, call, bet, raise. [] when complete. */
export function legalActions(state: HandState): readonly Action[] {
  const seat = state.toAct;
  const player = state.players.find((p) => p.seat === seat);
  if (seat === null || player === undefined) return [];
  const unit =
    state.street === 'preflop' || state.street === 'flop'
      ? state.stakes.smallBet
      : state.stakes.bigBet;
  const owe = state.currentBet - player.streetContribution;
  const raiseTo = state.currentBet + unit;
  const canRaise = raiseTo - player.streetContribution <= player.stack;
  const actions: Action[] = [];
  if (owe > 0) {
    actions.push({ seat, type: 'fold' });
    if (owe <= player.stack) actions.push({ seat, type: 'call', amount: owe });
    if (canRaise) actions.push({ seat, type: 'raise', amount: raiseTo });
  } else if (state.currentBet > 0) {
    actions.push({ seat, type: 'check' });
    if (canRaise) actions.push({ seat, type: 'raise', amount: raiseTo });
  } else {
    actions.push({ seat, type: 'check' });
    if (unit <= player.stack) actions.push({ seat, type: 'bet', amount: unit });
  }
  return actions;
}

function amountOf(action: Action): number | undefined {
  return 'amount' in action ? action.amount : undefined;
}

function reject(code: ApplyErrorCode, message: string): ApplyResult {
  return { ok: false, error: { code, message } };
}

/** Moves every street contribution into the main pot. */
function gather(state: HandState, players: readonly PlayerState[]) {
  const collected = players.reduce((sum, p) => sum + p.streetContribution, 0);
  const pot = state.pots[0] as Pot;
  return {
    amount: pot.amount + collected,
    eligible: pot.eligible,
    players: players.map((p) =>
      p.streetContribution === 0 && !p.hasActed
        ? p
        : { ...p, streetContribution: 0, hasActed: false },
    ),
  };
}

/** Splits `amount` among `winners`; odd units one each clockwise from the left of `button`. */
export function splitPot(
  amount: number,
  winners: readonly SeatNumber[],
  button: SeatNumber,
  seats: readonly SeatNumber[],
): { seat: SeatNumber; amount: number }[] {
  const ordered = clockwiseAfter(
    [...seats].sort((a, b) => a - b),
    button,
  ).filter((seat) => winners.includes(seat));
  const base = Math.floor(amount / winners.length);
  const odd = amount % winners.length;
  return ordered.map((seat, i) => ({ seat, amount: base + (i < odd ? 1 : 0) }));
}

function payOut(
  players: readonly PlayerState[],
  winners: readonly { seat: SeatNumber; amount: number }[],
): PlayerState[] {
  return players.map((p) => {
    const share = winners.find((w) => w.seat === p.seat);
    return share === undefined ? p : { ...p, stack: p.stack + share.amount };
  });
}

function foldOut(state: HandState, players: readonly PlayerState[], winner: SeatNumber): HandState {
  const gathered = gather(state, players);
  const winners = [{ seat: winner, amount: gathered.amount }];
  return {
    ...state,
    players: payOut(gathered.players, winners),
    pots: [{ amount: 0, eligible: gathered.eligible }],
    currentBet: 0,
    betCount: 0,
    toAct: null,
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 0, amount: gathered.amount, winners }],
    },
  };
}

function endRound(state: HandState, players: readonly PlayerState[]): HandState {
  const gathered = gather(state, players);
  const seats = state.players.map((p) => p.seat);
  const active = clockwiseAfter(seats, state.button).filter(
    (seat) => !(gathered.players.find((p) => p.seat === seat) as PlayerState).folded,
  );
  const base = { ...state, currentBet: 0, betCount: 0 };
  if (state.street === 'river') {
    const showdown = active.map((seat) => {
      const p = gathered.players.find((q) => q.seat === seat) as PlayerState;
      return { seat, holeCards: p.holeCards, rank: evaluate([...p.holeCards, ...state.board]) };
    });
    const best = Math.max(...showdown.map((s) => s.rank));
    const winnerSeats = showdown.filter((s) => s.rank === best).map((s) => s.seat);
    const winners = splitPot(gathered.amount, winnerSeats, state.button, seats);
    return {
      ...base,
      street: 'showdown',
      players: payOut(gathered.players, winners),
      pots: [{ amount: 0, eligible: gathered.eligible }],
      toAct: null,
      result: {
        endedBy: 'showdown',
        showdown,
        awards: [{ pot: 0, amount: gathered.amount, winners }],
      },
    };
  }
  // D-5: after the 2n hole cards, burn then flop (3), burn then turn, burn then river.
  const holeEnd = 2 * seats.length;
  const next = state.street === 'preflop' ? 'flop' : state.street === 'flop' ? 'turn' : 'river';
  const burnAt = next === 'flop' ? holeEnd : next === 'turn' ? holeEnd + 4 : holeEnd + 6;
  const count = next === 'flop' ? 3 : 1;
  return {
    ...base,
    street: next,
    players: gathered.players,
    pots: [{ amount: gathered.amount, eligible: gathered.eligible }],
    burned: [...state.burned, state.deck[burnAt] as Card],
    board: [...state.board, ...state.deck.slice(burnAt + 1, burnAt + 1 + count)],
    toAct: active[0] as SeatNumber,
  };
}

/** Applies a legal action; never mutates `state`. */
export function applyAction(state: HandState, action: Action): ApplyResult {
  if (state.result !== null) return reject('hand-complete', 'The hand is complete');
  if (action.seat !== state.toAct) {
    return reject('out-of-turn', `Seat ${action.seat} acted but seat ${state.toAct} is to act`);
  }
  const legal = legalActions(state).some(
    (a) => a.type === action.type && amountOf(a) === amountOf(action),
  );
  if (!legal) return reject('illegal-action', `Illegal action for seat ${action.seat}`);

  const actor = state.players.find((p) => p.seat === action.seat) as PlayerState;
  const amount = amountOf(action) ?? 0;
  const added =
    action.type === 'raise'
      ? amount - actor.streetContribution
      : action.type === 'fold'
        ? 0
        : amount;
  const isAggressive = action.type === 'bet' || action.type === 'raise';
  const players = state.players.map((p): PlayerState => {
    if (p.seat === actor.seat) {
      return {
        ...p,
        stack: p.stack - added,
        streetContribution: p.streetContribution + added,
        totalContribution: p.totalContribution + added,
        folded: action.type === 'fold',
        hasActed: true,
      };
    }
    return isAggressive && !p.folded && p.hasActed ? { ...p, hasActed: false } : p;
  });
  const street = state.street as Exclude<Street, 'showdown'>;
  const next: HandState = {
    ...state,
    players,
    pots:
      action.type === 'fold'
        ? state.pots.map((pot) => ({
            ...pot,
            eligible: pot.eligible.filter((seat) => seat !== actor.seat),
          }))
        : state.pots,
    currentBet: isAggressive ? amount : state.currentBet,
    betCount: isAggressive ? state.betCount + 1 : state.betCount,
    actions: [...state.actions, { street, seat: actor.seat, type: action.type, amount, added }],
  };

  const active = players.filter((p) => !p.folded);
  if (active.length === 1) {
    return { ok: true, state: foldOut(next, players, (active[0] as PlayerState).seat) };
  }
  if (active.every((p) => p.hasActed && p.streetContribution === next.currentBet)) {
    return { ok: true, state: endRound(next, players) };
  }
  const toAct = clockwiseAfter(
    active.map((p) => p.seat),
    actor.seat,
  )[0] as SeatNumber;
  return { ok: true, state: { ...next, toAct } };
}
