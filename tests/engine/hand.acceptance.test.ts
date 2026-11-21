import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import { evaluate } from '../../src/engine/hand-evaluator';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
  type Stakes,
} from '../../src/engine/hand';

const STAKES_4_8: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const STAKES_3_6: Stakes = { smallBlind: 1, bigBlind: 3, smallBet: 3, bigBet: 6 };

/** Places cards at 1-based deck positions, then fills the rest with the remaining cards ascending. */
function scriptedDeck(placed: Record<number, Card> = {}): Card[] {
  const used = new Set(Object.values(placed));
  const rest = Array.from({ length: 52 }, (_, card) => card).filter((card) => !used.has(card));
  return Array.from({ length: 52 }, (_, i) => placed[i + 1] ?? (rest.shift() as Card));
}

/** A deck whose card at 1-based position p is distinct and known: position p holds card 52 - p. */
const REVERSED = Array.from({ length: 52 }, (_, i) => 51 - i);
const at = (position: number) => REVERSED[position - 1] as Card;

function newHand(
  options: {
    seats?: number[];
    button?: SeatNumber;
    stakes?: Stakes;
    deck?: Card[];
  } = {},
): HandState {
  const seats = options.seats ?? [1, 2, 3, 4, 5, 6];
  return createHand({
    stakes: options.stakes ?? STAKES_4_8,
    seats: seats.map((seat) => ({ seat, stack: 160 })),
    button: options.button ?? 1,
    deck: options.deck ?? REVERSED,
  });
}

type Step = [SeatNumber, Action['type'], number?];

function play(state: HandState, ...steps: Step[]): HandState {
  let current = state;
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    current = result.state;
  }
  return current;
}

const stackOf = (state: HandState, seat: SeatNumber) =>
  state.players.find((p) => p.seat === seat)?.stack;
const totalStacks = (state: HandState) => state.players.reduce((sum, p) => sum + p.stack, 0);

/** Button 1, 6 seats: everyone calls and the big blind checks. */
const LIMP_6: Step[] = [
  [4, 'call', 4],
  [5, 'call', 4],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];
const CHECK_AROUND = (seats: SeatNumber[]): Step[] => seats.map((seat) => [seat, 'check']);

describe('hand acceptance', () => {
  it('AC#1 the two seats left of the button post the small and big blinds', () => {
    const state = newHand();
    expect(state.actions[0]).toEqual({
      street: 'preflop',
      seat: 2,
      type: 'small-blind',
      amount: 2,
      added: 2,
    });
    expect(state.actions[1]).toEqual({
      street: 'preflop',
      seat: 3,
      type: 'big-blind',
      amount: 4,
      added: 4,
    });
    expect(stackOf(state, 2)).toBe(158);
    expect(stackOf(state, 3)).toBe(156);

    const wrapped = newHand({ button: 6 });
    expect(wrapped.actions.slice(0, 2).map((a) => [a.seat, a.type, a.added])).toEqual([
      [1, 'small-blind', 2],
      [2, 'big-blind', 4],
    ]);

    const gaps = newHand({ seats: [1, 3, 4, 7], button: 7 });
    expect(gaps.actions.slice(0, 2).map((a) => [a.seat, a.type, a.added])).toEqual([
      [1, 'small-blind', 2],
      [3, 'big-blind', 4],
    ]);
  });

  it('AC#2 hole cards go one at a time clockwise from left of the button for two rounds', () => {
    const holes = (state: HandState) =>
      Object.fromEntries(state.players.map((p) => [p.seat, p.holeCards]));
    expect(holes(newHand())).toEqual({
      2: [at(1), at(7)],
      3: [at(2), at(8)],
      4: [at(3), at(9)],
      5: [at(4), at(10)],
      6: [at(5), at(11)],
      1: [at(6), at(12)],
    });
    const fromFour = holes(newHand({ button: 4 }));
    expect(fromFour[5]).toEqual([at(1), at(7)]);
    expect(fromFour[4]).toEqual([at(6), at(12)]);
  });

  it('AC#3 preflop starts left of the big blind and later streets with the first active player left of the button', () => {
    expect(newHand().toAct).toBe(4);

    const flop = play(newHand(), ...LIMP_6);
    expect(flop.street).toBe('flop');
    expect(flop.toAct).toBe(2);

    const sbFolded = play(
      newHand(),
      [4, 'call', 4],
      [5, 'call', 4],
      [6, 'call', 4],
      [1, 'call', 4],
      [2, 'fold'],
      [3, 'check'],
    );
    expect(sbFolded.street).toBe('flop');
    expect(sbFolded.toAct).toBe(3);

    const turn = play(
      flop,
      [2, 'check'],
      [3, 'check'],
      [4, 'bet', 4],
      [5, 'call', 4],
      [6, 'call', 4],
      [1, 'call', 4],
      [2, 'fold'],
      [3, 'fold'],
    );
    expect(turn.street).toBe('turn');
    expect(turn.toAct).toBe(4);
    const river = play(turn, ...CHECK_AROUND([4, 5, 6, 1]));
    expect(river.street).toBe('river');
    expect(river.toAct).toBe(4);

    const buttonSix = newHand({ button: 6 });
    expect(buttonSix.toAct).toBe(3);
    const sixFlop = play(
      buttonSix,
      [3, 'call', 4],
      [4, 'call', 4],
      [5, 'call', 4],
      [6, 'call', 4],
      [1, 'call', 2],
      [2, 'check'],
    );
    expect(sixFlop.street).toBe('flop');
    expect(sixFlop.toAct).toBe(1);
  });

  it('AC#4 legal actions list exact amounts for the player to act', () => {
    const start = newHand();
    expect(legalActions(start)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 4 },
      { seat: 4, type: 'raise', amount: 8 },
    ]);

    const bbOption = play(start, ...LIMP_6.slice(0, 5));
    expect(legalActions(bbOption)).toEqual([
      { seat: 3, type: 'check' },
      { seat: 3, type: 'raise', amount: 8 },
    ]);

    const facingRaise = play(start, [4, 'raise', 8], [5, 'fold'], [6, 'fold'], [1, 'fold']);
    expect(legalActions(facingRaise)).toEqual([
      { seat: 2, type: 'fold' },
      { seat: 2, type: 'call', amount: 6 },
      { seat: 2, type: 'raise', amount: 12 },
    ]);

    const flop = play(start, ...LIMP_6);
    expect(legalActions(flop)).toEqual([
      { seat: 2, type: 'check' },
      { seat: 2, type: 'bet', amount: 4 },
    ]);

    const turn = play(flop, ...CHECK_AROUND([2, 3, 4, 5, 6, 1]));
    expect(turn.street).toBe('turn');
    expect(legalActions(turn)).toEqual([
      { seat: 2, type: 'check' },
      { seat: 2, type: 'bet', amount: 8 },
    ]);

    const riverBet = play(turn, ...CHECK_AROUND([2, 3, 4, 5, 6, 1]), [2, 'bet', 8]);
    expect(riverBet.street).toBe('river');
    expect(legalActions(riverBet)).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 8 },
      { seat: 3, type: 'raise', amount: 16 },
    ]);

    const done = play(riverBet, [3, 'fold'], [4, 'fold'], [5, 'fold'], [6, 'fold'], [1, 'fold']);
    expect(done.result).not.toBeNull();
    expect(legalActions(done)).toEqual([]);
  });

  it('AC#5 a round ends when every active player has acted and matched and the next street deals 3 then 1 then 1 cards', () => {
    const flop = play(newHand(), ...LIMP_6);
    expect(flop.street).toBe('flop');
    expect(flop.burned).toEqual([at(13)]);
    expect(flop.board).toEqual([at(14), at(15), at(16)]);
    expect(flop.pots[0]?.amount).toBe(24);
    expect(flop.players.every((p) => p.streetContribution === 0)).toBe(true);

    const turn = play(flop, ...CHECK_AROUND([2, 3, 4, 5, 6, 1]));
    expect(turn.street).toBe('turn');
    expect(turn.burned).toEqual([at(13), at(17)]);
    expect(turn.board).toEqual([at(14), at(15), at(16), at(18)]);

    const river = play(turn, ...CHECK_AROUND([2, 3, 4, 5, 6, 1]));
    expect(river.street).toBe('river');
    expect(river.burned).toEqual([at(13), at(17), at(19)]);
    expect(river.board).toEqual([at(14), at(15), at(16), at(18), at(20)]);

    const end = play(river, ...CHECK_AROUND([2, 3, 4, 5, 6, 1]));
    expect(end.street).toBe('showdown');
    expect(end.result?.endedBy).toBe('showdown');
    expect(end.board).toHaveLength(5);

    const beforeLastCall = play(
      flop,
      [2, 'bet', 4],
      [3, 'call', 4],
      [4, 'call', 4],
      [5, 'call', 4],
      [6, 'call', 4],
    );
    expect(beforeLastCall.street).toBe('flop');
    expect(beforeLastCall.toAct).toBe(1);
    expect(play(beforeLastCall, [1, 'call', 4]).street).toBe('turn');

    const reopened = play(
      flop,
      [2, 'bet', 4],
      [3, 'call', 4],
      [4, 'raise', 8],
      [5, 'call', 8],
      [6, 'call', 8],
      [1, 'call', 8],
    );
    expect(reopened.street).toBe('flop');
    expect(reopened.toAct).toBe(2);
    const afterTwo = play(reopened, [2, 'call', 4]);
    expect(afterTwo.street).toBe('flop');
    expect(afterTwo.toAct).toBe(3);
    expect(play(afterTwo, [3, 'call', 4]).street).toBe('turn');
  });

  it('burn one card before flop turn and river and never reveal burned cards', () => {
    const six = play(
      newHand(),
      ...LIMP_6,
      ...CHECK_AROUND([2, 3, 4, 5, 6, 1]),
      ...CHECK_AROUND([2, 3, 4, 5, 6, 1]),
      ...CHECK_AROUND([2, 3, 4, 5, 6, 1]),
    );
    expect(six.burned).toEqual([at(13), at(17), at(19)]);
    expect(six.board).toEqual([at(14), at(15), at(16), at(18), at(20)]);
    const revealed = JSON.stringify(six.result);
    for (const card of six.burned) {
      expect(six.board).not.toContain(card);
      for (const shown of six.result?.showdown ?? []) expect(shown.holeCards).not.toContain(card);
    }
    expect(revealed).not.toMatch(/burn/);

    const three = play(
      newHand({ seats: [1, 2, 3] }),
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      ...CHECK_AROUND([2, 3, 1]),
      ...CHECK_AROUND([2, 3, 1]),
      ...CHECK_AROUND([2, 3, 1]),
    );
    expect(three.result?.endedBy).toBe('showdown');
    expect(three.board).toEqual([at(8), at(9), at(10), at(12), at(14)]);
    expect(three.burned).toEqual([at(7), at(11), at(13)]);

    const flopFold = play(
      newHand(),
      ...LIMP_6,
      [2, 'bet', 4],
      [3, 'fold'],
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
    );
    expect(flopFold.burned).toEqual([at(13)]);
    expect(flopFold.board).toEqual([at(14), at(15), at(16)]);
    expect(flopFold.board).not.toContain(at(17));
    expect(flopFold.board).not.toContain(at(18));
  });

  it('AC#6 when all but one fold the last player wins without showing and no more cards are dealt', () => {
    const preflop = play(
      newHand(),
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'fold'],
    );
    expect(preflop.result).toEqual({
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 0, amount: 4, winners: [{ seat: 3, amount: 4 }] }],
      returned: { seat: 3, amount: 2 },
    });
    expect(stackOf(preflop, 3)).toBe(162);
    expect(stackOf(preflop, 2)).toBe(158);
    expect(preflop.board).toEqual([]);
    expect(preflop.toAct).toBeNull();
    expect(legalActions(preflop)).toEqual([]);

    const flop = play(
      newHand(),
      ...LIMP_6,
      [2, 'bet', 4],
      [3, 'fold'],
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
    );
    expect(flop.result?.endedBy).toBe('fold');
    expect(flop.result?.showdown).toEqual([]);
    expect(flop.board).toHaveLength(3);
    expect(flop.result?.awards).toEqual([
      { pot: 0, amount: 24, winners: [{ seat: 2, amount: 24 }] },
    ]);
    expect(stackOf(flop, 2)).toBe(160 + 20);
    expect(totalStacks(flop)).toBe(960);
  });

  it('AC#7 a tied pot splits equally with the odd dollar to the first tied player left of the button', () => {
    const board = parseCards('2c 7d 9h Jc 4s');
    const boardAt = { 14: board[0], 15: board[1], 16: board[2], 18: board[3], 20: board[4] };
    const deckFor = (positions: Record<number, string>) => {
      const placed: Record<number, Card> = { ...boardAt } as Record<number, Card>;
      for (const [position, card] of Object.entries(positions)) {
        placed[Number(position)] = parseCards(card)[0] as Card;
      }
      return scriptedDeck(placed);
    };
    const hand = (button: SeatNumber, deck: Card[]) =>
      newHand({ button, stakes: STAKES_3_6, deck });
    const buttonOneScript: Step[] = [
      [4, 'fold'],
      [5, 'raise', 6],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'call', 5],
      [3, 'fold'],
      [2, 'check'],
      [5, 'check'],
      [2, 'bet', 6],
      [5, 'call', 6],
      [2, 'check'],
      [5, 'check'],
    ];

    // Button 1: deal order 2,3,4,5,6,1 → seat 2 at positions 1 and 7, seat 5 at 4 and 10.
    const tieOne = play(
      hand(1, deckFor({ 1: 'Ad', 7: 'Kc', 4: 'Ah', 10: 'Ks' })),
      ...buttonOneScript,
    );
    expect(tieOne.result?.awards).toEqual([
      {
        pot: 0,
        amount: 27,
        winners: [
          { seat: 2, amount: 14 },
          { seat: 5, amount: 13 },
        ],
      },
    ]);
    expect(stackOf(tieOne, 2)).toBe(160 - 12 + 14);
    expect(stackOf(tieOne, 5)).toBe(160 - 12 + 13);
    expect(tieOne.result?.showdown).toEqual([
      {
        seat: 2,
        holeCards: parseCards('Ad Kc'),
        rank: evaluate([...parseCards('Ad Kc'), ...board]),
      },
      {
        seat: 5,
        holeCards: parseCards('Ah Ks'),
        rank: evaluate([...parseCards('Ah Ks'), ...board]),
      },
    ]);

    // Button 3: deal order 4,5,6,1,2,3 → seat 5 at positions 2 and 8, seat 2 at 5 and 11.
    const tieThree = play(
      hand(3, deckFor({ 5: 'Ad', 11: 'Kc', 2: 'Ah', 8: 'Ks' })),
      [6, 'fold'],
      [1, 'fold'],
      [2, 'call', 3],
      [3, 'fold'],
      [4, 'call', 2],
      [5, 'check'],
      [4, 'check'],
      [5, 'bet', 3],
      [2, 'call', 3],
      [4, 'fold'],
      [5, 'bet', 6],
      [2, 'call', 6],
      [5, 'check'],
      [2, 'check'],
    );
    expect(tieThree.result?.awards).toEqual([
      {
        pot: 0,
        amount: 27,
        winners: [
          { seat: 5, amount: 14 },
          { seat: 2, amount: 13 },
        ],
      },
    ]);
    expect(tieThree.result?.showdown.map((s) => s.seat)).toEqual([5, 2]);

    const single = play(
      hand(1, deckFor({ 1: 'Ad', 7: 'Kc', 4: 'Ah', 10: 'Qs' })),
      ...buttonOneScript,
    );
    expect(single.result?.awards).toEqual([
      { pot: 0, amount: 27, winners: [{ seat: 2, amount: 27 }] },
    ]);
    expect(stackOf(single, 2)).toBe(160 - 12 + 27);
    expect(single.result?.showdown.map((s) => s.seat)).toEqual([2, 5]);
  });
});
