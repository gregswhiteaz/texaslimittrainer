import { echoValue, type Card } from './cards';
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
  /** 2..10 dealt-in seats, any order. */
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
  /** True once a blind, call, bet or raise left stack at 0; never acts again. */
  readonly allIn: boolean;
  /** Put in on the current street (not yet in pots). */
  readonly streetContribution: number;
  /** Put in this hand. */
  readonly totalContribution: number;
  /** Acted since the last counted bet/raise on this street (blinds do not count); a short all-in under half a
   *  bet does not clear it (REQ-016.5). */
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
  /** Hands shown at showdown, in showdown order (REQ-019.4/.5/.8). Mucked hands are absent. Empty after a
   *  fold-out. */
  readonly showdown: readonly {
    readonly seat: SeatNumber;
    readonly holeCards: readonly [Card, Card];
    readonly rank: HandRank;
  }[];
  /** One entry per pot, ascending pot index (main pot first). Amounts exclude `returned`. */
  readonly awards: readonly PotAward[];
  /** The uncalled part of the top bet, given back to its bettor (REQ-018.4). Present only when amount > 0. */
  readonly returned?: { readonly seat: SeatNumber; readonly amount: number };
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
  /** 'showdown' once the last betting round closes (river, or a D-7 runout); stays put on a fold-out. */
  readonly street: Street;
  /** Chips from completed streets: the main pot then side pots, ascending contribution level (TASK-1.10). */
  readonly pots: readonly Pot[];
  /** The amount to match: the highest street contribution of a seat still in the hand. Preflop it is at
   *  least the big blind. */
  readonly currentBet: number;
  /** Counted bets + raises this street (full, or all-in of at least half a bet); the big blind counts as 1
   *  preflop. */
  readonly betCount: number;
  /** Null once the hand is complete. */
  readonly toAct: SeatNumber | null;
  /** Blinds first, then every applied action in order. */
  readonly actions: readonly ActionRecord[];
  /** Non-null iff the hand is complete. */
  readonly result: HandResult | null;
}
/**
 * Why `applyAction` rejected an action (REQ-017.4):
 * - `hand-complete`: the hand is over.
 * - `out-of-turn`: `action.seat` isn't `state.toAct`.
 * - `illegal-action`: the type and amount don't exactly match an entry of `legalActions(state)`.
 */
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

/** Most bets per street: a bet and three raises; preflop the big blind is the first bet (REQ-016.2–016.4). */
export const STREET_BET_CAP = 4;

/** The most one player can put into a capped hand ($96 at $4/$8). Bounds the A-4 stakes check. createHand's
 *  own floor is $1: a short stack posts an all-in blind. */
export function minimumStack(stakes: Stakes): number {
  return 8 * stakes.smallBet + 8 * stakes.bigBet;
}

function isObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

/** Every index 0..length-1 holds a non-array object: `every` alone skips holes. */
function isDenseObjects(values: readonly unknown[]): boolean {
  for (let i = 0; i < values.length; i++) {
    if (!(i in values) || !isObject(values[i]) || Array.isArray(values[i])) return false;
  }
  return true;
}

function validate(config: HandConfig): void {
  const { seats, stakes, deck, button } = config;
  if (seats.length < 2 || seats.length > 10) {
    throw new RangeError(`Hand needs 2 to 10 seats, got ${seats.length}`);
  }
  const seen = new Set<SeatNumber>();
  for (const { seat } of seats) {
    if (!Number.isInteger(seat) || seat < 1 || seat > 10) {
      throw new RangeError(`Invalid seat: ${echoValue(seat)}`);
    }
    if (seen.has(seat)) throw new RangeError(`Duplicate seat: ${seat}`);
    seen.add(seat);
  }
  if (!seen.has(button))
    throw new RangeError(`Button must be a dealt-in seat: ${echoValue(button)}`);
  const cards = new Set(deck);
  if (
    deck.length !== 52 ||
    cards.size !== 52 ||
    !deck.every((card) => Number.isInteger(card) && card >= 0 && card <= 51)
  ) {
    throw new RangeError('Deck must hold each of the 52 cards exactly once');
  }
  assertChips(stakes, seats);
}

/**
 * The stake and stack rules of createHand (RangeError 'Invalid stakes', or a stack message). Stakes must be
 * positive safe integers in order with 10 x minimumStack safe; every stack a safe integer of at least 1 and
 * the stacks totalling at most Number.MAX_SAFE_INTEGER. Seat numbers are assumed already checked.
 */
export function assertChips(stakes: Stakes, seats: readonly SeatConfig[]): void {
  const amounts = [stakes.smallBlind, stakes.bigBlind, stakes.smallBet, stakes.bigBet];
  if (
    !amounts.every(isPositiveSafeInteger) ||
    stakes.smallBlind > stakes.bigBlind ||
    stakes.bigBlind > stakes.smallBet ||
    stakes.smallBet >= stakes.bigBet ||
    // A-4: keep 10 x minimumStack a safe integer. The stack total below bounds every chip amount.
    10 * minimumStack(stakes) > Number.MAX_SAFE_INTEGER
  ) {
    throw new RangeError('Invalid stakes');
  }
  // Busted seats are left out by the caller; a stack below a blind posts it all-in (REQ-020.4).
  for (const { seat, stack } of seats) {
    if (!isPositiveSafeInteger(stack)) {
      throw new RangeError(`Stack at seat ${seat} must be an integer of at least 1`);
    }
  }
  // Chips are conserved, so every stack, contribution, pot and award is at most this total.
  if (seats.reduce((total, { stack }) => total + stack, 0) > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Stacks must total at most 9007199254740991');
  }
}

/**
 * The first seat clockwise after `previous` whose stack is above 0 (REQ-020.1). `previous` need not have
 * chips. Throws RangeError if fewer than 2 seats have chips.
 */
export function nextButton(stacks: readonly SeatConfig[], previous: SeatNumber): SeatNumber {
  const live = stacks
    .filter((s) => s.stack > 0)
    .map((s) => s.seat)
    .sort((a, b) => a - b);
  if (live.length < 2) throw new RangeError('Need at least 2 seats with chips');
  return clockwiseAfter(live, previous)[0] as SeatNumber;
}

/** True when nobody is left to bet against: no unfolded seat can still bet, or the only one that can already
 *  has the largest street contribution (D-2, D-3). */
function bettingOver(players: readonly PlayerState[]): boolean {
  const active = players.filter((p) => !p.folded);
  const open = active.filter((p) => !p.allIn);
  if (open.length === 0) return true;
  if (open.length > 1) return false;
  const top = (open[0] as PlayerState).streetContribution;
  return active.every((p) => p.streetContribution <= top);
}

/**
 * Posts blinds and deals hole cards. A stack smaller than its blind posts all of it and is all-in; the blind
 * record keeps the full blind as `amount` and the chips posted as `added`, and the bet to call stays the full
 * big blind (D-1). If nobody is left to bet against, the hand is dealt out at once (D-2). Copies config
 * first, so later changes to the caller's objects do not affect the hand. Throws RangeError on invalid config.
 */
export function createHand(config: HandConfig): HandState {
  if (!isObject(config)) throw new RangeError('Invalid hand config');
  const { stakes: rawStakes, seats: rawSeats, button: rawButton, deck: rawDeck } = config;
  if (
    !isObject(rawStakes) ||
    !Array.isArray(rawSeats) ||
    !Array.isArray(rawDeck) ||
    !isDenseObjects(rawSeats)
  ) {
    throw new RangeError('Invalid hand config');
  }
  const { smallBlind, bigBlind, smallBet, bigBet } = rawStakes;
  const snapshot: HandConfig = {
    stakes: { smallBlind, bigBlind, smallBet, bigBet },
    seats: rawSeats.map(({ seat, stack }) => ({ seat, stack })),
    button: rawButton,
    deck: [...rawDeck],
  };
  validate(snapshot);
  const { stakes, button, deck } = snapshot;
  const sorted = [...snapshot.seats].sort((a, b) => a.seat - b.seat);
  const seats = sorted.map((s) => s.seat);
  const n = seats.length;
  const dealOrder = clockwiseAfter(seats, button);
  // Heads-up (D-1): the button posts the small blind and the other seat the big blind.
  const sb = n === 2 ? button : (dealOrder[0] as SeatNumber);
  const bb = (n === 2 ? dealOrder[0] : dealOrder[1]) as SeatNumber;
  const posted = (seat: SeatNumber, blind: number) =>
    Math.min(blind, (sorted.find((s) => s.seat === seat) as SeatConfig).stack);
  const sbPosted = posted(sb, stakes.smallBlind);
  const bbPosted = posted(bb, stakes.bigBlind);
  const players = sorted.map(({ seat, stack }): PlayerState => {
    const position = dealOrder.indexOf(seat);
    const blind = seat === sb ? sbPosted : seat === bb ? bbPosted : 0;
    return {
      seat,
      startingStack: stack,
      stack: stack - blind,
      holeCards: [deck[position] as Card, deck[position + n] as Card],
      folded: false,
      allIn: stack === blind,
      streetContribution: blind,
      totalContribution: blind,
      hasActed: false,
    };
  });
  const open = players.filter((p) => !p.allIn).map((p) => p.seat);
  const dealt: HandState = {
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
    toAct: clockwiseAfter(open, bb)[0] ?? null,
    actions: [
      {
        street: 'preflop',
        seat: sb,
        type: 'small-blind',
        amount: stakes.smallBlind,
        added: sbPosted,
      },
      { street: 'preflop', seat: bb, type: 'big-blind', amount: stakes.bigBlind, added: bbPosted },
    ],
    result: null,
  };
  return bettingOver(players) ? endRound(dealt, players) : dealt;
}

/** The fields the full-bet rule reads; a PlayerView satisfies it. */
export type BetContext = Pick<HandState, 'street' | 'stakes' | 'actions'>;

function betUnit(state: BetContext): number {
  return state.street === 'preflop' || state.street === 'flop'
    ? state.stakes.smallBet
    : state.stakes.bigBet;
}

/**
 * The street's surviving counted bet levels in order, each with the index of the record that set it: the big
 * blind, or a bet/raise adding at least half a unit over the previous level (REQ-016.5; short all-ins under
 * half a bet leave it unchanged). A fold of a seat whose street chips exceed the live top at that point (the
 * highest street chips of a seat not yet folded, preflop at least the big blind) voids every level above that
 * live top (TASK-10.13 R2). A fold through applyAction never does, as it always owes chips.
 */
function liveLevels(state: BetContext): { level: number; at: number }[] {
  const unit = betUnit(state);
  const folded = new Set<SeatNumber>();
  const put = new Map<SeatNumber, number>();
  const levels: { level: number; at: number }[] = [];
  state.actions.forEach((a, i) => {
    if (a.street !== state.street) {
      if (a.type === 'fold') folded.add(a.seat);
      return;
    }
    put.set(a.seat, (put.get(a.seat) ?? 0) + a.added);
    const level = levels.at(-1)?.level ?? 0;
    if (a.type === 'big-blind') levels.push({ level: a.amount, at: i });
    else if ((a.type === 'bet' || a.type === 'raise') && 2 * (a.amount - level) >= unit) {
      levels.push({ level: a.amount, at: i });
    } else if (a.type === 'fold') {
      folded.add(a.seat);
      let live = state.street === 'preflop' ? state.stakes.bigBlind : 0;
      for (const [s, c] of put) if (!folded.has(s) && c > live) live = c;
      if ((put.get(a.seat) ?? 0) > live) {
        while ((levels.at(-1)?.level ?? 0) > live) levels.pop();
      }
    }
  });
  return levels;
}

/** The street's last surviving counted bet level, or 0. */
function fullBetLevel(state: BetContext): number {
  return liveLevels(state).at(-1)?.level ?? 0;
}

/** The street total ("to" amount) of a full bet or raise now: the last counted bet level plus one bet unit
 *  (REQ-016.5, REQ-017.7). A bet or raise below it is a short all-in. */
export function fullBetTarget(state: BetContext): number {
  return fullBetLevel(state) + betUnit(state);
}

/**
 * Exact legal actions for state.toAct, in the order fold, check, call, bet, raise. [] when complete.
 * A bet/raise goes to one unit over the street's full bet level, or all-in for the whole stack when that is
 * less (REQ-017.7). A seat that already acted since the last counted bet/raise may only call or fold
 * (REQ-016.5).
 */
export function legalActions(state: HandState): readonly Action[] {
  const seat = state.toAct;
  const player = state.players.find((p) => p.seat === seat);
  if (seat === null || player === undefined) return [];
  const owe = state.currentBet - player.streetContribution;
  const maxTo = player.streetContribution + player.stack;
  const to = Math.min(fullBetTarget(state), maxTo);
  const canAggress =
    state.betCount < STREET_BET_CAP && !player.hasActed && maxTo > state.currentBet;
  const actions: Action[] = [];
  if (owe > 0) {
    actions.push({ seat, type: 'fold' });
    actions.push({ seat, type: 'call', amount: Math.min(owe, player.stack) });
    if (canAggress) actions.push({ seat, type: 'raise', amount: to });
  } else if (state.currentBet > 0) {
    actions.push({ seat, type: 'check' });
    if (canAggress) actions.push({ seat, type: 'raise', amount: to });
  } else {
    actions.push({ seat, type: 'check' });
    if (canAggress) actions.push({ seat, type: 'bet', amount: to });
  }
  return actions;
}

function amountOf(action: Action): number | undefined {
  return 'amount' in action ? action.amount : undefined;
}

function reject(code: ApplyErrorCode, message: string): ApplyResult {
  return { ok: false, error: { code, message } };
}

/**
 * One pot per distinct contribution level of the non-folded seats, ascending (D-1). Pot k holds every
 * seat's chips between the level below and its own level, and lists the non-folded seats that reached
 * it. The last pot is uncapped, so no chip can drop out.
 */
function buildPots(
  players: readonly PlayerState[],
  returned?: { readonly seat: SeatNumber; readonly amount: number },
): Pot[] {
  const put = players.map(
    (p) => p.totalContribution - (p.seat === returned?.seat ? returned.amount : 0),
  );
  const levels = [...new Set(put.filter((_, i) => !(players[i] as PlayerState).folded))].sort(
    (a, b) => a - b,
  );
  return levels.map((level, k) => {
    const below = k === 0 ? 0 : (levels[k - 1] as number);
    const last = k === levels.length - 1;
    let amount = 0;
    for (const c of put) amount += (last ? c : Math.min(c, level)) - Math.min(c, below);
    const eligible = players
      .filter((p, i) => !p.folded && (put[i] as number) >= level)
      .map((p) => p.seat);
    return { amount, eligible };
  });
}

/**
 * Ends a street: gives back the uncalled part of the top bet (A-5), the top street contribution minus
 * the second-highest, unless that seat has folded (its chips stay in the pot as dead money, TASK-10.13 R4),
 * and rebuilds the pots from every seat's contribution.
 */
function gather(players: readonly PlayerState[]) {
  let top = 0;
  let second = 0;
  let topSeat: SeatNumber | null = null;
  for (const p of players) {
    const c = p.streetContribution;
    if (c > top) {
      second = top;
      top = c;
      topSeat = p.seat;
    } else if (c > second) {
      second = c;
    }
  }
  const back = top - second;
  const topFolded = players.some((p) => p.seat === topSeat && p.folded);
  const returned =
    back > 0 && topSeat !== null && !topFolded ? { seat: topSeat, amount: back } : undefined;
  return {
    pots: buildPots(players, returned),
    returned,
    players: players.map((p) =>
      p.streetContribution === 0 && !p.hasActed
        ? p
        : {
            ...p,
            stack: p.seat === returned?.seat ? p.stack + back : p.stack,
            streetContribution: 0,
            hasActed: false,
          },
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

function payOut(players: readonly PlayerState[], awards: readonly PotAward[]): PlayerState[] {
  return players.map((p) => {
    let won = 0;
    for (const award of awards) {
      for (const w of award.winners) if (w.seat === p.seat) won += w.amount;
    }
    return won === 0 ? p : { ...p, stack: p.stack + won };
  });
}

const emptied = (pots: readonly Pot[]): Pot[] => pots.map((pot) => ({ ...pot, amount: 0 }));

/**
 * Ends the hand for the last unfolded seat. Resets `currentBet` and `betCount` to 0,
 * as `endRound` does at every round end including showdown: `gather` moves every
 * streetContribution into the pot, so 0 is the highest one (the `currentBet` meaning), and a
 * finished hand has no betting round. The street's bets stay in `actions` (review, bet-cap
 * invariant). Pinned by tests/engine/fold-out.acceptance.test.ts.
 */
function foldOut(state: HandState, players: readonly PlayerState[], winner: SeatNumber): HandState {
  const gathered = gather(players);
  const awards = gathered.pots.map((pot, k) => ({
    pot: k,
    amount: pot.amount,
    winners: [{ seat: winner, amount: pot.amount }],
  }));
  return {
    ...state,
    players: payOut(gathered.players, awards),
    pots: emptied(gathered.pots),
    currentBet: 0,
    betCount: 0,
    toAct: null,
    result: {
      endedBy: 'fold',
      showdown: [],
      awards,
      ...(gathered.returned && { returned: gathered.returned }),
    },
  };
}

/** Deals the next street's burn and board cards at their D-5 deck positions. */
function dealNextStreet(state: HandState): HandState {
  // D-5: after the 2n hole cards, burn then flop (3), burn then turn, burn then river.
  const holeEnd = 2 * state.players.length;
  const next = state.street === 'preflop' ? 'flop' : state.street === 'flop' ? 'turn' : 'river';
  const burnAt = next === 'flop' ? holeEnd : next === 'turn' ? holeEnd + 4 : holeEnd + 6;
  const count = next === 'flop' ? 3 : 1;
  return {
    ...state,
    street: next,
    burned: [...state.burned, state.deck[burnAt] as Card],
    board: [...state.board, ...state.deck.slice(burnAt + 1, burnAt + 1 + count)],
  };
}

/**
 * The showdown order (REQ-019.4): `active` (clockwise from left of the button) rotated to start at the seat
 * of the last river bet or raise, counted or not (A-1); unchanged when nobody bet on the river (D-3).
 */
function showdownOrder(state: HandState, active: readonly PlayerState[]): readonly PlayerState[] {
  const last = state.actions.findLast(
    (a) => a.street === 'river' && (a.type === 'bet' || a.type === 'raise'),
  );
  const at = last === undefined ? -1 : active.findIndex((p) => p.seat === last.seat);
  return at <= 0 ? active : [...active.slice(at), ...active.slice(0, at)];
}

/**
 * Pot-by-pot show/muck (REQ-019.5, REQ-019.8): pots are settled from the last side pot down to the main pot.
 * In each contested pot, every undecided eligible seat (in `ranked` order) shows if no eligible hand is face
 * up yet or it ties or beats the best one, and mucks otherwise. A mucked hand stays mucked (A-5); a pot with
 * one eligible seat needs no show (A-3). Returns the shown hands in `ranked` order (A-4).
 */
function revealShown<T extends { readonly seat: SeatNumber; readonly rank: HandRank }>(
  ranked: readonly T[],
  pots: readonly Pot[],
): T[] {
  const shown = new Set<SeatNumber>();
  const mucked = new Set<SeatNumber>();
  for (let k = pots.length - 1; k >= 0; k--) {
    const eligible = (pots[k] as Pot).eligible;
    if (eligible.length === 1) continue;
    for (const c of ranked) {
      if (!eligible.includes(c.seat) || shown.has(c.seat) || mucked.has(c.seat)) continue;
      const faceUp = ranked.filter((s) => shown.has(s.seat) && eligible.includes(s.seat));
      if (faceUp.length === 0 || c.rank >= Math.max(...faceUp.map((s) => s.rank)))
        shown.add(c.seat);
      else mucked.add(c.seat);
    }
  }
  return ranked.filter((s) => shown.has(s.seat));
}

/**
 * Closes a betting round. After the river, or once at most one seat can still bet, deals any remaining
 * streets with no betting (D-7) and holds the showdown; otherwise deals the next street.
 */
function endRound(state: HandState, players: readonly PlayerState[]): HandState {
  const gathered = gather(players);
  const seats = state.players.map((p) => p.seat);
  const byClockwise = clockwiseAfter(seats, state.button).map(
    (seat) => gathered.players.find((p) => p.seat === seat) as PlayerState,
  );
  const active = byClockwise.filter((p) => !p.folded);
  const open = active.filter((p) => !p.allIn);
  const base: HandState = { ...state, players: gathered.players, currentBet: 0, betCount: 0 };
  if (state.street === 'river' || open.length <= 1) {
    let dealt = base;
    while (dealt.street !== 'river') dealt = dealNextStreet(dealt);
    const ranked = showdownOrder(state, active).map((p) => ({
      seat: p.seat,
      holeCards: p.holeCards,
      rank: evaluate([...p.holeCards, ...dealt.board]),
    }));
    const showdown = revealShown(ranked, gathered.pots);
    const awards = gathered.pots.map((pot, k): PotAward => {
      const contenders = showdown.filter((s) => pot.eligible.includes(s.seat));
      const best = Math.max(...contenders.map((s) => s.rank));
      const winnerSeats =
        pot.eligible.length === 1
          ? pot.eligible
          : contenders.filter((s) => s.rank === best).map((s) => s.seat);
      return {
        pot: k,
        amount: pot.amount,
        winners: splitPot(pot.amount, winnerSeats, state.button, seats),
      };
    });
    return {
      ...dealt,
      street: 'showdown',
      players: payOut(gathered.players, awards),
      pots: emptied(gathered.pots),
      toAct: null,
      result: {
        endedBy: 'showdown',
        showdown,
        awards,
        ...(gathered.returned && { returned: gathered.returned }),
      },
    };
  }
  return {
    ...dealNextStreet(base),
    pots: gathered.pots,
    toAct: (open[0] as PlayerState).seat,
  };
}

/**
 * Applies a legal action and returns the next state. Never throws for a well-typed action and never mutates
 * `state` or `action`. Rejections (REQ-017.4), checked in this order: `hand-complete` (the hand is over),
 * `out-of-turn` (`action.seat` isn't `state.toAct`), `illegal-action` (the type and amount don't exactly match
 * an entry of `legalActions(state)`, e.g. a wrong amount, a raise on a capped street, or a fold when no bet is
 * faced). The round also ends when the only seat left with chips already has the largest street contribution
 * (D-3), so a big blind facing only all-in players gets no option.
 */
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
  // A short all-in under half a bet neither counts toward the cap nor reopens betting (REQ-016.5).
  const counted = isAggressive && 2 * (amount - fullBetLevel(state)) >= betUnit(state);
  const players = state.players.map((p): PlayerState => {
    if (p.seat === actor.seat) {
      return {
        ...p,
        stack: p.stack - added,
        streetContribution: p.streetContribution + added,
        totalContribution: p.totalContribution + added,
        folded: action.type === 'fold',
        allIn: action.type !== 'fold' && p.stack - added === 0,
        hasActed: true,
      };
    }
    return counted && !p.folded && p.hasActed ? { ...p, hasActed: false } : p;
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
    betCount: counted ? state.betCount + 1 : state.betCount,
    actions: [...state.actions, { street, seat: actor.seat, type: action.type, amount, added }],
  };

  return {
    ok: true,
    state: settle(next, players, (open) => clockwiseAfter(open, actor.seat)[0] as SeatNumber),
  };
}

/**
 * The step after an action: one seat left with cards → foldOut; betting closed → endRound; otherwise
 * `next` with toAct = nextToAct(open seats, ascending).
 */
function settle(
  next: HandState,
  players: readonly PlayerState[],
  nextToAct: (open: readonly SeatNumber[]) => SeatNumber,
): HandState {
  const active = players.filter((p) => !p.folded);
  if (active.length === 1) return foldOut(next, players, (active[0] as PlayerState).seat);
  const open = active.filter((p) => !p.allIn);
  if (
    open.every((p) => p.hasActed && p.streetContribution === next.currentBet) ||
    bettingOver(players)
  ) {
    return endRound(next, players);
  }
  return { ...next, toAct: nextToAct(open.map((p) => p.seat)) };
}

/**
 * REQ-004.8: folds `seat` now, whether or not it is to act and even when it could check. Same history entry
 * and pot-eligibility change as a fold through applyAction, and hasActed true. Then the hand settles exactly
 * as after applyAction; toAct is unchanged if another seat was to act. The seat's chips stay in the pot and
 * are never returned (TASK-10.13 Q-1). If it held a strict top bet, the street is voided down to the live
 * top: currentBet and betCount drop to the surviving levels, and a live seat has acted only if it has a
 * non-blind record since the last surviving level; toAct is then the first seat clockwise from the previous
 * toAct that still has to act. RangeError('Cannot force a fold: …')
 * if the hand is complete, `seat` is not dealt in, has folded or is all-in. Never mutates `state`.
 */
export function forceFold(state: HandState, seat: SeatNumber): HandState {
  if (state.result !== null) throw new RangeError('Cannot force a fold: the hand is complete');
  const folder = state.players.find((p) => p.seat === seat);
  if (folder === undefined)
    throw new RangeError(`Cannot force a fold: seat ${seat} is not dealt in`);
  if (folder.folded) throw new RangeError(`Cannot force a fold: seat ${seat} has folded`);
  if (folder.allIn) throw new RangeError(`Cannot force a fold: seat ${seat} is all-in`);
  const players = state.players.map((p): PlayerState =>
    p.seat === seat ? { ...p, folded: true, hasActed: true } : p,
  );
  const street = state.street as Exclude<Street, 'showdown'>;
  const next: HandState = {
    ...state,
    players,
    pots: state.pots.map((pot) => ({
      ...pot,
      eligible: pot.eligible.filter((s) => s !== seat),
    })),
    actions: [...state.actions, { street, seat, type: 'fold', amount: 0, added: 0 }],
  };
  const floor = street === 'preflop' ? state.stakes.bigBlind : 0;
  const live = Math.max(
    floor,
    ...players.filter((p) => !p.folded).map((p) => p.streetContribution),
  );
  if (folder.streetContribution <= live) {
    return settle(next, players, (open) =>
      state.toAct === seat
        ? (clockwiseAfter(open, seat)[0] as SeatNumber)
        : (state.toAct as SeatNumber),
    );
  }
  const levels = liveLevels(next);
  const from = levels.at(-1)?.at ?? -1;
  const voided = players.map((p): PlayerState =>
    p.folded
      ? p
      : {
          ...p,
          hasActed: next.actions.some(
            (a, i) =>
              i >= from &&
              a.street === street &&
              a.seat === p.seat &&
              a.type !== 'small-blind' &&
              a.type !== 'big-blind',
          ),
        },
  );
  const lowered: HandState = {
    ...next,
    players: voided,
    currentBet: live,
    betCount: levels.length,
  };
  const toAct = state.toAct as SeatNumber;
  return settle(lowered, voided, (open) => {
    const ring = clockwiseAfter(open, toAct === seat ? seat : toAct - 1);
    return ring.find((s) => {
      const p = voided.find((q) => q.seat === s) as PlayerState;
      return !p.hasActed || p.streetContribution < live;
    }) as SeatNumber;
  });
}
