import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  splitPot,
  type Action,
  type HandResult,
  type HandState,
  type SeatNumber,
  type Stakes,
} from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';

const STAKES: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

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
  const pairs = holes.map((h) => parseCards(h));
  const [f1, f2, f3, turn, river] = parseCards(board) as [Card, Card, Card, Card, Card];
  const placed = new Map<number, Card>();
  pairs.forEach(([a, b], i) => {
    placed.set(i, a as Card);
    placed.set(i + n, b as Card);
  });
  [f1, f2, f3].forEach((card, i) => placed.set(2 * n + 1 + i, card));
  placed.set(2 * n + 5, turn);
  placed.set(2 * n + 7, river);
  const used = new Set(placed.values());
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !used.has(c));
  return Array.from({ length: 52 }, (_, i) => placed.get(i) ?? (rest.shift() as Card));
}

function hand(
  stacks: Record<number, number>,
  holes: readonly string[],
  board: string,
  stakes: Stakes = STAKES,
): HandState {
  return createHand({
    stakes,
    seats: Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack })),
    button: 1,
    deck: deckOf(holes, board),
  });
}

const stacksOf = (state: HandState) =>
  Object.fromEntries(state.players.map((p) => [p.seat, p.stack]));
const eligibleOf = (state: HandState) => state.pots.map((pot) => pot.eligible);
const resultOf = (state: HandState) => state.result as HandResult;

function s1() {
  const start = hand(
    { 1: 30, 2: 50, 3: 200, 4: 10 },
    ['As Ah', 'Kc Kd', 'Qc Qd', 'Jc Jd'],
    '2s 7h 9d 4c 3h',
  );
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

describe('side pots', () => {
  it('three all-ins for $10, $30 and $50 with a covering seat make a main pot and two side pots', () => {
    const { turn, end } = s1();
    expect(turn.street).toBe('turn');
    expect(turn.pots).toEqual([
      { amount: 40, eligible: [1, 2, 3, 4] },
      { amount: 60, eligible: [1, 2, 3] },
      { amount: 4, eligible: [2, 3] },
    ]);
    expect(resultOf(end).returned).toEqual({ seat: 3, amount: 6 });
    expect(end.pots).toEqual([
      { amount: 0, eligible: [1, 2, 3, 4] },
      { amount: 0, eligible: [1, 2, 3] },
      { amount: 0, eligible: [2, 3] },
    ]);
    expect(resultOf(end).awards).toEqual([
      { pot: 0, amount: 40, winners: [{ seat: 2, amount: 40 }] },
      { pot: 1, amount: 60, winners: [{ seat: 2, amount: 60 }] },
      { pot: 2, amount: 40, winners: [{ seat: 2, amount: 40 }] },
    ]);
    expect(stacksOf(end)).toEqual({ 1: 0, 2: 140, 3: 150, 4: 0 });
    expect(checkState(end)).toEqual([]);
  });

  it('a folded contributor is eligible for no pot but its chips stay in every pot it reached', () => {
    const start = hand(
      { 1: 8, 2: 160, 3: 160, 4: 160 },
      ['Ac Ad', 'Kc Kd', 'Qc Qd', 'Jc Jh'],
      '2s 7h 9d 4c 3h',
    );
    const fold = play(
      start,
      [4, 'call', 4],
      [1, 'raise', 8],
      [2, 'call', 6],
      [3, 'call', 4],
      [4, 'call', 4],
      [2, 'bet', 4],
      [3, 'call', 4],
      [4, 'raise', 8],
      [2, 'fold'],
    );
    for (const pot of fold.pots) expect(pot.eligible).toEqual([1, 3, 4]);
    expect(fold.players.find((p) => p.seat === 2)?.totalContribution).toBe(12);

    const turn = play(fold, [3, 'call', 4]);
    expect(turn.pots).toEqual([
      { amount: 32, eligible: [1, 3, 4] },
      { amount: 20, eligible: [3, 4] },
    ]);

    const end = play(turn, [3, 'check'], [4, 'check'], [3, 'check'], [4, 'check']);
    const result = resultOf(end);
    for (const pot of end.pots) expect(pot.eligible).not.toContain(2);
    expect(result.showdown.map((s) => s.seat)).toEqual([3]);
    for (const award of result.awards) {
      for (const w of award.winners) expect(w.seat).not.toBe(2);
    }
    const paid = result.awards.reduce((sum, a) => sum + a.amount, 0);
    const putIn = end.players.reduce((sum, p) => sum + p.totalContribution, 0);
    expect(result.returned).toBeUndefined();
    expect(paid).toBe(52);
    expect(paid).toBe(putIn);
    expect(result.awards).toEqual([
      { pot: 0, amount: 32, winners: [{ seat: 3, amount: 32 }] },
      { pot: 1, amount: 20, winners: [{ seat: 3, amount: 20 }] },
    ]);
    expect(stacksOf(end)).toEqual({ 1: 0, 2: 148, 3: 196, 4: 144 });
    expect(checkState(end)).toEqual([]);
  });

  it('the shortest all-in with the best hand wins only the main pot', () => {
    const start = hand({ 1: 10, 2: 30, 3: 160 }, ['Ks Kh', 'Qs Qh', 'As Ah'], '2c 7d 9h Jc 3d');
    const end = play(
      start,
      [1, 'raise', 8],
      [2, 'raise', 12],
      [3, 'raise', 16],
      [1, 'call', 2],
      [2, 'call', 4],
      [2, 'bet', 4],
      [3, 'raise', 8],
      [2, 'raise', 12],
      [3, 'raise', 16],
      [2, 'call', 2],
    );
    const result = resultOf(end);
    expect(result.returned).toEqual({ seat: 3, amount: 2 });
    expect(eligibleOf(end)).toEqual([
      [1, 2, 3],
      [2, 3],
    ]);
    expect(result.awards).toEqual([
      { pot: 0, amount: 30, winners: [{ seat: 1, amount: 30 }] },
      { pot: 1, amount: 40, winners: [{ seat: 2, amount: 40 }] },
    ]);
    expect(stacksOf(end)).toEqual({ 1: 30, 2: 40, 3: 130 });
    expect(checkState(end)).toEqual([]);
  });

  it('a four-way all-in at four stack sizes pays each pot to the best eligible hand', () => {
    const start = hand(
      { 1: 20, 2: 30, 3: 32, 4: 10 },
      ['Js Jh', 'Qs Qh', 'As Ah', 'Ks Kh'],
      '2c 7d 9h 4c 3d',
    );
    const end = play(
      start,
      [4, 'raise', 8],
      [1, 'raise', 12],
      [2, 'raise', 16],
      [3, 'call', 12],
      [4, 'call', 2],
      [1, 'call', 4],
      [2, 'bet', 4],
      [3, 'raise', 8],
      [1, 'call', 4],
      [2, 'raise', 12],
      [3, 'raise', 16],
      [2, 'call', 2],
    );
    const result = resultOf(end);
    expect(result.returned).toEqual({ seat: 3, amount: 2 });
    expect(eligibleOf(end)).toEqual([
      [1, 2, 3, 4],
      [1, 2, 3],
      [2, 3],
    ]);
    expect(result.awards).toEqual([
      { pot: 0, amount: 40, winners: [{ seat: 4, amount: 40 }] },
      { pot: 1, amount: 30, winners: [{ seat: 1, amount: 30 }] },
      { pot: 2, amount: 20, winners: [{ seat: 3, amount: 20 }] },
    ]);
    for (const award of result.awards) {
      const eligible = end.pots[award.pot]?.eligible ?? [];
      const best = result.showdown
        .filter((s) => eligible.includes(s.seat))
        .reduce((a, b) => (b.rank > a.rank ? b : a));
      expect(award.winners.map((w) => w.seat)).toEqual([best.seat]);
    }
    expect(stacksOf(end)).toEqual({ 1: 30, 2: 0, 3: 22, 4: 40 });
    expect(checkState(end)).toEqual([]);
  });

  it('a 1,255-chip side pot tied by seats 2 and 5 pays 628 and 627', () => {
    const start = hand(
      { 1: 1000, 2: 1000, 3: 65, 5: 1000 },
      ['Kh 9s', 'Ah Ac', 'Kc 9d', '7h 6h'],
      'As Kd 8c 4h 2s',
      { smallBlind: 25, bigBlind: 50, smallBet: 50, bigBet: 100 },
    );
    const end = play(
      start,
      [5, 'raise', 100],
      [1, 'call', 100],
      [2, 'call', 75],
      [3, 'call', 15],
      [2, 'bet', 50],
      [5, 'call', 50],
      [1, 'call', 50],
      [2, 'bet', 100],
      [5, 'raise', 200],
      [1, 'fold'],
      [2, 'raise', 300],
      [5, 'call', 100],
      [2, 'bet', 100],
      [5, 'raise', 200],
      [2, 'call', 100],
    );
    const result = resultOf(end);
    expect(result.awards).toEqual([
      { pot: 0, amount: 260, winners: [{ seat: 3, amount: 260 }] },
      {
        pot: 1,
        amount: 1255,
        winners: [
          { seat: 2, amount: 628 },
          { seat: 5, amount: 627 },
        ],
      },
    ]);
    expect(eligibleOf(end)).toEqual([
      [2, 3, 5],
      [2, 5],
    ]);
    expect(result.returned).toBeUndefined();
    expect(stacksOf(end)).toEqual({ 1: 850, 2: 978, 3: 260, 5: 977 });
    expect(checkState(end)).toEqual([]);
  });

  it('a $29 pot tied by seats 3, 5 and 6 pays $10, $10 and $9 from the left of button 4', () => {
    expect(splitPot(29, [3, 5, 6], 4, [1, 2, 3, 4, 5, 6])).toEqual([
      { seat: 5, amount: 10 },
      { seat: 6, amount: 10 },
      { seat: 3, amount: 9 },
    ]);
  });
});
