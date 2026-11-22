import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { recommend } from '../../src/advice/recommend';
import { HAND_CLASSES, handClassOf, type HandClass } from '../../src/advice/hand-class';
import { chartSpotOf } from '../../src/advice/preflop';
import { decideRock, ROCK_STYLE } from '../../src/bots/rock';
import { startingRangeFor } from '../../src/bots/style';
import { TAG_STYLE } from '../../src/bots/tag';
import { RANK_CHARS, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
import { handReplayCode, playHand, runPlaytest } from '../../src/playtest/runner';

const TEST_TIMEOUT_MS = 120_000;

/** computeEquity, memoized on its input: returns exactly computeEquity's result. */
const memo = new Map<string, EquityResult>();
function equity(input: EquityInput): EquityResult {
  const k = JSON.stringify(input);
  let result = memo.get(k);
  if (result === undefined) {
    result = computeEquity(input);
    memo.set(k, result);
  }
  return result;
}

const owed = (view: PlayerView): number =>
  view.currentBet - (view.players.find((p) => p.seat === view.seat)?.streetContribution ?? 0);

/** Seat 1's views from the seed-65 random-move collection (A-6), with postflop views too. */
function seatOneViews(): PlayerView[] {
  const views: PlayerView[] = [];
  runPlaytest({ hands: 1000, seed: 65, size: 6 }, undefined, {
    makePolicy: (code, seat) => {
      const policy = randomMovePolicy(seatGenerator(code, seat));
      if (seat !== 1) return policy;
      return (view) => {
        views.push(view);
        return policy(view);
      };
    },
  });
  return views;
}

/** Seats 1..n, button 1, the hero holding a combo of `hc`, after `steps`. */
function scriptedView(n: number, hero: SeatNumber, hc: HandClass, steps: Action[]): PlayerView {
  const high = RANK_CHARS.indexOf(hc.charAt(0));
  const low = RANK_CHARS.indexOf(hc.charAt(1));
  const cards: Card[] = [high * 4 + 3, low * 4 + (hc.endsWith('s') ? 3 : 2)];
  const deck = Array.from({ length: 52 }, (_, i) => i).filter((x) => !cards.includes(x));
  // Seats are dealt clockwise from the seat after the button (seat 1).
  const index = hero === 1 ? n - 1 : hero - 2;
  deck.splice(index, 0, cards[0] as Card);
  deck.splice(index + n, 0, cards[1] as Card);
  let state = createHand({
    stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck,
  });
  for (const action of steps) {
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return playerView(state, hero);
}

describe('Rock decision', () => {
  it(
    'Rock folds or checks outside its range and plays the advice inside it',
    () => {
      const views = seatOneViews();
      const preflop = views.find((v) => v.street === 'preflop') as PlayerView;
      expect(() => decideRock(preflop, { style: TAG_STYLE })).toThrow(
        new RangeError('Style TAG has no starting range'),
      );
      expect(() => decideRock(preflop, { style: { ...TAG_STYLE, startingRange: [] } })).toThrow(
        /^Style TAG has no starting range for [A-Z]+ [a-z-]+$/,
      );

      let five: PlayerView | undefined;
      playHand(handReplayCode(65, 1), 5, 1, 1, {
        makePolicy: (code, seat) => {
          const policy = randomMovePolicy(seatGenerator(code, seat));
          return (view) => {
            five ??= view;
            return policy(view);
          };
        },
      });
      // 5 seats: the Rock's 6-max range at the mapped spot decides, the 6-max advice plays inside it.
      const fiveView = five as PlayerView;
      const fiveSpot = chartSpotOf(fiveView, '6-max');
      const fiveRange = startingRangeFor(ROCK_STYLE, fiveSpot.position, fiveSpot.situation);
      expect(fiveRange).toBeDefined();
      expect(decideRock(fiveView)).toEqual(
        fiveRange?.hands.has(handClassOf(fiveView.holeCards))
          ? recommend(fiveView).move
          : fiveView.legalActions.find((a) => a.type === (owed(fiveView) > 0 ? 'fold' : 'check')),
      );

      const postflop = views.filter((v) => v.street !== 'preflop');
      const facing = postflop.filter((v) => owed(v) > 0).slice(0, 3);
      expect(facing).toHaveLength(3);
      for (const view of facing) {
        expect(decideRock(view, { equity })).toEqual(recommend(view, { equity }).move);
      }
      const free = postflop.find((v) => owed(v) === 0) as PlayerView;
      expect(decideRock(free)).toEqual(free.legalActions.find((a) => a.type === 'check'));
      const noEquity = (): EquityResult => {
        throw new Error('equity must not be computed when checking is free');
      };
      expect(decideRock(free, { equity: noEquity })).toEqual(
        free.legalActions.find((a) => a.type === 'check'),
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'seated Rocks among seeded TAGs break no invariant',
    () => {
      const rockSeats: readonly SeatNumber[] = [2, 4];
      const preflop: Action['type'][] = [];
      const summary = runPlaytest({ hands: 1000, seed: 42, size: 6 }, undefined, {
        makePolicy: (code, seat) => {
          if (!rockSeats.includes(seat)) return seededTagPolicy(code);
          return (view) => {
            const action = decideRock(view);
            if (view.street === 'preflop') preflop.push(action.type);
            return action;
          };
        },
      });
      expect(summary.violations).toBe(0);
      expect(preflop).toContain('fold');
      expect(preflop).toContain('raise');
    },
    TEST_TIMEOUT_MS,
  );

  it('Rock maps its 6-max range at other sizes', () => {
    const utg = startingRangeFor(ROCK_STYLE, 'UTG', 'unopened');
    const inside = HAND_CLASSES.find((hc) => utg?.hands.has(hc));
    const outside = HAND_CLASSES.find((hc) => !utg?.hands.has(hc));
    expect(inside).toBeDefined();
    expect(outside).toBeDefined();

    // Nine-handed seat 5 is UTG+1 on the full-ring chart and UTG on the Rock's 6-max range.
    const foldUtg: Action[] = [{ seat: 4, type: 'fold' }];
    const playing = scriptedView(9, 5, inside as HandClass, foldUtg);
    expect(recommend(playing)).toMatchObject({ referenceSize: 'full-ring', position: 'UTG+1' });
    expect(chartSpotOf(playing, '6-max')).toEqual({ position: 'UTG', situation: 'unopened' });
    expect(decideRock(playing)).toEqual(recommend(playing).move);
    const folding = scriptedView(9, 5, outside as HandClass, foldUtg);
    expect(decideRock(folding)).toEqual({ seat: 5, type: 'fold' });

    // Heads-up: the button completes and the big blind, outside the Rock's BB limpers range, checks.
    const bbLimpers = startingRangeFor(ROCK_STYLE, 'BB', 'limpers');
    const junk = HAND_CLASSES.find((hc) => !bbLimpers?.hands.has(hc));
    expect(junk).toBeDefined();
    const bb = scriptedView(2, 2, junk as HandClass, [{ seat: 1, type: 'call', amount: 2 }]);
    expect(recommend(bb)).toMatchObject({ referenceSize: 'heads-up', position: 'BB' });
    expect(decideRock(bb)).toEqual({ seat: 2, type: 'check' });
  });
});
