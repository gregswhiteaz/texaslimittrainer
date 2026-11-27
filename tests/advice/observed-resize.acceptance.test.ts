import { describe, expect, it } from 'vitest';
import { computeEquity } from '../../src/advice/equity';
import { comboCount, HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import { toPct } from '../../src/advice/postflop';
import { positionOf } from '../../src/advice/preflop';
import {
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  HAND_ORDER,
  rangeWidthPct,
  SIX_MAX_RANGES,
  unseenCombos,
  type ObservedOpponent,
  type OpponentRange,
} from '../../src/advice/ranges';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import handOrderRaw from '../../src/advice/ranges/hand-order.json' with { type: 'json' };

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const SLOW_TIMEOUT_MS = 60_000;

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
const RAISER: SeatNumber = 4;
const CALLER: SeatNumber = 6;

const rangeOf = (ranges: readonly OpponentRange[], seat: SeatNumber) =>
  ranges.find((r) => r.seat === seat) as OpponentRange;
const deadOf = (view: PlayerView) => [...view.holeCards, ...view.board];

const combosOf = (classes: Iterable<HandClass>) => {
  let combos = 0;
  for (const hc of classes) combos += comboCount(hc);
  return combos;
};

const defaultOf = (view: PlayerView, seat: SeatNumber) =>
  defaultRange(
    SIX_MAX_RANGES,
    positionOf({ ...view, seat }),
    seat === RAISER ? 'open-raise' : 'call-raise',
  ).classes;

/** The A-4 procedure: one-decimal equity of the class's first combo against three random hands. */
function threeWayEquity(hc: HandClass): number {
  const combo = expandRange(new Set([hc]), [])[0] as readonly [Card, Card];
  const u = unseenCombos(combo);
  return toPct(computeEquity({ hero: combo, board: [], opponents: [u, u, u] }).hero.equity);
}

const stored = new Map(handOrderRaw.hands.map(([hc, pct]) => [hc as string, pct as number]));

describe('observed range resize acceptance', () => {
  it('AC#1 an observed opponent at the default width keeps the authored default range', () => {
    const view = toActView(MULTIWAY, DECK);
    const raiserDefault = defaultOf(view, RAISER);
    const callerDefault = defaultOf(view, CALLER);
    const plain = estimateOpponentRanges(view);
    for (const hands of [30, 100]) {
      const snapshot: ObservedOpponent[] = [
        { seat: RAISER, hands, vpip: 50, pfr: rangeWidthPct(raiserDefault) },
        { seat: CALLER, hands, vpip: rangeWidthPct(callerDefault), pfr: 0 },
      ];
      const ranges = estimateOpponentRanges(view, snapshot);
      for (const [seat, classes] of [
        [RAISER, raiserDefault],
        [CALLER, callerDefault],
      ] as const) {
        const range = rangeOf(ranges, seat);
        expect(range.start).toEqual(expandRange(classes, deadOf(view)));
        expect(range.start).toEqual(rangeOf(plain, seat).start);
        expect(range.basis.text).toBe(`based on ${hands} hands of this opponent`);
      }
    }
  });

  it('AC#2 a wider width adds hand-order classes not in the default, strongest first', () => {
    const view = toActView(MULTIWAY, DECK);
    const base = defaultOf(view, CALLER);
    const target = 0.6 * 1326;
    expect(combosOf(base)).toBeLessThan(target);
    const added: HandClass[] = [];
    for (const hc of HAND_ORDER) {
      if (combosOf(base) + combosOf(added) >= target) break;
      if (!base.has(hc)) added.push(hc);
    }
    expect(added.length).toBeGreaterThan(0);
    expect(combosOf(base) + combosOf(added)).toBeGreaterThanOrEqual(target);
    expect(combosOf(base) + combosOf(added.slice(0, -1))).toBeLessThan(target);
    const expected = new Set([...base, ...added]);
    for (const hc of base) expect(expected.has(hc)).toBe(true);

    const wide = rangeOf(
      estimateOpponentRanges(view, [{ seat: CALLER, hands: 100, vpip: 60, pfr: 0 }]),
      CALLER,
    );
    expect(wide.start).toEqual(expandRange(expected, deadOf(view)));
    for (const combo of expandRange(base, deadOf(view))) expect(wide.start).toContainEqual(combo);

    const all = rangeOf(
      estimateOpponentRanges(view, [{ seat: CALLER, hands: 100, vpip: 100, pfr: 0 }]),
      CALLER,
    );
    expect(all.start).toEqual(expandRange(new Set(HAND_CLASSES), deadOf(view)));
  });

  it('AC#3 a narrower width keeps the strongest default classes, never less than the strongest one', () => {
    const view = toActView(MULTIWAY, DECK);
    const open = defaultOf(view, RAISER);
    const target = 0.05 * 1326;
    expect(combosOf(open)).toBeGreaterThan(target);
    const kept: HandClass[] = [];
    for (const hc of HAND_ORDER) {
      if (kept.length > 0 && combosOf(kept) >= target) break;
      if (open.has(hc)) kept.push(hc);
    }
    expect(combosOf(kept)).toBeGreaterThanOrEqual(target);
    expect(combosOf(kept.slice(0, -1))).toBeLessThan(target);
    for (const hc of kept) expect(open.has(hc)).toBe(true);
    const narrow = rangeOf(
      estimateOpponentRanges(view, [{ seat: RAISER, hands: 100, vpip: 50, pfr: 5 }]),
      RAISER,
    );
    expect(narrow.start).toEqual(expandRange(new Set(kept), deadOf(view)));

    const floor = rangeOf(
      estimateOpponentRanges(view, [{ seat: RAISER, hands: 100, vpip: 50, pfr: 0 }]),
      RAISER,
    );
    expect(floor.start).toEqual(expandRange(new Set(['AA']), deadOf(view)));

    const call = defaultOf(view, CALLER);
    expect(positionOf({ ...view, seat: CALLER })).toBe('CO');
    const first = HAND_ORDER.find((hc) => call.has(hc)) as HandClass;
    expect(first).not.toBe('AA');
    const callerFloor = rangeOf(
      estimateOpponentRanges(view, [{ seat: CALLER, hands: 100, vpip: 0, pfr: 0 }]),
      CALLER,
    );
    expect(callerFloor.start).toEqual(expandRange(new Set([first]), deadOf(view)));
  });

  it('AC#4 the hand order ranks by equity against three random hands', () => {
    expect(handOrderRaw.format).toBe('tlh-hand-order');
    expect(handOrderRaw.version).toBe(1);
    expect(HAND_ORDER).toHaveLength(169);
    expect(HAND_ORDER[0]).toBe('AA');
    for (const connector of ['87s', '76s', '65s']) {
      for (const deuce of ['K2o', 'Q2o', 'J2o']) {
        expect(HAND_ORDER.indexOf(connector), `${connector} before ${deuce}`).toBeLessThan(
          HAND_ORDER.indexOf(deuce),
        );
      }
    }
    for (const hc of ['AA', 'KK', 'AKs', 'AKo', 'T9s', '72o', '32o']) {
      expect(threeWayEquity(hc), hc).toBe(stored.get(hc));
    }
  });

  it.runIf(SLOW)(
    'AC#4 slow every stored equity and the whole order match the calculator',
    () => {
      const rows = HAND_CLASSES.map((hc, i) => ({ hc, i, pct: threeWayEquity(hc) }));
      for (const { hc, pct } of rows) expect(pct, hc).toBe(stored.get(hc));
      rows.sort((a, b) => b.pct - a.pct || a.i - b.i);
      expect(rows.map((r) => r.hc)).toEqual(HAND_ORDER);
      expect(handOrderRaw.hands.map(([hc]) => hc)).toEqual(HAND_ORDER);
    },
    SLOW_TIMEOUT_MS,
  );
});
