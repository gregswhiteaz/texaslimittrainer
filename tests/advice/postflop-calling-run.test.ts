// TASK-7.39: the default calling-range run (reuse, reduced budget at 7+ opponents) and the untouched injected seam.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeEquity,
  equityWithBudget,
  type EquityInput,
  type EquityResult,
} from '../../src/advice/equity';
import { CALLING_RANGE_BUDGET, recommendPostflop, toPct } from '../../src/advice/postflop';
import { callingRange, estimateOpponentRanges, unseenCombos } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';

vi.mock('../../src/advice/equity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/advice/equity')>();
  return {
    ...actual,
    computeEquity: vi.fn(actual.computeEquity),
    equityWithBudget: vi.fn(actual.equityWithBudget),
  };
});

type Step = [SeatNumber, Action['type'], number?];

/** Button 1, ordered deck; plays `steps` and returns the view of the seat then to act. */
function viewAfter(seats: number, steps: Step[]): PlayerView {
  let state = createHand({
    stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
    seats: Array.from({ length: seats }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: Array.from({ length: 52 }, (_, i) => i),
  });
  for (const [seat, type, amount] of steps) {
    const result = applyAction(
      state,
      (amount === undefined ? { seat, type } : { seat, type, amount }) as Action,
    );
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return playerView(state, state.toAct as SeatNumber);
}

/** `seats` seats limp preflop; on the flop the SB (2) bets and the BB (3) faces seats - 1 opponents. */
const limpedFacingBet = (seats: number) =>
  viewAfter(seats, [
    ...Array.from({ length: seats - 3 }, (_, i): Step => [(i + 4) as SeatNumber, 'call', 4]),
    [1, 'call', 4],
    [2, 'call', 2],
    [3, 'check'],
    [2, 'bet', 4],
  ]);

const ACTIONS_SPOT = viewAfter(6, [
  [4, 'fold'],
  [5, 'fold'],
  [6, 'fold'],
  [1, 'raise', 8],
  [2, 'fold'],
  [3, 'call', 4],
  [3, 'check'],
  [1, 'bet', 4],
]);
const HU_FACING_BET = viewAfter(3, [
  [1, 'fold'],
  [2, 'call', 2],
  [3, 'check'],
  [2, 'bet', 4],
]);
const NINE_SEAT = limpedFacingBet(9);
const UNSEEN = { opponentRanges: 'unseen' } as const;
const computeCalls = () => vi.mocked(computeEquity).mock.calls;
const budgetCalls = () => vi.mocked(equityWithBudget).mock.calls;

beforeEach(() => vi.clearAllMocks());

describe('TASK-7.39 default calling-range run', () => {
  it('an identical calling-range run is not repeated', () => {
    const [opponent] = estimateOpponentRanges(ACTIONS_SPOT);
    expect(callingRange(opponent?.combos ?? [], ACTIONS_SPOT.board)).toHaveLength(
      opponent?.combos.length ?? -1,
    );
    vi.clearAllMocks();
    const advice = recommendPostflop(ACTIONS_SPOT, ACTION_RANGE_ADVICE);
    expect(computeCalls()).toHaveLength(1);
    expect(budgetCalls()).toHaveLength(0);
    expect(advice.equityVsCallingRangePct).toBe(advice.equityPct);
    vi.clearAllMocks();
    recommendPostflop(HU_FACING_BET, UNSEEN);
    expect(computeCalls()).toHaveLength(2);
    expect(budgetCalls()).toHaveLength(0);
  });

  it('injected equity seams are untouched', () => {
    for (const [view, opts] of [
      [ACTIONS_SPOT, ACTION_RANGE_ADVICE],
      [NINE_SEAT, UNSEEN],
    ] as const) {
      const inputs: EquityInput[] = [];
      const equity = (input: EquityInput): EquityResult => {
        inputs.push(input);
        return {
          hero: { win: 0.5, tie: 0, equity: 0.5 },
          opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
          method: 'exact',
          trials: 0,
        };
      };
      vi.clearAllMocks();
      recommendPostflop(view, { ...opts, equity });
      expect(inputs).toHaveLength(2);
      expect(inputs[1]?.opponents).toEqual(
        inputs[0]?.opponents.map((r) => callingRange(r, view.board)),
      );
      expect(inputs[1]?.opponents).not.toBe(inputs[0]?.opponents);
      expect(budgetCalls()).toHaveLength(0);
      expect(computeCalls()).toHaveLength(0);
    }
  });

  it('7+ opponents use the reduced calling budget', () => {
    const { holeCards: hero, board } = NINE_SEAT;
    const unseen = unseenCombos([...hero, ...board]);
    const calling = callingRange(unseen, board);
    const advice = recommendPostflop(NINE_SEAT, UNSEEN);
    expect(advice.opponents).toBe(8);
    expect(budgetCalls()).toHaveLength(1);
    expect(budgetCalls()[0]?.[1]).toBe(CALLING_RANGE_BUDGET);
    expect(CALLING_RANGE_BUDGET.trials).toBe(10_000);
    expect(budgetCalls()[0]?.[0].opponents).toEqual(new Array(8).fill(calling));
    const callingOpponents = new Array<typeof calling>(8).fill(calling);
    expect(advice.equityVsCallingRangePct).toBe(
      toPct(
        equityWithBudget({ hero, board, opponents: callingOpponents }, CALLING_RANGE_BUDGET).hero
          .equity,
      ),
    );
    const whole = new Array<typeof unseen>(8).fill(unseen);
    expect(advice.equityPct).toBe(
      toPct(computeEquity({ hero, board, opponents: whole }).hero.equity),
    );

    for (const [seats, reduced] of [
      [8, 1],
      [7, 0],
    ] as const) {
      vi.clearAllMocks();
      expect(recommendPostflop(limpedFacingBet(seats), UNSEEN).opponents).toBe(seats - 1);
      expect(budgetCalls()).toHaveLength(reduced);
    }
  });
});
