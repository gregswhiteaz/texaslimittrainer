import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { handClassOf } from '../../src/advice/hand-class';
import { chartCell, type ChartAction } from '../../src/advice/preflop-chart';
import { positionOf, recommendPreflop, situationOf, SIX_MAX_CHART } from '../../src/advice/preflop';
import { recommend } from '../../src/advice/recommend';
import { BOT_EQUITY, decideTag } from '../../src/bots/tag';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { runPlaytest } from '../../src/playtest/runner';

const TEST_TIMEOUT_MS = 120_000;
const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Seat s gets deck[i] and deck[i + 6], i = deal index. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const DEAL_INDEX: Readonly<Record<number, number>> = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 1: 5 };
const FLOP_POSITIONS = [13, 14, 15];
const TURN_POSITION = 17;
const RIVER_POSITION = 19;
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);
/** The TAG seat in the property runs; the rotating button puts it in every position. */
const TAG_SEAT = 1;

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];
const r = (seat: SeatNumber, amount: number): Step => [seat, 'raise', amount];

/** 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check: pot 16, live seats 1, 2, 3, 6. */
const PREFLOP: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const CHECK_ROUND: Step[] = [k(2), k(3), k(6), k(1)];

/** Positions of `seat`'s hole cards then the board cards (flop, turn, river) in deal order. */
function positionsFor(seat: SeatNumber, boardCards: number): number[] {
  const i = DEAL_INDEX[seat] as number;
  return [i, i + 6, ...[...FLOP_POSITIONS, TURN_POSITION, RIVER_POSITION].slice(0, boardCards)];
}

/** `seat`'s hole cards and the board at their deal positions. */
function fixedCards(seat: SeatNumber, hole: string, board = ''): Map<number, Card> {
  const cards = parseCards(`${hole} ${board}`.trim());
  const positions = positionsFor(seat, cards.length - 2);
  return new Map(cards.map((card, i) => [positions[i] as number, card]));
}

/** A deck with `fixed` cards in place; `rest` (default: the other cards ascending) fills the gaps. */
function deckWith(fixed: ReadonlyMap<number, Card>, rest?: readonly Card[]): Card[] {
  const used = new Set(fixed.values());
  const filler = [...(rest ?? ALL_CARDS.filter((card) => !used.has(card)))];
  return Array.from({ length: 52 }, (_, i) => fixed.get(i) ?? (filler.shift() as Card));
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

const viewAt = (seat: SeatNumber, deck: readonly Card[], steps: Step[]): PlayerView =>
  playerView(stateAfter(deck, steps), seat);

const owes = (view: PlayerView) =>
  view.currentBet - (view.players.find((p) => p.seat === view.seat)?.streetContribution ?? 0);

/** Plays `hands` hands with TAG at TAG_SEAT and random-move seats elsewhere; `onTag` sees each TAG view. */
function playAgainstRandom(hands: number, seed: number, onTag: (view: PlayerView) => void): void {
  const summary = runPlaytest({ hands, seed, size: 6 }, undefined, {
    makePolicy: (code, seat) =>
      seat === TAG_SEAT
        ? (view) => {
            onTag(view);
            return decideTag(view);
          }
        : randomMovePolicy(seatGenerator(code, seat)),
  });
  expect(summary.violations).toBe(0);
}

/** The chart cell's action for the view, made legal (capped raise → call, nothing owed → check). */
function chartMove(view: PlayerView): Action {
  const cell = chartCell(
    SIX_MAX_CHART,
    positionOf(view),
    situationOf(view),
    handClassOf(view.holeCards),
  );
  const canRaise = view.betCount < 4 && view.legalActions.some((a) => a.type === 'raise');
  const capped: ChartAction = cell.action === 'raise' && !canRaise ? 'call' : cell.action;
  const type = capped !== 'raise' && owes(view) === 0 ? 'check' : capped;
  const move = view.legalActions.find((a) => a.type === type);
  if (move === undefined) throw new Error(`No legal ${type}`);
  return move;
}

describe('TAG bot acceptance', () => {
  it('AC#1 preflop TAG plays the 6-max chart move', () => {
    const utg = (hole: string, steps: Step[] = []) =>
      viewAt(4, deckWith(fixedCards(4, hole)), steps);
    expect(decideTag(utg('As Ah'))).toStrictEqual({ seat: 4, type: 'raise', amount: 8 });
    expect(decideTag(utg('7c 2d'))).toStrictEqual({ seat: 4, type: 'fold' });

    const bbLimped = viewAt(3, deckWith(fixedCards(3, '7c 2d')), [
      c(4, 4),
      f(5),
      f(6),
      f(1),
      c(2, 2),
    ]);
    expect(situationOf(bbLimped)).toBe('limpers');
    expect(decideTag(bbLimped)).toStrictEqual({ seat: 3, type: 'check' });

    const capped = utg('As Ah', [r(4, 8), r(5, 12), r(6, 16), f(1), f(2), f(3)]);
    expect(situationOf(capped)).toBe('re-raise');
    expect(capped.betCount).toBe(4);
    expect(decideTag(capped)).toStrictEqual({ seat: 4, type: 'call', amount: 8 });

    for (const view of [utg('As Ah'), utg('7c 2d'), bbLimped, capped]) {
      expect(decideTag(view)).toStrictEqual(chartMove(view));
      expect(decideTag(view)).toStrictEqual(recommendPreflop(view).move);
    }

    const situations = new Set<string>();
    let decisions = 0;
    playAgainstRandom(200, 61, (view) => {
      if (view.street !== 'preflop') return;
      decisions++;
      situations.add(situationOf(view));
      const move = decideTag(view);
      expect(view.legalActions).toContainEqual(move);
      expect(move).toStrictEqual(chartMove(view));
      expect(move).toStrictEqual(recommendPreflop(view).move);
    });
    expect(decisions).toBeGreaterThan(0);
    expect([...situations].sort()).toEqual(
      ['blind-defence', 'limpers', 'raise', 'raise-and-calls', 're-raise', 'unopened'].sort(),
    );
  });

  it(
    'AC#2 postflop facing a bet TAG calls or folds as advised',
    () => {
      const topSet = viewAt(3, deckWith(fixedCards(3, 'Kc Kd', 'Kh 9h 2c')), [...PREFLOP, b(2, 4)]);
      // TASK-7.8: top set is ahead of the hands that would call a raise, so the advice raises for value.
      expect(recommend(topSet).move).toStrictEqual({ seat: 3, type: 'raise', amount: 8 });
      expect(decideTag(topSet)).toStrictEqual({ seat: 3, type: 'raise', amount: 8 });

      const sevenHigh = viewAt(3, deckWith(fixedCards(3, '7c 3d', 'Kh Qs 9c 4h 2s')), [
        ...PREFLOP,
        ...CHECK_ROUND,
        ...CHECK_ROUND,
        b(2, 8),
      ]);
      expect(sevenHigh.street).toBe('river');
      expect(sevenHigh.players.filter((p) => !p.folded && p.seat !== 3)).toHaveLength(3);
      expect(recommend(sevenHigh).move).toStrictEqual({ seat: 3, type: 'fold' });
      expect(decideTag(sevenHigh)).toStrictEqual({ seat: 3, type: 'fold' });

      const seen = new Set<string>();
      playAgainstRandom(60, 62, (view) => {
        if (view.street === 'preflop' || owes(view) === 0) return;
        const move = decideTag(view);
        // TAG plays the advice at the bots' equity budget (TASK-7.8).
        expect(move).toStrictEqual(recommend(view, { equity: BOT_EQUITY }).move);
        expect(['call', 'fold', 'raise']).toContain(move.type);
        seen.add(move.type);
      });
      expect([...seen].sort()).toEqual(['call', 'fold', 'raise']);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#3 postflop with no bet to face TAG checks',
    () => {
      const scripted: [Step[], string][] = [
        [[...PREFLOP, k(2)], 'Kh 9h 2c'],
        [[...PREFLOP, ...CHECK_ROUND, k(2)], 'Kh 9h 2c 7d'],
        [[...PREFLOP, ...CHECK_ROUND, ...CHECK_ROUND, k(2)], 'Kh 9h 2c 7d 3s'],
      ];
      const streets: string[] = [];
      for (const [steps, board] of scripted) {
        const view = viewAt(3, deckWith(fixedCards(3, 'Ah 5h', board)), steps);
        streets.push(view.street);
        expect(decideTag(view)).toStrictEqual({ seat: 3, type: 'check' });
        expect(recommend(view).move).toStrictEqual({ seat: 3, type: 'check' });
      }
      expect(streets).toEqual(['flop', 'turn', 'river']);

      let free = 0;
      playAgainstRandom(60, 63, (view) => {
        if (view.street === 'preflop' || owes(view) !== 0) return;
        free++;
        const move = decideTag(view);
        // TASK-7.8: a free decision checks or bets for value.
        expect(['check', 'bet']).toContain(move.type);
        expect(move).toStrictEqual(recommend(view, { equity: BOT_EQUITY }).move);
      });
      expect(free).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    "AC#4 other players' and undealt cards never change TAG's action",
    () => {
      const spots: [Step[], string, string][] = [
        [[f(4), f(5), c(6, 4), c(1, 4), c(2, 2)], 'Ah 5h', ''],
        [[...PREFLOP, k(2)], 'Ah 5h', 'Kh 9h 2c'],
        [[...PREFLOP, b(2, 4)], 'Ah 5h', 'Kh 9h 2c'],
      ];
      for (const [steps, hole, board] of spots) {
        const fixed = fixedCards(3, hole, board);
        const base = decideTag(viewAt(3, deckWith(fixed), steps));
        const others = ALL_CARDS.filter((card) => ![...fixed.values()].includes(card));
        fc.assert(
          fc.property(
            fc.shuffledSubarray(others, { minLength: others.length, maxLength: others.length }),
            (rest) => {
              const view = viewAt(3, deckWith(fixed, rest), steps);
              expect(view.holeCards).toEqual(parseCards(hole));
              expect(decideTag(view)).toStrictEqual(base);
            },
          ),
          { numRuns: 30, seed: 6104 },
        );
      }

      const state = stateAfter(deckWith(fixedCards(3, 'Ah 5h')), PREFLOP.slice(0, 5));
      // @ts-expect-error decideTag accepts only a PlayerView, never the full HandState.
      expect(() => decideTag(state)).toThrow();
    },
    TEST_TIMEOUT_MS,
  );
});
