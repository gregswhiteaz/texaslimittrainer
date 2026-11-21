import { describe, expect, it } from 'vitest';
import {
  botDecisionIndex,
  botDecisionSeed,
  botRandom,
  seatGenerator,
} from '../../src/engine/bot-random';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { ActionRecord } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import { seatGenerator as playtestSeatGenerator } from '../../src/playtest/policy';

const CODE = replayCodeFromWords([0x9e3779b9, 1, 2, 3]);

function record(seat: number, type: ActionRecord['type']): ActionRecord {
  return { street: 'preflop', seat, type, amount: 0, added: 0 };
}

/** A view of `seat` whose only content read by the seed is its action list. */
function viewOf(seat: number, actions: readonly ActionRecord[]): PlayerView {
  return { seat, actions } as unknown as PlayerView;
}

describe('bot random', () => {
  it('decision index and seed worked example', () => {
    expect(CODE).toBe('9e3779b9000000010000000200000003');

    // Seat 3 posted the big blind: blinds and other seats' actions don't count.
    const blinds = [record(2, 'small-blind'), record(3, 'big-blind')];
    const first = viewOf(3, [...blinds, record(4, 'raise'), record(1, 'call'), record(2, 'fold')]);
    expect(botDecisionIndex(first)).toBe(0);
    expect(botDecisionSeed(CODE, first)).toBe(1927253632);

    const second = viewOf(3, [
      ...first.actions,
      record(3, 'call'),
      { ...record(4, 'bet'), street: 'flop' },
    ]);
    expect(botDecisionIndex(second)).toBe(1);
    expect(botDecisionSeed(CODE, second)).toBe(3219888363);

    expect(botDecisionSeed(CODE, viewOf(1, []))).toBe(1024787557);
    expect(botDecisionSeed(CODE, viewOf(2, blinds))).toBe(2122845982);

    // The seed for decision k is the (k+1)-th output of the seat's generator.
    const generator = seatGenerator(CODE, 5);
    const actions: ActionRecord[] = [];
    for (let k = 0; k < 6; k++) {
      expect(botDecisionSeed(CODE, viewOf(5, actions))).toBe(generator.nextUint32());
      actions.push(record(5, 'call'), record(6, 'raise'));
    }
  });

  it('the playtest seat generator is the bot seat generator', () => {
    expect(playtestSeatGenerator).toBe(seatGenerator);
  });

  it('botRandom builds the generator from a 32-bit seed and rejects anything else', () => {
    for (const seed of [0, 1927253632, 4294967295]) {
      const random = botRandom(seed);
      const expected = new Xoshiro128(seed);
      expect([random.nextUint32(), random.nextUint32()]).toEqual([
        expected.nextUint32(),
        expected.nextUint32(),
      ]);
    }
    for (const seed of [-1, 1.5, 4294967296, NaN, Infinity]) {
      expect(() => botRandom(seed)).toThrow(
        new RangeError(`Bot seed must be an integer from 0 to 4294967295, got ${seed}`),
      );
    }
  });
});
