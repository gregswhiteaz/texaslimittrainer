import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import {
  gradeDecision,
  gradeView,
  type ActionType,
  type ChartGradeInput,
  type EquityGradeInput,
  type Grade,
} from '../../src/advice/grade';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Hole cards go to deck[i] and deck[i + 6]. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
/** Deal index of each seat: SB 2 → 0, BB 3 → 1, UTG 4 → 2, … BTN 1 → 5. */
const DEAL_INDEX: Readonly<Record<number, number>> = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 1: 5 };
const FLOP_POSITIONS = [13, 14, 15];
const TURN_POSITION = 17;
const RIVER_POSITION = 19;
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];

/** 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check; flop checked round; 2 bets the turn. */
const TURN_BET: Step[] = [
  f(4),
  f(5),
  c(6, 4),
  c(1, 4),
  c(2, 2),
  k(3),
  k(2),
  k(3),
  k(6),
  k(1),
  b(2, 8),
];
/** Folded to the blinds; SB 2 completes, BB 3 checks; 2 bets the flop. Heads-up. */
const HEADS_UP_FLOP_BET: Step[] = [f(4), f(5), f(6), f(1), c(2, 2), k(3), b(2, 4)];

/** Positions holding `seat`'s hole cards. */
const holePositions = (seat: SeatNumber): number[] => {
  const i = DEAL_INDEX[seat] as number;
  return [i, i + 6];
};

/** Cards at fixed deal positions: each entry is [positions, cards]. */
function fixedCards(entries: [number[], string][]): Map<number, Card> {
  const fixed = new Map<number, Card>();
  for (const [positions, text] of entries) {
    parseCards(text).forEach((card, i) => fixed.set(positions[i] as number, card));
  }
  return fixed;
}

/** A deck with `fixed[position] = card`; the remaining cards fill the other positions in order. */
function deckWith(fixed: ReadonlyMap<number, Card>, rest?: readonly Card[]): Card[] {
  const used = new Set(fixed.values());
  const filler = [...(rest ?? ALL_CARDS.filter((card) => !used.has(card)))];
  return Array.from({ length: 52 }, (_, i) => fixed.get(i) ?? (filler.shift() as Card));
}

function play(state: HandState, steps: Step[]): HandState {
  let current = state;
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    current = result.state;
  }
  return current;
}

function stateAfter(deck: readonly Card[], steps: Step[]): HandState {
  const start = createHand({
    stakes: STAKES_4_8,
    seats: SEATS.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck,
  });
  return play(start, steps);
}

/** An equity function that always reports `equity` for the hero and counts its calls. */
function fixedEquity(equity: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: equity, tie: 0, equity },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'sampled',
      trials: 1,
    };
  };
  return { fn, calls };
}

const chart = (
  action: ActionType,
  alternative: ActionType | null,
  borderline: boolean,
): ChartGradeInput => ({ basis: 'chart', action, alternative, borderline });

const equity = (
  action: ActionType,
  numbers: Partial<Omit<EquityGradeInput, 'basis' | 'action'>> = {},
): EquityGradeInput => ({
  basis: 'equity',
  action,
  alternative: null,
  equityPct: 50,
  requiredEquityPct: 0,
  ...numbers,
});

/** [grade, marginPts] for each case. */
const outcomes = (cases: [EquityGradeInput, ActionType][]): [Grade, number | null][] =>
  cases.map(([rec, user]) => {
    const result = gradeDecision(rec, user);
    return [result.grade, result.marginPts];
  });

/** UTG (seat 4) preflop view, unopened, holding `hand`. */
const utgView = (hand: string) =>
  playerView(stateAfter(deckWith(fixedCards([[holePositions(4), hand]])), []), 4);

describe('grade acceptance', () => {
  it('AC#1 matching the recommended action or the acceptable alternative is Correct', () => {
    const preflop = chart('raise', 'call', false);
    const postflop = equity('call', { alternative: 'raise', equityPct: 30, requiredEquityPct: 20 });
    for (const rec of [preflop, postflop]) {
      const match = gradeDecision(rec, rec.action);
      expect(match).toStrictEqual({
        grade: 'correct',
        ruleId: 'match',
        userAction: rec.action,
        marginPts: null,
        recommendation: rec,
      });
      expect(match.recommendation).toBe(rec);
      const alternative = gradeDecision(rec, rec.alternative as ActionType);
      expect(alternative).toStrictEqual({
        grade: 'correct',
        ruleId: 'alternative',
        userAction: rec.alternative,
        marginPts: null,
        recommendation: rec,
      });
      expect(alternative.recommendation).toBe(rec);
    }

    const real = gradeView(utgView('As Ad'), 'raise');
    expect(real.recommendation).toMatchObject({ basis: 'chart', action: 'raise' });
    expect(real).toMatchObject({ grade: 'correct', ruleId: 'match', marginPts: null });
  });

  it('AC#2 a preflop deviation is Minor on a borderline cell and Major otherwise', () => {
    const borderline = chart('raise', null, true);
    const firm = chart('raise', null, false);
    for (const user of ['fold', 'call'] as const) {
      expect(gradeDecision(borderline, user)).toMatchObject({
        grade: 'minor',
        ruleId: 'preflop-borderline',
        marginPts: null,
      });
      expect(gradeDecision(firm, user)).toMatchObject({
        grade: 'major',
        ruleId: 'preflop-chart',
        marginPts: null,
      });
    }

    const k9s = gradeView(utgView('Kh 9h'), 'call');
    expect(k9s.recommendation).toMatchObject({ action: 'raise', borderline: true });
    expect(k9s).toMatchObject({ grade: 'minor', ruleId: 'preflop-borderline' });
    const aces = gradeView(utgView('As Ad'), 'fold');
    expect(aces.recommendation).toMatchObject({ action: 'raise', borderline: false });
    expect(aces).toMatchObject({ grade: 'major', ruleId: 'preflop-chart' });
    const junk = gradeView(utgView('7c 2d'), 'raise');
    expect(junk.recommendation).toMatchObject({ action: 'fold', borderline: false });
    expect(junk).toMatchObject({ grade: 'major', ruleId: 'preflop-chart' });
  });

  it('AC#3 folding with equity 0.1, 9.9 and 10.0 points above required is Minor, Minor, Major', () => {
    const cases = [16.8, 26.6, 26.7].map((equityPct): [EquityGradeInput, ActionType] => [
      equity('call', { equityPct, requiredEquityPct: 16.7 }),
      'fold',
    ]);
    expect(outcomes(cases)).toEqual([
      ['minor', 0.1],
      ['minor', 9.9],
      ['major', 10],
    ]);
    for (const [rec, user] of cases) {
      expect(gradeDecision(rec, user).ruleId).toBe('call-fold-margin');
    }
  });

  it('AC#4 calling with equity 0.1, 9.9 and 10.0 points below required is Minor, Minor, Major', () => {
    const cases = [33.2, 23.4, 23.3].map((equityPct): [EquityGradeInput, ActionType] => [
      equity('fold', { equityPct, requiredEquityPct: 33.3 }),
      'call',
    ]);
    expect(outcomes(cases)).toEqual([
      ['minor', 0.1],
      ['minor', 9.9],
      ['major', 10],
    ]);
    for (const [rec, user] of cases) {
      expect(gradeDecision(rec, user).ruleId).toBe('call-fold-margin');
    }
  });

  it('AC#5 checking or calling at 64.9% and 65.0% against the calling range is Minor then Major', () => {
    for (const [recommended, user] of [
      ['bet', 'check'],
      ['raise', 'call'],
    ] as const) {
      const cases = [64.9, 65.0].map((pct): [EquityGradeInput, ActionType] => [
        equity(recommended, { equityVsCallingRangePct: pct }),
        user,
      ]);
      expect(outcomes(cases)).toEqual([
        ['minor', 14.9],
        ['major', 15],
      ]);
      for (const [rec, u] of cases) {
        expect(gradeDecision(rec, u).ruleId).toBe('aggression-margin');
      }
    }
  });

  it('AC#6 betting or raising at 35.1% and 35.0% against the calling range is Minor then Major', () => {
    for (const [recommended, user] of [
      ['check', 'bet'],
      ['call', 'raise'],
    ] as const) {
      const cases = [35.1, 35.0].map((pct): [EquityGradeInput, ActionType] => [
        equity(recommended, { equityVsCallingRangePct: pct }),
        user,
      ]);
      expect(outcomes(cases)).toEqual([
        ['minor', 14.9],
        ['major', 15],
      ]);
      for (const [rec, u] of cases) {
        expect(gradeDecision(rec, u).ruleId).toBe('aggression-margin');
      }
    }
  });

  it('AC#7 a Major call is still Major when the river makes the user win', () => {
    const deck = deckWith(
      fixedCards([
        [holePositions(3), 'Ah 5h'],
        [holePositions(2), 'Kc Kd'],
        [[...FLOP_POSITIONS, TURN_POSITION, RIVER_POSITION], 'Kh 9h 2c 7d Qh'],
      ]),
    );
    const turnState = stateAfter(deck, TURN_BET);
    const turnView = playerView(turnState, 3);
    const stub = fixedEquity(0.05);
    const first = gradeView(turnView, 'call', { equity: stub.fn });
    expect(first.recommendation).toMatchObject({
      basis: 'equity',
      action: 'fold',
      equityPct: 5,
      requiredEquityPct: 25,
    });
    expect(first).toMatchObject({ grade: 'major', ruleId: 'call-fold-margin', marginPts: 20 });
    // Whole-range run, then the calling-range run (TASK-7.8).
    expect(stub.calls).toHaveLength(2);

    const end = play(turnState, [c(3, 8), f(6), f(1), k(2), k(3)]);
    expect(end.board).toEqual(parseCards('Kh 9h 2c 7d Qh'));
    expect(end.result?.endedBy).toBe('showdown');
    expect(end.result?.awards).toStrictEqual([
      { pot: 0, amount: 32, winners: [{ seat: 3, amount: 32 }] },
    ]);

    expect(gradeView(turnView, 'call', { equity: fixedEquity(0.05).fn })).toStrictEqual(first);
    // @ts-expect-error gradeView accepts only a PlayerView, never the full HandState
    expect(() => gradeView(turnState, 'call')).toThrow();

    const fixed = fixedCards([
      [holePositions(3), 'Ah 5h'],
      [FLOP_POSITIONS, 'Kh 9h 2c'],
    ]);
    const others = ALL_CARDS.filter((card) => ![...fixed.values()].includes(card));
    const base = gradeView(playerView(stateAfter(deckWith(fixed), HEADS_UP_FLOP_BET), 3), 'raise');
    expect(base.recommendation).toMatchObject({ basis: 'equity', opponents: 1 });
    fc.assert(
      fc.property(
        fc.shuffledSubarray(others, { minLength: others.length, maxLength: others.length }),
        (permuted) => {
          const view = playerView(stateAfter(deckWith(fixed, permuted), HEADS_UP_FLOP_BET), 3);
          expect(gradeView(view, 'raise')).toStrictEqual(base);
        },
      ),
      { numRuns: 50, seed: 7404 },
    );
  });

  it('AC#8 raise-versus-fold deviations use the 10-point call-fold margin', () => {
    const cases: [EquityGradeInput, ActionType][] = [
      [equity('fold', { equityPct: 10.1, requiredEquityPct: 20 }), 'raise'],
      [equity('fold', { equityPct: 10.0, requiredEquityPct: 20 }), 'raise'],
      [equity('raise', { equityPct: 29.9, requiredEquityPct: 20 }), 'fold'],
      [equity('raise', { equityPct: 30.0, requiredEquityPct: 20 }), 'fold'],
    ];
    expect(outcomes(cases)).toEqual([
      ['minor', 9.9],
      ['major', 10],
      ['minor', 9.9],
      ['major', 10],
    ]);
    for (const [rec, user] of cases) {
      expect(gradeDecision(rec, user).ruleId).toBe('call-fold-margin');
    }
  });

  it('exact 10-point and 15-point boundaries in both rounding directions', () => {
    const cases: [EquityGradeInput, ActionType, Grade][] = [
      // Raw float difference just below 10.
      [equity('call', { equityPct: 16.4, requiredEquityPct: 6.4 }), 'fold', 'major'],
      [equity('fold', { equityPct: 23.3, requiredEquityPct: 33.3 }), 'call', 'major'],
      [equity('fold', { equityPct: 23.3, requiredEquityPct: 33.3 }), 'raise', 'major'],
      // Raw float difference just above 10, and its 9.9 neighbour.
      [equity('call', { equityPct: 16.6, requiredEquityPct: 6.6 }), 'fold', 'major'],
      [equity('raise', { equityPct: 16.6, requiredEquityPct: 6.6 }), 'fold', 'major'],
      [equity('call', { equityPct: 16.5, requiredEquityPct: 6.6 }), 'fold', 'minor'],
      // Inputs off the one-decimal grid.
      [equity('call', { equityPct: 26.66, requiredEquityPct: 16.7 }), 'fold', 'major'],
      [equity('call', { equityPct: 26.64, requiredEquityPct: 16.7 }), 'fold', 'minor'],
      [equity('fold', { equityPct: 6.74, requiredEquityPct: 16.7 }), 'call', 'major'],
      [equity('fold', { equityPct: 6.76, requiredEquityPct: 16.7 }), 'call', 'minor'],
      // Calling-range distance above 50.
      [equity('bet', { equityVsCallingRangePct: 65.0 }), 'check', 'major'],
      [equity('bet', { equityVsCallingRangePct: 64.96 }), 'check', 'major'],
      [equity('bet', { equityVsCallingRangePct: 64.94 }), 'check', 'minor'],
      // Calling-range distance below 50.
      [equity('check', { equityVsCallingRangePct: 35.0 }), 'bet', 'major'],
      [equity('check', { equityVsCallingRangePct: 35.04 }), 'bet', 'major'],
      [equity('check', { equityVsCallingRangePct: 35.06 }), 'bet', 'minor'],
    ];
    expect(cases.map(([rec, user]) => gradeDecision(rec, user).grade)).toEqual(
      cases.map(([, , grade]) => grade),
    );
    expect(gradeDecision(cases[0]?.[0] as EquityGradeInput, 'fold').marginPts).toBe(10);
    expect(gradeDecision(cases[5]?.[0] as EquityGradeInput, 'fold').marginPts).toBe(9.9);
  });
});
