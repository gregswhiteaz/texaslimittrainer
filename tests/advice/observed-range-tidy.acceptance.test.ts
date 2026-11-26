import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { basisText, fillTemplate, OBSERVED_BASIS } from '../../src/advice/explanations';
import {
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  rangeWidthPct,
  scaledWidthPct,
  SIX_MAX_RANGES,
  type OpponentRange,
} from '../../src/advice/ranges';
import { recommend } from '../../src/advice/recommend';
import { cardRank, parseCards, RANK_CHARS, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);
type Step = [SeatNumber, Action['type'], number?];

/** A deck with `fixed[position] = card`; the remaining cards fill the other positions in order. */
function deckWith(fixed: Readonly<Record<number, string>>): Card[] {
  const map = new Map(Object.entries(fixed).map(([i, text]) => [Number(i), parseCards(text)[0]]));
  const used = new Set(map.values());
  const filler = ALL_CARDS.filter((card) => !used.has(card));
  return Array.from({ length: 52 }, (_, i) => map.get(i) ?? (filler.shift() as Card));
}

/** Button 1 (SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1); plays `steps` on `deck`. */
function stateAfter(steps: Step[], deck: readonly Card[]): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: 6 }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const toActView = (steps: Step[], deck: readonly Card[]): PlayerView => {
  const state = stateAfter(steps, deck);
  return playerView(state, state.toAct as SeatNumber);
};

/** Hero BB (seat 3) holds Kc Qd; the flop is 7h 8s 2d: no ace anywhere. */
const DECK = deckWith({ 1: 'Kc', 7: 'Qd', 13: '7h', 14: '8s', 15: '2d' });
/** CO (6) opens, everyone else folds, the hero BB (3) calls: heads-up flop. */
const CO_OPEN: Step[] = [
  [4, 'fold'],
  [5, 'fold'],
  [6, 'raise', 8],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'call', 4],
];

const fixedEquity =
  (equity: number) =>
  (input: EquityInput): EquityResult => ({
    hero: { win: equity, tie: 0, equity },
    opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
    method: 'sampled',
    trials: 1,
  });

const deadOf = (view: PlayerView) => [...view.holeCards, ...view.board];

describe('observed range tidy acceptance', () => {
  it('AC#1 a CO open-raiser seen for 100 hands with PFR 0 has a scaled width of exactly 0', () => {
    const view = toActView(CO_OPEN, DECK);
    expect(view.board).toHaveLength(3);
    const ace = RANK_CHARS.indexOf('A');
    expect(deadOf(view).some((card) => cardRank(card) === ace)).toBe(false);
    const range = estimateOpponentRanges(view, [{ seat: 6, hands: 100, vpip: 0, pfr: 0 }]).find(
      (r) => r.seat === 6,
    ) as OpponentRange;
    expect(range.position).toBe('CO');
    expect(range.line).toBe('open-raise');
    expect(range.widthPct).toBe(0);
    expect(range.start).toEqual(expandRange(new Set(['AA']), deadOf(view)));
    expect(range.start).toHaveLength(6);
    expect(range.basis.text).toBe('based on 100 hands of this opponent');
    const d = rangeWidthPct(defaultRange(SIX_MAX_RANGES, 'CO', 'open-raise').classes);
    expect(scaledWidthPct(d, 0, 100)).toBe(0);
  });

  it('AC#2 basisText for 45 hands reads based on 45 hands of this opponent', () => {
    expect(basisText(45)).toBe('based on 45 hands of this opponent');
    expect(basisText(45)).toBe(fillTemplate(OBSERVED_BASIS, { hands: '45' }));
    expect(basisText(null)).toBe('typical player');
    const rec = recommend(toActView(CO_OPEN, DECK), {
      equity: fixedEquity(0.4),
      opponentRanges: 'actions',
      observedOpponents: [{ seat: 6, hands: 45, vpip: 25, pfr: 20 }],
    });
    if (rec.basis !== 'equity') throw new Error('expected a postflop recommendation');
    expect(rec.opponentBasis.find((b) => b.seat === 6)?.text).toBe(
      'based on 45 hands of this opponent',
    );
  });
});
