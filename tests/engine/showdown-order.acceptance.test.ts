import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import { createHand, type HandResult, type HandState } from '../../src/engine/hand';
import { playerView, showdownOf } from '../../src/engine/player-view';
import { fixedDeck, play } from '../support/table-scenarios';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Board 2c 7d 9h Jc 3s at its six-seat deck indexes. */
const BOARD = { 13: '2c', 14: '7d', 15: '9h', 17: 'Jc', 19: '3s' };

function deal(
  button: number,
  hole: Readonly<Record<number, string>>,
  stacks: Readonly<Record<number, number>> = {},
): HandState {
  return createHand({
    stakes: STAKES,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: stacks[seat] ?? 160 })),
    button,
    deck: fixedDeck({ ...hole, ...BOARD }),
  });
}

const resultOf = (state: HandState): HandResult => {
  if (state.result === null) throw new Error('hand not complete');
  return state.result;
};
const seatsOf = (state: HandState): number[] => resultOf(state).showdown.map((s) => s.seat);
const stackOf = (state: HandState, seat: number): number | undefined =>
  state.players.find((p) => p.seat === seat)?.stack;
const shownCards = (state: HandState): Card[] =>
  resultOf(state).showdown.flatMap((s) => [...s.holeCards]);

/** W1: seat 5 makes the last river raise. */
const W1 = play(
  deal(6, { 1: 'Kh', 7: 'Kd', 2: 'Ah', 8: 'Ad', 4: '4h', 10: '4s' }),
  '3:call 4:fold 5:call 6:fold 1:fold 2:check' +
    ' 2:check 3:check 5:check'.repeat(2) +
    ' 2:bet 3:call 5:raise 2:call 3:call',
);

const W2_MOVES =
  '6:fold 1:call 2:call 3:fold 4:call 5:check' + ' 4:check 5:check 1:check 2:check'.repeat(3);
/** W2: button 3, river checked through; seat 1's 55 mucks behind 88. */
const W2 = play(
  deal(3, { 0: '4h', 6: '4s', 1: '8h', 7: '8s', 3: '5h', 9: '5s', 4: 'Kh', 10: 'Ks' }),
  W2_MOVES,
);
/** W3: W2 with seat 1 holding 8c 8d, tying 88. */
const W3 = play(
  deal(3, { 0: '4h', 6: '4s', 1: '8h', 7: '8s', 3: '8c', 9: '8d', 4: 'Kh', 10: 'Ks' }),
  W2_MOVES,
);

const W4_MOVES =
  '5:raise 6:fold 1:call 2:fold 3:call 4:fold 5:bet 1:call 5:check 1:check 5:check 1:check';
/** W4: button 2, seat 3 all-in for $8 with QQ; seat 5 KK, seat 1 AA. */
const W4 = play(
  deal(2, { 0: 'Qh', 6: 'Qs', 2: 'Kh', 8: 'Ks', 4: 'Ah', 10: 'As' }, { 3: 8 }),
  W4_MOVES,
);
/** W5: W4 with seat 3 AA, seat 5 KK, seat 1 QQ. */
const W5 = play(
  deal(2, { 0: 'Ah', 6: 'As', 2: 'Kh', 8: 'Ks', 4: 'Qh', 10: 'Qs' }, { 3: 8 }),
  W4_MOVES,
);

describe('showdown order acceptance', () => {
  it('the last river raiser shows first', () => {
    expect(seatsOf(W1)).toEqual([5, 2, 3]);
    expect(resultOf(W1).showdown.map((s) => s.holeCards)).toEqual([
      parseCards('4h 4s'),
      parseCards('Kh Kd'),
      parseCards('Ah Ad'),
    ]);
    expect(resultOf(W1).awards).toEqual([
      { pot: 0, amount: 62, winners: [{ seat: 3, amount: 62 }] },
    ]);
    expect([2, 3, 5].map((seat) => stackOf(W1, seat))).toEqual([140, 202, 140]);
  });

  it('a checked-through river shows first from the first active seat left of the button', () => {
    expect(resultOf(W2).showdown[0]?.seat).toBe(4);
    expect(seatsOf(W2)).toEqual([4, 5, 2]);
  });

  it('a later hand that beats or ties the best shown hand is shown', () => {
    expect(seatsOf(W2)).toContain(5);
    expect(seatsOf(W2)).toContain(2);
    expect(seatsOf(W3)).toEqual([4, 5, 1, 2]);
    expect(resultOf(W3).showdown.find((s) => s.seat === 1)?.holeCards).toEqual(parseCards('8c 8d'));
    expect(resultOf(W3).awards).toEqual([
      { pot: 0, amount: 16, winners: [{ seat: 2, amount: 16 }] },
    ]);
  });

  it('a losing hand is mucked and absent from the result and later views', () => {
    const mucked = parseCards('5h 5s');
    expect(resultOf(W2).awards).toEqual([
      { pot: 0, amount: 16, winners: [{ seat: 2, amount: 16 }] },
    ]);
    expect([1, 2, 4, 5].map((seat) => stackOf(W2, seat))).toEqual([156, 172, 156, 156]);
    expect(seatsOf(W2)).not.toContain(1);
    for (const card of mucked) expect(shownCards(W2)).not.toContain(card);

    const entry = showdownOf(W2);
    expect(entry?.shown.map((s) => s.seat)).not.toContain(1);
    const later = createHand({
      stakes: STAKES,
      seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
      button: 4,
      deck: fixedDeck({}),
    });
    for (let seat = 1; seat <= 6; seat++) {
      const view = playerView(later, seat, entry === null ? [] : [entry]);
      const earlier = view.earlierShowdowns.flatMap((e) => e.shown);
      expect(earlier.map((s) => s.seat)).not.toContain(1);
      for (const card of mucked) {
        expect(earlier.flatMap((s) => [...s.holeCards])).not.toContain(card);
      }
    }

    for (const seat of [2, 3, 4, 5, 6]) {
      const view = playerView(W2, seat);
      for (const card of mucked) {
        expect(view.holeCards).not.toContain(card);
        expect(view.board).not.toContain(card);
      }
      expect(view.earlierShowdowns).toEqual([]);
    }
  });

  it('the side pot is resolved before the main pot, each among its eligible seats', () => {
    expect(seatsOf(W4)).toEqual([5, 1]);
    expect(resultOf(W4).awards).toEqual([
      { pot: 0, amount: 28, winners: [{ seat: 1, amount: 28 }] },
      { pot: 1, amount: 8, winners: [{ seat: 1, amount: 8 }] },
    ]);
    expect([1, 3, 5].map((seat) => stackOf(W4, seat))).toEqual([184, 0, 148]);
    const side = resultOf(W5).awards.find((a) => a.pot === 1);
    expect(side?.winners.map((w) => w.seat)).not.toContain(3);
  });

  it('a bot shows for the side pot it wins and the all-in seat wins the main pot', () => {
    expect(seatsOf(W5)).toEqual([3, 5]);
    for (const card of parseCards('Qh Qs')) expect(shownCards(W5)).not.toContain(card);
    expect(resultOf(W5).awards).toEqual([
      { pot: 0, amount: 28, winners: [{ seat: 3, amount: 28 }] },
      { pot: 1, amount: 8, winners: [{ seat: 5, amount: 8 }] },
    ]);
    expect([1, 3, 5].map((seat) => stackOf(W5, seat))).toEqual([148, 28, 156]);
  });

  it('showdownOf keeps shown hands in showdown order and omits mucked hands', () => {
    const entry = showdownOf(W2);
    if (entry === null) throw new Error('W2 ended without a showdown');
    expect(entry).toEqual({
      shown: [
        { seat: 4, holeCards: parseCards('4h 4s') },
        { seat: 5, holeCards: parseCards('8h 8s') },
        { seat: 2, holeCards: parseCards('Kh Ks') },
      ],
    });
    const later = createHand({
      stakes: STAKES,
      seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
      button: 4,
      deck: fixedDeck({}),
    });
    for (let seat = 1; seat <= 6; seat++) {
      expect(playerView(later, seat, [entry]).earlierShowdowns).toEqual([entry]);
    }
    const w5 = showdownOf(W5);
    expect(w5?.shown.map((s) => s.seat)).toEqual([3, 5]);
  });
});
