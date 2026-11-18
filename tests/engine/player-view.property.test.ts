import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  type Action,
  type HandConfig,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { actWith, playerView, type SeatPolicy } from '../../src/engine/player-view';
import { fnv1a32, Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const HANDS = 300;
const MAX_ACTIONS = 400;

/** 3–10 seats, random button, deck from a random replay code. */
function dealConfig(rng: Xoshiro128): HandConfig {
  const n = 3 + rng.nextInt(8);
  const button = 1 + rng.nextInt(n);
  const words = [rng.nextUint32(), rng.nextUint32(), rng.nextUint32(), rng.nextUint32()];
  return {
    stakes: STAKES,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button,
    deck: shuffledDeck(replayCodeFromWords(words)),
  };
}

/** A-7: uniform among the view's legal actions (no bet/raise at 4 bets), seeded by a hash of the whole view. */
function seededPolicy(seed: number): SeatPolicy {
  return (view) => {
    const rng = new Xoshiro128(seed ^ fnv1a32(JSON.stringify(view)));
    const allowed =
      view.betCount >= 4
        ? view.legalActions.filter((a) => a.type !== 'bet' && a.type !== 'raise')
        : view.legalActions;
    return allowed[rng.nextInt(allowed.length)] as Action;
  };
}

function replay(config: HandConfig, deck: readonly Card[], actions: readonly Action[]): HandState {
  let state = createHand({ ...config, deck });
  for (const action of actions) {
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

/** 0-based deck indices the seat can see: its two hole cards and the board dealt so far. */
function visibleIndices(state: HandState, seat: SeatNumber): Set<number> {
  const seats = state.players.map((p) => p.seat);
  const n = seats.length;
  const start = seats.findIndex((s) => s > state.button);
  const dealOrder = start <= 0 ? seats : [...seats.slice(start), ...seats.slice(0, start)];
  const j = dealOrder.indexOf(seat);
  const board = [2 * n + 1, 2 * n + 2, 2 * n + 3, 2 * n + 5, 2 * n + 7].slice(
    0,
    state.board.length,
  );
  return new Set([j, j + n, ...board]);
}

describe('player-view property', () => {
  it("AC#2 hidden cards never change the view or a seeded policy's action", () => {
    const rng = new Xoshiro128(20261117);
    let decisions = 0;
    for (let hand = 0; hand < HANDS; hand++) {
      const config = dealConfig(rng);
      const policy = seededPolicy(rng.nextUint32());
      const taken: Action[] = [];
      let state = createHand(config);
      while (state.result === null) {
        if (taken.length >= MAX_ACTIONS) throw new Error('Hand did not complete');
        const seat = state.toAct as SeatNumber;
        const visible = visibleIndices(state, seat);
        const hidden = config.deck.map((_, i) => i).filter((i) => !visible.has(i));

        const offset = 1 + rng.nextInt(hidden.length - 1);
        const rotated = [...config.deck];
        hidden.forEach((index, k) => {
          rotated[index] = config.deck[hidden[(k + offset) % hidden.length] as number] as Card;
        });
        expect(hidden.every((i) => rotated[i] !== config.deck[i])).toBe(true);
        expect([...visible].every((i) => rotated[i] === config.deck[i])).toBe(true);

        const other = replay(config, rotated, taken);
        const view = playerView(state, seat);
        expect(playerView(other, seat)).toEqual(view);
        expect(policy(playerView(other, seat))).toEqual(policy(view));

        const ownIndex = [...visible][rng.nextInt(2)] as number;
        const swapWith = hidden[rng.nextInt(hidden.length)] as number;
        const swapped = [...config.deck];
        swapped[ownIndex] = config.deck[swapWith] as Card;
        swapped[swapWith] = config.deck[ownIndex] as Card;
        expect(playerView(replay(config, swapped, taken), seat)).not.toEqual(view);

        let chosen: Action | undefined;
        const result = actWith(state, (v) => {
          chosen = policy(v);
          return chosen;
        });
        if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
        taken.push(chosen as Action);
        state = result.state;
        decisions++;
      }
    }
    expect(decisions).toBeGreaterThan(HANDS);
  });
});
