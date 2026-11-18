import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import { evaluate } from '../../src/engine/hand-evaluator';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
} from '../../src/engine/hand';
import { Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const MAX_ACTIONS = 400;

/** A-11: seats, button and deck from the generator. */
function dealHand(rng: Xoshiro128): HandState {
  const n = 3 + rng.nextInt(8);
  const button = 1 + rng.nextInt(n);
  const words = [rng.nextUint32(), rng.nextUint32(), rng.nextUint32(), rng.nextUint32()];
  return createHand({
    stakes: STAKES,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button,
    deck: shuffledDeck(replayCodeFromWords(words)),
  });
}

/** A-11: uniform among legal actions, without bet/raise once the street has 4 bets. */
function choose(rng: Xoshiro128, state: HandState, legal: readonly Action[]): Action {
  const allowed =
    state.betCount >= 4 ? legal.filter((a) => a.type !== 'bet' && a.type !== 'raise') : legal;
  return allowed[rng.nextInt(allowed.length)] as Action;
}

function playOut(
  rng: Xoshiro128,
  onDecision?: (state: HandState, legal: readonly Action[]) => void,
): HandState {
  let state = dealHand(rng);
  for (let count = 0; state.result === null; count++) {
    if (count >= MAX_ACTIONS) throw new Error(`Hand did not complete in ${MAX_ACTIONS} actions`);
    const legal = legalActions(state);
    onDecision?.(state, legal);
    const result = applyAction(state, choose(rng, state, legal));
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const unitOf = (state: HandState) =>
  state.street === 'preflop' || state.street === 'flop' ? STAKES.smallBet : STAKES.bigBet;

/** Returns a failure description, or null when the completed hand is legal. */
function checkEnd(state: HandState): string | null {
  const n = state.players.length;
  const result = state.result;
  if (result === null || state.toAct !== null) return 'hand not complete';
  if (legalActions(state).length !== 0) return 'legal actions after completion';
  const active = state.players.filter((p) => !p.folded);
  if (state.players.reduce((sum, p) => sum + p.stack, 0) !== 160 * n) return 'chips not conserved';
  if (state.players.some((p) => p.stack < 0)) return 'negative stack';

  if (result.endedBy === 'fold') {
    if (active.length !== 1) return 'fold-out with several players left';
    if (result.showdown.length !== 0) return 'fold-out shows cards';
    if (![0, 3, 4, 5].includes(state.board.length)) return 'bad board length';
  } else {
    if (active.length < 2) return 'showdown with one player';
    if (state.board.length !== 5) return 'showdown without five board cards';
    const shown = result.showdown.map((s) => s.seat).sort((a, b) => a - b);
    if (shown.join() !== active.map((p) => p.seat).join()) return 'showdown seats differ';
    const best = Math.max(...result.showdown.map((s) => s.rank));
    for (const s of result.showdown) {
      if (s.rank !== evaluate([...s.holeCards, ...state.board])) return 'wrong rank';
    }
    const winners = (result.awards[0]?.winners ?? []).map((w) => w.seat).sort((a, b) => a - b);
    const expected = result.showdown
      .filter((s) => s.rank === best)
      .map((s) => s.seat)
      .sort((a, b) => a - b);
    if (winners.join() !== expected.join()) return 'winners are not the best hands';
  }

  // D-5 positions: hole cards at deal index j and j + n, burns at 2n, 2n+4, 2n+6.
  const dealOrder = [
    ...state.players.filter((p) => p.seat > state.button),
    ...state.players.filter((p) => p.seat <= state.button),
  ];
  for (const [j, p] of dealOrder.entries()) {
    if (p.holeCards[0] !== state.deck[j] || p.holeCards[1] !== state.deck[j + n]) {
      return 'hole cards out of position';
    }
  }
  const boardAt = [1, 2, 3, 5, 7].map((k) => state.deck[2 * n + k]);
  const burnAt = [0, 4, 6].map((k) => state.deck[2 * n + k]);
  const burnCount = [0, 0, 0, 1, 2, 3][state.board.length];
  if (state.board.join() !== boardAt.slice(0, state.board.length).join()) return 'board position';
  if (state.burned.join() !== burnAt.slice(0, burnCount).join()) return 'burn position';
  const cards: Card[] = [
    ...state.players.flatMap((p) => [...p.holeCards]),
    ...state.burned,
    ...state.board,
  ];
  if (new Set(cards).size !== cards.length) return 'duplicate card';
  const revealed = new Set([...state.board, ...result.showdown.flatMap((s) => [...s.holeCards])]);
  if (state.burned.some((card) => revealed.has(card))) return 'burned card revealed';

  const bets = new Map<string, number>();
  for (const a of state.actions) {
    if (a.type === 'bet' || a.type === 'raise' || a.type === 'big-blind') {
      bets.set(a.street, (bets.get(a.street) ?? 0) + 1);
    }
  }
  if ([...bets.values()].some((count) => count > 4)) return 'more than 4 bets on a street';
  return null;
}

describe('hand property', () => {
  it('AC#4 every bet or raise is one small bet preflop and flop and one big bet turn and river', () => {
    const rng = new Xoshiro128(41);
    for (let h = 0; h < 2_000; h++) {
      const state = playOut(rng, (s, legal) => {
        const player = s.players.find((p) => p.seat === s.toAct);
        const u = unitOf(s);
        for (const a of legal) {
          if (a.type === 'bet') expect(a.amount).toBe(u);
          if (a.type === 'raise') expect(a.amount).toBe(s.currentBet + u);
          if (a.type === 'call')
            expect(a.amount).toBe(s.currentBet - (player?.streetContribution ?? 0));
        }
      });
      // Replay the records to check `added` against the street's bet sizes.
      const contribution = new Map<number, number>();
      let street = '';
      let currentBet = 0;
      for (const a of state.actions) {
        if (a.street !== street) {
          street = a.street;
          contribution.clear();
          currentBet = 0;
        }
        const u = a.street === 'preflop' || a.street === 'flop' ? 4 : 8;
        const before = contribution.get(a.seat) ?? 0;
        if (a.type === 'bet') {
          expect([a.amount, a.added]).toEqual([u, u]);
        } else if (a.type === 'raise') {
          expect(a.amount).toBe(currentBet + u);
          expect(a.added).toBe(a.amount - before);
        } else if (a.type === 'call') {
          expect(a.added).toBe(currentBet - before);
        }
        contribution.set(a.seat, before + a.added);
        currentBet = Math.max(currentBet, before + a.added);
      }
    }
  });

  it('AC#8 100,000 seeded random hands with 3 to 10 players end in a legal state', () => {
    const rng = new Xoshiro128(20261117);
    const endings = { fold: 0, showdown: 0 };
    for (let h = 0; h < 100_000; h++) {
      const state = playOut(rng);
      const failure = checkEnd(state);
      if (failure !== null) {
        expect.fail(`hand ${h}: ${failure}`);
      }
      endings[(state.result as NonNullable<HandState['result']>).endedBy]++;
    }
    expect(endings.fold).toBeGreaterThan(0);
    expect(endings.showdown).toBeGreaterThan(0);
  }, 300_000);
});
