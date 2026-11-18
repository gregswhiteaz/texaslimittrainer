import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
} from '../../src/engine/hand';
import { playerView, type SeatPolicy } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { actionBar } from '../../src/table/action-bar';
import { buyIn, stakesFor, type Stake } from '../../src/table/session';

const STATES = 10_000;
const STAKES: Stake[] = [
  { smallBet: 2, bigBet: 4 },
  { smallBet: 4, bigBet: 8 },
  { smallBet: 10, bigBet: 20 },
  { smallBet: 15, bigBet: 30 },
];

function expectedLabel(action: Action): string {
  switch (action.type) {
    case 'fold':
      return 'Fold';
    case 'check':
      return 'Check';
    case 'call':
      return `Call $${action.amount}`;
    case 'bet':
      return `Bet $${action.amount}`;
    case 'raise':
      return `Raise to $${action.amount}`;
  }
}

describe('Action bar acceptance (seeded states)', () => {
  it("the bar equals the engine's legal actions in 10,000 seeded states", () => {
    const started = performance.now();
    const shapes = new Set<string>();
    let decisions = 0;

    for (let i = 0; decisions < STATES; i++) {
      const code = replayCodeFromWords([i, 0x5eed, 2, 3]);
      const count = 3 + (i % 8);
      const seats = Array.from({ length: count }, (_, k) => k + 1);
      const stake = STAKES[i % STAKES.length] as Stake;
      const policies = new Map<number, SeatPolicy>(
        seats.map((seat) => [seat, randomMovePolicy(seatGenerator(code, seat))]),
      );
      let hand: HandState = createHand({
        stakes: stakesFor(stake),
        seats: seats.map((seat) => ({ seat, stack: buyIn(stake) })),
        button: seats[i % count] as number,
        deck: shuffledDeck(code),
      });

      while (hand.toAct !== null && decisions < STATES) {
        const seat = hand.toAct;
        const view = playerView(hand, seat);
        const bar = actionBar(view);
        const legal = legalActions(hand);
        expect(bar.enabled).toBe(true);
        expect(bar.buttons.map((b) => b.action)).toEqual(legal);
        expect(bar.buttons.map((b) => b.label)).toEqual(legal.map(expectedLabel));
        shapes.add(legal.map((a) => a.type).join(','));

        for (const other of seats) {
          if (other === seat) continue;
          const idle = actionBar(playerView(hand, other));
          expect(idle.enabled).toBe(false);
          expect(idle.buttons.every((b) => b.action === null)).toBe(true);
        }

        decisions++;
        const policy = policies.get(seat) as SeatPolicy;
        const applied = applyAction(hand, policy(view));
        if (!applied.ok) throw new Error(applied.error.message);
        hand = applied.state;
      }
    }

    expect(decisions).toBe(STATES);
    expect(shapes).toContain('check,bet');
    expect(shapes).toContain('check,raise');
    expect(shapes).toContain('fold,call,raise');
    expect(performance.now() - started).toBeLessThan(10_000);
  });
});
