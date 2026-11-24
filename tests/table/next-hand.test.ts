import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck, type ReplayCode } from '../../src/engine/deck';
import { createHand, minimumStack, type HandState } from '../../src/engine/hand';
import {
  NEXT_HAND_DELAY_MS,
  SIT_AND_GO_LEVEL_1,
  completedHand,
  dealHand,
  drawReplacementStyle,
  nextHand,
  nextHandDelay,
  nextStep,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  stepBot,
  type TableState,
} from '../../src/table/session';
import { KINGS_SHOWDOWN, withFinalStacks } from '../support/table-scenarios';

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
    const seats = [0, 160, 160].map((stack, i) => ({ seat: i + 1, stack }));
    expect(() => createHand({ stakes: small, seats, button: 3, deck: shuffledDeck(CODE) })).toThrow(
      RangeError,
    );
  });
});

describe('busted seats', () => {
  it('the user and sit-and-go seats are never replaced', () => {
    for (const userStack of [0, 95]) {
      const next = nextHand(withFinalStacks([160, 222, 160, 160, userStack, 165]));
      expect(next.seats).toEqual(KINGS_SHOWDOWN.seats);
      expect(next.seats[4]).toEqual({ seat: 5, name: 'You', kind: 'user', style: null });
      expect(next.stacks[4]).toEqual({ seat: 5, stack: userStack });
      expect(next.nextBotName).toBe(0);
    }

    const config = resolveSessionConfig({ gameType: 'sit-and-go' });
    const sitAndGo: TableState = {
      ...KINGS_SHOWDOWN,
      config,
      stakes: stakesFor(SIT_AND_GO_LEVEL_1),
    };
    const next = nextHand(withFinalStacks([0, 222, 160, 160, 96, 165], sitAndGo));
    expect(next.seats).toEqual(KINGS_SHOWDOWN.seats);
    expect(next.stacks[0]).toEqual({ seat: 1, stack: 0 });
    expect(next.nextBotName).toBe(0);
  });

  it('nextHand throws when a bot must be replaced but the hand has no replay code', () => {
    const noCode = { ...withFinalStacks([0, 222, 160, 160, 96, 165]), replayCode: null };
    expect(() => nextHand(noCode)).toThrow(new RangeError('No replay code to draw a new bot from'));
    expect(() => nextHand({ ...KINGS_SHOWDOWN, replayCode: null })).not.toThrow();

    const replaced = nextHand(withFinalStacks([0, 222, 160, 160, 96, 0]));
    expect(replaced.seats.map((s) => s.name)).toEqual(['Jay', 'Ben', 'Cal', 'Dee', 'You', 'Kit']);
    expect(replaced.stacks.map((s) => s.stack)).toEqual([160, 222, 160, 160, 96, 160]);
    expect(replaced.seats[5]?.style).toBe(
      drawReplacementStyle('Custom', 6, KINGS_SHOWDOWN.replayCode as ReplayCode, 6),
    );
    expect(replaced.nextBotName).toBe(2);
  });
});
