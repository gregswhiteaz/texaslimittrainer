// TASK-7.39 SPEC-02: reusing an identical calling-range run leaves the default advice byte-identical.
import { describe, expect, it } from 'vitest';
import { computeEquity } from '../../src/advice/equity';
import { recommendPostflop, type PostflopOptions } from '../../src/advice/postflop';
import { ACTION_RANGE_ADVICE } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';

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

const SIX_MAX_THREE_WAY: Step[] = [
  [4, 'fold'],
  [5, 'fold'],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];
const VIEWS: [string, PlayerView][] = [
  [
    'actions spot: 6-max flop facing a bet, one opponent',
    viewAfter(6, [
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'raise', 8],
      [2, 'fold'],
      [3, 'call', 4],
      [3, 'check'],
      [1, 'bet', 4],
    ]),
  ],
  [
    'HU flop facing a bet',
    viewAfter(3, [
      [1, 'fold'],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
    ]),
  ],
  ['6-max flop vs 3 opponents', viewAfter(6, [...SIX_MAX_THREE_WAY, [2, 'bet', 4]])],
  [
    '6-max turn facing a bet after an opponent checked',
    viewAfter(6, [
      ...SIX_MAX_THREE_WAY,
      [2, 'check'],
      [3, 'check'],
      [6, 'check'],
      [1, 'check'],
      [2, 'check'],
      [3, 'bet', 8],
    ]),
  ],
];
const MODES: [string, PostflopOptions][] = [
  ['actions', ACTION_RANGE_ADVICE],
  ['unseen', { opponentRanges: 'unseen' }],
];

describe('TASK-7.39 calling-range run reuse', () => {
  it('default advice equals the two-run advice below 7 opponents', () => {
    for (const [name, view] of VIEWS) {
      for (const [mode, opts] of MODES) {
        const advice = recommendPostflop(view, opts);
        expect(advice.opponents, name).toBeLessThan(7);
        expect(advice, `${name} (${mode})`).toEqual(
          recommendPostflop(view, { ...opts, equity: computeEquity }),
        );
      }
    }
  });
});
