import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { recommendPostflop } from '../../src/advice/postflop';
import { callingRange, estimateOpponentRanges, unseenCombos } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, recommend } from '../../src/advice/recommend';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { handReplayCode, playHand } from '../../src/playtest/runner';
import sixMaxRaw from '../../src/advice/ranges/six-max.json' with { type: 'json' };

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);
type Step = [SeatNumber, Action['type'], number?];

/** A deck with `fixed[position] = card`; the remaining cards fill the other positions in order. */
function deckWith(fixed: Readonly<Record<number, string>>): Card[] {
  const map = new Map(Object.entries(fixed).map(([i, text]) => [Number(i), parseCards(text)[0]]));
  const used = new Set(map.values());
  const filler = ALL_CARDS.filter((card) => !used.has(card));
  return Array.from({ length: 52 }, (_, i) => map.get(i) ?? (filler.shift() as Card));
}

/** Button 1; plays `steps` on `deck`. */
function stateAfter(steps: Step[], seats = 6, deck: readonly Card[] = ALL_CARDS): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: seats }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const toActView = (steps: Step[], seats = 6, deck?: readonly Card[]): PlayerView => {
  const state = stateAfter(steps, seats, deck);
  return playerView(state, state.toAct as SeatNumber);
};

/** Throws `error` on the first `throws` calls, then reports 50% equity; records every input. */
function failingEquity(throws: number, error: () => Error = () => new RangeError('no deal')) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    if (calls.length <= throws) throw error();
    return {
      hero: { win: 0.5, tie: 0, equity: 0.5 },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'exact',
      trials: 0,
    };
  };
  return { fn, calls };
}

/** 6 seats: 4 limps, 6 raises, 1, 2 fold, 3 calls, 4 calls; each street: 3 checks, 4 bets, 6 calls, 3 to act. */
const FLOP_STEPS: Step[] = [
  [4, 'call', 4],
  [5, 'fold'],
  [6, 'raise', 8],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'call', 4],
  [4, 'call', 4],
  [3, 'check'],
  [4, 'bet', 4],
  [6, 'call', 4],
];
const TURN_STEPS: Step[] = [
  ...FLOP_STEPS,
  [3, 'call', 4],
  [3, 'check'],
  [4, 'bet', 8],
  [6, 'call', 8],
];
const RIVER_STEPS: Step[] = [
  ...TURN_STEPS,
  [3, 'call', 8],
  [3, 'check'],
  [4, 'bet', 8],
  [6, 'call', 8],
];

afterEach(() => {
  vi.doUnmock('../../src/advice/ranges/six-max.json');
  vi.resetModules();
});

describe('postflop advice with action ranges', () => {
  it('actions mode is total, deterministic and falls back', () => {
    const oneDecimal = (x: number) => Math.round(x * 10) / 10;
    const streets = new Set<string>();
    fc.assert(
      fc.property(
        fc.shuffledSubarray([...ALL_CARDS], { minLength: 52, maxLength: 52 }),
        fc.array(fc.nat(), { minLength: 80, maxLength: 80 }),
        fc.nat({ max: 23 }),
        (deck, choices, stopAt) => {
          let state = createHand({
            stakes: STAKES_4_8,
            seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
            button: 1,
            deck,
          });
          let postflopDecisions = 0;
          let step = 0;
          while (state.toAct !== null) {
            if (state.street !== 'preflop') {
              if (postflopDecisions === stopAt) break;
              postflopDecisions++;
            }
            const options = legalActions(state);
            const action = options[(choices[step++] ?? 0) % options.length] as Action;
            const result = applyAction(state, action);
            if (!result.ok) throw new Error(result.error.message);
            state = result.state;
          }
          fc.pre(state.toAct !== null);
          const view = playerView(state, state.toAct as SeatNumber);
          const advice = recommendPostflop(view, ACTION_RANGE_ADVICE);
          streets.add(view.street);
          expect(view.legalActions).toContainEqual(advice.move);
          expect(advice.opponents).toBe(estimateOpponentRanges(view).length);
          for (const pct of [advice.equityPct, advice.requiredEquityPct]) {
            expect(pct).toBe(oneDecimal(pct));
          }
          expect(recommendPostflop(view, ACTION_RANGE_ADVICE)).toEqual(advice);
        },
      ),
      { numRuns: 60, seed: 7505 },
    );
    expect([...streets].sort()).toEqual(['flop', 'river', 'turn']);

    for (const [steps, size] of [
      [FLOP_STEPS, 1081],
      [TURN_STEPS, 1035],
      [RIVER_STEPS, 990],
    ] as const) {
      const view = toActView([...steps]);
      expect(view.seat).toBe(3);
      const estimated = estimateOpponentRanges(view);
      expect(estimated.map((o) => o.seat)).toEqual([4, 6]);

      const once = failingEquity(1);
      const advice = recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: once.fn });
      expect(advice.opponents).toBe(2);
      // The whole-range run falls back to the starts; the calling-range run then succeeds first time.
      expect(once.calls.map((c) => c.opponents)).toEqual([
        estimated.map((o) => o.combos),
        estimated.map((o) => o.start),
        estimated.map((o) => callingRange(o.combos, view.board)),
      ]);

      const twice = failingEquity(2);
      recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: twice.fn });
      expect(twice.calls).toHaveLength(4);
      expect(twice.calls[2]?.opponents.map((r) => r.length)).toEqual([size, size]);

      const always = failingEquity(3);
      expect(() => recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: always.fn })).toThrow(
        RangeError,
      );
      expect(always.calls).toHaveLength(3);

      const other = failingEquity(1, () => new TypeError('broken'));
      expect(() => recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: other.fn })).toThrow(
        'broken',
      );
      expect(other.calls).toHaveLength(1);
    }

    // Heads-up: no authored ranges yet (A-3), so starts are every unseen combo; narrowing still applies.
    const headsUp = toActView(
      [
        [1, 'call', 2],
        [2, 'check'],
        [2, 'bet', 4],
      ],
      2,
    );
    const [hu] = estimateOpponentRanges(headsUp);
    expect(hu).toMatchObject({ seat: 2, position: null, line: null });
    expect(hu?.start).toEqual(unseenCombos([...headsUp.holeCards, ...headsUp.board]));
    expect(hu?.combos.length).toBeLessThan(1081);
    expect(hu?.combos.length).toBeGreaterThan(0);
    expect(recommendPostflop(headsUp, ACTION_RANGE_ADVICE).opponents).toBe(1);
  });

  it('a fully blocked start uses every unseen combo and an empty narrowing keeps the range', async () => {
    const data = JSON.parse(JSON.stringify(sixMaxRaw)) as {
      ranges: { position: string; line: string; hands: string }[];
    };
    for (const range of data.ranges) {
      if (range.position === 'BB' && range.line === 'four-bet') range.hands = 'AA';
      if (range.position === 'CO' && range.line === 'open-raise') range.hands = 'AA';
    }
    vi.resetModules();
    vi.doMock('../../src/advice/ranges/six-max.json', () => ({ default: data }));
    const ranges = await import('../../src/advice/ranges');

    // Seat 4 (UTG, deal index 2) holds Ah As; flop Ad 7c 2h. BB (3) four-bets: only Ac is left.
    const blockedDeck = deckWith({ 2: 'Ah', 8: 'As', 13: 'Ad', 14: '7c', 15: '2h' });
    const fourBet = toActView(
      [
        [4, 'raise', 8],
        [5, 'raise', 12],
        [6, 'fold'],
        [1, 'fold'],
        [2, 'fold'],
        [3, 'raise', 16],
        [4, 'call', 8],
        [5, 'call', 4],
        [3, 'check'],
      ],
      6,
      blockedDeck,
    );
    expect(fourBet.seat).toBe(4);
    const bb = ranges.estimateOpponentRanges(fourBet).find((o) => o.seat === 3);
    expect(bb).toMatchObject({ position: 'BB', line: 'four-bet' });
    expect(bb?.start).toEqual(ranges.unseenCombos([...fourBet.holeCards, ...fourBet.board]));

    // CO (6) opens AA and raises a rainbow flop K 8 3: AA is a Pair, so the raise would empty it.
    const coDeck = deckWith({ 13: 'Kc', 14: '8d', 15: '3h' });
    const raised = toActView(
      [
        [4, 'fold'],
        [5, 'fold'],
        [6, 'raise', 8],
        [1, 'fold'],
        [2, 'fold'],
        [3, 'call', 4],
        [3, 'bet', 4],
        [6, 'raise', 8],
      ],
      6,
      coDeck,
    );
    const [co] = ranges.estimateOpponentRanges(raised);
    expect(co).toMatchObject({ seat: 6, position: 'CO', line: 'open-raise' });
    expect(co?.start).toHaveLength(6);
    expect(co?.combos).toEqual(co?.start);
  });

  it('default advice stays on every unseen combo', () => {
    const views: PlayerView[] = [];
    const passive = (view: PlayerView): Action =>
      view.legalActions.find((a) => a.type === 'call') ??
      view.legalActions.find((a) => a.type === 'check') ??
      (view.legalActions[0] as Action);
    for (let k = 1; views.length < 200; k++) {
      playHand(handReplayCode(7505, k), 6, 1, k, {
        makePolicy: () => (view) => {
          if (view.street !== 'preflop' && views.length < 200) views.push(view);
          return passive(view);
        },
      });
    }
    const capture = () => {
      const inputs: EquityInput[] = [];
      const fn = (input: EquityInput): EquityResult => {
        inputs.push(input);
        return {
          hero: { win: 0.3, tie: 0, equity: 0.3 },
          opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
          method: 'exact',
          trials: 0,
        };
      };
      return { fn, inputs };
    };
    const byDefault = capture();
    const unseen = capture();
    for (const view of views) {
      expect(recommend(view, { equity: byDefault.fn })).toEqual(
        recommend(view, { opponentRanges: 'unseen', equity: unseen.fn }),
      );
    }
    expect(byDefault.inputs).toEqual(unseen.inputs);
    // Two runs per view: the whole unseen range, then the range that would call (TASK-7.8).
    byDefault.inputs.forEach((input, i) => {
      const all = unseenCombos([...input.hero, ...input.board]);
      const size = i % 2 === 0 ? all.length : callingRange(all, input.board).length;
      for (const range of input.opponents) expect(range).toHaveLength(size);
    });
    for (const view of views.slice(0, 10)) {
      expect(recommend(view)).toEqual(recommend(view, { opponentRanges: 'unseen' }));
    }
  });
});
