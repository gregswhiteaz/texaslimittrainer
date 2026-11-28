import { describe, expect, it } from 'vitest';
import { HAND_CLASSES } from '../../src/advice/hand-class';
import type { ChartCell, Position, PreflopChart, Situation } from '../../src/advice/preflop-chart';
import { chartCell } from '../../src/advice/preflop-chart';
import {
  chartSpotOf,
  positionOf,
  PREFLOP_CHARTS,
  recommendPreflop,
  referenceSizeOf,
  situationOf,
} from '../../src/advice/preflop';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { cpuNowMs } from '../support/speed';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ORDERED_DECK = Array.from({ length: 52 }, (_, i) => i as Card);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const r = (seat: SeatNumber, to: number): Step => [seat, 'raise', to];

/** The view of `hero` after `steps`, button 1 and seats 1-6 unless given. */
function viewAfter(
  hero: SeatNumber,
  steps: Step[],
  seats: SeatNumber[] = [1, 2, 3, 4, 5, 6],
  button: SeatNumber = 1,
): PlayerView {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: seats.map((seat) => ({ seat, stack: 160 })),
    button,
    deck: ORDERED_DECK,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return playerView(state, hero);
}

/** A chart with one spot whose every cell is `cell`. */
function oneSpotChart(position: Position, situation: Situation, cell: ChartCell): PreflopChart {
  return {
    referenceSize: '6-max',
    justification: '',
    spots: [
      {
        position,
        situation,
        justification: '',
        cells: Object.fromEntries(HAND_CLASSES.map((hc) => [hc, cell])),
      },
    ],
  };
}

const cell = (
  action: ChartCell['action'],
  alternative: ChartCell['alternative'] = null,
): ChartCell => ({ action, borderline: alternative !== null, alternative });

describe('preflop advice', () => {
  it('classifies position and situation', () => {
    const positions = [1, 2, 3, 4, 5, 6].map((seat) => positionOf(viewAfter(seat, [])));
    expect(positions).toEqual(['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']);
    const odd = [2, 4, 5, 7, 9, 10];
    expect(odd.map((seat) => positionOf(viewAfter(seat, [], odd, 9)))).toEqual([
      'BB',
      'UTG',
      'HJ',
      'CO',
      'BTN',
      'SB',
    ]);
    expect(odd.map((seat) => positionOf(viewAfter(seat, [], odd, 10)))).toEqual([
      'SB',
      'BB',
      'UTG',
      'HJ',
      'CO',
      'BTN',
    ]);

    const cases: [SeatNumber, Step[], Situation][] = [
      [4, [], 'unopened'],
      [6, [c(4, 4), f(5)], 'limpers'],
      [3, [c(4, 4), f(5), f(6), f(1), c(2, 2)], 'limpers'],
      [4, [c(4, 4), r(5, 8), f(6), f(1), f(2), f(3)], 'raise'],
      [4, [c(4, 4), r(5, 8), c(6, 8), c(1, 8), f(2), f(3)], 'raise-and-calls'],
      [1, [r(4, 8), c(5, 8), f(6)], 'raise-and-calls'],
      [3, [r(4, 8), c(5, 8), f(6), f(1), f(2)], 'blind-defence'],
      [4, [r(4, 8), f(5), r(6, 12), f(1), f(2), r(3, 16)], 're-raise'],
      // The small blind completes and the big blind raises.
      [2, [f(4), f(5), f(6), f(1), c(2, 2), r(3, 8)], 'blind-defence'],
      // Blinds facing two raises, none of them theirs.
      [2, [r(4, 8), r(5, 12), f(6), f(1)], 're-raise-not-mine'],
      [3, [r(4, 8), r(5, 12), f(6), f(1), f(2)], 're-raise-not-mine'],
      // The small blind's own raise is re-raised.
      [2, [f(4), f(5), f(6), f(1), r(2, 8), r(3, 12)], 're-raise'],
      // Limps before a single raise are not callers.
      [4, [c(4, 4), c(5, 4), r(6, 8), f(1), f(2), f(3)], 'raise'],
      [1, [c(4, 4), c(5, 4), r(6, 8)], 'raise'],
    ];
    for (const [hero, steps, situation] of cases) {
      expect(situationOf(viewAfter(hero, steps)), JSON.stringify(steps)).toBe(situation);
    }
    // Full ring: an open and a re-raise before the hijack (TASK-7.41).
    const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9] as SeatNumber[];
    expect(situationOf(viewAfter(8, [f(4), r(5, 8), f(6), r(7, 12)], nine))).toBe(
      're-raise-not-mine',
    );
  });

  it('adjusts to legal actions and rejects bad views', () => {
    const capped = viewAfter(4, [r(4, 8), f(5), r(6, 12), f(1), f(2), r(3, 16)]);
    const reRaise = recommendPreflop(capped, {
      chart: oneSpotChart('UTG', 're-raise', cell('raise', 'call')),
    });
    expect([reRaise.action, reRaise.alternative]).toEqual(['call', null]);
    expect(reRaise.move).toEqual({ seat: 4, type: 'call', amount: 8 });

    const co = viewAfter(6, [f(4), f(5)]);
    const coChart = oneSpotChart('CO', 'unopened', cell('raise'));
    const raise = recommendPreflop(co, { chart: coChart });
    expect(raise.action).toBe('raise');
    expect(raise.move).toEqual({ seat: 6, type: 'raise', amount: 8 });
    const noRaise = { ...co, legalActions: co.legalActions.filter((a) => a.type !== 'raise') };
    const call = recommendPreflop(noRaise, { chart: coChart });
    expect(call.action).toBe('call');
    expect(call.move).toEqual({ seat: 6, type: 'call', amount: 4 });

    const bb = viewAfter(3, [c(4, 4), f(5), f(6), f(1), c(2, 2)]);
    const check = recommendPreflop(bb, {
      chart: oneSpotChart('BB', 'limpers', cell('call', 'raise')),
    });
    expect([check.action, check.alternative, check.borderline]).toEqual(['check', 'raise', true]);
    expect(check.move).toEqual({ seat: 3, type: 'check' });
    const checkFold = recommendPreflop(bb, {
      chart: oneSpotChart('BB', 'limpers', cell('call', 'fold')),
    });
    expect([checkFold.action, checkFold.alternative]).toEqual(['check', null]);
    const foldCell = recommendPreflop(bb, { chart: oneSpotChart('BB', 'limpers', cell('fold')) });
    expect(foldCell.action).toBe('check');

    for (const view of [capped, co, bb]) {
      expect(view.legalActions).toContainEqual(recommendPreflop(view).move);
    }

    expect(() => recommendPreflop({ ...co, street: 'flop' })).toThrow(
      new RangeError('Preflop advice needs a preflop view, got flop'),
    );
    expect(() => recommendPreflop(viewAfter(1, [f(4)]))).toThrow(
      new RangeError('Seat 1 is not to act'),
    );
    expect(() =>
      recommendPreflop(viewAfter(4, [], [1, 2, 3, 4, 5, 6, 7, 8, 9]), { chart: coChart }),
    ).toThrow(new RangeError('The 6-max chart does not fit 9 dealt-in seats'));
    expect(() => recommendPreflop(viewAfter(1, [], [1, 2]), { chart: coChart })).toThrow(
      new RangeError('The 6-max chart does not fit 2 dealt-in seats'),
    );
    expect(() =>
      recommendPreflop(co, { chart: oneSpotChart('UTG', 'unopened', cell('raise')) }),
    ).toThrow(new RangeError('Chart 6-max has no spot CO unopened'));
    expect(() => recommendPreflop({ ...co, legalActions: [] }, { chart: coChart })).toThrow(
      new Error('No legal call for seat 6'),
    );

    const views = [capped, co, bb].map((view) => ({
      ...view,
      holeCards: parseCards('Ah Kd') as [Card, Card],
    }));
    const start = cpuNowMs();
    for (let i = 0; i < 10_000; i++) recommendPreflop(views[i % 3] as PlayerView);
    expect(cpuNowMs() - start).toBeLessThan(1000);
  });

  it('maps every seat at sizes 2 to 10', () => {
    expect([2, 3, 7, 8, 10].map(referenceSizeOf)).toEqual([
      'heads-up',
      '6-max',
      '6-max',
      'full-ring',
      'full-ring',
    ]);
    for (const n of [1, 11, 0]) {
      expect(() => referenceSizeOf(n)).toThrow(
        new RangeError(`No reference size for ${n} dealt-in seats`),
      );
    }

    // Positions by seats after the button: index 0 = the button, 1 = the next seat, and so on.
    const fromButton: Record<number, Position[]> = {
      2: ['BTN', 'BB'],
      3: ['BTN', 'SB', 'BB'],
      4: ['BTN', 'SB', 'BB', 'CO'],
      5: ['BTN', 'SB', 'BB', 'HJ', 'CO'],
      6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
      7: ['BTN', 'SB', 'BB', 'UTG', 'UTG', 'HJ', 'CO'],
      8: ['BTN', 'SB', 'BB', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'],
      9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'],
      10: ['BTN', 'SB', 'BB', 'UTG', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'],
    };
    for (let n = 2; n <= 10; n++) {
      const all = Array.from({ length: 10 }, (_, i) => (i + 1) as SeatNumber);
      // Seats 1..n, and the last n seats (empty seats before them), with every seat as the button.
      for (const seats of [all.slice(0, n), all.slice(10 - n)]) {
        for (let b = 0; b < n; b++) {
          const got = seats.map((seat) => positionOf(viewAfter(seat, [], seats, seats[b])));
          const want = seats.map((_, j) => fromButton[n]?.[(j - b + n) % n]);
          expect(got, `${n} seats ${seats.join(',')} button ${seats[b]}`).toEqual(want);
        }
      }
    }
    // Explicit sizes override the dealt-in count's chart.
    const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9] as SeatNumber[];
    expect(positionOf(viewAfter(4, [], nine), '6-max')).toBe('UTG');
    expect(positionOf(viewAfter(6, [], nine), '6-max')).toBe('UTG');
    expect(positionOf(viewAfter(7, [], nine), '6-max')).toBe('UTG');
    expect(positionOf(viewAfter(8, [], nine), '6-max')).toBe('HJ');

    // A-3: the earliest-mapped seat facing a limp reads the limpers spot one seat later.
    const sevenLimp = viewAfter(5, [c(4, 4)], [1, 2, 3, 4, 5, 6, 7]);
    expect(positionOf(sevenLimp)).toBe('UTG');
    expect(chartSpotOf(sevenLimp)).toEqual({ position: 'HJ', situation: 'limpers' });
    const tenLimp = viewAfter(5, [c(4, 4)], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(positionOf(tenLimp)).toBe('UTG');
    expect(chartSpotOf(tenLimp)).toEqual({ position: 'UTG+1', situation: 'limpers' });
    for (const view of [sevenLimp, tenLimp]) {
      const rec = recommendPreflop(view);
      expect(rec.position).toBe(chartSpotOf(view).position);
      expect(rec.cell).toEqual(
        chartCell(PREFLOP_CHARTS[rec.referenceSize], rec.position, rec.situation, rec.handClass),
      );
    }
    // Spots that exist keep their own position.
    expect(chartSpotOf(viewAfter(4, [], [1, 2, 3, 4, 5, 6, 7]))).toEqual({
      position: 'UTG',
      situation: 'unopened',
    });
    expect(chartSpotOf(viewAfter(6, [c(4, 4), f(5)], [1, 2, 3, 4, 5, 6, 7, 8, 9]))).toEqual({
      position: 'MP',
      situation: 'limpers',
    });
  });

  it('remaps only a missing limpers spot', () => {
    // The heads-up chart read at 6 seats has no SB unopened or BTN raise-and-calls spot; they are not moved to
    // another position.
    const sbUnopened = viewAfter(2, [f(4), f(5), f(6), f(1)]);
    expect(chartSpotOf(sbUnopened, 'heads-up')).toEqual({ position: 'SB', situation: 'unopened' });
    const btnRaiseAndCalls = viewAfter(1, [r(4, 8), c(5, 8), f(6)]);
    expect(chartSpotOf(btnRaiseAndCalls, 'heads-up')).toEqual({
      position: 'BTN',
      situation: 'raise-and-calls',
    });
  });
});
