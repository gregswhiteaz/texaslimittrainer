import { describe, expect, it } from 'vitest';
import { equityWithBudget, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { SIX_MAX_CHART } from '../../src/advice/preflop';
import { BOT_EQUITY, BOT_EQUITY_BUDGET, decideTag } from '../../src/bots/tag';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

/** Seats 1..size, button 1, the given actions applied in order. */
function stateAfter(steps: Action[], size = 6) {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: Array.from({ length: 52 }, (_, i) => i),
  });
  for (const action of steps) {
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return state;
}

/** Button 1: preflop 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check; seat 2 then acts first on the flop. */
const PREFLOP: Action[] = [
  { seat: 4, type: 'fold' },
  { seat: 5, type: 'fold' },
  { seat: 6, type: 'call', amount: 4 },
  { seat: 1, type: 'call', amount: 4 },
  { seat: 2, type: 'call', amount: 2 },
  { seat: 3, type: 'check' },
];
const FLOP_BET: Action[] = [...PREFLOP, { seat: 2, type: 'bet', amount: 4 }];
const FLOP_FREE: Action[] = [...PREFLOP, { seat: 2, type: 'check' }];

function stubEquity(equity: number) {
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

describe('TAG bot units', () => {
  it('bot equity budget and option pass-through', () => {
    const [hero0, hero1, ...board] = parseCards('Ah 5h Kh 9h 2c') as [Card, Card, ...Card[]];
    const range = [parseCards('Qs Qd') as [Card, Card]];
    const input = { hero: [hero0, hero1] as const, board, opponents: [range] };
    expect(BOT_EQUITY_BUDGET).toEqual({ exactLimit: 2_500, trials: 500 });
    expect(BOT_EQUITY(input)).toEqual(equityWithBudget(input, BOT_EQUITY_BUDGET));

    const facing = playerView(stateAfter(FLOP_BET), 3);
    const strong = stubEquity(1);
    expect(decideTag(facing, { equity: strong.fn })).toStrictEqual({
      seat: 3,
      type: 'raise',
      amount: 8,
    });
    expect(strong.calls).toHaveLength(2);
    expect(decideTag(facing, { equity: stubEquity(0).fn })).toStrictEqual({
      seat: 3,
      type: 'fold',
    });

    const free = playerView(stateAfter(FLOP_FREE), 3);
    const weak = stubEquity(0);
    expect(decideTag(free, { equity: weak.fn })).toStrictEqual({ seat: 3, type: 'check' });
    expect(weak.calls).toHaveLength(2);
    expect(decideTag(free, { equity: stubEquity(1).fn })).toStrictEqual({
      seat: 3,
      type: 'bet',
      amount: 4,
    });

    const preflop = playerView(stateAfter([]), 4);
    const neverPreflop = stubEquity(1);
    expect(preflop.legalActions).toContainEqual(decideTag(preflop, { equity: neverPreflop.fn }));
    expect(neverPreflop.calls).toHaveLength(0);
  });

  it('propagates advice errors', () => {
    expect(() => decideTag(playerView(stateAfter([]), 3))).toThrow(
      new RangeError('Seat 3 is not to act'),
    );
    expect(() => decideTag(playerView(stateAfter(FLOP_BET), 6))).toThrow(
      new RangeError('Seat 6 is not to act'),
    );
    const nine = stateAfter([], 9);
    expect(() =>
      decideTag(playerView(nine, nine.toAct as SeatNumber), { chart: SIX_MAX_CHART }),
    ).toThrow(new RangeError('The 6-max chart does not fit 9 dealt-in seats'));
  });
});
