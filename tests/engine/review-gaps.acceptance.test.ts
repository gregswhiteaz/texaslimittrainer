import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import { compareHands, evaluate, handCategory } from '../../src/engine/hand-evaluator';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandConfig,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const SIX = [1, 2, 3, 4, 5, 6];

function config(overrides: Partial<HandConfig> = {}): HandConfig {
  return {
    stakes: STAKES,
    seats: SIX.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: DECK,
    ...overrides,
  };
}

type Step = [SeatNumber, Action['type'], number?];

function apply(state: HandState, [seat, type, amount]: Step): HandState {
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

const play = (state: HandState, ...steps: Step[]) => steps.reduce(apply, state);

const player = (state: HandState, seat: SeatNumber) => state.players.find((p) => p.seat === seat);
const totalIn = (state: HandState) =>
  state.players.reduce((sum, p) => sum + p.totalContribution, 0);
const checkAround: Step[] = [2, 3, 5, 6, 1].map((seat) => [seat, 'check']);
const limp = (amount: number): Step[] => [4, 5, 6, 1].map((seat) => [seat, 'call', amount]);

describe('engine review gaps', () => {
  it('the third kicker decides between equal pairs', () => {
    const a = evaluate(parseCards('Kc Kd Ah 9s 7h 3d 2c'));
    const b = evaluate(parseCards('Ks Kh Ad 9c 6h 3s 2d'));
    expect(handCategory(a)).toBe('one-pair');
    expect(handCategory(b)).toBe('one-pair');
    expect(compareHands(a, b)).toBe(1);
    expect(compareHands(b, a)).toBe(-1);
    expect(
      compareHands(evaluate(parseCards('Kc Kd Ah 9s 4h')), evaluate(parseCards('Ks Kh Ad 9c 3h'))),
    ).toBe(1);
  });

  it('a folded seat leaves every pot but its chips stay in', () => {
    const flop = play(createHand(config()), ...limp(4), [2, 'call', 2], [3, 'check']);
    expect(flop.street).toBe('flop');
    expect(flop.pots[0]?.amount).toBe(24);

    const folded = play(flop, [2, 'bet', 4], [3, 'call', 4], [4, 'fold']);
    expect(player(folded, 4)?.folded).toBe(true);
    expect(player(folded, 4)?.totalContribution).toBe(4);
    expect(folded.pots.every((pot) => pot.eligible.join() === '1,2,3,5,6')).toBe(true);
    expect(folded.pots[0]?.amount).toBe(24);

    const turn = play(folded, [5, 'call', 4], [6, 'call', 4], [1, 'call', 4]);
    expect(turn.street).toBe('turn');
    expect(turn.pots[0]?.amount).toBe(44);
    expect(totalIn(turn)).toBe(44);
    expect(turn.pots.every((pot) => !pot.eligible.includes(4))).toBe(true);

    const end = play(turn, ...checkAround, ...checkAround);
    const result = end.result;
    if (!result) throw new Error('hand not complete');
    expect(result.endedBy).toBe('showdown');
    expect(result.awards.reduce((sum, award) => sum + award.amount, 0)).toBe(44);
    expect(result.showdown.map((entry) => entry.seat)).not.toContain(4);
    for (const award of result.awards) {
      expect(award.winners.map((winner) => winner.seat)).not.toContain(4);
    }

    const blindFold = play(createHand(config()), ...limp(4), [2, 'fold']);
    expect(blindFold.pots.every((pot) => pot.eligible.join() === '1,3,4,5,6')).toBe(true);
    expect(player(blindFold, 2)?.totalContribution).toBe(2);
  });

  it('small blind equal to big blind is accepted', () => {
    const stakes = { smallBlind: 2, bigBlind: 2, smallBet: 4, bigBet: 8 };
    const start = createHand(config({ stakes }));
    expect(player(start, 2)?.streetContribution).toBe(2);
    expect(player(start, 3)?.streetContribution).toBe(2);
    expect(start.currentBet).toBe(2);

    const sbTurn = play(start, ...limp(2));
    expect(sbTurn.toAct).toBe(2);
    expect(legalActions(sbTurn)).toEqual([
      { seat: 2, type: 'check' },
      { seat: 2, type: 'raise', amount: 6 },
    ]);
    const flop = play(sbTurn, [2, 'check'], [3, 'check']);
    expect(flop.street).toBe('flop');
    expect(flop.pots[0]?.amount).toBe(12);

    const reversed = { smallBlind: 3, bigBlind: 2, smallBet: 4, bigBet: 8 };
    expect(() => createHand(config({ stakes: reversed }))).toThrow(
      new RangeError('Invalid stakes'),
    );
  });
});
