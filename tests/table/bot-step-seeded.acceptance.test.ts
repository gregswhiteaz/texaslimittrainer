import { describe, expect, it } from 'vitest';
import { decideTag } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action, HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { handleAdviceRequest } from '../../src/table/advice-service';
import {
  applyUserAction,
  botTurn,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';

function amountOf(action: Action): number {
  return 'amount' in action ? action.amount : 0;
}

function checkOrCall(table: TableState): Action {
  const actions = userActions(table);
  const pick = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
  if (pick === undefined) throw new Error('No check or call offered');
  return pick;
}

describe('TASK-6.22 headless bot step uses the seeded TAG decision', () => {
  it('the default bot step takes the seeded TAG decision in a mixed spot', () => {
    const code = replayCodeFromWords([26, 1, 2, 3]);
    const table = dealHand(seatSession(), code);
    expect(nextStep(table)).toBe('bot');
    const before = table.hand as HandState;
    expect(before.toAct).toBe(3);

    const view = playerView(before, 3);
    const seeded = decideTag(view, { random: botRandom(botDecisionSeed(code, view)) });
    const unseeded = decideTag(view);
    expect(seeded.type).toBe('raise');
    expect(unseeded.type).toBe('fold');

    const after = stepBot(table).hand as HandState;
    expect(after.actions).toHaveLength(before.actions.length + 1);
    const record = after.actions[after.actions.length - 1];
    expect(record?.seat).toBe(3);
    expect(record?.type).toBe(seeded.type);
    expect(record?.amount).toBe(amountOf(seeded));
  });

  it("every default bot step matches the app worker's decision", () => {
    for (const words of [
      [26, 1, 2, 3],
      [46, 1, 2, 3],
    ]) {
      const code = replayCodeFromWords(words);
      let table = seatSession();
      let botSteps = 0;
      let id = 0;
      for (let guard = 0; guard < 500 && nextStep(table) !== 'done'; guard++) {
        const step = nextStep(table);
        if (step === 'deal') {
          if (table.hand !== null) break;
          table = dealHand(table, code);
        } else if (step === 'bot') {
          const turn = botTurn(table);
          const response = handleAdviceRequest({
            id: ++id,
            kind: 'bot',
            view: turn.view,
            style: 'TAG',
            seed: turn.seed,
          });
          if (!response.ok) throw new Error(response.error.message);
          const expected = response.value as Action;
          const after = stepBot(table).hand as HandState;
          const record = after.actions[after.actions.length - 1];
          expect(after.actions).toHaveLength(turn.hand.actions.length + 1);
          expect(record?.seat).toBe(turn.view.seat);
          expect(record?.type).toBe(expected.type);
          expect(record?.amount).toBe(amountOf(expected));
          table = { ...table, hand: after };
          botSteps++;
        } else if (step === 'user') {
          table = applyUserAction(table, checkOrCall(table));
        } else {
          break;
        }
      }
      expect(botSteps).toBeGreaterThan(0);
    }
  });
});
