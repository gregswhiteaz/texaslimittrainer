import { describe, expect, it } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import { botDecisionIndex, botDecisionSeed } from '../../src/engine/bot-random';
import type { Action } from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { playerView, type SeatPolicy } from '../../src/engine/player-view';
import { seededTagPolicy } from '../../src/playtest/policy';
import { handReplayCode, playHand, toAction } from '../../src/playtest/runner';
import { handleAdviceRequest } from '../../src/table/advice-service';
import {
  applyBotDecision,
  applyUserAction,
  botTurn,
  dealHand,
  nextStep,
  seatSession,
  USER_SEAT,
  userActions,
} from '../../src/table/session';

const TEST_TIMEOUT_MS = 120_000;

/** The user's rule in both paths: check when free, else call. */
function checkOrCall(options: readonly Action[]): Action {
  return (options.find((a) => a.type === 'check') ??
    options.find((a) => a.type === 'call')) as Action;
}
const replayUser: SeatPolicy = (view) => checkOrCall(view.legalActions);

describe('playtest and app seed parity', () => {
  it(
    'the playtest TAG gets the same per-decision seed as the worker',
    () => {
      let differs = 0;
      for (let k = 1; k <= 30; k++) {
        const code = handReplayCode(7, k);
        let table = dealHand(seatSession(), code);
        const button = table.button;
        const appSeeds = new Map<string, number>();
        let id = 0;
        while (nextStep(table) !== 'done') {
          if (nextStep(table) === 'user') {
            table = applyUserAction(table, checkOrCall(userActions(table)));
            continue;
          }
          const turn = botTurn(table);
          const response = handleAdviceRequest({
            id: ++id,
            kind: 'bot',
            view: turn.view,
            style: turn.style,
            seed: turn.seed,
          });
          if (!response.ok) throw new Error(response.error.message);
          const action = response.value as Action;
          if (JSON.stringify(action) !== JSON.stringify(recommend(turn.view).move)) differs++;
          appSeeds.set(`${turn.view.seat}/${botDecisionIndex(turn.view)}`, turn.seed);
          table = applyBotDecision(table, turn, action);
        }
        const appActions = (table.hand?.actions ?? [])
          .filter((a) => a.type !== 'small-blind' && a.type !== 'big-blind')
          .map(toAction);

        const playtestSeeds = new Map<string, number>();
        const played = playHand(code, 6, button, 1, {
          makePolicy: (c, seat) => (seat === USER_SEAT ? replayUser : seededTagPolicy(c)),
          onAction: (step) => {
            if (step.action.seat !== USER_SEAT) {
              const view = playerView(step.before, step.action.seat);
              playtestSeeds.set(
                `${view.seat}/${botDecisionIndex(view)}`,
                botDecisionSeed(code, view),
              );
            }
            return checkStep(step);
          },
        });
        expect(played.violations, `hand ${k}`).toBe(0);
        expect(played.record.actions, `hand ${k}`).toEqual(appActions);
        expect(appSeeds.size, `hand ${k}`).toBeGreaterThan(0);
        expect(playtestSeeds, `hand ${k}`).toEqual(appSeeds);

        expect(playHand(code, 6, 6, k).record.actions).toEqual(
          playHand(code, 6, 6, k, { makePolicy: (c) => seededTagPolicy(c) }).record.actions,
        );
      }
      expect(differs).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );
});
