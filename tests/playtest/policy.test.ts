import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { shuffledDeck } from '../../src/engine/deck';
import { applyAction, createHand, type Action, type HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { fnv1a32, Xoshiro128 } from '../../src/engine/seeded-random';
import { decideManiac } from '../../src/bots/maniac';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import {
  lineUpPolicyFactory,
  randomMovePolicy,
  seatGenerator,
  seededTagPolicy,
} from '../../src/playtest/policy';
import { runPlaytest, type PolicyFactory } from '../../src/playtest/runner';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK = shuffledDeck('00000000000000000000000000000001');

function play(size: number, button: number, actions: Action[]): HandState {
  let state = createHand({
    stakes: STAKES,
    seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button,
    deck: DECK,
  });
  for (const action of actions) {
    const applied = applyAction(state, action);
    if (!applied.ok) throw new Error(applied.error.message);
    state = applied.state;
  }
  return state;
}

/** Preflop, 6 seats, button 1: seats 4 and 5 raise; seat 6 raises next (bet count 4). */
const PREFLOP_3: Action[] = [
  { seat: 4, type: 'raise', amount: 8 },
  { seat: 5, type: 'raise', amount: 12 },
];
const PREFLOP_4: Action[] = [...PREFLOP_3, { seat: 6, type: 'raise', amount: 16 }];
/** 3 seats, button 1: limp to the turn, then bet and two raises; seat 2 re-raises next (bet count 4). */
const TURN_3: Action[] = [
  { seat: 1, type: 'call', amount: 4 },
  { seat: 2, type: 'call', amount: 2 },
  { seat: 3, type: 'check' },
  { seat: 2, type: 'check' },
  { seat: 3, type: 'check' },
  { seat: 1, type: 'check' },
  { seat: 2, type: 'bet', amount: 8 },
  { seat: 3, type: 'raise', amount: 16 },
  { seat: 1, type: 'raise', amount: 24 },
];
const TURN_4: Action[] = [...TURN_3, { seat: 2, type: 'raise', amount: 32 }];

function choices(state: HandState): Set<Action['type']> {
  const view = playerView(state, state.toAct as number);
  const types = new Set<Action['type']>();
  for (let seed = 0; seed < 1000; seed++) {
    types.add(randomMovePolicy(new Xoshiro128(seed))(view).type);
  }
  return types;
}

describe('randomMovePolicy', () => {
  it("draws from the engine's legal set without its own bet-cap filter", () => {
    const capped = play(6, 1, PREFLOP_4);
    const view = playerView(capped, capped.toAct as number);
    const synthetic = {
      ...view,
      legalActions: [
        ...view.legalActions,
        { seat: view.seat, type: 'raise', amount: 20 } as Action,
      ],
    };
    const drawn = new Set<Action['type']>();
    for (let seed = 0; seed < 1000; seed++) {
      drawn.add(randomMovePolicy(new Xoshiro128(seed))(synthetic).type);
    }
    expect(synthetic.betCount).toBe(4);
    expect(drawn.has('raise')).toBe(true);

    const spots = [capped, play(3, 1, TURN_4)];
    expect(spots.map((s) => [s.street, s.betCount])).toEqual([
      ['preflop', 4],
      ['turn', 4],
    ]);
    for (const spot of spots) {
      const offered = playerView(spot, spot.toAct as number).legalActions.map((a) => a.type);
      expect(offered).toEqual(['fold', 'call']);
      expect([...choices(spot)].sort()).toEqual(['call', 'fold']);
    }
    for (const control of [play(6, 1, PREFLOP_3), play(3, 1, TURN_3)]) {
      expect(control.betCount).toBe(3);
      expect(choices(control).has('raise')).toBe(true);
    }
    expect(
      readFileSync(new URL('../../src/playtest/policy.ts', import.meta.url), 'utf8'),
    ).not.toContain('betCount');
  });

  it('returns one of the legal actions, drawing once per decision', () => {
    const state = play(6, 1, []);
    const view = playerView(state, state.toAct as number);
    const rng = new Xoshiro128(11);
    const twin = new Xoshiro128(11);
    for (let i = 0; i < 50; i++) {
      const action = randomMovePolicy(rng)(view);
      expect(action).toEqual(view.legalActions[twin.nextInt(view.legalActions.length)]);
    }
  });

  it('throws RangeError for a seat that is not to act', () => {
    const state = play(6, 1, []);
    const view = playerView(state, 1);
    expect(() => randomMovePolicy(new Xoshiro128(1))(view)).toThrow(RangeError);
  });

  it('seeds a seat generator from the replay code and seat', () => {
    const code = '000000000000002a0000000000000001';
    expect(seatGenerator(code, 3).nextUint32()).toBe(
      new Xoshiro128(fnv1a32(`${code}/3`)).nextUint32(),
    );
  });
});

describe('lineUpPolicyFactory', () => {
  it('lineUpPolicyFactory plays the preset at 6 seats and random moves otherwise', () => {
    const tough = runPlaytest({ hands: 20, seed: 42, size: 6, lineUp: 'Tough' });
    const maniacAtSeat2: PolicyFactory = (code, seat) =>
      seat === 2
        ? (view) => decideManiac(view, { random: botRandom(botDecisionSeed(code, view)) })
        : seededTagPolicy(code);
    expect(tough).toEqual(
      runPlaytest({ hands: 20, seed: 42, size: 6 }, undefined, { makePolicy: maniacAtSeat2 }),
    );
    expect(tough.violations).toBe(0);
    expect(tough).not.toEqual(runPlaytest({ hands: 20, seed: 42, size: 6 }));

    expect(runPlaytest({ hands: 100, seed: 42, size: 9, lineUp: 'Tough' })).toEqual(
      runPlaytest({ hands: 100, seed: 42, size: 9 }),
    );

    const allRandom: PolicyFactory = (code, seat) => randomMovePolicy(seatGenerator(code, seat));
    expect(
      runPlaytest({ hands: 20, seed: 42, size: 6, lineUp: 'Soft' }, undefined, {
        makePolicy: allRandom,
      }),
    ).toEqual(runPlaytest({ hands: 20, seed: 42, size: 6 }, undefined, { makePolicy: allRandom }));

    expect(() => lineUpPolicyFactory('Mixed', 11)).toThrow(RangeError);
  });
});
