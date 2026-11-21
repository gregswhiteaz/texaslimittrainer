import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  nextButton,
  type Action,
  type HandState,
  type SeatConfig,
  type SeatNumber,
} from '../../src/engine/hand';
import { checkDeal } from '../../src/engine/invariants';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);

const table = (stacks: Record<number, number>): SeatConfig[] =>
  Object.entries(stacks).map(([seat, stack]) => ({ seat: Number(seat), stack }));

const deal = (stacks: Record<number, number>, button: SeatNumber): HandState =>
  createHand({
    stakes: STAKES,
    seats: table(stacks).filter((s) => s.stack > 0),
    button,
    deck: DECK,
  });

type Step = [SeatNumber, Action['type'], number?];

function play(state: HandState, ...steps: Step[]): HandState {
  let current = state;
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    current = result.state;
  }
  return current;
}

const blinds = (state: HandState) =>
  state.actions
    .filter((a) => a.type === 'small-blind' || a.type === 'big-blind')
    .map(({ seat, type, amount, added }) => ({ seat, type, amount, added }));
const player = (state: HandState, seat: SeatNumber) => state.players.find((p) => p.seat === seat);
const finals = (state: HandState) => state.players.map(({ seat, stack }) => ({ seat, stack }));
const SIX_AT_160 = { 1: 160, 2: 160, 3: 160, 4: 160, 5: 160, 6: 160 };

describe('button and blinds past busted seats', () => {
  it('AC#1 the button moves to seat 2 and seats 3 and 4 post the blinds', () => {
    const first = play(
      deal(SIX_AT_160, 1),
      [4, 'fold'],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'fold'],
    );
    expect(first.result?.returned).toEqual({ seat: 3, amount: 2 });
    expect(first.result?.awards[0]?.amount).toBe(4);
    expect(finals(first)).toEqual(table({ 1: 160, 2: 158, 3: 162, 4: 160, 5: 160, 6: 160 }));
    const button = nextButton(finals(first), first.button);
    expect(button).toBe(2);
    const next = createHand({ stakes: STAKES, seats: finals(first), button, deck: DECK });
    expect(next.button).toBe(2);
    expect(blinds(next)).toEqual([
      { seat: 3, type: 'small-blind', amount: 2, added: 2 },
      { seat: 4, type: 'big-blind', amount: 4, added: 4 },
    ]);
    expect(next.toAct).toBe(5);
  });

  it('AC#2 a busted seat 3 is skipped for the button and blinds', () => {
    const stacks = { 1: 160, 2: 160, 3: 0, 4: 160, 5: 160, 6: 160 };
    const button = nextButton(table(stacks), 1);
    expect(button).toBe(2);
    const hand = deal(stacks, button);
    expect(hand.players.map((p) => p.seat)).toEqual([1, 2, 4, 5, 6]);
    expect(blinds(hand).map((b) => [b.seat, b.type])).toEqual([
      [4, 'small-blind'],
      [5, 'big-blind'],
    ]);
    expect(hand.toAct).toBe(6);
  });

  it('AC#3 a bust before the big blind posts no dead or missed blind', () => {
    const stacks = { 1: 160, 2: 160, 3: 160, 4: 0, 5: 160, 6: 160 };
    const button = nextButton(table(stacks), 1);
    expect(button).toBe(2);
    const hand = deal(stacks, button);
    expect(hand.actions).toEqual([
      { street: 'preflop', seat: 3, type: 'small-blind', amount: 2, added: 2 },
      { street: 'preflop', seat: 5, type: 'big-blind', amount: 4, added: 4 },
    ]);
    expect(hand.players.reduce((sum, p) => sum + p.totalContribution, 0)).toBe(6);
    for (const p of hand.players.filter((p) => p.seat !== 3 && p.seat !== 5)) {
      expect(p.totalContribution).toBe(0);
    }
  });

  it('AC#4 three players down to two play heads-up from the next hand', () => {
    const stacks = { 2: 200, 4: 280, 6: 0 };
    const button = nextButton(table(stacks), 2);
    expect(button).toBe(4);
    const hand = deal(stacks, button);
    expect(blinds(hand)).toEqual([
      { seat: 4, type: 'small-blind', amount: 2, added: 2 },
      { seat: 2, type: 'big-blind', amount: 4, added: 4 },
    ]);
    expect(hand.toAct).toBe(4);
    expect(legalActions(hand)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 2 },
      { seat: 4, type: 'raise', amount: 8 },
    ]);
    const called = play(hand, [4, 'call', 2]);
    expect(called.toAct).toBe(2);
    expect(legalActions(called)).toEqual([
      { seat: 2, type: 'check' },
      { seat: 2, type: 'raise', amount: 8 },
    ]);
  });

  it('AC#5 a $1 stack posts $1 of the $2 small blind and is all-in', () => {
    const hand = deal({ ...SIX_AT_160, 2: 1 }, 1);
    expect(blinds(hand)[0]).toEqual({ seat: 2, type: 'small-blind', amount: 2, added: 1 });
    expect(player(hand, 2)).toMatchObject({ stack: 0, allIn: true, totalContribution: 1 });
    expect(blinds(hand)[1]).toEqual({ seat: 3, type: 'big-blind', amount: 4, added: 4 });
    expect(hand.currentBet).toBe(4);
    expect(hand.toAct).toBe(4);
    const done = play(hand, [4, 'fold'], [5, 'fold'], [6, 'fold'], [1, 'fold']);
    expect(done.toAct).toBeNull();
    expect(done.result?.endedBy).toBe('showdown');
    expect(done.board).toHaveLength(5);
    expect(done.result?.returned).toEqual({ seat: 3, amount: 3 });
    expect(done.result?.awards[0]?.amount).toBe(2);
    expect((player(done, 2)?.stack ?? 0) + (player(done, 3)?.stack ?? 0)).toBe(161);
  });

  it('a short big blind is all-in and the others call the full blind', () => {
    const hand = deal({ ...SIX_AT_160, 3: 3 }, 1);
    expect(blinds(hand)[1]).toEqual({ seat: 3, type: 'big-blind', amount: 4, added: 3 });
    expect(player(hand, 3)?.allIn).toBe(true);
    expect(hand.currentBet).toBe(4);
    expect(legalActions(hand)).toEqual([
      { seat: 4, type: 'fold' },
      { seat: 4, type: 'call', amount: 4 },
      { seat: 4, type: 'raise', amount: 8 },
    ]);
    const folded = play(hand, [4, 'fold'], [5, 'fold'], [6, 'fold'], [1, 'fold']);
    expect(folded.toAct).toBe(2);
    const done = play(folded, [2, 'call', 2]);
    expect(done.result?.returned).toEqual({ seat: 2, amount: 1 });
    expect(done.result?.awards.map((a) => a.amount)).toEqual([6]);
    expect(done.pots.map((p) => p.eligible)).toEqual([[2, 3]]);
    expect((player(done, 2)?.stack ?? 0) + (player(done, 3)?.stack ?? 0)).toBe(163);

    // W9: both blinds all-in.
    const both = deal({ 1: 160, 2: 1, 3: 3 }, 1);
    expect(both.toAct).toBe(1);
    expect(legalActions(both)).toEqual([
      { seat: 1, type: 'fold' },
      { seat: 1, type: 'call', amount: 4 },
      { seat: 1, type: 'raise', amount: 8 },
    ]);
    const after = play(both, [1, 'fold']);
    expect(after.result?.returned).toEqual({ seat: 3, amount: 2 });
    expect(after.result?.awards.reduce((sum, a) => sum + a.amount, 0)).toBe(2);
  });

  it('a hand where nobody can bet is dealt out at once', () => {
    const w7 = deal({ 1: 1, 2: 160 }, 1);
    expect(w7.toAct).toBeNull();
    expect(w7.actions.map((a) => a.type)).toEqual(['small-blind', 'big-blind']);
    expect(w7.board).toHaveLength(5);
    expect(w7.burned).toHaveLength(3);
    expect(w7.result?.returned).toEqual({ seat: 2, amount: 3 });
    expect(w7.result?.awards).toHaveLength(1);
    expect(w7.result?.awards[0]).toMatchObject({ pot: 0, amount: 2 });
    expect(w7.players.reduce((sum, p) => sum + p.stack, 0)).toBe(161);
    expect(checkDeal(w7)).toEqual([]);

    const shortBb = deal({ 1: 160, 2: 1 }, 1);
    expect(shortBb.toAct).toBeNull();
    expect(shortBb.result?.returned).toEqual({ seat: 1, amount: 1 });
    expect(shortBb.result?.awards.reduce((sum, a) => sum + a.amount, 0)).toBe(2);
    expect(checkDeal(shortBb)).toEqual([]);

    const mustAct = deal({ 1: 160, 2: 3 }, 1);
    expect(mustAct.toAct).toBe(1);
    expect(legalActions(mustAct)).toEqual([
      { seat: 1, type: 'fold' },
      { seat: 1, type: 'call', amount: 2 },
      { seat: 1, type: 'raise', amount: 8 },
    ]);
    const called = play(mustAct, [1, 'call', 2]);
    expect(called.result?.returned).toEqual({ seat: 1, amount: 1 });
    expect(called.result?.awards.reduce((sum, a) => sum + a.amount, 0)).toBe(6);
  });
});
