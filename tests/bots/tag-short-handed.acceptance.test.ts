import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import { SIX_MAX_CHART } from '../../src/advice/preflop';
import { chartCell, parseChart, type Position } from '../../src/advice/preflop-chart';
import { recommend } from '../../src/advice/recommend';
import { decideTag, TAG_SHORT_HANDED_CHART, tagChartFor } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { parseCards } from '../../src/engine/cards';
import { applyAction, createHand, type Action } from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { composeChecks, handReplayCode, runPlaytest } from '../../src/playtest/runner';
import sixMax from '../../src/advice/charts/six-max.json' with { type: 'json' };

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

/** Two cards of class `hc`: clubs, with diamonds for the second card of a pair or offsuit hand. */
function cardsOf(hc: HandClass): [number, number] {
  const second = hc.length === 3 && hc.endsWith('s') ? 'c' : 'd';
  return parseCards(`${hc.charAt(0)}c ${hc.charAt(1)}${second}`) as [number, number];
}

/** The view of the next seat to act at `size` seats (button 1, stacks 160) after `folds` fold in turn,
 *  holding a hand of class `hc`. */
function viewAfterFolds(size: number, folds: number, hc: HandClass): PlayerView {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: Array.from({ length: 52 }, (_, i) => i),
  });
  for (let i = 0; i < folds; i++) {
    const result = applyAction(state, { seat: state.toAct as number, type: 'fold' });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  const view = playerView(state, state.toAct as number);
  return { ...view, holeCards: cardsOf(hc) };
}

/** A class whose 6-max `position` unopened cell is a pure non-fold and whose CO unopened cell is a pure fold. */
function cutoffFold(position: Position): HandClass {
  const hc = HAND_CLASSES.find((c) => {
    const cell = chartCell(SIX_MAX_CHART, position, 'unopened', c);
    const co = chartCell(SIX_MAX_CHART, 'CO', 'unopened', c);
    return (
      cell.action !== 'fold' &&
      cell.alternative === null &&
      co.action === 'fold' &&
      co.alternative === null
    );
  });
  expect(hc, `a ${position} open that the cutoff folds`).toBeDefined();
  return hc as HandClass;
}

/** Folds before the button (BTN spot) or before the small blind (SB spot) acts first unopened at `size` seats. */
function foldsBefore(position: 'BTN' | 'SB', size: number): number {
  const beforeButton = size === 3 ? 0 : size - 3;
  return position === 'BTN' ? beforeButton : beforeButton + 1;
}

describe('TAG at 3 and 4 seats (TASK-7.37)', () => {
  it('the short-handed TAG chart changes only BTN and SB unopened, at 3 and 4 seats', () => {
    expect(TAG_SHORT_HANDED_CHART.referenceSize).toBe('6-max');
    expect(TAG_SHORT_HANDED_CHART.spots.map((s) => [s.position, s.situation])).toEqual(
      SIX_MAX_CHART.spots.map((s) => [s.position, s.situation]),
    );
    for (const spot of SIX_MAX_CHART.spots) {
      const swapped =
        spot.situation === 'unopened' && (spot.position === 'BTN' || spot.position === 'SB');
      for (const hc of HAND_CLASSES) {
        const expected = chartCell(
          SIX_MAX_CHART,
          swapped ? 'CO' : spot.position,
          spot.situation,
          hc,
        );
        expect(chartCell(TAG_SHORT_HANDED_CHART, spot.position, spot.situation, hc)).toEqual(
          expected,
        );
      }
    }
    expect(SIX_MAX_CHART).toEqual(parseChart(sixMax));
    expect(tagChartFor(3)).toBe(TAG_SHORT_HANDED_CHART);
    expect(tagChartFor(4)).toBe(TAG_SHORT_HANDED_CHART);
    for (const n of [2, 5, 6, 7, 8, 9, 10]) expect(tagChartFor(n)).toBeUndefined();
  });

  it('TAG folds cutoff-range folds on the button and small blind at 3 and 4 seats only', () => {
    for (const position of ['BTN', 'SB'] as const) {
      const hc = cutoffFold(position);
      for (const size of [3, 4]) {
        const view = viewAfterFolds(size, foldsBefore(position, size), hc);
        const advice = recommend(view);
        expect(advice.basis === 'chart' && advice.situation, `${position} ${size}`).toBe(
          'unopened',
        );
        expect(['raise', 'call'], `${position} ${size} advice`).toContain(advice.move.type);
        expect(advice.move.type).toBe(chartCell(SIX_MAX_CHART, position, 'unopened', hc).action);
        expect(decideTag(view).type, `${position} ${hc} at ${size}`).toBe('fold');
      }
      for (const size of [5, 6]) {
        const view = viewAfterFolds(size, foldsBefore(position, size), hc);
        const move = recommend(view).move;
        expect(move.type).not.toBe('fold');
        expect(decideTag(view), `${position} ${hc} at ${size}`).toEqual(move);
      }
    }
  });

  it('an explicit chart wins and postflop play ignores the short-handed chart', () => {
    const hc = cutoffFold('BTN');
    const button = viewAfterFolds(3, 0, hc);
    expect(decideTag(button, { chart: SIX_MAX_CHART }).type).toBe('raise');

    const postflop: { code: ReturnType<typeof handReplayCode>; view: PlayerView }[] = [];
    let handsDone = 0;
    const capture = (_step: unknown, view?: PlayerView): [] => {
      if (view !== undefined && view.street !== 'preflop') {
        postflop.push({ code: handReplayCode(42, handsDone + 1), view });
      }
      return [];
    };
    const summary = runPlaytest({ hands: 50, seed: 42, size: 3 }, () => handsDone++, {
      onAction: composeChecks(checkStep, capture),
    });
    expect(summary.violations).toBe(0);
    expect(postflop.length).toBeGreaterThan(0);
    for (const { code, view } of postflop) {
      const seed = botDecisionSeed(code, view);
      const actual: Action = decideTag(view, { random: botRandom(seed) });
      expect(actual).toEqual(decideTag(view, { random: botRandom(seed), chart: SIX_MAX_CHART }));
    }
  });
});
