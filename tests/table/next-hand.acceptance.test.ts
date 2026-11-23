import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import type { Action, HandState } from '../../src/engine/hand';
import {
  applyUserAction,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';
import { tableView } from '../../src/table/table-view';
import { KINGS_SHOWDOWN } from '../support/table-scenarios';

function checkOrCall(table: TableState): Action {
  const actions = userActions(table);
  const pick = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
  if (pick === undefined) throw new Error('No check or call offered');
  return pick;
}

/** Deals with `code` and plays to the end, the user checking or calling. */
function playHand(table: TableState, code: ReplayCode): TableState {
  let t = dealHand(table, code);
  for (let guard = 0; guard < 500; guard++) {
    const step = nextStep(t);
    if (step === 'done') return t;
    t = step === 'bot' ? stepBot(t) : applyUserAction(t, checkOrCall(t));
  }
  throw new Error('Hand did not finish');
}

const finalStacks = (table: TableState): number[] =>
  (table.hand as HandState).players.map((p) => p.stack);
const stackValues = (table: TableState): number[] => table.stacks.map((s) => s.stack);

/** KINGS_SHOWDOWN with its final stacks replaced by `stacks` (ascending seat order). */
function withFinalStacks(stacks: number[]): TableState {
  const hand = KINGS_SHOWDOWN.hand as HandState;
  return {
    ...KINGS_SHOWDOWN,
    hand: { ...hand, players: hand.players.map((p, i) => ({ ...p, stack: stacks[i] as number })) },
  };
}

describe('next hand acceptance', () => {
  it('stacks carry over and the button moves one seat each hand', () => {
    for (let i = 0; i < 20; i++) {
      const code = replayCodeFromWords([i, 1, 2, 3]);
      const done = playHand(seatSession(), code);
      const final = finalStacks(done);
      const next = nextHand(done);
      expect(stackValues(next), `code ${i}`).toEqual(final.map((s) => (s < 96 ? 160 : s)));
      expect(final.every((s) => s >= 96)).toBe(true);
      expect(next.stacks.map((s) => s.seat)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(next.button).toBe(1);
      expect(next.config.button).toBe(6);
      expect(next.handNumber).toBe(2);
      expect(next.hand).toBeNull();
      expect(next.replayCode).toBeNull();
      expect(next.userDecisions).toEqual([]);

      const dealt = dealHand(next, code);
      const hand = dealt.hand as HandState;
      expect(hand.button).toBe(1);
      expect(hand.players.map((p) => p.startingStack)).toEqual(stackValues(next));
      expect(dealt.config.button).toBe(6);
    }

    let table = seatSession();
    const buttons: number[] = [];
    for (let k = 0; k < 6; k++) {
      table = nextHand(playHand(table, replayCodeFromWords([k, 1, 2, 3])));
      buttons.push(table.button);
    }
    expect(buttons).toEqual([1, 2, 3, 4, 5, 6]);

    const fromThree = nextHand(
      playHand(seatSession({ button: 3 }), replayCodeFromWords([0, 1, 2, 3])),
    );
    expect(fromThree.button).toBe(4);
    expect(fromThree.config.button).toBe(3);
  });

  it('a seat below the minimum stack is handled before the next hand instead of a RangeError', () => {
    const short = nextHand(withFinalStacks([158, 222, 160, 160, 95, 165]));
    expect(stackValues(short)).toEqual([158, 222, 160, 160, 160, 165]);
    expect(() => dealHand(short, replayCodeFromWords([1, 1, 2, 3]))).not.toThrow();

    const edge = nextHand(withFinalStacks([0, 222, 160, 160, 96, 165]));
    expect(stackValues(edge)).toEqual([160, 222, 160, 160, 96, 165]);
    expect(edge.seats.slice(1)).toEqual(KINGS_SHOWDOWN.seats.slice(1));
    expect(edge.seats[0]).toMatchObject({ seat: 1, name: 'Jay', kind: 'bot' });
    const dealt = dealHand(edge, replayCodeFromWords([1, 1, 2, 3]));
    expect((dealt.hand as HandState).players.map((p) => p.startingStack)).toEqual([
      160, 222, 160, 160, 96, 165,
    ]);

    const lines = readFileSync(
      new URL('../../src/table/session.ts', import.meta.url),
      'utf8',
    ).split('\n');
    const marker = lines.findIndex((line) => /TEMPORARY \(TASK-3\.4 Q-4\)/.test(line));
    expect(marker).toBeGreaterThanOrEqual(0);
    const topUp = lines.findIndex((line) => /< minimum \? buyIn\(/.test(line));
    expect(topUp).toBeGreaterThan(marker);
    const near = lines.slice(Math.max(0, topUp - 3), topUp + 4).join('\n');
    expect(near).toContain('TASK-1.16 / TASK-3.11');
    expect(near).toMatch(/TEMPORARY \(TASK-3\.4 Q-4\)/);
  });

  it('sixty hands in a row carry stacks and never raise the minimum-stack error', () => {
    let table = seatSession();
    let added = 0;
    let short = 0;
    const buttons: number[] = [];
    for (let k = 1; k <= 60; k++) {
      expect(table.handNumber).toBe(k);
      table = playHand(table, replayCodeFromWords([7, k, 2, 3]));
      const final = finalStacks(table);
      expect(final.reduce((a, b) => a + b, 0)).toBe(960 + added);
      const next = nextHand(table);
      for (const [i, stack] of final.entries()) {
        const carried = stackValues(next)[i] as number;
        const before = table.seats[i];
        const after = next.seats[i];
        if (carried !== stack) {
          expect(carried).toBe(160);
          if (before?.kind === 'bot') {
            expect(stack).toBe(0);
            expect(after?.name).not.toBe(before.name);
          } else {
            expect(stack).toBeLessThan(96);
          }
          added += carried - stack;
        } else {
          expect(after).toEqual(before);
        }
        if (k === 43 && i === 1) {
          // 30 since TASK-7.8 (bots bet for value); 94 before.
          expect(stack).toBe(30);
          short = carried;
        }
      }
      expect(stackValues(next).reduce((a, b) => a + b, 0)).toBe(960 + added);
      buttons.push(next.button);
      table = next;
    }
    expect(table.handNumber).toBe(61);
    expect(buttons).toEqual(Array.from({ length: 60 }, (_, i) => (i % 6) + 1));
    expect(short).toBe(30);
  });

  it('the header counts each hand and the pot line reads the decided value after the award', () => {
    const first = playHand(seatSession(), replayCodeFromWords([3, 1, 2, 3]));
    expect(tableView(first).header).toBe('Cash · 6 players · $4/$8 · Hand #1');
    const second = dealHand(nextHand(first), replayCodeFromWords([4, 1, 2, 3]));
    expect(tableView(second).header).toBe('Cash · 6 players · $4/$8 · Hand #2');
    const third = playHand(
      nextHand(playHand(nextHand(first), replayCodeFromWords([4, 1, 2, 3]))),
      replayCodeFromWords([5, 1, 2, 3]),
    );
    expect(tableView(third).header).toBe('Cash · 6 players · $4/$8 · Hand #3');

    const kings = tableView(KINGS_SHOWDOWN);
    expect(kings.pot).toBe(0);
    expect(kings.seats.find((s) => s.seat === 2)?.stack).toBe(222);

    const seated = seatSession();
    const missing = { ...seated, stacks: seated.stacks.filter((s) => s.seat !== 6) };
    expect(() => tableView(missing)).toThrow(new RangeError('Seat 6 has no stack'));
    const source = readFileSync(new URL('../../src/table/table-view.ts', import.meta.url), 'utf8');
    const stackLine = source.split('\n').filter((line) => /^\s*stack:/.test(line));
    expect(stackLine).toHaveLength(1);
    expect(stackLine[0]).not.toContain('?? 0');
  });
});
