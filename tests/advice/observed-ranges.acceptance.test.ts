import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { CONCEPTS } from '../../src/advice/explanations';
import { comboCount } from '../../src/advice/hand-class';
import { positionOf } from '../../src/advice/preflop';
import {
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  rangeWidthPct,
  resizeRange,
  scaledWidthPct,
  SIX_MAX_RANGES,
  strongestClasses,
  type ObservedOpponent,
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
/** UTG (4) opens, CO (6) calls the raise, the hero BB (3) calls: flop, hero to act against 4 and 6. */
const MULTIWAY: Step[] = [
  [4, 'raise', 8],
  [5, 'fold'],
  [6, 'call', 8],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'call', 4],
];
/** UTG (4) opens, everyone else folds, the hero BB (3) calls: heads-up flop. */
const HEADS_UP: Step[] = [
  [4, 'raise', 8],
  [5, 'fold'],
  [6, 'fold'],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'call', 4],
];
const RAISER: SeatNumber = 4;
const CALLER: SeatNumber = 6;

/** Always reports `equity` for the hero. */
const fixedEquity =
  (equity: number) =>
  (input: EquityInput): EquityResult => ({
    hero: { win: equity, tie: 0, equity },
    opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
    method: 'sampled',
    trials: 1,
  });

const rangeOf = (ranges: readonly OpponentRange[], seat: SeatNumber) =>
  ranges.find((r) => r.seat === seat) as OpponentRange;
const deadOf = (view: PlayerView) => [...view.holeCards, ...view.board];
const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/);

describe('observed opponent ranges acceptance', () => {
  it('AC#1 an opponent with 29 observed hands keeps the default range and the typical-player basis', () => {
    const view = toActView(MULTIWAY, DECK);
    const snapshot: ObservedOpponent[] = [{ seat: RAISER, hands: 29, vpip: 60, pfr: 50 }];
    const observed = rangeOf(estimateOpponentRanges(view, snapshot), RAISER);
    const plain = rangeOf(estimateOpponentRanges(view), RAISER);
    expect(observed.line).toBe('open-raise');
    expect(observed.start).toEqual(plain.start);
    expect(observed.combos).toEqual(plain.combos);
    const position = positionOf({ ...view, seat: RAISER });
    expect(observed.start).toEqual(
      expandRange(defaultRange(SIX_MAX_RANGES, position, 'open-raise').classes, deadOf(view)),
    );
    expect(observed.basis).toEqual({ seat: RAISER, observedHands: null, text: 'typical player' });
  });

  it('AC#2 identical actions with different observed stats give different ranges at the formula width', () => {
    const view = toActView(MULTIWAY, DECK);
    const snapshots = [
      { vpip: 20, pfr: 15 },
      { vpip: 60, pfr: 10 },
    ].map((stats) =>
      [RAISER, CALLER].map((seat): ObservedOpponent => ({ seat, hands: 30, ...stats })),
    );
    const [tight, loose] = snapshots.map((s) => estimateOpponentRanges(view, s));
    // d counts the default range's combos before dead cards, as a percent of 1326.
    const openClasses = defaultRange(SIX_MAX_RANGES, 'UTG', 'open-raise').classes;
    let openCombos = 0;
    for (const hc of openClasses) openCombos += comboCount(hc);
    expect(expandRange(openClasses, deadOf(view)).length).toBeLessThan(openCombos);
    expect(positionOf({ ...view, seat: RAISER })).toBe('UTG');
    expect(rangeOf(estimateOpponentRanges(view), RAISER).widthPct).toBeCloseTo(
      (openCombos / 1326) * 100,
      9,
    );
    for (const [seat, line, stat] of [
      [RAISER, 'open-raise', 'pfr'],
      [CALLER, 'call-raise', 'vpip'],
    ] as const) {
      const a = rangeOf(tight as readonly OpponentRange[], seat);
      const b = rangeOf(loose as readonly OpponentRange[], seat);
      expect(a.line).toBe(line);
      expect(a.start).not.toEqual(b.start);
      const classes = defaultRange(SIX_MAX_RANGES, positionOf({ ...view, seat }), line).classes;
      const d = rangeWidthPct(classes);
      snapshots.forEach((snapshot, i) => {
        const range = i === 0 ? a : b;
        const value = (snapshot.find((s) => s.seat === seat) as ObservedOpponent)[stat];
        const o = Math.min(100, (d * value) / (stat === 'pfr' ? 18 : 24));
        const width = scaledWidthPct(d, o, 30);
        expect(range.widthPct).toBeCloseTo(width, 9);
        expect(range.start).toEqual(expandRange(resizeRange(classes, width), deadOf(view)));
        expect(range.basis.text).toBe('based on 30 hands of this opponent');
      });
    }
  });

  it('AC#3 a postflop recommendation states based on 40 hands of this opponent', () => {
    const view = toActView(HEADS_UP, DECK);
    const options = {
      equity: fixedEquity(0.4),
      opponentRanges: 'actions' as const,
      observedOpponents: [{ seat: RAISER, hands: 40, vpip: 30, pfr: 20 }],
    };
    const rec = recommend(view, options);
    expect(rec.basis).toBe('equity');
    if (rec.basis !== 'equity') return;
    expect(rec.opponentBasis).toEqual([
      { seat: RAISER, observedHands: 40, text: 'based on 40 hands of this opponent' },
    ]);
    expect(recommend(view, options)).toEqual(rec);
  });

  it("AC#4 a multiway recommendation returns each opponent's basis", () => {
    const view = toActView(MULTIWAY, DECK);
    const rec = recommend(view, {
      equity: fixedEquity(0.4),
      opponentRanges: 'actions',
      observedOpponents: [
        { seat: RAISER, hands: 45, vpip: 25, pfr: 20 },
        { seat: CALLER, hands: 12, vpip: 50, pfr: 5 },
      ],
    });
    if (rec.basis !== 'equity') throw new Error('expected a postflop recommendation');
    expect(rec.opponentBasis.map((b) => b.seat)).toEqual([RAISER, CALLER]);
    expect(rec.opponentBasis.map((b) => b.text)).toEqual([
      'based on 45 hands of this opponent',
      'typical player',
    ]);
  });

  it('AC#5 the scaling formula gives 14.0, 20.0, 44.0 and 60.0', () => {
    expect(scaledWidthPct(20, 0, 30)).toBeCloseTo(14, 9);
    expect(scaledWidthPct(20, 20, 30)).toBeCloseTo(20, 9);
    expect(scaledWidthPct(20, 100, 30)).toBeCloseTo(44, 9);
    expect(scaledWidthPct(20, 60, 100)).toBeCloseTo(60, 9);
  });

  it("AC#6 a zero scaled width leaves only AA's 6 combos", () => {
    expect(scaledWidthPct(20, 0, 100)).toBeCloseTo(0, 9);
    expect(strongestClasses(0)).toEqual(new Set(['AA']));
    expect(comboCount('AA')).toBe(6);
    const view = toActView(MULTIWAY, DECK);
    const ace = RANK_CHARS.indexOf('A');
    expect(deadOf(view).some((card) => cardRank(card) === ace)).toBe(false);
    const range = rangeOf(
      estimateOpponentRanges(view, [{ seat: RAISER, hands: 100, vpip: 0, pfr: 0 }]),
      RAISER,
    );
    expect(range.widthPct).toBe(0);
    expect(range.start).toHaveLength(6);
    expect(range.start).toEqual(expandRange(new Set(['AA']), deadOf(view)));
  });

  it('AC#7 an explanation resting on observed habits names and defines opponent type', () => {
    const view = toActView(HEADS_UP, DECK);
    const definition = (CONCEPTS.find((c) => c.id === 'opponent-type') as { definition: string })
      .definition;
    const base = { equity: fixedEquity(0.4), opponentRanges: 'actions' as const };
    const observed = recommend(view, {
      ...base,
      observedOpponents: [{ seat: RAISER, hands: 40, vpip: 30, pfr: 20 }],
    }).explanation;
    expect(observed.startsWith(`Ranges here follow the opponent type, ${definition},`)).toBe(true);
    const sentences = sentencesOf(observed);
    expect(sentences[0]).toContain('opponent type');
    expect(sentences[0]).toContain(definition);
    expect(sentences.length).toBeGreaterThanOrEqual(1);
    expect(sentences.length).toBeLessThanOrEqual(3);
    for (const sentence of sentences) expect(sentence).toMatch(/[.!?]$/);

    const plain = recommend(view, base).explanation;
    expect(plain).not.toContain('opponent type');
    expect(observed.endsWith(plain.slice(1))).toBe(true);
    expect(sentencesOf(plain)).toHaveLength(sentences.length);
  });
});
