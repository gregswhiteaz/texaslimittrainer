import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  computeEquity,
  type EquityInput,
  type EquityResult,
  type HoleCards,
} from '../../src/advice/equity';
import { gradeDecision, gradeView, type EquityGradeInput } from '../../src/advice/grade';
import {
  POSTFLOP_RULE_IDS,
  recommendPostflop,
  VALUE_THRESHOLD_PCT,
  type PostflopRecommendation,
} from '../../src/advice/postflop';
import { callingRange } from '../../src/advice/ranges';
import { recommend } from '../../src/advice/recommend';
import * as callingStationModule from '../../src/bots/calling-station';
import * as maniacModule from '../../src/bots/maniac';
import * as rockModule from '../../src/bots/rock';
import * as tagModule from '../../src/bots/tag';
import { parseCards, type Card } from '../../src/engine/cards';
import { checkStep } from '../../src/engine/invariants';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { runPlaytest } from '../../src/playtest/runner';
import { REPO_ROOT } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;
const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Seat s gets deck[i] and deck[i + 6], i = deal index. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const DEAL_INDEX: Readonly<Record<number, number>> = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 1: 5 };
const FLOP_POSITIONS = [13, 14, 15];
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];
const r = (seat: SeatNumber, amount: number): Step => [seat, 'raise', amount];

/** Everyone folds to the small blind (2), who completes; the big blind (3) checks. Seat 2 acts first on the flop. */
const HEADS_UP: Step[] = [f(4), f(5), f(6), f(1), c(2, 2), k(3)];
/** 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check: pot 16, live seats 1, 2, 3, 6. */
const PREFLOP: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const FLOP_CHECK: Step[] = [...PREFLOP, k(2)];
const FLOP_BET: Step[] = [...PREFLOP, b(2, 4)];
/** Four bets on the flop; seat 3 must call 8 more and cannot raise. */
const FLOP_CAPPED: Step[] = [...PREFLOP, b(2, 4), r(3, 8), r(6, 12), r(1, 16), c(2, 12)];

/** A deck with `seat`'s hole cards and the flop at their deal positions; the rest ascending. */
function spotDeck(seat: SeatNumber, hole: string, flop: string): Card[] {
  const i = DEAL_INDEX[seat] as number;
  const cards = parseCards(`${hole} ${flop}`);
  const positions = [i, i + 6, ...FLOP_POSITIONS];
  const fixed = new Map(cards.map((card, j) => [positions[j] as number, card]));
  const filler = ALL_CARDS.filter((card) => !cards.includes(card));
  return Array.from({ length: 52 }, (_, p) => fixed.get(p) ?? (filler.shift() as Card));
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

const combos = (text: string): HoleCards[] =>
  text.split(' ').map((pair) => parseCards(pair.replace(/(..)(..)/, '$1 $2')) as [Card, Card]);

/** The AC#1 opponent range on Ks 8d 7c. */
const RANGE = combos('KhKd 8h7h AhKh 9h9d 6h5h Th9h QhJh Ac2c');
const BOARD = parseCards('Ks 8d 7c');
const sameCombo = (x: HoleCards, y: HoleCards) =>
  (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0]);

/** computeEquity with every opponent range limited to RANGE: exact equity against that estimated range. */
function limitedToRange(input: EquityInput): EquityResult {
  const opponents = input.opponents.map((range) =>
    range.filter((combo) => RANGE.some((x) => sameCombo(x, combo))),
  );
  return computeEquity({ ...input, opponents });
}

const fixed = (input: EquityInput, equity: number): EquityResult => ({
  hero: { win: equity, tie: 0, equity },
  opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
  method: 'exact',
  trials: 1,
});

/** `whole` for the first (whole-range) run and `calling` for the calling-range run; records every input. */
function byRun(whole: number, calling: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return fixed(input, calls.length === 1 ? whole : calling);
  };
  return { fn, calls };
}

/** The heads-up flop Ks 8d 7c with the small blind (seat 2) first to act holding `hole`. */
const headsUp = (hole: string) => viewAt(2, spotDeck(2, hole, 'Ks 8d 7c'), HEADS_UP);

const TASK_7_3_KEYS = [
  'basis',
  'street',
  'action',
  'alternative',
  'move',
  'ruleId',
  'equityPct',
  'requiredEquityPct',
  'callAmount',
  'pot',
  'opponents',
  'equityMethod',
];

/** A random real postflop view from a 6-max hand (random legal moves, no folds). */
const realViews = () =>
  fc
    .tuple(
      fc.shuffledSubarray([...ALL_CARDS], { minLength: 52, maxLength: 52 }),
      fc.array(fc.nat(), { minLength: 40, maxLength: 40 }),
      fc.nat({ max: 11 }),
    )
    .map(([deck, choices, stopAt]) => {
      let state = stateAfter(deck, []);
      let postflopDecisions = 0;
      let step = 0;
      while (state.toAct !== null) {
        if (state.street !== 'preflop') {
          if (postflopDecisions === stopAt) break;
          postflopDecisions++;
        }
        const options = legalActions(state).filter((a) => a.type !== 'fold');
        const action = options[(choices[step++] ?? 0) % options.length] as Action;
        const result = applyAction(state, action);
        if (!result.ok) throw new Error(result.error.message);
        state = result.state;
      }
      return state.toAct === null ? null : playerView(state, state.toAct);
    })
    .filter((view): view is PlayerView => view !== null);

/** The D-1 rule for a recommendation's own numbers. */
function expectedRule(view: PlayerView, advice: PostflopRecommendation): string {
  const value =
    view.legalActions.some((a) => a.type === 'bet' || a.type === 'raise') &&
    Math.round(advice.equityVsCallingRangePct * 10) > VALUE_THRESHOLD_PCT * 10;
  if (advice.callAmount === 0) return value ? 'value-bet' : 'check-free';
  if (value) return 'value-raise';
  return advice.equityPct >= advice.requiredEquityPct ? 'pot-odds-call' : 'pot-odds-fold';
}

describe('value bet and raise acceptance (TASK-7.8)', () => {
  it('AC#1 the range that would call drops the Air combos', () => {
    expect(callingRange(RANGE, BOARD)).toEqual(combos('KhKd 8h7h AhKh 9h9d 6h5h Th9h'));
  });

  it('AC#2 8s8c bets for value at 72.8%', () => {
    const view = headsUp('8s 8c');
    expect(view.street).toBe('flop');
    expect(view.board).toEqual(BOARD);
    const advice = recommendPostflop(view, { equity: limitedToRange });
    expect(advice).toMatchObject({
      action: 'bet',
      ruleId: 'value-bet',
      equityVsCallingRangePct: 72.8,
      equityPct: 78.9,
      requiredEquityPct: 0,
      opponents: 1,
    });
    expect(advice.move).toStrictEqual({ seat: 2, type: 'bet', amount: 4 });
  });

  it('AC#3 AsKc at 48.9% vs callers does not bet', () => {
    const advice = recommendPostflop(headsUp('As Kc'), { equity: limitedToRange });
    expect(advice).toMatchObject({
      action: 'check',
      ruleId: 'check-free',
      equityVsCallingRangePct: 48.9,
      equityPct: 60.7,
    });
    expect(advice.ruleId).not.toBe('value-bet');
  });

  it('AC#4 50.1% against callers bets', () => {
    const view = viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_CHECK);
    for (const whole of [0, 0.3, 0.9]) {
      const advice = recommendPostflop(view, { equity: byRun(whole, 0.501).fn });
      expect(advice).toMatchObject({
        action: 'bet',
        ruleId: 'value-bet',
        equityVsCallingRangePct: 50.1,
      });
      expect(advice.move).toStrictEqual({ seat: 3, type: 'bet', amount: 4 });
    }
  });

  it('AC#5 exactly 50.0% against callers checks', () => {
    const view = viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_CHECK);
    for (const calling of [0.5, 0.50049]) {
      const advice = recommendPostflop(view, { equity: byRun(0.9, calling).fn });
      expect(advice).toMatchObject({
        action: 'check',
        ruleId: 'check-free',
        equityVsCallingRangePct: 50,
      });
      expect(advice.move).toStrictEqual({ seat: 3, type: 'check' });
    }
  });

  it('AC#6 50.1% against callers raises', () => {
    const view = viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_BET);
    expect(view.legalActions.some((a) => a.type === 'raise')).toBe(true);
    const advice = recommendPostflop(view, { equity: byRun(0.1, 0.501).fn });
    expect(advice).toMatchObject({
      action: 'raise',
      ruleId: 'value-raise',
      callAmount: 4,
      pot: 20,
    });
    expect(advice.move).toStrictEqual({ seat: 3, type: 'raise', amount: 8 });
  });

  it('AC#7 capped street calls or folds by pot odds', () => {
    const view = viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_CAPPED);
    expect(view.street).toBe('flop');
    expect(view.betCount).toBe(4);
    expect(view.legalActions.map((a) => a.type)).toEqual(['fold', 'call']);
    const strong = recommendPostflop(view, { equity: (input) => fixed(input, 0.9) });
    expect(strong).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
      equityVsCallingRangePct: 90,
    });
    expect(strong.move).toStrictEqual({ seat: 3, type: 'call', amount: 8 });
    const weak = recommendPostflop(view, { equity: (input) => fixed(input, 0.01) });
    expect(weak).toMatchObject({ action: 'fold', ruleId: 'pot-odds-fold' });
    expect(weak.equityVsCallingRangePct).toBe(1);
  });

  it('AC#8 value advice returns calling-range equity, required equity and rule id', () => {
    const bet = recommendPostflop(viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_CHECK), {
      equity: byRun(0.2, 0.501).fn,
    });
    const raise = recommendPostflop(viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_BET), {
      equity: byRun(0.2, 0.501).fn,
    });
    expect([bet.ruleId, bet.equityVsCallingRangePct, bet.requiredEquityPct]).toEqual([
      'value-bet',
      50.1,
      0,
    ]);
    expect([raise.ruleId, raise.equityVsCallingRangePct, raise.requiredEquityPct]).toEqual([
      'value-raise',
      50.1,
      16.7,
    ]);
    for (const advice of [bet, raise]) {
      for (const pct of [advice.equityVsCallingRangePct, advice.requiredEquityPct]) {
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
        expect(pct).toBe(Math.round(pct * 10) / 10);
      }
    }
  });

  it(
    'AC#9 recommendation keeps existing fields and adds calling-range equity',
    () => {
      fc.assert(
        fc.property(realViews(), (view) => {
          const advice = recommendPostflop(view);
          expect(Object.keys(advice).sort()).toEqual(
            [...TASK_7_3_KEYS, 'equityVsCallingRangePct'].sort(),
          );
          expect(['fold', 'check', 'call', 'bet', 'raise']).toContain(advice.action);
          expect(advice.move.type).toBe(advice.action);
          expect(view.legalActions).toContainEqual(advice.move);
          expect(POSTFLOP_RULE_IDS).toContain(advice.ruleId);
          expect(advice.ruleId).toBe(expectedRule(view, advice));
          const pct = advice.equityVsCallingRangePct;
          expect(pct).toBeGreaterThanOrEqual(0);
          expect(pct).toBeLessThanOrEqual(100);
          expect(pct).toBe(Math.round(pct * 10) / 10);
          const input: EquityGradeInput = advice;
          expect(gradeDecision(input, advice.action)).toMatchObject({
            grade: 'correct',
            ruleId: 'match',
          });
        }),
        { numRuns: 40, seed: 7808 },
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#11 real bet or raise deviations grade by aggression-margin',
    () => {
      const checkSpot = viewAt(3, spotDeck(3, 'Ah 5h', 'Kh 9h 2c'), FLOP_CHECK);
      const real = gradeView(checkSpot, 'bet');
      expect(real.recommendation).toMatchObject({ basis: 'equity', action: 'check' });
      const vsCallers = (real.recommendation as PostflopRecommendation).equityVsCallingRangePct;
      expect(real.ruleId).toBe('aggression-margin');
      expect(real.marginPts).toBe(Math.abs(Math.round(vsCallers * 10) - 500) / 10);

      const betSpot = gradeView(checkSpot, 'check', { equity: byRun(0.3, 0.651).fn });
      expect(betSpot.recommendation).toMatchObject({ action: 'bet', ruleId: 'value-bet' });
      expect(betSpot).toMatchObject({
        grade: 'major',
        ruleId: 'aggression-margin',
        marginPts: 15.1,
      });

      let graded = 0;
      fc.assert(
        fc.property(realViews(), (view) => {
          const advice = recommendPostflop(view);
          const passive = advice.callAmount > 0 ? 'call' : 'check';
          const aggressive = view.legalActions.find((a) => a.type === 'bet' || a.type === 'raise');
          if (aggressive === undefined) return;
          const user =
            advice.action === 'bet' || advice.action === 'raise'
              ? passive
              : advice.action === passive
                ? aggressive.type
                : null;
          if (user === null) return;
          graded++;
          const result = gradeDecision(advice, user);
          expect(result.ruleId).toBe('aggression-margin');
          expect(result.ruleId).not.toBe('aggression-no-range');
        }),
        { numRuns: 40, seed: 7811 },
      );
      expect(graded).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#10 bots drop the free-check stand-in and bet for value',
    () => {
      for (const module of [tagModule, rockModule, maniacModule, callingStationModule]) {
        expect(Object.keys(module)).not.toContain('FREE_CHECK_EQUITY');
      }
      const dir = join(REPO_ROOT, 'src/bots');
      const sources = readdirSync(dir).filter((name) => name.endsWith('.ts'));
      expect(sources).toContain('tag.ts');
      for (const name of sources) {
        expect(readFileSync(join(dir, name), 'utf8')).not.toContain('FREE_CHECK_EQUITY');
      }

      const free = headsUp('8s 8c');
      const bet = recommend(free, { equity: tagModule.BOT_EQUITY }).move;
      expect(bet).toStrictEqual({ seat: 2, type: 'bet', amount: 4 });
      expect(tagModule.decideTag(free)).toStrictEqual(bet);
      expect(rockModule.decideRock(free)).toStrictEqual(bet);
      expect(callingStationModule.decideCallingStation(free)).toStrictEqual(bet);

      const postflop = { bet: 0, raise: 0 };
      const summary = runPlaytest({ hands: 300, seed: 42, size: 6 }, undefined, {
        onAction: (step) => {
          if (step.before.street !== 'preflop' && step.action.type in postflop) {
            postflop[step.action.type as 'bet' | 'raise']++;
          }
          return checkStep(step);
        },
      });
      expect(summary.violations).toBe(0);
      expect(postflop.bet).toBeGreaterThan(0);
      expect(postflop.raise).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );
});
