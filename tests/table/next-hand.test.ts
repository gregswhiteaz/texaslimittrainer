import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import { createHand, minimumStack, type HandState } from '../../src/engine/hand';
import {
  NEXT_HAND_DELAY_MS,
  completedHand,
  dealHand,
  nextHand,
  nextHandDelay,
  nextStep,
  seatSession,
  stakesFor,
  stepBot,
  type TableState,
} from '../../src/table/session';
import { KINGS_SHOWDOWN } from '../support/table-scenarios';

const CODE = replayCodeFromWords([7, 1, 2, 3]);

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Seated, bot-turn and user-turn tables of one hand. */
function inProgress(): { seated: TableState; botTurn: TableState; userTurn: TableState } {
  const seated = seatSession();
  const botTurn = dealHand(seated, CODE);
  let userTurn = botTurn;
  while (nextStep(userTurn) === 'bot') userTurn = stepBot(userTurn);
  expect(nextStep(botTurn)).toBe('bot');
  expect(nextStep(userTurn)).toBe('user');
  return { seated, botTurn, userTurn };
}

describe('next hand', () => {
  it('nextHandDelay is 1500 ms after a hand unless held', () => {
    expect(NEXT_HAND_DELAY_MS).toBe(1500);
    expect(nextStep(KINGS_SHOWDOWN)).toBe('done');
    expect(nextHandDelay(KINGS_SHOWDOWN)).toBe(1500);
    expect(nextHandDelay(KINGS_SHOWDOWN, false)).toBe(1500);
    expect(nextHandDelay(KINGS_SHOWDOWN, true)).toBeNull();
    const { seated, botTurn, userTurn } = inProgress();
    for (const table of [seated, botTurn, userTurn]) {
      expect(nextHandDelay(table)).toBeNull();
      expect(nextHandDelay(table, false)).toBeNull();
      expect(nextHandDelay(table, true)).toBeNull();
    }
  });

  it('completedHand throws for a seat that was not dealt in', () => {
    const extra = {
      ...KINGS_SHOWDOWN,
      seats: [
        ...KINGS_SHOWDOWN.seats,
        { seat: 7, name: 'Fay', kind: 'bot', style: 'TAG' } as const,
      ],
    };
    expect(() => completedHand(extra)).toThrow(new RangeError('Seat 7 is not dealt in'));

    const hand = KINGS_SHOWDOWN.hand as HandState;
    const noUser = {
      ...KINGS_SHOWDOWN,
      hand: { ...hand, players: hand.players.filter((p) => p.seat !== 5) },
    };
    expect(() => completedHand(noUser)).toThrow(new RangeError('Seat 5 is not dealt in'));

    expect(completedHand(KINGS_SHOWDOWN)?.seats.map((s) => s.startingStack)).toEqual(
      Array.from({ length: 6 }, () => 160),
    );
  });

  it('nextHand works only after a completed hand', () => {
    const { seated, botTurn, userTurn } = inProgress();
    for (const table of [seated, botTurn, userTurn]) {
      const frozen = deepFreeze(table);
      const before = JSON.stringify(frozen);
      expect(() => nextHand(frozen)).toThrow(new RangeError('Not a next-hand step'));
      expect(JSON.stringify(frozen)).toBe(before);
    }
    expect(() => dealHand(nextHand(KINGS_SHOWDOWN), CODE)).not.toThrow();

    const small = stakesFor({ smallBet: 4, bigBet: 8 });
    expect(minimumStack(small)).toBe(96);
    expect(minimumStack(stakesFor({ smallBet: 10, bigBet: 20 }))).toBe(240);
    const seats = [4, 160, 160].map((stack, i) => ({ seat: i + 1, stack }));
    expect(() => createHand({ stakes: small, seats, button: 3, deck: shuffledDeck(CODE) })).toThrow(
      RangeError,
    );
  });
});
