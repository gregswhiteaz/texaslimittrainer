import { describe, expect, it } from 'vitest';
import { parseCards, type Card } from '../../src/engine/cards';
import { shuffledDeck } from '../../src/engine/deck';
import { createHand, type HandConfig } from '../../src/engine/hand';
import { evaluate } from '../../src/engine/hand-evaluator';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const SIX = [1, 2, 3, 4, 5, 6];

function config(overrides: Record<string, unknown> = {}): HandConfig {
  return {
    stakes: STAKES,
    seats: SIX.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: DECK,
    ...overrides,
  } as HandConfig;
}

function seatsOf(seats: unknown[]) {
  return seats.map((seat) => ({ seat, stack: 160 }));
}

function messageOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(RangeError);
    return (error as RangeError).message;
  }
  throw new Error('expected a throw');
}

describe('TASK-1.32 input guards', () => {
  it('AC#1 parseCards rejects non-strings with a RangeError that echoes no input', () => {
    const cases: [unknown, string][] = [
      [undefined, 'undefined'],
      [null, 'object'],
      [42, 'number'],
      [{}, 'object'],
      [['As Kd'], 'object'],
    ];
    for (const [input, type] of cases) {
      expect(() => parseCards(input as string)).toThrow(
        new RangeError(`Invalid card: expected a string, got ${type}`),
      );
      expect(messageOf(() => parseCards(input as string))).not.toContain('As');
    }
    expect(parseCards('  As Kd\t7h ')).toEqual([51, 45, 22]);
  });

  it('AC#1 evaluate rejects non-arrays with a RangeError that echoes no input', () => {
    const inputs: unknown[] = [undefined, null, {}, { length: 5 }, 'AsKdQhJ', 51];
    for (const input of inputs) {
      const message = messageOf(() => evaluate(input as Card[]));
      expect(message).toBe(`Invalid hand: expected an array, got ${typeof input}`);
      expect(message).not.toContain('AsKd');
      expect(message).not.toContain('51');
    }
    expect(evaluate([51, 47, 43, 39, 35])).toBe(7462);
  });

  it('AC#2 createHand rejects malformed config shapes with Invalid hand config', () => {
    const invalid = new RangeError('Invalid hand config');
    const bad: unknown[] = [
      null,
      undefined,
      42,
      config({ seats: null }),
      config({ seats: {} }),
      config({ seats: '1,2,3' }),
      config({ stakes: null }),
      config({ seats: [...seatsOf([1, 2, 3, 4, 5]), null] }),
      config({ deck: null }),
    ];
    for (const input of bad) {
      expect(() => createHand(input as HandConfig), String(input)).toThrow(invalid);
      expect(messageOf(() => createHand(input as HandConfig))).toBe('Invalid hand config');
    }
    expect(createHand(config()).players).toHaveLength(6);
  });

  it('AC#3 long seat, button and replay code echo at most 10 characters', () => {
    expect(messageOf(() => createHand(config({ seats: seatsOf(['12345678901', 2, 3]) })))).toBe(
      'Invalid seat: 1234567890...',
    );
    expect(messageOf(() => createHand(config({ seats: seatsOf([1, 2, 1.2345678901]) })))).toBe(
      'Invalid seat: 1.23456789...',
    );
    expect(messageOf(() => createHand(config({ button: 0.12345678901 })))).toBe(
      'Button must be a dealt-in seat: 0.12345678...',
    );
    expect(messageOf(() => shuffledDeck('0'.repeat(32)))).toBe(
      'Invalid replay code: "0000000000..."',
    );
    expect(messageOf(() => shuffledDeck('ABCDEFGHIJK'))).toBe(
      'Invalid replay code: "ABCDEFGHIJ..."',
    );

    const huge = '9'.repeat(100_000);
    const seatMessage = messageOf(() => createHand(config({ seats: seatsOf([huge, 2, 3]) })));
    expect(seatMessage.length).toBeLessThanOrEqual('Invalid seat: '.length + 13);
    const codeMessage = messageOf(() => shuffledDeck(huge));
    expect(codeMessage.length).toBeLessThanOrEqual('Invalid replay code: ""'.length + 13);
  });

  it('AC#3 short seat, button and replay code messages are unchanged', () => {
    expect(messageOf(() => createHand(config({ seats: seatsOf([0, 1, 2]) })))).toBe(
      'Invalid seat: 0',
    );
    expect(messageOf(() => createHand(config({ seats: seatsOf([1, 2, 11]) })))).toBe(
      'Invalid seat: 11',
    );
    expect(messageOf(() => createHand(config({ seats: seatsOf([1, 2, 2.5]) })))).toBe(
      'Invalid seat: 2.5',
    );
    expect(messageOf(() => createHand(config({ seats: seatsOf([2, 3, 4]), button: 1 })))).toBe(
      'Button must be a dealt-in seat: 1',
    );
    expect(messageOf(() => shuffledDeck('ABC'))).toBe('Invalid replay code: "ABC"');
    expect(messageOf(() => shuffledDeck('ABCDEFGHIJ'))).toBe('Invalid replay code: "ABCDEFGHIJ"');
  });
});
