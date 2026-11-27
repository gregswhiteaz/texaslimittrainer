import { describe, expect, it } from 'vitest';
import { SIX_MAX_CHART } from '../../src/advice/preflop';
import type { PreflopChart } from '../../src/advice/preflop-chart';
import { recommend } from '../../src/advice/recommend';
import { SPOT_TYPES, type SpotType } from '../../src/bots/style';
import { BOT_EQUITY, TAG_SHORT_HANDED_CHART, TAG_STYLE } from '../../src/bots/tag';
import type { HandState } from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { playerView } from '../../src/engine/player-view';
import { main } from '../../src/playtest/cli';
import { composeChecks, runPlaytest, type ActionHook } from '../../src/playtest/runner';
import type { MixedCounts } from '../../src/playtest/style-check';

const HANDS = 300;

interface Decision {
  readonly before: HandState;
  readonly seat: number;
  readonly type: string;
}

/** Every preflop decision of a 3-seat all-TAG cash playtest (seed 42, HANDS hands). */
function preflopDecisions(): Decision[] {
  const decisions: Decision[] = [];
  const capture: ActionHook = (step) => {
    if (step.before.street === 'preflop') {
      decisions.push({ before: step.before, seat: step.action.seat, type: step.action.type });
    }
    return [];
  };
  const summary = runPlaytest({ hands: HANDS, seed: 42, size: 3, game: 'cash' }, undefined, {
    onAction: composeChecks(checkStep, capture),
  });
  expect(summary.violations).toBe(0);
  return decisions;
}

/** TAG's mixed-spot tally with `chart`. When `strict`, every decision in a mixed cell must be the move or the
 *  alternative; otherwise other actions are skipped, as the style check does. */
function tally(
  decisions: readonly Decision[],
  chart: PreflopChart,
  strict: boolean,
): Map<SpotType, MixedCounts> {
  const counts = new Map<SpotType, MixedCounts>(
    SPOT_TYPES.filter((spot) => TAG_STYLE.mixedSpots.has(spot)).map((spot) => [
      spot,
      { recommended: 0, alternative: 0 },
    ]),
  );
  for (const { before, seat, type } of decisions) {
    const advice = recommend(playerView(before, seat, []), { equity: BOT_EQUITY, chart });
    if (advice.basis !== 'chart' || advice.alternative === null) continue;
    const spot = `preflop-${advice.situation}` as SpotType;
    const c = counts.get(spot);
    if (c === undefined) continue;
    if (type === advice.move.type) {
      counts.set(spot, { ...c, recommended: c.recommended + 1 });
    } else if (type === advice.alternative) {
      counts.set(spot, { ...c, alternative: c.alternative + 1 });
    } else if (strict) {
      expect.fail(
        `${spot} seat ${seat}: ${type} is neither ${advice.move.type} nor ${advice.alternative}`,
      );
    }
  }
  return counts;
}

describe('style check at 3 seats', () => {
  it('style check tallies TAG mixed spots with the short-handed chart at 3 seats', () => {
    let out = '';
    main(['--hands', String(HANDS), '--seed', '42', '--size', '3', '--check-styles'], {
      out: (text) => (out += text),
      err: () => undefined,
    });
    const expected = tally(preflopDecisions(), TAG_SHORT_HANDED_CHART, true);
    const lines = out.split('\n').filter((line) => line.startsWith('Mixed spot: TAG '));
    expect(lines).toEqual(
      [...expected].map(
        ([spot, c]) =>
          `Mixed spot: TAG ${spot}, recommended ${c.recommended}, alternative ${c.alternative}`,
      ),
    );
    expect(lines.length).toBeGreaterThan(0);
  });

  it('the 6-max chart would tally the 3-seat mixed spots differently', () => {
    const decisions = preflopDecisions();
    expect(tally(decisions, SIX_MAX_CHART, false)).not.toEqual(
      tally(decisions, TAG_SHORT_HANDED_CHART, true),
    );
  });
});
