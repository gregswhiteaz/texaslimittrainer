import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { recommendPostflop } from '../../src/advice/postflop';
import { callingRange, estimateOpponentRanges, unseenCombos } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, recommend } from '../../src/advice/recommend';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { handReplayCode, playHand } from '../../src/playtest/runner';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

describe('postflop advice with action ranges', () => {
  it('actions mode is total and deterministic', () => {
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
