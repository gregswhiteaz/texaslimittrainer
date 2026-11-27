import { formatCard, type Card } from './cards';
import {
  legalActions,
  type Action,
  type ActionRecord,
  type ApplyResult,
  type HandState,
  type PlayerState,
  type SeatConfig,
  type SeatNumber,
} from './hand';

export type InvariantId = 'chips' | 'legal-action' | 'bet-cap' | 'pot-eligibility' | 'cards';
/** Report order (REQ-056.1 order). */
export const INVARIANTS: readonly InvariantId[] = [
  'chips',
  'legal-action',
  'bet-cap',
  'pot-eligibility',
  'cards',
];
export const MAX_BETS_PER_STREET = 4;

export interface Violation {
  readonly invariant: string;
  readonly message: string;
}
export interface ActionStep {
  /** The state the action was chosen in. */
  readonly before: HandState;
  /** What the policy proposed. */
  readonly action: Action;
  /** What the engine answered. */
  readonly result: ApplyResult;
}

const NONE: readonly Violation[] = Object.freeze([]);

/** "seat 4 folds" | "seat 4 checks" | "seat 4 calls $4" | "seat 4 bets $8" | "seat 4 raises to $16" */
export function describeAction(action: Action): string {
  switch (action.type) {
    case 'fold':
      return `seat ${action.seat} folds`;
    case 'check':
      return `seat ${action.seat} checks`;
    case 'call':
      return `seat ${action.seat} calls $${action.amount}`;
    case 'bet':
      return `seat ${action.seat} bets $${action.amount}`;
    case 'raise':
      return `seat ${action.seat} raises to $${action.amount}`;
  }
}

const amountOf = (action: Action): number => ('amount' in action ? action.amount : 0);
const isCount = (value: number): boolean => Number.isInteger(value) && value >= 0;
const isCard = (value: Card): boolean => Number.isInteger(value) && value >= 0 && value <= 51;
const potName = (index: number): string => (index === 0 ? 'main pot' : `side pot ${index}`);
const playerAt = (state: HandState, seat: SeatNumber): PlayerState | undefined =>
  state.players.find((p) => p.seat === seat);
const unitOf = (state: HandState, street: ActionRecord['street']): number =>
  street === 'preflop' || street === 'flop' ? state.stakes.smallBet : state.stakes.bigBet;

/**
 * REQ-016.5, derived here independently of the engine (TASK-1.8 A-4): walking the street's records, the big
 * blind sets the level, and a bet/raise counts (and sets the level) when it adds at least half a unit over it.
 * A fold of a seat holding more street chips than every seat not yet folded (preflop: and the big blind)
 * voids the levels above that live top (TASK-10.13 R6).
 */
function countedBets(
  state: HandState,
  street: ActionRecord['street'],
): { level: number; count: number } {
  const unit = unitOf(state, street);
  const folded = new Set<SeatNumber>();
  const put = new Map<SeatNumber, number>();
  const levels: number[] = [];
  for (const a of state.actions) {
    if (a.street !== street) {
      if (a.type === 'fold') folded.add(a.seat);
      continue;
    }
    put.set(a.seat, (put.get(a.seat) ?? 0) + a.added);
    const level = levels.at(-1) ?? 0;
    if (a.type === 'big-blind') levels.push(a.amount);
    else if ((a.type === 'bet' || a.type === 'raise') && 2 * (a.amount - level) >= unit) {
      levels.push(a.amount);
    } else if (a.type === 'fold') {
      folded.add(a.seat);
      let live = street === 'preflop' ? state.stakes.bigBlind : 0;
      for (const [seat, c] of put) if (!folded.has(seat) && c > live) live = c;
      if ((put.get(a.seat) ?? 0) > live) {
        while ((levels.at(-1) ?? 0) > live) levels.pop();
      }
    }
  }
  return { level: levels.at(-1) ?? 0, count: levels.length };
}

/**
 * The uncalled part due back (TASK-10.13 R6): on the street of the last record, the top seat's chips added
 * minus the second-highest, due only when that top seat has not folded.
 */
function uncalled(state: HandState): { seat: SeatNumber | null; due: number } {
  const last = state.actions.at(-1);
  if (last === undefined) return { seat: null, due: 0 };
  const put = new Map<SeatNumber, number>();
  for (const a of state.actions) {
    if (a.street === last.street) put.set(a.seat, (put.get(a.seat) ?? 0) + a.added);
  }
  let top = 0;
  let second = 0;
  let seat: SeatNumber | null = null;
  for (const p of state.players) {
    const c = put.get(p.seat) ?? 0;
    if (c > top) {
      second = top;
      top = c;
      seat = p.seat;
    } else if (c > second) {
      second = c;
    }
  }
  if (seat === null || top === second || playerAt(state, seat)?.folded)
    return { seat: null, due: 0 };
  return { seat, due: top - second };
}

function legalActionMessage({ before, action, result }: ActionStep): string | null {
  const text = describeAction(action);
  if (!result.ok) return `engine rejected ${text} (${result.error.code})`;
  if (action.seat !== before.toAct) {
    return `seat ${action.seat} acted but seat ${before.toAct ?? 'none'} was to act`;
  }
  const amount = amountOf(action);
  if (!legalActions(before).some((a) => a.type === action.type && amountOf(a) === amount)) {
    return `${text} is not in the legal set`;
  }
  const street = before.street as ActionRecord['street'];
  const unit = unitOf(before, street);
  const actor = playerAt(before, action.seat);
  // REQ-016.1 / REQ-017.7: a bet is exactly one unit and a raise goes to exactly the street's full bet
  // level + unit (small bet preflop/flop, big bet turn/river), unless it is a smaller all-in for the whole
  // stack. Size is checked independently of legalActions (TASK-1.8 A-4).
  const allInTo = actor === undefined ? NaN : actor.streetContribution + actor.stack;
  const fullTo = countedBets(before, street).level + unit;
  if (
    (action.type === 'bet' &&
      (before.currentBet !== 0 || (amount !== unit && !(amount < unit && amount === allInTo)))) ||
    (action.type === 'raise' &&
      amount !== fullTo &&
      !(amount > before.currentBet && amount < fullTo && amount === allInTo))
  ) {
    return `${text} does not match the $${unit} ${before.street} betting unit`;
  }
  const after = result.state.actions;
  const last = after[after.length - 1];
  const added =
    action.type === 'raise' ? amount - (actor?.streetContribution ?? NaN) : amountOf(action);
  if (
    after.length !== before.actions.length + 1 ||
    last === undefined ||
    last.street !== before.street ||
    last.seat !== action.seat ||
    last.type !== action.type ||
    last.amount !== amount ||
    last.added !== added
  ) {
    return `history entry for ${text} does not match the action`;
  }
  return null;
}

function chipsMessage(state: HandState): string | null {
  let start = 0;
  let stacks = 0;
  let street = 0;
  let total = 0;
  for (const p of state.players) {
    if (
      !isCount(p.stack) ||
      !isCount(p.streetContribution) ||
      !isCount(p.totalContribution) ||
      p.streetContribution > p.totalContribution
    ) {
      return `seat ${p.seat} has an invalid stack or contribution`;
    }
    start += p.startingStack;
    stacks += p.stack;
    street += p.streetContribution;
    total += p.totalContribution;
  }
  let inPots = 0;
  for (const pot of state.pots) inPots += pot.amount;
  const table = stacks + street + inPots;
  if (table !== start) return `table holds $${table} but the hand started with $${start}`;
  const awards = state.result?.awards ?? [];
  const back = state.result?.returned;
  if (state.result === null) {
    if (inPots !== total - street) {
      return `pots hold $${inPots} but completed streets took $${total - street}`;
    }
  } else {
    let awarded = 0;
    for (const award of awards) awarded += award.amount;
    const putIn = total - (back?.amount ?? 0);
    if (awarded !== putIn) return `awards pay $${awarded} but players put in $${putIn}`;
    for (const [i, award] of awards.entries()) {
      let shares = 0;
      for (const w of award.winners) shares += w.amount;
      if (shares !== award.amount) {
        return `award ${i + 1} (${potName(award.pot)}) is $${award.amount} but its winners get $${shares}`;
      }
    }
  }
  for (const p of state.players) {
    let won = 0;
    for (const award of awards) {
      for (const w of award.winners) if (w.seat === p.seat) won += w.amount;
    }
    const backed = back?.seat === p.seat ? back.amount : 0;
    if (p.stack + p.totalContribution - won - backed !== p.startingStack) {
      return `seat ${p.seat} has $${p.stack} but should have $${p.startingStack - p.totalContribution + won + backed}`;
    }
  }
  return null;
}

/** C5: on a completed hand, `returned` is exactly the uncalled part of the last betting street (A-5). */
function returnedMessage(state: HandState): string | null {
  const { seat: dueSeat, due } = uncalled(state);
  const returned = state.result?.returned;
  if (returned !== undefined) {
    const dueForSeat = returned.seat === dueSeat ? due : 0;
    return returned.amount === dueForSeat
      ? null
      : `seat ${returned.seat} got $${returned.amount} back but $${dueForSeat} was uncalled`;
  }
  return dueSeat === null ? null : `seat ${dueSeat} got $0 back but $${due} was uncalled`;
}

const BETTING_STREETS = ['preflop', 'flop', 'turn', 'river'] as const;

function betCapMessage(state: HandState): string | null {
  const counts = BETTING_STREETS.map((street) => countedBets(state, street).count);
  let worstStreet: string = state.street;
  let worst = state.betCount;
  counts.forEach((count, i) => {
    if (count > MAX_BETS_PER_STREET && count > worst) {
      worst = count;
      worstStreet = BETTING_STREETS[i] as string;
    }
  });
  return worst > MAX_BETS_PER_STREET
    ? `${worstStreet} has ${worst} bets (at most ${MAX_BETS_PER_STREET})`
    : null;
}

function potEligibilityMessage(state: HandState): string | null {
  const { pots } = state;
  for (const [i, pot] of pots.entries()) {
    const ok = pot.eligible.every(
      (seat, k) =>
        playerAt(state, seat) !== undefined && (k === 0 || seat > (pot.eligible[k - 1] as number)),
    );
    if (!ok) return `${potName(i)} has a malformed eligible list`;
  }
  for (const [i, pot] of pots.entries()) {
    const folded = pot.eligible.find((seat) => playerAt(state, seat)?.folded);
    if (folded !== undefined) return `${potName(i)} lists seat ${folded}, which has folded`;
  }
  for (const [i, pot] of pots.entries()) {
    if (pot.amount <= 0) continue;
    const idle = pot.eligible.find((seat) => {
      const p = playerAt(state, seat);
      return p === undefined || p.totalContribution - p.streetContribution <= 0;
    });
    if (idle !== undefined)
      return `${potName(i)} lists seat ${idle}, which has not contributed to it`;
  }
  const main = pots[0]?.eligible ?? [];
  for (const p of state.players) {
    if (!p.folded && !main.includes(p.seat)) {
      return `seat ${p.seat} holds cards but is not eligible for the main pot`;
    }
  }
  // J-1-02: the only seat left after a fold-out wins dead blinds even with $0 in.
  const sole =
    state.result?.endedBy === 'fold' && state.players.filter((q) => !q.folded).length === 1;
  for (const award of state.result?.awards ?? []) {
    const eligible = pots[award.pot]?.eligible ?? [];
    for (const { seat } of award.winners) {
      const p = playerAt(state, seat);
      if (
        !eligible.includes(seat) ||
        p === undefined ||
        p.folded ||
        (p.totalContribution <= 0 && !sole)
      ) {
        return `${potName(award.pot)} paid seat ${seat}, which is not eligible`;
      }
    }
  }
  return potStructureMessage(state);
}

/**
 * P6-P8 (D-5): one pot per contribution level of the non-folded seats, each listing exactly the seats that
 * matched its level and holding (or paying) exactly its layer. A seat's matched amount is its completed-street chips,
 * less the uncalled part returned to it on a completed hand; dead money is not capped (TASK-10.13 R6). Skipped
 * for one pot and one level (A-5).
 */
function potStructureMessage(state: HandState): string | null {
  const { pots, players, result } = state;
  const back = result === null ? { seat: null, due: 0 } : uncalled(state);
  const matched = players.map(
    (p) => p.totalContribution - p.streetContribution - (p.seat === back.seat ? back.due : 0),
  );
  const levels = [...new Set(matched.filter((_, i) => !(players[i] as PlayerState).folded))].sort(
    (a, b) => a - b,
  );
  if (pots.length <= 1 && levels.length <= 1) return null;
  if (pots.length !== levels.length) {
    return `there are ${pots.length} pots but contributions make ${levels.length}`;
  }
  for (const [k, pot] of pots.entries()) {
    const at = levels[k] as number;
    const short = pot.eligible.find(
      (seat) => (matched[players.findIndex((p) => p.seat === seat)] ?? 0) < at,
    );
    if (short !== undefined) {
      return `${potName(k)} lists seat ${short}, which has not matched its $${at} level`;
    }
    const missing = players.find(
      (p, i) => !p.folded && (matched[i] as number) >= at && !pot.eligible.includes(p.seat),
    );
    if (missing !== undefined) {
      return `seat ${missing.seat} matched the $${at} level of ${potName(k)} but is not eligible for it`;
    }
  }
  for (const [k, pot] of pots.entries()) {
    const below = k === 0 ? 0 : (levels[k - 1] as number);
    const cap = k === levels.length - 1 ? Infinity : (levels[k] as number);
    let layer = 0;
    for (const c of matched) layer += Math.min(c, cap) - Math.min(c, below);
    if (result === null) {
      if (pot.amount !== layer)
        return `${potName(k)} holds $${pot.amount} but its layer is $${layer}`;
    } else {
      let paid = 0;
      for (const award of result.awards) if (award.pot === k) paid += award.amount;
      if (paid !== layer) return `${potName(k)} paid $${paid} but its layer is $${layer}`;
    }
  }
  return null;
}

/** Board and burn lengths per street (deal order D-5); a fold-out keeps its street. */
const DEALT: Readonly<Record<string, readonly [number, number]>> = {
  preflop: [0, 0],
  flop: [3, 1],
  turn: [4, 2],
  river: [5, 3],
  showdown: [5, 3],
};

const seen = new Uint8Array(52);

function cardsMessage(state: HandState): string | null {
  const all: Card[] = [];
  for (const p of state.players) all.push(...p.holeCards);
  all.push(...state.board, ...state.burned);
  const bad = all.find((card) => !isCard(card));
  if (bad !== undefined) return `${bad} is not a card`;
  for (const p of state.players) {
    const k = p.holeCards.length;
    if (k !== 2) return `seat ${p.seat} has ${k} hole card${k === 1 ? '' : 's'} but should have 2`;
  }
  const [board, burn] = DEALT[state.street] ?? [NaN, NaN];
  if (state.board.length !== board || state.burned.length !== burn) {
    return `${state.street} has ${state.board.length} board and ${state.burned.length} burn cards`;
  }
  seen.fill(0);
  for (const card of all) {
    if (seen[card] === 1) return `${formatCard(card)} dealt twice`;
    seen[card] = 1;
  }
  return dealOrderMessage(state);
}

/** Deck offsets after the 2n hole cards (D-5): burns, then board cards. */
const BURN_AT = [0, 4, 6] as const;
const BOARD_AT = [1, 2, 3, 5, 7] as const;

/** `<slot> is <card> but the deck deals <deck[position]>`. */
function deckMismatch(deck: readonly Card[], position: number, card: Card, slot: string): string {
  const expected = deck[position];
  const text = expected !== undefined && isCard(expected) ? formatCard(expected) : 'no card';
  return `${slot} is ${formatCard(card)} but the deck deals ${text}`;
}

/** K4: every dealt card sits at its D-5 deck position. Players are in ascending seat order. */
function dealOrderMessage({ players, deck, button, burned, board }: HandState): string | null {
  const n = players.length;
  let start = 0;
  while (start < n && (players[start] as PlayerState).seat <= button) start++;
  if (start === n) start = 0;
  for (let i = 0; i < n; i++) {
    const { seat, holeCards } = players[i] as PlayerState;
    const p = (i - start + n) % n;
    if (holeCards[0] !== deck[p]) {
      return deckMismatch(deck, p, holeCards[0], `seat ${seat} hole card 1`);
    }
    if (holeCards[1] !== deck[p + n]) {
      return deckMismatch(deck, p + n, holeCards[1], `seat ${seat} hole card 2`);
    }
  }
  for (let j = 0; j < burned.length; j++) {
    const at = 2 * n + (BURN_AT[j] ?? NaN);
    const card = burned[j] as Card;
    if (card !== deck[at]) return deckMismatch(deck, at, card, `burn card ${j + 1}`);
  }
  for (let j = 0; j < board.length; j++) {
    const at = 2 * n + (BOARD_AT[j] ?? NaN);
    const card = board[j] as Card;
    if (card !== deck[at]) return deckMismatch(deck, at, card, `board card ${j + 1}`);
  }
  return null;
}

/** H1/H2: the deal leaves blind records, and every record is on a betting street. */
function historyMessage({ actions }: HandState): string | null {
  if (actions.length === 0) return 'history is empty after the deal';
  for (let i = 0; i < actions.length; i++) {
    const { street } = actions[i] as ActionRecord;
    if (BETTING_STREETS.indexOf(street) < 0) {
      return `history record ${i + 1} is on ${street}, which is not a betting street`;
    }
  }
  return null;
}

/** chips, legal-action (history shape), bet-cap, pot-eligibility, cards on one state; [] when all
 *  hold. Never throws, never mutates. */
export function checkState(state: HandState): readonly Violation[] {
  const chips = chipsMessage(state);
  const history = historyMessage(state);
  const betCap = betCapMessage(state);
  const pots = potEligibilityMessage(state);
  const cards = cardsMessage(state);
  if (chips === null && history === null && betCap === null && pots === null && cards === null) {
    return NONE;
  }
  const found: Violation[] = [];
  if (chips !== null) found.push({ invariant: 'chips', message: chips });
  if (history !== null) found.push({ invariant: 'legal-action', message: history });
  if (betCap !== null) found.push({ invariant: 'bet-cap', message: betCap });
  if (pots !== null) found.push({ invariant: 'pot-eligibility', message: pots });
  if (cards !== null) found.push({ invariant: 'cards', message: cards });
  return found;
}

/** legal-action for the step, then checkState(result.state) if result.ok, plus the returned-chips rule (C5) on
 *  the step that completes the hand when chips is otherwise clean. Results in INVARIANTS order, ≤ 1 per id:
 *  the step's own legal-action message replaces checkState's history one. */
export function checkStep(step: ActionStep): readonly Violation[] {
  const legal = legalActionMessage(step);
  let state = step.result.ok ? checkState(step.result.state) : NONE;
  if (
    step.result.ok &&
    step.result.state.result !== null &&
    !state.some((v) => v.invariant === 'chips')
  ) {
    const returned = returnedMessage(step.result.state);
    if (returned !== null) state = [{ invariant: 'chips', message: returned }, ...state];
  }
  if (legal === null) return state;
  const stateChecks = state.filter((v) => v.invariant !== 'legal-action');
  const [chips, ...afterChips] = stateChecks;
  const violation = { invariant: 'legal-action', message: legal };
  return chips?.invariant === 'chips'
    ? [chips, violation, ...afterChips]
    : [violation, ...stateChecks];
}

/** AC#9: each seat starts with its previous final stack; a $0 seat rebuys for `rebuy` or sits out (0), and a
 *  seat not in `previous` was not on this table, so it starts with 0. */
function crossHandMessage(
  state: HandState,
  previous: readonly SeatConfig[],
  rebuy: number | null,
): string | null {
  const seats = [...new Set([...previous, ...state.players].map((s) => s.seat))].sort(
    (a, b) => a - b,
  );
  for (const seat of seats) {
    const before = previous.find((s) => s.seat === seat)?.stack;
    const expected = before === undefined ? 0 : before > 0 ? before : (rebuy ?? 0);
    const actual = playerAt(state, seat)?.startingStack ?? 0;
    if (actual !== expected) {
      return `seat ${seat} starts with $${actual} but should start with $${expected}`;
    }
  }
  return null;
}

/** Checks a hand right after createHand: checkState(state); the C5 returned rule if the hand finished at the
 *  deal and chips is clean; and, when `previous` is given (the last hand's final {seat, stack} for each seat
 *  dealt into it), the cross-hand chip check, whose message takes the chips slot. ≤ 1 violation per id,
 *  INVARIANTS order; [] when clean. Never throws. */
export function checkDeal(
  state: HandState,
  previous?: readonly SeatConfig[],
  rebuy: number | null = null,
): readonly Violation[] {
  const found = checkState(state);
  const cross = previous === undefined ? null : crossHandMessage(state, previous, rebuy);
  const chips =
    cross ??
    (state.result !== null && !found.some((v) => v.invariant === 'chips')
      ? returnedMessage(state)
      : null);
  if (chips === null) return found;
  return [{ invariant: 'chips', message: chips }, ...found.filter((v) => v.invariant !== 'chips')];
}
