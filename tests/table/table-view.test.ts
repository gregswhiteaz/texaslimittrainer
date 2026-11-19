import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { ActionRecord, HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { dealHand, seatSession, type TableState } from '../../src/table/session';
import {
  headerText,
  lastActionText,
  positionName,
  potTotal,
  seatSlot,
  slotPosition,
  tableView,
  type SeatView,
} from '../../src/table/table-view';
import { FLOP_BET, PREFLOP, SEAT_1_DEALT, SHOWDOWN, play } from '../support/table-scenarios';

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function seatOf(table: TableState, seat: number): SeatView {
  const view = tableView(table).seats.find((s) => s.seat === seat);
  if (view === undefined) throw new Error(`No seat ${seat}`);
  return view;
}

const record = (type: ActionRecord['type'], amount: number): ActionRecord => ({
  street: 'preflop',
  seat: 1,
  type,
  amount,
  added: amount,
});

describe('Table view model', () => {
  it("view model formats actions, positions, slots and pot from the user's view", () => {
    expect(
      (
        [
          ['small-blind', 2],
          ['big-blind', 4],
          ['fold', 0],
          ['check', 0],
          ['call', 4],
          ['bet', 4],
          ['raise', 8],
        ] as const
      ).map(([type, amount]) => lastActionText(record(type, amount))),
    ).toEqual([
      'Small blind $2',
      'Big blind $4',
      'Folded',
      'Checked',
      'Called $4',
      'Bet $4',
      'Raised to $8',
    ]);
    expect(lastActionText({ ...record('raise', 8), added: 4 })).toBe('Raised to $8');

    const names = (seats: number[], button: number): string[] =>
      seats.map((seat) => positionName(seat, seats, button));
    expect(names([1, 2, 3, 4, 5, 6], 6)).toEqual([
      'Small blind',
      'Big blind',
      'Under the gun',
      'Hijack',
      'Cutoff',
      'Button',
    ]);
    const H = 'Hijack';
    const C = 'Cutoff';
    const B = 'Button';
    const S = 'Small blind';
    const G = 'Big blind';
    const U = 'Under the gun';
    expect([1, 2, 3, 4, 5].map((button) => names([1, 2, 3, 4, 5, 6], button))).toEqual([
      [B, S, G, U, H, C],
      [C, B, S, G, U, H],
      [H, C, B, S, G, U],
      [U, H, C, B, S, G],
      [G, U, H, C, B, S],
    ]);
    expect(names([1, 2, 3], 3)).toEqual(['Small blind', 'Big blind', 'Button']);
    expect(names([1, 2, 3], 1)).toEqual(['Button', 'Small blind', 'Big blind']);
    expect(names([1, 2, 3, 4], 4)).toEqual(['Small blind', 'Big blind', 'Cutoff', 'Button']);
    expect(names([1, 2, 3, 4, 5, 6, 7, 8, 9], 9)).toEqual([
      'Small blind',
      'Big blind',
      'Under the gun',
      'Under the gun +1',
      'Under the gun +2',
      'Under the gun +3',
      'Hijack',
      'Cutoff',
      'Button',
    ]);

    const six = [1, 2, 3, 4, 5, 6];
    expect(six.map((seat) => seatSlot(seat, six, 5))).toEqual([2, 3, 4, 5, 0, 1]);
    expect(slotPosition(3, 6)).toEqual({ left: 50, top: 8 });
    expect([1, 2, 4, 5].map((k) => slotPosition(k, 6))).toEqual([
      { left: 15.4, top: 71 },
      { left: 15.4, top: 29 },
      { left: 84.6, top: 29 },
      { left: 84.6, top: 71 },
    ]);
    expect(potTotal(null)).toBe(0);

    // Action-line rules 1-4.
    expect(seatOf(PREFLOP, 3).action).toBe('Folded');
    expect(seatOf(FLOP_BET, 1).action).toBe('Folded');
    expect(seatOf(FLOP_BET, 2).action).toBe('Bet $4');
    expect(seatOf(FLOP_BET, 6).action).toBe('Waiting');
    expect(seatOf(FLOP_BET, 5).action).toBeNull();
    expect(seatOf(FLOP_BET, 5).toAct).toBe(true);
    expect(tableView(SHOWDOWN).seats.map((s) => s.action)).not.toContain('Waiting');
    expect(seatOf(SHOWDOWN, 2).action).toBe('Checked');
    expect(seatOf(SHOWDOWN, 5).action).toBe('Checked');
    expect(seatOf(SHOWDOWN, 6).action).toBe('Folded');
    expect(tableView(SHOWDOWN).seats.some((s) => s.toAct)).toBe(false);

    const seated = tableView(seatSession());
    expect(seated.seats.map((s) => s.seat)).toEqual([1, 2, 3, 4, 6, 5]);
    expect(seated.seats.map((s) => s.stack)).toEqual(Array(6).fill(160));
    expect(seated.seats.every((s) => s.holeCards === null && !s.holdsCards)).toBe(true);
    expect(seated.seats.every((s) => s.action === null && s.streetAmount === 0)).toBe(true);
    expect(seated.board).toEqual([]);
    expect(seated.placeholders).toBe(5);
    expect(seated.pot).toBe(0);
    expect(seated.seats.filter((s) => s.isButton).map((s) => s.seat)).toEqual([6]);
    expect(seated.header).toBe('Cash · 6 players · $4/$8 · Hand #1');

    const copy = structuredClone(FLOP_BET);
    const frozen = deepFreeze(structuredClone(FLOP_BET));
    tableView(frozen);
    expect(frozen).toEqual(copy);

    const source = readFileSync(new URL('../../src/table/table-view.ts', import.meta.url), 'utf8');
    const specifiers = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? '');
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier).not.toMatch(/^react(-dom)?(\/|$)/);
      expect(specifier).not.toMatch(/(^|\/)ui(\/|$)/);
    }
  });

  it('the big blind to act with no raise shows Big blind $4 and To act together', () => {
    const table = dealHand(seatSession(), replayCodeFromWords([1, 2, 3, 4]));
    const hand = play(table.hand as HandState, '3:call 4:call 5:call 6:call 1:call');
    const bb = seatOf({ ...table, hand }, 2);
    expect(bb.toAct).toBe(true);
    expect(bb.action).toBe('Big blind $4');
    expect(bb.streetAmount).toBe(4);
    expect(seatOf({ ...table, hand }, 1).action).toBe('Called $2');
  });

  it('the user seat carries position and cards; bots carry slot and card back', () => {
    const user = seatOf(FLOP_BET, 5);
    expect(user.position).toBe('Cutoff');
    expect(user.slot).toBeNull();
    expect(user.style).toBeNull();
    expect(user.holdsCards).toBe(false);
    expect(user.holeCards).toHaveLength(2);
    const ben = seatOf(FLOP_BET, 2);
    expect(ben).toMatchObject({ style: 'Calling station', stack: 146, holdsCards: true });
    expect(ben.slot).toEqual({ left: 50, top: 8 });
    expect(ben.position).toBeNull();
    expect(ben.holeCards).toBeNull();

    expect(seatOf(SEAT_1_DEALT, 1).position).toBe('Small blind');
    expect(seatOf(SEAT_1_DEALT, 2).slot).toEqual(slotPosition(1, 6));
  });

  it('pot adds collected chips to this street bets; header shows the hand number', () => {
    const hand = FLOP_BET.hand as HandState;
    expect(potTotal(playerView(hand, 5))).toBe(30);
    expect(tableView(FLOP_BET).pot).toBe(30);
    expect(tableView(SHOWDOWN).pot).toBe(0);
    expect(headerText(FLOP_BET.config, 133)).toBe('Cash · 6 players · $4/$8 · Hand #133');
  });

  it('unknown seats throw RangeError', () => {
    expect(() => positionName(7, [1, 2, 3], 1)).toThrow(RangeError);
    expect(() => positionName(1, [1, 2, 3], 7)).toThrow('Seat 7 is not at the table');
    expect(() => seatSlot(1, [1, 2, 3], 9)).toThrow(RangeError);
  });
});
