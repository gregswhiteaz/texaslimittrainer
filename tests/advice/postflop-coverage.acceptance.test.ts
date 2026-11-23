import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { POSTFLOP_RULE_IDS, recommendPostflop, toPct } from '../../src/advice/postflop';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

/** The (n + 0.5) / 1000 points in [0, 1] where toPct's + 1e-9 nudge changes the result. */
const NUDGED: readonly [number, number][] = [
  [0.5005, 50.1],
  [0.5015, 50.2],
  [0.5025, 50.3],
  [0.5035, 50.4],
  [0.5045, 50.5],
  [0.5055, 50.6],
  [0.5065, 50.7],
  [0.5075, 50.8],
  [0.5085, 50.9],
  [0.5095, 51.0],
  [0.5105, 51.1],
  [0.5115, 51.2],
];

describe('postflop advice coverage (TASK-7.22)', () => {
  it('AC#1 toPct rounds the half-way points the nudge decides up: 0.5005 is 50.1', () => {
    // Without the nudge, floating point rounds 0.5005 down; this keeps the pin dependent on it.
    expect(Math.round(0.5005 * 1000) / 10).toBe(50);
    for (const [fraction, pct] of NUDGED) {
      expect(toPct(fraction), `toPct(${fraction})`).toBe(pct);
    }
  });

  it('AC#2 decisions on the flop, turn and river, with folded seats, all get legal advice', () => {
    const oneDecimal = (x: number) => Math.round(x * 10) / 10;
    const streets = new Set<string>();
    let foldedSeatRuns = 0;
    let discards = 0;
    fc.assert(
      fc.property(
        fc.shuffledSubarray([...ALL_CARDS], { minLength: 52, maxLength: 52 }),
        fc.array(fc.nat(), { minLength: 80, maxLength: 80 }),
        fc.nat({ max: 23 }),
        (deck, choices, stopAt) => {
          let state = createHand({
            stakes: STAKES_4_8,
            seats: SEATS.map((seat) => ({ seat, stack: 160 })),
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
          if (state.toAct === null) discards++;
          fc.pre(state.toAct !== null);
          const view = playerView(state, state.toAct as SeatNumber);
          const advice = recommendPostflop(view);
          streets.add(view.street);
          if (view.players.some((p) => p.folded && p.seat !== view.seat)) foldedSeatRuns++;

          expect(advice.street).toBe(view.street);
          expect(['fold', 'check', 'call', 'bet', 'raise']).toContain(advice.action);
          expect(view.legalActions).toContainEqual(advice.move);
          expect(advice.move.type).toBe(advice.action);
          expect(POSTFLOP_RULE_IDS).toContain(advice.ruleId);
          for (const pct of [advice.equityPct, advice.requiredEquityPct]) {
            expect(pct).toBeGreaterThanOrEqual(0);
            expect(pct).toBeLessThanOrEqual(100);
            expect(pct).toBe(oneDecimal(pct));
          }
          if (advice.callAmount > 0) {
            expect(advice.requiredEquityPct).toBe(
              toPct(advice.callAmount / (advice.pot + advice.callAmount)),
            );
          }
          // TASK-7.8: the value rules come first when a bet or raise is legal.
          const value =
            view.legalActions.some((a) => a.type === 'bet' || a.type === 'raise') &&
            advice.equityVsCallingRangePct > 50;
          const expectedRule =
            advice.callAmount === 0
              ? value
                ? 'value-bet'
                : 'check-free'
              : value
                ? 'value-raise'
                : advice.equityPct >= advice.requiredEquityPct
                  ? 'pot-odds-call'
                  : 'pot-odds-fold';
          expect(advice.ruleId).toBe(expectedRule);
        },
      ),
      { numRuns: 60, seed: 7322 },
    );
    expect([...streets].sort()).toEqual(['flop', 'river', 'turn']);
    expect(foldedSeatRuns).toBeGreaterThan(0);
    expect(discards).toBeGreaterThan(0);
  });
});
