import { describe, expect, it } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import { BOT_ADVICE, BOT_EQUITY, decideTag } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import type { Action } from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import type { PlayerView } from '../../src/engine/player-view';
import { composeChecks, handReplayCode, runPlaytest } from '../../src/playtest/runner';

describe('TAG river raises at 3 seats (TASK-7.47)', () => {
  it('TAG raises the river exactly when the advice engine does, in a 3-seat sample with river raises', () => {
    const river: { code: ReturnType<typeof handReplayCode>; view: PlayerView }[] = [];
    let handsDone = 0;
    const capture = (_step: unknown, view?: PlayerView): [] => {
      if (view?.street === 'river') river.push({ code: handReplayCode(3, handsDone + 1), view });
      return [];
    };
    // Seed 3 at 3 seats has TAG river raises within 200 hands (the locked 50-hand seed-42 sample has none).
    const summary = runPlaytest({ hands: 200, seed: 3, size: 3 }, () => handsDone++, {
      onAction: composeChecks(checkStep, capture),
    });
    expect(summary.violations).toBe(0);
    let riverRaises = 0;
    for (const { code, view } of river) {
      const actual: Action = decideTag(view, { random: botRandom(botDecisionSeed(code, view)) });
      const engine = recommend(view, { ...BOT_ADVICE, equity: BOT_EQUITY }).move;
      expect(actual, `river seat ${view.seat}`).toEqual(engine);
      if (engine.type === 'raise') {
        expect(actual.type, `river raise seat ${view.seat}`).toBe('raise');
        riverRaises++;
      }
    }
    expect(river.length).toBeGreaterThan(0);
    expect(riverRaises).toBeGreaterThan(0);
  });
});
