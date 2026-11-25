import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { gradeDecision, gradeView } from '../../src/advice/grade';
import { recommendPostflop, toPct } from '../../src/advice/postflop';
import { recommend } from '../../src/advice/recommend';
import { decideCallingStation } from '../../src/bots/calling-station';
import { decideManiac } from '../../src/bots/maniac';
import { decideRock } from '../../src/bots/rock';
import { BOT_ADVICE, BOT_EQUITY, decideTag } from '../../src/bots/tag';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import { HEALTHY_RANGES } from '../../src/stats/healthy-ranges';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats,
  type StyleCounts,
} from '../../src/stats/style-stats';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const SLOW_TIMEOUT_MS = 600_000;
const FAST_TIMEOUT_MS = 60_000;
/** SPEC-07's fast-check WTSD band: well below the old ~94% and around the 6-max healthy range. */
const FAST_WTSD_LOW = 30;
const FAST_WTSD_HIGH = 50;

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ORDERED_DECK: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];
const r = (seat: SeatNumber, amount: number): Step => [seat, 'raise', amount];

/** Six seats, button 1. Hero seat 3's hole cards sit at deck positions 1 and 7; the flop at 13-15, the turn at 17. */
function deckFor(hero: string, board: string): Card[] {
  const positions = [1, 7, 13, 14, 15, 17];
  const placed = new Map(parseCards(`${hero} ${board}`).map((card, i) => [positions[i], card]));
  const rest = ORDERED_DECK.filter((card) => ![...placed.values()].includes(card));
  return ORDERED_DECK.map((_, i) => placed.get(i) ?? (rest.shift() as Card));
}

function heroView(
  steps: Step[],
  deck: readonly Card[] = ORDERED_DECK,
  stacks: Partial<Record<SeatNumber, number>> = {},
): PlayerView {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: ([1, 2, 3, 4, 5, 6] as const).map((seat) => ({ seat, stack: stacks[seat] ?? 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return playerView(state, 3);
}

/** An equity function that always reports `equity` for the hero. */
const fixedEquity =
  (equity: number) =>
  (input: EquityInput): EquityResult => ({
    hero: { win: equity, tie: 0, equity },
    opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
    method: 'exact',
    trials: 1,
  });

/** `whole` for the first (whole-range) run, `calling` for every later run. */
function byRun(whole: number, calling: number) {
  let runs = 0;
  return (input: EquityInput): EquityResult => fixedEquity(runs++ === 0 ? whole : calling)(input);
}

/** Button 1 to act after 4, 5 and 6 fold; it limps, the small blind completes and the big blind checks. */
const LIMPED: Step[] = [f(4), f(5), f(6), c(1, 4), c(2, 2), k(3)];
/** SPEC-03: four see the flop (pot 16); seat 2 bets 4, the hero and seat 1 call, seat 6 folds (pot 28); seat 2 bets
 *  8 on the turn, so the hero faces 8 into 36. */
const PRICE_PREFLOP: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const PRICE_TURN: Step[] = [...PRICE_PREFLOP, b(2, 4), c(3, 4), f(6), c(1, 4), b(2, 8)];

/** SPEC-02: UTG (seat 4) raises and the big blind (hero) calls; the hero calls a flop bet and faces a turn bet. */
const UTG_LINE: Step[] = [
  r(4, 8),
  f(5),
  f(6),
  f(1),
  f(2),
  c(3, 4),
  k(3),
  b(4, 4),
  c(3, 4),
  k(3),
  b(4, 8),
];

function tagStats(hands: number) {
  let counts: StyleCounts = EMPTY_STYLE_COUNTS;
  const onHand = (hand: PlayedHand): void => {
    const { result } = hand.final;
    if (result === null) return;
    const statHand = {
      seats: hand.record.seats,
      actions: hand.final.actions,
      board: hand.final.board,
      result,
    };
    for (const { seat } of hand.record.seats) {
      counts = addStyleCounts(counts, handStyleCounts(statHand, seat));
    }
  };
  const summary = runPlaytest({ hands, seed: 42, size: 6, game: 'cash' }, onHand);
  expect(summary.handsPlayed).toBe(hands);
  expect(summary.violations).toBe(0);
  return styleStats(counts);
}

const tenthsOf = (value: number | null, stat: string): number => {
  expect(value, stat).not.toBeNull();
  return Math.round((value as number) * 10);
};

describe('postflop folding (TASK-7.32)', () => {
  it('bots use action ranges with the typical-player basis', () => {
    expect(BOT_ADVICE).toStrictEqual({ opponentRanges: 'actions' });
    const view = heroView(UTG_LINE, deckFor('5c 5d', 'Kh Qs 8c 2d'));
    expect(view.street).toBe('turn');
    expect(view.toAct).toBe(3);
    const unseen = recommend(view, { equity: BOT_EQUITY });
    const actions = recommend(view, { opponentRanges: 'actions', equity: BOT_EQUITY });
    expect(unseen.action).toBe('call');
    expect(actions.action).toBe('fold');
    expect(actions.basis === 'equity' && actions.opponentBasis).toStrictEqual([
      { seat: 4, observedHands: null, text: 'typical player' },
    ]);
    for (const decide of [decideTag, decideRock, decideCallingStation, decideManiac]) {
      expect(decide(view), decide.name).toStrictEqual(actions.move);
    }
    expect(actions.move).toStrictEqual({ seat: 3, type: 'fold' });
  });

  it('the turn price counts one river big bet', () => {
    const deck = deckFor('7c 2d', 'Kh Qs 9h 4s');
    const turn = recommendPostflop(heroView(PRICE_TURN, deck, { 3: 108 }), {
      equity: fixedEquity(0.22),
    });
    expect(turn).toMatchObject({
      street: 'turn',
      pot: 36,
      callAmount: 8,
      requiredEquityPct: 26.7,
      requiredCountsRiverBet: true,
    });
    const short = recommendPostflop(heroView(PRICE_TURN, deck, { 3: 20 }), {
      equity: fixedEquity(0.22),
    });
    expect(short).toMatchObject({
      pot: 36,
      callAmount: 8,
      requiredEquityPct: 23.1,
      requiredCountsRiverBet: true,
    });
    // Seat 1 is all in after its flop call and seat 2 bets its last 8 on the turn: nobody can bet the river.
    const allIn = recommendPostflop(heroView(PRICE_TURN, deck, { 1: 8, 2: 16 }), {
      equity: fixedEquity(0.22),
    });
    expect(allIn).toMatchObject({
      pot: 36,
      callAmount: 8,
      requiredEquityPct: 18.2,
      requiredCountsRiverBet: false,
    });

    const flop = recommendPostflop(heroView([...LIMPED, k(2), b(3, 4), r(1, 8), f(2)]), {
      equity: fixedEquity(0.22),
    });
    expect(flop.street).toBe('flop');
    expect(flop.requiredEquityPct).toBe(toPct(flop.callAmount / (flop.pot + flop.callAmount)));
    expect(flop.requiredCountsRiverBet).toBe(false);
    const riverSteps: Step[] = [...LIMPED, k(2), k(3), k(1), k(2), k(3), k(1), b(2, 8)];
    const river = recommendPostflop(heroView(riverSteps), { equity: fixedEquity(0.22) });
    expect(river.street).toBe('river');
    expect(river.requiredEquityPct).toBe(toPct(river.callAmount / (river.pot + river.callAmount)));
    expect(river.requiredCountsRiverBet).toBe(false);
  });

  it('value raise needs more than 65 percent and value bet more than 50', () => {
    const facing = heroView([...LIMPED, b(2, 4)]);
    const at65 = recommendPostflop(facing, { equity: byRun(0.3, 0.65) });
    expect(at65.ruleId).not.toBe('value-raise');
    expect(at65).toMatchObject({ ruleId: 'pot-odds-call', valueThresholdPct: 65 });
    const above65 = recommendPostflop(facing, { equity: byRun(0.3, 0.651) });
    expect(above65).toMatchObject({
      ruleId: 'value-raise',
      action: 'raise',
      valueThresholdPct: 65,
    });

    const free = heroView([...LIMPED, k(2)]);
    const above50 = recommendPostflop(free, { equity: byRun(0.3, 0.501) });
    expect(above50).toMatchObject({ ruleId: 'value-bet', action: 'bet', valueThresholdPct: 50 });
    const at50 = recommendPostflop(free, { equity: byRun(0.3, 0.5) });
    expect(at50).toMatchObject({ ruleId: 'check-free', action: 'check', valueThresholdPct: 50 });
  });

  it('grading uses the price and threshold that applied', () => {
    const raised = gradeDecision(
      {
        basis: 'equity',
        action: 'call',
        alternative: null,
        equityPct: 60,
        requiredEquityPct: 20,
        equityVsCallingRangePct: 60,
        valueThresholdPct: 65,
      },
      'raise',
    );
    expect(raised).toMatchObject({ grade: 'minor', ruleId: 'aggression-margin', marginPts: 5 });
    const handBuilt = gradeDecision(
      {
        basis: 'equity',
        action: 'call',
        alternative: null,
        equityPct: 60,
        requiredEquityPct: 20,
        equityVsCallingRangePct: 60,
      },
      'raise',
    );
    expect(handBuilt).toMatchObject({ ruleId: 'aggression-margin', marginPts: 10 });

    const turn = heroView(PRICE_TURN, deckFor('7c 2d', 'Kh Qs 9h 4s'), { 3: 108 });
    const called = gradeView(turn, 'call', { equity: fixedEquity(0.22) });
    expect(called.recommendation).toMatchObject({ action: 'fold', requiredEquityPct: 26.7 });
    expect(called).toMatchObject({ grade: 'minor', ruleId: 'call-fold-margin', marginPts: 4.7 });
  });

  it(
    '2,000 all-TAG hands reach showdown far less often than before',
    () => {
      const stats = tagStats(2_000);
      const wtsd = tenthsOf(stats.wtsd, 'wtsd');
      console.log(`TAG 6-max wtsd (2,000 hands): ${wtsd / 10}`);
      expect(wtsd).toBeGreaterThanOrEqual(FAST_WTSD_LOW * 10);
      expect(wtsd).toBeLessThanOrEqual(FAST_WTSD_HIGH * 10);
      for (const stat of ['vpip', 'pfr'] as const) {
        const tenths = tenthsOf(stats[stat], stat);
        const { low, high } = HEALTHY_RANGES['6-max'][stat];
        expect(tenths, stat).toBeGreaterThanOrEqual(low * 10);
        expect(tenths, stat).toBeLessThanOrEqual(high * 10);
      }
    },
    FAST_TIMEOUT_MS,
  );

  // Opt-in slow (TLH_SLOW_TESTS=1, in `npm run test:slow`): about 2 minutes.
  it.runIf(SLOW)(
    'AC#2 TAG 6-max all five style stats are inside the 6-max healthy ranges (100,000 hands, seed 42)',
    () => {
      const stats = tagStats(100_000);
      for (const stat of ['vpip', 'pfr', 'aggression', 'wtsd', 'wsd'] as const) {
        const tenths = tenthsOf(stats[stat], stat);
        const { low, high } = HEALTHY_RANGES['6-max'][stat];
        console.log(`TAG 6-max ${stat}: ${tenths / 10} (healthy ${low}–${high})`);
        expect(tenths, stat).toBeGreaterThanOrEqual(low * 10);
        expect(tenths, stat).toBeLessThanOrEqual(high * 10);
      }
    },
    SLOW_TIMEOUT_MS,
  );
});
