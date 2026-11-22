import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import {
  completedHand,
  dealHand,
  drawReplacementStyle,
  nextHand,
  type SessionSeat,
  type TableState,
} from '../../src/table/session';
import { KINGS_SHOWDOWN } from '../support/table-scenarios';

const STYLES = ['TAG', 'Calling station', 'Maniac', 'Rock'];
const NEXT_CODE = replayCodeFromWords([1, 1, 2, 3]);

/** `table` (a finished hand) with its final stacks replaced by `stacks` (ascending seat order). */
function withFinalStacks(stacks: number[], table: TableState = KINGS_SHOWDOWN): TableState {
  const hand = table.hand as HandState;
  return {
    ...table,
    hand: { ...hand, players: hand.players.map((p, i) => ({ ...p, stack: stacks[i] as number })) },
  };
}

const stackValues = (table: TableState): number[] => table.stacks.map((s) => s.stack);
const startingStacks = (table: TableState): number[] =>
  (table.hand as HandState).players.map((p) => p.startingStack);

/** `table` dealt from `code`, finished as KINGS_SHOWDOWN's hand but with final stacks `stacks`. */
function finishedWith(table: TableState, code: ReplayCode, stacks: number[]): TableState {
  return withFinalStacks(stacks, { ...dealHand(table, code), hand: KINGS_SHOWDOWN.hand });
}

describe('replace a busted bot', () => {
  it('a bot on $0 is replaced by a new bot with $160 when nextHand runs', () => {
    const next = nextHand(withFinalStacks([0, 222, 160, 160, 96, 165]));
    const seat1 = next.seats[0] as SessionSeat;
    expect(seat1).toMatchObject({ seat: 1, kind: 'bot', name: 'Jay' });
    expect(seat1.name).not.toBe('Ava');
    expect(STYLES).toContain(seat1.style);
    expect(seat1.style).toBe(
      drawReplacementStyle('Custom', 6, KINGS_SHOWDOWN.replayCode as ReplayCode, 1),
    );
    expect(stackValues(next)).toEqual([160, 222, 160, 160, 96, 165]);
    expect(next.seats.slice(1)).toEqual(KINGS_SHOWDOWN.seats.slice(1));
    expect(next.nextBotName).toBe(1);

    const dealt = dealHand(next, NEXT_CODE);
    expect(startingStacks(dealt)[0]).toBe(160);
    expect(dealt.seats[0]).toEqual(seat1);
    const record = completedHand({ ...dealt, hand: KINGS_SHOWDOWN.hand });
    expect(record?.seats[0]).toMatchObject({ seat: 1, name: 'Jay', kind: 'bot' });
  });

  it('a bot with $1 keeps its seat and its stack', () => {
    for (const stack of [1, 95]) {
      const next = nextHand(withFinalStacks([stack, 222, 160, 160, 96, 165]));
      expect(next.seats).toEqual(KINGS_SHOWDOWN.seats);
      expect(next.seats[0]).toMatchObject({ seat: 1, name: 'Ava', kind: 'bot', style: 'TAG' });
      expect(stackValues(next)).toEqual([stack, 222, 160, 160, 96, 165]);
      expect(next.nextBotName).toBe(0);
      let dealt: TableState | undefined;
      expect(() => (dealt = dealHand(next, NEXT_CODE))).not.toThrow();
      expect(startingStacks(dealt as TableState)[0]).toBe(stack);
    }
  });

  it('two bots bust in one hand and the new bots have unique names', () => {
    const next = nextHand(withFinalStacks([0, 222, 160, 160, 96, 0]));
    expect(next.seats[0]).toMatchObject({ seat: 1, kind: 'bot', name: 'Jay' });
    expect(next.seats[5]).toMatchObject({ seat: 6, kind: 'bot', name: 'Kit' });
    expect(stackValues(next)).toEqual([160, 222, 160, 160, 96, 160]);
    const names = next.seats.map((s) => s.name);
    expect(new Set(names).size).toBe(6);
    expect(next.nextBotName).toBe(2);

    const again = nextHand(finishedWith(next, NEXT_CODE, [0, 222, 160, 160, 96, 160]));
    expect(again.seats[0]).toMatchObject({ seat: 1, kind: 'bot', name: 'Lou' });
    expect(again.seats[0]?.style).toBe(drawReplacementStyle('Custom', 6, NEXT_CODE, 1));
    expect(again.seats[5]).toEqual(next.seats[5]);
    expect(again.nextBotName).toBe(3);

    const jayAtTable: TableState = {
      ...KINGS_SHOWDOWN,
      seats: KINGS_SHOWDOWN.seats.map((s) => (s.seat === 2 ? { ...s, name: 'Jay' } : s)),
    };
    const skipped = nextHand(withFinalStacks([0, 222, 160, 160, 96, 165], jayAtTable));
    expect(skipped.seats[0]).toMatchObject({ seat: 1, name: 'Kit' });
    expect(skipped.seats[1]).toMatchObject({ seat: 2, name: 'Jay' });
    expect(skipped.nextBotName).toBe(2);
  });
});
