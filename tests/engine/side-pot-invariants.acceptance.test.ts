import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandResult,
  type HandState,
  type Pot,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

type Step = [SeatNumber, Action['type'], number?];

function apply(state: HandState, [seat, type, amount]: Step): HandState {
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

const play = (state: HandState, ...steps: Step[]) => steps.reduce(apply, state);

/** Hole cards in deal order, then the board; burns and the rest are the other cards, ascending. */
function deckOf(holes: readonly string[], board: string): Card[] {
  const n = holes.length;
  const placed = new Map<number, Card>();
  holes.forEach((h, i) => {
    const [a, b] = parseCards(h) as [Card, Card];
    placed.set(i, a);
    placed.set(i + n, b);
  });
  const [f1, f2, f3, turn, river] = parseCards(board) as [Card, Card, Card, Card, Card];
  [f1, f2, f3].forEach((card, i) => placed.set(2 * n + 1 + i, card));
  placed.set(2 * n + 5, turn);
  placed.set(2 * n + 7, river);
  const used = new Set(placed.values());
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !used.has(c));
  return Array.from({ length: 52 }, (_, i) => placed.get(i) ?? (rest.shift() as Card));
}

function s1() {
  const start = createHand({
    stakes: STAKES,
    seats: [
      { seat: 1, stack: 30 },
      { seat: 2, stack: 50 },
      { seat: 3, stack: 200 },
      { seat: 4, stack: 10 },
    ],
    button: 1,
    deck: deckOf(['As Ah', 'Kc Kd', 'Qc Qd', 'Jc Jd'], '2s 7h 9d 4c 3h'),
  });
  const turn = play(
    start,
    [4, 'raise', 8],
    [1, 'raise', 12],
    [2, 'raise', 16],
    [3, 'call', 12],
    [4, 'call', 2],
    [1, 'call', 4],
    [2, 'bet', 4],
    [3, 'raise', 8],
    [1, 'raise', 12],
    [2, 'raise', 16],
    [3, 'call', 8],
    [1, 'call', 2],
  );
  const end = play(
    turn,
    [2, 'check'],
    [3, 'bet', 8],
    [2, 'raise', 16],
    [3, 'raise', 24],
    [2, 'call', 2],
  );
  return { turn, end };
}

const withPots = (state: HandState, pots: Pot[]): HandState => ({ ...state, pots });
const one = (message: string) => [{ invariant: 'pot-eligibility', message }];

describe('side-pot invariants', () => {
  it("pot-eligibility checks each side pot's level and layer", () => {
    const { turn, end } = s1();
    expect(turn.street).toBe('turn');
    expect(checkState(turn)).toEqual([]);
    expect(checkState(end)).toEqual([]);

    const [main, side1, side2] = turn.pots as [Pot, Pot, Pot];
    expect(checkState(withPots(turn, [main, { ...side1, eligible: [2, 3] }, side2]))).toEqual(
      one('seat 1 matched the $30 level of side pot 1 but is not eligible for it'),
    );
    expect(checkState(withPots(turn, [main, side1, { ...side2, eligible: [1, 2, 3] }]))).toEqual(
      one('side pot 2 lists seat 1, which has not matched its $32 level'),
    );
    expect(
      checkState(
        withPots(turn, [
          { ...main, amount: 41 },
          { ...side1, amount: 59 },
          { ...side2, amount: 4 },
        ]),
      ),
    ).toEqual(one('main pot holds $41 but its layer is $40'));
    expect(
      checkState(
        withPots(turn, [
          { amount: 40, eligible: [1, 2, 3, 4] },
          { amount: 64, eligible: [1, 2, 3] },
        ]),
      ),
    ).toEqual(one('there are 2 pots but contributions make 3'));
    expect(checkState(withPots(turn, [{ amount: 104, eligible: [1, 2, 3, 4] }]))).toEqual(
      one('there are 1 pots but contributions make 3'),
    );

    const result = end.result as HandResult;
    const amounts = [41, 59, 40];
    const awards = result.awards.map((award, k) => ({
      ...award,
      amount: amounts[k] as number,
      winners: [{ seat: 2, amount: amounts[k] as number }],
    }));
    expect(checkState({ ...end, result: { ...result, awards } })).toEqual(
      one('main pot paid $41 but its layer is $40'),
    );
  });
});
