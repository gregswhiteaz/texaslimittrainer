import { describe, expect, it } from 'vitest';
import {
  computeEquity,
  type EquityInput,
  type EquityResult,
  type HoleCards,
} from '../../src/advice/equity';
import { POSTFLOP_RULE_IDS, recommendPostflop } from '../../src/advice/postflop';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Hole cards go to deck[i] and deck[i + 6]. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const HERO = 3;
/** Hero (seat 3) hole-card positions, then flop 13-15, turn 17, river 19. */
const POSITIONS = [1, 7, 13, 14, 15, 17, 19];

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];

/** One opponent (the small blind) left; it bets $8 on the turn into $20: pot $28. */
const AC1_LINE: Step[] = [
  ...[f(4), f(5), f(6), c(1, 4), c(2, 2), k(3)],
  ...[b(2, 4), c(3, 4), f(1)],
  b(2, 8),
];
/** Two opponents (small blind and button) left; the small blind bets $8 on the turn into $28: pot $36. */
const AC4_LINE: Step[] = [
  ...[f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)],
  ...[b(2, 4), c(3, 4), f(6), c(1, 4)],
  b(2, 8),
];
/** AC#1, the hero calls the turn, the river bricks and the small blind bets again. */
const AC5_LINE: Step[] = [...AC1_LINE, c(3, 8), b(2, 8)];

const HERO_CARDS = 'Ah 5h';
const TURN_BOARD = 'Kh 8h 7c 2d';
const HEART_OUTS = parseCards('2h 3h 4h 6h 7h 9h Th Jh Qh');

const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

/** Hero and board cards at their deal positions; every other card fills the rest in order. */
function deckFor(hero: string, board: string): Card[] {
  const placed = new Map(
    parseCards(`${hero} ${board}`).map((card, i) => [POSITIONS[i] as number, card]),
  );
  const used = new Set(placed.values());
  const filler = ALL_CARDS.filter((card) => !used.has(card));
  return Array.from({ length: 52 }, (_, i) => placed.get(i) ?? (filler.shift() as Card));
}

function stateAfter(deck: readonly Card[], steps: Step[]): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: SEATS.map((seat) => ({ seat, stack: 160 })),
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

const heroView = (board: string, steps: Step[]): PlayerView =>
  playerView(stateAfter(deckFor(HERO_CARDS, board), steps), HERO);

/** Every opponent holds AsKd; exact equity over the remaining cards. */
const AS_KD = parseCards('As Kd') as unknown as HoleCards;
const vsAsKd = (input: EquityInput): EquityResult =>
  computeEquity({ ...input, opponents: input.opponents.map(() => [AS_KD]) });

/** An equity function that always reports `equity` for the hero. */
const fixedEquity =
  (equity: number) =>
  (input: EquityInput): EquityResult => ({
    hero: { win: equity, tie: 0, equity },
    opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
    method: 'exact',
    trials: 1,
  });

describe('implied odds acceptance (TASK-7.9)', () => {
  it('AC#1 Ah5h on Kh 8h 7c 2d calls on implied odds with 9 heart outs', () => {
    const view = heroView(TURN_BOARD, AC1_LINE);
    expect(view.board).toEqual(parseCards(TURN_BOARD));
    const result = recommendPostflop(view, { equity: vsAsKd });
    expect(result).toMatchObject({
      street: 'turn',
      action: 'call',
      ruleId: 'implied-odds-call',
      equityPct: 20.5,
      requiredEquityPct: 22.2,
      impliedRequiredEquityPct: 18.2,
      pot: 28,
      callAmount: 8,
      opponents: 1,
    });
    expect(result.move).toStrictEqual({ seat: 3, type: 'call', amount: 8 });
    expect(result.outs).toEqual(HEART_OUTS);
  });

  it('AC#2 equity equal to the implied price calls and 0.1 below folds', () => {
    const view = heroView(TURN_BOARD, AC1_LINE);
    const equal = recommendPostflop(view, { equity: fixedEquity(8 / 44) });
    expect(equal).toMatchObject({
      action: 'call',
      ruleId: 'implied-odds-call',
      equityPct: 18.2,
      impliedRequiredEquityPct: 18.2,
    });
    const below = recommendPostflop(view, { equity: fixedEquity(8 / 44 - 0.001) });
    expect(below).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      equityPct: 18.1,
      impliedRequiredEquityPct: 18.2,
    });
    expect(below.move).toStrictEqual({ seat: 3, type: 'fold' });
  });

  it('AC#3 a 12 dollar pot folds the draw and lists its 9 outs', () => {
    const view = heroView(TURN_BOARD, AC1_LINE);
    // A $4 pot before the $8 bet: not reachable at $4/$8, so the view is edited (A-8).
    const small: PlayerView = {
      ...view,
      pots: view.pots.map((pot, i) => (i === 0 ? { ...pot, amount: 4 } : pot)),
    };
    const result = recommendPostflop(small, { equity: vsAsKd });
    expect(result).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      pot: 12,
      equityPct: 20.5,
      requiredEquityPct: 40,
      impliedRequiredEquityPct: 28.6,
    });
    expect(result.outs).toEqual(HEART_OUTS);
  });

  it('AC#4 two opponents add two big bets to the implied price', () => {
    const view = heroView(TURN_BOARD, AC4_LINE);
    for (const equity of [0.05, 0.5]) {
      expect(recommendPostflop(view, { equity: fixedEquity(equity) })).toMatchObject({
        pot: 36,
        callAmount: 8,
        opponents: 2,
        requiredEquityPct: 18.2,
        impliedRequiredEquityPct: 13.3,
      });
    }
    const result = recommendPostflop(view, { equity: fixedEquity(0.133) });
    expect(result).toMatchObject({ action: 'call', ruleId: 'implied-odds-call', equityPct: 13.3 });
    expect(result.move).toStrictEqual({ seat: 3, type: 'call', amount: 8 });
  });

  it('AC#5 a missed draw on the river gets no implied odds and no outs', () => {
    const view = heroView(`${TURN_BOARD} 3s`, AC5_LINE);
    expect(view.street).toBe('river');
    const result = recommendPostflop(view, { equity: fixedEquity(0.15) });
    expect(result).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      equityPct: 15,
      requiredEquityPct: 15.4,
      impliedRequiredEquityPct: null,
    });
    expect(result.outs).toEqual([]);
  });

  it('AC#6 implied-odds advice returns equity, required equity, rule id and outs', () => {
    const view = heroView(TURN_BOARD, AC1_LINE);
    const result = recommendPostflop(view, { equity: vsAsKd });
    expect(result.ruleId).toBe('implied-odds-call');
    expect(POSTFLOP_RULE_IDS).toContain(result.ruleId);
    for (const pct of [
      result.equityPct,
      result.requiredEquityPct,
      result.impliedRequiredEquityPct as number,
    ]) {
      expect(typeof pct).toBe('number');
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
      expect(pct).toBe(Math.round(pct * 10) / 10);
    }
    expect(result.outs.length).toBeGreaterThan(0);
    expect(result.outs).toEqual([...new Set(result.outs)].sort((x, y) => x - y));
    for (const card of [...view.holeCards, ...view.board]) expect(result.outs).not.toContain(card);
    expect(structuredClone(result)).toStrictEqual(result);
  });
});
