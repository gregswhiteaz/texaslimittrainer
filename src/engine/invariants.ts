import { formatCard, type Card } from './cards';
import {
  legalActions,
  type Action,
  type ApplyResult,
  type HandState,
  type PlayerState,
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
  const unit =
    before.street === 'preflop' || before.street === 'flop'
      ? before.stakes.smallBet
      : before.stakes.bigBet;
  if (
    (action.type === 'bet' && (before.currentBet !== 0 || amount !== unit)) ||
    (action.type === 'raise' && amount !== before.currentBet + unit)
  ) {
    return `${text} does not match the $${unit} ${before.street} betting unit`;
  }
  const after = result.state.actions;
  const last = after[after.length - 1];
  const actor = playerAt(before, action.seat);
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
  if (state.result === null) {
    if (inPots !== total - street) {
      return `pots hold $${inPots} but completed streets took $${total - street}`;
    }
  } else {
    let awarded = 0;
    let paid = 0;
    let balanced = true;
    for (const award of awards) {
      let shares = 0;
      for (const w of award.winners) shares += w.amount;
      awarded += award.amount;
      paid += shares;
      if (shares !== award.amount) balanced = false;
    }
    if (awarded !== total || !balanced) {
      return `awards pay $${awarded !== total ? awarded : paid} but players put in $${total}`;
    }
  }
  for (const p of state.players) {
    let won = 0;
    for (const award of awards) {
      for (const w of award.winners) if (w.seat === p.seat) won += w.amount;
    }
    if (p.stack + p.totalContribution - won !== p.startingStack) {
      return `seat ${p.seat} has $${p.stack} but should have $${p.startingStack - p.totalContribution + won}`;
    }
  }
  return null;
}

const BETTING_STREETS = ['preflop', 'flop', 'turn', 'river'] as const;

function betCapMessage(state: HandState): string | null {
  const counts = [0, 0, 0, 0];
  for (const a of state.actions) {
    if (a.type === 'big-blind' || a.type === 'bet' || a.type === 'raise') {
      const i = BETTING_STREETS.indexOf(a.street);
      if (i >= 0) counts[i] = (counts[i] as number) + 1;
    }
  }
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
      const p = playerAt(state, seat) as PlayerState;
      return p.totalContribution - p.streetContribution <= 0;
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
  for (const award of state.result?.awards ?? []) {
    const eligible = pots[award.pot]?.eligible ?? [];
    for (const { seat } of award.winners) {
      const p = playerAt(state, seat);
      if (!eligible.includes(seat) || p === undefined || p.folded || p.totalContribution <= 0) {
        return `${potName(award.pot)} paid seat ${seat}, which is not eligible`;
      }
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
  const [board, burn] = DEALT[state.street] ?? [NaN, NaN];
  if (
    state.players.some((p) => p.holeCards.length !== 2) ||
    state.board.length !== board ||
    state.burned.length !== burn
  ) {
    return `${state.street} has ${state.board.length} board and ${state.burned.length} burn cards`;
  }
  seen.fill(0);
  for (const card of all) {
    if (seen[card] === 1) return `${formatCard(card)} dealt twice`;
    seen[card] = 1;
  }
  return null;
}

/** chips, bet-cap, pot-eligibility, cards on one state; [] when all hold. Never throws, never mutates. */
export function checkState(state: HandState): readonly Violation[] {
  const chips = chipsMessage(state);
  const betCap = betCapMessage(state);
  const pots = potEligibilityMessage(state);
  const cards = cardsMessage(state);
  if (chips === null && betCap === null && pots === null && cards === null) return NONE;
  const found: Violation[] = [];
  if (chips !== null) found.push({ invariant: 'chips', message: chips });
  if (betCap !== null) found.push({ invariant: 'bet-cap', message: betCap });
  if (pots !== null) found.push({ invariant: 'pot-eligibility', message: pots });
  if (cards !== null) found.push({ invariant: 'cards', message: cards });
  return found;
}

/** legal-action for the step, then checkState(result.state) if result.ok. Results in INVARIANTS order, ≤ 1 per id. */
export function checkStep(step: ActionStep): readonly Violation[] {
  const legal = legalActionMessage(step);
  const state = step.result.ok ? checkState(step.result.state) : NONE;
  if (legal === null) return state;
  const [chips, ...rest] = state;
  const violation = { invariant: 'legal-action', message: legal };
  return chips?.invariant === 'chips' ? [chips, violation, ...rest] : [violation, ...state];
}
