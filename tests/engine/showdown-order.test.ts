import { describe, expect, it } from 'vitest';
import { createHand, type HandResult, type HandState } from '../../src/engine/hand';
import { fixedDeck, play } from '../support/table-scenarios';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const BOARD = { 13: '2c', 14: '7d', 15: '9h', 17: 'Jc', 19: '3s' };

/** Six seats at $160 unless `stacks` says otherwise, button 6, the board above. */
function deal(hole: Readonly<Record<number, string>>, stacks: Readonly<Record<number, number>>) {
  return createHand({
    stakes: STAKES,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: stacks[seat] ?? 160 })),
    button: 6,
    deck: fixedDeck({ ...hole, ...BOARD }),
  });
}

const resultOf = (state: HandState): HandResult => {
  if (state.result === null) throw new Error('hand not complete');
  return state.result;
};
const stacksOf = (state: HandState, seats: readonly number[]) =>
  seats.map((seat) => state.players.find((p) => p.seat === seat)?.stack);

describe('showdown order', () => {
  it('a short all-in raise on the river makes its seat show first', () => {
    const end = play(
      deal({ 1: 'Kh', 7: 'Kd', 4: '4h', 10: '4s' }, { 5: 15 }),
      '3:fold 4:fold 5:call 6:fold 1:fold 2:check' +
        ' 2:check 5:check'.repeat(2) +
        ' 2:bet 5:raise 2:call',
    );
    const raise = end.actions.at(-2);
    expect(raise).toMatchObject({ street: 'river', seat: 5, type: 'raise', amount: 11 });
    expect(resultOf(end).showdown.map((s) => s.seat)).toEqual([5, 2]);
    expect(resultOf(end).awards).toEqual([
      { pot: 0, amount: 32, winners: [{ seat: 2, amount: 32 }] },
    ]);
    expect(stacksOf(end, [2, 5])).toEqual([177, 0]);
  });

  it('a pot only one seat can win is awarded without a show', () => {
    const end = play(
      deal({ 2: 'Ah', 8: 'As', 4: 'Kh', 10: 'Ks' }, { 3: 6 }),
      '3:call 4:fold 5:call 6:fold 1:fold 2:check 2:bet 3:call 5:raise 2:call 2:check 5:bet 2:fold',
    );
    const result = resultOf(end);
    expect(result.showdown.map((s) => s.seat)).toEqual([3]);
    expect(result.returned).toEqual({ seat: 5, amount: 8 });
    expect(result.awards).toEqual([
      { pot: 0, amount: 20, winners: [{ seat: 3, amount: 20 }] },
      { pot: 1, amount: 12, winners: [{ seat: 5, amount: 12 }] },
    ]);
    expect(stacksOf(end, [2, 3, 5])).toEqual([148, 20, 160]);
  });

  it('a runout with no river betting starts left of the button', () => {
    const end = play(
      deal({ 2: '4h', 8: '4s', 4: 'Kh', 10: 'Ks' }, { 3: 8 }),
      '3:call 4:fold 5:raise 6:fold 1:fold 2:fold 3:call',
    );
    expect(end.actions.some((a) => a.street === 'river')).toBe(false);
    expect(resultOf(end).showdown.map((s) => s.seat)).toEqual([3, 5]);
    expect(resultOf(end).awards).toEqual([
      { pot: 0, amount: 22, winners: [{ seat: 5, amount: 22 }] },
    ]);
    expect(stacksOf(end, [3, 5])).toEqual([0, 174]);
  });
});
